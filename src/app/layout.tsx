import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Instrument_Serif,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ProgressBarProvider } from "@/components/progress-bar-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
});

export const metadata: Metadata = {
  title: "NeatPO — Logistics Document Automation",
  description:
    "Turn messy logistics paperwork into organized digital data with NeatPO.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        geistSans.variable,
        geistMono.variable,
        jetbrainsMono.variable,
        instrumentSerif.variable
      )}
    >
      <body className="font-sans antialiased">
        <ConvexClientProvider>
          <ProgressBarProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ProgressBarProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
