/* ===========================================================
   SPATIAL KIT — window.Spatial   (inline verbatim AFTER stage-engine.js [+ inline-editor.js])
   - World: every .sp-world > .slide is a panel. Placement = data-world="x,z,yaw"
     (x/z in viewport-widths, yaw in deg) or an automatic winding path.
   - Camera flight = Stage.setTransition: pull back, turn, land (overshoot + settle).
     data-fly="dive" → bigger pull-back + dive (the wow slide).
   - Env: fixed canvas .sp-env draws the grid floor / horizon / dust with the SAME
     matrix as the world. Per slide: data-env="scroll:.05 warp:.55".
   - Components (.sp-gate .sp-cubes .sp-fan .sp-pillars .sp-stack .sp-runway
     .sp-chip .sp-graph .sp-tiers .sp-rise) are built + laid out from data-attributes
     and choreographed automatically on every entry. Final states live in kit.css.
   =========================================================== */
(function () {
'use strict';
var Stage = window.Stage;
if (!Stage) return console.warn('[Spatial] load stage-engine.js first');
var D = document, root = D.documentElement;
var $ = function (s, r) { return (r || D).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); };
var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; }, c01 = function (v) { return clamp(v, 0, 1); };
var lerp = function (a, b, t) { return a + (b - a) * t; };
var smooth = function (a, b, v) { var t = c01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
var eOut = function (t) { return 1 - Math.pow(1 - t, 3); }, eOut5 = function (t) { return 1 - Math.pow(1 - t, 5); };
var eIO = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
var eBack = function (s) { return function (t) { return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); }; };
var eFly = function (t) {          // in-out with a small anticipation + overshoot → "lands and settles"
  var c1 = .55, c2 = c1 * 1.525;
  return t < .5 ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2 : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
};
var f1 = function (v) { return (+v).toFixed(1); };
var px = function (v) { return Math.round(v) + 'px'; };
var nums = function (s) { return String(s || '').split(/[\s,]+/).filter(Boolean).map(Number); };
var setv = function (el, k, v) { el.style.setProperty(k, v); };

var vp = $('.sp-vp'), world = $('.sp-world'), envBox = $('.sp-env');
if (!world) return console.warn('[Spatial] no .sp-world');
var panels = $$('.sp-world > .slide'), N = panels.length;
var canvas = envBox && (envBox.querySelector('canvas') || envBox.appendChild(D.createElement('canvas')));
var g2 = canvas && canvas.getContext('2d');
var reduced = function () { return Stage.reduced; };

/* === 1. DIMENSIONS — live viewport, or 1600×900 while printing === */
var DM = {};
function dims(w, h) {
  var o = { W: w, H: h, CX: Math.floor(w / 2), CY: Math.floor(h / 2) };
  o.P = Math.round(Math.max(w * .95, h * 1.55)); o.OY = Math.round(h * .18); o.FLOOR = h - o.CY;
  return o;
}
/* screen point (px) at depth z → slide-local coords (inverse of the CSS perspective projection) */
function place(sx, sy, z, d) {
  d = d || DM; var s = d.P / (d.P - z);
  return { x: (sx - d.CX) / s, y: d.OY + (sy - d.CY - d.OY) / s, z: z, s: s };
}

/* === 2. WORLD PLACEMENT === */
var AUTO = [[0, 0, 0], [1.6, -.75, -36], [2.75, -2.3, -66], [2.45, -4.35, -8], [.85, -5.5, 32], [-.7, -7.8, 6], [-1.5, -9.6, -18], [-.9, -11.9, 0]];
var pos = [], cfg = [];
function slideCfg(s, k) {
  var w = nums(s.dataset.world), a = AUTO[k % AUTO.length], lap = Math.floor(k / AUTO.length);
  var env = {}; String(s.dataset.env || '').split(/\s+/).forEach(function (kv) { var p = kv.split(':'); if (p[1] != null) env[p[0]] = +p[1]; });
  return { x: w.length ? w[0] : a[0] + lap * -1.2, z: w.length ? w[1] : a[1] + lap * -12.4, ry: w.length ? (w[2] || 0) : a[2],
           dive: s.dataset.fly === 'dive', scroll: env.scroll || 0, warp: env.warp || 0 };
}
function placePanels() {
  panels.forEach(function (p, i) {
    var c = cfg[i];
    pos[i] = { x: Math.round(c.x * DM.W), y: 0, z: Math.round(c.z * DM.W), ry: c.ry };
    p.style.width = DM.W + 'px'; p.style.height = DM.H + 'px';
    p.style.left = -DM.CX + 'px'; p.style.top = -DM.CY + 'px'; p.style.transformOrigin = DM.CX + 'px ' + DM.CY + 'px';
    p.style.transform = 'translate3d(' + pos[i].x + 'px,0,' + pos[i].z + 'px) rotateY(' + pos[i].ry + 'deg)';
  });
}

/* === 3. CAMERA === */
var cam = { x: 0, y: 0, z: 0, ry: 0, back: 0 };
var camAdd = { x: 0, y: 0, z: 0 };            // in-slide camera travel (sp-runway[data-tour])
var tilt = { x: 0, y: 0, tx: 0, ty: 0 };
var M = new DOMMatrix(), lastT = '';
function camMatrix() {
  return new DOMMatrix().translateSelf(0, 0, -cam.back)
    .rotateAxisAngleSelf(1, 0, 0, tilt.x).rotateAxisAngleSelf(0, 1, 0, tilt.y - cam.ry)
    .translateSelf(-(cam.x + camAdd.x), -(cam.y + camAdd.y), -(cam.z + camAdd.z));
}
function camAt(i) { return { x: pos[i].x, y: 0, z: pos[i].z, ry: pos[i].ry, back: 0 }; }
function foldAdd() { cam.x += camAdd.x; cam.y += camAdd.y; cam.z += camAdd.z; camAdd.x = camAdd.y = camAdd.z = 0; }
function snap(i) { flight = null; camAdd.x = camAdd.y = camAdd.z = 0; Object.assign(cam, camAt(i)); pf.fill(0); pf[i] = 1; kick(); }

/* === 4. FLIGHT (the transition) === */
var flight = null, landAt = 0;            // landAt: performance.now() when the current panel's camera lands
var pf = new Float32Array(N), last = { fade: [], fr: [], vis: [] };
function startFlight(i, o) {
  foldAdd();
  var from = o.from || Object.assign({}, cam), to = camAt(i), c = cfg[i];
  var dist = Math.hypot(to.x - from.x, to.z - from.z, (to.ry - from.ry) / 90 * DM.W);
  var dur = o.dur || clamp(1100 + dist / DM.W * 200, 1200, 1900) + (c.dive ? 450 : 0);
  var Dk = o.D != null ? o.D : (DM.W * .22 + dist * .3) * (c.dive ? 2.2 : 1);
  var at = o.at != null ? o.at : c.dive ? .28 : .45;
  flight = { from: from, to: to, t0: performance.now(), dur: dur, D: Dk, i: i, at: at, landed: false,
             onLand: o.onLand, onDone: o.onDone, alive: o.alive || function () { return true; } };
  landAt = flight.t0 + dur * at;
  kick();
}
function stepFlight(now) {
  var f = flight; if (!f) return;
  if (!f.alive()) { flight = null; return; }           // interrupted: freeze the camera where it is
  var t = c01((now - f.t0) / f.dur), e = eFly(t);
  cam.x = lerp(f.from.x, f.to.x, e); cam.z = lerp(f.from.z, f.to.z, e); cam.ry = lerp(f.from.ry, f.to.ry, e);
  cam.y = lerp(f.from.y, f.to.y, eIO(t));
  cam.back = lerp(f.from.back, 0, eIO(t)) + f.D * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.04)), 1.4);
  if (!f.landed && t >= f.at) { f.landed = true; f.onLand && f.onLand(); }
  if (t >= 1) { Object.assign(cam, f.to); flight = null; f.onDone && f.onDone(); }
}
Stage.setTransition(function (from, to, t) {
  resetSlide(to);
  return new Promise(function (res) {
    startFlight(t.index, { onLand: t.enter, onDone: res, alive: t.alive });
  });
});
var bootDone = false;
Stage.onChange(function (to, from) {
  if (from === -1 && !bootDone) {                       // boot: establishing shot (start high and far back)
    bootDone = true;
    if (reduced()) return snap(to);
    var p = camAt(to);
    root.style.setProperty('--rv-base', '1.25s');       // hold the first reveals until the camera arrives
    setTimeout(function () { root.style.removeProperty('--rv-base'); }, 2600);
    startFlight(to, { from: { x: p.x - DM.W * .35, y: -DM.H * .55, z: p.z, ry: p.ry + 14, back: DM.W * 2.6 }, dur: 2600, D: 0, at: .42 });
    return;
  }
  // instant moves (reduced motion, editor, Stage.go(n,{instant})) never call the transition → snap
  Promise.resolve().then(function () { if (!flight || flight.i !== to) snap(to); });
});
var arrival = function () { return Math.max(0, landAt - performance.now()); };

/* === 5. PER-FRAME PANEL FADE (leaves read --fade, frames read --fr) === */
function updatePanels(dt) {
  var cur = Stage.index, now = performance.now();
  var ft = flight ? c01((now - flight.t0) / flight.dur) : 1, amb = flight ? Math.pow(Math.sin(Math.PI * ft), .6) : 0, W = DM.W;
  for (var i = 0; i < N; i++) {
    var p = pos[i], qz = M.m13 * p.x + M.m33 * p.z + M.m43, qx = M.m11 * p.x + M.m31 * p.z + M.m41;
    var depth = DM.P - qz, d = Math.hypot(qx, depth);
    var target = i === cur ? (flight && flight.i === i ? smooth(flight.at - .12, Math.min(.96, flight.at + .42), ft) : 1) : 0;
    pf[i] = i === cur ? target : Math.max(0, pf[i] - dt / .55);
    var near = smooth(W * .12, W * .45, depth), rest = i === cur && !flight;
    var a = amb * .32 * c01(1.35 - d / (W * 4.2)) * near, inFront = depth > 30 ? 1 : 0;
    var fade = rest ? pf[i] : Math.max(pf[i], a) * inFront;
    var fr = rest ? pf[i] : Math.max(i === cur ? pf[i] : 0, (.16 + .3 * amb) * c01(1.2 - d / (W * 5.5)) * near) * inFront;
    // reduced motion: every slide is .is-final (content forced visible) → show only the current panel
    var vis = (fade > .004 || (fr > .004 && !reduced())) ? 'visible' : 'hidden';
    var fs = fade.toFixed(3), frs = fr.toFixed(3), st = panels[i].style;
    if (fs !== last.fade[i]) { st.setProperty('--fade', fs); last.fade[i] = fs; }
    if (frs !== last.fr[i]) { st.setProperty('--fr', frs); last.fr[i] = frs; }
    if (vis !== last.vis[i]) { st.visibility = vis; last.vis[i] = vis; }
  }
}

/* === 6. ENVIRONMENT — grid floor, horizon, dust (shared with the thumbnail renderer) === */
var dust = null, ND = 0, scroll = 0, envScroll = 0, envWarp = 0, BUCKETS = 14;
function initDust() {
  ND = DM.W < 900 ? 140 : 220; dust = new Float32Array(ND * 5);
  for (var k = 0; k < ND; k++) {
    dust[k * 5] = (Math.random() * 2 - 1) * DM.W * 2.4; dust[k * 5 + 1] = -DM.H * .9 + Math.random() * (DM.H * .9 + DM.FLOOR - 10);
    dust[k * 5 + 2] = (Math.random() * 2 - 1) * DM.W * 2.4; dust[k * 5 + 3] = Math.random() * 6.283; dust[k * 5 + 4] = .4 + Math.random() * .9;
  }
}
function drawEnv(g, d, m, dt, now, withDust) {
  var W = d.W, H = d.H, P = d.P, OY = d.OY, FL = d.FLOOR, G = W * .14, near = 18;
  g.clearRect(0, 0, W, H);
  var inv = m.inverse(), eye = inv.transformPoint(new DOMPoint(0, OY, P)), ahead = inv.transformPoint(new DOMPoint(0, OY, P - 1000));
  var fx = ahead.x - eye.x, fz = ahead.z - eye.z, fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
  var tc = function (x, y, z) { return [m.m11 * x + m.m21 * y + m.m31 * z + m.m41, m.m12 * x + m.m22 * y + m.m32 * z + m.m42, m.m13 * x + m.m23 * y + m.m33 * z + m.m43]; };
  var scr = function (q) { var s = P / (P - q[2]); return [d.CX + q[0] * s, d.CY + OY + (q[1] - OY) * s, s]; };
  var hz = scr(tc(eye.x + fx * 1e6, FL, eye.z + fz * 1e6)), hy = hz[1], hx = hz[0], gr;
  g.globalCompositeOperation = 'source-over';
  gr = g.createLinearGradient(0, hy - H * .32, 0, hy);
  gr.addColorStop(0, 'rgba(139,92,246,0)'); gr.addColorStop(.75, 'rgba(139,92,246,.10)'); gr.addColorStop(1, 'rgba(217,70,239,.26)');
  g.fillStyle = gr; g.fillRect(0, hy - H * .32, W, H * .32);
  gr = g.createLinearGradient(0, hy, 0, H);
  gr.addColorStop(0, 'rgba(91,33,182,.42)'); gr.addColorStop(.25, 'rgba(46,16,101,.22)'); gr.addColorStop(1, 'rgba(8,4,16,0)');
  g.fillStyle = gr; g.fillRect(0, hy, W, H - hy);
  // grid — segments bucketed by distance → 14 strokes instead of ~1000
  var paths = [], b; for (b = 0; b < BUCKETS; b++) paths.push(new Path2D());
  var R = G * 30, SEG = 9;
  var seg = function (x1, z1, x2, z2) {
    for (var s = 0; s < SEG; s++) {
      var ax = lerp(x1, x2, s / SEG), az = lerp(z1, z2, s / SEG), bx = lerp(x1, x2, (s + 1) / SEG), bz = lerp(z1, z2, (s + 1) / SEG);
      var dm = Math.hypot((ax + bx) / 2 - eye.x, (az + bz) / 2 - eye.z); if (dm > R) continue;
      var qa = tc(ax, FL, az), qb = tc(bx, FL, bz), la = P - near - qa[2], lb = P - near - qb[2], k;
      if (la <= 0 && lb <= 0) continue;
      if (la <= 0) { k = la / (la - lb); qa = [lerp(qa[0], qb[0], k), lerp(qa[1], qb[1], k), lerp(qa[2], qb[2], k) - .01]; }
      else if (lb <= 0) { k = la / (la - lb); qb = [lerp(qa[0], qb[0], k), lerp(qa[1], qb[1], k), lerp(qa[2], qb[2], k) - .01]; }
      var A = scr(qa), B = scr(qb), bi = Math.min(BUCKETS - 1, Math.floor(dm / R * BUCKETS));
      paths[bi].moveTo(A[0], A[1]); paths[bi].lineTo(B[0], B[1]);
    }
  };
  var off = ((scroll % G) + G) % G, gx0 = Math.floor((eye.x - R) / G) * G, gz0 = Math.floor((eye.z - R) / G) * G, n = Math.ceil(2 * R / G) + 1, k2;
  for (k2 = 0; k2 <= n; k2++) seg(eye.x - R, gz0 + k2 * G + off, eye.x + R, gz0 + k2 * G + off);
  for (k2 = 0; k2 <= n; k2++) seg(gx0 + k2 * G, eye.z - R, gx0 + k2 * G, eye.z + R);
  g.globalCompositeOperation = 'lighter'; g.lineWidth = 1;
  for (b = 0; b < BUCKETS; b++) {
    var t = b / (BUCKETS - 1), a = .62 * Math.pow(1 - t, 1.7) * (b === 0 ? .8 : 1); if (a < .01) continue;
    g.strokeStyle = 'rgba(' + Math.round(lerp(167, 232, t)) + ',' + Math.round(lerp(139, 121, t)) + ',' + Math.round(lerp(250, 249, t)) + ',' + a.toFixed(3) + ')';
    g.stroke(paths[b]);
  }
  // horizon line + bloom
  gr = g.createLinearGradient(0, 0, W, 0);
  gr.addColorStop(0, 'rgba(139,92,246,0)'); gr.addColorStop(.2, 'rgba(139,92,246,.75)'); gr.addColorStop(.5, 'rgba(240,171,252,1)');
  gr.addColorStop(.8, 'rgba(217,70,239,.75)'); gr.addColorStop(1, 'rgba(217,70,239,0)');
  g.fillStyle = gr; g.fillRect(0, hy - .75, W, 1.5); g.globalAlpha = .35; g.fillRect(0, hy - 3, W, 6); g.globalAlpha = 1;
  var rg = g.createRadialGradient(hx, hy, 0, hx, hy, W * .42);
  rg.addColorStop(0, 'rgba(232,121,249,.30)'); rg.addColorStop(.4, 'rgba(139,92,246,.10)'); rg.addColorStop(1, 'rgba(139,92,246,0)');
  g.save(); g.translate(hx, hy); g.scale(1, .28); g.translate(-hx, -hy); g.fillStyle = rg; g.fillRect(hx - W * .42, hy - W * .42, W * .84, W * .84); g.restore();
  if (withDust && dust) {
    var BX = W * 2.4, live = !reduced();
    for (var j = 0; j < ND; j++) {
      var o = j * 5;
      if (live) {
        dust[o] += Math.sin(now * .00011 + dust[o + 3]) * 6 * dt; dust[o + 1] -= 5 * dt * dust[o + 4]; dust[o + 2] += envWarp * W * dt;
        if (dust[o + 1] < -H * .95) dust[o + 1] = FL - 10;
      }
      var dx = dust[o] - eye.x; dx = ((dx + BX) % (2 * BX) + 2 * BX) % (2 * BX) - BX;
      var dz = dust[o + 2] - eye.z; dz = ((dz + BX) % (2 * BX) + 2 * BX) % (2 * BX) - BX;
      var wx = eye.x + dx, wz = eye.z + dz, wy = dust[o + 1], q = tc(wx, wy, wz), depth = P - q[2];
      if (depth < 40) continue;
      var A2 = scr(q), fog = c01(1 - Math.hypot(dx, dz) / BX) * smooth(40, W * .25, depth);
      var al = fog * (.55 + .45 * Math.sin(now * .002 * dust[o + 4] + dust[o + 3])) * .8; if (al < .02) continue;
      var rr = clamp(A2[2] * 2.2 * dust[o + 4], .5, 3.4);
      g.fillStyle = j % 5 === 0 ? 'rgba(255,190,120,' + al.toFixed(3) + ')' : 'rgba(240,220,255,' + al.toFixed(3) + ')';
      if (envWarp > .05) {
        var B2 = scr(tc(wx, wy, wz - envWarp * W * .12));
        g.strokeStyle = g.fillStyle; g.lineWidth = rr * .8; g.beginPath(); g.moveTo(A2[0], A2[1]); g.lineTo(B2[0], B2[1]); g.stroke();
      } else g.fillRect(A2[0] - rr / 2, A2[1] - rr / 2, rr, rr);
    }
  }
  g.globalCompositeOperation = 'source-over';
  return { eye: eye, fx: fx, fz: fz };
}
/* the floor rendered once from a resting camera → --sp-thumb (overview cards + print pages) */
function renderThumb() {
  try {
    var d = dims(1600, 900), c = D.createElement('canvas'); c.width = 1600; c.height = 900;
    var g = c.getContext('2d');
    var bg = g.createLinearGradient(0, 0, 0, 900);
    bg.addColorStop(0, '#040009'); bg.addColorStop(.52, '#0B0015'); bg.addColorStop(.68, '#120327'); bg.addColorStop(1, '#0A0A0A');
    var sc = scroll; scroll = 0;
    var layer = D.createElement('canvas'); layer.width = 1600; layer.height = 900;
    drawEnv(layer.getContext('2d'), d, new DOMMatrix(), 0, 0, false);
    scroll = sc;
    g.fillStyle = bg; g.fillRect(0, 0, 1600, 900); g.drawImage(layer, 0, 0);
    root.style.setProperty('--sp-thumb', 'url("' + c.toDataURL('image/jpeg', .84) + '") center / 100% 100% no-repeat, #0A0A0A');
  } catch (e) { /* keep the CSS gradient fallback */ }
}

/* === 7. HUD MINIMAP (.sp-map svg) — top-down: travel direction → right === */
var map = $('.sp-map'), mapCam = null, mapRects = [], mapS = 1, mapO = [0, 0], NS = 'http://www.w3.org/2000/svg';
function mapInit() {
  if (!map) return;
  var xs = cfg.map(function (c) { return c.x; }), zs = cfg.map(function (c) { return c.z; });
  var x0 = Math.min.apply(0, xs), x1 = Math.max.apply(0, xs), z0 = Math.min.apply(0, zs), z1 = Math.max.apply(0, zs);
  map.setAttribute('viewBox', '0 0 100 64'); map.innerHTML = '';
  mapS = Math.min(84 / ((z1 - z0) || 1), 48 / ((x1 - x0) || 1)); mapO = [50 + (z0 + z1) / 2 * mapS, 32 - (x0 + x1) / 2 * mapS];
  var mp = function (x, z) { return [mapO[0] - z * mapS, mapO[1] + x * mapS]; };
  var pl = D.createElementNS(NS, 'polyline');
  pl.setAttribute('points', cfg.map(function (c) { return mp(c.x, c.z).join(','); }).join(' '));
  pl.setAttribute('style', 'fill:none;stroke:rgba(167,139,250,.35);stroke-width:1;stroke-dasharray:2 2'); map.appendChild(pl);
  mapRects = cfg.map(function (c) {
    var p = mp(c.x, c.z), r = D.createElementNS(NS, 'rect');
    r.setAttribute('x', -5); r.setAttribute('y', -1.2); r.setAttribute('width', 10); r.setAttribute('height', 2.4); r.setAttribute('rx', 1);
    r.setAttribute('transform', 'translate(' + p[0] + ',' + p[1] + ') rotate(' + (90 - c.ry) + ')'); map.appendChild(r); return r;
  });
  mapCam = D.createElementNS(NS, 'g');
  mapCam.innerHTML = '<path d="M0,-5 L3.2,3 L0,1.4 L-3.2,3 Z" fill="#FF9900"/><circle r="7" fill="none" stroke="rgba(255,153,0,.35)"/>';
  map.appendChild(mapCam);
}
function mapDraw(v) {
  if (!mapCam) return;
  var x = mapO[0] - v.eye.z / DM.W * mapS, y = mapO[1] + v.eye.x / DM.W * mapS, a = Math.atan2(-v.fz, -v.fx) * 180 / Math.PI;
  mapCam.setAttribute('transform', 'translate(' + f1(x) + ',' + f1(y) + ') rotate(' + f1(a) + ')');
  mapRects.forEach(function (r, k) { r.style.fill = k === Stage.index ? '#e879f9' : 'rgba(255,255,255,.28)'; });
}

/* === 8. MAIN LOOP (Stage.raf — paused while the tab is hidden) === */
var stopLoop = null, still = 0;
function frame(now, dt) {
  stepFlight(now);
  if (Stage.frozen) { camAdd.x *= .85; camAdd.y *= .85; camAdd.z *= .85; }
  tilt.x += (tilt.tx - tilt.x) * .06; tilt.y += (tilt.ty - tilt.y) * .06;
  if (Math.abs(tilt.tx - tilt.x) < .002) tilt.x = tilt.tx;
  if (Math.abs(tilt.ty - tilt.y) < .002) tilt.y = tilt.ty;
  M = camMatrix();
  var ts = M.toString(); if (ts !== lastT) { world.style.transform = ts; lastT = ts; }
  updatePanels(dt);
  var c = cfg[Stage.index] || {};
  envScroll += ((c.scroll || 0) - envScroll) * .03; envWarp += ((c.warp || 0) - envWarp) * .03;
  if (!reduced()) scroll += envScroll * DM.W * dt;
  if (g2) mapDraw(drawEnv(g2, DM, M, dt, now, true));
  if (reduced() && !flight) { if (++still > 3) { stopLoop = null; return false; } } else still = 0;
}
function kick() { still = 0; if (!stopLoop) stopLoop = Stage.raf(function (n, d) { return frame(n, d); }); }

/* === 9. COMPONENTS — { sel, build(el), layout(el, slide), reset(el), enter(el, ctx, slide), final(el) } ===
   build runs once at load; layout on boot / resize / print; reset + enter on every entry.
   Everything visual is expressed as CSS vars, so .slide.is-final (kit.css) can force the end state. */
var C = {};
var mk = function (cls, parent, tag) { var e = D.createElement(tag || 'div'); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
var at = function (el, def) { var a = nums(el.dataset.at); return a.length ? a : def; };
var num = function (el, k, def) { var v = parseFloat(el.dataset[k]); return isNaN(v) ? def : v; };
var put3 = function (el, p) { setv(el, '--tx', f1(p.x) + 'px'); setv(el, '--ty', f1(p.y) + 'px'); setv(el, '--tz', f1(p.z) + 'px'); };
function strip(e, a, b) {                     // a 3D strip from a to b (element laid along +x, origin left-middle)
  var dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, L = Math.hypot(dx, dy, dz) || 1;
  e.style.width = px(L);
  e.style.transform = 'translate3d(' + f1(a.x) + 'px,' + f1(a.y) + 'px,' + f1(a.z) + 'px) rotateY(' + (Math.atan2(-dz, dx) * 180 / Math.PI).toFixed(2) + 'deg) rotateZ(' + (Math.asin(dy / L) * 180 / Math.PI).toFixed(2) + 'deg)';
}
function eTween(ctx, el, o) {                 // tween an element's --e (entry) var
  return ctx.tween({ from: o.from != null ? o.from : 0, to: 1, dur: o.dur || 900, delay: o.delay || 0, ease: o.ease || eOut5,
    on: function (v) { setv(el, '--e', v.toFixed(4)); } });
}
function headBottom(slide) {                  // layout px of the slide heading's bottom edge (for fitting tall objects)
  var h = slide.querySelector('.sp-head');
  return h ? h.offsetTop + h.offsetHeight : DM.H * .28;
}

/* --- sp-gate: neon light-gate on the floor --- */
C.gate = { sel: '.sp-gate',
  build: function (el) { ['g-floor', 'g-refl', 'g-fill', 'g-glow', 'g-ring', 'g-ticks'].forEach(function (c) { var d = mk(c, el); if (c === 'g-refl') mk('', d, 'i'); }); },
  layout: function (el) {
    var Zp = Math.round(DM.W * num(el, 'depth', 1.25)), s = DM.P / (DM.P + Zp), Ds = DM.H * num(el, 'size', .74), Dh = Ds / s;
    setv(el, '--gz', -Zp + 'px'); setv(el, '--gy', f1(DM.FLOOR - Dh / 2) + 'px'); setv(el, '--gk', (1 / s).toFixed(4));
    setv(el, '--D', Math.round(Ds) + 'px'); setv(el, '--Dw', Math.round(Ds * num(el, 'ratio', 1.32)) + 'px'); setv(el, '--lw0', Math.max(2, Math.round(Ds * .011)) + 'px');
  },
  reset: function (el) { setv(el, '--e', 0); setv(el, '--pw', 0); },
  enter: function (el, ctx) {
    var pw = 0;
    eTween(ctx, el, { dur: 2000 });
    ctx.tween({ delay: 250, dur: 1400, ease: eOut, on: function (v) { pw = v; } });
    ctx.raf(function (now, dt, ms) {
      var t = ms / 1000;
      setv(el, '--pw', (pw * (.86 + .14 * Math.sin(t * 1.6))).toFixed(3));
      setv(el, '--ga', (t * 24).toFixed(1) + 'deg'); setv(el, '--ta', (-t * 5).toFixed(1) + 'deg');
    });
  } };

/* --- sp-cubes: nested wireframe cubes --- */
C.cubes = { sel: '.sp-cubes',
  build: function (el) { mk('core', el); ['c0', 'c1'].forEach(function (c) { var q = mk('sp-cube ' + c, el); for (var k = 0; k < 6; k++) mk('', q, 'i'); }); },
  layout: function (el) { var a = at(el, [50, 42]); el.style.left = a[0] + '%'; el.style.top = a[1] + '%'; setv(el, '--cz', num(el, 'depth', -640) + 'px'); },
  reset: function (el) { setv(el, '--e', 0); },
  enter: function (el, ctx) { eTween(ctx, el, { dur: 2200 }); ctx.raf(function (n, d, ms) { setv(el, '--t', (ms / 1000).toFixed(3)); }); } };

/* --- sp-fan: concave (agenda) / convex (comparison) arc of cards --- */
C.fan = { sel: '.sp-fan',
  build: function (el) {
    $$('.sp-mono', el).forEach(function (m) { if (!m.querySelector('.sp-mono-face')) m.insertBefore(mk('sp-mono-face L'), m.firstChild); });
  },
  layout: function (el) {
    var a = at(el, [50, 60]), items = Array.prototype.slice.call(el.children), n = items.length, convex = el.dataset.shape === 'convex';
    el.style.left = a[0] + '%'; setv(el, '--fy', f1(a[1] / 100 * DM.H) + 'px');
    items.forEach(function (it, k) {
      var o = k - (n - 1) / 2, x, z, ry, ryin;
      if (convex) {
        var R = DM.W * .62, ang = o * num(el, 'spread', 27), r = ang * Math.PI / 180;
        x = R * Math.sin(r); z = R * Math.cos(r) - R; ry = ang; ryin = (ang >= 0 ? 80 : -80);
      } else {
        var cw = it.offsetWidth || DM.W * .18, sp = cw * num(el, 'gap', 1.13);
        x = o * sp; z = o * o * cw * .16 - cw * .1; ry = -o * num(el, 'spread', 13); ryin = x > 0 ? 35 : -35;
      }
      setv(it, '--tx', f1(x) + 'px'); setv(it, '--tz', f1(z) + 'px'); setv(it, '--ry', ry.toFixed(2) + 'deg'); setv(it, '--ryin', ryin + 'deg');
      // projected 2D placement relative to the fan origin (print / flat fallback)
      var fx = a[0] / 100 * DM.W - DM.CX, fy = a[1] / 100 * DM.H - DM.CY, s = DM.P / (DM.P - z);
      setv(it, '--sx', f1((fx + x) * s - fx) + 'px'); setv(it, '--sy', f1(DM.OY + (fy - DM.OY) * s - fy) + 'px'); setv(it, '--ss', s.toFixed(4));
    });
  },
  meters: function (el, lit) { $$('.sp-meter[data-v]', el).forEach(function (m) { var v = +m.dataset.v; $$('b', m).forEach(function (b, j) { b.classList.toggle('on', j < Math.round(v * lit)); }); }); },
  reset: function (el) {
    Array.prototype.forEach.call(el.children, function (it) { setv(it, '--e', 0); setv(it, '--dim', 1); setv(it, '--push', '0px'); setv(it, '--bob', '0px'); it.classList.remove('sp-focus'); });
    this.meters(el, 0);
  },
  enter: function (el, ctx) {
    var self = this, items = Array.prototype.slice.call(el.children), convex = el.dataset.shape === 'convex', focusS = num(el, 'focus', 0);
    items.forEach(function (it, k) { eTween(ctx, it, { delay: 120 + k * 135, dur: convex ? 1300 : 1500, ease: eBack(convex ? .8 : .9) }); });
    ctx.tween({ delay: 700, dur: 900, on: function (v) { self.meters(el, v); } });
    var cur = items.map(function () { return { push: 0, dim: 1 }; }), f = -1;
    ctx.raf(function (now, dt, ms) {
      var t = ms / 1000;
      if (!convex && t > 2.2) items.forEach(function (it, k) { setv(it, '--bob', f1(Math.sin(t * 1.1 + k * 1.3) * 5) + 'px'); });
      if (focusS && t > 1.6) {
        var nf = Math.floor((t - 1.6) / focusS) % items.length;
        if (nf !== f) { f = nf; items.forEach(function (it, k) { it.classList.toggle('sp-focus', k === f); }); }
        items.forEach(function (it, k) {
          var c = cur[k]; c.push += ((k === f ? 90 : 0) - c.push) * .08; c.dim += ((k === f ? 1 : .62) - c.dim) * .08;
          setv(it, '--push', f1(c.push) + 'px'); setv(it, '--dim', c.dim.toFixed(3));
        });
      }
    });
  },
  final: function (el) { this.meters(el, 1); } };

/* --- sp-pillars: 3D bars rising from the floor --- */
C.pillars = { sel: '.sp-pillars',
  build: function (el) {
    $$('.sp-pillar', el).forEach(function (p) {
      var frag = D.createDocumentFragment();
      ['back', 'sl', 'sr', 'front', 'top'].forEach(function (f) { mk('fc ' + f, frag); }); mk('sp-pool', frag);
      p.insertBefore(frag, p.firstChild);
    });
  },
  layout: function (el, slide) {
    var Zd = Math.round(DM.W * num(el, 'depth', .3)), s = DM.P / (DM.P + Zd), wd = nums(el.dataset.width || '.1,.18');
    var pw = Math.round(Math.min(DM.W * wd[0], DM.H * wd[1])), ps = $$('.sp-pillar', el), n = ps.length;
    setv(el, '--pz', -Zd + 'px');
    var by = DM.CY + DM.OY + (DM.FLOOR - DM.OY) * s, hb = headBottom(slide) + DM.H * .03;
    var labH = Math.max.apply(0, ps.map(function (p) { var l = p.querySelector('.sp-plab'); return l ? l.offsetHeight : 0; }).concat([0])) + DM.H * .02;
    var hmax = Math.max(DM.H * .12, (by - hb) / s - labH), vmax = num(el, 'max', Math.max.apply(0, ps.map(function (p) { return +p.dataset.v || 1; })));
    ps.forEach(function (p, k) {
      var xp = p.dataset.x != null ? +p.dataset.x : (n > 1 ? 17 + 66 * k / (n - 1) : 50);
      setv(p, '--px', Math.round((xp / 100 * DM.W - DM.CX) / s) + 'px'); setv(p, '--pw', pw + 'px'); setv(p, '--pd', pw + 'px');
      setv(p, '--ph', Math.max(4, hmax * (+p.dataset.v || 1) / vmax).toFixed(1) + 'px');
    });
  },
  reset: function (el) { $$('.sp-pillar', el).forEach(function (p) { setv(p, '--e', 0); }); },
  enter: function (el, ctx) {
    $$('.sp-pillar', el).forEach(function (p, k) {
      var dl = p.dataset.delay != null ? +p.dataset.delay * 1000 : 350 + k * 150, back = p.dataset.ease === 'back';
      eTween(ctx, p, { delay: dl, dur: back ? 900 : 1700, ease: back ? eBack(1.2) : eOut5 });
    });
  } };

/* --- sp-stack: exploded iso layer stack, billboard labels, optional cutting plane + flow --- */
C.stack = { sel: '.sp-stack',
  build: function (el) {
    var iso = mk('sp-iso'), slabs = $$(':scope > .sp-slab', el), ptag = $(':scope > .sp-plane-tag', el);
    slabs.forEach(function (sl, k) {
      setv(sl, '--k', k);
      var icon = sl.querySelector(':scope > i, :scope > svg'), tag = sl.querySelector(':scope > .sp-tag'), frag = D.createDocumentFragment();
      mk('glow', frag); ['n', 'e', 'w', 's'].forEach(function (f) { mk('fs ' + f, frag); });
      var ft = mk('ft', frag); if (icon) ft.appendChild(icon);
      if (tag) { var an = mk('sp-anchor', frag); an.appendChild(tag); }
      sl.appendChild(frag); iso.appendChild(sl);
    });
    if (ptag) { mk('sp-plane', iso); var pa = mk('sp-plane-anchor', iso); pa.appendChild(ptag); }
    el.__flows = []; for (var f = 0; f < num(el, 'flow', 0); f++) el.__flows.push({ e: mk('sp-flow', iso), x: Math.random() - .5, y: Math.random() - .5, ph: Math.random(), sp: .22 + Math.random() * .16 });
    el.appendChild(iso); el.__iso = iso; setv(iso, '--n', slabs.length);
  },
  layout: function (el) {
    var a = at(el, [61, 57]), sz = num(el, 'size', .27), s = Math.min(DM.H * sz, DM.W * sz * .7), iso = el.__iso;
    el.style.left = a[0] + '%'; el.style.top = a[1] + '%';
    el.__g = { open: s * num(el, 'gap', .4), shut: s * .08, home: num(el, 'rz', -42), s: s };
    setv(iso, '--s', f1(s) + 'px'); setv(iso, '--t', f1(s * num(el, 'thick', .085)) + 'px');
    setv(iso, '--gap', f1(el.__g.open) + 'px'); setv(iso, '--gap-open', f1(el.__g.open) + 'px');
    setv(iso, '--rz-home', el.__g.home + 'deg'); setv(iso, '--rz', el.__g.home + 'deg');
    (el.__flows || []).forEach(function (f) { f.px = f.x * s * .8; f.py = f.y * s * .8; });
  },
  reset: function (el) {
    var iso = el.__iso, G = el.__g;
    setv(iso, '--gap', f1(G.shut) + 'px'); setv(iso, '--rz', (G.home - num(el, 'spin', 36)) + 'deg');
    $$('.sp-slab', iso).forEach(function (sl, k) { setv(sl, '--e', 0); setv(sl, '--drop', (900 + k * 240) + 'px'); });
    $$('.sp-tag, .sp-plane, .sp-plane-tag', iso).forEach(function (t) { setv(t, '--e', 0); });
    (el.__flows || []).forEach(function (f) { setv(f.e, '--o', 0); });
  },
  enter: function (el, ctx) {
    var iso = el.__iso, G = el.__g, n = +iso.style.getPropertyValue('--n'), spin = num(el, 'spin', 36), orbit = num(el, 'orbit', 4), osp = num(el, 'orbit-speed', .45);
    var rz0 = G.home - spin, gap = G.shut, flowOn = false;
    ctx.tween({ dur: spin > 60 ? 2600 : 2000, ease: eOut5, from: rz0, to: G.home, on: function (v) { setv(iso, '--rz', v.toFixed(2) + 'deg'); } });
    $$('.sp-slab', iso).forEach(function (sl, k) {
      var d0 = 900 + k * 240;
      ctx.tween({ delay: 60 + k * 140, dur: 850, ease: eBack(.6), on: function (v) { setv(sl, '--drop', f1(d0 * (1 - v)) + 'px'); } });
      eTween(ctx, sl, { delay: 60 + k * 140, dur: 400, ease: eOut });
    });
    ctx.tween({ delay: 900, dur: 1000, ease: eBack(1.1), from: G.shut, to: G.open, on: function (v) { gap = v; setv(iso, '--gap', f1(v) + 'px'); } });
    $$('.sp-tag', iso).forEach(function (t, k) { eTween(ctx, t, { delay: 1050 + k * 100, dur: 550, ease: eOut }); });
    $$('.sp-plane', iso).forEach(function (p) { eTween(ctx, p, { delay: 1350, dur: 700, ease: eOut }); });
    $$('.sp-plane-tag', iso).forEach(function (p) { eTween(ctx, p, { delay: 1600, dur: 600, ease: eOut }).then(function () { flowOn = true; }); });
    if (!$('.sp-plane-tag', iso)) ctx.wait(1900).then(function () { flowOn = true; });
    ctx.raf(function (now, dt, ms) {
      var t = ms / 1000; if (t < 2.4) return;
      var u = t - 2.4, gg = G.open * (1 + Math.sin(u * 1.2) * .035);
      setv(iso, '--rz', (G.home + Math.sin(u * osp) * orbit).toFixed(2) + 'deg'); setv(iso, '--gap', f1(gg) + 'px');
      if (!flowOn) return;
      var tt = +iso.style.getPropertyValue('--t').replace('px', '') || 0, base = -(n - 1) * gg / 2 - tt / 2 - G.s * .04;
      (el.__flows || []).forEach(function (f) {
        var p = (t * f.sp + f.ph) % 1;
        f.e.style.transform = 'translate3d(' + f1(f.px) + 'px,' + f1(f.py) + 'px,' + f1(base + p * (n - 1) * gg + tt) + 'px)';
        setv(f.e, '--o', (Math.sin(p * Math.PI) * .95).toFixed(3));
      });
    });
  } };

/* --- sp-runway: steps on a rising 3D path, light pulse; data-tour = camera visits each stop --- */
C.runway = { sel: '.sp-runway',
  build: function (el) {
    var steps = $$(':scope > .sp-step', el), n = steps.length, frag = D.createDocumentFragment();
    el.__segs = []; el.__nodes = []; el.__stems = [];
    for (var k = 0; k <= n; k++) { var sg = mk('sp-seg', frag); mk('', sg, 'i'); el.__segs.push(sg); }
    el.__segs[0].classList.add('fade-in'); el.__segs[n].classList.add('fade-out');
    steps.forEach(function () { el.__nodes.push(mk('sp-rnode', frag)); el.__stems.push(mk('sp-stem', frag)); });
    el.__pulse = mk('sp-pulse', frag);
    el.insertBefore(frag, el.firstChild); el.__steps = steps;
  },
  layout: function (el) {
    var p = nums(el.dataset.path || '13,71,.03 87,40,-.27'), steps = el.__steps, n = steps.length, grow = num(el, 'grow', 1), stem = DM.H * num(el, 'stem', .045);
    var pts = steps.map(function (s, k) {
      var f = n > 1 ? k / (n - 1) : 0;
      return place(lerp(p[0], p[3], f) / 100 * DM.W, lerp(p[1], p[4], f) / 100 * DM.H, Math.round(lerp(p[2], p[5], f) * DM.W));
    });
    var a = pts[0], b = pts[1] || pts[0], y = pts[n - 1], x = pts[n - 2] || pts[n - 1];
    var path = [{ x: a.x + (a.x - b.x) * 1.4, y: a.y + (a.y - b.y) * 1.4, z: a.z + (a.z - b.z) * 1.4 }].concat(pts, [{ x: y.x + (y.x - x.x) * 1.6, y: y.y + (y.y - x.y) * 1.6, z: y.z + (y.z - x.z) * 1.6 }]);
    el.__path = path;
    el.__segs.forEach(function (sg, k) { strip(sg, path[k], path[k + 1]); });
    pts.forEach(function (q, k) {
      el.__nodes[k].style.transform = 'translate3d(' + f1(q.x) + 'px,' + f1(q.y) + 'px,' + q.z + 'px)';
      el.__stems[k].style.height = px(stem); el.__stems[k].style.transform = 'translate3d(' + f1(q.x) + 'px,' + f1(q.y - stem) + 'px,' + q.z + 'px)';
      put3(steps[k], { x: q.x, y: q.y - stem, z: q.z }); setv(steps[k], '--k', lerp(1, grow, n > 1 ? k / (n - 1) : 0).toFixed(3));
    });
    if (el.hasAttribute('data-tour')) {        // camera offsets (world space) that frame each stop front-on
      var slide = el.closest('.slide'), i = panels.indexOf(slide), rot = new DOMMatrix().rotateAxisAngleSelf(0, 1, 0, pos[i] ? pos[i].ry : 0);
      el.__focus = pts.map(function (q, k) {
        var kk = lerp(1, grow, n > 1 ? k / (n - 1) : 0), ch = steps[k].offsetHeight * kk, zp = DM.P * (1 - kk / 1.08), s = DM.P / (DM.P - zp);
        var w = rot.transformPoint(new DOMPoint(q.x, q.y - stem - ch / 2 - DM.OY * (1 - 1 / s), q.z - zp));
        return { x: w.x, y: w.y, z: w.z };
      });
    }
  },
  fill: function (el, p) { el.__segs.forEach(function (sg, k) { setv(sg, '--fill', c01(p - k + 1).toFixed(3)); }); },
  along: function (el, p) {
    var P = el.__path, k = clamp(Math.floor(p), 0, P.length - 2), u = p - k, a = P[k], b = P[k + 1];
    el.__pulse.style.transform = 'translate3d(' + f1(a.x + (b.x - a.x) * u) + 'px,' + f1(a.y + (b.y - a.y) * u) + 'px,' + f1(a.z + (b.z - a.z) * u) + 'px)';
  },
  reset: function (el) { this.fill(el, 0); el.__steps.forEach(function (s) { setv(s, '--e', 0); }); el.__nodes.forEach(function (n) { n.classList.remove('hit'); }); setv(el.__pulse, '--o', 0); },
  enter: function (el, ctx) {
    var self = this, n = el.__steps.length, shown = -1, tour = el.hasAttribute('data-tour');
    ctx.tween({ delay: 100, dur: 300, on: function (v) { setv(el.__pulse, '--o', v.toFixed(3)); } });
    ctx.tween({ delay: 100, dur: num(el, 'dur', 1.7) * 1000, ease: eIO, from: 0, to: n, on: function (p) {
      self.fill(el, p + 1); self.along(el, p + 1);
      while (shown < n - 1 && p >= shown + 1 - .02) { shown++; el.__nodes[shown].classList.add('hit'); eTween(ctx, el.__steps[shown], { dur: 700, ease: eBack(.7) }); }
    } }).then(function () { self.fill(el, n + 2); if (!tour) loop(); });
    // camera tour: plays ONCE (overlapping the path fill), then holds on the pulled-back overview
    if (tour) ctx.wait(600).then(function () {
      var F = el.__focus, Z = { x: 0, y: 0, z: 0 }, legs = [], chain = Promise.resolve();
      legs.push([Z, F[0], 650]); for (var k = 1; k < F.length; k++) legs.push([F[k - 1], F[k], 800]); legs.push([F[F.length - 1], Z, 900]);
      legs.forEach(function (L, k) {
        chain = chain.then(function () { return ctx.tween({ dur: L[2], ease: eIO, on: function (v) {
          camAdd.x = lerp(L[0].x, L[1].x, v); camAdd.y = lerp(L[0].y, L[1].y, v); camAdd.z = lerp(L[0].z, L[1].z, v); } }); })
          .then(function () { return k < legs.length - 1 ? ctx.wait(450) : null; });
      });
      chain.then(function () { camAdd.x = camAdd.y = camAdd.z = 0; loop(); });
    });
    ctx.cleanup(function () { if (Stage.frozen) camAdd.x = camAdd.y = camAdd.z = 0; });
    function loop() {
      ctx.raf(function (now, dt, ms) {
        var f = (ms / 1000 * .3) % 1; self.along(el, f * (el.__path.length - 1)); setv(el.__pulse, '--o', (Math.sin(f * Math.PI) * .9).toFixed(3));
      });
    }
  } };

/* --- sp-chip: product reveal — the chip dives out of the dark, flash, slow spin --- */
C.chip = { sel: '.sp-chip',
  build: function (el) {
    mk('rays', el); mk('aura', el); mk('sp-flash', el);
    var b = mk('body', el); mk('cbot', b); ['n', 'e', 'w', 's'].forEach(function (f) { mk('cs ' + f, b); });
    var top = mk('ctop', b), die = mk('die', top), cores = mk('cores', die);
    for (var k = 0; k < 16; k++) mk('', cores, 'b');
    mk('nm', die).textContent = el.dataset.name || 'AWS'; mk('spec', top);
  },
  layout: function (el) { var a = at(el, [30, 46]); el.style.left = a[0] + '%'; el.style.top = a[1] + '%'; },
  reset: function (el) { setv(el, '--e', 0); setv(el, '--fl', 0); setv(el, '--spin', '0deg'); },
  enter: function (el, ctx) {
    var spin = 0;
    eTween(ctx, el, { dur: 1900 });
    ctx.tween({ delay: 900, dur: 1100, ease: function (t) { return t; }, on: function (v) {
      setv(el, '--fl', (v < .12 ? v / .12 : Math.pow(1 - (v - .12) / .88, 2)).toFixed(3)); setv(el, '--fls', (.6 + v * 1.4).toFixed(3)); } });
    ctx.raf(function (now, dt) {
      spin += dt * 11;
      var rz = spin + (1 - (+el.style.getPropertyValue('--e') || 0)) * -300;
      setv(el, '--spin', spin.toFixed(2) + 'deg'); setv(el, '--bob', f1(Math.sin(now / 900) * 6) + 'px');
      setv(el, '--sx', f1(Math.sin(rz * Math.PI / 180) * 55) + '%'); setv(el, '--rr', (now / 220 % 360).toFixed(1) + 'deg');
    });
  } };

/* --- sp-graph: depth graph; query highlight cycles through data-hot sets --- */
C.graph = { sel: '.sp-graph',
  build: function (el) {
    var nodes = $$(':scope > .sp-node', el), byId = {}, frag = D.createDocumentFragment();
    nodes.forEach(function (n) { byId[n.dataset.id] = n; });
    el.__edges = nodes.filter(function (n) { return n.dataset.link && byId[n.dataset.link]; }).map(function (n) {
      var e = mk('sp-edge', frag); mk('', e, 'i'); return { e: e, from: byId[n.dataset.link], to: n };
    });
    el.__pulse = mk('sp-pulse', frag); el.insertBefore(frag, el.firstChild);
    el.__nodes = nodes; el.__byId = byId;
    el.__hot = String(el.dataset.hot || '').split('|').map(function (s) { return s.trim().split(/\s+/).filter(Boolean); }).filter(function (a) { return a.length; });
  },
  layout: function (el) {
    el.__pts = new Map();
    el.__nodes.forEach(function (n) { var a = at(n, [50, 50]), p = place(a[0] / 100 * DM.W, a[1] / 100 * DM.H, Math.round(num(n, 'z', 0) * DM.W)); el.__pts.set(n, p); put3(n, p); });
    el.__edges.forEach(function (E) { strip(E.e, el.__pts.get(E.from), el.__pts.get(E.to)); });
    $$('.sp-graph-cap', el).forEach(function (c) { var a = at(c, [72, 87]); put3(c, place(a[0] / 100 * DM.W, a[1] / 100 * DM.H, 0)); });
  },
  hot: function (el, k) {
    var set = el.__hot[k]; if (!set) return;
    var keep = new Set(set);
    el.__nodes.forEach(function (n) { var on = keep.has(n.dataset.id); n.classList.toggle('sp-dim', !on); n.classList.toggle('sp-hot', on && !!n.dataset.link); });
    el.__edges.forEach(function (E) { E.e.classList.toggle('sp-dim', !keep.has(E.to.dataset.id)); });
    $$('.sp-graph-cap > *', el).forEach(function (c, j) { c.classList.toggle('on', j === k); });
  },
  reset: function (el) {
    el.__nodes.forEach(function (n) { setv(n, '--e', 0); n.classList.remove('sp-dim', 'sp-hot'); });
    el.__edges.forEach(function (E) { setv(E.e, '--fill', 0); E.e.classList.remove('sp-dim'); });
    $$('.sp-graph-cap', el).forEach(function (c) { setv(c, '--e', 0); }); setv(el.__pulse, '--o', 0);
  },
  enter: function (el, ctx) {
    var self = this, lv = function (n) { return num(n, 'lv', 0); };
    el.__nodes.forEach(function (n) { eTween(ctx, n, { delay: 150 + lv(n) * 170, dur: 450, ease: eOut }); });
    el.__edges.forEach(function (E) { ctx.tween({ delay: 230 + (lv(E.to) - 1) * 170, dur: 380, ease: eOut, on: function (v) { setv(E.e, '--fill', v.toFixed(3)); } }); });
    if (!el.__hot.length) return;
    var maxLv = Math.max.apply(0, el.__nodes.map(lv));
    ctx.wait(400 + maxLv * 170).then(function () {
      $$('.sp-graph-cap', el).forEach(function (c) { eTween(ctx, c, { dur: 500, ease: eOut }); });
      var cyc = -1, chain = [];
      ctx.raf(function (now, dt, ms) {
        var t = ms / 1000, c = Math.floor(t / 3.6), f = (t % 3.6) / 1.5;
        if (c !== cyc) {
          cyc = c; var k = c % el.__hot.length; self.hot(el, k);
          chain = el.__hot[k].map(function (id) { return el.__pts.get(el.__byId[id]); }).filter(Boolean);
          chain = chain.filter(function (p, j) { return j === 0 || p.z >= chain[j - 1].z - 1; });
        }
        if (f < 1 && chain.length > 1) {
          var q = f * (chain.length - 1), j = Math.min(chain.length - 2, Math.floor(q)), u = q - j, a = chain[j], b = chain[j + 1];
          el.__pulse.style.transform = 'translate3d(' + f1(lerp(a.x, b.x, u)) + 'px,' + f1(lerp(a.y, b.y, u)) + 'px,' + f1(lerp(a.z, b.z, u)) + 'px)';
          setv(el.__pulse, '--o', (Math.sin(f * Math.PI) * .95).toFixed(3));
        } else setv(el.__pulse, '--o', 0);
      });
    });
  },
  final: function (el) {          // clone-safe: rebuild the first hot set from attributes
    var set = String(el.dataset.hot || '').split('|')[0].trim().split(/\s+/).filter(Boolean); if (!set.length) return;
    var keep = new Set(set);
    $$(':scope > .sp-node', el).forEach(function (n) { var on = keep.has(n.dataset.id); n.classList.toggle('sp-dim', !on); n.classList.toggle('sp-hot', on && !!n.dataset.link); });
  } };

/* --- sp-tiers: tilted trays; records fall through, fewer and purer each tier --- */
C.tiers = { sel: '.sp-tiers',
  build: function (el) {
    var tiers = $$(':scope > .sp-tier', el), frag = D.createDocumentFragment();
    el.__trays = tiers.map(function (t) {
      var col = (t.className.match(/\b(bronze|silver|gold)\b/) || [''])[0];
      var tr = mk('sp-tray ' + col, frag); ['tw', 'te', 'tf', 'tt'].forEach(function (f) { mk(f, tr, 'i'); });
      var top = tr.lastChild; tr.__rips = [0, 1, 2, 3, 4].map(function () { return mk('sp-rip', top); });
      return tr;
    });
    el.__drops = []; for (var k = 0; k < 18; k++) el.__drops.push({ e: mk('sp-drop', frag), on: false });
    el.insertBefore(frag, el.firstChild); el.__tiers = tiers;
  },
  layout: function (el) {
    var tx = num(el, 'trayX', 31), rx = num(el, 'rowX', 52), ys = nums(el.dataset.y || '39,81'), n = el.__tiers.length;
    el.__tw = Math.min(DM.W * .3, DM.H * .52); el.__tz = -Math.round(DM.W * .08);
    el.__ty = el.__trays.map(function (tr, k) {
      var sy = lerp(ys[0], ys[1], n > 1 ? k / (n - 1) : 0) / 100 * DM.H, p = place(tx / 100 * DM.W, sy, el.__tz);
      put3(tr, p); setv(tr, '--tw', px(el.__tw)); setv(tr, '--td', px(el.__tw * .62)); setv(tr, '--th', px(el.__tw * .035));
      put3(el.__tiers[k], place(rx / 100 * DM.W, sy, 0));
      tr.__mc = getComputedStyle(el.__tiers[k]).getPropertyValue('--mc').trim() || '#fff';
      return p.y;
    });
  },
  reset: function (el) {
    el.__trays.concat(el.__tiers).forEach(function (t) { setv(t, '--e', 0); });
    el.__drops.forEach(function (d) { d.on = false; setv(d.e, '--o', 0); });
  },
  enter: function (el, ctx) {
    var pass = nums(el.dataset.pass || '.55,.4').concat([0]), acc = 0;
    el.__trays.forEach(function (t, k) { eTween(ctx, t, { delay: 100 + k * 160, dur: 600, ease: eOut }); });
    el.__tiers.forEach(function (t, k) { eTween(ctx, t, { delay: 300 + k * 160, dur: 600, ease: eOut }); });
    var ripple = function (k, x) {
      var r = el.__trays[k].__rips.find(function (e) { return !e.__busy; }) || el.__trays[k].__rips[0]; r.__busy = true;
      r.style.left = (50 + x / el.__tw * 100).toFixed(1) + '%'; r.style.top = '50%';
      var an = r.animate([{ transform: 'scale(.2)', opacity: .95 }, { transform: 'scale(1.8)', opacity: 0 }], { duration: 900, easing: 'cubic-bezier(.16,1,.3,1)' });
      an.onfinish = function () { r.__busy = false; }; ctx.cleanup(function () { an.cancel(); r.__busy = false; });
    };
    ctx.wait(700).then(function () {
      ctx.raf(function (now, dt) {
        var g = DM.H * 2.4, ty = el.__ty; acc += dt;
        if (acc > .16) { acc = 0; var d0 = el.__drops.find(function (d) { return !d.on; });
          if (d0) Object.assign(d0, { on: true, st: 0, x: (Math.random() - .5) * el.__tw * .72, y: ty[0] - DM.H * .3, vy: DM.H * .2 }); }
        el.__drops.forEach(function (d) {
          if (!d.on) return;
          d.vy += g * dt; d.y += d.vy * dt;
          if (d.y >= ty[d.st]) {
            ripple(d.st, d.x);
            if (Math.random() < pass[d.st] && d.st < ty.length - 1) { d.st++; d.vy *= .3; } else { d.on = false; setv(d.e, '--o', 0); return; }
          }
          setv(d.e, '--dc', el.__trays[d.st].__mc); setv(d.e, '--o', 1);
          d.e.style.transform = 'translate3d(' + f1(d.x) + 'px,' + f1(d.y) + 'px,' + el.__tz + 'px)';
        });
      });
    });
  } };

/* --- sp-rise: a leaf flies up out of the depth (data-delay seconds after landing) --- */
C.rise = { sel: '.sp-rise',
  reset: function (el) { setv(el, '--e', 0); },
  enter: function (el, ctx) { eTween(ctx, el, { delay: num(el, 'delay', .6) * 1000, dur: 1500 }); } };

/* === 10. SLIDE WIRING — one kit hook per scene; layout pass; print / resize === */
function compsIn(slide) {
  var out = []; Object.keys(C).forEach(function (k) { $$(C[k].sel, slide).forEach(function (el) { out.push([C[k], el]); }); }); return out;
}
function resetSlide(slide) { compsIn(slide).forEach(function (c) { c[0].reset && c[0].reset(c[1]); }); slide.__spReset = true; }
var KIT = {
  enter: function (slide, ctx) {
    if (ctx.reduced) return;
    if (!slide.__spReset) resetSlide(slide);
    slide.__spReset = false;
    var wait = arrival(), list = compsIn(slide);
    (wait > 30 ? ctx.wait(wait) : Promise.resolve()).then(function () {
      list.forEach(function (c) { c[0].enter && c[0].enter(c[1], ctx, slide); });
    });
  },
  final: function (slide, info) {
    // overview clone: the engine scales it from its top-left; drop the panel's world transform-origin
    if (info && info.clone) slide.style.transformOrigin = '0 0';
    compsIn(slide).forEach(function (c) { c[0].final && c[0].final(c[1]); });
  }
};
function layoutAll(d) {
  DM = d; placePanels();
  root.style.setProperty('--sp-P', DM.P + 'px'); root.style.setProperty('--sp-OY', DM.OY + 'px');
  if (vp) { vp.style.perspective = DM.P + 'px'; vp.style.perspectiveOrigin = DM.CX + 'px ' + (DM.CY + DM.OY) + 'px'; }
  world.style.left = DM.CX + 'px'; world.style.top = DM.CY + 'px';
  panels.forEach(function (s) { compsIn(s).forEach(function (c) { c[0].layout && c[0].layout(c[1], s); }); });
}
function liveLayout() {
  layoutAll(dims(innerWidth, innerHeight));
  if (canvas) { var dpr = Math.min(2, devicePixelRatio || 1); canvas.width = Math.round(DM.W * dpr); canvas.height = Math.round(DM.H * dpr); g2.setTransform(dpr, 0, 0, dpr, 0, 0); }
  initDust(); mapInit();
}

/* build components now (after the editor indexed the pristine DOM, before the engine boots) */
cfg = panels.map(slideCfg);
panels.forEach(function (s) {           // .sp-cam: one 3D wrapper per slide (see kit.css § 5)
  if (s.firstElementChild && s.firstElementChild.classList.contains('sp-cam')) return;
  var cam = mk('sp-cam'); while (s.firstChild) cam.appendChild(s.firstChild); s.appendChild(cam);
});
panels.forEach(function (s, k) {
  if (!s.dataset.scene) s.dataset.scene = 'sp-' + (k + 1);
  compsIn(s).forEach(function (c) { c[0].build && c[0].build(c[1]); });
});
var scenes = {}; panels.forEach(function (s) { scenes[s.dataset.scene] = 1; });
Object.keys(scenes).forEach(function (k) { Stage.hook(k, KIT); });
if (window.lucide) lucide.createIcons();
Stage.waitFor(D.fonts ? D.fonts.ready : null);
liveLayout(); renderThumb();
D.fonts && D.fonts.ready.then(function () { liveLayout(); });

var rzT = 0;
addEventListener('resize', function () {
  clearTimeout(rzT);
  rzT = setTimeout(function () { liveLayout(); if (Stage.index >= 0) snap(Stage.index); }, 120);
});
var printMQ = matchMedia('print');
function toPrint(on) { if (on) layoutAll(dims(1600, 900)); else { liveLayout(); if (Stage.index >= 0) snap(Stage.index); } }
printMQ.addEventListener && printMQ.addEventListener('change', function (e) { toPrint(e.matches); });
addEventListener('beforeprint', function () { toPrint(true); });
addEventListener('afterprint', function () { toPrint(false); });

/* pointer tilt — capped, eased, part of the one loop */
addEventListener('pointermove', function (e) {
  if (e.pointerType === 'touch' || reduced() || Stage.frozen) return;
  tilt.ty = (e.clientX / DM.W - .5) * 3.2; tilt.tx = -(e.clientY / DM.H - .5) * 2.2; kick();
});
D.addEventListener('pointerleave', function () { tilt.tx = tilt.ty = 0; });
kick();

/* === 11. PUBLIC API === */
window.Spatial = {
  version: '1.0', components: C, camAdd: camAdd, get cam() { return cam; }, get dims() { return DM; },
  place: place, strip: strip, eTween: eTween, arrival: arrival, layout: liveLayout,
  ease: { out: eOut, out5: eOut5, inOut: eIO, back: eBack, fly: eFly },
  /* register a new component: Spatial.component('name', { sel, build, layout, reset, enter, final }) — call before boot */
  component: function (name, def) { C[name] = def; panels.forEach(function (s) { $$(def.sel, s).forEach(function (el) { def.build && def.build(el); def.layout && def.layout(el, s); }); }); }
};
})();
