import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { releaseNumber } from "@/lib/twilio/numbers";
import { refundToWallet } from "@/lib/wallet/purchase";
import { getDefaultMonthlyCost, getPhoneNumbersMarkup } from "@/lib/twilio/costs";
import { fiveSimClient } from "@/lib/5sim/client";

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

    // Provider specific cancellation
    if (number.provider === "5sim") {
      try {
        await fiveSimClient.cancelOrder(number.fivsim_order_id);
      } catch (e: any) {
        console.error("5Sim cancel error:", e);
      }
    } else {
      // Release number from Twilio
      try {
        await releaseNumber(number.twilio_sid);
      } catch (twilioError: any) {
        console.error("Error releasing number from Twilio:", twilioError);
      }
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

    return NextResponse.json({ success: true });
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

    if (number.provider === "5sim") {
      const orderId = number.fivsim_order_id;
      try {
        if (action === "cancel") {
          await fiveSimClient.cancelOrder(orderId);
          await supabase.from("virtual_numbers").update({ status: "CANCELED" }).eq("id", number.id);
          return NextResponse.json({ success: true });
        } else if (action === "finish") {
          await fiveSimClient.finishOrder(orderId);
          await supabase.from("virtual_numbers").update({ status: "FINISHED" }).eq("id", number.id);
          return NextResponse.json({ success: true });
        } else if (action === "ban") {
          await fiveSimClient.banOrder(orderId);
          await supabase.from("virtual_numbers").update({ status: "BANNED" }).eq("id", number.id);
          return NextResponse.json({ success: true });
        }
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    }

    if (action === "configure_webhook") {
      const { webhookUrl } = body;
      if (!webhookUrl) return NextResponse.json({ error: "webhookUrl is required" }, { status: 400 });
      try {
        const { configureNumberWebhook } = await import("@/lib/twilio/numbers");
        await configureNumberWebhook(number.twilio_sid, webhookUrl);
        return NextResponse.json({ success: true });
      } catch (twilioError: any) {
        return NextResponse.json({ error: twilioError.message }, { status: 500 });
      }
    }

    if (action === "renew") {
      if (number.number_type === "one_time_otp") return NextResponse.json({ error: "One-time OTP numbers cannot be renewed" }, { status: 400 });
      // ... renewal logic ...
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
