import { NextRequest, NextResponse } from "next/server";
import { verifyCharge } from "@/lib/korapay/client";
import { authenticateRequest } from "@/lib/supabase/server";
import { createTransactionNotification } from "@/lib/notifications/create";
import { convertCurrency } from "@/lib/currency/rates";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get("reference");
    const paymentType = searchParams.get("type"); // 'wallet' or null

    if (!reference) {
      return NextResponse.redirect(new URL("/dashboard?payment=error", request.url));
    }

    const result = await verifyCharge(reference);

    if (!result.status) {
      return NextResponse.redirect(new URL("/dashboard?payment=error", request.url));
    }

    const { user, supabase } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    const charge = result.data;
    const isSuccess = charge.status === "success";

    // Store payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        amount: charge.amount,       // Korapay returns main unit (not kobo)
        currency: charge.currency,
        payment_provider: "korapay",
        provider_transaction_id: charge.reference,
        status: isSuccess ? "Success" : "Failed",
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error storing payment:", paymentError);
    }

    if (isSuccess && payment) {
      const metadata = charge.metadata ?? {};
      const isWalletFunding = paymentType === "wallet" || metadata.type === "wallet_funding";

      if (isWalletFunding) {
        const { data: userProfile } = await supabase
          .from("users")
          .select("wallet_balance")
          .eq("id", user.id)
          .single();

        const balanceBefore = parseFloat(userProfile?.wallet_balance || "0.00");
        const paidAmount = charge.amount;
        const paidCurrency = charge.currency || metadata.currency || "NGN";

        let depositAmountNGN = paidAmount;
        if (paidCurrency !== "NGN") {
          try {
            depositAmountNGN = await convertCurrency(paidAmount, paidCurrency, "NGN");
          } catch (err) {
            console.error("Currency conversion error:", err);
          }
        }

        const balanceAfter = balanceBefore + depositAmountNGN;

        await supabase
          .from("users")
          .update({ wallet_balance: balanceAfter })
          .eq("id", user.id);

        await supabase.from("wallet_transactions").insert({
          user_id: user.id,
          type: "deposit",
          amount: depositAmountNGN,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          payment_id: payment.id,
          description: `Wallet deposit via Korapay (${paidCurrency} ${paidAmount.toFixed(2)})`,
        });

        await createTransactionNotification(user.id, "wallet_funded", depositAmountNGN, {
          currency: "NGN",
          payment_id: payment.id,
          description: "Wallet funded via Korapay",
        });

        return NextResponse.redirect(
          new URL(`/dashboard?payment=success&type=wallet&reference=${reference}`, request.url)
        );
      }
    }

    return NextResponse.redirect(
      new URL(
        `/dashboard?payment=${isSuccess ? "success" : "failed"}&reference=${reference}`,
        request.url
      )
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.redirect(new URL("/dashboard?payment=error", request.url));
  }
}
