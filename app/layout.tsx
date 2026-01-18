import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/lib/hooks/use-theme"

const outfit = Outfit({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit"
})

export const metadata: Metadata = {
  title: "Numzaro - Buy Social Media Services",
  description: "Buy followers, likes, and comments for your social media accounts",
  icons: {
    icon: "/4.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={outfit.className}>
        <ThemeProvider defaultTheme="system" storageKey="ui-theme">
          {children}
          <Toaster />
        </ThemeProvider>
        <Script src="https://js.paystack.co/v2/inline.js" strategy="lazyOnload" />
      </body>
    </html>
  )
}

