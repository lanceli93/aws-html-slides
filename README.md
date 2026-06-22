<a href="#english">English</a> | <a href="#中文">中文</a>

---

<a id="english"></a>

# aws-html-slides

An agent skill for creating stunning, animation-rich HTML presentations — from scratch or by converting PowerPoint files.

Based on [@zarazhangrui](https://github.com/zarazhangrui)'s [frontend-slides](https://github.com/zarazhangrui/frontend-slides).

### Demo: re:Invent Keynote (Style #2)

https://github.com/user-attachments/assets/c264cc34-67d5-4cbd-a884-9c1b20d06f7a

### Demo: Neon Cyber (Style #1)

https://github.com/user-attachments/assets/54dfbf37-7a7a-44e1-ad7e-585b99e9c77a

## What This Does

**aws-html-slides** helps non-designers create beautiful web presentations without knowing CSS or JavaScript. Instead of asking you to describe your aesthetic preferences in words, it provides **2 pre-built visual previews** and lets you pick what you like.

## Key Features

- **Zero Dependencies** — Single HTML files with inline CSS/JS. No npm, no build tools, no frameworks.
- **Visual Style Discovery** — Browse 2 curated specialty styles (Neon Cyber, re:Invent Keynote) and pick by preview.
- **Rich Layouts** — re:Invent Keynote ships ~18 keynote-grade content layouts (refined framed slides, metric cards with deltas, tagged card grids, numbered outlook columns, and more) so long decks never look monotonous.
- **Experimental 3D & Motion Effects** — Optional, self-contained, offline effects for re:Invent Keynote: CSS 3D heroes, hand-written WebGL shader backgrounds, and GSAP-orchestrated titles. See `demos/` and `aws-html-slides/effects-reference.md`.
- **PPT Conversion** — Convert existing `.pptx` files to web presentations, preserving images, text, and notes.
- **Anti-AI-Slop** — Distinctive styles that avoid generic AI aesthetics. Custom fonts, curated palettes, purposeful animations.
- **Chart.js Support** — Embed responsive charts directly in slides using simple markdown syntax.
- **Diagram Support** — Draw flowcharts, AWS architecture diagrams, sequence/UML/ER, network topology, or mind maps via the [drawio-skill](https://github.com/Agents365-ai/drawio-skill). Just describe the diagram in plain language in `content.md` — the skill generates and embeds a PNG automatically.
- **Inline Editing** — Press `E` to edit text directly in the browser, `Esc` to save.
- **Save to File** — `Cmd/Ctrl+S` writes your edits back into the source `index.html`. No more "lost on cache clear" — edits become permanent changes to the file itself. Chrome / Edge only (uses the File System Access API).
- **Overview Mode** — Press `Esc` (when not editing) to open a PPT-style grid of all slide thumbnails. Click any thumbnail — or use arrow keys + Enter — to jump. Current slide is highlighted.
- **Parallel Generation** — For 8+ slide decks, sub-agents generate slide batches in parallel for speed.

### Overview mode

![Overview mode — PPT-style thumbnail grid](docs/overview-slides.png)

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

Invoke the skill in your AI IDE or agent:

```
/aws-html-slides
```

### Path 1: Create a New Presentation

```
Step 1  →  Setup (language, mode, editing, page count)
Step 2  →  Topic
Step 3  →  Pick a style from 2 previews
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
2. Show 2 style previews in Finder — pick by number
3. Generate a `content.md` template for you to fill in
4. Review your content and generate a self-contained HTML presentation

### Path 2: Convert a PowerPoint

```
Step 1  →  Setup (language, mode)
Step 2  →  Provide .pptx file path
Step 3  →  Pick a style (1-2) → auto-extract + generate (done)
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
| 1 | Neon Cyber | Futuristic, techy, neon glow | Specialty |
| 2 | re:Invent Keynote | Futuristic, keynote-stage, high-tech, 3D-ready | Specialty |

## Requirements

- An AI IDE or agent that supports skills (e.g. [Claude Code](https://claude.ai/claude-code))
- For PPT conversion: Python with `python-pptx` (auto-installed via `uv`)
- For diagrams (optional): [draw.io desktop app](https://github.com/jgraph/drawio-desktop/releases) CLI on PATH (`brew install --cask drawio`) and the [drawio-skill](https://github.com/Agents365-ai/drawio-skill) installed

## License

MIT — See [LICENSE](LICENSE) for details.

---

<a id="中文"></a>

# aws-html-slides

一个 Agent 技能，用于创建精美的、动画丰富的 HTML 演示文稿 —— 支持从零开始创建或从 PowerPoint 文件转换。

基于 [@zarazhangrui](https://github.com/zarazhangrui) 的 [frontend-slides](https://github.com/zarazhangrui/frontend-slides) 项目。

### 演示：re:Invent Keynote（风格 #2）

https://github.com/user-attachments/assets/c264cc34-67d5-4cbd-a884-9c1b20d06f7a

### 演示：Neon Cyber（风格 #1）

https://github.com/user-attachments/assets/54dfbf37-7a7a-44e1-ad7e-585b99e9c77a

## 这是什么

**aws-html-slides** 帮助非设计师在不了解 CSS 或 JavaScript 的情况下创建漂亮的网页演示文稿。它不要求你用文字描述审美偏好，而是提供 **2 个预构建的视觉预览**，让你直接挑选喜欢的风格。

## 核心特性

- **零依赖** —— 单个 HTML 文件，内联所有 CSS/JS。无需 npm、构建工具或框架。
- **视觉化风格发现** —— 浏览 2 种精选特色风格（Neon Cyber、re:Invent Keynote），通过预览选择。
- **丰富排版** —— re:Invent Keynote 内置约 18 种主题演讲级内容排版（精致边框页、带涨跌的指标卡、标签卡片网格、编号展望栏等），长篇幻灯片不再单调。
- **实验性 3D 与动效** —— re:Invent Keynote 可选用自包含、离线可用的特效：CSS 3D 主视觉、手写 WebGL shader 背景、GSAP 编排标题。详见 `demos/` 与 `aws-html-slides/effects-reference.md`。
- **PPT 转换** —— 将已有的 `.pptx` 文件转换为网页演示文稿，保留图片、文字和备注。
- **拒绝 AI 味** —— 独特的设计风格，避免千篇一律的 AI 审美。定制字体、精选配色、有目的的动画。
- **Chart.js 图表支持** —— 通过简单的 Markdown 语法直接在幻灯片中嵌入响应式图表。
- **架构图/流程图支持** —— 通过 [drawio-skill](https://github.com/Agents365-ai/drawio-skill) 绘制流程图、AWS 架构图、时序/UML/ER 图、网络拓扑或思维导图。在 `content.md` 中用自然语言描述即可，技能会自动生成并嵌入 PNG 图片。
- **浏览器内编辑** —— 按 `E` 进入编辑模式直接修改文字，按 `Esc` 保存。
- **保存到源文件** —— `Cmd/Ctrl+S` 把编辑内容直接写回源 `index.html` 文件，不再"清缓存就丢失"，编辑真正成为文件本身的持久修改。仅支持 Chrome / Edge（基于 File System Access API）。
- **概览模式** —— 非编辑状态下按 `Esc` 打开类似 PPT 的缩略图网格。点击任意缩略图，或用方向键 + Enter，即可跳转到对应页，当前页高亮显示。
- **并行生成** —— 8 页以上的演示文稿，多个子代理并行生成幻灯片批次，提升速度。

### 概览模式

![概览模式 —— PPT 风格缩略图网格](docs/overview-slides.png)

## 安装

### 方式一：克隆后复制技能文件夹

```bash
git clone https://github.com/lanceli93/aws-html-slides.git
cp -r aws-html-slides/aws-html-slides ~/.claude/skills/aws-html-slides
```

### 方式二：克隆后创建符号链接（便于更新）

```bash
git clone https://github.com/lanceli93/aws-html-slides.git ~/aws-html-slides
ln -s ~/aws-html-slides/aws-html-slides ~/.claude/skills/aws-html-slides
```

后续更新只需在克隆目录中执行 `git pull`。

## 使用方法

在你的 AI IDE 或 Agent 中调用技能：

```
/aws-html-slides
```

### 路径一：创建新演示文稿

```
步骤 1  →  设置（语言、模式、编辑功能、页数）
步骤 2  →  主题
步骤 3  →  从 2 个预览中选择风格
步骤 4  →  填写 content.md
步骤 5  →  生成 HTML
```

示例：

```
/aws-html-slides

> "我想创建一个关于 Amazon Bedrock Agents 的演讲"
```

技能将会：
1. 一次性询问你的偏好（语言 / 模式 / 编辑 / 页数）
2. 在 Finder 中展示 2 个风格预览 —— 输入编号选择
3. 生成 `content.md` 模板供你填写内容
4. 审查你的内容并生成自包含的 HTML 演示文稿

### 路径二：转换 PowerPoint

```
步骤 1  →  设置（语言、模式）
步骤 2  →  提供 .pptx 文件路径
步骤 3  →  选择风格（1-2）→ 自动提取 + 生成（完成）
```

示例：

```
/aws-html-slides

> "把我的 my-talk.pptx 转换成网页幻灯片"
```

## 输出结构

```
my-presentation/
├── index.html        # 自包含演示文稿（所有 CSS/JS 内联）
└── assets/           # 媒体文件（自动复制）
    ├── screenshot.png
    └── demo.mp4
```

- 导航：方向键、空格、滚动、或点击导航圆点
- 图片：点击放大，Esc 关闭
- 分享：打包整个文件夹为 zip —— 接收者解压后打开 `index.html` 即可

## 可选风格

| # | 风格 | 氛围 | 主题 |
|---|------|------|------|
| 1 | Neon Cyber | 未来感、科技、霓虹光效 | 特色 |
| 2 | re:Invent Keynote | 未来感、主题演讲、高科技、支持 3D | 特色 |

## 环境要求

- 支持技能的 AI IDE 或 Agent（如 [Claude Code](https://claude.ai/claude-code)）
- PPT 转换需要：Python 及 `python-pptx`（通过 `uv` 自动安装）
- 架构图/流程图（可选）：[draw.io 桌面版](https://github.com/jgraph/drawio-desktop/releases) CLI 已添加到 PATH（`brew install --cask drawio`），并安装 [drawio-skill](https://github.com/Agents365-ai/drawio-skill)

## 许可证

MIT —— 详见 [LICENSE](LICENSE)。
