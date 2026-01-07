import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTelecomProvider } from "@/lib/telecom";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { forwarding_number } = body;

    if (!forwarding_number) {
      return NextResponse.json(
        { error: "Forwarding number is required" },
        { status: 400 }
      );
    }

    // Verify ownership and get number details
    const { data: number } = await supabase
      .from("phone_numbers")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (!number) {
      return NextResponse.json(
        { error: "Number not found" },
        { status: 404 }
      );
    }

    if (number.type !== "business") {
      return NextResponse.json(
        { error: "Call forwarding is only available for business numbers" },
        { status: 400 }
      );
    }

    // Configure forwarding with provider
    if (number.provider_number_id) {
      try {
        const provider = getTelecomProvider();
        await provider.configureCallForwarding(
          number.provider_number_id,
          forwarding_number
        );
      } catch (providerError: any) {
        console.error("Provider forwarding configuration error:", providerError);
        // Continue to update DB even if provider config fails
      }
    }

    // Update database
    const { data: updatedNumber, error } = await supabase
      .from("phone_numbers")
      .update({ forwarding_number: forwarding_number })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update forwarding settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ number: updatedNumber });
  } catch (error: any) {
    console.error("Configure forwarding error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

