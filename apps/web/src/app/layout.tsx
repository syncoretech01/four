import type { Metadata, Viewport } from "next";
import { Fredoka, Poppins } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-fredoka", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins", display: "swap" });

export const metadata: Metadata = {
  title: "FOUR | Smash Burgers & Crown Crust Pizzas - Lahore",
  description:
    "FOUR: gourmet smash burgers, crown crust pizzas, loaded fries and shakes by Pakistan's biggest creators. Order online across Lahore - DHA, Gulberg, Model Town, Johar Town and more.",
  icons: { icon: "/brand/logomark.svg" },
  openGraph: {
    title: "FOUR - Lahore",
    description: "Smash burgers, crown crust pizzas, loaded fries and shakes. Delivered across Lahore.",
    type: "website",
    locale: "en_PK",
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
