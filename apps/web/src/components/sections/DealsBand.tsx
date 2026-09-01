"use client";

/**
 * Full-bleed red value band - HypeBand's chassis (bordered hairline grid,
 * ghost numerals, cream/on-red CTAs, identical reveal timings) now selling
 * value instead of branches. Every number is a shared-constant import; the
 * branch cards moved to LocationsTeaser.
 */
import Link from "next/link";
import { motion } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import { DELIVERY_FEE, FREE_DELIVERY_ABOVE, HOURS_LABEL, MODIFIER_GROUPS, formatPKR } from "@four/shared";

const mealFrom = Math.min(
  ...(MODIFIER_GROUPS.find((g) => g.id === "meal-deal")?.options ?? []).map((o) =>
    typeof o.price === "number" ? o.price : Infinity,
  ),
);

const CELLS = [
  {
    title: "Make it a meal",
    copy: `Fries and a drink on any burger, from ${formatPKR(mealFrom)}. Cheaper than ordering them apart.`,
  },
  {
    title: "Free delivery",
    copy: `Orders over ${formatPKR(FREE_DELIVERY_ABOVE)} ride free. Under that, a flat ${formatPKR(DELIVERY_FEE)}.`,
  },
  {
    title: "Open late",
    copy: `${HOURS_LABEL}. The 2am order is a Lahore tradition — we honour it.`,
  },
];

export function DealsBand() {
  const reduce = useReduceMotion();

  return (
    <section className="bg-red text-cream">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <motion.h2
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="f-heading max-w-[16ch] text-5xl !text-[var(--paper-0)] sm:text-7xl"
        >
          More smash for your cash.
        </motion.h2>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-card border-2 border-paper-0 bg-paper-0/40 [box-shadow:var(--shadow-pop-red)] sm:grid-cols-3">
          {CELLS.map((c, i) => (
            <motion.div
              key={c.title}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="bg-red p-8"
            >
              <span className="font-display text-6xl font-bold text-cream/25">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-4 font-display text-2xl font-bold uppercase">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream/75">{c.copy}</p>
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
          <Link href="/deals" className="f-btn f-btn--cream f-btn--lg">
            See today&apos;s deals
          </Link>
          <Link href="/menu" className="f-btn f-btn--on-red f-btn--lg">
            Start an order
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
