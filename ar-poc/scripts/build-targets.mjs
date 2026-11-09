/**
 * Runs automatically before `npm run dev` and `npm run build` (and therefore on Vercel).
 *
 *  1. Scans public/images and public/videos and pairs files with the SAME name
 *     (e.g. 01_Printing_Cheeses.png + 01_Printing_Cheeses.mp4).
 *  2. Sorts the pairs naturally (2 before 10); the position is the MindAR target index.
 *  3. Compiles all images into public/targets/targets.mind (skipped when nothing changed).
 *  4. Writes public/schemes.json, which the app reads at runtime.
 *
 * Environment: SKIP_TARGET_COMPILE=1 keeps an existing targets.mind (manual workflow);
 *              FORCE_TARGET_COMPILE=1 recompiles even when nothing changed.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadImage } from '@napi-rs/canvas';
import { OfflineCompiler } from 'mind-ar/src/image-target/offline-compiler.js';

const ROOT = process.cwd();
const IMG_DIR = path.join(ROOT, 'public', 'images');
const VID_DIR = path.join(ROOT, 'public', 'videos');
const TARGET_DIR = path.join(ROOT, 'public', 'targets');
const MIND_FILE = path.join(TARGET_DIR, 'targets.mind');
const META_FILE = path.join(TARGET_DIR, 'targets.json');
const SCHEMES_FILE = path.join(ROOT, 'public', 'schemes.json');
const COMPILER_VERSION = 'offline-compiler-v1/mind-ar-1.2.5';

const IMAGE_RE = /\.(png|jpe?g)$/i;
const VIDEO_RE = /\.mp4$/i;

const sha = (buf, algo = 'sha256') => crypto.createHash(algo).update(buf).digest('hex');
const baseName = (f) => f.replace(/\.[^.]+$/, '');
const list = (dir, re) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => !f.startsWith('.') && re.test(f)) : [];

function fail(msg) {
  console.error(`\n[schemes] ERROR: ${msg}\n`);
  process.exit(1);
}

/** "01_Printing_Cheeses" -> "1. Printing Cheeses" */
function displayName(base) {
  const m = base.match(/^(\d+)[\s._-]+(.*)$/);
  const rest = (m ? m[2] : base).replace(/[_]+/g, ' ').trim();
  return m ? `${parseInt(m[1], 10)}. ${rest}` : rest;
}

// ---- 1. Pair images and videos -------------------------------------------------
const images = new Map();
for (const f of list(IMG_DIR, IMAGE_RE)) {
  const key = baseName(f).toLowerCase();
  if (images.has(key)) fail(`Two images share the name "${baseName(f)}" (${images.get(key)} and ${f}).`);
  images.set(key, f);
}
const videos = new Map();
for (const f of list(VID_DIR, VIDEO_RE)) {
  const key = baseName(f).toLowerCase();
  if (videos.has(key)) fail(`Two videos share the name "${baseName(f)}".`);
  videos.set(key, f);
}

for (const [k, f] of images) if (!videos.has(k)) console.warn(`[schemes] WARNING: image "${f}" has no video with the same name - skipped.`);
for (const [k, f] of videos) if (!images.has(k)) console.warn(`[schemes] WARNING: video "${f}" has no image with the same name - skipped.`);

const keys = [...images.keys()]
  .filter((k) => videos.has(k))
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }));

if (keys.length === 0) fail('No scheme found. Put matching NAME.png and NAME.mp4 files in public/images and public/videos.');

// ---- 2. Load images and compute the cache hash --------------------------------
const entries = [];
for (const key of keys) {
  const imageFile = images.get(key);
  const videoFile = videos.get(key);
  const imageBytes = fs.readFileSync(path.join(IMG_DIR, imageFile));
  const img = await loadImage(imageBytes);
  entries.push({ key, imageFile, videoFile, img, imageHash: sha(imageBytes) });
}
const hash = sha(COMPILER_VERSION + entries.map((e) => `${e.key}:${e.imageHash}`).join('|'));

// ---- 3. Compile targets (only when needed) ------------------------------------
fs.mkdirSync(TARGET_DIR, { recursive: true });
const meta = fs.existsSync(META_FILE) ? JSON.parse(fs.readFileSync(META_FILE, 'utf8')) : null;
const upToDate = fs.existsSync(MIND_FILE) && meta?.hash === hash;

if (process.env.SKIP_TARGET_COMPILE === '1') {
  if (!fs.existsSync(MIND_FILE)) fail('SKIP_TARGET_COMPILE=1 but public/targets/targets.mind does not exist.');
  console.log('[schemes] SKIP_TARGET_COMPILE=1: keeping existing targets.mind (its image order must match the list below).');
} else if (upToDate && process.env.FORCE_TARGET_COMPILE !== '1') {
  console.log(`[schemes] targets.mind is up to date (${entries.length} schemes), skipping compile.`);
} else {
  console.log(`[schemes] Compiling ${entries.length} image(s) into targets.mind (about 10 s per image)...`);
  for (const e of entries) {
    if (e.img.width > 1600 || e.img.height > 1600) {
      console.warn(`[schemes] NOTE: ${e.imageFile} is ${e.img.width}x${e.img.height}; large images compile slowly. ~1000 px wide is usually enough.`);
    }
  }
  const compiler = new OfflineCompiler();
  let lastPct = -10;
  const started = Date.now();
  await compiler.compileImageTargets(
    entries.map((e) => e.img),
    (p) => {
      if (p - lastPct >= 10) {
        lastPct = p;
        console.log(`[schemes]   ${Math.round(p)}%`);
      }
    },
  );
  fs.writeFileSync(MIND_FILE, Buffer.from(compiler.exportData()));
  fs.writeFileSync(META_FILE, JSON.stringify({ hash, count: entries.length }, null, 2));
  console.log(`[schemes] Compiled in ${((Date.now() - started) / 1000).toFixed(0)} s.`);
}

// ---- 4. Write schemes.json -----------------------------------------------------
const schemes = entries.map((e, i) => {
  const videoHash = sha(fs.readFileSync(path.join(VID_DIR, e.videoFile)), 'sha1').slice(0, 10);
  return {
    id: e.key,
    targetIndex: i,
    name: displayName(baseName(e.imageFile)),
    image: `/images/${encodeURIComponent(e.imageFile)}`,
    video: `/videos/${encodeURIComponent(e.videoFile)}?v=${videoHash}`,
    imageWidth: e.img.width,
    imageHeight: e.img.height,
  };
});
const config = {
  targetFile: `/targets/targets.mind?v=${hash.slice(0, 10)}`,
  onReacquire: 'resume',
  schemes,
};
fs.writeFileSync(SCHEMES_FILE, JSON.stringify(config, null, 2));

console.log('[schemes] Registered schemes (target index -> name):');
for (const s of schemes) console.log(`[schemes]   ${s.targetIndex}: ${s.name}  (${s.imageWidth}x${s.imageHeight})`);
