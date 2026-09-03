import { createElement, type ReactNode } from "react";
import { StickerTag, type StickerTone } from "./StickerTag";

/** The one highlighted word in a display title (yellow on red, pink on light). */
export function Hi({ children }: { children: ReactNode }) {
  return <span className="f-heading__hi">{children}</span>;
}

function highlightTitle(title: ReactNode, highlight?: string): ReactNode {
  if (typeof title !== "string" || !highlight) return title;
  const i = title.toLowerCase().indexOf(highlight.toLowerCase());
  if (i < 0) return title;
  return (
    <>
      {title.slice(0, i)}
      <Hi>{title.slice(i, i + highlight.length)}</Hi>
      {title.slice(i + highlight.length)}
    </>
  );
}

/**
 * Dinevo-style section header: a giant Anton title with one highlighted word
 * and up to two stickers pinned to the title's corners (a yellow one top-left
 * at -15°, a pink one bottom-right at 22°; both hide below 640px), then an
 * optional lede. Colour comes from the ground context (.on-red, .on-cream ...),
 * never from props. Server-safe: no hooks.
 */
export function SectionHeader({
  title,
  highlight,
  as = "h2",
  size = "lg",
  tag,
  tagTone = "yellow",
  tag2,
  tag2Tone = "pink",
  align = "left",
  ruled = false,
  lede,
  className = "",
}: {
  title: ReactNode;
  /** Substring of a string `title` to wrap in the highlight colour. */
  highlight?: string;
  as?: "h1" | "h2" | "h3" | "p";
  size?: "xl" | "lg" | "md";
  tag?: string;
  tagTone?: StickerTone;
  tag2?: string;
  tag2Tone?: StickerTone;
  align?: "left" | "center";
  ruled?: boolean;
  lede?: ReactNode;
  className?: string;
}) {
  const heading = createElement(as, { className: `f-heading f-heading--${size}` }, highlightTitle(title, highlight));
  const cls = ["f-header", align === "center" && "f-header--center", ruled && "f-header--ruled", className].filter(Boolean).join(" ");
  return (
    <div className={cls}>
      <div className="f-header__title">
        {tag && (
          <StickerTag tone={tagTone} className="f-header__tag f-header__tag--top">
            {tag}
          </StickerTag>
        )}
        {heading}
        {tag2 && (
          <StickerTag tone={tag2Tone} className="f-header__tag f-header__tag--bottom">
            {tag2}
          </StickerTag>
        )}
      </div>
      {lede && <p className="f-lede">{lede}</p>}
    </div>
  );
}
