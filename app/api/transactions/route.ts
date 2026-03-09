import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all transaction types
    const [walletTransactions, twilioCharges, numberPurchases, payments] = await Promise.all([
      // Wallet transactions
      supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      
      // Twilio charges
      supabase
        .from("twilio_charges")
        .select(`
          *,
          virtual_numbers(phone_number)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      
      // Number purchases
      supabase
        .from("number_purchases")
        .select(`
          *,
          virtual_numbers(phone_number)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      
      // Payments (wallet funding)
      supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    // Combine all transactions into a unified array
    const transactions: any[] = [];

    // Add wallet transactions
    if (walletTransactions.data) {
      walletTransactions.data.forEach((tx) => {
        transactions.push({
          id: tx.id,
          type: "wallet",
          transaction_type: tx.type,
          amount: parseFloat(tx.amount.toString()),
          balance_before: parseFloat(tx.balance_before.toString()),
          balance_after: parseFloat(tx.balance_after.toString()),
          description: tx.description,
          created_at: tx.created_at,
          metadata: {
            payment_id: tx.payment_id,
            order_id: tx.order_id,
          },
        });
      });
    }

    // Add Twilio charges
    if (twilioCharges.data) {
      twilioCharges.data.forEach((charge) => {
        const phoneNumber = (charge.virtual_numbers as any)?.phone_number || null;
        transactions.push({
          id: charge.id,
          type: "twilio_charge",
          transaction_type: charge.charge_type,
          amount: -parseFloat(charge.user_charged.toString()), // Negative for charges
          actual_cost: parseFloat(charge.actual_cost.toString()),
          user_charged: parseFloat(charge.user_charged.toString()),
          description: getTwilioChargeDescription(charge.charge_type, phoneNumber, charge.metadata),
          created_at: charge.created_at,
          metadata: {
            virtual_number_id: charge.virtual_number_id,
            phone_number: phoneNumber,
            twilio_sid: charge.twilio_sid,
            ...charge.metadata,
          },
        });
      });
    }

    // Add number purchases
    if (numberPurchases.data) {
      numberPurchases.data.forEach((purchase) => {
        const phoneNumber = (purchase.virtual_numbers as any)?.phone_number || null;
        transactions.push({
          id: purchase.id,
          type: "number_purchase",
          transaction_type: "number_purchase",
          amount: -parseFloat(purchase.amount.toString()), // Negative for purchases
          description: `Phone number purchase: ${phoneNumber || "Unknown"}`,
          created_at: purchase.created_at,
          metadata: {
            virtual_number_id: purchase.virtual_number_id,
            phone_number: phoneNumber,
            status: purchase.status,
          },
        });
      });
    }

    // Add payments (wallet funding)
    if (payments.data) {
      payments.data.forEach((payment) => {
        transactions.push({
          id: payment.id,
          type: "payment",
          transaction_type: payment.status === "Success" ? "deposit" : "payment_failed",
          amount: parseFloat(payment.amount.toString()),
          description: `Wallet funding via ${payment.payment_provider}`,
          created_at: payment.created_at,
          metadata: {
            payment_provider: payment.payment_provider,
            provider_transaction_id: payment.provider_transaction_id,
            status: payment.status,
            currency: payment.currency,
          },
        });
      });
    }

    // Sort all transactions by created_at (newest first)
    transactions.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

function getTwilioChargeDescription(
  chargeType: string,
  phoneNumber: string | null,
  metadata: any
): string {
  const phone = phoneNumber || metadata?.phone_number || "Unknown number";
  
  switch (chargeType) {
    case "incoming_sms":
      return `Incoming SMS to ${phone}`;
    case "incoming_sms_failed":
      return `Incoming SMS to ${phone} (charge failed)`;
    case "otp_received":
      const service = metadata?.service || "Unknown";
      const code = metadata?.otp_code || "";
      return `OTP received from ${service}${code ? ` - ${code}` : ""} (${phone})`;
    case "otp_received_failed":
      return `OTP received (charge failed) - ${phone}`;
    case "number_purchase":
      return `Phone number purchase: ${phone}`;
    case "number_renewal":
      return `Phone number renewal: ${phone}`;
    default:
      return `Twilio charge: ${chargeType} - ${phone}`;
  }
}




