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
import { PageTitleBand } from "@/components/ds/PageTitleBand";
import { SectionHeader } from "@/components/ds/SectionHeader";
import { PillCta } from "@/components/ds/PillCta";
import { PriceTag } from "@/components/ds/PriceTag";
import { Reveal } from "@/components/ds/Reveal";
import { DoodleBackdrop } from "@/components/ds/DoodleBackdrop";

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
        {/* ── Title band ── */}
        <PageTitleBand
          title="Deals"
          tag="Meal deals"
          tag2={`From ${formatPKR(MEAL_DEAL_FROM)}`}
          lede={
            <>
              Add fries and a drink to any burger from {formatPKR(MEAL_DEAL_FROM)} — here&apos;s exactly what the math
              saves you.
            </>
          }
        />

        {/* ── Deal grid (the page's cream band) ── */}
        <section className="on-cream relative isolate">
          <DoodleBackdrop tone="red" edges />
          <div className="wrap band relative z-[1]">
            <div className="grid items-start grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:[&>*:nth-child(3n+2)]:mt-[120px] xl:[&>*:nth-child(3n)]:my-[140px]">
              {deals.map((d, i) => (
                <Reveal key={d.id} delay={Math.min(i * 0.08, 0.32)}>
                <article className="f-item f-item--deal">
                  <Link href={d.href} className="flex flex-1 flex-col" aria-label={`${d.name}, ${formatPKR(d.dealPrice)} - build this meal`}>
                    <div className="f-item__media">
                      <SmartImage src={`/menu-items/${d.itemId}.jpg`} alt={d.name} fallbackLabel={d.name} className="h-full w-full" />
                      <span className="f-tag f-tag--red f-tag--card absolute left-5 top-5">{d.badge}</span>
                    </div>
                    <div className="f-item__body">
                      <h2 className="f-item__name">{d.name}</h2>
                      <p className="mt-1.5 text-sm font-medium text-ink-600">{d.composition}</p>
                      <p className="mt-2 text-xs text-ink-600">{d.note}</p>
                    </div>
                    <div className="f-item__foot mt-auto pt-7">
                      <span className="f-btn f-btn--secondary f-btn--sm">Build this meal</span>
                      <span className="flex items-center gap-2">
                        {d.strikePrice && <span className="f-tag f-tag--struck">{formatPKR(d.strikePrice)}</span>}
                        <PriceTag price={d.dealPrice} />
                      </span>
                    </div>
                  </Link>
                </article>
                </Reveal>
              ))}
            </div>

            <p className="mt-10 max-w-[70ch] text-xs leading-relaxed text-ink-600">
              Prices exclusive of tax. Make-it-a-meal applies to burgers at checkout — pick the option inside any
              burger. Savings compare the meal-deal price with the same items ordered separately, at today&apos;s menu
              prices.
            </p>
          </div>
        </section>

        {/* ── The one red band: free delivery ── */}
        <section className="band">
          <div className="wrap">
            <div className="on-red relative isolate overflow-hidden rounded-[20px] px-6 py-16 sm:px-12">
              <DoodleBackdrop />
              <div className="relative z-[1]">
            <SectionHeader
              title={`Over ${formatPKR(FREE_DELIVERY_ABOVE)}? It rides free.`}
              highlight="free"
              lede={
                <>
                  Standard delivery is a flat {formatPKR(DELIVERY_FEE)}, anywhere we ride. Clear{" "}
                  {formatPKR(FREE_DELIVERY_ABOVE)} and we cover it.
                </>
              }
            />
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <PillCta href="/menu" size="lg">
                Start an order
              </PillCta>
              <PillCta href="/locations" tone="on-red" arrow={false} size="lg">
                Where we deliver
              </PillCta>
            </div>
              </div>
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
