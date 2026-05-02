import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      assets: [],
      message: "Asset selection is handled directly on BTCPay checkout.",
    },
    { status: 200 }
  );
}
