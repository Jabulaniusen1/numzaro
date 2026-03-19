import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { textverifiedClient } from "@/lib/textverified/client";

async function refundWallet(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  amount: number,
  description: string
) {
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("wallet_balance")
    .eq("id", userId)
    .single();

  if (userError) {
    return { success: false, error: "Failed to fetch wallet balance" };
  }

  const balanceBefore = parseFloat(userData?.wallet_balance || "0");
  const balanceAfter = balanceBefore + amount;

  const { error: balanceError } = await supabase
    .from("users")
    .update({ wallet_balance: balanceAfter })
    .eq("id", userId);

  if (balanceError) {
    return { success: false, error: "Failed to update wallet balance" };
  }

  const { data: walletTx, error: walletTxError } = await supabase
    .from("wallet_transactions")
    .insert({
      user_id: userId,
      type: "refund",
      amount: amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      description,
    })
    .select()
    .single();

  if (walletTxError) {
    await supabase
      .from("users")
      .update({ wallet_balance: balanceBefore })
      .eq("id", userId);
    return { success: false, error: "Failed to create wallet transaction" };
  }

  return { success: true, walletTransactionId: walletTx.id };
}

export async function runRefunds() {
  const supabase = createServiceRoleClient();
  const nowIso = new Date().toISOString();

  const { data: numbers, error } = await supabase
    .from("virtual_numbers")
    .select("id, user_id, phone_number, textverified_id, expires_at, provider, number_type")
    .eq("provider", "textverified")
    .eq("number_type", "activation")
    .eq("status", "active")
    .lt("expires_at", nowIso);

  if (error) {
    console.error("[Refunds] DB error:", error);
    return { error: "DB error" };
  }

  if (!numbers || numbers.length === 0) {
    return { message: "No refunds due", refunded: 0, skipped: 0, failed: 0, total: 0 };
  }

  let refunded = 0;
  let skipped = 0;
  let failed = 0;

  for (const number of numbers) {
    const orderId = number.textverified_id;
    if (!orderId) {
      skipped++;
      continue;
    }

    const { data: purchase } = await supabase
      .from("number_purchases")
      .select("id, amount, status")
      .eq("virtual_number_id", number.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!purchase || purchase.status === "refunded") {
      skipped++;
      continue;
    }

    let state: string | null = null;
    let cancelled = false;
    try {
      const verification = await textverifiedClient.getVerification(orderId);
      state = verification?.state ?? null;
      if (verification?.cancel?.canCancel) {
        try {
          await textverifiedClient.cancelVerification(orderId);
          cancelled = true;
        } catch (cancelError: any) {
          console.error(`[Refunds] cancel failed for ${number.id}:`, cancelError?.message || cancelError);
          failed++;
          continue;
        }
      }
    } catch (err: any) {
      console.error(`[Refunds] getVerification failed for ${number.id}:`, err?.message || err);
      failed++;
      continue;
    }

    if (
      state === "verificationCompleted" ||
      state === "verificationReused" ||
      state === "verificationReactivated"
    ) {
      skipped++;
      continue;
    }

    const refundableStates = new Set([
      "verificationPending",
      "verificationTimedOut",
      "verificationCanceled",
      "verificationReported",
      "verificationRefunded",
    ]);

    if (!cancelled && (!state || !refundableStates.has(state))) {
      skipped++;
      continue;
    }

    const amount = parseFloat(purchase.amount?.toString() || "0");
    if (amount <= 0) {
      skipped++;
      continue;
    }

    const description = `Refund: unused Textverified activation ${number.phone_number}`;
    const refund = await refundWallet(supabase, number.user_id, amount, description);

    if (!refund.success) {
      console.error(`[Refunds] wallet refund failed for ${number.id}:`, refund.error);
      failed++;
      continue;
    }

    await supabase
      .from("number_purchases")
      .update({ status: "refunded" })
      .eq("id", purchase.id);

    await supabase
      .from("virtual_numbers")
      .update({ status: "cancelled" })
      .eq("id", number.id);

    await supabase.from("notifications").insert({
      user_id: number.user_id,
      type: "transaction",
      title: "Number Refunded",
      message: `${number.phone_number} expired unused. $${amount.toFixed(2)} was refunded to your wallet.`,
      data: { type: "number_refund", number_id: number.id, amount },
    });

    refunded++;
  }

  return {
    message: "Refund cron completed",
    refunded,
    skipped,
    failed,
    total: numbers.length,
  };
}
