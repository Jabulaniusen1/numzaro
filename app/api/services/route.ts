import { NextResponse } from "next/server";
import { getServices } from "@/lib/api/socialboost";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to fetch services from database first (fallback)
    const { data: dbServices, error: dbError } = await supabase
      .from("services")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    // Try to fetch and sync from API
    let apiServices = null;
    try {
      apiServices = await getServices();

      // Get default markup percentage from admin settings
      const { data: markupSetting } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "default_markup_percentage")
        .single();
      
      const markupPercentage = markupSetting 
        ? parseFloat(markupSetting.value) 
        : 30.00; // Default 30% markup

      // Sync services with database
      if (apiServices && apiServices.length > 0) {
        for (const service of apiServices) {
          const costRate = parseFloat(service.rate); // API cost price
          const sellingRate = costRate * (1 + markupPercentage / 100); // Your selling price with markup
          
          await supabase
            .from("services")
            .upsert(
              {
                service_id: service.service,
                name: service.name,
                category: service.category,
                type: service.type,
                cost_rate: costRate, // Store API cost
                rate: sellingRate, // Store selling price with markup
                markup_percentage: markupPercentage,
                min_quantity: parseInt(service.min),
                max_quantity: parseInt(service.max),
                refill_allowed: service.refill,
                cancel_allowed: service.cancel,
              },
              {
                onConflict: "service_id",
              }
            );
        }

        // Fetch updated services from database
        const { data: updatedServices, error: fetchError } = await supabase
          .from("services")
          .select("*")
          .order("category", { ascending: true })
          .order("name", { ascending: true });

        if (!fetchError && updatedServices && updatedServices.length > 0) {
          // Normalize numeric fields and ensure rate is calculated with current markup
          const normalizedServices = updatedServices.map((service: any) => {
            const costRate = service.cost_rate ? parseFloat(service.cost_rate) : null;
            // Always recalculate rate from cost_rate with current markup
            const rate = costRate 
              ? costRate * (1 + markupPercentage / 100)
              : (Number(service.rate) || 0);
            
            return {
              ...service,
              rate: rate,
              cost_rate: costRate || service.cost_rate,
              markup_percentage: markupPercentage,
              min_quantity: Number(service.min_quantity) || 100,
              max_quantity: Number(service.max_quantity) || 10000,
            };
          });
          return NextResponse.json(normalizedServices);
        }
      }
    } catch (apiError) {
      console.error("Error fetching services from API:", apiError);
      // If API fails but we have database services, return those with recalculated rates
      if (dbServices && dbServices.length > 0) {
        // Get current markup percentage to ensure rates are up to date
        const { data: markupSetting } = await supabase
          .from("admin_settings")
          .select("value")
          .eq("key", "default_markup_percentage")
          .single();
        
        const currentMarkup = markupSetting 
          ? parseFloat(markupSetting.value) 
          : 30.00;

        // Recalculate rates with current markup
        const normalizedServices = dbServices.map((service: any) => {
          const costRate = service.cost_rate ? parseFloat(service.cost_rate) : null;
          const rate = costRate 
            ? costRate * (1 + currentMarkup / 100)
            : (Number(service.rate) || 0);
          
          return {
            ...service,
            rate: rate,
            cost_rate: costRate || service.cost_rate,
            markup_percentage: currentMarkup,
            min_quantity: Number(service.min_quantity) || 100,
            max_quantity: Number(service.max_quantity) || 10000,
          };
        });
        return NextResponse.json(normalizedServices);
      }
      // If API fails and no database services, return error with details
      const errorMessage = apiError instanceof Error ? apiError.message : "Unknown error";
      return NextResponse.json(
        { error: "Failed to fetch services from API", details: errorMessage },
        { status: 500 }
      );
    }

    // Return database services if available
    if (dbServices && dbServices.length > 0) {
      // Get current markup percentage to ensure rates are up to date
      const { data: markupSetting } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "default_markup_percentage")
        .single();
      
      const currentMarkup = markupSetting 
        ? parseFloat(markupSetting.value) 
        : 30.00;

      // Normalize numeric fields and recalculate rate if cost_rate exists
      const normalizedServices = dbServices.map((service: any) => {
        const costRate = service.cost_rate ? parseFloat(service.cost_rate) : null;
        // If cost_rate exists, recalculate rate with current markup
        // Otherwise use the stored rate
        const rate = costRate 
          ? costRate * (1 + currentMarkup / 100)
          : (Number(service.rate) || 0);
        
        return {
          ...service,
          rate: rate,
          cost_rate: costRate || service.cost_rate,
          markup_percentage: currentMarkup,
          min_quantity: Number(service.min_quantity) || 100,
          max_quantity: Number(service.max_quantity) || 10000,
        };
      });
      return NextResponse.json(normalizedServices);
    }

    // Last resort: return API services if we got them
    if (apiServices && apiServices.length > 0) {
      // Get current markup percentage
      const { data: markupSetting } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "default_markup_percentage")
        .single();
      
      const currentMarkup = markupSetting 
        ? parseFloat(markupSetting.value) 
        : 30.00;

      // Normalize API services and apply markup
      const normalizedServices = apiServices.map((service: any) => {
        const costRate = Number(service.rate) || 0;
        const sellingRate = costRate * (1 + currentMarkup / 100);
        
        return {
          id: service.service,
          service_id: service.service,
          name: service.name,
          category: service.category,
          type: service.type,
          rate: sellingRate, // Apply markup to API rate
          cost_rate: costRate, // Store original API rate as cost
          markup_percentage: currentMarkup,
          min_quantity: Number(service.min) || 100,
          max_quantity: Number(service.max) || 10000,
          refill_allowed: service.refill || false,
          cancel_allowed: service.cancel || false,
        };
      });
      return NextResponse.json(normalizedServices);
    }

    // No services available
    return NextResponse.json(
      { error: "No services available" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching services:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch services", details: errorMessage },
      { status: 500 }
    );
  }
}

