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
    <nav className="border-b-4 border-purple-400 dark:border-purple-600 bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950 sticky top-0 z-50 shadow-lg">
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
              <Button variant="ghost" className="text-purple-800 dark:text-purple-200 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-900/30 font-semibold rounded-cartoon">📊 Dashboard</Button>
            </Link>
            <Link href="/dashboard/services">
              <Button variant="ghost" className="text-purple-800 dark:text-purple-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 font-semibold rounded-cartoon">🎯 Services</Button>
            </Link>
            <Link href="/dashboard/orders">
              <Button variant="ghost" className="text-purple-800 dark:text-purple-200 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 font-semibold rounded-cartoon">📦 Orders</Button>
            </Link>
            <Link href="/dashboard/numbers">
              <Button variant="ghost" className="text-purple-800 dark:text-purple-200 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 font-semibold rounded-cartoon">📱 Numbers</Button>
            </Link>
            <ThemeToggle />
            <NotificationsIcon />
            <Button type="button" variant="outline" onClick={() => onSignOut()} className="border-2 border-purple-500 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-cartoon font-bold">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Mobile Navigation - Logo center, Menu left, Notifications right */}
        <div className="md:hidden flex items-center justify-between w-full">
          {/* Hamburger Menu - Left */}
          <button
            className="p-2 rounded-cartoon hover:bg-pink-200 dark:hover:bg-pink-900/30 transition-colors border-2 border-purple-400 dark:border-purple-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-purple-700 dark:text-purple-300" />
            ) : (
              <Menu className="h-6 w-6 text-purple-700 dark:text-purple-300" />
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
          <div className="md:hidden mt-4 pb-4 border-t-4 border-purple-400 dark:border-purple-600 pt-4 animate-in slide-in-from-top-2 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/50 dark:to-purple-950/50 rounded-cartoon">
            <div className="flex flex-col space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button variant="ghost" className="w-full justify-start text-purple-800 dark:text-purple-200 hover:bg-pink-200 dark:hover:bg-pink-900/30 font-semibold rounded-cartoon">
                  📊 Dashboard
                </Button>
              </Link>
              <Link
                href="/dashboard/services"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button variant="ghost" className="w-full justify-start text-purple-800 dark:text-purple-200 hover:bg-blue-200 dark:hover:bg-blue-900/30 font-semibold rounded-cartoon">
                  🎯 Services
                </Button>
              </Link>
              <Link
                href="/dashboard/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button variant="ghost" className="w-full justify-start text-purple-800 dark:text-purple-200 hover:bg-yellow-200 dark:hover:bg-yellow-900/30 font-semibold rounded-cartoon">
                  📦 Orders
                </Button>
              </Link>
              <Link
                href="/dashboard/numbers"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button variant="ghost" className="w-full justify-start text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-900/30 font-semibold rounded-cartoon">
                  📱 Numbers
                </Button>
              </Link>
              <div className="w-full pt-2 border-t-2 border-purple-400 dark:border-purple-600">
                <Button type="button" variant="outline" className="w-full border-2 border-purple-500 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-cartoon font-bold" onClick={() => onSignOut()}>
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

