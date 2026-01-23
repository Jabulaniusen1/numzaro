"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Shield, Copy, Check } from "lucide-react";
import { useState } from "react";

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

interface OTPDisplayProps {
  otps: OTP[];
  loading?: boolean;
  onMarkUsed?: (otpId: string) => void;
}

export function OTPDisplay({ otps, loading, onMarkUsed }: OTPDisplayProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    used: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    expired: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (otps.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No OTPs received yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {otps.map((otp) => (
        <Card key={otp.id}>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={statusColors[otp.status] || ""}>
                      {otp.status}
                    </Badge>
                    {otp.service_name && (
                      <Badge variant="outline">{otp.service_name}</Badge>
                    )}
                  </div>
                  {otp.sender_number && (
                    <p className="text-sm text-muted-foreground mb-1">
                      From: {otp.sender_number}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mb-2">
                    {format(new Date(otp.created_at), "MMM d, yyyy HH:mm")}
                  </p>
                </div>
              </div>
              <div className="bg-muted rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">OTP Code</p>
                  <p className="font-mono font-bold text-xl sm:text-2xl break-all">{otp.code}</p>
                  {otp.status === "pending" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Expires: {format(new Date(otp.expires_at), "MMM d, yyyy HH:mm")}
                    </p>
                  )}
                  {otp.used_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Used: {format(new Date(otp.used_at), "MMM d, yyyy HH:mm")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 self-start sm:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(otp.code, otp.id)}
                  >
                    {copiedId === otp.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  {otp.status === "pending" && onMarkUsed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMarkUsed(otp.id)}
                    >
                      <span className="hidden sm:inline">Mark Used</span>
                      <span className="sm:hidden">Used</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}











