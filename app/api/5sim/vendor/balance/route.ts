import { NextRequest, NextResponse } from "next/server";
import { fiveSimClient } from "@/lib/5sim/client";

export async function GET(request: NextRequest) {
  try {
    const vendorProfile = await fiveSimClient.getVendorProfile();
    
    return NextResponse.json({
      balance: vendorProfile.balance,
      frozen_balance: vendorProfile.frozen_balance,
      currency: "RUB", // 5sim.net uses RUB by default
      rating: vendorProfile.rating
    });
  } catch (error: any) {
    console.error("Error fetching 5sim.net vendor balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor balance" },
      { status: 500 }
    );
  }
}
