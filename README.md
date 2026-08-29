# FOUR - Restaurant Web App

Online ordering web app for **FOUR** (Fairways, DHA Phase 6, Lahore): gourmet
smash burgers, desi-fusion pizzas, loaded fries and shakes, delivered across
Lahore.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start   # production
```

No environment variables are required to run; see `.env.example` for the
POS bridge and optional LLM settings.

## What's inside

- **Delivery-area popup** - first visit asks for the customer's Lahore area
  (DHA Phases 1-8, Gulberg 1-3, Model Town, Allama Iqbal Town, Johar Town,
  and more) with block-level dropdowns (Nargis Block, Raza Block, Ravi
  Block, ...). Closable with X so visitors can browse freely; re-opens from
  the nav chip. Data: `src/data/locations.ts`.
- **Animated hero** - an anime.js timeline assembles a layered smash burger
  (drop-in, elastic settle, top-bun squash), then it floats and
  parallax-follows the cursor. Click it to re-smash.
  `src/components/hero/BurgerBuild.tsx`.
- **Interactive menu** - real FOUR items and prices (from their public
  listings; entries marked `verify` in `src/data/menu.ts` need
  confirmation), category rail with animated pill, item cards opening into
  full cards with size variants, and a "View the real menu" lightbox that
  shows the printed menu board per category.
- **Cart & checkout** - slide-in cart, quantity control, validated checkout
  (Pakistani mobile format, area/block, address), COD or card-on-delivery,
  order confirmation with an order number. Free delivery above Rs. 2,500.
- **AI chatbot + voicebot** - the floating assistant takes natural orders:
  *"I want a Bangkok Chipotle with large fries and a coke"* parses items,
  sizes and quantities, adds them to the cart, and walks to checkout.
  Voice uses the browser's Web Speech API (no key needed) and speaks
  replies back. Deterministic parser adapted from the bestbuy repo's
  fallback-bot; an LLM can be layered on server-side later.
  `src/lib/assistant/`.
- **POS bridge** - orders POST to `/api/orders`, are re-priced server-side,
  and hand off to a pluggable POS adapter (`console` default, generic
  `webhook`, `foodics` skeleton). The restaurant's live POS is not yet
  confirmed; see **docs/POS-INTEGRATION.md** for the wiring plan.

## Brand assets

The site is built to take the exact brand kit as drop-in files, with
graceful branded fallbacks until they arrive:

- `public/brand/` - logo + logomark (see its README)
- `public/menu/items/` - one photo per dish, named by item id
- `public/menu/boards/` - scans of the real printed menu per category
- `public/gallery/` - restaurant photography

Palette: beige ground `#EFE7D9`, cream surfaces, single red accent
`#C8102E`, warm ink text. Type: Anton (display) + Archivo (body).

## Stack

Next.js 15 (App Router) · React 19 · Tailwind v4 · Motion · anime.js ·
Zustand · Zod. State persists in localStorage; no database required for
the storefront.
