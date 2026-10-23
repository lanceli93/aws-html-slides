/* ===================================================================
   AURORA FLAVOR KIT — JS   (paste verbatim AFTER stage-engine.js [+ inline-editor.js])
   • Motif: ONE fixed WebGL canvas of silk light ribbons. Each slide declares
     its composition with  data-ribbons="preset key:value …"  (or a data-scene
     that matches a preset). The field tweens there on every Stage.onChange.
     Events in the same attribute: burst:<s> (flare at s seconds after entry),
     heal:<s> (fractured → whole sweep, left→right, starting at s seconds).
   • Thumbnails: renders each slide's ribbon composition once, offscreen, and
     prepends it to data-thumb, so the overview and print show the real motif.
   • Components: .acc[data-cycle] (accordion),
     .trail-steps (light-trail timing), svg[data-au-dots], [data-au-icons],
     .spot (cursor spotlight). All have final states.
   • Transition: the default dissolve WITHOUT fading the incoming slide's
     opacity (an opacity<1 ancestor kills backdrop-filter on glass).
   API: window.Aurora — see flavors/aurora/README.md.
   =================================================================== */
(function () {
'use strict';
var Stage = window.Stage, D = document, html = D.documentElement;
if (!Stage) return console.warn('[aurora] load stage-engine.js first');
if (window.Aurora) return;

/* ------------------------------------------------------------------
   PRESETS — field origin ox/oy (viewport-height units, 0 = centre),
   ang (rad), int (brightness), spread (fan of the 7 ribbons), amp (wave),
   hue (palette shift: <0 cooler/violet, >0 warmer/orange), flare (0..1
   converge into a core), speed, sweep (1.2 whole … -0.2 fractured)
   ------------------------------------------------------------------ */
var BASE = { ox: 0, oy: 0, ang: 0, int: .6, spread: .6, amp: .7, hue: .05, flare: 0, speed: .85, sweep: 1.2 };
var PRESETS = {
  hero:     { ox: .30, oy: -.06, ang: .36, int: 1.25, spread: 1, amp: 1, hue: 0, speed: 1 },          // cover: full diagonal sweep behind a left-aligned title
  horizon:  { ox: 0, oy: -.23, ang: -.06, int: 1.2, spread: 1, amp: 1, hue: 0, speed: 1 },           // cover: band under a centred title
  diagonal: { ox: -.62, oy: -.10, ang: 1.05, int: .72, spread: .8, amp: .85, hue: .04 },              // steep on the left (agenda, split layouts)
  floor:    { ox: .05, oy: -.43, ang: .04, int: .62, spread: .42, amp: .55, hue: -.06, speed: .8 },   // low along the bottom (dense data slides)
  through:  { ox: -.46, oy: 0, ang: .62, int: .62, spread: .5, amp: .7, hue: .08, speed: .9 },        // crossing the left third (a thin-glass hero cell there)
  corner:   { ox: .52, oy: .40, ang: -.34, int: .55, spread: .62, amp: .75, hue: .14, speed: .9 },   // top-right corner (process / flow)
  left:     { ox: -.55, oy: -.12, ang: .42, int: .62, spread: .6, amp: .7, hue: .08 },
  right:    { ox: .55, oy: .22, ang: -.45, int: .62, spread: .7, amp: .75, hue: .2, speed: .8 },
  curtain:  { ox: 0, oy: -.05, ang: 1.5, int: .48, spread: 1.7, amp: .55, hue: .06, speed: .8 },     // vertical light columns (accordions, pillars)
  runway:   { ox: 0, oy: -.40, ang: .05, int: .58, spread: .45, amp: .55, hue: .14, speed: 1.25 },   // fast low band (timelines)
  announce: { ox: 0, oy: .02, ang: 0, int: 1.1, spread: .95, amp: 1, hue: .16, flare: 1, speed: 1.15 }, // converge into a bright core (product reveal)
  converge: { ox: 0, oy: -.02, ang: 0, int: .95, spread: .9, amp: .9, hue: .22, flare: .7, speed: .55 }, // softer core (sign-off)
  calm:     { ox: 0, oy: -.40, ang: -.05, int: .55, spread: .6, amp: .6, hue: .24, speed: .32 },     // slow, warm, low (quote / closing)
  fracture: { ox: .30, oy: .02, ang: .22, int: .95, spread: 1, amp: .9, hue: -.12, speed: .45, sweep: -.2 }, // broken, cold (problem slides)
  heal:     { ox: 0, oy: -.33, ang: .03, int: .85, spread: .62, amp: .7, hue: .04, speed: .9 },     // use with heal:<s> after a fracture slide
  off:      { int: 0 }
};
var KEYS = Object.keys(BASE);
var EVENTS = { burst: 1, burstv: 1, heal: 1, healdur: 1 };

// "announce burst:1.35 int:1.2" → { cfg:{…}, ev:{burst:1.35} }
function parse(str, fallback) {
  var cfg = Object.assign({}, BASE), ev = {}, used = false;
  String(str || '').split(/[\s;,]+/).forEach(function (tok) {
    if (!tok) return;
    var kv = tok.split(':');
    if (kv.length === 1) { if (PRESETS[tok]) { Object.assign(cfg, PRESETS[tok]); used = true; } return; }
    var k = kv[0].trim(), v = parseFloat(kv[1]);
    if (isNaN(v)) return;
    if (EVENTS[k]) ev[k] = v; else if (k in BASE) { cfg[k] = v; used = true; }
  });
  if (!used && fallback) return parse(fallback);
  return { cfg: cfg, ev: ev };
}
function configOf(slide) {
  var key = slide.dataset.ribbons || '', sc = slide.dataset.scene || '';
  return parse(key || (PRESETS[sc] ? sc : ''), 'calm');
}

/* ------------------------------------------------------------------
   SHADER — 7 twisting ribbons × 7 filaments, silk sheen, travelling light,
   optional convergence flare, burst, and a left→right fracture/heal front.
   ------------------------------------------------------------------ */
var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
var FS = [
  'precision highp float;',
  'uniform vec2 uRes;uniform float uT,uAng,uInt,uSpread,uAmp,uHue,uFlare,uBurst,uSweep;uniform vec2 uOff,uMouse;',
  '#define NR 7',
  'vec3 pal(float g){g=clamp(g,0.,1.)*4.;',                      // blue → violet → magenta → pink → AWS orange
  ' vec3 c=mix(vec3(.25,.42,.98),vec3(.55,.36,.97),clamp(g,0.,1.));',
  ' c=mix(c,vec3(.85,.28,.94),clamp(g-1.,0.,1.));',
  ' c=mix(c,vec3(.97,.42,.66),clamp(g-2.,0.,1.));',
  ' return mix(c,vec3(1.,.62,.12),clamp(g-3.,0.,1.));}',
  'float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}',
  'float pinch(float x){return mix(1.,.03+.97*smoothstep(0.,1.15,abs(x)),uFlare);}',
  'float ry(float x,float k,float fk){',
  ' float b=(fk-.5)*.62*uSpread;',
  ' float w=.15*sin(x*1.05+uT*.30+k*.93)+.065*sin(x*2.25-uT*.46+k*2.1)+.028*sin(x*4.4+uT*.71+k*3.7);',
  ' return (b+w*uAmp)*pinch(x);}',
  'void main(){',
  ' vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;',
  ' vec2 uv=gl_FragCoord.xy/uRes;',
  ' float fe=smoothstep(uSweep-.05,uSweep+.05,uv.x);',                          // 1 = fractured, 0 = whole
  ' float seam=exp(-abs(uv.x-uSweep)*24.)*step(-.1,uSweep)*step(uSweep,1.1);',   // light at the healing front
  ' vec2 q=p-uOff-uMouse*.03;',
  ' float c=cos(uAng),s=sin(uAng);q=vec2(c*q.x+s*q.y,-s*q.x+c*q.y);',
  ' float px=1./uRes.y;vec3 col=vec3(0.);',
  ' for(int i=0;i<NR;i++){',
  '  float k=float(i),fk=k/float(NR-1);',
  '  float sg=floor(q.x/.36+50.),sx=fract(q.x/.36+50.);',
  '  float jit=((hash(vec2(sg,k*3.1))-.5)*.2+(sx-.5)*(hash(vec2(k,sg*1.7))-.5)*.16)*fe;',
  '  float y=ry(q.x,k,fk)+jit,y2=ry(q.x+.004,k,fk)+jit,dy=(y2-y)/.004;',
  '  float d=(q.y-y)/sqrt(1.+dy*dy);',
  '  float tw=sin(q.x*1.5+uT*.38+k*1.31);',                                       // twist: width collapses edge-on
  '  float pin=pinch(q.x);',
  '  float wd=(.009+.075*abs(tw))*(.3+.7*pin)*(.55+.45*uSpread);',
  '  float sd=d/wd,eo=1.-abs(tw);',
  '  float body=exp(-sd*sd*1.2)*(.06+.42*eo*eo)*(.62+.38*cos(sd*7.+k*1.7));',        // silk sheet
  '  float str=0.;',
  '  for(int j=0;j<7;j++){float sj=(float(j)-3.)/3.;float dd=abs(d-sj*wd);',
  '   float bb=.55+.45*sin(k*7.13+float(j)*3.31);',
  '   str+=bb*(1.-.45*sj*sj)*(exp(-dd/(px*1.3))*.95+px*1.6/(dd+px*5.)*.12);}',       // filaments + bloom tail
  '  float tr=.5+.5*sin(q.x*1.35-uT*1.05+k*2.4);tr*=tr;tr*=tr;',                     // light travelling along
  '  float lum=.28+1.5*tr*(1.-.7*fe);',
  '  float g=fk*.36+(q.x*.34+.40)+uHue;',
  '  float halo=exp(-abs(d)*5.)*.03+exp(-abs(d)/(wd+.012))*.10;',
  '  vec3 rc=mix(pal(g),pal(g+.3),tr);rc=mix(rc,vec3(1.,.9,.95),tr*tr*.35);',
  '  rc=mix(rc,vec3(dot(rc,vec3(.3,.45,.25)))*vec3(.72,.76,.95),fe*.72);',
  '  float gm=smoothstep(.05,.14,sx)*smoothstep(.05,.14,1.-sx)*(.2+.8*hash(vec2(k,sg+7.)));',
  '  float seg=mix(1.,gm,fe);',
  '  col+=rc*((body+str*.5)*seg+halo*(1.-.8*fe))*lum*(1.+2.6*seam);}',
  ' float rr=length(q);',
  ' vec3 cc=mix(vec3(1.,.93,.98),pal(.72+uHue*.3),.35);',
  ' col+=cc*uFlare*(.004/(rr*rr+.004))*.6;',
  ' col+=pal(.62)*uFlare*exp(-abs(q.y)*110.)*exp(-abs(q.x)*1.3)*.9;',                  // anamorphic streak
  ' col+=cc*uBurst*((.04/(rr*rr+.04))*2.4+.18)+vec3(1.,.85,.95)*uBurst*exp(-abs(q.y)*60.)*exp(-abs(q.x)*.5)*1.6;',
  ' col*=uInt;col=1.-exp(-col*1.35);',
  ' vec3 bg=mix(vec3(.012,.008,.02),vec3(.043,0.,.085),uv.y*.8);',
  ' bg+=pal(.3+uHue)*.06*exp(-length(p-uOff)*1.6)*min(uInt,1.)*(1.-.6*fe);',
  ' col+=bg;',
  ' float v=length((uv-.5)*vec2(1.1,1.25));col*=clamp(1.-.75*v*v,0.,1.);',
  ' col+=(hash(gl_FragCoord.xy+fract(uT))-.5)*(2./255.);',
  ' gl_FragColor=vec4(col,1.);}'
].join('\n');
var UNIF = ['uRes', 'uT', 'uAng', 'uInt', 'uSpread', 'uAmp', 'uHue', 'uFlare', 'uBurst', 'uSweep', 'uOff', 'uMouse'];

// build a renderer on a canvas → { gl, draw(state), lost() } or null
function renderer(canvas, attrs) {
  var gl = null;
  try { gl = canvas.getContext('webgl', attrs); } catch (e) {}
  if (!gl) return null;
  function sh(type, src) {
    var o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS) && !gl.isContextLost()) { console.warn('[aurora]', gl.getShaderInfoLog(o)); return null; }
    return o;
  }
  var v = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, FS); if (!v || !f) return null;
  var prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {}; UNIF.forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
  return {
    gl: gl,
    draw: function (s, t, burst, mouse) {
      if (gl.isContextLost()) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uT, t); gl.uniform1f(U.uAng, s.ang); gl.uniform1f(U.uInt, s.int);
      gl.uniform1f(U.uSpread, s.spread); gl.uniform1f(U.uAmp, s.amp); gl.uniform1f(U.uHue, s.hue);
      gl.uniform1f(U.uFlare, s.flare); gl.uniform1f(U.uBurst, burst || 0); gl.uniform1f(U.uSweep, s.sweep);
      gl.uniform2f(U.uOff, s.ox, s.oy); gl.uniform2f(U.uMouse, mouse ? mouse[0] : 0, mouse ? mouse[1] : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  };
}

/* ------------------------------------------------------------------
   MOTIF STATE — S tweens toward TG; heal is a scripted linear sweep
   ------------------------------------------------------------------ */
var S = Object.assign({}, PRESETS.hero && parse('hero').cfg), TG = Object.assign({}, S);
S.int = 0;                                     // first load: ribbons fade up from black
var T = 3, burst = 0, mouse = [0, 0], mouseT = [0, 0], healAnim = null, evTimers = [];
var canvas = D.querySelector('canvas.au-gl'), R = null, DPR = Math.min(window.devicePixelRatio || 1, 1.5);
if (!canvas) { canvas = D.createElement('canvas'); canvas.className = 'au-gl stage-bg'; canvas.setAttribute('aria-hidden', 'true'); D.body.insertBefore(canvas, D.body.firstChild); }
if (!D.querySelector('.au-fallback')) {
  var fb = D.createElement('div'); fb.className = 'au-fallback stage-bg'; fb.setAttribute('aria-hidden', 'true');
  fb.innerHTML = '<i style="top:62%"></i><i style="top:70%;opacity:.3;transform:rotate(-10deg)"></i><i style="top:55%;opacity:.25;transform:rotate(-18deg)"></i>';
  canvas.after(fb);
}
function resize() {
  var w = Math.floor(innerWidth * DPR), h = Math.floor(innerHeight * DPR);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
}
function draw() { if (R) R.draw(S, T, burst, mouse); }
function initGL() {
  resize();
  R = renderer(canvas, { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' });
  html.classList.toggle('au-nogl', !R);
  return !!R;
}
initGL();
canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); R = null; }, false);
canvas.addEventListener('webglcontextrestored', function () { if (initGL()) draw(); }, false);
addEventListener('resize', function () { resize(); if (Stage.reduced) draw(); });
addEventListener('pointermove', function (e) {
  mouseT[0] = e.clientX / innerWidth - .5; mouseT[1] = .5 - e.clientY / innerHeight;
  var sp = e.target.closest && e.target.closest('.spot');               // cursor spotlight on .spot surfaces
  if (sp) { var r = sp.getBoundingClientRect(); sp.style.setProperty('--mx', (e.clientX - r.left) + 'px'); sp.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
}, { passive: true });

function step(dt, now) {
  var a = 1 - Math.exp(-dt * 1.9);
  KEYS.forEach(function (k) { if (k !== 'sweep' || !healAnim) S[k] += (TG[k] - S[k]) * a; });
  if (healAnim) {
    var p = (now - healAnim.t0) / healAnim.dur;
    if (p < 0) S.sweep += (-.2 - S.sweep) * (1 - Math.exp(-dt * 5));       // hold fractured until the sweep starts
    else if (p >= 1) { S.sweep = 1.2; healAnim = null; burst = Math.max(burst, .32); }
    else S.sweep = -.08 + 1.24 * p;
  }
  T += dt * .6 * S.speed;
  burst *= Math.exp(-dt * 2.2);
  mouse[0] += (mouseT[0] - mouse[0]) * Math.min(1, dt * 3); mouse[1] += (mouseT[1] - mouse[1]) * Math.min(1, dt * 3);
}
if (!Stage.reduced) Stage.raf(function (now, dt) { if (!R) return; step(dt, now); draw(); });

// apply a composition (string | {cfg, ev} | partial object). Events fire relative to now.
function set(c, o) {
  o = o || {};
  var r = typeof c === 'string' ? parse(c, 'calm') : c && c.cfg ? c : { cfg: Object.assign({}, BASE, c), ev: {} };
  evTimers.splice(0).forEach(clearTimeout);
  healAnim = null;
  KEYS.forEach(function (k) { TG[k] = r.cfg[k]; if (o.instant || Stage.reduced) S[k] = r.cfg[k]; });
  if (!Stage.reduced && !o.instant) {
    if (r.ev.heal != null) healAnim = { t0: performance.now() + r.ev.heal * 1000, dur: (r.ev.healdur || 2) * 1000 };
    if (r.ev.burst != null) evTimers.push(setTimeout(function () { burst = Math.max(burst, r.ev.burstv || 1); }, r.ev.burst * 1000));
  }
  if (Stage.reduced || o.instant) draw();
}
Stage.onChange(function (to, from, dir, slide) { set(configOf(slide)); });

/* ------------------------------------------------------------------
   THUMBNAILS — real ribbons for overview cards + print pages
   ------------------------------------------------------------------ */
function renderThumbs() {
  var slides = Array.prototype.filter.call(D.querySelectorAll('.slide'), function (s) { return !s.closest('.stage-ov'); });
  if (!slides.length || !R) return;
  var c = D.createElement('canvas'); c.width = 1280; c.height = 720;
  var r = renderer(c, { antialias: false, alpha: false, preserveDrawingBuffer: true });
  if (!r) return;
  slides.forEach(function (s) {
    var cfg = configOf(s).cfg;
    r.draw(cfg, 3.2, 0, null);
    try {
      var url = c.toDataURL('image/jpeg', .86), prev = s.getAttribute('data-thumb');
      s.setAttribute('data-thumb', 'url(' + url + ') center / cover no-repeat' + (prev ? ', ' + prev : ', #07030d'));
    } catch (e) {}
  });
  var ext = r.gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext();
}
renderThumbs();                                 // before boot: the engine copies data-thumb into --stage-thumb

/* ------------------------------------------------------------------
   COMPONENTS
   ------------------------------------------------------------------ */
// dot grid: svg[data-au-dots="n,k[,cols]"] → n dots, last k highlighted
D.querySelectorAll('svg[data-au-dots]').forEach(function (svg) {
  var a = svg.getAttribute('data-au-dots').split(','), n = +a[0], k = +a[1] || 0, cols = +a[2] || Math.ceil(n / 3);
  var vb = (svg.getAttribute('viewBox') || '0 0 180 54').split(/\s+/).map(Number), rows = Math.ceil(n / cols);
  var gx = (vb[2] - 16) / Math.max(1, cols - 1), gy = rows > 1 ? (vb[3] - 18) / (rows - 1) : 0;
  for (var i = 0; i < n; i++) {
    var e = D.createElementNS('http://www.w3.org/2000/svg', 'circle');
    e.setAttribute('cx', 8 + (i % cols) * gx); e.setAttribute('cy', 9 + Math.floor(i / cols) * gy); e.setAttribute('r', 3.4);
    e.style.setProperty('--i', i); if (i >= n - k) e.setAttribute('class', 'hi'); svg.appendChild(e);
  }
});
// icon grid: [data-au-icons="name,n,k"] → n lucide icons, the first k are "existing" (.base), the rest light up in sequence
D.querySelectorAll('[data-au-icons]').forEach(function (g) {
  var a = g.getAttribute('data-au-icons').split(','), name = a[0], n = +a[1], k = +a[2] || 0;
  for (var i = 0; i < n; i++) {
    var s = D.createElement('span'); if (i < k) s.className = 'base';
    s.style.setProperty('--i', i - k); s.innerHTML = '<i data-lucide="' + name + '"></i>'; g.appendChild(s);
  }
});
// light trail: time every node to the travelling head (move 70% / hold 30% per segment)
var kfCss = '';
D.querySelectorAll('.trail-steps').forEach(function (t, ti) {
  var steps = t.querySelectorAll('.step'), n = steps.length, m = Math.max(1, n - 1), cs = getComputedStyle(t);
  var dur = parseFloat(cs.getPropertyValue('--trail-dur')) || 3.8, t0 = parseFloat(cs.getPropertyValue('--trail-t0')) || .6, seg = 1 / m;
  var name = 'au-trail-' + ti, kf = '@keyframes ' + name + '{0%{width:0}';
  for (var k = 0; k < m; k++) kf += ((k * seg + .7 * seg) * 100).toFixed(2) + '%{width:' + ((k + 1) / m * 100).toFixed(3) + '%}' + (k < m - 1 ? (((k + 1) * seg) * 100).toFixed(2) + '%{width:' + ((k + 1) / m * 100).toFixed(3) + '%}' : '');
  kfCss += kf + '100%{width:100%}}';
  t.style.setProperty('--n', n); t.style.setProperty('--trail-kf', name);
  steps.forEach(function (s, i) { s.style.setProperty('--t', (t0 + (i ? dur * ((i - 1) * seg + .7 * seg) : 0)).toFixed(3) + 's'); });
});
if (kfCss) { var st = D.createElement('style'); st.textContent = kfCss; D.head.appendChild(st); }
if (window.lucide) try { lucide.createIcons(); } catch (e) {}

// accordion: one open item, auto-cycle every data-cycle seconds while active; hover/focus/click pins
function accOpen(acc, i) {
  var items = acc.querySelectorAll('.acc-i');
  items.forEach(function (c, j) { c.classList.toggle('on', i === j); });
  acc._i = i;
}
D.querySelectorAll('.acc').forEach(function (acc) {
  acc.querySelectorAll('.acc-i').forEach(function (c, i) {
    c.addEventListener('pointerenter', function () { acc.classList.add('hold'); accOpen(acc, i); });
    c.addEventListener('click', function () { accOpen(acc, i); });
  });
  acc.addEventListener('pointerleave', function () { acc.classList.remove('hold'); });
});
async function cycle(acc, ctx) {
  accOpen(acc, 0);
  var sec = parseFloat(acc.dataset.cycle);
  acc.style.setProperty('--cyc', (sec || 3.8) + 's');
  if (!sec || ctx.reduced || ctx.frozen) return;
  for (;;) {
    await ctx.wait(sec * 1000);
    if (!acc.classList.contains('hold')) accOpen(acc, ((acc._i || 0) + 1) % acc.querySelectorAll('.acc-i').length);
  }
}

// generic hook on every scene: components above get enter + final for free
var AUTO = {
  enter: function (s, ctx) {
    s.querySelectorAll('.acc').forEach(function (a) { cycle(a, ctx); });
  },
  final: function (s) {
    s.querySelectorAll('.acc').forEach(function (a) { if (!a.querySelector('.acc-i.on')) accOpen(a, 0); });
  }
};
var seen = {};
D.querySelectorAll('.slide').forEach(function (s, i) {
  if (!s.dataset.scene) s.dataset.scene = 'au-' + (i + 1);
  if (!seen[s.dataset.scene]) { seen[s.dataset.scene] = 1; Stage.hook(s.dataset.scene, AUTO); }
});

/* ------------------------------------------------------------------
   TRANSITION — engine dissolve, but the incoming slide is not opacity-faded
   (its reveals carry the entrance), so glass keeps its backdrop blur.
   ------------------------------------------------------------------ */
function dissolve(from, to, t) {
  from.classList.add('stage-out');
  t.enter();
  return t.wait(t.duration);
}
Stage.setTransition(dissolve);
if (D.fonts && D.fonts.ready) Stage.waitFor(D.fonts.ready);

/* ------------------------------------------------------------------
   PUBLIC API
   ------------------------------------------------------------------ */
window.Aurora = {
  presets: PRESETS, base: BASE,
  parse: parse, config: configOf,
  set: set,                                              // Aurora.set('floor int:.8') · Aurora.set({oy:-.3}) · {instant:true}
  burst: function (v) { if (!Stage.reduced) burst = Math.max(burst, v == null ? 1 : v); },
  heal: function (delay, dur) { if (!Stage.reduced) healAnim = { t0: performance.now() + (delay || 0) * 1000, dur: (dur || 2) * 1000 }; },
  get state() { return Object.assign({}, S); },
  get webgl() { return !!R; },
  cycle: cycle, accOpen: accOpen,
  dissolve: dissolve
};
})();
