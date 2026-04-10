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
    const type = searchParams.get("type") ?? "history";

    const customerId = user.id.replace(/-/g, "");

    if (type === "active") {
      const data = await platfoneClient.getActiveActivations(customerId);
      return NextResponse.json(data);
    }

    const data = await platfoneClient.getActiveActivations(customerId);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[/api/platfone/activations] error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch activations" }, { status: 500 });
  }
}
