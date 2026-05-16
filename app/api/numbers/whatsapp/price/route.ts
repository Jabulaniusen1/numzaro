import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { pvadealsClient } from "@/lib/pvadeals/client";
import { getLiveFxRate } from "@/lib/currency/rates";

async function getMarkupMultiplier(): Promise<number> {
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "phone_numbers_markup_percentage")
      .single();
    const pct = data ? parseFloat(data.value) : 400.0;
    return 1 + pct / 100;
  } catch {
    return 5.0;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const whatsappService = await pvadealsClient.getWhatsAppService();
    if (!whatsappService) {
      return NextResponse.json(
        { error: "WhatsApp US numbers are currently unavailable." },
        { status: 503 }
      );
    }

    const rawPriceUsd = whatsappService.STRprice;
    const markupMultiplier = await getMarkupMultiplier();
    const userChargedUsd = parseFloat((rawPriceUsd * markupMultiplier).toFixed(4));

    let rate = 1500;
    try {
      rate = await getLiveFxRate("USD", "NGN");
    } catch {}

    const userChargedNgn = parseFloat((userChargedUsd * rate).toFixed(2));

    return NextResponse.json({
      success: true,
      data: {
        service: "WhatsApp",
        country: "US",
        duration: "20 minutes",
        priceUsd: userChargedUsd,
        priceNgn: userChargedNgn,
        fxRate: rate,
      },
    });
  } catch (error: any) {
    console.error("[whatsapp/price]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
