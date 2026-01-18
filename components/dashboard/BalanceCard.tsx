"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

function FundWalletButton({ onFunded }: { onFunded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { format, currency } = useCurrency();
  const MINIMUM_DEPOSIT_NGN = 2000; // Minimum deposit in Naira
  
  // Suggested amounts in Naira
  const SUGGESTED_AMOUNTS_NGN = [5000, 10000, 20000];

  const handleFund = async () => {
    const fundAmount = parseFloat(amount);
    if (!fundAmount || fundAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: `Minimum deposit is ${format(MINIMUM_DEPOSIT_NGN)}`,
        variant: "destructive",
      });
      return;
    }

    if (fundAmount < MINIMUM_DEPOSIT_NGN) {
      toast({
        title: "Minimum deposit required",
        description: `You must deposit at least ${format(MINIMUM_DEPOSIT_NGN)}`,
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

      const { access_code, reference, email: userEmail } = await response.json();
      
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
        <Button className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white rounded-cartoon border-2 border-white font-bold shadow-lg" variant="default">
          💵 Fund Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="border-4 border-purple-400 dark:border-purple-600 rounded-cartoon bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-pink-950 dark:via-purple-950 dark:to-blue-950">
        <DialogHeader>
          <DialogTitle className="text-purple-900 dark:text-purple-100 text-2xl">💵 Fund Your Wallet</DialogTitle>
          <DialogDescription className="text-purple-800 dark:text-purple-200 font-semibold">
            Add funds to your wallet to place orders. A secure payment popup will appear to complete the payment.
            <br />
            <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
              Minimum deposit: {format(MINIMUM_DEPOSIT_NGN)}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-bold text-purple-900 dark:text-purple-100">
              Amount ({currency})
            </label>
            <div className="flex gap-2 mb-2">
              {SUGGESTED_AMOUNTS_NGN.map((suggestedAmount) => {
                return (
                  <Button
                    key={suggestedAmount}
                    type="button"
                    variant={amount === suggestedAmount.toFixed(2) ? "default" : "outline"}
                    className={`flex-1 rounded-cartoon font-bold ${
                      amount === suggestedAmount.toFixed(2)
                        ? "bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white border-2 border-white"
                        : "border-2 border-purple-400 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900"
                    }`}
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
              min={MINIMUM_DEPOSIT_NGN}
              step="0.01"
              placeholder={`Or enter custom amount (min ${format(MINIMUM_DEPOSIT_NGN)})`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border-4 border-purple-400 dark:border-purple-600 rounded-cartoon bg-white dark:bg-purple-900/50 text-purple-900 dark:text-purple-100 font-semibold"
            />
            <p className="text-xs text-purple-700 dark:text-purple-300 font-bold">
              Minimum deposit: {format(MINIMUM_DEPOSIT_NGN)}
            </p>
          </div>
          <Button
            onClick={handleFund}
            disabled={loading || !amount}
            className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white rounded-cartoon border-2 border-white font-bold shadow-lg"
          >
            {loading ? "⏳ Processing..." : "💳 Proceed to Payment"}
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
      const response = await fetch("/api/balance");
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
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    // Listen for custom event to refresh balance
    const handleRefresh = () => fetchBalance();
    window.addEventListener("wallet:refresh", handleRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("wallet:refresh", handleRefresh);
    };
  }, []);

  return (
    <Card className="border-4 border-yellow-400 dark:border-yellow-600 bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 dark:from-yellow-900/50 dark:via-pink-900/50 dark:to-purple-900/50 rounded-cartoon shadow-2xl">
      <CardHeader>
        <CardTitle className="text-purple-900 dark:text-purple-100 text-2xl">💰 Account Balance</CardTitle>
        <CardDescription className="text-purple-700 dark:text-purple-300 font-semibold">Your current account balance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <Skeleton className="h-9 w-48 bg-purple-200 dark:bg-purple-800 rounded-cartoon" />
        ) : (
          <p className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent drop-shadow-lg">
            {balance !== null ? format(balance) : format(0)}
          </p>
        )}
        <FundWalletButton onFunded={fetchBalance} />
      </CardContent>
    </Card>
  );
}

