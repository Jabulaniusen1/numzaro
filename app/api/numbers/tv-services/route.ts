import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { textverifiedClient } from "@/lib/textverified/client";

export async function GET(request: NextRequest) {
  const { user } = await authenticateRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const raw = await textverifiedClient.getServicesList({
      numberType: "mobile",
      reservationType: "verification",
    });
    const seen = new Set<string>();
    const services = raw.filter((s) => {
      const key = s.serviceName.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return NextResponse.json({ services });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load services" }, { status: 500 });
  }
}
