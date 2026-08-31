"use client";

/**
 * The origin story, loud: a giant kinetic "4" anchors the headline while a
 * loosely-stacked photo collage parallaxes on scroll. Motion is scroll-tied
 * (useScroll, no scroll listeners) and collapses to static under reduced
 * motion.
 */
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import { SmartImage } from "../SmartImage";

export function Story() {
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
          <p className="f-eyebrow">The story</p>
          <h2 className="f-heading f-heading--lg sm:text-6xl">
            Four creators.
            <br />
            One <span className="text-red">obsession.</span>
          </h2>
          <p className="f-lede">
            FOUR is owned by four of Pakistan&apos;s biggest creators, built on one promise: burgers worth the hype.
            Every 110g patty smashed to order, every crown crust stuffed by hand, every batch from scratch.
          </p>
          <p className="mt-4 max-w-[50ch] leading-relaxed text-ink-600">
            From our kitchens across Lahore, straight to your block.
          </p>
        </motion.div>

        <div className="relative grid grid-cols-2 gap-4 sm:gap-5">
          <motion.div style={{ y: yA }} className="mt-10">
            <SmartImage
              src="/gallery/gallery-1.jpg"
              alt="FOUR smash burgers fresh off the pass"
              fallbackLabel="F"
              className="aspect-[3/4] w-full -rotate-2 rounded-card border-2 border-ink-900 object-cover [box-shadow:var(--shadow-pop-lg)] [filter:saturate(1.12)_contrast(1.06)_sepia(.06)]"
            />
          </motion.div>
          <motion.div style={{ y: yB }}>
            <SmartImage
              src="/gallery/gallery-2.jpg"
              alt="A FOUR crown crust pizza"
              fallbackLabel="O"
              className="aspect-[3/4] w-full rotate-2 rounded-card border-2 border-ink-900 object-cover [box-shadow:var(--shadow-pop-lg)] [filter:saturate(1.12)_contrast(1.06)_sepia(.06)]"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
