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
  const [numberType, setNumberType] = useState<"subscription" | "one_time_otp">("subscription");
  const [oneTimePrice, setOneTimePrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  useEffect(() => {
    if (open && number) {
      fetchWalletBalance();
      fetchOneTimePrice();
    }
  }, [open, number, currency, numberType]);

  const fetchOneTimePrice = async () => {
    if (!number) return;
    setLoadingPrice(true);
    try {
      const response = await fetch(
        `/api/numbers/one-time-price?monthlyCost=${number.monthly_cost}`
      );
      if (response.ok) {
        const data = await response.json();
        setOneTimePrice(data.price);
      }
    } catch (error) {
      console.error("Error fetching one-time price:", error);
    } finally {
      setLoadingPrice(false);
    }
  };

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
          numberType: numberType,
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
  
  // Calculate actual cost based on number type
  const actualCost = numberType === "one_time_otp" 
    ? (oneTimePrice || 0)
    : number.monthly_cost;
  
  // Convert cost (USD) to selected currency for comparison
  const costInSelectedCurrency = convert(actualCost);
  const hasEnoughBalance = balanceInSelectedCurrency !== null && balanceInSelectedCurrency >= costInSelectedCurrency;

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
            <p className="text-sm text-muted-foreground mb-3">Number Type</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNumberType("subscription")}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  numberType === "subscription"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <p className="font-medium">Subscription</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Monthly recurring
                </p>
              </button>
              <button
                type="button"
                onClick={() => setNumberType("one_time_otp")}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  numberType === "one_time_otp"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <p className="font-medium">One-Time OTP</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-released after OTP
                </p>
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              {numberType === "one_time_otp" ? "One-Time Price" : "Monthly Fee"}
            </p>
            {numberType === "one_time_otp" && loadingPrice ? (
              <p className="text-2xl font-bold">Loading...</p>
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {format(costInSelectedCurrency)} {currency}
                </p>
                {currency === "NGN" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ≈ ${actualCost.toFixed(2)} USD
                  </p>
                )}
                {numberType === "subscription" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Additional charges apply per SMS received
                  </p>
                )}
                {numberType === "one_time_otp" && (
                  <p className="text-xs text-muted-foreground mt-1 text-amber-600 dark:text-amber-400">
                    Number will be released automatically after first OTP is received
                  </p>
                )}
              </>
            )}
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
              Insufficient balance. You need {format(costInSelectedCurrency)} but have{" "}
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
            disabled={loading || loadingPrice || !hasEnoughBalance || (numberType === "one_time_otp" && oneTimePrice === null)}
          >
            {loading ? "Processing..." : "Purchase"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}





