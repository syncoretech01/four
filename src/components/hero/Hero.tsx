"use client";

import { motion, useReducedMotion } from "motion/react";
import { BurgerBuild } from "./BurgerBuild";

export function Hero() {
  const reduce = useReducedMotion();
  const enter = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <section id="top" className="relative overflow-hidden pt-16">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl grid-cols-1 items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-4">
        <div className="order-2 lg:order-1">
          <motion.h1
            {...enter(0.05)}
            className="font-display text-5xl leading-[0.95] text-ink sm:text-6xl lg:text-7xl"
          >
            SMASHED,
            <br />
            STACKED, <span className="text-red">SERVED.</span>
          </motion.h1>
          <motion.p {...enter(0.18)} className="mt-6 max-w-[36ch] text-lg leading-relaxed text-ink-soft">
            Gourmet smash burgers and desi-fusion pizzas, made loud and fresh in Lahore.
          </motion.p>
          <motion.div {...enter(0.3)} className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#menu"
              className="rounded-full bg-red px-8 py-4 text-base font-semibold text-cream shadow-lg shadow-red/25 transition hover:bg-red-deep active:scale-[0.98]"
            >
              Order online
            </a>
            <a
              href="#menu"
              className="rounded-full border-2 border-ink/20 px-8 py-4 text-base font-semibold text-ink transition hover:border-ink active:scale-[0.98]"
            >
              See the menu
            </a>
          </motion.div>
        </div>

        <motion.div
          className="order-1 lg:order-2"
          initial={reduce ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <BurgerBuild />
        </motion.div>
      </div>
    </section>
  );
}
