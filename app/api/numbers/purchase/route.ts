import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTelecomProvider } from "@/lib/telecom";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      phoneNumberId,
      country,
      numberType,
      capabilities,
      purchaseCost,
      monthlyCost,
    } = body;

    // Validate required fields
    if (!phoneNumberId || !country || !numberType || !capabilities) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["long_term", "otp", "business"].includes(numberType)) {
      return NextResponse.json(
        { error: "Invalid number type" },
        { status: 400 }
      );
    }

    // Calculate costs
    const setupCost = parseFloat(purchaseCost || "0");
    const recurringCost = numberType === "otp" ? null : parseFloat(monthlyCost || "0");
    const totalCost = setupCost;

    // Check wallet balance
    const { data: userProfile } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    const currentBalance = parseFloat(userProfile?.wallet_balance || "0.00");

    if (currentBalance < totalCost) {
      return NextResponse.json(
        {
          error: "Insufficient wallet balance",
          required: totalCost,
          available: currentBalance,
        },
        { status: 400 }
      );
    }

    try {
      // Purchase number from provider
      const provider = getTelecomProvider();
      const purchasedNumber = await provider.purchaseNumber(phoneNumberId);

      // Get webhook base URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const smsWebhookUrl = `${appUrl}/api/webhooks/sms`;
      const callWebhookUrl = `${appUrl}/api/webhooks/calls`;

      // Configure webhooks
      try {
        await provider.configureSMSWebhook(purchasedNumber.providerId, smsWebhookUrl);
        if (capabilities.includes("voice")) {
          await provider.configureCallWebhook(
            purchasedNumber.providerId,
            callWebhookUrl
          );
        }
      } catch (webhookError) {
        console.error("Webhook configuration error:", webhookError);
        // Continue even if webhook config fails - can be configured later
      }

      // Calculate renewal date (30 days from now for long_term/business)
      const renewalDate =
        numberType === "otp"
          ? null
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Deduct from wallet
      const balanceAfter = currentBalance - totalCost;
      const { error: balanceError } = await supabase
        .from("users")
        .update({ wallet_balance: balanceAfter })
        .eq("id", user.id);

      if (balanceError) {
        // Try to release the number if wallet update fails
        try {
          await provider.releaseNumber(purchasedNumber.providerId);
        } catch (releaseError) {
          console.error("Failed to release number after wallet error:", releaseError);
        }
        return NextResponse.json(
          { error: "Failed to deduct from wallet" },
          { status: 500 }
        );
      }

      // Create wallet transaction
      await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        type: "order_payment",
        amount: -totalCost,
        balance_before: currentBalance,
        balance_after: balanceAfter,
        description: `Virtual number purchase: ${purchasedNumber.phoneNumber}`,
      });

      // Save number to database
      const { data: phoneNumber, error: dbError } = await supabase
        .from("phone_numbers")
        .insert({
          user_id: user.id,
          provider: process.env.TELECOM_PROVIDER || "twilio",
          country: country,
          number: purchasedNumber.phoneNumber,
          type: numberType,
          capabilities: capabilities,
          status: "active",
          purchase_cost: setupCost,
          monthly_cost: recurringCost,
          renewal_date: renewalDate,
          provider_number_id: purchasedNumber.providerId,
        })
        .select()
        .single();

      if (dbError) {
        console.error("Database error:", dbError);
        // Try to release the number if DB save fails
        try {
          await provider.releaseNumber(purchasedNumber.providerId);
        } catch (releaseError) {
          console.error("Failed to release number after DB error:", releaseError);
        }
        // Refund wallet
        await supabase
          .from("users")
          .update({ wallet_balance: currentBalance })
          .eq("id", user.id);
        return NextResponse.json(
          { error: "Failed to save number to database" },
          { status: 500 }
        );
      }

      // Create subscription record if not OTP
      if (numberType !== "otp" && renewalDate) {
        await supabase.from("number_subscriptions").insert({
          number_id: phoneNumber.id,
          user_id: user.id,
          next_charge_date: renewalDate,
          status: "active",
        });
      }

      return NextResponse.json({ number: phoneNumber });
    } catch (providerError: any) {
      console.error("Provider error:", providerError);
      return NextResponse.json(
        {
          error: "Failed to purchase number",
          details: providerError.message || "Provider API error",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Purchase number error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

