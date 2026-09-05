"use client";

/**
 * Imperative spark API, shaped like lib/toast.ts so the two global feedback
 * surfaces work the same way: a module-level emitter, one mounted surface in
 * the root layout, callable from anywhere including plain `.then()` handlers.
 *
 * Deliberately not a zustand store — sparks are transient pixels, never state,
 * and nothing should ever re-render because one fired.
 */

type Listener = (x: number, y: number) => void;

const listeners = new Set<Listener>();

/** Subscribe the canvas. Returns an unsubscribe. */
export function onSpark(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Burst at viewport coordinates. */
export function spark(x: number, y: number): void {
  for (const fn of listeners) fn(x, y);
}

/**
 * Burst at the centre of an element — the form the call sites use, so that a
 * keyboard-activated add sparks in the right place too. A click's own
 * coordinates would be wrong (or absent) for that case.
 */
export function sparkFrom(el: Element | null | undefined): void {
  if (!el) return;
  const r = el.getBoundingClientRect();
  spark(r.left + r.width / 2, r.top + r.height / 2);
}
