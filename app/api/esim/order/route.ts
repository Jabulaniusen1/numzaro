import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { esimAccessClient, ESimAccessClient } from "@/lib/esimaccess/client";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { randomUUID } from "crypto";

async function getMarkupMultiplier() {
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "esim_markup_percentage")
      .single();
    const pct = data ? parseFloat(data.value) : 30.0;
    return 1 + pct / 100;
  } catch {
    return 1.3;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const packageCode = String(body?.packageCode || "").trim();
    const packageName = String(body?.packageName || "").trim();
    const location = String(body?.location || "").trim();
    const duration = String(body?.duration || "").trim();
    const dataVolume = String(body?.dataVolume || "").trim();
    const providerPrice = Number(body?.providerPrice); // raw provider units (10000 = $1)

    if (!packageCode || !packageName || !providerPrice) {
      return NextResponse.json({ error: "packageCode, packageName, and providerPrice are required" }, { status: 400 });
    }

    const markupMultiplier = await getMarkupMultiplier();
    const providerCostUsd = ESimAccessClient.priceToUsd(providerPrice);
    const chargedUsd = parseFloat((providerCostUsd * markupMultiplier).toFixed(4));

    // Check wallet balance
    const { data: userData } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    const userBalance = parseFloat(userData?.wallet_balance || "0");
    if (userBalance < chargedUsd) {
      return NextResponse.json(
        { error: `Insufficient balance. Required: $${chargedUsd.toFixed(2)}, Available: $${userBalance.toFixed(2)}` },
        { status: 402 }
      );
    }

    const transactionId = `esim-${randomUUID()}`;

    // Place order with eSIM Access
    const orderResult = await esimAccessClient.orderEsim({
      packageCode,
      count: 1,
      price: providerPrice,
      transactionId,
    });

    const esimItem = orderResult.esimList?.[0];
    if (!esimItem) {
      throw new Error("Order placed but no eSIM returned");
    }

    const supabaseAdmin = createServiceRoleClient();

    // Save to esim_orders
    const { data: esimOrder, error: dbError } = await supabaseAdmin
      .from("esim_orders")
      .insert({
        user_id: user.id,
        package_code: packageCode,
        package_name: packageName,
        location,
        duration,
        data_volume: dataVolume,
        order_no: orderResult.orderNo,
        esim_tran_no: esimItem.esimTranNo,
        iccid: esimItem.iccid || null,
        qr_code_url: esimItem.qrCodeUrl || null,
        ac: esimItem.ac || null,
        smdp_address: esimItem.smdpAddress || null,
        transaction_id: transactionId,
        status: "got_resource",
        provider_cost: providerCostUsd,
        charged_amount: chargedUsd,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[esim/order] DB insert error:", dbError);
      // Attempt cancel to refund to provider balance
      try {
        await esimAccessClient.cancelEsim({ esimTranNo: esimItem.esimTranNo });
      } catch (cancelErr) {
        console.error("[esim/order] cancel after DB error failed:", cancelErr);
      }
      return NextResponse.json({ error: `Database error: ${dbError.message}` }, { status: 500 });
    }

    // Deduct wallet
    await supabase
      .from("users")
      .update({ wallet_balance: userBalance - chargedUsd })
      .eq("id", user.id);

    await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      type: "order_payment",
      amount: -chargedUsd,
      balance_before: userBalance,
      balance_after: userBalance - chargedUsd,
      description: `eSIM: ${packageName} (${location})`,
    });

    // Notification
    await supabaseAdmin.from("notifications").insert({
      user_id: user.id,
      type: "transaction",
      title: "eSIM Purchased",
      message: `${packageName} — ${location}`,
      data: { type: "esim_purchased", esim_order_id: esimOrder.id },
    });

    return NextResponse.json({ success: true, order: esimOrder });
  } catch (error: any) {
    console.error("[esim/order] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
