import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { authenticateRequest } from "@/lib/supabase/server";
import { createHeleketInvoice, HeleketError } from "@/lib/heleket/client";

export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const amount = Number(body?.amount);

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL is not configured" }, { status: 500 });
    }

    const orderId = `wallet_${user.id}_${randomUUID().slice(0, 8)}`;
    const invoice = await createHeleketInvoice({
      amount,
      currency: "USD",
      orderId,
      urlCallback: `${appUrl}/api/webhooks/heleket`,
      urlSuccess: `${appUrl}/dashboard?payment=success&type=crypto`,
    });

    const checkoutUrl = invoice.url || null;
    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Provider did not return invoice URL. Please try another asset/network." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      invoiceId: String(invoice.uuid),
      invoiceUrl: checkoutUrl,
      orderId,
      status: invoice.status || "new",
    });
  } catch (error) {
    if (error instanceof HeleketError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
    }
    console.error("Crypto payment create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
