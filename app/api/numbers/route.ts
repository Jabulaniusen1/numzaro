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
    const type = searchParams.get("type"); // Filter by type
    const status = searchParams.get("status"); // Filter by status
    const country = searchParams.get("country"); // Filter by country

    let query = supabase
      .from("phone_numbers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (type) {
      query = query.eq("type", type);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (country) {
      query = query.eq("country", country);
    }

    const { data: numbers, error } = await query;

    if (error) {
      console.error("Error fetching numbers:", error);
      return NextResponse.json(
        { error: "Failed to fetch numbers" },
        { status: 500 }
      );
    }

    return NextResponse.json({ numbers: numbers || [] });
  } catch (error: any) {
    console.error("List numbers error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

