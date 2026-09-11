import { pvadealsClient } from "./client";
import { sendPushNotificationToUser } from "@/lib/notifications/push";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractOtp(message: string): string | null {
  const spaced = message.match(/(\d[\d\s\-]{2,10}\d)/);
  if (spaced) {
    const digits = spaced[1].replace(/[\s\-]/g, "");
    if (/^\d{4,8}$/.test(digits)) return digits;
  }
  const plain = message.match(/\b\d{4,8}\b/);
  return plain ? plain[0] : null;
}

// PVADeals delivers SMS primarily via webhook, but webhooks can be missed
// (secret misconfigured, cold start, no retry). This fallback polls
// GET /v3/api/request/:id and extracts any SMS/code fields the API returns,
// so a code visible on the provider dashboard still lands in our DB when
// the user opens Messages/OTPs or hits refresh.
function collectCandidateMessages(req: Record<string, any>): string[] {
  const out: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === "string" && v.trim()) out.push(v);
  };
  // Known / likely keys — be liberal since the API shape varies.
  for (const key of [
    "message",
    "sms",
    "smsText",
    "sms_text",
    "lastSms",
    "lastMessage",
    "otp",
    "code",
    "smsCode",
    "sms_code",
  ]) {
    push(req[key]);
  }
  const smsList = req.smsList ?? req.messages ?? req.smsHistory;
  if (Array.isArray(smsList)) {
    for (const item of smsList) {
      if (typeof item === "string") push(item);
      else if (item && typeof item === "object") {
        push((item as any).message ?? (item as any).sms ?? (item as any).text);
      }
    }
  }
  return [...new Set(out)];
}

async function storeMessage(
  supabase: any,
  numberId: string,
  userId: string | null,
  phoneLabel: string,
  message: string
) {
  const otpCode = extractOtp(message);

  const { data: existing } = await supabase
    .from("messages")
    .select("id")
    .eq("number_id", numberId)
    .eq("body", message)
    .maybeSingle();

  if (!existing) {
    await supabase.from("messages").insert({
      number_id: numberId,
      direction: "inbound",
      from_number: null,
      to_number: null,
      body: message,
      message_type: "sms",
      is_otp: Boolean(otpCode),
      otp_code: otpCode,
      otp_service: "WhatsApp",
    });
  }

  if (otpCode) {
    const { data: existingOtp } = await supabase
      .from("otp_codes")
      .select("id")
      .eq("number_id", numberId)
      .eq("code", otpCode)
      .eq("status", "pending")
      .maybeSingle();

    if (!existingOtp) {
      await supabase.from("otp_codes").insert({
        number_id: numberId,
        code: otpCode,
        service_name: "WhatsApp",
        status: "pending",
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

      if (userId) {
        await sendPushNotificationToUser(userId, {
          title: "New OTP Received",
          body: `OTP ${otpCode} arrived for ${phoneLabel}`,
          data: { type: "otp", number_id: numberId, code: otpCode },
        });
      }
    }
  }
}

export async function syncPVADealsNumber(
  numberId: string,
  requestId: string,
  supabase: any,
  options?: { attempts?: number; delayMs?: number }
) {
  try {
    const attempts = Math.max(1, options?.attempts ?? 4);
    const delayMs = Math.max(250, options?.delayMs ?? 2000);

    const { data: vn } = await supabase
      .from("virtual_numbers")
      .select("id, user_id, phone_number")
      .eq("id", numberId)
      .maybeSingle();
    if (!vn) return;

    for (let i = 0; i < attempts; i++) {
      let req: Record<string, any>;
      try {
        req = (await pvadealsClient.getRequest(requestId)) as unknown as Record<string, any>;
      } catch (err) {
        console.error("[pvadeals] fallback poll error:", err);
        return;
      }

      if (req?.status === "FLAGGED") {
        await supabase.from("virtual_numbers").update({ status: "cancelled" }).eq("id", numberId);
      }

      const candidates = collectCandidateMessages(req ?? {});
      for (const message of candidates) {
        await storeMessage(supabase, numberId, vn.user_id ?? null, vn.phone_number ?? "your number", message);
      }

      if (candidates.length > 0) return;
      if (i < attempts - 1) await sleep(delayMs);
    }
  } catch (error) {
    console.error("[pvadeals] sync error:", error);
  }
}
