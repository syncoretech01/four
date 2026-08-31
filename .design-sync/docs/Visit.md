---
category: Sections
---

# Visit

The location and delivery card: "Come say hello", the Fairways address, phone,
opening hours and Instagram, beside the list of Lahore neighbourhoods FOUR rides
to. Rendered as one dark `rounded-card` panel in `bg-ink` with `text-cream` -
the only inverted surface in the storefront, which is what makes it read as the
page's closing statement.

Takes no props. Address, phone, hours and Instagram handle all come from the
shared `BRAND` constants and `HOURS_LABEL`, so they stay correct without being
passed in. It is a full page section (`py-24`, `id="visit"`); give it the full
page width.

```jsx
<Story />
<Visit />
<Footer />
```

## What it renders

A three-column grid inside the dark panel, stacking below `lg`: two columns of
address block (address, tappable phone link, hours, Instagram) and one column
listing the delivery areas with a red "Check your block" pill beneath.

## One caveat

The "Check your block" button reaches out of the component - it clicks
`header [data-open-location]`, the location modal trigger that lives in the
storefront's own nav. In a design with no such header the button renders and is
clickable but does nothing. Keep it for layout fidelity; wire your own handler
if the action needs to work.

## Props

None.
