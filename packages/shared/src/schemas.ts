import { z } from "zod";

/** A chosen modifier on a cart line, e.g. a meal deal or an add-on. */
export const modifierSelectionSchema = z.object({
  groupId: z.string().min(1).max(60),
  optionId: z.string().min(1).max(60),
  qty: z.number().int().min(1).max(5).default(1),
});
export type ModifierSelection = z.infer<typeof modifierSelectionSchema>;

export const cartAddSchema = z.object({
  itemId: z.string().min(1).max(80),
  variantId: z.string().min(1).max(40).optional(),
  qty: z.number().int().min(1).max(20).default(1),
  modifiers: z.array(modifierSelectionSchema).max(8).default([]),
});
export type CartAddInput = z.infer<typeof cartAddSchema>;

export const cartUpdateSchema = z.object({
  lineId: z.string().min(1),
  qty: z.number().int().min(0).max(20),
});

export const pkPhoneSchema = z
  .string()
  .transform((s) => s.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^(\+92|0)3\d{9}$/, "Enter a valid Pakistani mobile number, e.g. 0300 1234567"));

export const checkoutSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: pkPhoneSchema,
  areaId: z.string().min(1).max(60),
  block: z.string().min(1).max(80),
  address: z.string().trim().min(8).max(240),
  note: z.string().trim().max(240).optional(),
  payment: z.enum(["COD", "CARD"]),
  /** HMAC token minted by the quote endpoint; binds order to session + cart hash. */
  confirmToken: z.string().min(10),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const chatSendSchema = z.object({
  message: z.string().trim().min(1).max(600),
});

export interface CartLineView {
  lineId: string;
  itemId: string;
  name: string;
  variantId?: string;
  variantLabel?: string;
  modifiers: { groupId: string; optionId: string; label: string; price: number; qty: number }[];
  qty: number;
  unitPrice: number;
  lineTotal: number;
  image?: string;
}

export interface CartView {
  lines: CartLineView[];
  subtotal: number;
  itemCount: number;
}

export interface OrderQuote {
  subtotal: number;
  deliveryFee: number;
  taxRate: number;
  tax: number;
  total: number;
  payment: "COD" | "CARD";
  confirmToken: string;
}

export interface OrderView {
  orderNumber: string;
  status: string;
  placedAt: string;
  branchId?: string;
  branchName?: string;
  riderName?: string;
  destLat?: number;
  destLng?: number;
  customerName: string;
  phone: string;
  areaName: string;
  block: string;
  address: string;
  note?: string;
  payment: "COD" | "CARD";
  /** Where to finish paying, when the order is still held at the gateway. */
  paymentUrl?: string;
  /** "35-45 min", from the delivery area's distance. */
  etaLabel?: string;
  lines: { name: string; variantLabel?: string; modifiers: string[]; qty: number; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  events: { status: string; at: string }[];
}
