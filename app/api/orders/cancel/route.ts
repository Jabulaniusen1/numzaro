import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { cancelOrder as cancelProviderOrder } from "@/lib/api/socialboost";

const CANCELLABLE_STATUSES = new Set(["pending", "in progress"]);

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, user_id, status, charge, exosupplier_order_id, services(name)")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!CANCELLABLE_STATUSES.has(String(order.status || "").toLowerCase())) {
      return NextResponse.json(
        { error: `Order cannot be cancelled in its current status: ${order.status}` },
        { status: 400 }
      );
    }

    // Request cancellation from provider
    if (order.exosupplier_order_id) {
      try {
        await cancelProviderOrder([Number(order.exosupplier_order_id)]);
      } catch (providerError: any) {
        console.error("Provider cancel error:", providerError);
        // Continue with local cancellation even if provider fails
      }
    }

    await supabase
      .from("orders")
      .update({ status: "Cancelled" })
      .eq("id", orderId);

    // Refund wallet
    const refundAmount = parseFloat(String(order.charge || "0"));
    if (refundAmount > 0) {
      const { data: userProfile } = await supabase
        .from("users")
        .select("wallet_balance")
        .eq("id", user.id)
        .single();

      const balanceBefore = parseFloat(userProfile?.wallet_balance || "0");
      const balanceAfter = balanceBefore + refundAmount;

      await supabase
        .from("users")
        .update({ wallet_balance: parseFloat(balanceAfter.toFixed(2)) })
        .eq("id", user.id);

      await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        type: "refund",
        amount: refundAmount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: `Refund for cancelled order: ${(order.services as any)?.name || "Service"}`,
      });

      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "transaction",
        title: "Order Cancelled & Refunded",
        message: `Your order has been cancelled and ₦${refundAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been refunded to your wallet.`,
        data: { type: "order_refund", order_id: orderId, amount: refundAmount },
      });
    }

    return NextResponse.json({ success: true, refunded: refundAmount });
  } catch (error: any) {
    console.error("Order cancel error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
