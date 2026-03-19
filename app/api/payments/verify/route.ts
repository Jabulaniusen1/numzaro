import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction, PaystackError } from "@/lib/paystack/client";
import { authenticateRequest } from "@/lib/supabase/server";
import { createTransactionNotification } from "@/lib/notifications/create";
import { convertCurrency } from "@/lib/currency/rates";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get("reference");
    const paymentType = searchParams.get("type"); // 'wallet' or null

    if (!reference) {
      return NextResponse.redirect(
        new URL("/dashboard?payment=error", request.url)
      );
    }

    const result = await verifyTransaction(reference);

    if (!result.status) {
      return NextResponse.redirect(
        new URL("/dashboard?payment=error", request.url)
      );
    }

    const { user, supabase } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.redirect(
        new URL("/auth/login", request.url)
      );
    }

    // Store payment in database
    const paymentData = {
      user_id: user.id,
      amount: result.data.amount / 100, // Convert from kobo to main currency
      currency: result.data.currency,
      payment_provider: "paystack",
      provider_transaction_id: result.data.reference,
      status: result.data.status === "success" ? "Success" : "Failed",
    };

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      console.error("Error storing payment:", paymentError);
    }

    if (result.data.status === "success" && payment) {
      // Check if this is wallet funding
      const metadata = result.data.metadata;
      const isWalletFunding = paymentType === "wallet" || metadata?.type === "wallet_funding";

      if (isWalletFunding) {
        // Credit user's wallet
        const { data: userProfile } = await supabase
          .from("users")
          .select("wallet_balance")
          .eq("id", user.id)
          .single();

        const balanceBefore = parseFloat(userProfile?.wallet_balance || "0.00");
        
        // Get the amount paid in the currency that was used
        const paidAmount = result.data.amount / 100; // Convert from smallest currency unit
        const paidCurrency = result.data.currency || metadata?.currency || "USD";
        
        // Convert to USD if payment was in a different currency
        let depositAmountUSD = paidAmount;
        if (paidCurrency !== "USD") {
          try {
            depositAmountUSD = await convertCurrency(paidAmount, paidCurrency, "USD");
          } catch (error) {
            console.error("Error converting currency:", error);
            // If conversion fails, assume 1:1 (shouldn't happen, but fail gracefully)
          }
        }
        
        const balanceAfter = balanceBefore + depositAmountUSD;

        // Update wallet balance (always stored in USD)
        await supabase
          .from("users")
          .update({ wallet_balance: balanceAfter })
          .eq("id", user.id);

        // Create wallet transaction record
        await supabase
          .from("wallet_transactions")
          .insert({
            user_id: user.id,
            type: "deposit",
            amount: depositAmountUSD, // Store USD amount
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            payment_id: payment.id,
            description: `Wallet deposit via Paystack (${paidCurrency} ${paidAmount.toFixed(2)})`,
          });

        // Create notification for wallet funding
        await createTransactionNotification(
          user.id,
          "wallet_funded",
          depositAmountUSD,
          {
            currency: "USD",
            payment_id: payment.id,
            description: `Wallet funded via Paystack`,
          }
        );

        return NextResponse.redirect(
          new URL(`/dashboard?payment=success&type=wallet&reference=${reference}`, request.url)
        );
      }
      // Legacy: If metadata has order info, it's an old direct payment flow
      // This can be removed once all clients are updated to use wallet
    }

    return NextResponse.redirect(
      new URL(`/dashboard?payment=${result.data.status === "success" ? "success" : "failed"}&reference=${reference}`, request.url)
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.redirect(
      new URL("/dashboard?payment=error", request.url)
    );
  }
}
