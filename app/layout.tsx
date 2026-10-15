import type { Metadata, Viewport } from "next";
import { Fraunces, Noto_Sans_Telugu, Outfit } from "next/font/google";
import { Suspense } from "react";

import { CartProvider } from "@/components/cart-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const telugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  weight: ["500", "600", "700"],
  variable: "--font-telugu",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Andhra Thota",
    template: "%s · Andhra Thota",
  },
  description:
    "Organically grown vegetables in Andhra Pradesh. Leave your phone number and address, then pay the farm by UPI.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#f4efe4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${telugu.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <CartProvider>
          <Suspense
            fallback={<div className="h-16 border-b border-border/80 bg-[#f7f1e6]" />}
          >
            <SiteHeader />
          </Suspense>
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </CartProvider>
        <Toaster theme="light" position="top-center" />
      </body>
    </html>
  );
}
