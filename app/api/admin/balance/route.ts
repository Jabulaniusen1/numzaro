import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    if (!adminEmails.includes(user.email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Note: Textverified doesn't provide a balance API endpoint
    // Balance tracking would need to be done through purchase history
    return NextResponse.json({
      balance: "0.00",
      currency: "USD",
      message: "Textverified provider balance not available via API",
    });
  } catch (error) {
    console.error("Error fetching admin balance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
