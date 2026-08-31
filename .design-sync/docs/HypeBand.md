---
category: Sections
---

# HypeBand

A full-bleed red statement band that does real work: it announces the three
FOUR kitchens and drives the order. "Three kitchens. One Lahore obsession." set
huge in `font-display`, then a three-up numbered grid of branches, then an
"Order online" / "Check your block" button pair.

Takes no props - branch names and addresses come from the shared `BRANCHES`
data, so the band stays correct as kitchens are added. Full page width; it
centres its own `max-w-7xl` content and brings its own `py-24`.

```jsx
<Story />
<HypeBand />
<Visit />
```

## What it renders

The headline caps at `max-w-[16ch]` so it always breaks into a stack of short
lines - that wrap is the effect, not an accident. Below it, branch cards sit in
a `gap-px` grid over a `bg-cream/20` rule, which is what draws the hairlines
between them, each card numbered `01`, `02`, `03` in `text-cream/25`. The
buttons invert the usual pairing: cream fill on red, since red is already the
ground.

Every block animates in on `whileInView`, once, with the branch cards staggered.
Under reduced motion it renders static.

## Placing it

This is the loudest surface in the storefront. `Marquee` is also full-bleed red -
put something on the beige ground between them (`Story` is the storefront's
choice) or the page loses its rhythm.

## One caveat

The "Check your block" button reaches out of the component - it clicks
`header [data-open-location]`, the location-modal trigger that lives in the
storefront's own nav. In a design with no such header it renders and is
clickable but does nothing. Keep it for layout fidelity; wire your own handler
if the action needs to work.

## Props

None.
