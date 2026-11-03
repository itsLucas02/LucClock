// Build the LucClock product thumbnail: the brand mark plus the two-tone
// wordmark on the brand's light tile. 1024x1024 square, which is what the
// owner needs for a portfolio profile.
//
// Run:  node scripts/build-thumbnail.mjs
// Needs: the fontTools venv (see scripts/make-thumbnail.py) and sharp.
// sharp is not a LucClock dependency (the extension has no build step); point
// NODE_PATH at a checkout that has it, or `npm i -D sharp` locally.
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const VENV =
  process.env.FONT_VENV ??
  "/private/var/folders/th/lh2mrd393q74jqght00cywc80000gn/T/opencode/fontvenv/bin/python";

const BRAND = {
  ink: "#1e293b",
  blue: "#3b82f6",
  tileTop: "#ffffff",
  tileBottom: "#eef2f7",
};

const raw = execFileSync(VENV, [path.join("scripts", "make-thumbnail.py")], {
  encoding: "utf8",
});
const { ink, blue, bounds } = JSON.parse(raw);
if (!ink || !blue) {
  throw new Error("wordmark outlines missing — refusing to render a fallback font");
}

// The lockup's mark, minus its own <svg> wrapper, so we can place it ourselves.
const MARK = (await readFile("brand/LucClock-mark.svg", "utf8"))
  .replace(/^[\s\S]*?<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "");

const S = 1024;

// Size to a target width rather than guessing pixel sizes: the lockup has to sit
// inside the canvas with margin, and wordSize is what actually drives the width.
const TARGET_W = 720;   // ~70% of the canvas, the usual safe margin for a tile
const markSize = 248;   // the clock's ring fills only ~62% of its tile, so the
                        // mark needs to run larger to look equal to the wordmark
const gap = 44;

const s = (TARGET_W - markSize - gap) / (bounds.xMax - bounds.xMin);
const wordSize = 1000 * s;
const inkW = (bounds.xMax - bounds.xMin) * s;

const totalW = markSize + gap + inkW;
const left = (S - totalW) / 2;
const lettersX = left + markSize + gap - bounds.xMin * s;

// "LucClock" has no descenders, so the ink box is the cap box and centring it is
// honest. The mark is optical, not metric, so it rides the same band.
const capTop = bounds.yMin * s; // negative, above baseline
const capH = -capTop;
const baseline = (S - capH) / 2 + capH;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BRAND.tileTop}"/>
      <stop offset="1" stop-color="${BRAND.tileBottom}"/>
    </linearGradient>
  </defs>
  <rect width="${S}" height="${S}" fill="url(#tile)"/>
  <g transform="translate(${left} ${(S - markSize) / 2}) scale(${markSize / 128})">
    <rect x="4" y="4" width="120" height="120" rx="28" fill="none" stroke="#e2e8f0" stroke-width="2"/>
    ${MARK}
  </g>
  <g transform="translate(${lettersX} ${baseline}) scale(${s})">
    <path d="${ink}" fill="${BRAND.ink}"/>
    <path d="${blue}" fill="${BRAND.blue}"/>
  </g>
</svg>`;

await writeFile("brand/LucClock-thumbnail.svg", svg);
const png = await sharp(Buffer.from(svg)).png().toBuffer();
await writeFile("brand/LucClock-thumbnail.png", png);

const meta = await sharp(png).metadata();
console.log(
  `LucClock-thumbnail.png: ${meta.width}x${meta.height} (${png.length} bytes) ` +
    `[mark ${markSize}, word ${wordSize.toFixed(1)}, total ${totalW.toFixed(1)} of ${S}]`
);

// Legibility ladder — a portfolio tile gets shown small.
for (const size of [256, 128, 64, 48]) {
  await writeFile(`/tmp/luc-${size}.png`, await sharp(png).resize(size, size).png().toBuffer());
}
console.log("small renders: /tmp/luc-{256,128,64,48}.png");