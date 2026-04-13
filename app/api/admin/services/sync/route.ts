import { NextRequest, NextResponse } from "next/server";
import { getServices, Service as ProviderService } from "@/lib/api/socialboost";
import { authenticateRequest } from "@/lib/supabase/server";

const DEFAULT_MARKUP = 30;

function isAdmin(email?: string | null) {
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || [];
  return adminEmails.includes(email || "");
}

function toPositiveInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.floor(value);
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function mapProviderServiceToDbRow(
  service: ProviderService,
  markupPercentage: number,
  options?: { forceVisible?: boolean }
) {
  const serviceId = toPositiveInt(service.service);
  if (!serviceId) return null;

  const costRate = parseFloat(service.rate) || 0;
  const sellingRate = costRate * (1 + markupPercentage / 100);
  const minQuantity =
    typeof service.min === "string"
      ? parseInt(service.min, 10)
      : typeof service.min === "number"
        ? service.min
        : 1;
  const maxQuantity =
    typeof service.max === "string"
      ? parseInt(service.max, 10)
      : typeof service.max === "number"
        ? service.max
        : 1000000;

  return {
    service_id: serviceId,
    name: service.name || "",
    category: service.category || "",
    type: service.type || "",
    cost_rate: costRate,
    rate: sellingRate,
    markup_percentage: markupPercentage,
    min_quantity: Number.isFinite(minQuantity) && minQuantity > 0 ? minQuantity : 1,
    max_quantity: Number.isFinite(maxQuantity) && maxQuantity > 0 ? maxQuantity : 1000000,
    refill_allowed: service.refill || false,
    cancel_allowed: service.cancel || false,
    ...(options?.forceVisible ? { is_hidden: false } : {}),
  };
}

// GET /api/admin/services/sync
// Default mode: returns distinct categories + total count from provider API.
// list=1 mode: returns paginated provider services with "already in DB" metadata.
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const apiServices = await getServices();
    if (!apiServices || apiServices.length === 0) {
      return NextResponse.json({ categories: [], total: 0, services: [] });
    }

    const categorySet = new Set<string>();
    for (const s of apiServices) {
      if (s.category) categorySet.add(s.category);
    }
    const categories = Array.from(categorySet).sort();

    const searchParams = request.nextUrl.searchParams;
    const listMode = searchParams.get("list") === "1";
    if (!listMode) {
      return NextResponse.json({ categories, total: apiServices.length });
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const category = (searchParams.get("category") || "").trim();

    let filtered = apiServices;
    if (category) {
      filtered = filtered.filter((s) => (s.category || "") === category);
    }
    if (search) {
      filtered = filtered.filter((s) => {
        const sid = String(s.service || "");
        return (
          sid.includes(search) ||
          (s.name || "").toLowerCase().includes(search) ||
          (s.category || "").toLowerCase().includes(search) ||
          (s.type || "").toLowerCase().includes(search)
        );
      });
    }

    const total = filtered.length;
    const from = (page - 1) * limit;
    const to = from + limit;
    const pageItems = filtered.slice(from, to);

    const serviceIdsOnPage = Array.from(
      new Set(pageItems.map((s) => toPositiveInt(s.service)).filter((id): id is number => id !== null))
    );

    const existingByServiceId = new Map<number, { id: number; is_hidden: boolean }>();
    if (serviceIdsOnPage.length > 0) {
      const { data: existingRows, error: existingError } = await supabase
        .from("services")
        .select("id, service_id, is_hidden")
        .in("service_id", serviceIdsOnPage);

      if (existingError) {
        console.error("Admin sync GET list mode DB lookup error:", existingError);
        return NextResponse.json({ error: "Failed to check existing services" }, { status: 500 });
      }

      for (const row of existingRows || []) {
        const sid = toPositiveInt(row.service_id);
        const rid = toPositiveInt(row.id);
        if (!sid || !rid) continue;
        existingByServiceId.set(sid, { id: rid, is_hidden: !!row.is_hidden });
      }
    }

    return NextResponse.json({
      categories,
      apiTotal: apiServices.length,
      total,
      services: pageItems.map((s) => {
        const sid = toPositiveInt(s.service);
        const existing = sid ? existingByServiceId.get(sid) : undefined;
        return {
          service_id: sid ?? s.service,
          name: s.name || "",
          category: s.category || "",
          type: s.type || "",
          rate: parseFloat(s.rate) || 0,
          min_quantity: toPositiveInt(s.min) || 1,
          max_quantity: toPositiveInt(s.max) || 1000000,
          refill_allowed: !!s.refill,
          cancel_allowed: !!s.cancel,
          exists_in_db: !!existing,
          db_service_id: existing?.id ?? null,
          is_hidden: existing?.is_hidden ?? false,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error: any) {
    console.error("Admin sync GET error:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Parse optional filters from request body.
    // If serviceIds are supplied, they take precedence over category/limit filters.
    let selectedCategories: string[] = [];
    let limitFilter = 0;
    let selectedServiceIds: number[] = [];
    try {
      const body = await request.json().catch(() => ({}));
      if (Array.isArray(body?.categories)) {
        selectedCategories = body.categories.filter((c: unknown) => typeof c === "string" && c.trim());
      }
      limitFilter = typeof body?.limit === "number" && body.limit > 0 ? Math.floor(body.limit) : 0;
      if (Array.isArray(body?.serviceIds)) {
        selectedServiceIds = Array.from(
          new Set(
            body.serviceIds
              .map((id: unknown) => toPositiveInt(id))
              .filter((id: number | null): id is number => id !== null)
          )
        );
      }
    } catch {
      // No body — proceed with no filters
    }
    const hasExplicitSelection = selectedServiceIds.length > 0;

    // Get default markup percentage from admin settings
    const { data: markupSetting } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "default_markup_percentage")
      .single();

    const rawMarkup = markupSetting ? parseFloat(markupSetting.value) : DEFAULT_MARKUP;
    const markupPercentage =
      Number.isFinite(rawMarkup) && rawMarkup >= 0 ? Math.min(rawMarkup, 10000) : DEFAULT_MARKUP;

    console.log("Admin sync: Fetching services from JAP API...");

    // Fetch services from JAP API
    let apiServices;
    try {
      apiServices = await getServices();
      console.log(`Admin sync: Fetched ${apiServices?.length || 0} services from JAP API`);
    } catch (apiError: any) {
      console.error("Admin sync: Error fetching services from JAP API:", apiError);
      return NextResponse.json(
        { error: "Failed to fetch services from JAP API", details: apiError.message },
        { status: 500 }
      );
    }

    if (!apiServices || apiServices.length === 0) {
      return NextResponse.json(
        { error: "No services received from JAP API" },
        { status: 500 }
      );
    }

    if (hasExplicitSelection) {
      const selectedSet = new Set(selectedServiceIds);
      apiServices = apiServices.filter((s) => {
        const sid = toPositiveInt(s.service);
        return sid !== null && selectedSet.has(sid);
      });
      console.log(
        `Admin sync: After explicit service selection (${selectedServiceIds.length} selected): ${apiServices.length} services`
      );
    } else {
      // Apply category filter (exact match against selected set)
      if (selectedCategories.length > 0) {
        const categorySet = new Set(selectedCategories);
        apiServices = apiServices.filter((s) => categorySet.has(s.category || ""));
        console.log(
          `Admin sync: After category filter (${selectedCategories.length} selected): ${apiServices.length} services`
        );
      }

      // Apply limit
      if (limitFilter > 0 && apiServices.length > limitFilter) {
        apiServices = apiServices.slice(0, limitFilter);
        console.log(`Admin sync: After limit ${limitFilter}: ${apiServices.length} services`);
      }
    }

    if (apiServices.length === 0) {
      return NextResponse.json(
        { error: hasExplicitSelection ? "No matching selected services found" : "No services matched the selected filters" },
        { status: 400 }
      );
    }

    // Prepare services for batch upsert
    console.log(`Admin sync: Preparing ${apiServices.length} services for database sync...`);
    
    const servicesToUpsert = apiServices
      .map((service) =>
        mapProviderServiceToDbRow(service, markupPercentage, {
          // Explicit admin selection should ensure services are visible on the site.
          forceVisible: hasExplicitSelection,
        })
      )
      .filter((s): s is NonNullable<typeof s> => !!s);

    if (servicesToUpsert.length === 0) {
      return NextResponse.json(
        { error: "No valid services found to sync" },
        { status: 400 }
      );
    }

    // Batch upsert all services at once
    console.log(`Admin sync: Upserting ${servicesToUpsert.length} services to database...`);
    
    const { error: upsertError } = await supabase
      .from("services")
      .upsert(servicesToUpsert, {
        onConflict: "service_id",
      });

    if (upsertError) {
      console.error("Admin sync: Error upserting services:", upsertError);
      return NextResponse.json(
        { error: "Failed to sync services to database", details: upsertError.message },
        { status: 500 }
      );
    }

    console.log(`Admin sync: Successfully synced ${servicesToUpsert.length} services to database`);

    return NextResponse.json({
      success: true,
      message: hasExplicitSelection
        ? `Successfully added ${servicesToUpsert.length} selected services`
        : `Successfully synced ${servicesToUpsert.length} services`,
      count: servicesToUpsert.length,
      mode: hasExplicitSelection ? "selected" : "filtered",
    });

  } catch (error: any) {
    console.error("Admin sync: Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
