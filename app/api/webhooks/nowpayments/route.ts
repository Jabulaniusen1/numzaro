import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { creditWalletFromSuccessfulPayment } from "@/lib/wallet/credit";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const status = String(payload?.payment_status || "").toLowerCase();
    const isPaid = ["finished", "confirmed", "sending", "partially_paid"].includes(status);

    const orderId = String(payload?.order_id || "");
    const userId = orderId.split("_")[1];
    if (!userId) {
      return NextResponse.json({ ok: true });
    }

    const paymentProviderId = String(payload?.payment_id || "");
    if (!paymentProviderId) {
      return NextResponse.json({ ok: true });
    }

    const supabase = createServiceRoleClient();

    const existing = await supabase
      .from("payments")
      .select("id")
      .eq("payment_provider", "nowpayments")
      .eq("provider_transaction_id", paymentProviderId)
      .maybeSingle();

    let paymentIdDb = existing.data?.id;
    if (!paymentIdDb) {
      const { data: inserted } = await supabase
        .from("payments")
        .insert({
          user_id: userId,
          amount: Number(payload?.price_amount || 0),
          currency: String(payload?.price_currency || "USD").toUpperCase(),
          payment_provider: "nowpayments",
          provider_transaction_id: paymentProviderId,
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
        provider: "nowpayments",
        providerTransactionId: paymentProviderId,
        paidAmount: Number(payload?.price_amount || 0),
        paidCurrency: String(payload?.price_currency || "USD").toUpperCase(),
        description: "Wallet deposit via NOWPayments",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("NOWPayments webhook error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
