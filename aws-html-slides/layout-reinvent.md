# re:Invent Keynote — Layout Patterns Reference

Extracted from preview #13. Use these CSS classes and HTML patterns when generating re:Invent Keynote style presentations.

**Read this file during Step 5 (generation) when the chosen style is #13 re:Invent Keynote.**

## Common Elements

### Floating Orbs (all content slides)

```css
.floating-orb { position: absolute; border-radius: 50%; pointer-events: none; z-index: 0; }
.orb-purple { background: radial-gradient(circle, rgba(139,92,246,0.35) 0%, rgba(139,92,246,0) 70%); }
.orb-pink { background: radial-gradient(circle, rgba(217,70,239,0.3) 0%, rgba(217,70,239,0) 70%); }
.orb-blue { background: radial-gradient(circle, rgba(59,130,246,0.25) 0%, rgba(59,130,246,0) 70%); }
@keyframes orbFloat1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,-30px) scale(1.05); } }
@keyframes orbFloat2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-25px,20px) scale(0.95); } }
@keyframes orbFloat3 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(15px,25px) scale(1.03); } }
```

Each content slide gets 1-2 orbs with inline size/position/animation. Vary per slide:
```html
<div class="floating-orb orb-purple" style="width:30vw;height:30vw;top:8%;right:5%;animation:orbFloat2 15s ease-in-out infinite;"></div>
<div class="floating-orb orb-pink" style="width:22vw;height:22vw;bottom:12%;left:3%;animation:orbFloat3 17s ease-in-out infinite;"></div>
```

### Section Label + Title (reused across layouts)

```css
.section-label {
    font-family: var(--font-body); font-size: var(--small-size); font-weight: 500;
    letter-spacing: 0.15em; text-transform: uppercase; color: var(--accent-purple);
    margin-bottom: clamp(0.4rem, 0.8vw, 0.6rem);
}
.section-title {
    font-family: var(--font-display); font-size: var(--h2-size);
    font-weight: 700; line-height: 1.15; margin-bottom: clamp(0.4rem, 1vw, 0.8rem);
}
.section-desc {
    font-size: var(--body-size); color: var(--text-secondary); line-height: 1.65;
}
```

### Reveal Delays (use d1-d7 classes instead of inline style)

```css
.reveal { opacity: 0; transform: translateY(25px); transition: opacity var(--duration-normal) var(--ease-out-expo), transform var(--duration-normal) var(--ease-out-expo); }
.slide.visible .reveal { opacity: 1; transform: translateY(0); }
.slide.visible .reveal.d1 { transition-delay: 0.1s; }
.slide.visible .reveal.d2 { transition-delay: 0.2s; }
.slide.visible .reveal.d3 { transition-delay: 0.3s; }
.slide.visible .reveal.d4 { transition-delay: 0.4s; }
.slide.visible .reveal.d5 { transition-delay: 0.5s; }
.slide.visible .reveal.d6 { transition-delay: 0.6s; }
.slide.visible .reveal.d7 { transition-delay: 0.7s; }
```

---

## Layout 1: Title Slide

**Use for:** Opening slide, section dividers, closing slide.

**CSS:**
```css
.title-slide { background: #0B0015; }
.title-slide::after {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 90% 90% at 50% 50%, transparent 40%, rgba(11,0,21,0.6) 100%);
    pointer-events: none; z-index: 0;
}
.title-slide .slide-content {
    align-items: center; text-align: center;
    gap: clamp(0.6rem, 1.5vw, 1.2rem);
}
.title-label {
    font-family: var(--font-body); font-size: var(--small-size); font-weight: 500;
    letter-spacing: 0.35em; text-transform: uppercase; color: rgba(255,255,255,0.6);
}
.title-main {
    font-family: var(--font-display); font-size: var(--title-size);
    font-weight: 800; line-height: 1.05; letter-spacing: -0.025em;
    text-shadow: 0 0 30px rgba(139,92,246,0.3), 0 0 80px rgba(139,92,246,0.15);
}
.title-main em {
    font-style: normal;
    background: linear-gradient(135deg, #a78bfa, #e879f9, #f472b6);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 25px rgba(217,70,239,0.5)) drop-shadow(0 0 60px rgba(139,92,246,0.3));
}
.title-accent {
    width: clamp(40px, 5vw, 56px); height: 3px;
    background: linear-gradient(90deg, var(--accent-orange), var(--accent-pink));
    border-radius: 2px;
    box-shadow: 0 0 12px rgba(255,153,0,0.4), 0 0 30px rgba(217,70,239,0.2);
}
.title-sub {
    font-size: var(--subtitle-size); color: rgba(255,255,255,0.65);
    max-width: min(90vw, 550px); line-height: 1.6;
}
```

**Blob canvas** (4 blobs with color-shifting keyframes):
```css
.blob-canvas { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
.blob { position: absolute; border-radius: 50%; filter: blur(80px); will-change: transform, opacity; }
@keyframes blob1 {
    0%   { transform: translate(0, 0) scale(1);       background: rgba(139,92,246,0.55); }
    25%  { transform: translate(8vw, -12vh) scale(1.2);  background: rgba(217,70,239,0.6); }
    50%  { transform: translate(-5vw, 8vh) scale(0.9);   background: rgba(59,130,246,0.5); }
    75%  { transform: translate(12vw, 5vh) scale(1.15);  background: rgba(236,72,153,0.55); }
    100% { transform: translate(0, 0) scale(1);       background: rgba(139,92,246,0.55); }
}
/* blob2, blob3, blob4: similar pattern with different timings and color sequences */
```

**HTML:**
```html
<section class="slide title-slide">
    <div class="blob-canvas">
        <div class="blob" style="width:55vw;height:55vw;top:-10%;left:40%;background:rgba(139,92,246,0.5);animation:blob1 12s ease-in-out infinite;"></div>
        <div class="blob" style="width:50vw;height:50vw;bottom:-5%;left:-10%;background:rgba(217,70,239,0.45);animation:blob2 15s ease-in-out infinite;"></div>
        <div class="blob" style="width:40vw;height:40vw;top:20%;left:10%;background:rgba(59,80,200,0.4);animation:blob3 18s ease-in-out infinite;"></div>
        <div class="blob" style="width:35vw;height:35vw;bottom:10%;right:5%;background:rgba(236,72,153,0.3);animation:blob4 20s ease-in-out infinite;"></div>
    </div>
    <div class="slide-content">
        <div class="title-label reveal d1">LABEL TEXT</div>
        <h1 class="title-main reveal d2">
            Line One<br><em>Gradient Line</em>
        </h1>
        <div class="title-accent reveal d3"></div>
        <p class="title-sub reveal d4">Subtitle text here</p>
    </div>
</section>
```

**IMPORTANT:** The `<em>` gradient text MUST be on its own line (after `<br>` or in a separate element). Do NOT mix gradient and non-gradient text on the same visual line — browsers may fail to render the gradient.

---

## Layout 2: Content Layout (left title + right pill cards)

**Use for:** Feature lists, capability overviews, any slide with 3-5 key points that benefit from card treatment.

**CSS:**
```css
.content-slide .slide-content { justify-content: center; align-items: center; }
.content-layout {
    display: grid; grid-template-columns: 2fr 3fr;
    gap: clamp(2rem, 5vw, 4rem); align-items: center;
    width: 100%; max-width: min(92vw, 1200px);
}
@media (max-width: 768px) { .content-layout { grid-template-columns: 1fr; } }

.pill-cards { display: flex; flex-direction: column; gap: clamp(0.4rem, 0.9vw, 0.65rem); }
.pill-card {
    display: flex; align-items: center; gap: clamp(0.6rem, 1.2vw, 1rem);
    padding: clamp(0.65rem, 1.3vw, 0.9rem) clamp(0.8rem, 1.5vw, 1.2rem);
    background: var(--card-bg); border: 1px solid var(--card-border);
    border-radius: clamp(10px, 1.2vw, 14px);
    transition: border-color 0.3s, box-shadow 0.3s;
}
.pill-card:hover { border-color: rgba(139,92,246,0.45); box-shadow: 0 0 25px rgba(139,92,246,0.15); }
.pill-icon {
    width: clamp(28px, 3vw, 36px); height: clamp(28px, 3vw, 36px);
    border-radius: clamp(6px, 0.8vw, 10px); flex-shrink: 0;
    background: linear-gradient(135deg, rgba(139,92,246,0.2), rgba(217,70,239,0.12));
    display: flex; align-items: center; justify-content: center;
}
.pill-icon svg { width: 55%; height: 55%; stroke: var(--accent-purple); fill: none; stroke-width: 2; }
.pill-text { font-size: var(--body-size); font-weight: 500; line-height: 1.3; }
.pill-text span { color: var(--text-secondary); font-weight: 400; }
```

**HTML:**
```html
<section class="slide content-slide">
    <div class="floating-orb orb-purple" style="width:30vw;height:30vw;top:8%;right:5%;animation:orbFloat2 15s ease-in-out infinite;"></div>
    <div class="floating-orb orb-pink" style="width:22vw;height:22vw;bottom:12%;left:3%;animation:orbFloat3 17s ease-in-out infinite;"></div>
    <div class="slide-content">
        <div class="content-layout">
            <div>
                <div class="section-label reveal d1">LABEL</div>
                <h2 class="section-title reveal d2">Title<br>Here</h2>
                <p class="section-desc reveal d3">Description text.</p>
            </div>
            <div class="pill-cards">
                <div class="pill-card reveal d2">
                    <div class="pill-icon"><i data-lucide="icon-name"></i></div>
                    <div class="pill-text">Title<br><span>Description</span></div>
                </div>
                <!-- 3-5 pill cards, stagger d2-d6 -->
            </div>
        </div>
    </div>
</section>
```

---

## Layout 3: Stats Row + Feature Grid

**Use for:** Metrics/numbers showcase + supporting feature cards below.

**CSS:**
```css
.stats-row {
    display: flex; width: 100%; max-width: min(90vw, 900px);
    border: 1px solid var(--card-border); border-radius: clamp(10px, 1.2vw, 14px);
    background: var(--card-bg); overflow: hidden;
}
.stat-item {
    flex: 1; text-align: center;
    padding: clamp(0.6rem, 1.5vw, 1.2rem) clamp(0.5rem, 1vw, 1rem);
    border-right: 1px solid rgba(139,92,246,0.15);
}
.stat-item:last-child { border-right: none; }
.stat-value {
    font-family: var(--font-display); font-size: clamp(1.4rem, 3.5vw, 2.6rem);
    font-weight: 800; line-height: 1.1;
    background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.stat-label {
    font-size: var(--small-size); color: var(--text-secondary);
    text-transform: uppercase; letter-spacing: 0.08em;
}

.features-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: clamp(0.4rem, 1vw, 0.7rem); width: 100%; max-width: min(90vw, 900px);
}
@media (max-width: 768px) { .features-grid { grid-template-columns: 1fr; } }
.feature-card {
    background: var(--card-bg); border: 1px solid var(--card-border);
    border-radius: clamp(8px, 1vw, 12px); padding: clamp(0.7rem, 1.5vw, 1.1rem);
    transition: border-color 0.3s, box-shadow 0.3s;
}
.feature-card:hover { border-color: rgba(139,92,246,0.4); box-shadow: 0 0 25px rgba(139,92,246,0.12); }
.feat-icon {
    width: clamp(26px, 2.8vw, 34px); height: clamp(26px, 2.8vw, 34px);
    border-radius: clamp(5px, 0.7vw, 8px);
    background: linear-gradient(135deg, rgba(139,92,246,0.18), rgba(217,70,239,0.1));
    display: flex; align-items: center; justify-content: center;
    margin-bottom: clamp(0.3rem, 0.7vw, 0.5rem); color: var(--accent-purple);
}
.feature-card h3 { font-family: var(--font-display); font-size: var(--h3-size); font-weight: 700; margin-bottom: clamp(0.1rem, 0.3vw, 0.2rem); }
.feature-card p { font-size: var(--small-size); color: var(--text-secondary); line-height: 1.45; }
```

**HTML:**
```html
<section class="slide">
    <div class="floating-orb orb-purple" style="width:25vw;height:25vw;top:12%;left:65%;animation:orbFloat1 16s ease-in-out infinite;"></div>
    <div class="slide-content" style="gap:var(--content-gap);align-items:center;">
        <div class="section-label reveal d1" style="text-align:center;">LABEL</div>
        <h2 class="section-title reveal d2" style="text-align:center;">Title</h2>
        <div class="stats-row reveal d3">
            <div class="stat-item"><div class="stat-value">100K+</div><div class="stat-label">Label</div></div>
            <!-- 3-4 stat items -->
        </div>
        <div class="features-grid">
            <div class="feature-card reveal d4">
                <div class="feat-icon"><i data-lucide="shield"></i></div>
                <h3>Feature</h3><p>Description</p>
            </div>
            <!-- 3 or 6 feature cards -->
        </div>
    </div>
</section>
```

---

## Layout 4: Split Divider

**Use for:** Product introductions, feature deep-dives — left product name + right bullet details.

**CSS:**
```css
.split-layout {
    display: grid; grid-template-columns: 1fr auto 1fr;
    align-items: center; width: 100%; max-width: min(92vw, 1200px); gap: 0;
}
.split-left { padding-right: clamp(1.5rem, 4vw, 3rem); }
.split-product-name {
    font-family: var(--font-display); font-size: var(--h2-size);
    font-weight: 400; line-height: 1.2;
}
.split-product-name strong { font-weight: 800; }
.split-product-sub { font-size: var(--body-size); color: var(--accent-purple); font-weight: 500; }
.split-divider-line {
    width: 1px; height: clamp(120px, 25vh, 250px);
    background: linear-gradient(180deg, transparent, rgba(139,92,246,0.4), rgba(217,70,239,0.3), transparent);
}
.split-right { padding-left: clamp(1.5rem, 4vw, 3rem); }
.split-bullets {
    display: flex; flex-direction: column; gap: clamp(0.8rem, 2vh, 1.5rem); list-style: none;
}
.split-bullets li { font-size: clamp(0.85rem, 1.6vw, 1.15rem); line-height: 1.4; color: var(--text-secondary); }
@media (max-width: 768px) {
    .split-layout { grid-template-columns: 1fr; text-align: center; }
    .split-left { padding-right: 0; margin-bottom: 1rem; }
    .split-divider-line { width: 60%; height: 1px; margin: 0 auto;
        background: linear-gradient(90deg, transparent, rgba(139,92,246,0.4), transparent); }
    .split-right { padding-left: 0; margin-top: 1rem; }
}
```

**HTML:**
```html
<section class="slide">
    <div class="floating-orb orb-purple" style="width:22vw;height:22vw;bottom:10%;left:60%;animation:orbFloat1 15s ease-in-out infinite;"></div>
    <div class="slide-content" style="justify-content:center;align-items:center;">
        <div class="split-layout">
            <div class="split-left">
                <div class="section-label reveal d1">LABEL</div>
                <div class="split-product-name reveal d2">Product<br><strong>Name</strong></div>
                <div class="split-product-sub reveal d3">Tagline</div>
            </div>
            <div class="split-divider-line reveal d2"></div>
            <div class="split-right">
                <ul class="split-bullets">
                    <li class="reveal d3">Bullet point one</li>
                    <li class="reveal d4">Bullet point two</li>
                    <!-- 3-5 items -->
                </ul>
            </div>
        </div>
    </div>
</section>
```

---

## Layout 5: Pipeline Columns

**Use for:** Multi-stage processes, platform architecture, feature categories shown as N equal columns with color gradient bars.

**CSS:**
```css
.pipeline-row {
    display: grid; grid-template-columns: repeat(5, 1fr);
    gap: clamp(0.4rem, 1vw, 0.8rem); width: 100%; max-width: min(92vw, 1100px);
}
.pipeline-col { text-align: center; }
.pipeline-col-title {
    font-family: var(--font-display); font-size: var(--small-size);
    font-weight: 700; margin-bottom: clamp(0.3rem, 0.6vw, 0.5rem); line-height: 1.3;
}
.pipeline-bar {
    height: clamp(3px, 0.5vw, 5px); border-radius: 3px;
    margin-bottom: clamp(0.4rem, 0.8vw, 0.6rem);
}
.pipeline-items { display: flex; flex-direction: column; gap: clamp(0.2rem, 0.4vw, 0.35rem); }
.pipeline-items span { font-size: var(--small-size); color: var(--text-secondary); line-height: 1.3; }
.pipeline-footer {
    width: 100%; max-width: min(92vw, 1100px); text-align: center;
    font-size: var(--small-size); color: var(--text-secondary);
    letter-spacing: 0.15em; text-transform: uppercase;
    padding-top: clamp(0.5rem, 1vw, 0.8rem); border-top: 1px solid rgba(255,255,255,0.1);
}
@media (max-width: 768px) { .pipeline-row { grid-template-columns: repeat(2, 1fr); } }
```

**HTML:**
```html
<section class="slide">
    <div class="floating-orb orb-pink" style="width:20vw;height:20vw;top:8%;right:10%;animation:orbFloat3 17s ease-in-out infinite;"></div>
    <div class="slide-content" style="align-items:center;gap:var(--content-gap);">
        <h2 class="section-title reveal d1" style="text-align:center;">Title</h2>
        <p class="reveal d2" style="text-align:center;font-size:var(--subtitle-size);color:var(--text-secondary);">Subtitle</p>
        <div class="pipeline-row">
            <div class="pipeline-col reveal d3">
                <div class="pipeline-col-title">Column Title</div>
                <div class="pipeline-bar" style="background:linear-gradient(90deg,#3b82f6,#6366f1);"></div>
                <div class="pipeline-items"><span>Item 1</span><span>Item 2</span></div>
            </div>
            <!-- Repeat for each column, gradient colors shift: blue→indigo→purple→violet→pink -->
        </div>
        <div class="pipeline-footer reveal d7">Footer text</div>
    </div>
</section>
```

---

## Layout 6: Quote

**Use for:** Executive quotes, key insights, bold statements.

**CSS:**
```css
.quote-slide .slide-content { align-items: center; text-align: center; gap: var(--content-gap); }
.quote-mark {
    font-family: var(--font-display); font-size: clamp(3rem, 8vw, 6rem);
    line-height: 1; font-weight: 800;
    background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    opacity: 0.5;
}
.quote-text {
    font-family: var(--font-display); font-size: clamp(1.1rem, 2.5vw, 2rem);
    font-weight: 500; line-height: 1.5; max-width: min(85vw, 800px); color: rgba(255,255,255,0.9);
}
.quote-attr { font-size: var(--body-size); color: var(--text-secondary); }
.quote-attr strong { color: var(--text-primary); font-weight: 600; }
```

**HTML:**
```html
<section class="slide quote-slide">
    <div class="floating-orb orb-purple" style="width:28vw;height:28vw;top:15%;left:5%;animation:orbFloat2 16s ease-in-out infinite;"></div>
    <div class="floating-orb orb-pink" style="width:20vw;height:20vw;bottom:10%;right:8%;animation:orbFloat1 14s ease-in-out infinite;"></div>
    <div class="slide-content">
        <div class="quote-mark reveal d1">"</div>
        <p class="quote-text reveal d2">Quote text here.</p>
        <div class="quote-attr reveal d3"><strong>Name</strong> — Title</div>
    </div>
</section>
```

---

## Layout 7: Big Number Hero

**Use for:** Single impressive metric, adoption numbers, key statistics.

**CSS:**
```css
.bignumber-slide .slide-content { align-items: center; text-align: center; gap: clamp(0.4rem, 1vw, 0.8rem); }
.bignumber {
    font-family: var(--font-display); font-size: clamp(4rem, 14vw, 12rem);
    font-weight: 800; line-height: 1;
    background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink), var(--accent-orange));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    filter: drop-shadow(0 0 40px rgba(139,92,246,0.3));
}
.bignumber-label { font-family: var(--font-display); font-size: var(--h2-size); font-weight: 700; }
.bignumber-desc {
    font-size: var(--subtitle-size); color: var(--text-secondary);
    max-width: min(80vw, 600px); line-height: 1.6;
}
```

**HTML:**
```html
<section class="slide bignumber-slide">
    <div class="floating-orb orb-purple" style="width:35vw;height:35vw;top:5%;right:15%;animation:orbFloat3 18s ease-in-out infinite;"></div>
    <div class="slide-content">
        <div class="section-label reveal d1">LABEL</div>
        <div class="bignumber reveal d2">100K+</div>
        <div class="bignumber-label reveal d3">Description headline</div>
        <p class="bignumber-desc reveal d4">Supporting paragraph text.</p>
    </div>
</section>
```

---

## Layout 8: Comparison Split

**Use for:** Side-by-side comparison of two options, products, or approaches.

**CSS:**
```css
.compare-slide .slide-content { align-items: center; gap: var(--content-gap); }
.compare-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: clamp(0.8rem, 2vw, 1.5rem); width: 100%; max-width: min(92vw, 1000px);
}
.compare-card {
    background: var(--card-bg); border: 1px solid var(--card-border);
    border-radius: clamp(10px, 1.2vw, 16px); padding: clamp(1rem, 2.5vw, 2rem);
}
.compare-card-title {
    font-family: var(--font-display); font-size: var(--h3-size);
    font-weight: 700; margin-bottom: clamp(0.5rem, 1vw, 0.8rem);
    display: flex; align-items: center; gap: clamp(0.3rem, 0.6vw, 0.5rem);
}
.compare-dot {
    width: clamp(8px, 1vw, 12px); height: clamp(8px, 1vw, 12px);
    border-radius: 50%; flex-shrink: 0;
}
.compare-list {
    list-style: none; display: flex; flex-direction: column;
    gap: clamp(0.3rem, 0.7vw, 0.5rem);
}
.compare-list li {
    font-size: var(--body-size); color: var(--text-secondary);
    padding-left: clamp(0.8rem, 1.5vw, 1.2rem); position: relative;
}
.compare-list li::before {
    content: ''; position: absolute; left: 0; top: clamp(0.35rem, 0.7vw, 0.5rem);
    width: clamp(4px, 0.5vw, 6px); height: clamp(4px, 0.5vw, 6px);
    border-radius: 50%; background: var(--accent-purple);
}
@media (max-width: 768px) { .compare-grid { grid-template-columns: 1fr; } }
```

**HTML:**
```html
<section class="slide compare-slide">
    <div class="floating-orb orb-pink" style="width:22vw;height:22vw;top:12%;left:8%;animation:orbFloat2 15s ease-in-out infinite;"></div>
    <div class="slide-content">
        <div class="section-label reveal d1" style="text-align:center;">LABEL</div>
        <h2 class="section-title reveal d2" style="text-align:center;">Title</h2>
        <div class="compare-grid">
            <div class="compare-card reveal d3">
                <div class="compare-card-title">
                    <div class="compare-dot" style="background:var(--accent-purple);"></div>
                    Option A
                </div>
                <ul class="compare-list">
                    <li>Point 1</li><li>Point 2</li>
                </ul>
            </div>
            <div class="compare-card reveal d4">
                <div class="compare-card-title">
                    <div class="compare-dot" style="background:var(--accent-pink);"></div>
                    Option B
                </div>
                <ul class="compare-list">
                    <li>Point 1</li><li>Point 2</li>
                </ul>
            </div>
        </div>
    </div>
</section>
```

---

## Layout 9: Process Flow

**Use for:** Step-by-step workflows, how-it-works, numbered sequences (3-6 steps).

**CSS:**
```css
.process-slide .slide-content { align-items: center; gap: var(--content-gap); }
.process-row {
    display: flex; align-items: flex-start;
    width: 100%; max-width: min(92vw, 1100px); gap: 0; position: relative;
}
.process-step { flex: 1; text-align: center; position: relative; padding: 0 clamp(0.3rem, 0.8vw, 0.6rem); }
.step-num {
    width: clamp(32px, 4vw, 48px); height: clamp(32px, 4vw, 48px);
    border-radius: 50%; margin: 0 auto clamp(0.4rem, 0.8vw, 0.6rem);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-display); font-size: var(--body-size); font-weight: 800;
    background: linear-gradient(135deg, rgba(139,92,246,0.2), rgba(217,70,239,0.15));
    border: 1px solid var(--card-border); position: relative; z-index: 1;
}
.process-step:not(:last-child)::after {
    content: ''; position: absolute;
    top: clamp(16px, 2vw, 24px); left: calc(50% + clamp(20px, 2.5vw, 30px));
    width: calc(100% - clamp(40px, 5vw, 60px)); height: 1px;
    background: linear-gradient(90deg, rgba(139,92,246,0.3), rgba(217,70,239,0.2)); z-index: 0;
}
.step-title { font-family: var(--font-display); font-size: var(--h3-size); font-weight: 700; margin-bottom: clamp(0.15rem, 0.3vw, 0.25rem); }
.step-desc { font-size: var(--small-size); color: var(--text-secondary); line-height: 1.4; }
@media (max-width: 768px) {
    .process-row { flex-direction: column; gap: clamp(0.5rem, 1.5vw, 1rem); align-items: center; }
    .process-step { width: 100%; max-width: 300px; }
    .process-step:not(:last-child)::after { display: none; }
}
```

**HTML:**
```html
<section class="slide process-slide">
    <div class="floating-orb orb-purple" style="width:24vw;height:24vw;bottom:15%;right:5%;animation:orbFloat1 16s ease-in-out infinite;"></div>
    <div class="slide-content">
        <div class="section-label reveal d1" style="text-align:center;">LABEL</div>
        <h2 class="section-title reveal d2" style="text-align:center;">Title</h2>
        <div class="process-row">
            <div class="process-step reveal d3">
                <div class="step-num">1</div>
                <div class="step-title">Step One</div>
                <div class="step-desc">Description text</div>
            </div>
            <!-- 3-6 steps, stagger d3-d7 -->
        </div>
    </div>
</section>
```

---

## Layout 10: Timeline Zigzag

**Use for:** Chronological events, milestones, evolution history (5 points).

**CSS:**
```css
.timeline {
    width: 100%; max-width: min(92vw, 1100px);
    display: grid; grid-template-rows: auto auto auto; grid-template-columns: repeat(5, 1fr);
    row-gap: 0; column-gap: 0;
}
.tl-top { grid-row: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
.tl-top .tl-card { margin-bottom: clamp(0.5rem, 1.2vw, 1rem); }
.tl-top.empty { visibility: hidden; }
.tl-mid {
    grid-row: 2; display: flex; align-items: center; justify-content: center;
    position: relative; height: clamp(20px, 2.5vw, 30px);
}
.tl-mid::before {
    content: ''; position: absolute; left: 0; right: 0;
    top: 50%; height: 3px; transform: translateY(-50%); background: rgba(139,92,246,0.3);
}
.tl-dot {
    width: clamp(14px, 1.6vw, 20px); height: clamp(14px, 1.6vw, 20px);
    border-radius: 50%; border: 2.5px solid currentColor;
    background: var(--bg-primary); position: relative; z-index: 1;
    box-shadow: 0 0 14px currentColor;
}
.tl-bot { grid-row: 3; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; }
.tl-bot .tl-card { margin-top: clamp(0.5rem, 1.2vw, 1rem); }
.tl-bot.empty { visibility: hidden; }
.tl-stem-up { width: 2px; height: clamp(16px, 3vh, 30px); background: linear-gradient(180deg, transparent, currentColor); }
.tl-stem-down { width: 2px; height: clamp(16px, 3vh, 30px); background: linear-gradient(180deg, currentColor, transparent); }
.tl-card { text-align: center; padding: 0 clamp(0.2rem, 0.5vw, 0.4rem); }
.tl-year { font-family: var(--font-display); font-size: var(--h3-size); font-weight: 800; color: currentColor; }
.tl-desc { font-size: var(--small-size); color: var(--text-secondary); line-height: 1.35; }
/* Per-column colors (blue→purple→violet→pink→rose) */
.tl-col1 { color: #3b82f6; } .tl-col2 { color: #8b5cf6; } .tl-col3 { color: #a855f7; }
.tl-col4 { color: #d946ef; } .tl-col5 { color: #ec4899; }
```

**HTML:** Odd columns show cards above the line (top), even columns show cards below (bottom).

```html
<section class="slide">
    <div class="slide-content" style="align-items:center;gap:clamp(1.5rem,3vw,2.5rem);">
        <div class="section-label reveal d1" style="text-align:center;">LABEL</div>
        <h2 class="section-title reveal d2" style="text-align:center;">Title</h2>
        <div class="timeline reveal d3">
            <!-- Row 1: top cards -->
            <div class="tl-top tl-col1">
                <div class="tl-card"><div class="tl-year">2020</div><div class="tl-desc">Event</div></div>
                <div class="tl-stem-up"></div>
            </div>
            <div class="tl-top tl-col2 empty"><!-- hidden --></div>
            <div class="tl-top tl-col3">
                <div class="tl-card"><div class="tl-year">2023</div><div class="tl-desc">Event</div></div>
                <div class="tl-stem-up"></div>
            </div>
            <!-- ... -->
            <!-- Row 2: center dots (all columns) -->
            <div class="tl-mid tl-col1"><div class="tl-dot"></div></div>
            <div class="tl-mid tl-col2"><div class="tl-dot"></div></div>
            <!-- ... -->
            <!-- Row 3: bottom cards (even cols) -->
            <div class="tl-bot tl-col1 empty"><!-- hidden --></div>
            <div class="tl-bot tl-col2">
                <div class="tl-stem-down"></div>
                <div class="tl-card"><div class="tl-year">2022</div><div class="tl-desc">Event</div></div>
            </div>
            <!-- ... -->
        </div>
    </div>
</section>
```

---

## Layout Selection Guide

| Content Type | Recommended Layout |
|-------------|-------------------|
| 3-5 key capabilities/features | **Content Layout** (pill cards) |
| Key metrics + supporting features | **Stats Row + Feature Grid** |
| Product intro with bullet details | **Split Divider** |
| Multi-stage architecture/platform | **Pipeline Columns** |
| Executive quote or bold statement | **Quote** |
| Single impressive number | **Big Number Hero** |
| Two-option comparison | **Comparison Split** |
| Step-by-step workflow | **Process Flow** |
| Chronological milestones | **Timeline Zigzag** |
| Section opener, opening, closing | **Title Slide** |

**Rule: Never use plain left-aligned bullet lists.** Always wrap content in one of these layouts. If content doesn't fit any layout, use Content Layout (pill cards) as the default.
