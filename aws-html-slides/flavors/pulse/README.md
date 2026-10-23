# Flavor 3 · Pulse: "living infrastructure"

In Pulse the cloud is alive. A **dotted 3D globe** (lit sphere, 33 glowing region dots, great-circle arcs with
traveling light pulses) persists behind every slide and **re-docks** between them: it moves, resizes, fades and
re-tilts in step with the slide dissolve. Content is wired together by **beams**, SVG paths with comet pulses that
light their targets on arrival. Numbers are always live: count-ups, tickers, streaming sparklines.

The palette is re:Invent purple / pink / AWS orange on near-black. It is never cyberpunk teal.

**Best for:** cloud, infrastructure, data and streaming, global scale, AI platforms, launches, metrics stories,
architectures and pipelines.

**Less suited to:** quiet, text-heavy narratives. Use Aurora there.

Reference decks:
- `preview/3-pulse-keynote.html` (EN, product keynote)
- `preview/3-pulse-bigdata.html` (zh-CN, real-time streaming solution)

## 1. Assemble a deck (exact inline order)

```
<head>  Google Fonts: Albert Sans 400/500/600 + Urbanist 400–900 (+ Noto Sans SC 400/500/700/900 for CJK decks)
        Lucide UMD  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js">
<style> /* === STAGE ENGINE CSS (engine/stage-engine.css) === */     verbatim
        /* === INLINE EDITOR CSS === */                              verbatim (only if editing is enabled)
        /* === FLAVOR KIT CSS (flavors/pulse/kit.css) === */          verbatim
        /* === DECK CSS === */                                       your one-off layout
<body>  <div class="p-progress"><span class="slide-index"></span><nav class="nav-dots"></nav></div>
        <section class="slide" …> … </section>  + optional <script> hook right after each slide (STAGE_HOOKS.push)
        <script> stage-engine.js </script>  <script> inline-editor.js </script>  <script> kit.js </script>  <script> deck glue </script>
```

- The kit **creates the backdrop itself**: `.p-bg` (nebula, grid, scan line, vignette) and `canvas.p-globe`. Both are
  `.stage-bg`, so they are hidden in print. Don't write them yourself.
- The kit also runs `lucide.createIcons()`, waits for `document.fonts.ready`, and builds every
  `svg[data-chip]` and `svg.p-beams[data-links]`.
- Each slide: `<section class="slide" data-scene="key" data-label="…" data-thumb="<css bg>" data-globe="preset">`
  wrapping **one** `<div class="p-box">`. That is the 16:9 stage, 100u × 56.25u; all layout goes inside it, in `--u`.
- Full-bleed layers sit outside `.p-box` but inside the slide: `.p-scrim.*`, `canvas.p-fx`, `.p-flash`, `.p-shock`.
- `--d` counts **seconds** in Pulse (`style="--d:.4"`). The kit sets `--rv-step:1s`.
- Engine reveals (`rv rv-blur rv-scale rv-left`, `data-split`) and `.count[data-count]` work unchanged.
- `data-thumb` is only a fallback. After fonts load, the kit paints each slide's real globe dock into a JPEG and
  replaces `data-thumb` / `--stage-thumb`, so overview cards and PDF pages show the globe. Add `data-thumb-keep` to
  opt a slide out.

## 2. Motif configuration (no kit edits needed)

| Attribute | Meaning |
|---|---|
| `data-globe="preset"` | Where the globe docks for this slide (see the table below). Default: `hidden` |
| `data-globe-opts="k:v; …"` | Overrides: `x y r` (stage units u), `alpha tilt arcs ring reg` (0..1), `lit` (0–33 region dots), `power` (s: regions light 0→lit after .4s), `fire` (s: **every arc fires at once**, plus an atmosphere flare) |
| `[data-globe-anchor]` | Any element inside the slide. The globe docks onto its box (center + radius = half its width). Beats preset geometry; `x/y/r` opts beat both |

| Preset | Geometry (u) | Look | Typical use |
|---|---|---|---|
| `hero-right` / `hero-left` | (66, 28.6) r25 / (27, 31) r22 | full, arcs + orbit ring (right) | cover, title + globe |
| `edge-left` / `edge-right` | (9 or 91, 28) r32 | big limb, mostly off-screen | agenda, section open; beams leave the limb |
| `side-right` / `side-left` | (78 or 22, 20.8) r14.5 | medium, ring .6 | metrics beside a stat column |
| `backdrop` | (50, 25.4) r21, alpha .42 | faint, behind a hub | hub / platform maps |
| `center` | (50, 20.4) r15 | full + ring | closing with text below |
| `horizon` | (50, 78.5) r45, tilt .12 | rising planet | closing / big statement above |
| `mini` | use with an anchor | tiny, no arcs | a node in a diagram (e.g. "Deploy" step) |
| `core` | collapses to a point, alpha 0 | — | product reveal: globe shrinks into the ignition core |
| `hidden` | keeps position, zooms out, fades | — | dense slides that need the whole canvas |

The re-dock is a 1.7s ease-in-out from the *current* state, so rapid navigation never jumps.

`window.Pulse.globe` exposes:
- `lit(n)`: drive the region count, e.g. `Pulse.globe.lit(+counter.textContent)` every frame.
- `fire(delayS)` and `calm()`: start the synchronized arc firing, or return to ambient arcs.
- `boost(v)`: flare the atmosphere.
- `state`: live `{cx, cy, r, alpha…}`.
- `regions`: an array with live screen `sx, sy, sz`, used by emitters.
- `dock(slide, W, H)`: resolve where a slide's globe sits.

## 3. Beams: declarative wiring

```html
<svg class="p-beams [bright]" data-links="FROM > TO | opts; FROM > TO | opts"></svg>   <!-- direct child of .p-box -->
```

**Endpoints.** An endpoint is `selector@side`, scoped to the slide. `side` is one of:
- `r l t b`: the box edge, or a child `.p-port.<side>` if the element has one.
- `c`: the center.
- `o`: the circular outline facing the other end (round hubs).

`globe` is also an endpoint: it is a point on the globe's limb in this slide's dock.

**Pairing** depends on how many elements each selector matches:
- equal counts are zipped;
- one-to-many broadcasts;
- otherwise the cross product.

**Options** (defaults in brackets):
- `n` [1]: comets in flight.
- `dur` [.9]: travel seconds.
- `every` [3.2]: cycle seconds. `n=3 dur=1.2 every=1.2` gives a continuous stream.
- `at` [.6]: first launch, in seconds after entry.
- `stag` [.15]: added per pair.
- `alt`: odd cycles flow back.
- `light`: adds `.on` to the destination when the first comet lands.
- `curve=h|v|s|radial` [auto].

`bright` makes the resting lines a visible gradient. Use it when the still frame must read as a graph.

**Lifecycle.** Comets replay on every entry and stop when the slide is left. Under `.is-final` the comets are hidden
and every `light` target gets `.on`. The kit registers that `final()` itself.

Style lit targets with `.x.on` or `:has(.x.on)`.

Examples:
- `globe > .ag-node@l | dur=.8 every=4.4 at=1.1 stag=.18 light` (an agenda fanning out of the globe)
- `#hub@o > .p-node.l@r | alt light` (a hub with services)
- `.src@r > #kinesis@l | n=2 dur=1.3 every=1.3` (streams into an ingest node)

## 4. Component catalog (`kit.css` / `kit.js`)

**Final state.** Every row below is CSS-final-safe: `.is-final` renders the finished look, including in print, where
slides are final but not active. JS helpers note their `final()` instead.

| Class / API | Snippet → what it does |
|---|---|
| `.p-hdr` `.p-live` `.slide-index` | `<div class="p-hdr"><span class="p-live">AWS re:Invent 2026 · <b>Agenda</b></span><span class="slide-index"></span></div>` gives a top bar with a blinking live dot. Its index reads `02 / 07` |
| `.p-ftr` `.p-note` | Copyright footer; tiny data footnote (e.g. `示例数据，仅供演示`) |
| `.p-eyebrow[.c]` `.p-h2` | Latin tracked eyebrow with a pink rule (`.c` centers it); the display heading. On `:lang(zh)` the heading uses no tracking and line-height 1.25 |
| `.grad` `.grad-warm` `.p-shimmer` `.p-glow` | Gradient text: purple→pink, or purple→orange with a shimmer; `.p-glow` adds a soft drop-shadow halo. **Never split** gradient runs |
| `.p-wipe` | Clip wipe for gradient + glow text (insets are wide, so the halo never shows a box). Use it instead of `rv-mask` when `.p-glow` is on |
| `.p-fade` `.p-pop` `.p-draw` `.p-grow` | Fade · overshoot pop · SVG stroke draw (`pathLength="1"`) · scaleX bar grow (HTML or SVG `rect`) |
| `.p-panel[.clear]` | Glass card; `.clear` lets the globe show through (use it for a panel holding a `[data-globe-anchor]`) |
| `.p-pill` `.p-tag` `.p-badge` | Hero pill with an orange icon; product chip; orange "+N new" badge |
| `.p-tick` | `<div class="p-tick"><span class="k live">Live · tokens/sec</span><span class="v mono" id="x">4,820,000<small>/s</small></span></div>`, driven by `Pulse.ticker` |
| `.p-scrim.left/.right/.top/.hdr` | Legibility gradients over the globe. `.hdr` = top-left band behind the header |
| `.p-node` + `.p-port.r/l/t/b` | Graph card with ports; `.on` glows it and its port |
| `.p-hub` + `.p-ring` `.glass` `.orbit` | Circular focal hub with a spinning conic border (`.p-ring` works on any rounded element) and a dashed orbit |
| `.p-step` (`.dot .n .t .d`, `.globe`) | Pipeline stage circle + label. Driven by `Pulse.packet(svg, steps).build()/.reset()/.tick(tau)`; `Pulse.packet.final(root)`. `.globe` = transparent dot for a `mini` globe anchor |
| `.p-stat` (`.num .lbl .viz`) | Metric row: big count-up, label + delta (`.up` `.dn`), and a sparkline/bars SVG with `.p-draw`, `.p-fade`, `.p-grow` |
| `.p-spec` (`.v .l`, `.v.live`) | Spec line for reveals (`4x` training performance; a green live "Today") |
| `.p-chip` | 3D isometric silicon: `<div class="p-chip" style="--d:1.15"><div class="in"><div class="c3"><div class="shadow"></div><div class="lay"></div>…<svg data-chip="1.15"></svg><div class="lid"><span>TRN4</span></div></div></div></div>`. The kit builds the die, HBM, fan-out traces that draw in, and pulses along them |
| `canvas.p-fx` + `.p-flash` `.p-shock[.b]` | Effect canvas (sized by the kit) and the ignition flash and shock rings; `Pulse.flash(slide, x, y)` restarts them |
| `.p-feed` + `.p-alert.hi/.wa/.inf` | Live alert rows (dot · text + mono meta · status chip); push/translate them from a hook |
| `.p-bars` | Five bouncing bars, a "dashboard is live" glyph |

JS helpers. Call them inside a hook, normally `Pulse.loop(ctx, (t, tau) => …)`, where `t` is seconds and `tau` is
seconds since entry:

| Helper | What it does |
|---|---|
| `Pulse.ticker(el, fn, {every, format})` | A throttled live number. Keeps a trailing `<small>` unit |
| `Pulse.spark(svg, fn, {lo, hi, area, stroke, threshold})` | A streaming chart, ticked with `.tick(t, k)`. `k` grows the amplitude in on entry |
| `Pulse.emitter(canvas, {from:'regions'\|'edges', to, rate, dur, start, lift})` | Events leave the lit region dots (or the screen edges) and fly to `to(e)`, which is any point. The default target is the globe |
| `Pulse.ignite(canvas, {core, at, onIgnite})` | Product reveal: edge streams and spiralling particles converge, then the core ignites. `.reset()` / `.tick(t, tau)` / `.still()` |
| `Pulse.beams.add/set/curve/defs` | Hand-built beams when `data-links` is not enough |
| `Pulse.onLayout(fn)` | Re-run your own SVG builds on resize |
| Utilities | `Pulse.posIn(el, box)`, `Pulse.boxOrigin()`, `Pulse.u()`, `Pulse.fmt`, `Pulse.easeIO`, `Pulse.clamp`, `Pulse.lerp`, `Pulse.svgEl` |

## 5. Composing NEW slides in Pulse

Signature moves (use at least one per slide):
1. The globe re-docks to support the slide's focal point.
2. Something flows: beams, packets, emitters.
3. Something counts: a count-up or a live ticker.

Keep **one focal point**. The globe is either the focal point or a backdrop, never a competitor.

| Content | Composition in Pulse |
|---|---|
| Cover / title | `hero-right` + `.p-scrim.left`, `power:1.9`. Title: plain line `data-split="words"` + gradient line `.p-wipe.p-glow`. Optional legend with a live ticker. Alternative: `hero-left` + emitter comets flowing into stream lanes (`data-links` on straight `<i>` rows) |
| Agenda / sections | `edge-left`; items on a gentle arc (`margin-left` bulge), beams `globe > .node@l … light`; titles brighten via `:has(.on)` |
| Metrics | `side-right` globe + `.p-stat` rows (draw-in sparklines, bars) + one hero count that drives `Pulse.globe.lit()`; a `.p-tick` and an insight line on the bottom band |
| Architecture / platform | `backdrop` globe behind a `.p-hub`; `.p-node` cards around it; `#hub@o > .node@side | alt light`, `bright` resting lines |
| Pipeline / process | `.p-step` row + `Pulse.packet`; end in a `mini` globe anchor ("deployed worldwide"); a mono readout updated in `onStage` |
| Data flow / DAG | Columns of `.p-panel` nodes with ports, multi-comet streams (`n=2–3, every=dur`), live `.p-tick`s at the top-right |
| Dashboard | Bento `.p-panel`s: a big ticker + `Pulse.spark`, a latency line with `threshold`, a `.p-feed` of alerts, the globe docked in a `.p-panel.clear` via `[data-globe-anchor]` |
| Comparison / before→after | Collapse metaphor: a big number morphs on a log track (see the big-data slide 5) or two lanes where one stream visibly outruns the other |
| Timeline / roadmap | A horizontal `.p-step` track with dates; the packet stops at "today"; future steps stay dim (no `.on`) |
| Chart | A static SVG chart revealed by a clip-rect sweep + a playhead dot with a mono tooltip (big-data slide 6) |
| Quote | `horizon` globe, `.p-scrim.top`, quote `data-split="words"`, then the sign-off `.rv-blur` with `fire:1.45` |
| Product reveal | `core` globe + `canvas.p-fx` with `Pulse.ignite` + `.p-flash/.p-shock` + `.p-chip` (or any hero object) + `.p-wipe` name + `.p-spec.p-pop` rows |
| Image / screenshot | `.p-panel` frame with a beam landing on it (`light`), globe `side-left`/`hidden`; keep the image sharp (no scrim over it) |

Don'ts:
- No teal or cyan.
- No emoji (use Lucide).
- No solid left-border rails.
- No card grids where every card is icon + title + text.
- Don't put the globe *behind* body text without a scrim.
- Don't fire every arc on more than one or two slides; it's the closing move.
- Don't run more than one emitter/ignite canvas per slide.
- Don't split gradient text.

## 6. CJK notes

- Add Noto Sans SC to the Google Fonts link. The kit's font stacks already fall back to it.
- Latin eyebrows may be tracked. **Chinese text never gets letter-spacing.**
- Headings use line-height 1.2–1.3 (`:lang(zh) .p-h2` does it). Use `<html lang="zh-CN">`.
- `data-split="chars"` is fine for plain CJK titles. Check 1280×640 for orphan single characters, and give
  `white-space:nowrap` to short headlines.
- Product names stay in English.

## 7. Performance

- One shared rAF loop draws the globe: about 4.6k dots and 20 arcs, under 3ms. Hook loops (`ctx.raf` / `Pulse.loop`)
  only run on the active slide, and everything pauses while the tab is hidden.
- DPR is capped at 2.
- Under reduced motion the globe draws still frames only, and comets don't run.
- Thumbnails are rendered once, at 960×540 JPEG.

## 8. Gotchas (all hit while building the reference decks)

- **Print / PDF.**
  - The kit pins `--u:16px` and un-centers `.p-box` in print. Measured, Chrome's PDF pass sized viewport units
    differently from the 1600×900 page.
  - **Don't vertically center with `top:50%` + `translateY(-50%)`.** The PDF pass fragments abspos boxes by their
    pre-transform position and pushes the overflow to the page bottom. Use a full-height flex column
    (`top:0; bottom:0; display:flex; justify-content:center`).
  - A `canvas` with additive glow prints as a **white** rectangle, so `.p-fx` is hidden in print.
  - The chip prints as a flat 2D isometric.
  - `.p-ring` prints as a plain border, because `mask-composite` isn't honored in PDF.
- **Final states.** Keyframe reveals keyed on `:is(.is-active,.is-leaving)` never run in print for non-current
  slides. Every such class needs an explicit `.slide.is-final` rule; the kit has them for all `p-*` classes.
- **Reduced motion.** The engine calls `enter(ctx)` with `ctx.reduced = true`, not `final()`. Set the end state in
  `enter` too, e.g. `if (ctx.reduced) return Pulse.packet.final(slide);`.
- **Beams on straight lines.** The kit uses user-space gradients and filters; a bbox-relative blur vanishes on a
  zero-height path. Keep that if you hand-build beams.
- **Layout reads.** Use `Pulse.posIn` (offset space), not `getBoundingClientRect`, for geometry. Slides are scaled
  and blurred during the dissolve.
- **Clones.** `final(slide)` also receives overview clones, so query *through* `slide` and build DOM idempotently.
- **Editor.** Hook scripts must not touch the DOM at parse time. Build runtime DOM in `enter`. Mark editable spans
  with `class="edit"`.
