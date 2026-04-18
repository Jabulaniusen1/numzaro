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

    // Check if user is admin
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);

    if (!adminEmails.includes(user.email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = createServiceRoleClient();
    const [usersResult, socialOrdersResult, numberPurchasesResult, esimOrdersResult, virtualNumbersResult] =
      await Promise.all([
        supabase
          .from("users")
          .select("id, email, full_name, wallet_balance, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("orders").select("user_id, customer_charge, charge"),
        supabase.from("number_purchases").select("user_id, amount"),
        supabase.from("esim_orders").select("user_id, charged_amount"),
        supabase.from("virtual_numbers").select("user_id"),
      ]);

    if (
      usersResult.error ||
      socialOrdersResult.error ||
      numberPurchasesResult.error ||
      esimOrdersResult.error ||
      virtualNumbersResult.error
    ) {
      console.error("Error fetching admin users data:", {
        users: usersResult.error,
        socialOrders: socialOrdersResult.error,
        numberPurchases: numberPurchasesResult.error,
        esimOrders: esimOrdersResult.error,
        virtualNumbers: virtualNumbersResult.error,
      });
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    const numbersCountByUser = new Map<string, number>();
    for (const numberRow of virtualNumbersResult.data || []) {
      numbersCountByUser.set(
        numberRow.user_id,
        (numbersCountByUser.get(numberRow.user_id) || 0) + 1
      );
    }

    const socialCounts = new Map<string, number>();
    const socialSpentByUser = new Map<string, number>();
    for (const order of socialOrdersResult.data || []) {
      socialCounts.set(order.user_id, (socialCounts.get(order.user_id) || 0) + 1);
      socialSpentByUser.set(
        order.user_id,
        (socialSpentByUser.get(order.user_id) || 0) + toNumber(order.customer_charge ?? order.charge)
      );
    }

    const numberCounts = new Map<string, number>();
    const numberSpentByUser = new Map<string, number>();
    for (const purchase of numberPurchasesResult.data || []) {
      numberCounts.set(purchase.user_id, (numberCounts.get(purchase.user_id) || 0) + 1);
      numberSpentByUser.set(
        purchase.user_id,
        (numberSpentByUser.get(purchase.user_id) || 0) + toNumber(purchase.amount)
      );
    }

    const esimCounts = new Map<string, number>();
    const esimSpentByUser = new Map<string, number>();
    for (const esimOrder of esimOrdersResult.data || []) {
      esimCounts.set(esimOrder.user_id, (esimCounts.get(esimOrder.user_id) || 0) + 1);
      esimSpentByUser.set(
        esimOrder.user_id,
        (esimSpentByUser.get(esimOrder.user_id) || 0) + toNumber(esimOrder.charged_amount)
      );
    }

    const usersWithStats = (usersResult.data || []).map((u) => {
      const socialOrdersCount = socialCounts.get(u.id) || 0;
      const numberOrdersCount = numberCounts.get(u.id) || 0;
      const esimOrdersCount = esimCounts.get(u.id) || 0;
      const socialSpent = socialSpentByUser.get(u.id) || 0;
      const numbersSpent = numberSpentByUser.get(u.id) || 0;
      const esimSpent = esimSpentByUser.get(u.id) || 0;

      return {
        ...u,
        numbers_count: numbersCountByUser.get(u.id) || 0,
        social_orders_count: socialOrdersCount,
        number_orders_count: numberOrdersCount,
        esim_orders_count: esimOrdersCount,
        orders_count: socialOrdersCount + numberOrdersCount + esimOrdersCount,
        social_spent: socialSpent,
        numbers_spent: numbersSpent,
        esim_spent: esimSpent,
        total_spent: socialSpent + numbersSpent + esimSpent,
      };
    });

    return NextResponse.json({ users: usersWithStats });
  } catch (error) {
    console.error("Error in GET /api/admin/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
