/**
 * POS bridge contract. Every provider implements this one interface and the
 * active one is chosen with POS_PROVIDER. The confirmed till system is
 * Corn POS (see the cornpos adapter); the rest remain as fallbacks and
 * demo aids. See docs/POS-INTEGRATION.md.
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
  /** Which FOUR branch cooks this order; the POS routes it to that outlet's till/KDS. */
  branch?: { id: string; name: string };
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
