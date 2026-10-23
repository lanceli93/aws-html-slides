---
name: aws-html-slides
description: Create stunning, keynote-grade HTML presentations in the AWS re:Invent style — from scratch or by converting PowerPoint files. Use when the user wants to build a presentation, convert a PPT/PPTX to web, or create slides for a talk, pitch, customer solution or keynote. The user picks one of three re:Invent visual flavors (Aurora ribbons, Spatial 3D, Pulse globe) from live demo decks; slides are then composed freely for the content with cinematic motion.
---

# aws-html-slides

Create zero-dependency, animation-rich HTML presentations in the **AWS re:Invent** visual language. Everything runs in
the browser as one self-contained `index.html`.

## Quick Start — How It Works

**When the user invokes this skill, present this workflow overview first.**

There is **one theme, re:Invent**, in **three visual flavors**. The user picks a flavor after opening the demo
decks:

| # | Flavor | Feel |
|---|---|---|
| 1 | **Aurora** | WebGL silk light ribbons flowing behind glass panels. Premium and restrained |
| 2 | **Spatial** | The deck is a 3D world; every slide change is a camera flight over a glowing grid floor |
| 3 | **Pulse** | A lit dotted globe, beams and data packets; the cloud feels alive |

| Path | Flow |
|------|------|
| **New Presentation** | 1 Setup → 2 Topic → 3 Flavor → 4 Fill content.md → 5 Generate + self-QA |
| **PPT Conversion** | 1 Setup → 2 PPT path → 3 Flavor + extract + generate + self-QA |

**Rich content blocks** work in any slide:
- images and video
- data **charts**
- **tables**
- **diagrams**: flowcharts, sequence/UML/ER, network, mind maps and architecture, drawn as **native animated SVG**
  (packets flow along the edges; an isometric 3D look is optional)
- AWS architecture diagrams with official service icons, via the drawio skill

**Every deck ships with:**
- keyboard, wheel, swipe and `#N` deep-link navigation
- cinematic slide transitions
- intros that replay each time a slide is entered
- an overview grid (`O` / `Esc`)
- click-to-zoom images
- Print → Save as PDF (one 16:9 page per slide)
- optional in-browser editing with save-to-file

### Output structure

```
my-presentation/
├── index.html        # The presentation (all CSS/JS inline)
└── assets/           # Media files, auto-copied from your references
```

Share by zipping the folder.

---

## Core Principles

1. **Zero dependencies.** One HTML file with inline CSS/JS. The only network loads are Google Fonts and Lucide icons.
   No npm, no build. If vendored libraries are needed, they sit next to the file in `vendor/`.
2. **Show, don't tell.** Users choose a flavor by opening real demo decks, not by reading adjectives.
3. **Compose, don't fill templates.** The preview decks define the *style*: engine, motif, components, motion
   language. Every slide is composed freshly for the user's content. See [design-system.md](design-system.md) §3.
4. **Keynote-grade or nothing.** Every slide has one focal point and motion with intent. Each deck has 1–2 signature
   moments. Avoid the "AI slop" list in design-system.md §5.
5. **Viewport fitting (NON-NEGOTIABLE).** Every slide fits exactly one viewport and never scrolls. Content that
   doesn't fit gets split across slides.

## Viewport Fitting Rules

- The Stage Engine sizes and stacks the slides. **Never set `position`, `transform`, `opacity`, `visibility` or
  `z-index` on `.slide`.**
- ALL font sizes and spacing use `clamp()`; never fixed px/rem. Never negate a CSS function directly: write
  `calc(-1 * clamp(...))`.
- Verify at **1600×900 and 1280×640** (the QA script does both). Containers get `max-height` limits, images
  `max-height: min(50vh, 400px)`, charts ≤ 50vh, diagrams ≤ 60vh.
- Density limits are in [design-system.md](design-system.md) §3. **Exceeded? Split the slide. Never cram, never scroll.**

---

## Step 1: Setup

**Ask all setup questions in a single AskUserQuestion, with bilingual labels:**

**Question 1: Language / 语言** (header: "Language"). Language / 语言? Options:
- **English**
- **中文**

**Question 2: Mode / 模式** (header: "Mode"). What to do / 你想做什么? Options:
- **New Presentation / 新建演示**: Create from scratch / 从零开始创建
- **Convert PPT / 转换 PPT**: Convert .pptx to HTML / 将 .pptx 转为 HTML

**Question 3: Editing / 编辑** (header: "Editing"). Inline editing in browser / 浏览器内编辑? Options:
- **Yes / 是 (Recommended)**: Press E to edit, Esc to save / 按 E 编辑，Esc 保存
- **No / 否**: View only, smaller file / 仅展示，文件更小

**Question 4: Pages / 页数** (header: "Pages"). How many slides / 多少页? Options:
- **Short / 简短** (5-10)
- **Medium / 中等** (10-20)
- **Long / 详细** (20+)

After the user answers, use the selected language for **ALL** later messages, AskUserQuestion labels and option
descriptions. Technical terms (PPT, HTML) stay in English.

**Disclaimer (always on):** every slide carries `"© 2026, Amazon Web Services, Inc. or its affiliates. All rights
reserved."`. It is not optional.

**For PPT mode:** the page count is ignored (the PPT content decides it). The editing choice still applies.

---

## Step 2: Topic / PPT Path

- **New presentation:** ask the user for a brief topic in chat. It is used for the project folder name, e.g.
  "bedrock-agents" or "lakehouse-migration".
- **PPT conversion:** ask for the .pptx file path.

---

## Step 3: Flavor Selection + Project Setup

### Flavor selection (both paths)

**Open the preview folder** so the user can double-click the demo decks. In each deck: → / Space to advance,
`O` for the overview. The previews live in the skill directory:

```bash
open <skill-base-dir>/preview/
```

Show this table, then ask with AskUserQuestion (header: "Flavor") for **1 · Aurora**, **2 · Spatial** or
**3 · Pulse**:

| # | Flavor | Demo decks in `preview/` | Best for |
|---|---|---|---|
| 1 | **Aurora** (流光): WebGL light ribbons + glass | `1-aurora-keynote.html` · `1-aurora-bigdata.html` | strategy, executive and customer pitches |
| 2 | **Spatial** (空间): 3D world + camera flights | `2-spatial-keynote.html` · `2-spatial-bigdata.html` | architecture deep-dives, layered platforms, migrations |
| 3 | **Pulse** (脉动): globe + beams + live data | `3-pulse-keynote.html` · `3-pulse-bigdata.html` | data, streaming, infrastructure, global scale |

The "best for" column is guidance only. Any flavor works for any topic, and the user decides. Each flavor has a
keynote deck (EN, product launch) and a solution deck (中文, big data), so the user can see its range.

### PPT conversion: extract + generate (end of the PPT path)

After the flavor is chosen, do everything in one step:

1. **Create the project folder** with an `assets/` directory.
2. **Extract content** by running `uv run --with python-pptx python scripts/extract-pptx.py <input.pptx> <output_dir>`.
3. **Show the user** a summary of the extracted slides: titles, content previews, image counts.
4. **Generate the HTML** exactly as in Step 5. Preserve all text, images (from `assets/`), slide order and speaker
   notes (as HTML comments), but **re-compose each slide** in the flavor; don't replicate the PPT's layout.
5. **Self-QA** as in Step 5, then open the deck and summarize.

**The PPT conversion is then complete. Steps 4–5 are skipped.**

### New presentation: create the project folder

After the flavor is chosen, create the project folder and generate content.md **with the script** (not by AI):

```bash
mkdir -p <topic>/assets
uv run python <skill-base-dir>/scripts/gen-content.py <page_count> <topic>/content.md --lang <language>
touch <topic>/index.html
```

`<page_count>` is the middle value of the chosen range (Short=8, Medium=15, Long=25). `<language>` is `en` or `zh`,
based on the Step 1 choice.

**Tell the user:** fill in `<topic>/content.md` with your content, then come back; I'll review it before generating.

**Also mention the optional rich blocks.** The template header in content.md documents each one in full.
- `### chart`: data charts (bar, line, pie, etc.).
- `### table`: comparison tables.
- `### diagram`: flowcharts, sequence/UML/ER, network topology, mind maps or architecture, drawn as **native
  animated SVG** right in the slide. No install is needed; `animate: flow` gives request-packet animation, and an
  isometric-3D look is available. See [diagram-reference.md](diagram-reference.md).
  - Only `type: aws` (official AWS service icons) uses the drawio skill, which needs the draw.io desktop CLI
    (`brew install --cask drawio`). If it's missing, I'll flag it at review and draw natively instead.

**IMPORTANT: do NOT fill in or modify content.md on the user's behalf.** The content must come from the user. If the
user asks you to draft content, first confirm the topic and outline with them via AskUserQuestion. Never
auto-generate slide content without explicit approval.

---

## Step 4: Content Review (New Presentation only)

Read the completed content.md and review it before proceeding.

1. **Parse all slides**: headings, body text and media references.
2. **Validate media files.** Check that every referenced file exists. Resolve relative paths from the cwd; use
   absolute and pasted image paths as-is. Report any missing files.
3. **Check for issues.** Flag:
   - empty slides
   - slides over the density limits ([design-system.md](design-system.md) §3)
   - inconsistent numbering
   - missing media
   - chart blocks: `type` must be line/bar/doughnut/pie/radar/polarArea, and the label count must match the data
     count
   - malformed markdown tables
   - diagram blocks: `type` must be flowchart/sequence/class/er/network/mindmap/arch/aws, with a non-empty
     description. Native types need no prerequisites. For `type: aws`, flag once if the `drawio` CLI is missing.
4. **Present a summary table**: slide number, title, content preview, media count, warnings.
5. **Plan the composition.** Add one line per slide to the table: the composition idea you intend to use and the
   deck's 1–2 signature moments. This catches a monotone deck before it gets generated.
6. **Ask for confirmation** via AskUserQuestion (header: "Review"):
   - "Looks good, proceed": continue to Step 5.
   - "I need to fix some things": the user edits content.md, then re-run the review.

**Only proceed to generation after the user confirms.**

---

## Step 5: Generate HTML + Self-QA

### Read before generating

| File | Why |
|---|---|
| [design-system.md](design-system.md) | Brand, typography (incl. CJK), composition vocabulary, motion language, do-nots, QA checklist |
| [engine/ENGINE.md](engine/ENGINE.md) | Stage Engine API and authoring contract (reveals, hooks, final state, overview, print) |
| `flavors/<flavor>/README.md` | The chosen flavor's motif configuration, component catalog and composition guidance |
| `preview/<n>-<flavor>-*.html` | Both reference decks for the flavor, the working source to lift patterns from (lift; don't copy layouts) |
| [html-template.md](html-template.md) | Deck assembly order, icons, images, charts, tables, chrome |
| [chart-reference.md](chart-reference.md) | Only if there are `### chart` blocks |
| [diagram-reference.md](diagram-reference.md) | Only if there are `### diagram` blocks; demos in `../demos/diagrams/` |
| [effects-reference.md](effects-reference.md) | Optional, for extra 3D/motion techniques beyond the flavor kit (three.js, GSAP, etc.) |

### Assemble the deck (exact order, details in html-template.md)

1. `<head>`: fonts + Lucide.
2. `<style>`, in this order, with each shared file pasted **verbatim**:
   - `engine/stage-engine.css`
   - `engine/inline-editor.css` (if editing was opted in)
   - `flavors/<flavor>/kit.css`
   - deck CSS
3. `<body>`:
   - the motif layer and chrome the kit requires
   - the slides: `<section class="slide" data-scene data-label data-thumb>`, each followed by its hook `<script>`
     via `STAGE_HOOKS`
   - `engine/stage-engine.js`, `engine/inline-editor.js` (if opted in) and `flavors/<flavor>/kit.js`, all verbatim
   - deck glue, then `lucide.createIcons()`

### Composition rules

- Design each slide for its content's shape ([design-system.md](design-system.md) §3), using the flavor's motif and
  components.
- Configure the motif per slide declaratively (see the flavor README), so it reacts to the story.
- Vary compositions. Plan the signature moments. **Never use plain bullet lists.**
- Every animated element has a final state (`.is-final` CSS or a hook's `final()`). Every slide has `data-label` and
  `data-thumb`.
- The footer disclaimer and a page indicator go on every slide.

**Asset bundling (images/videos):**
- Copy every referenced file into `<topic>/assets/` and reference it with a relative path (`assets/x.png`).
- Images open in the engine's lightbox automatically. Never use absolute paths.

### Parallel generation (8+ slides)

| Slides | Strategy |
|--------|----------|
| 1-7 | A single agent generates everything |
| 8+ | A framework agent plus slide-batch agents (1 per ~5 slides), in parallel (`run_in_background: true`) |

1. Create `<topic>/_parts/`.
2. **The lead writes the composition plan first.** For every slide: its composition idea, motif config, focal element
   and signature moments. Every agent gets the plan, so the deck is varied and coherent.
3. **Framework agent:**
   - `_parts/00-head.html`: DOCTYPE → `<body>`, with all shared CSS verbatim plus the deck CSS for shared components,
     and the motif layer and chrome.
   - `_parts/99-foot.html`: engine, editor and kit JS verbatim, then the glue and closing tags.
4. **Slide-batch agents** write `_parts/10-slides.html`, `_parts/20-slides.html`, etc. Each part contains
   `<section class="slide">` blocks, each followed by its own `<script>(window.STAGE_HOOKS=…).push([...])</script>`.
   - Slide-specific CSS goes in a `<style>` placed right after that section, with selectors scoped to the section's
     `data-scene`.
   - No `<head>`, no engine or kit code.
   - Give each batch agent: the plan, the flavor README, the class reference of the kit and the shared deck
     components, the content for its slides, and the hook/final-state contract from ENGINE.md.
5. **Diagram blocks:** prepare them before launching the batch agents. The lead designs each native diagram's SVG
   `<figure>` and the batch agent inlines it verbatim. For `type: aws`, export the PNG to `assets/` first via the
   drawio skill.
6. **Assemble:** `cat _parts/*.html > index.html`. Then **delete `_parts/`**; it's a build artifact.

### Self-QA (mandatory, before delivery)

```bash
uv run --with playwright python <skill-base-dir>/scripts/qa-shots.py <topic>/index.html <topic>/_qa
```

- The script screenshots every slide at 1600×900 and 1280×640, plus the overview. It reports clipped or overflowing
  text and console errors (it uses the installed Google Chrome).
- Fix every reported problem.
- Then **open the PNGs and judge them** against the checklist in [design-system.md](design-system.md) §7. Is there a
  focal point, varied compositions, 3D that reads as 3D, motion on every slide, clean CJK? Iterate until it's
  genuinely keynote-grade.
- Delete `<topic>/_qa/` when done.

### Delivery

1. **Open** the deck: `open <topic>/index.html`.
2. **Summarize** for the user:
   - The folder location, flavor, slide count and the signature moments.
   - Navigation: → / Space / wheel / swipe to advance; `O` or `Esc` for the overview; `#N` in the URL jumps to slide N.
   - Export: Print → Save as PDF gives one 16:9 page per slide.
   - Click an image to enlarge it.
   - If editing is enabled: press `E` (or hover the top-left corner) to edit, `Esc` to save and exit, `Cmd/Ctrl+S` to
     write the edits back into `index.html`.
   - To customize: the kit tokens in `:root`, the per-slide motif config, and the slide markup.
   - **To share: zip the folder.** The recipient unzips it and opens `index.html`.

---

## Supporting Files

| File | Purpose | When to read |
|------|---------|-------------|
| [design-system.md](design-system.md) | re:Invent brand, type (EN + CJK), composition vocabulary, motion language, do-nots, QA checklist | Step 3–5 |
| [engine/ENGINE.md](engine/ENGINE.md) | Stage Engine reference: API, authoring contract, final-state rule, overview, print, editor, porting | Step 5 |
| `engine/stage-engine.{css,js}` | The engine; pasted verbatim into every deck | Step 5 |
| `engine/inline-editor.{css,js}` | Opt-in inline editor + save-to-file; pasted verbatim when editing is on | Step 5 |
| `engine/example.html` | Minimal working deck that exercises every engine API | Reference |
| `flavors/aurora/` · `flavors/spatial/` · `flavors/pulse/` | Flavor kits: `kit.css` + `kit.js` (motif + components, pasted verbatim) and `README.md` (generator guide) | Step 5 (chosen flavor) |
| [preview/](preview/) | 6 reference decks: a keynote and a big-data deck per flavor | Step 3 (user picks) + Step 5 (lift patterns) |
| [html-template.md](html-template.md) | Deck assembly order, icons, images, charts, tables, chrome, code quality | Step 5 |
| [chart-reference.md](chart-reference.md) | Chart.js patterns + parsing `### chart` | Step 5 (charts) |
| [diagram-reference.md](diagram-reference.md) | Native animated SVG diagrams + drawio path for `type: aws` | Step 5 (diagrams) |
| [effects-reference.md](effects-reference.md) | Catalog of extra 3D/motion techniques (WebGL, three.js, GSAP, CSS 3D) with license and offline rules; demos in `../demos/` | Optional |
| [animation-patterns.md](animation-patterns.md) | Snippets for count-up, border beam, spotlight, marquee, scramble, typing | Optional |
| [scripts/gen-content.py](scripts/gen-content.py) | Generates the content.md template by page count | Step 3 |
| [scripts/extract-pptx.py](scripts/extract-pptx.py) | Extracts PPT content | Step 3 (PPT path) |
| [scripts/qa-shots.py](scripts/qa-shots.py) | Per-slide screenshots, overflow check, console errors, overview | Step 5 self-QA |
