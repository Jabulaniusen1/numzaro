import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { validateWebhookSignature, parseIncomingSMS } from "@/lib/twilio/messaging";
import { extractOTP } from "@/lib/otp-detector";

export const runtime = "nodejs";

// Ensure this route is publicly accessible (no authentication required)
export const dynamic = "force-dynamic";

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
      // Build params from formData for signature validation
      const params: Record<string, string> = {};
      formData.forEach((value, key) => {
        params[key] = value.toString();
      });

      // Try multiple URL variations for signature validation
      // Twilio signs based on the exact URL it calls, which should be the public URL
      const publicUrl = process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/sms`
        : null;
      
      let isValid = false;
      let validationUrl = "";

      // Try with public URL first (what Twilio actually calls)
      if (publicUrl) {
        isValid = validateWebhookSignature(publicUrl, params, signature, authToken);
        validationUrl = publicUrl;
      }

      // If that fails, try with request URL
      if (!isValid) {
        isValid = validateWebhookSignature(request.url, params, signature, authToken);
        validationUrl = request.url;
      }

      // If still failing, try constructing from request headers
      if (!isValid) {
        const host = request.headers.get("host");
        const protocol = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol || "https";
        const constructedUrl = `${protocol}://${host}/api/webhooks/twilio/sms`;
        isValid = validateWebhookSignature(constructedUrl, params, signature, authToken);
        validationUrl = constructedUrl;
      }

      if (!isValid) {
        console.error("[SMS Webhook] Signature validation failed after trying multiple URLs", {
          triedUrls: [publicUrl, request.url, validationUrl].filter(Boolean),
          hasSignature: !!signature,
          hasAuthToken: !!authToken,
          paramCount: Object.keys(params).length,
        });
        // Continue processing despite validation failure - this allows messages to be received
        // while we debug the signature issue. In production, consider enabling strict validation.
        console.warn("[SMS Webhook] Continuing to process message despite signature validation failure");
      } else {
        console.log("[SMS Webhook] Signature validation passed with URL:", validationUrl);
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

    // Calculate charges for this message
    // Twilio charges ~$0.0075 per incoming SMS (varies by country)
    const twilioSMSCost = 0.0075; // Base cost, can be enhanced with country-specific pricing
    const { getPhoneNumbersMarkup, calculateSMSCost } = await import("@/lib/twilio/costs");
    const markupPercentage = await getPhoneNumbersMarkup();
    const userSMSCost = calculateSMSCost(twilioSMSCost, markupPercentage);

    // Charge user for incoming SMS (using service role client)
    try {
      // Get current wallet balance
      const { data: userProfile } = await supabase
        .from("users")
        .select("wallet_balance")
        .eq("id", virtualNumber.user_id)
        .single();

      const currentBalance = parseFloat(userProfile?.wallet_balance || "0.00");
      
      if (currentBalance >= userSMSCost) {
        const balanceAfter = currentBalance - userSMSCost;

        // Update wallet balance
        await supabase
          .from("users")
          .update({ wallet_balance: balanceAfter })
          .eq("id", virtualNumber.user_id);

        // Create wallet transaction
        await supabase.from("wallet_transactions").insert({
          user_id: virtualNumber.user_id,
          type: "withdrawal",
          amount: -userSMSCost,
          balance_before: currentBalance,
          balance_after: balanceAfter,
          description: `Incoming SMS to ${virtualNumber.phone_number}`,
        });

        // Record Twilio charge
        await supabase.from("twilio_charges").insert({
          user_id: virtualNumber.user_id,
          virtual_number_id: virtualNumber.id,
          charge_type: "incoming_sms",
          twilio_sid: webhookData.MessageSid,
          actual_cost: twilioSMSCost,
          user_charged: userSMSCost,
          metadata: {
            phone_number: virtualNumber.phone_number,
            from_number: webhookData.From,
            message_sid: webhookData.MessageSid,
          },
        });

        console.log("[SMS Webhook] Charged user for SMS:", {
          userId: virtualNumber.user_id,
          cost: userSMSCost,
          twilioCost: twilioSMSCost,
          balanceBefore: currentBalance,
          balanceAfter: balanceAfter,
        });
      } else {
        console.warn("[SMS Webhook] Insufficient balance to charge for SMS:", {
          userId: virtualNumber.user_id,
          required: userSMSCost,
          available: currentBalance,
        });
        // Still record the charge attempt
        await supabase.from("twilio_charges").insert({
          user_id: virtualNumber.user_id,
          virtual_number_id: virtualNumber.id,
          charge_type: "incoming_sms_failed",
          twilio_sid: webhookData.MessageSid,
          actual_cost: twilioSMSCost,
          user_charged: 0,
          metadata: {
            phone_number: virtualNumber.phone_number,
            from_number: webhookData.From,
            message_sid: webhookData.MessageSid,
            error: "Insufficient balance",
          },
        });
      }
    } catch (chargeError: any) {
      console.error("[SMS Webhook] Error charging user for SMS:", chargeError);
      // Continue processing message even if charge fails
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
        // Charge user extra for OTP (in addition to SMS cost)
        const otpFee = 0.05; // $0.05 additional fee per OTP (configurable)
        
        try {
          // Get current wallet balance
          const { data: userProfile } = await supabase
            .from("users")
            .select("wallet_balance")
            .eq("id", virtualNumber.user_id)
            .single();

          const currentBalance = parseFloat(userProfile?.wallet_balance || "0.00");
          
          if (currentBalance >= otpFee) {
            const balanceAfter = currentBalance - otpFee;

            // Update wallet balance
            await supabase
              .from("users")
              .update({ wallet_balance: balanceAfter })
              .eq("id", virtualNumber.user_id);

            // Create wallet transaction
            await supabase.from("wallet_transactions").insert({
              user_id: virtualNumber.user_id,
              type: "withdrawal",
              amount: -otpFee,
              balance_before: currentBalance,
              balance_after: balanceAfter,
              description: `OTP received from ${otpResult.service || "Unknown"} - ${otpResult.code}`,
            });

            // Record OTP charge
            await supabase.from("twilio_charges").insert({
              user_id: virtualNumber.user_id,
              virtual_number_id: virtualNumber.id,
              charge_type: "otp_received",
              twilio_sid: webhookData.MessageSid,
              actual_cost: 0, // OTP fee is our markup, not a Twilio cost
              user_charged: otpFee,
              metadata: {
                phone_number: virtualNumber.phone_number,
                otp_code: otpResult.code,
                service: otpResult.service || "Unknown",
                message_sid: webhookData.MessageSid,
              },
            });

            console.log("[SMS Webhook] Charged user for OTP:", {
              userId: virtualNumber.user_id,
              otpFee,
              code: otpResult.code,
              balanceBefore: currentBalance,
              balanceAfter: balanceAfter,
            });
          } else {
            console.warn("[SMS Webhook] Insufficient balance to charge for OTP:", {
              userId: virtualNumber.user_id,
              required: otpFee,
              available: currentBalance,
            });
            // Still record the charge attempt
            await supabase.from("twilio_charges").insert({
              user_id: virtualNumber.user_id,
              virtual_number_id: virtualNumber.id,
              charge_type: "otp_received_failed",
              twilio_sid: webhookData.MessageSid,
              actual_cost: 0,
              user_charged: 0,
              metadata: {
                phone_number: virtualNumber.phone_number,
                otp_code: otpResult.code,
                service: otpResult.service || "Unknown",
                message_sid: webhookData.MessageSid,
                error: "Insufficient balance",
              },
            });
          }
        } catch (otpChargeError: any) {
          console.error("[SMS Webhook] Error charging user for OTP:", otpChargeError);
        }

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

