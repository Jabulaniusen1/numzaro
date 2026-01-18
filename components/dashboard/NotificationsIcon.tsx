"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationsDropdown } from "./NotificationsDropdown";

export function NotificationsIcon() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/notifications?unread_only=true&limit=0");
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  useEffect(() => {
    // Fetch immediately
    fetchUnreadCount();

    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <NotificationsDropdown
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onNotificationRead={fetchUnreadCount}
      >
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </NotificationsDropdown>
    </div>
  );
}

