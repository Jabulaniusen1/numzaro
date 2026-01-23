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
    const isOTP = searchParams.get("is_otp");

    let query = supabase
      .from("messages")
      .select("*")
      .eq("number_id", params.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (isOTP === "true") {
      query = query.eq("is_otp", true);
    } else if (isOTP === "false") {
      query = query.eq("is_otp", false);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error: any) {
    console.error("Error in GET /api/numbers/[id]/messages:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}












