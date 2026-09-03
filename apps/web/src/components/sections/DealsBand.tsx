"use client";

/**
 * Dinevo's "meal deals" band on cream: three of the six real deals from
 * lib/deals.ts as yellow cards in the staggered grid. Every price is derived;
 * a renamed menu item fails the build instead of shipping a wrong number.
 */
import Link from "next/link";
import { formatPKR } from "@four/shared";
import { buildDeals, MEAL_DEAL_FROM } from "@/lib/deals";
import { SmartImage } from "../SmartImage";
import { SectionHeader } from "../ds/SectionHeader";
import { PillCta } from "../ds/PillCta";
import { PriceTag } from "../ds/PriceTag";
import { DoodleBackdrop } from "../ds/DoodleBackdrop";
import { Reveal } from "../ds/Reveal";

const FEATURED = ["new-york-meal", "pizza-night", "squad-order"];
const DEALS = buildDeals().filter((d) => FEATURED.includes(d.id));

export function DealsBand() {
  return (
    <section className="on-cream band relative isolate">
      <DoodleBackdrop tone="red" edges />
      <div className="wrap relative z-[1]">
        <SectionHeader
          align="center"
          title="More smash for your cash"
          highlight="smash"
          tag="Meal deals"
          tag2="Save"
          lede={`Fries and a drink on any burger from ${formatPKR(MEAL_DEAL_FROM)}. Cheaper than ordering them apart — we checked.`}
        />

        <div className="mt-12 grid gap-[var(--grid-gap)] sm:grid-cols-2 xl:grid-cols-3 xl:[&>*:nth-child(3n)]:my-[140px] xl:[&>*:nth-child(3n+2)]:mt-[120px]">
          {DEALS.map((d, i) => (
            <Reveal key={d.id} delay={i * 0.08}>
              <article className="f-item f-item--deal h-full">
                <Link href={d.href} className="block" aria-label={`${d.name}, ${formatPKR(d.dealPrice)} - build this meal`}>
                  <div className="f-item__media">
                    <SmartImage src={`/menu-items/${d.itemId}.jpg`} alt="" fallbackLabel={d.name} className="h-full w-full" />
                    <span className="f-tag f-tag--red f-tag--card absolute left-5 top-5">{d.badge}</span>
                  </div>
                  <div className="f-item__body">
                    <h3 className="f-item__name">{d.name}</h3>
                    <p className="f-item__desc">{d.composition}</p>
                    <p className="mt-2 text-sm text-red-press">{d.note}</p>
                  </div>
                </Link>
                <div className="f-item__foot">
                  <Link href={d.href} className="f-btn f-btn--secondary f-btn--sm">
                    Build this meal
                  </Link>
                  <span className="flex items-center gap-2">
                    {d.strikePrice && <span className="f-tag f-tag--struck">{formatPKR(d.strikePrice)}</span>}
                    <PriceTag price={d.dealPrice} />
                  </span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <PillCta href="/deals" tone="outline">
            All deals
          </PillCta>
        </div>
      </div>
    </section>
  );
}
