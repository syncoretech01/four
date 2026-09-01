"use client";

/**
 * The hero's ground: a full-bleed, muted, looping video that fills the whole
 * section — every piece of hero copy sits on top of it.
 *
 * Two things keep it honest:
 *  - the poster still is painted underneath and the video fades in only once
 *    it can actually play, so a missing file, a blocked autoplay or a slow
 *    connection degrades to a sharp food shot instead of a black hole;
 *  - a pause control appears only when footage is genuinely rolling (WCAG
 *    2.2.2 — auto-playing motion longer than 5s needs a stop).
 *
 * Footage lives at apps/web/public/hero/hero.mp4 (+ .webm). It must be H.264
 * 8-bit - the HEVC/10-bit master the film was delivered in plays in Safari
 * only, and would silently fall back to the poster everywhere else. Point
 * NEXT_PUBLIC_HERO_VIDEO_URL at a hosted file to serve it from a CDN.
 */
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useReduceMotion } from "@/lib/useAnim";

const HOSTED = process.env.NEXT_PUBLIC_HERO_VIDEO_URL;
const SOURCES = HOSTED
  ? [{ src: HOSTED, type: undefined }]
  : [
      { src: "/hero/hero.webm", type: "video/webm" },
      { src: "/hero/hero.mp4", type: "video/mp4" },
    ];
// First frame of the film, so the still and the video agree on frame one.
const POSTER = process.env.NEXT_PUBLIC_HERO_POSTER_URL ?? "/hero/hero-poster.jpg";

export function HeroVideo() {
  const reduce = useReduceMotion();
  const ref = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [rolling, setRolling] = useState(false);
  const [paused, setPaused] = useState(false);

  // Scroll-tied drift: the frame sinks a little slower than the page, which
  // reads as depth without a second scroll listener (transform only).
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["0%", "8%"]);
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1, 1.06]);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    if (reduce) {
      el.pause();
      setRolling(false);
      return;
    }
    // Autoplay can still be refused (data saver, low power mode); when it is,
    // we simply never show the control and the poster carries the section.
    void Promise.resolve(el.play())
      .then(() => {
        setRolling(true);
        setPaused(false);
      })
      .catch(() => setRolling(false));
  }, [reduce]);

  const toggle = () => {
    const el = video.current;
    if (!el) return;
    if (el.paused) {
      void Promise.resolve(el.play()).catch(() => undefined);
      setPaused(false);
    } else {
      el.pause();
      setPaused(true);
    }
  };

  return (
    <div ref={ref} className="absolute inset-0">
      <div aria-hidden className="absolute inset-0 overflow-hidden bg-ink-900">
        <motion.div style={{ y, scale }} className="absolute inset-0 will-change-transform">
          {/* Always-painted still: the section never renders empty. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={POSTER}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <video
            ref={video}
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            poster={POSTER}
            disablePictureInPicture
            aria-hidden
            tabIndex={-1}
            onPlaying={() => setRolling(true)}
            onError={() => setRolling(false)}
            className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${
              rolling ? "opacity-100" : "opacity-0"
            }`}
          >
            {SOURCES.map((s) => (
              <source key={s.src} src={s.src} type={s.type} />
            ))}
          </video>
        </motion.div>

        {/* Contrast wash — see .f-hero-scrim in globals.css. */}
        <div className="f-hero-scrim" />
      </div>

      {rolling && (
        <button
          type="button"
          onClick={toggle}
          aria-label={paused ? "Play background video" : "Pause background video"}
          className="f-hero-mediabtn absolute bottom-5 right-4 z-20 sm:bottom-8 sm:right-6"
        >
          {paused ? (
            <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden>
              <path d="M2 1.5 12.5 8 2 14.5Z" fill="currentColor" />
            </svg>
          ) : (
            <svg width="12" height="16" viewBox="0 0 12 16" aria-hidden>
              <rect x="1" y="1.5" width="3.5" height="13" rx="1" fill="currentColor" />
              <rect x="7.5" y="1.5" width="3.5" height="13" rx="1" fill="currentColor" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
