import { BRAND, MENU_ITEMS, formatPKR } from "@four/shared";
import { Nav } from "@/components/Nav";
import { LogoHero } from "@/components/hero/LogoHero";
import { CategoriesCarousel } from "@/components/sections/CategoriesCarousel";
import { CraftStory } from "@/components/sections/CraftStory";
import { PopularDishes } from "@/components/sections/PopularDishes";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { WorldFlavours } from "@/components/sections/WorldFlavours";
import { DealsBand } from "@/components/sections/DealsBand";
import { DeliveryAreas } from "@/components/sections/DeliveryAreas";
import { CtaBand } from "@/components/sections/CtaBand";
import { Footer } from "@/components/sections/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ChatDock } from "@/components/chat/ChatDock";
import { LocationGate } from "@/components/LocationModal";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Price range is computed from the live menu data so it can never drift from
// what /menu actually charges. Variants count: a pizza's "large" price is the
// real ceiling, not its base (smallest) price.
const allPrices = MENU_ITEMS.flatMap((i) => [i.price, ...(i.variants?.map((v) => v.price) ?? [])]);

const restaurantJsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "FOUR",
  servesCuisine: ["Burgers", "Pizza", "Fast Food"],
  telephone: BRAND.phoneIntl,
  image: `${SITE_URL}/og.jpg`,
  address: {
    "@type": "PostalAddress",
    streetAddress: BRAND.address,
    addressLocality: "Lahore",
    addressCountry: "PK",
  },
  url: SITE_URL,
  sameAs: [BRAND.instagram],
  priceRange: `${formatPKR(Math.min(...allPrices))} - ${formatPKR(Math.max(...allPrices))}`,
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "13:00",
    closes: "03:00",
  },
  hasMenu: `${SITE_URL}/menu`,
  potentialAction: { "@type": "OrderAction", target: `${SITE_URL}/menu` },
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }} />
      <Nav />
      <main id="main">
        <LogoHero />
        <CategoriesCarousel mode="link" />
        <CraftStory />
        <PopularDishes />
        <HowItWorks />
        <WorldFlavours />
        <DealsBand />
        <DeliveryAreas />
        <CtaBand />
      </main>
      <Footer />
      <CartDrawer />
      <ChatDock />
      <LocationGate />
    </>
  );
}
