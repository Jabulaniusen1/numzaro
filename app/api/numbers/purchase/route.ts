import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { purchaseNumber, configureNumberWebhook } from "@/lib/twilio/numbers";
import { purchaseWithWallet, refundToWallet } from "@/lib/wallet/purchase";
import { getDefaultMonthlyCost, getPhoneNumbersMarkup } from "@/lib/twilio/costs";
import { getCountryName } from "@/lib/data/countries";

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
    const { phoneNumber, countryCode } = body;

    if (!phoneNumber || !countryCode) {
      return NextResponse.json(
        { error: "phoneNumber and countryCode are required" },
        { status: 400 }
      );
    }

    // Calculate pricing with current markup
    const markupPercentage = await getPhoneNumbersMarkup();
    const twilioMonthlyCost = 1.0; // Base Twilio cost
    const monthlyCost = await getDefaultMonthlyCost(countryCode, markupPercentage);
    const countryName = getCountryName(countryCode);

    // Get webhook URL - construct from NEXT_PUBLIC_APP_URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const webhookUrl = baseUrl 
      ? `${baseUrl}/api/webhooks/twilio/sms`
      : undefined;

    // Step 1: Check wallet balance
    const { data: userProfile } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    const currentBalance = parseFloat(userProfile?.wallet_balance || "0.00");

    if (currentBalance < monthlyCost) {
      return NextResponse.json(
        {
          error: "Insufficient wallet balance",
          required: monthlyCost,
          available: currentBalance,
        },
        { status: 400 }
      );
    }

    // Step 2: Purchase number from Twilio
    let purchasedNumber;
    try {
      purchasedNumber = await purchaseNumber(phoneNumber, webhookUrl);
      
      // If webhook wasn't set during purchase (development mode), log a warning
      if (!webhookUrl) {
        console.warn(
          `[Development Mode] Number purchased without webhook URL. ` +
          `Configure webhook manually in Twilio Console for number: ${purchasedNumber.phoneNumber} ` +
          `or set NEXT_PUBLIC_APP_URL to a publicly accessible HTTPS URL.`
        );
      }
    } catch (twilioError: any) {
      console.error("Twilio purchase error:", twilioError);
      return NextResponse.json(
        { error: `Failed to purchase number: ${twilioError.message}` },
        { status: 500 }
      );
    }

    // Step 3: Deduct from wallet
    const walletResult = await purchaseWithWallet(
      user.id,
      monthlyCost,
      `Virtual number purchase: ${purchasedNumber.phoneNumber}`
    );

    if (!walletResult.success) {
      // Rollback: Release number from Twilio
      try {
        const { releaseNumber } = await import("@/lib/twilio/numbers");
        await releaseNumber(purchasedNumber.sid);
      } catch (releaseError) {
        console.error("Error releasing number after wallet failure:", releaseError);
      }

      return NextResponse.json(
        { error: walletResult.error || "Failed to deduct from wallet" },
        { status: 500 }
      );
    }

    // Step 4: Create database records
    try {
      // Create virtual_number record
      const { data: virtualNumber, error: numberError } = await supabase
        .from("virtual_numbers")
        .insert({
          user_id: user.id,
          phone_number: purchasedNumber.phoneNumber,
          country_code: countryCode,
          country_name: countryName,
          twilio_sid: purchasedNumber.sid,
          status: "active",
          capabilities: purchasedNumber.capabilities.SMS ? ["sms"] : [],
          monthly_cost: monthlyCost,
          twilio_monthly_cost: twilioMonthlyCost,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })
        .select()
        .single();

      if (numberError) {
        console.error("Error creating virtual_number:", numberError);
        
        // Rollback: Release number and refund wallet
        try {
          const { releaseNumber } = await import("@/lib/twilio/numbers");
          await releaseNumber(purchasedNumber.sid);
        } catch (releaseError) {
          console.error("Error releasing number:", releaseError);
        }

        await refundToWallet(
          user.id,
          monthlyCost,
          `Refund for failed number purchase: ${purchasedNumber.phoneNumber}`
        );

        return NextResponse.json(
          { error: "Failed to create database record" },
          { status: 500 }
        );
      }

      // Create number_purchase record
      const { error: purchaseError } = await supabase
        .from("number_purchases")
        .insert({
          user_id: user.id,
          virtual_number_id: virtualNumber.id,
          amount: monthlyCost,
          currency: "USD",
          status: "completed",
          wallet_transaction_id: walletResult.walletTransactionId,
        });

      if (purchaseError) {
        console.error("Error creating number_purchase:", purchaseError);
        // Non-critical error, log but don't fail
      }

      // Create twilio_charges record
      const { error: chargeError } = await supabase
        .from("twilio_charges")
        .insert({
          user_id: user.id,
          virtual_number_id: virtualNumber.id,
          charge_type: "number_purchase",
          twilio_sid: purchasedNumber.sid,
          actual_cost: twilioMonthlyCost,
          user_charged: monthlyCost,
          metadata: {
            phone_number: purchasedNumber.phoneNumber,
            country_code: countryCode,
          },
        });

      if (chargeError) {
        console.error("Error creating twilio_charges:", chargeError);
        // Non-critical error, log but don't fail
      }

      // Create notification
      const supabaseForNotification = createServiceRoleClient();
      await supabaseForNotification.from("notifications").insert({
        user_id: user.id,
        type: "transaction",
        title: "Virtual Number Purchased",
        message: `Successfully purchased ${purchasedNumber.phoneNumber}`,
        data: {
          type: "number_purchased",
          number: purchasedNumber.phoneNumber,
          number_id: virtualNumber.id,
          amount: monthlyCost,
        },
      });

      return NextResponse.json({
        success: true,
        number: {
          id: virtualNumber.id,
          phone_number: virtualNumber.phone_number,
          country_code: virtualNumber.country_code,
          country_name: virtualNumber.country_name,
          status: virtualNumber.status,
          monthly_cost: virtualNumber.monthly_cost,
        },
      });
    } catch (dbError: any) {
      console.error("Database error:", dbError);

      // Rollback: Release number and refund wallet
      try {
        const { releaseNumber } = await import("@/lib/twilio/numbers");
        await releaseNumber(purchasedNumber.sid);
      } catch (releaseError) {
        console.error("Error releasing number:", releaseError);
      }

      await refundToWallet(
        user.id,
        monthlyCost,
        `Refund for failed number purchase: ${purchasedNumber.phoneNumber}`
      );

      return NextResponse.json(
        { error: "Failed to create database record" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in purchase route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

