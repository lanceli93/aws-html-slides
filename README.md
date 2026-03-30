[English](README.md) | [中文](README_CN.md)

# aws-html-slides

A Claude Code skill for creating stunning, animation-rich HTML presentations — from scratch or by converting PowerPoint files.

Based on [@zarazhangrui](https://github.com/zarazhangrui)'s [frontend-slides](https://github.com/zarazhangrui/frontend-slides).

Here is a deck about the skill, made through the skill:

https://github.com/user-attachments/assets/ef57333e-f879-432a-afb9-180388982478

## What This Does

**aws-html-slides** helps non-designers create beautiful web presentations without knowing CSS or JavaScript. Instead of asking you to describe your aesthetic preferences in words, it provides **13 pre-built visual previews** and lets you pick what you like.

## Key Features

- **Zero Dependencies** — Single HTML files with inline CSS/JS. No npm, no build tools, no frameworks.
- **Visual Style Discovery** — Browse 13 curated styles (dark, light, specialty themes) and pick by preview.
- **PPT Conversion** — Convert existing `.pptx` files to web presentations, preserving images, text, and notes.
- **Anti-AI-Slop** — Distinctive styles that avoid generic AI aesthetics. Custom fonts, curated palettes, purposeful animations.
- **Chart.js Support** — Embed responsive charts directly in slides using simple markdown syntax.
- **Inline Editing** — Press `E` to edit text directly in the browser, `Esc` to save.
- **Parallel Generation** — For 8+ slide decks, sub-agents generate slide batches in parallel for speed.

## Installation

### Option 1: Clone and copy the skill folder

```bash
git clone https://github.com/lanceli93/aws-html-slides.git
cp -r aws-html-slides/aws-html-slides ~/.claude/skills/aws-html-slides
```

### Option 2: Clone and symlink (easy to update)

```bash
git clone https://github.com/lanceli93/aws-html-slides.git ~/aws-html-slides
ln -s ~/aws-html-slides/aws-html-slides ~/.claude/skills/aws-html-slides
```

To update later, just `git pull` in the cloned repo.

## Usage

Invoke the skill in Claude Code:

```
/aws-html-slides
```

### Path 1: Create a New Presentation

```
Step 1  →  Setup (language, mode, editing, page count)
Step 2  →  Topic
Step 3  →  Pick a style from 13 previews
Step 4  →  Fill in content.md
Step 5  →  Generate HTML
```

Example:

```
/aws-html-slides

> "I want to create a pitch deck about Amazon Bedrock Agents"
```

The skill will:
1. Ask your preferences (language / mode / editing / page count) in one go
2. Show 13 style previews in Finder — pick by number
3. Generate a `content.md` template for you to fill in
4. Review your content and generate a self-contained HTML presentation

### Path 2: Convert a PowerPoint

```
Step 1  →  Setup (language, mode)
Step 2  →  Provide .pptx file path
Step 3  →  Pick a style → auto-extract + generate (done)
```

Example:

```
/aws-html-slides

> "Convert my-talk.pptx to a web slideshow"
```

## Output

```
my-presentation/
├── index.html        # Self-contained presentation (all CSS/JS inline)
└── assets/           # Media files (auto-copied)
    ├── screenshot.png
    └── demo.mp4
```

- Navigate: Arrow keys, Space, scroll, or click nav dots
- Images: Click to enlarge, Esc to close
- Share: Zip the folder — recipient unzips and opens `index.html`

## Available Styles

| # | Style | Vibe | Theme |
|---|-------|------|-------|
| 1 | Bold Signal | Confident, bold, high-impact | Dark |
| 2 | Electric Studio | Clean, professional, split-panel | Dark |
| 3 | Creative Voltage | Energetic, retro-modern, electric | Dark |
| 4 | Dark Botanical | Elegant, sophisticated, warm | Dark |
| 5 | Notebook Tabs | Editorial, organized, tactile | Light |
| 6 | Pastel Geometry | Friendly, approachable, modern | Light |
| 7 | Split Pastel | Playful, modern, two-color split | Light |
| 8 | Vintage Editorial | Witty, personality-driven | Light |
| 9 | Neon Cyber | Futuristic, techy, neon glow | Specialty |
| 10 | Terminal Green | Developer-focused, hacker aesthetic | Specialty |
| 11 | Swiss Modern | Minimal, Bauhaus-inspired | Specialty |
| 12 | Paper & Ink | Editorial, literary, thoughtful | Specialty |
| 13 | re:Invent Keynote | Futuristic, keynote-stage, high-tech | Specialty |

## Requirements

- [Claude Code](https://claude.ai/claude-code) CLI
- For PPT conversion: Python with `python-pptx` (auto-installed via `uv`)

## License

MIT — See [LICENSE](LICENSE) for details.
