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
  const { format, convert, currency, rate } = useCurrency();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (open && number) {
      fetchWalletBalance();
    }
  }, [open, number, currency]);

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
      router.push("/dashboard/numbers/my-numbers");
    } catch (error: any) {
      const errorMessage = error.message || "An error occurred";
      
      // Check if it's a bundle requirement error
      const isBundleError = errorMessage.includes("Bundle") || errorMessage.includes("bundle");
      
      toast({
        title: isBundleError ? "Bundle Required" : "Purchase Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 8000, // Show longer for bundle errors
      });
    } finally {
      setLoading(false);
    }
  };

  if (!number) return null;

  // Balance from API is always in NGN, convert to selected currency
  const balanceInSelectedCurrency = walletBalance !== null 
    ? (currency === "USD" ? walletBalance / rate : walletBalance)
    : null;
  
  // Convert monthly cost (USD) to selected currency for comparison
  const monthlyCostInSelectedCurrency = convert(number.monthly_cost);
  const hasEnoughBalance = balanceInSelectedCurrency !== null && balanceInSelectedCurrency >= monthlyCostInSelectedCurrency;

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
            <p className="text-sm text-muted-foreground">Monthly Fee</p>
            <p className="text-2xl font-bold">
              {format(convert(number.monthly_cost))} {currency}
            </p>
            {currency === "NGN" && (
              <p className="text-xs text-muted-foreground mt-1">
                ≈ ${number.monthly_cost.toFixed(2)} USD
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Additional charges apply per SMS received
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Wallet Balance</p>
            <p className="text-lg">
              {balanceInSelectedCurrency === null
                ? "Loading..."
                : format(balanceInSelectedCurrency)}
            </p>
          </div>

          {balanceInSelectedCurrency !== null && !hasEnoughBalance && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              Insufficient balance. You need {format(monthlyCostInSelectedCurrency)} but have{" "}
              {format(balanceInSelectedCurrency)}
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





