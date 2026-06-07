# Diagram Reference (draw.io)

Integration patterns for rendering rich diagrams — flowcharts, AWS architecture, sequence/UML/ER, network topology, mind maps — inside slides. Read this file when generating slides that contain `### diagram` blocks in content.md.

Diagrams are produced by the **[drawio-skill](https://github.com/Agents365-ai/drawio-skill)**, which generates `.drawio` XML and exports a high-resolution **PNG** that gets bundled into the presentation's `assets/` folder and embedded like any other image (lightbox included).

The slides skill never hand-draws diagram geometry itself — it hands the description to drawio-skill, then embeds the export. This keeps the presentation zero-dependency (the final HTML references a static `assets/*.png`, no runtime library).

---

## Parsing content.md `### diagram` Blocks

A diagram block looks like this:

```
### diagram
type: aws
caption: Serverless image pipeline
Users upload images to an S3 bucket.
The upload event triggers a Lambda function.
Lambda calls Amazon Rekognition for labels, then writes results to DynamoDB.
CloudFront serves the processed images back to users.
```

**Parsing rules:**

1. `type:` (optional, default `flowchart`) → selects the drawio diagram-type preset. One of:
   `flowchart` | `aws` (or `architecture`) | `sequence` | `class` (UML) | `er` | `network` | `mindmap`
2. `caption:` (optional) → a single line rendered under the diagram as a muted caption. Not passed to drawio.
3. `title:` (optional) → diagram title drawn inside the diagram by drawio. If absent, use the slide heading.
4. Every remaining non-empty line → the **description** passed to drawio-skill. Lines may be prose, or an arrow flow (`A -> B -> C`), or a bullet list of components and relationships. Concatenate them in order into one natural-language brief.

**Validation (Step 4 content review):**
- `type` (if present) must be one of the values above — otherwise warn and fall back to `flowchart`.
- The description (lines after the directives) must be non-empty — a diagram block with only a `type:` is an empty diagram; flag it.
- Note in the review summary that diagram blocks require the **draw.io desktop CLI** (`drawio`) to export. If unavailable, the fallback chain below applies — surface this to the user during review so they aren't surprised.

---

## Generation Workflow (per diagram block)

For each `### diagram` block, while generating the presentation:

1. **Resolve the brief** — combine `title` (or slide heading) + the description lines into one prompt for drawio-skill. Append the theme styling instruction from "Theme Adaptation" below.
2. **Invoke drawio-skill** — produce a `.drawio` file, then export **PNG** into the presentation's `assets/` directory:
   - File names: `assets/diagram-1.drawio` (source) and `assets/diagram-1.png` (export). Increment the number per diagram across the whole deck.
   - Export command (substitute the binary name resolved by drawio-skill — usually `drawio`):
     ```bash
     drawio -x -f png -s 2 -t -o my-presentation/assets/diagram-1.png my-presentation/assets/diagram-1.drawio
     ```
   - Flags: `-s 2` renders at 2x for crisp text; `-t` gives a **transparent background** so the slide background shows through. **Do NOT pass `-e`** for the slide export — beyond not needing editability in the deck, draw.io's `-e` PNG output truncates the IEND chunk and produces a corrupt file (drawio-skill issue #8). The editable `.drawio` source is kept alongside the PNG.
   - Keep the rendered width reasonable (a medium diagram at `-s 2` stays well under any size limit). For a very large diagram, cap with `--width 2400` instead of `-s 2`.
3. **Embed** the PNG in the slide (see "Slide Embedding" below).
4. **Theme-match** the diagram colors to the chosen style preset before exporting (see "Theme Adaptation").
5. Let drawio-skill run its own self-check / layout validation. Do not re-export per slide more than needed.

> **Do not** inline a runtime draw.io library or a diagrams.net `<iframe>` into the deck for the normal path — that breaks the zero-dependency principle. The deliverable is a static PNG in `assets/`.

---

## Slide Embedding

Embed the exported PNG using the same `.slide-image` mechanics as a normal image, so it inherits the click-to-enlarge lightbox automatically. Wrap it so it stays within the viewport.

```html
<section class="slide">
    <div class="slide-content">
        <h2 class="reveal">Architecture Overview</h2>
        <figure class="diagram-figure reveal">
            <img class="slide-image diagram-image"
                 src="assets/diagram-1.png"
                 alt="Serverless image pipeline architecture">
            <figcaption class="diagram-caption">Serverless image pipeline</figcaption>
        </figure>
    </div>
    <div class="slide-footer">© 2026, Amazon Web Services, Inc. or its affiliates. All rights reserved.</div>
</section>
```

### CSS

```css
/* === DIAGRAM (draw.io PNG) === */
.diagram-figure {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(0.4rem, 1vh, 0.8rem);
    width: 100%;
    max-width: min(1100px, 92vw);
    margin: 0 auto;
}
.diagram-image {
    width: auto;
    max-width: 100%;
    /* Viewport fit: never exceed 60vh so heading + caption + footer still fit */
    max-height: min(60vh, 560px);
    object-fit: contain;
    cursor: zoom-in;            /* lightbox affordance */
}
/* Optional panel behind the diagram — improves contrast for dark themes.
   Use only when the diagram's strokes/labels are dark; skip for diagrams
   themed with light strokes on a dark slide. */
.diagram-image.on-panel {
    background: var(--diagram-panel, rgba(255,255,255,0.94));
    border-radius: clamp(8px, 1.2vw, 16px);
    padding: clamp(12px, 2vw, 28px);
}
.diagram-caption {
    font-family: var(--font-body);
    font-size: clamp(0.7rem, 1.1vw, 0.9rem);
    color: var(--chart-text, var(--text-secondary));
    text-align: center;
}
@media (max-height: 600px) {
    .diagram-image { max-height: 52vh; }
}
@media (max-height: 500px) {
    .diagram-image { max-height: 46vh; }
}
```

The lightbox (see html-template.md "Image Lightbox") binds to `.slide-image`, so `.diagram-image` is click-to-enlarge with no extra code. **When a deck contains any diagram, always include the lightbox** — diagrams reward zooming in.

---

## Theme Adaptation

PNG diagrams must read cleanly on the chosen slide background. draw.io shapes default to pale fills with dark strokes — fine on light themes, hard to read on dark ones. Pass explicit colors to drawio-skill so the diagram matches the preset.

**Rules:**
1. Export the PNG with `-t` (**transparent background**), so the slide background shows through instead of a white box.
2. Reuse the preset's `--chart-colors` palette (from STYLE_PRESETS.md) for shape fills/accents — this keeps diagrams visually consistent with charts in the same deck. Assign colors to node groups/tiers in order.
3. Set node **stroke** and **label font color** for contrast against the slide:
   - Dark themes → light strokes/labels: stroke `rgba(255,255,255,0.7)`, font `#ffffff` (or the accent for emphasis nodes).
   - Light themes → dark strokes/labels: stroke `rgba(0,0,0,0.65)`, font `#1a1a1a`.
4. Font family: pass the preset's **body font** name to drawio (e.g. `defaultFontFamily="Space Grotesk"`) so labels match the deck typography. The font is rasterized into the PNG at export time, so it renders correctly even if the viewer doesn't have that font installed.
5. Edges/arrows: use the preset `--accent` color (resolved to a literal hex) so connectors pop.
6. For dark themes where shape fills would still be muddy, prefer **outlined nodes** (transparent or near-transparent fill + colored stroke + light label) rather than solid pale fills. Alternatively add `.on-panel` to the `<img>` to sit the diagram on a light card.

**Per-theme quick guide** (stroke / label / edge — fills come from `--chart-colors`):

| Theme group | Node stroke | Label color | Edge color | Panel? |
|-------------|-------------|-------------|------------|--------|
| Dark (Bold Signal, Electric Studio, Creative Voltage, Dark Botanical) | `rgba(255,255,255,0.7)` | `#ffffff` | preset `--accent` | optional |
| Light (Notebook Tabs, Pastel Geometry, Split Pastel, Vintage Editorial) | `rgba(0,0,0,0.6)` | `#1a1a1a` | preset `--accent` | no |
| Neon Cyber | `#00ffcc` / `#ff00aa` | `#e0e0ff` | `#00ffcc` | no (glow reads on black) |
| Terminal Green | `#39d353` | `#7ee787` | `#39d353` | no |
| Swiss Modern | `#1a1a1a` | `#1a1a1a` | `#ff3300` | no |
| Paper & Ink | `#2c1810` | `#2c1810` | `#c41e3a` | no |
| re:Invent Keynote | `rgba(255,255,255,0.7)` | `#ffffff` | `#8B5CF6` | optional |

Because `var()` cannot be used inside the `.drawio` XML, **resolve every color to a literal hex/rgba** when building the drawio brief — same rule as Chart.js configs.

> **Tip:** Export at `-s 2` (2x) so labels stay sharp when the PNG is scaled up in the lightbox. Since PNG is rasterized, under-resolution shows as blurry text — when in doubt, render larger.

---

## Diagram Type → drawio Preset Map

| content.md `type:` | drawio diagram-type preset | Typical use |
|--------------------|---------------------------|-------------|
| `flowchart` (default) | Flowchart | process flows, decision trees |
| `aws` / `architecture` | Architecture | cloud/system architecture, AWS service diagrams |
| `sequence` | Sequence | request/response interactions, lifelines |
| `class` | UML Class | object models, class hierarchies |
| `er` | ERD | data models, DB schemas |
| `network` | Architecture (network shapes) | network topology |
| `mindmap` | Flowchart (radial) | concept maps, breakdowns |

For `aws`/`network`, tell drawio-skill to use the official AWS/Cisco/network shape libraries (it resolves exact shape styles via its `shapesearch.py`). For brand/AI logos it uses `aiicons.py`. Don't guess shape names in the brief — describe the components by name and let drawio-skill pick shapes.

---

## Viewport Fitting (NON-NEGOTIABLE)

- One diagram per slide. A diagram + bullets rarely both fit — split them.
- `.diagram-image` is capped at `max-height: min(60vh, 560px)` with height breakpoints at 600px and 500px. Keep them.
- If a diagram is dense (>~12 nodes), it will shrink past readability inside 60vh. **Split the concept across two slides** (e.g. high-level on one, detail on the next) rather than cramming. The lightbox lets viewers zoom the full-resolution PNG when needed (export at `-s 2` so it stays sharp when enlarged).
- Heading + diagram + optional 1-line caption + footer is the maximum. No bullet lists alongside.

---

## Fallback Chain

The normal path needs the **draw.io desktop CLI** to export PNG. Degrade gracefully:

| Scenario | Behavior |
|----------|----------|
| drawio CLI available | Generate `.drawio` + export `assets/diagram-N.png` (`-s 2 -t`, no `-e`), embed as above. (Preferred.) |
| drawio CLI missing, but the `.drawio` XML was generated | Embed a static placeholder card with the diagram title and a short note, and tell the user to install draw.io (`brew install --cask drawio`) and re-run to get the rendered diagram. Keep the `.drawio` source in `assets/` so nothing is lost. |
| drawio-skill not installed at all | Fall back to the slide skill's own layout primitives — render the described flow using the chosen style's **process-flow / feature-grid layout** (boxes + arrows in HTML/CSS) instead of a real diagram. Tell the user a CSS layout was used in place of a draw.io diagram and how to enable the full feature. |
| Diagram block empty (no description) | Skip the diagram, keep the heading, warn the user (already caught in Step 4). |

Whatever the path, the final `index.html` must remain self-contained: reference only relative `assets/*.png`, never an external URL or CDN diagram service.

---

## Prerequisite Note

The diagram feature depends on the external **drawio-skill** and the **draw.io desktop app CLI**:

```bash
# macOS
brew install --cask drawio
drawio --version
```

If the deck contains `### diagram` blocks and the CLI is missing, mention this once during Step 4 review (not on every slide) and offer the fallbacks above. Everything else about the presentation generates normally.
