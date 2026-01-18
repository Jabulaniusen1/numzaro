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
    const capabilities = searchParams.get("capabilities")?.split(",") || ["SMS"];
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);

    try {
      console.log(`Searching Twilio for numbers in ${countryCode} with capabilities:`, capabilities, `page: ${page}`);
      const result = await searchAvailableNumbers(countryCode, capabilities, page, pageSize);
      console.log(`Found ${result.numbers.length} numbers from Twilio (hasMore: ${result.hasMore})`);

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
        pagination: {
          page,
          pageSize,
          hasMore: result.hasMore,
        },
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








