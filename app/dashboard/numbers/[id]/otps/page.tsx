"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OTPDisplay } from "@/components/dashboard/OTPDisplay";
import { useToast } from "@/lib/hooks/use-toast";
import { useOTPNotifications } from "@/lib/hooks/useOTPNotifications";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";

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
  const [refreshing, setRefreshing] = useState(false);
  const inFlightRef = useRef(false);

  // Real-time OTPs
  const { otps: realtimeOTPs } = useOTPNotifications(params.id as string);

  const fetchOTPs = useCallback(
    async (silent = false) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        // Backend re-syncs with the provider on every call and polls
        // briefly, so repeated calls pick up codes that arrive late.
        const response = await fetch(`/api/numbers/${params.id}/otps`);
        if (!response.ok) {
          throw new Error("Failed to fetch OTPs");
        }

        const data = await response.json();
        setOTPs(data.otps || []);
      } catch (error: any) {
        if (!silent) {
          toast({
            title: "Error",
            description: error.message || "Failed to load OTPs",
            variant: "destructive",
          });
        }
      } finally {
        if (silent) setRefreshing(false);
        else setLoading(false);
        inFlightRef.current = false;
      }
    },
    [params.id, toast]
  );

  useEffect(() => {
    if (params.id) {
      fetchOTPs(false);
      // Auto-refresh while the user waits for a verification code.
      const interval = setInterval(() => {
        fetchOTPs(true);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [params.id, fetchOTPs]);

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
      fetchOTPs(true);

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
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">OTPs</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            All OTP codes received for this number{refreshing ? " • checking for new codes…" : ""}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchOTPs(true)}
          disabled={refreshing || loading}
        >
          {refreshing || loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Check again
        </Button>
      </div>

      <OTPDisplay otps={otps} loading={loading} onMarkUsed={handleMarkUsed} />
    </div>
  );
}

