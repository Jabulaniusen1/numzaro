"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, Phone, Package, Receipt,
  Bell, LogOut, X, MoreHorizontal, ChevronRight, Settings,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationsIcon } from "@/components/dashboard/NotificationsIcon";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onSignOut: () => void | Promise<void>;
  isAdmin?: boolean;
}

const NAV_LINKS = [
  { href: "/dashboard",                 label: "Dashboard",     icon: LayoutDashboard },
  { href: "/dashboard/services",        label: "Boost Socials", icon: ShoppingBag     },
  { href: "/dashboard/numbers",         label: "Numbers",       icon: Phone           },
  { href: "/dashboard/orders",          label: "Orders",        icon: Package         },
  { href: "/dashboard/esim",            label: "eSIM",          icon: Phone           },
  { href: "/dashboard/transactions",    label: "Transactions",  icon: Receipt         },
];

// Bottom tab bar shows 4 main items + "More" drawer
const BOTTOM_TABS = NAV_LINKS.slice(0, 4);

function isActive(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function Navbar({ onSignOut, isAdmin }: NavbarProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 w-full border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <div className="flex items-center h-14 px-4 md:px-6 gap-4">

          {/* Logo */}
          <Link href="/dashboard" className="inline-flex items-center flex-shrink-0 mr-2">
            <Image src="/logo%20c%26b.png" alt="Numzaro" width={156} height={48} className="dark:hidden" priority />
            <Image src="/logo%20w%26c.png" alt="Numzaro" width={156} height={48} className="hidden dark:block" priority />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center justify-center gap-1 flex-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = isActive(href, pathname);
              return (
                <Link key={href} href={href}>
                  <span className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all",
                    active
                      ? "bg-violet-50 dark:bg-violet-900/30 text-[#7C5CFC]"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}>
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Admin link (desktop) */}
          {isAdmin && (
            <Link href="/dashboard/admin" className="ml-1">
              <span className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all",
                isActive("/dashboard/admin", pathname)
                  ? "bg-violet-50 dark:bg-violet-900/30 text-[#7C5CFC]"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}>
                <Settings className="h-4 w-4" />
                Admin
              </span>
            </Link>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-1.5 ml-auto">
            <ThemeToggle />
            <NotificationsIcon />
            {/* Desktop sign out */}
            <button
              onClick={() => onSignOut()}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile bottom tab bar ────────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pb-safe">
        <div className="flex items-center h-16">
          {BOTTOM_TABS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href, pathname);
            return (
              <Link key={href} href={href} className="flex-1">
                <div className="flex flex-col items-center justify-center gap-0.5 py-2">
                  <div className={cn(
                    "p-1.5 rounded-xl transition-all",
                    active ? "bg-violet-50 dark:bg-violet-900/30" : ""
                  )}>
                    <Icon className={cn("h-5 w-5 transition-colors", active ? "text-[#7C5CFC]" : "text-gray-400")} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold transition-colors",
                    active ? "text-[#7C5CFC]" : "text-gray-400"
                  )}>
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}

          {/* More tab */}
          <button className="flex-1" onClick={() => setMoreOpen(true)}>
            <div className="flex flex-col items-center justify-center gap-0.5 py-2">
              <div className="p-1.5 rounded-xl">
                <MoreHorizontal className="h-5 w-5 text-gray-400" />
              </div>
              <span className="text-[10px] font-bold text-gray-400">More</span>
            </div>
          </button>
        </div>
      </div>

      {/* ── "More" bottom sheet (mobile) ─────────────────────────────────────── */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          {/* Sheet */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl border-t border-gray-100 dark:border-gray-800 shadow-2xl pb-safe animate-in slide-in-from-bottom-4">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>

            <div className="flex items-center justify-between px-5 py-3">
              <p className="font-bold text-gray-800 dark:text-gray-100">More</p>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 pb-6 space-y-1.5">
              {isAdmin && (
                <Link href="/dashboard/admin" onClick={() => setMoreOpen(false)}>
                  <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                        <Settings className="h-4 w-4 text-[#7C5CFC]" />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Admin Settings</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-400" />
                  </div>
                </Link>
              )}
              <Link href="/dashboard/transactions" onClick={() => setMoreOpen(false)}>
                <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                      <Receipt className="h-4.5 w-4.5 text-[#7C5CFC]" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Transactions</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-400" />
                </div>
              </Link>

              <Link href="/dashboard/notifications" onClick={() => setMoreOpen(false)}>
                <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                      <Bell className="h-4.5 w-4.5 text-[#7C5CFC]" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Notifications</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-400" />
                </div>
              </Link>

              <button
                onClick={() => { setMoreOpen(false); onSignOut(); }}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group mt-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                    <LogOut className="h-4.5 w-4.5 text-red-500" />
                  </div>
                  <span className="text-sm font-semibold text-red-500">Sign Out</span>
                </div>
                <ChevronRight className="h-4 w-4 text-red-300 group-hover:text-red-400" />
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
