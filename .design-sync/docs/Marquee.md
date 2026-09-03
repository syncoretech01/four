---
category: Sections
---

# Marquee

An alias of `Ticker`: the giant footer strip. One unit is the real wordmark
(white on red - an approved lockup), the hand mark, "LIVE, LOVE, EAT" set
outlined in yellow Anton (the tagline printed on the cups and trays), and the
hand mark again; the strip renders twice inside a `max-content` track and
translates 50% on a 40s linear loop, pausing on hover and freezing under
`prefers-reduced-motion: reduce`.

Takes an optional `repeat` (default 4). Always place it on a red ground - the
white wordmark and the yellow outline are invisible on white - and give it the
full page width.

```jsx
<footer className="f-footer on-red">
  <Marquee />
</footer>
```

The band is `aria-hidden`: decoration only. Never let it carry anything a
visitor needs.

## Props

| Prop | Type | Default |
|---|---|---|
| `repeat` | `number` | `4` |
