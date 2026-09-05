"use client";

import { useRef, type ReactNode } from "react";
import { useGsap } from "@/lib/useGsap";

/**
 * A heading whose words rise and un-squash as you scroll, scrubbed to the
 * scrollbar rather than played once on entry.
 *
 * The effect (yPercent 120 with a 2.3/0.7 scale squash from a top origin,
 * eased on `back.inOut`) is React Bits' ScrollFloat —
 * src/ts-tailwind/TextAnimations/ScrollFloat, MIT + Commons Clause. Only the
 * effect is borrowed; the implementation is rewritten, because upstream
 * registers the ScrollTrigger plugin at module scope behind a static `import`
 * (which puts GSAP in the initial bundle of anything that imports it), renders
 * its own `<h2>` with hardcoded `clamp()` sizing that fights `.f-heading`,
 * never cleans up its ScrollTriggers, and has no reduced-motion guard.
 *
 * Scrubbing is the reason to spend a dependency here at all: it is the one
 * thing the CSS primitives in this codebase cannot do portably, and it is
 * qualitatively different from the one-shot `Reveal`. It is also why this is
 * confined to /about — a story page, outside the ordering funnel and outside
 * the design-sync export surface.
 *
 * ## Why this cannot strand a heading
 *
 * The words are real text in the server HTML and nothing hides them in CSS, the
 * tween never touches opacity, and the "from" state is a transform mild enough
 * to stay readable. So every scroll position — including scrolled back above
 * the trigger, which a scrub replays in reverse — shows the full heading. If
 * the chunk never loads, it simply does not animate.
 *
 * The travel is deliberately short. A transform does not affect layout, so a
 * heading displaced far enough to look dramatic simply lands on top of the lede
 * beneath it; and the start of the range is pinned to `top bottom`, so the
 * least-settled state only exists while the heading is still below the fold.
 *
 * Splitting is by word, not character: a per-character split on a display face
 * means dozens of separately transformed elements per heading, and the words
 * stay readable as text nodes.
 */
export function FloatHeading({
  text,
  as: Tag = "span",
  className,
  children,
}: {
  text: string;
  /** Defaults to `span` so it can be dropped into a SectionHeader title. */
  as?: "span" | "h2" | "h3" | "p";
  className?: string;
  /** Rendered after the words — a trailing highlight or punctuation. */
  children?: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useGsap(ref, (gsap, el) => {
    const words = el.querySelectorAll<HTMLElement>("[data-float-word]");
    if (!words.length) return;

    // No opacity in the tween. A scrub runs BACKWARDS when the reader scrolls
    // up, so anything faded to 0 at progress 0 is missing again the moment they
    // scroll back — which is indistinguishable from broken. The float and the
    // squash carry the effect; the words stay legible at every scroll position.
    gsap.fromTo(
      words,
      { yPercent: 26, scaleY: 1.22, scaleX: 0.92, transformOrigin: "50% 0%" },
      {
        yPercent: 0,
        scaleY: 1,
        scaleX: 1,
        ease: "back.inOut(2)",
        duration: 1,
        stagger: 0.03,
        scrollTrigger: { trigger: el, start: "top bottom", end: "top 60%", scrub: true },
      },
    );
  });

  return (
    <Tag ref={ref as React.Ref<HTMLElement & HTMLHeadingElement>} className={className}>
      {text.split(/(\s+)/).map((part, i) =>
        /^\s+$/.test(part) ? (
          part
        ) : (
          <span key={i} data-float-word className="inline-block">
            {part}
          </span>
        ),
      )}
      {children}
    </Tag>
  );
}
