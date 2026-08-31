# design-sync notes — FOUR

Repo-specific gotchas for future syncs. Read this before re-running.

## What is synced, and why it is a subset

This repo is a Next.js storefront, not a design-system package. There is no
Storybook, no component library package, and no `dist/` of components — the only
build output is `next build`. So the sync is built around a small entry package
at `.design-sync/ds-pkg/` that re-exports the presentation components from
`apps/web/src/components`, and the converter bundles that.

Nine components are in scope, chosen because they render standalone:
`BrandLogo`, `SmartImage`, `RotatingSeal`, `LogoHero`, `Marquee`, `Story`,
`HypeBand`, `Visit`, `Footer`.

Deliberately excluded — each needs app infrastructure with no meaning inside a
design: `Nav`, `LocationModal`, `CartDrawer` (zustand store), `CheckoutForm`
(API + payment), `ChatDock` (OpenAI realtime voice), `FourMap` / `TrackMap`
(maplibre + live GPS), `MenuSection`, `ItemModal`, `BoardLightbox`.

To add one later: re-export it from `ds-pkg/index.ts` **and** pin its source
path in `config.json`'s `componentSrcMap`. Doing only one of the two silently
drops it — discovery reads the map, the bundle reads the entry.

## Build order matters — use `cfg.buildCmd`

`sh .design-sync/prepare.sh` does three things in a required order:

1. `pnpm --filter @four/shared build` — `Visit` and `Footer` read `BRAND` and
   `HOURS_LABEL` from its dist.
2. `tsc -p .design-sync/ds-pkg/tsconfig.json` — emits the `.d.ts` tree.
   `apps/web` is `noEmit`, so without this every `<Name>Props` degrades to
   `[key: string]: unknown` and the design agent gets no API contract at all.
3. Tailwind compile → `ds-pkg/styles.css`.

**Step 3 must run after any preview edit.** Tailwind v4 emits only the utilities
it finds in its scanned sources, and `.design-sync/previews` is one of them (see
`@source` in `styles/ds.css`). This already cost one debugging cycle: previews
were authored after the stylesheet was compiled, so `grid-cols-4` and `w-24`
were absent and `SmartImage`'s `FallbackGrid` rendered as a single tall column —
no error, no warning, just a wrong layout.

## Machine-local setup a fresh clone must redo

Both are gitignored, and the build fails or degrades without them:

- `.ds-sync/` needs an extra dep beyond the skill's own:
  `(cd .ds-sync && npm i "@tailwindcss/cli@^4.1.0")`. `prepare.sh` calls its
  binary directly. Also approve esbuild's postinstall (`npm install-scripts
  approve esbuild`) or the bundler has no binary.
- `ln -sfn /Users/Work/four/apps/web/node_modules .design-sync/ds-pkg/node_modules`
  — pnpm does not hoist `@types/react` to the repo root, and `lib/dts.mjs`
  finds React's types only by walking up from the package dir looking for
  `node_modules/@types/react`. Without the link the build prints `[DTS_REACT]`
  and React utility types collapse to `any`.

## Preview provider: three patches, each earned the hard way

`cfg.provider` is `PreviewRoot` (`ds-pkg/preview-root.tsx`). Read its header
comment before touching it — every line there fixed a real broken card, and the
obvious fixes are the ones that do not work.

1. **It emulates `prefers-reduced-motion`, not `MotionConfig`.**
   `MotionConfig reducedMotion="always"` feeds motion's internal
   `useReducedMotionConfig()`, while these components call the public
   `useReducedMotion()` hook (through `lib/useAnim`), which reads the media
   query directly. Without the patch `LogoHero` captured mid-draw.

2. **It sets `MotionGlobalConfig.skipAnimations = true`.** This is the
   non-obvious one. `package-capture.mjs` pins the page clock
   (`page.clock.setFixedTime('2024-05-15')`), so motion's animation loop never
   advances and anything animating in from `opacity: 0` stays invisible
   **forever**. `HypeBand` captured as a bare red band with its headline, branch
   cards and buttons all present in the DOM at opacity 0. Note `validate`'s
   render check does *not* pin the clock, so a component can pass the render
   check and still capture blank — that mismatch is what makes this one hard to
   spot. The `© 2024` in the `Footer` review sheet is the same pinned clock, and
   is not a bug.

   Reduced motion alone cannot fix it: `useReduceMotion` is hydration-safe and
   returns `false` until an effect sets `mounted`, so the opacity-0 `initial` is
   applied on the very first render regardless of the media query.

3. **It reports every `IntersectionObserver` target as fully intersecting.**
   `Story` and `HypeBand` reveal content with `whileInView`, and that callback
   does not reliably arrive in a per-story capture.

## Known render warns — expected, already triaged

- `[FONT_MISSING] "Trebuchet MS"` — this is the *fallback* in
  `--font-display: var(--font-fredoka), "Trebuchet MS", sans-serif`, not a brand
  face. The real faces (Fredoka, Poppins) **are** shipped, from
  `.design-sync/fonts/` via `cfg.extraFonts`. Nothing to fix.

## The storefront moves fast — re-check scope every sync

A five-commit "storefront visual overhaul" landed *during* the first sync and
rewrote `LogoHero`, `Marquee` and `Story`, retuned `globals.css`, and added two
new standalone components (`HypeBand`, `RotatingSeal`) that belonged in scope.
Docs written against the previous versions were silently wrong within the hour.

So on every re-sync: `git log` since the last one, re-read the `.prompt.md` of
any component whose source moved, and check
`apps/web/src/components/{sections,hero}` for new standalone components worth
adding. The excluded list above is the test — store, socket, API, maps, or
geolocation means out.

## Two components reference storefront-owned photography

Neither is a preview fault; both are documented in their `.prompt.md`:

- `LogoHero` hardcodes `<img src="/gallery/gallery-3.jpg">` with no fallback, so
  its photo panel is empty inside a design. Its card shows this honestly.
- `Story` points `SmartImage` at `/gallery/*`, which lands on the branded
  fallback tiles (F, O) — the designed degradation, and on-brand.

The gallery images were deliberately **not** uploaded to the project root. They
would make the cards look better than reality: a design built by the agent
resolves those paths against its own origin, not the DS project, so it would
still show nothing. A card that renders better than the real thing is worse than
an honest one.

## Re-sync risks — what can go stale

- **`Footer` renders `new Date().getFullYear()`.** Its render hash changes at
  every new year with no source change. A single unexplained changed component
  on the first sync of a new year is this, not a regression.
- **`LogoHero`'s status pill calls `isOpenAt()`** and so renders "Open now" or
  "Opens 1pm" depending on the hour. Same class of nondeterminism; the pinned
  capture clock hides it in review sheets but not in a live card.
- **Fonts are a fetched snapshot.** `.design-sync/fetch-fonts.mjs` pulled
  Fredoka/Poppins woff2 from Google Fonts (SIL OFL 1.1) and deduped identical
  variable-font files. It is a one-shot; re-run it only if the brand faces
  change. The app itself still serves these via `next/font` — the bundle ships
  them because it has no `next/font`.
- **The theme has one source of truth: `apps/web/src/app/globals.css`.**
  `styles/ds.css` imports it rather than copying tokens, so palette edits flow
  through on the next sync. If someone moves or renames that file, the compile
  breaks loudly (good) — but if they add tokens used only by excluded
  components, those ship too (harmless, just larger CSS).
- **`SmartImage`'s `Loaded` story embeds a downscaled gallery photo as a data
  URI.** If that photo is replaced in the repo, the preview keeps the old one
  until someone regenerates it.
- **The compiled stylesheet is deliberately broad.** It carries the utility
  vocabulary of the whole storefront, not just the seven components, because
  designs render as static CSS with no Tailwind at render time — a class absent
  from `styles.css` does nothing. Narrowing the `@source` set would silently
  shrink what the design agent can express.
