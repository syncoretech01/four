/**
 * POS bridge contract. The restaurant's live POS is not confirmed yet, so
 * every provider implements this one interface and the active one is
 * chosen with the POS_PROVIDER env var. Adding the real POS later means
 * writing one adapter file and setting two env vars; nothing else in the
 * app changes. See docs/POS-INTEGRATION.md.
 */

export interface PosOrderLine {
  itemId: string;
  name: string;
  variant?: string;
  qty: number;
  unitPrice: number;
}

export interface PosOrder {
  orderNumber: string;
  placedAt: string; // ISO timestamp
  customer: { name: string; phone: string };
  delivery: {
    areaId: string;
    areaName: string;
    block: string;
    address: string;
    note?: string;
  };
  payment: "cod" | "card";
  lines: PosOrderLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  source: "web";
}

export interface PosResult {
  ok: boolean;
  /** Ticket/reference id inside the POS, when the provider returns one. */
  posReference?: string;
  error?: string;
}

export interface PosAdapter {
  name: string;
  submitOrder(order: PosOrder): Promise<PosResult>;
}
