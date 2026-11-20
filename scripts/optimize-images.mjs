/**
 * Generates responsive AVIF/WebP/JPEG variants + a manifest for every photo in assets-src/photos.
 * Usage: npm run images
 * Output: public/images/<name>-<width>.<ext>, src/content/generated/image-manifest.json
 */
import sharp from 'sharp';
import { readdir, mkdir, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'assets-src/photos';
const OUT = 'public/images';
const MANIFEST = 'src/content/generated/image-manifest.json';
const WIDTHS = [640, 1024, 1600, 2200];
const WARM_INK = [27, 24, 21];

const mix = (a, b, t) => a.map((v, i) => Math.round(v * (1 - t) + b[i] * t));

function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}
function hslToRgb([h, s, l]) {
  if (s === 0) return [l, l, l].map((v) => Math.round(v * 255));
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255));
}
/** Dark, text-safe stage tint: the photo's average hue at a fixed low lightness. */
function stageTint(avg) {
  const [h, s] = rgbToHsl(avg);
  return hslToRgb([h, Math.min(0.42, Math.max(0.12, s * 2.4)), 0.17]);
}
const hex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

await mkdir(OUT, { recursive: true });
await mkdir(path.dirname(MANIFEST), { recursive: true });

const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
const manifest = {};

for (const file of files) {
  const name = path.parse(file).name;
  const input = path.join(SRC, file);
  const meta = await sharp(input).metadata();
  const { dominant } = await sharp(input).stats();
  const dom = [dominant.r, dominant.g, dominant.b];
  const { data: px } = await sharp(input).resize(1, 1, { fit: 'cover' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const avg = [px[0], px[1], px[2]];
  const widths = WIDTHS.filter((w) => w <= meta.width);
  if (!widths.includes(meta.width) && meta.width < WIDTHS[WIDTHS.length - 1]) widths.push(meta.width);

  for (const w of widths) {
    const base = sharp(input).resize({ width: w, withoutEnlargement: true });
    const jobs = [
      ['avif', (s) => s.avif({ quality: 52, effort: 4 })],
      ['webp', (s) => s.webp({ quality: 74 })],
      ['jpg', (s) => s.jpeg({ quality: 78, mozjpeg: true, progressive: true })],
    ];
    for (const [ext, fmt] of jobs) {
      const out = path.join(OUT, `${name}-${w}.${ext}`);
      if (!(await exists(out))) await fmt(base.clone()).toFile(out);
    }
  }

  const lqip = await sharp(input).resize(24).blur(1.2).webp({ quality: 40 }).toBuffer();
  manifest[name] = {
    width: meta.width,
    height: meta.height,
    widths: widths.sort((a, b) => a - b),
    dominant: hex(dom),
    average: hex(avg),
    tint: hex(mix(stageTint(avg), WARM_INK, 0.15)),
    lqip: `data:image/webp;base64,${lqip.toString('base64')}`,
  };
  console.log(`✓ ${name} ${meta.width}×${meta.height} → ${widths.join(', ')}`);
}

await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Manifest: ${MANIFEST} (${files.length} images)`);
