"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import Link from "next/link";
import { ArrowLeft, Phone, Loader2, MessageSquare, Shield } from "lucide-react";
import { format } from "date-fns";
import { NumberActions } from "@/components/dashboard/NumberActions";

interface VirtualNumber {
  id: string;
  phone_number: string;
  country_code: string;
  country_name: string;
  status: string;
  monthly_cost: number | null;
  message_count?: number;
  otp_count?: number;
  created_at: string;
  expires_at: string | null;
  capabilities: string[];
  number_type?: string;
}

export default function NumberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { format: formatCurrency, convert } = useCurrency();
  const [number, setNumber] = useState<VirtualNumber | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchNumber();
    }
  }, [params.id]);

  const fetchNumber = async () => {
    setLoading(true);
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
      router.push("/dashboard/numbers/my-numbers");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!number) {
    return null;
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    suspended: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    restricted: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  };

  // Extract country code from phone number (e.g., +972 from +972535633758)
  const extractCountryCode = (phoneNumber: string): string => {
    if (!phoneNumber) return "";
    // Remove any spaces and get the part after +
    const cleaned = phoneNumber.replace(/\s+/g, "");
    if (cleaned.startsWith("+")) {
      // Try to extract country code (1-3 digits after +)
      // Common patterns: +1 (US/CA), +44 (UK), +972 (IL), etc.
      const match = cleaned.match(/^\+(\d{1,3})/);
      if (match) {
        return `+${match[1]}`;
      }
    }
    return "";
  };

  const phoneCountryCode = extractCountryCode(number.phone_number);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/dashboard/numbers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 flex-wrap">
            <Phone className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
            <span className="break-all">{number.phone_number}</span>
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-muted-foreground">{number.country_name}</p>
            {phoneCountryCode && (
              <>
                <span className="text-muted-foreground">•</span>
                <p className="text-muted-foreground font-mono">{phoneCountryCode}</p>
              </>
            )}
          </div>
        </div>
        <div className="">
          <Badge className={statusColors[number.status] || "self-start sm:self-auto"}>
            {number.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {number.number_type !== "one_time_otp" && number.monthly_cost !== null && (
          <Card>
            <CardHeader>
              <CardDescription>Monthly Fee</CardDescription>
              <CardTitle>{formatCurrency(convert(number.monthly_cost))}</CardTitle>
            </CardHeader>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardDescription>Total Messages</CardDescription>
            <CardTitle>{number.message_count || 0}</CardTitle>
          </CardHeader>
        </Card>
        {/* <Card>
          <CardHeader>
            <CardDescription>OTPs Received</CardDescription>
            <CardTitle>{number.otp_count || 0}</CardTitle>
          </CardHeader>
        </Card> */}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <CardTitle>Number Details</CardTitle>
            <NumberActions
              numberId={number.id}
              phoneNumber={number.phone_number}
              status={number.status}
              monthlyCost={number.monthly_cost || 0}
              expiresAt={number.expires_at || undefined}
              numberType={number.number_type}
              onRenewed={fetchNumber}
              onReleased={() => router.push("/dashboard/numbers")}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Country</p>
              <p className="font-medium">{number.country_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Country Code</p>
              <p className="font-medium font-mono">{phoneCountryCode || number.country_code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={statusColors[number.status] || ""}>
                {number.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Purchased</p>
              <p className="font-medium">
                {format(new Date(number.created_at), "MMM d, yyyy")}
              </p>
            </div>
            {number.number_type !== "one_time_otp" && number.expires_at && (
              <div>
                <p className="text-sm text-muted-foreground">Expires</p>
                <p className="font-medium">
                  {format(new Date(number.expires_at), "MMM d, yyyy")}
                </p>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Capabilities</p>
            <div className="flex gap-2">
              {number.capabilities?.map((cap) => (
                <Badge key={cap} variant="outline">
                  {cap.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href={`/dashboard/numbers/${number.id}/messages`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="py-6 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Messages</h3>
                <p className="text-sm text-muted-foreground mb-4">View all messages for this number</p>
                <Button className="w-full">View Messages</Button>
              </CardContent>
            </Card>
          </Link>
          <Link href={`/dashboard/numbers/${number.id}/otps`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="py-6 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">OTPs</h3>
                <p className="text-sm text-muted-foreground mb-4">View all OTPs for this number</p>
                <Button className="w-full">View OTPs</Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Integration Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href={`/dashboard/numbers/${number.id}/whatsapp`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    WhatsApp Guide
                  </CardTitle>
                  <CardDescription>Step-by-step instructions for WhatsApp registration</CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href={`/dashboard/numbers/${number.id}/telegram`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Telegram Guide
                  </CardTitle>
                  <CardDescription>Step-by-step instructions for Telegram registration</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
