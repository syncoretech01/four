"use client";

import { motion } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import { BRAND, HOURS_LABEL } from "@four/shared";

export function Visit() {
  const reduce = useReduceMotion();
  return (
    <section id="visit" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-6">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="f-card f-card--inverse overflow-hidden"
      >
        <div className="grid grid-cols-1 gap-10 p-10 sm:p-14 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="f-heading f-heading--lg !text-[var(--paper-0)] sm:text-5xl">Come say hello</h2>
            <p className="mt-4 max-w-[50ch] text-cream/70">
              Dine in with us at Fairways, or get FOUR delivered to your block anywhere we ride.
            </p>
            <address className="mt-8 grid gap-2 not-italic text-cream/90">
              <span className="text-lg font-semibold">FOUR - {BRAND.address}</span>
              <a
                href={BRAND.phoneHref}
                className="w-fit text-lg font-semibold text-cream underline-offset-4 transition hover:underline"
              >
                {BRAND.phone}
              </a>
              <span className="text-cream/80">{HOURS_LABEL}</span>
              <a
                href={BRAND.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit font-semibold text-cream underline-offset-4 transition hover:underline"
              >
                {BRAND.instagramHandle}
              </a>
            </address>
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-paper-0/60">We deliver to</h3>
            <p className="mt-3 leading-relaxed text-cream/90">
              DHA Phases 1-8, Gulberg 1-3, Model Town, Allama Iqbal Town, Johar Town, Wapda Town, Faisal Town, Garden
              Town, Township, Valencia, Bahria Town, Cantt and more.
            </p>
            <button
              onClick={() => document.querySelector<HTMLButtonElement>("header [data-open-location]")?.click()}
              className="f-btn f-btn--primary f-btn--md mt-6 !border-[var(--paper-0)]"
            >
              Check your block
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
