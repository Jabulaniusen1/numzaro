"use client";

import { useEffect, useState } from "react";
import { OrderCard } from "@/components/dashboard/OrderCard";
import { Card, CardContent } from "@/components/ui/card";

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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-600">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-gray-600 mt-2">View and manage your orders</p>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onUpdate={fetchOrders}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">
              No orders yet. <a href="/dashboard/services" className="text-[#1877F2] hover:underline">Browse services</a> to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

