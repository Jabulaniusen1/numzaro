import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/paystack/client";
import { authenticateRequest } from "@/lib/supabase/server";
import { creditWalletFromSuccessfulPayment } from "@/lib/wallet/credit";
import { parsePaystackMetadata, paystackAmountToMajorUnit } from "@/lib/paystack/utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const reference = String(body?.reference || "");
    const type = body?.type;

    if (!reference) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 });
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transaction = result.data;
    const metadata = parsePaystackMetadata(transaction.metadata);
    const isSuccess = String(transaction.status || "").toLowerCase() === "success";
    const paidAmount = paystackAmountToMajorUnit(transaction.amount);
    const paidCurrency = String(transaction.currency || "NGN").toUpperCase();
    const providerReference = String(transaction.reference || reference);

    const { data: existingPayment, error: existingPaymentError } = await supabase
      .from("payments")
      .select("id, user_id, status")
      .eq("provider_transaction_id", providerReference)
      .eq("payment_provider", "paystack")
      .maybeSingle();

    if (existingPaymentError) {
      console.error("Error checking existing payment:", existingPaymentError);
      return NextResponse.json({ error: "Error storing payment", status: "error" }, { status: 500 });
    }

    if (existingPayment?.user_id && existingPayment.user_id !== user.id) {
      return NextResponse.json({ error: "Reference does not belong to this user" }, { status: 403 });
    }

    let payment = existingPayment;

    if (!payment) {
      const { data: insertedPayment, error: insertPaymentError } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          amount: paidAmount,
          currency: paidCurrency,
          payment_provider: "paystack",
          provider_transaction_id: providerReference,
          status: isSuccess ? "Success" : "Failed",
        })
        .select("id, user_id, status")
        .single();

      if (insertPaymentError) {
        console.error("Error inserting payment:", insertPaymentError);
        return NextResponse.json({ error: "Error storing payment", status: "error" }, { status: 500 });
      }

      payment = insertedPayment;
    } else if (isSuccess && payment.status !== "Success") {
      await supabase.from("payments").update({ status: "Success" }).eq("id", payment.id);
      payment = { ...payment, status: "Success" };
    }

    if (isSuccess && payment) {
      const isWalletFunding = type === "wallet" || metadata.type === "wallet_funding";

      if (isWalletFunding) {
        const creditResult = await creditWalletFromSuccessfulPayment({
          supabase,
          userId: user.id,
          paymentId: payment.id,
          provider: "paystack",
          providerTransactionId: providerReference,
          paidAmount,
          paidCurrency,
          description: "Wallet deposit via Paystack",
        });

        if (creditResult.credited) {
          return NextResponse.json({
            status: "success",
            type: "wallet",
            reference: providerReference,
            balanceAfter: creditResult.balanceAfter,
          });
        }

        const { data: userProfile } = await supabase
          .from("users")
          .select("wallet_balance")
          .eq("id", user.id)
          .single();

        return NextResponse.json({
          status: "success",
          type: "wallet",
          reference: providerReference,
          balanceAfter: parseFloat(userProfile?.wallet_balance || "0"),
        });
      }
    }

    return NextResponse.json({
      status: isSuccess ? "success" : "failed",
      reference: providerReference,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Internal server error", status: "error" }, { status: 500 });
  }
}
