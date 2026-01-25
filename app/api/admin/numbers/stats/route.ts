import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (you can implement your own admin check)
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    if (!adminEmails.includes(user.email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get total revenue from number purchases
    const { data: purchases, error: purchasesError } = await supabase
      .from("number_purchases")
      .select("amount, created_at");

    if (purchasesError) {
      console.error("Error fetching purchases:", purchasesError);
    }

    // Get total Twilio costs
    const { data: charges, error: chargesError } = await supabase
      .from("twilio_charges")
      .select("actual_cost, user_charged, profit, created_at");

    if (chargesError) {
      console.error("Error fetching charges:", chargesError);
    }

    const totalRevenue = purchases?.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;
    const totalCosts = charges?.reduce((sum, c) => sum + parseFloat(c.actual_cost.toString()), 0) || 0;
    const totalProfit = charges?.reduce((sum, c) => sum + parseFloat(c.profit.toString()), 0) || 0;

    // Get stats by country
    const { data: numbersByCountry } = await supabase
      .from("virtual_numbers")
      .select("country_code, country_name");

    const countryStats: Record<string, { count: number; name: string }> = {};
    numbersByCountry?.forEach((n) => {
      if (!countryStats[n.country_code]) {
        countryStats[n.country_code] = { count: 0, name: n.country_name };
      }
      countryStats[n.country_code].count++;
    });

    // Get this month's stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthPurchases = purchases?.filter(
      (p) => new Date(p.created_at) >= startOfMonth
    ) || [];
    const thisMonthRevenue = thisMonthPurchases.reduce(
      (sum, p) => sum + parseFloat(p.amount.toString()),
      0
    );

    const thisMonthCharges = charges?.filter(
      (c) => new Date(c.created_at) >= startOfMonth
    ) || [];
    const thisMonthCosts = thisMonthCharges.reduce(
      (sum, c) => sum + parseFloat(c.actual_cost.toString()),
      0
    );
    const thisMonthProfit = thisMonthCharges.reduce(
      (sum, c) => sum + parseFloat(c.profit.toString()),
      0
    );

    // Get total numbers
    const { count: totalNumbers } = await supabase
      .from("virtual_numbers")
      .select("*", { count: "exact", head: true });

    // Get active numbers
    const { count: activeNumbers } = await supabase
      .from("virtual_numbers")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    return NextResponse.json({
      totalRevenue,
      totalCosts,
      totalProfit,
      totalNumbers: totalNumbers || 0,
      activeNumbers: activeNumbers || 0,
      thisMonthRevenue,
      thisMonthCosts,
      thisMonthProfit,
      countryStats: Object.entries(countryStats).map(([code, stats]) => ({
        code,
        name: stats.name,
        count: stats.count,
      })),
    });
  } catch (error: any) {
    console.error("Error in admin numbers stats:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}













