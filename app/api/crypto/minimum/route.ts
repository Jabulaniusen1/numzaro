import { NextRequest, NextResponse } from "next/server";
import { getHeleketPaymentServices, HeleketError } from "@/lib/heleket/client";

export async function GET(request: NextRequest) {
  try {
    const asset = (request.nextUrl.searchParams.get("asset") || "").toLowerCase();
    const network = (request.nextUrl.searchParams.get("network") || "").toLowerCase();
    const services = await getHeleketPaymentServices();

    const match = services.find((service) => {
      const c = String(service?.currency || "").toLowerCase();
      const n = String(service?.network || "").toLowerCase();
      if (asset && network) return c === asset && n === network;
      if (asset) return c === asset;
      return false;
    });

    const minAmountUSD = Number(match?.limit?.min_usd || match?.limit?.min || 0);
    return NextResponse.json({ asset, network, minAmountUSD });
  } catch (error) {
    if (error instanceof HeleketError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
    }
    return NextResponse.json({ error: "Failed to get minimum amount" }, { status: 500 });
  }
}
