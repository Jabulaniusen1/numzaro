import { NextResponse } from "next/server";
import { textverifiedClient } from "@/lib/textverified/client";

export async function GET() {
  try {
    const account = await textverifiedClient.getAccount();
    return NextResponse.json({
      balance: String(account.currentBalance ?? "0.00"),
      currency: "USD",
      username: account.username,
    });
  } catch (error) {
    console.error("Error in balance endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      balance: "0.00",
      error: errorMessage
    });
  }
}
