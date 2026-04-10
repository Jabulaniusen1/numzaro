import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { platfoneClient } from "@/lib/platfone/client";
import { getServiceMeta } from "@/lib/platfone/service-map";

/**
 * GET /api/platfone/services
 *
 * Uses GET /activation/services/popular (falls back to /activation/services).
 * Augments with availability counts from GET /activation/prices/services.
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [rawServices, pricesList] = await Promise.all([
      platfoneClient.getPopularServices().catch(() => platfoneClient.getServices()),
      platfoneClient.getPricesByService().catch(() => []),
    ]);

    // Build availability map from prices: { service_id: totalCount }
    const availabilityMap: Record<string, number> = {};
    for (const svc of pricesList) {
      const total = svc.countries.reduce((sum, c) => sum + (c.count ?? 0), 0);
      availabilityMap[svc.service_id] = total;
    }

    const services = rawServices
      .filter((svc) => !svc.prohibited)
      .map((svc) => {
        const meta = getServiceMeta(svc.service_id);
        return {
          code: svc.service_id,
          name: svc.name ?? meta.name,
          color: meta.color,
          totalAvailable: availabilityMap[svc.service_id] ?? 0,
          priority: meta.priority,
        };
      })
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.totalAvailable - a.totalAvailable;
      });

    return NextResponse.json({ services });
  } catch (error: any) {
    console.error("[/api/platfone/services] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch Platfone services" },
      { status: 500 }
    );
  }
}
