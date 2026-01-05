"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface NavbarProps {
  onSignOut: () => void;
}

export function Navbar({ onSignOut }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/numzaro-logo.png"
              alt="Numzaro"
              width={140}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/dashboard/services">
              <Button variant="ghost">Services</Button>
            </Link>
            <Link href="/dashboard/orders">
              <Button variant="ghost">Orders</Button>
            </Link>
            <form action={onSignOut}>
              <Button type="submit" variant="outline">
                Sign Out
              </Button>
            </form>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4 animate-in slide-in-from-top-2">
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
              <form action={onSignOut} className="w-full">
                <Button type="submit" variant="outline" className="w-full">
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

