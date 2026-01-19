import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchAvailableNumbers } from "@/lib/twilio/numbers";
import { getDefaultMonthlyCost, getPhoneNumbersMarkup } from "@/lib/twilio/costs";

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

    try {
      console.log(`Searching Twilio for ${numberType} numbers in ${countryCode} with capabilities:`, capabilities, `page: ${page}`);
      const result = await searchAvailableNumbers(countryCode, capabilities, page, pageSize, numberType);
      console.log(`Found ${result.numbers.length} ${numberType} numbers from Twilio (hasMore: ${result.hasMore})`);

      // Get current markup percentage from admin settings
      const markupPercentage = await getPhoneNumbersMarkup();
      console.log(`Using markup percentage: ${markupPercentage}%`);

      // Add pricing information
      const numbersWithPricing = await Promise.all(
        result.numbers.map(async (number) => {
          const monthlyCost = await getDefaultMonthlyCost(countryCode, markupPercentage);
          return {
            ...number,
            monthly_cost: monthlyCost,
            twilio_monthly_cost: 1.0, // Base Twilio cost (should be extracted from API)
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
      return NextResponse.json(
        { 
          error: error.message || "Failed to search numbers",
          details: error.code || error.statusCode,
          numbers: [] // Return empty array on error
        },
        { status: 500 }
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








