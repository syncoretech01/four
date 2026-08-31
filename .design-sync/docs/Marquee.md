---
category: Sections
---

# Marquee

Two kinetic strips on a red band, scrolling in **opposite** directions - the
brand shouting its own lines. The top row runs the product claims ("SMASH
BURGERS", "CROWN CRUST PIZZAS", "LOADED FRIES", "EVERY BATCH FROM SCRATCH"); the
lower row, set back at `text-cream/70`, runs the kitchen ones ("110G SMASHED TO
ORDER", "STUFFED CROWN CRUST", "LIVE, LOVE, EAT", "DELIVERED ACROSS LAHORE").
Phrases are separated by the brand hand mark, drawn in `currentColor`.

Takes no props; the words are the brand's and are fixed. Full-bleed by design:
give it the whole page width and no horizontal padding.

```jsx
<LogoHero />
<Marquee />
<Story />
```

## How it moves

Pure CSS, no JS timer and no scroll listener. Each row renders its strip twice
inside a `w-max` flex track and translates 50% over 32s on an infinite linear
loop, so the seam never shows; the lower row runs the reverse keyframes. Both
freeze under `prefers-reduced-motion: reduce`, which is why the preview card
shows a still frame entering mid-phrase - that is the strip at rest, not a
clipped layout.

The whole band is `aria-hidden` - it is decoration, and its words appear as real
copy elsewhere on the page. Do not use it to carry anything a visitor needs.

## Placing it

It reads as a loud divider between full sections; the storefront runs it
directly under the hero. Red is the loudest surface in the palette, so pair it
carefully - `Marquee` and `HypeBand` are both full-bleed red, and stacking them
adjacently flattens the page's rhythm.

## Props

None.
