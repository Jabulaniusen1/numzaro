import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { authenticateRequest } from "@/lib/supabase/server";
import { createCryptoInvoice, NowPaymentsError } from "@/lib/nowpayments/client";

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const amount = Number(body?.amount);
    const payCurrency = String(body?.payCurrency || "usdttrc20").toLowerCase();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL is not configured" }, { status: 500 });
    }

    const orderId = `wallet_${user.id}_${randomUUID().slice(0, 8)}`;
    const invoice = await createCryptoInvoice({
      amount,
      price_currency: "usd",
      pay_currency: payCurrency,
      order_id: orderId,
      order_description: "Wallet funding",
      ipn_callback_url: `${appUrl}/api/webhooks/nowpayments`,
      success_url: `${appUrl}/dashboard?payment=success&type=crypto`,
      cancel_url: `${appUrl}/dashboard?payment=failed&type=crypto`,
    });

    const checkoutUrl = invoice.invoice_url || null;
    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Provider did not return invoice URL. Please try another asset/network." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      invoiceId: invoice.id,
      invoiceUrl: checkoutUrl,
      orderId,
      payCurrency,
      status: "waiting",
    });
  } catch (error) {
    if (error instanceof NowPaymentsError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
    }
    console.error("Crypto payment create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
