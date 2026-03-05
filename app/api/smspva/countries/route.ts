
import { NextResponse } from "next/server";
import { SMSPVA_COUNTRIES } from "@/lib/smspva/adapter";

export async function GET() {
  return NextResponse.json(SMSPVA_COUNTRIES);
}
