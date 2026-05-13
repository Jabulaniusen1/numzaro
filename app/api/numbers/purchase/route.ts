import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { smsPoolClient } from "@/lib/smspool/client";
import { textverifiedClient } from "@/lib/textverified/client";
import { getLiveFxRate } from "@/lib/currency/rates";

type ProviderName = "smspool" | "textverified" | "system";

function providerError(provider: ProviderName, error: string, status = 400, extras?: Record<string, unknown>) {
  return NextResponse.json({ error, provider, errorSource: provider, ...extras }, { status });
}

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
  } catch {
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
  const cc = (typeof countryCode === "string" || typeof countryCode === "number" ? String(countryCode) : "").replace(/[^\d]/g, "");
  if (!digits) return "";
  if (cc && !digits.startsWith(cc)) return `+${cc}${digits}`;
  return `+${digits}`;
}

function parseExpiryFromUnix(unixSeconds?: number) {
  if (!unixSeconds || Number.isNaN(unixSeconds)) return new Date(Date.now() + 20 * 60 * 1000).toISOString();
  return new Date(unixSeconds * 1000).toISOString();
}

async function usdToNgn(usdAmount: number): Promise<number> {
  let rate = 1500;
  try { rate = await getLiveFxRate("USD", "NGN"); } catch {}
  return usdAmount * rate;
}

function formatNaira(ngnAmount: number) {
  return `₦${ngnAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function extractSmsPoolError(result: any): string {
  const rawMessage = typeof result?.message === "string" ? result.message : "";
  if (rawMessage) return stripHtml(rawMessage);
  if (Array.isArray(result?.errors) && result.errors[0]?.message) return String(result.errors[0].message);
  if (result?.pools && typeof result.pools === "object") {
    for (const entry of Object.values(result.pools) as Array<any>) {
      if (typeof entry?.message === "string" && entry.message) return stripHtml(entry.message);
      if (Array.isArray(entry?.errors) && entry.errors[0]?.message) return String(entry.errors[0].message);
    }
  }
  return "Failed to purchase number from SMSPool.";
}

function extractTextverifiedCreateErrorMessage(error: unknown): string {
  const fallback = "Number unavailable right now for this service. Please try another service or retry shortly.";
  const raw = String((error as any)?.message || "").trim();
  if (!raw) return fallback;
  const normalized = raw.toLowerCase();
  if (normalized.includes("out of stock") || normalized.includes("unavailable")) return fallback;
  const bodyStart = raw.indexOf("{");
  if (bodyStart >= 0) {
    try {
      const parsed = JSON.parse(raw.slice(bodyStart).trim());
      const description = String(parsed?.errorDescription || parsed?.message || "").trim();
      const code = String(parsed?.errorCode || "").trim().toLowerCase();
      const combined = `${code} ${description}`.toLowerCase();
      if (combined.includes("out of stock") || combined.includes("unavailable") || code === "unavailable") return fallback;
      if (description) return description;
    } catch {}
  }
  return raw;
}

async function handleTextverifiedActivation(body: any, user: { id: string }, supabase: any): Promise<NextResponse> {
  const serviceName = String(body?.serviceName || "").trim();
  if (!serviceName) return providerError("textverified", "serviceName is required for US numbers", 400);

  const markupMultiplier = await getMarkupMultiplier();

  let tvPrice: number;
  try {
    const priceData = await textverifiedClient.getVerificationPrice({ serviceName });
    tvPrice = priceData.price;
    if (!Number.isFinite(tvPrice) || tvPrice <= 0) {
      return NextResponse.json({ error: `${serviceName} is not available for US numbers. Please try another service or country.`, provider: "textverified", errorSource: "textverified" }, { status: 400 });
    }
  } catch {
    return providerError("textverified", `${serviceName} is not available for US numbers. Please try another service or country.`, 400);
  }

  const userChargedUsd = parseFloat((tvPrice * markupMultiplier).toFixed(2));
  const userCharged = parseFloat((await usdToNgn(userChargedUsd)).toFixed(2));

  const { data: userData } = await supabase.from("users").select("wallet_balance").eq("id", user.id).single();
  const userBalance = parseFloat(userData?.wallet_balance || "0");
  if (userBalance < userCharged) {
    return NextResponse.json({ error: `Insufficient balance. Required: ${formatNaira(userCharged)}, Available: ${formatNaira(userBalance)}` }, { status: 402 });
  }

  let verification;
  try {
    verification = await textverifiedClient.createVerification({ serviceName, capability: "sms" });
  } catch (err: any) {
    const message = extractTextverifiedCreateErrorMessage(err);
    return providerError("textverified", message, message.includes("Number unavailable right now") ? 409 : 400);
  }

  const verificationId = verification.id;
  const phoneNumber = normalizePhone(verification.number, "1");
  if (!phoneNumber || !verificationId) {
    if (verificationId) try { await textverifiedClient.cancelVerification(verificationId); } catch {}
    return providerError("textverified", "Provider returned invalid number data", 500);
  }

  const actualCost = typeof verification.totalCost === "number" && verification.totalCost > 0 ? verification.totalCost : tvPrice;
  const expiresAt = verification.endsAt ? new Date(verification.endsAt).toISOString() : new Date(Date.now() + 20 * 60 * 1000).toISOString();

  const { data: virtualNumber, error: numberError } = await supabase.from("virtual_numbers").insert({
    user_id: user.id, phone_number: phoneNumber, country_code: "US", country_name: "United States",
    textverified_id: verificationId, status: "active", capabilities: ["sms"],
    monthly_cost: userCharged,
    number_type: "activation", provider: "textverified",
    product: serviceName, product_code: serviceName.toLowerCase().replace(/\s+/g, "_"),
    product_type: "activation", expires_at: expiresAt,
  }).select().single();

  if (numberError) {
    console.error("[textverified purchase] DB error:", numberError);
    try { await textverifiedClient.cancelVerification(verificationId); } catch {}
    return providerError("system", `Database error: ${numberError.message}`, 500);
  }

  await supabase.from("users").update({ wallet_balance: userBalance - userCharged }).eq("id", user.id);
  await supabase.from("wallet_transactions").insert({ user_id: user.id, type: "order_payment", amount: -userCharged, balance_before: userBalance, balance_after: userBalance - userCharged, description: `US Number — ${serviceName}: ${phoneNumber}` });
  await supabase.from("number_purchases").insert({ user_id: user.id, virtual_number_id: virtualNumber.id, amount: userCharged, actual_cost: actualCost, profit: parseFloat((userCharged - (await usdToNgn(actualCost))).toFixed(2)), currency: "NGN", status: "completed" });
  await createServiceRoleClient().from("notifications").insert({ user_id: user.id, type: "transaction", title: "Number Purchased", message: `${phoneNumber} — ${serviceName}`, data: { type: "number_purchased", number_id: virtualNumber.id, provider: "textverified", mode: "activation" } });

  return NextResponse.json({ success: true, number: virtualNumber });
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

    if (!serviceCode || !countryId) return providerError("system", "serviceCode and country are required", 400);

    const isUS = countryShortCode.toUpperCase() === "US" || countryName.toLowerCase().includes("united states") || countryName.toLowerCase() === "usa";
    if (isUS) return handleTextverifiedActivation(body, user, supabase);

    const markupMultiplier = await getMarkupMultiplier();
    const pricing = await smsPoolClient.getSMSServicePrice(countryId, serviceCode);
    const baseRawPrice = parseFloat(String(pricing.high_price ?? pricing.price));
    if (Number.isNaN(baseRawPrice)) return providerError("smspool", "Invalid price returned from provider", 400);

    let rawPrice = baseRawPrice;
    let userChargedUsd = parseFloat((rawPrice * markupMultiplier).toFixed(2));
    let userCharged = parseFloat((await usdToNgn(userChargedUsd)).toFixed(2));

    const { data: userData } = await supabase.from("users").select("wallet_balance").eq("id", user.id).single();
    const userBalance = parseFloat(userData?.wallet_balance || "0");
    if (userBalance < userCharged) {
      return NextResponse.json({ error: `Insufficient balance. Required: ${formatNaira(userCharged)}, Available: ${formatNaira(userBalance)}` }, { status: 402 });
    }

    const purchase = await smsPoolClient.purchaseSMS(countryId, serviceCode, { pricingOption: 1, quantity: 1, activationType: "SMS", maxPrice });
    if (!purchase.success) return providerError("smspool", extractSmsPoolError(purchase), 400);

    const activationId = purchase.order_id;
    if (!activationId) return providerError("smspool", "Purchase returned invalid order id", 500);

    const phoneNumber = normalizePhone(purchase.number ?? purchase.phonenumber, purchase.cc);
    if (!phoneNumber) {
      try { await smsPoolClient.cancelSMS(activationId); } catch {}
      return providerError("smspool", "Purchase returned invalid phone number", 500);
    }

    const purchaseCost = parseFloat(String(purchase.cost ?? rawPrice));
    if (!Number.isNaN(purchaseCost) && purchaseCost > 0) {
      rawPrice = purchaseCost;
      userChargedUsd = parseFloat((rawPrice * markupMultiplier).toFixed(2));
      userCharged = parseFloat((await usdToNgn(userChargedUsd)).toFixed(2));
    }

    if (userBalance < userCharged) {
      try { await smsPoolClient.cancelSMS(activationId); } catch (cancelError) { console.error("[purchase] failed to cancel over-budget SMSPool order:", cancelError); }
      return NextResponse.json({ error: `Insufficient balance after purchase. Required: ${formatNaira(userCharged)}, Available: ${formatNaira(userBalance)}` }, { status: 402 });
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

    const { data: virtualNumber, error: numberError } = await supabase.from("virtual_numbers").insert({
      user_id: user.id, phone_number: phoneNumber, country_code: resolvedCountryCode, country_name: displayCountryName,
      textverified_id: activationId, status: "active", capabilities: ["sms"],
      monthly_cost: userCharged, number_type: "activation",
      provider: "smspool", product: displayName, product_code: serviceCode, product_type: "activation", expires_at: expiresAt,
    }).select().single();

    if (numberError) {
      console.error("DB error creating virtual_number:", numberError);
      try { await smsPoolClient.cancelSMS(activationId); } catch (cancelError) { console.error("[purchase] failed to cancel SMSPool order after DB error:", cancelError); }
      return providerError("system", `Database error: ${numberError.message}`, 500);
    }

    await supabase.from("users").update({ wallet_balance: userBalance - userCharged }).eq("id", user.id);
    await supabase.from("wallet_transactions").insert({ user_id: user.id, type: "order_payment", amount: -userCharged, balance_before: userBalance, balance_after: userBalance - userCharged, description: `SMSPool ${displayName} (${displayCountryName}): ${phoneNumber}` });
    await supabase.from("number_purchases").insert({ user_id: user.id, virtual_number_id: virtualNumber.id, amount: userCharged, actual_cost: rawPrice, profit: parseFloat((userCharged - (await usdToNgn(rawPrice))).toFixed(2)), currency: "NGN", status: "completed" });
    await createServiceRoleClient().from("notifications").insert({ user_id: user.id, type: "transaction", title: "Number Purchased", message: `${phoneNumber} — ${displayName}`, data: { type: "number_purchased", number_id: virtualNumber.id, provider: "smspool", mode: "activation" } });

    return NextResponse.json({ success: true, number: virtualNumber });
  } catch (error: any) {
    console.error("Purchase route error:", error);
    return providerError("system", error.message || "Internal server error", 500);
  }
}
