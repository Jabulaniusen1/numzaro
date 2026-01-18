"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import Link from "next/link";
import { ArrowLeft, Loader2, Search, User, DollarSign, Phone, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  wallet_balance: number;
  created_at: string;
  numbers_count?: number;
  orders_count?: number;
  total_spent?: number;
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const { format } = useCurrency();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      (user.full_name?.toLowerCase().includes(query) || false)
    );
  });

  const stats = {
    totalUsers: users.length,
    totalBalance: users.reduce((sum, u) => sum + parseFloat(u.wallet_balance?.toString() || "0"), 0),
    totalNumbers: users.reduce((sum, u) => sum + (u.numbers_count || 0), 0),
    totalOrders: users.reduce((sum, u) => sum + (u.orders_count || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users and monitor activity</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <User className="h-5 w-5" />
              {stats.totalUsers}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Wallet Balance</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {format(stats.totalBalance)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Numbers</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Phone className="h-5 w-5" />
              {stats.totalNumbers}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Orders</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Package className="h-5 w-5" />
              {stats.totalOrders}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-right p-2">Wallet Balance</th>
                    <th className="text-right p-2">Numbers</th>
                    <th className="text-right p-2">Orders</th>
                    <th className="text-right p-2">Total Spent</th>
                    <th className="text-left p-2">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-2">
                        <div className="font-medium">{user.email}</div>
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {user.full_name || "-"}
                      </td>
                      <td className="p-2 text-right font-medium">
                        {format(parseFloat(user.wallet_balance?.toString() || "0"))}
                      </td>
                      <td className="p-2 text-right">
                        <Badge variant="outline">{user.numbers_count || 0}</Badge>
                      </td>
                      <td className="p-2 text-right">
                        <Badge variant="outline">{user.orders_count || 0}</Badge>
                      </td>
                      <td className="p-2 text-right font-medium">
                        {format(user.total_spent || 0)}
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

