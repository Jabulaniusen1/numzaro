import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Daily renewal job endpoint
 * Should be called by external cron service (e.g., cron-job.org, EasyCron)
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
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Find numbers due for renewal (within next 24 hours)
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const today = new Date().toISOString();

    const { data: subscriptions } = await supabase
      .from("number_subscriptions")
      .select(
        `
        *,
        phone_numbers!inner(*),
        users!inner(*)
      `
      )
      .eq("status", "active")
      .lte("next_charge_date", tomorrow)
      .gte("next_charge_date", today);

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        message: "No renewals due",
        processed: 0,
      });
    }

    for (const subscription of subscriptions) {
      results.processed++;
      const number = (subscription as any).phone_numbers;
      const user = (subscription as any).users;

      if (!number || !user) {
        results.failed++;
        results.errors.push(`Subscription ${subscription.id}: Missing number or user`);
        continue;
      }

      try {
        const monthlyCost = parseFloat(number.monthly_cost || "0");
        const userBalance = parseFloat(user.wallet_balance || "0");

        // Check if user has sufficient balance
        if (userBalance < monthlyCost) {
          // Enter grace period or mark as failed
          const failedAttempts = (subscription.failed_attempts || 0) + 1;

          if (failedAttempts >= 3) {
            // After 3 failed attempts, release the number
            await supabase
              .from("number_subscriptions")
              .update({
                status: "failed",
                failed_attempts: failedAttempts,
              })
              .eq("id", subscription.id);

            await supabase
              .from("phone_numbers")
              .update({ status: "expired" })
              .eq("id", number.id);

            results.failed++;
            results.errors.push(
              `Subscription ${subscription.id}: Insufficient balance after 3 attempts, number released`
            );
          } else {
            // Enter grace period
            await supabase
              .from("number_subscriptions")
              .update({
                status: "grace_period",
                failed_attempts: failedAttempts,
              })
              .eq("id", subscription.id);

            results.failed++;
            results.errors.push(
              `Subscription ${subscription.id}: Insufficient balance, entered grace period (attempt ${failedAttempts}/3)`
            );
          }
          continue;
        }

        // Charge user's wallet
        const newBalance = userBalance - monthlyCost;
        await supabase
          .from("users")
          .update({ wallet_balance: newBalance })
          .eq("id", user.id);

        // Create wallet transaction
        await supabase.from("wallet_transactions").insert({
          user_id: user.id,
          type: "order_payment",
          amount: -monthlyCost,
          balance_before: userBalance,
          balance_after: newBalance,
          description: `Monthly renewal: ${number.number}`,
        });

        // Update subscription
        const nextChargeDate = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString();

        await supabase
          .from("number_subscriptions")
          .update({
            next_charge_date: nextChargeDate,
            last_charge_date: new Date().toISOString(),
            status: "active",
            failed_attempts: 0,
          })
          .eq("id", subscription.id);

        // Update phone number renewal date
        await supabase
          .from("phone_numbers")
          .update({ renewal_date: nextChargeDate })
          .eq("id", number.id);

        results.successful++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(
          `Subscription ${subscription.id}: ${error.message || "Unknown error"}`
        );
        console.error(`Error processing subscription ${subscription.id}:`, error);
      }
    }

    return NextResponse.json({
      message: "Renewal job completed",
      ...results,
    });
  } catch (error: any) {
    console.error("Renewal cron error:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

