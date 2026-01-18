"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  CreditCard,
  Clock,
  AlertCircle,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: "transaction" | "billing" | "subscription_reminder" | "expiration_reminder" | "payment_failed";
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
}

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "transaction":
      return <DollarSign className="h-4 w-4" />;
    case "billing":
      return <CreditCard className="h-4 w-4" />;
    case "subscription_reminder":
    case "expiration_reminder":
      return <Clock className="h-4 w-4" />;
    case "payment_failed":
      return <XCircle className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "transaction":
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
    case "billing":
      return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
    case "subscription_reminder":
    case "expiration_reminder":
      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
    case "payment_failed":
      return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
    default:
      return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
  }
};

export function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const isUnread = !notification.read;
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
  });

  return (
    <Card
      className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
        isUnread ? "bg-blue-50 dark:bg-blue-900/10" : ""
      } border-0 rounded-none`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getNotificationColor(
              notification.type
            )}`}
          >
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4
                className={`font-semibold text-sm ${
                  isUnread
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {notification.title}
              </h4>
              {isUnread && (
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500" />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {notification.message}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="outline"
                className="text-xs"
              >
                {notification.type.replace("_", " ")}
              </Badge>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {timeAgo}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


