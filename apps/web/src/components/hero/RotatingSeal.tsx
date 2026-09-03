"use client";

import { useId } from "react";
import { HAND_MARK } from "./logoPaths";

/**
 * Circular-text seal — "FRESH · FAST · FROM SCRATCH" curved around a slowly
 * spinning ring with the hand mark at its centre — on a beige disc (red hand
 * on beige) or a red disc (white hand on red): the two approved lockups. The
 * spin is a CSS animation, frozen by the global reduced-motion rule.
 */
export function RotatingSeal({ className = "", tone = "beige" }: { className?: string; tone?: "beige" | "red" }) {
  const id = useId();
  const text = "FRESH · FAST · FROM SCRATCH · SMASHED TO ORDER · ";
  return (
    <div className={`f-seal f-seal--badge ${tone === "red" ? "bg-red text-white" : ""} ${className}`.trim()} aria-hidden>
      <svg viewBox="0 0 200 200" className="f-seal__ring">
        <defs>
          <path id={`${id}-curve`} d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
        </defs>
        <text className="f-seal__text">
          <textPath href={`#${id}-curve`} startOffset="0">
            {text}
          </textPath>
        </text>
      </svg>
      <div className="f-seal__core">
        <svg viewBox="180 100 700 900">
          <g transform={HAND_MARK.transform}>
            <path d={HAND_MARK.d} fill="currentColor" />
          </g>
        </svg>
      </div>
    </div>
  );
}
