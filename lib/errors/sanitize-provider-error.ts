const PROVIDER_PREFIX_PATTERN =
  /^\s*(?:textverified|text\s*verified|smspool|sms\s*pool|system)\s*:\s*/i;

const PROVIDER_NAME_PATTERN =
  /\b(?:textverified|text\s*verified|smspool|sms\s*pool)\b/gi;

export function sanitizeProviderErrorMessage(
  message: unknown,
  fallback: string = "Something went wrong. Please try again."
): string {
  const raw = typeof message === "string" ? message : message == null ? "" : String(message);
  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  const withoutPrefix = trimmed.replace(PROVIDER_PREFIX_PATTERN, "");
  const withoutProviderNames = withoutPrefix.replace(PROVIDER_NAME_PATTERN, "service provider");
  const cleaned = withoutProviderNames.replace(/\s{2,}/g, " ").trim();

  return cleaned || fallback;
}
