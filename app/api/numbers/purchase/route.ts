import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { smsPoolClient } from "@/lib/smspool/client";

async function getMarkupMultiplier() {
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "phone_numbers_markup_percentage")
      .single();
    const pct = data ? parseFloat(data.value) : 400.0;
    return 1 + pct / 100;
  } catch (e) {
    console.error("[purchase] markup fetch failed:", e);
    return 5.0;
  }
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizePhone(value: unknown, countryCode?: unknown) {
  const raw = typeof value === "string" || typeof value === "number" ? String(value) : "";
  if (!raw) return "";
  if (raw.startsWith("+")) return raw;

  const digits = raw.replace(/[^\d]/g, "");
  const cc = (typeof countryCode === "string" || typeof countryCode === "number" ? String(countryCode) : "")
    .replace(/[^\d]/g, "");

  if (!digits) return "";
  if (cc && !digits.startsWith(cc)) return `+${cc}${digits}`;
  return `+${digits}`;
}

function parseExpiryFromUnix(unixSeconds?: number) {
  if (!unixSeconds || Number.isNaN(unixSeconds)) {
    return new Date(Date.now() + 20 * 60 * 1000).toISOString();
  }
  return new Date(unixSeconds * 1000).toISOString();
}

function formatNairaFromUsd(usdAmount: number, usdToNgnRate: number = 1500) {
  const ngnAmount = usdAmount * usdToNgnRate;
  return `₦${ngnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function extractSmsPoolError(result: any): string {
  const rawMessage = typeof result?.message === "string" ? result.message : "";
  if (rawMessage) return stripHtml(rawMessage);

  if (Array.isArray(result?.errors) && result.errors[0]?.message) {
    return String(result.errors[0].message);
  }

  if (result?.pools && typeof result.pools === "object") {
    for (const entry of Object.values(result.pools) as Array<any>) {
      if (typeof entry?.message === "string" && entry.message) {
        return stripHtml(entry.message);
      }
      if (Array.isArray(entry?.errors) && entry.errors[0]?.message) {
        return String(entry.errors[0].message);
      }
    }
  }

  return "Failed to purchase number from SMSPool.";
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const serviceCode = String(body?.serviceCode || "").trim();
    const serviceName = String(body?.serviceName || "").trim();
    const countryId = String(body?.country || "").trim();
    const countryName = String(body?.countryName || "").trim();
    const countryShortCode = String(body?.countryShortCode || "").trim();
    const maxPrice = typeof body?.maxPrice === "number" ? body.maxPrice : undefined;

    if (!serviceCode || !countryId) {
      return NextResponse.json({ error: "serviceCode and country are required" }, { status: 400 });
    }

    const markupMultiplier = await getMarkupMultiplier();

    const pricing = await smsPoolClient.getSMSServicePrice(countryId, serviceCode);
    const baseRawPrice = parseFloat(String(pricing.high_price ?? pricing.price));
    if (Number.isNaN(baseRawPrice)) {
      return NextResponse.json({ error: "Invalid price returned from provider" }, { status: 400 });
    }
    let rawPrice = baseRawPrice;
    let userCharged = parseFloat((rawPrice * markupMultiplier).toFixed(2));

    const { data: userData } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    const userBalance = parseFloat(userData?.wallet_balance || "0");
    if (userBalance < userCharged) {
      return NextResponse.json(
        {
          error: `Insufficient balance. Required: ${formatNairaFromUsd(userCharged)}, Available: ${formatNairaFromUsd(userBalance)}`,
        },
        { status: 402 }
      );
    }

    const purchase = await smsPoolClient.purchaseSMS(countryId, serviceCode, {
      pricingOption: 1, // Always highest success rate
      quantity: 1,
      activationType: "SMS",
      maxPrice,
    });

    if (!purchase.success) {
      return NextResponse.json({ error: extractSmsPoolError(purchase) }, { status: 400 });
    }

    const activationId = purchase.order_id;
    if (!activationId) {
      return NextResponse.json({ error: "Purchase returned invalid order id" }, { status: 500 });
    }

    const phoneNumber = normalizePhone(purchase.number ?? purchase.phonenumber, purchase.cc);
    if (!phoneNumber) {
      try {
        await smsPoolClient.cancelSMS(activationId);
      } catch {}
      return NextResponse.json({ error: "Purchase returned invalid phone number" }, { status: 500 });
    }

    const purchaseCost = parseFloat(String(purchase.cost ?? rawPrice));
    if (!Number.isNaN(purchaseCost) && purchaseCost > 0) {
      rawPrice = purchaseCost;
      userCharged = parseFloat((rawPrice * markupMultiplier).toFixed(2));
    }

    if (userBalance < userCharged) {
      try {
        await smsPoolClient.cancelSMS(activationId);
      } catch (cancelError) {
        console.error("[purchase] failed to cancel over-budget SMSPool order:", cancelError);
      }
      return NextResponse.json(
        {
          error: `Insufficient balance after purchase. Required: ${formatNairaFromUsd(userCharged)}, Available: ${formatNairaFromUsd(userBalance)}`,
        },
        { status: 402 }
      );
    }

    let resolvedCountryCode = countryShortCode || "";
    let displayCountryName = countryName || "";
    if (!resolvedCountryCode || !displayCountryName) {
      try {
        const countries = await smsPoolClient.getCountries();
        const matched = countries.find((c) => String(c.ID) === countryId);
        if (matched) {
          resolvedCountryCode = resolvedCountryCode || matched.short_name || "";
          displayCountryName = displayCountryName || matched.name;
        }
      } catch (countryLookupError) {
        console.error("[purchase] failed to resolve country metadata:", countryLookupError);
      }
    }
    if (!resolvedCountryCode) resolvedCountryCode = "US";
    if (!displayCountryName) displayCountryName = countryName || `Country ${countryId}`;

    const displayName = serviceName || serviceCode;
    const expiresAt = parseExpiryFromUnix(purchase.expiration);

    const { data: virtualNumber, error: numberError } = await supabase
      .from("virtual_numbers")
      .insert({
        user_id: user.id,
        phone_number: phoneNumber,
        country_code: resolvedCountryCode,
        country_name: displayCountryName,
        twilio_sid: activationId,
        textverified_id: activationId,
        status: "active",
        capabilities: ["sms"],
        twilio_monthly_cost: rawPrice,
        monthly_cost: userCharged,
        number_type: "activation",
        provider: "smspool",
        product: displayName,
        product_code: serviceCode,
        product_type: "activation",
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (numberError) {
      console.error("DB error creating virtual_number:", numberError);
      try {
        await smsPoolClient.cancelSMS(activationId);
      } catch (cancelError) {
        console.error("[purchase] failed to cancel SMSPool order after DB error:", cancelError);
      }
      return NextResponse.json({ error: `Database error: ${numberError.message}` }, { status: 500 });
    }

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
      description: `SMSPool ${displayName} (${displayCountryName}): ${phoneNumber}`,
    });

    await supabase.from("number_purchases").insert({
      user_id: user.id,
      virtual_number_id: virtualNumber.id,
      amount: userCharged,
      actual_cost: rawPrice,
      profit: parseFloat((userCharged - rawPrice).toFixed(2)),
      currency: "USD",
      status: "completed",
    });

    const supabaseAdmin = createServiceRoleClient();
    await supabaseAdmin.from("notifications").insert({
      user_id: user.id,
      type: "transaction",
      title: "Number Purchased",
      message: `${phoneNumber} — ${displayName} via SMSPool`,
      data: { type: "number_purchased", number_id: virtualNumber.id, provider: "smspool", mode: "activation" },
    });

    return NextResponse.json({ success: true, number: virtualNumber });
  } catch (error: any) {
    console.error("Purchase route error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
