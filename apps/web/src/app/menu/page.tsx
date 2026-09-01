import type { Metadata } from "next";
import { MENU_CATEGORIES, MENU_ITEMS } from "@four/shared";
import { Nav } from "@/components/Nav";
import { MenuBrowser } from "@/components/menu/MenuBrowser";
import { Footer } from "@/components/sections/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ChatDock } from "@/components/chat/ChatDock";
import { LocationGate } from "@/components/LocationModal";

export const metadata: Metadata = {
  title: "Menu - Order Smash Burgers & Pizzas Online in Lahore",
  description:
    "Order FOUR online: smash burgers, crown crust pizzas, wings, loaded fries, shakes and desserts. Delivered hot across Lahore in about 30 minutes.",
  alternates: { canonical: "/menu" },
};

// Search engines get the full menu with prices even though the interactive
// page fetches it from the API - @four/shared is the same source of truth
// the database is seeded from.
const menuJsonLd = {
  "@context": "https://schema.org",
  "@type": "Menu",
  name: "FOUR Menu",
  inLanguage: "en-PK",
  hasMenuSection: MENU_CATEGORIES.map((c) => ({
    "@type": "MenuSection",
    name: c.label,
    description: c.blurb,
    hasMenuItem: MENU_ITEMS.filter((i) => i.category === c.id).map((i) => ({
      "@type": "MenuItem",
      name: i.name,
      description: i.description,
      offers: { "@type": "Offer", price: i.price, priceCurrency: "PKR" },
    })),
  })),
};

export default function MenuPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(menuJsonLd) }} />
      <Nav />
      <main id="main">
        <MenuBrowser />
      </main>
      <Footer />
      <CartDrawer />
      <ChatDock />
      <LocationGate />
    </>
  );
}
