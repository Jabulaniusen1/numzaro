import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { createOrder, getServices } from "@/lib/api/socialboost";
import { getLiveFxRate } from "@/lib/currency/rates";

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { service_id, link, quantity, comments } = body;

    // Validate input
    if (!service_id || !link || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields: service_id, link, quantity" },
        { status: 400 }
      );
    }

    const quantityNum = parseInt(quantity, 10);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      return NextResponse.json(
        { error: "Invalid quantity. Must be a positive number." },
        { status: 400 }
      );
    }

    // Fetch service and live markup in parallel
    const [{ data: service, error: serviceError }, { data: markupSetting }, apiServices] =
      await Promise.all([
        supabase
          .from("services")
          .select("id, service_id, name, cost_rate, min_quantity, max_quantity")
          .eq("id", service_id)
          .single(),
        supabase
          .from("admin_settings")
          .select("value")
          .eq("key", "default_markup_percentage")
          .single(),
        getServices().catch(() => null),
      ]);

    if (serviceError || !service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Validate quantity against min/max
    if (quantityNum < service.min_quantity || quantityNum > service.max_quantity) {
      return NextResponse.json(
        { error: `Quantity must be between ${service.min_quantity.toLocaleString()} and ${service.max_quantity.toLocaleString()}` },
        { status: 400 }
      );
    }

    // Prefer live API rate over potentially-stale DB cost_rate
    const liveApiService = Array.isArray(apiServices)
      ? apiServices.find((s: any) => String(s.service) === String(service.service_id))
      : null;
    const costRate = liveApiService
      ? parseFloat(liveApiService.rate) || parseFloat(service.cost_rate) || 0
      : parseFloat(service.cost_rate) || 0;

    // API rates are in NGN per 1000. Apply admin markup.
    const rawMarkup = markupSetting ? parseFloat(markupSetting.value) : 30.0;
    const markupPercentage = Number.isFinite(rawMarkup) && rawMarkup >= 0 ? Math.min(rawMarkup, 10000) : 30.0;
    const sellingRateNGN = costRate * (1 + markupPercentage / 100);
    const chargeNGN = (quantityNum / 1000) * sellingRateNGN;

    // Wallet is stored in USD — convert NGN charge to USD for deduction
    const usdNgnRate = await getLiveFxRate("USD", "NGN");
    const chargeUSD = chargeNGN / usdNgnRate;

    // Check user wallet balance (stored in USD)
    const { data: userProfile } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    const balance = parseFloat(userProfile?.wallet_balance || "0.00");

    if (chargeUSD > balance) {
      return NextResponse.json(
        { error: "Insufficient balance. Please fund your wallet." },
        { status: 400 }
      );
    }

    // Create order in SHOPRIME API
    let exosupplierOrderId: number;
    try {
      exosupplierOrderId = await createOrder(
        service.service_id,
        link.trim(),
        quantityNum,
        undefined, // runs
        undefined, // interval
        comments || undefined // comments
      );
    } catch (apiError: any) {
      console.error("Error creating order in SHOPRIME API:", apiError);
      return NextResponse.json(
        { error: apiError.message || "Failed to create order in SHOPRIME API" },
        { status: 500 }
      );
    }

    // Deduct USD charge from wallet (wallet is stored in USD)
    const newBalance = balance - chargeUSD;

    const { error: balanceError } = await supabase
      .from("users")
      .update({ wallet_balance: newBalance.toFixed(6) })
      .eq("id", user.id);

    if (balanceError) {
      console.error("Error updating wallet balance:", balanceError);
      return NextResponse.json(
        { error: "Order created but failed to deduct balance. Please contact support." },
        { status: 500 }
      );
    }

    // Create wallet transaction record (amounts in USD to match wallet)
    const { error: transactionError } = await supabase
      .from("wallet_transactions")
      .insert({
        user_id: user.id,
        type: "debit",
        amount: chargeUSD,
        description: `Order for ${service.name}`,
        balance_before: balance,
        balance_after: newBalance,
      });

    if (transactionError) {
      console.error("Error creating wallet transaction:", transactionError);
      // Transaction log error is not critical, continue
    }

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        service_id: service.id,
        exosupplier_order_id: exosupplierOrderId,
        link: link.trim(),
        quantity: quantityNum,
        status: "Pending",
        charge: chargeNGN,
        currency: "NGN",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order in database:", orderError);
      return NextResponse.json(
        { error: "Failed to create order record. Please contact support." },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      order,
      message: "Order created successfully"
    });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { 
        error: error.message || "Internal server error",
        details: error.stack || "An unexpected error occurred while creating the order",
        type: error.name || "Error"
      },
      { status: 500 }
    );
  }
}
