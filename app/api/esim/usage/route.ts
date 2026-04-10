import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/supabase/server";
import { smsPoolClient } from "@/lib/smspool/client";

function parseDataAmountToBytes(value?: string | null): number {
  if (!value) return 0;
  const cleaned = String(value).trim().toUpperCase();
  const match = cleaned.match(/([\d.]+)\s*(B|KB|MB|GB|TB)/);
  if (!match) return 0;
  const amount = parseFloat(match[1]);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  const unit = match[2];
  const mul =
    unit === "TB" ? 1024 ** 4 :
    unit === "GB" ? 1024 ** 3 :
    unit === "MB" ? 1024 ** 2 :
    unit === "KB" ? 1024 :
    1;
  return Math.round(amount * mul);
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${Math.max(0, bytes)} B`;
}

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

    const profile = await smsPoolClient.getEsimProfile(tranNo);

    let totalBytes = parseDataAmountToBytes(profile.totalData || null);
    let remainingBytes = parseDataAmountToBytes(profile.remainingData || null);

    if (totalBytes <= 0) {
      const history = await smsPoolClient.getEsimHistory({ start: 0, length: 50, search: tranNo }).catch(() => null);
      const item = history?.data?.find((h) => h.transactionId === tranNo);
      if (item && Number(item.dataInGb) > 0) {
        totalBytes = Math.round(Number(item.dataInGb) * 1024 * 1024 * 1024);
      }
    }

    if (totalBytes <= 0 && remainingBytes <= 0) {
      return NextResponse.json({ error: "No usage data returned" }, { status: 404 });
    }

    if (remainingBytes > totalBytes && totalBytes > 0) {
      remainingBytes = totalBytes;
    }

    const usedBytes = totalBytes > 0 ? Math.max(0, totalBytes - remainingBytes) : 0;
    const percentUsed = totalBytes > 0
      ? parseFloat(((usedBytes / totalBytes) * 100).toFixed(1))
      : 0;

    return NextResponse.json({
      usage: {
        esimTranNo: tranNo,
        dataUsedBytes: usedBytes,
        totalDataBytes: totalBytes,
        dataUsedFormatted: formatBytes(usedBytes),
        totalDataFormatted: formatBytes(totalBytes),
        remainingBytes,
        remainingFormatted: formatBytes(remainingBytes),
        percentUsed,
        lastUpdateTime: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[esim/usage] error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
