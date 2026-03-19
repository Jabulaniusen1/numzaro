"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { Loader2 } from "lucide-react";

interface Service {
  id: number;
  service_id: number;
  name: string;
  category: string;
  type: string;
  rate: number;
  min_quantity: number;
  max_quantity: number;
  refill_allowed: boolean;
  cancel_allowed: boolean;
}

interface OrderFormProps {
  service: Service;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OrderForm({ service, onSuccess, onCancel }: OrderFormProps) {
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState<string>(String(service.min_quantity || 100));
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const { toast } = useToast();
  const { format, convert } = useCurrency();

  // Check if service is comment-related
  const isCommentService = () => {
    const name = (service.name || "").toLowerCase();
    const type = (service.type || "").toLowerCase();
    const category = (service.category || "").toLowerCase();
    return name.includes("comment") || type.includes("comment") || category.includes("comment");
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await fetch("/api/balance");
      if (response.ok) {
        const data = await response.json();
        setBalance(parseFloat(data.balance || "0"));
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const getQuantityNumber = () => {
    const num = parseInt(quantity, 10);
    return isNaN(num) ? 0 : num;
  };

  const calculateCharge = () => {
    const qty = getQuantityNumber();
    if (!qty || qty <= 0) return 0;
    // Rate is per 1000, so calculate: (quantity / 1000) * rate
    return (qty / 1000) * (service.rate || 0);
  };

  const charge = calculateCharge();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!link.trim()) {
      toast({
        title: "Link required",
        description: "Please enter a valid link",
        variant: "destructive",
      });
      return;
    }

    const qty = getQuantityNumber();
    if (!quantity.trim() || qty < service.min_quantity || qty > service.max_quantity) {
      toast({
        title: "Invalid quantity",
        description: `Quantity must be between ${service.min_quantity.toLocaleString()} and ${service.max_quantity.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    if (charge > balance) {
      toast({
        title: "Insufficient balance",
        description: `You need ${format(convert(charge))} but only have ${format(convert(balance))}. Please fund your wallet.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id: service.id,
          link: link.trim(),
          quantity: Math.floor(qty),
          ...(comments.trim() && { comments: comments.trim() }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      toast({
        title: "Order created successfully!",
        description: `Your order for ${service.name} has been placed.`,
      });

      // Trigger balance update event
      window.dispatchEvent(new CustomEvent("balanceUpdated"));

      // Reset form
      setLink("");
      setQuantity(String(service.min_quantity || 100));
      setComments("");

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast({
        title: "Order failed",
        description: error.message || "Failed to create order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">{service.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {service.category} • {service.type}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="link">Link</Label>
        <Input
          id="link"
          type="url"
          placeholder="https://..."
          value={link}
          onChange={(e) => setLink(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">
          Quantity ({service.min_quantity.toLocaleString()} - {service.max_quantity.toLocaleString()})
        </Label>
        <Input
          id="quantity"
          type="number"
          min={service.min_quantity}
          max={service.max_quantity}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          onBlur={(e) => {
            const value = e.target.value.trim();
            if (!value || isNaN(parseInt(value, 10))) {
              setQuantity(String(service.min_quantity || 100));
            }
          }}
          required
          disabled={loading}
        />
      </div>

      {isCommentService() && (
        <div className="space-y-2">
          <Label htmlFor="comments">Custom comments (1 per line)</Label>
          <Textarea
            id="comments"
            placeholder="Enter comments, one per line..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={6}
            disabled={loading}
            className="resize-none"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Enter each comment on a new line
          </p>
        </div>
      )}

      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Price per 1000:</span>
          <span className="font-medium">{format(convert(service.rate))}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
          <span className="font-medium">{getQuantityNumber().toLocaleString()}</span>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
          <div className="flex justify-between">
            <span className="font-semibold">Total Charge:</span>
            <span className="font-bold text-lg">{format(convert(charge))}</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Your Balance:</span>
          <span>{format(convert(balance))}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading || charge > balance} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Order"
          )}
        </Button>
      </div>
    </form>
  );
}
