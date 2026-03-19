import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { smsPoolClient } from "@/lib/smspool/client";
import { textverifiedClient } from "@/lib/textverified/client";

const RENEWAL_DAYS = 30;
const REMINDER_DAYS_BEFORE = 3; // warn user 3 days before expiry
const GRACE_DAYS = 2;           // try to renew up to 2 days after expiry before cancelling

export async function runRenewals() {
  const supabase = createServiceRoleClient();
  const now = new Date();

  // Find all active SMSPool rental numbers that expire within GRACE_DAYS + REMINDER_DAYS_BEFORE window
  const windowEnd = new Date(now.getTime() + REMINDER_DAYS_BEFORE * 24 * 60 * 60 * 1000);
  const graceCutoff = new Date(now.getTime() - GRACE_DAYS * 24 * 60 * 60 * 1000);

  const { data: numbers, error } = await supabase
    .from("virtual_numbers")
    .select("*, users(id, email, wallet_balance)")
    .eq("provider", "smspool")
    .eq("number_type", "rental")
    .in("status", ["active", "restricted"])
    .gt("expires_at", graceCutoff.toISOString()) // not past grace period
    .lt("expires_at", windowEnd.toISOString())   // expiring within reminder window
    .order("expires_at", { ascending: true });

  if (error) {
    console.error("[Renewals] DB error:", error);
    return { error: "DB error" };
  }

  if (!numbers || numbers.length === 0) {
    return { message: "No renewals due", renewed: 0, reminded: 0, cancelled: 0, total: 0 };
  }

  let renewed = 0;
  let reminded = 0;
  let cancelled = 0;

  for (const number of numbers) {
    const user = (number as any).users;
    if (!user) continue;

    const expiresAt = new Date(number.expires_at);
    const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = expiresAt <= now;
    const monthlyCharge = parseFloat(number.monthly_cost ?? number.twilio_monthly_cost ?? "0");
    const userBalance = parseFloat(user.wallet_balance ?? "0");

    // ── Send reminder (still active, not yet expired) ─────────────────────
    if (!isExpired && daysUntilExpiry <= REMINDER_DAYS_BEFORE && !number.renewal_reminder_sent) {
      await supabase.from("notifications").insert({
        user_id: number.user_id,
        type: "billing",
        title: "Number Renewal Reminder",
        message: `Your number ${number.phone_number} renews in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}. We will auto-charge $${monthlyCharge.toFixed(2)} from your wallet.`,
        data: {
          type: "renewal_reminder",
          number_id: number.id,
          phone_number: number.phone_number,
          expires_at: expiresAt.toISOString(),
          monthly_cost: monthlyCharge,
        },
      });

      await supabase
        .from("virtual_numbers")
        .update({ renewal_reminder_sent: true })
        .eq("id", number.id);

      reminded++;
      console.log(`[Renewals] Reminder sent for ${number.phone_number} (expires in ${daysUntilExpiry}d)`);
    }

    // ── Auto-renew (expired or expiring today) ────────────────────────────
    if (isExpired || daysUntilExpiry <= 0) {
      if (!number.rental_code) {
        console.error(`[Renewals] No rental_code for ${number.phone_number}, cannot renew`);
        continue;
      }

      if (userBalance < monthlyCharge) {
        // Insufficient balance — cancel after grace period if still not paid
        console.log(`[Renewals] Insufficient balance for ${number.phone_number} ($${userBalance} < $${monthlyCharge})`);

        // Notify user of failed renewal
        await supabase.from("notifications").insert({
          user_id: number.user_id,
          type: "billing",
          title: "Renewal Failed — Insufficient Balance",
          message: `Could not renew ${number.phone_number}. Balance $${userBalance.toFixed(2)} is less than required $${monthlyCharge.toFixed(2)}. Top up to keep your number.`,
          data: {
            type: "renewal_failed",
            number_id: number.id,
            phone_number: number.phone_number,
            required: monthlyCharge,
            available: userBalance,
          },
        });

        // Cancel if past grace period
        const daysSinceExpiry = Math.floor((now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceExpiry >= GRACE_DAYS) {
          await supabase
            .from("virtual_numbers")
            .update({ status: "cancelled" })
            .eq("id", number.id);

          await supabase.from("notifications").insert({
            user_id: number.user_id,
            type: "billing",
            title: "Number Cancelled",
            message: `${number.phone_number} has been cancelled after ${GRACE_DAYS}-day grace period due to insufficient balance.`,
            data: { type: "number_cancelled", number_id: number.id, phone_number: number.phone_number },
          });

          cancelled++;
          console.log(`[Renewals] Cancelled ${number.phone_number} — no balance after grace period`);
        }
        continue;
      }

      // Sufficient balance — charge wallet and extend SMSPool rental
      try {
        const result = await smsPoolClient.extendRental(number.rental_code, RENEWAL_DAYS);

        if (!result.success) {
          console.error(`[Renewals] extendRental failed for ${number.phone_number}:`, result.message);
          continue;
        }

        const newExpiry = new Date(now.getTime() + RENEWAL_DAYS * 24 * 60 * 60 * 1000);
        const balanceAfter = userBalance - monthlyCharge;

        // Deduct wallet
        await supabase
          .from("users")
          .update({ wallet_balance: balanceAfter })
          .eq("id", number.user_id);

        // Wallet transaction record
        await supabase.from("wallet_transactions").insert({
          user_id: number.user_id,
          type: "order_payment",
          amount: -monthlyCharge,
          balance_before: userBalance,
          balance_after: balanceAfter,
          description: `Auto-renewal: ${number.phone_number} (${RENEWAL_DAYS} days)`,
        });

        // Update number expiry
        await supabase
          .from("virtual_numbers")
          .update({
            expires_at: newExpiry.toISOString(),
            status: "active",
            renewal_reminder_sent: false,
          })
          .eq("id", number.id);

        // Success notification
        await supabase.from("notifications").insert({
          user_id: number.user_id,
          type: "billing",
          title: "Number Renewed",
          message: `${number.phone_number} has been renewed for ${RENEWAL_DAYS} days. $${monthlyCharge.toFixed(2)} charged. New expiry: ${newExpiry.toLocaleDateString()}.`,
          data: {
            type: "renewal_success",
            number_id: number.id,
            phone_number: number.phone_number,
            expires_at: newExpiry.toISOString(),
            amount: monthlyCharge,
          },
        });

        renewed++;
        console.log(`[Renewals] Renewed ${number.phone_number} until ${newExpiry.toISOString()}`);
      } catch (err: any) {
        console.error(`[Renewals] Error renewing ${number.phone_number}:`, err.message);
      }
    }
  }

  const smspoolResult = {
    message: "SMSPool renewal cron completed",
    renewed,
    reminded,
    cancelled,
    total: numbers.length,
  };

  const textverifiedResult = await runTextverifiedRenewals();

  return {
    message: "Renewal cron completed",
    smspool: smspoolResult,
    textverified: textverifiedResult,
  };
}

export async function runTextverifiedRenewals() {
  const supabase = createServiceRoleClient();
  const now = new Date();

  const windowEnd = new Date(now.getTime() + REMINDER_DAYS_BEFORE * 24 * 60 * 60 * 1000);
  const graceCutoff = new Date(now.getTime() - GRACE_DAYS * 24 * 60 * 60 * 1000);

  const { data: numbers, error } = await supabase
    .from("virtual_numbers")
    .select("*, users(id, email, wallet_balance)")
    .eq("provider", "textverified")
    .eq("number_type", "rental")
    .in("status", ["active", "restricted"])
    .gt("expires_at", graceCutoff.toISOString())
    .lt("expires_at", windowEnd.toISOString())
    .order("expires_at", { ascending: true });

  if (error) {
    console.error("[Renewals][textverified] DB error:", error);
    return { error: "DB error" };
  }

  if (!numbers || numbers.length === 0) {
    return { message: "No renewals due", renewed: 0, reminded: 0, cancelled: 0, total: 0 };
  }

  let renewed = 0;
  let reminded = 0;
  let cancelled = 0;

  for (const number of numbers) {
    const user = (number as any).users;
    if (!user) continue;

    const expiresAt = number.expires_at ? new Date(number.expires_at) : null;
    if (!expiresAt) continue;

    const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = expiresAt <= now;
    const rentalType = number.product_code === "nonrenewable" ? "nonrenewable" : "renewable";
    const monthlyCharge = parseFloat(number.monthly_cost ?? number.twilio_monthly_cost ?? "0");
    const userBalance = parseFloat(user.wallet_balance ?? "0");

    if (!isExpired && daysUntilExpiry <= REMINDER_DAYS_BEFORE && !number.renewal_reminder_sent) {
      await supabase.from("notifications").insert({
        user_id: number.user_id,
        type: "billing",
        title: "Rental Expiry Reminder",
        message: `Your rental ${number.phone_number} expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}.`,
        data: {
          type: "renewal_reminder",
          number_id: number.id,
          phone_number: number.phone_number,
          expires_at: expiresAt.toISOString(),
          monthly_cost: monthlyCharge,
        },
      });

      await supabase
        .from("virtual_numbers")
        .update({ renewal_reminder_sent: true })
        .eq("id", number.id);

      reminded++;
    }

    if (rentalType !== "renewable") {
      if (isExpired) {
        await supabase
          .from("virtual_numbers")
          .update({ status: "cancelled" })
          .eq("id", number.id);

        await supabase.from("notifications").insert({
          user_id: number.user_id,
          type: "billing",
          title: "Rental Expired",
          message: `${number.phone_number} has expired.`,
          data: { type: "rental_expired", number_id: number.id, phone_number: number.phone_number },
        });

        cancelled++;
      }
      continue;
    }

    if (!isExpired && daysUntilExpiry > 0) continue;

    if (!number.textverified_id) {
      console.error(`[Renewals][textverified] Missing reservation id for ${number.phone_number}`);
      continue;
    }

    if (!number.rental_code) {
      console.error(`[Renewals][textverified] Missing billingCycleId for ${number.phone_number}`);
      continue;
    }

    if (userBalance < monthlyCharge) {
      await supabase.from("notifications").insert({
        user_id: number.user_id,
        type: "billing",
        title: "Renewal Failed — Insufficient Balance",
        message: `Could not renew ${number.phone_number}. Balance $${userBalance.toFixed(2)} is less than required $${monthlyCharge.toFixed(2)}.`,
        data: {
          type: "renewal_failed",
          number_id: number.id,
          phone_number: number.phone_number,
          required: monthlyCharge,
          available: userBalance,
        },
      });

      const daysSinceExpiry = Math.floor((now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceExpiry >= GRACE_DAYS) {
        await supabase
          .from("virtual_numbers")
          .update({ status: "cancelled" })
          .eq("id", number.id);

        await supabase.from("notifications").insert({
          user_id: number.user_id,
          type: "billing",
          title: "Rental Cancelled",
          message: `${number.phone_number} has been cancelled after ${GRACE_DAYS}-day grace period due to insufficient balance.`,
          data: { type: "number_cancelled", number_id: number.id, phone_number: number.phone_number },
        });

        cancelled++;
      }
      continue;
    }

    try {
      if (isExpired) {
        await textverifiedClient.renewOverdueRental(number.textverified_id);
      } else {
        await textverifiedClient.renewBillingCycle(number.rental_code);
      }

      const rental = await textverifiedClient.getRenewableRental(number.textverified_id);
      const newExpiry = rental?.endsAt ? new Date(rental.endsAt) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const balanceAfter = userBalance - monthlyCharge;

      await supabase
        .from("users")
        .update({ wallet_balance: balanceAfter })
        .eq("id", number.user_id);

      await supabase.from("wallet_transactions").insert({
        user_id: number.user_id,
        type: "order_payment",
        amount: -monthlyCharge,
        balance_before: userBalance,
        balance_after: balanceAfter,
        description: `Auto-renewal: ${number.phone_number}`,
      });

      await supabase
        .from("virtual_numbers")
        .update({
          expires_at: newExpiry.toISOString(),
          status: "active",
          renewal_reminder_sent: false,
        })
        .eq("id", number.id);

      await supabase.from("notifications").insert({
        user_id: number.user_id,
        type: "billing",
        title: "Rental Renewed",
        message: `${number.phone_number} has been renewed. $${monthlyCharge.toFixed(2)} charged.`,
        data: {
          type: "renewal_success",
          number_id: number.id,
          phone_number: number.phone_number,
          expires_at: newExpiry.toISOString(),
          amount: monthlyCharge,
        },
      });

      renewed++;
    } catch (err: any) {
      console.error(`[Renewals][textverified] Error renewing ${number.phone_number}:`, err?.message || err);
    }
  }

  return {
    message: "Textverified renewal cron completed",
    renewed,
    reminded,
    cancelled,
    total: numbers.length,
  };
}
