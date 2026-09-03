// One-shot: pull the brand faces Google serves at runtime via next/font into
// files the DS bundle can ship. Latin + latin-ext only - the site is English.
import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "fonts");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const FAMILIES = [
  { family: "Anton", weights: [400] },
  { family: "DM+Sans", weights: [400, 500, 600, 700] },
];

const KEEP = new Set(["latin", "latin-ext"]);

async function css(family, weights) {
  const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weights.join(";")}&display=swap`;
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${family}: ${r.status}`);
  return r.text();
}

// Google's CSS emits `/* subset */` before each @font-face; keep only latin ones.
function blocks(text) {
  const out = [];
  const re = /\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g;
  let m;
  while ((m = re.exec(text))) out.push({ subset: m[1], rule: m[2] });
  return out.filter((b) => KEEP.has(b.subset));
}

await mkdir(OUT, { recursive: true });
const rules = [];

for (const { family, weights } of FAMILIES) {
  const found = blocks(await css(family, weights));
  for (const { subset, rule } of found) {
    const weight = /font-weight:\s*(\d+)/.exec(rule)?.[1] ?? "400";
    const src = /url\((https:[^)]+\.woff2)\)/.exec(rule)?.[1];
    if (!src) continue;
    const name = `${family.replace(/\+/g, "")}-${weight}-${subset}.woff2`;
    const bin = await fetch(src, { headers: { "User-Agent": UA } });
    if (!bin.ok) throw new Error(`${name}: ${bin.status}`);
    await writeFile(join(OUT, name), Buffer.from(await bin.arrayBuffer()));
    rules.push(rule.replace(/url\(https:[^)]+\.woff2\)/, `url("./${name}")`));
    console.log("wrote", name);
  }
}

await writeFile(
  join(OUT, "brand-fonts.css"),
  `/* FOUR brand faces - Anton (display) and DM Sans (body), SIL OFL 1.1.\n` +
    `   The app serves these through next/font; the DS bundle ships them so\n` +
    `   every design renders in the real brand type. */\n\n` +
    rules.join("\n\n") +
    "\n",
);
console.log(`\n${rules.length} @font-face rules -> fonts/brand-fonts.css`);
