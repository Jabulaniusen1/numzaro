import { textverifiedClient } from "@/lib/textverified/client";
import { sendPushNotificationToUser } from "@/lib/notifications/push";

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fallback when the provider doesn't supply parsedCode (e.g. unusual
// formats like "123-456", "123 456"). Accepts 4-8 digits ignoring
// spaces/dashes.
function extractCodeFallback(message: string): string | null {
  const spaced = message.match(/(\d[\d\s\-]{2,10}\d)/);
  if (spaced) {
    const digits = spaced[1].replace(/[\s\-]/g, "");
    if (/^\d{4,8}$/.test(digits)) return digits;
  }
  const plain = message.match(/\b\d{4,8}\b/);
  return plain ? plain[0] : null;
}

type SyncOptions = {
  attempts?: number;
  delayMs?: number;
};

function resolveSyncOptions(options?: SyncOptions) {
  return {
    attempts: Math.max(1, options?.attempts ?? 6),
    delayMs: Math.max(250, options?.delayMs ?? 2000),
  };
}

export async function syncTextverifiedVerification(
  numberId: string,
  verificationId: string,
  supabase: any,
  options?: SyncOptions
) {
  try {
    const { attempts, delayMs } = resolveSyncOptions(options);
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

    // Poll listSms — the code often arrives seconds after the user opens
    // the page, so a single shot misses it ("sometimes doesn't show up").
    let messages: any[] = [];
    for (let i = 0; i < attempts; i++) {
      const smsResult = await textverifiedClient.listSms({
        reservationId: verificationId,
        reservationType: "verification",
      });
      messages = smsResult?.data ?? [];
      if (messages.length > 0) break;
      if (i < attempts - 1) await sleep(delayMs);
    }

    for (const sms of messages) {
      const content = sms.smsContent || "";
      if (!content) continue;
      const code = sms.parsedCode ?? extractCodeFallback(content);

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
          is_otp: Boolean(code),
          otp_code: code ?? null,
          created_at: sms.createdAt ?? new Date().toISOString(),
        });
      }

      if (code) {
        // Only skip when a *pending* row for the same code already exists,
        // so a resent/expired code still creates a fresh pending OTP.
        const { data: existingOtp } = await supabase
          .from("otp_codes")
          .select("id")
          .eq("number_id", numberId)
          .eq("code", code)
          .eq("status", "pending")
          .maybeSingle();

        if (!existingOtp) {
          await supabase.from("otp_codes").insert({
            number_id: numberId,
            code,
            status: "pending",
            created_at: sms.createdAt ?? new Date().toISOString(),
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
  supabase: any,
  options?: SyncOptions
) {
  try {
    const { attempts, delayMs } = resolveSyncOptions(options);
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

    // Rentals can receive additional messages at any time — keep polling
    // briefly so a code that lands just after page open is still captured.
    let messages: any[] = [];
    for (let i = 0; i < attempts; i++) {
      const smsResult = await textverifiedClient.listSms({
        reservationId,
        reservationType,
      });
      const batch = smsResult?.data ?? [];
      if (batch.length > 0) {
        messages = batch;
        break;
      }
      if (i < attempts - 1) await sleep(delayMs);
    }

    for (const sms of messages) {
      const content = sms.smsContent || "";
      if (!content) continue;
      const code = sms.parsedCode ?? extractCodeFallback(content);

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
          is_otp: Boolean(code),
          otp_code: code ?? null,
          created_at: sms.createdAt ?? new Date().toISOString(),
        });
      }

      if (code) {
        const { data: existingOtp } = await supabase
          .from("otp_codes")
          .select("id")
          .eq("number_id", numberId)
          .eq("code", code)
          .eq("status", "pending")
          .maybeSingle();

        if (!existingOtp) {
          await supabase.from("otp_codes").insert({
            number_id: numberId,
            code,
            status: "pending",
            created_at: sms.createdAt ?? new Date().toISOString(),
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
