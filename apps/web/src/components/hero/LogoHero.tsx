"use client";

/**
 * Signature hero, loud edition: the exact FOUR wordmark still assembles
 * itself (each letter outline draws in, then floods with fill) and stays
 * cursor-reactive in 3D. Around it, brand energy: a warm colour-blocked
 * ground, the hero food shot on a red blob with a floating hand sticker and
 * a spinning promise seal, a live "open now" pill, and a springy entrance.
 * All wordmark/hand artwork is the untouched brand vector.
 */
import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import { isOpenAt } from "@four/shared";
import { LETTER_F, LETTER_O, LETTER_U, LETTER_R, HAND_MARK } from "./logoPaths";
import { RotatingSeal } from "./RotatingSeal";

const LETTERS = [
  { path: LETTER_F, depth: 0.5 },
  { path: LETTER_O, depth: 1.2 },
  { path: LETTER_U, depth: 0.8 },
  { path: LETTER_R, depth: 0.55 },
];

export function LogoHero() {
  const reduce = useReduceMotion();
  const [drawn, setDrawn] = useState(false);
  const [open, setOpen] = useState(true);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 55, damping: 16 });
  const sy = useSpring(my, { stiffness: 55, damping: 16 });
  const tiltX = useTransform(sy, (v) => v * -0.35);
  const tiltY = useTransform(sx, (v) => v * 0.45);

  useEffect(() => {
    setOpen(isOpenAt());
    if (reduce) {
      setDrawn(true);
      return;
    }
    const t = setTimeout(() => setDrawn(true), 1600);
    return () => clearTimeout(t);
  }, [reduce]);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - rect.left) / rect.width - 0.5) * 22);
    my.set(((e.clientY - rect.top) / rect.height - 0.5) * 14);
  };

  return (
    <section id="top" className="relative overflow-hidden pt-16">
      {/* colour-blocked ground: soft brand-red bloom, never a flat beige void */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 top-10 h-[38rem] w-[38rem] rounded-full bg-red/10 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-red/5 blur-2xl" />
      </div>

      <div
        onPointerMove={reduce ? undefined : onPointerMove}
        onPointerLeave={() => {
          mx.set(0);
          my.set(0);
        }}
        className="relative mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl grid-cols-1 items-center gap-8 px-4 pb-28 pt-6 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:pb-10"
      >
        <div className="order-2 lg:order-1">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="f-livepill mb-6"
          >
            <span className="relative flex h-2.5 w-2.5">
              {open && (
                <span className="absolute inline-flex h-full w-full rounded-full bg-red opacity-60 motion-safe:animate-ping" />
              )}
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${open ? "bg-red" : "bg-ink/30"}`} />
            </span>
            {open ? "Open now · delivering till 3am" : "Opens 1pm · order ahead"}
          </motion.div>

          <motion.div
            style={reduce ? undefined : { rotateX: tiltX, rotateY: tiltY, transformPerspective: 900 }}
            className="max-w-[34rem] lg:max-w-none"
          >
            <svg viewBox="95 340 890 340" className="w-full max-w-[26rem] sm:max-w-lg lg:max-w-xl" role="img" aria-label="FOUR">
              {LETTERS.map(({ path, depth }, i) => (
                <HeroLetter key={i} path={path} depth={depth} index={i} sx={sx} sy={sy} drawn={drawn} reduce={!!reduce} />
              ))}
            </svg>
          </motion.div>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="f-lede mt-6 max-w-[34ch] sm:text-xl"
          >
            Smash burgers, crown crust pizzas and loaded fries by Pakistan&apos;s biggest creators.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <MagneticCta href="#menu" primary reduce={!!reduce}>
              Order online
            </MagneticCta>
            <MagneticCta href="#menu" reduce={!!reduce}>
              See the menu
            </MagneticCta>
          </motion.div>
        </div>

        <div className="order-1 lg:order-2">
          <HeroCard sx={sx} sy={sy} reduce={!!reduce} />
        </div>
      </div>
    </section>
  );
}

/** CTA that leans toward the cursor - motion values only, never React state. */
function MagneticCta({
  href,
  children,
  primary = false,
  reduce,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
  reduce: boolean;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 18 });
  const sy = useSpring(y, { stiffness: 300, damping: 18 });

  return (
    <motion.a
      href={href}
      style={reduce ? undefined : { x: sx, y: sy }}
      onPointerMove={
        reduce
          ? undefined
          : (e) => {
              const r = e.currentTarget.getBoundingClientRect();
              x.set(((e.clientX - r.left) / r.width - 0.5) * 14);
              y.set(((e.clientY - r.top) / r.height - 0.5) * 10);
            }
      }
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      whileTap={{ scale: 0.96 }}
      className={
        primary
          ? "f-btn f-btn--primary f-btn--lg"
          : "f-btn f-btn--secondary f-btn--lg"
      }
    >
      {children}
    </motion.a>
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
        {!reduce && (
          <motion.path
            d={path.d}
            fill="none"
            stroke="#9d1d20"
            strokeWidth={6}
            initial={{ pathLength: 0, opacity: 1 }}
            animate={{ pathLength: 1, opacity: drawn ? 0 : 1 }}
            transition={{
              pathLength: { delay: index * 0.2, duration: 1, ease: "easeInOut" },
              opacity: { duration: 0.4 },
            }}
          />
        )}
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

/** Hero food photo on a red blob, with the magnetic hand sticker + spinning seal. */
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
  const rot = useTransform(sx, (v: number) => -6 + v * 0.5);

  return (
    <motion.div
      className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-none"
      initial={reduce ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* red blob behind the food - full brand colour, not a flat card */}
      <div
        aria-hidden
        className="absolute inset-3 -rotate-6 rounded-[42%_58%_54%_46%/47%_44%_56%_53%] bg-red"
      />
      <motion.div
        style={reduce ? undefined : { x: px, y: py }}
        className="relative overflow-hidden rounded-hero border-4 border-paper-0 outline-2 outline-ink-900 [box-shadow:var(--shadow-pop-lg)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/gallery/gallery-3.jpg"
          alt="A FOUR smash burger, fresh off the pass"
          className="aspect-square w-full object-cover [filter:saturate(1.12)_contrast(1.06)_sepia(.06)]"
        />
      </motion.div>

      <motion.svg
        viewBox="180 100 700 900"
        aria-hidden
        className="absolute -bottom-8 -left-8 h-32 w-32 [filter:drop-shadow(4px_6px_0_rgba(34,25,19,0.9))] sm:h-40 sm:w-40"
        style={reduce ? undefined : { x: hx, y: hy, rotate: rot }}
        animate={reduce ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <g transform={HAND_MARK.transform}>
          <path d={HAND_MARK.d} fill="#f6efe1" />
        </g>
      </motion.svg>

      <div className="absolute -right-4 -top-6 h-24 w-24 rounded-full border-2 border-ink-900 bg-paper-0 p-2 [box-shadow:var(--shadow-pop)] sm:-right-8 sm:h-28 sm:w-28">
        <RotatingSeal />
      </div>
    </motion.div>
  );
}
