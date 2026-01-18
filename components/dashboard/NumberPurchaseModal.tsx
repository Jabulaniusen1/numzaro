"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { useRouter } from "next/navigation";

interface NumberPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  number: {
    phoneNumber: string;
    countryCode: string;
    monthly_cost: number;
  } | null;
  onSuccess?: () => void;
}

export function NumberPurchaseModal({
  open,
  onOpenChange,
  number,
  onSuccess,
}: NumberPurchaseModalProps) {
  const { toast } = useToast();
  const { format, loading: currencyLoading } = useCurrency();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (open && number) {
      fetchWalletBalance();
    }
  }, [open, number]);

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch("/api/balance");
      if (response.ok) {
        const data = await response.json();
        setWalletBalance(parseFloat(data.balance || "0"));
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    }
  };

  const handlePurchase = async () => {
    if (!number) return;

    setLoading(true);
    try {
      const response = await fetch("/api/numbers/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: number.phoneNumber,
          countryCode: number.countryCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to purchase number");
      }

      toast({
        title: "Number Purchased",
        description: `Successfully purchased ${number.phoneNumber}`,
      });

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
      router.push("/dashboard/numbers");
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!number) return null;

  const hasEnoughBalance = walletBalance !== null && walletBalance >= number.monthly_cost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Purchase Virtual Number</DialogTitle>
          <DialogDescription>
            Confirm purchase of this virtual number
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground">Phone Number</p>
            <p className="text-lg font-semibold">{number.phoneNumber}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Monthly Cost</p>
            <p className="text-2xl font-bold">
              {format(number.monthly_cost)}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Wallet Balance</p>
            <p className="text-lg">
              {walletBalance === null
                ? "Loading..."
                : false
                ? "Loading..."
                : format(walletBalance)}
            </p>
          </div>

          {walletBalance !== null && !hasEnoughBalance && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              Insufficient balance. You need {format(number.monthly_cost)} but have{" "}
              {format(walletBalance)}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={loading || !hasEnoughBalance}
          >
            {loading ? "Processing..." : "Purchase"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}





