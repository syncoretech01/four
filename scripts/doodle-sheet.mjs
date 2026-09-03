// Builds apps/web/public/doodles/sheet.png — the faint line-art backdrop the
// storefront masks behind red and cream bands — from the brand's own single-line
// drawings in brand-assets/highlights. Those JPEGs sit on a beige gradient, so
// each is keyed on "red stroke vs. background" (r - g > 50) into black on
// transparency, then scattered onto one repeating sheet. Needs only Node >= 22
// and Google Chrome (headless). Re-run after changing the layout below.
//
//   node scripts/doodle-sheet.mjs && sips -Z 1200 apps/web/public/doodles/sheet.png
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";

const root = resolve(import.meta.dirname, "..");
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// x/y are the top-left of the scaled motif on a 1600x2400 sheet; s = scale, r = degrees.
const motifs = [
  { file: "1-01.jpg", x: 40, y: 80, s: 0.42, r: -8 }, // plate + cutlery
  { file: "1-02.jpg", x: 860, y: 40, s: 0.4, r: 10 }, // map pin
  { file: "untitled-1-03.jpg", x: 80, y: 900, s: 0.45, r: -12 }, // burger
  { file: "untitled-1-06.jpg", x: 900, y: 1000, s: 0.4, r: 14 }, // hand
  { file: "1-05.jpg", x: 200, y: 1750, s: 0.42, r: -6 }, // speech bubbles
  { file: "1-02.jpg", x: 1000, y: 1850, s: 0.3, r: 6 }, // pin again
];

const images = motifs.map((m) => ({
  ...m,
  src: `data:image/jpeg;base64,${readFileSync(resolve(root, "brand-assets/highlights", m.file)).toString("base64")}`,
}));

const html = `<!doctype html><html><head><style>html,body{margin:0;background:transparent}canvas{display:block}</style></head><body>
<canvas id="c" width="1600" height="2400"></canvas>
<script>
const M = ${JSON.stringify(images)};
const c = document.getElementById("c"), ctx = c.getContext("2d");
function key(img) {
  const o = document.createElement("canvas"); o.width = img.naturalWidth; o.height = img.naturalHeight;
  const x = o.getContext("2d"); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, o.width, o.height), p = d.data;
  for (let i = 0; i < p.length; i += 4) { const on = p[i] - p[i + 1] > 50; p[i] = 0; p[i + 1] = 0; p[i + 2] = 0; p[i + 3] = on ? 255 : 0; }
  x.putImageData(d, 0, 0); return o;
}
Promise.all(M.map((m) => new Promise((res) => { const im = new Image(); im.onload = () => res({ m, im }); im.src = m.src; }))).then((list) => {
  for (const { m, im } of list) {
    const k = key(im), w = k.width * m.s, h = k.height * m.s;
    // keep every motif inside the sheet so the repeating tile has no cut edges
    const x = Math.min(m.x, c.width - w - 40), y = Math.min(m.y, c.height - h - 40);
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate((m.r * Math.PI) / 180);
    ctx.drawImage(k, -w / 2, -h / 2, w, h); ctx.restore();
  }
  document.title = "done";
});
</script></body></html>`;

const out = resolve(root, "apps/web/public/doodles");
mkdirSync(out, { recursive: true });
const page = join(tmpdir(), "four-doodle-sheet.html");
writeFileSync(page, html);
const r = spawnSync(
  chrome,
  ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox", "--default-background-color=00000000", "--virtual-time-budget=5000", "--window-size=1600,2400", `--screenshot=${join(out, "sheet.png")}`, `file://${page}`],
  { stdio: "ignore" },
);
if (r.status !== 0) { console.error("chrome exited", r.status); process.exit(1); }
console.log("wrote", join(out, "sheet.png"));
