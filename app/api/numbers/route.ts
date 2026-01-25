import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("virtual_numbers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: numbers, error } = await query;

    if (error) {
      console.error("Error fetching numbers:", error);
      return NextResponse.json(
        { error: "Failed to fetch numbers" },
        { status: 500 }
      );
    }

    // Get stats for each number
    const numbersWithStats = await Promise.all(
      (numbers || []).map(async (number) => {
        // Get message count
        const { count: messageCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("number_id", number.id);

        // Get pending OTP count
        const { count: otpCount } = await supabase
          .from("otp_codes")
          .select("*", { count: "exact", head: true })
          .eq("number_id", number.id)
          .eq("status", "pending");

        return {
          ...number,
          message_count: messageCount || 0,
          pending_otp_count: otpCount || 0,
        };
      })
    );

    return NextResponse.json({ numbers: numbersWithStats });
  } catch (error: any) {
    console.error("Error in GET /api/numbers:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}













