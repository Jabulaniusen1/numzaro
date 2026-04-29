import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { getCryptoPayment } from "@/lib/nowpayments/client";
import { creditWalletFromSuccessfulPayment } from "@/lib/wallet/credit";

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const paymentId = body?.paymentId;

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    const cryptoPayment = await getCryptoPayment(paymentId);
    const status = String(cryptoPayment.payment_status || "").toLowerCase();
    const isPaid = ["finished", "confirmed", "sending", "partially_paid"].includes(status);

    const orderId = cryptoPayment.order_id || "";
    const ownerId = orderId.split("_")[1];
    if (ownerId !== user.id) {
      return NextResponse.json({ error: "Payment does not belong to this user" }, { status: 403 });
    }

    const existingPayment = await supabase
      .from("payments")
      .select("id, status")
      .eq("payment_provider", "nowpayments")
      .eq("provider_transaction_id", String(cryptoPayment.payment_id))
      .maybeSingle();

    let paymentIdDb = existingPayment.data?.id;

    if (!paymentIdDb) {
      const { data: inserted } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          amount: cryptoPayment.price_amount,
          currency: String(cryptoPayment.price_currency || "USD").toUpperCase(),
          payment_provider: "nowpayments",
          provider_transaction_id: String(cryptoPayment.payment_id),
          status: isPaid ? "Success" : "Pending",
        })
        .select("id")
        .single();
      paymentIdDb = inserted?.id;
    }

    if (!paymentIdDb) {
      return NextResponse.json({ error: "Unable to store payment" }, { status: 500 });
    }

    if (!isPaid) {
      return NextResponse.json({ status: "pending" });
    }

    await supabase
      .from("payments")
      .update({ status: "Success" })
      .eq("id", paymentIdDb);

    const creditResult = await creditWalletFromSuccessfulPayment({
      supabase,
      userId: user.id,
      paymentId: paymentIdDb,
      provider: "nowpayments",
      providerTransactionId: String(cryptoPayment.payment_id),
      paidAmount: cryptoPayment.price_amount,
      paidCurrency: String(cryptoPayment.price_currency || "USD").toUpperCase(),
      description: "Wallet deposit via NOWPayments",
    });

    return NextResponse.json({
      status: "success",
      credited: creditResult.credited,
      balanceAfter: (creditResult as any).balanceAfter ?? null,
    });
  } catch (error) {
    console.error("Crypto payment verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
