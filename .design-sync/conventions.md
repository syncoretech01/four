## Building with FOUR

FOUR is a Lahore burger restaurant's storefront: a warm beige ground, one loud
red accent, rounded Fredoka display type over Poppins body copy. Nine components
ship. Six are whole page sections that take no props at all - `LogoHero`,
`Marquee`, `Story`, `HypeBand`, `Visit`, `Footer`, in that order down the page.
Three are brand primitives you compose with: `BrandLogo`, `SmartImage` and
`RotatingSeal`.

### Setup

There is no provider, no theme object and no context to wire — components are
plain exports that style themselves from `styles.css`. Import it and render.

The page ground is part of the design: `styles.css` sets `body` to
`var(--color-beige)` in Poppins. Keep your own wrappers on `bg-beige` or
`bg-cream` — the sections are built to sit on that ground, and several use
translucent hairlines (`border-ink/10`) that only read against it. Add the
`grain` class to a page wrapper for the storefront's fixed film-grain overlay.

### The styling idiom

Tailwind v4 utilities against a custom theme. No CSS modules, no style props —
only `BrandLogo` and `SmartImage` take a `className`, and for them it carries
size and colour. Everything else you build with these families:

| Family | Names |
|---|---|
| Colour | `beige` `beige-deep` `cream` `red` `red-deep` `ink` `ink-soft` |
| Applied as | `bg-*` `text-*` `border-*`, each with alpha steps: `border-ink/10`, `bg-beige/85`, `text-cream/70`, `bg-red/40` |
| Type | `font-display` (Fredoka) for headlines; body text inherits Poppins. `text-xs`…`text-7xl`, `font-normal`…`font-bold` |
| Radius | `rounded-card` (1.25rem) for panels and image tiles, `rounded-full` for buttons |
| Motion | `animate-marquee`, `animate-marquee-reverse`, `animate-spin-slow`, `animate-float` - pair with `motion-safe:` |
| Layout | the usual spacing, `grid-cols-*`, `col-span-*`, flex and `max-w-*` utilities, with `sm:` `md:` `lg:` variants |

**These seven colours are the entire palette.** `bg-primary`, `bg-red-500` and
the rest of Tailwind's default palette are not in this theme and resolve to
nothing — a design that uses them renders unstyled, with no error. The same is
true of any utility outside the families above: designs render as static CSS
with no Tailwind at build time, so if it is not in `styles.css` it does nothing.
When in doubt, grep the stylesheet before inventing a class.

Two idioms worth copying verbatim. The primary button:

```
rounded-full bg-red px-8 py-4 font-semibold text-cream transition hover:bg-red-deep active:scale-[0.98]
```

and every link: `transition hover:text-red`.

### Where the truth is

- **`styles.css`** (bound alongside this README, with its imports) — the
  compiled theme, the `@font-face` rules for Fredoka and Poppins, and the
  definitive list of every utility that exists. Read it before styling.
- **`components/<group>/<Name>/<Name>.prompt.md`** — per-component usage. Read
  `LogoHero` and `Story` before using them: both reference storefront-owned
  photography by absolute path, which will not resolve in a design.

### A page

```jsx
<div className="grain min-h-screen bg-beige">
  <LogoHero />
  <Marquee />
  <Story />
  <HypeBand />

  <section className="mx-auto max-w-7xl px-4 py-24">
    <h2 className="font-display text-4xl font-semibold text-ink">Today's specials</h2>
    <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-ink-soft">
      Smashed to order, every batch from scratch.
    </p>
    <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <SmartImage
          key={item.name}
          src={item.photo}
          alt={item.name}
          fallbackLabel={item.name}
          className="aspect-[3/4] w-full rounded-card object-cover"
        />
      ))}
    </div>
  </section>

  <Visit />
  <Footer />
</div>
```

`LogoHero`, `Marquee`, `Story`, `HypeBand`, `Visit` and `Footer` are the
storefront's real sections in their real order — full-bleed, no props, no
wrappers with horizontal padding. `Marquee` and `HypeBand` are both full-bleed
red, so keep something on the beige ground between them or the page loses its
rhythm.

Build anything new from `SmartImage`, `BrandLogo`, `RotatingSeal` and the
utilities above, and prefer `SmartImage` over a bare `<img>` anywhere a photo
might be missing: it degrades to a branded tile instead of a hole in the layout.
