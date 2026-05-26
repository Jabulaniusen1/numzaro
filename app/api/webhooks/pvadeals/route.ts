import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { sendPushNotificationToUser } from "@/lib/notifications/push";

export const dynamic = "force-dynamic";

// PVADeals does not send a cryptographic signature. We validate using a shared
// secret appended to the webhook URL as ?secret=<PVADEALS_WEBHOOK_SECRET>.
function validateSecret(request: NextRequest): boolean {
  const expected = process.env.PVADEALS_WEBHOOK_SECRET?.trim();
  if (!expected) return true; // secret not configured — allow all (dev only)
  const provided =
    request.nextUrl.searchParams.get("secret") ??
    request.headers.get("x-webhook-secret") ??
    "";
  return provided === expected;
}

// Extracts the first numeric sequence of 4–8 digits from an SMS message body,
// which is the typical format for OTP codes.
function extractOtp(message: string): string | null {
  const match = message.match(/\b\d{4,8}\b/);
  return match ? match[0] : null;
}

export async function POST(request: NextRequest) {
  if (!validateSecret(request)) {
    console.warn("[webhook/pvadeals] invalid secret");
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const event = String(payload?.event || "");
  const requestId = String(payload?.requestId || "");
  const number = String(payload?.number || "");
  const message = String(payload?.message || "");

  if (!event || !requestId) {
    return NextResponse.json({ ok: false, error: "Missing event or requestId" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  if (event === "sms_received" && message) {
    const { data: vn } = await supabase
      .from("virtual_numbers")
      .select("id, user_id")
      .eq("textverified_id", requestId)
      .eq("provider", "pvadeals")
      .maybeSingle();

    if (vn) {
      const otpCode = extractOtp(message);

      await supabase.from("messages").insert({
        number_id: vn.id,
        direction: "inbound",
        from_number: null,
        to_number: number || null,
        body: message,
        message_type: "sms",
        is_otp: Boolean(otpCode),
        otp_code: otpCode,
        otp_service: "WhatsApp",
      });

      if (otpCode) {
        await supabase.from("otp_codes").insert({
          number_id: vn.id,
          code: otpCode,
          service_name: "WhatsApp",
          status: "pending",
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        });

        await sendPushNotificationToUser(vn.user_id, {
          title: "New OTP Received",
          body: `OTP ${otpCode} arrived for ${number || "your number"}`,
          data: { type: "otp", number_id: vn.id, code: otpCode },
        });
      }

      console.log(`[webhook/pvadeals] sms_received for request ${requestId}, otp: ${otpCode ?? "none"}`);
    } else {
      console.warn(`[webhook/pvadeals] sms_received — no virtual_number found for requestId: ${requestId}`);
    }
  } else if (event === "number_flagged") {
    await supabase
      .from("virtual_numbers")
      .update({ status: "cancelled" })
      .eq("textverified_id", requestId)
      .eq("provider", "pvadeals");

    console.log(`[webhook/pvadeals] number_flagged for request ${requestId}`);
  }
  // number_purchased, number_reused, number_renewed — no additional action needed

  return NextResponse.json({ ok: true });
}
