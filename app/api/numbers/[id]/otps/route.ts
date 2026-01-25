import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // Verify number belongs to user
    const { data: number, error: numberError } = await supabase
      .from("virtual_numbers")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (numberError || !number) {
      return NextResponse.json(
        { error: "Number not found" },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");

    let query = supabase
      .from("otp_codes")
      .select("*")
      .eq("number_id", params.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: otps, error } = await query;

    if (error) {
      console.error("Error fetching OTPs:", error);
      return NextResponse.json(
        { error: "Failed to fetch OTPs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ otps: otps || [] });
  } catch (error: any) {
    console.error("Error in GET /api/numbers/[id]/otps:", error);
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
    const { otp_id, status: newStatus } = body;

    if (!otp_id || !newStatus) {
      return NextResponse.json(
        { error: "otp_id and status are required" },
        { status: 400 }
      );
    }

    // Verify number belongs to user
    const { data: number, error: numberError } = await supabase
      .from("virtual_numbers")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (numberError || !number) {
      return NextResponse.json(
        { error: "Number not found" },
        { status: 404 }
      );
    }

    // Update OTP status
    const updateData: any = { status: newStatus };
    if (newStatus === "used") {
      updateData.used_at = new Date().toISOString();
    }

    const { data: otp, error } = await supabase
      .from("otp_codes")
      .update(updateData)
      .eq("id", otp_id)
      .eq("number_id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating OTP:", error);
      return NextResponse.json(
        { error: "Failed to update OTP" },
        { status: 500 }
      );
    }

    return NextResponse.json({ otp });
  } catch (error: any) {
    console.error("Error in PATCH /api/numbers/[id]/otps:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}














