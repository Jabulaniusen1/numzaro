"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const { format, convert, currency, rate, loading: currencyLoading } = useCurrency();
  const MINIMUM_DEPOSIT_USD = 2.0;
  
  // Calculate minimum deposit in local currency
  const minimumDepositLocal = currencyLoading ? MINIMUM_DEPOSIT_USD : convert(MINIMUM_DEPOSIT_USD);
  
  // Suggested amounts in USD, will be converted to local currency for display
  const SUGGESTED_AMOUNTS_USD = [5, 10, 20];

  const handleFund = async () => {
    const fundAmountLocal = parseFloat(amount);
    if (!fundAmountLocal || fundAmountLocal <= 0) {
      toast({
        title: "Invalid amount",
        description: `Minimum deposit is ${currencyLoading ? "$2.00" : format(MINIMUM_DEPOSIT_USD)}`,
        variant: "destructive",
      });
      return;
    }

    // Convert local amount to USD for validation
    // convert() converts USD to local: local = usd * rate
    // So to reverse: usd = local / rate
    const fundAmountUSD = currencyLoading ? fundAmountLocal : fundAmountLocal / rate;

    if (fundAmountUSD < MINIMUM_DEPOSIT_USD) {
      toast({
        title: "Minimum deposit required",
        description: `You must deposit at least ${currencyLoading ? "$2.00" : format(MINIMUM_DEPOSIT_USD)}`,
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
          amount: fundAmountLocal, // Send local currency amount to Paystack
          currency: currency, // Send currency code for Paystack
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to initialize payment");
      }

      const { access_code, reference, email: userEmail } = await response.json();
      
      // Convert amount to smallest currency unit for Paystack
      const amountInSmallestUnit = Math.round(fundAmountLocal * 100);
      
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
        <Button className="w-full" variant="default">
          Fund Wallet
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fund Your Wallet</DialogTitle>
          <DialogDescription>
            Add funds to your wallet to place orders. A secure payment popup will appear to complete the payment.
            <br />
            <span className="text-sm font-medium text-gray-700">
              Minimum deposit: {currencyLoading ? "$2.00" : format(MINIMUM_DEPOSIT_USD)}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">
              Amount ({currency})
            </label>
            <div className="flex gap-2 mb-2">
              {SUGGESTED_AMOUNTS_USD.map((suggestedAmountUSD) => {
                const suggestedAmountLocal = currencyLoading ? suggestedAmountUSD : convert(suggestedAmountUSD);
                return (
                  <Button
                    key={suggestedAmountUSD}
                    type="button"
                    variant={amount === suggestedAmountLocal.toFixed(2) ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setAmount(suggestedAmountLocal.toFixed(2))}
                    disabled={loading || currencyLoading}
                  >
                    {currencyLoading ? `$${suggestedAmountUSD}` : format(suggestedAmountUSD)}
                  </Button>
                );
              })}
            </div>
            <Input
              id="amount"
              type="number"
              min={minimumDepositLocal}
              step="0.01"
              placeholder={currencyLoading ? "Loading..." : `Or enter custom amount (min ${format(MINIMUM_DEPOSIT_USD)})`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={currencyLoading}
            />
            <p className="text-xs text-gray-500">
              Minimum deposit: {currencyLoading ? "$2.00" : format(MINIMUM_DEPOSIT_USD)}
            </p>
          </div>
          <Button
            onClick={handleFund}
            disabled={loading || !amount || currencyLoading}
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
  const { format, loading: currencyLoading } = useCurrency();

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
    <Card>
      <CardHeader>
        <CardTitle>Account Balance</CardTitle>
        <CardDescription>Your current account balance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading || currencyLoading ? (
          <p className="text-2xl font-bold">Loading...</p>
        ) : (
          <p className="text-3xl font-bold text-[#1877F2]">
            {balance !== null ? format(balance) : format(0)}
          </p>
        )}
        <FundWalletButton onFunded={fetchBalance} />
      </CardContent>
    </Card>
  );
}

