import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getBTCPayInvoice } from "@/lib/btcpay/client";
import { creditWalletFromSuccessfulPayment } from "@/lib/wallet/credit";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const invoiceId = String(payload?.invoiceId || payload?.data?.id || "");
    if (!invoiceId) return NextResponse.json({ ok: true });

    const invoice = await getBTCPayInvoice(invoiceId);
    const status = String(invoice.status || "").toLowerCase();
    const isPaid = ["settled", "processing", "paid"].includes(status);
    const userId = String(invoice.metadata?.userId || "");

    if (!userId) return NextResponse.json({ ok: true });

    const supabase = createServiceRoleClient();
    const existing = await supabase
      .from("payments")
      .select("id")
      .eq("payment_provider", "btcpay")
      .eq("provider_transaction_id", invoiceId)
      .maybeSingle();

    let paymentIdDb = existing.data?.id;
    if (!paymentIdDb) {
      const { data: inserted } = await supabase
        .from("payments")
        .insert({
          user_id: userId,
          amount: Number(invoice.amount || 0),
          currency: String(invoice.currency || "USD").toUpperCase(),
          payment_provider: "btcpay",
          provider_transaction_id: invoiceId,
          status: isPaid ? "Success" : "Pending",
        })
        .select("id")
        .single();
      paymentIdDb = inserted?.id;
    }

    if (isPaid && paymentIdDb) {
      await supabase.from("payments").update({ status: "Success" }).eq("id", paymentIdDb);
      await creditWalletFromSuccessfulPayment({
        supabase,
        userId,
        paymentId: paymentIdDb,
        provider: "btcpay",
        providerTransactionId: invoiceId,
        paidAmount: Number(invoice.amount || 0),
        paidCurrency: String(invoice.currency || "USD").toUpperCase(),
        description: "Wallet deposit via BTCPay",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("BTCPay webhook error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
