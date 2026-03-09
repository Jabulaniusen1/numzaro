import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const { data: number, error: numberError } = await supabase
      .from("virtual_numbers")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (numberError || !number) {
      return NextResponse.json({ error: "Number not found" }, { status: 404 });
    }

    // Sync messages before returning OTPs
    if (number.provider === "smspool") {
      if (number.number_type === "rental" && number.rental_code) {
        const { syncSmsPoolRental } = await import("@/lib/smspool/adapter");
        await syncSmsPoolRental(number.id, number.rental_code, supabase);
      } else if (number.textverified_id) {
        const { syncSmsPoolActivation } = await import("@/lib/smspool/adapter");
        await syncSmsPoolActivation(number.id, number.textverified_id, supabase);
      }
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");

    let query = supabase
      .from("otp_codes")
      .select("*")
      .eq("number_id", id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);

    const { data: otps, error } = await query;

    if (error) {
      console.error("Error fetching OTPs:", error);
      return NextResponse.json({ error: "Failed to fetch OTPs" }, { status: 500 });
    }

    return NextResponse.json({ otps: otps || [] });
  } catch (error: any) {
    console.error("Error in GET /api/numbers/[id]/otps:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { otp_id, status: newStatus } = await request.json();

    if (!otp_id || !newStatus) {
      return NextResponse.json({ error: "otp_id and status are required" }, { status: 400 });
    }

    const { data: number, error: numberError } = await supabase
      .from("virtual_numbers")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (numberError || !number) {
      return NextResponse.json({ error: "Number not found" }, { status: 404 });
    }

    const updateData: any = { status: newStatus };
    if (newStatus === "used") updateData.used_at = new Date().toISOString();

    const { data: otp, error } = await supabase
      .from("otp_codes")
      .update(updateData)
      .eq("id", otp_id)
      .eq("number_id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating OTP:", error);
      return NextResponse.json({ error: "Failed to update OTP" }, { status: 500 });
    }

    return NextResponse.json({ otp });
  } catch (error: any) {
    console.error("Error in PATCH /api/numbers/[id]/otps:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
