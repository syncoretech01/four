"use client";

/**
 * Page-ending dark card (Visit's chassis, keeps id="visit") doing
 * chain-grade "find us" work: the three branches with a decorative DS map,
 * and a "delivery, decoded" column of the honest numbers. The full branch
 * finder lives at /locations - this is the teaser.
 */
import Link from "next/link";
import { motion } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import { useKitchenOpen } from "@/lib/useKitchenOpen";
import {
  BRAND,
  BRANCHES,
  HOURS_LABEL,
  LAHORE_AREAS,
  BASE_DELIVERY_MINUTES,
  FREE_RADIUS_KM,
} from "@four/shared";
import { useStore } from "@/lib/store";

// normalize branch coordinates into the decorative map's box (north up)
const lats = BRANCHES.map((b) => b.lat);
const lngs = BRANCHES.map((b) => b.lng);
const [latMin, latMax] = [Math.min(...lats), Math.max(...lats)];
const [lngMin, lngMax] = [Math.min(...lngs), Math.max(...lngs)];
const pinPos = (b: (typeof BRANCHES)[number]) => ({
  left: `${12 + ((b.lng - lngMin) / (lngMax - lngMin || 1)) * 70}%`,
  top: `${12 + (1 - (b.lat - latMin) / (latMax - latMin || 1)) * 62}%`,
});

export function LocationsTeaser() {
  const reduce = useReduceMotion();
  const kitchenOpen = useKitchenOpen();
  const setLocationModalOpen = useStore((s) => s.setLocationModalOpen);

  return (
    <section id="visit" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="f-card f-card--inverse overflow-hidden"
      >
        <div className="grid grid-cols-1 gap-10 p-10 sm:p-14 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="f-heading f-heading--lg">
              Three kitchens. Every block covered.
            </h2>

            <div className="mt-8 grid gap-5">
              {BRANCHES.map((b, i) => (
                <div key={b.id} className="flex items-start gap-4">
                  <span aria-hidden className="font-display text-3xl leading-none text-white/25">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-xl uppercase text-white">{b.shortName}</h3>
                    <p className="text-sm text-white/70">{b.address}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* decorative grid-paper map - the branch rows above carry the info */}
            <div aria-hidden className="f-map mt-8 hidden h-56 sm:block">
              <span className="f-map__road left-0 right-0 top-1/3 h-2" />
              <span className="f-map__road bottom-0 left-1/4 top-0 w-2" />
              <span className="f-map__road bottom-1/4 left-0 right-0 h-2" />
              {BRANCHES.map((b, i) => (
                <span key={b.id} className="f-pin" style={pinPos(b)}>
                  {i === 0 && <span className="f-pin__ping" />}
                  <span className="font-display text-sm">{i + 1}</span>
                  <span className="f-pin__label">{b.shortName}</span>
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/60">Delivery, decoded</h3>
            <ul className="mt-4 grid gap-3 text-sm leading-relaxed text-white/90">
              <li className="flex items-center gap-2.5">
                <span className={`f-dot f-dot--cream ${kitchenOpen ? "" : "f-dot--off"}`} aria-hidden>
                  {kitchenOpen && <span className="f-dot__ping" />}
                  <span className="f-dot__core" />
                </span>
                {HOURS_LABEL}
                {kitchenOpen ? " — open now" : ""}
              </li>
              <li>
                ~{BASE_DELIVERY_MINUTES} min inside {FREE_RADIUS_KM} km — honest windows beyond.
              </li>
              <li>{LAHORE_AREAS.length} areas across Lahore, routed to the nearest kitchen.</li>
              <li>
                <a
                  href={BRAND.phoneHref}
                  className="font-semibold underline-offset-4 transition hover:underline"
                >
                  {BRAND.phone}
                </a>
                {" · "}
                <a
                  href={BRAND.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline-offset-4 transition hover:underline"
                >
                  {BRAND.instagramHandle}
                </a>
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/locations" className="f-btn f-btn--primary f-btn--md">
                All locations &amp; hours
              </Link>
              <button onClick={() => setLocationModalOpen(true)} className="f-btn f-btn--on-red f-btn--md">
                Check your block
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
