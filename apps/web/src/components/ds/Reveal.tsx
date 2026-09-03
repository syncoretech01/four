"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useReduceMotion } from "@/lib/useAnim";

/**
 * Scroll-in wrapper (fade + 24px rise, once). Always the OUTER element: motion
 * writes `transform` inline, which would flatten any CSS hover transform on the
 * styled child (see ItemCard).
 */
export function Reveal({ children, delay = 0, amount = 0.2, className }: { children: ReactNode; delay?: number; amount?: number; className?: string }) {
  const reduce = useReduceMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
