"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "./use-toast";

interface Message {
  id: string;
  direction: "inbound" | "outbound";
  from_number: string;
  to_number: string;
  body: string;
  is_otp: boolean;
  created_at: string;
}

export function useNumberMessages(numberId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to messages table changes
    const channel = supabase
      .channel(`messages:${numberId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `number_id=eq.${numberId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [newMessage, ...prev]);

          // Show toast for new messages (but not for OTPs, they have their own notification)
          if (!newMessage.is_otp) {
            toast({
              title: "New Message Received",
              description: newMessage.body.substring(0, 50) + "...",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [numberId, toast]);

  return { messages };
}










