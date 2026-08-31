---
category: Brand
---

# BrandLogo

The FOUR wordmark, inlined as vector paths from the brand kit so it stays crisp
at any size. The `viewBox` is cropped to the wordmark bounds of the 1080-square
logo page, so the SVG has no built-in padding - whatever box you give it is
filled edge to edge.

## Colour

Paths are filled with `currentColor`. **The logo takes its colour from the text
colour of its container**, it has no colour of its own:

```jsx
<span className="text-red"><BrandLogo className="h-8" /></span>
```

Brand-correct pairings: `text-red` on beige or cream ground, `text-cream` on
`bg-ink` or `bg-red`. Never render it in `text-ink` - the wordmark is red or
cream in the brand book, nothing else.

## Sizing

Set height only (`h-6` … `h-16`) and let the width follow the aspect ratio.
`h-7` is the storefront nav size, `h-8` the footer size. Passing a width utility
distorts it.

## Props

- `className` - sizing and colour utilities. Default `"h-8"`.
- `title` - accessible label, becomes the SVG's `aria-label`. Default `"FOUR"`.
  Override it only when the mark means something more specific in context
  (e.g. `"FOUR home"` when it is the link back to the homepage).
