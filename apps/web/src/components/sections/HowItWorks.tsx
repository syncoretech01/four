"use client";

import { BASE_DELIVERY_MINUTES, BRANCHES, DELIVERY_FEE, FREE_DELIVERY_ABOVE, LAHORE_AREAS, formatPKR } from "@four/shared";
import { useStore } from "@/lib/store";
import { HAND_MARK } from "../hero/logoPaths";
import { SectionHeader } from "../ds/SectionHeader";
import { PillCta } from "../ds/PillCta";
import { DoodleBackdrop } from "../ds/DoodleBackdrop";
import { Reveal } from "../ds/Reveal";

function Hand({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="180 100 700 900" className={className} aria-hidden>
      <g transform={HAND_MARK.transform}>
        <path d={HAND_MARK.d} fill="currentColor" />
      </g>
    </svg>
  );
}

/**
 * Dinevo's three-step "process" beat, done with colour-block tiles instead of
 * borrowed stock photos: red (white hand mark), yellow (doodles only), beige
 * (red hand mark) — the two approved hand-mark lockups and one accent tile.
 * Step one is a button that opens the delivery-area picker.
 */
export function HowItWorks() {
  const setLocationModalOpen = useStore((s) => s.setLocationModalOpen);

  const steps = [
    {
      no: "01",
      title: "Pick your block",
      copy: `${LAHORE_AREAS.length} areas, block-level. We route you to the nearest of ${BRANCHES.length} kitchens.`,
      tile: (
        <div className="f-media on-red relative isolate flex aspect-[4/3] items-center justify-center lg:aspect-[4/5]">
          <DoodleBackdrop />
          <Hand className="relative z-[1] w-24" />
        </div>
      ),
      offset: "",
      action: () => setLocationModalOpen(true),
    },
    {
      no: "02",
      title: "Build the order",
      copy: "Sizes, meal deals, extra patties. Simple things add in one tap.",
      tile: (
        <div className="f-media on-yellow relative isolate flex aspect-[4/3] items-center justify-center lg:aspect-[4/5]">
          <DoodleBackdrop tone="red" />
          <span className="relative z-[1] font-display text-[6rem] leading-none text-red" aria-hidden>
            +
          </span>
        </div>
      ),
      offset: "lg:mt-[120px]",
    },
    {
      no: "03",
      title: `Rider in ~${BASE_DELIVERY_MINUTES}`,
      copy: `Free over ${formatPKR(FREE_DELIVERY_ABOVE)}, otherwise ${formatPKR(DELIVERY_FEE)}. Track it live.`,
      tile: (
        <div className="f-media on-beige relative flex aspect-[4/3] items-center justify-center lg:aspect-[4/5] text-red">
          <Hand className="w-24" />
        </div>
      ),
      offset: "lg:mt-[60px]",
    },
  ];

  return (
    <section className="band">
      <div className="wrap">
        <SectionHeader title="Three taps to a very good night" highlight="good" tag="How it works" tag2={`~${BASE_DELIVERY_MINUTES} min`} />

        <ol className="mt-12 grid list-none gap-5 p-0 lg:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.no} className={s.offset}>
              <Reveal delay={i * 0.1}>
                {s.tile}
                <div className="mt-5 flex items-end justify-between gap-4">
                  <h3 className="f-heading f-heading--xs">
                    {s.action ? (
                      <button type="button" onClick={s.action} className="text-left uppercase hover:text-pink">
                        {s.title}
                      </button>
                    ) : (
                      s.title
                    )}
                  </h3>
                  <span className="f-ghost" aria-hidden>
                    {s.no}
                  </span>
                </div>
                <p className="mt-2 max-w-[36ch] text-ink-600">{s.copy}</p>
              </Reveal>
            </li>
          ))}
        </ol>

        <div className="mt-12 border-b border-rule pb-12">
          <PillCta href="/menu" tone="outline">
            Order now
          </PillCta>
        </div>
      </div>
    </section>
  );
}
