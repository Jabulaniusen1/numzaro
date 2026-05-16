import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

async function cancelWithProvider(number: any) {
  if (number.provider === "textverified" && number.textverified_id) {
    try {
      const { textverifiedClient } = await import("@/lib/textverified/client");
      if (number.number_type === "rental") {
        if (number.product_code === "nonrenewable") {
          await textverifiedClient.refundNonrenewableRental(number.textverified_id);
        } else {
          await textverifiedClient.refundRenewableRental(number.textverified_id);
        }
      } else {
        await textverifiedClient.cancelVerification(number.textverified_id);
      }
    } catch (e) {
      console.error("Textverified cancel error:", e);
    }
  }
  if (number.provider === "smspool" && number.textverified_id) {
    try {
      const { smsPoolClient } = await import("@/lib/smspool/client");
      await smsPoolClient.cancelSMS(number.textverified_id);
    } catch (e) {
      console.error("SMSPool cancel error:", e);
    }
  }
  if (number.provider === "pvadeals" && number.textverified_id) {
    try {
      const { pvadealsClient } = await import("@/lib/pvadeals/client");
      await pvadealsClient.flagNumber(number.textverified_id);
    } catch (e) {
      console.error("PVADeals flag error:", e);
    }
  }
}

async function refundNumberPurchase(virtualNumberId: string, userId: string, supabase: any): Promise<void> {
  const { data: purchase } = await supabase
    .from("number_purchases")
    .select("id, amount")
    .eq("virtual_number_id", virtualNumberId)
    .eq("status", "completed")
    .maybeSingle();

  let refundAmount: number;

  if (purchase) {
    refundAmount = parseFloat(purchase.amount);
  } else {
    // Fall back to monthly_cost on the virtual number itself — always set at purchase time
    const { data: vn } = await supabase
      .from("virtual_numbers")
      .select("monthly_cost")
      .eq("id", virtualNumberId)
      .single();

    const cost = parseFloat(vn?.monthly_cost || "0");
    if (!cost || cost <= 0) return; // nothing was charged, nothing to refund

    refundAmount = cost;
  }

  const { data: userProfile } = await supabase.from("users").select("wallet_balance").eq("id", userId).single();
  const balanceBefore = parseFloat(userProfile?.wallet_balance || "0");
  const balanceAfter = balanceBefore + refundAmount;

  await supabase.from("users").update({ wallet_balance: balanceAfter }).eq("id", userId);
  await supabase.from("wallet_transactions").insert({ user_id: userId, type: "refund", amount: refundAmount, balance_before: balanceBefore, balance_after: balanceAfter, description: "Refund for cancelled number order" });

  if (purchase) {
    await supabase.from("number_purchases").update({ status: "refunded" }).eq("id", purchase.id);
  }

  await createServiceRoleClient().from("notifications").insert({
    user_id: userId, type: "transaction", title: "Refund Issued",
    message: `Your wallet has been refunded ₦${refundAmount.toFixed(2)} for a cancelled number order.`,
    data: { type: "refund", virtual_number_id: virtualNumberId },
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { data: number, error } = await supabase.from("virtual_numbers").select("*").eq("id", id).eq("user_id", user.id).single();
    if (error || !number) return NextResponse.json({ error: "Number not found" }, { status: 404 });

    if (number.provider === "textverified" && number.textverified_id) {
      try {
        if (number.number_type === "rental") {
          const { syncTextverifiedRental } = await import("@/lib/textverified/adapter");
          const reservationType = number.product_code === "nonrenewable" ? "nonrenewable" : "renewable";
          await syncTextverifiedRental(number.id, number.textverified_id, reservationType, supabase);
        } else {
          const { syncTextverifiedVerification } = await import("@/lib/textverified/adapter");
          await syncTextverifiedVerification(number.id, number.textverified_id, supabase);
        }
      } catch (syncError) {
        console.error("Failed to sync Textverified messages:", syncError);
      }
    }

    if (number.provider === "smspool") {
      try {
        if (number.number_type === "rental" && number.rental_code) {
          const { syncSmsPoolRental } = await import("@/lib/smspool/adapter");
          await syncSmsPoolRental(number.id, number.rental_code, supabase);
        } else if (number.textverified_id) {
          const { syncSmsPoolActivation } = await import("@/lib/smspool/adapter");
          await syncSmsPoolActivation(number.id, number.textverified_id, supabase, { attempts: 8, delayMs: 1500 });
        }
      } catch (syncError) {
        console.error("Failed to sync SMSPool messages:", syncError);
      }
    }

    const { count: messageCount } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("number_id", number.id);
    const { count: otpCount } = await supabase.from("otp_codes").select("*", { count: "exact", head: true }).eq("number_id", number.id);

    return NextResponse.json({ ...number, message_count: messageCount || 0, otp_count: otpCount || 0 });
  } catch (error: any) {
    console.error("Error in GET /api/numbers/[id]:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { data: number, error: fetchError } = await supabase.from("virtual_numbers").select("*").eq("id", id).eq("user_id", user.id).single();
    if (fetchError || !number) return NextResponse.json({ error: "Number not found" }, { status: 404 });

    const normalizedStatus = String(number.status || "").toLowerCase();
    if (normalizedStatus === "cancelled" || normalizedStatus === "canceled") {
      return NextResponse.json({ error: "Number is already cancelled" }, { status: 400 });
    }

    await cancelWithProvider(number);
    await supabase.from("virtual_numbers").update({ status: "cancelled" }).eq("id", id);

    try {
      await refundNumberPurchase(id, number.user_id, supabase);
    } catch (refundError) {
      console.error("Refund error after cancellation:", refundError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/numbers/[id]:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { action } = await request.json();

    const { data: number, error: fetchError } = await supabase.from("virtual_numbers").select("*").eq("id", id).eq("user_id", user.id).single();
    if (fetchError || !number) return NextResponse.json({ error: "Number not found" }, { status: 404 });

    if (action === "sync" && (number.textverified_id || (number.provider === "smspool" && number.rental_code))) {
      if (number.provider === "textverified") {
        if (number.number_type === "rental") {
          const { syncTextverifiedRental } = await import("@/lib/textverified/adapter");
          const reservationType = number.product_code === "nonrenewable" ? "nonrenewable" : "renewable";
          await syncTextverifiedRental(number.id, number.textverified_id, reservationType, supabase);
        } else {
          const { syncTextverifiedVerification } = await import("@/lib/textverified/adapter");
          await syncTextverifiedVerification(number.id, number.textverified_id, supabase);
        }
        return NextResponse.json({ success: true });
      }
      if (number.provider === "smspool") {
        if (number.number_type === "rental" && number.rental_code) {
          const { syncSmsPoolRental } = await import("@/lib/smspool/adapter");
          await syncSmsPoolRental(number.id, number.rental_code, supabase);
        } else {
          const { syncSmsPoolActivation } = await import("@/lib/smspool/adapter");
          await syncSmsPoolActivation(number.id, number.textverified_id, supabase, { attempts: 8, delayMs: 1500 });
        }
        return NextResponse.json({ success: true });
      }
    }

    if (action === "cancel") {
      const normalizedStatus = String(number.status || "").toLowerCase();
      if (normalizedStatus === "cancelled" || normalizedStatus === "canceled") {
        return NextResponse.json({ error: "Number is already cancelled" }, { status: 400 });
      }
      await cancelWithProvider(number);
      await supabase.from("virtual_numbers").update({ status: "cancelled" }).eq("id", id);
      try {
        await refundNumberPurchase(id, number.user_id, supabase);
      } catch (refundError) {
        console.error("Refund error after cancellation:", refundError);
      }
      return NextResponse.json({ success: true });
    }

    if (action === "finish") {
      await supabase.from("virtual_numbers").update({ status: "suspended" }).eq("id", id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
