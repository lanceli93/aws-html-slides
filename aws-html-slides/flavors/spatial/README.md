# Flavor 2 · Spatial — generator reference

**What it is.** The deck is one CSS-3D world. Every slide is a panel standing somewhere on an
infinite neon grid floor (purple→pink horizon, fog, drifting dust). Moving between slides is a
**camera flight**: the camera pulls back, turns and travels, then lands with a slight overshoot.
The panels it passes stay visible, dimmed, in perspective. When the camera lands, the panel faces it
square-on with crisp text. Content is built from **real 3D objects**: pillars rising from the floor,
an exploded isometric layer stack, a light pulse running a 3D runway, a spinning product chip, a
depth graph, and records falling through trays.

**When it shines.** Engineering and architecture talks, product launches ("Announcing …"),
platform maps, pipelines, metrics with a "wow" number, and migration journeys. Use it whenever
*space* is part of the story: layers, depth, flow, or a path from A to B.
**Avoid it** for text-heavy decks, dense tables, or more than about 14 slides (each flight takes about 1.5 s).

Reference decks: `preview/2-spatial-keynote.html` (EN product keynote) and
`preview/2-spatial-bigdata.html` (zh-CN Lakehouse deep dive).

## 1. Assembling a deck (exact inline order)

```html
<html lang="en|zh-CN"><head> …fonts (Urbanist, Albert Sans, Noto Sans SC) + Lucide CDN…
<style>
/* === STAGE ENGINE CSS (engine/stage-engine.css) === */      ← verbatim
/* === INLINE EDITOR CSS === */                                ← verbatim (optional)
/* === FLAVOR KIT CSS (flavors/spatial/kit.css) === */         ← verbatim
/* === DECK CSS === */                                         ← your per-deck layout only
</style></head>
<body data-stage="free">                                       ← REQUIRED (engine must not position slides)
<div class="sp-env stage-bg"><canvas></canvas></div>          ← floor / horizon / dust
<div class="sp-hud stage-bg">
  <div class="sp-brand"><b></b>AWS re:Invent 2026</div>
  <div class="sp-where"><span data-stage-label></span><span class="slide-index"></span><svg class="sp-map"></svg></div>
</div>
<nav class="nav-dots"></nav>                                   ← styled as bottom progress pips
<div class="sp-vp"><div class="sp-world">
  <section class="slide" data-label="…" data-thumb="var(--sp-thumb)"> … </section>   ← every slide
  …
</div></div>
<script>/* stage-engine.js */</script><script>/* inline-editor.js */</script>
<script>/* kit.js */</script><script>/* deck glue / extra hooks */</script>
```

**Every slide** gets `data-label` and `data-thumb="var(--sp-thumb)"`. The kit renders the grid floor
once into `--sp-thumb`, and overview cards and PDF pages use it as their background.

**Slide skeleton** (content panel):
```html
<section class="slide" data-label="Key Metrics" data-thumb="var(--sp-thumb)">
  <div class="sp-frame"></div>                                 <!-- HUD frame of the panel -->
  <div class="sp-stage d3">                                    <!-- padded content box (preserve-3d) -->
    <div class="L sp-head"><span class="eyebrow rv">Key Metrics</span>
      <h2 class="sp-h2 rv" style="--d:.1">Scale, <span class="grad">by the numbers.</span></h2></div>
  </div>
  … one component (pillars / stack / runway / …) …
  <p class="L sp-foot">© 2026, Amazon Web Services, Inc. or its affiliates. All rights reserved.</p>
</section>
```
Use `.sp-stage.center` for centred cover and quote slides. `.sp-note` sits bottom-right, for example
"示例数据，仅供演示".

## 2. The 3D rules (read this or things go flat)

- `.sp-world`, `.slide`, `.sp-cam` (auto-inserted), `.d3` and the component containers are
  **preserve-3d**. Never put `opacity`, `filter`, `overflow`, `clip-path`, `mask` or `isolation` on
  them, because any of these flattens the subtree.
- **`.L` = leaf.** A leaf sits at depth `--z` (e.g. `style="--z:40px"`; it does not inherit) and fades
  with the panel (`--fade`). Put reveals (`rv*`) on a child *inside* the `.L`, never on the `.L` itself,
  since reveals overwrite `transform`.
- Text belongs in leaves at `--z` ≈ 0, so it is crisp when the camera lands. Keep depth offsets for
  decoration and cards (±20–80px).
- Engine reveal timing is re-based to seconds: `style="--d:.4"` means start 0.4 s after entry.
  `data-split="words|chars"` works. Gradient text stays one unit, so use `rv-mask` on it.

## 3. Motif configuration (per slide, all optional)

| Attribute | Meaning |
|---|---|
| `data-world="x,z,yaw"` | Place the panel in the world. x and z are in viewport widths, yaw in degrees. Without it, the kit uses a winding auto path (8-step pattern, repeating further on) |
| `data-fly="dive"` | The wow slide: much bigger pull-back plus a longer dive. Reveals start earlier in the flight |
| `data-env="scroll:.05 warp:.55"` | The floor scrolls toward the camera (viewport widths/s) and dust streams like warp. Use on cover and closing |
| `data-scene="key"` | Optional. The kit assigns `sp-N` when absent; add your own key to attach extra hooks |

The boot "establishing shot" (high and far back, flying in) and `#N` deep links are automatic.
Pointer tilt (±1.6°) is on by default.

## 4. Component catalog

Every component is declarative. The kit builds the 3D parts, lays them out for the viewport (and
again for print at 1600×900), resets them and choreographs them on **every entry**, after the camera
lands. Their final state comes from `kit.css` (`.slide.is-final` forces `--e:1` and so on), so the
overview, print, reduced motion and the editor need no JS.

| Class | HTML | What it does | Final state |
|---|---|---|---|
| `sp-gate` | `<div class="sp-gate" data-depth="1.25" data-size=".74" data-ratio="1.32"></div>` | Neon oval light-gate standing on the floor behind a centred title; colour sweeps around it, ticks rotate, it powers up on entry. **Cover hero** | Lit, full size |
| `sp-cubes` | `<div class="sp-cubes" data-at="50,42" data-depth="-640"></div>` | Nested wireframe "table" cubes slowly rotating (data / Iceberg hero) | Full size |
| `sp-fan` | `<div class="sp-fan" data-at="50,61" [data-shape="convex"] [data-spread] [data-focus="3.2"]>items</div>` | Concave arc (agenda) or convex fan (comparison) of cards. Cards fly in from depth; with `data-focus` a spotlight cycles through them | All in place, undimmed |
| `sp-mono` | `<div class="sp-mono d3"><div class="sp-mono-num L">01</div><div class="sp-mono-body L"><div class="ico"><i data-lucide=…></i></div><h3>…</h3><p>…</p></div></div>` | Fan item: tall glass monolith with an outlined number floating in front | — |
| `sp-card` | any fan item / runway step | Glass card. `.sp-meter[data-v="4"]` (5 `<b>`) fills on entry | Meters lit |
| `sp-pillars` | `<div class="sp-pillars" data-depth=".3" [data-width=".1,.18"] [data-max]><div class="sp-pillar pink" data-v="6" [data-x="39"] [data-delay] [data-ease="back"]><div class="sp-plab"><p class="v"><span class="count" data-count="6">6</span>x</p><h4>Throughput</h4><p class="sp-delta up">…</p></div></div>…</div>` | Lit 3D bars standing on the grid floor, rising on entry with a glow pool; labels ride on top. Heights auto-fit below `.sp-head`. Colours: default purple, `pink`, `blue`, `orange`, `magenta`, `ghost` (grey "before") | Full height |
| `sp-stack` | `<div class="sp-stack" data-at="61,57" data-size=".27" data-gap=".5" [data-rz="-42"] [data-spin="36"] [data-orbit="4"] [data-flow="12"]><div class="sp-slab orange"><i data-lucide="cpu"></i><div class="sp-tag"><span class="lv">Silicon</span><h4>…</h4><p>…</p></div></div>… [<div class="sp-plane-tag">…</div>]</div>` | Isometric stack of slabs (**bottom → top**). They drop in, lock together, then spread apart. Billboard labels always face the camera. Optional glass **cutting plane** (`.sp-plane-tag` present) and records rising through the layers (`data-flow`). `data-orbit` swings the stack. Colours: default, `orange`, `blue`, `pink`, `glass`, `slate`. Add `.dense` for long product lists | Spread apart |
| `sp-runway` | `<div class="sp-runway" data-path="13,71,.03 87,40,-.27" [data-grow="1.25"] [data-tour]><div class="sp-step sp-card">…</div>…</div>` | Steps stand on a rising 3D path (screen x%, y% of the first and last node, then depth in widths). A light pulse runs the path and lights each node; `data-tour` makes the **camera itself** travel stop to stop, then pull back | All steps shown, path lit |
| `sp-chip` | `<div class="sp-chip" data-at="30,46" data-name="TRAINIUM4"></div>` | Product reveal: a lit CSS-3D chip dives out of the dark, flashes, then spins slowly with a specular sweep and rays | Landed |
| `sp-graph` | `<div class="sp-graph" data-hot="a b c \| a d e"><div class="sp-node" data-id="b" data-link="a" data-at="72,35" data-z="-.3" data-lv="1"><h4>…</h4><p>…</p></div>… <div class="sp-graph-cap" data-at="72,87"><p>…</p><p>…</p></div></div>` | Depth graph: nodes at screen anchors + depth, with 3D edges drawn level by level. `data-hot` sets cycle a highlight (other nodes dim), a pulse runs the hot chain, and captions swap per set. Node variants: `.accent`, `.small` | First hot set |
| `sp-tiers` | `<div class="sp-tiers" data-tray-x="31" data-row-x="52" data-y="39,81" data-pass=".55,.4"><div class="sp-tier bronze"><span class="tier">BRONZE</span><h4>…</h4><p>…</p></div>…</div>` | Tilted trays plus description rows. Records fall through, ripple on each tray, and fewer survive each tier (`bronze`, `silver`, `gold`, or set `--m1/--m2/--m3/--mc`) | Trays shown, no particles |
| `sp-rise` | `<div class="sp-rise" data-delay="1.3">…</div>` | A leaf that flies up out of the depth (sign-offs, takeaway chips) | In place |
| type | `.eyebrow` (Latin only) · `.sp-h1` · `.sp-h2` · `.grad` · `.sp-desc` · `.sp-chips > .sp-chip2` · `.sp-delta.up/.down` | Shared typography | — |

**Coordinates.** `data-at="x,y"` and `data-path` are **screen percentages of the landed view**. The
kit inverts the perspective, so an object at depth still lands where you asked. Depth (`data-z`,
`data-depth`, path z) is in **viewport widths**: negative is farther away, and bigger depth means
more parallax but smaller text.

**Extending.** `Spatial.component('name', { sel, build(el), layout(el, slide), reset(el), enter(el, ctx, slide), final(el) })`
must be called before boot. Drive visuals through CSS vars (`--e` for entry 0→1) and add a
`.slide.is-final .x { --e:1 !important }` rule. Other helpers: `Spatial.place(sx, sy, z)`
(screen px → slide-local 3D), `Spatial.strip(el, a, b)` (3D line), `Spatial.eTween(ctx, el, {delay, dur, ease})`,
`Spatial.camAdd` (in-slide camera offset), `Spatial.arrival()` (ms until the camera lands),
`Spatial.ease.*`. Deck hooks use the normal engine API: `Stage.hook(scene, {enter, final})`.

## 5. Composing NEW slides (don't copy the previews 1:1)

One focal 3D object per slide, the heading top-left (or a left column), and empty floor around it.
Signature moves by content type:

| Content | Spatial move |
|---|---|
| Cover / title | `sp-gate` (keynote) or `sp-cubes` (data) behind a centred `sp-h1`; `data-env="scroll:.05"` |
| Agenda / chapters | `sp-fan` of `sp-mono` (concave), 3–5 items |
| Architecture / layers | `sp-stack` (3–6 slabs, bottom = foundation) + `sp-plane-tag` for cross-cutting concerns (security, governance, observability). Make it the `data-fly="dive"` slide |
| Pipeline / steps / journey | `sp-runway` (4–6 steps); `data-tour` + `data-grow` for 3 big stations (migration, roadmap phases) |
| Comparison (2–4 options) | `sp-fan data-shape="convex" data-focus` with `sp-card` + `sp-meter`s; one shared insight pill under it |
| Metrics / benchmark | `sp-pillars` (3–5 bars; before/after = `ghost` + colour pairs with `data-x`, `.compact`). Remember the footnote for illustrative data |
| Hierarchy / tree / dependency / query plan | `sp-graph` with depth growing toward the viewer; `data-hot` to tell "what is touched" |
| Funnel / refinement / medallion / filtering | `sp-tiers` |
| Product reveal ("Announcing") | `sp-chip` (or a stack / gate) on the left, name + 3 specs on the right; `data-fly="dive"` |
| Quote / closing | centred quote (`data-split="words"`), `.grad` run kept whole, `sp-rise` sign-off; `data-env="scroll:.16 warp:.55"` |
| Image / screenshot | a `.L` leaf holding an `<img>` in an `sp-card` at `--z:0` (lightbox works); tilt slightly with deck CSS on a wrapper `.d3` if you want depth |
| Table | keep it 2D: an `sp-card` leaf with a simple grid. 3D adds nothing to tables |

Don'ts: more than one 3D component per slide; 3D on every word; text at large depth (it shrinks and
blurs); a `data-fly="dive"` on more than one slide; heavy grid backgrounds inside cards (the floor is
already the pattern); emoji; solid left-border rails.

## 6. CJK (Chinese) notes

- Fonts fall back to **Noto Sans SC** in both stacks. Set `<html lang="zh-CN">`; `:lang(zh)` gives
  `.sp-h1` and `.sp-h2` line-height 1.24 and zero tracking.
- Never put Chinese in `.eyebrow` (wide tracking); keep eyebrows Latin ("REFERENCE ARCHITECTURE").
- Use `data-split="chars"` for plain Chinese headlines. Break long headlines yourself with `<br>`
  before the gradient half. Check at 1280×640 that no line ends with an orphan single character.
- Product names stay in English inside Chinese text, separated by `·`.

## 7. Performance

- One shared loop (`Stage.raf`, paused when the tab is hidden) drives the flight, tilt, panel
  fades, the floor (14 batched strokes) and dust (≤220 points). DPR is capped at 2. Component
  loops use `ctx.raf` and stop on leave.
- Off-screen panels get `visibility:hidden`. Reduced motion means no flights (instant snap), the
  loop stops when idle, and only the current panel is visible.
- Keep each deck at 14 panels or fewer, and one particle-type component (`data-flow`, `sp-tiers`) per slide.

## 8. Gotchas (all hit while building this)

- `body data-stage="free"` is mandatory; never set position/transform on `.slide` (the kit owns them).
- **Print fragmentation:** in Chrome's PDF output, any element whose *untransformed* layout box extends
  below the slide's bottom edge is clipped at that edge, even if a transform brings it back. Keep
  layout boxes inside the slide (the kit's components do this already). Custom 3D objects should
  be sized at screen size and scaled up, the way `sp-gate` does it.
- Chrome's PDF drops CSS `mask`s. The kit swaps in print fallbacks (gate ring = border; rays and glows
  hidden; fan cards printed flat at their projected positions).
- Kit position vars are `--tx/--ty/--tz`; `--z` is reserved for leaf depth (registered, non-inheriting).
  Don't name your vars `--e`, `--fade`, `--fr` or `--o` either, since the kit owns them.
- The engine's split class is `.sp`, so never name a deck class `.sp`.
- Don't mutate DOM inside editable elements (h1–h4, p, li) from hooks: the editor would see it as an edit.
- Gradient text in PDFs may show faint hairline boxes (a Chrome PDF artefact, see ENGINE.md).
