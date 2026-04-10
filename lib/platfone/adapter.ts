import { platfoneClient } from "./client";

function extractCode(message: string): string | null {
  const match = message.match(/\b\d{4,8}\b/);
  return match ? match[0] : null;
}

/**
 * Syncs Platfone activation status and SMS/OTP into the database.
 * `customerId` = the SocialBooster user.id used as Platfone customer_id.
 * `activationId` = the Platfone activation_id stored in textverified_id.
 */
export async function syncPlatfoneActivation(
  numberId: string,
  activationId: string,
  supabase: any,
  customerId?: string
) {
  try {
    // Resolve customerId from DB if not passed
    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId) {
      const { data: num } = await supabase
        .from("virtual_numbers")
        .select("user_id")
        .eq("id", numberId)
        .single();
      resolvedCustomerId = num?.user_id;
    }
    if (!resolvedCustomerId) return;

    const activation = await platfoneClient.getActivation(resolvedCustomerId, activationId);

    // Cancelled or expired → mark number accordingly
    if (activation.activation_status === "canceled" || activation.activation_status === "expired") {
      await supabase
        .from("virtual_numbers")
        .update({ status: activation.activation_status === "expired" ? "EXPIRED" : "CANCELLED" })
        .eq("id", numberId);
      return;
    }

    // SMS received
    const smsReceived =
      activation.sms_status === "smsReceived" ||
      activation.sms_status === "retryReceived";

    if (smsReceived && (activation.sms_text || activation.sms_code)) {
      const smsText = activation.sms_text ?? activation.sms_code ?? "";
      const code = activation.sms_code ?? extractCode(smsText);
      const content = smsText || code!;

      const { data: existing } = await supabase
        .from("messages")
        .select("id")
        .eq("number_id", numberId)
        .eq("otp_code", code ?? content)
        .maybeSingle();

      if (!existing) {
        await supabase.from("messages").insert({
          number_id: numberId,
          direction: "inbound",
          body: content,
          is_otp: !!code,
          otp_code: code ?? content,
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
          .update({ status: "RECEIVED" })
          .eq("id", numberId);
      }
    }
  } catch (error) {
    console.error("[platfone] Activation sync error:", error);
  }
}
