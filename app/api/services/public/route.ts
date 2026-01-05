import { NextResponse } from "next/server";
import { getServices } from "@/lib/api/socialboost";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Try to fetch services from database first
    const { data: dbServices } = await supabase
      .from("services")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    // If we have services in DB, return them
    if (dbServices && dbServices.length > 0) {
      // Normalize numeric fields to ensure they're numbers
      const normalizedServices = dbServices.map((service: any) => ({
        ...service,
        rate: Number(service.rate) || 0,
        min_quantity: Number(service.min_quantity) || 100,
        max_quantity: Number(service.max_quantity) || 10000,
      }));
      return NextResponse.json(normalizedServices);
    }

    // Otherwise, try to fetch from API (this requires API key)
    try {
      const apiServices = await getServices();

      // Return a limited set for public viewing
      const publicServices = apiServices.slice(0, 20).map((service) => ({
        id: service.service,
        service_id: service.service,
        name: service.name,
        category: service.category,
        type: service.type,
        rate: Number(service.rate) || 0,
        min_quantity: Number(service.min) || 100,
        max_quantity: Number(service.max) || 10000,
        refill_allowed: service.refill || false,
        cancel_allowed: service.cancel || false,
      }));

      return NextResponse.json(publicServices);
    } catch (apiError) {
      // If API fails, return empty array
      console.error("Error fetching from API:", apiError);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json([], { status: 500 });
  }
}

