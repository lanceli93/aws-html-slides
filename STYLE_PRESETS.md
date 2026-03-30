# Style Presets Reference

Curated visual styles for Frontend Slides. Each preset is inspired by real design references — no generic "AI slop" aesthetics. **Abstract shapes only — no illustrations.**

**Viewport CSS:** For mandatory base styles, see [viewport-base.css](viewport-base.css). Include in every presentation.

---

## Dark Themes

### 1. Bold Signal

**Vibe:** Confident, bold, modern, high-impact

**Layout:** Colored card on dark gradient. Number top-left, navigation top-right, title bottom-left.

**Typography:**
- Display: `Archivo Black` (900)
- Body: `Space Grotesk` (400/500)

**Colors:**
```css
:root {
    --bg-primary: #1a1a1a;
    --bg-gradient: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
    --card-bg: #FF5722;
    --text-primary: #ffffff;
    --text-on-card: #1a1a1a;
}
```

**Signature Elements:**
- Bold colored card as focal point (orange, coral, or vibrant accent)
- Large section numbers (01, 02, etc.)
- Navigation breadcrumbs with active/inactive opacity states
- Grid-based layout for precise alignment

---

### 2. Electric Studio

**Vibe:** Bold, clean, professional, high contrast

**Layout:** Split panel—white top, blue bottom. Brand marks in corners.

**Typography:**
- Display: `Manrope` (800)
- Body: `Manrope` (400/500)

**Colors:**
```css
:root {
    --bg-dark: #0a0a0a;
    --bg-white: #ffffff;
    --accent-blue: #4361ee;
    --text-dark: #0a0a0a;
    --text-light: #ffffff;
}
```

**Signature Elements:**
- Two-panel vertical split
- Accent bar on panel edge
- Quote typography as hero element
- Minimal, confident spacing

---

### 3. Creative Voltage

**Vibe:** Bold, creative, energetic, retro-modern

**Layout:** Split panels—electric blue left, dark right. Script accents.

**Typography:**
- Display: `Syne` (700/800)
- Mono: `Space Mono` (400/700)

**Colors:**
```css
:root {
    --bg-primary: #0066ff;
    --bg-dark: #1a1a2e;
    --accent-neon: #d4ff00;
    --text-light: #ffffff;
}
```

**Signature Elements:**
- Electric blue + neon yellow contrast
- Halftone texture patterns
- Neon badges/callouts
- Script typography for creative flair

---

### 4. Dark Botanical

**Vibe:** Elegant, sophisticated, artistic, premium

**Layout:** Centered content on dark. Abstract soft shapes in corner.

**Typography:**
- Display: `Cormorant` (400/600) — elegant serif
- Body: `IBM Plex Sans` (300/400)

**Colors:**
```css
:root {
    --bg-primary: #0f0f0f;
    --text-primary: #e8e4df;
    --text-secondary: #9a9590;
    --accent-warm: #d4a574;
    --accent-pink: #e8b4b8;
    --accent-gold: #c9b896;
}
```

**Signature Elements:**
- Abstract soft gradient circles (blurred, overlapping)
- Warm color accents (pink, gold, terracotta)
- Thin vertical accent lines
- Italic signature typography
- **No illustrations—only abstract CSS shapes**

---

## Light Themes

### 5. Notebook Tabs

**Vibe:** Editorial, organized, elegant, tactile

**Layout:** Cream paper card on dark background. Colorful tabs on right edge.

**Typography:**
- Display: `Bodoni Moda` (400/700) — classic editorial
- Body: `DM Sans` (400/500)

**Colors:**
```css
:root {
    --bg-outer: #2d2d2d;
    --bg-page: #f8f6f1;
    --text-primary: #1a1a1a;
    --tab-1: #98d4bb; /* Mint */
    --tab-2: #c7b8ea; /* Lavender */
    --tab-3: #f4b8c5; /* Pink */
    --tab-4: #a8d8ea; /* Sky */
    --tab-5: #ffe6a7; /* Cream */
}
```

**Signature Elements:**
- Paper container with subtle shadow
- Colorful section tabs on right edge (vertical text)
- Binder hole decorations on left
- Tab text must scale with viewport: `font-size: clamp(0.5rem, 1vh, 0.7rem)`

---

### 6. Pastel Geometry

**Vibe:** Friendly, organized, modern, approachable

**Layout:** White card on pastel background. Vertical pills on right edge.

**Typography:**
- Display: `Plus Jakarta Sans` (700/800)
- Body: `Plus Jakarta Sans` (400/500)

**Colors:**
```css
:root {
    --bg-primary: #c8d9e6;
    --card-bg: #faf9f7;
    --pill-pink: #f0b4d4;
    --pill-mint: #a8d4c4;
    --pill-sage: #5a7c6a;
    --pill-lavender: #9b8dc4;
    --pill-violet: #7c6aad;
}
```

**Signature Elements:**
- Rounded card with soft shadow
- **Vertical pills on right edge** with varying heights (like tabs)
- Consistent pill width, heights: short → medium → tall → medium → short
- Download/action icon in corner

---

### 7. Split Pastel

**Vibe:** Playful, modern, friendly, creative

**Layout:** Two-color vertical split (peach left, lavender right).

**Typography:**
- Display: `Outfit` (700/800)
- Body: `Outfit` (400/500)

**Colors:**
```css
:root {
    --bg-peach: #f5e6dc;
    --bg-lavender: #e4dff0;
    --text-dark: #1a1a1a;
    --badge-mint: #c8f0d8;
    --badge-yellow: #f0f0c8;
    --badge-pink: #f0d4e0;
}
```

**Signature Elements:**
- Split background colors
- Playful badge pills with icons
- Grid pattern overlay on right panel
- Rounded CTA buttons

---

### 8. Vintage Editorial

**Vibe:** Witty, confident, editorial, personality-driven

**Layout:** Centered content on cream. Abstract geometric shapes as accent.

**Typography:**
- Display: `Fraunces` (700/900) — distinctive serif
- Body: `Work Sans` (400/500)

**Colors:**
```css
:root {
    --bg-cream: #f5f3ee;
    --text-primary: #1a1a1a;
    --text-secondary: #555;
    --accent-warm: #e8d4c0;
}
```

**Signature Elements:**
- Abstract geometric shapes (circle outline + line + dot)
- Bold bordered CTA boxes
- Witty, conversational copy style
- **No illustrations—only geometric CSS shapes**

---

## Specialty Themes

### 9. Neon Cyber

**Vibe:** Futuristic, techy, confident

**Typography:** `Clash Display` + `Satoshi` (Fontshare)

**Colors:** Deep navy (#0a0f1c), cyan accent (#00ffcc), magenta (#ff00aa)

**Signature:** Particle backgrounds, neon glow, grid patterns

---

### 10. Terminal Green

**Vibe:** Developer-focused, hacker aesthetic

**Typography:** `JetBrains Mono` (monospace only)

**Colors:** GitHub dark (#0d1117), terminal green (#39d353)

**Signature:** Scan lines, blinking cursor, code syntax styling

---

### 11. Swiss Modern

**Vibe:** Clean, precise, Bauhaus-inspired

**Typography:** `Archivo` (800) + `Nunito` (400)

**Colors:** Pure white, pure black, red accent (#ff3300)

**Signature:** Visible grid, asymmetric layouts, geometric shapes

---

### 12. Paper & Ink

**Vibe:** Editorial, literary, thoughtful

**Typography:** `Cormorant Garamond` + `Source Serif 4`

**Colors:** Warm cream (#faf9f7), charcoal (#1a1a1a), crimson accent (#c41e3a)

**Signature:** Drop caps, pull quotes, elegant horizontal rules

---

### 13. re:Invent Keynote

**Vibe:** Futuristic, keynote-stage, high-tech, professional

**Layout:** Near-black background with purple-pink gradient accents. Title/divider slides use full gradient backgrounds; content slides use dark base with floating gradient orbs for stage-light atmosphere.

**Typography:**
- Display: `Urbanist` (700/800)
- Body: `Albert Sans` (400/500)

**Colors:**
```css
:root {
    --bg-primary: #0A0A0A;
    --bg-gradient: linear-gradient(135deg, #1A0033 0%, #2D0066 40%, #7C3AED 100%);
    --accent-purple: #8B5CF6;
    --accent-pink: #D946EF;
    --accent-orange: #FF9900;
    --text-primary: #FFFFFF;
    --text-secondary: rgba(255, 255, 255, 0.6);
    --glow-purple: rgba(139, 92, 246, 0.4);
    --card-bg: rgba(139, 92, 246, 0.08);
    --card-border: rgba(139, 92, 246, 0.25);
}
```

**Signature Elements:**
- Purple-pink gradient backgrounds for title/divider slides, near-black (#0A0A0A) for content slides
- Animated color-shifting blobs on title slides (see `animation-patterns.md` "Animated Blob Backgrounds")
- Floating gradient orbs on content slides (`filter: blur(100px)`, slow drift)
- Pill-shaped feature cards with purple glow border (`box-shadow: 0 0 20px rgba(139,92,246,0.4)`)
- Stats/metrics row: large gradient numbers + small labels, inside bordered card with vertical dividers
- AWS orange (#FF9900) used sparingly — only for small accents, never dominant

**Layout Variants (see preview for examples):**
- **Split Divider** — Left product/title + vertical gradient line + right bullet list
- **Pipeline Columns** — Centered title + N equal columns with colored gradient bars + sub-items
- **Quote** — Large gradient quotation mark + centered quote text + attribution
- **Big Number Hero** — Giant gradient number + label + description
- **Comparison Split** — Two side-by-side cards with colored dot headers + bullet lists
- **Process Flow** — Horizontal numbered steps with connecting gradient lines
- **Timeline Zigzag** — Horizontal line with alternating above/below cards, color progression (blue→purple→pink)

---

## Chart Color Palettes

Each theme provides 6 harmonious colors for Chart.js datasets, plus grid/text colors. Use these when generating chart configurations.

### Dark Themes

**1. Bold Signal**
```css
--chart-colors: #FF5722, #FF8A65, #FFAB91, #E64A19, #D84315, #FF7043;
--chart-grid: rgba(255,255,255,0.05);
--chart-text: rgba(255,255,255,0.4);
--chart-card-bg: rgba(255,87,34,0.08);
--chart-card-border: rgba(255,87,34,0.2);
```

**2. Electric Studio**
```css
--chart-colors: #4361ee, #7B93F5, #3A56D4, #94A8F7, #2D47D6, #A8B8F8;
--chart-grid: rgba(255,255,255,0.05);
--chart-text: rgba(255,255,255,0.4);
--chart-card-bg: rgba(67,97,238,0.08);
--chart-card-border: rgba(67,97,238,0.2);
```

**3. Creative Voltage**
```css
--chart-colors: #0066ff, #d4ff00, #00ccff, #ff6600, #9933ff, #00ff88;
--chart-grid: rgba(255,255,255,0.05);
--chart-text: rgba(255,255,255,0.4);
--chart-card-bg: rgba(0,102,255,0.08);
--chart-card-border: rgba(0,102,255,0.2);
```

**4. Dark Botanical**
```css
--chart-colors: #d4a574, #e8b4b8, #c9b896, #a67c52, #d4c0a8, #c08880;
--chart-grid: rgba(232,228,223,0.06);
--chart-text: #9a9590;
--chart-card-bg: rgba(232,228,223,0.03);
--chart-card-border: rgba(212,165,116,0.15);
```

### Light Themes

**5. Notebook Tabs**
```css
--chart-colors: #98d4bb, #c7b8ea, #f4b8c5, #a8d8ea, #ffe6a7, #d4a8c0;
--chart-grid: rgba(0,0,0,0.06);
--chart-text: rgba(0,0,0,0.45);
--chart-card-bg: rgba(0,0,0,0.03);
--chart-card-border: rgba(0,0,0,0.08);
```

**6. Pastel Geometry**
```css
--chart-colors: #f0b4d4, #a8d4c4, #9b8dc4, #7c6aad, #5a7c6a, #c4a88d;
--chart-grid: rgba(0,0,0,0.06);
--chart-text: rgba(0,0,0,0.45);
--chart-card-bg: rgba(0,0,0,0.03);
--chart-card-border: rgba(0,0,0,0.08);
```

**7. Split Pastel**
```css
--chart-colors: #d4849c, #8494d4, #84c49c, #c4c484, #b484c4, #84b4c4;
--chart-grid: rgba(0,0,0,0.06);
--chart-text: rgba(0,0,0,0.45);
--chart-card-bg: rgba(0,0,0,0.03);
--chart-card-border: rgba(0,0,0,0.08);
```

**8. Vintage Editorial**
```css
--chart-colors: #c49070, #a07050, #806040, #d4a878, #907060, #b08868;
--chart-grid: rgba(0,0,0,0.06);
--chart-text: rgba(0,0,0,0.45);
--chart-card-bg: rgba(0,0,0,0.03);
--chart-card-border: rgba(0,0,0,0.08);
```

### Specialty Themes

**9. Neon Cyber**
```css
--chart-colors: #00ffcc, #ff00aa, #00aaff, #ffaa00, #aa00ff, #ff5555;
--chart-grid: rgba(0,255,204,0.06);
--chart-text: rgba(224,224,255,0.4);
--chart-card-bg: rgba(0,255,204,0.03);
--chart-card-border: rgba(0,255,204,0.15);
```

**10. Terminal Green**
```css
--chart-colors: #39d353, #2ea043, #56d364, #3fb950, #238636, #7ee787;
--chart-grid: rgba(57,211,83,0.08);
--chart-text: rgba(57,211,83,0.5);
--chart-card-bg: rgba(57,211,83,0.05);
--chart-card-border: rgba(57,211,83,0.15);
```

**11. Swiss Modern**
```css
--chart-colors: #ff3300, #1a1a1a, #666666, #cc2200, #999999, #333333;
--chart-grid: rgba(0,0,0,0.08);
--chart-text: rgba(0,0,0,0.5);
--chart-card-bg: rgba(0,0,0,0.02);
--chart-card-border: rgba(0,0,0,0.1);
```

**12. Paper & Ink**
```css
--chart-colors: #c41e3a, #2c1810, #8b4513, #6b3a2a, #a0522d, #d4a574;
--chart-grid: rgba(0,0,0,0.06);
--chart-text: rgba(0,0,0,0.45);
--chart-card-bg: rgba(0,0,0,0.02);
--chart-card-border: rgba(0,0,0,0.08);
```

**13. re:Invent Keynote**
```css
--chart-colors: #8B5CF6, #D946EF, #FF9900, #06B6D4, #34D399, #F472B6;
--chart-grid: rgba(139,92,246,0.08);
--chart-text: rgba(255,255,255,0.4);
--chart-card-bg: rgba(139,92,246,0.06);
--chart-card-border: rgba(139,92,246,0.2);
```

---

## Font Pairing Quick Reference

| Preset | Display Font | Body Font | Source |
|--------|--------------|-----------|--------|
| Bold Signal | Archivo Black | Space Grotesk | Google |
| Electric Studio | Manrope | Manrope | Google |
| Creative Voltage | Syne | Space Mono | Google |
| Dark Botanical | Cormorant | IBM Plex Sans | Google |
| Notebook Tabs | Bodoni Moda | DM Sans | Google |
| Pastel Geometry | Plus Jakarta Sans | Plus Jakarta Sans | Google |
| Split Pastel | Outfit | Outfit | Google |
| Vintage Editorial | Fraunces | Work Sans | Google |
| Neon Cyber | Clash Display | Satoshi | Fontshare |
| Terminal Green | JetBrains Mono | JetBrains Mono | JetBrains |
| re:Invent Keynote | Urbanist | Albert Sans | Google |

---

## DO NOT USE (Generic AI Patterns)

**Fonts:** Inter, Roboto, Arial, system fonts as display

**Colors:** `#6366f1` (generic indigo), purple gradients on white

**Layouts:** Everything centered, generic hero sections, identical card grids

**Decorations:** Realistic illustrations, gratuitous glassmorphism, drop shadows without purpose

---

## CSS Gotchas

### Negating CSS Functions

**WRONG — silently ignored by browsers (no console error):**
```css
right: -clamp(28px, 3.5vw, 44px);   /* Browser ignores this */
margin-left: -min(10vw, 100px);      /* Browser ignores this */
```

**CORRECT — wrap in `calc()`:**
```css
right: calc(-1 * clamp(28px, 3.5vw, 44px));  /* Works */
margin-left: calc(-1 * min(10vw, 100px));     /* Works */
```

CSS does not allow a leading `-` before function names. The browser silently discards the entire declaration — no error, the element just appears in the wrong position. **Always use `calc(-1 * ...)` to negate CSS function values.**

