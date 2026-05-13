import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { smsPoolClient } from "@/lib/smspool/client";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getLiveFxRate } from "@/lib/currency/rates";
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

async function usdToNgn(usdAmount: number): Promise<number> {
  let rate = 1500;
  try {
    rate = await getLiveFxRate("USD", "NGN");
  } catch {
    // fall back to static rate
  }
  return usdAmount * rate;
}

function formatNaira(ngnAmount: number) {
  return `₦${ngnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
    const providerPrice = Number(body?.providerPrice); // SMSPool USD price

    if (!packageCode || !packageName || !Number.isFinite(providerPrice) || providerPrice <= 0) {
      return NextResponse.json({ error: "packageCode, packageName, and providerPrice are required" }, { status: 400 });
    }

    const markupMultiplier = await getMarkupMultiplier();
    const providerCostUsd = providerPrice;
    const chargedUsd = parseFloat((providerCostUsd * markupMultiplier).toFixed(4));
    const chargedNgn = parseFloat((await usdToNgn(chargedUsd)).toFixed(2));

    // Check wallet balance
    const { data: userData } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    const userBalance = parseFloat(userData?.wallet_balance || "0");
    if (userBalance < chargedNgn) {
      return NextResponse.json(
        { error: `Insufficient balance. Required: ${formatNaira(chargedNgn)}, Available: ${formatNaira(userBalance)}` },
        { status: 402 }
      );
    }

    const internalTransactionId = `esim-${randomUUID()}`;

    // Place order with SMSPool
    const purchase = await smsPoolClient.purchaseEsim(packageCode);
    if (!purchase.success || !purchase.transactionId) {
      throw new Error(purchase.message || "SMSPool eSIM purchase failed");
    }
    const providerTransactionId = purchase.transactionId;

    // Fetch profile for activation details
    const profile = await smsPoolClient.getEsimProfile(providerTransactionId).catch(() => null);

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
        order_no: null,
        esim_tran_no: providerTransactionId,
        iccid: null,
        qr_code_url: null,
        ac: profile?.ac || null,
        smdp_address: profile?.smdp || null,
        transaction_id: internalTransactionId,
        status: Number(profile?.activated || 0) === 1 ? "in_use" : "got_resource",
        provider_cost: providerCostUsd,
        charged_amount: chargedNgn,
        esim_status: profile ? String(profile.activated ?? "") : null,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[esim/order] DB insert error:", dbError);
      // Attempt provider cleanup
      try {
        await smsPoolClient.deleteEsim(providerTransactionId);
      } catch (cancelErr) {
        console.error("[esim/order] cancel after DB error failed:", cancelErr);
      }
      return NextResponse.json({ error: `Database error: ${dbError.message}` }, { status: 500 });
    }

    // Deduct wallet
    await supabase
      .from("users")
      .update({ wallet_balance: userBalance - chargedNgn })
      .eq("id", user.id);

    await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      type: "order_payment",
      amount: -chargedNgn,
      balance_before: userBalance,
      balance_after: userBalance - chargedNgn,
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

    return NextResponse.json({
      success: true,
      order: {
        ...esimOrder,
        charged_currency: "NGN",
        charged_amount_usd: chargedUsd,
      },
    });
  } catch (error: any) {
    console.error("[esim/order] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
