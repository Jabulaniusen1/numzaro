import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getTelecomProvider } from "@/lib/telecom";

/**
 * Cleanup expired numbers
 * Should be called by external cron service
 * 
 * Optional: Add a secret token for security
 * ?token=YOUR_CRON_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Verify cron secret token
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");
    const cronSecret = process.env.CRON_SECRET_TOKEN;

    if (cronSecret && token !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const results = {
      processed: 0,
      released: 0,
      errors: [] as string[],
    };

    // Find expired OTP numbers (expired more than 7 days ago)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: expiredNumbers } = await supabase
      .from("phone_numbers")
      .select("*")
      .eq("type", "otp")
      .eq("status", "expired")
      .lt("updated_at", sevenDaysAgo);

    if (!expiredNumbers || expiredNumbers.length === 0) {
      return NextResponse.json({
        message: "No expired numbers to cleanup",
        processed: 0,
      });
    }

    const provider = getTelecomProvider();

    for (const number of expiredNumbers) {
      results.processed++;

      try {
        // Release number from provider if not already released
        if (number.provider_number_id && number.status === "expired") {
          try {
            await provider.releaseNumber(number.provider_number_id);
          } catch (providerError: any) {
            // Number might already be released - continue
            console.warn(
              `Failed to release number ${number.id} from provider:`,
              providerError.message
            );
          }
        }

        // Update status (already expired, but mark for archival if needed)
        // For now, we'll leave them as expired for audit purposes
        results.released++;
      } catch (error: any) {
        results.errors.push(
          `Number ${number.id}: ${error.message || "Unknown error"}`
        );
        console.error(`Error cleaning up number ${number.id}:`, error);
      }
    }

    return NextResponse.json({
      message: "Cleanup job completed",
      ...results,
    });
  } catch (error: any) {
    console.error("Cleanup cron error:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

