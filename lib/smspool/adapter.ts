
import { smsPoolClient } from "./client";
import { sendPushNotificationToUser } from "@/lib/notifications/push";

function extractCode(message: string): string | null {
  const match = message.match(/\b\d{4,8}\b/);
  return match ? match[0] : null;
}

function parseTimestamp(value?: string): string {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value.replace(" ", "T") + "Z");
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

/**
 * Polls SMSPool for an OTP on a one-time activation number.
 * orderId = the order_id returned at purchase.
 */
export async function syncSmsPoolActivation(
  numberId: string,
  orderId: string,
  supabase: any,
  options?: {
    attempts?: number;
    delayMs?: number;
  }
) {
  try {
    const attempts = Math.max(1, options?.attempts ?? 6);
    const delayMs = Math.max(250, options?.delayMs ?? 2000);

    let content: string | undefined;

    for (let i = 0; i < attempts; i++) {
      const result = await smsPoolClient.checkSMS(orderId);
      content = result.full_sms || result.sms;
      if (content) break;
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    if (!content) return;
    const code = extractCode(content);

    const { data: existing } = await supabase
      .from("messages")
      .select("id")
      .eq("number_id", numberId)
      .eq("body", content)
      .maybeSingle();

    if (!existing) {
      await supabase.from("messages").insert({
        number_id: numberId,
        direction: "inbound",
        body: content,
        is_otp: !!code,
        otp_code: code,
        created_at: new Date().toISOString(),
      });

      if (code) {
        const { data: existingOtp } = await supabase
          .from("otp_codes")
          .select("id")
          .eq("number_id", numberId)
          .eq("code", code)
          .maybeSingle();

        if (!existingOtp) {
          await supabase.from("otp_codes").insert({
            number_id: numberId,
            code,
            status: "pending",
            created_at: new Date().toISOString(),
          });

          const { data: numberMeta } = await supabase
            .from("virtual_numbers")
            .select("user_id, phone_number")
            .eq("id", numberId)
            .maybeSingle();

          if (numberMeta?.user_id) {
            await sendPushNotificationToUser(numberMeta.user_id, {
              title: "New OTP Received",
              body: `OTP ${code} arrived for ${numberMeta.phone_number ?? "your number"}`,
              data: { type: "otp", number_id: numberId, code },
            });
          }
        }
      }

      await supabase
        .from("virtual_numbers")
        .update({ status: "active" })
        .eq("id", numberId);
    }
  } catch (error) {
    console.error("[smspool] Activation sync error:", error);
  }
}

/**
 * Polls SMSPool for messages on a rental number.
 * rentalCode = the rental_code returned at rental purchase.
 */
export async function syncSmsPoolRental(
  numberId: string,
  rentalCode: string,
  supabase: any
) {
  try {
    const result = await smsPoolClient.getRentalMessages(rentalCode);
    if (!result.success || !Array.isArray(result.messages) || result.messages.length === 0) return;

    for (const msg of result.messages) {
      const content = msg.message;
      if (!content) continue;

      const code = extractCode(content);

      const { data: existing } = await supabase
        .from("messages")
        .select("id")
        .eq("number_id", numberId)
        .eq("body", content)
        .maybeSingle();

      if (!existing) {
        await supabase.from("messages").insert({
          number_id: numberId,
          direction: "inbound",
          from_number: msg.sender || null,
          body: content,
          is_otp: !!code,
          otp_code: code,
          created_at: parseTimestamp(msg.timestamp || msg.date),
        });

        if (code) {
          const { data: existingOtp } = await supabase
            .from("otp_codes")
            .select("id")
            .eq("number_id", numberId)
            .eq("code", code)
            .maybeSingle();

          if (!existingOtp) {
            await supabase.from("otp_codes").insert({
              number_id: numberId,
              code,
              status: "pending",
              created_at: new Date().toISOString(),
            });

            const { data: numberMeta } = await supabase
              .from("virtual_numbers")
              .select("user_id, phone_number")
              .eq("id", numberId)
              .maybeSingle();

            if (numberMeta?.user_id) {
              await sendPushNotificationToUser(numberMeta.user_id, {
                title: "New OTP Received",
                body: `OTP ${code} arrived for ${numberMeta.phone_number ?? "your number"}`,
                data: { type: "otp", number_id: numberId, code },
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("[smspool] Rental sync error:", error);
  }
}
