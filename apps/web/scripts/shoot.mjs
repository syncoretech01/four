#!/usr/bin/env node
/**
 * Screenshot a running storefront through the Chrome DevTools Protocol.
 *
 * CDP rather than `--screenshot` + `--window-size` on purpose: headless Chrome
 * on macOS clamps the window to roughly 500px wide regardless of the flag, so a
 * desktop capture silently comes back phone-width and a phone capture comes back
 * cropped rather than reflowed. `Emulation.setDeviceMetricsOverride` is the only
 * way to get an honest frame at either size.
 *
 * Usage: node scripts/shoot.mjs <outDir> [route ...]
 *   BASE_URL   default http://localhost:3400
 *   VIEWPORTS  csv of name:width:height:scale:mobile  (default desktop+phone)
 *   REDUCED=1  emulate prefers-reduced-motion: reduce
 *   FULL=1     capture beyond the viewport (whole page)
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = process.env.BASE_URL ?? "http://localhost:3400";
const OUT = process.argv[2] ?? "shots";
const ROUTES = process.argv.slice(3).length ? process.argv.slice(3) : ["/"];
const VIEWPORTS = (process.env.VIEWPORTS ?? "desktop:1440:900:2:0,phone:390:844:3:1")
  .split(",")
  .map((v) => {
    const [name, width, height, scale, mobile] = v.split(":");
    return { name, width: +width, height: +height, scale: +scale, mobile: mobile === "1" };
  });

mkdirSync(OUT, { recursive: true });
const port = 9222 + Math.floor(Math.random() * 400);
const chrome = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  "--hide-scrollbars",
  "--force-device-scale-factor=1",
  // MapLibre needs WebGL2; the default headless GPU stack does not provide it.
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function endpoint() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      return (await r.json()).webSocketDebuggerUrl;
    } catch { await sleep(250); }
  }
  throw new Error("Chrome did not expose a debugging endpoint");
}

const ws = new WebSocket(await endpoint());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  }
};
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const n = ++id;
    pending.set(n, { resolve, reject });
    ws.send(JSON.stringify({ id: n, method, params, ...(sessionId ? { sessionId } : {}) }));
  });

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const cmd = (m, p) => send(m, p, sessionId);

await cmd("Page.enable");
await cmd("Runtime.enable");
// The first-visit location gate opens 500ms after paint on every route and
// takes focus, so without this every capture is a screenshot of that dialog.
// Seeded before navigation rather than dismissed after, so the page never
// renders it at all. GATE=1 to capture the gate deliberately.
if (process.env.GATE !== "1") {
  await cmd("Page.addScriptToEvaluateOnNewDocument", {
    source: `try{localStorage.setItem("four-ui",JSON.stringify({state:{locationDismissed:true},version:0}))}catch(e){}`,
  });
}
if (process.env.REDUCED === "1") {
  await cmd("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
}

for (const vp of VIEWPORTS) {
  for (const route of ROUTES) {
    await cmd("Emulation.setDeviceMetricsOverride", {
      width: vp.width, height: vp.height, deviceScaleFactor: vp.scale, mobile: vp.mobile,
      screenWidth: vp.width, screenHeight: vp.height,
    });
    await cmd("Page.navigate", { url: BASE + route });
    await sleep(2200);
    const { result } = await cmd("Runtime.evaluate", {
      expression: `JSON.stringify({
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        scrollW: document.documentElement.scrollWidth,
        animating: document.getAnimations().length,
        faded: [...document.querySelectorAll('main *')].filter(el => +getComputedStyle(el).opacity < 1).length,
      })`,
      returnByValue: true,
    });
    const stats = JSON.parse(result.value);
    const shot = await cmd("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: process.env.FULL === "1",
    });
    const name = `${(route === "/" ? "home" : route.replace(/\W+/g, "-").replace(/^-|-$/g, ""))}.${vp.name}.png`;
    writeFileSync(join(OUT, name), Buffer.from(shot.data, "base64"));
    const flag = stats.overflow ? `  ⚠ H-OVERFLOW ${stats.scrollW}px` : "";
    console.log(`  ${name}  animating=${stats.animating} faded=${stats.faded}${flag}`);
  }
}

ws.close();
chrome.kill();
