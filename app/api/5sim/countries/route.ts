import { NextRequest, NextResponse } from "next/server";
import { getAvailableCountries } from "@/lib/5sim/adapter";

export async function GET(request: NextRequest) {
  try {
    const countries = await getAvailableCountries();
    
    return NextResponse.json(countries);
  } catch (error: any) {
    console.error("Error fetching 5sim.net countries:", error);
    return NextResponse.json(
      { error: "Failed to fetch countries" },
      { status: 500 }
    );
  }
}
