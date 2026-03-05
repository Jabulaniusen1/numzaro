import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Note: Textverified doesn't provide a balance API endpoint
    // Balance tracking would need to be done through purchase history or manual entry
    // Returning placeholder to prevent UI issues
    return NextResponse.json({
      balance: "0.00",
      currency: "USD",
      message: "Textverified provider balance not available via API"
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

