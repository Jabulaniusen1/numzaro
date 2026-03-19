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

    // Sync messages from Textverified
    if (number.provider === "textverified" && number.textverified_id) {
      if (number.number_type === "rental") {
        const { syncTextverifiedRental } = await import("@/lib/textverified/adapter");
        const reservationType = number.product_code === "nonrenewable" ? "nonrenewable" : "renewable";
        await syncTextverifiedRental(number.id, number.textverified_id, reservationType, supabase);
      } else {
        const { syncTextverifiedVerification } = await import("@/lib/textverified/adapter");
        await syncTextverifiedVerification(number.id, number.textverified_id, supabase);
      }
    }

    // Sync messages from SMSPool
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
    const isOTP = searchParams.get("is_otp");

    let query = supabase
      .from("messages")
      .select("*")
      .eq("number_id", id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (isOTP === "true") query = query.eq("is_otp", true);
    else if (isOTP === "false") query = query.eq("is_otp", false);

    const { data: messages, error } = await query;

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error: any) {
    console.error("Error in GET /api/numbers/[id]/messages:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
