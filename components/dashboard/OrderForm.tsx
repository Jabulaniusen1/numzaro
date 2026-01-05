"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";

interface Service {
  id: number;
  service_id: number;
  name: string;
  rate: number;
  min_quantity: number;
  max_quantity: number;
}

interface OrderFormProps {
  service: Service;
  onSuccess?: () => void;
}

export function OrderForm({ service, onSuccess }: OrderFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { format, loading: currencyLoading } = useCurrency();
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState(service.min_quantity ?? 100);
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [checkingBalance, setCheckingBalance] = useState(true);

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch("/api/balance");
      if (response.ok) {
        const data = await response.json();
        setWalletBalance(parseFloat(data.balance || "0"));
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    } finally {
      setCheckingBalance(false);
    }
  };

  const calculateCharge = () => {
    const rate = parseFloat(service.rate.toString());
    return (rate * quantity) / 1000;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const minQty = service.min_quantity ?? 100;
      const maxQty = service.max_quantity ?? 10000;
      
      // Validate quantity
      if (quantity < minQty || quantity > maxQty) {
        toast({
          title: "Invalid quantity",
          description: `Quantity must be between ${minQty.toLocaleString()} and ${maxQty.toLocaleString()}`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validate link
      if (!link || link.trim() === "") {
        toast({
          title: "Link required",
          description: "Please enter a valid social media link",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const charge = calculateCharge();

      // Check wallet balance
      if (walletBalance === null) {
        await fetchWalletBalance();
      }

      if (walletBalance !== null && walletBalance < charge) {
        toast({
          title: "Insufficient wallet balance",
          description: `You need $${charge.toFixed(2)} but only have $${walletBalance.toFixed(2)}. Please fund your wallet first.`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create order (deducts from wallet)
      const orderResponse = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id: service.service_id, // Use API service_id, not database id
          link: link.trim(),
          quantity: quantity,
        }),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        // Show detailed error message if available
        const errorMessage = error.details || error.error || "Failed to create order";
        throw new Error(errorMessage);
      }

      const { order } = await orderResponse.json();

      toast({
        title: "Order created successfully",
        description: "Your order has been placed and will be processed shortly.",
      });

      // Refresh wallet balance
      await fetchWalletBalance();

      // Reset form
      setLink("");
      setQuantity(service.min_quantity ?? 100);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="link">Social Media Link</Label>
        <Input
          id="link"
          type="url"
          placeholder="https://instagram.com/yourprofile"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">
          Quantity ({(service.min_quantity ?? 100).toLocaleString()} -{" "}
          {(service.max_quantity ?? 10000).toLocaleString()})
        </Label>
        <Input
          id="quantity"
          type="number"
          min={service.min_quantity ?? 100}
          max={service.max_quantity ?? 10000}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
          required
        />
      </div>

      <div className="p-4 bg-gray-50 rounded-lg space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Rate:</span>
          <span className="font-medium">
            {currencyLoading ? "Loading..." : format(parseFloat(service.rate.toString()))} per 1000
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Quantity:</span>
          <span className="font-medium">{quantity.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="font-semibold">Total:</span>
          <span className="text-xl font-bold text-[#1877F2]">
            {currencyLoading ? "Loading..." : format(calculateCharge())}
          </span>
        </div>
        {!checkingBalance && walletBalance !== null && (
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm text-gray-600">Wallet Balance:</span>
            <span className={`font-medium ${walletBalance < calculateCharge() ? "text-red-600" : "text-green-600"}`}>
              {currencyLoading ? "Loading..." : format(walletBalance)}
            </span>
          </div>
        )}
        {!checkingBalance && walletBalance !== null && walletBalance < calculateCharge() && (
          <p className="text-sm text-red-600 mt-2">
            Insufficient balance. Please fund your wallet first.
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading || checkingBalance}>
        {loading ? "Processing..." : "Place Order"}
      </Button>
    </form>
  );
}

