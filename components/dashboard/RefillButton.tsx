"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";

interface RefillButtonProps {
  orderId: string;
  onSuccess?: () => void;
}

export function RefillButton({ orderId, onSuccess }: RefillButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRefill = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/refill`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to request refill");
      }

      toast({
        title: "Refill requested",
        description: "Your refill request has been submitted successfully.",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to request refill",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleRefill}
      disabled={loading}
      size="sm"
    >
      {loading ? "Processing..." : "Request Refill"}
    </Button>
  );
}

