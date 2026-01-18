import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { releaseNumber } from "@/lib/twilio/numbers";
import { refundToWallet } from "@/lib/wallet/purchase";

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

    // Optionally refund prorated amount (implement if needed)
    // For now, we'll just cancel without refund

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/numbers/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}








