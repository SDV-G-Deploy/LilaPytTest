# Red Spider Lily — Procedural One-Page Demo

A full rebuild of the original project into a cleaner, more organic, **Python-authentic-inspired** red spider lily scene.

- **Tech:** plain HTML + CSS + JS (no build, no dependencies)
- **Host:** GitHub Pages-ready
- **Focus:** premium dark look + mobile-friendly performance budget

## What changed

- Rebuilt from scratch (single fullscreen canvas scene)
- Added layered, procedural lily bloom with:
  - pre-rendered petal sprite
  - pre-rendered core glow sprite
  - lightweight animated filaments/stamens
  - subtle stem + atmospheric background
- Minimal tasteful overlay (title/subtitle/hint)
- Responsive fullscreen layout with safe-area support

## Performance strategy (mobile-first)

The animation intentionally avoids common mobile killers:

- No per-frame `shadowBlur`
- No massive particle counts
- No expensive offscreen re-rasterization each frame
- Precomputed sprites are reused every frame

### Adaptive quality + frame pacing

Implemented in `app.js`:

1. **FPS cap / frame skip**
   - Mobile target: ~30 FPS
   - Desktop target: ~45 FPS
   - Frames are skipped if called too early by RAF

2. **Adaptive quality loop**
   - Measures render time (`frameMs`) each drawn frame
   - If over budget repeatedly:
     - lowers visual quality level (fewer filament strokes)
     - then lowers render scale (internal canvas resolution)
   - If comfortably under budget for a while:
     - gradually restores quality

3. **DPR clamp**
   - Mobile DPR max is limited to keep fill-rate sane

## Files

- `index.html` — page structure
- `style.css` — premium dark responsive styling
- `app.js` — procedural animation + adaptive performance logic
- `README.md` — project notes

## Run locally

Open `index.html` in a browser.

## Deploy to GitHub Pages

Push these files to your repository root (or `/docs`), then enable Pages in repo settings.
