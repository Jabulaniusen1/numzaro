import { NextRequest, NextResponse } from "next/server";
import { getMinCryptoAmountUSD, NowPaymentsError } from "@/lib/nowpayments/client";

export async function GET(request: NextRequest) {
  try {
    const asset = (request.nextUrl.searchParams.get("asset") || "").toLowerCase();
    if (!asset) {
      return NextResponse.json({ error: "asset is required" }, { status: 400 });
    }

    const minAmountUSD = await getMinCryptoAmountUSD(asset);
    return NextResponse.json({ asset, minAmountUSD });
  } catch (error) {
    if (error instanceof NowPaymentsError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
    }
    console.error("Crypto minimum fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch minimum amount" }, { status: 500 });
  }
}
