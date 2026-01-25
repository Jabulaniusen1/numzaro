"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationsIcon } from "@/components/dashboard/NotificationsIcon";

interface NavbarProps {
  onSignOut: () => void | Promise<void>;
}

export function Navbar({ onSignOut }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b border-primary/20 bg-gradient-to-r from-white via-purple-50/50 to-blue-50/50 dark:from-gray-900 dark:via-purple-950/30 dark:to-blue-950/30 dark:border-gray-800 sticky top-0 z-50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        {/* Desktop Navigation */}
        <div className="hidden md:flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/numzaro-logo.png"
              alt="Numzaro"
              width={180}
              height={60}
              className="h-12 w-auto"
              priority
            />
          </Link>

          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/dashboard/services">
              <Button variant="ghost">Services</Button>
            </Link>
            <Link href="/dashboard/orders">
              <Button variant="ghost">Orders</Button>
            </Link>
            <Link href="/dashboard/numbers">
              <Button variant="ghost">Numbers</Button>
            </Link>
            <Link href="/dashboard/transactions">
              <Button variant="ghost">Transactions</Button>
            </Link>
            <ThemeToggle />
            <NotificationsIcon />
            <Button type="button" variant="outline" onClick={() => onSignOut()}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Mobile Navigation - Logo center, Menu left, Notifications right */}
        <div className="md:hidden flex items-center justify-between w-full">
          {/* Hamburger Menu - Left */}
          <button
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* Logo - Center */}
          <Link href="/dashboard" className="flex items-center absolute left-1/2 transform -translate-x-1/2">
            <Image
              src="/numzaro-logo.png"
              alt="Numzaro"
              width={120}
              height={34}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Notifications Icon - Right */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationsIcon />
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t dark:border-gray-800 pt-4 animate-in slide-in-from-top-2">
            <div className="flex flex-col space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button variant="ghost" className="w-full justify-start">
                  Dashboard
                </Button>
              </Link>
              <Link
                href="/dashboard/services"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button variant="ghost" className="w-full justify-start">
                  Services
                </Button>
              </Link>
              <Link
                href="/dashboard/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button variant="ghost" className="w-full justify-start">
                  Orders
                </Button>
              </Link>
              <Link
                href="/dashboard/numbers"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button variant="ghost" className="w-full justify-start">
                  Numbers
                </Button>
              </Link>
              <Link
                href="/dashboard/transactions"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button variant="ghost" className="w-full justify-start">
                  Transactions
                </Button>
              </Link>
              <form className="w-full">
                <Button type="button" variant="outline" className="w-full" onClick={() => onSignOut()}>
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

