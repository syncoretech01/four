"use client";

/**
 * Floating chat + voice assistant. Text goes over the session socket and
 * streams back (OpenAI path) or arrives in one shot (fallback bot); tool
 * chips show what the bot is doing; checkout confirm-actions open the
 * checkout panel with the quoted total. The voice tab is a live OpenAI
 * Realtime call whose function calls run against the same cart.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";
import { useBottomBarVisible } from "@/lib/useBottomBar";
import type { OrderQuote } from "@four/shared";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useStore } from "@/lib/store";
import { useRealtimeVoice, type VoiceToolOutcome } from "./useRealtimeVoice";
import { useSpeechVoice } from "./useSpeechVoice";

interface ToolChip {
  name: string;
  label: string;
  state: "running" | "done" | "error";
}

interface Turn {
  id: string;
  role: "user" | "assistant";
  content: string;
  tools?: ToolChip[];
  streaming?: boolean;
}

type ConfirmAction = { type: "checkout"; quote: OrderQuote };

const GREETING =
  'Assalam-o-alaikum! I take orders at FOUR. Try: "a Bangkok Chipotle with lahori fries and a cola", or tap the mic and just say it.';

export function ChatDock() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"chat" | "voice">("chat");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduce = useReduceMotion();
  // lift clear of the mobile basket bar on /menu so the two never collide
  const barVisible = useBottomBarVisible();
  const openCheckout = useStore((s) => s.openCheckout);
  const setCartOpen = useStore((s) => s.setCartOpen);
  /** True when the last user message came in by microphone: replies are then spoken back. */
  const spokeLastRef = useRef(false);

  // history + capability probe
  useEffect(() => {
    api<{ messages: { id: string; role: "user" | "assistant"; content: string; toolCalls: { name: string; label: string }[] }[]; voiceEnabled: boolean }>(
      "/api/chat/history",
    )
      .then((d) => {
        setVoiceEnabled(d.voiceEnabled);
        if (d.messages.length > 0) {
          setTurns(
            d.messages.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              tools: m.toolCalls.map((t) => ({ ...t, state: "done" as const })),
            })),
          );
        } else {
          setTurns([{ id: "greeting", role: "assistant", content: GREETING }]);
        }
      })
      .catch(() => setTurns([{ id: "greeting", role: "assistant", content: GREETING }]));
  }, []);

  const applyConfirm = useCallback(
    (confirmAction: unknown) => {
      const action = confirmAction as ConfirmAction | null;
      if (action?.type === "checkout") openCheckout(action.quote);
    },
    [openCheckout],
  );

  // socket streaming events
  useEffect(() => {
    const socket = getSocket();
    const onDelta = ({ messageId, delta }: { messageId: string; delta: string }) => {
      setTurns((p) => {
        const idx = p.findIndex((t) => t.id === messageId);
        if (idx === -1) return [...p, { id: messageId, role: "assistant", content: delta, streaming: true }];
        const next = [...p];
        next[idx] = { ...next[idx], content: next[idx].content + delta };
        return next;
      });
    };
    const onTool = ({ messageId, name, label, state }: { messageId: string; name: string; label: string; state: ToolChip["state"] }) => {
      setTurns((p) => {
        const idx = p.findIndex((t) => t.id === messageId);
        const chip = { name, label, state };
        if (idx === -1) return [...p, { id: messageId, role: "assistant", content: "", tools: [chip], streaming: true }];
        const next = [...p];
        const tools = [...(next[idx].tools ?? [])];
        const ti = tools.findIndex((t) => t.name === name && t.state === "running");
        if (ti >= 0 && state !== "running") tools[ti] = chip;
        else tools.push(chip);
        next[idx] = { ...next[idx], tools };
        return next;
      });
    };
    const onDone = ({
      messageId,
      content,
      navigateTo,
      confirmAction,
    }: {
      messageId: string;
      content: string;
      navigateTo: string | null;
      confirmAction: unknown | null;
    }) => {
      setTurns((p) => {
        const idx = p.findIndex((t) => t.id === messageId);
        if (idx === -1) return [...p, { id: messageId, role: "assistant", content }];
        const next = [...p];
        next[idx] = { ...next[idx], content, streaming: false };
        return next;
      });
      if (spokeLastRef.current) speakRef.current(content);
      applyConfirm(confirmAction);
      if (navigateTo) router.push(navigateTo);
    };
    socket.on("chat:delta", onDelta);
    socket.on("chat:tool", onTool);
    socket.on("chat:done", onDone);
    return () => {
      socket.off("chat:delta", onDelta);
      socket.off("chat:tool", onTool);
      socket.off("chat:done", onDone);
    };
  }, [applyConfirm, router]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  const sendMessage = useCallback(
    (message: string, spoken: boolean) => {
      if (!message) return;
      spokeLastRef.current = spoken;
      setTurns((p) => [...p, { id: `u-${Date.now()}`, role: "user", content: message }]);
      const socket = getSocket();
      if (socket.connected) {
        socket.emit("chat:send", { message });
      } else {
        // HTTP fallback keeps the assistant working without websockets
        api<{ content: string; toolCalls: ToolChip[]; navigateTo: string | null; confirmAction: unknown | null }>("/api/chat/messages", {
          method: "POST",
          body: JSON.stringify({ message }),
        })
          .then((r) => {
            setTurns((p) => [...p, { id: `a-${Date.now()}`, role: "assistant", content: r.content, tools: r.toolCalls }]);
            if (spokeLastRef.current) speakRef.current(r.content);
            applyConfirm(r.confirmAction);
            if (r.navigateTo) router.push(r.navigateTo);
          })
          .catch(() =>
            setTurns((p) => [...p, { id: `a-${Date.now()}`, role: "assistant", content: "Sorry, I lost connection - try again?" }]),
          );
      }
    },
    [applyConfirm, router],
  );

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const message = input.trim();
    setInput("");
    sendMessage(message, false);
  };

  const speech = useSpeechVoice((text) => sendMessage(text, true));
  const speakRef = useRef(speech.speak);
  speakRef.current = speech.speak;

  const runVoiceTool = useCallback(
    async (name: string, args: Record<string, unknown>): Promise<VoiceToolOutcome> => {
      const outcome = await api<VoiceToolOutcome>("/api/chat/tool", { method: "POST", body: JSON.stringify({ name, args }) });
      applyConfirm(outcome.confirmAction);
      if (outcome.navigateTo) router.push(outcome.navigateTo);
      return outcome;
    },
    [applyConfirm, router],
  );

  const voice = useRealtimeVoice(runVoiceTool);

  const closeDock = () => {
    setOpen(false);
    voice.stop();
    setMode("chat");
  };

  return (
    <>
      <motion.button
        onClick={() => {
          if (open) closeDock();
          else {
            setOpen(true);
            setCartOpen(false);
          }
        }}
        aria-label={open ? "Close assistant" : "Open ordering assistant"}
        className={`fixed right-5 z-40 flex h-15 w-15 items-center justify-center rounded-full bg-red text-cream transition hover:bg-red-deep border-2 border-ink-900 [box-shadow:var(--shadow-pop)] ${
          barVisible ? "bottom-24 lg:bottom-5" : "bottom-5"
        }`}
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
            className={`fixed right-5 z-40 flex h-[min(36rem,74dvh)] w-[min(25rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-card bg-cream border-2 border-ink-900 [box-shadow:var(--shadow-pop-lg)] ${
              barVisible ? "bottom-[10.5rem] lg:bottom-24" : "bottom-24"
            }`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <header className="flex items-center gap-3 bg-red px-5 py-4 text-cream">
              <span className="font-display flex h-9 w-9 items-center justify-center rounded-full bg-cream text-sm font-bold text-red border-2 border-red-press [box-shadow:var(--shadow-pop-red)]">
                4
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold leading-tight">FOUR Assistant</p>
                <p className="text-xs leading-tight opacity-80">
                  {mode === "voice"
                    ? voice.status === "live"
                      ? voice.listening
                        ? "Listening..."
                        : voice.speaking
                          ? "Speaking..."
                          : "On call - just talk"
                      : voice.status === "connecting"
                        ? "Connecting..."
                        : "Voice ordering"
                    : "Order by chat or voice"}
                </p>
              </div>
              {voiceEnabled && (
                <div className="flex rounded-full bg-red-deep/60 p-1 text-xs font-semibold">
                  <button
                    onClick={() => {
                      setMode("chat");
                      voice.stop();
                    }}
                    className={`rounded-full px-3 py-1 transition ${mode === "chat" ? "bg-cream text-red" : "text-cream/80"}`}
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => {
                      setMode("voice");
                      void voice.start();
                    }}
                    className={`rounded-full px-3 py-1 transition ${mode === "voice" ? "bg-cream text-red" : "text-cream/80"}`}
                  >
                    Voice
                  </button>
                </div>
              )}
            </header>

            {mode === "voice" ? (
              <VoicePanel voice={voice} />
            ) : (
              <>
                <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                  {turns.map((t) => (
                    <div key={t.id} className={t.role === "user" ? "flex justify-end" : "flex flex-col items-start gap-1.5"}>
                      {t.tools && t.tools.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {t.tools.map((tool, i) => (
                            <span
                              key={i}
                              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                tool.state === "error" ? "bg-red/15 text-red" : "bg-beige-deep text-ink-soft"
                              }`}
                            >
                              {tool.state === "running" ? `${tool.label}...` : tool.label}
                            </span>
                          ))}
                        </div>
                      )}
                      {(t.content || t.streaming) && (
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            t.role === "user" ? "rounded-br-md bg-red text-cream" : "rounded-bl-md bg-beige-deep text-ink"
                          }`}
                        >
                          {t.content}
                          {t.streaming && <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-red align-middle" />}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={send} className="flex items-center gap-2 border-t border-ink-900/20 p-3">
                  {!voiceEnabled && speech.supported && (
                    <button
                      type="button"
                      onClick={speech.status === "listening" ? speech.stopListening : speech.listen}
                      aria-label={speech.status === "listening" ? "Stop listening" : "Order by voice"}
                      className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-90 ${
                        speech.status === "listening" ? "bg-red text-cream" : "bg-beige-deep text-ink hover:text-red"
                      }`}
                    >
                      {speech.status === "listening" && !reduce && (
                        <motion.span
                          className="absolute inset-0 rounded-full bg-red border-2 border-ink-900 [box-shadow:var(--shadow-pop)]"
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
                    placeholder={speech.status === "listening" ? (speech.interim || "Listening...") : "Type your order..."}
                    aria-label="Message the assistant"
                    className="h-11 flex-1 rounded-full border-2 border-ink-900/25 bg-cream px-4 text-sm text-ink outline-none transition focus:border-red focus:ring-2 focus:ring-red/30 [box-shadow:var(--shadow-pop-red)]"
                  />
                  <button
                    type="submit"
                    aria-label="Send"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red text-cream transition hover:bg-red-deep active:scale-90 border-2 border-ink-900 [box-shadow:var(--shadow-pop)]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M3 12L21 3l-4 18-5.5-6.5L3 12Z" fill="currentColor" />
                    </svg>
                  </button>
                </form>
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

function VoicePanel({ voice }: { voice: ReturnType<typeof useRealtimeVoice> }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [voice.turns]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-center py-6">
        <div
          className={`relative flex h-24 w-24 items-center justify-center rounded-full transition-colors ${
            voice.status === "live" ? "bg-red" : "bg-beige-deep"
          }`}
          style={{ transform: `scale(${1 + voice.level * 0.25})` }}
        >
          {voice.status === "live" && (
            <span className="absolute inset-0 animate-ping rounded-full bg-red/30" aria-hidden />
          )}
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="relative text-cream" aria-hidden>
            <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {voice.error && <p className="px-5 pb-2 text-center text-sm font-medium text-red">{voice.error}</p>}

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 pb-3">
        {voice.turns.map((t) => (
          <div
            key={t.id}
            className={`max-w-[88%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
              t.role === "user" ? "ml-auto rounded-br-md bg-red text-cream" : "rounded-bl-md bg-beige-deep text-ink"
            }`}
          >
            {t.text}
          </div>
        ))}
        {voice.tools.slice(-3).map((t) => (
          <span key={t.id} className="mr-1.5 inline-block rounded-full bg-beige-deep px-2.5 py-1 text-[11px] font-medium text-ink-soft">
            {t.status === "running" ? `${t.label}...` : t.label}
          </span>
        ))}
      </div>

      <div className="border-t border-ink-900/20 p-3 text-center">
        {voice.status === "live" || voice.status === "connecting" ? (
          <button
            onClick={voice.stop}
            className="rounded-full border-2 border-red px-6 py-2.5 text-sm font-semibold text-red transition hover:bg-red hover:text-cream"
          >
            End voice session
          </button>
        ) : (
          <button
            onClick={() => void voice.start()}
            className="rounded-full bg-red px-6 py-2.5 text-sm font-semibold text-cream transition hover:bg-red-deep border-2 border-ink-900 [box-shadow:var(--shadow-pop)]"
          >
            Start talking
          </button>
        )}
      </div>
    </div>
  );
}
