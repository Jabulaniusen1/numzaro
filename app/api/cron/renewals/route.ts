import { NextRequest, NextResponse } from "next/server";
import { runRenewals } from "@/lib/cron/renewals";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runRenewals();
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json(result);
}
