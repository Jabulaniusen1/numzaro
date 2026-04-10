
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const { data: number, error } = await supabase
      .from("virtual_numbers")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !number) {
      return NextResponse.json({ error: "Number not found" }, { status: 404 });
    }

    // Sync messages from SMSPVA
    if (number.provider === "smspva" && number.textverified_id) {
      try {
        const { syncSmspvaMessages } = await import("@/lib/smspva/adapter");
        await syncSmspvaMessages(
          number.id,
          number.textverified_id,
          number.product_code ?? number.product ?? "opt1",
          number.country_code,
          supabase
        );
      } catch (syncError) {
        console.error("Failed to sync SMSPVA messages:", syncError);
      }
    }

    // Sync messages from Textverified
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

    // Sync messages from SMSPool
    if (number.provider === "smspool") {
      try {
        if (number.number_type === "rental" && number.rental_code) {
          const { syncSmsPoolRental } = await import("@/lib/smspool/adapter");
          await syncSmsPoolRental(number.id, number.rental_code, supabase);
        } else if (number.textverified_id) {
          const { syncSmsPoolActivation } = await import("@/lib/smspool/adapter");
          await syncSmsPoolActivation(number.id, number.textverified_id, supabase);
        }
      } catch (syncError) {
        console.error("Failed to sync SMSPool messages:", syncError);
      }
    }

    // Sync messages from Platfone
    if (number.provider === "platfone" && number.textverified_id) {
      try {
        const { syncPlatfoneActivation } = await import("@/lib/platfone/adapter");
        await syncPlatfoneActivation(number.id, number.textverified_id, supabase, number.user_id.replace(/-/g, ""));
      } catch (syncError) {
        console.error("Failed to sync Platfone messages:", syncError);
      }
    }

    const { count: messageCount } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("number_id", number.id);

    const { count: otpCount } = await supabase
      .from("otp_codes")
      .select("*", { count: "exact", head: true })
      .eq("number_id", number.id);

    return NextResponse.json({
      ...number,
      message_count: messageCount || 0,
      otp_count: otpCount || 0,
    });
  } catch (error: any) {
    console.error("Error in GET /api/numbers/[id]:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const { data: number, error: fetchError } = await supabase
      .from("virtual_numbers")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !number) {
      return NextResponse.json({ error: "Number not found" }, { status: 404 });
    }

    if (number.status === "cancelled") {
      return NextResponse.json({ error: "Number is already cancelled" }, { status: 400 });
    }

    if (number.provider === "smspva" && number.textverified_id) {
      try {
        const { smspvaClient } = await import("@/lib/smspva/client");
        await smspvaClient.cancel(
          number.textverified_id,
          number.product_code ?? number.product,
          number.country_code
        );
      } catch (e) {
        console.error("SMSPVA cancel error:", e);
      }
    }

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

    if (number.provider === "platfone" && number.textverified_id) {
      try {
        const { platfoneClient } = await import("@/lib/platfone/client");
        await platfoneClient.cancelActivation(number.user_id.replace(/-/g, ""), number.textverified_id);
      } catch (e) {
        console.error("Platfone cancel error:", e);
      }
    }

    await supabase
      .from("virtual_numbers")
      .update({ status: "cancelled" })
      .eq("id", id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/numbers/[id]:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { action } = await request.json();

    const { data: number, error: fetchError } = await supabase
      .from("virtual_numbers")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !number) {
      return NextResponse.json({ error: "Number not found" }, { status: 404 });
    }

    if (action === "sync" && (number.textverified_id || (number.provider === "smspool" && number.rental_code))) {
      if (number.provider === "smspva") {
        const { syncSmspvaMessages } = await import("@/lib/smspva/adapter");
        await syncSmspvaMessages(
          number.id,
          number.textverified_id,
          number.product_code ?? number.product ?? "opt1",
          number.country_code,
          supabase
        );
        return NextResponse.json({ success: true });
      }
      if (number.provider === "textverified") {
        if (number.number_type === "rental") {
          const { syncTextverifiedRental } = await import("@/lib/textverified/adapter");
          const reservationType = number.product_code === "nonrenewable" ? "nonrenewable" : "renewable";
          await syncTextverifiedRental(number.id, number.textverified_id, reservationType, supabase);
          return NextResponse.json({ success: true });
        }
        const { syncTextverifiedVerification } = await import("@/lib/textverified/adapter");
        await syncTextverifiedVerification(number.id, number.textverified_id, supabase);
        return NextResponse.json({ success: true });
      }
      if (number.provider === "smspool") {
        if (number.number_type === "rental" && number.rental_code) {
          const { syncSmsPoolRental } = await import("@/lib/smspool/adapter");
          await syncSmsPoolRental(number.id, number.rental_code, supabase);
          return NextResponse.json({ success: true });
        }
        const { syncSmsPoolActivation } = await import("@/lib/smspool/adapter");
        await syncSmsPoolActivation(number.id, number.textverified_id, supabase);
        return NextResponse.json({ success: true });
      }
      if (number.provider === "platfone" && number.textverified_id) {
        const { syncPlatfoneActivation } = await import("@/lib/platfone/adapter");
        await syncPlatfoneActivation(number.id, number.textverified_id, supabase, number.user_id.replace(/-/g, ""));
        return NextResponse.json({ success: true });
      }
    }

    if (action === "cancel") {
      if (number.provider === "smspva" && number.textverified_id) {
        try {
          const { smspvaClient } = await import("@/lib/smspva/client");
          await smspvaClient.cancel(
            number.textverified_id,
            number.product_code ?? number.product,
            number.country_code
          );
        } catch (e) {
          console.error("SMSPVA cancel error:", e);
        }
      }
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
      if (number.provider === "platfone" && number.textverified_id) {
        try {
          const { platfoneClient } = await import("@/lib/platfone/client");
          await platfoneClient.cancelActivation(number.user_id.replace(/-/g, ""), number.textverified_id);
        } catch (e) {
          console.error("Platfone cancel error:", e);
        }
      }
      await supabase
        .from("virtual_numbers")
        .update({ status: "CANCELLED" })
        .eq("id", id);
      return NextResponse.json({ success: true });
    }

    if (action === "finish") {
      await supabase
        .from("virtual_numbers")
        .update({ status: "FINISHED" })
        .eq("id", id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
