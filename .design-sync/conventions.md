## Building with FOUR

FOUR is a Lahore smash-burger and crown-crust-pizza storefront. Its v3 design
language is the cloud-kitchen look with FOUR's brand: flat solid colour blocks
(brand red, white, cream, beige) with two playful accents (yellow, pink), 1px
rules at 14% red, 10px cards and 20px panels, yellow pill CTAs with a separate
arrow circle, rotated sticker tags, Anton display caps over DM Sans body copy.
Eighteen components ship: the composable primitives `StickerTag`,
`SectionHeader` (with `Hi` for the highlighted word), `PillCta`, `PriceTag`,
`DoodleBackdrop`, `PageTitleBand`, `Ticker`, `Reveal`, `BrandLogo`,
`SmartImage`, `RotatingSeal`, `PhotoStrip`; and the storefront sections
`LogoHero`, `CraftStory`, `WorldFlavours`, `DealsBand`, `Footer` (`Marquee`
is an alias of `Ticker`).

### Setup

There is no provider, no theme object and no context to wire — components are
plain exports that style themselves from `styles.css`. Import it and render.

The page ground is white in DM Sans. Sections alternate white, cream
(`on-cream`) and red (`on-red`) bands; every inner page opens with a red
`PageTitleBand`. Never stack two red blocks - put a white or cream section
between them.

### Ground contexts

Colour is set by the ground, never per element. Put one of these on a section
or card and headings, the highlight word, body copy, rules and focus rings
recolour themselves:

| Class | Ground | Heading / highlight |
|---|---|---|
| (none) | white | red / pink |
| `on-cream` | cream `#F7F2E6` | red / pink |
| `on-red` | brand red `#9D1D20` | white / yellow |
| `on-yellow` | yellow `#FFD23F` | red / red |
| `on-beige` | brand beige `#E9DCC5` | red / pink |
| `on-photo` | a photo under a red overlay (`<img>` first child) | white / yellow |

A section with a `DoodleBackdrop` needs `relative isolate` and its content
`relative z-[1]`.

### The styling idiom

Tailwind v4 utilities against a custom theme, plus the `f-*` component classes
in `styles.css`. No CSS modules, no style props. Families you can use:

| Family | Names |
|---|---|
| Colour | `white` `cream` `beige` `beige-deep` `red` `red-hover` `red-press` `yellow` `yellow-deep` `pink` `ink-900` `ink-600` `ink-400` `rule` `rule-white` |
| Applied as | `bg-*` `text-*` `border-*`, each with alpha steps: `border-rule`, `bg-white/10`, `text-white/80` |
| Type | `font-display` (Anton, one weight - never add `font-bold` to it) for headings, tags, prices, pills; body text inherits DM Sans. `text-xs`…`text-7xl`, `font-normal`…`font-bold` on body copy only |
| Radius | `rounded-card` (10px) for cards, inputs and thumbs; `rounded-panel` / `rounded-[20px]` for panels, photo blocks and modals; `rounded-full` for pills and circles |
| Rules | `border border-rule` on light grounds, `border border-rule-white` on red; nothing thicker than 1px, no outlines, no offset shadows |
| Motion | `animate-marquee`, `animate-marquee-reverse`, `animate-spin-slow` - pair with `motion-safe:` |
| Layout | `wrap` (1320px column), `band` (65-130px section padding), the usual spacing, `grid-cols-*`, flex and `max-w-*` utilities with `sm:` `md:` `lg:` variants |

**These colours are the entire palette.** `bg-primary`, `bg-red-500` and the
rest of Tailwind's default palette resolve to nothing - designs render as
static CSS with no Tailwind at build time, so a class absent from `styles.css`
does nothing. Grep the stylesheet before inventing a class.

Idioms worth copying verbatim:

- Primary CTA: `<PillCta href="/menu">Order now</PillCta>` (or the raw classes
  `f-btn f-btn--primary f-btn--md`). Red pills (`tone="red"`) are only for
  transactional submits - place order, pay, verify a code.
- Section header: `<SectionHeader title="What are you craving?" highlight="craving" tag="The menu" tag2="11 categories" lede="..." />`
  - exactly one highlighted word, one yellow sticker top-left, one pink bottom-right.
- Dish card anatomy: `f-item` > `f-item__media` (+ `f-tag f-tag--card`),
  `f-item__body` (`f-item__name`, `f-item__desc`), `f-item__foot`
  (`f-btn f-btn--secondary f-btn--sm` + `<PriceTag/>`).

### Brand rules

The wordmark (`BrandLogo`) and the hand mark appear only as red on beige or
white on red. Never on white, cream, yellow or pink; never stroked, rotated or
recoloured; never redrawn. Pink is decorative only - stickers and the
highlight word in display titles - and never carries information below 24px.
Every number on the page (prices, hours, fees, counts) comes from
`@four/shared`; nothing is typed in, and nothing fabricates reviews or counts.

### Where the truth is

- **`styles.css`** (bound alongside this README, with its imports) — the
  compiled theme, the `@font-face` rules for Anton and DM Sans, and the
  definitive list of every utility and `f-*` class that exists.
- **`components/<group>/<Name>/<Name>.prompt.md`** — per-component usage. Read
  `LogoHero`, `PhotoStrip` and `DoodleBackdrop` before using them: they
  reference storefront-owned assets that will not resolve in a design and
  degrade to beige tiles / solid bands by design.

### A page

```jsx
<div className="min-h-screen bg-white">
  <LogoHero />

  <section className="band">
    <div className="wrap">
      <SectionHeader title="Today's specials" highlight="specials" tag="Best sellers" tag2="Order now" />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.name} className="f-item">
            <div className="f-item__media">
              <SmartImage src={item.photo} alt={item.name} fallbackLabel={item.name} className="h-full w-full" />
              <StickerTag card className="absolute left-5 top-5">Best seller</StickerTag>
            </div>
            <div className="f-item__body">
              <h3 className="f-item__name">{item.name}</h3>
              <p className="f-item__desc">{item.description}</p>
            </div>
            <div className="f-item__foot">
              <span className="f-btn f-btn--secondary f-btn--sm">Order now</span>
              <PriceTag price={item.price} />
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>

  <CraftStory />
  <section className="on-red band relative isolate">
    <DoodleBackdrop />
    <div className="wrap relative z-[1]">
      <SectionHeader align="center" title="The hits Lahore keeps reordering" highlight="reordering" tag="Best sellers" />
    </div>
  </section>
  <DealsBand />
  <Footer />
</div>
```

`LogoHero`, `CraftStory`, `WorldFlavours`, `DealsBand` and `Footer` are the
storefront's real sections in their real order - full-bleed, no props (except
`LogoHero`'s optional `onFindMe`), no wrappers with horizontal padding.

Build anything new from the primitives and the utilities above, and prefer
`SmartImage` over a bare `<img>` anywhere a photo might be missing: it degrades
to a branded tile instead of a hole in the layout.

## Motion rules for synced components

**No component exported from `ds-pkg/index.ts` (or listed in `config.json`'s
`componentSrcMap`) may import GSAP.** Two reasons, both of which fail silently
rather than loudly:

- The bundle inlines its runtime — `_ds_bundle.js` is already ~555KB with
  `motion` inlined — so a GSAP import lands the whole library in a file the
  design canvas loads.
- `package-capture` pins the page clock, so a GSAP timeline never advances and
  the element screenshots at its *start* state. That is the same failure this
  file's sibling NOTES.md records for `HypeBand`.

GSAP is confined to `apps/web/src/lib/useGsap.ts` and its callers, none of which
are synced. `about/AboutCraft.tsx` is currently the only one.

**Entrances are CSS, not JavaScript.** `Reveal` (below the fold, observer-driven)
and `Rise` (above the fold, first paint) are server components that mark an
element and let `components.css` do the work. The rule they encode:

> The un-enhanced state is the finished state. Nothing may hide itself unless
> the code that will un-hide it is already running.

Never reintroduce a `motion` `initial={{ opacity: 0 }}` on anything that renders
on the server — motion writes `initial` into the SSR inline style, which both
hides the content without JavaScript and disqualifies it as an LCP candidate.
`apps/web/scripts/check-ssr-visible.mjs` fails the build if this comes back.

Above the fold, prefer transform-only motion (`Rise fade={false}`, `.f-lineup`,
`.f-wordup`): Chrome does not count an element at `opacity: 0` — or text
translated outside a clip box — as painted, so a fading hero costs the LCP
measurement it was trying to decorate.
