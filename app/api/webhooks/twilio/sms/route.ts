import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { validateWebhookSignature, parseIncomingSMS } from "@/lib/twilio/messaging";
import { extractOTP } from "@/lib/otp-detector";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    console.log("[SMS Webhook] ===== WEBHOOK CALLED =====");
    console.log("[SMS Webhook] URL:", request.url);
    console.log("[SMS Webhook] Headers:", {
      "content-type": request.headers.get("content-type"),
      "x-twilio-signature": request.headers.get("x-twilio-signature") ? "present" : "missing",
    });
    
    // Get raw body for signature validation
    const formData = await request.formData();
    const webhookData = parseIncomingSMS(formData);

    console.log("[SMS Webhook] Received message:", {
      from: webhookData.From,
      to: webhookData.To,
      body: webhookData.Body.substring(0, 100), // Log first 100 chars
      messageSid: webhookData.MessageSid,
    });

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
        console.error("[SMS Webhook] Invalid Twilio webhook signature");
        return new NextResponse("Invalid signature", { status: 403 });
      }
    } else {
      console.warn("[SMS Webhook] Skipping signature validation (no signature or auth token)");
    }

    // Use service role client for database operations
    const supabase = createServiceRoleClient();

    // Find virtual number by phone number
    // Twilio sends numbers in E.164 format (+1234567890)
    // Try exact match first, then try without + prefix
    let virtualNumber = null;
    let numberError = null;
    
    // Try exact match first
    const { data: exactMatch, error: exactError } = await supabase
      .from("virtual_numbers")
      .select("id, user_id, phone_number")
      .eq("phone_number", webhookData.To)
      .maybeSingle();
    
    if (exactMatch) {
      virtualNumber = exactMatch;
    } else {
      // Try without + prefix
      const toWithoutPlus = webhookData.To.startsWith("+") ? webhookData.To.slice(1) : webhookData.To;
      const { data: noPlusMatch, error: noPlusError } = await supabase
        .from("virtual_numbers")
        .select("id, user_id, phone_number")
        .eq("phone_number", toWithoutPlus)
        .maybeSingle();
      
      if (noPlusMatch) {
        virtualNumber = noPlusMatch;
      } else {
        // Try with + prefix if it wasn't there
        const toWithPlus = webhookData.To.startsWith("+") ? webhookData.To : `+${webhookData.To}`;
        const { data: withPlusMatch, error: withPlusError } = await supabase
          .from("virtual_numbers")
          .select("id, user_id, phone_number")
          .eq("phone_number", toWithPlus)
          .maybeSingle();
        
        if (withPlusMatch) {
          virtualNumber = withPlusMatch;
        } else {
          numberError = exactError || noPlusError || withPlusError;
        }
      }
    }

    if (numberError || !virtualNumber) {
      console.error("[SMS Webhook] Virtual number not found:", {
        to: webhookData.To,
        error: numberError,
        message: "This number may not be registered in our system",
        attempts: [
          `Exact: ${webhookData.To}`,
          `Without +: ${webhookData.To.startsWith("+") ? webhookData.To.slice(1) : "N/A"}`,
          `With +: ${webhookData.To.startsWith("+") ? "N/A" : `+${webhookData.To}`}`,
        ],
      });
      
      // Log all numbers in database for debugging
      const { data: allNumbers } = await supabase
        .from("virtual_numbers")
        .select("phone_number, id, status")
        .limit(10);
      console.log("[SMS Webhook] Available numbers in database:", allNumbers?.map(n => ({
        phone_number: n.phone_number,
        id: n.id,
        status: n.status,
      })));
      
      // Try case-insensitive and normalized matching
      const normalizedTo = webhookData.To.replace(/\s+/g, "").trim();
      const { data: normalizedMatch } = await supabase
        .from("virtual_numbers")
        .select("id, user_id, phone_number")
        .ilike("phone_number", `%${normalizedTo.replace(/^\+/, "")}%`)
        .maybeSingle();
      
      if (normalizedMatch) {
        console.log("[SMS Webhook] Found number with normalized matching:", normalizedMatch);
        virtualNumber = normalizedMatch;
      }
      
      // Return 200 to Twilio even if number not found (to avoid retries)
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        {
          status: 200,
          headers: { "Content-Type": "text/xml" },
        }
      );
    }

    console.log("[SMS Webhook] Found virtual number:", {
      numberId: virtualNumber.id,
      phoneNumber: virtualNumber.phone_number,
      userId: virtualNumber.user_id,
    });

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
    
    console.log("[SMS Webhook] OTP Detection:", {
      detected: !!otpResult.code,
      code: otpResult.code,
      service: otpResult.service,
      messagePreview: webhookData.Body.substring(0, 200),
    });

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

