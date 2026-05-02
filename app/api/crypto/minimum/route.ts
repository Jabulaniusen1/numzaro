import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const asset = (request.nextUrl.searchParams.get("asset") || "").toLowerCase();
  return NextResponse.json({
    asset,
    minAmountUSD: 0,
    message: "Minimum checks are handled by BTCPay at checkout.",
  });
}
