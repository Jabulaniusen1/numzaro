import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { pvadealsClient } from "@/lib/pvadeals/client";
import { getLiveFxRate } from "@/lib/currency/rates";

async function getMarkupMultiplier(): Promise<number> {
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "phone_numbers_markup_percentage")
      .single();
    const pct = data ? parseFloat(data.value) : 400.0;
    return 1 + pct / 100;
  } catch {
    return 5.0;
  }
}

async function usdToNgn(usdAmount: number): Promise<number> {
  let rate = 1500;
  try {
    rate = await getLiveFxRate("USD", "NGN");
  } catch {}
  return usdAmount * rate;
}

function formatNaira(ngnAmount: number) {
  return `₦${ngnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalizePhone(value: string): string {
  if (!value) return "";
  return value.startsWith("+") ? value : `+${value}`;
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const areaCode =
      typeof body?.areaCode === "string" && /^\d{3}$/.test(body.areaCode)
        ? body.areaCode
        : undefined;

    const whatsappService = await pvadealsClient.getWhatsAppService();
    if (!whatsappService) {
      return NextResponse.json(
        { error: "WhatsApp US numbers are currently unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const rawPriceUsd = whatsappService.STRprice;
    if (!Number.isFinite(rawPriceUsd) || rawPriceUsd <= 0) {
      return NextResponse.json({ error: "Invalid pricing from provider." }, { status: 502 });
    }

    const markupMultiplier = await getMarkupMultiplier();
    const userChargedUsd = parseFloat((rawPriceUsd * markupMultiplier).toFixed(2));
    let fxRate = 1500;
    try { fxRate = await (await import("@/lib/currency/rates")).getLiveFxRate("USD", "NGN"); } catch {}
    const userCharged = parseFloat((userChargedUsd * fxRate).toFixed(2));

    console.log("[whatsapp/purchase] price breakdown:", {
      pvadealsSTRprice: rawPriceUsd,
      markupMultiplier,
      userChargedUsd,
      fxRateUsed: fxRate,
      userChargedNgn: userCharged,
    });

    const { data: userData } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    const userBalance = parseFloat(userData?.wallet_balance || "0");
    if (userBalance < userCharged) {
      return NextResponse.json(
        {
          error: `Insufficient balance. Required: ${formatNaira(userCharged)}, Available: ${formatNaira(userBalance)}`,
        },
        { status: 402 }
      );
    }

    let purchased;
    try {
      purchased = await pvadealsClient.purchaseNumber(whatsappService._id, areaCode);
    } catch (err: any) {
      console.error("[whatsapp/purchase] PVADeals purchase failed:", err);
      return NextResponse.json(
        { error: "Failed to acquire a WhatsApp number. Please try again shortly." },
        { status: 502 }
      );
    }

    const phoneNumber = normalizePhone(purchased.number);
    if (!phoneNumber || !purchased._id) {
      try {
        if (purchased._id && purchased.allowFlag) await pvadealsClient.flagNumber(purchased._id);
      } catch {}
      return NextResponse.json({ error: "Provider returned invalid number data." }, { status: 502 });
    }

    const expiresAt = purchased.endTime
      ? new Date(purchased.endTime).toISOString()
      : new Date(Date.now() + 20 * 60 * 1000).toISOString();

    const { data: virtualNumber, error: dbError } = await supabase
      .from("virtual_numbers")
      .insert({
        user_id: user.id,
        phone_number: phoneNumber,
        country_code: "US",
        country_name: "United States",
        textverified_id: purchased._id,
        status: "active",
        capabilities: ["sms"],
        monthly_cost: userCharged,
        number_type: "activation",
        provider: "pvadeals",
        product: "WhatsApp",
        product_code: whatsappService._id,
        product_type: "activation",
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[whatsapp/purchase] DB error:", dbError);
      try {
        if (purchased.allowFlag) await pvadealsClient.flagNumber(purchased._id);
      } catch {}
      return NextResponse.json({ error: `Database error: ${dbError.message}` }, { status: 500 });
    }

    const actualCostNgn = parseFloat((await usdToNgn(rawPriceUsd)).toFixed(2));

    await supabase
      .from("users")
      .update({ wallet_balance: userBalance - userCharged })
      .eq("id", user.id);

    await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      type: "order_payment",
      amount: -userCharged,
      balance_before: userBalance,
      balance_after: userBalance - userCharged,
      description: `WhatsApp US Number: ${phoneNumber}`,
    });

    await supabase.from("number_purchases").insert({
      user_id: user.id,
      virtual_number_id: virtualNumber.id,
      amount: userCharged,
      actual_cost: rawPriceUsd,
      profit: parseFloat((userCharged - actualCostNgn).toFixed(2)),
      currency: "NGN",
      status: "completed",
    });

    await createServiceRoleClient().from("notifications").insert({
      user_id: user.id,
      type: "transaction",
      title: "WhatsApp Number Purchased",
      message: `${phoneNumber} — WhatsApp (US)`,
      data: {
        type: "number_purchased",
        number_id: virtualNumber.id,
        provider: "pvadeals",
        mode: "activation",
      },
    });

    return NextResponse.json({ success: true, number: virtualNumber });
  } catch (error: any) {
    console.error("[whatsapp/purchase] unhandled error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
