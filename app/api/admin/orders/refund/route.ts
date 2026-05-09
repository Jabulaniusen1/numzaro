import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    if (!adminEmails.includes(user.email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { orderId, source } = await request.json();

    if (!orderId || !source) {
      return NextResponse.json({ error: "orderId and source are required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    let userId: string;
    let refundAmountUSD: number;
    let description: string;

    if (source === "number") {
      const { data: purchase, error } = await supabase
        .from("number_purchases")
        .select("id, user_id, amount, status")
        .eq("id", orderId)
        .single();

      if (error || !purchase) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      if (purchase.status === "refunded") {
        return NextResponse.json({ error: "Order has already been refunded" }, { status: 400 });
      }

      userId = purchase.user_id;
      refundAmountUSD = parseFloat(purchase.amount);
      description = "Admin refund for number order";

      await supabase
        .from("number_purchases")
        .update({ status: "refunded" })
        .eq("id", orderId);

    } else if (source === "social_boost") {
      const { data: order, error } = await supabase
        .from("orders")
        .select("id, user_id, customer_charge, charge, status")
        .eq("id", orderId)
        .single();

      if (error || !order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      if ((order.status || "").toLowerCase() === "refunded") {
        return NextResponse.json({ error: "Order has already been refunded" }, { status: 400 });
      }

      userId = order.user_id;
      refundAmountUSD = parseFloat(order.customer_charge ?? order.charge ?? "0");
      description = "Admin refund for social boost order";

      await supabase
        .from("orders")
        .update({ status: "Refunded" })
        .eq("id", orderId);

    } else if (source === "esim") {
      const { data: order, error } = await supabase
        .from("esim_orders")
        .select("id, user_id, charged_amount, status")
        .eq("id", orderId)
        .single();

      if (error || !order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      if ((order.status || "").toLowerCase() === "refunded") {
        return NextResponse.json({ error: "Order has already been refunded" }, { status: 400 });
      }

      userId = order.user_id;
      refundAmountUSD = parseFloat(order.charged_amount ?? "0");
      description = "Admin refund for eSIM order";

      await supabase
        .from("esim_orders")
        .update({ status: "refunded" })
        .eq("id", orderId);

    } else {
      return NextResponse.json({ error: "Invalid source type" }, { status: 400 });
    }

    if (!refundAmountUSD || refundAmountUSD <= 0) {
      return NextResponse.json({ error: "Order has no refundable amount" }, { status: 400 });
    }

    // Credit wallet
    const { data: userProfile } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", userId)
      .single();

    const balanceBefore = parseFloat(userProfile?.wallet_balance || "0");
    const balanceAfter = balanceBefore + refundAmountUSD;

    await supabase
      .from("users")
      .update({ wallet_balance: balanceAfter })
      .eq("id", userId);

    await supabase.from("wallet_transactions").insert({
      user_id: userId,
      type: "refund",
      amount: refundAmountUSD,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      description,
    });

    await supabase.from("notifications").insert({
      user_id: userId,
      type: "transaction",
      title: "Order Refunded",
      message: `Your order has been refunded. $${refundAmountUSD.toFixed(2)} has been added to your wallet.`,
      data: { type: "admin_refund", order_id: orderId, source, amount: refundAmountUSD },
    });

    return NextResponse.json({ success: true, refunded: refundAmountUSD, balanceAfter });
  } catch (error: any) {
    console.error("Error in POST /api/admin/orders/refund:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
