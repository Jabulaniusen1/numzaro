"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import Link from "next/link";
import { Search, RefreshCw, Calendar as CalendarIcon, Info, ChevronDown, Copy, Plus, Hourglass, Trash2, Ban, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusFilterBar } from "@/components/dashboard/StatusFilterBar";
import { OrderTableRow } from "@/components/dashboard/OrderTableRow";
import { cn, getFlag } from "@/lib/utils";
import { format, differenceInSeconds, parseISO } from "date-fns";

function Countdown({ expiresAt }: { expiresAt: string | null }) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const expiration = parseISO(expiresAt);
      const diff = differenceInSeconds(expiration, new Date());

      if (diff <= 0) {
        setTimeLeft("00:00");
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt) return null;

  return (
    <div className="flex items-center gap-1.5 text-[#FF8A00] font-bold">
      <Clock className="h-4 w-4" />
      <span>{timeLeft} min</span>
    </div>
  );
}

const CopyButton = ({ value, className, icon: Icon = Copy, label }: { value: string; className?: string; icon?: any, label?: string }) => {
  const { toast } = useToast();
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        toast({ title: "Copied!", description: `${label || "Value"} copied to clipboard` });
      }}
      className={cn("flex items-center justify-center transition-all hover:opacity-80", className)}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
};
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServiceIcon, getServicePrettyName } from "@/components/dashboard/ServiceIcon";

interface VirtualNumber {
  id: string;
  phone: string;
  operator: string;
  product: string;
  price: number;
  status: string;
  expires_at: string | null;
  created_at: string;
  country_code: string;
  country_name: string;
  otp_code?: string;
  otp_status?: string;
}


export default function MyNumbersPage() {
  const { toast } = useToast();
  const [numbers, setNumbers] = useState<VirtualNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [activeStatus, setActiveStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchNumbers();
  }, []);

  const fetchNumbers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/numbers");
      if (!response.ok) {
        throw new Error("Failed to fetch numbers");
      }

      const data = await response.json();
      // Map the backend data to our interface
      const mappedNumbers = (data.numbers || []).map((n: any) => ({
        id: n.fivsim_order_id || n.id,
        phone: n.phone_number,
        operator: n.operator || "virtual",
        product: n.product || "activation",
        price: n.monthly_cost || 0,
        status: n.status || "PENDING",
        expires_at: n.expires_at,
        created_at: n.created_at,
        country_code: n.country_code || "US",
        otp_code: n.otp_code,
        otp_status: n.otp_status,
      }));
      setNumbers(mappedNumbers);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load numbers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleAction = async (numberId: string, action: string) => {
    try {
      const response = await fetch(`/api/numbers/${numberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Action failed");
      toast({ title: "Success", description: `Number ${action}ed successfully` });
      fetchNumbers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredNumbers = numbers.filter((number) => {
    const matchesSearch = !searchQuery ||
      number.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      number.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = activeStatus === "All" ||
      number.status.toLowerCase() === activeStatus.toLowerCase();

    const matchesTab = activeTab === "active"
      ? ["PENDING", "RECEIVED", "ACTIVE"].includes(number.status.toUpperCase())
      : ["FINISHED", "CANCELED", "TIMEOUT", "BANNED", "CANCELLED", "SUSPENDED"].includes(number.status.toUpperCase());

    return matchesSearch && matchesStatus && matchesTab;
  });

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto bg-white dark:bg-slate-950 min-h-screen">
      {/* Tabs */}
      <div className="flex justify-center border-b border-slate-200 dark:border-slate-800 relative">
        <button
          onClick={() => setActiveTab("active")}
          className={cn(
            "px-12 py-4 text-xl font-bold transition-all relative",
            activeTab === "active" ? "text-[#FF8A00]" : "text-slate-400"
          )}
        >
          Active orders
          {activeTab === "active" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF8A00] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={cn(
            "px-12 py-4 text-xl font-bold transition-all relative",
            activeTab === "history" ? "text-[#FF8A00]" : "text-slate-400"
          )}
        >
          Order History
          {activeTab === "history" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF8A00] rounded-t-full" />
          )}
        </button>
      </div>

      {activeTab === "history" && (
        <div className="bg-[#EBF5FF] dark:bg-blue-950/30 p-4 rounded-2xl flex gap-4 items-start border border-blue-100 dark:border-blue-900">
          <div className="bg-[#4AA8FF] rounded-full p-1 mt-1">
            <Info className="h-4 w-4 text-white" />
          </div>
          <p className="text-[#2C699A] dark:text-blue-200 text-sm leading-relaxed">
            Please note that the activation history can be periodically cleared by the system. If you require access to the list of previously used numbers, we advise you to save it beforehand.
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-4 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4AA8FF]" />
          <Input
            placeholder="Search by number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 rounded-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus-visible:ring-[#4AA8FF]"
          />
        </div>

        <div className="md:col-span-1 flex justify-center">
          <button
            onClick={fetchNumbers}
            className="w-12 h-12 rounded-xl bg-[#EBF5FF] dark:bg-blue-950 flex items-center justify-center text-[#4AA8FF] hover:bg-blue-100 transition-colors"
          >
            <RefreshCw className={cn("h-6 w-6", loading && "animate-spin")} />
          </button>
        </div>

        <div className="md:col-span-4">
          <Select>
            <SelectTrigger className="h-14 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="telegram">Telegram</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-3 relative">
          <div className="absolute -top-3 left-4 bg-white dark:bg-slate-950 px-2 text-xs text-slate-400 z-10">Date</div>
          <div className="flex items-center justify-between h-14 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400">
            <span>dd-mm-yyyy</span>
            <CalendarIcon className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <StatusFilterBar
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        className="mt-6"
      />

      {/* Active Order Card (If one is selected or just showing the first one as example) */}
      {activeTab === "active" && filteredNumbers.length > 0 && (
        <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900 mt-8 mb-12">
          <CardContent className="p-8">
            {/* Order Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-slate-400 font-medium">№ {filteredNumbers[0].id}</div>
              <div className="flex items-center gap-6">
                <Countdown expiresAt={filteredNumbers[0].expires_at} />
                <div className="text-slate-400 font-medium">
                  {format(parseISO(filteredNumbers[0].created_at), "HH:mm")}
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#4AA8FF] shadow-[0_0_8px_#4AA8FF]" />
              </div>
            </div>

            {/* Info Row */}
            <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2.5">
                  <ServiceIcon name={filteredNumbers[0].product} size="md" />
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-lg">
                    {getServicePrettyName(filteredNumbers[0].product)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xl">{getFlag(filteredNumbers[0].country_code)}</span>
                  <span className="text-slate-500 font-bold truncate max-w-[120px]">
                    {filteredNumbers[0].country_name}
                  </span>
                  <span className="text-slate-400 font-medium lowercase">
                    {filteredNumbers[0].operator}
                  </span>
                </div>

                <div className="font-bold text-slate-700 dark:text-slate-200 text-lg">
                  ${filteredNumbers[0].price.toFixed(4)}
                </div>

                <div className="bg-[#EBF5FF] dark:bg-blue-900/30 text-[#4AA8FF] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
                  &gt;1 SMS
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleAction(filteredNumbers[0].id, "finish")}
                  className="w-12 h-12 bg-[#FF8A00] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 hover:scale-105 transition-transform"
                >
                  <Hourglass className="h-6 w-6" />
                </button>
                <button
                  onClick={() => handleAction(filteredNumbers[0].id, "ban")}
                  className="h-12 px-6 border-2 border-[#4AA8FF] rounded-2xl text-[#4AA8FF] font-bold hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                >
                  Ban
                </button>
                <button
                  onClick={() => handleAction(filteredNumbers[0].id, "cancel")}
                  className="h-12 px-6 bg-[#4AA8FF] rounded-2xl text-white font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Input Row */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 w-full relative">
                <div className="flex items-center h-16 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden group focus-within:border-[#4AA8FF] transition-all">
                  <div className="w-16 h-full bg-[#4AA8FF] flex items-center justify-center">
                    <div className="relative">
                      <Plus className="h-4 w-4 text-white absolute -top-1 -left-1" />
                      <Copy className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 text-center font-bold text-xl text-slate-700 dark:text-slate-200 tracking-wider">
                    {filteredNumbers[0].phone}
                  </div>
                  <CopyButton
                    value={filteredNumbers[0].phone}
                    label="Phone number"
                    className="w-16 h-full bg-[#4AA8FF] text-white"
                  />
                </div>
              </div>

              <div className="flex-1 w-full flex items-center gap-4">
                <span className="text-slate-500 font-bold whitespace-nowrap">Code from SMS</span>
                <div className="flex-1 flex items-center h-16 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden group focus-within:border-[#4AA8FF] transition-all">
                  <div className="flex-1 text-center font-bold text-2xl text-slate-700 dark:text-slate-200 tracking-[0.5em] pl-[0.5em]">
                    {filteredNumbers[0].otp_code || ""}
                  </div>
                  <CopyButton
                    value={filteredNumbers[0].otp_code || ""}
                    label="OTP code"
                    className="w-16 h-full bg-[#4AA8FF] text-white"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FBFF] dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <th className="py-5 px-4 text-sm font-bold text-slate-500 uppercase tracking-wider">ID</th>
              <th className="py-5 px-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="py-5 px-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Service</th>
              <th className="py-5 px-4 text-sm font-bold text-slate-500 uppercase tracking-wider">Country</th>
              <th className="py-5 px-4 text-sm font-bold text-slate-500 uppercase tracking-wider leading-tight">Price<br /><span className="text-xs font-medium text-slate-400 normal-case">Operator</span></th>
              <th className="py-5 px-4 text-sm font-bold text-slate-500 uppercase tracking-wider leading-tight">Number<br /><span className="text-xs font-medium text-slate-400 normal-case">Code</span></th>
              <th className="py-5 px-4 text-sm font-bold text-slate-500 uppercase tracking-wider text-right pr-8">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-slate-50 dark:border-slate-800">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="py-4 px-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filteredNumbers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                      <Search className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-medium">No orders found</p>
                    <Link href="/dashboard/numbers">
                      <Button variant="outline" className="rounded-xl border-[#4AA8FF] text-[#4AA8FF] hover:bg-[#EBF5FF]">
                        Buy a number
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              filteredNumbers.map((order) => (
                <OrderTableRow key={order.id} order={order} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
