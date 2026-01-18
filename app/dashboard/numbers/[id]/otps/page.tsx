"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OTPDisplay } from "@/components/dashboard/OTPDisplay";
import { useToast } from "@/lib/hooks/use-toast";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

interface OTP {
  id: string;
  code: string;
  service_name?: string;
  sender_number?: string;
  status: "pending" | "used" | "expired";
  created_at: string;
  expires_at: string;
  used_at?: string;
}

export default function NumberOTPsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [otps, setOTPs] = useState<OTP[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time OTPs
  const { otps: realtimeOTPs } = useOTPNotifications(params.id as string);

  useEffect(() => {
    if (params.id) {
      fetchOTPs();
    }
  }, [params.id]);

  // Merge real-time OTPs with fetched OTPs
  useEffect(() => {
    if (realtimeOTPs.length > 0) {
      setOTPs((prev) => {
        const existingIds = new Set(prev.map((o) => o.id));
        const newOTPs = realtimeOTPs
          .map((otp) => ({
            id: otp.id,
            code: otp.code,
            service_name: otp.service_name || undefined,
            sender_number: undefined,
            status: "pending" as const,
            created_at: otp.created_at,
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          }))
          .filter((o) => !existingIds.has(o.id));
        return [...newOTPs, ...prev];
      });
    }
  }, [realtimeOTPs]);

  const fetchOTPs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/numbers/${params.id}/otps`);
      if (!response.ok) {
        throw new Error("Failed to fetch OTPs");
      }

      const data = await response.json();
      setOTPs(data.otps || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load OTPs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkUsed = async (otpId: string) => {
    try {
      const response = await fetch(`/api/numbers/${params.id}/otps`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          otp_id: otpId,
          status: "used",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update OTP");
      }

      // Refresh OTPs
      fetchOTPs();

      toast({
        title: "Success",
        description: "OTP marked as used",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update OTP",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/numbers/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">OTPs</h1>
          <p className="text-muted-foreground">All OTP codes received for this number</p>
        </div>
      </div>

      <OTPDisplay otps={otps} loading={loading} onMarkUsed={handleMarkUsed} />
    </div>
  );
}

