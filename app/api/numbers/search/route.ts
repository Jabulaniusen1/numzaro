import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchAvailableNumbers } from "@/lib/twilio/numbers";
import { getDefaultMonthlyCost } from "@/lib/twilio/costs";

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

    try {
      const availableNumbers = await searchAvailableNumbers(countryCode, capabilities);

      // Add pricing information
      const numbersWithPricing = availableNumbers.map((number) => {
        const monthlyCost = getDefaultMonthlyCost(countryCode);
        return {
          ...number,
          monthly_cost: monthlyCost,
          twilio_monthly_cost: 1.0, // Base Twilio cost
        };
      });

      return NextResponse.json({
        numbers: numbersWithPricing,
        country_code: countryCode,
      });
    } catch (error: any) {
      console.error("Error searching numbers:", error);
      return NextResponse.json(
        { error: error.message || "Failed to search numbers" },
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








