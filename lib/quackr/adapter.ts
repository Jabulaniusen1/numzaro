
import { quackrClient } from "./client";

// Available locales as "services" for the numbers page
const LOCALES: { id: string; name: string; flag: string }[] = [
  { id: "US", name: "United States", flag: "🇺🇸" },
  { id: "UK", name: "United Kingdom", flag: "🇬🇧" },
  { id: "CA", name: "Canada", flag: "🇨🇦" },
  { id: "AU", name: "Australia", flag: "🇦🇺" },
  { id: "DE", name: "Germany", flag: "🇩🇪" },
  { id: "NL", name: "Netherlands", flag: "🇳🇱" },
  { id: "FR", name: "France", flag: "🇫🇷" },
  { id: "ES", name: "Spain", flag: "🇪🇸" },
  { id: "PL", name: "Poland", flag: "🇵🇱" },
  { id: "FI", name: "Finland", flag: "🇫🇮" },
  { id: "LT", name: "Lithuania", flag: "🇱🇹" },
  { id: "HK", name: "Hong Kong", flag: "🇭🇰" },
  { id: "MX", name: "Mexico", flag: "🇲🇽" },
  { id: "IL", name: "Israel", flag: "🇮🇱" },
];

export interface ServiceListItem {
  id: string;
  name: string;
  flag: string;
}

export async function getQuackrServices(): Promise<ServiceListItem[]> {
  return LOCALES.map((l) => ({ id: l.id, name: l.name, flag: l.flag }));
}

/** Extract OTP/code from an SMS message string */
function extractCode(message: string): string | null {
  const match = message.match(/\b\d{4,8}\b/);
  return match ? match[0] : null;
}

export async function syncQuackrMessages(
  numberId: string,
  phoneNumber: string,
  supabase: any
) {
  try {
    const result = await quackrClient.getMessages(phoneNumber);
    const messages = result?.data?.messages ?? [];

    for (const msg of messages) {
      const code = extractCode(msg.message);
      const content = msg.message;
      const receivedAt = new Date(msg.received).toISOString();

      // Check if this message is already stored (by content + timestamp)
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
          created_at: receivedAt,
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
              created_at: receivedAt,
            });
          }
        }
      }
    }

    return messages;
  } catch (error) {
    console.error("Quackr sync error:", error);
    return null;
  }
}
