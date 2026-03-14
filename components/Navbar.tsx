"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b bg-white dark:bg-gray-900 dark:border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        {/* Desktop Navigation */}
        <div className="hidden md:flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <div className="h-16 w-[220px]">
              <Image
                src="/logo%20c%26b.png"
                alt="Numzaro"
                width={220}
                height={74}
                className="h-full w-full object-cover dark:hidden"
                priority
              />
              <Image
                src="/logo%20w%26c.png"
                alt="Numzaro"
                width={220}
                height={74}
                className="hidden h-full w-full object-cover dark:block"
                priority
              />
            </div>
          </Link>

          <div className="flex items-center space-x-2">
            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost">Contact</Button>
            </Link>
            <Link href="/pricing#faq">
              <Button variant="ghost">FAQ</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation - Hamburger left, Logo center, Actions right */}
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
          <Link href="/" className="flex items-center absolute left-1/2 transform -translate-x-1/2">
            <div className="h-12 w-[150px]">
              <Image
                src="/logo%20c%26b.png"
                alt="Numzaro"
                width={150}
                height={44}
                className="h-full w-full object-cover dark:hidden"
                priority
              />
              <Image
                src="/logo%20w%26c.png"
                alt="Numzaro"
                width={150}
                height={44}
                className="hidden h-full w-full object-cover dark:block"
                priority
              />
            </div>
          </Link>

          {/* Actions - Right */}
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-xs">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t dark:border-gray-800 pt-4 animate-in slide-in-from-top-2">
            <div className="flex flex-col space-y-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button variant="ghost" className="w-full justify-start">
                  Home
                </Button>
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button variant="ghost" className="w-full justify-start">
                  Pricing
                </Button>
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button variant="ghost" className="w-full justify-start">
                  Contact
                </Button>
              </Link>
              <Link
                href="/pricing#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button variant="ghost" className="w-full justify-start">
                  FAQ
                </Button>
              </Link>
              <div className="pt-2 space-y-2 border-t dark:border-gray-800">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full"
                >
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full"
                >
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
