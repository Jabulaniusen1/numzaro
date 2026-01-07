"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ArrowRight, ArrowLeft } from "lucide-react";

interface SMSMessage {
  id: string;
  direction: "inbound" | "outbound";
  message: string;
  from_number: string;
  to_number: string;
  timestamp: string;
}

interface SMSInboxProps {
  messages: SMSMessage[];
  loading?: boolean;
}

export function SMSInbox({ messages, loading }: SMSInboxProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SMS Inbox</CardTitle>
          <CardDescription>Loading messages...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          SMS Inbox
        </CardTitle>
        <CardDescription>
          {messages.length} message{messages.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            No SMS messages yet
          </p>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg border ${
                  message.direction === "inbound"
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {message.direction === "inbound" ? (
                      <ArrowRight className="h-4 w-4 text-blue-600" />
                    ) : (
                      <ArrowLeft className="h-4 w-4 text-gray-600" />
                    )}
                    <Badge
                      variant={
                        message.direction === "inbound"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {message.direction === "inbound" ? "Received" : "Sent"}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="mb-2">
                  <p className="text-sm text-gray-600">
                    {message.direction === "inbound" ? "From" : "To"}:{" "}
                    <span className="font-medium">
                      {message.direction === "inbound"
                        ? message.from_number
                        : message.to_number}
                    </span>
                  </p>
                </div>
                <p className="text-sm">{message.message}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

