"use client";

import { AnimatePresence, motion } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import { useToasts } from "@/lib/toast";
import { useBottomBarVisible } from "@/lib/useBottomBar";

/**
 * Global toast surface (the DS `f-toast` family, previously unused).
 * Mounted once in the root layout; fed by the imperative `toast.*` API.
 * Lifts above the mobile basket bar when that bar is on screen.
 */
export function ToastStack() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  const lifted = useBottomBarVisible();
  const reduce = useReduceMotion();

  return (
    <div className={`f-toast-stack ${lifted ? "bottom-[6.5rem] lg:bottom-6" : ""}`}>
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => {
          const action = t.action;
          return (
            <motion.div
              key={t.id}
              layout={!reduce}
              initial={reduce ? false : { y: 16, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              role={t.kind === "error" ? "alert" : "status"}
              className={`f-toast ${t.kind === "success" ? "f-toast--success" : ""} ${t.kind === "error" ? "f-toast--error" : ""}`}
            >
              <span className="f-toast__dot" aria-hidden />
              <span>{t.message}</span>
              {action && (
                <button
                  onClick={() => {
                    action.onClick();
                    dismiss(t.id);
                  }}
                  className="f-toast__action"
                >
                  {action.label}
                </button>
              )}
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="f-toast__action">
                ✕
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
