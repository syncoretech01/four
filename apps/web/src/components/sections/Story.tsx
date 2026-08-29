"use client";

import { motion, useReducedMotion } from "motion/react";
import { SmartImage } from "../SmartImage";

export function Story() {
  const reduce = useReducedMotion();
  return (
    <section id="story" className="scroll-mt-20 bg-beige-deep/50 py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <motion.div
          initial={reduce ? false : { opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            Four creators.
            <br />
            One <span className="text-red">obsession.</span>
          </h2>
          <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-ink-soft">
            FOUR is owned by four of Pakistan&apos;s biggest creators, built on one promise: burgers worth the hype.
            Every 110g patty is smashed to order, every crown crust is stuffed by hand, every batch from scratch.
          </p>
          <p className="mt-4 max-w-[52ch] leading-relaxed text-ink-soft">
            From our kitchen at Fairways, DHA Phase 6, we deliver across Lahore.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 gap-4"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <SmartImage
            src="/gallery/gallery-1.jpg"
            alt="FOUR smash burgers fresh off the pass"
            fallbackLabel="F"
            className="aspect-[3/4] w-full rounded-card object-cover"
          />
          <SmartImage
            src="/gallery/gallery-2.jpg"
            alt="A FOUR crown crust pizza"
            fallbackLabel="O"
            className="mt-8 aspect-[3/4] w-full rounded-card object-cover"
          />
        </motion.div>
      </div>
    </section>
  );
}
