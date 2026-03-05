
import { smspvaClient, isSmspvaError } from "./client";

// ─── Services (platforms) ────────────────────────────────────────────────────

export interface SmspvaService {
  code: string;   // e.g. "opt1"
  name: string;
  icon: string;   // emoji fallback
}

export const SMSPVA_SERVICES: SmspvaService[] = [
  { code: "opt1",  name: "Google",    icon: "🔵" },
  { code: "opt2",  name: "Facebook",  icon: "📘" },
  { code: "opt20", name: "WhatsApp",  icon: "💬" },
  { code: "opt29", name: "Telegram",  icon: "✈️" },
  { code: "opt16", name: "Instagram", icon: "📸" },
  { code: "opt41", name: "Twitter/X", icon: "🐦" },
  { code: "opt104",name: "TikTok",    icon: "🎵" },
  { code: "opt11", name: "Viber",     icon: "📲" },
  { code: "opt5",  name: "OK.ru",     icon: "🟠" },
  { code: "opt31", name: "WeChat",    icon: "🍀" },
  { code: "opt19", name: "Other",     icon: "📱" },
];

// ─── Countries ───────────────────────────────────────────────────────────────

export interface SmspvaCountry {
  code: string;
  name: string;
  flag: string;
}

export const SMSPVA_COUNTRIES: SmspvaCountry[] = [
  { code: "US", name: "United States",   flag: "🇺🇸" },
  { code: "CA", name: "Canada",          flag: "🇨🇦" },
  { code: "UK", name: "United Kingdom",  flag: "🇬🇧" },
  { code: "FR", name: "France",          flag: "🇫🇷" },
  { code: "DE", name: "Germany",         flag: "🇩🇪" },
  { code: "IT", name: "Italy",           flag: "🇮🇹" },
  { code: "ES", name: "Spain",           flag: "🇪🇸" },
  { code: "AU", name: "Australia",       flag: "🇦🇺" },
  { code: "NL", name: "Netherlands",     flag: "🇳🇱" },
  { code: "PL", name: "Poland",          flag: "🇵🇱" },
  { code: "MX", name: "Mexico",          flag: "🇲🇽" },
  { code: "BR", name: "Brazil",          flag: "🇧🇷" },
  { code: "ID", name: "Indonesia",       flag: "🇮🇩" },
  { code: "PH", name: "Philippines",     flag: "🇵🇭" },
  { code: "HK", name: "Hong Kong",       flag: "🇭🇰" },
  { code: "JP", name: "Japan",           flag: "🇯🇵" },
  { code: "SG", name: "Singapore",       flag: "🇸🇬" },
  { code: "RO", name: "Romania",         flag: "🇷🇴" },
  { code: "LT", name: "Lithuania",       flag: "🇱🇹" },
  { code: "FI", name: "Finland",         flag: "🇫🇮" },
  { code: "SE", name: "Sweden",          flag: "🇸🇪" },
  { code: "CZ", name: "Czech Republic",  flag: "🇨🇿" },
  { code: "GE", name: "Georgia",         flag: "🇬🇪" },
  { code: "KZ", name: "Kazakhstan",      flag: "🇰🇿" },
];

// ─── OTP extraction ──────────────────────────────────────────────────────────

function extractCode(message: string): string | null {
  const match = message.match(/\b\d{4,8}\b/);
  return match ? match[0] : null;
}

// ─── SMS sync ────────────────────────────────────────────────────────────────

/**
 * Polls SMSPVA for the SMS on a given activation order and stores it in DB.
 * smspvaId = the order id returned at purchase.
 * serviceCode = e.g. "opt1"
 * country = e.g. "US"
 */
export async function syncSmspvaMessages(
  numberId: string,
  smspvaId: string,
  serviceCode: string,
  country: string,
  supabase: any
) {
  try {
    // Get the phone number row so we can include it in the poll call
    const { data: numberRow } = await supabase
      .from("virtual_numbers")
      .select("phone_number")
      .eq("id", numberId)
      .single();

    const result = await smspvaClient.getSms(serviceCode, country, smspvaId);

    // response "1" = SMS received; "2" = waiting (no SMS yet)
    if (result.response !== "1" || !result.sms) return;

    const code = extractCode(result.sms);
    const content = result.sms;

    // Deduplicate by body
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

      // Mark number as having received SMS
      await supabase
        .from("virtual_numbers")
        .update({ status: "RECEIVED" })
        .eq("id", numberId);
    }
  } catch (error) {
    console.error("SMSPVA sync error:", error);
  }
}
