import { NextRequest, NextResponse } from "next/server";
import { fiveSimClient } from "@/lib/5sim/client";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country") || undefined;
    // Accept both "product" (5Sim native) and "service" (legacy) param names
    const product = searchParams.get("product") || searchParams.get("service") || undefined;

    // Get profit markup percentage from admin settings
    const supabase = await createClient();
    const { data: markupSetting } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "phone_numbers_markup_percentage")
      .single();
    
    const markupPercentage = markupSetting ? parseFloat(markupSetting.value) : 0; // Default 0% (no markup)
    const markupMultiplier = 1 + (markupPercentage / 100);

    const prices = await fiveSimClient.getPrices({ country, product });

    // Apply markup to all prices
    const applyMarkup = (prices: any): any => {
      if (typeof prices !== 'object' || prices === null) return prices;
      
      if (Array.isArray(prices)) {
        return prices.map(item => applyMarkup(item));
      }
      
      // Check if this is a price object with cost field
      if (typeof prices === 'object' && 'cost' in prices && typeof prices.cost === 'number') {
        return {
          ...prices,
          cost: prices.cost * markupMultiplier,
          original_cost: prices.cost, // Keep original for reference
        };
      }
      
      // Recursively apply to nested objects
      const result: any = {};
      for (const [key, value] of Object.entries(prices)) {
        result[key] = applyMarkup(value);
      }
      return result;
    };

    const markedUpPrices = applyMarkup(prices);

    return NextResponse.json(markedUpPrices);
  } catch (error: any) {
    console.error("Error fetching 5sim prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
}
