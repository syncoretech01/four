"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Keyless voicebot built on the Web Speech API: SpeechRecognition for
 * listening, speechSynthesis for talking back. Works out of the box in
 * Chrome/Edge/Safari over https with no API key. The hook mirrors the
 * bestbuy realtime-voice interface so a WebRTC realtime provider can be
 * swapped in later without touching the ChatDock.
 */

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

export type VoiceStatus = "unsupported" | "idle" | "listening" | "speaking";

export function useVoice(onFinalTranscript: (text: string) => void) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [interim, setInterim] = useState("");
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinalTranscript);
  onFinalRef.current = onFinalTranscript;

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setStatus("unsupported");
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-PK";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interimText += r[0].transcript;
      }
      setInterim(interimText);
      if (finalText.trim()) {
        setInterim("");
        onFinalRef.current(finalText.trim());
      }
    };
    rec.onend = () => setStatus((s) => (s === "listening" ? "idle" : s));
    rec.onerror = () => {
      setInterim("");
      setStatus("idle");
    };
    recRef.current = rec;
    return () => {
      rec.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const listen = useCallback(() => {
    if (!recRef.current) return;
    window.speechSynthesis?.cancel();
    try {
      recRef.current.start();
      setStatus("listening");
    } catch {
      // start() throws if already running; ignore
    }
  }, []);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    setStatus("idle");
  }, []);

  const speak = useCallback((text: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text.replace(/Rs\./g, "rupees "));
    utter.rate = 1.02;
    utter.pitch = 1;
    const voices = synth.getVoices();
    const preferred =
      voices.find((v) => v.lang === "en-PK") ??
      voices.find((v) => v.lang === "en-IN") ??
      voices.find((v) => v.lang.startsWith("en-GB")) ??
      voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utter.voice = preferred;
    utter.onstart = () => setStatus("speaking");
    utter.onend = () => setStatus((s) => (s === "speaking" ? "idle" : s));
    synth.speak(utter);
  }, []);

  return { status, interim, listen, stopListening, speak, supported: status !== "unsupported" };
}
