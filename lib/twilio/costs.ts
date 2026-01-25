/**
 * Calculate pricing for virtual numbers based on Twilio costs
 * Markup percentage is configurable by admin via admin_settings table
 */

const DEFAULT_MARKUP_PERCENTAGE = 400; // 400% markup = 5x cost (fallback)

/**
 * Get phone numbers markup percentage from admin settings
 * This should be called server-side only
 */
export async function getPhoneNumbersMarkup(): Promise<number> {
  try {
    // This function should be called from server-side code
    // For client-side, we'll use the default
    if (typeof window !== "undefined") {
      return DEFAULT_MARKUP_PERCENTAGE;
    }

    // Server-side: fetch from database
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    
    const { data: markupSetting } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "phone_numbers_markup_percentage")
      .single();

    return markupSetting
      ? parseFloat(markupSetting.value)
      : DEFAULT_MARKUP_PERCENTAGE;
  } catch (error) {
    console.error("Error fetching phone numbers markup:", error);
    return DEFAULT_MARKUP_PERCENTAGE;
  }
}

/**
 * Calculate user price from Twilio cost with markup
 */
export function calculateUserPrice(
  twilioCost: number,
  markupPercentage: number = DEFAULT_MARKUP_PERCENTAGE
): number {
  return twilioCost * (1 + markupPercentage / 100);
}

/**
 * Get Twilio's actual monthly cost for a phone number based on country and type
 * This uses known Twilio pricing data. For accurate real-time pricing, 
 * consider using Twilio's Pricing API in the future.
 */
export function getTwilioMonthlyCost(
  countryCode: string,
  numberType: "local" | "mobile" | "tollFree" = "local"
): number {
  // Twilio pricing data (in USD per month)
  // Source: Twilio pricing documentation
  // Format: { countryCode: { local: price, mobile: price, tollFree: price } }
  const pricing: Record<string, Record<string, number>> = {
    US: { local: 1.0, mobile: 1.0, tollFree: 2.0 },
    CA: { local: 1.0, mobile: 1.0, tollFree: 2.0 },
    GB: { local: 1.2, mobile: 1.2, tollFree: 2.0 },
    AU: { local: 1.2, mobile: 1.2, tollFree: 2.0 },
    IL: { local: 15.0, mobile: 15.0, tollFree: 0 }, // Israel pricing
    DE: { local: 1.0, mobile: 1.0, tollFree: 0 },
    FR: { local: 1.0, mobile: 1.0, tollFree: 0 },
    ES: { local: 1.0, mobile: 1.0, tollFree: 0 },
    IT: { local: 1.0, mobile: 1.0, tollFree: 0 },
    NL: { local: 1.0, mobile: 1.0, tollFree: 0 },
    BE: { local: 1.0, mobile: 1.0, tollFree: 0 },
    CH: { local: 1.0, mobile: 1.0, tollFree: 0 },
    AT: { local: 1.0, mobile: 1.0, tollFree: 0 },
    SE: { local: 1.0, mobile: 1.0, tollFree: 0 },
    NO: { local: 1.0, mobile: 1.0, tollFree: 0 },
    DK: { local: 1.0, mobile: 1.0, tollFree: 0 },
    FI: { local: 1.0, mobile: 1.0, tollFree: 0 },
    PL: { local: 1.0, mobile: 1.0, tollFree: 0 },
    // Add more countries as needed
  };

  const countryPricing = pricing[countryCode.toUpperCase()];
  if (!countryPricing) {
    // Default pricing for unknown countries
    return 1.0;
  }

  const typeKey = numberType === "tollFree" ? "tollFree" : numberType;
  return countryPricing[typeKey] || countryPricing.local || 1.0;
}

/**
 * Get default monthly cost for a number (user-facing price)
 * This is an async function that fetches markup from database
 */
export async function getDefaultMonthlyCost(
  countryCode?: string,
  markupPercentage?: number,
  numberType?: "local" | "mobile" | "tollFree"
): Promise<number> {
  // Get actual Twilio cost for the country and type
  const twilioCost = countryCode 
    ? getTwilioMonthlyCost(countryCode, numberType || "local")
    : 1.0; // Default fallback
  
  // Use provided markup or fetch from database
  const markup = markupPercentage ?? (await getPhoneNumbersMarkup());
  
  return calculateUserPrice(twilioCost, markup);
}

/**
 * Synchronous version for backward compatibility (uses default markup)
 */
export function getDefaultMonthlyCostSync(countryCode?: string): number {
  const baseCost = 1.0;
  const countryMultipliers: Record<string, number> = {
    US: 1.0,
    CA: 1.0,
    GB: 1.2,
    AU: 1.2,
  };
  const multiplier = countryCode ? countryMultipliers[countryCode] || 1.0 : 1.0;
  const twilioCost = baseCost * multiplier;
  return calculateUserPrice(twilioCost);
}

/**
 * Calculate SMS pricing (per message)
 */
export function calculateSMSCost(
  twilioCostPerSMS: number = 0.0075, // Default Twilio SMS cost
  markupPercentage: number = 200 // 200% markup = 3x cost
): number {
  return twilioCostPerSMS * (1 + markupPercentage / 100);
}

/**
 * Get estimated monthly cost for a number
 */
export interface NumberCostEstimate {
  monthlyFee: number;
  smsCostPerMessage: number;
  estimatedMonthlyCost: number; // For average usage
}

export async function getNumberCostEstimate(
  countryCode?: string,
  estimatedMessagesPerMonth: number = 100
): Promise<NumberCostEstimate> {
  const monthlyFee = await getDefaultMonthlyCost(countryCode);
  const smsCostPerMessage = calculateSMSCost();
  const estimatedMonthlyCost = monthlyFee + smsCostPerMessage * estimatedMessagesPerMonth;

  return {
    monthlyFee,
    smsCostPerMessage,
    estimatedMonthlyCost,
  };
}








