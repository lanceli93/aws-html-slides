# Flavor 1 · Aurora (流光)

Aurora is the re:Invent theme drawn as light: **one persistent WebGL field of silk light ribbons** (purple → magenta →
pink → AWS orange, long-exposure filaments rather than blurry blobs) runs behind **glass surfaces**. On every slide
change the field re-composes. It moves, tilts, dims or flares so the background travels with the story:
- bright and full on covers and reveals
- pushed to an edge and dimmed on dense slides
- fractured and cold on a "problem" slide, then healed on the "solution"

**When it shines:** executive, keynote and strategy decks, product announcements, and narrative pitches with a few
big numbers. It is elegant and restrained, the lowest-risk flavor.
**When to pick another flavor:** a deep architecture walkthrough with many layers (use Spatial), or a live-data /
streaming story (use Pulse).

Reference decks: `preview/1-aurora-keynote.html` (EN, 7 slides) and `preview/1-aurora-bigdata.html` (zh-CN, 8 slides).

## 1. Assembling a deck (exact order)

```
<head>  Google Fonts (Albert Sans 400/500/600 · Noto Sans SC 400/500/700/900 · Urbanist 300–900) + Lucide UMD <script>
<style>
  /* === STAGE ENGINE CSS (engine/stage-engine.css) === */      verbatim
  /* === INLINE EDITOR CSS === */                                verbatim (if editing is on)
  /* === FLAVOR KIT CSS (flavors/aurora/kit.css) === */          verbatim
  /* === DECK CSS === */                                         your per-slide layout only
</style>
<body>
  <canvas class="au-gl stage-bg"></canvas>  <div class="au-fallback stage-bg">…</div>   (kit creates them if missing)
  <header class="au-top">…</header>  <footer class="au-bot">…<nav class="nav-dots"></nav></footer>
  <section class="slide" data-scene data-ribbons data-label data-thumb> … </section>  (+ hook <script>s)
  <script> stage-engine.js </script> <script> inline-editor.js </script> <script> kit.js </script> <script> deck glue </script>
```

Chrome (copy it as is; the engine fills `[data-stage-label]`, `.slide-index` and `.nav-dots`):
```html
<header class="au-top"><div class="au-brand"><span class="au-mark"></span>re:Invent <b>2026</b></div>
  <div class="au-where"><span data-stage-label></span><span class="slide-index"></span></div></header>
<footer class="au-bot"><span class="au-legal">© 2026, Amazon Web Services, Inc. or its affiliates. All rights reserved.</span>
  <nav class="nav-dots" aria-label="Slides"></nav></footer>
```
Every slide needs `data-scene`, `data-label` and a CSS `data-thumb`. kit.js prepends a real rendered ribbon snapshot
to `data-thumb`, so the overview and print show the true motif; the CSS gradient you write stays as a fallback.
Put content in `<div class="frame">`, the 16:9 content box. Its modifiers are `.frame.center` (centred column) and
`.frame.row` (side by side).

**Units.** Everything is sized in `calc(var(--u) * N)`. 1u is 1% of a 16:9 box fitted in the viewport, so the canvas
is 100u × 56.25u. The frame is about 88u × 45u. Fit is automatic at 1280×640, 1600×900 and 1920×1080.

**Timing.** `--d` counts in **seconds** in this flavor (`--rv-step:1s; --rv-base:.32s`). Use the engine reveals
(`rv`, `rv-blur`, `rv-mask`, `rv-scale`, `rv-left`, `data-split`) plus the kit extras below.

## 2. Motif configuration: `data-ribbons`

`data-ribbons="preset key:value … event:value"`. Tokens are space-separated; later tokens override earlier ones.
If the attribute is missing, a `data-scene` that equals a preset name is used, otherwise `calm`.

| Preset | Composition | Use for |
|---|---|---|
| `hero` | full diagonal sweep, bright, right side | cover with a left-aligned title |
| `horizon` | bright band under a centred title | centred cover |
| `diagonal` | steep diagonal on the left | agenda, split layouts with content on the right |
| `floor` | low, dim band along the bottom | dense metrics, tables, charts |
| `through` | crossing the left third | bento with a thin-glass hero cell on the left |
| `corner` | top-right corner | process and flow |
| `left` / `right` | mid-dim, on that side | hero panel on that side |
| `curtain` | vertical light columns | accordions, pillars, columns |
| `runway` | fast, low band | timelines, roadmaps |
| `announce` | ribbons pinch into a bright core + anamorphic streak | product reveal (the wow) |
| `converge` | softer core | sign-off |
| `calm` | slow, warm, low | quote, closing |
| `fracture` | broken, desaturated shards | problem / pain slide |
| `heal` | whole, low | pair with `heal:<s>` right after a `fracture` slide |
| `off` | no ribbons | full-bleed image slides |

**Keys** (numbers):
- `ox`, `oy`: field origin in viewport-height units. 0 is the centre; ±0.89 is the left/right edge at 16:9.
- `ang`: angle in radians. 1.5 is vertical.
- `int`: brightness, 0–1.3.
- `spread`: fan width of the 7 ribbons.
- `amp`: wave amplitude.
- `hue`: below 0 is cooler, above 0 is warmer / more orange.
- `flare`: 0–1, converge into a core.
- `speed`
- `sweep`: 1.2 is whole, −0.2 is fully fractured.

**Events**, measured in seconds after the slide is entered:
- `burst:1.35`: a flash at the core. Set its strength with `burstv:.45`.
- `heal:1.15`: hold fractured, then sweep left→right back to whole. Set its length with `healdur:2`.

```html
<section class="slide" data-scene="reveal" data-ribbons="announce burst:1.35" …>
<section class="slide" data-scene="pain" data-ribbons="fracture" …>  →  <section … data-ribbons="heal heal:1.15">
<section class="slide" data-scene="kpi" data-ribbons="floor int:.75 oy:-.38 hue:.1">
```

**JS API** (`window.Aurora`, for hooks):
- `Aurora.set('floor int:.8' | {oy:-.3} , {instant})`
- `Aurora.burst(v)`, `Aurora.heal(delay, dur)`
- `Aurora.presets` (add your own: `Aurora.presets.mine = {…}`), `Aurora.parse(str)`, `Aurora.config(slide)`, `Aurora.state`, `Aurora.webgl`
- `Aurora.cycle(acc, ctx)`, `Aurora.accOpen(acc, i)`, `Aurora.dissolve`

The kit installs `Aurora.dissolve` as the transition. It is the engine dissolve without the incoming opacity fade,
because an opacity<1 ancestor disables `backdrop-filter`, so glass would pop. Hook example:
```js
STAGE_HOOKS.push(['reveal', { async enter(s, ctx) { if (ctx.reduced) return; await ctx.wait(1350); Aurora.burst(1); } }]);
```

## 3. Component catalog

In the selectors below, "ON" means the shown state, `:is(.is-active,.is-leaving,.is-final)`. Every component below is
complete under `.is-final` (reduced motion, overview, print and editor).

**Type**
- `.eyebrow` (`.center`) is a Latin uppercase label with a gradient tick.
- `.h2` is the section title. Wrap it as `<h2 class="h2 ml"><span>…</span></h2>` for a masked rise, and use
  `<em>` for a gradient word.
- `.lead` is body text.
- `.grad` / `.grad-warm` are gradient text. Add `.sheen` for a slow drift.
- `.lat` is a small tracked Latin label.
- `.lab` is an uppercase label with an icon; `.lab-cn` is the CJK label (no tracking).
- `.fn` is a footnote (illustrative-data note).

**Reveal extras**

| Class | HTML | Effect |
|---|---|---|
| `.ml` | `<span class="ml"><span>Line</span></span>` | line rises out of a clipped line box |
| `.au-rise` | `<h1 class="au-rise" data-split="words">` | each word rises behind a mask (Latin) |
| `.au-type` | `<p class="au-type" data-split="chars" style="--split-step:26ms">` | quick typed-in characters |
| `.rv-mask.au-focus` | `<span class="grad-warm rv-mask au-focus">Generative AI</span>` | gradient words wipe + focus-pull as **one unit** |
| `.hl` | `<span class="hl" style="--d:.5"></span>` | hairline draws left→right |
| `.fall` | `<div class="fall" style="--fr:-4deg">…</div>` | heavy drop with a settle (problem cards) |
| `.land` | `<div class="land" style="--d:2"><span class="txt grad-warm">Now go build.</span><span class="glow" aria-hidden="true"><span class="grad-warm">Now go build.</span></span></div>` | sign-off lands from blur with a glow copy behind |
| `.wide-in` | `<div class="wide-in">Announcing</div>` | letter-spacing tightens in (Latin only) |

**Surfaces**
- `.glass` is frosted glass. Add `.thin` so the ribbons stay visibly alive through it; use it for the one hero cell.
- `.beam` is a light running around the border. **One per slide, on the focal surface.**
- `.spot` is a cursor spotlight; the kit feeds `--mx`/`--my`.
- `.shard` is a cold fractured card:
  - offset it with `--ox`, `--oy`, `--or`;
  - make it drift with `--dx`, `--dy`, `--dr`;
  - add `<svg class="crack" viewBox="0 0 100 100" preserveAspectRatio="none"><path pathLength="1" d="…"/></svg>`.
- Other pieces:
  - `.chip` / `.chips` for product names;
  - `.pill` + `.live` for an availability badge;
  - `.cta` for a call-to-action pill (combine with `glass beam`).

**Data**
- `.stat` holds a big number: `<div class="stat"><span class="count" data-count="100">100</span><span class="sfx">K+</span><small>lower</small></div>`.
  The suffix is gradient; counters use the engine's `.count`. Add `data-ease="linear"` when it must match a linear CSS motion.
- `.delta.up|.down|.new` is a trend line with an icon: `<div class="delta up"><i data-lucide="trending-up"></i>42% <em>vs 2024</em></div>`.
- `.statrow` is one glass panel of N columns split by fading hairlines. Set the count with `style="--cols:4"` and add `glass beam`.
- **Sparkline**: SVG with viewBox `0 0 180 54`.
  - `path.spark` (`pathLength="1"`, `stroke` = gradient) draws in.
  - `path.spark-area` fades in.
  - `circle.spark-halo` + `circle.spark-dot` ping at the end point.
  - Give each piece the same `--d`.
- **Meters**: `<div class="meters"><div class="meter"><span>Label</span><div class="bar"><i class="hot lin" style="--w:10%;--dur:.3s"></i></div><b>12 s</b></div></div>`.
  - `--w` is the bar length and `--dur` the grow time.
  - `.hot` makes it a gradient bar; `.lin` makes it grow linearly.
  - For a **race** (A vs B), give both bars the same speed: length ∝ time.
- `.shrink` (`style="--to:.55"`, two divs) is a before/after bar where the second shrinks. Use it for cost down.
- `.gauge` is a ring (`viewBox 0 0 60 60`, `circle.bg` + `circle.fg pathLength="1"`). `--to` is the fraction that remains.
- `svg.dotgrid[data-au-dots="33,4,11"]` builds 33 dots in 11 columns; the last 4 are orange.
- `[data-au-icons="user-round,18,6"]` builds 18 icons; 6 are "existing" and the rest light up (3x growth).
- `.packet` is a dotted track with a travelling light packet (latency, flow).

**Structure**
- **Index list**: `ol.idx > li.idx-row(.focal.glass.beam.spot) > .idx-n + .idx-t + i.idx-ic (+ .tag, .hl)`. Use it for agendas and chapters.
- **Light trail**: `.trail-steps > .au-trail(.fill + .shine) + N × .step(.final) > .node(icon) + .lbl(.sn, h3, p)`.
  - The kit times every node to the travelling head.
  - Set `--trail-dur` / `--trail-t0` on `.trail-steps`. The default is 5 steps; any N works.
- **Before → after board**:
  - `.cmp` with header cells `.cmp-h(.after)`, then per row `.cmp-k` + `.cmp-b` + `.cmp-c>i` + `.cmp-a.glass`.
  - Put `--h:<s>s` on each row's cells: the time the seam reaches that row.
  - Add `.seam` (and `--seam-t0`, `--seam-dur` on `.cmp`).
  - Pair it with `data-ribbons="heal heal:1.15"` so the ribbons heal in sync with the seam.
- **Accordion**:
  - `.acc[data-cycle="3.8"] > .acc-i.rv[style="--c:#8B5CF6"] > .acc-c(.lat, .vt, icon) + .acc-x(.lat, .wm, h3, .tl, p, .chips) + .acc-bar>i`.
  - It auto-cycles while the slide is active and hover pins an item.
  - `.vt` is vertical CJK text.
- **Roadmap / gantt**:
  - `.road[style="--dur:3.6s;--t0:.5s"]` contains `.scale` (`.tick`, `.tick.last`, `.ms[--p]`, `.ms.end`) + `.lanes > .lane(.end)` + `.playhead`.
  - Each lane is `.lane[--l,--w,--p,--len,--c] > .bar(b, span) + ul>li`.
  - `.playhead` is `.playhead > .day > .count[data-ease=linear]`.
  - `--p` is start ÷ total and `--len` = `--dur` × (length ÷ total), so the bars grow exactly under the linear playhead.
- **Orbit**: `.orbit > .plane > .ring×3[--in,--sp,--sz] + .core` is a tilted 3D ring system. Use it as the "alive" focal inside a hero cell.
- **Product reveal**: `.wide-in` eyebrow → `.reveal-sub` (AWS) → `h2.reveal-name` (`.accent` on the version) →
  `.reveal-line` → `.specs > .spec(.v, .k)`. Defaults are tuned for `data-ribbons="announce"` plus a burst at 1.35 s.
- **Quote**: `.q-mark` icon, `p.q-text` (`.au-type` for EN, plain `data-split="chars"` for CJK), `.q-by(.center)`.

## 4. Composing NEW slides in Aurora

**The signature moves:**
1. Ribbons as the narrative camera.
   - Choose the preset per slide so consecutive slides **differ** in position and angle; the travel is the
     transition's second layer.
   - Bright on title, reveal and closing slides.
   - `floor`, `corner` or `left`/`right` (int ≤ .65) behind dense content.
2. **One** focal surface per slide (`glass beam`), everything else quieter: plain rows, hairlines, or simple `glass`.
3. Big numbers count up, and every number has a small live visual (spark, meter, gauge, dots, icon grid).
4. Kinetic type stays restrained:
   - masked lines for titles;
   - word rise for Latin covers;
   - gradient words as **one** unit;
   - characters only for quotes and short CJK lines.
5. One wow per deck, such as `announce` + burst, or `fracture` → `heal`.

**Recipes for common content:**

| Content | Aurora layout | Ribbons |
|---|---|---|
| Cover | left title (`hero`) or centred title (`horizon`); eyebrow, `au-rise` line, `grad-warm sheen rv-mask au-focus` line, sub, chips | `hero` / `horizon` |
| Agenda / chapters | big word left + `.idx` list right; the next item `.focal` | `diagonal` |
| Problem / risks | headline left + 2×2 `.shard`s in `.fall` wrappers, red stats; heavy drift | `fracture` |
| Comparison / before-after | `.cmp` board with seam | `heal heal:1.15` (after a fracture slide) |
| Capabilities / pillars (3–6) | `.acc` accordion (auto-cycle) or bento with one thin-glass hero | `curtain` / `through` |
| Metrics (3–5) | `.statrow` in one glass panel, a mini visual per column, insight line below | `floor` |
| Hero metric + supports | hero glass with a giant `.stat` + race meters, rows of `.stat` + shrink/gauge/icongrid | `left` |
| Architecture / platform | bento: thin-glass hero (with `.orbit`) + glass cells + a full-width strip with `.packet` | `through` |
| Process / steps | `.trail-steps` light trail; last step `.final` | `corner` |
| Timeline / roadmap | `.road` gantt with playhead and milestones | `runway` |
| Quote / testimonial | `.q-text` + `.q-by`, facts row, or a results card beside it | `calm` / `right` |
| Product reveal | `.wide-in` eyebrow, `.reveal-name`, `.specs` | `announce burst:1.35` |
| Chart / table | `glass` panel; animate bars with `.meter`, lines with `.spark`; keep 1 highlight colour | `floor` |
| Image / screenshot | `glass` frame around the `<img>` (lightbox is automatic) | `off` or `calm int:.4` |
| Closing / CTA | `.land` sign-off + `.cta.glass.beam` | `converge burst:1.15 burstv:.45` / `calm` |

**Don'ts:**
- No beam on more than one surface per slide.
- No orbs or blobs. Never stack a second motif on the ribbons.
- No bright ribbons (`int` > .7) behind body text. Move the field with `ox`/`oy` instead.
- Never split gradient text per character (the engine refuses it; use `rv-mask`).
- Don't use the same preset on consecutive slides; the travel is lost.
- No emoji, no coloured left rails, no "icon tile + title + desc" grid on every slide.
- No wide letter-spacing on Chinese text (`.lat`, `.lab` and `.wide-in` are Latin only).

## 5. CJK notes
- Set `<html lang="zh-CN">`. `.h2` and `.q-text` switch to CJK metrics automatically: heavier, line-height 1.25 / 1.5,
  no tracking.
- Use `.lab-cn` for Chinese labels. Keep the Latin eyebrow in English (`The Problem`, `Business Value`).
- The engine splits CJK per character with punctuation glued, so `data-split="chars"` is safe on Chinese paragraphs.
  For poetic quotes, write `<br>` line breaks by hand.
- Keep each shard or card description to 2 short clauses with a hand-placed `<br>`. This avoids single-character
  orphans at 1280×640.
- AWS product names stay in English inside Chinese copy. `.chip` is nowrap.

## 6. Performance
- The ribbon shader draws 7 ribbons × 7 filaments per pixel at DPR ≤ 1.5.
  - It runs on the engine's shared rAF, which pauses when the tab is hidden.
  - Under reduced motion it draws one static frame per slide.
- WebGL context loss is handled (it rebuilds on restore). Without WebGL, `.au-fallback` (CSS ribbons) shows.
- Thumbnails are rendered once at load: an offscreen 1280×720 JPEG per slide, about 60–120 KB each, held in memory.
- `backdrop-filter` over a moving canvas is the main GPU cost. Keep it to roughly 6 glass surfaces per slide.
  `.thin` glass is cheaper.

## 7. Gotchas (hit while building)
- **Glass + opacity.** Fading the incoming slide's opacity (the engine's default `stage-in`) disables
  `backdrop-filter` until the fade ends, then the glass pops. That is why the kit sets `Aurora.dissolve`; keep it.
- **Print shrink.** A filtered, absolutely positioned layer that sits off-page made Chrome scale *every* PDF page to
  about 84%. It was a collapsed accordion's `.wm` with drop-shadow, even though it was clipped. The kit hides
  collapsed `.acc-x` in print. Check `pdfinfo` + render a page after adding new off-canvas content.
- **Animations restart at t=0 in print.** Pin end frames with `.slide.is-final .x { animation:none; … }`. Examples:
  playhead, trail, glow. Rules for kit components are already included.
- **Masks in PDF.** Chrome's PDF output ignores `mask-composite`, so `.beam` would print as a wedge. The kit hides
  beams in print.
- **Wrapped gradient text.** `clip-path` on a wrapped *inline* box clips the second line. `.rv-mask.au-focus` /
  `.ml .rv-mask` are inline-block for that reason.
- **Fixed chrome in print** would repeat the live slide label on every page. The kit hides `.au-top` / `.au-bot`.
- **Number text.** Keep the final number in the HTML (`.count`). The editor and print show it as is.
- **Editor.**
  - Only `h1–h4, p, li, span.edit, [data-edit]` are editable. Wrap a short `div` label text in `<span class="edit">`
    to make it editable.
  - The `.land .glow` copy is not updated by edits, so keep the glow text in sync by hand if you edit it.
