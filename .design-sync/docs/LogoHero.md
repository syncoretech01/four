---
category: Hero
---

# LogoHero

The storefront's signature hero. The FOUR wordmark assembles itself - each
letter's outline draws in via `pathLength`, the red fill floods after it, and
the settled mark stays cursor-reactive, springs tilting it in 3D while each
letter parallaxes by its own depth. Around it: a soft colour-blocked red bloom
so the ground is never a flat beige void, a live open/closed status pill, the
hero food shot with a floating hand sticker and a `RotatingSeal`, and two
magnetic call-to-action buttons that lean toward the pointer.

Takes no props. It is a whole page section - full width,
`min-h-[calc(100dvh-4rem)]`, with `pt-16` reserving space for the fixed
storefront header. Place it first on a page, above `Marquee`, at full width.

```jsx
<LogoHero />
<Marquee />
```

## What it renders

A two-column grid (single column below `lg`): the status pill, animated
wordmark, tagline and CTA pair on the left; the hero food photo with its sticker
and seal on the right.

The pill reads its own state - it calls `isOpenAt()` from the shared package on
mount, so it shows "Open now · delivering till 3am" or "Opens 1pm · order
ahead" depending on when the page is viewed. Nothing to pass in, but note that
the card and a live design can legitimately differ here.

## Two things to know before using it

**It hardcodes its photograph.** The hero image is a raw `<img>` pointing at
`/gallery/gallery-3.jpg` - an asset owned by the storefront, not by this design
system, and unlike `SmartImage` it has no fallback. Inside a design canvas that
path does not resolve and the photo area comes up empty. Treat `LogoHero` as the
real storefront hero rather than a reusable hero shell; for a hero with your own
imagery, compose one from `BrandLogo`, `SmartImage` and `RotatingSeal`.

**Its entrance is time-based.** The letter fills stay at `opacity: 0` for 1.6s
before the mark settles. Under `prefers-reduced-motion: reduce` it skips
straight to the settled state, which is what the preview card shows.

## Props

None.
