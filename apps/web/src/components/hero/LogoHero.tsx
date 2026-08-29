"use client";

/**
 * Signature hero: the exact FOUR wordmark assembles itself - each letter's
 * outline draws in (pathLength), fills flood in, then the whole mark
 * becomes cursor-reactive: springs tilt it in 3D and each letter parallaxes
 * by its own depth, so the logo feels alive under the pointer. The hand
 * doodle floats beside the hero food shot as a sticker with its own
 * magnetic response. All artwork is the untouched brand vector.
 */
import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "motion/react";
import { LETTER_F, LETTER_O, LETTER_U, LETTER_R, HAND_MARK } from "./logoPaths";

const LETTERS = [
  { path: LETTER_F, depth: 0.5 },
  { path: LETTER_O, depth: 1.2 },
  { path: LETTER_U, depth: 0.8 },
  { path: LETTER_R, depth: 0.55 },
];

export function LogoHero() {
  const reduce = useReducedMotion();
  const [drawn, setDrawn] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 55, damping: 16 });
  const sy = useSpring(my, { stiffness: 55, damping: 16 });
  const tiltX = useTransform(sy, (v) => v * -0.35);
  const tiltY = useTransform(sx, (v) => v * 0.45);

  useEffect(() => {
    if (reduce) {
      setDrawn(true);
      return;
    }
    const t = setTimeout(() => setDrawn(true), 1700);
    return () => clearTimeout(t);
  }, [reduce]);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - rect.left) / rect.width - 0.5) * 22);
    my.set(((e.clientY - rect.top) / rect.height - 0.5) * 14);
  };

  return (
    <section id="top" className="relative overflow-hidden pt-16">
      <div
        onPointerMove={onPointerMove}
        onPointerLeave={() => {
          mx.set(0);
          my.set(0);
        }}
        className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl grid-cols-1 items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.15fr_1fr]"
      >
        <div className="order-2 lg:order-1">
          <motion.div style={reduce ? undefined : { rotateX: tiltX, rotateY: tiltY, transformPerspective: 900 }}>
            <svg viewBox="95 340 890 340" className="w-full max-w-xl" role="img" aria-label="FOUR">
              {LETTERS.map(({ path, depth }, i) => (
                <HeroLetter key={i} path={path} depth={depth} index={i} sx={sx} sy={sy} drawn={drawn} reduce={!!reduce} />
              ))}
            </svg>
          </motion.div>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-[38ch] text-lg leading-relaxed text-ink-soft"
          >
            Smash burgers, crown crust pizzas and loaded fries by Pakistan&apos;s biggest creators.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.45, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <a
              href="#menu"
              className="rounded-full bg-red px-8 py-4 text-base font-semibold text-cream shadow-lg shadow-red/25 transition hover:bg-red-deep active:scale-[0.98]"
            >
              Order online
            </a>
            <a
              href="#menu"
              className="rounded-full border-2 border-ink/25 px-8 py-4 text-base font-semibold text-ink transition hover:border-ink active:scale-[0.98]"
            >
              See the menu
            </a>
          </motion.div>
        </div>

        <div className="order-1 lg:order-2">
          <HeroCard sx={sx} sy={sy} reduce={!!reduce} />
        </div>
      </div>
    </section>
  );
}

function HeroLetter({
  path,
  depth,
  index,
  sx,
  sy,
  drawn,
  reduce,
}: {
  path: { transform: string; d: string };
  depth: number;
  index: number;
  sx: ReturnType<typeof useSpring>;
  sy: ReturnType<typeof useSpring>;
  drawn: boolean;
  reduce: boolean;
}) {
  const x = useTransform(sx, (v: number) => v * depth);
  const y = useTransform(sy, (v: number) => v * depth * 0.6);

  return (
    <motion.g style={reduce ? undefined : { x, y }}>
      <g transform={path.transform}>
        {/* outline draws in first... */}
        {!reduce && (
          <motion.path
            d={path.d}
            fill="none"
            stroke="#9d1d20"
            strokeWidth={6}
            initial={{ pathLength: 0, opacity: 1 }}
            animate={{ pathLength: 1, opacity: drawn ? 0 : 1 }}
            transition={{
              pathLength: { delay: index * 0.22, duration: 1.1, ease: "easeInOut" },
              opacity: { duration: 0.4 },
            }}
          />
        )}
        {/* ...then the fill floods in */}
        <motion.path
          d={path.d}
          fill="#9d1d20"
          initial={reduce ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: drawn || reduce ? 1 : 0, scale: 1 }}
          transition={{ delay: reduce ? 0 : 0.15 + index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </g>
    </motion.g>
  );
}

/** Hero food photo with the hand mark as a cursor-magnetic sticker. */
function HeroCard({
  sx,
  sy,
  reduce,
}: {
  sx: ReturnType<typeof useSpring>;
  sy: ReturnType<typeof useSpring>;
  reduce: boolean;
}) {
  const px = useTransform(sx, (v: number) => v * -0.8);
  const py = useTransform(sy, (v: number) => v * -0.8);
  const hx = useTransform(sx, (v: number) => v * 1.8);
  const hy = useTransform(sy, (v: number) => v * 1.4);
  const rot = useTransform(sx, (v: number) => -8 + v * 0.5);

  return (
    <motion.div
      className="relative mx-auto max-w-md lg:max-w-none"
      initial={reduce ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div style={reduce ? undefined : { x: px, y: py }} className="overflow-hidden rounded-[2rem] shadow-2xl shadow-ink/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/gallery/gallery-3.jpg" alt="A FOUR smash burger, fresh off the pass" className="aspect-[4/5] w-full object-cover sm:aspect-square" />
      </motion.div>
      <motion.svg
        viewBox="180 100 700 900"
        aria-hidden
        className="absolute -bottom-10 -left-10 h-36 w-36 drop-shadow-[0_10px_18px_rgba(38,32,26,0.3)] sm:h-44 sm:w-44"
        style={reduce ? undefined : { x: hx, y: hy, rotate: rot }}
        animate={reduce ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <g transform={HAND_MARK.transform}>
          <path d={HAND_MARK.d} fill="#f6efe1" />
        </g>
      </motion.svg>
    </motion.div>
  );
}
