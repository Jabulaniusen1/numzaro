import { createClient } from "@/lib/supabase/server";

export interface PurchaseResult {
  success: boolean;
  walletTransactionId?: string;
  newBalance?: number;
  error?: string;
}

/**
 * Deduct amount from user's wallet for a purchase
 * Follows the pattern from app/api/orders/create/route.ts
 */
export async function purchaseWithWallet(
  userId: string,
  amount: number,
  description: string
): Promise<PurchaseResult> {
  const supabase = await createClient();

  try {
    // Get current wallet balance
    const { data: userProfile, error: userError } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching wallet balance:", userError);
      return {
        success: false,
        error: "Failed to fetch wallet balance",
      };
    }

    const currentBalance = parseFloat(userProfile?.wallet_balance || "0.00");

    // Check if balance is sufficient
    if (currentBalance < amount) {
      return {
        success: false,
        error: "Insufficient wallet balance",
      };
    }

    const balanceAfter = currentBalance - amount;

    // Update wallet balance
    const { error: balanceError } = await supabase
      .from("users")
      .update({ wallet_balance: balanceAfter })
      .eq("id", userId);

    if (balanceError) {
      console.error("Error updating wallet balance:", balanceError);
      return {
        success: false,
        error: "Failed to deduct from wallet",
      };
    }

    // Create wallet transaction record
    const { data: walletTransaction, error: walletTxError } = await supabase
      .from("wallet_transactions")
      .insert({
        user_id: userId,
        type: "withdrawal", // Using withdrawal for purchases
        amount: -amount, // Negative for deduction
        balance_before: currentBalance,
        balance_after: balanceAfter,
        description: description,
      })
      .select()
      .single();

    if (walletTxError) {
      console.error("Error creating wallet transaction:", walletTxError);
      
      // Rollback wallet balance
      await supabase
        .from("users")
        .update({ wallet_balance: currentBalance })
        .eq("id", userId);

      return {
        success: false,
        error: "Failed to create wallet transaction",
      };
    }

    return {
      success: true,
      walletTransactionId: walletTransaction.id,
      newBalance: balanceAfter,
    };
  } catch (error: any) {
    console.error("Error in purchaseWithWallet:", error);
    return {
      success: false,
      error: error.message || "Internal server error",
    };
  }
}

/**
 * Refund amount to user's wallet
 */
export async function refundToWallet(
  userId: string,
  amount: number,
  description: string
): Promise<PurchaseResult> {
  const supabase = await createClient();

  try {
    // Get current wallet balance
    const { data: userProfile, error: userError } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching wallet balance:", userError);
      return {
        success: false,
        error: "Failed to fetch wallet balance",
      };
    }

    const currentBalance = parseFloat(userProfile?.wallet_balance || "0.00");
    const balanceAfter = currentBalance + amount;

    // Update wallet balance
    const { error: balanceError } = await supabase
      .from("users")
      .update({ wallet_balance: balanceAfter })
      .eq("id", userId);

    if (balanceError) {
      console.error("Error updating wallet balance:", balanceError);
      return {
        success: false,
        error: "Failed to refund to wallet",
      };
    }

    // Create wallet transaction record
    const { data: walletTransaction, error: walletTxError } = await supabase
      .from("wallet_transactions")
      .insert({
        user_id: userId,
        type: "refund",
        amount: amount, // Positive for refund
        balance_before: currentBalance,
        balance_after: balanceAfter,
        description: description,
      })
      .select()
      .single();

    if (walletTxError) {
      console.error("Error creating wallet transaction:", walletTxError);
      
      // Rollback wallet balance
      await supabase
        .from("users")
        .update({ wallet_balance: currentBalance })
        .eq("id", userId);

      return {
        success: false,
        error: "Failed to create wallet transaction",
      };
    }

    return {
      success: true,
      walletTransactionId: walletTransaction.id,
      newBalance: balanceAfter,
    };
  } catch (error: any) {
    console.error("Error in refundToWallet:", error);
    return {
      success: false,
      error: error.message || "Internal server error",
    };
  }
}








