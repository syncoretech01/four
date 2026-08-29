# POS Integration Guide

The platform places orders through a single bridge (`apps/api/src/pos/`),
so the restaurant's POS can be connected without touching the storefront.

## How it works

```
Checkout / AI assistant
        |
        v
POST /api/orders          <- validates + reprices server-side, HMAC confirm token
        |
        v
Order row (Postgres)      <- source of truth, status timeline, live tracking
        |
        v
PosAdapter.submitOrder    <- active adapter, chosen by POS_PROVIDER
        |
        v
The restaurant's POS / kitchen
```

If the adapter fails, the order is CANCELLED loudly and the customer is
told to retry or call - orders are never silently dropped.

## Available adapters

| `POS_PROVIDER` | What it does | Env vars |
|---|---|---|
| `console` (default) | Accepts and logs orders; keeps the site fully working before the POS is known | none |
| `webhook` | POSTs the order JSON to any URL: Zapier/Make/n8n, WhatsApp bot, Google Sheets bridge, or middleware in front of the POS | `POS_WEBHOOK_URL`, optional `POS_WEBHOOK_TOKEN` |
| `foodics` | Skeleton for Foodics cloud POS | `FOODICS_API_TOKEN`, `FOODICS_BRANCH_ID` |

## Status: pending confirmation

Operations named **BlinkCo** as the likely till system but asked to hold while
they confirm it. `POS_PROVIDER` therefore stays `console`: orders are stored,
appear on the kitchen console, and are worked from there.

No BlinkCo adapter exists yet, and one should not be guessed - it needs their
integration documentation or a support contact. When the provider is confirmed,
either point the `webhook` adapter at it or add an adapter as described below.

## Next step: identify the live POS

Ask FOUR's operations team what the tills run. Common paths:

- **Foodics** - REST API (`developers.foodics.com`). Finish the adapter:
  map each `itemId` from `packages/shared/src/menu-data.ts` to the
  Foodics product id, then `POST /orders` with the branch id.
- **Oscar POS / BlinkCo / Trax** - each exposes an orders API or accepts
  webhooks; point the `webhook` adapter at them or add a small adapter.
- **Square / Loyverse** - official REST APIs; add an adapter.
- **No API / legacy POS** - point the `webhook` adapter at a WhatsApp
  Business bot or a kitchen tablet screen; staff confirm manually.

To add an adapter: implement `PosAdapter` in `apps/api/src/pos/`,
register it in `ADAPTERS`, set `POS_PROVIDER`.

Note the admin console (`/admin`) already gives the kitchen a live order
board even with the `console` adapter, so the site is operational before
any POS wiring: staff work the board, statuses stream to customers.

## Reliability

Add a retry queue (e.g. a small worker or Upstash QStash) before launch
if the POS endpoint has downtime windows; today a failed submit cancels
the order and surfaces the error to the customer immediately.
