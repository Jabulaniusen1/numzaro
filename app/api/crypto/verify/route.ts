import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { getHeleketPaymentInfo } from "@/lib/heleket/client";
import { creditWalletFromSuccessfulPayment } from "@/lib/wallet/credit";

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const invoiceId = body?.invoiceId;

    if (!invoiceId) {
      return NextResponse.json({ error: "invoiceId is required" }, { status: 400 });
    }

    const invoice = await getHeleketPaymentInfo({ uuid: String(invoiceId) });
    const status = String(invoice.status || invoice.payment_status || "").toLowerCase();
    const isPaid = ["paid", "paid_over"].includes(status);

    const orderId = String(invoice.order_id || "");
    const ownerId = orderId.split("_")[1] || "";
    if (ownerId !== user.id) {
      return NextResponse.json({ error: "Payment does not belong to this user" }, { status: 403 });
    }

    const existingPayment = await supabase
      .from("payments")
      .select("id, status")
      .eq("payment_provider", "heleket")
      .eq("provider_transaction_id", String(invoice.uuid))
      .maybeSingle();

    let paymentIdDb = existingPayment.data?.id;

    if (!paymentIdDb) {
      const { data: inserted } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          amount: Number(invoice.amount || 0),
          currency: String(invoice.currency || "USD").toUpperCase(),
          payment_provider: "heleket",
          provider_transaction_id: String(invoice.uuid),
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
      provider: "heleket",
      providerTransactionId: String(invoice.uuid),
      paidAmount: Number(invoice.payment_amount || invoice.amount || 0),
      paidCurrency: String(invoice.currency || "USD").toUpperCase(),
      description: "Wallet deposit via Heleket",
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
