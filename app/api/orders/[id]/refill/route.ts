import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requestRefill } from "@/lib/api/socialboost";

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

    // Get order to verify ownership and check if refill is allowed
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, services(refill_allowed)")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (!order.services?.refill_allowed) {
      return NextResponse.json(
        { error: "Refill is not allowed for this service" },
        { status: 400 }
      );
    }

    if (!order.exosupplier_order_id) {
      return NextResponse.json(
        { error: "Invalid order" },
        { status: 400 }
      );
    }

    // Request refill from exosupplier API
    const refillId = await requestRefill(order.exosupplier_order_id);

    // Create refill record in database
    const { data: refill, error: refillError } = await supabase
      .from("refills")
      .insert({
        order_id: orderId,
        exosupplier_refill_id: refillId,
        status: "Pending",
      })
      .select()
      .single();

    if (refillError) {
      console.error("Error creating refill:", refillError);
      return NextResponse.json(
        { error: "Failed to create refill" },
        { status: 500 }
      );
    }

    return NextResponse.json({ refill });
  } catch (error: any) {
    console.error("Refill error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to request refill" },
      { status: 500 }
    );
  }
}

