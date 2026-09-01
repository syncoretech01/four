"use client";

import { create } from "zustand";

export type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface ToastState {
  toasts: ToastItem[];
  push: (kind: ToastKind, message: string, action?: ToastItem["action"]) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

/**
 * Deliberately its own store (not lib/store.ts) so the persisted store's
 * `partialize` can never accidentally write toasts to localStorage.
 */
export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  push: (kind, message, action) => {
    const id = nextId++;
    // cap the stack at 3, dropping the oldest
    set((s) => ({ toasts: [...s.toasts, { id, kind, message, action }].slice(-3) }));
    setTimeout(() => get().dismiss(id), kind === "error" ? 6000 : 4000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative API usable from plain `.catch()` handlers. */
export const toast = {
  success: (message: string, action?: ToastItem["action"]) => useToasts.getState().push("success", message, action),
  error: (message: string, action?: ToastItem["action"]) => useToasts.getState().push("error", message, action),
  info: (message: string, action?: ToastItem["action"]) => useToasts.getState().push("info", message, action),
};
