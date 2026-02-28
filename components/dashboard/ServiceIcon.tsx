"use client";

import { cn } from "@/lib/utils";
import { MessageSquare } from "lucide-react";

interface ServiceIconProps {
    name: string;
    className?: string;
    size?: "sm" | "md" | "lg";
}

import { FcGoogle } from "react-icons/fc";
import { FaWhatsapp, FaTelegram, FaFacebook, FaInstagram, FaTiktok, FaTwitter, FaDiscord } from "react-icons/fa";

export const getServicePrettyName = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("google") || n.includes("youtube") || n.includes("gmail")) return "Google/YouTube";
    if (n.includes("telegram")) return "Telegram";
    if (n.includes("whatsapp")) return "WhatsApp";
    if (n.includes("facebook")) return "Facebook";
    if (n.includes("instagram")) return "Instagram";
    if (n.includes("tiktok")) return "TikTok";
    if (n.includes("twitter") || n.includes(" x ")) return "Twitter/X";
    if (n.includes("discord")) return "Discord";
    return name.charAt(0).toUpperCase() + name.slice(1);
};

export function ServiceIcon({ name, className, size = "md" }: ServiceIconProps) {
    const n = name.toLowerCase();

    const sizeClasses = {
        sm: "w-6 h-6",
        md: "w-8 h-8",
        lg: "w-10 h-10"
    };

    const iconSizeClasses = {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-6 w-6"
    };

    const textSizes = {
        sm: "text-[10px]",
        md: "text-xs",
        lg: "text-sm"
    };

    if (n.includes("google") || n.includes("youtube") || n.includes("gmail")) {
        return (
            <div className={cn(sizeClasses[size], "flex items-center justify-center", className)}>
                <FcGoogle className={cn("w-full h-full")} />
            </div>
        );
    }

    if (n.includes("telegram")) {
        return (
            <div className={cn(sizeClasses[size], "rounded-full bg-[#0088cc] flex items-center justify-center text-white", className)}>
                <FaTelegram className={iconSizeClasses[size]} />
            </div>
        );
    }

    if (n.includes("whatsapp")) {
        return (
            <div className={cn(sizeClasses[size], "rounded-full bg-[#25D366] flex items-center justify-center text-white", className)}>
                <FaWhatsapp className={iconSizeClasses[size]} />
            </div>
        );
    }

    if (n.includes("facebook")) {
        return (
            <div className={cn(sizeClasses[size], "rounded-full bg-[#1877F2] flex items-center justify-center text-white", className)}>
                <FaFacebook className={iconSizeClasses[size]} />
            </div>
        );
    }

    if (n.includes("instagram")) {
        return (
            <div className={cn(sizeClasses[size], "rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center text-white", className)}>
                <FaInstagram className={iconSizeClasses[size]} />
            </div>
        );
    }

    if (n.includes("tiktok")) {
        return (
            <div className={cn(sizeClasses[size], "rounded-full bg-black flex items-center justify-center text-white", className)}>
                <FaTiktok className={iconSizeClasses[size]} />
            </div>
        );
    }

    if (n.includes("twitter")) {
        return (
            <div className={cn(sizeClasses[size], "rounded-full bg-black flex items-center justify-center text-white", className)}>
                <FaTwitter className={iconSizeClasses[size]} />
            </div>
        );
    }

    if (n.includes("discord")) {
        return (
            <div className={cn(sizeClasses[size], "rounded-full bg-[#5865F2] flex items-center justify-center text-white", className)}>
                <FaDiscord className={iconSizeClasses[size]} />
            </div>
        );
    }

    return (
        <div className={cn(sizeClasses[size], "rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center", className)}>
            <span className={cn(textSizes[size], "font-bold text-blue-600 dark:text-blue-400")}>
                {name.charAt(0).toUpperCase()}
            </span>
        </div>
    );
}
