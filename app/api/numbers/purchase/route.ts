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
    const { phoneNumber, countryCode, numberType = "subscription" } = body;

    if (!phoneNumber || !countryCode) {
      return NextResponse.json(
        { error: "phoneNumber and countryCode are required" },
        { status: 400 }
      );
    }

    if (numberType !== "subscription" && numberType !== "one_time_otp") {
      return NextResponse.json(
        { error: "Invalid numberType. Must be 'subscription' or 'one_time_otp'" },
        { status: 400 }
      );
    }

    // Calculate pricing with current markup
    const markupPercentage = await getPhoneNumbersMarkup();
    const twilioMonthlyCost = 1.0; // Base Twilio cost
    const monthlyCost = await getDefaultMonthlyCost(countryCode, markupPercentage);
    const countryName = getCountryName(countryCode);

    // Calculate actual cost based on number type
    let actualCost: number;
    if (numberType === "one_time_otp") {
      const { getOneTimeOTPPricing } = await import("@/lib/twilio/costs");
      actualCost = await getOneTimeOTPPricing(monthlyCost);
    } else {
      actualCost = monthlyCost;
    }

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

    if (currentBalance < actualCost) {
      return NextResponse.json(
        {
          error: "Insufficient wallet balance",
          required: actualCost,
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
      
      // Provide helpful error messages for common issues
      let errorMessage = twilioError.message || "Failed to purchase number";
      
      // Handle bundle requirement errors
      if (errorMessage.toLowerCase().includes("bundle") || 
          errorMessage.toLowerCase().includes("regulatory") ||
          errorMessage.toLowerCase().includes("compliance")) {
        errorMessage = `This mobile number requires a Twilio Bundle for regulatory compliance in ${countryName}. ` +
          `\n\nTo fix this:\n` +
          `1. Try selecting a "Local" number type instead (filter by "Local" in the filters)\n` +
          `2. Or choose a different country that doesn't require bundles\n\n` +
          `Note: Bundles require address verification and business registration in Twilio, which is not available through this platform.`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    // Step 3: Deduct from wallet
    const walletResult = await purchaseWithWallet(
      user.id,
      actualCost,
      `Virtual number purchase: ${purchasedNumber.phoneNumber} (${numberType})`
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
      // For one-time OTP numbers, don't set monthly_cost or expires_at
      const expiresAt =
        numberType === "one_time_otp"
          ? null // No expiry for one-time numbers
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days for subscription

      const insertData: any = {
        user_id: user.id,
        phone_number: purchasedNumber.phoneNumber,
        country_code: countryCode,
        country_name: countryName,
        twilio_sid: purchasedNumber.sid,
        status: "active",
        capabilities: purchasedNumber.capabilities.SMS ? ["sms"] : [],
        twilio_monthly_cost: twilioMonthlyCost,
        number_type: numberType,
      };

      // Only set monthly_cost and expires_at for subscription numbers
      if (numberType === "subscription") {
        insertData.monthly_cost = monthlyCost;
        insertData.expires_at = expiresAt;
      } else {
        // For one-time numbers, set to null
        insertData.monthly_cost = null;
        insertData.expires_at = null;
      }

      const { data: virtualNumber, error: numberError } = await supabase
        .from("virtual_numbers")
        .insert(insertData)
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
          actualCost,
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
          amount: actualCost,
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
          user_charged: actualCost,
          metadata: {
            phone_number: purchasedNumber.phoneNumber,
            country_code: countryCode,
            number_type: numberType,
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
        message: `Successfully purchased ${purchasedNumber.phoneNumber} (${numberType === "one_time_otp" ? "One-Time OTP" : "Subscription"})`,
        data: {
          type: "number_purchased",
          number: purchasedNumber.phoneNumber,
          number_id: virtualNumber.id,
          amount: actualCost,
          number_type: numberType,
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
          number_type: virtualNumber.number_type,
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
          actualCost,
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

