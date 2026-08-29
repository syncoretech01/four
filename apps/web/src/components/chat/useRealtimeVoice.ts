"use client";

/**
 * Browser-side OpenAI Realtime voice client (ported from the bestbuy
 * implementation). Flow: mint a short-lived token from our API, open a
 * WebRTC peer connection to OpenAI (mic up, assistant audio down, a data
 * channel for events); when the model emits a function call we execute it
 * server-side via /api/chat/tool against the same session cart, and feed
 * the result back. The OpenAI key never touches the browser.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

export type VoiceStatus = "idle" | "connecting" | "live" | "error";

export interface VoiceTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export interface VoiceToolChip {
  id: string;
  label: string;
  status: "running" | "done" | "error";
}

export interface VoiceToolOutcome {
  result: unknown;
  label: string;
  navigateTo: string | null;
  confirmAction: unknown | null;
}

export function useRealtimeVoice(onTool: (name: string, args: Record<string, unknown>) => Promise<VoiceToolOutcome>) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<VoiceTurn[]>([]);
  const [tools, setTools] = useState<VoiceToolChip[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [level, setLevel] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const acRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const greetedRef = useRef(false);
  const onToolRef = useRef(onTool);
  onToolRef.current = onTool;

  const teardown = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    dcRef.current?.close();
    dcRef.current = null;
    micRef.current?.getTracks().forEach((t) => t.stop());
    micRef.current = null;
    pcRef.current?.getSenders().forEach((s) => s.track?.stop());
    pcRef.current?.close();
    pcRef.current = null;
    if (acRef.current && acRef.current.state !== "closed") void acRef.current.close();
    acRef.current = null;
    if (audioRef.current) {
      audioRef.current.srcObject = null;
      audioRef.current.remove();
      audioRef.current = null;
    }
    setSpeaking(false);
    setListening(false);
    setLevel(0);
  }, []);

  const stop = useCallback(() => {
    teardown();
    setStatus("idle");
  }, [teardown]);

  const meter = useCallback((stream: MediaStream) => {
    try {
      const ac = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      acRef.current = ac;
      const src = ac.createMediaStreamSource(stream);
      const analyser = ac.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i]! - 128) / 128;
          sum += v * v;
        }
        setLevel(Math.min(1, Math.sqrt(sum / buf.length) * 3.2));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      /* metering is decorative */
    }
  }, []);

  const handleEvent = useCallback((ev: Record<string, unknown>) => {
    const type = String(ev.type ?? "");
    // Event names vary slightly across Realtime API versions; match suffixes.
    if (type === "session.created" || type === "session.updated") {
      setStatus("live");
      if (!greetedRef.current && dcRef.current?.readyState === "open") {
        greetedRef.current = true;
        dcRef.current.send(
          JSON.stringify({
            type: "response.create",
            response: {
              instructions:
                "Greet the customer warmly in one short spoken sentence (Assalam-o-alaikum style) and ask what they are craving today.",
            },
          }),
        );
      }
      return;
    }
    if (type.endsWith("speech_started")) return setListening(true);
    if (type.endsWith("speech_stopped")) return setListening(false);
    if (type === "output_audio_buffer.started") return setSpeaking(true);
    if (type === "output_audio_buffer.stopped") return setSpeaking(false);
    if (type.endsWith("input_audio_transcription.completed")) {
      const text = String(ev.transcript ?? "").trim();
      if (text) setTurns((p) => [...p, { id: `u${p.length}-${text.slice(0, 6)}`, role: "user", text }]);
      return;
    }
    if (type.endsWith("audio_transcript.delta")) {
      const delta = String(ev.delta ?? "");
      setTurns((p) => {
        const last = p[p.length - 1];
        if (last?.role === "assistant" && last.id.startsWith("a-open")) {
          return [...p.slice(0, -1), { ...last, text: last.text + delta }];
        }
        return [...p, { id: `a-open-${p.length}`, role: "assistant", text: delta }];
      });
      return;
    }
    if (type.endsWith("audio_transcript.done")) {
      setTurns((p) => p.map((t) => (t.id.startsWith("a-open") ? { ...t, id: `a-${t.id}` } : t)));
      return;
    }
    if (type.endsWith("function_call_arguments.done")) {
      const name = String(ev.name ?? "");
      const callId = String(ev.call_id ?? "");
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(String(ev.arguments ?? "{}")) as Record<string, unknown>;
      } catch {
        /* keep empty */
      }
      setTools((p) => [...p, { id: callId, label: name, status: "running" }]);
      void (async () => {
        try {
          const outcome = await onToolRef.current(name, parsed);
          setTools((p) => p.map((t) => (t.id === callId ? { ...t, label: outcome.label, status: "done" } : t)));
          dcRef.current?.send(
            JSON.stringify({
              type: "conversation.item.create",
              item: { type: "function_call_output", call_id: callId, output: JSON.stringify(outcome.result) },
            }),
          );
          dcRef.current?.send(JSON.stringify({ type: "response.create" }));
        } catch (e) {
          setTools((p) => p.map((t) => (t.id === callId ? { ...t, status: "error" } : t)));
          dcRef.current?.send(
            JSON.stringify({
              type: "conversation.item.create",
              item: {
                type: "function_call_output",
                call_id: callId,
                output: JSON.stringify({ error: e instanceof Error ? e.message : "tool failed" }),
              },
            }),
          );
          dcRef.current?.send(JSON.stringify({ type: "response.create" }));
        }
      })();
      return;
    }
    if (type === "error" || type.endsWith(".error")) {
      const msg = (ev.error as { message?: string } | undefined)?.message;
      if (msg) setError(msg);
    }
  }, []);

  const start = useCallback(async () => {
    if (status === "connecting" || status === "live") return;
    setError(null);
    setTurns([]);
    setTools([]);
    greetedRef.current = false;
    setStatus("connecting");
    try {
      const cfg = await api<{ token: string; model: string }>("/api/chat/realtime-token", { method: "POST" });
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Voice needs a secure (https) connection for microphone access.");
      }

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const audio = new Audio();
      audio.autoplay = true;
      audioRef.current = audio;
      pc.ontrack = (e) => {
        audio.srcObject = e.streams[0]!;
        meter(e.streams[0]!);
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setError("Voice connection dropped.");
          stop();
        }
      };

      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      micRef.current = mic;
      mic.getTracks().forEach((t) => pc.addTrack(t, mic));

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onmessage = (e) => {
        try {
          handleEvent(JSON.parse(e.data as string) as Record<string, unknown>);
        } catch {
          /* ignore non-JSON frames */
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: offer.sdp,
        headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/sdp" },
      });
      if (!sdpRes.ok) throw new Error("Voice handshake failed");
      const answer = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answer });
    } catch (e) {
      teardown();
      const msg =
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Microphone access was blocked. Enable it to talk."
          : e instanceof Error
            ? e.message
            : "Could not start voice.";
      setError(msg);
      setStatus("error");
    }
  }, [status, meter, handleEvent, stop, teardown]);

  useEffect(() => () => teardown(), [teardown]);

  return { status, error, turns, tools, speaking, listening, level, start, stop };
}
