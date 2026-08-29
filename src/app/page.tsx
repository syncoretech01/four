import { Nav } from "@/components/Nav";
import { Hero } from "@/components/hero/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { MenuSection } from "@/components/menu/MenuSection";
import { Story } from "@/components/sections/Story";
import { Visit } from "@/components/sections/Visit";
import { Footer } from "@/components/sections/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ChatDock } from "@/components/chat/ChatDock";
import { LocationGate } from "@/components/LocationModal";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
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
