
import { NextResponse } from "next/server";
import { getQuackrServices } from "@/lib/quackr/adapter";

export async function GET() {
  try {
    const services = await getQuackrServices();
    return NextResponse.json(services);
  } catch (error: any) {
    console.error("[quackr/services]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
