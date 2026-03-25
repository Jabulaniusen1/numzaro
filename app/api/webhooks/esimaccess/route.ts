import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

// eSIM Access webhook IP whitelist
const ALLOWED_IPS = new Set([
  "3.1.131.226",
  "54.254.74.88",
  "18.136.190.97",
  "18.136.60.197",
  "18.136.19.137",
]);

function mapEsimStatusToLocal(esimStatus: string): string {
  switch (esimStatus?.toUpperCase()) {
    case "GOT_RESOURCE": return "got_resource";
    case "IN_USE":       return "in_use";
    case "USED_UP":      return "used_up";
    case "USED_EXPIRED": return "used_expired";
    case "UNUSED_EXPIRED": return "unused_expired";
    case "CANCEL":       return "cancelled";
    case "REVOKED":      return "cancelled";
    default:             return "got_resource";
  }
}

export async function POST(request: NextRequest) {
  try {
    // Optional IP whitelist check (set ESIMACCESS_ENFORCE_IP_WHITELIST=true to enable)
    if (process.env.ESIMACCESS_ENFORCE_IP_WHITELIST === "true") {
      const forwarded = request.headers.get("x-forwarded-for");
      const clientIp = forwarded ? forwarded.split(",")[0].trim() : "";
      if (!ALLOWED_IPS.has(clientIp)) {
        console.warn("[webhook/esimaccess] rejected request from IP:", clientIp);
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await request.json();
    const { notifyType, content } = body;

    console.log("[webhook/esimaccess] received:", notifyType, JSON.stringify(content));

    // Health check ping
    if (notifyType === "CHECK_HEALTH") {
      return NextResponse.json({ success: true });
    }

    const supabase = createServiceRoleClient();

    if (notifyType === "ORDER_STATUS") {
      // Triggered when eSIM is ready (orderStatus = GOT_RESOURCE)
      const { orderNo, orderStatus } = content || {};
      if (!orderNo) return NextResponse.json({ success: true });

      await supabase
        .from("esim_orders")
        .update({ esim_status: orderStatus, status: mapEsimStatusToLocal(orderStatus), updated_at: new Date().toISOString() })
        .eq("order_no", orderNo);
    }

    else if (notifyType === "ESIM_STATUS") {
      // Triggered on lifecycle changes: IN_USE, CANCEL, REVOKED, etc.
      const { esimTranNo, orderNo, iccid, esimStatus, smdpStatus } = content || {};

      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (esimStatus) {
        updateData.esim_status = esimStatus;
        updateData.status = mapEsimStatusToLocal(esimStatus);
      }
      if (smdpStatus) updateData.smdp_status = smdpStatus;
      if (iccid)      updateData.iccid = iccid;

      if (esimTranNo) {
        const { data: order } = await supabase
          .from("esim_orders")
          .update(updateData)
          .eq("esim_tran_no", esimTranNo)
          .select("id, user_id, package_name, status")
          .single();

        // Notify user if status changed to something notable
        if (order && ["in_use", "used_up", "cancelled"].includes(updateData.status)) {
          const messages: Record<string, string> = {
            in_use:    "Your eSIM is now active and in use.",
            used_up:   "Your eSIM data has been fully consumed.",
            cancelled: "Your eSIM has been cancelled.",
          };
          const msg = messages[updateData.status];
          if (msg) {
            await supabase.from("notifications").insert({
              user_id: order.user_id,
              type: "transaction",
              title: "eSIM Status Update",
              message: `${order.package_name}: ${msg}`,
              data: { type: "esim_status_update", esim_order_id: order.id, status: updateData.status },
            });
          }
        }
      } else if (orderNo) {
        await supabase
          .from("esim_orders")
          .update(updateData)
          .eq("order_no", orderNo);
      }
    }

    else if (notifyType === "SMDP_EVENT") {
      // SM-DP+ server lifecycle events
      const { esimTranNo, iccid, esimStatus, smdpStatus } = content || {};
      if (!esimTranNo) return NextResponse.json({ success: true });

      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (esimStatus) updateData.esim_status = esimStatus;
      if (smdpStatus) updateData.smdp_status = smdpStatus;
      if (iccid)      updateData.iccid = iccid;

      await supabase
        .from("esim_orders")
        .update(updateData)
        .eq("esim_tran_no", esimTranNo);
    }

    else if (notifyType === "DATA_USAGE") {
      // Low-data usage alerts (50%, 80%, 90%)
      const { esimTranNo, orderNo, remainThreshold, remain, totalVolume } = content || {};

      const thresholdLabels: Record<string, string> = {
        "0.5": "50%",
        "0.2": "20%",
        "0.1": "10%",
      };
      const label = thresholdLabels[String(remainThreshold)] ?? `${(remainThreshold * 100).toFixed(0)}%`;

      const { data: order } = await supabase
        .from("esim_orders")
        .select("id, user_id, package_name")
        .eq(esimTranNo ? "esim_tran_no" : "order_no", esimTranNo || orderNo)
        .single();

      if (order) {
        await supabase.from("notifications").insert({
          user_id: order.user_id,
          type: "transaction",
          title: "eSIM Low Data Alert",
          message: `${order.package_name}: Only ${label} of your data remaining.`,
          data: { type: "esim_data_usage", esim_order_id: order.id, remainThreshold },
        });
      }
    }

    else if (notifyType === "VALIDITY_USAGE") {
      // 1 day remaining expiry alert
      const { esimTranNo, orderNo, expiredTime } = content || {};

      const { data: order } = await supabase
        .from("esim_orders")
        .select("id, user_id, package_name")
        .eq(esimTranNo ? "esim_tran_no" : "order_no", esimTranNo || orderNo)
        .single();

      if (order) {
        await supabase.from("notifications").insert({
          user_id: order.user_id,
          type: "transaction",
          title: "eSIM Expiring Soon",
          message: `${order.package_name} expires in 1 day.`,
          data: { type: "esim_expiring", esim_order_id: order.id, expiredTime },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[webhook/esimaccess] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
