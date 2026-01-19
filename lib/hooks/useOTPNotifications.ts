"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "./use-toast";

interface OTPNotification {
  id: string;
  code: string;
  service_name?: string;
  number_id: string;
  created_at: string;
}

export function useOTPNotifications(numberId: string) {
  const [otps, setOTPs] = useState<OTPNotification[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to otp_codes table changes
    const channel = supabase
      .channel(`otp:${numberId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "otp_codes",
          filter: `number_id=eq.${numberId}`,
        },
        (payload) => {
          const newOTP = payload.new as OTPNotification;
          setOTPs((prev) => [newOTP, ...prev]);

          // Show browser notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`New OTP from ${newOTP.service_name || "Unknown"}`, {
              body: `Code: ${newOTP.code}`,
              icon: "/numzaro-logo.png",
            });
          }

          // Show toast notification
          toast({
            title: `New OTP from ${newOTP.service_name || "Unknown"}`,
            description: `Code: ${newOTP.code}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [numberId, toast]);

  return { otps };
}









