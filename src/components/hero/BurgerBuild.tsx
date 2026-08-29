"use client";

import { useEffect, useRef, useCallback } from "react";
import anime from "animejs";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "motion/react";

/**
 * The signature hero visual: a layered smash burger that assembles itself
 * with an anime.js timeline (each layer drops in and settles with spring
 * physics, the top bun lands with a squash), then floats gently and
 * parallax-shifts with the cursor. Click re-smashes it.
 *
 * The burger is drawn as layered SVG because the animation needs
 * independent physical layers; swap fills/shapes to match brand
 * illustration guidelines when the kit arrives.
 */

interface LayerDef {
  id: string;
  depth: number; // cursor-parallax multiplier
}

const LAYERS: LayerDef[] = [
  { id: "bun-bottom", depth: 0.4 },
  { id: "patty-1", depth: 0.55 },
  { id: "cheese", depth: 0.7 },
  { id: "patty-2", depth: 0.85 },
  { id: "pickles", depth: 1.0 },
  { id: "onions", depth: 1.15 },
  { id: "slaw", depth: 1.3 },
  { id: "bun-top", depth: 1.5 },
];

export function BurgerBuild() {
  const rootRef = useRef<HTMLDivElement>(null);
  const playing = useRef(false);
  const reduce = useReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });

  const assemble = useCallback(() => {
    if (playing.current || reduce) return;
    playing.current = true;
    const root = rootRef.current;
    if (!root) return;

    const tl = anime.timeline({
      easing: "easeOutElastic(1, .65)",
      complete: () => {
        playing.current = false;
      },
    });

    LAYERS.forEach((layer, i) => {
      const el = root.querySelector<SVGGElement>(`#${layer.id} > g`);
      if (!el) return;
      tl.add(
        {
          targets: el,
          translateY: [-340 - i * 30, 0],
          opacity: { value: [0, 1], duration: 120, easing: "linear" },
          duration: 900,
        },
        i * 130,
      );
    });

    // top bun lands with a squash; the whole stack absorbs the impact
    const stack = root.querySelector<SVGGElement>("#stack");
    tl.add(
      {
        targets: stack,
        scaleY: [1, 0.94, 1.02, 1],
        scaleX: [1, 1.045, 0.99, 1],
        duration: 620,
        easing: "easeOutQuad",
      },
      LAYERS.length * 130 + 240,
    );
  }, [reduce]);

  useEffect(() => {
    if (reduce) return;
    const root = rootRef.current;
    if (!root) return;
    // hide layers before first assembly to avoid a flash of the final stack
    root.querySelectorAll<SVGGElement>("[data-layer] > g").forEach((el) => {
      el.style.opacity = "0";
    });
    const t = setTimeout(assemble, 350);

    // gentle idle float on the whole svg
    const idle = anime({
      targets: root.querySelector("#stack"),
      translateY: [0, -7, 0],
      duration: 4200,
      easing: "easeInOutSine",
      loop: true,
      delay: 2600,
    });
    return () => {
      clearTimeout(t);
      idle.pause();
      anime.remove(root.querySelectorAll("*"));
    };
  }, [assemble, reduce]);

  const onPointerMove = (e: React.PointerEvent) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set(((e.clientX - rect.left) / rect.width - 0.5) * 18);
    my.set(((e.clientY - rect.top) / rect.height - 0.5) * 10);
  };

  return (
    <div
      ref={rootRef}
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      onClick={assemble}
      role="img"
      aria-label="A FOUR smash burger being stacked layer by layer"
      className="relative mx-auto w-full max-w-130 cursor-pointer select-none"
      title="Click to re-smash"
    >
      <svg viewBox="0 0 420 400" fill="none" className="h-auto w-full drop-shadow-[0_28px_40px_rgba(38,32,26,0.28)]">
        {/* plate shadow */}
        <ellipse cx="210" cy="372" rx="150" ry="16" fill="#26201a" opacity="0.12" />
        <g id="stack" style={{ transformOrigin: "210px 372px" }}>
          {LAYERS.map((layer) => (
            <ParallaxLayer key={layer.id} layer={layer} sx={sx} sy={sy}>
              {LAYER_ART[layer.id]}
            </ParallaxLayer>
          ))}
        </g>
      </svg>
    </div>
  );
}

function ParallaxLayer({
  layer,
  sx,
  sy,
  children,
}: {
  layer: LayerDef;
  sx: ReturnType<typeof useSpring>;
  sy: ReturnType<typeof useSpring>;
  children: React.ReactNode;
}) {
  const x = useTransform(sx, (v: number) => v * layer.depth);
  const y = useTransform(sy, (v: number) => v * layer.depth);
  return (
    <motion.g id={layer.id} data-layer style={{ x, y }}>
      {/* inner group is the anime.js target so parallax + drop-in never fight */}
      <g>{children}</g>
    </motion.g>
  );
}

/** Layered burger artwork, bottom to top. */
const LAYER_ART: Record<string, React.ReactNode> = {
  "bun-bottom": (
    <path
      d="M80 316c0-10 8-18 18-18h224c10 0 18 8 18 18v14c0 18-14 32-32 32H112c-18 0-32-14-32-32v-14Z"
      fill="#E3A455"
      stroke="#C98B3E"
      strokeWidth="3"
    />
  ),
  "patty-1": (
    <g>
      <path
        d="M74 282c0-6 5-11 11-11h250c6 0 11 5 11 11v10c0 12-10 22-22 22H96c-12 0-22-10-22-22v-10Z"
        fill="#6E3A1F"
        stroke="#54290F"
        strokeWidth="3"
      />
      <circle cx="120" cy="292" r="3" fill="#54290F" />
      <circle cx="170" cy="298" r="3" fill="#54290F" />
      <circle cx="228" cy="290" r="3" fill="#54290F" />
      <circle cx="285" cy="297" r="3" fill="#54290F" />
    </g>
  ),
  cheese: (
    <path
      d="M84 262c40-8 212-8 252 0 8 2 8 10 2 14-8 6-6 22-18 22-10 0-8-14-18-14s-8 12-18 12-8-10-18-10-8 8-18 8-8-8-18-8-8 10-18 10-8-12-18-12-6 14-16 14c-12 0-12-16-20-20-7-4-8-13 6-16Z"
      fill="#F0B03C"
      stroke="#D69428"
      strokeWidth="3"
    />
  ),
  "patty-2": (
    <g>
      <path
        d="M82 232c0-6 5-11 11-11h234c6 0 11 5 11 11v8c0 12-10 22-22 22H104c-12 0-22-10-22-22v-8Z"
        fill="#7A4426"
        stroke="#5C3018"
        strokeWidth="3"
      />
      <circle cx="140" cy="242" r="3" fill="#5C3018" />
      <circle cx="205" cy="246" r="3" fill="#5C3018" />
      <circle cx="268" cy="241" r="3" fill="#5C3018" />
    </g>
  ),
  pickles: (
    <g>
      <ellipse cx="150" cy="216" rx="34" ry="10" fill="#95A83E" stroke="#778830" strokeWidth="3" />
      <ellipse cx="230" cy="214" rx="34" ry="10" fill="#95A83E" stroke="#778830" strokeWidth="3" />
      <ellipse cx="292" cy="218" rx="26" ry="9" fill="#95A83E" stroke="#778830" strokeWidth="3" />
    </g>
  ),
  onions: (
    <g stroke="#C9AACD" strokeWidth="5" fill="none" strokeLinecap="round">
      <path d="M120 204c20-10 48-10 66 0" />
      <path d="M196 200c20-10 48-10 66 0" />
      <path d="M158 208c14-7 34-7 48 0" opacity="0.7" />
    </g>
  ),
  slaw: (
    <path
      d="M92 196c8-18 40-28 118-28s110 10 118 28c3 7-4 12-10 8-8-5-10 8-20 6s-6-12-16-10-6 12-16 10-8-12-18-10-6 10-16 10-8-10-18-10-8 10-18 10-6-10-16-10-8 12-18 10-6-14-16-12-4 13-12 10c-14-5-24-3-32-2-7 1-13-4-10-10Z"
      fill="#8CB04C"
      stroke="#6E9038"
      strokeWidth="3"
    />
  ),
  "bun-top": (
    <g>
      <path
        d="M84 172c0-44 56-72 126-72s126 28 126 72c0 8-6 14-14 14H98c-8 0-14-6-14-14Z"
        fill="#E8A857"
        stroke="#C98B3E"
        strokeWidth="3"
      />
      <g fill="#F6E3C2">
        <ellipse cx="150" cy="130" rx="7" ry="4" transform="rotate(-14 150 130)" />
        <ellipse cx="205" cy="118" rx="7" ry="4" transform="rotate(8 205 118)" />
        <ellipse cx="262" cy="132" rx="7" ry="4" transform="rotate(-6 262 132)" />
        <ellipse cx="178" cy="152" rx="7" ry="4" transform="rotate(12 178 152)" />
        <ellipse cx="238" cy="154" rx="7" ry="4" transform="rotate(-10 238 154)" />
        <ellipse cx="122" cy="156" rx="6" ry="3.5" transform="rotate(6 122 156)" />
        <ellipse cx="290" cy="158" rx="6" ry="3.5" transform="rotate(14 290 158)" />
      </g>
    </g>
  ),
};
