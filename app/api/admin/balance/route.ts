import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { textverifiedClient } from "@/lib/textverified/client";

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

    const account = await textverifiedClient.getAccount();
    return NextResponse.json({
      balance: String(account.currentBalance ?? "0.00"),
      currency: "USD",
      username: account.username,
    });
  } catch (error) {
    console.error("Error fetching admin balance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
