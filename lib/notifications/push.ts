import { createServiceRoleClient } from "@/lib/supabase/service-role";

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

function isExpoPushToken(token: string): boolean {
  return /^Expo(?:nent)?PushToken\[[^\]]+\]$/.test(token.trim());
}

async function sendExpoPush(token: string, payload: PushPayload): Promise<boolean> {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        sound: "default",
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      }),
    });

    let result: any = null;
    try {
      result = await response.json();
    } catch {
      result = null;
    }

    if (!response.ok) {
      console.error("[push] Expo push request failed:", response.status, result);
      return false;
    }

    const pushStatus = result?.data?.status;
    if (pushStatus === "error") {
      console.error("[push] Expo push returned error:", result?.data);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[push] Failed to send Expo push:", error);
    return false;
  }
}

export async function sendPushNotificationToUser(
  userId: string,
  payload: PushPayload
): Promise<boolean> {
  try {
    const supabase = createServiceRoleClient();
    const { data: user, error } = await supabase
      .from("users")
      .select("push_token")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[push] Failed to read user push token:", error);
      return false;
    }

    const token = String(user?.push_token ?? "").trim();
    if (!token || !isExpoPushToken(token)) return false;

    return await sendExpoPush(token, payload);
  } catch (error) {
    console.error("[push] sendPushNotificationToUser failed:", error);
    return false;
  }
}

