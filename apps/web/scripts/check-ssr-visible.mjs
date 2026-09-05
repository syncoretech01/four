#!/usr/bin/env node
/**
 * Asserts that every customer-facing page is fully visible in its own server
 * HTML — before any JavaScript runs.
 *
 * This exists because the app spent a release with the opposite property.
 * `motion` writes the `initial` prop into the SSR inline style, so every scroll
 * reveal shipped `style="opacity:0;transform:translateY(24px)"` and only became
 * visible once hydration armed an IntersectionObserver. With JS off the hero
 * lede, the photo strip, the dish cards and the deals were permanently
 * invisible; with JS on, the hero was disqualified as an LCP candidate because
 * Chrome does not count an element at opacity 0 as painted.
 *
 * The fix was to make CSS the reveal mechanism and default it to the finished
 * state. This script is what stops the old pattern coming back — including via
 * a new animation component that looks harmless.
 *
 * Usage: `pnpm --filter @four/web build && node scripts/check-ssr-visible.mjs`
 * against a running `next start` (BASE_URL overrides the default port).
 */

const BASE = process.env.BASE_URL ?? `http://localhost:${process.env.WEB_PORT ?? 3400}`;

/** Every route a customer can land on. /pay and /track need a real order, so they are covered by the modal-free subset. */
const ROUTES = ["/", "/menu", "/deals", "/about", "/locations", "/support", "/orders"];

/**
 * Inline styles that hide content. Whitespace-tolerant, since React and the
 * CSS-in-JS layer both emit their own spacing.
 */
const FORBIDDEN = [
  { name: "opacity:0", re: /style="[^"]*opacity:\s*0(?![.\d])[^"]*"/i },
  { name: "visibility:hidden", re: /style="[^"]*visibility:\s*hidden[^"]*"/i },
  { name: "clip-path", re: /style="[^"]*clip-path:\s*[^"]*"/i },
];

/**
 * A displacing transform in the SSR HTML means something is animating in from
 * off its own position, which is the pattern that hid content. A transform of
 * exactly zero displaces nothing and is fine — a resting cursor-follower emits
 * one, and failing it would just teach people to silence the check.
 */
function findDisplacingTransform(html) {
  for (const m of html.matchAll(/style="([^"]*transform:\s*translate[^";]*)[^"]*"/gi)) {
    const args = m[1].match(/translate(?:3d|X|Y)?\(([^)]*)\)/i)?.[1] ?? "";
    if (args.split(",").some((a) => parseFloat(a) !== 0)) return m[0];
  }
  return null;
}

/**
 * Script contents do not count. `/menu` passed this check for a release while
 * rendering nothing: its dish names existed only inside the page's JSON-LD blob,
 * and the visible grid was fetched client-side. Stripping scripts first is what
 * makes the assertion mean what it says.
 */
const withoutScripts = (html) => html.replace(/<script[\s\S]*?<\/script>/gi, "");

/** Content that must be present in the HTML, proving the page rendered its data server-side. */
const MUST_CONTAIN = {
  "/": ["Smashed to order", "Live, Love, Eat"],
  // One dish from each end of the board, so a partial render is caught too.
  "/menu": ["Classic New York", "Lotus Cheese Cake"],
  "/deals": ["Prices exclusive of tax"],
  "/about": ["per patty"],
  "/locations": ["Fairways"],
  "/support": ["Support"],
};

let failures = 0;
const fail = (route, msg) => {
  failures++;
  console.error(`  ✗ ${route}  ${msg}`);
};

for (const route of ROUTES) {
  const res = await fetch(BASE + route, { headers: { "user-agent": "check-ssr-visible" } });
  if (!res.ok) {
    fail(route, `HTTP ${res.status}`);
    continue;
  }
  const html = await res.text();

  for (const { name, re } of FORBIDDEN) {
    const m = html.match(re);
    if (m) fail(route, `hidden in SSR HTML (${name}): ${m[0].slice(0, 160)}`);
  }

  const shifted = findDisplacingTransform(html);
  if (shifted) fail(route, `displaced in SSR HTML: ${shifted.slice(0, 160)}`);

  // The reveal runtime must ship, and must come before the content it gates —
  // otherwise content paints visible and is then hidden, which is a flash.
  const runtimeAt = html.indexOf("data-reveal-js");
  if (runtimeAt < 0) fail(route, "the reveal runtime is missing from the HTML");
  const firstReveal = html.indexOf("data-reveal=");
  if (runtimeAt >= 0 && firstReveal >= 0 && runtimeAt > firstReveal) {
    fail(route, "the reveal runtime ships after the first [data-reveal] element");
  }

  const visible = withoutScripts(html);
  for (const needle of MUST_CONTAIN[route] ?? []) {
    if (!visible.includes(needle)) fail(route, `expected copy missing from VISIBLE SSR HTML: ${JSON.stringify(needle)}`);
  }

  if (!failures) console.log(`  ✓ ${route}`);
}

if (failures) {
  console.error(`\n${failures} SSR visibility check(s) failed.`);
  console.error("Content must be visible in the server HTML. Use ds/Rise or ds/Reveal, never a motion `initial` that hides.");
  process.exit(1);
}
console.log("\nAll routes render visible without JavaScript.");
