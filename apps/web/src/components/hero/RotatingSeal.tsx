"use client";

/**
 * Circular-text hype seal - "FRESH • FAST • FROM SCRATCH" curved around a
 * spinning ring with the hand mark at its centre. A loud brand device that
 * earns its motion: it reads as a stamp of the kitchen's promise. Spin stops
 * under reduced motion (the CSS animation utility is already gated globally).
 */
import { HAND_MARK } from "./logoPaths";

export function RotatingSeal({ className = "" }: { className?: string }) {
  const text = "FRESH · FAST · FROM SCRATCH · SMASHED TO ORDER · ";
  return (
    <div className={`relative aspect-square ${className}`} aria-hidden>
      <svg viewBox="0 0 200 200" className="h-full w-full motion-safe:animate-spin-slow">
        <defs>
          <path id="seal-curve" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
        </defs>
        <text className="fill-ink font-display text-[15px] font-bold uppercase" style={{ letterSpacing: "0.12em" }}>
          <textPath href="#seal-curve" startOffset="0">
            {text}
          </textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="180 100 700 900" className="h-[38%] w-[38%]">
          <g transform={HAND_MARK.transform}>
            <path d={HAND_MARK.d} fill="#9d1d20" />
          </g>
        </svg>
      </div>
    </div>
  );
}
