import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { AboutCraft } from "@/components/about/AboutCraft";
import { Footer } from "@/components/sections/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ChatDock } from "@/components/chat/ChatDock";
import { LocationGate } from "@/components/LocationModal";

export const metadata: Metadata = {
  title: "Our Food - The Craft Behind FOUR",
  description:
    "How FOUR makes it: 110g smash patties with lace-crisp edges, hand-stuffed crown crust pizzas, house sauces and shakes - made fresh daily in three Lahore kitchens, 1:00 pm to 3:00 am.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main id="main">
        <AboutCraft />
      </main>
      <Footer />
      <CartDrawer />
      <ChatDock />
      <LocationGate />
    </>
  );
}
