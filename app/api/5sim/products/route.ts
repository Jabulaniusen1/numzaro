import { NextRequest, NextResponse } from "next/server";
import { getAvailableProducts } from "@/lib/5sim/adapter";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const operator = searchParams.get("operator") || "any";

    if (!country) {
      return NextResponse.json(
        { error: "Country parameter is required" },
        { status: 400 }
      );
    }

    const products = await getAvailableProducts(country, operator);
    
    return NextResponse.json(products);
  } catch (error: any) {
    console.error("Error fetching 5sim.net products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
