"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { assistantReply, toCartView, type AssistantAction } from "@/lib/assistant/parser";
import { useVoice } from "@/lib/assistant/useVoice";
import { useStore } from "@/lib/store";

interface Turn {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const GREETING =
  "Assalam-o-alaikum! I can take your whole order. Try saying: \"I want a Bangkok Chipotle with large fries and a coke\".";

/**
 * Floating chat + voice assistant. Understands natural orders, adds them
 * to the cart, and walks the customer to checkout. Voice runs on the
 * Web Speech API (no key needed); replies are spoken back when the
 * conversation started by voice.
 */
export function ChatDock() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([{ id: "g", role: "assistant", text: GREETING }]);
  const [input, setInput] = useState("");
  const voiceMode = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const store = useStore;
  const setCartOpen = useStore((s) => s.setCartOpen);

  const runActions = useCallback(
    (actions: AssistantAction[]) => {
      const s = store.getState();
      for (const a of actions) {
        switch (a.type) {
          case "add":
            s.add(a.itemId, a.qty, a.variantId);
            break;
          case "remove": {
            for (const line of store.getState().lines.filter((l) => l.itemId === a.itemId)) s.remove(line.key);
            break;
          }
          case "clear":
            s.clear();
            break;
          case "open-cart":
          case "checkout":
            s.setCartOpen(true);
            break;
          case "open-location":
            document.querySelector<HTMLButtonElement>("[data-open-location]")?.click();
            break;
          case "show-menu":
            document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
            break;
        }
      }
    },
    [store],
  );

  const handleMessage = useCallback(
    (raw: string, spoken: boolean) => {
      const text = raw.trim();
      if (!text) return;
      voiceMode.current = spoken;
      setTurns((p) => [...p, { id: `u${p.length}`, role: "user", text }]);

      const cart = toCartView(store.getState().lines);
      const { reply, actions } = assistantReply(text, cart);
      runActions(actions);
      setTurns((p) => [...p, { id: `a${p.length}`, role: "assistant", text: reply }]);
      if (spoken) speak(reply);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [runActions, store],
  );

  const { status, interim, listen, stopListening, speak, supported } = useVoice((t) => handleMessage(t, true));

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, interim]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    handleMessage(input, false);
    setInput("");
  };

  return (
    <>
      {/* launcher */}
      <motion.button
        onClick={() => {
          setOpen((o) => !o);
          setCartOpen(false);
        }}
        aria-label={open ? "Close assistant" : "Open ordering assistant"}
        className="fixed bottom-5 right-5 z-40 flex h-15 w-15 items-center justify-center rounded-full bg-red text-cream shadow-xl shadow-red/30 transition hover:bg-red-deep"
        whileTap={reduce ? undefined : { scale: 0.92 }}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H9l-4.2 3.5A.8.8 0 0 1 3.5 19V16A3 3 0 0 1 4 13V6Z"
              fill="currentColor"
            />
          </svg>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-label="FOUR ordering assistant"
            className="fixed bottom-24 right-5 z-40 flex h-[min(34rem,72dvh)] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-card bg-cream shadow-2xl shadow-ink/25"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <header className="flex items-center gap-3 bg-red px-5 py-4 text-cream">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream font-display text-sm text-red">4</span>
              <div>
                <p className="text-sm font-bold leading-tight">FOUR Assistant</p>
                <p className="text-xs leading-tight opacity-80">
                  {status === "listening" ? "Listening..." : status === "speaking" ? "Speaking..." : "Order by chat or voice"}
                </p>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {turns.map((t) => (
                <div
                  key={t.id}
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    t.role === "user"
                      ? "ml-auto rounded-br-md bg-red text-cream"
                      : "rounded-bl-md bg-beige-deep text-ink"
                  }`}
                >
                  {t.text}
                </div>
              ))}
              {interim && (
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-red/50 px-4 py-2.5 text-sm italic text-cream">
                  {interim}
                </div>
              )}
            </div>

            <form onSubmit={submit} className="flex items-center gap-2 border-t border-ink/10 p-3">
              {supported && (
                <button
                  type="button"
                  onClick={status === "listening" ? stopListening : listen}
                  aria-label={status === "listening" ? "Stop listening" : "Order by voice"}
                  className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-90 ${
                    status === "listening" ? "bg-red text-cream" : "bg-beige-deep text-ink hover:text-red"
                  }`}
                >
                  {status === "listening" && !reduce && (
                    <motion.span
                      className="absolute inset-0 rounded-full bg-red"
                      animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="relative" aria-hidden>
                    <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
                    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your order..."
                aria-label="Message the assistant"
                className="h-11 flex-1 rounded-full border border-ink/15 bg-cream px-4 text-sm text-ink outline-none transition focus:border-red focus:ring-2 focus:ring-red/30"
              />
              <button
                type="submit"
                aria-label="Send"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red text-cream transition hover:bg-red-deep active:scale-90"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M3 12L21 3l-4 18-5.5-6.5L3 12Z" fill="currentColor" />
                </svg>
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
