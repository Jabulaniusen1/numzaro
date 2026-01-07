"use client";

import { Badge } from "@/components/ui/badge";

interface NumberStatusBadgeProps {
  status: "active" | "released" | "expired";
}

export function NumberStatusBadge({ status }: NumberStatusBadgeProps) {
  const getVariant = () => {
    switch (status) {
      case "active":
        return "default";
      case "released":
        return "secondary";
      case "expired":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getLabel = () => {
    switch (status) {
      case "active":
        return "Active";
      case "released":
        return "Released";
      case "expired":
        return "Expired";
      default:
        return status;
    }
  };

  return <Badge variant={getVariant()}>{getLabel()}</Badge>;
}

