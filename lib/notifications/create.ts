/**
 * Notification creation helpers
 * Provides functions to create notifications for various events
 */

import { createServiceRoleClient } from "@/lib/supabase/service-role";

type NotificationType = 
  | "transaction" 
  | "billing";

interface NotificationData {
  [key: string]: any;
}

function formatNotificationAmount(amount: number, currency: string): string {
  if (currency === "USD") {
    const ngn = amount * 1500;
    return `₦${ngn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (currency === "NGN") {
    return `₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${currency} ${amount.toFixed(2)}`;
}

/**
 * Create a notification
 */
async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data: NotificationData = {}
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    data,
    read: false,
  });

  if (error) {
    console.error("Error creating notification:", error);
    // Don't throw - notifications are non-critical
  }
}

/**
 * Create a transaction notification
 */
export async function createTransactionNotification(
  userId: string,
  type: "payment_received" | "payment_sent" | "wallet_funded" | "order_placed",
  amount: number,
  details: {
    currency?: string;
    order_id?: string;
    payment_id?: string;
    description?: string;
  } = {}
): Promise<void> {
  const titles: Record<string, string> = {
    payment_received: "Payment Received",
    payment_sent: "Payment Sent",
    wallet_funded: "Wallet Funded",
    order_placed: "Order Placed",
  };

  const messages: Record<string, (amount: number, currency: string) => string> = {
    payment_received: (amount, currency) => `You received ${formatNotificationAmount(amount, currency)}`,
    payment_sent: (amount, currency) => `You sent ${formatNotificationAmount(amount, currency)}`,
    wallet_funded: (amount, currency) => `Your wallet was funded with ${formatNotificationAmount(amount, currency)}`,
    order_placed: (amount, currency) => `Order placed for ${formatNotificationAmount(amount, currency)}`,
  };

  const currency = details.currency || "USD";

  await createNotification(
    userId,
    "transaction",
    titles[type] || "Transaction",
    messages[type]?.(amount, currency) || `${formatNotificationAmount(amount, currency)} transaction`,
    {
      type,
      amount,
      currency: details.currency || "USD",
      ...details,
    }
  );
}


