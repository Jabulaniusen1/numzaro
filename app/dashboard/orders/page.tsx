"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import Link from "next/link";

interface Order {
  id: string;
  service_id: number;
  link: string;
  quantity: number;
  status: string;
  charge: number;
  currency: string;
  start_count?: number;
  remains?: number;
  created_at: string;
  updated_at: string;
  services?: {
    name: string;
    category?: string;
    type?: string;
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();
  const { format } = useCurrency();

  useEffect(() => {
    fetchOrders();
  }, [page, selectedStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (selectedStatus !== "all") {
        params.append("status", selectedStatus);
      }

      const response = await fetch(`/api/orders?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.orders || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err.message || "Failed to fetch orders");
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshOrders = async () => {
    await fetchOrders();
    toast({
      title: "Orders refreshed",
      description: "Your orders have been updated.",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "default";
      case "in progress":
      case "partial":
        return "secondary";
      case "pending":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-gray-600 mt-2">View and manage your orders</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-gray-600 mt-2">View and manage your orders</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshOrders}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardContent className="pt-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <Button
              variant="outline"
              onClick={fetchOrders}
              className="mt-4"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <Select
            value={selectedStatus}
            onValueChange={(value) => {
              setSelectedStatus(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Partial">Partial</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Orders Table (Desktop) */}
      {!loading && (
        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle>Your Orders</CardTitle>
            <CardDescription>
              {orders.length} order{orders.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No orders found</p>
                <Link href="/dashboard/services">
                  <Button>Browse Services</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Service</th>
                      <th className="text-left p-2">Link</th>
                      <th className="text-right p-2">Quantity</th>
                      <th className="text-center p-2">Status</th>
                      <th className="text-right p-2">Charge</th>
                      <th className="text-left p-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-2">
                          <div className="font-medium">{order.services?.name || "Service"}</div>
                          <div className="text-xs text-gray-500">
                            {order.services?.category || ""} {order.services?.type ? `• ${order.services.type}` : ""}
                          </div>
                        </td>
                        <td className="p-2 text-sm">
                          <a
                            href={order.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate block max-w-xs"
                          >
                            {order.link}
                          </a>
                        </td>
                        <td className="p-2 text-right text-sm">
                          {order.quantity.toLocaleString()}
                        </td>
                        <td className="p-2 text-center">
                          <Badge variant={getStatusBadgeVariant(order.status) as any}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="p-2 text-right font-medium">
                          {format(order.charge || 0)}
                        </td>
                        <td className="p-2 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Orders Cards (Mobile) */}
      {!loading && (
        <div className="md:hidden space-y-4">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No orders found</p>
                  <Link href="/dashboard/services">
                    <Button>Browse Services</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{order.services?.name || "Service"}</CardTitle>
                      <CardDescription>
                        {order.services?.category || ""} {order.services?.type ? `• ${order.services.type}` : ""}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(order.status) as any}>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Link</p>
                    <a
                      href={order.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm truncate block"
                    >
                      {order.link}
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Quantity</p>
                      <p className="font-semibold">{order.quantity.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Charge</p>
                      <p className="font-semibold">{format(order.charge || 0)}</p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
