import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTelecomProvider } from "@/lib/telecom";

export async function GET(
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

    const { data: number, error } = await supabase
      .from("phone_numbers")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (error || !number) {
      return NextResponse.json(
        { error: "Number not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ number });
  } catch (error: any) {
    console.error("Get number error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { forwarding_number, voicemail_enabled } = body;

    // Verify ownership
    const { data: existingNumber } = await supabase
      .from("phone_numbers")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (!existingNumber) {
      return NextResponse.json(
        { error: "Number not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (forwarding_number !== undefined) {
      updateData.forwarding_number = forwarding_number;
    }
    if (voicemail_enabled !== undefined) {
      updateData.voicemail_enabled = voicemail_enabled;
    }

    const { data: updatedNumber, error } = await supabase
      .from("phone_numbers")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update number" },
        { status: 500 }
      );
    }

    return NextResponse.json({ number: updatedNumber });
  } catch (error: any) {
    console.error("Update number error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Release number from provider
    if (number.provider_number_id && number.status === "active") {
      try {
        const provider = getTelecomProvider();
        await provider.releaseNumber(number.provider_number_id);
      } catch (providerError) {
        console.error("Failed to release number from provider:", providerError);
        // Continue with deletion even if provider release fails
      }
    }

    // Update status to released (don't actually delete to keep history)
    const { error: updateError } = await supabase
      .from("phone_numbers")
      .update({ status: "released" })
      .eq("id", params.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to release number" },
        { status: 500 }
      );
    }

    // Cancel any active subscriptions
    await supabase
      .from("number_subscriptions")
      .update({ status: "cancelled" })
      .eq("number_id", params.id)
      .eq("status", "active");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete number error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

