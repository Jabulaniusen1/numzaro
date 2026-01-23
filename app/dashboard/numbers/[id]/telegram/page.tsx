"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";
import Link from "next/link";
import { ArrowLeft, Phone, Check, Copy, Send, Shield } from "lucide-react";
import { OTPDisplay } from "@/components/dashboard/OTPDisplay";
import { useOTPNotifications } from "@/lib/hooks/useOTPNotifications";

interface VirtualNumber {
  id: string;
  phone_number: string;
  country_code: string;
  country_name: string;
  status: string;
}

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

export default function TelegramGuidePage() {
  const params = useParams();
  const { toast } = useToast();
  const [number, setNumber] = useState<VirtualNumber | null>(null);
  const [otps, setOTPs] = useState<OTP[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time OTPs
  const { otps: realtimeOTPs } = useOTPNotifications(params.id as string);

  useEffect(() => {
    if (params.id) {
      fetchNumber();
      fetchOTPs();
    }
  }, [params.id]);

  // Merge real-time OTPs
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

  const fetchNumber = async () => {
    try {
      const response = await fetch(`/api/numbers/${params.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch number");
      }

      const data = await response.json();
      setNumber(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load number",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOTPs = async () => {
    try {
      const response = await fetch(`/api/numbers/${params.id}/otps?status=pending`);
      if (response.ok) {
        const data = await response.json();
        // Filter for Telegram OTPs
        const telegramOTPs = (data.otps || []).filter(
          (otp: OTP) => !otp.service_name || otp.service_name.toLowerCase().includes("telegram")
        );
        setOTPs(telegramOTPs);
      }
    } catch (error) {
      console.error("Error fetching OTPs:", error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Phone number copied to clipboard",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  if (loading || !number) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/numbers/${number.id}`}>
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 flex-wrap">
            <Send className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
            <span>Telegram Registration Guide</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">Step-by-step instructions for registering Telegram</p>
        </div>
      </div>

      {/* Phone Number Display */}
      <Card>
        <CardHeader>
          <CardTitle>Your Virtual Number</CardTitle>
          <CardDescription>Use this number to register Telegram</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3 min-w-0">
              <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-base sm:text-lg font-bold break-all">{number.phone_number}</p>
                <p className="text-sm text-muted-foreground">{number.country_name}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(number.phone_number)}
              className="self-start sm:self-auto"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Steps</CardTitle>
          <CardDescription>Follow these steps to register Telegram with your virtual number</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm sm:text-base">
                1
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Install Telegram</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Download and install Telegram from your app store or visit web.telegram.org on your computer.
                </p>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm sm:text-base">
                2
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Start Registration</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Open Telegram and tap "Start Messaging" or "Get Started". When prompted, enter your country and phone number.
                </p>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm sm:text-base">
                3
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Enter Your Virtual Number</h3>
                <p className="text-muted-foreground mb-2 text-sm sm:text-base">
                  Enter your virtual number: <code className="bg-muted px-2 py-1 rounded break-all">{number.phone_number}</code>
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Select your country from the dropdown (Telegram should auto-detect based on your number).
                </p>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm sm:text-base">
                4
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Wait for Verification Code</h3>
                <p className="text-muted-foreground mb-2 text-sm sm:text-base">
                  Telegram will send a verification code via SMS to your virtual number. This usually arrives within seconds.
                </p>
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                    💡 The verification code will automatically appear in your dashboard below once received!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm sm:text-base">
                5
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Enter Verification Code</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Copy the verification code from the dashboard below and enter it into Telegram when prompted.
                </p>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm sm:text-base">
                6
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Complete Setup</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Follow Telegram's prompts to set up your profile (name, photo). Your Telegram account is now registered with your virtual number!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending OTPs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Telegram Verification Codes
          </CardTitle>
          <CardDescription>
            Verification codes will appear here automatically when received
          </CardDescription>
        </CardHeader>
        <CardContent>
          {otps.length === 0 ? (
            <div className="py-8 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">No verification codes received yet</p>
              <p className="text-sm text-muted-foreground">
                Start the Telegram registration process and the code will appear here automatically
              </p>
            </div>
          ) : (
            <OTPDisplay
              otps={otps}
              onMarkUsed={async (otpId) => {
                try {
                  await fetch(`/api/numbers/${params.id}/otps`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ otp_id: otpId, status: "used" }),
                  });
                  fetchOTPs();
                } catch (error) {
                  console.error("Error marking OTP as used:", error);
                }
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Tips & Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Keep this page open</p>
              <p className="text-sm text-muted-foreground">
                Keep this dashboard page open while registering Telegram to see codes in real-time
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Codes are time-sensitive</p>
              <p className="text-sm text-muted-foreground">
                Telegram verification codes typically expire within 5-10 minutes. Use them as soon as they arrive!
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Request code again</p>
              <p className="text-sm text-muted-foreground">
                If you don't see a code within a minute, you can request it again in Telegram
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Privacy note</p>
              <p className="text-sm text-muted-foreground">
                Your phone number will be visible to contacts who have you in their phone book, unless you change your privacy settings in Telegram
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

