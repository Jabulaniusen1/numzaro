"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { MessageSquare, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  direction: "inbound" | "outbound";
  from_number: string;
  to_number: string;
  body: string;
  is_otp: boolean;
  otp_code?: string;
  otp_service?: string;
  created_at: string;
}

interface MessagesListProps {
  messages: Message[];
  loading?: boolean;
}

export function MessagesList({ messages, loading }: MessagesListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No messages yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <Card key={message.id}>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={message.direction === "inbound" ? "default" : "outline"}>
                      {message.direction}
                    </Badge>
                    {message.is_otp && (
                      <Badge variant="secondary">OTP</Badge>
                    )}
                    {message.otp_service && (
                      <Badge variant="outline">{message.otp_service}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    From: {message.from_number}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {format(new Date(message.created_at), "MMM d, yyyy HH:mm")}
                  </p>
                </div>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="whitespace-pre-wrap">{message.body}</p>
                {message.otp_code && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-mono font-bold text-lg">{message.otp_code}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(message.otp_code!, message.id)}
                    >
                      {copiedId === message.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}








