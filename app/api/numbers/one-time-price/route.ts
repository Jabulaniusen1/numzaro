import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const monthlyCost = parseFloat(searchParams.get("monthlyCost") || "0");

    if (!monthlyCost || monthlyCost <= 0) {
      return NextResponse.json(
        { error: "Invalid monthlyCost parameter" },
        { status: 400 }
      );
    }

    const price = monthlyCost * 1.5; // Fixed markup

    return NextResponse.json({ price });
  } catch (error: any) {
    console.error("Error calculating one-time price:", error);
    return NextResponse.json(
      { error: "Failed to calculate price" },
      { status: 500 }
    );
  }
}

