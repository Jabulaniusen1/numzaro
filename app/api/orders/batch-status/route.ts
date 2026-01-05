import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMultipleOrderStatus } from "@/lib/api/socialboost";

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
    const { order_ids } = body;

    if (!Array.isArray(order_ids) || order_ids.length === 0) {
      return NextResponse.json(
        { error: "Order IDs array is required" },
        { status: 400 }
      );
    }

    if (order_ids.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 orders can be queried at once" },
        { status: 400 }
      );
    }

    // Get user's orders to verify ownership
    const { data: userOrders } = await supabase
      .from("orders")
      .select("exosupplier_order_id")
      .eq("user_id", user.id)
      .in("exosupplier_order_id", order_ids);

    if (!userOrders || userOrders.length === 0) {
      return NextResponse.json({});
    }

    const validOrderIds = userOrders.map((o) => o.exosupplier_order_id);

    // Get status from exosupplier API
    const statuses = await getMultipleOrderStatus(validOrderIds);

    // Update orders in database
    for (const [orderIdStr, statusData] of Object.entries(statuses)) {
      if ("error" in statusData) continue;

      const orderId = parseInt(orderIdStr);
      const updateData: any = {
        status: statusData.status || "Pending",
        updated_at: new Date().toISOString(),
      };

      if (statusData.charge) {
        updateData.charge = parseFloat(statusData.charge);
      }
      if (statusData.start_count) {
        updateData.start_count = parseInt(statusData.start_count);
      }
      if (statusData.remains !== undefined) {
        updateData.remains = parseInt(statusData.remains);
      }
      if (statusData.currency) {
        updateData.currency = statusData.currency;
      }

      await supabase
        .from("orders")
        .update(updateData)
        .eq("exosupplier_order_id", orderId)
        .eq("user_id", user.id);
    }

    return NextResponse.json(statuses);
  } catch (error: any) {
    console.error("Error fetching batch order status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch order statuses" },
      { status: 500 }
    );
  }
}

