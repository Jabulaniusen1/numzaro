"use client";

import { useEffect, useState } from "react";

interface CurrencyInfo {
  currency: string;
  rate: number;
  symbol: string;
  country: string;
}

const CURRENCY_SYMBOLS: { [key: string]: string } = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  NGN: "₦",
  ZAR: "R",
  KES: "KSh",
  GHS: "₵",
  TZS: "TSh",
  UGX: "USh",
  CAD: "C$",
  AUD: "A$",
  NZD: "NZ$",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  BRL: "R$",
  MXN: "$",
  ARS: "$",
  CLP: "$",
  COP: "$",
  PEN: "S/",
  KRW: "₩",
  SGD: "S$",
  MYR: "RM",
  THB: "฿",
  IDR: "Rp",
  PHP: "₱",
  VND: "₫",
  TRY: "₺",
  AED: "د.إ",
  SAR: "﷼",
  ILS: "₪",
};

// Helper function to map country codes to currencies
function getCurrencyFromCountryCode(countryCode: string): string | null {
  const countryCurrencyMap: { [key: string]: string } = {
    US: "USD",
    GB: "GBP",
    EU: "EUR",
    DE: "EUR",
    FR: "EUR",
    IT: "EUR",
    ES: "EUR",
    NL: "EUR",
    BE: "EUR",
    AT: "EUR",
    PT: "EUR",
    IE: "EUR",
    FI: "EUR",
    GR: "EUR",
    NG: "NGN",
    ZA: "ZAR",
    KE: "KES",
    GH: "GHS",
    TZ: "TZS",
    UG: "UGX",
    CA: "CAD",
    AU: "AUD",
    NZ: "NZD",
    JP: "JPY",
    CN: "CNY",
    IN: "INR",
    BR: "BRL",
    MX: "MXN",
    AR: "ARS",
    CL: "CLP",
    CO: "COP",
    PE: "PEN",
    KR: "KRW",
    SG: "SGD",
    MY: "MYR",
    TH: "THB",
    ID: "IDR",
    PH: "PHP",
    VN: "VND",
    TR: "TRY",
    AE: "AED",
    SA: "SAR",
    IL: "ILS",
  };

  return countryCurrencyMap[countryCode] || null;
}

export function useCurrency() {
  const [currencyInfo, setCurrencyInfo] = useState<CurrencyInfo>({
    currency: "USD",
    rate: 1,
    symbol: "$",
    country: "United States",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function detectCurrency() {
      try {
        // Try browser geolocation first (more accurate, requires permission)
        try {
          if (navigator.geolocation) {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                  timeout: 5000,
                  enableHighAccuracy: false,
                }
              );
            });

            // Use reverse geocoding API to get country from coordinates
            const geoResponse = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
            );

            if (geoResponse.ok) {
              const geoData = await geoResponse.json();
              if (geoData.countryCode) {
                const countryCode = geoData.countryCode;
                const country = geoData.countryName || "United States";
                const currency = getCurrencyFromCountryCode(countryCode) || "USD";

                // Get exchange rate
                const rateResponse = await fetch(`/api/currency/rate?to=${currency}`);
                if (rateResponse.ok) {
                  const rateData = await rateResponse.json();
                  const symbol = CURRENCY_SYMBOLS[currency] || currency || "$";

                  setCurrencyInfo({
                    currency: currency,
                    rate: rateData.rate || 1,
                    symbol: symbol,
                    country: country,
                  });
                  setLoading(false);
                  return; // Successfully detected using geolocation
                }
              }
            }
          }
        } catch (geoError) {
          // Geolocation failed or denied, fall through to IP detection
          console.log("Browser geolocation not available, using IP detection:", geoError);
        }

        // Fallback to IP-based location detection
        const locationResponse = await fetch("/api/currency/detect");
        if (!locationResponse.ok) {
          throw new Error("Failed to detect location");
        }
        const location = await locationResponse.json();

        // Get exchange rate
        const rateResponse = await fetch(`/api/currency/rate?to=${location.currency}`);
        if (!rateResponse.ok) {
          throw new Error("Failed to fetch exchange rate");
        }
        const rateData = await rateResponse.json();

        const currency = location.currency || "USD";
        const symbol = CURRENCY_SYMBOLS[currency] || currency || "$";

        setCurrencyInfo({
          currency: currency,
          rate: rateData.rate || 1,
          symbol: symbol,
          country: location.country || "United States",
        });
      } catch (error) {
        console.error("Error detecting currency:", error);
        // Fallback to USD
        setCurrencyInfo({
          currency: "USD",
          rate: 1,
          symbol: "$",
          country: "United States",
        });
      } finally {
        setLoading(false);
      }
    }

    detectCurrency();
  }, []);

  const convert = (usdAmount: number): number => {
    return usdAmount * currencyInfo.rate;
  };

  const format = (usdAmount: number, decimals: number = 2): string => {
    const converted = convert(usdAmount);
    // Use toLocaleString for proper number formatting
    return `${currencyInfo.symbol}${converted.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };

  return {
    ...currencyInfo,
    loading,
    convert,
    format,
  };
}

