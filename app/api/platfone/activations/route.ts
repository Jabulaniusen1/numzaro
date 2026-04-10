import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { platfoneClient } from "@/lib/platfone/client";

/**
 * GET /api/platfone/activations?type=active|history&page=1&per_page=25
 *
 * Lists activations from the Platfone account (admin/debug use).
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const type    = searchParams.get("type") ?? "history";
    const page    = Math.max(1, parseInt(searchParams.get("page")     ?? "1",  10));
    const perPage = Math.min(100, parseInt(searchParams.get("per_page") ?? "25", 10));

    if (type === "active") {
      const data = await platfoneClient.getActiveActivations();
      return NextResponse.json(data);
    }

    const data = await platfoneClient.getActivationHistory(page, perPage);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[/api/platfone/activations] error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch activations" }, { status: 500 });
  }
}
