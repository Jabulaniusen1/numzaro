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

    if (number.status === "released") {
      return NextResponse.json(
        { error: "Number is already released" },
        { status: 400 }
      );
    }

    // Release number from provider
    if (number.provider_number_id) {
      try {
        const provider = getTelecomProvider();
        await provider.releaseNumber(number.provider_number_id);
      } catch (providerError: any) {
        console.error("Failed to release number from provider:", providerError);
        return NextResponse.json(
          {
            error: "Failed to release number from provider",
            details: providerError.message,
          },
          { status: 500 }
        );
      }
    }

    // Update status to released
    const { error: updateError } = await supabase
      .from("phone_numbers")
      .update({ status: "released" })
      .eq("id", params.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update number status" },
        { status: 500 }
      );
    }

    // Cancel any active subscriptions
    await supabase
      .from("number_subscriptions")
      .update({ status: "cancelled" })
      .eq("number_id", params.id)
      .in("status", ["active", "grace_period"]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Release number error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

