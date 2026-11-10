import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Great_Vibes, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import { env } from "@/lib/env";
import "./globals.css";

const display = Cormorant_Garamond({ variable: "--font-display", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const script = Great_Vibes({ variable: "--font-script-face", subsets: ["latin"], weight: "400", display: "swap" });
const body = Manrope({ variable: "--font-body", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: { default: "Neha's Wedding", template: "%s · Neha's Wedding" },
  description: "A Celebration of Love, Family & Forever.",
  openGraph: {
    title: "Neha's Wedding",
    description: "A Celebration of Love, Family & Forever.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf7f0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${display.variable} ${script.variable} ${body.variable}`}>
      <body>
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{ classNames: { toast: "!rounded-xl !border-champagne/40 !font-sans" } }}
        />
      </body>
    </html>
  );
}
