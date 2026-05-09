import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { convertCurrency } from "@/lib/currency/rates";

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    if (!adminEmails.includes(user.email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, amount, note, type = "credit" } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (type !== "credit" && type !== "debit") {
      return NextResponse.json({ error: "type must be 'credit' or 'debit'" }, { status: 400 });
    }

    const parsedNGN = parseFloat(amount);
    if (!parsedNGN || parsedNGN <= 0) {
      return NextResponse.json({ error: "amount must be a positive number (NGN)" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    const { data: targetUser, error: userError } = await supabase
      .from("users")
      .select("id, email, wallet_balance")
      .eq("id", userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const balanceBefore = parseFloat(targetUser.wallet_balance || "0");

    // Use a single rate call so both sides of the comparison are consistent
    const balanceNGN = await convertCurrency(balanceBefore, "USD", "NGN");
    const amountUSD = (parsedNGN / balanceNGN) * balanceBefore; // same effective rate

    if (type === "debit") {
      if (parsedNGN > balanceNGN) {
        return NextResponse.json(
          { error: `Insufficient balance. User only has ₦${balanceNGN.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.` },
          { status: 400 }
        );
      }

      const balanceAfter = balanceBefore - amountUSD;

      await supabase.from("users").update({ wallet_balance: balanceAfter }).eq("id", userId);

      await supabase.from("wallet_transactions").insert({
        user_id: userId,
        type: "withdrawal",
        amount: -amountUSD,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: note
          ? `Admin deduction (₦${parsedNGN.toLocaleString()}): ${note}`
          : `Admin wallet deduction of ₦${parsedNGN.toLocaleString()} by ${user.email}`,
      });

      await supabase.from("notifications").insert({
        user_id: userId,
        type: "transaction",
        title: "Wallet Adjusted",
        message: `₦${parsedNGN.toLocaleString()} has been deducted from your wallet by admin.`,
        data: { type: "admin_debit", amount_ngn: parsedNGN, amount_usd: amountUSD },
      });

      return NextResponse.json({
        success: true,
        userId,
        debited_ngn: parsedNGN,
        debited_usd: amountUSD,
        balanceBefore,
        balanceAfter,
      });
    }

    // type === "credit"
    const balanceAfter = balanceBefore + amountUSD;

    await supabase.from("users").update({ wallet_balance: balanceAfter }).eq("id", userId);

    await supabase.from("wallet_transactions").insert({
      user_id: userId,
      type: "deposit",
      amount: amountUSD,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      description: note
        ? `Admin credit (₦${parsedNGN.toLocaleString()}): ${note}`
        : `Admin wallet credit of ₦${parsedNGN.toLocaleString()} by ${user.email}`,
    });

    await supabase.from("notifications").insert({
      user_id: userId,
      type: "transaction",
      title: "Wallet Funded",
      message: `₦${parsedNGN.toLocaleString()} has been added to your wallet by admin.`,
      data: { type: "admin_credit", amount_ngn: parsedNGN, amount_usd: amountUSD },
    });

    return NextResponse.json({
      success: true,
      userId,
      credited_ngn: parsedNGN,
      credited_usd: amountUSD,
      balanceBefore,
      balanceAfter,
    });
  } catch (error: any) {
    console.error("Error in POST /api/admin/wallet/fund:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
