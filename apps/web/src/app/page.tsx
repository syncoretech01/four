import { MENU_ITEMS, formatPKR } from "@four/shared";
import { Nav } from "@/components/Nav";
import { LogoHero } from "@/components/hero/LogoHero";
import { Marquee } from "@/components/sections/Marquee";
import { MenuPreview } from "@/components/sections/MenuPreview";
import { CraftStory } from "@/components/sections/CraftStory";
import { WorldFlavours } from "@/components/sections/WorldFlavours";
import { DealsBand } from "@/components/sections/DealsBand";
import { LocationsTeaser } from "@/components/sections/LocationsTeaser";
import { Footer } from "@/components/sections/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ChatDock } from "@/components/chat/ChatDock";
import { LocationGate } from "@/components/LocationModal";

// Price range is computed from the live menu data so it can never drift from
// what /menu actually charges. Variants count: a pizza's "large" price is the
// real ceiling, not its base (smallest) price.
const allPrices = MENU_ITEMS.flatMap((i) => [i.price, ...(i.variants?.map((v) => v.price) ?? [])]);

const restaurantJsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "FOUR",
  servesCuisine: ["Burgers", "Pizza", "Fast Food"],
  address: {
    "@type": "PostalAddress",
    streetAddress: "Fairways Commercial, Sector M, DHA Phase 6",
    addressLocality: "Lahore",
    addressCountry: "PK",
  },
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  sameAs: ["https://www.instagram.com/fourpakistan_/"],
  priceRange: `${formatPKR(Math.min(...allPrices))} - ${formatPKR(Math.max(...allPrices))}`,
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "13:00",
    closes: "03:00",
  },
  hasMenu: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/menu`,
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }} />
      {/* the hero is a dark full-bleed video, so the bar starts transparent */}
      <Nav overlay />
      <main id="main">
        <LogoHero />
        <Marquee />
        <MenuPreview />
        <CraftStory />
        <WorldFlavours />
        <DealsBand />
        <LocationsTeaser />
      </main>
      <Footer />
      <CartDrawer />
      <ChatDock />
      <LocationGate />
    </>
  );
}
