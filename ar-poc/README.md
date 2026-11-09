# Pneumatic AR — Phase 1 proof of concept

One scheme, one video, MindAR image tracking + Three.js video overlay.

## 1. Install and run
```bash
npm install            # if the native "canvas" dependency of mind-ar fails: npm install --ignore-scripts
npm run dev            # serves https://<your-LAN-IP>:5173 (self-signed cert: accept the warning on the phone)
```
Phone and computer must be on the same Wi-Fi. Camera access needs HTTPS, which is why the dev server uses a certificate.

## 2. Compile the tracking target (required, once per set of images)
1. Open MindAR's online image target compiler (linked from the MindAR documentation, "Image Tracking -> Compile").
2. Upload `public/images/scheme_001.png`. Look at the feature-point preview: points should be spread over the page, not only in one corner.
3. Download `targets.mind` and save it as `public/targets/targets.mind`.
   For several schemes, upload all images together; **the upload order is the targetIndex** (0, 1, 2 ...).

## 3. Print
Print `scheme_001.png` (the first frame of the video) on A4 landscape, matte paper, with a small white margin.
The video covers the whole printed image, so video and print are registered by construction.
Any size works: the overlay scales with the target.

## 4. Test (checklist)
- [ ] Android Chrome: camera starts, scheme recognised, video appears on the paper
- [ ] iPhone Safari (Chrome/Brave on iPhone use the same engine): same
- [ ] Overlay stays glued to the paper while moving/tilting the phone
- [ ] Cover the paper: overlay disappears and pauses; uncover: it resumes
- [ ] Try the "Opaque" / "Keyed" button (top right) and decide which looks better
- [ ] Different lighting, distances (20-60 cm), slightly rotated page

## 5. Adding a scheme later
1. `public/images/scheme_00N.png` + `public/videos/scheme_00N.mp4`
2. Re-compile ALL images into one `targets.mind`
3. Add an entry to `src/config/schemes.json` (targetIndex = position in the compile order)

## Pinned versions (important)
`mind-ar@1.2.5` imports `sRGBEncoding` from three, which was removed in three r162, so `three` is pinned to `0.160.1`.
Do not upgrade three without replacing/patching mind-ar.

## Video prep
```bash
ffmpeg -i source.mp4 -an -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 20 -movflags +faststart scheme_001.mp4
ffmpeg -i source.mp4 -frames:v 1 scheme_001.png   # target image = first frame
```
