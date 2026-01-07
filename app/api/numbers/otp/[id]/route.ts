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

    // Get OTP number and session
    const { data: number } = await supabase
      .from("phone_numbers")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .eq("type", "otp")
      .single();

    if (!number) {
      return NextResponse.json(
        { error: "OTP number not found" },
        { status: 404 }
      );
    }

    // Get OTP session
    const { data: session } = await supabase
      .from("otp_sessions")
      .select("*")
      .eq("number_id", params.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      number,
      session: session || null,
    });
  } catch (error: any) {
    console.error("Get OTP session error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

