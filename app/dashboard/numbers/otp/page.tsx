"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Phone, MessageSquare, ArrowLeft } from "lucide-react";
import { NumberStatusBadge } from "@/components/dashboard/NumberStatusBadge";

interface OTPNumber {
  id: string;
  number: string;
  country: string;
  status: "active" | "released" | "expired";
  created_at: string;
}

interface OTPSession {
  id: string;
  service_name: string | null;
  sms_message: string | null;
  used: boolean;
  created_at: string;
}

interface OTPNumberWithSession extends OTPNumber {
  session: OTPSession | null;
}

export default function OTPNumbersPage() {
  const [otpNumbers, setOtpNumbers] = useState<OTPNumberWithSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOTPNumbers();
  }, []);

  const fetchOTPNumbers = async () => {
    try {
      // Fetch all OTP numbers
      const response = await fetch("/api/numbers?type=otp");
      if (response.ok) {
        const data = await response.json();
        const numbers: OTPNumber[] = data.numbers || [];

        // Fetch session for each number
        const numbersWithSessions = await Promise.all(
          numbers.map(async (number) => {
            try {
              const sessionResponse = await fetch(
                `/api/numbers/otp/${number.id}`
              );
              if (sessionResponse.ok) {
                const sessionData = await sessionResponse.json();
                return {
                  ...number,
                  session: sessionData.session,
                };
              }
            } catch (error) {
              console.error(`Error fetching session for ${number.id}:`, error);
            }
            return {
              ...number,
              session: null,
            };
          })
        );

        setOtpNumbers(numbersWithSessions);
      }
    } catch (error) {
      console.error("Error fetching OTP numbers:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-600">Loading OTP numbers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">OTP Numbers</h1>
          <p className="text-gray-600 mt-2">
            One-time verification numbers
          </p>
        </div>
        <Link href="/dashboard/numbers/buy">
          <Button>Buy OTP Number</Button>
        </Link>
      </div>

      <Link href="/dashboard/numbers">
        <Button variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Numbers
        </Button>
      </Link>

      {otpNumbers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {otpNumbers.map((number) => (
            <Card key={number.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    <CardTitle>{number.number}</CardTitle>
                  </div>
                  <NumberStatusBadge status={number.status} />
                </div>
                <CardDescription>{number.country}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium">
                    {new Date(number.created_at).toLocaleDateString()}
                  </p>
                </div>

                {number.session && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <Badge variant={number.session.used ? "default" : "outline"}>
                        {number.session.used ? "Used" : "Waiting"}
                      </Badge>
                    </div>
                    {number.session.sms_message && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">OTP Message:</p>
                        <p className="text-sm font-mono bg-white p-2 rounded border">
                          {number.session.sms_message}
                        </p>
                      </div>
                    )}
                    {number.session.service_name && (
                      <p className="text-xs text-gray-500 mt-2">
                        Service: {number.session.service_name}
                      </p>
                    )}
                  </div>
                )}

                {!number.session && number.status === "active" && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                    <p className="text-sm text-gray-600">
                      Waiting for OTP message...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600 mb-4">
              No OTP numbers yet.{" "}
              <Link
                href="/dashboard/numbers/buy"
                className="text-[#1877F2] hover:underline"
              >
                Buy an OTP number
              </Link>{" "}
              to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

