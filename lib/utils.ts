import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFlag(iso: string | { iso?: string } | any): string {
  // Handle cases where iso might be an object like { iso: "RU" }
  const isoStr = typeof iso === "object" ? (iso?.iso || "") : (iso || "");
  if (!isoStr || isoStr.length < 2) return "🏳️";
  const code = isoStr.toUpperCase().slice(0, 2);
  return code
    .split("")
    .map((c: string) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

