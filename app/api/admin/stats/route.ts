import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (simple email check - can be enhanced)
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    if (!adminEmails.includes(user.email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get total revenue, costs, and profit
    const { data: orders } = await supabase
      .from("orders")
      .select("charge, api_cost, profit, created_at");

    if (!orders) {
      return NextResponse.json({
        totalRevenue: 0,
        totalCosts: 0,
        totalProfit: 0,
        totalOrders: 0,
        recentOrders: [],
      });
    }

    const totalRevenue = orders.reduce(
      (sum, order) => sum + (parseFloat(order.charge?.toString() || "0") || 0),
      0
    );
    const totalCosts = orders.reduce(
      (sum, order) => sum + (parseFloat(order.api_cost?.toString() || "0") || 0),
      0
    );
    const totalProfit = orders.reduce(
      (sum, order) => sum + (parseFloat(order.profit?.toString() || "0") || 0),
      0
    );

    // Get recent orders with profit data
    const { data: recentOrders } = await supabase
      .from("orders")
      .select(`
        *,
        services(name),
        users(email, full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get monthly stats
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const { data: thisMonthOrders } = await supabase
      .from("orders")
      .select("charge, api_cost, profit")
      .gte("created_at", thisMonth.toISOString());

    const { data: lastMonthOrders } = await supabase
      .from("orders")
      .select("charge, api_cost, profit")
      .gte("created_at", lastMonth.toISOString())
      .lt("created_at", thisMonth.toISOString());

    const thisMonthRevenue = thisMonthOrders?.reduce(
      (sum, order) => sum + (parseFloat(order.charge?.toString() || "0") || 0),
      0
    ) || 0;
    const thisMonthProfit = thisMonthOrders?.reduce(
      (sum, order) => sum + (parseFloat(order.profit?.toString() || "0") || 0),
      0
    ) || 0;
    const lastMonthRevenue = lastMonthOrders?.reduce(
      (sum, order) => sum + (parseFloat(order.charge?.toString() || "0") || 0),
      0
    ) || 0;
    const lastMonthProfit = lastMonthOrders?.reduce(
      (sum, order) => sum + (parseFloat(order.profit?.toString() || "0") || 0),
      0
    ) || 0;

    return NextResponse.json({
      totalRevenue,
      totalCosts,
      totalProfit,
      totalOrders: orders.length,
      thisMonthRevenue,
      thisMonthProfit,
      lastMonthRevenue,
      lastMonthProfit,
      recentOrders: recentOrders || [],
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

