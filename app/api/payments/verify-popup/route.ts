import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction, PaystackError } from "@/lib/paystack/client";
import { authenticateRequest } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference, type } = body; // type: 'wallet' or undefined

    if (!reference) {
      return NextResponse.json(
        { error: "Reference is required" },
        { status: 400 }
      );
    }

    const result = await verifyTransaction(reference);

    if (!result.status) {
      return NextResponse.json(
        { error: "Transaction verification failed", status: "failed" },
        { status: 400 }
      );
    }

    const { user, supabase } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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
      return NextResponse.json(
        { error: "Error storing payment", status: "error" },
        { status: 500 }
      );
    }

    if (result.data.status === "success" && payment) {
      // Check if this is wallet funding
      const metadata = result.data.metadata;
      const isWalletFunding = type === "wallet" || metadata?.type === "wallet_funding";

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
            // Fetch exchange rate from paid currency to USD
            const exchangeRateResponse = await fetch(
              `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/pair/${paidCurrency}/USD`
            );
            if (exchangeRateResponse.ok) {
              const rateData = await exchangeRateResponse.json();
              if (rateData.result === "success" && rateData.conversion_rate) {
                // Convert from local currency to USD
                // conversion_rate tells us how many USD per 1 unit of local currency
                // So we multiply: NGN amount * (USD per NGN) = USD amount
                depositAmountUSD = paidAmount * rateData.conversion_rate;
              }
            }
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

        return NextResponse.json({
          status: "success",
          type: "wallet",
          reference: reference,
          balanceAfter: balanceAfter,
        });
      }
      // Legacy: If metadata has order info, it's an old direct payment flow
    }

    return NextResponse.json({
      status: result.data.status === "success" ? "success" : "failed",
      reference: reference,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Internal server error", status: "error" },
      { status: 500 }
    );
  }
}

