"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { Loader2, Search, User, Wallet, Phone, Package, RefreshCw, PlusCircle, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface UserRecord {
  id: string;
  email: string;
  full_name: string | null;
  wallet_balance: number;
  created_at: string;
  numbers_count?: number;
  orders_count?: number;
  social_orders_count?: number;
  number_orders_count?: number;
  esim_orders_count?: number;
  total_spent?: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: "violet" | "green" | "blue" | "amber";
}) {
  const colors = {
    violet: { bg: "bg-violet-50 dark:bg-violet-900/20", icon: "text-violet-500" },
    green:  { bg: "bg-green-50 dark:bg-green-900/20",   icon: "text-green-500"  },
    blue:   { bg: "bg-blue-50 dark:bg-blue-900/20",     icon: "text-blue-500"   },
    amber:  { bg: "bg-amber-50 dark:bg-amber-900/20",   icon: "text-amber-500"  },
  };
  const c = colors[color];
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", c.bg)}>
          <Icon className={cn("h-4 w-4", c.icon)} />
        </div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  );
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const { format, convert } = useCurrency();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [fundTarget, setFundTarget] = useState<UserRecord | null>(null);
  const [fundType, setFundType] = useState<"credit" | "debit">("credit");
  const [fundAmount, setFundAmount] = useState("");
  const [fundNote, setFundNote] = useState("");
  const [fundLoading, setFundLoading] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to load users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleWalletAction = async () => {
    if (!fundTarget) return;
    const amount = parseFloat(fundAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Invalid amount", description: "Enter a positive NGN amount.", variant: "destructive" });
      return;
    }
    setFundLoading(true);
    try {
      const res = await fetch("/api/admin/wallet/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: fundTarget.id, amount, type: fundType, note: fundNote || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      toast({
        title: fundType === "credit" ? "Wallet credited" : "Wallet debited",
        description: `₦${amount.toLocaleString()} ${fundType === "credit" ? "added to" : "deducted from"} ${fundTarget.email}.`,
      });
      setFundTarget(null);
      setFundAmount("");
      setFundNote("");
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setFundLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return user.email.toLowerCase().includes(q) || (user.full_name?.toLowerCase().includes(q) ?? false);
  });

  const totalBalance = users.reduce((s, u) => s + parseFloat(u.wallet_balance?.toString() || "0"), 0);
  const totalNumbers = users.reduce((s, u) => s + (u.numbers_count || 0), 0);
  const totalOrders  = users.reduce((s, u) => s + (u.orders_count  || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#7C5CFC]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Users"     value={users.length}                  icon={User}    color="violet" />
        <StatCard label="Wallet Balance"  value={format(convert(totalBalance))} icon={Wallet}  color="green"  />
        <StatCard label="Total Numbers"   value={totalNumbers}                  icon={Phone}   color="blue"   />
        <StatCard label="Total Orders"    value={totalOrders}                   icon={Package} color="amber"  />
      </div>

      {/* Users list */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">All Users</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {filteredUsers.length} of {users.length} shown
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Search by email or name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-xl border-gray-200 dark:border-gray-700 text-sm w-56"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchUsers} className="rounded-xl h-9 px-3">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="py-16 text-center">
            <User className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-400">No users found</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700/50">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-4 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{user.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.full_name || "—"}</p>
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: "Balance",     value: format(convert(parseFloat(user.wallet_balance?.toString() || "0"))) },
                      { label: "Total Spent", value: format(convert(user.total_spent || 0)) },
                      { label: "Numbers",     value: user.numbers_count || 0 },
                      { label: "Orders",      value: `${user.orders_count || 0} (S:${user.social_orders_count || 0} N:${user.number_orders_count || 0} E:${user.esim_orders_count || 0})` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2">
                        <p className="text-gray-400 mb-0.5">{label}</p>
                        <p className="font-semibold text-gray-700 dark:text-gray-200 truncate">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs rounded-lg border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400"
                      onClick={() => { setFundTarget(user); setFundType("credit"); setFundAmount(""); setFundNote(""); }}
                    >
                      <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                      Credit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs rounded-lg border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                      onClick={() => { setFundTarget(user); setFundType("debit"); setFundAmount(""); setFundNote(""); }}
                    >
                      <MinusCircle className="h-3.5 w-3.5 mr-1.5" />
                      Deduct
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm min-w-[850px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                    {["User", "Balance", "Numbers", "Orders", "Total Spent", "Joined", ""].map((h, i) => (
                      <th key={i} className={cn(
                        "px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide",
                        i === 0 ? "text-left" : "text-right"
                      )}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{user.email}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.full_name || "—"}</p>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">
                        {format(convert(parseFloat(user.wallet_balance?.toString() || "0")))}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {user.numbers_count || 0}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                          {user.orders_count || 0}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          S:{user.social_orders_count || 0} N:{user.number_orders_count || 0} E:{user.esim_orders_count || 0}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">
                        {format(convert(user.total_spent || 0))}
                      </td>
                      <td className="px-5 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs rounded-lg border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400"
                            onClick={() => { setFundTarget(user); setFundType("credit"); setFundAmount(""); setFundNote(""); }}
                          >
                            <PlusCircle className="h-3 w-3 mr-1" />
                            Credit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs rounded-lg border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                            onClick={() => { setFundTarget(user); setFundType("debit"); setFundAmount(""); setFundNote(""); }}
                          >
                            <MinusCircle className="h-3 w-3 mr-1" />
                            Deduct
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Credit / Deduct Dialog */}
      <Dialog open={!!fundTarget} onOpenChange={(open) => { if (!open) setFundTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {fundType === "credit" ? (
                <PlusCircle className="h-4 w-4 text-violet-500" />
              ) : (
                <MinusCircle className="h-4 w-4 text-red-500" />
              )}
              {fundType === "credit" ? "Credit Wallet" : "Deduct from Wallet"}
            </DialogTitle>
            <DialogDescription>
              {fundType === "credit" ? "Add" : "Remove"} USD {fundType === "credit" ? "to" : "from"}{" "}
              <span className="font-semibold">{fundTarget?.email}</span>.{" "}
              Current balance:{" "}
              <span className="font-semibold">
                {format(convert(parseFloat(fundTarget?.wallet_balance?.toString() || "0")))}
              </span>.
            </DialogDescription>
          </DialogHeader>

          {/* Toggle */}
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors",
                fundType === "credit"
                  ? "bg-violet-600 text-white"
                  : "bg-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
              onClick={() => { setFundType("credit"); setFundAmount(""); }}
            >
              <PlusCircle className="h-3.5 w-3.5" /> Credit
            </button>
            <button
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors",
                fundType === "debit"
                  ? "bg-red-500 text-white"
                  : "bg-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
              onClick={() => { setFundType("debit"); setFundAmount(""); }}
            >
              <MinusCircle className="h-3.5 w-3.5" /> Deduct
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount (NGN ₦)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">₦</span>
                <Input
                  type="number"
                  min={1}
                  step="1"
                  placeholder="e.g. 5000"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="pl-7"
                />
              </div>
              {fundType === "debit" && fundAmount && (
                <p className="text-xs text-red-500">
                  Balance after deduction:{" "}
                  {format(
                    Math.max(
                      0,
                      convert(parseFloat(fundTarget?.wallet_balance?.toString() || "0")) -
                        parseFloat(fundAmount || "0")
                    )
                  )}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Note (optional)</label>
              <Input
                placeholder={fundType === "credit" ? "e.g. Compensation, bonus…" : "e.g. Fraud reversal, adjustment…"}
                value={fundNote}
                onChange={(e) => setFundNote(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setFundTarget(null)}
                disabled={fundLoading}
              >
                Cancel
              </Button>
              <Button
                className={cn(
                  "flex-1 text-white",
                  fundType === "credit"
                    ? "bg-violet-600 hover:bg-violet-700"
                    : "bg-red-500 hover:bg-red-600"
                )}
                onClick={handleWalletAction}
                disabled={fundLoading || !fundAmount}
              >
                {fundLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : fundType === "credit" ? (
                  "Credit Wallet"
                ) : (
                  "Deduct Balance"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
