# FOUR - Restaurant Platform

Online ordering platform for **FOUR** (Fairways, DHA Phase 6, Lahore): smash
burgers, crown crust pizzas, loaded fries and shakes by Pakistan's biggest
creators. Monorepo: Next.js storefront, Fastify + Socket.IO API, Postgres,
AI chat + voice ordering, kitchen console, POS bridge.

## Quick start (development)

Requires **Node >= 22** and pnpm (via `corepack enable`).

```bash
pnpm install
# Postgres (docker compose up -d postgres, or any local PG 16)
cp .env.example .env            # set DATABASE_URL etc.
pnpm bootstrap                  # build shared + prisma generate/migrate/seed
pnpm dev:api                    # :4000
pnpm dev:web                    # :3000
```

`pnpm dev` runs both together. Every script that needs secrets is wrapped
in `dotenv -e .env --`, because the Prisma CLI and `tsx` run with their
working directory inside the package and would otherwise never see the
repo-root `.env`. `pnpm build` and `pnpm typecheck` are deliberately not
wrapped: they need no secrets, so CI runs them without an `.env` file.

Production one-shot: `docker compose up --build` (set `APP_SECRET`,
`ADMIN_PASSWORD` in `.env` first).

Deploying for real: **docs/DEPLOY-AWS.md** - one EC2 host running
`docker-compose.prod.yml`, with Caddy terminating TLS on a single public
origin so there is no CORS or cookie-domain problem. Note the API is
single-instance by design (Socket.IO has no Redis adapter), which the
document explains.

## Database migrations

The schema is versioned in `packages/db/prisma/migrations`. `pnpm db:deploy`
applies pending migrations; `pnpm db:migrate` creates a new one after editing
`schema.prisma`. Both dev and the API container run `prisma migrate deploy`,
so a schema change is reviewed as SQL in a pull request rather than pushed
straight at a live database.

`pnpm db:push` still exists for throwaway schema experiments. Don't run it
against a database that migrations also manage - the two drift apart.

## Tests

```bash
pnpm test                       # or: pnpm --filter @four/api test
```

The suite covers the paths where a bug costs money - the delivery-fee
threshold, the cash/card tax split, the HMAC confirm token, and that an order
is placed at exactly the total that was quoted. It runs against a real
Postgres through the real Fastify stack.

It needs its own database: the runner takes `TEST_DATABASE_URL`, else
`DATABASE_URL` with the database name swapped for `four_test`. The name must
end in `_test` or the suite refuses to start, since it writes and deletes
rows. Prisma creates the database on first run, then migrates and seeds it.

## What's inside

```
apps/web          Next.js 15 storefront + kitchen console (/admin) + live tracking (/track/<order>)
apps/api          Fastify: sessions, cart, orders, chat (OpenAI + fallback), Socket.IO, POS bridge
packages/db       Prisma schema + idempotent seed (official menu -> 11 categories, 56 items)
packages/shared   Official menu data, Lahore areas/blocks, zod schemas, socket contracts, brand constants
brand-assets/     Imported brand kit: logo vectors, menu sheet renders, 203 web-ready photos, brand book
```

### Storefront
- **Exact brand**: logo vectors extracted from the brand-kit PDF (never
  redrawn), official palette (beige `#E9DCC5`, red `#9D1D20`), real food
  photography mapped to menu items, printed-menu lightbox.
- **Hero**: the FOUR wordmark draws itself in (per-letter outline + fill)
  and reacts to the cursor with spring physics; the hand mark floats as a
  magnetic sticker on the hero photo.
- **Location popup**: Lahore areas (DHA 1-8, Gulberg, Model Town, Allama
  Iqbal Town, Johar Town, Bahria...) with block-level dropdowns;
  dismissible for free browsing.
- **Ordering**: item modals with sizes, meal deals and add-ons (pizza
  toppings priced by size), server-priced cart, checkout with PK phone
  validation, COD/card, delivery fee + tax lines, live order tracking.

### AI assistant (chat + voice)
- Chat streams over the session socket; with `OPENAI_API_KEY` set it runs
  a GPT tool loop (search menu, add to cart, prepare order, track...);
  without a key a deterministic parser handles the same commands
  ("a Bangkok Chipotle with lahori fries and a cola").
- Voice is a live **OpenAI Realtime** WebRTC call (mic up, voice down);
  the model's function calls execute server-side against the same cart,
  so voice orders appear in the UI instantly. Requires the key.
- The bot can only *prepare* an order (HMAC confirm token bound to
  session + cart + payment); the customer always completes checkout.

### Orders, admin, POS
- `/admin` (password: `ADMIN_PASSWORD`): live order board (new orders pop
  in over the socket), one-tap status advance that updates the customer's
  tracking page in real time, and per-item availability toggles.
- POS bridge (`apps/api/src/pos/`): `console` (default), `webhook`
  (Zapier/n8n/WhatsApp-bot/middleware), `foodics` skeleton. See
  **docs/POS-INTEGRATION.md**. Orders are never silently dropped - a POS
  failure cancels loudly.

## Business rules (confirm with operations)
- Prices: transcribed from the printed menu sheets (`brand-assets/menu`),
  exclusive of tax as printed.
- Tax: 16% cash / 5% card by default (`TAX_RATE_COD`, `TAX_RATE_CARD`).
- Delivery: Rs. 149, free above Rs. 2,500 (`packages/shared/src/constants.ts`).
- Fonts: brand faces (Aminute, Aloevera Display) are commercial; the site
  ships Fredoka + Poppins as stand-ins - swap the `@theme` font vars in
  `apps/web/src/app/globals.css` when the licensed files arrive.
- Item photos: mapped by eye from the brand shoot
  (`apps/web/public/menu-items/photo-map.json`); replace any file to
  update a card.
