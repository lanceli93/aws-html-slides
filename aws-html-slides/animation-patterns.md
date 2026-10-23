# Animation Patterns Reference

Use this reference when generating presentations. Match animations to the intended feeling.

## Effect-to-Feeling Guide

The re:Invent theme (see [design-system.md](design-system.md)) sits in the "Dramatic /
Cinematic" and "Editorial / Magazine" rows below — dark stage, one gradient focal point,
choreographed reveals. Use the others when a slide needs to borrow a different feeling.

| Feeling | Animations | Visual Cues |
|---------|-----------|-------------|
| **Dramatic / Cinematic** | Slow fade-ins (1-1.5s), large scale transitions (0.9 to 1), parallax scrolling | Dark backgrounds, spotlight effects, full-bleed images |
| **Playful / Friendly** | Bouncy easing (spring physics), floating/bobbing | Rounded corners, pastel/bright colors, hand-drawn elements |
| **Professional / Corporate** | Subtle fast animations (200-300ms), clean slides | Navy/slate/charcoal, precise spacing, data visualization focus |
| **Calm / Minimal** | Very slow subtle motion, gentle fades | High whitespace, muted palette, serif typography, generous padding |
| **Editorial / Magazine** | Staggered text reveals, image-text interplay | Strong type hierarchy, pull quotes, grid-breaking layouts, serif headlines + sans body |

## Entrance Animations

```css
/* Fade + Slide Up (most versatile) */
.reveal {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s var(--ease-out-expo),
                transform 0.6s var(--ease-out-expo);
}
.visible .reveal {
    opacity: 1;
    transform: translateY(0);
}

/* Scale In */
.reveal-scale {
    opacity: 0;
    transform: scale(0.9);
    transition: opacity 0.6s, transform 0.6s var(--ease-out-expo);
}

/* Slide from Left */
.reveal-left {
    opacity: 0;
    transform: translateX(-50px);
    transition: opacity 0.6s, transform 0.6s var(--ease-out-expo);
}

/* Blur In */
.reveal-blur {
    opacity: 0;
    filter: blur(10px);
    transition: opacity 0.8s, filter 0.8s var(--ease-out-expo);
}
```

## Background Effects

```css
/* Gradient Mesh — layered radial gradients for depth */
.gradient-bg {
    background:
        radial-gradient(ellipse at 20% 80%, rgba(120, 0, 255, 0.3) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(0, 255, 200, 0.2) 0%, transparent 50%),
        var(--bg-primary);
}

/* Noise Texture — inline SVG for grain */
.noise-bg {
    background-image: url("data:image/svg+xml,..."); /* Inline SVG noise */
}

/* Grid Pattern — subtle structural lines */
.grid-bg {
    background-image:
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 50px 50px;
}
```

## Animated Blob Backgrounds (re:Invent Keynote style)

Large blurred color blobs that drift, scale, and shift colors independently. Creates an organic, living background.

```css
/* Container to hold blobs — clips overflow */
.blob-canvas {
    position: absolute; inset: 0; overflow: hidden;
    pointer-events: none; z-index: 0;
}
.blob {
    position: absolute; border-radius: 50%;
    filter: blur(80px);
    will-change: transform, opacity;
}

/* Each blob animates position + scale + color independently */
@keyframes blob1 {
    0%   { transform: translate(0, 0) scale(1);       background: rgba(139,92,246,0.55); }
    25%  { transform: translate(8vw, -12vh) scale(1.2);  background: rgba(217,70,239,0.6); }
    50%  { transform: translate(-5vw, 8vh) scale(0.9);   background: rgba(59,130,246,0.5); }
    75%  { transform: translate(12vw, 5vh) scale(1.15);  background: rgba(236,72,153,0.55); }
    100% { transform: translate(0, 0) scale(1);       background: rgba(139,92,246,0.55); }
}
```

**Key rules:**
- 3-4 blobs per slide, each with a unique keyframe (different durations: 12-20s)
- Movement range: `8-12vw` / `6-12vh`, scale: `0.8x-1.3x`
- Color shifts between theme palette colors (purple → pink → blue → orange)
- Use for title/divider slides; content slides use subtler floating orbs
- Wrap in `.blob-canvas` with `overflow: hidden` to prevent layout issues

## Signature Motion Patterns (used across the flavor previews)

These are the high-impact patterns shipped across the `preview/{1-aurora,2-spatial,
3-pulse}-{keynote,bigdata}.html` decks and their `flavors/` kits. Copy them verbatim;
every one has a `prefers-reduced-motion` fallback — and, per
[engine/ENGINE.md](engine/ENGINE.md), a `.slide.is-final` rule so it also looks
finished in the overview, print and the editor.

All of these trigger **on slide enter**, via the Stage Engine — not a scroll
IntersectionObserver. Register with `Stage.hook(scene, { enter(slide, ctx) { … } })`;
`ctx.raf`/`ctx.cleanup` start and stop the loop automatically as the slide is entered
and left.

### Border Beam (rotating conic border highlight)

Marks ONE hero card per deck (e.g. the bento hero). Needs `@property` for the
animatable angle; degrades to a static border where unsupported. Purely CSS, so it
needs no hook — just a `.slide.is-final .beam-border::before` rule if the resting
frame (angle 0) isn't an acceptable "finished" look.

```css
@property --beam-angle { syntax:'<angle>'; initial-value:0deg; inherits:false; }
.beam-border { position:relative; }
.beam-border::before { content:''; position:absolute; inset:-1px; border-radius:inherit; padding:1.5px;
  background:conic-gradient(from var(--beam-angle), transparent 0 62%, var(--accent-1) 78%, var(--accent-2) 92%, transparent 100%);
  -webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite:xor; mask-composite:exclude;
  animation:beamSpin 5s linear infinite; pointer-events:none; }
@keyframes beamSpin { to { --beam-angle:360deg; } }
@media (prefers-reduced-motion:reduce){ .beam-border::before { animation:none; } }
```

### Count-Up Numbers

Handled by the engine — wrap the numeric part only:
`<span class="count" data-count="92" data-suffix="%">92</span>` (the HTML text must
already be the final value). The engine counts up on every entry and shows the final
value instantly in reduced motion, the overview and print. See `engine/ENGINE.md` §2
"Counters" — no hand-rolled trigger code needed.

### Spotlight Cards (cursor-tracking radial glow)

```css
.spot-card { position:relative; overflow:hidden; }
.spot-card::before { content:''; position:absolute; inset:0; opacity:0; transition:opacity .35s;
  background:radial-gradient(240px circle at var(--mx,50%) var(--my,50%), var(--spot-color), transparent 60%);
  pointer-events:none; }
.spot-card:hover::before { opacity:1; }
```
```js
card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
});
```

Hover-driven, so there's no entry state to replay — `.slide.is-final` just needs
`opacity:0` on `::before` (the resting state), which it already is.

### Kinetic Title (per-char / per-word rise)

Prefer the engine's own splitter — `data-split="words"` (or `"chars"`) on the
headline — over a hand-rolled version; see `engine/ENGINE.md` §2 "Reveals". If you
still need a custom variant, wrap pieces in spans with an index custom property:
`<span class="tw" style="--i:2">the</span>`, gate on `.is-active`/`.is-leaving` so it
replays with the Stage Engine, and add a `.slide.is-final .tw` rule that forces the
rest state. NEVER split a gradient-clipped `<em>` across spans — wrap the whole `<em>`
in one span (`rv-mask`, per the engine, already refuses to split these).

```css
.title-main .tw { display:inline-block; opacity:0; transform:translateY(.5em); filter:blur(8px); }
:is(.is-active,.is-leaving) .title-main .tw { animation:wordRise .8s var(--ease-out-expo) both;
  animation-delay:calc(var(--i) * 90ms); }
@keyframes wordRise { to { opacity:1; transform:none; filter:blur(0); } }
@media (prefers-reduced-motion:reduce){ .title-main .tw { opacity:1; transform:none; filter:none; } }
.slide.is-final .title-main .tw { opacity:1; transform:none; filter:none; }
```

### Marquee (infinite scrolling keyword strip)

Duplicate the item sequence TWICE inside the track, then translate -50%.
Full-bleed with soft mask edges; second row reversed at a different speed. Purely
CSS-looped, so `.slide.is-final` is automatic (`.is-final` jumps the keyframe
animation to its last frame per the engine's final-state rule) — no extra rule needed.

```css
.marquee { width:100vw; margin-left:calc(50% - 50vw); overflow:hidden;
  -webkit-mask:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);
          mask:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent); }
.marquee-track { display:flex; align-items:center; gap:clamp(1.2rem,3vw,2.6rem);
  width:max-content; animation:marqueeMove 32s linear infinite; }
.marquee-track.rev { animation-direction:reverse; animation-duration:40s; }
@keyframes marqueeMove { to { transform:translateX(-50%); } }
@media (prefers-reduced-motion:reduce){ .marquee-track { animation:none; } }
```

### Text Scramble / Decode

For short monospace labels only (HUD strips, terminal chrome). Decode
left→right over ~900ms from a charset like `!<>-_\/[]{}—=+*^?#0123456789`, driven by
`ctx.raf` inside the slide's `enter` hook. Reduced-motion and `final(slide)` both set
the final text immediately.

### Terminal Typing

`.term-line[data-type]` elements typed sequentially (~28ms/char) with a block
cursor on the active line, started from the slide's `enter` hook (`ctx.wait` between
lines, stopped automatically via `ctx.alive()` on leave). Reduced-motion and
`final(slide)` render all lines instantly.

## Interactive Effects

```javascript
/* 3D Tilt on Hover — adds depth to cards/panels */
class TiltEffect {
    constructor(element) {
        this.element = element;
        this.element.style.transformStyle = 'preserve-3d';
        this.element.style.perspective = '1000px';

        this.element.addEventListener('mousemove', (e) => {
            const rect = this.element.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            this.element.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
        });

        this.element.addEventListener('mouseleave', () => {
            this.element.style.transform = 'rotateY(0) rotateX(0)';
        });
    }
}
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Fonts not loading | Check Fontshare/Google Fonts URL; ensure font names match in CSS |
| Animations not triggering | Check the hook is registered for the right `data-scene` key and that `.is-active` is landing on the slide (see `engine/ENGINE.md`) |
| Mobile issues | Disable heavy effects at 768px breakpoint; test touch events; reduce particle count |
| Performance issues | Use `will-change` sparingly; prefer `transform`/`opacity` animations; keep loops in `ctx.raf` so they stop on leave |
