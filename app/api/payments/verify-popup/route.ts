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

    // Store payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        amount: charge.amount,
        currency: charge.currency,
        payment_provider: "korapay",
        provider_transaction_id: charge.reference,
        status: isSuccess ? "Success" : "Failed",
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error storing payment:", paymentError);
      return NextResponse.json({ error: "Error storing payment", status: "error" }, { status: 500 });
    }

    if (isSuccess && payment) {
      const metadata = charge.metadata ?? {};
      const isWalletFunding = type === "wallet" || metadata.type === "wallet_funding";

      if (isWalletFunding) {
        const { data: userProfile } = await supabase
          .from("users")
          .select("wallet_balance")
          .eq("id", user.id)
          .single();

        const balanceBefore = parseFloat(userProfile?.wallet_balance || "0.00");
        const paidAmount = charge.amount;
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
