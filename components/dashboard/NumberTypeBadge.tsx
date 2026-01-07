"use client";

import { Badge } from "@/components/ui/badge";

interface NumberTypeBadgeProps {
  type: "long_term" | "otp" | "business";
}

export function NumberTypeBadge({ type }: NumberTypeBadgeProps) {
  const getVariant = () => {
    switch (type) {
      case "long_term":
        return "default";
      case "business":
        return "secondary";
      case "otp":
        return "outline";
      default:
        return "default";
    }
  };

  const getLabel = () => {
    switch (type) {
      case "long_term":
        return "Long-term";
      case "business":
        return "Business";
      case "otp":
        return "OTP";
      default:
        return type;
    }
  };

  return <Badge variant={getVariant()}>{getLabel()}</Badge>;
}

