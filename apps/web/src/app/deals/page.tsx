import type { Metadata } from "next";
import Link from "next/link";
import { DELIVERY_FEE, FREE_DELIVERY_ABOVE, formatPKR } from "@four/shared";
import { buildDeals, MEAL_DEAL_FROM } from "@/lib/deals";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/sections/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ChatDock } from "@/components/chat/ChatDock";
import { LocationGate } from "@/components/LocationModal";
import { SmartImage } from "@/components/SmartImage";

export const metadata: Metadata = {
  title: "Deals & Offers - Meal Deals from Rs. 249",
  description:
    "FOUR meal deals in Lahore: add fries and a drink to any burger from Rs. 249, upgrade to a mint margarita, or clear Rs. 2,500 and delivery rides free.",
  alternates: { canonical: "/deals" },
};

// Fully static: every price is derived from the live menu data at build time
// and the derivation throws if an item disappears, so a card can never lie.
const deals = buildDeals();

const offerCatalogJsonLd = {
  "@context": "https://schema.org",
  "@type": "OfferCatalog",
  name: "FOUR Deals & Offers",
  itemListElement: deals.map((d) => ({
    "@type": "Offer",
    name: d.name,
    description: d.composition,
    price: d.dealPrice,
    priceCurrency: "PKR",
  })),
};

export default function DealsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offerCatalogJsonLd) }} />
      <Nav />
      <main id="main">
        {/* ── Hero ── */}
        <header className="wrap pt-28 sm:pt-32">
          <p className="f-eyebrow">Deals &amp; offers</p>
          <h1 className="f-heading f-heading--lg sm:text-7xl">Make It a Meal</h1>
          <p className="f-lede">
            Add fries and a drink to any burger from {formatPKR(MEAL_DEAL_FROM)} — here&apos;s exactly what the math
            saves you.
          </p>
        </header>

        {/* ── Deal grid ── */}
        <div className="wrap pb-24 pt-10">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {deals.map((d, i) => (
              <article key={d.id} className="f-item flex h-full flex-col">
                <Link href={d.href} className="flex h-full flex-col" aria-label={`${d.name}, ${formatPKR(d.dealPrice)} - build this meal`}>
                  <div className="f-item__media">
                    <SmartImage src={`/menu-items/${d.itemId}.jpg`} alt={d.name} fallbackLabel={d.name} className="h-full w-full" />
                    <span className={`f-item__flag f-badge f-badge--accent ${i % 2 ? "!rotate-2" : ""}`}>{d.badge}</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <h2 className="f-item__name">{d.name}</h2>
                    <p className="text-sm font-semibold text-ink-600">{d.composition}</p>
                    <div className="mt-auto flex items-baseline gap-3 pt-2">
                      <span className="font-display text-3xl font-bold text-red">{formatPKR(d.dealPrice)}</span>
                      {d.strikePrice && <span className="f-badge f-badge--struck">{formatPKR(d.strikePrice)}</span>}
                    </div>
                    <p className="text-xs font-medium text-ink-600">{d.note}</p>
                    <span className="f-btn f-btn--primary f-btn--sm f-btn--block mt-2">Build this meal</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          <p className="mt-8 max-w-[70ch] text-xs leading-relaxed text-ink-600">
            Prices exclusive of tax. Make-it-a-meal applies to burgers at checkout — pick the option inside any
            burger. Savings compare the meal-deal price with the same items ordered separately, at today&apos;s menu
            prices.
          </p>
        </div>

        {/* ── The one red band: free delivery ── */}
        <section className="bg-red text-cream">
          <div className="wrap py-24">
            <h2 className="f-heading max-w-[16ch] text-5xl !text-[var(--paper-0)] sm:text-7xl">
              Over {formatPKR(FREE_DELIVERY_ABOVE)}? It rides free.
            </h2>
            <p className="mt-4 max-w-[52ch] text-lg font-medium text-cream/85">
              Standard delivery is a flat {formatPKR(DELIVERY_FEE)}, anywhere we ride. Clear{" "}
              {formatPKR(FREE_DELIVERY_ABOVE)} and we cover it.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/menu" className="f-btn f-btn--cream f-btn--lg">
                Start an order
              </Link>
              <Link href="/locations" className="f-btn f-btn--on-red f-btn--lg">
                Where we deliver
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
      <ChatDock />
      <LocationGate />
    </>
  );
}
