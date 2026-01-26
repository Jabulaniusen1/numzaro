import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchAvailableNumbers } from "@/lib/twilio/numbers";
import { getDefaultMonthlyCost, getPhoneNumbersMarkup, getTwilioMonthlyCost, calculateUserPrice } from "@/lib/twilio/costs";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const countryCode = searchParams.get("country") || "US";
    // Allow empty capabilities to search without filters (less restrictive)
    const capabilitiesParam = searchParams.get("capabilities");
    const capabilities = capabilitiesParam ? capabilitiesParam.split(",") : [];
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);
    const numberType = (searchParams.get("type") || "local") as "local" | "mobile" | "tollFree";

    // Countries where mobile numbers commonly require bundles
    // These are countries where mobile numbers typically need regulatory compliance/bundles
    // We exclude mobile numbers from these countries to prevent bundle requirement errors
    const mobileBundleRequiredCountries = [
      "IL", // Israel - known to require bundles for mobile
      "GB", // UK - mobile numbers often require bundles
      "DE", // Germany - mobile numbers often require bundles
      "FR", // France - mobile numbers often require bundles
      "IT", // Italy - mobile numbers often require bundles
      "ES", // Spain - mobile numbers often require bundles
      "NL", // Netherlands - mobile numbers often require bundles
      "BE", // Belgium - mobile numbers often require bundles
      "AT", // Austria - mobile numbers often require bundles
      "CH", // Switzerland - mobile numbers often require bundles
    ];

    // For mobile numbers, be more conservative - skip countries known to require bundles
    if (numberType === "mobile" && mobileBundleRequiredCountries.includes(countryCode.toUpperCase())) {
      return NextResponse.json({
        numbers: [],
        country_code: countryCode,
        number_type: numberType,
        pagination: {
          page,
          pageSize,
          hasMore: false,
        },
        message: `Mobile numbers in ${countryCode} typically require Twilio Bundles for regulatory compliance, which are not available through this platform. Please try Local or Toll-Free numbers instead.`,
      });
    }

    try {
      console.log(`Searching Twilio for ${numberType} numbers in ${countryCode} with capabilities:`, capabilities, `page: ${page}`);
      const result = await searchAvailableNumbers(countryCode, capabilities, page, pageSize, numberType);
      console.log(`Found ${result.numbers.length} ${numberType} numbers from Twilio (hasMore: ${result.hasMore})`);

      // Get current markup percentage from admin settings
      const markupPercentage = await getPhoneNumbersMarkup();
      console.log(`Using markup percentage: ${markupPercentage}%`);

      // Add accurate pricing information - use actual price from Twilio if available
      const numbersWithPricing = await Promise.all(
        result.numbers.map(async (number) => {
          // Use the actual basePrice from Twilio if available, otherwise fallback to lookup
          const twilioCost = number.basePrice 
            ? number.basePrice 
            : getTwilioMonthlyCost(countryCode, result.numberType);
          
          // Calculate user price with markup
          const monthlyCost = calculateUserPrice(twilioCost, markupPercentage);
          return {
            ...number,
            monthly_cost: monthlyCost,
            twilio_monthly_cost: twilioCost,
          };
        })
      );

      return NextResponse.json({
        numbers: numbersWithPricing,
        country_code: countryCode,
        number_type: result.numberType,
        pagination: {
          page,
          pageSize,
          hasMore: result.hasMore,
        },
        // Add helpful message when no results
        ...(numbersWithPricing.length === 0 && {
          message: `No ${result.numberType} numbers found for ${countryCode}. Try selecting a different number type (Mobile or Toll-Free) or a different country.`,
          suggestions: [
            "Try Mobile or Toll-Free number types",
            "Some countries may have limited inventory",
            "Check if your account meets regulatory requirements for this country",
          ],
        }),
      });
    } catch (error: any) {
      console.error("Error searching numbers:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.statusCode,
        code: error.code,
        stack: error.stack,
      });
      
      // Handle authentication errors specifically
      if (error.statusCode === 401 || (error.code === 20003 && error.statusCode === 401)) {
        return NextResponse.json(
          { 
            error: "Twilio authentication failed",
            message: "Please verify your Twilio credentials are correctly configured in your environment variables (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN).",
            details: error.code || error.statusCode,
            numbers: []
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { 
          error: error.message || "Failed to search numbers",
          details: error.code || error.statusCode,
          numbers: [] // Return empty array on error
        },
        { status: error.statusCode || 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in GET /api/numbers/search:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}








