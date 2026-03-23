"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TrendingUp } from "lucide-react";

function FundWalletButton({ onFunded }: { onFunded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { format, currency } = useCurrency();
  // Suggested amounts in Naira
  const SUGGESTED_AMOUNTS_NGN = [5000, 10000, 20000];

  const handleFund = async () => {
    const fundAmount = parseFloat(amount);
    if (!fundAmount || fundAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/wallet/fund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          amount: fundAmount, // Send amount in Naira to Paystack
          currency: currency, // Send currency code (NGN) for Paystack
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to initialize payment");
      }

      const { reference, email: userEmail } = await response.json();
      
      // Convert amount to smallest currency unit for Paystack (Naira uses kobo, 100 kobo = 1 Naira)
      const amountInSmallestUnit = Math.round(fundAmount * 100);
      
      // Use Paystack popup SDK
      if (typeof window !== "undefined" && (window as any).PaystackPop) {
        const handler = (window as any).PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
          email: userEmail,
          amount: amountInSmallestUnit,
          currency: currency,
          ref: reference,
          callback: async function(response: any) {
            // Verify payment on server (using JSON endpoint to avoid redirects)
            try {
              const verifyResponse = await fetch("/api/payments/verify-popup", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  reference: response.reference,
                  type: "wallet",
                }),
              });

              if (!verifyResponse.ok) {
                const errorData = await verifyResponse.json();
                throw new Error(errorData.error || "Payment verification failed");
              }

              const verifyData = await verifyResponse.json();
              
              if (verifyData.status === "success") {
                toast({
                  title: "Payment successful!",
                  description: "Your wallet has been funded successfully.",
                });
                if (onFunded) {
                  onFunded();
                }
                setOpen(false);
              } else {
                throw new Error("Payment verification failed");
              }
            } catch (error: any) {
              toast({
                title: "Payment verification error",
                description: error.message || "Payment was successful but verification failed. Please contact support.",
                variant: "destructive",
              });
            } finally {
              setLoading(false);
            }
          },
          onClose: function() {
            toast({
              title: "Payment cancelled",
              description: "You cancelled the payment process.",
            });
            setLoading(false);
          },
        });
        handler.openIframe();
      } else {
        throw new Error("Paystack SDK not loaded. Please refresh the page.");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fund wallet",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-6 px-2 text-xs bg-violet-500 hover:bg-violet-600 text-white rounded-lg shrink-0">
          + Fund
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fund Your Wallet</DialogTitle>
          <DialogDescription>
            Add funds to your wallet to place orders. A secure payment popup will appear to complete the payment.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">
              Amount ({currency})
            </label>
            <div className="flex gap-2 mb-2">
              {SUGGESTED_AMOUNTS_NGN.map((suggestedAmount) => {
                return (
                  <Button
                    key={suggestedAmount}
                    type="button"
                    variant={amount === suggestedAmount.toFixed(2) ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setAmount(suggestedAmount.toFixed(2))}
                    disabled={loading}
                  >
                    {format(suggestedAmount)}
                  </Button>
                );
              })}
            </div>
            <Input
              id="amount"
              type="number"
              min={1}
              step="0.01"
              placeholder="Or enter custom amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button
            onClick={handleFund}
            disabled={loading || !amount}
            className="w-full"
          >
            {loading ? "Processing..." : "Proceed to Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BalanceCard() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { format } = useCurrency();

  const fetchBalance = async () => {
    try {
      const response = await fetch("/api/user/balance");
      if (response.ok) {
        const data = await response.json();
        setBalance(parseFloat(data.balance || "0"));
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    const handleRefresh = () => fetchBalance();
    window.addEventListener("wallet:refresh", handleRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("wallet:refresh", handleRefresh);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 shadow-sm">
      <TrendingUp className="h-4 w-4 text-violet-500 shrink-0" />
      {loading ? (
        <Skeleton className="h-4 w-20" />
      ) : (
        <span className="text-sm font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">
          {balance !== null ? format(balance) : format(0)}
        </span>
      )}
      <FundWalletButton onFunded={fetchBalance} />
    </div>
  );
}

