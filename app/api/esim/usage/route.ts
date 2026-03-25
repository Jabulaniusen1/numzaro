import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { esimAccessClient, ESimAccessClient } from "@/lib/esimaccess/client";

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const esimTranNo = String(body?.esimTranNo || "").trim();
    const orderId = String(body?.orderId || "").trim();

    if (!esimTranNo && !orderId) {
      return NextResponse.json({ error: "esimTranNo or orderId is required" }, { status: 400 });
    }

    let tranNo = esimTranNo;

    // Look up esimTranNo from DB if orderId provided
    if (!tranNo && orderId) {
      const { data: order } = await supabase
        .from("esim_orders")
        .select("esim_tran_no, user_id")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single();

      if (!order?.esim_tran_no) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      tranNo = order.esim_tran_no;
    }

    const result = await esimAccessClient.checkUsage([tranNo]);
    const usageItem = result.esimUsageList?.[0];

    if (!usageItem) {
      return NextResponse.json({ error: "No usage data returned" }, { status: 404 });
    }

    return NextResponse.json({
      usage: {
        esimTranNo: usageItem.esimTranNo,
        dataUsedBytes: usageItem.dataUsage,
        totalDataBytes: usageItem.totalData,
        dataUsedFormatted: ESimAccessClient.formatBytes(usageItem.dataUsage),
        totalDataFormatted: ESimAccessClient.formatBytes(usageItem.totalData),
        remainingBytes: usageItem.totalData - usageItem.dataUsage,
        remainingFormatted: ESimAccessClient.formatBytes(usageItem.totalData - usageItem.dataUsage),
        percentUsed: usageItem.totalData > 0
          ? parseFloat(((usageItem.dataUsage / usageItem.totalData) * 100).toFixed(1))
          : 0,
        lastUpdateTime: usageItem.lastUpdateTime,
      },
    });
  } catch (error: any) {
    console.error("[esim/usage] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
