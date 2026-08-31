---
category: Sections
---

# Story

The origin story, told loud: a giant kinetic "4" bleeds off the left edge behind
the headline "Four creators. One obsession.", beside a two-photo collage that
parallaxes as the section passes through the viewport.

Takes no props - the copy is the brand's own and is fixed. It is a full page
section (`py-28`, `id="story"`, `scroll-mt-20` so the nav's `#story` anchor lands
cleanly) on the deeper `bg-beige-deep/60` ground. Give it the full page width; it
centres its own `max-w-7xl` content.

```jsx
<Marquee />
<Story />
<HypeBand />
```

## What it renders

A two-column grid that stacks below `lg`. Left: a red `The story` eyebrow, the
headline with "obsession." in `text-red`, and two paragraphs at `text-ink-soft`.
Right: two `SmartImage` tiles in a `3/4` aspect grid, offset from each other and
carrying `shadow-xl shadow-ink/15`.

Behind everything sits an oversized `4` in `font-display` at `text-red/[0.06]` -
a watermark, `aria-hidden`, deliberately almost invisible.

## How it moves

The collage is scroll-tied via `useScroll` on the section's own ref (no scroll
listeners): the two columns transform in opposite directions across the
section's travel. Under reduced motion both offsets collapse to zero and the
section renders static, which is the state the preview card shows.

Because the photographs are storefront-owned `/gallery` paths, inside a design
they resolve to `SmartImage`'s branded fallback tiles - a warm beige gradient
carrying a large `F` and `O`. That is the intended appearance here, not a
missing asset.

## Props

None.
