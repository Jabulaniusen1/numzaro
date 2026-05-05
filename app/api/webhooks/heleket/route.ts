import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { creditWalletFromSuccessfulPayment } from "@/lib/wallet/credit";
import { verifyHeleketWebhookSignature } from "@/lib/heleket/client";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const receivedSign = String(payload?.sign || "");

    if (!verifyHeleketWebhookSignature(payload, receivedSign)) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }

    const status = String(payload?.status || payload?.payment_status || "").toLowerCase();
    const isPaid = ["paid", "paid_over"].includes(status);

    const orderId = String(payload?.order_id || "");
    const userId = orderId.split("_")[1] || "";
    if (!userId) return NextResponse.json({ ok: true });

    const paymentProviderId = String(payload?.uuid || "");
    if (!paymentProviderId) return NextResponse.json({ ok: true });

    const supabase = createServiceRoleClient();
    const existing = await supabase
      .from("payments")
      .select("id")
      .eq("payment_provider", "heleket")
      .eq("provider_transaction_id", paymentProviderId)
      .maybeSingle();

    let paymentIdDb = existing.data?.id;
    if (!paymentIdDb) {
      const { data: inserted } = await supabase
        .from("payments")
        .insert({
          user_id: userId,
          amount: Number(payload?.amount || 0),
          currency: String(payload?.currency || "USD").toUpperCase(),
          payment_provider: "heleket",
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
        provider: "heleket",
        providerTransactionId: paymentProviderId,
        paidAmount: Number(payload?.payment_amount || payload?.amount || 0),
        paidCurrency: String(payload?.currency || "USD").toUpperCase(),
        description: "Wallet deposit via Heleket",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Heleket webhook error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
