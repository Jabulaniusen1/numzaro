import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    if (!adminEmails.includes(user.email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all users with their stats
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, full_name, wallet_balance, created_at")
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (u) => {
        // Get numbers count
        const { count: numbersCount } = await supabase
          .from("virtual_numbers")
          .select("*", { count: "exact", head: true })
          .eq("user_id", u.id);

        // Get orders count
        const { count: ordersCount } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("user_id", u.id);

        // Get total spent (sum of all order charges)
        const { data: orders } = await supabase
          .from("orders")
          .select("charge, customer_charge")
          .eq("user_id", u.id);

        const totalSpent = orders?.reduce(
          (sum, order) =>
            sum +
            parseFloat(
              order.customer_charge?.toString() ||
                order.charge?.toString() ||
                "0"
            ),
          0
        ) || 0;

        // Get number purchases total
        const { data: numberPurchases } = await supabase
          .from("number_purchases")
          .select("amount")
          .eq("user_id", u.id);

        const numbersSpent =
          numberPurchases?.reduce(
            (sum, purchase) => sum + parseFloat(purchase.amount?.toString() || "0"),
            0
          ) || 0;

        return {
          ...u,
          numbers_count: numbersCount || 0,
          orders_count: ordersCount || 0,
          total_spent: totalSpent + numbersSpent,
        };
      })
    );

    return NextResponse.json({ users: usersWithStats });
  } catch (error) {
    console.error("Error in GET /api/admin/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

