---
category: Sections
---

# Footer

The storefront's page footer on brand red with faint doodles: a four-cell link
strip (Instagram, phone, foodpanda, order online), the giant `Ticker`, four
widgets of real data (contact, order links, FOUR links, opening hours with the
three kitchens), and the bottom bar with the copyright line.

Takes no props. Every value comes from the shared `BRAND`, `BRANCHES`,
`HOURS_LABEL`, `DELIVERY_FEE` and `FREE_DELIVERY_ABOVE` constants; the copyright
year is computed at render time (so a card and a live design can differ there).
Full page width; it is a server component.

```jsx
<Footer />
```

## What it renders

`footer.f-footer.on-red` > link strip (`f-footer__strip`, 4 cells collapsing to
2 then 1) > `Ticker` > widgets (`f-footer__widgets`, 4 columns collapsing to 2
then 1; the hours column carries a left rule) > `f-footer__bottom`.

## Props

None.
