"use client";

import { useEffect, useState } from "react";
import { NumberCard } from "@/components/dashboard/NumberCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";

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

export default function NumbersPage() {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchNumbers();
  }, [filterType, filterStatus]);

  const fetchNumbers = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType) params.append("type", filterType);
      if (filterStatus) params.append("status", filterStatus);

      const response = await fetch(`/api/numbers?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setNumbers(data.numbers || []);
      }
    } catch (error) {
      console.error("Error fetching numbers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (id: string) => {
    if (!confirm("Are you sure you want to release this number?")) {
      return;
    }

    try {
      const response = await fetch(`/api/numbers/${id}/release`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Number released successfully",
        });
        fetchNumbers();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to release number");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to release number",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-600">Loading numbers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Virtual Numbers</h1>
          <p className="text-gray-600 mt-2">
            Manage your virtual phone numbers
          </p>
        </div>
        <Link href="/dashboard/numbers/buy">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Buy Number
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="">All Types</option>
          <option value="long_term">Long-term</option>
          <option value="business">Business</option>
          <option value="otp">OTP</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="released">Released</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {numbers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {numbers.map((number) => (
            <NumberCard
              key={number.id}
              number={number}
              onRelease={handleRelease}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600 mb-4">
              No numbers yet.{" "}
              <Link
                href="/dashboard/numbers/buy"
                className="text-[#1877F2] hover:underline"
              >
                Buy a number
              </Link>{" "}
              to get started.
            </p>
            <Link href="/dashboard/numbers/otp">
              <Button variant="outline">View OTP Numbers</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

