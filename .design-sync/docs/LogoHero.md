---
category: Hero
---

# LogoHero

The storefront's v3 hero: a solid red type block, then the four-photo strip
that hangs into the white section below. On the red: a proof row of real facts
(kitchen count, live open/closed state, the free-delivery threshold), the Anton
headline with one yellow highlighted word and two stickers, a one-line lede,
and two pill CTAs - "Order now" and "Do you deliver to me?".

```jsx
<LogoHero />
```

## What it renders

A `section.f-hero.on-red` (full width, padding reserving space for the fixed
promo strip + bar) followed by `PhotoStrip`. Everything centred; the strip is
four rounded 4:5 tiles (2x2 below 768px) with the negative margin that makes it
straddle the red/white edge.

The proof row reads the clock (`useKitchenOpen()`), so it shows "Open now ·
till 3am" or "Opens 1pm · order ahead" depending on when it is viewed; a card
and a live design can legitimately differ there.

## Two things to know before using it

**Its photographs are storefront assets.** The strip points `SmartImage` at
`/hero/strip-*.jpg`, which does not resolve inside a design canvas, so each
tile shows the beige fallback tile. That is the designed degradation, not a
missing asset.

**It stays store-free.** "Do you deliver to me?" clicks the storefront nav's
`header [data-open-location]` pill instead of calling the app store, so it
renders standalone. Pass `onFindMe` to wire it to your own handler.

## Props

| Prop | Type | Default |
|---|---|---|
| `onFindMe` | `() => void` | clicks `header [data-open-location]` |
