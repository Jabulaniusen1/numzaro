import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { validateWebhookSignature, parseIncomingSMS } from "@/lib/twilio/messaging";
import { extractOTP } from "@/lib/otp-detector";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature validation
    const formData = await request.formData();
    const webhookData = parseIncomingSMS(formData);

    // Validate webhook signature
    const signature = request.headers.get("X-Twilio-Signature");
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (signature && authToken) {
      const url = request.url;
      const params: Record<string, string> = {};
      formData.forEach((value, key) => {
        params[key] = value.toString();
      });

      const isValid = validateWebhookSignature(url, params, signature, authToken);

      if (!isValid) {
        console.error("Invalid Twilio webhook signature");
        return new NextResponse("Invalid signature", { status: 403 });
      }
    }

    // Use service role client for database operations
    const supabase = createServiceRoleClient();

    // Find virtual number by phone number
    const { data: virtualNumber, error: numberError } = await supabase
      .from("virtual_numbers")
      .select("id, user_id, phone_number")
      .eq("phone_number", webhookData.To)
      .single();

    if (numberError || !virtualNumber) {
      console.error("Virtual number not found:", webhookData.To, numberError);
      // Return 200 to Twilio even if number not found (to avoid retries)
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        {
          status: 200,
          headers: { "Content-Type": "text/xml" },
        }
      );
    }

    // Store message in database
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        number_id: virtualNumber.id,
        direction: "inbound",
        from_number: webhookData.From,
        to_number: webhookData.To,
        body: webhookData.Body,
        message_type: "sms",
        twilio_message_sid: webhookData.MessageSid,
      })
      .select()
      .single();

    if (messageError) {
      console.error("Error storing message:", messageError);
      // Still return 200 to Twilio
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        {
          status: 200,
          headers: { "Content-Type": "text/xml" },
        }
      );
    }

    // Detect OTP
    const otpResult = extractOTP(webhookData.Body);

    if (otpResult.code) {
      // Mark message as OTP
      await supabase
        .from("messages")
        .update({
          is_otp: true,
          otp_code: otpResult.code,
          otp_service: otpResult.service || null,
        })
        .eq("id", message.id);

      // Store in otp_codes table
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      const { data: otpCode, error: otpError } = await supabase
        .from("otp_codes")
        .insert({
          number_id: virtualNumber.id,
          code: otpResult.code,
          service_name: otpResult.service || null,
          sender_number: webhookData.From,
          status: "pending",
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (otpError) {
        console.error("Error storing OTP:", otpError);
      } else {
        // Create notification for OTP
        await supabase.from("notifications").insert({
          user_id: virtualNumber.user_id,
          type: "transaction",
          title: `New OTP from ${otpResult.service || "Unknown"}`,
          message: `OTP Code: ${otpResult.code}`,
          data: {
            type: "otp_received",
            code: otpResult.code,
            service: otpResult.service || "Unknown",
            number: virtualNumber.phone_number,
            number_id: virtualNumber.id,
            otp_id: otpCode.id,
          },
        });
      }
    } else {
      // Create notification for regular message
      await supabase.from("notifications").insert({
        user_id: virtualNumber.user_id,
        type: "transaction",
        title: "New Message Received",
        message: webhookData.Body.substring(0, 100),
        data: {
          type: "message_received",
          from: webhookData.From,
          body: webhookData.Body.substring(0, 100),
          number: virtualNumber.phone_number,
          number_id: virtualNumber.id,
          message_id: message.id,
        },
      });
    }

    // Return Twilio XML response
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      }
    );
  } catch (error: any) {
    console.error("Error processing SMS webhook:", error);
    // Return 200 to Twilio to avoid retries
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      }
    );
  }
}

