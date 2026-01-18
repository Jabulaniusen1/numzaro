"use client";

/**
 * Simple currency hook that formats amounts in Nigerian Naira (NGN)
 * No conversion or detection - just displays prices as they come from the API
 */
export function useCurrency() {
  const format = (amount: number, decimals: number = 2): string => {
    // Format number with commas and Naira symbol
    return `₦${amount.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };

  const convert = (amount: number): number => {
    // No conversion needed - amounts are already in Naira
    return amount;
  };

  return {
    currency: "NGN",
    rate: 1,
    symbol: "₦",
    country: "Nigeria",
    loading: false,
    convert,
    format,
  };
}

