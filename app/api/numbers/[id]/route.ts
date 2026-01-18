import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { releaseNumber } from "@/lib/twilio/numbers";
import { refundToWallet } from "@/lib/wallet/purchase";
import { getDefaultMonthlyCost, getPhoneNumbersMarkup } from "@/lib/twilio/costs";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: number, error } = await supabase
      .from("virtual_numbers")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (error || !number) {
      return NextResponse.json(
        { error: "Number not found" },
        { status: 404 }
      );
    }

    // Get message count
    const { count: messageCount } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("number_id", number.id);

    // Get OTP count
    const { count: otpCount } = await supabase
      .from("otp_codes")
      .select("*", { count: "exact", head: true })
      .eq("number_id", number.id);

    return NextResponse.json({
      ...number,
      message_count: messageCount || 0,
      otp_count: otpCount || 0,
    });
  } catch (error: any) {
    console.error("Error in GET /api/numbers/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get number details
    const { data: number, error: fetchError } = await supabase
      .from("virtual_numbers")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !number) {
      return NextResponse.json(
        { error: "Number not found" },
        { status: 404 }
      );
    }

    if (number.status === "cancelled") {
      return NextResponse.json(
        { error: "Number is already cancelled" },
        { status: 400 }
      );
    }

    // Release number from Twilio
    try {
      await releaseNumber(number.twilio_sid);
    } catch (twilioError: any) {
      console.error("Error releasing number from Twilio:", twilioError);
      // Continue with cancellation even if Twilio release fails
    }

    // Calculate prorated refund (days remaining in current billing period)
    const now = new Date();
    const expiresAt = new Date(number.expires_at);
    const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const daysInMonth = 30; // Assuming monthly billing
    const proratedRefund = daysRemaining > 0 && daysRemaining < daysInMonth
      ? (daysRemaining / daysInMonth) * parseFloat(number.monthly_cost.toString())
      : 0;

    // Update status in database
    const { error: updateError } = await supabase
      .from("virtual_numbers")
      .update({ status: "cancelled" })
      .eq("id", params.id);

    if (updateError) {
      console.error("Error updating number status:", updateError);
      return NextResponse.json(
        { error: "Failed to cancel number" },
        { status: 500 }
      );
    }

    // Refund prorated amount if applicable
    if (proratedRefund > 0) {
      await refundToWallet(
        user.id,
        proratedRefund,
        `Prorated refund for cancelled number: ${number.phone_number}`
      );
    }

    return NextResponse.json({ 
      success: true,
      refund: proratedRefund > 0 ? proratedRefund : undefined
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/numbers/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Get number details
    const { data: number, error: fetchError } = await supabase
      .from("virtual_numbers")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !number) {
      return NextResponse.json(
        { error: "Number not found" },
        { status: 404 }
      );
    }

    if (action === "renew") {
      // Renew number - extend expiry by 30 days
      const currentExpires = new Date(number.expires_at);
      const newExpires = new Date(currentExpires.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      // Get current markup and calculate monthly cost
      const markupPercentage = await getPhoneNumbersMarkup();
      const monthlyCost = await getDefaultMonthlyCost(number.country_code, markupPercentage);

      // Check wallet balance
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

      // Deduct from wallet
      const { purchaseWithWallet } = await import("@/lib/wallet/purchase");
      const walletResult = await purchaseWithWallet(
        user.id,
        monthlyCost,
        `Number renewal: ${number.phone_number}`
      );

      if (!walletResult.success) {
        return NextResponse.json(
          { error: walletResult.error || "Failed to deduct from wallet" },
          { status: 500 }
        );
      }

      // Update expiry date
      const { error: updateError } = await supabase
        .from("virtual_numbers")
        .update({ 
          expires_at: newExpires.toISOString(),
          status: "active" // Ensure it's active
        })
        .eq("id", params.id);

      if (updateError) {
        // Rollback wallet transaction
        const { refundToWallet } = await import("@/lib/wallet/purchase");
        await refundToWallet(
          user.id,
          monthlyCost,
          `Refund for failed renewal: ${number.phone_number}`
        );

        return NextResponse.json(
          { error: "Failed to renew number" },
          { status: 500 }
        );
      }

      // Create twilio_charges record
      await supabase.from("twilio_charges").insert({
        user_id: user.id,
        virtual_number_id: number.id,
        charge_type: "number_renewal",
        twilio_sid: number.twilio_sid,
        actual_cost: parseFloat(number.twilio_monthly_cost.toString()),
        user_charged: monthlyCost,
        metadata: {
          phone_number: number.phone_number,
          renewed_until: newExpires.toISOString(),
        },
      });

      return NextResponse.json({
        success: true,
        expires_at: newExpires.toISOString(),
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error in PATCH /api/numbers/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}








