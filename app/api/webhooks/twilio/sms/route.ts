import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Twilio webhook disabled
  return NextResponse.json({ message: "Twilio webhook disabled" }, { status: 200 });
}
