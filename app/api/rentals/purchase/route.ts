import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { textverifiedClient } from "@/lib/textverified/client";
import { getLiveFxRate } from "@/lib/currency/rates";

function providerError(
  provider: "textverified" | "system",
  error: string,
  status: number = 400
) {
  return NextResponse.json(
    { error, provider, errorSource: provider },
    { status }
  );
}

const RENTAL_DURATIONS = new Set([
  "oneDay",
  "threeDay",
  "sevenDay",
  "fourteenDay",
  "thirtyDay",
  "ninetyDay",
  "oneYear",
]);

const DURATION_DAYS: Record<string, number> = {
  oneDay: 1,
  threeDay: 3,
  sevenDay: 7,
  fourteenDay: 14,
  thirtyDay: 30,
  ninetyDay: 90,
  oneYear: 365,
};

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
    console.error("[rentals] markup fetch failed:", e);
    return 5.0; // 400% fallback
  }
}

function normalizePhone(value: unknown) {
  const str = typeof value === "string" ? value : value == null ? "" : String(value);
  if (!str) return "";
  return str.startsWith("+") ? str : `+${str}`;
}

function parseIso(value: string | null | undefined) {
  if (!value) return null;
  const iso = value.includes("T") ? value : value.replace(" ", "T");
  const withZone = iso.endsWith("Z") ? iso : `${iso}Z`;
  const date = new Date(withZone);
  return isNaN(date.getTime()) ? null : date;
}

async function usdToNgn(usdAmount: number): Promise<number> {
  let rate = 1500;
  try {
    rate = await getLiveFxRate("USD", "NGN");
  } catch {
    // fall back to static value
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
    const {
      serviceName,
      areaCode,
      isRenewable,
      duration,
    } = body;

    if (!serviceName || !duration || !RENTAL_DURATIONS.has(duration)) {
      return providerError("system", "serviceName and valid duration are required", 400);
    }

    const areaCodeValue = typeof areaCode === "string" && /^\d{3}$/.test(areaCode) ? areaCode : null;
    const renewable = Boolean(isRenewable);

    const pricing = await textverifiedClient.getRentalPrice({
      serviceName,
      areaCode: Boolean(areaCodeValue),
      isRenewable: renewable,
      duration,
      numberType: "mobile",
      capability: "sms",
    });

    let rawPrice = parseFloat(String(pricing.price));
    if (Number.isNaN(rawPrice)) {
      return providerError("textverified", "Invalid price returned from provider", 400);
    }

    const markupMultiplier = await getMarkupMultiplier();
    let userChargedUsd = parseFloat((rawPrice * markupMultiplier).toFixed(2));
    let userChargedNgn = parseFloat((await usdToNgn(userChargedUsd)).toFixed(2));

    const { data: userData } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    const userBalance = parseFloat(userData?.wallet_balance || "0");
    if (userBalance < userChargedNgn) {
      return NextResponse.json(
        { error: `Insufficient balance. Required: ${formatNaira(userChargedNgn)}, Available: ${formatNaira(userBalance)}` },
        { status: 402 }
      );
    }

    const rental = await textverifiedClient.createRental({
      serviceName,
      isRenewable: renewable,
      duration,
      areaCodeSelectOption: areaCodeValue ? [areaCodeValue] : undefined,
      numberType: "mobile",
      capability: "sms",
      allowBackOrderReservations: false,
    });

    const phoneNumber = normalizePhone(rental.number);
    if (!phoneNumber) {
      return providerError("textverified", "Rental returned invalid phone number", 500);
    }

    const reservationId = rental.reservationId;
    if (!reservationId) {
      return providerError("textverified", "Rental returned invalid reservation id", 500);
    }

    if (typeof rental.totalCost === "number" && rental.totalCost > 0) {
      rawPrice = rental.totalCost;
      userChargedUsd = parseFloat((rawPrice * markupMultiplier).toFixed(2));
      userChargedNgn = parseFloat((await usdToNgn(userChargedUsd)).toFixed(2));
      if (userBalance < userChargedNgn) {
        return NextResponse.json(
          { error: `Insufficient balance after purchase. Required: ${formatNaira(userChargedNgn)}, Available: ${formatNaira(userBalance)}` },
          { status: 402 }
        );
      }
    }

    const fallbackDays = DURATION_DAYS[duration] ?? 30;
    const endsAt =
      parseIso(rental.endsAt)?.toISOString() ||
      new Date(Date.now() + fallbackDays * 24 * 60 * 60 * 1000).toISOString();
    const displayCountryName = areaCodeValue ? `Area ${areaCodeValue}` : "United States";

    const { data: virtualNumber, error: numberError } = await supabase
      .from("virtual_numbers")
      .insert({
        user_id: user.id,
        phone_number: phoneNumber,
        country_code: "US",
        country_name: displayCountryName,
        textverified_id: reservationId,
        status: "active",
        capabilities: ["sms"],
        monthly_cost: userChargedNgn,
        number_type: "rental",
        provider: "textverified",
        product: serviceName,
        product_code: rental.reservationType,
        product_type: "rental",
        rental_code: rental.billingCycleId || null,
        expires_at: endsAt,
      })
      .select()
      .single();

    if (numberError) {
      console.error("DB error creating virtual_number:", numberError);
      return providerError("system", `Database error: ${numberError.message}`, 500);
    }

    await supabase
      .from("users")
      .update({ wallet_balance: userBalance - userChargedNgn })
      .eq("id", user.id);

    await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      type: "order_payment",
      amount: -userChargedNgn,
      balance_before: userBalance,
      balance_after: userBalance - userChargedNgn,
      description: `Textverified Rental ${serviceName}: ${phoneNumber}`,
    });

    const providerCostNgn = parseFloat((await usdToNgn(rawPrice)).toFixed(2));

    await supabase.from("number_purchases").insert({
      user_id: user.id,
      virtual_number_id: virtualNumber.id,
      amount: userChargedNgn,
      actual_cost: rawPrice,
      profit: parseFloat((userChargedNgn - providerCostNgn).toFixed(2)),
      currency: "NGN",
      status: "completed",
    });

    const supabaseAdmin = createServiceRoleClient();
    await supabaseAdmin.from("notifications").insert({
      user_id: user.id,
      type: "transaction",
      title: "Rental Purchased",
      message: `${phoneNumber} — ${serviceName} (Rental)`,
      data: { type: "rental_purchased", number_id: virtualNumber.id, provider: "textverified", mode: "rental" },
    });

    return NextResponse.json({ success: true, number: virtualNumber });
  } catch (error: any) {
    console.error("Rental purchase error:", error);
    return providerError("system", error.message || "Internal server error", 500);
  }
}
