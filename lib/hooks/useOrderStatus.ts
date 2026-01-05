import { useState, useEffect } from "react";

interface OrderStatus {
  status: string;
  remains: number | null;
  start_count: number | null;
}

export function useOrderStatus(
  exosupplierOrderId: number,
  initialStatus: string,
  initialRemains: number | null,
  initialStartCount: number | null
): OrderStatus {
  const [status, setStatus] = useState(initialStatus);
  const [remains, setRemains] = useState(initialRemains);
  const [startCount, setStartCount] = useState(initialStartCount);

  useEffect(() => {
    // Don't poll if order is completed or cancelled
    if (status === "Completed" || status === "Cancelled") {
      return;
    }

    const pollStatus = async () => {
      try {
        const response = await fetch(
          `/api/orders/status?order_id=${exosupplierOrderId}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.status) {
            setStatus(data.status);
            setRemains(data.remains);
            setStartCount(data.start_count);
          }
        }
      } catch (error) {
        console.error("Error polling order status:", error);
      }
    };

    // Poll immediately
    pollStatus();

    // Poll every 30 seconds
    const interval = setInterval(pollStatus, 30000);

    return () => clearInterval(interval);
  }, [exosupplierOrderId, status]);

  return {
    status,
    remains,
    start_count: startCount,
  };
}

