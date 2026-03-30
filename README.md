[English](#english) | [中文](#中文)

---

# English

## aws-html-slides

A Claude Code skill for creating stunning, animation-rich HTML presentations — from scratch or by converting PowerPoint files.

Here is a deck about the skill, made through the skill:

https://github.com/user-attachments/assets/ef57333e-f879-432a-afb9-180388982478

### What This Does

**aws-html-slides** helps non-designers create beautiful web presentations without knowing CSS or JavaScript. Instead of asking you to describe your aesthetic preferences in words, it provides **13 pre-built visual previews** and lets you pick what you like.

### Key Features

- **Zero Dependencies** — Single HTML files with inline CSS/JS. No npm, no build tools, no frameworks.
- **Visual Style Discovery** — Browse 13 curated styles (dark, light, specialty themes) and pick by preview.
- **PPT Conversion** — Convert existing `.pptx` files to web presentations, preserving images, text, and notes.
- **Anti-AI-Slop** — Distinctive styles that avoid generic AI aesthetics. Custom fonts, curated palettes, purposeful animations.
- **Chart.js Support** — Embed responsive charts directly in slides using simple markdown syntax.
- **Inline Editing** — Press `E` to edit text directly in the browser, `Esc` to save.
- **Parallel Generation** — For 8+ slide decks, sub-agents generate slide batches in parallel for speed.

### Installation

#### Option 1: Clone to your Claude Code skills directory

```bash
git clone https://github.com/lanceli93/aws-html-slides.git ~/.claude/skills/aws-html-slides
```

#### Option 2: Copy manually

```bash
mkdir -p ~/.claude/skills/aws-html-slides/scripts
mkdir -p ~/.claude/skills/aws-html-slides/preview

# Copy all skill files
cp SKILL.md STYLE_PRESETS.md viewport-base.css html-template.md \
   animation-patterns.md chart-reference.md layout-reinvent.md \
   LICENSE README.md ~/.claude/skills/aws-html-slides/

cp scripts/* ~/.claude/skills/aws-html-slides/scripts/
cp preview/* ~/.claude/skills/aws-html-slides/preview/
```

### Usage

Invoke the skill in Claude Code:

```
/aws-html-slides
```

#### Path 1: Create a New Presentation

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

#### Path 2: Convert a PowerPoint

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

### Output

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

### Available Styles

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

### Requirements

- [Claude Code](https://claude.ai/claude-code) CLI
- For PPT conversion: Python with `python-pptx` (auto-installed via `uv`)

### Credits

Created by [@zarazhangrui](https://github.com/zarazhangrui) with Claude Code.

### License

MIT — See [LICENSE](LICENSE) for details.

---

# 中文

## aws-html-slides

一个 Claude Code 技能，用于创建精美的、动画丰富的 HTML 演示文稿 —— 支持从零开始创建或从 PowerPoint 文件转换。

以下是一个用本技能制作的、介绍本技能的演示文稿：

https://github.com/user-attachments/assets/ef57333e-f879-432a-afb9-180388982478

### 这是什么

**aws-html-slides** 帮助非设计师在不了解 CSS 或 JavaScript 的情况下创建漂亮的网页演示文稿。它不要求你用文字描述审美偏好，而是提供 **13 个预构建的视觉预览**，让你直接挑选喜欢的风格。

### 核心特性

- **零依赖** —— 单个 HTML 文件，内联所有 CSS/JS。无需 npm、构建工具或框架。
- **视觉化风格发现** —— 浏览 13 种精选风格（深色、浅色、特色主题），通过预览选择。
- **PPT 转换** —— 将已有的 `.pptx` 文件转换为网页演示文稿，保留图片、文字和备注。
- **拒绝 AI 味** —— 独特的设计风格，避免千篇一律的 AI 审美。定制字体、精选配色、有目的的动画。
- **Chart.js 图表支持** —— 通过简单的 Markdown 语法直接在幻灯片中嵌入响应式图表。
- **浏览器内编辑** —— 按 `E` 进入编辑模式直接修改文字，按 `Esc` 保存。
- **并行生成** —— 8 页以上的演示文稿，多个子代理并行生成幻灯片批次，提升速度。

### 安装

#### 方式一：克隆到 Claude Code 技能目录

```bash
git clone https://github.com/lanceli93/aws-html-slides.git ~/.claude/skills/aws-html-slides
```

#### 方式二：手动复制

```bash
mkdir -p ~/.claude/skills/aws-html-slides/scripts
mkdir -p ~/.claude/skills/aws-html-slides/preview

# 复制所有技能文件
cp SKILL.md STYLE_PRESETS.md viewport-base.css html-template.md \
   animation-patterns.md chart-reference.md layout-reinvent.md \
   LICENSE README.md ~/.claude/skills/aws-html-slides/

cp scripts/* ~/.claude/skills/aws-html-slides/scripts/
cp preview/* ~/.claude/skills/aws-html-slides/preview/
```

### 使用方法

在 Claude Code 中调用技能：

```
/aws-html-slides
```

#### 路径一：创建新演示文稿

```
步骤 1  →  设置（语言、模式、编辑功能、页数）
步骤 2  →  主题
步骤 3  →  从 13 个预览中选择风格
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
2. 在 Finder 中展示 13 个风格预览 —— 输入编号选择
3. 生成 `content.md` 模板供你填写内容
4. 审查你的内容并生成自包含的 HTML 演示文稿

#### 路径二：转换 PowerPoint

```
步骤 1  →  设置（语言、模式）
步骤 2  →  提供 .pptx 文件路径
步骤 3  →  选择风格 → 自动提取 + 生成（完成）
```

示例：

```
/aws-html-slides

> "把我的 my-talk.pptx 转换成网页幻灯片"
```

### 输出结构

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

### 可选风格

| # | 风格 | 氛围 | 主题 |
|---|------|------|------|
| 1 | Bold Signal | 自信、大胆、高冲击力 | 深色 |
| 2 | Electric Studio | 干净、专业、分栏布局 | 深色 |
| 3 | Creative Voltage | 活力、复古现代、电光感 | 深色 |
| 4 | Dark Botanical | 优雅、精致、暖色调 | 深色 |
| 5 | Notebook Tabs | 杂志风、有序、触感纹理 | 浅色 |
| 6 | Pastel Geometry | 友好、亲和、现代感 | 浅色 |
| 7 | Split Pastel | 俏皮、现代、双色分栏 | 浅色 |
| 8 | Vintage Editorial | 诙谐、个性鲜明 | 浅色 |
| 9 | Neon Cyber | 未来感、科技、霓虹光效 | 特色 |
| 10 | Terminal Green | 开发者风、黑客美学 | 特色 |
| 11 | Swiss Modern | 极简、包豪斯风格 | 特色 |
| 12 | Paper & Ink | 杂志、文学、深思 | 特色 |
| 13 | re:Invent Keynote | 未来感、主题演讲、高科技 | 特色 |

### 环境要求

- [Claude Code](https://claude.ai/claude-code) CLI
- PPT 转换需要：Python 及 `python-pptx`（通过 `uv` 自动安装）

### 致谢

由 [@zarazhangrui](https://github.com/zarazhangrui) 使用 Claude Code 创建。

### 许可证

MIT —— 详见 [LICENSE](LICENSE)。
