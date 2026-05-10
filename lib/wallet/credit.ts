import { convertCurrency } from "@/lib/currency/rates";

interface CreditWalletParams {
  supabase: any;
  userId: string;
  paymentId: string;
  provider: string;
  providerTransactionId: string;
  paidAmount: number;
  paidCurrency: string;
  description: string;
}

export async function creditWalletFromSuccessfulPayment(params: CreditWalletParams) {
  const existingTx = await params.supabase
    .from("wallet_transactions")
    .select("id")
    .eq("payment_id", params.paymentId)
    .maybeSingle();

  if (existingTx.data?.id) {
    return { credited: false, reason: "already_credited" };
  }

  const { data: userProfile } = await params.supabase
    .from("users")
    .select("wallet_balance")
    .eq("id", params.userId)
    .single();

  const balanceBefore = parseFloat(userProfile?.wallet_balance || "0.00");

  let depositAmountNGN = params.paidAmount;
  if (params.paidCurrency !== "NGN") {
    try {
      depositAmountNGN = await convertCurrency(params.paidAmount, params.paidCurrency, "NGN");
    } catch (err) {
      console.error("Currency conversion error:", err);
    }
  }

  const balanceAfter = balanceBefore + depositAmountNGN;

  await params.supabase.from("users").update({ wallet_balance: balanceAfter }).eq("id", params.userId);

  await params.supabase.from("wallet_transactions").insert({
    user_id: params.userId,
    type: "deposit",
    amount: depositAmountNGN,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    payment_id: params.paymentId,
    description: `${params.description} (${params.paidCurrency} ${params.paidAmount.toFixed(2)})`,
  });

  return { credited: true, balanceAfter, depositAmountNGN };
}
