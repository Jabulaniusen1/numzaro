"use client";

import { useState, useEffect, useCallback } from "react";

type Currency = "NGN";

interface CurrencyState {
  currency: Currency;
  rate: number;
  symbol: string;
  loading: boolean;
}

/**
 * Currency hook for NGN display with USD->NGN conversion.
 */
export function useCurrency() {
  const [state, setState] = useState<CurrencyState>({
    currency: "NGN",
    rate: 1500,
    symbol: "₦",
    loading: true,
  });

  const fetchExchangeRate = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    try {
      const response = await fetch("/api/currency/rate?to=NGN");
      if (response.ok) {
        const data = await response.json();
        setState({
          currency: "NGN",
          rate: data.rate || 1500,
          symbol: "₦",
          loading: false,
        });
        return;
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
    }

    setState({
      currency: "NGN",
      rate: 1500,
      symbol: "₦",
      loading: false,
    });
  }, []);

  useEffect(() => {
    fetchExchangeRate();
  }, [fetchExchangeRate]);

  const switchCurrency = useCallback(() => {
    fetchExchangeRate();
  }, [fetchExchangeRate]);

  const format = useCallback((amount: number, decimals: number = 2): string => {
    const formatted = amount.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${state.symbol}${formatted}`;
  }, [state.symbol]);

  // All stored amounts are in NGN — no conversion needed.
  const convert = useCallback((amount: number): number => {
    return amount;
  }, []);

  // Use this only for values that are genuinely in USD (e.g. provider API prices).
  const convertFromUSD = useCallback((amount: number): number => {
    return amount * state.rate;
  }, [state.rate]);

  return {
    currency: state.currency,
    rate: state.rate,
    symbol: state.symbol,
    country: "Nigeria",
    loading: state.loading,
    convert,
    convertFromUSD,
    format,
    switchCurrency,
  };
}
