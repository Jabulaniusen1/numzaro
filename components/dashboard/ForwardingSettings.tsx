"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/hooks/use-toast";
import { PhoneForwarded } from "lucide-react";

interface ForwardingSettingsProps {
  numberId: string;
  currentForwardingNumber: string | null;
  onUpdate?: () => void;
}

export function ForwardingSettings({
  numberId,
  currentForwardingNumber,
  onUpdate,
}: ForwardingSettingsProps) {
  const [forwardingNumber, setForwardingNumber] = useState(
    currentForwardingNumber || ""
  );
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!forwardingNumber.trim()) {
      toast({
        title: "Error",
        description: "Forwarding number is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/numbers/${numberId}/forwarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forwarding_number: forwardingNumber.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update forwarding settings");
      }

      toast({
        title: "Success",
        description: "Call forwarding settings updated",
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update forwarding settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PhoneForwarded className="h-5 w-5" />
          Call Forwarding
        </CardTitle>
        <CardDescription>
          Configure where incoming calls should be forwarded
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="forwarding-number">Forwarding Number</Label>
          <Input
            id="forwarding-number"
            type="tel"
            placeholder="+1234567890"
            value={forwardingNumber}
            onChange={(e) => setForwardingNumber(e.target.value)}
          />
          <p className="text-sm text-gray-500">
            Enter the phone number (E.164 format) where calls should be forwarded
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}

