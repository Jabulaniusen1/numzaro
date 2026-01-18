"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/lib/hooks/use-toast";
import { Loader2, RefreshCw, Trash2, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

interface NumberActionsProps {
  numberId: string;
  phoneNumber: string;
  status: string;
  monthlyCost: number;
  expiresAt: string;
  onRenewed?: () => void;
  onReleased?: () => void;
}

export function NumberActions({
  numberId,
  phoneNumber,
  status,
  monthlyCost,
  expiresAt,
  onRenewed,
  onReleased,
}: NumberActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [renewing, setRenewing] = useState(false);
  const [releasing, setReleasing] = useState(false);

  const handleRenew = async () => {
    setRenewing(true);
    try {
      const response = await fetch(`/api/numbers/${numberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "renew" }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to renew number");
      }

      const data = await response.json();
      toast({
        title: "Number Renewed",
        description: `Number renewed successfully. New expiry: ${new Date(data.expires_at).toLocaleDateString()}`,
      });

      if (onRenewed) {
        onRenewed();
      }
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Renewal Failed",
        description: error.message || "Failed to renew number",
        variant: "destructive",
      });
    } finally {
      setRenewing(false);
    }
  };

  const handleRelease = async () => {
    setReleasing(true);
    try {
      const response = await fetch(`/api/numbers/${numberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to release number");
      }

      const data = await response.json();
      toast({
        title: "Number Released",
        description: data.refund
          ? `Number released. Refunded $${data.refund.toFixed(2)} USD to your wallet.`
          : "Number released successfully.",
      });

      if (onReleased) {
        onReleased();
      }
      router.push("/dashboard/numbers");
    } catch (error: any) {
      toast({
        title: "Release Failed",
        description: error.message || "Failed to release number",
        variant: "destructive",
      });
    } finally {
      setReleasing(false);
    }
  };

  const isExpired = new Date(expiresAt) < new Date();

  return (
    <div className="flex gap-2">
      {status === "active" && (
        <>
          <Button
            onClick={handleRenew}
            disabled={renewing || releasing}
            variant="outline"
          >
            {renewing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Renewing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Renew (${monthlyCost.toFixed(2)} USD)
              </>
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={renewing || releasing}
              >
                {releasing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Releasing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Release Number
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Release Number</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to release {phoneNumber}? This action
                  cannot be undone. You will receive a prorated refund based on
                  the remaining days in your billing period.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRelease}>
                  Release Number
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {isExpired && status !== "cancelled" && (
        <Button
          onClick={handleRenew}
          disabled={renewing || releasing}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          {renewing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Renewing...
            </>
          ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Renew Expired Number (${monthlyCost.toFixed(2)} USD)
              </>
          )}
        </Button>
      )}
    </div>
  );
}

