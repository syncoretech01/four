# Hero footage

The home page hero is one full-screen video with all the copy set on top of
it (`src/components/hero/HeroVideo.tsx`).

| File | What it is |
|---|---|
| `hero.webm` | VP9. First in the source list, so Chrome/Firefox take it. |
| `hero.mp4` | H.264 8-bit. The universal fallback — Safari and everything else. |
| `hero-poster.jpg` | Frame one. Painted under the video and used as the poster. |
| `fourhero.mp4` | The delivered master (HEVC/10-bit). **Not served — see below.** |

## Re-encoding a new cut

The master arrived as HEVC (H.265) Main 10. That plays in Safari and nowhere
else, so it must be transcoded or the hero silently falls back to the poster
for most visitors:

```bash
ffmpeg -i fourhero.mp4 -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -crf 27 -preset slow -movflags +faststart -an hero.mp4
ffmpeg -i fourhero.mp4 -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 \
  -deadline good -cpu-used 2 -pix_fmt yuv420p -an hero.webm
ffmpeg -ss 0 -i hero.mp4 -frames:v 1 -q:v 4 hero-poster.jpg
```

That takes the 14.5 MB master to ~1.8 MB / ~1.6 MB. `-an` matters: the hero
is muted, so an audio track is dead weight.

`fourhero.mp4` is the master and should **not** live in `public/` — every
file here is served to visitors and shipped in the build. Move it to a
`brand-assets/` folder or your asset store.

## Guidance for the cut

- 8–12s, seamless loop, no on-screen text, no audio
- keep the subject centred: phones crop to roughly the middle 26% of the
  width, so anything at the left or right edge is invisible there
- leave the top and bottom of the frame quiet — the copy sits in those bands
- the scrims in `globals.css` (`.f-hero-scrim`) are tuned for bright,
  high-key footage; darker stock needs them re-balanced

To serve the video from a CDN instead, set `NEXT_PUBLIC_HERO_VIDEO_URL`
(and `NEXT_PUBLIC_HERO_POSTER_URL`).
