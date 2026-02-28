"use client";

import { cn, getFlag } from "@/lib/utils";
import { Clock, CheckCircle2, XCircle, Ban, AlertCircle, Mail } from "lucide-react";
import { ServiceIcon, getServicePrettyName } from "./ServiceIcon";
import { format, parseISO } from "date-fns";

interface OrderTableRowProps {
    order: {
        id: string;
        phone: string;
        operator: string;
        product: string;
        price: number;
        status: string;
        expires_at: string | null;
        created_at: string;
        country_code: string;
        country_name: string;
        otp_code?: string;
    };
    onAction?: () => void;
}

export function OrderTableRow({ order, onAction }: OrderTableRowProps) {
    const getStatusIcon = (status: string) => {
        switch (status.toUpperCase()) {
            case "PENDING":
            case "ACTIVE":
            case "TIMEOUT":
                return <Clock className="h-6 w-6 text-white" />;
            case "RECEIVED":
            case "FINISHED":
                return <CheckCircle2 className="h-6 w-6 text-white" />;
            case "CANCELED":
                return <XCircle className="h-6 w-6 text-white" />;
            case "BANNED":
                return <Ban className="h-6 w-6 text-white" />;
            default:
                return <AlertCircle className="h-6 w-6 text-white" />;
        }
    };

    const statusCircleColor = "bg-[#FFD700]";

    return (
        <tr className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-[#F8FBFF] dark:hover:bg-slate-900/30 transition-colors group">
            <td className="py-6 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                {order.id}
            </td>
            <td className="py-6 px-4 text-sm whitespace-nowrap">
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                    {format(parseISO(order.created_at), "dd-MM-yy")}
                </div>
                <div className="text-slate-400 font-medium">
                    {format(parseISO(order.created_at), "HH:mm")}
                </div>
            </td>
            <td className="py-6 px-4">
                <div className="flex flex-col gap-1.5">
                    <ServiceIcon name={order.product} size="sm" className="w-8 h-8 rounded-lg" />
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {getServicePrettyName(order.product)}
                    </div>
                </div>
            </td>
            <td className="py-6 px-4">
                <div className="flex flex-col gap-1.5">
                    <span className="text-2xl leading-none">{getFlag(order.country_code)}</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {order.country_name}
                    </span>
                </div>
            </td>
            <td className="py-6 px-4">
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-50">
                        ${order.price.toFixed(4)}
                    </span>
                    <span className="text-sm font-medium text-slate-400">
                        {order.operator.charAt(0).toUpperCase() + order.operator.slice(1)}
                    </span>
                </div>
            </td>
            <td className="py-6 px-4">
                <div className="flex flex-col gap-1">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                        {order.phone}
                    </div>
                    <div className="flex items-center gap-1.5 text-[#4AA8FF]">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm font-bold">0</span>
                    </div>
                </div>
            </td>
            <td className="py-6 px-4 bg-[#F8FBFF] dark:bg-slate-900/40 text-right pr-6">
                <div className="flex justify-end">
                    <div className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-400/20 transform transition-transform group-hover:scale-105",
                        statusCircleColor
                    )}>
                        {getStatusIcon(order.status)}
                    </div>
                </div>
            </td>
        </tr>
    );
}
