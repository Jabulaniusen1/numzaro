import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getTelecomProvider } from "@/lib/telecom";

export async function POST(request: NextRequest) {
  try {
    // Use service role client to bypass RLS for webhook operations
    const supabase = createServiceRoleClient();

    // Get provider name
    const providerName = process.env.TELECOM_PROVIDER?.toLowerCase() || "twilio";
    
    // Handle different payload formats
    let payload: any;
    let body: string;
    
    if (providerName === "twilio") {
      // Twilio sends form-encoded data
      const formData = await request.formData();
      body = new URLSearchParams(formData as any).toString();
      payload = Object.fromEntries(formData);
    } else {
      // Telnyx sends JSON
      body = await request.text();
      payload = JSON.parse(body);
    }

    // Get signature from headers (provider-specific)
    let signature = "";
    if (providerName === "telnyx") {
      signature = request.headers.get("x-telnyx-signature-ed25519") || 
                  request.headers.get("x-signature") || 
                  request.headers.get("signature") || "";
    } else if (providerName === "twilio") {
      signature = request.headers.get("x-twilio-signature") || "";
    }

    // Verify webhook signature
    let webhookSecret = "";
    if (providerName === "telnyx") {
      webhookSecret = process.env.TELNYX_WEBHOOK_SECRET || process.env.TELNYX_API_KEY || "";
    } else if (providerName === "twilio") {
      webhookSecret = process.env.TWILIO_AUTH_TOKEN || "";
      // For Twilio, we need to verify using the full URL
      // This uses the TwiML library's validation if available
    }
    
    if (webhookSecret && signature && providerName !== "twilio") {
      // Twilio signature verification requires the full URL - skip for now
      // In production, use twilio.validateRequest() or implement full URL verification
      try {
        const provider = getTelecomProvider();
        const isValid = provider.verifyWebhookSignature(
          body,
          signature,
          webhookSecret
        );

        if (!isValid) {
          console.error("Invalid webhook signature");
          return NextResponse.json(
            { error: "Invalid signature" },
            { status: 401 }
          );
        }
      } catch (sigError) {
        console.error("Signature verification error:", sigError);
        // Continue for now - can be made stricter in production
      }
    }

    // Parse SMS webhook payload
    const provider = getTelecomProvider();
    const smsData = provider.parseSMSWebhook(payload);

    // Find the phone number in our database
    const { data: phoneNumber } = await supabase
      .from("phone_numbers")
      .select("id, type, user_id")
      .eq("number", smsData.to)
      .eq("status", "active")
      .single();

    if (!phoneNumber) {
      console.warn(`Received SMS for unknown number: ${smsData.to}`);
      return NextResponse.json({ received: true });
    }

    // Store SMS message
    const { error: insertError } = await supabase
      .from("sms_messages")
      .insert({
        number_id: phoneNumber.id,
        direction: "inbound",
        message: smsData.message,
        from_number: smsData.from,
        to_number: smsData.to,
        provider_message_id: smsData.messageId,
        timestamp: smsData.timestamp,
      });

    if (insertError) {
      console.error("Error storing SMS:", insertError);
    }

    // Handle OTP number logic
    if (phoneNumber.type === "otp") {
      // Create or update OTP session
      const { data: existingSession } = await supabase
        .from("otp_sessions")
        .select("id")
        .eq("number_id", phoneNumber.id)
        .eq("used", false)
        .single();

      if (existingSession) {
        // Update existing session with the SMS message
        await supabase
          .from("otp_sessions")
          .update({
            sms_message: smsData.message,
            used: true, // Mark as used since we received the OTP
          })
          .eq("id", existingSession.id);
      } else {
        // Create new OTP session
        await supabase.from("otp_sessions").insert({
          number_id: phoneNumber.id,
          service_name: "Unknown", // Could be extracted from message if needed
          sms_message: smsData.message,
          used: true,
        });
      }

      // Mark OTP number as expired/released (one-time use)
      await supabase
        .from("phone_numbers")
        .update({ status: "expired" })
        .eq("id", phoneNumber.id);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("SMS webhook error:", error);
    // Return 200 to prevent webhook retries for non-critical errors
    return NextResponse.json({ received: true, error: error.message });
  }
}

