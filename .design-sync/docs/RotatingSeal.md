---
category: Brand
---

# RotatingSeal

A circular-text hype seal: "FRESH · FAST · FROM SCRATCH · SMASHED TO ORDER"
curved around a slowly spinning ring, with the brand hand mark in red at its
centre. A loud brand device that earns its motion - it reads as a stamp of the
kitchen's promise. The storefront pins it to the hero food shot.

## Sizing

The component is `aspect-square` and fills its box, so `className` only needs to
carry a width - height follows. It has no background; it is designed to sit over
a photo, a colour block or the beige ground.

```jsx
<div className="relative">
  <SmartImage src={photo} alt="A FOUR smash burger" className="aspect-square w-full rounded-card object-cover" />
  <RotatingSeal className="absolute -bottom-8 -right-8 w-32 sm:w-40" />
</div>
```

Below roughly `w-24` the curved text stops being legible - use `BrandLogo` at
those sizes instead.

## Colour

Fixed, not `currentColor`: the ring text is `fill-ink` and the hand mark is
brand red. It therefore needs a light ground - beige, cream or a pale photo. Do
not place it on `bg-ink` or `bg-red`, where the text disappears.

## Motion

The ring spins on an 18s linear loop via `animate-spin-slow`, applied through
`motion-safe:`, so it stops for visitors who ask for reduced motion. The whole
component is `aria-hidden` - it is decoration, and the promise it carries is
copy that appears elsewhere.

## Props

- `className` - the box, normally just a width plus positioning utilities.
