import type { Metadata, Viewport } from "next";
import { Passion_One, Archivo } from "next/font/google";
import { ToastStack } from "@/components/ToastStack";
import { ActiveOrderPill } from "@/components/ActiveOrderPill";
import "./globals.css";

// v2 type: Passion One display caps + Archivo body (design system readme, "Type substitution").
const passion = Passion_One({ subsets: ["latin"], weight: ["400", "700", "900"], variable: "--font-passion", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-archivo", display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FOUR | Smash Burgers & Crown Crust Pizzas - Lahore",
    template: "%s | FOUR",
  },
  description:
    "FOUR makes smash burgers, crown crust pizzas, loaded fries and shakes fresh in three Lahore kitchens. Order online, 1 pm to 3 am daily - delivery across DHA, Gulberg, Johar Town and 20+ areas.",
  icons: {
    icon: [
      { url: "/brand/logomark.svg", type: "image/svg+xml" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/brand/apple-touch-icon.png",
  },
  openGraph: {
    title: "FOUR - Lahore",
    description: "Smash burgers, crown crust pizzas, loaded fries and shakes. Delivered across Lahore.",
    type: "website",
    locale: "en_PK",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "FOUR - smash burgers delivered across Lahore" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FOUR - Lahore",
    description: "Smash burgers, crown crust pizzas, loaded fries and shakes. Delivered across Lahore.",
    images: ["/og.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#f8f1e3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${passion.variable} ${archivo.variable}`}>
      <body className="grain min-h-[100dvh]">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
        <ToastStack />
        <ActiveOrderPill />
      </body>
    </html>
  );
}
