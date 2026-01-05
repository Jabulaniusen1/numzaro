import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOrder, getServices } from "@/lib/api/socialboost";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { service_id: rawServiceId, link, quantity: rawQuantity, comments } = body;

    if (!rawServiceId || !link || rawQuantity === undefined || rawQuantity === null) {
      return NextResponse.json(
        { error: "Missing required fields", received: { service_id: rawServiceId, link: !!link, quantity: rawQuantity } },
        { status: 400 }
      );
    }

    // Validate and convert quantity to integer
    const quantity = typeof rawQuantity === "string" ? parseInt(rawQuantity, 10) : Math.floor(Number(rawQuantity));
    
    if (isNaN(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: "Invalid quantity", details: `Quantity must be a positive number. Received: ${rawQuantity}` },
        { status: 400 }
      );
    }

    // service_id should be the external API service_id
    const apiServiceId = typeof rawServiceId === "string" ? parseInt(rawServiceId, 10) : rawServiceId;

    if (isNaN(apiServiceId)) {
      return NextResponse.json(
        { error: "Invalid service_id", received: rawServiceId },
        { status: 400 }
      );
    }

    // Get service details from external API
    let apiServices;
    try {
      apiServices = await getServices();
    } catch (apiError: any) {
      console.error("Error fetching services from API:", apiError);
      return NextResponse.json(
        { error: "Failed to fetch services from API", details: apiError.message },
        { status: 500 }
      );
    }

    if (!Array.isArray(apiServices) || apiServices.length === 0) {
      return NextResponse.json(
        { error: "No services available", details: "API returned no services" },
        { status: 500 }
      );
    }

    // Find service by service ID (the API uses 'service' field, which is a number)
    const apiService = apiServices.find((s) => {
      // Handle both string and number comparison
      const serviceId = typeof s.service === 'string' ? parseInt(s.service, 10) : s.service;
      return serviceId === apiServiceId;
    });

    if (!apiService) {
      console.error(`Service ${apiServiceId} not found. Available service IDs:`, 
        apiServices.map(s => s.service).slice(0, 10).join(', '), 
        `... (total: ${apiServices.length})`
      );
      return NextResponse.json(
        { 
          error: "Service not found", 
          details: `Service with ID ${apiServiceId} not found in API. Total services available: ${apiServices.length}`,
          availableServiceIds: apiServices.slice(0, 20).map(s => s.service) // Show first 20 for debugging
        },
        { status: 404 }
      );
    }

    // Log the found service details for debugging (especially for TikTok comments)
    console.log("Found API service:", {
      serviceId: apiService.service,
      name: apiService.name,
      category: apiService.category,
      type: apiService.type,
      min: apiService.min,
      max: apiService.max,
      rate: apiService.rate,
      minType: typeof apiService.min,
      maxType: typeof apiService.max
    });

    // Log the found service details for debugging (especially for TikTok comments)
    console.log("Found API service:", {
      serviceId: apiService.service,
      name: apiService.name,
      category: apiService.category,
      type: apiService.type,
      min: apiService.min,
      max: apiService.max,
      rate: apiService.rate,
      minType: typeof apiService.min,
      maxType: typeof apiService.max
    });

    // Get markup percentage from admin settings
    const { data: markupSetting } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "default_markup_percentage")
      .single();

    const markupPercentage = markupSetting
      ? parseFloat(markupSetting.value)
      : 30.0;

    // Validate quantity against service min/max requirements
    // Handle both string and number min/max values from API
    const minQuantity = typeof apiService.min === 'string' 
      ? parseInt(apiService.min, 10) 
      : (typeof apiService.min === 'number' ? apiService.min : 1);
    const maxQuantity = typeof apiService.max === 'string'
      ? parseInt(apiService.max, 10)
      : (typeof apiService.max === 'number' ? apiService.max : 1000000);
    
    // Log min/max for debugging (especially for TikTok comments)
    console.log("Service quantity limits:", {
      minQuantity,
      maxQuantity,
      minRaw: apiService.min,
      maxRaw: apiService.max,
      minType: typeof apiService.min,
      maxType: typeof apiService.max,
      requestedQuantity: quantity,
      serviceName: apiService.name,
      serviceCategory: apiService.category
    });
    
    if (quantity < minQuantity) {
      return NextResponse.json(
        { 
          error: "Quantity too low", 
          details: `Quantity must be at least ${minQuantity.toLocaleString()}. You entered: ${quantity.toLocaleString()}`,
          min_quantity: minQuantity,
          max_quantity: maxQuantity
        },
        { status: 400 }
      );
    }
    
    if (quantity > maxQuantity) {
      return NextResponse.json(
        { 
          error: "Quantity too high", 
          details: `Quantity cannot exceed ${maxQuantity.toLocaleString()}. You entered: ${quantity.toLocaleString()}`,
          min_quantity: minQuantity,
          max_quantity: maxQuantity
        },
        { status: 400 }
      );
    }

    // Calculate charges using API rate and markup
    const costRate = parseFloat(apiService.rate); // API cost per 1000
    const customerRate = costRate * (1 + markupPercentage / 100); // Customer price per 1000 with markup
    const apiCost = (costRate * quantity) / 1000; // Actual API cost
    const customerCharge = (customerRate * quantity) / 1000; // What customer pays (with markup)
    const profit = customerCharge - apiCost; // Your profit

    // Sync service to database (for foreign key reference in orders table)
    // First try to get existing service
    let { data: existingService, error: queryError } = await supabase
      .from("services")
      .select("id")
      .eq("service_id", apiServiceId)
      .maybeSingle();

    let serviceDbId: number;
    
    if (existingService) {
      // Service exists, use its ID
      serviceDbId = existingService.id;
      
      // Update the service with latest data (optional, but keeps DB in sync)
      const { error: updateError } = await supabase
        .from("services")
        .update({
          name: apiService.name,
          category: apiService.category,
          type: apiService.type,
          cost_rate: costRate,
          rate: customerRate,
          markup_percentage: markupPercentage,
          min_quantity: parseInt(apiService.min),
          max_quantity: parseInt(apiService.max),
          refill_allowed: apiService.refill,
          cancel_allowed: apiService.cancel,
        })
        .eq("id", serviceDbId);
      
      if (updateError) {
        console.warn("Failed to update service, but continuing with order creation:", updateError);
      }
    } else {
      // Service doesn't exist, try to insert it
      const { data: newService, error: insertError } = await supabase
        .from("services")
        .insert({
          service_id: apiService.service,
          name: apiService.name,
          category: apiService.category,
          type: apiService.type,
          cost_rate: costRate,
          rate: customerRate,
          markup_percentage: markupPercentage,
          min_quantity: parseInt(apiService.min),
          max_quantity: parseInt(apiService.max),
          refill_allowed: apiService.refill,
          cancel_allowed: apiService.cancel,
        })
        .select("id")
        .single();
      
      if (insertError || !newService) {
        console.error("Error inserting service to database:", insertError);
        // If insert fails due to RLS, try to query again (maybe it was inserted by another process)
        const { data: retryService } = await supabase
          .from("services")
          .select("id")
          .eq("service_id", apiServiceId)
          .maybeSingle();
        
        if (retryService) {
          serviceDbId = retryService.id;
        } else {
          return NextResponse.json(
            { 
              error: "Failed to sync service to database", 
              details: insertError?.message || "Service not found and could not be created",
              hint: "This may be due to Row Level Security policies. Please ensure services are synced via the /api/services endpoint first."
            },
            { status: 500 }
          );
        }
      } else {
        serviceDbId = newService.id;
      }
    }

    // Check user wallet balance
    const { data: userProfile } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    const currentBalance = parseFloat(userProfile?.wallet_balance || "0.00");

    if (currentBalance < customerCharge) {
      return NextResponse.json(
        {
          error: "Insufficient wallet balance",
          required: customerCharge,
          available: currentBalance,
        },
        { status: 400 }
      );
    }

    // Deduct from wallet
    const balanceAfter = currentBalance - customerCharge;
    const { error: balanceError } = await supabase
      .from("users")
      .update({ wallet_balance: balanceAfter })
      .eq("id", user.id);

    if (balanceError) {
      console.error("Error updating wallet balance:", balanceError);
      return NextResponse.json(
        { error: "Failed to deduct from wallet" },
        { status: 500 }
      );
    }

    // Create wallet transaction (store it so we can update it with order_id later)
    const { data: walletTransaction, error: walletTxError } = await supabase
      .from("wallet_transactions")
      .insert({
        user_id: user.id,
        type: "order_payment",
        amount: -customerCharge, // Negative for deduction
        balance_before: currentBalance,
        balance_after: balanceAfter,
        description: `Payment for order: ${apiService.name}`,
      })
      .select()
      .single();

    if (walletTxError) {
      console.error("Error creating wallet transaction:", walletTxError);
      // Refund wallet if transaction creation fails
      await supabase
        .from("users")
        .update({ wallet_balance: currentBalance })
        .eq("id", user.id);
      return NextResponse.json(
        { 
          error: "Failed to create wallet transaction",
          details: walletTxError.message,
          code: walletTxError.code
        },
        { status: 500 }
      );
    }

    // Create order in exobooster API (this charges YOUR admin account)
    let exosupplierOrderId: number;
    try {
      console.log("Creating order with:", {
        serviceId: apiServiceId,
        serviceName: apiService.name,
        serviceCategory: apiService.category,
        serviceType: apiService.type,
        link: link,
        linkLength: link.length,
        quantity: quantity,
        quantityType: typeof quantity,
        minQuantity: apiService.min,
        maxQuantity: apiService.max,
        isTikTok: apiService.category?.toLowerCase().includes('tiktok') || apiService.name?.toLowerCase().includes('tiktok'),
        isComments: apiService.type?.toLowerCase().includes('comment') || apiService.name?.toLowerCase().includes('comment')
      });
      
      exosupplierOrderId = await createOrder(
        apiServiceId, // Use the API service_id directly
        link,
        quantity,
        undefined, // runs
        undefined, // interval
        comments // custom comments (if provided)
      );
    } catch (apiError: any) {
      console.error("Error creating order in API:", {
        error: apiError,
        message: apiError.message,
        serviceId: apiServiceId,
        serviceName: apiService.name,
        quantity: quantity,
        minQuantity: apiService.min,
        maxQuantity: apiService.max
      });
      
      // Refund user's wallet if API call fails (admin account insufficient balance, etc.)
      await supabase
        .from("users")
        .update({ wallet_balance: currentBalance })
        .eq("id", user.id);
      
      // Update wallet transaction to mark as refunded
      await supabase
        .from("wallet_transactions")
        .update({
          description: `Payment refunded - API error: ${apiService.name}`,
        })
        .eq("id", walletTransaction.id);
      
      // Create refund transaction
      await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        type: "refund",
        amount: customerCharge,
        balance_before: balanceAfter,
        balance_after: currentBalance,
        description: `Refund for failed order: ${apiService.name} - ${apiError.message || "API error"}`,
      });

      // Extract more detailed error information
      let errorMessage = apiError.message || "Admin account may have insufficient balance";
      let errorDetails = errorMessage;
      
      // Check for common API error patterns
      if (errorMessage.includes("Quantity less than minimal") || errorMessage.includes("minimal")) {
        // The API error message might contain the actual minimum, try to extract it
        const minimalMatch = errorMessage.match(/minimal\s*(\d+)/i);
        const apiMinQuantity = minimalMatch ? parseInt(minimalMatch[1]) : parseInt(apiService.min) || 1;
        
        // If quantity is actually >= the minimum from our validation, this is likely an API issue
        if (quantity >= parseInt(apiService.min)) {
          errorDetails = `API rejected the order. The service requires a minimum of ${apiMinQuantity.toLocaleString()}, but you entered ${quantity.toLocaleString()}. This may be an API configuration issue. Please try a different quantity or contact support.`;
        } else {
          errorDetails = `The quantity you entered (${quantity.toLocaleString()}) is below the minimum required for this service. Minimum: ${apiMinQuantity.toLocaleString()}`;
        }
      } else if (errorMessage.includes("insufficient") || errorMessage.includes("balance")) {
        errorDetails = "The admin account has insufficient balance to process this order. Please contact support.";
      } else if (errorMessage.includes("Invalid") || errorMessage.includes("link")) {
        errorDetails = "The link you provided may be invalid or not supported by this service.";
      }
      
      return NextResponse.json(
        {
          error: "Failed to create order. Your payment has been refunded.",
          details: errorDetails,
          original_error: errorMessage,
          debug: {
            quantity_sent: quantity,
            service_min: apiService.min,
            service_max: apiService.max,
            service_id: apiServiceId
          }
        },
        { status: 500 }
      );
    }

    // Get order status from exobooster
    const { getOrderStatus } = await import("@/lib/api/socialboost");
    const orderStatus = await getOrderStatus(exosupplierOrderId);

    // Create order in database
    const orderData = {
      user_id: user.id,
      service_id: serviceDbId, // Use the database service ID for foreign key
      exosupplier_order_id: exosupplierOrderId,
      link,
      quantity,
      status: orderStatus.status || "Pending",
      charge: parseFloat(orderStatus.charge || customerCharge.toString()), // Keep for backward compatibility
      customer_charge: customerCharge, // What customer paid
      api_cost: apiCost, // API cost
      profit: profit, // Your profit
      currency: orderStatus.currency || "USD",
      start_count: orderStatus.start_count
        ? parseInt(orderStatus.start_count)
        : null,
      remains: orderStatus.remains ? parseInt(orderStatus.remains) : null,
    };

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order in database:", orderError);
      // Refund wallet if database order creation fails (API order was created but DB failed)
      await supabase
        .from("users")
        .update({ wallet_balance: currentBalance })
        .eq("id", user.id);
      
      // Update wallet transaction to mark as refunded
      if (walletTransaction) {
        await supabase
          .from("wallet_transactions")
          .update({
            description: `Payment refunded - Database error: ${apiService.name}`,
          })
          .eq("id", walletTransaction.id);
      }
      
      // Create refund transaction
      await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        type: "refund",
        amount: customerCharge,
        balance_before: balanceAfter,
        balance_after: currentBalance,
        description: `Refund for failed order: ${apiService.name} - Database error`,
      });

      return NextResponse.json(
        { error: "Failed to create order. Your payment has been refunded." },
        { status: 500 }
      );
    }

    // Update wallet transaction with order_id
    if (walletTransaction) {
    await supabase
        .from("wallet_transactions")
      .update({ order_id: order.id })
        .eq("id", walletTransaction.id);
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

