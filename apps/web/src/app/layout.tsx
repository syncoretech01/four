import type { Metadata, Viewport } from "next";
import { Fredoka, Poppins } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-fredoka", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins", display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "FOUR | Smash Burgers & Crown Crust Pizzas - Lahore",
  description:
    "FOUR: gourmet smash burgers, crown crust pizzas, loaded fries and shakes by Pakistan's biggest creators. Order online across Lahore - DHA, Gulberg, Model Town, Johar Town and more.",
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
  themeColor: "#e9dcc5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${poppins.variable}`}>
      <body className="grain min-h-[100dvh]">{children}</body>
    </html>
  );
}
