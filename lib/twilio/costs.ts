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
 * Get default monthly cost for a number (user-facing price)
 * This is an async function that fetches markup from database
 */
export async function getDefaultMonthlyCost(
  countryCode?: string,
  markupPercentage?: number
): Promise<number> {
  // Base cost in USD, can be customized per country
  const baseCost = 1.0; // Twilio's base monthly cost
  
  // Country-specific pricing multipliers
  const countryMultipliers: Record<string, number> = {
    US: 1.0,
    CA: 1.0,
    GB: 1.2,
    AU: 1.2,
    // Add more countries as needed
  };

  const multiplier = countryCode ? countryMultipliers[countryCode] || 1.0 : 1.0;
  const twilioCost = baseCost * multiplier;
  
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








