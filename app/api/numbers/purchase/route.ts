
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { smsPoolClient } from "@/lib/smspool/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      mode = "activation",   // "activation" | "rental"
      // Activation fields
      serviceCode,           // SMSPool service ID e.g. "12"
      serviceName,
      country,               // SMSPool country ID e.g. "1"
      countryName,
      // Rental fields
      rentalId,              // SMSPool rental listing ID
      rentalName,
      days = 30,             // rental duration in days
    } = body;

    // ── Validate input ────────────────────────────────────────────────────

    if (mode === "activation" && (!serviceCode || !country)) {
      return NextResponse.json({ error: "serviceCode and country are required" }, { status: 400 });
    }
    if (mode === "rental" && !rentalId) {
      return NextResponse.json({ error: "rentalId is required for rental mode" }, { status: 400 });
    }

    // ── Get price ─────────────────────────────────────────────────────────

    let rawPrice = 0;
    let userCharged = 0;
    let expiresAt: string;

    const markupPct = 50; // Fixed markup
    const markupMultiplier = 1 + markupPct / 100;

    if (mode === "rental") {
      const rentals = await smsPoolClient.getRentals(true);
      const rental = rentals.data?.find((r) => String(r.ID) === String(rentalId));
      if (!rental) {
        return NextResponse.json({ error: "Rental not found" }, { status: 404 });
      }
      // pricing[days] = total price for that duration
      rawPrice = parseFloat((rental.pricing[String(days)] ?? Object.values(rental.pricing)[0]).toFixed(4));
      userCharged = parseFloat((rawPrice * markupMultiplier).toFixed(2));
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    } else {
      const priceResult = await smsPoolClient.getSMSServicePrice(country, serviceCode);
      if (!priceResult.price) {
        return NextResponse.json({ error: "Could not fetch price for this service/country" }, { status: 400 });
      }
      rawPrice = parseFloat(priceResult.price);
      userCharged = parseFloat((rawPrice * markupMultiplier).toFixed(2));
      expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString(); // 20 min
    }

    // ── Check user balance ────────────────────────────────────────────────

    const { data: userData } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    const userBalance = parseFloat(userData?.wallet_balance || "0");
    if (userBalance < userCharged) {
      return NextResponse.json(
        { error: `Insufficient balance. Required: $${userCharged.toFixed(2)}, Available: $${userBalance.toFixed(2)}` },
        { status: 402 }
      );
    }

    // ── Purchase from SMSPool ─────────────────────────────────────────────

    let phoneNumber: string;
    let orderId: string | null = null;
    let rentalCode: string | null = null;
    const displayCountryName = countryName || country;
    const displayName = serviceName || serviceCode || rentalName || String(rentalId);

    if (mode === "rental") {
      const result = await smsPoolClient.purchaseRental(String(rentalId), days);
      if (!result.success || !result.phonenumber || !result.rental_code) {
        return NextResponse.json(
          { error: result.message || "Rental purchase failed" },
          { status: 500 }
        );
      }
      phoneNumber = result.phonenumber;
      rentalCode = result.rental_code;
      expiresAt = new Date(result.expiry * 1000).toISOString();
    } else {
      const result = await smsPoolClient.purchaseSMS(country, serviceCode);
      if (!result.success || !result.number || !result.order_id) {
        return NextResponse.json(
          { error: result.message || "No numbers available for this service/country" },
          { status: 500 }
        );
      }
      phoneNumber = result.number.startsWith("+") ? result.number : `+${result.number}`;
      orderId = result.order_id;
      expiresAt = new Date(result.expiration * 1000).toISOString();
    }

    // ── Save to database ──────────────────────────────────────────────────

    const { data: virtualNumber, error: numberError } = await supabase
      .from("virtual_numbers")
      .insert({
        user_id: user.id,
        phone_number: phoneNumber,
        country_code: country || "",
        country_name: displayCountryName,
        twilio_sid: orderId || rentalCode || "",
        textverified_id: orderId || rentalCode,
        rental_code: rentalCode,
        status: "active",
        capabilities: ["sms"],
        twilio_monthly_cost: rawPrice,
        monthly_cost: userCharged,
        number_type: mode === "rental" ? "rental" : "activation",
        provider: "smspool",
        product: displayName,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (numberError) {
      console.error("DB error creating virtual_number:", numberError);
      return NextResponse.json({ error: `Database error: ${numberError.message}` }, { status: 500 });
    }

    // ── Deduct wallet ─────────────────────────────────────────────────────

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
      description: `SMSPool ${displayName} (${displayCountryName}) ${mode}: ${phoneNumber}`,
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
      data: { type: "number_purchased", number_id: virtualNumber.id, provider: "smspool", mode },
    });

    return NextResponse.json({ success: true, number: virtualNumber });
  } catch (error: any) {
    console.error("Purchase route error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
