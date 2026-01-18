"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationItem } from "@/components/dashboard/NotificationItem";
import { useToast } from "@/lib/hooks/use-toast";
import { Bell, CheckCheck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Notification {
  id: string;
  type: "transaction" | "billing" | "subscription_reminder" | "expiration_reminder" | "payment_failed";
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [filterType]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== "all") {
        params.append("type", filterType);
      }
      params.append("limit", "100");

      const response = await fetch(`/api/notifications?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      try {
        await fetch(`/api/notifications/${notification.id}/read`, {
          method: "POST",
        });
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    // Navigate based on notification type
    if (notification.data?.order_id) {
      router.push(`/dashboard/orders`);
    } else if (notification.type === "transaction") {
      router.push(`/dashboard`);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAll: true }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true }))
        );
        setUnreadCount(0);
        toast({
          title: "Success",
          description: "All notifications marked as read",
        });
      } else {
        throw new Error("Failed to mark all as read");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark all as read",
        variant: "destructive",
      });
    } finally {
      setMarkingAll(false);
    }
  };

  const filteredNotifications =
    filterType === "all"
      ? notifications
      : notifications.filter((n) => n.type === filterType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Stay updated with your account activity
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            variant="outline"
            className="flex items-center gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            {markingAll ? "Marking..." : "Mark All Read"}
          </Button>
        )}
      </div>

      {/* Filter */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter by type:
            </label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px] dark:bg-gray-900 dark:border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Notifications</SelectItem>
                <SelectItem value="transaction">Transactions</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="subscription_reminder">Reminders</SelectItem>
                <SelectItem value="expiration_reminder">Expiration</SelectItem>
                <SelectItem value="payment_failed">Payment Failed</SelectItem>
              </SelectContent>
            </Select>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-200">
                {unreadCount} unread
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {loading ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
          </CardContent>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-12 text-center">
            <Bell className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No notifications</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {filterType === "all"
                ? "You're all caught up!"
                : `No ${filterType.replace("_", " ")} notifications`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={() => handleNotificationClick(notification)}
            />
          ))}
        </div>
      )}
    </div>
  );
}


