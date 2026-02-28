"use client";

import { cn } from "@/lib/utils";

const statuses = [
    { id: "Pending", label: "Pending" },
    { id: "Received", label: "Received" },
    { id: "Finished", label: "Finished" },
    { id: "Timeout", label: "Timeout" },
    { id: "Canceled", label: "Canceled" },
    { id: "Banned", label: "Banned" },
    { id: "All", label: "All" },
];

interface StatusFilterBarProps {
    activeStatus: string;
    onStatusChange: (status: string) => void;
    className?: string;
}

export function StatusFilterBar({ activeStatus, onStatusChange, className }: StatusFilterBarProps) {
    return (
        <div className={cn("flex flex-wrap border rounded-lg overflow-hidden", className)}>
            {statuses.map((status) => (
                <button
                    key={status.id}
                    onClick={() => onStatusChange(status.id)}
                    className={cn(
                        "flex-1 min-w-[100px] py-3 px-4 text-sm font-medium transition-all border-r last:border-r-0 text-center",
                        activeStatus === status.id
                            ? "bg-[#4AA8FF] text-white border-[#4AA8FF]"
                            : "bg-white dark:bg-slate-950 text-[#4AA8FF] hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800"
                    )}
                >
                    {status.label}
                </button>
            ))}
        </div>
    );
}
