import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrderStatus } from "@/lib/api/socialboost";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const exosupplierOrderId = parseInt(orderId);

    // Get order from database to verify ownership
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("exosupplier_order_id", exosupplierOrderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Get status from exosupplier API
    const orderStatus = await getOrderStatus(exosupplierOrderId);

    // Update order in database
    const updateData: any = {
      status: orderStatus.status || order.status,
      updated_at: new Date().toISOString(),
    };

    if (orderStatus.charge) {
      updateData.charge = parseFloat(orderStatus.charge);
    }
    if (orderStatus.start_count) {
      updateData.start_count = parseInt(orderStatus.start_count);
    }
    if (orderStatus.remains !== undefined) {
      updateData.remains = parseInt(orderStatus.remains);
    }
    if (orderStatus.currency) {
      updateData.currency = orderStatus.currency;
    }

    await supabase
      .from("orders")
      .update(updateData)
      .eq("id", order.id);

    return NextResponse.json({
      status: orderStatus.status || order.status,
      remains: orderStatus.remains ? parseInt(orderStatus.remains) : null,
      start_count: orderStatus.start_count
        ? parseInt(orderStatus.start_count)
        : null,
      charge: orderStatus.charge ? parseFloat(orderStatus.charge) : null,
      currency: orderStatus.currency || null,
    });
  } catch (error: any) {
    console.error("Error fetching order status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch order status" },
      { status: 500 }
    );
  }
}

