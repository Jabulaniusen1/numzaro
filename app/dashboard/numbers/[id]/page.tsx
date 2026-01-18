"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import Link from "next/link";
import { ArrowLeft, Phone, Loader2, MessageSquare, Shield, Calendar } from "lucide-react";
import { format } from "date-fns";

interface VirtualNumber {
  id: string;
  phone_number: string;
  country_code: string;
  country_name: string;
  status: string;
  monthly_cost: number;
  message_count?: number;
  otp_count?: number;
  created_at: string;
  expires_at: string;
  capabilities: string[];
}

export default function NumberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { format: formatCurrency } = useCurrency();
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
      router.push("/dashboard/numbers");
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
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/numbers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Phone className="h-8 w-8" />
            {number.phone_number}
          </h1>
          <p className="text-muted-foreground">{number.country_name}</p>
        </div>
        <Badge className={statusColors[number.status] || ""}>
          {number.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardDescription>Monthly Cost</CardDescription>
            <CardTitle>{formatCurrency(number.monthly_cost)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Messages</CardDescription>
            <CardTitle>{number.message_count || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>OTPs Received</CardDescription>
            <CardTitle>{number.otp_count || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Number Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Country Code</p>
              <p className="font-medium">{number.country_code}</p>
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
            <div>
              <p className="text-sm text-muted-foreground">Expires</p>
              <p className="font-medium">
                {format(new Date(number.expires_at), "MMM d, yyyy")}
              </p>
            </div>
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

      <Tabs defaultValue="messages" className="w-full">
        <TabsList>
          <TabsTrigger value="messages">
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="otps">
            <Shield className="h-4 w-4 mr-2" />
            OTPs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="messages">
          <Link href={`/dashboard/numbers/${number.id}/messages`}>
            <Card>
              <CardContent className="py-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">View all messages for this number</p>
                <Button>View Messages</Button>
              </CardContent>
            </Card>
          </Link>
        </TabsContent>
        <TabsContent value="otps">
          <Link href={`/dashboard/numbers/${number.id}/otps`}>
            <Card>
              <CardContent className="py-8 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">View all OTPs for this number</p>
                <Button>View OTPs</Button>
              </CardContent>
            </Card>
          </Link>
        </TabsContent>
      </Tabs>
    </div>
  );
}

