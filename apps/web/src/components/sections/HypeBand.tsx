"use client";

/**
 * Full-bleed red statement band between the story and the visit block. Does
 * real work (announces the three kitchens and drives the order) while giving
 * the page a loud colour-blocked beat. One accent (brand red), one radius
 * system, motion on scroll-in only.
 */
import { motion } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import { BRANCHES } from "@four/shared";

export function HypeBand() {
  const reduce = useReduceMotion();

  return (
    <section className="bg-red text-cream">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <motion.h2
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[16ch] font-display text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl"
        >
          Three kitchens. One Lahore obsession.
        </motion.h2>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-card border border-cream/20 bg-cream/20 sm:grid-cols-3">
          {BRANCHES.map((b, i) => (
            <motion.div
              key={b.id}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="bg-red p-8"
            >
              <span className="font-display text-6xl font-bold text-cream/25">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-4 font-display text-2xl font-bold">{b.shortName}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream/75">{b.address}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 flex flex-wrap items-center gap-4"
        >
          <a
            href="#menu"
            className="rounded-full bg-cream px-8 py-4 text-base font-bold text-red shadow-lg shadow-ink/20 transition hover:bg-white active:scale-[0.98]"
          >
            Order online
          </a>
          <button
            onClick={() => document.querySelector<HTMLButtonElement>("header [data-open-location]")?.click()}
            className="rounded-full border-2 border-cream/50 px-8 py-4 text-base font-bold text-cream transition hover:border-cream active:scale-[0.98]"
          >
            Check your block
          </button>
        </motion.div>
      </div>
    </section>
  );
}
