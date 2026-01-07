"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberStatusBadge } from "@/components/dashboard/NumberStatusBadge";
import { NumberTypeBadge } from "@/components/dashboard/NumberTypeBadge";
import { SMSInbox } from "@/components/dashboard/SMSInbox";
import { CallLogs } from "@/components/dashboard/CallLogs";
import { ForwardingSettings } from "@/components/dashboard/ForwardingSettings";
import { useToast } from "@/lib/hooks/use-toast";
import { useCurrency } from "@/lib/hooks/use-currency";
import { Phone, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";

interface PhoneNumber {
  id: string;
  number: string;
  country: string;
  type: "long_term" | "otp" | "business";
  capabilities: string;
  status: "active" | "released" | "expired";
  monthly_cost: number | null;
  renewal_date: string | null;
  forwarding_number: string | null;
  voicemail_enabled: boolean;
  created_at: string;
}

interface SMSMessage {
  id: string;
  direction: "inbound" | "outbound";
  message: string;
  from_number: string;
  to_number: string;
  timestamp: string;
}

interface CallLog {
  id: string;
  direction: "inbound" | "outbound";
  from_number: string | null;
  to_number: string | null;
  duration: number | null;
  status: string;
  recording_url: string | null;
  timestamp: string;
}

export default function NumberDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { format } = useCurrency();
  const [number, setNumber] = useState<PhoneNumber | null>(null);
  const [smsMessages, setSmsMessages] = useState<SMSMessage[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchNumberDetails();
      fetchSMSMessages();
      fetchCallLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchNumberDetails = async () => {
    try {
      const response = await fetch(`/api/numbers/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setNumber(data.number);
      }
    } catch (error) {
      console.error("Error fetching number details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSMSMessages = async () => {
    try {
      const response = await fetch(`/api/numbers/${params.id}/sms`);
      if (response.ok) {
        const data = await response.json();
        setSmsMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching SMS messages:", error);
    }
  };

  const fetchCallLogs = async () => {
    try {
      const response = await fetch(`/api/numbers/${params.id}/calls`);
      if (response.ok) {
        const data = await response.json();
        setCallLogs(data.calls || []);
      }
    } catch (error) {
      console.error("Error fetching call logs:", error);
    }
  };

  const handleRelease = async () => {
    if (!confirm("Are you sure you want to release this number?")) {
      return;
    }

    try {
      const response = await fetch(`/api/numbers/${params.id}/release`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Number released successfully",
        });
        router.push("/dashboard/numbers");
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to release number");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to release number",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-600">Loading number details...</p>
      </div>
    );
  }

  if (!number) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/numbers">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Numbers
          </Button>
        </Link>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">Number not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/numbers">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Numbers
          </Button>
        </Link>
        {number.status === "active" && (
          <Button
            variant="destructive"
            onClick={handleRelease}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Release Number
          </Button>
        )}
      </div>

      {/* Number Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Phone className="h-6 w-6" />
              <div>
                <CardTitle>{number.number}</CardTitle>
                <CardDescription>{number.country}</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <NumberStatusBadge status={number.status} />
              <NumberTypeBadge type={number.type} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Capabilities</p>
              <p className="font-medium capitalize">{number.capabilities}</p>
            </div>
            {number.monthly_cost !== null && (
              <div>
                <p className="text-sm text-gray-600">Monthly Cost</p>
                <p className="font-medium">{format(number.monthly_cost)}</p>
              </div>
            )}
            {number.renewal_date && (
              <div>
                <p className="text-sm text-gray-600">Next Renewal</p>
                <p className="font-medium">
                  {new Date(number.renewal_date).toLocaleDateString()}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="font-medium">
                {new Date(number.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Inbox */}
      {number.capabilities.includes("sms") && (
        <SMSInbox messages={smsMessages} />
      )}

      {/* Call Logs */}
      {number.capabilities.includes("voice") && (
        <CallLogs calls={callLogs} />
      )}

      {/* Forwarding Settings (Business numbers only) */}
      {number.type === "business" && number.status === "active" && (
        <ForwardingSettings
          numberId={number.id}
          currentForwardingNumber={number.forwarding_number}
          onUpdate={fetchNumberDetails}
        />
      )}
    </div>
  );
}

