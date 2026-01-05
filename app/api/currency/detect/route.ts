import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get IP address from headers (works with Vercel, Cloudflare, etc.)
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    
    // Determine the IP to use - prioritize forwarded, then real-ip, then don't specify (let API detect)
    let ip = forwarded 
      ? forwarded.split(",")[0].trim() 
      : realIp || null;

    // If no IP or it's localhost/private IP, let the API detect automatically
    if (ip && (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172."))) {
      ip = null;
    }

    // Use ipapi.co (free tier: 1000 requests/day with HTTPS support)
    // Alternative: Use ip-api.com with HTTP (free, but not secure in production)
    // If no IP provided, it will detect based on the server's IP
    const url = ip 
      ? `https://ipapi.co/${ip}/json/`
      : `https://ipapi.co/json/`;
    
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
      headers: {
        'User-Agent': 'SocialBoost/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch location");
    }

    const data = await response.json();

    // ipapi.co returns error field if there's an issue
    if (data.error) {
      console.error("IP API returned error:", data.reason || "Unknown error");
      // Fallback to USD
      return NextResponse.json({
        country: "United States",
        countryCode: "US",
        currency: "USD",
      });
    }

    // ipapi.co returns country_code (not countryCode) and country_name (not country)
    // Currency is not directly available, so we map from country code
    const countryCode = data.country_code || data.country || "US";
    const country = data.country_name || data.country || "United States";
    const currency = getCurrencyFromCountryCode(countryCode) || "USD";
    
    return NextResponse.json({
      country: country,
      countryCode: countryCode,
      currency: currency,
    });
  } catch (error) {
    console.error("Error detecting location:", error);
    // Fallback to USD
    return NextResponse.json({
      country: "United States",
      countryCode: "US",
      currency: "USD",
    });
  }
}

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

