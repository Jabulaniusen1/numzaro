import { textverifiedClient } from "@/lib/textverified/client";

const COMPLETED_STATES = new Set([
  "verificationCompleted",
  "verificationReused",
  "verificationReactivated",
]);

const CANCELLED_STATES = new Set([
  "verificationCanceled",
  "verificationTimedOut",
  "verificationReported",
  "verificationRefunded",
]);

const RENTAL_ACTIVE_STATES = new Set([
  "renewableActive",
  "renewableOverdue",
  "nonrenewableActive",
]);

const RENTAL_CANCELLED_STATES = new Set([
  "renewableExpired",
  "renewableRefunded",
  "nonrenewableExpired",
  "nonrenewableRefunded",
]);

export async function syncTextverifiedVerification(
  numberId: string,
  verificationId: string,
  supabase: any
) {
  try {
    const verification = await textverifiedClient.getVerification(verificationId);
    const state = verification?.state;

    if (verification?.endsAt) {
      const parsedEndsAt = new Date(verification.endsAt);
      if (!Number.isNaN(parsedEndsAt.getTime())) {
        await supabase
          .from("virtual_numbers")
          .update({ expires_at: parsedEndsAt.toISOString() })
          .eq("id", numberId);
      }
    }

    const isCancelled = CANCELLED_STATES.has(state);

    if (isCancelled) {
      await supabase
        .from("virtual_numbers")
        .update({ status: "cancelled" })
        .eq("id", numberId);
    }

    const smsResult = await textverifiedClient.listSms({
      reservationId: verificationId,
      reservationType: "verification",
    });

    const messages = smsResult?.data ?? [];
    for (const sms of messages) {
      const content = sms.smsContent || "";
      if (!content) continue;

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
          is_otp: Boolean(sms.parsedCode),
          otp_code: sms.parsedCode ?? null,
          created_at: sms.createdAt ?? new Date().toISOString(),
        });
      }

      if (sms.parsedCode) {
        const { data: existingOtp } = await supabase
          .from("otp_codes")
          .select("id")
          .eq("number_id", numberId)
          .eq("code", sms.parsedCode)
          .maybeSingle();

        if (!existingOtp) {
          await supabase.from("otp_codes").insert({
            number_id: numberId,
            code: sms.parsedCode,
            status: "pending",
            created_at: sms.createdAt ?? new Date().toISOString(),
          });
        }
      }
    }

    if (!isCancelled && (messages.length > 0 || COMPLETED_STATES.has(state))) {
      await supabase
        .from("virtual_numbers")
        .update({ status: "active" })
        .eq("id", numberId);
    }
  } catch (error) {
    console.error("[textverified] Verification sync error:", error);
  }
}

export async function syncTextverifiedRental(
  numberId: string,
  reservationId: string,
  reservationType: "renewable" | "nonrenewable",
  supabase: any
) {
  try {
    const rental =
      reservationType === "renewable"
        ? await textverifiedClient.getRenewableRental(reservationId)
        : await textverifiedClient.getNonrenewableRental(reservationId);

    const state = rental?.state;
    const endsAt = (rental as any)?.endsAt;

    if (endsAt) {
      const parsedEndsAt = new Date(endsAt);
      if (!Number.isNaN(parsedEndsAt.getTime())) {
        await supabase
          .from("virtual_numbers")
          .update({ expires_at: parsedEndsAt.toISOString() })
          .eq("id", numberId);
      }
    }

    const isCancelled = state && RENTAL_CANCELLED_STATES.has(state);
    if (isCancelled) {
      await supabase
        .from("virtual_numbers")
        .update({ status: "cancelled" })
        .eq("id", numberId);
    }

    const smsResult = await textverifiedClient.listSms({
      reservationId,
      reservationType,
    });

    const messages = smsResult?.data ?? [];
    for (const sms of messages) {
      const content = sms.smsContent || "";
      if (!content) continue;

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
          from_number: sms.from ?? null,
          body: content,
          is_otp: Boolean(sms.parsedCode),
          otp_code: sms.parsedCode ?? null,
          created_at: sms.createdAt ?? new Date().toISOString(),
        });
      }

      if (sms.parsedCode) {
        const { data: existingOtp } = await supabase
          .from("otp_codes")
          .select("id")
          .eq("number_id", numberId)
          .eq("code", sms.parsedCode)
          .maybeSingle();

        if (!existingOtp) {
          await supabase.from("otp_codes").insert({
            number_id: numberId,
            code: sms.parsedCode,
            status: "pending",
            created_at: sms.createdAt ?? new Date().toISOString(),
          });
        }
      }
    }

    if (!isCancelled && (messages.length > 0 || (state && RENTAL_ACTIVE_STATES.has(state)))) {
      await supabase
        .from("virtual_numbers")
        .update({ status: "active" })
        .eq("id", numberId);
    }
  } catch (error) {
    console.error("[textverified] Rental sync error:", error);
  }
}
