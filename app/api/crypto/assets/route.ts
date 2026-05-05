import { NextResponse } from "next/server";
import { getHeleketPaymentServices, HeleketError } from "@/lib/heleket/client";

export async function GET() {
  try {
    const services = await getHeleketPaymentServices();
    const assets = services
      .filter((service) => service?.is_available !== false)
      .map((service) => ({
        currency: String(service?.currency || "").toUpperCase(),
        network: String(service?.network || "").toLowerCase(),
        enabled: Boolean(service?.is_enabled),
      }));

    return NextResponse.json({ assets }, { status: 200 });
  } catch (error) {
    if (error instanceof HeleketError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
    }
    return NextResponse.json({ error: "Failed to load assets" }, { status: 500 });
  }
}
