import { NextResponse } from "next/server";
import { getCryptoCurrencies, NowPaymentsError } from "@/lib/nowpayments/client";

const PRIORITY = ["usdttrc20", "btc", "eth", "ltc", "usdc", "trx", "bnb", "sol"];

function labelFor(code: string) {
  const upper = code.toUpperCase();
  if (code === "usdttrc20") return "USDT (TRC20)";
  if (code === "usdterc20") return "USDT (ERC20)";
  if (code === "usdtbsc") return "USDT (BSC)";
  return upper;
}

export async function GET() {
  try {
    const all = await getCryptoCurrencies();
    const filtered = all.filter((c) => /^[a-z0-9]+$/i.test(c));
    const sorted = [...filtered].sort((a, b) => {
      const ai = PRIORITY.indexOf(a.toLowerCase());
      const bi = PRIORITY.indexOf(b.toLowerCase());
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    return NextResponse.json({
      assets: sorted.slice(0, 120).map((code) => ({
        code,
        label: labelFor(code.toLowerCase()),
      })),
    });
  } catch (error) {
    if (error instanceof NowPaymentsError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
    }
    console.error("Crypto assets fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch crypto assets" }, { status: 500 });
  }
}
