/**
 * Calculate pricing for virtual numbers based on Twilio costs
 * Default markup is 400% (5x the cost) for monthly fees
 */

const DEFAULT_MARKUP_PERCENTAGE = 400; // 400% markup = 5x cost

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
 */
export function getDefaultMonthlyCost(countryCode?: string): number {
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

export function getNumberCostEstimate(
  countryCode?: string,
  estimatedMessagesPerMonth: number = 100
): NumberCostEstimate {
  const monthlyFee = getDefaultMonthlyCost(countryCode);
  const smsCostPerMessage = calculateSMSCost();
  const estimatedMonthlyCost = monthlyFee + smsCostPerMessage * estimatedMessagesPerMonth;

  return {
    monthlyFee,
    smsCostPerMessage,
    estimatedMonthlyCost,
  };
}








