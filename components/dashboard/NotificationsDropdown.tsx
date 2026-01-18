"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "./NotificationItem";
import Link from "next/link";
import { Bell } from "lucide-react";

interface Notification {
  id: string;
  type: "transaction" | "billing" | "subscription_reminder" | "expiration_reminder" | "payment_failed";
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
}

interface NotificationsDropdownProps {
  children: ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onNotificationRead?: () => void;
}

export function NotificationsDropdown({
  children,
  isOpen,
  onOpenChange,
  onNotificationRead,
}: NotificationsDropdownProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications?limit=10");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      // Refresh every 30 seconds when open
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      try {
        await fetch(`/api/notifications/${notification.id}/read`, {
          method: "POST",
        });
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
        // Notify parent to refresh count
        if (onNotificationRead) {
          onNotificationRead();
        }
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    // Navigate based on notification type
    if (notification.data?.order_id) {
      router.push(`/dashboard/orders`);
      onOpenChange(false);
    } else if (notification.type === "transaction") {
      router.push(`/dashboard`);
      onOpenChange(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
            <h3 className="font-semibold text-lg dark:text-white">Notifications</h3>
            <Link
              href="/dashboard/notifications"
              onClick={() => onOpenChange(false)}
            >
              <Button variant="ghost" size="sm" className="text-xs">
                View All
              </Button>
            </Link>
          </div>
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="p-4 text-center text-gray-600 dark:text-gray-400">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y dark:divide-gray-800">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}


