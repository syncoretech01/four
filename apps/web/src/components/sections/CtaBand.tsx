"use client";

import { BRAND } from "@four/shared";
import { useKitchenOpen } from "@/lib/useKitchenOpen";
import { CLOSES_LABEL, OPENS_LABEL } from "@/lib/hours";
import { SectionHeader } from "../ds/SectionHeader";
import { PillCta } from "../ds/PillCta";

/**
 * Dinevo's closing CTA: a photo card under a red overlay with the pill and a
 * ringed phone button. Open/closed copy follows the kitchen's hours.
 */
export function CtaBand() {
  const open = useKitchenOpen();
  return (
    <section className="band">
      <div className="wrap">
        <div className="on-photo flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-[20px] px-6 py-[90px] text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/about/burger-spread.jpg" alt="" loading="lazy" />
          <div className="relative z-[1] flex flex-col items-center">
            <SectionHeader as="p" align="center" title="It's never too late for a smash" highlight="late" tag="Hungry?" />
            <p className="mt-5 text-base text-white/85">
              {open ? `Open now — till ${CLOSES_LABEL}.` : `Opens ${OPENS_LABEL}. Build your order now and place it then.`}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
              <PillCta href="/menu">Order now</PillCta>
              <a href={BRAND.phoneHref} className="inline-flex items-center gap-4 text-white hover:text-yellow">
                <span className="grid h-[50px] w-[50px] place-items-center rounded-full border border-white/20">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="font-display text-2xl uppercase">{BRAND.phone}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
