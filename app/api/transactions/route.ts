import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [walletTransactions, numberPurchases, payments] = await Promise.all([
      supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("number_purchases")
        .select(`*, virtual_numbers(phone_number)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    const transactions: any[] = [];

    if (walletTransactions.data) {
      walletTransactions.data.forEach((tx) => {
        transactions.push({
          id: tx.id,
          type: "wallet",
          transaction_type: tx.type,
          amount: parseFloat(tx.amount.toString()),
          balance_before: parseFloat(tx.balance_before.toString()),
          balance_after: parseFloat(tx.balance_after.toString()),
          description: tx.description,
          created_at: tx.created_at,
          metadata: {
            payment_id: tx.payment_id,
            order_id: tx.order_id,
          },
        });
      });
    }

    if (numberPurchases.data) {
      numberPurchases.data.forEach((purchase) => {
        const phoneNumber = (purchase.virtual_numbers as any)?.phone_number || null;
        transactions.push({
          id: purchase.id,
          type: "number_purchase",
          transaction_type: "number_purchase",
          amount: -parseFloat(purchase.amount.toString()),
          description: `Phone number purchase: ${phoneNumber || "Unknown"}`,
          created_at: purchase.created_at,
          metadata: {
            virtual_number_id: purchase.virtual_number_id,
            phone_number: phoneNumber,
            status: purchase.status,
          },
        });
      });
    }

    if (payments.data) {
      payments.data.forEach((payment) => {
        transactions.push({
          id: payment.id,
          type: "payment",
          transaction_type: payment.status === "Success" ? "deposit" : "payment_failed",
          amount: parseFloat(payment.amount.toString()),
          description: `Wallet funding via ${payment.payment_provider}`,
          created_at: payment.created_at,
          metadata: {
            payment_provider: payment.payment_provider,
            provider_transaction_id: payment.provider_transaction_id,
            status: payment.status,
            currency: payment.currency,
          },
        });
      });
    }

    transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
