import { NextRequest, NextResponse } from "next/server";
import { verifyCharge } from "@/lib/korapay/client";
import { authenticateRequest } from "@/lib/supabase/server";
import { convertCurrency } from "@/lib/currency/rates";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference, type } = body; // type: 'wallet' or undefined

    if (!reference) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 });
    }

    const result = await verifyCharge(reference);

    if (!result.status) {
      return NextResponse.json(
        { error: "Transaction verification failed", status: "failed" },
        { status: 400 }
      );
    }

    const { user, supabase } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const charge = result.data;
    const isSuccess = charge.status === "success";
    const rawAmount = charge.amount;
    const paidAmount =
      typeof rawAmount === "number" ? rawAmount : parseFloat(String(rawAmount ?? "0"));

    // Read-first payment write to avoid requiring a unique constraint on provider_transaction_id.
    // This also handles duplicate SDK callbacks idempotently.
    let payment: any = null;
    const { data: existingPayment, error: existingPaymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("provider_transaction_id", charge.reference)
      .eq("payment_provider", "korapay")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingPaymentError) {
      console.error("Error checking existing payment:", existingPaymentError);
      return NextResponse.json({ error: "Error storing payment", status: "error" }, { status: 500 });
    }

    if (existingPayment) {
      payment = existingPayment;
    } else {
      const { data: insertedPayment, error: insertPaymentError } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          amount: paidAmount,
          currency: charge.currency,
          payment_provider: "korapay",
          provider_transaction_id: charge.reference,
          status: isSuccess ? "Success" : "Failed",
        })
        .select()
        .single();

      if (insertPaymentError) {
        console.error("Error inserting payment:", insertPaymentError);
        return NextResponse.json({ error: "Error storing payment", status: "error" }, { status: 500 });
      }
      payment = insertedPayment;
    }

    if (isSuccess && payment) {
      const metadata = charge.metadata ?? {};
      const isWalletFunding = type === "wallet" || metadata.type === "wallet_funding";

      if (isWalletFunding) {
        // Guard against double-credit if the SDK fires callback twice
        const { data: existingTx } = await supabase
          .from("wallet_transactions")
          .select("id")
          .eq("payment_id", payment.id)
          .maybeSingle();

        if (existingTx) {
          const { data: userProfile } = await supabase
            .from("users")
            .select("wallet_balance")
            .eq("id", user.id)
            .single();
          return NextResponse.json({
            status: "success",
            type: "wallet",
            reference,
            balanceAfter: parseFloat(userProfile?.wallet_balance || "0"),
          });
        }
        const { data: userProfile } = await supabase
          .from("users")
          .select("wallet_balance")
          .eq("id", user.id)
          .single();

        const balanceBefore = parseFloat(userProfile?.wallet_balance || "0.00");
        if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
          return NextResponse.json(
            { error: "Invalid payment amount from gateway", status: "failed" },
            { status: 400 }
          );
        }
        const paidCurrency = charge.currency || metadata.currency || "NGN";

        let depositAmountUSD = paidAmount;
        if (paidCurrency !== "USD") {
          try {
            depositAmountUSD = await convertCurrency(paidAmount, paidCurrency, "USD");
          } catch (err) {
            console.error("Currency conversion error:", err);
          }
        }

        const balanceAfter = balanceBefore + depositAmountUSD;

        await supabase
          .from("users")
          .update({ wallet_balance: balanceAfter })
          .eq("id", user.id);

        await supabase.from("wallet_transactions").insert({
          user_id: user.id,
          type: "deposit",
          amount: depositAmountUSD,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          payment_id: payment.id,
          description: `Wallet deposit via Korapay (${paidCurrency} ${paidAmount.toFixed(2)})`,
        });

        return NextResponse.json({
          status: "success",
          type: "wallet",
          reference,
          balanceAfter,
        });
      }
    }

    return NextResponse.json({
      status: isSuccess ? "success" : "failed",
      reference,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Internal server error", status: "error" }, { status: 500 });
  }
}
