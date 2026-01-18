"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessagesList } from "@/components/dashboard/MessagesList";
import { useToast } from "@/lib/hooks/use-toast";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

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

export default function NumberMessagesPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time messages
  const { messages: realtimeMessages } = useNumberMessages(params.id as string);

  useEffect(() => {
    if (params.id) {
      fetchMessages();
    }
  }, [params.id]);

  // Merge real-time messages with fetched messages
  useEffect(() => {
    if (realtimeMessages.length > 0) {
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMessages = realtimeMessages.filter((m) => !existingIds.has(m.id));
        return [...newMessages, ...prev];
      });
    }
  }, [realtimeMessages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/numbers/${params.id}/messages`);
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/numbers/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">All messages for this number</p>
        </div>
      </div>

      <MessagesList messages={messages} loading={loading} />
    </div>
  );
}

