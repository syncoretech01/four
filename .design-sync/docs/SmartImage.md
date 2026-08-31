---
category: Brand
---

# SmartImage

An image slot that degrades to a branded tile instead of a broken image. Use it
anywhere a photograph might be missing - the storefront uses it for every menu
and gallery photo, because an unphotographed item must never blow a hole in the
layout.

## Behaviour

Renders a plain lazy-loaded `<img>`. If the image fails - either an `onError`
during load, or a mount-time `naturalWidth === 0` check that catches loads which
failed before hydration - it swaps to a tile: a warm radial beige gradient with
the first letter of `fallbackLabel` (or `alt`) set large in `font-display` at
15% red. The tile keeps `role="img"` and the original `alt`, so the swap is
invisible to assistive tech.

**The fallback is the common case inside a design.** The storefront serves its
photography from its own `/gallery` and `/menu-items` paths, which do not exist
in a design canvas, so `SmartImage` will normally render its branded tile here.
That is the intended, on-brand result - not a broken preview.

## Sizing

`SmartImage` has no dimensions of its own; `className` is applied to both the
`<img>` and the fallback tile, so it must carry the box:

```jsx
<SmartImage
  src="/gallery/gallery-1.jpg"
  alt="FOUR smash burgers fresh off the pass"
  fallbackLabel="F"
  className="aspect-[3/4] w-full rounded-card object-cover"
/>
```

Always give it an aspect ratio or explicit height. Without one the fallback tile
collapses to zero height.

## Props

- `src` (required) - image URL.
- `alt` (required) - also the fallback tile's label when `fallbackLabel` is unset.
- `className` - the box: aspect/size, `rounded-card`, `object-cover`.
- `fallbackLabel` - overrides which word supplies the tile's initial. FOUR uses
  single letters `F`, `O`, `U`, `R` across a set of tiles so a grid of missing
  photos spells the brand.
