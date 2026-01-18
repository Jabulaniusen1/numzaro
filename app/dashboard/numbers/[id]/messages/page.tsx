"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessagesList } from "@/components/dashboard/MessagesList";
import { useToast } from "@/lib/hooks/use-toast";
import { useNumberMessages } from "@/lib/hooks/useNumberMessages";
import Link from "next/link";
import { ArrowLeft, Loader2, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

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

  // Filter messages
  useEffect(() => {
    let filtered = [...messages];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.body.toLowerCase().includes(query) ||
          m.from_number.toLowerCase().includes(query) ||
          m.otp_code?.toLowerCase().includes(query) ||
          m.otp_service?.toLowerCase().includes(query)
      );
    }

    // Filter by direction
    if (directionFilter !== "all") {
      filtered = filtered.filter((m) => m.direction === directionFilter);
    }

    // Filter by type (OTP or regular)
    if (typeFilter === "otp") {
      filtered = filtered.filter((m) => m.is_otp);
    } else if (typeFilter === "regular") {
      filtered = filtered.filter((m) => !m.is_otp);
    }

    setFilteredMessages(filtered);
  }, [messages, searchQuery, directionFilter, typeFilter]);

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

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Search Messages</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by content, sender, OTP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Direction</label>
              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All directions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Directions</SelectItem>
                  <SelectItem value="inbound">Inbound Only</SelectItem>
                  <SelectItem value="outbound">Outbound Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="otp">OTP Only</SelectItem>
                  <SelectItem value="regular">Regular Messages</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {filteredMessages.length !== messages.length && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredMessages.length} of {messages.length} messages
            </div>
          )}
        </CardContent>
      </Card>

      <MessagesList messages={filteredMessages} loading={loading} />
    </div>
  );
}

