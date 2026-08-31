---
category: Sections
---

# Footer

The storefront's page footer: the `BrandLogo` in red over a one-line
description, a short nav column, and a contact column with phone, Instagram and
foodpanda links - then a centred legal line across the bottom rule.

Takes no props. The address, phone and Instagram come from the shared `BRAND`
constants; the copyright year is computed at render time. Full page width, on
the standard `bg-beige` ground with a top hairline (`border-ink/10`).

```jsx
<Visit />
<Footer />
```

## What it renders

A row that stacks to a column below `md`: brand block, footer nav (`Menu`,
`Our Story`, `Visit Us`), and contact links. Every link uses the same
`hover:text-red` transition, which is the storefront's standard link idiom.

Note the nav links are page anchors (`#menu`, `#story`, `#visit`) - they assume
the sections they point at are on the same page.

## Props

None.
