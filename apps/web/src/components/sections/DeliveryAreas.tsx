"use client";

import Link from "next/link";
import { BRAND, BRANCHES, LAHORE_AREAS } from "@four/shared";
import { useStore } from "@/lib/store";
import { HAND_MARK } from "../hero/logoPaths";
import { SectionHeader } from "../ds/SectionHeader";
import { PillCta } from "../ds/PillCta";
import { Reveal } from "../ds/Reveal";

function Hand() {
  return (
    <svg viewBox="180 100 700 900" aria-hidden>
      <g transform={HAND_MARK.transform}>
        <path d={HAND_MARK.d} fill="currentColor" />
      </g>
    </svg>
  );
}

function areaNames(ids: string[], n = 3): string {
  const names = ids.map((id) => LAHORE_AREAS.find((a) => a.id === id)?.name).filter((x): x is string => Boolean(x));
  return names.slice(0, n).join(", ") + (names.length > n ? "…" : "");
}

/**
 * Dinevo's "delivery areas" cards, one per FOUR kitchen (keeps id="visit").
 * Thumbs alternate the two approved hand-mark lockups: white on red, red on
 * beige. A rail below 640px, a grid above.
 */
export function DeliveryAreas() {
  const setLocationModalOpen = useStore((s) => s.setLocationModalOpen);

  return (
    <section id="visit" className="band">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-rule pt-10">
          <SectionHeader title="Three kitchens. Every block covered." highlight="Every block" tag="We deliver" tag2={`${LAHORE_AREAS.length} areas`} />
          <PillCta tone="outline" onClick={() => setLocationModalOpen(true)}>
            Check my block
          </PillCta>
        </div>

        <ul className="f-cards-rail mt-10 list-none p-0 sm:grid sm:grid-cols-2 sm:gap-[var(--grid-gap)] lg:grid-cols-4">
          {BRANCHES.map((b, i) => (
            <li key={b.id} className="f-loc">
              <Reveal delay={i * 0.08} className="flex h-full flex-col">
                <div className={`f-loc__thumb ${i % 2 ? "f-loc__thumb--beige" : ""}`}>
                  <Hand />
                </div>
                <div className="f-loc__body flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="f-heading f-heading--xs">{b.shortName}</h3>
                    <span className="f-ghost text-[2.5rem]" aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-600">{b.address.replace(", Lahore", "")}</p>
                  <p className="mt-2 text-sm text-ink-600">
                    {b.areaIds.length} areas — {areaNames(b.areaIds)}
                  </p>
                  <Link href="/locations" className="f-btn f-btn--outline f-btn--sm mt-5 self-start">
                    View map
                  </Link>
                </div>
              </Reveal>
            </li>
          ))}
          <li className="f-loc on-cream">
            <Reveal delay={0.24} className="flex h-full flex-col">
              <div className="f-loc__body flex flex-1 flex-col justify-between gap-6">
                <div>
                  <h3 className="f-heading f-heading--xs">Not on the list?</h3>
                  <p className="mt-2 text-sm text-ink-600">
                    Call us and we&apos;ll tell you straight — and route you to the nearest kitchen if we can.
                  </p>
                </div>
                <a href={BRAND.phoneHref} className="f-btn f-btn--primary f-btn--sm self-start">
                  Call {BRAND.phone}
                </a>
              </div>
            </Reveal>
          </li>
        </ul>
      </div>
    </section>
  );
}
