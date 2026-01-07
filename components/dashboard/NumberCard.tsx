"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NumberTypeBadge } from "./NumberTypeBadge";
import { NumberStatusBadge } from "./NumberStatusBadge";
import { useCurrency } from "@/lib/hooks/use-currency";
import Link from "next/link";
import { Phone, MessageSquare, Trash2, Settings } from "lucide-react";

interface PhoneNumber {
  id: string;
  number: string;
  country: string;
  type: "long_term" | "otp" | "business";
  capabilities: string;
  status: "active" | "released" | "expired";
  monthly_cost: number | null;
  renewal_date: string | null;
  created_at: string;
}

interface NumberCardProps {
  number: PhoneNumber;
  onRelease?: (id: string) => void;
}

export function NumberCard({ number, onRelease }: NumberCardProps) {
  const { format } = useCurrency();

  const getBorderColor = (status: string) => {
    switch (status) {
      case "active":
        return "border-green-300";
      case "released":
        return "border-gray-300";
      case "expired":
        return "border-red-300";
      default:
        return "border-gray-300";
    }
  };

  return (
    <Card className={getBorderColor(number.status)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              {number.number}
            </CardTitle>
            <CardDescription>{number.country}</CardDescription>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <NumberStatusBadge status={number.status} />
            <NumberTypeBadge type={number.type} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Capabilities</p>
            <p className="font-medium capitalize">{number.capabilities}</p>
          </div>
          {number.monthly_cost !== null && (
            <div>
              <p className="text-gray-600">Monthly Cost</p>
              <p className="font-medium">{format(number.monthly_cost)}</p>
            </div>
          )}
          {number.renewal_date && (
            <div>
              <p className="text-gray-600">Renewal Date</p>
              <p className="font-medium">
                {new Date(number.renewal_date).toLocaleDateString()}
              </p>
            </div>
          )}
          <div>
            <p className="text-gray-600">Created</p>
            <p className="font-medium">
              {new Date(number.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Link href={`/dashboard/numbers/${number.id}`}>
            <Button variant="outline" size="sm" className="flex-1">
              <Settings className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </Link>
          {number.type !== "otp" && number.status === "active" && (
            <Link href={`/dashboard/numbers/${number.id}`}>
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </Link>
          )}
          {number.status === "active" && onRelease && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRelease(number.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

