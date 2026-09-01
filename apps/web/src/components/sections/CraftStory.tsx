"use client";

/**
 * The craft story - the section that turns "3-branch Lahore shop" into
 * "operation with standards". One headline thesis, three numbered method
 * rows, a photo collage that proves them, and a stat row of real numbers.
 * Inherits Story's proven bones: the alt-paper band, the giant kinetic "4",
 * and scroll-tied parallax that collapses under reduced motion.
 * Keeps id="story" so old /#story anchors still land.
 */
import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import { BASE_DELIVERY_MINUTES, BRANCHES, MENU_ITEMS } from "@four/shared";
import { SmartImage } from "../SmartImage";

const METHOD = [
  {
    no: "01",
    name: "The smash",
    copy: "110g, smashed to order, never off a warming rack. The lace edge is the proof.",
  },
  {
    no: "02",
    name: "The crown",
    copy: "Pizza crusts rolled and stuffed by hand — cheese, malai boti, seekh kebab — sealed every morning.",
  },
  {
    no: "03",
    name: "The sauce",
    copy: "FOUR sauce and every dip built from scratch in our own kitchens. No jars, no shortcuts.",
  },
];

const STATS = [
  { value: "110g", label: "smashed beef, per patty" },
  { value: `${BASE_DELIVERY_MINUTES} min`, label: "delivery promise, inside 5 km" },
  { value: `${BRANCHES.length}`, label: "kitchens across Lahore" },
  { value: `${MENU_ITEMS.length}`, label: "things on the menu, all from scratch" },
];

export function CraftStory() {
  const reduce = useReduceMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yA = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [60, -60]);
  const yB = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-40, 40]);

  return (
    <section id="story" ref={ref} className="relative scroll-mt-20 overflow-hidden bg-[var(--bg-page-alt)] py-28">
      {/* oversized brand numeral bleeding off the left edge */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-10 top-1/2 -translate-y-1/2 select-none font-display text-[26rem] font-bold leading-none text-red/[0.06] sm:text-[38rem]"
      >
        4
      </span>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <motion.div
          initial={reduce ? false : { opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="f-eyebrow">The craft</p>
          <h2 className="f-heading f-heading--lg sm:text-7xl">
            The smash is
            <br />
            the <span className="text-red">recipe.</span>
          </h2>
          <p className="f-lede">
            Every burger starts as a hand-rolled 110g ball of beef. It hits a screaming-hot plate, gets pressed once
            — hard — and comes off with an edge you can hear. We refuse to skip that step, so you get to taste it.
          </p>

          <div className="mt-8 grid gap-5">
            {METHOD.map((m, i) => (
              <motion.div
                key={m.no}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-start gap-4"
              >
                <span aria-hidden className="font-display text-4xl font-bold leading-none text-red/25">
                  {m.no}
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold uppercase text-ink-900">{m.name}</h3>
                  <p className="mt-1 max-w-[46ch] text-sm leading-relaxed text-ink-600">{m.copy}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/about" className="f-btn f-btn--primary f-btn--md">
              How we cook →
            </Link>
            <Link href="/menu" className="f-btn f-btn--quiet f-btn--sm">
              Browse the menu
            </Link>
          </div>
        </motion.div>

        <div className="relative grid grid-cols-2 gap-4 sm:gap-5">
          <motion.div style={{ y: yA }} className="relative mt-10">
            <div className="f-photo aspect-[3/4] -rotate-2 [box-shadow:var(--shadow-pop-lg)]">
              <SmartImage
                src="/home/craft-smash.jpg"
                alt="A FOUR smash burger, the patty's lace-crisp edge in focus"
                fallbackLabel="F"
                className="h-full w-full"
              />
            </div>
            <span className="f-badge f-badge--accent absolute -left-2 top-5 -rotate-3 motion-safe:animate-float">
              Smashed to order
            </span>
          </motion.div>
          <motion.div style={{ y: yB }}>
            <div className="f-photo f-photo--field-butter aspect-[4/5] rotate-2 [box-shadow:var(--shadow-pop-lg)]">
              <SmartImage
                src="/home/craft-tray.jpg"
                alt="Loaded fries in a FOUR tray"
                fallbackLabel="O"
                className="h-full w-full"
              />
            </div>
          </motion.div>
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.9, rotate: 6 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 3 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.55, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute -bottom-8 left-1/2 hidden w-44 -translate-x-1/2 sm:block"
          >
            <div className="f-photo aspect-square [box-shadow:var(--shadow-pop-lg)]">
              <SmartImage
                src="/home/craft-crown.jpg"
                alt="A hand-stuffed crown crust pizza"
                fallbackLabel="U"
                className="h-full w-full"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* the craft numbers - every figure imported, nothing typed in */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-card border-2 border-ink-900 bg-ink-900/15 [box-shadow:var(--shadow-pop-lg)] sm:grid-cols-4"
        >
          {STATS.map((s) => (
            <div key={s.label} className="bg-paper-0 px-5 py-6">
              <span className="block font-display text-4xl font-bold uppercase leading-none text-red sm:text-5xl">
                {s.value}
              </span>
              <span className="mt-1.5 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-ink-600">
                {s.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
