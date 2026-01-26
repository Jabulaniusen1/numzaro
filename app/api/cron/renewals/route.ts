import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getDefaultMonthlyCost, getPhoneNumbersMarkup } from "@/lib/twilio/costs";
import { sendEmail } from "@/lib/email/smtp";
import { getRenewalReminderEmail, getNumberRestrictedEmail, getRenewalSuccessEmail } from "@/lib/email/templates";
import { format } from "date-fns";

// Verify this is a cron job request (add your cron secret)
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret if set
    const authHeader = request.headers.get("authorization");
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const now = new Date();
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    // Get all active and restricted numbers (to handle grace period)
    // Exclude one-time OTP numbers as they are not renewed
    const { data: numbers, error: numbersError } = await supabase
      .from("virtual_numbers")
      .select("*")
      .in("status", ["active", "restricted"])
      .eq("number_type", "subscription") // Only process subscription numbers
      .order("expires_at", { ascending: true });

    // Also get one-time OTP numbers that are older than 7 days and haven't received an OTP
    // This is a safety mechanism to auto-release numbers that haven't been used
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { data: oneTimeNumbers, error: oneTimeError } = await supabase
      .from("virtual_numbers")
      .select("*")
      .eq("number_type", "one_time_otp")
      .eq("status", "active")
      .lt("created_at", sevenDaysAgo.toISOString());

    // Process one-time numbers that need cleanup
    if (oneTimeNumbers && oneTimeNumbers.length > 0) {
      for (const oneTimeNumber of oneTimeNumbers) {
        // Check if number has received any OTP
        const { count: otpCount } = await supabase
          .from("otp_codes")
          .select("*", { count: "exact", head: true })
          .eq("number_id", oneTimeNumber.id);

        // If no OTP received, auto-release
        if (otpCount === 0) {
          try {
            const { releaseNumber } = await import("@/lib/twilio/numbers");
            await releaseNumber(oneTimeNumber.twilio_sid);

            await supabase
              .from("virtual_numbers")
              .update({ status: "cancelled" })
              .eq("id", oneTimeNumber.id);

            // Fetch user for notification
            const { data: user } = await supabase
              .from("users")
              .select("id, email")
              .eq("id", oneTimeNumber.user_id)
              .single();

            if (user) {
              await supabase.from("notifications").insert({
                user_id: oneTimeNumber.user_id,
                type: "transaction",
                title: "One-Time Number Auto-Released",
                message: `Your number ${oneTimeNumber.phone_number} has been automatically released after 7 days without receiving an OTP.`,
                data: {
                  type: "number_auto_released",
                  number: oneTimeNumber.phone_number,
                  number_id: oneTimeNumber.id,
                  reason: "no_otp_received_7_days",
                },
              });
            }

            console.log(`[Renewal] Auto-released one-time number ${oneTimeNumber.phone_number} (no OTP received)`);
          } catch (releaseError: any) {
            console.error(`[Renewal] Error auto-releasing one-time number ${oneTimeNumber.phone_number}:`, releaseError);
            // Still update status
            await supabase
              .from("virtual_numbers")
              .update({ status: "cancelled" })
              .eq("id", oneTimeNumber.id);
          }
        }
      }
    }

    if (numbersError) {
      console.error("Error fetching numbers:", numbersError);
      return NextResponse.json(
        { error: "Failed to fetch numbers" },
        { status: 500 }
      );
    }

    if (!numbers || numbers.length === 0) {
      return NextResponse.json({ message: "No numbers to process", processed: 0 });
    }

    let processed = 0;
    let remindersSent = 0;
    let renewalsProcessed = 0;
    let restrictionsApplied = 0;

    for (const number of numbers) {
      const expiresAt = new Date(number.expires_at);
      
      // Fetch user data
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, email, full_name, wallet_balance")
        .eq("id", number.user_id)
        .single();

      if (userError || !user) {
        console.error(`[Renewal] Error fetching user for number ${number.phone_number}:`, userError);
        continue;
      }

      const markupPercentage = await getPhoneNumbersMarkup();
      const monthlyCost = await getDefaultMonthlyCost(number.country_code, markupPercentage);

      // Check if number expires in 5 days (renewal reminder)
      const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (
        daysUntilExpiry <= 5 &&
        daysUntilExpiry > 0 &&
        !number.renewal_reminder_sent
      ) {
        try {
          // Send email reminder
          if (user?.email) {
            const emailHtml = getRenewalReminderEmail(
              number.phone_number,
              format(expiresAt, "MMMM d, yyyy"),
              monthlyCost
            );
            await sendEmail({
              to: user.email,
              subject: `Renewal Reminder: ${number.phone_number} expires in 5 days`,
              html: emailHtml,
            });
          }

          // Create in-app notification
          await supabase.from("notifications").insert({
            user_id: number.user_id,
            type: "billing",
            title: "Phone Number Renewal Reminder",
            message: `Your number ${number.phone_number} will expire in 5 days on ${format(expiresAt, "MMM d, yyyy")}. Please ensure sufficient balance.`,
            data: {
              type: "renewal_reminder",
              number_id: number.id,
              phone_number: number.phone_number,
              expires_at: expiresAt.toISOString(),
              monthly_cost: monthlyCost,
            },
          });

          // Mark reminder as sent
          await supabase
            .from("virtual_numbers")
            .update({ renewal_reminder_sent: true })
            .eq("id", number.id);

          remindersSent++;
          console.log(`[Renewal] Reminder sent for ${number.phone_number}`);
        } catch (error: any) {
          console.error(`[Renewal] Error sending reminder for ${number.phone_number}:`, error);
        }
      }

      // Check if number has expired and needs renewal
      if (expiresAt <= now && expiresAt > threeDaysAgo) {
        // Within grace period - try to auto-renew
        const currentBalance = parseFloat(user?.wallet_balance || "0.00");

        if (currentBalance >= monthlyCost) {
          try {
            // Auto-renew the number
            const newExpires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

            // Deduct from wallet
            const balanceAfter = currentBalance - monthlyCost;
            await supabase
              .from("users")
              .update({ wallet_balance: balanceAfter })
              .eq("id", number.user_id);

            // Create wallet transaction
            await supabase.from("wallet_transactions").insert({
              user_id: number.user_id,
              type: "withdrawal",
              amount: -monthlyCost,
              balance_before: currentBalance,
              balance_after: balanceAfter,
              description: `Automatic renewal: ${number.phone_number}`,
            });

            // Update number expiry
            await supabase
              .from("virtual_numbers")
              .update({
                expires_at: newExpires.toISOString(),
                status: "active",
                renewal_reminder_sent: false, // Reset for next cycle
              })
              .eq("id", number.id);

            // Create twilio_charges record
            await supabase.from("twilio_charges").insert({
              user_id: number.user_id,
              virtual_number_id: number.id,
              charge_type: "number_renewal",
              twilio_sid: number.twilio_sid,
              actual_cost: parseFloat(number.twilio_monthly_cost.toString()),
              user_charged: monthlyCost,
              metadata: {
                phone_number: number.phone_number,
                renewed_until: newExpires.toISOString(),
                automatic: true,
              },
            });

            // Send success email
            if (user?.email) {
              const emailHtml = getRenewalSuccessEmail(
                number.phone_number,
                format(newExpires, "MMMM d, yyyy"),
                monthlyCost
              );
              await sendEmail({
                to: user.email,
                subject: `Number Renewed: ${number.phone_number}`,
                html: emailHtml,
              });
            }

            // Create notification
            await supabase.from("notifications").insert({
              user_id: number.user_id,
              type: "billing",
              title: "Number Renewed Successfully",
              message: `Your number ${number.phone_number} has been automatically renewed until ${format(newExpires, "MMM d, yyyy")}.`,
              data: {
                type: "renewal_success",
                number_id: number.id,
                phone_number: number.phone_number,
                expires_at: newExpires.toISOString(),
                amount: monthlyCost,
              },
            });

            renewalsProcessed++;
            console.log(`[Renewal] Auto-renewed ${number.phone_number}`);
          } catch (error: any) {
            console.error(`[Renewal] Error auto-renewing ${number.phone_number}:`, error);
          }
        } else {
          // Insufficient balance - will be restricted after grace period
          console.log(`[Renewal] Insufficient balance for ${number.phone_number}, will restrict after grace period`);
        }
      }

      // Check if grace period has ended (expired more than 3 days ago)
      const daysSinceExpiry = Math.floor((now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceExpiry > 3 && number.status === "active") {
        // Restrict the number
        try {
          await supabase
            .from("virtual_numbers")
            .update({ status: "restricted" })
            .eq("id", number.id);

          // Send restriction email
          if (user?.email) {
            const emailHtml = getNumberRestrictedEmail(
              number.phone_number,
              format(expiresAt, "MMMM d, yyyy")
            );
            await sendEmail({
              to: user.email,
              subject: `Number Restricted: ${number.phone_number}`,
              html: emailHtml,
            });
          }

          // Create notification
          await supabase.from("notifications").insert({
            user_id: number.user_id,
            type: "billing",
            title: "Phone Number Restricted",
            message: `Your number ${number.phone_number} has been restricted due to non-payment. Please add funds and renew to restore service.`,
            data: {
              type: "number_restricted",
              number_id: number.id,
              phone_number: number.phone_number,
              expires_at: expiresAt.toISOString(),
            },
          });

          restrictionsApplied++;
          console.log(`[Renewal] Restricted ${number.phone_number} after grace period`);
        } catch (error: any) {
          console.error(`[Renewal] Error restricting ${number.phone_number}:`, error);
        }
      }

      processed++;
    }

    return NextResponse.json({
      message: "Renewal cron job completed",
      processed,
      remindersSent,
      renewalsProcessed,
      restrictionsApplied,
    });
  } catch (error: any) {
    console.error("Error in renewal cron job:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

