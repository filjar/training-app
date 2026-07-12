// Rasterizes scripts/icon-source.svg into the PNG sizes a PWA needs.
// Run once with: node scripts/gen-icons.mjs
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const svg = readFileSync(resolve(here, 'icon-source.svg'));
const pub = resolve(root, 'public');
mkdirSync(pub, { recursive: true });

// A maskable icon needs its art inside the safe zone, so we render the glyph
// smaller on a solid background for that variant.
const maskableSvg = Buffer.from(
  `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
     <rect width="512" height="512" fill="#e0452f"/>
     <g transform="translate(102 102) scale(0.6)">${readFileSync(resolve(here, 'icon-source.svg'), 'utf8').replace(/<\/?svg[^>]*>/g, '')}</g>
   </svg>`,
);

const jobs = [
  { input: svg, size: 192, out: 'pwa-192x192.png' },
  { input: svg, size: 512, out: 'pwa-512x512.png' },
  { input: svg, size: 180, out: 'apple-touch-icon.png' },
  { input: svg, size: 32, out: 'favicon-32x32.png' },
  { input: maskableSvg, size: 512, out: 'maskable-512x512.png' },
];

for (const { input, size, out } of jobs) {
  await sharp(input).resize(size, size).png().toFile(resolve(pub, out));
  console.log('wrote', out, `(${size}px)`);
}
