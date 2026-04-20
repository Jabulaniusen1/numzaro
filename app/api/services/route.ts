import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { getServices } from "@/lib/api/socialboost";

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || null;
    const category = searchParams.get("category") || null;
    const type = searchParams.get("type") || null;

    // Fetch all DB services by paginating in chunks of 1000 (Supabase default cap)
    async function fetchAllServices() {
      const PAGE = 1000;
      const rows: any[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from("services")
          .select("service_id, id, name, category, type, cost_rate, min_quantity, max_quantity, refill_allowed, cancel_allowed")
          .eq("is_hidden", false)
          .order("name", { ascending: true })
          .range(from, from + PAGE - 1);
        if (error) return { data: null, error };
        if (!data || data.length === 0) break;
        rows.push(...data);
        if (data.length < PAGE) break;
        from += PAGE;
      }
      return { data: rows, error: null };
    }

    // Fetch markup and DB services in parallel
    const [{ data: markupSetting }, { data: dbServices, error: dbError }, apiServicesResult] =
      await Promise.all([
        supabase
          .from("admin_settings")
          .select("value")
          .eq("key", "default_markup_percentage")
          .single(),
        fetchAllServices(),
        getServices().catch(() => null),
      ]);

    if (dbError) {
      return NextResponse.json(
        { error: "Failed to fetch services", details: dbError.message },
        { status: 500 }
      );
    }

    if (!dbServices || dbServices.length === 0) {
      return NextResponse.json({ services: [], filters: { categories: [], types: [] } });
    }

    // Markup — cap at 10 000 % to guard against corrupt DB values
    const rawMarkup = markupSetting ? parseFloat(markupSetting.value) : 30.0;
    const markupPercentage =
      Number.isFinite(rawMarkup) && rawMarkup >= 0 ? Math.min(rawMarkup, 10000) : 30.0;
    const markupMultiplier = 1 + markupPercentage / 100;

    // Build a map of live API rates keyed by provider service_id
    const liveRateMap: Record<string, number> = {};
    if (Array.isArray(apiServicesResult)) {
      for (const s of apiServicesResult) {
        const r = parseFloat(s.rate);
        if (!isNaN(r) && r > 0) {
          liveRateMap[String(s.service)] = r;
        }
      }
    }

    let normalizedServices = dbServices.map((service: any) => {
      // Prefer live API rate; fall back to stored cost_rate
      const liveRate = liveRateMap[String(service.service_id)];
      const costRate = liveRate ?? parseFloat(service.cost_rate) ?? 0;

      return {
        id: service.id,
        service_id: service.service_id,
        name: service.name || "",
        category: service.category || "",
        type: service.type || "",
        cost_rate: costRate,
        rate: parseFloat((costRate * markupMultiplier).toFixed(4)),
        markup_percentage: markupPercentage,
        min_quantity: service.min_quantity || 1,
        max_quantity: service.max_quantity || 1000000,
        refill_allowed: service.refill_allowed || false,
        cancel_allowed: service.cancel_allowed || false,
      };
    });

    // Apply filters
    if (search) {
      const q = search.toLowerCase();
      normalizedServices = normalizedServices.filter(
        (s: any) =>
          s.name.toLowerCase().includes(q) ||
          s.category?.toLowerCase().includes(q) ||
          s.type?.toLowerCase().includes(q)
      );
    }
    if (category) {
      normalizedServices = normalizedServices.filter(
        (s: any) => s.category?.toLowerCase() === category.toLowerCase()
      );
    }
    if (type) {
      normalizedServices = normalizedServices.filter(
        (s: any) => s.type?.toLowerCase() === type.toLowerCase()
      );
    }

    const categories = [
      ...new Set(normalizedServices.map((s: any) => s.category).filter(Boolean)),
    ].sort();
    const types = [
      ...new Set(normalizedServices.map((s: any) => s.type).filter(Boolean)),
    ].sort();

    return NextResponse.json({ services: normalizedServices, filters: { categories, types } });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
