# re:Invent Design System

The skill has **one theme, re:Invent**, available in **three visual flavors**. The flavor decides the motion language
and the persistent background motif. Everything in this file (brand, type, composition, motion rules) applies to all
three flavors.

**Read this file at Step 5, together with `engine/ENGINE.md` and the chosen flavor's `flavors/<name>/README.md`.**

> **Templates are references, not molds.** The six preview decks show what each flavor looks like on two very
> different topics. Lift their engine, kit, components and code patterns freely, but **compose every slide for the
> user's actual content**. Never re-skin a preview by swapping text into its slots. If the content is an architecture,
> draw the architecture. If it's a migration, make it a journey. If it's one number, make that number the whole slide.

---

## 1. The three flavors

| # | Flavor | Motif (persistent across the deck) | Signature moves | Shines for |
|---|---|---|---|---|
| 1 | **Aurora** | WebGL silk light ribbons (purple → magenta → AWS orange) that re-compose per slide | glass panels over the ribbons, border-beam focal card, cursor spotlight, the ribbon field reacting to the story (shatter → heal, converge → flare) | executive / strategy / vision talks, customer pitches. Premium and restrained |
| 2 | **Spatial** | one CSS-3D world with a perspective grid floor and glowing horizon. Changing slides = a camera flight | depth-layered panels, 3D pillars rising from the floor, exploded layer stacks, a camera that travels along a path | architecture deep-dives, layered platforms, migrations and roadmaps. The most kinetic |
| 3 | **Pulse** | a lit dotted globe that docks to a new position on each slide, plus beams with travelling light | data packets flowing through pipelines, live tickers and sparklines, region dots lighting up, service graphs with pulsing beams | data / streaming / infrastructure / global-scale stories. The most "AWS" |

Preview decks (`preview/`), two per flavor, so users can see range:

| Flavor | Keynote deck (EN, product launch) | Solution deck (中文, big-data) |
|---|---|---|
| 1 · Aurora | `1-aurora-keynote.html` | `1-aurora-bigdata.html` (现代数据平台战略) |
| 2 · Spatial | `2-spatial-keynote.html` | `2-spatial-bigdata.html` (Lakehouse 架构深潜) |
| 3 · Pulse | `3-pulse-keynote.html` | `3-pulse-bigdata.html` (实时流式分析) |

---

## 2. Brand

**Palette.** The flavor kit's CSS defines the tokens; don't redefine them. The values below are for reference.

| Role | Value | Use |
|---|---|---|
| Stage black | `#0A0A0A` · deep `#0B0015` | backgrounds. Never pure `#000` with grey cards |
| Purple | `#8B5CF6` | primary accent, focal glow |
| Pink / magenta | `#D946EF` | secondary accent, gradient end |
| Blue | `#3B82F6` / `#38BDF8` | tertiary, cool data |
| AWS orange | `#FF9900` | **sparingly**: the one "new" thing, the final step, a launch tag. Never a dominant fill |
| Up / warn / down | `#34D399` / `#FBBF24` / `#F472B6` | delta semantics only |
| Text | `#FFF` · `rgba(255,255,255,.55)` · `rgba(255,255,255,.38)` | primary · secondary · faint |
| Gradient | `linear-gradient(135deg,#a78bfa,#e879f9,#f472b6)` | **one** gradient word or phrase per slide, used as the focal point |

Chart / data-viz series order: `#8B5CF6, #D946EF, #FF9900, #38BDF8, #34D399, #F472B6`. Grid lines
`rgba(139,92,246,.08)`, tick text `rgba(255,255,255,.4)`.

**Typography.** Urbanist (display) + Albert Sans (body) + Noto Sans SC (CJK fallback for both):

```html
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600;700&family=Urbanist:wght@400;500;600;700;800;900&family=Noto+Sans+SC:wght@400;500;700;900&display=swap" rel="stylesheet">
```
```css
--font-display: 'Urbanist', 'Noto Sans SC', sans-serif;
--font-body: 'Albert Sans', 'Noto Sans SC', sans-serif;
```

- All sizes use `clamp()`. Display headlines are big (`clamp(2.4rem, 7vw, 6rem)` and up for hero moments) with tight
  tracking (`-0.02em`).
- Use wide letter-spacing (`.2em`–`.35em`) only on **small Latin uppercase eyebrows** ("AWS RE:INVENT 2026 · KEY METRICS").
- **CJK rules.** Letter-spacing is 0. Headings get line-height 1.2–1.3 and body text 1.6–1.7. Never let a line end with
  a single orphaned character: hand-break with `<br>` or shorten the copy, and check at 1280×640. Never stack a
  headline one character per line, except for intentional vertical labels (`writing-mode: vertical-rl`). Keep AWS
  product names in English.

**Mandatory chrome on every slide:**
- the footer `© 2026, Amazon Web Services, Inc. or its affiliates. All rights reserved.`
- a page indicator, either `.page-number` or the kit's `.slide-index`
- a small eyebrow that gives the deck context

Illustrative numbers need a tiny footnote: `示例数据，仅供演示` / `Illustrative data`.

**Icons.** Lucide only (`<i data-lucide="…">`, CDN `https://unpkg.com/lucide@latest/dist/umd/lucide.min.js`, call
`lucide.createIcons()` once before the engine boots). **Never emoji.** Draw icons with a 1.5 stroke.

---

## 3. Composition — designing slides for the content

Every slide is a **designed moment** with **one focal point**. Before writing markup, decide for each slide:

1. **What should the audience remember?** That is the focal element, and it gets the scale, the gradient or the light.
2. **What shape does the content have?** A number, a flow, a hierarchy, a comparison, a change over time, a map, a
   quote, a list of peers. Pick a composition that *shows* that shape.
3. **Which beat comes first, second, third?** Plan the entrance choreography, i.e. the order the eye should follow.

**Composition vocabulary** (starting points; mix, invert and reinvent them):

| Content shape | Strong compositions |
|---|---|
| One headline number | The number fills the slide (`clamp(6rem, 18vw, 14rem)`) and counts up. One supporting line plus a contextual visual: a race bar, a collapsing timeline, a lit region map |
| 3–5 metrics | A hero metric plus a supporting rail; each metric with its own micro-visual (sparkline, bar, ring, dot grid); 3D pillars; an odometer row |
| Flow / pipeline / process | A path with a travelling light or packet that activates each stage as it passes; stages placed on a curve or a rising 3D path rather than an even row |
| Architecture / layers | An exploded 3D stack, a service graph with pulsing beams, a hub-and-spoke, a cross-cutting plane for governance or security |
| Before → after / migration | A split that *transforms* (a light seam sweeps and heals the left into the right); a journey with stations; struck-out pain → resolved card |
| Comparison of options | Columns that take turns in the spotlight; capability bars; "when to use which" chips; never two identical boxes |
| Timeline / roadmap | A moving "Day N" playhead that drives phase bars; a camera that travels the milestones; a zigzag with a glowing spine |
| Peers / capabilities | A bento grid with one hero cell; columns that expand one at a time; an orbit around a core; a marquee for long catalogs |
| Agenda / chapters | Big outlined numbers on cards placed in depth; rows with an "up next" glass focus; a chapter tag that persists in later headers |
| Product reveal | Darken → light event (converge, flare, sweep) → the name resolves → specs land one by one. One per deck |
| Quote | Large type, generous space; types in or reveals word by word; attribution small |
| Chart / table / diagram | Animate the data in on entry (draw lines, grow bars, fill rows); keep it the focal point; use the native SVG diagrams (`diagram-reference.md`) |
| Screenshot / image | A device or glass frame with depth, a slight tilt, and a callout or two pointing at what matters. Click to zoom (lightbox) |
| Closing / CTA | Echo the cover motif; one line ("Now go build." / 「让数据成为…」); optional CTA chip |

**Rhythm across the deck:**
- Never three consecutive slides with the same composition, and never a run of "title + card grid".
- Alternate dense and airy slides. Give each section a breathing slide (a big number, a quote, a divider).
- Plan **1–2 signature moments** per deck (a reveal, a transformation, a heal, a countdown) and make them unmistakable.
- The motif must react to the story (brighter on the cover and the reveal, pushed to an edge and dimmed on dense
  slides), so the deck feels like one continuous piece.

**Density limits** (split the slide if exceeded): a title slide has a heading, a subtitle and a tagline. A content
slide has a heading plus 4–6 short items, or 2 short paragraphs. A grid has at most 6 cells. Code is limited to 8–10
lines; charts to 1–2 (each at most 50vh); tables to 6 rows; diagrams to 1 (at most 60vh). Copy per card is ≤ 2 short
lines. **Never use plain bullet lists.**

---

## 4. Motion language

- **Choreograph, don't flood.** Entrances run in beats, 80–150ms apart: the focal element first (or last, when it's a
  reveal), then the support, then the details. Heavy elements ease out (`cubic-bezier(.16,1,.3,1)`), with 500–900ms
  per element. The whole intro settles within ~2.5s (a signature moment may take ~4s).
- **Motion directs the eye.** A travelling light shows the order of a flow, a spotlight picks the current item, a
  count-up gives a number weight. Decorative motion stays slow and ambient (the motif, a drift, a shimmer).
- **Replay on entry.** Each intro must replay every time the presenter enters the slide. The engine handles this for
  `rv*` reveals and hooks.
- **Final state.** Every animated element must look complete under `.slide.is-final` (reduced motion, overview, print,
  editor). See `engine/ENGINE.md`.
- **Performance.** Only the active slide's loops run (`ctx.raf`), DPR is capped at 2, loops pause on a hidden tab, and
  WebGL needs a CSS fallback.
- **Avoid:** everything animating at once, bouncy or elastic eases on text, constantly spinning text, blinking,
  parallax so strong that text blurs, motion with no meaning on every element.

---

## 5. Do not (the "AI slop" list)

- **Generic fonts.** Inter, Roboto, Arial or system fonts as display. Emoji as icons.
- **Lazy layouts.** Identical card grids on slide after slide; "icon tile + title + desc" as the default answer;
  everything centered; plain bullet lists.
- **Card clichés.** A **solid colored `border-left: 3px` rail** on a filled rounded card (the #1 dashboard tell).
  Carry color with an inline icon, a short underline tick, an outlined index or a hairline instead.
- **Gradient overuse.** Gradient on everything (one focal gradient per slide); orange as a dominant fill.
- **Decoration without purpose.** Glassmorphism on every element, drop shadows with no light logic, realistic
  illustrations or stock imagery as decoration.
- **Scrolling.** Anything that scrolls inside a slide. Content that overflows 100vh.

---

## 6. CSS gotchas

- **Negating CSS functions:** `-clamp(...)`, `-min(...)` and `-max(...)` are silently dropped. Use `calc(-1 * clamp(...))`.
- **Canvas sizing:** a `<canvas>` is a replaced element, so `inset:0` does not size it. Add `width:100%; height:100%`.
- **Gradient text:** `background-clip:text` runs must not be split across per-character spans, or the clip breaks.
  Reveal them as one unit (`rv-mask`). The engine's splitter already refuses to split them.
- **preserve-3d flattening:** `opacity`, `filter`, `overflow`, `clip-path`, `mask` or `mix-blend-mode` on a
  `preserve-3d` element flattens its children. Put those properties on the leaves.
- **Print:** scope viewport-shape media queries to `@media screen and (...)`; Chrome evaluates them against the
  paper size in print.
- **Reserved prefixes:** never author classes starting with `is-` or `stage-`. They are engine-owned and the editor
  strips them on save.

---

## 7. Self-QA before delivery (mandatory)

Run `scripts/qa-shots.py` (see SKILL.md Step 5). Then **look at every screenshot as an art director would**:

- [ ] Every slide fits at 1600×900 and 1280×640. Nothing is clipped or overflowing, and the script reports no overflow.
- [ ] No console errors.
- [ ] Each slide has an obvious focal point. Consecutive slides use different compositions.
- [ ] 3D reads as lit 3D: light gradients across surfaces, rim glow, depth. A flat polygon fails.
- [ ] Motion on every slide. The signature moment lands. Intros replay on revisit.
- [ ] CJK: no orphans, no wide tracking. Product names stay in English.
- [ ] Overview thumbnails (press `O`) are complete, not blank.
- [ ] Footer disclaimer and page indicator are on every slide.
