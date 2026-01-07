"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, ArrowRight, ArrowLeft, Clock } from "lucide-react";

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

interface CallLogsProps {
  calls: CallLog[];
  loading?: boolean;
}

export function CallLogs({ calls, loading }: CallLogsProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Call Logs</CardTitle>
          <CardDescription>Loading call logs...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Call Logs
        </CardTitle>
        <CardDescription>
          {calls.length} call{calls.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {calls.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No call logs yet</p>
        ) : (
          <div className="space-y-4">
            {calls.map((call) => (
              <div
                key={call.id}
                className={`p-4 rounded-lg border ${
                  call.direction === "inbound"
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {call.direction === "inbound" ? (
                      <ArrowRight className="h-4 w-4 text-blue-600" />
                    ) : (
                      <ArrowLeft className="h-4 w-4 text-gray-600" />
                    )}
                    <Badge
                      variant={
                        call.direction === "inbound"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {call.direction === "inbound" ? "Inbound" : "Outbound"}
                    </Badge>
                    <Badge variant="outline">{call.status}</Badge>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(call.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">
                      {call.direction === "inbound" ? "From" : "To"}
                    </p>
                    <p className="font-medium">
                      {call.direction === "inbound"
                        ? call.from_number || "Unknown"
                        : call.to_number || "Unknown"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-medium">
                        {formatDuration(call.duration)}
                      </p>
                    </div>
                  </div>
                </div>
                {call.recording_url && (
                  <div className="mt-2">
                    <a
                      href={call.recording_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Recording
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

