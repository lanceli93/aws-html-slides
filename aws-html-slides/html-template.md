# Deck Assembly Reference

How a generated deck is put together. The Stage Engine (`engine/`) owns navigation, transitions, the overview,
lightbox, print and the editor; the flavor kit (`flavors/<name>/`) owns the motif and components. This file covers
assembly order and the content-block plumbing (icons, images, charts, tables, chrome).

## 1. Assembly order

```html
<!DOCTYPE html>
<html lang="en">   <!-- "zh-CN" for Chinese decks -->
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Deck title</title>

<!-- Fonts (design-system.md §2) -->
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600;700&family=Urbanist:wght@400;500;600;700;800;900&family=Noto+Sans+SC:wght@400;500;700;900&display=swap" rel="stylesheet">
<!-- Icons -->
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<!-- Chart.js: only if the deck has charts -->

<style>
/* === STAGE ENGINE CSS (engine/stage-engine.css) === */          ← verbatim
/* === INLINE EDITOR CSS (engine/inline-editor.css) === */        ← verbatim, only if editing opted in
/* === FLAVOR KIT CSS (flavors/<name>/kit.css) === */             ← verbatim
/* === DECK CSS === */                                             ← this deck's own layout CSS
</style>
</head>
<body>
<!-- motif layer + chrome required by the kit (see flavors/<name>/README.md) -->

<section class="slide" data-scene="cover" data-label="Opening" data-thumb="…">…</section>
<script>(window.STAGE_HOOKS = window.STAGE_HOOKS || []).push(['cover', { enter(slide, ctx) {…}, final(slide) {…} }]);</script>
<!-- … more slides, each optionally followed by its hook script … -->

<script>/* === STAGE ENGINE JS (engine/stage-engine.js) === */</script>      ← verbatim
<script>/* === INLINE EDITOR JS (engine/inline-editor.js) === */</script>  ← verbatim, only if opted in
<script>/* === FLAVOR KIT JS (flavors/<name>/kit.js) === */</script>       ← verbatim
<script>/* === DECK GLUE === */ if (window.lucide) lucide.createIcons();</script>
</body>
</html>
```

**Verbatim means byte-for-byte.** Never edit engine or kit code inside a deck. Configure it through data attributes,
CSS variables and the documented APIs. Comment every deck section with a `/* === SECTION NAME === */` banner.

If editing was **not** opted in, leave out both editor blocks entirely.

## 2. Icons: Lucide

**Never use emoji as icons.** Use `<i data-lucide="name"></i>`. Call `lucide.createIcons()` once in the deck glue.
Draw icons with a 1.5 stroke at a generous size (24–40px), colored by the kit (purple by default, orange only for the
"new" thing). Icons are anchors, not decoration: one per card at most.

| Concept | Lucide icon | Concept | Lucide icon |
|---|---|---|---|
| AI / agent | `bot`, `sparkles` | Data / storage | `database`, `hard-drive` |
| Model / brain | `brain` | Streaming | `activity`, `waves` |
| Compute / chip | `cpu`, `microchip` | Analytics | `bar-chart-3`, `line-chart` |
| Server / infra | `server` | Search | `search` |
| Cloud | `cloud` | Pipeline / flow | `workflow`, `git-branch` |
| Security | `lock`, `shield-check` | Layers / stack | `layers`, `boxes` |
| Speed | `zap`, `gauge` | Global / region | `globe`, `map-pin` |
| Cost | `coins`, `piggy-bank` | Users | `users`, `user` |
| Launch | `rocket` | Time | `timer`, `clock` |
| Warning | `alert-triangle` | Success | `check-circle` |
| Code / CLI | `code`, `terminal` | Integration | `plug`, `link` |
| Idea | `lightbulb` | Tools | `wrench`, `puzzle` |
| Growth | `trending-up`, `arrow-up-right` | Decline | `trending-down`, `arrow-down-right` |

Full list: https://lucide.dev/icons

## 3. Images (skip if there are none)

**Processing** (`uv run --with pillow python …`):

```python
from PIL import Image, ImageDraw

def crop_circle(src, dst):            # logos on rounded designs
    img = Image.open(src).convert('RGBA'); w, h = img.size; s = min(w, h)
    img = img.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
    mask = Image.new('L', (s, s), 0); ImageDraw.Draw(mask).ellipse([0, 0, s, s], fill=255)
    img.putalpha(mask); img.save(dst, 'PNG')

def resize_max(src, dst, max_dim=1600):   # images > 1MB
    img = Image.open(src); img.thumbnail((max_dim, max_dim), Image.LANCZOS); img.save(dst, quality=85)
```

Save processed files with a `_processed` suffix and never overwrite the originals.

**Placement:**
- Copy every image into `<topic>/assets/` and reference it relatively (`assets/screenshot.png`).
- Never use absolute paths or paths outside the folder.
- Never repeat an image across slides; logos on the cover and closing are the exception.

```css
/* === SLIDE IMAGES === */
.slide-image { max-width: 100%; max-height: min(50vh, 400px); object-fit: contain; border-radius: 12px; }
.slide-image.screenshot { border: 1px solid rgba(139,92,246,.25); box-shadow: 0 24px 60px -20px rgba(139,92,246,.35); }
.slide-image.logo { max-height: min(30vh, 200px); }
```

Present screenshots as designed objects, for example a glass/device frame with a slight 3D tilt plus 1–2 callouts.
Don't paste them flat. **Lightbox:** the engine zooms any `.slide img` on click. Mark decorative images with
`data-no-zoom`; use `data-zoom="assets/hi-res.png"` to zoom to a larger file.

**Video:** `<video src="assets/demo.mp4" muted playsinline loop>`. Play it in the slide's hook `enter` and pause it in
`leave`.

## 4. Charts (only if the deck has `### chart` blocks)

Add Chart.js after Lucide: `<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>`.
Full per-type configs are in [chart-reference.md](chart-reference.md).

**Engine integration.** So the chart animates on every entry:
- **create** it in the slide's hook `enter` and **destroy** it in `ctx.cleanup`
- in `final(slide)`, render it with `animation:false`, so overview, print and reduced motion show the finished chart

```js
(window.STAGE_HOOKS = window.STAGE_HOOKS || []).push(['revenue', {
  enter(slide, ctx) {
    const c = new Chart(slide.querySelector('canvas'), cfg({ animation: { duration: ctx.reduced ? 0 : 1200 } }));
    ctx.cleanup(() => c.destroy());
  },
  final(slide) { const cv = slide.querySelector('canvas'); Chart.getChart(cv)?.destroy(); new Chart(cv, cfg({ animation: false })); }
}]);
```

CSS variables don't work inside a chart config, so resolve colors to literals. The palette order is in
design-system.md §2. Chart containers are capped at 50vh.

## 5. Tables (only if the deck has `### table` blocks)

```css
/* === THEMED TABLES === */
.slide-table { width: 100%; max-width: min(92vw, 1000px); border-collapse: collapse;
    font-family: var(--font-body); font-size: clamp(.75rem, 1.2vw, 1rem); }
.slide-table th { text-align: left; font-weight: 600; padding: clamp(6px,1vh,12px) clamp(8px,1.5vw,16px);
    border-bottom: 1px solid rgba(139,92,246,.45); color: #c4b5fd; font-size: clamp(.65rem,1vw,.85rem);
    letter-spacing: .08em; text-transform: uppercase; }
.slide-table td { padding: clamp(6px,.8vh,10px) clamp(8px,1.5vw,16px); border-bottom: 1px solid rgba(255,255,255,.08); }
.slide-table tr.hl td { background: rgba(139,92,246,.10); color: #fff; }   /* the row that matters */
```

Animate the rows in (`rv` with increasing `--d`). Highlight the one row or column that carries the message: use a
`.hl` row or let a spotlight sweep across it. Don't highlight every row. Max 6 rows.

## 6. Chrome

- **Footer disclaimer (always):** `© 2026, Amazon Web Services, Inc. or its affiliates. All rights reserved.` on
  every slide, using the kit's footer class.
- **Page indicator (always):** the kit's `.slide-index` inside slides and/or a fixed `.page-number`. The engine fills
  both.
- **Progress:** `.progress-bar` and/or `.nav-dots`, styled by the kit. The engine drives them.
- **Eyebrow:** a small Latin uppercase context label ("AWS RE:INVENT 2026 · KEY METRICS"). Optional per slide,
  consistent across the deck.

## 7. Code quality

- Comment banners on every section; the deck CSS is grouped per slide (`/* === S04 · PLATFORM MAP === */`).
- Semantic HTML: `<section>`, `aria-label`/`data-label` on slides, `alt` on images, `aria-hidden="true"` on purely
  decorative layers.
- Keyboard navigation works fully. `prefers-reduced-motion` gives a clean static deck (the engine plus the
  final-state rule).
- No inline `onclick` handlers; use `ctx.on(...)` inside hooks.

## 8. File structure

```
my-presentation/
├── index.html       # The presentation (all CSS/JS inline)
├── assets/          # Images, videos, diagram PNGs (only if used)
└── vendor/          # Only if an effect needs a vendored lib (three.js, GSAP; see effects-reference.md)
```

**Sharing:** zip the folder. The recipient unzips it and opens `index.html`.
