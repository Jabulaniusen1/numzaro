import { NextResponse } from "next/server";
import { getBalance } from "@/lib/api/socialboost";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    if (!adminEmails.includes(user.email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get exobooster API balance (admin's account)
    const balance = await getBalance();

    return NextResponse.json({ balance });
  } catch (error) {
    console.error("Error fetching admin balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch balance", balance: "0.00" },
      { status: 500 }
    );
  }
}


