# Stage Engine — generator reference

One engine for every re:Invent v2 flavor (Aurora, Spatial, Pulse). The engine handles the stage:
stacked slides, navigation, transitions, reveal replay, hooks, overview, lightbox, print, and reduced motion.
The flavor adds only its **motif** (the persistent background layer) and **hooks** (per-slide choreography).
It replaces the scroll-snap + IntersectionObserver base (`viewport-base.css`).

| File | How it goes into a deck |
|---|---|
| `stage-engine.css` | Paste verbatim into `<style>`, **before** the theme CSS |
| `stage-engine.js` | Paste verbatim into a `<script>` at the **end of `<body>`** (after all slides and hook scripts) |
| `inline-editor.css` / `inline-editor.js` | **Only if the user opted in to editing.** CSS goes after the engine CSS. JS goes right after the engine JS |
| `example.html` | Test bed that exercises every API. It links the files instead of inlining them |

Everything is plain ES5/ES2015 with no dependencies. The engine creates the Overview and Lightbox DOM itself, so you
don't write any HTML for them.

## 1. Minimal deck skeleton

```html
<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Deck</title>
<style>
/* ---- PASTE stage-engine.css HERE ---- */
:root { --bg:#0A0A0A; --accent:#8B5CF6; --u: min(1vw, 1.7778vh); }      /* theme */
.slide { display:flex; align-items:center; justify-content:center; }      /* layout only, no positioning */
</style></head>
<body>
<canvas id="motif" class="stage-bg"></canvas>          <!-- persistent layer (optional) -->
<div class="progress-bar"></div><nav class="nav-dots"></nav><div class="page-number"></div>

<section class="slide" data-scene="cover" data-label="Opening" data-thumb="radial-gradient(...), #0B0015">
  <h1 data-split="words" style="--d:1">Building the Future with <span class="grad">Generative AI</span></h1>
  <p class="rv-blur" style="--d:5">The platform, the silicon, and the agents.</p>
</section>
<script>(window.STAGE_HOOKS = window.STAGE_HOOKS || []).push(['cover', {
  async enter(slide, ctx) { await ctx.wait(400); ctx.raf((now, dt, t) => { /* loop while on this slide */ }); },
  final(slide) { /* JS-driven end state; also runs on overview clones and in print */ }
}]);</script>

<section class="slide" data-scene="metrics" data-label="Key Metrics">
  <h2 class="rv">Key Metrics</h2>
  <div class="rv-scale" style="--d:2"><span class="count" data-count="100">100</span>K+</div>
</section>

<script>/* ---- PASTE stage-engine.js HERE ---- */</script>
<script>/* flavor glue: Stage.onChange(...) for the motif, optional Stage.setTransition(...) */</script>
</body></html>
```

## 2. Authoring contract

**Slides.** Write `<section class="slide">` elements as direct children of `<body>`. One wrapper element is also
allowed, but in that case the wrapper must not set a transform. In default mode the engine CSS makes every slide
`position:fixed; inset:0; 100vw × 100dvh; overflow:hidden` and hides all of them except the current one.
**Never set `position`, `visibility`, `opacity`, `transform` or `z-index` on `.slide` yourself.** Layout properties
such as `display`, `padding` and `background` are fine.

| Attribute | Meaning |
|---|---|
| `data-scene="key"` | Hook key. Several slides may share one key; the hook then runs for each of them |
| `data-label="…"` | Name used in the overview, nav-dot aria labels and `[data-stage-label]` |
| `data-thumb="<css background>"` | What sits *behind* this slide (the motif). Used for overview cards and print pages |
| `data-transition="…"` | Free-form value that a custom transition can read |

**State classes** (engine-owned; read them in CSS, never toggle them yourself):
- `.is-active`: the current slide. Its reveals play.
- `.is-entering`: the incoming slide during a custom transition, before `t.enter()` is called. It is visible but its reveals have not started.
- `.is-leaving`: the outgoing slide. Its reveals stay shown while it fades out.
- `.is-final`: the slide is in its finished state.
- `body[data-dir="fwd|back"]`: direction of the last move.
- `body.stage-busy`: a transition is running.
- `body.stage-frozen`: the editor is active.
- `html.stage-reduced`: reduced motion is on.

**Reveals** are CSS only and replay on every entry. Delay = `--rv-base` (180ms) + `--d` × `--rv-step` (90ms).

| Class | Effect |
|---|---|
| `rv` | Rise + fade |
| `rv-left` | Slide in from the left |
| `rv-blur` | Focus-in |
| `rv-scale` | Pop |
| `rv-mask` | Clip-path wipe. **Use this for gradient text** |
| `[data-split="words\|chars"]` | Auto-split on entry into `.sp` pieces with `--i`, staggered by `--split-step` |

The splitter refuses to split gradient-clipped (`background-clip:text`) runs; each such run stays one `.sp-unit`.
CJK (Han, kana, Hangul) is cut per ideograph. Words mode uses `Intl.Segmenter` and falls back to per-char. Closing
punctuation sticks to the previous piece and opening brackets to the next, so CJK wraps normally and no line starts
with `，。」`. Mixed runs such as "用 AWS 构建" are supported.
To use your own reveal style, key it on `:is(.is-active,.is-leaving) .x` and give it a final state (see below).
You can re-time a whole deck with the CSS variables, for example `:root{--rv-step:1s}` makes `--d` count in seconds.

**Counters.** Use `<span class="count" data-count="40" data-decimals="0" data-delay=".2" data-dur="1.6" data-sep>40</span>`.
The **HTML text must already be the final value.** `data-ease="linear"` keeps a counter in sync with a linear CSS animation; the default is ease-out. The engine counts up from `data-from` (default 0) on every
entry and shows the final value immediately in reduced motion, the editor, the overview and print.

**Chrome** (each one is optional and auto-filled):
- `.progress-bar`: the engine sets `--stage-progress` from 0 to 1.
- `.page-number`: shows `N / total`.
- `.nav-dots`: the engine generates clickable buttons that get `.on` and `.done`.
- `.slide-index`: shows `NN / NN`. Inside a slide it shows that slide's own number; outside, the current one.
- `[data-stage-label]`: shows the current slide's `data-label`.

**Persistent layers.** Put fixed canvases and globes outside the slides and give them `class="stage-bg"`. They are
hidden in print. Drive them from `Stage.onChange`.

**FINAL-STATE RULE (mandatory).** Every component must look finished under `.slide.is-final`. The engine applies
`.is-final` in four cases: reduced motion (every slide), overview thumbnails (on clones), print (every slide), and
the current slide while editing. Under `.is-final`:
- Transitions are zeroed and keyframe animations jump to their last frame on screen. Print can restart them at
  t=0, so give important end states explicit `.is-final` rules.
- `rv*` and `.sp` are forced visible.

If an animation's last frame is not its rest state, add `.slide.is-final .x { … }`. For JS-driven state (SVG
strokes, canvas, classes that hooks add), implement `final(slide)`.

## 3. API: `window.Stage`

| Member | Description |
|---|---|
| `go(n[, {instant, force}])`, `next()`, `prev()` | Navigate (0-based). `#N` in the URL is 1-based |
| `index`, `count`, `slides`, `current`, `busy`, `reduced`, `frozen` | Read-only state |
| `hook(key, {enter, leave, final})` | Register a hook. Same effect as pushing `[key, hooks]` onto `window.STAGE_HOOKS`, which also works **before** the engine has loaded |
| `onChange(fn(to, from, dir, toSlide))` | Fires at the *start* of each move, so the motif re-composes during the transition. Also fires once on boot with `from = -1`. `dir` is `'fwd'` or `'back'` |
| `setTransition(fn(from, to, t))` / `dissolve` | Replace the default transition. `Stage.dissolve` is the default, so you can fall back to it |
| `raf(fn(now, dt)) → stop` | A global loop on the shared rAF. Paused while the tab is hidden. Return `false` to stop |
| `waitFor(promise)` | Delay boot until the promise settles (capped at 2.5s). Example: `Stage.waitFor(document.fonts.ready)` |
| `freeze()` / `thaw()` | Editor mode: final state, split text restored, input off. `thaw()` replays the slide |
| `overview.open/close/toggle/isOpen`, `lightbox.open(src, alt)/close/isOpen` | Overlays |
| `fx.split(el, mode)`, `fx.unsplit(el)`, `fx.unsplitAll() → [{el, mode}]`, `fx.countUp(root, ctx)`, `fx.finalize(slide)`, `fx.easeOut` | Helpers |
| `opts` | `{keys, wheel, touch, hash, clickToAdvance:false}`. Mutable at runtime |

**The hook `ctx`.** A fresh `ctx` is created for every entry. Everything it starts is stopped when the user leaves
the slide.
- `index`, `prev`, `dir`, `reduced`, `frozen`: navigation state.
- `alive()`: becomes false once the user has navigated away.
- `await wait(ms)`: resolves only while the slide is alive. If the user has left, it never resolves, so the rest of an
  async choreography silently stops. No checks needed.
- `raf(fn(now, dt, elapsed))`: a per-slide loop that is stopped automatically on leave.
- `tween({from, to, dur, delay, ease, on(v, p)}) → Promise`
- `on(target, type, fn)`: an event listener that is removed automatically.
- `cleanup(fn)`: runs `fn` when the user leaves or the transition is interrupted. Use it to kill GSAP timelines and WAAPI animations.

`leave(slide, ctx)` gets its own `ctx`, which stays alive until the transition settles. `final(slide, {index, clone})`
must touch **only descendants of `slide`**, because it also receives overview clones.

**Transitions.** The default is a direction-aware cross-dissolve with depth: the outgoing slide blurs and scales back,
the incoming one scales in slightly. It lasts `--stage-dur` (700ms), and incoming reveals start straight away so they
overlap the dissolve. For a custom transition, `t` provides:
- `from`, `to`, `index`, `prev`, `dir`, `duration`
- `alive()`, `wait`, `raf`, `tween`, `cleanup`
- **`enter()`**: starts the incoming reveals and hooks. Call it whenever the transition should "land". If you never
  call it, the engine calls it when your promise resolves.

Return a promise. If the user presses keys again mid-transition, the engine kills `t`, runs your `cleanup`s, sweeps
every state class off the slides, and starts the next transition **from the current visual state**. Read live values
such as camera position; don't assume the previous transition finished.

**Input.**
- Next: → ↓ Space PageDown. Previous: ← ↑ PageUp Shift+Space. Home / End.
- Wheel: one slide per gesture. A trackpad inertia tail counts as the same gesture. Elements that actually scroll
  keep the wheel.
- Touch swipe (45px or more).
- Hash: `#N` is read on load and on `hashchange`; the engine writes it back with `replaceState`.
- `O` toggles the overview.
- **Esc priority:** lightbox, then overview (if open), then editor (exits), then opens the overview.
- All handlers ignore inputs and contenteditable, keys with Cmd/Ctrl/Alt held, open overlays, and editor mode.

**Overview.**
- Cards are clones of the live slides with `.is-active.is-final`, scripts and contenteditable removed, canvases
  rasterized, and each hook's `final()` applied.
- The card background comes from `data-thumb`. Otherwise it uses `--stage-thumb-bg`, a deck-wide fallback gradient
  you can set in `:root`.
- Keys: arrows, Enter, Home / End. Click a card to jump.

**Lightbox.** Clicking `img[data-zoom]` opens it; `data-zoom="hi-res.png"` is optional. Any other `.slide img` opens it
too unless it is inside `[data-no-zoom]`.

**Print / PDF.** "Print → Save as PDF" gives one 1600×900 (16:9) page per slide, static and in final state:
- On `beforeprint` the engine unsplits text and calls `final()` on every slide.
- Elements with `.stage-bg`, the chrome and the overlays are hidden.
- `data-thumb` paints each page's background.

**Reduced motion.** Every slide is `.is-final` and slides switch instantly. Hooks get `enter()` with
`ctx.reduced = true`, **not** `final()`, so `enter` must skip the choreography and set the end state itself.

## 4. Editor (opt-in): `inline-editor.js`

- **Entering and leaving edit mode.** You get in four ways: press `E`, hover the top-left hotzone (the toggle stays
  for a 400ms grace period, never a CSS `~` chain), click the toggle, or click the hotzone. `Esc` saves to
  localStorage and exits. `Ctrl/Cmd+S` writes the file.
- **What's editable.** These elements inside `.slide`: `h1–h4, p, li, span.edit, [data-edit]`. Only the top-most
  match is editable. Skip a subtree with `[data-no-edit]`.
- **While editing.**
  - `Stage.freeze()` puts the current slide in final state and restores split text.
  - Keys belong to the cursor.
  - A bottom bar provides ← → Overview Done; slide changes made this way are instant and final.
- **Save to file.** Uses `showOpenFilePicker` (never `showSaveFilePicker`). The handle is stored in IndexedDB,
  keyed per path.
  - The file is read before `createWritable()`. Saving aborts if the file is under 50 chars or has no `.slide`.
  - The editor parses the file with DOMParser and patches **only elements the user changed**.
  - Each patch target is verified by its original text; mismatches are skipped and reported in the toast.
  - The written HTML is clean. It is stripped of split spans, `is-*` and `stage-*` classes, `contenteditable` and
    `spellcheck`, and rendered Lucide SVGs are turned back into `<i data-lucide>`.
- **Indexing.** Elements are indexed when `inline-editor.js` runs, which is before boot. So hook scripts placed next
  to sections **must not mutate the DOM at parse time**. Do DOM work in `enter`, `init`, or after boot.

## 5. Porting a hand-rolled deck

General steps:
1. Delete the deck's controller: `go`, keys, wheel, touch, hash, progress, the `.active`/`.play` toggles, the
   `RM` checks that only switch timing, and the "stage engine" CSS block.
2. Paste the engine CSS/JS.
3. Move the per-slide enter / leave / tick code into `Stage.hook(scene, …)`:
   - `tick` becomes `ctx.raf`.
   - `setTimeout` becomes `await ctx.wait`.
   - Token checks become `ctx.alive()`.
4. Move the motif re-compose into `Stage.onChange`.
5. Add `final()` for every JS-driven state.
6. Add `.slide.is-final` rules for CSS-animated state.

**A · Aurora** (`data-scene` already present; the slides sit inside `<main id="deck">`, which is fine):
- Rename `.play .rv` to the engine's state:
  - Keep its `.rv`, `.rv-blur` and `.hl` look by keying them on `:is(.is-active,.is-leaving)`, or switch to the
    engine's `rv*` classes.
  - Its `--d` counts in seconds: set `:root{--rv-step:1s; --rv-base:.32s}`.
- Drop its `[data-split]` splitter in favor of the engine's `data-split`. The `.split-words .w > .wi` mask variant
  becomes custom CSS on `.sp`.
- Replace `.gw` with `rv-mask`.
- `setScene(name)` → `Stage.onChange((i, f, d, s) => setScene(s.dataset.scene))`.
- WebGL start/stop: keep its own rAF, or use `Stage.raf`.
- The announce `burst` timeout becomes `await ctx.wait(1350); burst = 1`.
- `data-count` → `.count[data-count]` with the final value as the text.
- Give each slide a `data-thumb` that approximates the ribbon glow.

**C · Spatial** (camera flight):
- Put `<body data-stage="free">` and rename `.panel` to `.slide`. Free mode stops the engine from positioning or
  hiding slides, so `#world` and preserve-3d still work. The engine marks the wrappers as `.stage-root` so print can
  flatten them.
- Its `go()` flight becomes `Stage.setTransition((from, to, t) => new Promise(res => startFlight(t.index, { onLand: t.enter, onDone: res })))`:
  - Start each flight from the *current* `cam`.
  - If `!t.alive()`, stop advancing that flight.
  - The first fly-in stays the boot "establishing shot" in `onChange(i, -1)`.
- Module `reset()` + `enter()` become a hook's `enter`, with `tween({tag})` replaced by `ctx.tween`.
- `.on` → `.is-active`. `.r` → `rv*`.
- `splitWords` → `data-split`. Keep `.grad` words as a separate span; they stay one unit.
- Keep the per-frame `--fade` loop as `Stage.raf`.
- `final(slide)` must set `--fade:1`, `--fr:1`, and the pillar heights / runway fill **inside `slide`**. The
  per-slide `S[i]` closures hold live elements, so query through `slide`, because it also receives overview clones.
- Use `Stage.waitFor(document.fonts.ready)` instead of its own boot race.

**D · Pulse** (`data-globe` → `data-scene`):
- `.active`, `.leaving` and `.in` become the engine classes. Delete its `.slide` transition CSS, since the default
  dissolve is equivalent.
- `.in .rv { animation… }` rules: key them on `.is-active`. Their final state is automatic: `.is-final` jumps
  animations to their last frame.
- `HOOKS[i] = { enter(t), tick(t), leave }`:
  - `enter` becomes `hook(scene, { enter(s, ctx) { ctx.raf((now, dt, ms) => tick(ms / 1000)) } })`.
  - Pass `tau` as `ms / 1000`.
- The globe docking (`setGlobe(slide)`) moves into `onChange`.
- `counters()` → `.count`, keeping `data-suffix` as a sibling span.
- For a `final()` state that needs the globe: the globe isn't inside the slide, so set `data-thumb` instead.

## 6. Gotchas

- **Print media queries.** Chrome evaluates `aspect-ratio`, `width` and `height` media queries in print against the
  printer's default paper, not against `@page`. Scope viewport-shape queries as `@media screen and (...)`, or print
  will reflow. `vw` and `vh` usually match 1600×900, but see the next bullet.
- **Print clipping.** Chrome's PDF fragmentation clips any element whose *untransformed* layout box extends past the
  slide's bottom edge, even if a transform moves it back on-page. Keep components' layout boxes inside the slide.
- **Print units.** Chrome's PDF pass can lay out `vw`-based units at a different scale than emulated print.
  Pin root size units under `@media print`, e.g. `:root{--u:16px}`.
- **Print centering.** The PDF fragmenter places absolutely positioned boxes by their pre-transform position, so
  `top:50%` + `translateY(-50%)` can spill onto the next page. Center with a full-height flex column instead.
- **Print canvases.** A canvas with additive glow (`lighter`) prints as a solid white rectangle. Hide it in print
  (`.stage-bg` or `@media print`) and use `data-thumb`.
- **Print masks.** `mask-composite` is ignored in PDF, so border-beam effects need an `@media print` fallback such
  as a plain border.
- **Print active state.** Only the current slide is `.is-active` in print. Rules keyed on
  `:is(.is-active,.is-leaving)` need explicit `.slide.is-final` end states, or other pages print their start state.
- **Print page shrink.** A `filter`ed layer that extends off-page can make Chrome shrink every PDF page (~84%).
  Hide such layers in print.
- **PDF seams.** Some PDF rasterizers (seen with poppler) draw faint hairlines around `background-clip:text` runs.
  This comes from Chrome's PDF output and can't be fixed from CSS.
- **Use `Stage.slides`.** Clones in the overview keep the `slide` class, so use `Stage.slides` rather than
  `querySelectorAll('.slide')`.
- **SVG ids in clones.** Overview clones duplicate every `id`, so `url(#clip)` / `url(#grad)` inside a clone can resolve to
  the *live* slide's element (e.g. a zero-width animated clip) and render blank. Give SVG defs per-build unique ids and
  rebuild them inside the given slide in `final()`.
- **Canvas sizing.** A `<canvas>` needs explicit `width:100%;height:100%`; `inset:0` doesn't size a replaced element.
- **WebGL in thumbnails.** WebGL canvases inside a slide rasterize blank in the overview unless they were created
  with `preserveDrawingBuffer`. Prefer `data-thumb`.
- **No opacity/filter on 3D containers.** Don't put `opacity`, `filter` or `overflow` on preserve-3d containers in
  free mode; it flattens them. Fade the leaves instead.
- **Prefixes `is-` and `stage-` are reserved.** The editor strips those classes before writing, so don't use them
  for authored static classes.
