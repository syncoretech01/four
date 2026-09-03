import type { ReactNode } from "react";

export type StickerTone = "yellow" | "pink" | "red" | "white";

/**
 * The v3 "sticker": an Anton label with the `10px 0` corner (or a pill), tilted
 * when it decorates a heading. Stickers are decorative by default and hidden
 * from assistive tech; pink is *always* decorative because white on pink does
 * not reach text contrast, so nothing informational may ride on it.
 */
export function StickerTag({
  children,
  tone = "yellow",
  round = false,
  tilt,
  card = false,
  decorative = true,
  className = "",
}: {
  children: ReactNode;
  tone?: StickerTone;
  round?: boolean;
  tilt?: "left" | "right";
  /** Straight, padded variant placed at 20px/20px inside card media. */
  card?: boolean;
  decorative?: boolean;
  className?: string;
}) {
  const hidden = decorative || tone === "pink";
  const cls = [
    "f-tag",
    `f-tag--${tone}`,
    round && "f-tag--round",
    tilt === "left" && "f-tag--tilt-l",
    tilt === "right" && "f-tag--tilt-r",
    card && "f-tag--card",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={cls} aria-hidden={hidden || undefined}>
      {children}
    </span>
  );
}
