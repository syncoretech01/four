import { Nav } from "@/components/Nav";
import { LogoHero } from "@/components/hero/LogoHero";
import { Marquee } from "@/components/sections/Marquee";
import { MenuSection } from "@/components/menu/MenuSection";
import { Story } from "@/components/sections/Story";
import { Visit } from "@/components/sections/Visit";
import { Footer } from "@/components/sections/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ChatDock } from "@/components/chat/ChatDock";
import { LocationGate } from "@/components/LocationModal";

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
  sameAs: ["https://www.instagram.com/four.pakistan"],
  priceRange: "Rs. 179 - Rs. 1,998",
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }} />
      <Nav />
      <main>
        <LogoHero />
        <Marquee />
        <MenuSection />
        <Story />
        <Visit />
      </main>
      <Footer />
      <CartDrawer />
      <ChatDock />
      <LocationGate />
    </>
  );
}
