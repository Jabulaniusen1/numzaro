"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { RefreshCw, ChevronLeft, ChevronRight, Package, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
  services?: { name: string; category?: string; type?: string };
}

const STATUS_OPTIONS = ["all", "Pending", "In Progress", "Partial", "Completed", "Cancelled"];

function statusStyle(status: string) {
  const s = status.toLowerCase();
  if (s === "completed") return "text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-300";
  if (s === "in progress") return "text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300";
  if (s === "partial") return "text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300";
  if (s === "pending") return "text-violet-700 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300";
  if (s === "cancelled" || s === "canceled") return "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300";
  return "text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300";
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();
  const { format } = useCurrency();

  useEffect(() => { fetchOrders(); }, [page, selectedStatus]);

  const fetchOrders = async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" });
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      const res = await fetch(`/api/orders?${params}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data.orders || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshOrders = async () => {
    await fetchOrders();
    toast({ title: "Orders refreshed" });
  };

  return (
    <div className="min-h-screen bg-[#F0F2FA] dark:bg-gray-900">
      <div className="px-4 pt-4 pb-6 md:px-6 md:pt-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              My Orders
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track your social media orders</p>
          </div>
          <button
            onClick={refreshOrders}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#7C5CFC] border border-[#7C5CFC]/30 px-3 py-2 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center justify-between">
            {error}
            <button onClick={fetchOrders} className="text-xs font-semibold underline">Retry</button>
          </div>
        )}

        {/* Status Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setSelectedStatus(s); setPage(1); }}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all",
                selectedStatus === s
                  ? "bg-[#7C5CFC] text-white shadow-md shadow-violet-200 dark:shadow-none"
                  : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-[#7C5CFC] hover:text-[#7C5CFC]"
              )}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {loading ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4 gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mx-auto mb-3">
                <Package className="h-7 w-7 text-[#7C5CFC]" />
              </div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">No orders found</p>
              <Link href="/dashboard/services">
                <Button size="sm" className="bg-[#7C5CFC] hover:bg-[#6B4EFF] text-white rounded-xl">
                  Browse Services
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <th className="py-3.5 px-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Service</th>
                      <th className="py-3.5 px-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Link</th>
                      <th className="py-3.5 px-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wide">Qty</th>
                      <th className="py-3.5 px-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wide">Status</th>
                      <th className="py-3.5 px-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wide">Charge</th>
                      <th className="py-3.5 px-5 text-right text-xs font-bold text-gray-400 uppercase tracking-wide">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="py-3.5 px-5">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{order.services?.name || "Service"}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{order.services?.category}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <a href={order.link} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-[#7C5CFC] hover:underline flex items-center gap-1 max-w-[180px] truncate">
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{order.link}</span>
                          </a>
                        </td>
                        <td className="py-3.5 px-4 text-right text-sm text-gray-600 dark:text-gray-300">
                          {order.quantity.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", statusStyle(order.status))}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-sm text-gray-800 dark:text-gray-100">
                          {format(order.charge || 0)}
                        </td>
                        <td className="py-3.5 px-5 text-right text-xs text-gray-400">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-50 dark:divide-gray-700/50">
                {orders.map((order) => (
                  <div key={order.id} className="px-4 py-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{order.services?.name || "Service"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{order.services?.category}</p>
                      </div>
                      <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full ml-2 flex-shrink-0", statusStyle(order.status))}>
                        {order.status}
                      </span>
                    </div>
                    <a href={order.link} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-[#7C5CFC] hover:underline flex items-center gap-1 mb-3 truncate">
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{order.link}</span>
                    </a>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 text-xs">{order.quantity.toLocaleString()} items · {new Date(order.created_at).toLocaleDateString()}</span>
                      <span className="font-black text-[#7C5CFC]">{format(order.charge || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-white dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
            <span className="text-xs text-gray-500 font-semibold">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-white dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
