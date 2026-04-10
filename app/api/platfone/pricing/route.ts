import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { platfoneClient } from "@/lib/platfone/client";

/**
 * GET /api/platfone/pricing
 *
 * Returns Platfone pricing data.
 * Optional query params: ?service=ig  ?country=6
 *
 * Response: raw Platfone pricing response
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const service = searchParams.get("service") ?? undefined;
    const country = searchParams.get("country") ?? undefined;

    const data = await platfoneClient.getPricing({
      service,
      country: country !== undefined ? Number(country) : undefined,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[/api/platfone/pricing] error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch pricing" }, { status: 500 });
  }
}
