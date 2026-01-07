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
        // Continue for now
      }
    }

    // Parse call webhook payload
    const provider = getTelecomProvider();
    const callData = provider.parseCallWebhook(payload);

    // Find the phone number in our database
    // Try both from and to numbers
    const { data: phoneNumber } = await supabase
      .from("phone_numbers")
      .select("id, user_id")
      .or(`number.eq.${callData.to},number.eq.${callData.from}`)
      .eq("status", "active")
      .single();

    if (!phoneNumber) {
      console.warn(`Received call event for unknown number`);
      return NextResponse.json({ received: true });
    }

    // Store call log
    const { error: insertError } = await supabase
      .from("call_logs")
      .insert({
        number_id: phoneNumber.id,
        direction: callData.direction,
        from_number: callData.from,
        to_number: callData.to,
        duration: callData.duration,
        recording_url: callData.recordingUrl,
        status: callData.status,
        provider_call_id: callData.callId,
        timestamp: callData.timestamp,
      });

    if (insertError) {
      console.error("Error storing call log:", insertError);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Call webhook error:", error);
    // Return 200 to prevent webhook retries for non-critical errors
    return NextResponse.json({ received: true, error: error.message });
  }
}

