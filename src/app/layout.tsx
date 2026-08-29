import type { Metadata, Viewport } from "next";
import { Anton, Archivo } from "next/font/google";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });

export const metadata: Metadata = {
  title: "FOUR | Smash Burgers, Pizzas & More - Lahore",
  description:
    "FOUR: gourmet smash burgers, desi-fusion pizzas, loaded fries and shakes. Order online across Lahore: DHA, Gulberg, Model Town, Johar Town and more.",
  openGraph: {
    title: "FOUR - Lahore",
    description: "Gourmet smash burgers, desi-fusion pizzas, loaded fries and shakes. Delivered across Lahore.",
    type: "website",
    locale: "en_PK",
  },
};

export const viewport: Viewport = {
  themeColor: "#efe7d9",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${archivo.variable}`}>
      <body className="grain min-h-[100dvh]">{children}</body>
    </html>
  );
}
