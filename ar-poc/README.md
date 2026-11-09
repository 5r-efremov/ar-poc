# Pneumatic AR

Web AR: point a phone at a printed pneumatic scheme and its animation plays on the page.

## Adding or changing schemes (the only thing you do)

1. Pick a name, for example `02_Double_Acting_Cylinder`.
2. Upload `02_Double_Acting_Cylinder.png` to `public/images/` (the image to print; use the video's first frame).
3. Upload `02_Double_Acting_Cylinder.mp4` to `public/videos/` (same name).
4. Commit. Vercel rebuilds, compiles the tracking file and publishes. Nothing else to edit.

Rules
- The image and video must have the **same file name** (the extension differs). Names are not case-sensitive.
- Images: `.png`, `.jpg`, `.jpeg`. Videos: `.mp4` (H.264, no audio recommended).
- The shown title comes from the name: `02_Double_Acting_Cylinder` -> "2. Double Acting Cylinder".
- Order = alphabetical with numbers sorted naturally (2 before 10). Start names with a number.
- A file without a partner is skipped with a warning in the build log.
- To remove a scheme, delete both files.
- Image size is detected automatically; the video is stretched over the whole image, so the video must have the same aspect ratio and framing as the image.

## How it works
`scripts/build-targets.mjs` runs before `npm run dev` / `npm run build`: it pairs the files, compiles all images into `public/targets/targets.mind`
(about 10 s per image; skipped if the images did not change) and writes `public/schemes.json`, which the app loads at runtime.

## Run locally
```bash
npm install
npm run dev     # https://<LAN-IP>:5173 (self-signed certificate)
```

## Notes
- Node is pinned to 22.x (`engines`); the compile script was tested on Node 22.
- `canvas` (a dependency of mind-ar) is replaced by `@napi-rs/canvas` through `overrides`, so no native build is needed.
- `mind-ar@1.2.5` needs `three@0.160.1` (it uses an API removed in r162). Do not upgrade three.
- Manual workflow: set `SKIP_TARGET_COMPILE=1` to keep a hand-compiled `targets.mind` (its image order must be the sorted order above).
