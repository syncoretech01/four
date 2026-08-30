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
| `console` (default) | Accepts and logs orders; keeps the site fully working before the POS credentials arrive | none |
| `cornpos` | **The confirmed till system.** POSTs each order to Corn POS's intake with the outlet id of the branch that cooks it | `CORNPOS_API_URL`, `CORNPOS_API_KEY`, `CORNPOS_BRANCH_MAP` |
| `webhook` | POSTs the order JSON to any URL: Zapier/Make/n8n, WhatsApp bot, Google Sheets bridge, or middleware in front of the POS | `POS_WEBHOOK_URL`, optional `POS_WEBHOOK_TOKEN` |
| `demo` | Accepts every order and keeps the payload, shown at `/admin` -> POS feed. For demonstrating the integration to the vendor | none |
| `foodics` | Skeleton for Foodics cloud POS (kept as a fallback) | `FOODICS_API_TOKEN`, `FOODICS_BRANCH_ID` |

## Status: Corn POS confirmed

Operations confirmed the till system is **Corn POS**
(<https://www.cornpos.com>), a Lahore cloud POS with kitchen displays,
online-order intake and its own rider app. They publish no public developer
documentation - integrations are arranged by their team:

- **info@cornpos.com** / **+92 42 35972044**

The `cornpos` adapter (`apps/api/src/pos/adapters.ts`) is ready and is pure
configuration once their team hands over the account details. Until then
`POS_PROVIDER` stays `console`: orders are stored, appear on the kitchen
console at `/admin`, and are worked from there - nothing is blocked.

## Going live: what to ask Corn POS support

Give them a sample payload first - place a test order with
`POS_PROVIDER=demo` and copy the JSON from `/admin` -> POS feed. That is
exactly what the adapter sends, plus an `outletId` field. Then confirm:

1. **Order-intake endpoint URL** for FOUR's account -> `CORNPOS_API_URL`.
2. **API key** and which header they read it from -> `CORNPOS_API_KEY`.
   The adapter sends the key as both `x-api-key` and `Authorization:
   Bearer`, which covers the common conventions; if they use a different
   header, it is a one-line change in the adapter.
3. **Outlet ids** for the three branches -> `CORNPOS_BRANCH_MAP`, e.g.
   `fairways-dha6:101,allama-iqbal-town:102,lake-city:103`, so each order
   lands on the right branch's till/KDS.
4. **Payload mapping** - whether they ingest our JSON as-is or need field
   renames (menu item codes, payment codes). Renames belong in the
   adapter, not the storefront.
5. **Response shape** - the adapter keeps any `reference`/`orderId`/`id`
   they return against the order as `posReference`.

Then set in `.env`:

```
POS_PROVIDER=cornpos
CORNPOS_API_URL=...
CORNPOS_API_KEY=...
CORNPOS_BRANCH_MAP=fairways-dha6:...,allama-iqbal-town:...,lake-city:...
```

One thing to decide with them: Corn POS also sells its own online-ordering
and rider tracking. FOUR's storefront already does both (checkout, live
GPS tracking at `/track`, rider app at `/rider`), so the clean split is:
this platform is the customer-facing layer, Corn POS is the till/kitchen
layer, and orders flow one way through this adapter.

To add a different adapter later: implement `PosAdapter` in
`apps/api/src/pos/`, register it in `ADAPTERS`, set `POS_PROVIDER`.

Note the admin console (`/admin`) already gives the kitchen a live order
board even with the `console` adapter, so the site is operational before
any POS wiring: staff work the board, statuses stream to customers.

## Reliability

Add a retry queue (e.g. a small worker or Upstash QStash) before launch
if the POS endpoint has downtime windows; today a failed submit cancels
the order and surfaces the error to the customer immediately.
