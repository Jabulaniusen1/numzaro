
import { smsPoolClient } from "./client";

function extractCode(message: string): string | null {
  const match = message.match(/\b\d{4,8}\b/);
  return match ? match[0] : null;
}

/**
 * Polls SMSPool for an OTP on a one-time activation number.
 * orderId = the order_id returned at purchase.
 */
export async function syncSmsPoolActivation(
  numberId: string,
  orderId: string,
  supabase: any
) {
  try {
    const result = await smsPoolClient.checkSMS(orderId);
    // status 2 = received, 1 = waiting, 3 = cancelled
    if (result.status !== 2 || !result.sms) return;

    const content = result.full_sms || result.sms;
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
          }
        }
      }
    }
  } catch (error) {
    console.error("[smspool] Rental sync error:", error);
  }
}
