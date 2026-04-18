import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

function toNumber(value: unknown): number {
  const parsed = parseFloat(String(value ?? "0"));
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);

    if (!adminEmails.includes(user.email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = createServiceRoleClient();
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "100", 10)));

    const [socialResult, numberResult, esimResult] = await Promise.all([
      supabase
        .from("orders")
        .select(
          `
            id,
            user_id,
            exosupplier_order_id,
            status,
            customer_charge,
            charge,
            currency,
            quantity,
            link,
            created_at,
            services(name, category, type),
            users(email, full_name)
          `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("number_purchases")
        .select(
          `
            id,
            user_id,
            virtual_number_id,
            amount,
            currency,
            status,
            created_at,
            users(email, full_name),
            virtual_numbers(phone_number, country_name, provider, product_type)
          `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("esim_orders")
        .select(
          `
            id,
            user_id,
            transaction_id,
            order_no,
            esim_tran_no,
            package_name,
            location,
            data_volume,
            duration,
            status,
            charged_amount,
            created_at,
            users(email, full_name)
          `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .limit(limit),
    ]);

    if (socialResult.error || numberResult.error || esimResult.error) {
      console.error("Error fetching admin orders:", {
        social: socialResult.error,
        number: numberResult.error,
        esim: esimResult.error,
      });
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    const socialBoostOrders = (socialResult.data || []).map((order: any) => ({
      id: order.id,
      source: "social_boost",
      display_id: order.exosupplier_order_id || order.id,
      user_id: order.user_id,
      user_email: order.users?.email || null,
      user_full_name: order.users?.full_name || null,
      status: order.status || "unknown",
      amount: toNumber(order.customer_charge ?? order.charge),
      currency: order.currency || "USD",
      created_at: order.created_at,
      details: {
        service_name: order.services?.name || "Unknown service",
        category: order.services?.category || null,
        type: order.services?.type || null,
        quantity: order.quantity || null,
        link: order.link || null,
      },
    }));

    const numberOrders = (numberResult.data || []).map((order: any) => ({
      id: order.id,
      source: "number",
      display_id: order.virtual_number_id || order.id,
      user_id: order.user_id,
      user_email: order.users?.email || null,
      user_full_name: order.users?.full_name || null,
      status: order.status || "completed",
      amount: toNumber(order.amount),
      currency: order.currency || "USD",
      created_at: order.created_at,
      details: {
        phone_number: order.virtual_numbers?.phone_number || null,
        country_name: order.virtual_numbers?.country_name || null,
        provider: order.virtual_numbers?.provider || null,
        product_type: order.virtual_numbers?.product_type || null,
      },
    }));

    const esimOrders = (esimResult.data || []).map((order: any) => ({
      id: order.id,
      source: "esim",
      display_id: order.order_no || order.esim_tran_no || order.transaction_id || order.id,
      user_id: order.user_id,
      user_email: order.users?.email || null,
      user_full_name: order.users?.full_name || null,
      status: order.status || "pending",
      amount: toNumber(order.charged_amount),
      currency: "USD",
      created_at: order.created_at,
      details: {
        package_name: order.package_name || null,
        location: order.location || null,
        data_volume: order.data_volume || null,
        duration: order.duration || null,
        transaction_id: order.transaction_id || null,
      },
    }));

    const allOrders = [...socialBoostOrders, ...numberOrders, ...esimOrders].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json({
      allOrders,
      socialBoostOrders,
      numberOrders,
      esimOrders,
      totals: {
        all: (socialResult.count || 0) + (numberResult.count || 0) + (esimResult.count || 0),
        socialBoost: socialResult.count || 0,
        number: numberResult.count || 0,
        esim: esimResult.count || 0,
      },
      fetchedLimitPerType: limit,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
