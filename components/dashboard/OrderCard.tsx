"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { Progress } from "@/components/ui/progress";
import { RefillButton } from "./RefillButton";
import { CancelButton } from "./CancelButton";
import { useOrderStatus } from "@/lib/hooks/useOrderStatus";
import { useCurrency } from "@/lib/hooks/use-currency";

interface Order {
  id: string;
  service_id: number;
  exosupplier_order_id: number;
  link: string;
  quantity: number;
  status: string;
  charge: number;
  currency: string;
  start_count: number | null;
  remains: number | null;
  created_at: string;
  updated_at: string;
  services: {
    name: string;
    refill_allowed: boolean;
    cancel_allowed: boolean;
  };
}

interface OrderCardProps {
  order: Order;
  onUpdate?: () => void;
}

export function OrderCard({ order, onUpdate }: OrderCardProps) {
  const { status, remains, start_count } = useOrderStatus(
    order.exosupplier_order_id,
    order.status,
    order.remains,
    order.start_count
  );
  const { format, loading: currencyLoading } = useCurrency();

  const calculateProgress = () => {
    if (!start_count || !remains || order.quantity === 0) return 0;
    const delivered = order.quantity - remains;
    return Math.min((delivered / order.quantity) * 100, 100);
  };

  const progress = calculateProgress();

  // Get border color based on status
  const getCardBorderColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "border-green-300";
      case "in progress":
      case "partial":
        return "border-blue-300";
      case "cancelled":
        return "border-red-300";
      case "pending":
        return "border-yellow-300";
      default:
        return "border-gray-300";
    }
  };

  return (
    <Card className={getCardBorderColor(status)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{order.services.name}</CardTitle>
            <CardDescription>
              Order #{order.exosupplier_order_id}
            </CardDescription>
          </div>
          <OrderStatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Link</p>
            <p className="font-medium truncate">{order.link}</p>
          </div>
          <div>
            <p className="text-gray-600">Quantity</p>
            <p className="font-medium">{order.quantity.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-600">Charge</p>
            <p className="font-medium">
              {currencyLoading ? "Loading..." : format(order.charge)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Created</p>
            <p className="font-medium">
              {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {(status === "In Progress" || status === "Partial") && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">
                {remains !== null && start_count !== null
                  ? `${order.quantity - remains} / ${order.quantity}`
                  : "Calculating..."}
              </span>
            </div>
            <Progress value={progress} />
            {remains !== null && (
              <p className="text-xs text-gray-600">
                {remains} remaining
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {order.services.refill_allowed && status === "Completed" && (
            <RefillButton orderId={order.id} onSuccess={onUpdate} />
          )}
          {order.services.cancel_allowed &&
            (status === "Pending" || status === "In Progress" || status === "Partial") && (
              <CancelButton orderId={order.id} onSuccess={onUpdate} />
            )}
        </div>
      </CardContent>
    </Card>
  );
}

