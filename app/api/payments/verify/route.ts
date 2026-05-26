import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/paystack/client";
import { authenticateRequest } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { createTransactionNotification } from "@/lib/notifications/create";
import { sendPushNotificationToUser } from "@/lib/notifications/push";
import { creditWalletFromSuccessfulPayment } from "@/lib/wallet/credit";
import { parsePaystackMetadata, paystackAmountToMajorUnit } from "@/lib/paystack/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get("reference") || searchParams.get("trxref");
    const paymentType = searchParams.get("type");

    if (!reference) {
      return NextResponse.redirect(new URL("/dashboard?payment=error", request.url));
    }

    const result = await verifyTransaction(reference);
    if (!result.status) {
      return NextResponse.redirect(new URL("/dashboard?payment=error", request.url));
    }

    const transaction = result.data;
    const metadata = parsePaystackMetadata(transaction.metadata);
    const providerReference = String(transaction.reference || reference);
    const isSuccess = String(transaction.status || "").toLowerCase() === "success";
    const paidAmount = paystackAmountToMajorUnit(transaction.amount);
    const paidCurrency = String(transaction.currency || "NGN").toUpperCase();

    const { user } = await authenticateRequest(request);
    const metadataUserId =
      typeof metadata.user_id === "string" && metadata.user_id ? metadata.user_id : null;
    const userId = metadataUserId || user?.id || null;

    if (!userId) {
      return NextResponse.redirect(new URL("/auth/login?redirect=/dashboard", request.url));
    }

    const supabase = createServiceRoleClient();

    const { data: existingPayment, error: existingPaymentError } = await supabase
      .from("payments")
      .select("id, user_id, status")
      .eq("provider_transaction_id", providerReference)
      .eq("payment_provider", "paystack")
      .maybeSingle();

    if (existingPaymentError) {
      console.error("Error checking existing payment:", existingPaymentError);
      return NextResponse.redirect(new URL("/dashboard?payment=error", request.url));
    }

    if (existingPayment?.user_id && existingPayment.user_id !== userId) {
      console.warn(
        `Paystack reference ${providerReference} already belongs to another user (${existingPayment.user_id})`
      );
    }

    let payment = existingPayment;
    const paymentOwnerId = existingPayment?.user_id || userId;

    if (!payment) {
      const { data: insertedPayment, error: insertPaymentError } = await supabase
        .from("payments")
        .insert({
          user_id: paymentOwnerId,
          amount: paidAmount,
          currency: paidCurrency,
          payment_provider: "paystack",
          provider_transaction_id: providerReference,
          status: isSuccess ? "Success" : "Failed",
        })
        .select("id, user_id, status")
        .single();

      if (insertPaymentError) {
        console.error("Error storing payment:", insertPaymentError);
        return NextResponse.redirect(new URL("/dashboard?payment=error", request.url));
      }

      payment = insertedPayment;
    } else if (isSuccess && payment.status !== "Success") {
      await supabase.from("payments").update({ status: "Success" }).eq("id", payment.id);
      payment = { ...payment, status: "Success" };
    }

    if (isSuccess && payment) {
      const isWalletFunding = paymentType === "wallet" || metadata.type === "wallet_funding";
      if (isWalletFunding) {
        const creditResult = await creditWalletFromSuccessfulPayment({
          supabase,
          userId: paymentOwnerId,
          paymentId: payment.id,
          provider: "paystack",
          providerTransactionId: providerReference,
          paidAmount,
          paidCurrency,
          description: "Wallet deposit via Paystack",
        });

        if (creditResult.credited) {
          const fundedAmount = Number(creditResult.depositAmountNGN || 0);
          await createTransactionNotification(paymentOwnerId, "wallet_funded", fundedAmount, {
            currency: "NGN",
            payment_id: payment.id,
            description: "Wallet funded via Paystack",
          });

          await sendPushNotificationToUser(paymentOwnerId, {
            title: "Wallet Funded",
            body: `Your wallet was funded with ₦${fundedAmount.toLocaleString()}`,
            data: {
              type: "wallet_funded",
              payment_id: payment.id,
              amount: fundedAmount,
              currency: "NGN",
            },
          });
        }

        return NextResponse.redirect(
          new URL(`/dashboard?payment=success&type=wallet&reference=${providerReference}`, request.url)
        );
      }
    }

    return NextResponse.redirect(
      new URL(
        `/dashboard?payment=${isSuccess ? "success" : "failed"}&reference=${providerReference}`,
        request.url
      )
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.redirect(new URL("/dashboard?payment=error", request.url));
  }
}
