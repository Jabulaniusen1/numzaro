import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { textverifiedClient } from "@/lib/textverified/client";

export async function GET(request: NextRequest) {
  const { user } = await authenticateRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const services = await textverifiedClient.getServicesList({
      numberType: "mobile",
      reservationType: "verification",
    });
    return NextResponse.json({ services });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load services" }, { status: 500 });
  }
}
