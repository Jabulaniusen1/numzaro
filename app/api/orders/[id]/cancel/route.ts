import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cancelOrder } from "@/lib/api/socialboost";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = params.id;

    // Get order to verify ownership and check if cancel is allowed
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, services(cancel_allowed)")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (!order.services?.cancel_allowed) {
      return NextResponse.json(
        { error: "Cancellation is not allowed for this service" },
        { status: 400 }
      );
    }

    if (!order.exosupplier_order_id) {
      return NextResponse.json(
        { error: "Invalid order" },
        { status: 400 }
      );
    }

    // Cancel order via exosupplier API
    const cancelResults = await cancelOrder([order.exosupplier_order_id]);

    const cancelResult = cancelResults[0];
    if (
      cancelResult &&
      typeof cancelResult.cancel === "object" &&
      "error" in cancelResult.cancel
    ) {
      return NextResponse.json(
        { error: cancelResult.cancel.error || "Failed to cancel order" },
        { status: 400 }
      );
    }

    // Update order status in database
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "Cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order:", updateError);
      return NextResponse.json(
        { error: "Failed to update order status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Cancel error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel order" },
      { status: 500 }
    );
  }
}

