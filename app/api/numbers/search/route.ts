import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTelecomProvider } from "@/lib/telecom";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get("country");
    const capabilities = searchParams.get("capabilities") || "sms";
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!country) {
      return NextResponse.json(
        { error: "Country parameter is required" },
        { status: 400 }
      );
    }

    if (!["sms", "voice", "sms+voice"].includes(capabilities)) {
      return NextResponse.json(
        { error: "Invalid capabilities. Must be: sms, voice, or sms+voice" },
        { status: 400 }
      );
    }

    try {
      const provider = getTelecomProvider();
      const availableNumbers = await provider.searchNumbers(
        country,
        capabilities as "sms" | "voice" | "sms+voice",
        limit
      );

      return NextResponse.json({ numbers: availableNumbers });
    } catch (providerError: any) {
      console.error("Provider error:", providerError);
      console.error("Provider error stack:", providerError.stack);
      return NextResponse.json(
        {
          error: "Failed to search numbers",
          details: providerError.message || "Provider API error",
          code: providerError.code,
          statusCode: providerError.statusCode,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Search numbers error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

