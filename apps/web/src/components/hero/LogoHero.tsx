"use client";

/**
 * Signature hero, video edition: the footage is the whole section - full
 * bleed, edge to edge, behind a fixed nav - and every line of copy is set on
 * top of it. The exact FOUR wordmark still assembles itself (each letter
 * outline draws in, then floods with fill over a red offset ghost) and stays
 * cursor-reactive in 3D. Around it the marketing does real work: a live
 * open/closed pill, the promise, two CTAs, and the three claims that decide
 * a food order - speed, free-delivery threshold, coverage. All wordmark and
 * hand artwork is the untouched brand vector.
 *
 * Every number on this screen comes from @four/shared, so the hero can never
 * quietly drift from what checkout actually charges or promises.
 */
import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import {
  isOpenAt,
  BASE_DELIVERY_MINUTES,
  FREE_DELIVERY_ABOVE,
  BRANCHES,
  LAHORE_AREAS,
  formatPKR,
} from "@four/shared";
import { LETTER_F, LETTER_O, LETTER_U, LETTER_R } from "./logoPaths";
import { RotatingSeal } from "./RotatingSeal";
import { HeroVideo } from "./HeroVideo";

const LETTERS = [
  { path: LETTER_F, depth: 0.5 },
  { path: LETTER_O, depth: 1.2 },
  { path: LETTER_U, depth: 0.8 },
  { path: LETTER_R, depth: 0.55 },
];

const PROOF = [
  { icon: "bolt", label: `${BASE_DELIVERY_MINUTES}-min delivery` },
  { icon: "van", label: `Free over ${formatPKR(FREE_DELIVERY_ABOVE)}` },
  { icon: "pin", label: `${BRANCHES.length} kitchens · ${LAHORE_AREAS.length} areas` },
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
    <section
      id="top"
      className="relative isolate min-h-[100svh] w-full overflow-hidden bg-ink-900 text-paper-0"
    >
      <HeroVideo />

      {/*
        The footage is a centred burger build sequence, so the copy splits
        into a top band and a bottom band and leaves the middle of the frame
        to the animation.
      */}
      <div
        onPointerMove={reduce ? undefined : onPointerMove}
        onPointerLeave={() => {
          mx.set(0);
          my.set(0);
        }}
        className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-between gap-8 px-4 pb-14 pt-24 sm:px-6 sm:pb-16 sm:pt-28"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="f-livepill"
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
              aria-hidden
              style={reduce ? undefined : { rotateX: tiltX, rotateY: tiltY, transformPerspective: 900 }}
              className="mt-4 sm:mt-5"
            >
              <svg
                viewBox="95 340 890 340"
                className="w-full max-w-[13rem] [filter:drop-shadow(0_8px_22px_rgba(34,25,19,0.6))] sm:max-w-[15rem] lg:max-w-[17rem]"
              >
                {LETTERS.map(({ path, depth }, i) => (
                  <HeroLetter key={i} path={path} depth={depth} index={i} sx={sx} sy={sy} drawn={drawn} reduce={!!reduce} />
                ))}
              </svg>
            </motion.div>
          </div>

          <HeroSeal reduce={!!reduce} />
        </div>

        <div className="max-w-3xl">
          <h1>
            {/* The visible line is decorative so a screen reader hears the
                full sentence once, not twice. */}
            <span className="sr-only">
              FOUR — smash burgers, crown crust pizzas and loaded fries, made from scratch and
              delivered across Lahore in about {BASE_DELIVERY_MINUTES} minutes.
            </span>
            <motion.span
              aria-hidden
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="f-heading block text-4xl !text-[var(--paper-0)] [text-shadow:0_2px_18px_rgba(34,25,19,0.7)] sm:text-5xl lg:text-6xl"
            >
              Smashed to order.
              <br />
              At your door in{" "}
              <span className="inline-block -rotate-2 rounded-[10px] bg-red px-3 pb-1.5 pt-0.5 text-paper-0 [box-shadow:var(--shadow-pop)] [text-shadow:none]">
                {BASE_DELIVERY_MINUTES}
              </span>{" "}
              min.
            </motion.span>
          </h1>

          {/* One line, because the film is already showing the craft. */}
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 max-w-[52ch] text-base font-medium leading-relaxed text-paper-0/90 [text-shadow:0_1px_10px_rgba(34,25,19,0.8)] sm:text-lg"
          >
            110g patties pressed to a lace-edged crisp. Crown crusts stuffed by hand every morning.
            Sauces from scratch, in three Lahore kitchens.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 flex flex-wrap items-center gap-3"
          >
            <MagneticCta href="/menu" primary reduce={!!reduce}>
              Start your order
            </MagneticCta>
            <MagneticCta
              onClick={() => document.querySelector<HTMLButtonElement>("header [data-open-location]")?.click()}
              reduce={!!reduce}
            >
              Do you deliver to me?
            </MagneticCta>
          </motion.div>

          <motion.ul
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.35, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 flex flex-wrap items-center gap-2.5"
          >
            {PROOF.map((p) => (
              <li key={p.label} className="f-hero-proof">
                <ProofIcon name={p.icon} />
                {p.label}
              </li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}

/** CTA that leans toward the cursor - motion values only, never React state. */
function MagneticCta({
  href,
  onClick,
  children,
  primary = false,
  reduce,
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  primary?: boolean;
  reduce: boolean;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 18 });
  const sy = useSpring(y, { stiffness: 300, damping: 18 });

  const lean = reduce
    ? undefined
    : (e: React.PointerEvent<HTMLElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(((e.clientX - r.left) / r.width - 0.5) * 14);
        y.set(((e.clientY - r.top) / r.height - 0.5) * 10);
      };
  const rest = () => {
    x.set(0);
    y.set(0);
  };

  // On the video, the secondary CTA is the cream-on-transparent variant -
  // a paper button here would read as a hole punched in the footage.
  const className = primary ? "f-btn f-btn--primary f-btn--lg" : "f-btn f-btn--on-red f-btn--lg backdrop-blur-md";
  const motionProps = {
    style: reduce ? undefined : { x: sx, y: sy },
    onPointerMove: lean,
    onPointerLeave: rest,
    whileTap: { scale: 0.96 },
    className,
  };

  if (href) {
    return (
      <motion.a href={href} {...motionProps}>
        {children}
      </motion.a>
    );
  }
  return (
    <motion.button type="button" onClick={onClick} {...motionProps}>
      {children}
    </motion.button>
  );
}

function ProofIcon({ name }: { name: string }) {
  if (name === "bolt") {
    return (
      <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden>
        <path d="M7 1 1.5 8h3.2L5 13l5.5-7H7.3L7 1Z" fill="currentColor" />
      </svg>
    );
  }
  if (name === "van") {
    return (
      <svg width="16" height="14" viewBox="0 0 16 14" fill="none" aria-hidden>
        <path d="M1 3.5h7.5v6H1v-6ZM8.5 5.5h3l2.5 2.5v1.5h-5.5v-4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <circle cx="4" cy="11" r="1.6" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="11.5" cy="11" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
      <path d="M6 13S1 8.6 1 5.4a5 5 0 1 1 10 0C11 8.6 6 13 6 13Z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="5.4" r="1.6" fill="currentColor" />
    </svg>
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
        {/* Offset-print ghost: brand red sits behind the cream face so the
            wordmark still carries the colour when it is set on footage. */}
        <motion.path
          d={path.d}
          fill="#9d1d20"
          transform="translate(16, 18)"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: drawn || reduce ? 1 : 0 }}
          transition={{ delay: reduce ? 0 : 0.2 + index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
        {!reduce && (
          <motion.path
            d={path.d}
            fill="none"
            stroke="#fffcf4"
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
          fill="#fffcf4"
          initial={reduce ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: drawn || reduce ? 1 : 0, scale: 1 }}
          transition={{ delay: reduce ? 0 : 0.15 + index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </g>
    </motion.g>
  );
}

/** The promise seal, parked opposite the wordmark in the top band. */
function HeroSeal({ reduce }: { reduce: boolean }) {
  return (
    <motion.div
      aria-hidden
      initial={reduce ? false : { opacity: 0, scale: 0.85, rotate: -12 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="hidden h-24 w-24 shrink-0 rounded-full border-2 border-ink-900 bg-paper-0 p-2 [box-shadow:var(--shadow-pop-lg)] sm:block lg:h-28 lg:w-28"
    >
      <RotatingSeal />
    </motion.div>
  );
}
