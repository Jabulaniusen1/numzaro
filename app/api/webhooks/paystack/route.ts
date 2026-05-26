import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { creditWalletFromSuccessfulPayment } from "@/lib/wallet/credit";
import { parsePaystackMetadata, paystackAmountToMajorUnit } from "@/lib/paystack/utils";
import { createTransactionNotification } from "@/lib/notifications/create";
import { sendPushNotificationToUser } from "@/lib/notifications/push";

export const dynamic = "force-dynamic";

function verifySignature(rawBody: string, receivedSignature: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secret || !receivedSignature) return false;

  const expected = createHmac("sha512", secret).update(rawBody).digest("hex").toLowerCase();
  const normalizedReceived = receivedSignature.trim().toLowerCase();
  const expectedBytes = Buffer.from(expected, "utf8");
  const receivedBytes = Buffer.from(normalizedReceived, "utf8");

  if (expectedBytes.length !== receivedBytes.length) return false;
  return timingSafeEqual(expectedBytes, receivedBytes);
}

export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ ok: false, error: "Cannot read body" }, { status: 400 });
  }

  const signature = request.headers.get("x-paystack-signature") ?? "";
  if (!verifySignature(rawBody, signature)) {
    console.warn("[webhook/paystack] invalid signature");
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const event = String(payload?.event || "");
  const data = payload?.data ?? {};
  const status = String(data?.status || "").toLowerCase();

  if (event !== "charge.success" || status !== "success") {
    return NextResponse.json({ ok: true });
  }

  const reference = String(data?.reference || "");
  if (!reference) return NextResponse.json({ ok: true });

  const metadata = parsePaystackMetadata(data?.metadata);
  const userId =
    typeof metadata.user_id === "string" && metadata.user_id ? metadata.user_id : "";

  if (!userId) {
    console.warn("[webhook/paystack] missing user_id metadata for reference:", reference);
    return NextResponse.json({ ok: true });
  }

  const isWalletFunding =
    metadata.type === "wallet_funding" || String(metadata.payment_type || "") === "wallet";

  if (!isWalletFunding) {
    return NextResponse.json({ ok: true });
  }

  const paidAmount = paystackAmountToMajorUnit(data?.amount);
  const paidCurrency = String(data?.currency || "NGN").toUpperCase();
  if (!paidAmount || paidAmount <= 0) {
    console.warn("[webhook/paystack] zero or invalid amount for reference:", reference);
    return NextResponse.json({ ok: true });
  }

  const supabase = createServiceRoleClient();

  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id, status, user_id")
    .eq("payment_provider", "paystack")
    .eq("provider_transaction_id", reference)
    .maybeSingle();

  let paymentId: string | undefined = existingPayment?.id;
  const paymentOwnerId = existingPayment?.user_id || userId;

  if (!paymentId) {
    const { data: inserted } = await supabase
      .from("payments")
      .insert({
        user_id: paymentOwnerId,
        amount: paidAmount,
        currency: paidCurrency,
        payment_provider: "paystack",
        provider_transaction_id: reference,
        status: "Success",
      })
      .select("id")
      .single();
    paymentId = inserted?.id;
  } else if (existingPayment?.status !== "Success") {
    await supabase.from("payments").update({ status: "Success" }).eq("id", paymentId);
  }

  if (!paymentId) {
    console.error("[webhook/paystack] failed to upsert payment for reference:", reference);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const creditResult = await creditWalletFromSuccessfulPayment({
    supabase,
    userId: paymentOwnerId,
    paymentId,
    provider: "paystack",
    providerTransactionId: reference,
    paidAmount,
    paidCurrency,
    description: "Wallet deposit via Paystack",
  });

  if (creditResult.credited) {
    const fundedAmount = Number(creditResult.depositAmountNGN || 0);
    await createTransactionNotification(paymentOwnerId, "wallet_funded", fundedAmount, {
      currency: "NGN",
      payment_id: paymentId,
      description: "Wallet funded via Paystack webhook",
    });

    await sendPushNotificationToUser(paymentOwnerId, {
      title: "Wallet Funded",
      body: `Your wallet was funded with ₦${fundedAmount.toLocaleString()}`,
      data: {
        type: "wallet_funded",
        payment_id: paymentId,
        amount: fundedAmount,
        currency: "NGN",
      },
    });

    console.log(
      `[webhook/paystack] credited ₦${creditResult.depositAmountNGN} to user ${paymentOwnerId} (ref: ${reference})`
    );
  } else {
    console.log(
      `[webhook/paystack] skipped credit for ref: ${reference} — reason: ${creditResult.reason}`
    );
  }

  return NextResponse.json({ ok: true });
}
