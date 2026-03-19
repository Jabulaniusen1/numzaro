"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { Loader2, Download, MessageSquare, Shield, Phone, Wallet, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface Transaction {
  id: string;
  type: string;
  transaction_type: string;
  amount: number;
  balance_before?: number;
  balance_after?: number;
  actual_cost?: number;
  user_charged?: number;
  description: string;
  created_at: string;
  metadata?: any;
}

export default function TransactionsPage() {
  const { toast } = useToast();
  const { format: formatCurrency, convert } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/transactions");
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string, transactionType: string) => {
    if (type === "twilio_charge") {
      if (transactionType.includes("otp")) {
        return <Shield className="h-4 w-4" />;
      }
      return <MessageSquare className="h-4 w-4" />;
    }
    if (type === "number_purchase" || transactionType === "number_renewal") {
      return <Phone className="h-4 w-4" />;
    }
    if (type === "payment" || transactionType === "deposit") {
      return <CreditCard className="h-4 w-4" />;
    }
    return <Wallet className="h-4 w-4" />;
  };

  const getTransactionColor = (amount: number) => {
    if (amount > 0) {
      return "text-green-600 dark:text-green-400";
    }
    return "text-red-600 dark:text-red-400";
  };

  const getTransactionBadge = (type: string, transactionType: string) => {
    if (type === "twilio_charge") {
      if (transactionType.includes("otp")) {
        return <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20">OTP</Badge>;
      }
      if (transactionType.includes("sms")) {
        return <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20">SMS</Badge>;
      }
      if (transactionType.includes("number_renewal")) {
        return <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">Renewal</Badge>;
      }
      if (transactionType.includes("number_purchase")) {
        return <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">Purchase</Badge>;
      }
    }
    if (type === "number_purchase") {
      return <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">Purchase</Badge>;
    }
    if (type === "payment" || transactionType === "deposit") {
      return <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">Deposit</Badge>;
    }
    if (transactionType === "withdrawal") {
      return <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20">Withdrawal</Badge>;
    }
    if (transactionType === "refund") {
      return <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20">Refund</Badge>;
    }
    return null;
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "all") return true;
    if (filter === "charges") return tx.amount < 0;
    if (filter === "deposits") return tx.amount > 0;
    if (filter === "numbers") return tx.type === "number_purchase" || tx.transaction_type === "number_renewal";
    if (filter === "sms_otp") return tx.type === "twilio_charge";
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
            <Skeleton className="h-4 w-64 mt-2 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
          </div>
          <Skeleton className="h-9 w-24 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
        </div>

        {/* Filter Skeletons */}
        <div className="flex flex-wrap gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-md" />
          ))}
        </div>

        {/* Transaction Card Skeleton */}
        <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardHeader>
            <Skeleton className="h-6 w-40 bg-gradient-to-r from-purple-300 to-pink-300 dark:from-purple-700 dark:to-pink-700" />
            <Skeleton className="h-4 w-32 mt-2 bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-800 dark:to-pink-800" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-2 border-purple-100 dark:border-purple-900 rounded-lg bg-white/60 dark:bg-gray-800/60"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <Skeleton className="h-5 w-5 rounded bg-gradient-to-r from-purple-300 to-pink-300 dark:from-purple-700 dark:to-pink-700 flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Skeleton className="h-5 w-48 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                        <Skeleton className="h-5 w-16 rounded-full bg-gradient-to-r from-blue-200 to-blue-100 dark:from-blue-800 dark:to-blue-700" />
                      </div>
                      <Skeleton className="h-4 w-40 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                      <Skeleton className="h-3 w-56 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Skeleton className="h-6 w-20 bg-gradient-to-r from-green-300 to-green-200 dark:from-green-700 dark:to-green-600" />
                    <Skeleton className="h-4 w-16 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground mt-1">
            View all your account transactions and charges
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "charges" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("charges")}
        >
          Charges
        </Button>
        <Button
          variant={filter === "deposits" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("deposits")}
        >
          Deposits
        </Button>
        <Button
          variant={filter === "numbers" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("numbers")}
        >
          Numbers
        </Button>
        <Button
          variant={filter === "sms_otp" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("sms_otp")}
        >
          SMS/OTP
        </Button>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 mt-1">
                      {getTransactionIcon(transaction.type, transaction.transaction_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium break-words">{transaction.description}</p>
                        {getTransactionBadge(transaction.type, transaction.transaction_type)}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                        <span>{format(new Date(transaction.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                        {transaction.metadata?.phone_number && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-xs break-all">
                              {transaction.metadata.phone_number}
                            </span>
                          </>
                        )}
                      </div>
                      {transaction.actual_cost && transaction.user_charged && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Cost: {formatCurrency(convert(transaction.actual_cost))} | Charged: {formatCurrency(convert(transaction.user_charged))}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end sm:items-end gap-1 flex-shrink-0">
                    <p className={`font-semibold ${getTransactionColor(transaction.amount)}`}>
                      {transaction.amount > 0 ? "+" : ""}
                      {formatCurrency(convert(Math.abs(transaction.amount)))}
                    </p>
                    {transaction.balance_after !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        Balance: {formatCurrency(convert(transaction.balance_after))}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
