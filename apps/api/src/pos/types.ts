/**
 * POS bridge contract. The restaurant's live POS is not confirmed yet, so
 * every provider implements this one interface and the active one is
 * chosen with POS_PROVIDER. Wiring the real POS later means one adapter
 * file and two env vars. See docs/POS-INTEGRATION.md.
 */

export interface PosOrderLine {
  itemId: string;
  name: string;
  variant?: string;
  modifiers: string[];
  qty: number;
  unitPrice: number;
}

export interface PosOrder {
  orderNumber: string;
  placedAt: string;
  customer: { name: string; phone: string };
  delivery: { areaId: string; areaName: string; block: string; address: string; note?: string };
  payment: "COD" | "CARD";
  lines: PosOrderLine[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  source: "web";
}

export interface PosResult {
  ok: boolean;
  posReference?: string;
  error?: string;
}

export interface PosAdapter {
  name: string;
  submitOrder(order: PosOrder): Promise<PosResult>;
}
