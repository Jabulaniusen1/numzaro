"use client";

import { useState, useEffect, useCallback } from "react";

type Currency = "USD" | "NGN";

interface CurrencyState {
  currency: Currency;
  rate: number;
  symbol: string;
  loading: boolean;
}

const CURRENCY_STORAGE_KEY = "preferred_currency";

/**
 * Currency hook that supports USD/NGN switching with real-time conversion
 */
export function useCurrency() {
  const [state, setState] = useState<CurrencyState>({
    currency: "NGN",
    rate: 1,
    symbol: "₦",
    loading: true,
  });

  // Load currency preference from localStorage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY) as Currency | null;
    const initialCurrency = savedCurrency === "USD" ? "USD" : "NGN";
    
    setState((prev) => ({
      ...prev,
      currency: initialCurrency,
      symbol: initialCurrency === "USD" ? "$" : "₦",
    }));

    // Fetch exchange rate
    fetchExchangeRate(initialCurrency);
  }, []);

  const fetchExchangeRate = useCallback(async (targetCurrency: Currency) => {
    setState((prev) => ({ ...prev, loading: true }));

    try {
      if (targetCurrency === "USD") {
        // USD to USD is 1:1
        setState({
          currency: "USD",
          rate: 1,
          symbol: "$",
          loading: false,
        });
        return;
      }

      // Fetch USD to NGN rate
      const response = await fetch("/api/currency/rate?to=NGN");
      if (response.ok) {
        const data = await response.json();
        setState({
          currency: "NGN",
          rate: data.rate || 1,
          symbol: "₦",
          loading: false,
        });
      } else {
        // Fallback to default rate if API fails
        setState({
          currency: "NGN",
          rate: 1500, // Fallback rate
          symbol: "₦",
          loading: false,
        });
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      // Fallback to default rate
      setState({
        currency: targetCurrency,
        rate: targetCurrency === "USD" ? 1 : 1500,
        symbol: targetCurrency === "USD" ? "$" : "₦",
        loading: false,
      });
    }
  }, []);

  const switchCurrency = useCallback((newCurrency: Currency) => {
    localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
    fetchExchangeRate(newCurrency);
  }, [fetchExchangeRate]);

  const format = useCallback((amount: number, decimals: number = 2): string => {
    const formatted = amount.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${state.symbol}${formatted}`;
  }, [state.symbol]);

  const convert = useCallback((amount: number): number => {
    // Amounts from API are in USD, convert to selected currency
    if (state.currency === "USD") {
      return amount;
    }
    // Convert USD to NGN
    return amount * state.rate;
  }, [state.currency, state.rate]);

  return {
    currency: state.currency,
    rate: state.rate,
    symbol: state.symbol,
    country: state.currency === "NGN" ? "Nigeria" : "United States",
    loading: state.loading,
    convert,
    format,
    switchCurrency,
  };
}

