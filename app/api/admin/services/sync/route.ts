import { NextRequest, NextResponse } from "next/server";
import { getServices } from "@/lib/api/socialboost";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    console.log("Admin sync: Fetching services from SHOPRIME API...");

    // Fetch services from SHOPRIME API
    let apiServices;
    try {
      apiServices = await getServices();
      console.log(`Admin sync: Fetched ${apiServices?.length || 0} services from SHOPRIME API`);
    } catch (apiError: any) {
      console.error("Admin sync: Error fetching services from SHOPRIME API:", apiError);
      return NextResponse.json(
        { error: "Failed to fetch services from SHOPRIME API", details: apiError.message },
        { status: 500 }
      );
    }

    if (!apiServices || apiServices.length === 0) {
      return NextResponse.json(
        { error: "No services received from SHOPRIME API" },
        { status: 500 }
      );
    }

    // Prepare all services for batch upsert
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

