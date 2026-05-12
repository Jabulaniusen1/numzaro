import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { creditWalletFromSuccessfulPayment } from "@/lib/wallet/credit";

function verifySignature(rawBody: string, receivedSignature: string): boolean {
  const secret = process.env.KORAPAY_SECRET_KEY?.trim();
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === receivedSignature;
}

export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ ok: false, error: "Cannot read body" }, { status: 400 });
  }

  const signature = request.headers.get("x-korapay-signature") ?? "";
  if (!verifySignature(rawBody, signature)) {
    console.warn("[webhook/korapay] invalid signature");
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  // Korapay wraps the charge inside payload.data
  const charge = payload?.data ?? payload;
  const event = String(payload?.event ?? "");

  // Only handle successful charges
  const status = String(charge?.status ?? "").toLowerCase();
  if (status !== "success") {
    return NextResponse.json({ ok: true });
  }

  // We only care about charge.success events for wallet funding
  if (event && !event.startsWith("charge.")) {
    return NextResponse.json({ ok: true });
  }

  const reference = String(charge?.reference ?? "");
  if (!reference) return NextResponse.json({ ok: true });

  // user_id is embedded in metadata at charge creation time
  const userId = String(charge?.metadata?.user_id ?? "");
  if (!userId) {
    console.warn("[webhook/korapay] no user_id in metadata for reference:", reference);
    return NextResponse.json({ ok: true });
  }

  const isWalletFunding =
    charge?.metadata?.type === "wallet_funding" ||
    String(charge?.metadata?.payment_type ?? "") === "wallet";

  if (!isWalletFunding) {
    return NextResponse.json({ ok: true });
  }

  const paidAmount = Number(charge?.amount ?? 0);
  const paidCurrency = String(charge?.currency ?? "NGN").toUpperCase();

  if (!paidAmount || paidAmount <= 0) {
    console.warn("[webhook/korapay] zero or missing amount for reference:", reference);
    return NextResponse.json({ ok: true });
  }

  const supabase = createServiceRoleClient();

  // Upsert the payment record
  const { data: existing } = await supabase
    .from("payments")
    .select("id, status")
    .eq("payment_provider", "korapay")
    .eq("provider_transaction_id", reference)
    .maybeSingle();

  let paymentId: string | undefined = existing?.id;

  if (!paymentId) {
    const { data: inserted } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        amount: paidAmount,
        currency: paidCurrency,
        payment_provider: "korapay",
        provider_transaction_id: reference,
        status: "Success",
      })
      .select("id")
      .single();
    paymentId = inserted?.id;
  } else if (existing?.status !== "Success") {
    await supabase.from("payments").update({ status: "Success" }).eq("id", paymentId);
  }

  if (!paymentId) {
    console.error("[webhook/korapay] failed to upsert payment for reference:", reference);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const result = await creditWalletFromSuccessfulPayment({
    supabase,
    userId,
    paymentId,
    provider: "korapay",
    providerTransactionId: reference,
    paidAmount,
    paidCurrency,
    description: "Wallet deposit via Korapay",
  });

  if (result.credited) {
    console.log(`[webhook/korapay] credited ₦${result.depositAmountNGN} to user ${userId} (ref: ${reference})`);
  } else {
    console.log(`[webhook/korapay] skipped credit for ref: ${reference} — reason: ${result.reason}`);
  }

  return NextResponse.json({ ok: true });
}
