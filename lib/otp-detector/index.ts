/**
 * OTP Detection Utility
 * Detects OTP codes from SMS messages and identifies the service
 */

export interface OTPResult {
  code: string | null;
  service: string | null;
}

/**
 * Service patterns for identification
 */
const SERVICE_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /google|gmail|g-suite/i, name: "Google" },
  { pattern: /whatsapp|wa\.me/i, name: "WhatsApp" },
  { pattern: /facebook|fb|meta/i, name: "Facebook" },
  { pattern: /twitter|x\.com/i, name: "Twitter/X" },
  { pattern: /instagram|ig/i, name: "Instagram" },
  { pattern: /telegram|t\.me/i, name: "Telegram" },
  { pattern: /amazon|aws/i, name: "Amazon" },
  { pattern: /microsoft|msft|azure/i, name: "Microsoft" },
  { pattern: /apple|icloud/i, name: "Apple" },
  { pattern: /linkedin/i, name: "LinkedIn" },
  { pattern: /github/i, name: "GitHub" },
  { pattern: /paypal/i, name: "PayPal" },
  { pattern: /stripe/i, name: "Stripe" },
  { pattern: /uber/i, name: "Uber" },
  { pattern: /lyft/i, name: "Lyft" },
  { pattern: /airbnb/i, name: "Airbnb" },
  { pattern: /netflix/i, name: "Netflix" },
  { pattern: /spotify/i, name: "Spotify" },
  { pattern: /discord/i, name: "Discord" },
  { pattern: /tiktok/i, name: "TikTok" },
  { pattern: /snapchat/i, name: "Snapchat" },
  { pattern: /reddit/i, name: "Reddit" },
  { pattern: /twitch/i, name: "Twitch" },
  { pattern: /uber/i, name: "Uber" },
  { pattern: /grab/i, name: "Grab" },
  { pattern: /grabpay/i, name: "GrabPay" },
];

/**
 * Extract OTP code from text
 * Supports 4-6 digit codes
 */
export function extractOTP(text: string): OTPResult {
  // Remove common prefixes/suffixes and extract digits
  const cleanedText = text.replace(/[^\d\s]/g, " ");
  
  // Pattern 1: Standalone 4-6 digit codes (most common)
  const standalonePattern = /\b(\d{4,6})\b/g;
  const standaloneMatches = Array.from(cleanedText.matchAll(standalonePattern));
  
  // Pattern 2: Codes with separators (e.g., 123-456, 12-34-56)
  const separatedPattern = /\b(\d{2,3}[-.\s]\d{2,3}(?:[-.\s]\d{2,3})?)\b/g;
  const separatedMatches = Array.from(text.matchAll(separatedPattern));
  
  // Combine and prioritize matches
  let code: string | null = null;
  
  // Prefer standalone codes first
  if (standaloneMatches.length > 0) {
    // Get the longest match (more likely to be the code)
    code = standaloneMatches
      .map((m) => m[1])
      .sort((a, b) => b.length - a.length)[0];
  } else if (separatedMatches.length > 0) {
    // Use separated codes, remove separators
    code = separatedMatches[0][1].replace(/[-.\s]/g, "");
  }
  
  // Validate code length (4-6 digits)
  if (code && (code.length < 4 || code.length > 6)) {
    code = null;
  }
  
  // Identify service
  let service: string | null = null;
  const lowerText = text.toLowerCase();
  
  for (const { pattern, name } of SERVICE_PATTERNS) {
    if (pattern.test(text)) {
      service = name;
      break;
    }
  }
  
  // If no service found but we have a code, try to identify from sender number
  // (This would require additional context in real implementation)
  
  return {
    code,
    service,
  };
}

/**
 * Validate if a code looks like an OTP
 */
export function isValidOTP(code: string): boolean {
  return /^\d{4,6}$/.test(code);
}

/**
 * Extract multiple OTPs from text (for cases with multiple codes)
 */
export function extractAllOTPs(text: string): string[] {
  const codes: string[] = [];
  const standalonePattern = /\b(\d{4,6})\b/g;
  const matches = Array.from(text.matchAll(standalonePattern));
  
  for (const match of matches) {
    const code = match[1];
    if (isValidOTP(code)) {
      codes.push(code);
    }
  }
  
  // Remove duplicates
  return [...new Set(codes)];
}














