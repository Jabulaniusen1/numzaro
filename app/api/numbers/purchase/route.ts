import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { smsPoolClient } from "@/lib/smspool/client";
import { platfoneClient } from "@/lib/platfone/client";
import { textverifiedClient } from "@/lib/textverified/client";
import { getLiveFxRate } from "@/lib/currency/rates";

type ProviderName = "smspool" | "textverified" | "platfone" | "system";

function providerError(
  provider: ProviderName,
  error: string,
  status: number = 400,
  extras?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      error,
      provider,
      errorSource: provider,
      ...extras,
    },
    { status }
  );
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

async function formatNairaFromUsd(usdAmount: number) {
  let rate = 1500;
  try { rate = await getLiveFxRate("USD", "NGN"); } catch {}
  const ngnAmount = usdAmount * rate;
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

// Platfone customer_id must match ^[a-zA-Z0-9]+$ — strip UUID hyphens
function platfoneCustomerId(userId: string): string {
  return userId.replace(/-/g, "");
}

// ─── Platfone: ensure customer exists (idempotent) ───────────────────────────
async function ensurePlatfoneCustomer(userId: string): Promise<void> {
  try {
    await platfoneClient.createCustomer(platfoneCustomerId(userId));
  } catch (err: any) {
    // 409 = customer already exists — safe to ignore
    if (err?.status === 409) return;
    const msg = String(err?.message ?? "").toLowerCase();
    if (msg.includes("already") || msg.includes("exists") || msg.includes("duplicate")) return;
    throw err;
  }
}

// ─── Platfone purchase ────────────────────────────────────────────────────────
async function handlePlatfonePurchase(
  body: any,
  user: { id: string; email?: string | null },
  supabase: any
) {
  const service     = String(body?.service  || "").trim();  // e.g. "whatsapp"
  const country     = String(body?.country  || "").trim();  // e.g. "uk"
  const serviceName = String(body?.serviceName || service).trim();

  if (!service || !country) {
    return providerError("platfone", "service and country are required for Platfone", 400);
  }

  const markupMultiplier = await getMarkupMultiplier();

  // Get price (in USD cents) from Platfone: { price: { min, max, suggested }, count }
  let priceInCents: number;
  try {
    const priceData = await platfoneClient.getPrice(service, country);
    priceInCents = priceData?.price?.suggested ?? priceData?.price?.min ?? 0;
    if (!Number.isFinite(priceInCents) || priceInCents <= 0) {
      return providerError("platfone", "Price not available for this service and country", 400);
    }
  } catch (err: any) {
    return providerError("platfone", err.message || "Failed to get Platfone price", 400);
  }

  // Convert cents → USD for our internal billing
  const sellPrice = priceInCents / 100;
  const userCharged = parseFloat((sellPrice * markupMultiplier).toFixed(2));

  const { data: userData } = await supabase
    .from("users")
    .select("wallet_balance")
    .eq("id", user.id)
    .single();

  const userBalance = parseFloat(userData?.wallet_balance || "0");
  if (userBalance < userCharged) {
    return NextResponse.json(
      {
        error: `Insufficient balance. Required: ${await formatNairaFromUsd(userCharged)}, Available: ${await formatNairaFromUsd(userBalance)}`,
      },
      { status: 402 }
    );
  }

  // Ensure Platfone customer exists for this user
  try {
    await ensurePlatfoneCustomer(user.id);
  } catch (err: any) {
    console.error("[platfone purchase] Failed to ensure customer:", err.message);
    return providerError("platfone", "Failed to initialise Platfone account. Please try again.", 503);
  }

  // Top up Platfone customer balance with the exact cost (in cents)
  try {
    const txId = `${user.id}-${Date.now()}`;
    await platfoneClient.addCustomerBalance(platfoneCustomerId(user.id), priceInCents, txId);
  } catch (err: any) {
    console.error("[platfone purchase] Failed to top up customer balance:", err.message);
    return providerError("platfone", "Failed to fund Platfone account. Please try again.", 503);
  }

  // Order the activation — retry once if price has moved
  let activation;
  try {
    activation = await platfoneClient.createActivation(platfoneCustomerId(user.id), service, country, priceInCents);
  } catch (err: any) {
    if (err.platfoneCode === "max_price_exceeded" && typeof err.suggestedPrice === "number") {
      // Price moved between getPrice and createActivation — top up the difference and retry
      const newPriceCents: number = err.suggestedPrice;
      const diff = newPriceCents - priceInCents;
      if (diff > 0) {
        try {
          const retryTxId = `${user.id}-${Date.now()}-retry`;
          await platfoneClient.addCustomerBalance(platfoneCustomerId(user.id), diff, retryTxId);
        } catch (topUpErr: any) {
          console.error("[platfone purchase] Failed to top up for retry:", topUpErr.message);
          return providerError("platfone", "Failed to fund Platfone account for retry.", 503);
        }
      }
      try {
        activation = await platfoneClient.createActivation(platfoneCustomerId(user.id), service, country, newPriceCents);
        priceInCents = newPriceCents;
      } catch (retryErr: any) {
        return providerError("platfone", retryErr.message || "Failed to purchase number", 400);
      }
    } else if (typeof err.message === "string" && err.message.startsWith("PLATFONE_BALANCE:")) {
      console.error("[platfone purchase] PROVIDER BALANCE LOW:", err.message);
      return providerError(
        "platfone",
        "This service is temporarily unavailable. Please try again later or contact support.",
        503
      );
    } else if (err.platfoneCode === "no_numbers") {
      return providerError(
        "platfone",
        "No numbers available for this service in the selected country. Please try another country.",
        400
      );
    } else {
      return providerError("platfone", err.message || "Failed to purchase number", 400);
    }
  }

  const activationId = String(activation?.activation_id ?? "").trim();
  // Use `formatted` (E.164) if available, otherwise `phone`
  const rawPhone = activation?.formatted ?? activation?.phone;

  if (!activationId || !rawPhone) {
    if (activationId) {
      try { await platfoneClient.cancelActivation(platfoneCustomerId(user.id), activationId); } catch {}
    }
    return providerError("platfone", "Platfone purchase returned invalid activation data", 500);
  }

  const phoneNumber = normalizePhone(rawPhone);
  if (!phoneNumber) {
    try { await platfoneClient.cancelActivation(platfoneCustomerId(user.id), activationId); } catch {}
    return providerError("platfone", "Platfone purchase returned invalid phone number", 500);
  }

  // `price` in the activation response is in cents; convert to USD
  const actualCost = typeof activation.price === "number" && activation.price > 0
    ? activation.price / 100
    : sellPrice;

  const expiresAt = activation.expire_at
    ? new Date(activation.expire_at * 1000).toISOString()
    : new Date(Date.now() + 20 * 60 * 1000).toISOString();

  const { data: virtualNumber, error: numberError } = await supabase
    .from("virtual_numbers")
    .insert({
      user_id:             user.id,
      phone_number:        phoneNumber,
      country_code:        String(country),
      country_name:        String(body?.countryName || `Country ${country}`),
      textverified_id:     activationId,
      status:              "active",
      capabilities:        ["sms"],
      twilio_monthly_cost: actualCost,
      monthly_cost:        userCharged,
      number_type:         "activation",
      provider:            "platfone",
      product:             serviceName,
      product_code:        service,
      product_type:        "activation",
      expires_at:          expiresAt,
    })
    .select()
    .single();

  if (numberError) {
    console.error("[platfone purchase] DB error:", numberError);
    try { await platfoneClient.cancelActivation(platfoneCustomerId(user.id), activationId); } catch {}
    return providerError("system", `Database error: ${numberError.message}`, 500);
  }

  // Deduct from SocialBooster wallet
  await supabase
    .from("users")
    .update({ wallet_balance: userBalance - userCharged })
    .eq("id", user.id);

  await supabase.from("wallet_transactions").insert({
    user_id:        user.id,
    type:           "order_payment",
    amount:         -userCharged,
    balance_before: userBalance,
    balance_after:  userBalance - userCharged,
    description:    `Platfone ${serviceName} (Country ${country}): ${phoneNumber}`,
  });

  await supabase.from("number_purchases").insert({
    user_id:           user.id,
    virtual_number_id: virtualNumber.id,
    amount:            userCharged,
    actual_cost:       actualCost,
    profit:            parseFloat((userCharged - actualCost).toFixed(2)),
    currency:          "USD",
    status:            "completed",
  });

  const supabaseAdmin = createServiceRoleClient();
  await supabaseAdmin.from("notifications").insert({
    user_id: user.id,
    type:    "transaction",
    title:   "Number Purchased",
    message: `${phoneNumber} — ${serviceName}`,
    data: { type: "number_purchased", number_id: virtualNumber.id, provider: "platfone", mode: "activation" },
  });

  return NextResponse.json({ success: true, number: virtualNumber });
}

// ─── TextVerified: US one-time activation ─────────────────────────────────────
async function handleTextverifiedActivation(
  body: any,
  user: { id: string },
  supabase: any
): Promise<NextResponse> {
  const serviceName = String(body?.serviceName || "").trim();

  if (!serviceName) {
    return providerError("textverified", "serviceName is required for US numbers", 400);
  }

  const markupMultiplier = await getMarkupMultiplier();

  // Get price from TextVerified
  let tvPrice: number;
  try {
    const priceData = await textverifiedClient.getVerificationPrice({ serviceName });
    tvPrice = priceData.price;
    if (!Number.isFinite(tvPrice) || tvPrice <= 0) {
      return NextResponse.json(
        {
          error: `${serviceName} is not available for US numbers. Please try another service or country.`,
          provider: "textverified",
          errorSource: "textverified",
        },
        { status: 400 }
      );
    }
  } catch {
    return providerError(
      "textverified",
      `${serviceName} is not available for US numbers. Please try another service or country.`,
      400
    );
  }

  const userCharged = parseFloat((tvPrice * markupMultiplier).toFixed(2));

  const { data: userData } = await supabase
    .from("users")
    .select("wallet_balance")
    .eq("id", user.id)
    .single();

  const userBalance = parseFloat(userData?.wallet_balance || "0");
  if (userBalance < userCharged) {
    return NextResponse.json(
      { error: `Insufficient balance. Required: ${formatNairaFromUsd(userCharged)}, Available: ${formatNairaFromUsd(userBalance)}` },
      { status: 402 }
    );
  }

  // Create the TextVerified verification (one-time activation)
  let verification;
  try {
    verification = await textverifiedClient.createVerification({
      serviceName,
      capability: "sms",
    });
  } catch (err: any) {
    return providerError("textverified", err.message || "Failed to create US number", 400);
  }

  const verificationId = verification.id;
  const phoneNumber = normalizePhone(verification.number, "1");

  if (!phoneNumber || !verificationId) {
    if (verificationId) {
      try { await textverifiedClient.cancelVerification(verificationId); } catch {}
    }
    return providerError("textverified", "Provider returned invalid number data", 500);
  }

  const actualCost =
    typeof verification.totalCost === "number" && verification.totalCost > 0
      ? verification.totalCost
      : tvPrice;

  const expiresAt = verification.endsAt
    ? new Date(verification.endsAt).toISOString()
    : new Date(Date.now() + 20 * 60 * 1000).toISOString();

  const { data: virtualNumber, error: numberError } = await supabase
    .from("virtual_numbers")
    .insert({
      user_id:             user.id,
      phone_number:        phoneNumber,
      country_code:        "US",
      country_name:        "United States",
      textverified_id:     verificationId,
      status:              "active",
      capabilities:        ["sms"],
      twilio_monthly_cost: actualCost,
      monthly_cost:        userCharged,
      number_type:         "activation",
      provider:            "textverified",
      product:             serviceName,
      product_code:        serviceName.toLowerCase().replace(/\s+/g, "_"),
      product_type:        "activation",
      expires_at:          expiresAt,
    })
    .select()
    .single();

  if (numberError) {
    console.error("[textverified purchase] DB error:", numberError);
    try { await textverifiedClient.cancelVerification(verificationId); } catch {}
    return providerError("system", `Database error: ${numberError.message}`, 500);
  }

  await supabase
    .from("users")
    .update({ wallet_balance: userBalance - userCharged })
    .eq("id", user.id);

  await supabase.from("wallet_transactions").insert({
    user_id:        user.id,
    type:           "order_payment",
    amount:         -userCharged,
    balance_before: userBalance,
    balance_after:  userBalance - userCharged,
    description:    `US Number — ${serviceName}: ${phoneNumber}`,
  });

  await supabase.from("number_purchases").insert({
    user_id:           user.id,
    virtual_number_id: virtualNumber.id,
    amount:            userCharged,
    actual_cost:       actualCost,
    profit:            parseFloat((userCharged - actualCost).toFixed(2)),
    currency:          "USD",
    status:            "completed",
  });

  const supabaseAdmin = createServiceRoleClient();
  await supabaseAdmin.from("notifications").insert({
    user_id: user.id,
    type:    "transaction",
    title:   "Number Purchased",
    message: `${phoneNumber} — ${serviceName}`,
    data: { type: "number_purchased", number_id: virtualNumber.id, provider: "textverified", mode: "activation" },
  });

  return NextResponse.json({ success: true, number: virtualNumber });
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    // Route to Platfone handler when provider is specified
    if (body?.provider === "platfone") {
      return handlePlatfonePurchase(body, user, supabase);
    }

    const serviceCode = String(body?.serviceCode || "").trim();
    const serviceName = String(body?.serviceName || "").trim();
    const countryId = String(body?.country || "").trim();
    const countryName = String(body?.countryName || "").trim();
    const countryShortCode = String(body?.countryShortCode || "").trim();
    const maxPrice = typeof body?.maxPrice === "number" ? body.maxPrice : undefined;

    if (!serviceCode || !countryId) {
      return providerError("system", "serviceCode and country are required", 400);
    }

    // US one-time numbers → TextVerified
    const isUS =
      countryShortCode.toUpperCase() === "US" ||
      countryName.toLowerCase().includes("united states") ||
      countryName.toLowerCase() === "usa";

    if (isUS) {
      return handleTextverifiedActivation(body, user, supabase);
    }

    const markupMultiplier = await getMarkupMultiplier();

    const pricing = await smsPoolClient.getSMSServicePrice(countryId, serviceCode);
    const baseRawPrice = parseFloat(String(pricing.high_price ?? pricing.price));
    if (Number.isNaN(baseRawPrice)) {
      return providerError("smspool", "Invalid price returned from provider", 400);
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
          error: `Insufficient balance. Required: ${await formatNairaFromUsd(userCharged)}, Available: ${await formatNairaFromUsd(userBalance)}`,
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
      return providerError("smspool", extractSmsPoolError(purchase), 400);
    }

    const activationId = purchase.order_id;
    if (!activationId) {
      return providerError("smspool", "Purchase returned invalid order id", 500);
    }

    const phoneNumber = normalizePhone(purchase.number ?? purchase.phonenumber, purchase.cc);
    if (!phoneNumber) {
      try {
        await smsPoolClient.cancelSMS(activationId);
      } catch {}
      return providerError("smspool", "Purchase returned invalid phone number", 500);
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
          error: `Insufficient balance after purchase. Required: ${await formatNairaFromUsd(userCharged)}, Available: ${await formatNairaFromUsd(userBalance)}`,
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
      return providerError("system", `Database error: ${numberError.message}`, 500);
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
      message: `${phoneNumber} — ${displayName}`,
      data: { type: "number_purchased", number_id: virtualNumber.id, provider: "smspool", mode: "activation" },
    });

    return NextResponse.json({ success: true, number: virtualNumber });
  } catch (error: any) {
    console.error("Purchase route error:", error);
    return providerError("system", error.message || "Internal server error", 500);
  }
}
