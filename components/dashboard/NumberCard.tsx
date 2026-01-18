"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Phone, MessageSquare, Shield, Calendar } from "lucide-react";
import { useCurrency } from "@/lib/hooks/use-currency";
import { format } from "date-fns";

interface NumberCardProps {
  number: {
    id: string;
    phone_number: string;
    country_code: string;
    country_name: string;
    status: string;
    monthly_cost: number;
    message_count?: number;
    pending_otp_count?: number;
    created_at: string;
    expires_at: string;
  };
}

export function NumberCard({ number }: NumberCardProps) {
  const { format: formatCurrency, loading: currencyLoading } = useCurrency();

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    suspended: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              {number.phone_number}
            </CardTitle>
            <CardDescription>{number.country_name}</CardDescription>
          </div>
          <Badge className={statusColors[number.status] || ""}>
            {number.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Monthly Cost</p>
              <p className="font-semibold">
                {formatCurrency(number.monthly_cost)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Messages</p>
              <p className="font-semibold">{number.message_count || 0}</p>
            </div>
            {number.pending_otp_count !== undefined && (
              <div>
                <p className="text-muted-foreground">Pending OTPs</p>
                <p className="font-semibold">{number.pending_otp_count}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Expires</p>
              <p className="font-semibold text-xs">
                {format(new Date(number.expires_at), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={`/dashboard/numbers/${number.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                View Details
              </Button>
            </Link>
            <Link href={`/dashboard/numbers/${number.id}/messages`} className="flex-1">
              <Button variant="outline" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}





