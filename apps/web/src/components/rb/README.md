# Vendored React Bits components

Source: <https://github.com/DavidHDev/react-bits> — `src/ts-tailwind/<Category>/<Name>/<Name>.tsx`.
Licence: **MIT + Commons Clause** (free for personal and commercial use; the
Clause bars selling the software itself). Keep the provenance header on every
file so the licence travels with the code.

React Bits is a copy-paste library, not an npm dependency, so these files are
ours to maintain. To keep a future re-sync a readable `diff`, files here keep
**upstream filenames and upstream prop defaults**, and only these edits are
permitted:

1. `"use client"` as line 1.
2. `export default` → a named export (matching every other component here).
3. The provenance header.
4. Removing module-scope `window`/`document` access.
5. Strict-TS fixes.
6. Hardcoded colours → `currentColor` or a `var(--…)` token.
7. Rendering server-safe content where upstream renders an empty element, and
   gating the animation on `prefers-reduced-motion` — see the contract below.

Brand values (durations, eases, colours) are **passed in from the wrapper**,
never edited into the defaults here.

## The contract every component must satisfy

App code imports from `components/ds/`, never from this directory. The `ds/`
wrapper is what enforces:

1. The finished state is in the server HTML — no `opacity`, `visibility`,
   `transform`, `clip-path` or `filter` in the SSR inline style.
2. Nothing hides unless the code that will un-hide it is already running.
3. Reduced motion is read from the media query, never from React state, for
   anything server-rendered. Branch only *whether the animation starts*.
4. Transform and opacity only. No layout properties. The CLS budget is 0.
5. Nothing imports GSAP — these files are reachable from the design-sync
   bundle's dependency graph, which inlines its runtime.

## Wrappers

| Vendored | Wrapper | Used by |
|---|---|---|
| `CountUp` | `ds/StatNumber` | `AboutCraft`, `CraftStory`, the menu basket bar |
| `RotatingText` | used directly in `sections/WorldFlavours` | the city highlight |
| `ScrollVelocity` | `ds/Ticker` | the footer wordmark ticker, every page |
| `ClickSpark` | `lib/spark` + `ds/SparkLayer` | add-to-cart, from `layout.tsx` |
| `Magnet` | `ds/MagneticCta` | the yellow pill CTAs |
