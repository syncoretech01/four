# POS Integration Guide

The website places orders through a single bridge (`src/lib/pos/`), so the
restaurant's POS can be connected without touching the storefront.

## How it works

```
Checkout / AI assistant
        |
        v
POST /api/orders        <- validates the order, reprices it server-side
        |
        v
PosAdapter.submitOrder  <- the active adapter, chosen by POS_PROVIDER
        |
        v
The restaurant's POS / kitchen
```

Every adapter implements one interface (`src/lib/pos/types.ts`):

```ts
interface PosAdapter {
  name: string;
  submitOrder(order: PosOrder): Promise<PosResult>;
}
```

`PosOrder` carries everything a ticket needs: order number, customer name +
phone, area/block/street address, payment method, priced lines, and totals.
Prices are always recomputed on the server from `src/data/menu.ts`; the
client can never set a price.

## Available adapters

| `POS_PROVIDER` | What it does | Env vars |
|---|---|---|
| `console` (default) | Accepts and logs orders; keeps the site fully working before the POS is known | none |
| `webhook` | POSTs the order JSON to any URL: Zapier/Make/n8n, WhatsApp bot, Google Sheets bridge, or middleware in front of the POS | `POS_WEBHOOK_URL`, optional `POS_WEBHOOK_TOKEN` |
| `foodics` | Skeleton for Foodics cloud POS | `FOODICS_API_TOKEN`, `FOODICS_BRANCH_ID` |

## Next step: identify the live POS

Ask the FOUR operations team which system the tills run. The common ones in
Pakistani restaurant chains and the integration path for each:

- **Foodics** - REST API (`developers.foodics.com`). Finish the
  `foodicsAdapter`: map each `itemId` in `src/data/menu.ts` to the Foodics
  product id, then `POST /orders` with the branch id.
- **Oscar POS / BlinkCo / Trax** - each exposes an orders API or accepts a
  webhook; use the `webhook` adapter pointed at their endpoint, or add a
  10-line adapter file.
- **Square / Loyverse** - official REST APIs; add an adapter alongside the
  existing ones.
- **Offline/legacy POS with no API** - point the `webhook` adapter at a
  WhatsApp Business bot or a tablet-facing order screen; the kitchen
  confirms orders manually until the POS is replaced.

To add a new adapter: create `src/lib/pos/yourpos.ts` implementing
`PosAdapter`, register it in `ADAPTERS` in `src/lib/pos/adapters.ts`, set
`POS_PROVIDER=yourpos`.

## Reliability notes

- If the adapter fails, `/api/orders` returns 502 and the customer is told
  to retry or call; orders are never silently dropped.
- Add a retry queue (e.g. Upstash QStash or a small Redis worker) before
  launch if the POS endpoint has downtime windows.
