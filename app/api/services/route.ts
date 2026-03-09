import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get filter parameters from query string
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || null;
    const category = searchParams.get("category") || null;
    const type = searchParams.get("type") || null;

    // Fetch services from database only (no API call)
    console.log("Fetching services from database...");
    const { data: dbServices, error: dbError } = await supabase
      .from("services")
      .select("*")
      .order("name", { ascending: true });

    if (dbError) {
      console.error("Error fetching services from database:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch services from database", details: dbError.message },
        { status: 500 }
      );
    }

    if (!dbServices || dbServices.length === 0) {
      return NextResponse.json({
        services: [],
        filters: {
          categories: [],
          types: [],
        },
      });
        }

    // Normalize services from database (with markup already applied)
    console.log(`Normalizing ${dbServices.length} services from database...`);
    let normalizedServices = dbServices.map((service: any) => ({
      id: service.id, // Database primary key
      service_id: service.service_id, // SHOPRIME API ID
      name: service.name || "",
      category: service.category || "",
      type: service.type || "",
      rate: parseFloat(service.rate) || 0,
      cost_rate: parseFloat(service.cost_rate) || 0,
      markup_percentage: parseFloat(service.markup_percentage) || 0,
      min_quantity: service.min_quantity || 1,
      max_quantity: service.max_quantity || 1000000,
      refill_allowed: service.refill_allowed || false,
      cancel_allowed: service.cancel_allowed || false,
    }));

    // Apply filters
        if (search) {
          const searchLower = search.toLowerCase();
      normalizedServices = normalizedServices.filter((s: any) =>
        s.name.toLowerCase().includes(searchLower) ||
        s.category?.toLowerCase().includes(searchLower) ||
              s.type?.toLowerCase().includes(searchLower)
          );
        }

    if (category) {
      normalizedServices = normalizedServices.filter((s: any) => 
        s.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (type) {
      normalizedServices = normalizedServices.filter((s: any) => 
        s.type?.toLowerCase() === type.toLowerCase()
          );
        }

      // Get unique categories and types for filters
      const categories = [...new Set(normalizedServices.map((s: any) => s.category).filter(Boolean))].sort();
      const types = [...new Set(normalizedServices.map((s: any) => s.type).filter(Boolean))].sort();

        return NextResponse.json({
        services: normalizedServices,
        filters: {
          categories,
          types,
          },
        });
  } catch (error) {
    console.error("Error fetching services:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch services", details: errorMessage },
      { status: 500 }
    );
  }
}
