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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Eye, EyeOff } from "lucide-react";

function FundWalletButton({ onFunded }: { onFunded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [cryptoPending, setCryptoPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { format, currency } = useCurrency();
  // Suggested amounts in Naira
  const SUGGESTED_AMOUNTS_NGN = [5000, 10000, 20000];

  const KORA_SCRIPT_URL =
    "https://korablobstorage.blob.core.windows.net/modal-bucket/korapay-collections.min.js";

  // Dynamically ensure the Korapay inline script is loaded.
  // The SDK exposes window.Korapay with a static .initialize() method.
  const loadKoraSDK = (): Promise<any> =>
    new Promise((resolve, reject) => {
      const getSDK = () => (window as any).Korapay ?? null;

      if (getSDK()) return resolve(getSDK());

      // Script not yet loaded — inject it and wait
      const existing = document.querySelector(
        'script[src*="korapay-collections"]'
      );
      const script = (existing ?? document.createElement("script")) as HTMLScriptElement;

      const onLoad = () => {
        const sdk = getSDK();
        if (sdk) resolve(sdk);
        else reject(new Error("Korapay SDK failed to initialise after loading."));
      };

      if (existing) {
        // Script tag is present but may still be loading — poll briefly
        script.addEventListener("load", onLoad);
        const poll = setInterval(() => {
          const sdk = getSDK();
          if (sdk) { clearInterval(poll); resolve(sdk); }
        }, 100);
        setTimeout(() => clearInterval(poll), 8000);
      } else {
        script.src = KORA_SCRIPT_URL;
        script.addEventListener("load", onLoad);
        script.addEventListener("error", () =>
          reject(new Error("Failed to load Korapay SDK. Check your connection and try again."))
        );
        document.head.appendChild(script);
      }
    });

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
    setOpen(false);
    try {
      const response = await fetch("/api/wallet/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: fundAmount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to initialize payment");
      }

      const {
        reference,
        email: userEmail,
        name: userName,
        amount: payableAmount,
        currency: payableCurrency,
      } = await response.json();

      const Korapay = await loadKoraSDK();
      const publicKey = process.env.NEXT_PUBLIC_KORAPAY_PUBLIC_KEY || "";
      if (!publicKey) {
        throw new Error("Missing Korapay public key. Set NEXT_PUBLIC_KORAPAY_PUBLIC_KEY.");
      }

      const handlePaymentSuccess = async (data: any) => {
        try {
          const verifyResponse = await fetch("/api/payments/verify-popup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference: data?.reference ?? reference, type: "wallet" }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyData.status === "success") {
            toast({ title: "Payment successful!", description: "Your wallet has been funded." });
            if (onFunded) onFunded();
            setOpen(false);
          } else {
            throw new Error(verifyData.error || "Payment verification failed");
          }
        } catch (err: any) {
          toast({
            title: "Verification error",
            description: err.message || "Payment received but verification failed. Contact support.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      Korapay.initialize({
        key: publicKey,
        reference,
        amount: payableAmount ?? fundAmount,
        currency: payableCurrency ?? "NGN",
        customer: { email: userEmail, name: userName },
        // Some Korapay SDK versions use `callback`; others use `onSuccess`.
        callback: handlePaymentSuccess,
        onSuccess: handlePaymentSuccess,
        onFailed: (_data: any) => {
          toast({ title: "Payment failed", description: "Your payment was not completed.", variant: "destructive" });
          setLoading(false);
        },
        onClose: () => {
          toast({ title: "Payment cancelled", description: "You closed the payment window." });
          setLoading(false);
        },
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to fund wallet", variant: "destructive" });
      setLoading(false);
    }
  };

  const handleCryptoFund = async () => {
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
      const response = await fetch("/api/crypto/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: fundAmount }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create crypto payment");
      }

      const popup = window.open(data.invoiceUrl, "_blank", "noopener,noreferrer");
      if (!popup) {
        window.location.href = data.invoiceUrl;
        return;
      }

      setCryptoPending(true);
      toast({
        title: "Crypto invoice opened",
        description: "Complete payment in the new tab. We are checking for confirmation.",
      });

      if (data.invoiceId) {
        let confirmed = false;
        for (let i = 0; i < 30; i++) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          const verifyResponse = await fetch("/api/crypto/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ invoiceId: data.invoiceId }),
          });
          const verifyData = await verifyResponse.json();
          if (verifyData.status === "success") {
            confirmed = true;
            break;
          }
        }

        if (confirmed) {
          toast({ title: "Payment confirmed", description: "Your wallet has been funded." });
          if (onFunded) onFunded();
          setOpen(false);
        } else {
          toast({
            title: "Still pending",
            description: "Payment has not confirmed yet. Your wallet will auto-credit after confirmation.",
          });
        }
      } else {
        toast({
          title: "Awaiting confirmation",
          description: "Complete payment in the new tab. Your wallet will auto-credit once webhook confirms.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create crypto payment",
        variant: "destructive",
      });
    } finally {
      setCryptoPending(false);
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
        <Tabs defaultValue="card" className="space-y-4 py-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="card">Card/Bank</TabsTrigger>
            <TabsTrigger value="crypto">Crypto</TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="space-y-4">
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
            <Button onClick={handleFund} disabled={loading || !amount} className="w-full">
              {loading ? "Processing..." : "Proceed to Payment"}
            </Button>
          </TabsContent>

          <TabsContent value="crypto" className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="crypto-amount" className="text-sm font-medium">
                Amount (USD)
              </label>
              <Input
                id="crypto-amount"
                type="number"
                min={1}
                step="0.01"
                placeholder="Enter amount in USD"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Heleket checkout will let users choose available crypto at payment time.
            </p>
            <Button onClick={handleCryptoFund} disabled={loading || !amount} className="w-full">
              {loading ? (cryptoPending ? "Checking payment..." : "Creating Invoice...") : "Pay with Crypto"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export function BalanceCard() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);
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
      ) : hidden ? (
        <span className="text-sm font-bold text-gray-400 dark:text-gray-500 tracking-widest whitespace-nowrap">••••••</span>
      ) : (
        <span className="text-sm font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">
          {balance !== null ? format(balance) : format(0)}
        </span>
      )}
      <button
        onClick={() => setHidden((h) => !h)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        aria-label={hidden ? "Show balance" : "Hide balance"}
      >
        {hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      </button>
      <FundWalletButton onFunded={fetchBalance} />
    </div>
  );
}
