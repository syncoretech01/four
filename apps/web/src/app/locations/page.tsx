import type { Metadata } from "next";
import { BRAND, BRANCHES, HOURS_LABEL, LAHORE_AREAS } from "@four/shared";
import { Nav } from "@/components/Nav";
import { LocationsExplorer } from "@/components/locations/LocationsExplorer";
import { Footer } from "@/components/sections/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ChatDock } from "@/components/chat/ChatDock";
import { LocationGate } from "@/components/LocationModal";
import { PageTitleBand } from "@/components/ds/PageTitleBand";

export const metadata: Metadata = {
  title: "Locations & Delivery Areas",
  description:
    "Find FOUR in Lahore: DHA Phase 6 (Fairways), Allama Iqbal Town and Lake City. Open daily 1:00 pm - 3:00 am. Delivery across DHA, Gulberg, Johar Town, Bahria Town and 20+ more areas.",
  alternates: { canonical: "/locations" },
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const areaName = (id: string) => LAHORE_AREAS.find((a) => a.id === id)?.name ?? id;

// One Restaurant node per branch - real coordinates, hours and coverage.
const branchesJsonLd = {
  "@context": "https://schema.org",
  "@graph": BRANCHES.map((b) => ({
    "@type": "Restaurant",
    name: b.name,
    address: { "@type": "PostalAddress", streetAddress: b.address, addressLocality: "Lahore", addressCountry: "PK" },
    geo: { "@type": "GeoCoordinates", latitude: b.lat, longitude: b.lng },
    telephone: BRAND.phoneIntl,
    servesCuisine: ["Burgers", "Pizza", "Fast Food"],
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "13:00",
      closes: "03:00",
    },
    areaServed: b.areaIds.map(areaName),
    parentOrganization: { "@type": "Restaurant", name: "FOUR", "@id": SITE_URL },
  })),
};

export default function LocationsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(branchesJsonLd) }} />
      <Nav />
      <main id="main">
        <PageTitleBand
          title="Locations"
          tag="Find us"
          tag2={`${LAHORE_AREAS.length} areas`}
          lede={
            <>
              FOUR cooks in {BRANCHES.length} Lahore kitchens and delivers to {LAHORE_AREAS.length} areas across the city.{" "}
              {HOURS_LABEL}, every branch.
            </>
          }
        />
        <LocationsExplorer />
      </main>
      <Footer />
      <CartDrawer />
      <ChatDock />
      <LocationGate />
    </>
  );
}
