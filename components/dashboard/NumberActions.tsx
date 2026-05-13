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
import { useCurrency } from "@/lib/hooks/use-currency";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { sanitizeProviderErrorMessage } from "@/lib/errors/sanitize-provider-error";

interface NumberActionsProps {
  numberId: string;
  phoneNumber: string;
  status: string;
  monthlyCost: number;
  expiresAt?: string;
  numberType?: string;
  onRenewed?: () => void;
  onReleased?: () => void;
}

export function NumberActions({
  numberId,
  phoneNumber,
  status,
  monthlyCost,
  expiresAt,
  numberType,
  onRenewed,
  onReleased,
}: NumberActionsProps) {
  const { toast } = useToast();
  const { format: formatCurrency, convert } = useCurrency();
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
        description: sanitizeProviderErrorMessage(error?.message, "Failed to renew number"),
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
          ? `Number released. Refunded ${formatCurrency(convert(data.refund))} to your wallet.`
          : "Number released successfully.",
      });

      if (onReleased) {
        onReleased();
      }
      router.push("/dashboard/numbers");
    } catch (error: any) {
      toast({
        title: "Release Failed",
        description: sanitizeProviderErrorMessage(error?.message, "Failed to release number"),
        variant: "destructive",
      });
    } finally {
      setReleasing(false);
    }
  };

  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
  const isOneTime = numberType === "one_time_otp";
  const monthlyCostInNaira = convert(monthlyCost);

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      {status === "active" && !isOneTime && (
        <>
          <Button
            onClick={handleRenew}
            disabled={renewing || releasing}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {renewing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Renewing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Renew ({formatCurrency(monthlyCostInNaira)})</span>
                <span className="sm:hidden">Renew</span>
              </>
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={renewing || releasing}
                className="w-full sm:w-auto"
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

      {isExpired && status !== "cancelled" && !isOneTime && (
        <Button
          onClick={handleRenew}
          disabled={renewing || releasing}
          className="bg-yellow-600 hover:bg-yellow-700 w-full sm:w-auto"
        >
          {renewing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Renewing...
            </>
          ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Renew Expired Number ({formatCurrency(monthlyCostInNaira)})</span>
                <span className="sm:hidden">Renew Expired</span>
              </>
          )}
        </Button>
      )}
    </div>
  );
}
