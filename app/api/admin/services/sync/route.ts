import { NextRequest, NextResponse } from "next/server";
import { getServices } from "@/lib/api/socialboost";
import { authenticateRequest } from "@/lib/supabase/server";

// GET /api/admin/services/sync — returns distinct categories + total count from the API
export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || [];
    if (!adminEmails.includes(user.email || ""))
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });

    const apiServices = await getServices();
    if (!apiServices || apiServices.length === 0) {
      return NextResponse.json({ categories: [], total: 0 });
    }

    const categorySet = new Set<string>();
    for (const s of apiServices) {
      if (s.category) categorySet.add(s.category);
    }
    const categories = Array.from(categorySet).sort();

    return NextResponse.json({ categories, total: apiServices.length });
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

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim()) || [];
    if (!adminEmails.includes(user.email || "")) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Get default markup percentage from admin settings
    const { data: markupSetting } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "default_markup_percentage")
      .single();
    
    const markupPercentage = markupSetting 
      ? parseFloat(markupSetting.value) 
      : 30.00; // Default 30% markup

    // Parse optional filters from request body
    let selectedCategories: string[] = [];
    let limitFilter = 0;
    try {
      const body = await request.json().catch(() => ({}));
      if (Array.isArray(body?.categories)) {
        selectedCategories = body.categories.filter((c: unknown) => typeof c === "string" && c.trim());
      }
      limitFilter = typeof body?.limit === "number" && body.limit > 0 ? Math.floor(body.limit) : 0;
    } catch {
      // No body — proceed with no filters
    }

    console.log("Admin sync: Fetching services from SMMFollows API...");

    // Fetch services from SMMFollows API
    let apiServices;
    try {
      apiServices = await getServices();
      console.log(`Admin sync: Fetched ${apiServices?.length || 0} services from SMMFollows API`);
    } catch (apiError: any) {
      console.error("Admin sync: Error fetching services from SMMFollows API:", apiError);
      return NextResponse.json(
        { error: "Failed to fetch services from SMMFollows API", details: apiError.message },
        { status: 500 }
      );
    }

    if (!apiServices || apiServices.length === 0) {
      return NextResponse.json(
        { error: "No services received from SMMFollows API" },
        { status: 500 }
      );
    }

    // Apply category filter (exact match against selected set)
    if (selectedCategories.length > 0) {
      const categorySet = new Set(selectedCategories);
      apiServices = apiServices.filter((s) => categorySet.has(s.category || ""));
      console.log(`Admin sync: After category filter (${selectedCategories.length} selected): ${apiServices.length} services`);
    }

    // Apply limit
    if (limitFilter > 0 && apiServices.length > limitFilter) {
      apiServices = apiServices.slice(0, limitFilter);
      console.log(`Admin sync: After limit ${limitFilter}: ${apiServices.length} services`);
    }

    if (apiServices.length === 0) {
      return NextResponse.json(
        { error: "No services matched the selected filters" },
        { status: 400 }
      );
    }

    // Prepare services for batch upsert
    console.log(`Admin sync: Preparing ${apiServices.length} services for database sync...`);
    
    const servicesToUpsert = apiServices.map((service) => {
      const costRate = parseFloat(service.rate) || 0;
      const sellingRate = costRate * (1 + markupPercentage / 100);
      const minQuantity = typeof service.min === 'string' ? parseInt(service.min, 10) : (typeof service.min === 'number' ? service.min : 1);
      const maxQuantity = typeof service.max === 'string' ? parseInt(service.max, 10) : (typeof service.max === 'number' ? service.max : 1000000);

      return {
        service_id: service.service,
        name: service.name || "",
        category: service.category || "",
        type: service.type || "",
        cost_rate: costRate,
        rate: sellingRate,
        markup_percentage: markupPercentage,
        min_quantity: minQuantity,
        max_quantity: maxQuantity,
        refill_allowed: service.refill || false,
        cancel_allowed: service.cancel || false,
      };
    });

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
      message: `Successfully synced ${servicesToUpsert.length} services`,
      count: servicesToUpsert.length,
    });

  } catch (error: any) {
    console.error("Admin sync: Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
