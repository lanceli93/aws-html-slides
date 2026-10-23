/* ===========================================================
   PULSE FLAVOR KIT — JS   (paste verbatim AFTER stage-engine.js [+ inline-editor.js])
   window.Pulse — persistent dotted 3D globe that re-docks per slide
   (data-globe / data-globe-opts / [data-globe-anchor]), declarative beams
   (svg.p-beams[data-links]), and helpers hooks call: packet, emitter,
   ignite, chip, spark, ticker, flash. See flavors/pulse/README.md.
   =========================================================== */
(function () {
'use strict';
var Stage = window.Stage;
if (!Stage) return console.warn('[pulse] load stage-engine.js first');
var D = document;
var $ = function (s, r) { return (r || D).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); };
var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
var lerp = function (a, b, t) { return a + (b - a) * t; };
var easeIO = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
var DPR = Math.min(2, window.devicePixelRatio || 1);
var fmt = function (n) { return Math.round(n).toLocaleString('en-US'); };
var nowS = function () { return performance.now() / 1000; };
var SVGNS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs, parent) {
  var e = D.createElementNS(SVGNS, tag);
  for (var k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
/* geometry: .p-box is a 16:9 box of 100u × 56.25u centred in the viewport.
   Positions use offset* (layout space) so mid-transition transforms never skew them. */
var unit = function () { return Math.min(innerWidth / 100, innerHeight / 56.25); };
function boxOrigin(w, h) { w = w || innerWidth; h = h || innerHeight; var u = Math.min(w / 100, h / 56.25); return { u: u, x: (w - 100 * u) / 2, y: (h - 56.25 * u) / 2 }; }
function posIn(el, box) {
  var x = 0, y = 0, e = el;
  while (e && e !== box) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
  return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight, cx: x + el.offsetWidth / 2, cy: y + el.offsetHeight / 2 };
}
var boxOf = function (el) { return el.closest('.p-box'); };

/* ================= GLOBE DATA ================= */
// coarse continent outlines [lon,lat] → recognisable dotted Earth
var LAND = [
  [[-168,66],[-140,70],[-110,73],[-80,73],[-62,60],[-55,50],[-66,44],[-76,35],[-81,25],[-90,29],[-97,26],[-97,18],[-87,15],[-80,8],[-77,8],[-85,12],[-95,16],[-105,20],[-112,28],[-118,33],[-124,40],[-125,48],[-133,56],[-150,60],[-165,60]],
  [[-55,60],[-42,60],[-20,70],[-20,80],[-60,82],[-72,77]],
  [[-80,8],[-60,10],[-50,0],[-35,-7],[-40,-22],[-48,-28],[-58,-38],[-65,-55],[-72,-50],[-72,-30],[-70,-18],[-80,-5]],
  [[-10,36],[-9,43],[-2,44],[-5,48],[2,51],[8,54],[10,58],[5,62],[15,69],[28,71],[40,67],[45,55],[40,45],[28,41],[22,37],[15,38],[12,44],[5,43],[-2,37]],
  [[-6,50],[2,51],[0,54],[-3,58],[-6,57]],
  [[-17,15],[-17,21],[-10,30],[-5,36],[10,37],[20,32],[32,31],[35,28],[43,12],[51,12],[40,-2],[40,-15],[35,-25],[20,-35],[17,-30],[12,-15],[13,-5],[9,4],[-8,5],[-15,10]],
  [[28,41],[40,45],[45,55],[40,67],[60,70],[80,73],[105,78],[140,72],[180,68],[170,60],[160,58],[140,54],[135,43],[128,35],[122,30],[120,22],[108,20],[106,10],[100,13],[98,8],[100,3],[95,15],[90,22],[80,15],[77,8],[72,20],[67,25],[57,25],[52,27],[48,30],[56,24],[59,22],[52,16],[44,13],[36,27],[35,33],[30,36]],
  [[114,-22],[122,-18],[130,-12],[137,-12],[142,-11],[146,-19],[153,-26],[150,-37],[140,-38],[132,-32],[116,-35],[114,-28]],
  [[130,31],[135,34],[141,36],[142,41],[145,44],[141,45],[139,39],[132,34]],
  [[95,5],[105,-6],[115,-8],[120,-9],[125,-8],[140,-3],[150,-6],[140,-9],[120,-5],[110,-2],[105,2]],
  [[44,-25],[50,-15],[49,-12],[44,-17]],
  [[166,-46],[174,-41],[178,-38],[172,-34],[168,-44]]
];
// 33 region-like sites; the last 4 are "new" (drawn orange)
var REGIONS = [
  ['iad',-77.5,39],['cmh',-83,40],['sfo',-122,37.5],['pdx',-120,45.8],['yul',-73.6,45.5],['yyc',-114,51],['gru',-46.6,-23.5],
  ['dub',-6.3,53.3],['lhr',-.1,51.5],['cdg',2.35,48.9],['fra',8.7,50.1],['zrh',8.5,47.4],['arn',18,59.3],['mxp',9.2,45.5],['zaz',-.9,41.6],
  ['bah',50.6,26],['auh',54.4,24.5],['tlv',34.8,32],['cpt',18.4,-33.9],['bom',72.9,19],['hyd',78.5,17.4],
  ['sin',103.8,1.35],['syd',151.2,-33.9],['cgk',106.8,-6.2],['mel',145,-37.8],['nrt',139.7,35.7],['icn',127,37.5],['kix',135.5,34.7],['hkg',114.2,22.3],
  ['qro',-100,20.6],['bkk',100.5,13.7],['tpe',121.5,25],['kul',101.7,3.1]
];
var ARCS = [['iad','dub'],['iad','gru'],['pdx','nrt'],['sfo','syd'],['dub','fra'],['fra','bom'],['fra','cpt'],['bom','sin'],['sin','syd'],
  ['sin','nrt'],['nrt','icn'],['fra','bah'],['gru','cpt'],['iad','fra'],['hkg','sin'],['pdx','iad'],['lhr','tlv'],['qro','iad'],['kul','bkk'],['tpe','nrt']];
function ll2v(lon, lat) { var p = lat * Math.PI / 180, l = lon * Math.PI / 180; return [Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l)]; }
function inPoly(x, y, poly) {
  var inside = false;
  for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
var DOTS = (function () {
  var N = 16000, GA = Math.PI * (3 - Math.sqrt(5)), out = [];
  for (var i = 0; i < N; i++) {
    var y = 1 - (i + .5) / N * 2, rad = Math.sqrt(1 - y * y), th = i * GA, x = Math.cos(th) * rad, z = Math.sin(th) * rad;
    var lat = Math.asin(y) * 180 / Math.PI, lon = Math.atan2(x, z) * 180 / Math.PI;
    if (LAND.some(function (p) { return inPoly(lon, lat, p); })) out.push(x, y, z);
  }
  return new Float32Array(out);
})();
var ND = DOTS.length / 3;
var REG = REGIONS.map(function (r, i) { return { k: r[0], i: i, v: ll2v(r[1], r[2]), isNew: i >= REGIONS.length - 4, litAt: -9, sx: 0, sy: 0, sz: -1 }; });
var regIdx = {}; REG.forEach(function (r, i) { regIdx[r.k] = i; });
var S_ARC = 48;
var ARC = ARCS.map(function (ab, j) {
  var A = REG[regIdx[ab[0]]].v, B = REG[regIdx[ab[1]]].v;
  var dot = clamp(A[0] * B[0] + A[1] * B[1] + A[2] * B[2], -1, 1), om = Math.acos(dot), so = Math.sin(om);
  var lift = Math.min(.34, .1 + om * .13), pts = new Float32Array(S_ARC * 3);
  for (var s = 0; s < S_ARC; s++) {
    var f = s / (S_ARC - 1), wa = Math.sin((1 - f) * om) / so, wb = Math.sin(f * om) / so, h = 1 + lift * Math.sin(Math.PI * f);
    pts[s * 3] = (A[0] * wa + B[0] * wb) * h; pts[s * 3 + 1] = (A[1] * wa + B[1] * wb) * h; pts[s * 3 + 2] = (A[2] * wa + B[2] * wb) * h;
  }
  return { pts: pts, P: 3.6 + (j % 5) * .6, o: j * .83, Pf: 2.3 + j * .05 };
});

/* ================= GLOBE RENDERER (pure: draws state g into any 2D context) ================= */
function sprite(stops, size) {
  size = size || 64;
  var c = D.createElement('canvas'); c.width = c.height = size;
  var g = c.getContext('2d'), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); }); g.fillStyle = gr; g.fillRect(0, 0, size, size); return c;
}
var SPR_PINK = sprite([[0, 'rgba(255,240,255,1)'], [.18, 'rgba(240,171,252,.9)'], [.45, 'rgba(217,70,239,.35)'], [1, 'rgba(217,70,239,0)']]);
var SPR_ORNG = sprite([[0, 'rgba(255,250,235,1)'], [.18, 'rgba(255,190,90,.95)'], [.45, 'rgba(255,153,0,.4)'], [1, 'rgba(255,153,0,0)']]);
var BUCKETS = 8, BCOL = [];
for (var bk = 0; bk < BUCKETS; bk++) { var bt = bk / (BUCKETS - 1); BCOL.push('rgba(' + Math.round(lerp(120, 248, bt)) + ',' + Math.round(lerp(86, 196, bt)) + ',' + Math.round(lerp(210, 255, bt)) + ',' + (.16 + .84 * bt).toFixed(3) + ')'); }
var pX = new Float32Array(ND), pY = new Float32Array(ND), pB = new Int8Array(ND);
var LV = (function () { var v = [-.5, .55, .68], m = Math.hypot(v[0], v[1], v[2]); return v.map(function (c) { return c / m; }); })();
var ax = new Float32Array(S_ARC), ay = new Float32Array(S_ARC), av = new Uint8Array(S_ARC);
var tmp = { x: 0, y: 0, z: 0 };
function proj(v, cx, cy, r, R, out) {
  var xr = v[0] * R.cY + v[2] * R.sY, zr = v[2] * R.cY - v[0] * R.sY;
  out.x = cx + xr * r; out.y = cy - (v[1] * R.cT - zr * R.sT) * r; out.z = v[1] * R.sT + zr * R.cT; return out;
}
// g: {cx,cy,r,alpha,tilt,arcs,ring,reg,lit,fireAt,boost}  ·  t: seconds  ·  still: no motion (reduced/thumb)
function drawGlobe(ctx, W, H, g, t, still) {
  var A = g.alpha, r = g.r, cx = g.cx, cy = g.cy;
  if (A < .01 || r < 1) { REG.forEach(function (R) { R.sz = -1; }); return; }
  var yaw = .55 + (still ? 0 : t * .055);
  var Rt = { cY: Math.cos(yaw), sY: Math.sin(yaw), cT: Math.cos(g.tilt), sT: Math.sin(g.tilt) };
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = A;
  var gr = ctx.createRadialGradient(cx, cy, r * .8, cx, cy, r * 1.32);
  gr.addColorStop(0, 'rgba(139,92,246,0)'); gr.addColorStop(.42, 'rgba(167,139,250,' + (.20 + g.boost * .25) + ')');
  gr.addColorStop(.5, 'rgba(217,70,239,' + (.12 + g.boost * .2) + ')'); gr.addColorStop(1, 'rgba(217,70,239,0)');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, r * 1.32, 0, 7); ctx.fill();
  if (g.ring > .01) drawRing(ctx, g, t, -1, still);
  ctx.globalCompositeOperation = 'source-over';
  gr = ctx.createRadialGradient(cx - r * .38, cy - r * .42, 0, cx, cy, r * 1.05);
  gr.addColorStop(0, 'rgba(74,42,150,.62)'); gr.addColorStop(.55, 'rgba(26,12,58,.86)'); gr.addColorStop(1, 'rgba(7,3,16,.95)');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
  var ds = Math.max(.9, r * .0052), i, j;
  for (i = 0, j = 0; i < ND; i++, j += 3) {
    var x = DOTS[j], y = DOTS[j + 1], z = DOTS[j + 2];
    var xr = x * Rt.cY + z * Rt.sY, zr = z * Rt.cY - x * Rt.sY, yr = y * Rt.cT - zr * Rt.sT, zz = y * Rt.sT + zr * Rt.cT;
    var sx = cx + xr * r, sy = cy - yr * r;
    if (sx < -ds || sx > W + ds || sy < -ds || sy > H + ds) { pB[i] = -2; continue; }
    pX[i] = sx; pY[i] = sy;
    if (zz < 0) { pB[i] = -1; continue; }
    var b = Math.max(0, xr * LV[0] + yr * LV[1] + zz * LV[2]);
    pB[i] = Math.min(BUCKETS - 1, Math.floor((.34 + .66 * b) * Math.min(1, zz * 2.6 + .25) * BUCKETS));
  }
  ctx.globalAlpha = A * .5; ctx.fillStyle = 'rgba(167,139,250,.16)'; ctx.beginPath();
  for (i = 0; i < ND; i++) if (pB[i] === -1) ctx.rect(pX[i] - ds * .4, pY[i] - ds * .4, ds * .8, ds * .8);
  ctx.fill();
  ctx.globalAlpha = A;
  var round = ds > 1.8;
  for (var k = 0; k < BUCKETS; k++) {
    ctx.fillStyle = BCOL[k]; ctx.beginPath();
    for (i = 0; i < ND; i++) {
      if (pB[i] !== k) continue;
      if (round) { ctx.moveTo(pX[i] + ds * .55, pY[i]); ctx.arc(pX[i], pY[i], ds * .55, 0, 6.2832); }
      else ctx.rect(pX[i] - ds * .5, pY[i] - ds * .5, ds, ds);
    }
    ctx.fill();
  }
  gr = ctx.createLinearGradient(cx - r * .8, cy - r * .8, cx + r * .6, cy + r * .6);
  gr.addColorStop(0, 'rgba(240,200,255,.6)'); gr.addColorStop(.5, 'rgba(167,139,250,.12)'); gr.addColorStop(1, 'rgba(139,92,246,0)');
  ctx.strokeStyle = gr; ctx.lineWidth = Math.max(1, r * .006); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
  ctx.globalCompositeOperation = 'lighter';
  if (g.arcs > .01) drawArcs(ctx, g, t, Rt, still);
  drawRegions(ctx, g, t, Rt, still);
  if (g.ring > .01) drawRing(ctx, g, t, 1, still);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
}
function drawRegions(ctx, g, t, Rt, still) {
  var cx = g.cx, cy = g.cy, r = g.r, sz = Math.max(7, r * .075) * (.6 + .4 * g.reg);
  for (var i = 0; i < REG.length; i++) {
    var R = REG[i];
    proj(R.v, cx, cy, r, Rt, tmp); R.sx = tmp.x; R.sy = tmp.y; R.sz = tmp.z;     // screen pos, read by emitters
    if (g.reg < .01) continue;
    if (i >= g.lit) { R.litAt = -9; continue; }
    if (R.litAt < 0) R.litAt = t;
    if (tmp.z < -.02) continue;
    var vis = clamp(tmp.z * 6, 0, 1) * g.alpha * g.reg, fl = still ? 0 : Math.max(0, 1 - (t - R.litAt) / .7);
    var s = sz * (1 + fl * 2.2) * (R.isNew ? 1.25 : 1);
    ctx.globalAlpha = vis; ctx.drawImage(R.isNew ? SPR_ORNG : SPR_PINK, tmp.x - s / 2, tmp.y - s / 2, s, s);
    if (r > 120 && !still) {
      var ph = ((t * .45 + i * .137) % 1);
      ctx.globalAlpha = vis * (1 - ph) * .5; ctx.strokeStyle = R.isNew ? '#ffb547' : '#f0abfc'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(tmp.x, tmp.y, sz * (.25 + ph * .9), 0, 7); ctx.stroke();
    }
  }
  ctx.globalAlpha = g.alpha;
}
var vtmp = [0, 0, 0];
function drawArcs(ctx, g, t, Rt, still) {
  var cx = g.cx, cy = g.cy, r = g.r, fire = g.fireAt, lw = Math.max(1, r * .0042);
  for (var j = 0; j < ARC.length; j++) {
    var a = ARC[j], P = a.pts, u, trail = 1, s;
    if (still) { u = 2; }
    else if (fire !== null) {
      var tau = t - fire; if (tau < 0) continue;
      u = ((tau / a.Pf) % 1) * 1.3 - .05;
      if (tau < a.Pf) trail = clamp(u, 0, 1);
    } else u = (((t + a.o) / a.P) % 1) * 1.6 - .3;
    for (s = 0; s < S_ARC; s++) {
      vtmp[0] = P[s * 3]; vtmp[1] = P[s * 3 + 1]; vtmp[2] = P[s * 3 + 2];
      proj(vtmp, cx, cy, r, Rt, tmp); ax[s] = tmp.x; ay[s] = tmp.y;
      var dx = (tmp.x - cx) / r, dy = (tmp.y - cy) / r;
      av[s] = (tmp.z > 0 || dx * dx + dy * dy > 1) ? 1 : 0;
    }
    var endS = Math.floor(trail * (S_ARC - 1));
    ctx.globalAlpha = g.alpha * g.arcs * (fire !== null || still ? .32 : .22); ctx.strokeStyle = '#d8b4fe'; ctx.lineWidth = lw * .8; ctx.beginPath();
    for (s = 1; s <= endS; s++) if (av[s] && av[s - 1]) { ctx.moveTo(ax[s - 1], ay[s - 1]); ctx.lineTo(ax[s], ay[s]); }
    ctx.stroke();
    if (u < -.05 || u > 1.3) continue;
    var head = u * (S_ARC - 1), tail = .3 * (S_ARC - 1);
    for (s = Math.max(1, Math.floor(head - tail)); s <= Math.min(S_ARC - 1, Math.ceil(head)); s++) {
      if (!av[s] || !av[s - 1]) continue;
      var f = 1 - (head - s) / tail; if (f <= 0) continue;
      ctx.globalAlpha = g.alpha * g.arcs * f * f; ctx.strokeStyle = f > .8 ? '#ffd28a' : (f > .45 ? '#f0abfc' : '#a78bfa'); ctx.lineWidth = lw * (1 + f * 1.4);
      ctx.beginPath(); ctx.moveTo(ax[s - 1], ay[s - 1]); ctx.lineTo(ax[s], ay[s]); ctx.stroke();
    }
    var hi = Math.round(head);
    if (hi >= 0 && hi < S_ARC && av[hi]) { var sp = Math.max(6, r * .06); ctx.globalAlpha = g.alpha * g.arcs; ctx.drawImage(SPR_ORNG, ax[hi] - sp / 2, ay[hi] - sp / 2, sp, sp); }
  }
  ctx.globalAlpha = g.alpha;
}
function drawRing(ctx, g, t, side, still) {
  var cx = g.cx, cy = g.cy, R = g.r * 1.3, cR = Math.cos(1.18), sR = Math.sin(1.18), cK = Math.cos(-.32), sK = Math.sin(-.32);
  var pt = function (a) { var x = Math.cos(a), z = Math.sin(a), y1 = -z * sR, z1 = z * cR; return [cx + (x * cK - y1 * sK) * R, cy - (x * sK + y1 * cK) * R, z1]; };
  ctx.globalAlpha = g.alpha * g.ring * .55; ctx.strokeStyle = 'rgba(216,180,254,.6)'; ctx.lineWidth = 1; ctx.setLineDash([2, 6]); ctx.beginPath();
  var started = false;
  for (var i = 0; i <= 120; i++) {
    var p = pt(i / 120 * 6.2832);
    if (Math.sign(p[2] || 1) !== side) { started = false; continue; }
    if (started) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); started = true;
  }
  ctx.stroke(); ctx.setLineDash([]);
  for (var k = 0; k < 2; k++) {
    var q = pt((still ? 1 : t * .32) + k * 3.3);
    if (Math.sign(q[2] || 1) !== side) continue;
    var s = Math.max(10, g.r * .07) * (side > 0 ? 1 : .6);
    ctx.globalAlpha = g.alpha * g.ring * (side > 0 ? 1 : .4); ctx.drawImage(k ? SPR_PINK : SPR_ORNG, q[0] - s / 2, q[1] - s / 2, s, s);
  }
  ctx.globalAlpha = g.alpha;
}

/* ================= DOCKING — data-globe="preset" · data-globe-opts="k:v; …" · [data-globe-anchor] ================= */
// x, y, r in u (the .p-box is 100u × 56.25u); alpha/tilt/arcs/ring/reg are 0..1-ish
var PRESETS = {
  'hero-right': { x: 66, y: 28.6, r: 25,  alpha: 1,   tilt: .42, arcs: 1,   ring: 1,  reg: 1 },
  'hero-left':  { x: 27, y: 31,   r: 22,  alpha: 1,   tilt: .38, arcs: .8,  ring: 0,  reg: 1 },
  'edge-left':  { x: 9,  y: 28,   r: 32,  alpha: .85, tilt: .30, arcs: .6,  ring: 0,  reg: .8 },
  'edge-right': { x: 91, y: 28,   r: 32,  alpha: .85, tilt: .30, arcs: .6,  ring: 0,  reg: .8 },
  'side-right': { x: 78, y: 20.8, r: 14.5, alpha: 1,  tilt: .38, arcs: .45, ring: .6, reg: 1 },
  'side-left':  { x: 22, y: 24,   r: 14.5, alpha: 1,  tilt: .38, arcs: .45, ring: .6, reg: 1 },
  'backdrop':   { x: 50, y: 25.4, r: 21,  alpha: .42, tilt: .34, arcs: .7,  ring: 0,  reg: .6 },
  'horizon':    { x: 50, y: 78.5, r: 45,  alpha: 1,   tilt: .12, arcs: 1,   ring: 0,  reg: 1 },
  'center':     { x: 50, y: 20.4, r: 15,  alpha: 1,   tilt: .34, arcs: 1,   ring: 1,  reg: 1 },
  'mini':       { x: 50, y: 28,   r: 3,   alpha: 1,   tilt: .36, arcs: 0,   ring: 0,  reg: .7 },
  'core':       { x: 50, y: 28,   r: .6,  alpha: 0,   tilt: .36, arcs: 0,   ring: 0,  reg: 0 },
  'hidden':     {                         alpha: 0,              arcs: 0,   ring: 0,  reg: 0 }
};
var VIS = ['alpha', 'tilt', 'arcs', 'ring', 'reg'], KEYS = ['cx', 'cy', 'r'].concat(VIS);
function parseOpts(s) {
  var o = {};
  (s || '').split(/[;,]/).forEach(function (kv) {
    var m = kv.split(':'); if (m.length < 2) return;
    var k = m[0].trim(), v = m[1].trim(); if (k) o[k] = isNaN(+v) ? v : +v;
  });
  return o;
}
// resolve a slide's dock for a W×H viewport → {cx,cy,r (px), alpha…, lit, power, fire, keepGeo}
function dockOf(slide, W, H) {
  var name = slide.dataset.globe || 'hidden', P = PRESETS[name] || PRESETS.hidden, o = parseOpts(slide.dataset.globeOpts);
  var org = boxOrigin(W, H), u = org.u, g = {}, uu = null;
  var an = $('[data-globe-anchor]', slide), box = an && boxOf(an);
  if (o.x != null || o.y != null || o.r != null) uu = { x: o.x != null ? o.x : P.x || 50, y: o.y != null ? o.y : P.y || 28, r: o.r != null ? o.r : P.r || 15 };
  else if (an && box && box.offsetWidth) { var cu = box.offsetWidth / 100, p = posIn(an, box); uu = { x: p.cx / cu, y: p.cy / cu, r: p.w / 2 / cu }; }
  else if (P.x != null) uu = { x: P.x, y: P.y, r: P.r };
  if (uu) { g.cx = org.x + uu.x * u; g.cy = org.y + uu.y * u; g.r = uu.r * u; } else g.keepGeo = true;
  VIS.forEach(function (k) { g[k] = o[k] != null ? o[k] : (P[k] != null ? P[k] : (k === 'tilt' ? .36 : 0)); });
  g.lit = o.lit != null ? o.lit : 33; g.power = o.power || 0; g.fire = o.fire != null ? o.fire : null;
  return g;
}

/* ================= LIVE GLOBE — re-docks on Stage.onChange, one shared loop ================= */
var cv = null, cx2 = null, W = 0, H = 0;
var G = { cx: 0, cy: 0, r: 0, alpha: 0, tilt: .4, arcs: 0, ring: 0, reg: 0, lit: 33, fireAt: null, boost: 0 };
var GT = { from: null, to: null, t0: 0, dur: 0 }, litPow = null, dirty = true;
var cur = { slide: null, t0: 0 };
function resizeCanvas(c, w, h) { c.width = Math.round(w * DPR); c.height = Math.round(h * DPR); }
function dock(slide, instant) {
  var to = dockOf(slide, innerWidth, innerHeight), t = nowS();
  if (to.keepGeo) { to.cx = G.cx; to.cy = G.cy; to.r = G.r * 1.12; }
  GT.from = {}; KEYS.forEach(function (k) { GT.from[k] = G[k]; });
  GT.to = to; GT.t0 = t; GT.dur = (instant || Stage.reduced) ? 0 : 1.7;
  G.fb = false;
  G.fireAt = to.fire != null && !Stage.reduced ? t + to.fire : (to.fire != null ? 0 : null);
  if (to.power && !Stage.reduced) { litPow = { t0: t + .4, dur: to.power, to: to.lit }; G.lit = 0; } else { litPow = null; G.lit = to.lit; }
  dirty = true;
}
function frame(now, dt) {
  var t = now / 1000;
  if (GT.to) { var k = GT.dur ? easeIO(clamp((t - GT.t0) / GT.dur, 0, 1)) : 1; KEYS.forEach(function (key) { G[key] = lerp(GT.from[key], GT.to[key], k); }); if (k < 1) dirty = true; }
  if (litPow) { G.lit = litPow.to * clamp((t - litPow.t0) / litPow.dur, 0, 1); if (G.lit >= litPow.to) litPow = null; }
  if (G.fireAt !== null && G.fireAt > 0 && !G.fb && t >= G.fireAt) { G.fb = true; G.boost = 1.3; }   // every arc fires → atmosphere flares
  if (G.boost > 0) { G.boost = Math.max(0, G.boost - dt * 1.1); dirty = true; }
  if (cur.slide && !Stage.reduced) runLinks(cur.slide, t - cur.t0);
  if (Stage.reduced && !dirty) return;
  dirty = false;
  cx2.setTransform(DPR, 0, 0, DPR, 0, 0); cx2.clearRect(0, 0, W, H);
  drawGlobe(cx2, W, H, G, t, Stage.reduced);
}

/* ================= THUMBNAILS / PRINT — paint each slide's dock into its data-thumb ================= */
function renderThumbs() {
  var TW = 960, TH = 540, c = D.createElement('canvas'); c.width = TW; c.height = TH;
  var x = c.getContext('2d');
  Stage.slides.forEach(function (s) {
    if (s.hasAttribute('data-thumb-keep')) return;
    x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    var bg = x.createRadialGradient(TW * .7, TH * .4, 0, TW * .7, TH * .4, TW * .8);
    bg.addColorStop(0, '#12082a'); bg.addColorStop(.45, '#0a0614'); bg.addColorStop(1, '#060309');
    x.fillStyle = bg; x.fillRect(0, 0, TW, TH);
    [[.1, .05, .5, 'rgba(139,92,246,.30)'], [.92, .95, .45, 'rgba(217,70,239,.20)']].forEach(function (n) {
      var gg = x.createRadialGradient(TW * n[0], TH * n[1], 0, TW * n[0], TH * n[1], TW * n[2]);
      gg.addColorStop(0, n[3]); gg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gg; x.fillRect(0, 0, TW, TH);
    });
    var g = dockOf(s, TW, TH);
    if (!g.keepGeo && g.alpha > .01) { g.fireAt = null; g.boost = 0; drawGlobe(x, TW, TH, g, 0, true); }
    var url = 'url(' + c.toDataURL('image/jpeg', .82) + ') center / cover no-repeat, #07040d';
    s.dataset.thumb = url; s.style.setProperty('--stage-thumb', url);
  });
  dirty = true;
}

/* ================= BEAMS — svg.p-beams[data-links="from > to | opts; …"] ================= */
var gid = 0;
function beamDefs(svg) {
  var id = 'pb' + (++gid), w = svg.parentNode.offsetWidth || 1000, h = svg.parentNode.offsetHeight || 600, d = svgEl('defs', {}, svg);
  var lg = svgEl('linearGradient', { id: id + 'g', gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: w, y2: 0 }, d);
  [['0', '#a78bfa'], ['.5', '#e879f9'], ['1', '#ff9900']].forEach(function (s) { svgEl('stop', { offset: s[0], 'stop-color': s[1] }, lg); });
  // userSpace filter region: a straight horizontal path has a zero-height bbox, which kills a bbox-relative blur
  var f = svgEl('filter', { id: id + 'f', filterUnits: 'userSpaceOnUse', x: -60, y: -60, width: w + 120, height: h + 120 }, d);
  svgEl('feGaussianBlur', { stdDeviation: 2.4 }, f);
  svg.__pid = id; return id;
}
function addBeam(svg, d, n) {
  var id = svg.__pid || beamDefs(svg), g = svgEl('g', {}, svg), c = [];
  var base = svgEl('path', { class: 'p-beam-base', d: d }, g);
  if (svg.classList.contains('bright')) base.setAttribute('stroke', 'url(#' + id + 'g)');
  for (var k = 0; k < (n || 1); k++) c.push({
    glow: svgEl('path', { class: 'p-beam-glow', d: d, pathLength: 100, 'stroke-dasharray': '18 400', stroke: 'url(#' + id + 'g)', filter: 'url(#' + id + 'f)', opacity: 0 }, g),
    core: svgEl('path', { class: 'p-beam-core', d: d, pathLength: 100, 'stroke-dasharray': '6 400', opacity: 0 }, g), vis: false });
  return { base: base, c: c };
}
// one comet: p 0→1 head travel (to 1.18 so the tail clears), rev = flow end→start
function setBeam(b, p, rev) {
  var on = p >= 0 && p <= 1.18;
  if (on !== b.vis) { b.glow.setAttribute('opacity', on ? 1 : 0); b.core.setAttribute('opacity', on ? 1 : 0); b.vis = on; }
  if (!on) return;
  if (rev) { var hr = (1 - p) * 100; b.glow.setAttribute('stroke-dashoffset', -hr); b.core.setAttribute('stroke-dashoffset', -hr); return; }
  var h = p * 100; b.glow.setAttribute('stroke-dashoffset', 18 - h); b.core.setAttribute('stroke-dashoffset', 6 - h);
}
var f1 = function (v) { return v.toFixed(1); };
function curve(a, b, kind) {
  var dx = b[0] - a[0], dy = b[1] - a[1];
  if (kind === 's') return 'M' + f1(a[0]) + ' ' + f1(a[1]) + ' L' + f1(b[0]) + ' ' + f1(b[1]);
  if (!kind || kind === 'auto') kind = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
  var c1, c2;
  if (kind === 'v') { c1 = [a[0], a[1] + dy * .5]; c2 = [b[0], b[1] - dy * .5]; }
  else if (kind === 'radial' && a[2]) { var L = Math.hypot(dx, dy); c1 = [a[0] + a[2][0] * L * .5, a[1] + a[2][1] * L * .5]; c2 = [b[0] - L * .45 * Math.sign(dx || 1), b[1]]; }
  else { var m = Math.max(20, Math.abs(dx) * .5) * Math.sign(dx || 1); c1 = [a[0] + m, a[1]]; c2 = [b[0] - m, b[1]]; }
  return 'M' + f1(a[0]) + ' ' + f1(a[1]) + ' C' + f1(c1[0]) + ' ' + f1(c1[1]) + ' ' + f1(c2[0]) + ' ' + f1(c2[1]) + ' ' + f1(b[0]) + ' ' + f1(b[1]);
}
// "sel@side" → [{el, pt}] in .p-box coords. side r|l|t|b|c; a child .p-port.<side> wins over the box edge
function ends(spec, slide, box, other) {
  var m = spec.trim().split('@'), sel = m[0].trim(), side = (m[1] || '').trim();
  if (sel === 'globe') return [{ el: null, globe: true }];
  // @o = a point on the element's circular outline, facing the other end (round hubs)
  return $$(sel, slide).map(function (el) {
    var port = side && $(':scope > .p-port.' + side, el), p = posIn(port || el, box), pt;
    if (side === 'o') return { el: el, pt: [p.cx, p.cy], ring: Math.max(p.w, p.h) / 2 + 6 };
    if (port || side === 'c' || !side) pt = [p.cx, p.cy];
    else pt = side === 'r' ? [p.x + p.w, p.cy] : side === 'l' ? [p.x, p.cy] : side === 't' ? [p.cx, p.y] : [p.cx, p.y + p.h];
    return { el: el, pt: pt };
  });
}
function globePt(slide, box, toward) {      // limb point of the slide's dock, facing `toward`, in box coords
  var g = dockOf(slide, innerWidth, innerHeight), o = boxOrigin(), cu = box.offsetWidth / 100, k = cu / o.u;
  var c = [(g.cx - o.x) * k, (g.cy - o.y) * k], r = g.r * k, dx = toward[0] - c[0], dy = toward[1] - c[1], L = Math.hypot(dx, dy) || 1;
  return [c[0] + dx / L * r * 1.005, c[1] + dy / L * r * 1.005, [dx / L, dy / L]];
}
var LINKS = [];   // {slide, svg, at, dur, every, alt, light, beam, fired}
function buildLinks(slide) {
  LINKS = LINKS.filter(function (L) { return L.slide !== slide; });
  $$('svg.p-beams[data-links]', slide).forEach(function (svg) {
    var box = boxOf(svg); if (!box || !box.offsetWidth) return;
    svg.innerHTML = ''; svg.__pid = null; beamDefs(svg);
    var idx = 0;
    svg.dataset.links.split(';').forEach(function (entry) {
      if (!entry.trim()) return;
      var parts = entry.split('|'), ft = parts[0].split('>'), o = { n: 1, dur: .9, every: 3.2, at: .6, stag: .15 }, flags = {};
      (parts[1] || '').trim().split(/\s+/).forEach(function (tk) { if (!tk) return; var kv = tk.split('='); if (kv.length > 1) o[kv[0]] = isNaN(+kv[1]) ? kv[1] : +kv[1]; else flags[kv[0]] = true; });
      var A = ends(ft[0], slide, box), B = ends(ft[1] || '', slide, box), pairs = [];
      if (A.length === B.length) A.forEach(function (a, i) { pairs.push([a, B[i]]); });
      else if (A.length === 1) B.forEach(function (b) { pairs.push([A[0], b]); });
      else if (B.length === 1) A.forEach(function (a) { pairs.push([a, B[0]]); });
      else A.forEach(function (a) { B.forEach(function (b) { pairs.push([a, b]); }); });
      pairs.forEach(function (pr) {
        var a = pr[0], b = pr[1], kind = o.curve;
        if (a.globe) { a = { pt: globePt(slide, box, b.pt) }; kind = kind || 'radial'; }
        if (b.globe) { b = { pt: globePt(slide, box, a.pt) }; }
        var rim = function (q, other) { var dx = other[0] - q.pt[0], dy = other[1] - q.pt[1], L = Math.hypot(dx, dy) || 1; return { pt: [q.pt[0] + dx / L * q.ring, q.pt[1] + dy / L * q.ring, [dx / L, dy / L]] }; };
        if (a.ring) { a = rim(a, b.pt); kind = kind || 'radial'; }
        if (b.ring) b = rim(b, a.pt);
        LINKS.push({ slide: slide, at: o.at + (idx++) * o.stag, dur: o.dur, every: o.every, n: o.n, alt: !!flags.alt,
          light: flags.light ? pr[1].el : null, beam: addBeam(svg, curve(a.pt, b.pt, kind), o.n), fired: false });
      });
    });
  });
}
function runLinks(slide, tau) {
  for (var i = 0; i < LINKS.length; i++) {
    var L = LINKS[i]; if (L.slide !== slide) continue;
    for (var k = 0; k < L.n; k++) {
      var x = tau - L.at - k * L.every / L.n;
      if (x < 0) { setBeam(L.beam.c[k], -1); continue; }
      var cyc = Math.floor(x / L.every);
      setBeam(L.beam.c[k], (x - cyc * L.every) / L.dur, L.alt && cyc % 2 === 1);
    }
    if (L.light && !L.fired && tau >= L.at + L.dur * .96) { L.fired = true; L.light.classList.add('on'); }
  }
}
function resetLinks(slide) {
  LINKS.forEach(function (L) { if (L.slide !== slide) return; L.fired = false; if (L.light) L.light.classList.remove('on'); L.beam.c.forEach(function (c) { setBeam(c, -1); }); });
}
// final state inside ANY root (live slide or overview clone): light targets on
function finalLinks(root) {
  $$('svg.p-beams[data-links]', root).forEach(function (svg) {
    svg.dataset.links.split(';').forEach(function (entry) {
      var parts = entry.split('|'); if (!/\blight\b/.test(parts[1] || '')) return;
      var to = (parts[0].split('>')[1] || '').split('@')[0].trim();
      if (to && to !== 'globe') $$(to, root).forEach(function (el) { el.classList.add('on'); });
    });
  });
}

/* ================= COMPONENT HELPERS (called from deck hooks) ================= */
// Pulse.loop(ctx, fn(t, tau)) — per-slide loop in seconds (t = absolute, tau = since entry)
function loop(ctx, fn) { return ctx.raf(function (now, dt, ms) { return fn(now / 1000, ms / 1000, dt); }); }

// Pulse.packet(svg, steps, opts) — a packet travels stop-and-go across .p-step elements, lighting each
function packet(svg, steps, o) {
  o = Object.assign({ start: .7, seg: .42, loop: 3.6, hold: .8, onStage: null, onArrive: null }, o);
  var P = { x0: 0, x1: 1, y: 0, fr: [], el: {} }, maxP = 0, lastK = -1, arrived = false, n = steps.length;
  function build() {
    var box = boxOf(svg); svg.innerHTML = ''; svg.__pid = null; var id = beamDefs(svg);
    var c = steps.map(function (s) { return posIn($('.dot', s), box); }), L = c[n - 1];
    P.x0 = c[0].cx; P.x1 = steps[n - 1].classList.contains('globe') ? L.cx - L.w * .42 : L.cx; P.y = c[0].cy;
    P.fr = c.map(function (q) { return clamp((q.cx - P.x0) / (P.x1 - P.x0), 0, 1); });
    var d = 'M' + P.x0 + ' ' + P.y + ' L' + P.x1 + ' ' + P.y;
    svgEl('path', { d: d, class: 'p-beam-base', 'stroke-width': 2, 'stroke-dasharray': '2 7' }, svg);
    P.el.prog = svgEl('path', { d: d, 'data-p': 'prog', fill: 'none', stroke: 'url(#' + id + 'g)', 'stroke-width': 2.4, pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 - maxP }, svg);
    P.el.trail = svgEl('path', { d: d, 'data-p': 'trail', fill: 'none', stroke: 'url(#' + id + 'g)', 'stroke-width': 7, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '.1 3', filter: 'url(#' + id + 'f)', opacity: 0 }, svg);
    P.el.pk = svgEl('g', { 'data-p': 'pk', opacity: 0 }, svg);
    svgEl('circle', { r: 16, fill: 'rgba(232,121,249,.45)', filter: 'url(#' + id + 'f)' }, P.el.pk); svgEl('circle', { r: 5.5, fill: '#fff' }, P.el.pk);
  }
  function at(tau) {
    if (tau <= 0) return 0;
    var i = Math.min(n - 2, Math.floor(tau / o.seg)), f = clamp(tau / o.seg - i, 0, 1);
    return tau >= (n - 1) * o.seg ? 1 : lerp(P.fr[i], P.fr[i + 1], easeIO(f));
  }
  var api = {
    build: build,
    reset: function () { maxP = 0; lastK = -1; arrived = false; steps.forEach(function (s) { s.classList.remove('on', 'hit'); }); if (P.el.prog) P.el.prog.setAttribute('stroke-dashoffset', 1); },
    tick: function (tau) {
      var END = o.start + (n - 1) * o.seg, first = tau < END + o.hold, p, show = true;
      if (first) p = at(tau - o.start);
      else { var cyc = (tau - END - o.hold) % o.loop; show = cyc < (n - 1) * o.seg + .15; p = at(cyc); if (cyc < .05 && lastK >= n - 1) { lastK = -1; arrived = false; } }
      maxP = Math.max(maxP, p);
      P.el.prog.setAttribute('stroke-dashoffset', 1 - maxP);
      P.el.pk.setAttribute('opacity', show ? 1 : 0); P.el.trail.setAttribute('opacity', show && p > .005 && p < 1 ? 1 : 0);
      P.el.pk.setAttribute('transform', 'translate(' + f1(P.x0 + p * (P.x1 - P.x0)) + ' ' + P.y + ')');
      P.el.trail.setAttribute('stroke-dashoffset', .1 - p);
      var k = 0; for (var i = 0; i < n; i++) if (p >= P.fr[i] - .002) k = i;
      if (k !== lastK && (show || first)) {
        for (var j = lastK + 1; j <= k; j++) { var e = steps[j]; e.classList.add('on'); e.classList.remove('hit'); void e.offsetWidth; e.classList.add('hit'); }
        lastK = k; o.onStage && o.onStage(k, first);
        if (k === n - 1 && !arrived) { arrived = true; G.boost = 1; o.onArrive && o.onArrive(); }
      }
    }
  };
  return api;
}
packet.final = function (root) {
  $$('.p-step', root).forEach(function (s) { s.classList.add('on'); s.classList.remove('hit'); });
  $$('[data-p=prog]', root).forEach(function (e) { e.setAttribute('stroke-dashoffset', 0); });
  $$('[data-p=pk], [data-p=trail]', root).forEach(function (e) { e.setAttribute('opacity', 0); });
};

// canvas comet along a quadratic bezier with a fading tail
function comet(x, p0, p1, p2, u, a, warm) {
  var pt = function (q) { var m = 1 - q; return [m * m * p0[0] + 2 * m * q * p1[0] + q * q * p2[0], m * m * p0[1] + 2 * m * q * p1[1] + q * q * p2[1]]; };
  var prev = pt(Math.max(0, u - .16));
  for (var k = 1; k <= 8; k++) {
    var q = Math.max(0, u - .16 + .02 * k), c = pt(q), f = k / 8;
    x.globalAlpha = a * f * f; x.strokeStyle = f > .75 ? (warm ? '#ffd28a' : '#fbe7ff') : '#d08cf5'; x.lineWidth = .8 + f * 1.4;
    x.beginPath(); x.moveTo(prev[0], prev[1]); x.lineTo(c[0], c[1]); x.stroke(); prev = c;
  }
  x.globalAlpha = a; x.drawImage(warm ? SPR_ORNG : SPR_PINK, prev[0] - 4.5, prev[1] - 4.5, 9, 9);
}
// Pulse.emitter(canvas, {from:'regions'|'edges', to:fn→[x,y] | 'globe', rate, dur:[a,b], start, lift, warm})
function emitter(canvas, o) {
  o = Object.assign({ from: 'regions', to: 'globe', rate: 13, dur: [1.1, 1.8], start: 1, lift: 6, warm: .25 }, o);
  var x = canvas.getContext('2d'), C = [], last = 0;
  return {
    clear: function () { C = []; last = 0; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, canvas.width, canvas.height); },
    tick: function (t, tau) {
      var w = canvas.width / DPR, h = canvas.height / DPR;
      x.setTransform(DPR, 0, 0, DPR, 0, 0); x.clearRect(0, 0, w, h);
      if (!last) last = t;
      if (tau > o.start) while (last < t) {
        last += 1 / o.rate;
        var d = lerp(o.dur[0], o.dur[1], Math.random()), e = { t: last, d: d, warm: Math.random() < o.warm, bend: (Math.random() - .5) * .9, lift: unit() * o.lift * (.5 + Math.random()) };
        if (o.from === 'regions') { var vis = REG.filter(function (R) { return R.i < G.lit && R.sz > .25; }); if (!vis.length) continue; e.R = vis[(Math.random() * vis.length) | 0]; e.j = Math.random(); }
        else { e.a = Math.random() * 6.2832; e.D = Math.hypot(w, h) * .6; }
        C.push(e);
      } else last = t;
      x.globalCompositeOperation = 'lighter';
      C = C.filter(function (e) {
        var u = (t - e.t) / e.d; if (u >= 1.12) return false; if (u < 0) return true;
        var p0, p1, p2, a = .85 * (u > 1 ? 1 - (u - 1) / .12 : 1);
        if (e.R) { p0 = [e.R.sx, e.R.sy]; p2 = typeof o.to === 'function' ? o.to(e) : [G.cx, G.cy]; p1 = [lerp(p0[0], p2[0], .55), Math.min(p0[1], p2[1]) - e.lift]; }
        else {
          var gx = G.cx, gy = G.cy, r = G.r * 1.02;
          p0 = [gx + Math.cos(e.a) * e.D, gy + Math.sin(e.a) * e.D];
          p2 = typeof o.to === 'function' ? o.to(e) : [gx + Math.cos(e.a + e.bend * .3) * r, gy + Math.sin(e.a + e.bend * .3) * r];
          p1 = [gx + Math.cos(e.a + e.bend) * e.D * .5, gy + Math.sin(e.a + e.bend) * e.D * .5];
          a = .7 * Math.sin(Math.PI * Math.min(1, u * 1.05)) * clamp(tau / .8, 0, 1);
        }
        comet(x, p0, p1, p2, Math.min(1, easeIO(Math.min(1, u))), a, e.warm);
        return true;
      });
      x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    }
  };
}
// Pulse.flash(slide, x, y) — restart .p-flash / .p-shock inside slide at viewport (x, y)
function flash(slide, px, py) {
  $$('.p-flash, .p-shock', slide).forEach(function (e) { e.style.left = px + 'px'; e.style.top = py + 'px'; e.classList.remove('go'); void e.offsetWidth; e.classList.add('go'); });
}
// Pulse.ignite(canvas, {core: el | [x,y], at: 1.1}) — edge streams + spiralling particles converge, the core ignites
function ignite(canvas, o) {
  o = Object.assign({ at: 1.1, n: 650 }, o);
  var x = canvas.getContext('2d'), P = [], ign = false, lastT = 0, core = [0, 0], maxD = 1, u = 10;
  var COLS = ['#f0abfc', '#a78bfa', '#ffb547'];
  function spawn(p, ambient) {
    p.a = Math.random() * 6.2832; p.r = maxD * (.7 + Math.random() * .45);
    p.v = ambient ? 20 + Math.random() * 40 : 0; p.acc = ambient ? 20 + Math.random() * 50 : 700 + Math.random() * 1100;
    p.w = (Math.random() < .5 ? -1 : 1) * (.25 + Math.random() * .7); p.c = Math.random() < .55 ? 0 : (Math.random() < .7 ? 1 : 2); p.px = p.ox = null;
  }
  function glow(rad, a) {
    var g = x.createRadialGradient(core[0], core[1], 0, core[0], core[1], rad);
    g.addColorStop(0, 'rgba(255,255,255,' + a + ')'); g.addColorStop(.12, 'rgba(250,200,255,' + a * .8 + ')');
    g.addColorStop(.4, 'rgba(217,70,239,' + a * .3 + ')'); g.addColorStop(1, 'rgba(139,92,246,0)');
    x.fillStyle = g; x.beginPath(); x.arc(core[0], core[1], rad, 0, 7); x.fill();
  }
  function place() {
    var w = innerWidth, h = innerHeight; u = unit(); maxD = Math.hypot(w, h) * .62;
    if (Array.isArray(o.core)) core = o.core; else { var r = o.core.getBoundingClientRect(); var b = boxOf(o.core), org = boxOrigin(), p = posIn(o.core, b); core = [org.x + p.cx, org.y + p.cy]; }
  }
  return {
    get core() { return core; },
    reset: function () { place(); ign = false; lastT = 0; P = []; for (var i = 0; i < o.n; i++) { var p = {}; spawn(p, false); p.delay = Math.random() * .55; P.push(p); } },
    still: function () { place(); var w = canvas.width / DPR, h = canvas.height / DPR; x.setTransform(DPR, 0, 0, DPR, 0, 0); x.clearRect(0, 0, w, h); x.globalCompositeOperation = 'lighter'; glow(u * 16, .5); x.globalCompositeOperation = 'source-over'; },
    tick: function (t, tau) {
      var dt = lastT ? Math.min(.05, t - lastT) : .016; lastT = t;
      var w = canvas.width / DPR, h = canvas.height / DPR;
      x.setTransform(DPR, 0, 0, DPR, 0, 0); x.clearRect(0, 0, w, h); x.globalCompositeOperation = 'lighter';
      if (!ign && tau >= o.at) { ign = true; P.forEach(function (p) { p.v = -(250 + Math.random() * 900); p.acc = 160 + Math.random() * 200; }); o.onIgnite && o.onIgnite(core); }
      if (tau < o.at + .15) {
        var k = clamp(tau / o.at, 0, 1), hd = maxD * (1 - k * k * k);
        for (var j = 0; j < 16; j++) {
          var an = j / 16 * 6.2832 + .19, ca = Math.cos(an), sa = Math.sin(an) * .72, tl = maxD * .38;
          var hx = core[0] + ca * hd, hy = core[1] + sa * hd, tx = core[0] + ca * (hd + tl), ty = core[1] + sa * (hd + tl);
          var g = x.createLinearGradient(tx, ty, hx, hy);
          g.addColorStop(0, 'rgba(139,92,246,0)'); g.addColorStop(.7, j % 3 ? 'rgba(232,121,249,.5)' : 'rgba(255,153,0,.55)'); g.addColorStop(1, 'rgba(255,255,255,.95)');
          x.strokeStyle = g; x.lineWidth = 1.6; x.beginPath(); x.moveTo(tx, ty); x.lineTo(hx, hy); x.stroke();
        }
      }
      P.forEach(function (p) {
        p.on = false; if (tau < p.delay) return;
        p.v += p.acc * dt; p.r -= p.v * dt; p.a += p.w * dt * (1 + 90 / (Math.abs(p.r) + 30));
        if (p.r < 6 || p.r > maxD * 1.25) { spawn(p, ign); return; }
        p.ox = p.px; p.oy = p.py; p.px = core[0] + Math.cos(p.a) * p.r; p.py = core[1] + Math.sin(p.a) * p.r * .72; p.on = p.ox != null;
      });
      x.lineWidth = 1.3;
      for (var ci = 0; ci < 3; ci++) for (var near = 0; near < 2; near++) {
        x.strokeStyle = COLS[ci]; x.globalAlpha = (ign ? .32 : .5) + near * .4; x.beginPath();
        P.forEach(function (p) { if (p.on && p.c === ci && (p.r < maxD * .45 ? 1 : 0) === near) { x.moveTo(p.ox, p.oy); x.lineTo(p.px, p.py); } });
        x.stroke();
      }
      x.globalAlpha = 1;
      if (!ign) { var q = clamp(tau / o.at, 0, 1); glow(u * (2 + 14 * q * q), .25 + .75 * q); }
      else { var e2 = tau - o.at; glow(u * (14 + 10 * Math.exp(-e2 * 2.5) + Math.sin(t * 2) * .8), .5 + .5 * Math.exp(-e2 * 2)); }
      x.globalCompositeOperation = 'source-over';
    }
  };
}
// Pulse.chip(svg) — die + HBM + fan-out traces + pins; <svg data-chip="1.15"> = trace draw start (s). Auto-built on init.
function chip(svg) {
  var s0 = parseFloat(svg.dataset.chip || '1.2'); svg.setAttribute('viewBox', '0 0 400 400'); svg.innerHTML = '';
  var d = svgEl('defs', {}, svg), g1 = svgEl('linearGradient', { id: 'pchip' + (++gid), x1: 0, y1: 0, x2: 1, y2: 1 }, d);
  [['0', '#ff9900'], ['.5', '#e879f9'], ['1', '#8b5cf6']].forEach(function (s) { svgEl('stop', { offset: s[0], 'stop-color': s[1] }, g1); });
  svgEl('rect', { x: 14, y: 14, width: 372, height: 372, rx: 22, fill: '#170b2c', stroke: 'url(#' + g1.id + ')', 'stroke-opacity': .7, 'stroke-width': 2 }, svg);
  svgEl('rect', { x: 30, y: 30, width: 340, height: 340, rx: 14, fill: 'none', stroke: 'rgba(167,139,250,.22)', 'stroke-dasharray': '2 5' }, svg);
  [[96, 152], [96, 204], [266, 152], [266, 204]].forEach(function (xy, i) {
    svgEl('rect', { x: xy[0], y: xy[1], width: 38, height: 44, rx: 3, fill: '#26144a', stroke: 'rgba(232,121,249,.5)', class: 'p-draw', pathLength: 1, style: '--d:' + (s0 + .15 + i * .06) }, svg);
    for (var k = 1; k < 4; k++) svgEl('line', { x1: xy[0] + 5, x2: xy[0] + 33, y1: xy[1] + k * 11, y2: xy[1] + k * 11, stroke: 'rgba(255,255,255,.12)' }, svg);
  });
  svgEl('rect', { x: 148, y: 148, width: 104, height: 104, rx: 5, fill: '#2a1258', stroke: 'rgba(255,200,250,.6)' }, svg);
  var tr = [];
  for (var k2 = 0; k2 < 9; k2++) {
    var xs = 158 + k2 * 10.5, xp = 70 + k2 * 32.5, ys = 156 + k2 * 11, yp = 70 + k2 * 32.5, o = Math.abs(k2 - 4);
    tr.push(['M' + xs + ' 148 V134 L' + xp + ' 68 V22', o, xp, 22], ['M' + xs + ' 252 V266 L' + xp + ' 332 V378', o, xp, 378],
            ['M96 ' + ys + ' H86 L66 ' + yp + ' H22', o, 22, yp], ['M304 ' + ys + ' H314 L334 ' + yp + ' H378', o, 378, yp]);
  }
  tr.forEach(function (q, i) {
    svgEl('path', { d: q[0], class: 'p-trace p-draw', pathLength: 1, style: '--d:' + (s0 + .1 + q[1] * .07 + (i % 4) * .04).toFixed(2) }, svg);
    svgEl('path', { d: q[0], class: 'p-tpulse', pathLength: 1, style: '--d:' + (s0 + 1.25 + ((i * 7) % 23) * .11).toFixed(2) }, svg);
    svgEl('rect', { x: q[2] - 3.5, y: q[3] - 3.5, width: 7, height: 7, rx: 1.5, fill: 'rgba(255,190,90,.85)', class: 'p-fade', style: '--d:' + (s0 + .75 + q[1] * .07).toFixed(2) }, svg);
  });
}
// Pulse.spark(svg, fn(t)→value, {n, dt, lo, hi, area, stroke, threshold}) — streaming chart; tick(t, k=amplitude 0..1)
function spark(svg, fn, o) {
  o = Object.assign({ n: 72, dt: .09, lo: 0, hi: 1, area: true, stroke: '#f0abfc', width: 1.6, grid: 3, threshold: null, fill: '#e879f9' }, o);
  svg.setAttribute('viewBox', '0 0 300 100'); svg.setAttribute('preserveAspectRatio', 'none'); svg.innerHTML = '';
  var id = 'psp' + (++gid), d = svgEl('defs', {}, svg), gr = svgEl('linearGradient', { id: id, x1: 0, y1: 0, x2: 0, y2: 1 }, d);
  svgEl('stop', { offset: 0, 'stop-color': o.fill, 'stop-opacity': .45 }, gr); svgEl('stop', { offset: 1, 'stop-color': '#8b5cf6', 'stop-opacity': 0 }, gr);
  for (var i = 1; i <= o.grid; i++) svgEl('line', { x1: 0, x2: 300, y1: i * 100 / (o.grid + 1), y2: i * 100 / (o.grid + 1), stroke: 'rgba(255,255,255,.05)' }, svg);
  var Y = function (v) { return 100 - clamp((v - o.lo) / (o.hi - o.lo), 0, 1) * 92; };
  if (o.threshold != null) svgEl('line', { x1: 0, x2: 300, y1: Y(o.threshold), y2: Y(o.threshold), stroke: 'rgba(251,191,36,.6)', 'stroke-dasharray': '4 4' }, svg);
  var A = o.area ? svgEl('path', { fill: 'url(#' + id + ')' }, svg) : null, Ln = svgEl('path', { fill: 'none', stroke: o.stroke, 'stroke-width': o.width }, svg);
  return {
    tick: function (t, k) {
      k = k == null ? 1 : k;
      var a = 'M0 100', l = '';
      for (var i = 0; i < o.n; i++) {
        var x = (i / (o.n - 1) * 300).toFixed(1), y = (100 - (100 - Y(fn(t - (o.n - 1 - i) * o.dt))) * k).toFixed(1);
        a += ' L' + x + ' ' + y; l += (i ? ' L' : 'M') + x + ' ' + y;
      }
      if (A) A.setAttribute('d', a + ' L300 100 Z'); Ln.setAttribute('d', l);
    }
  };
}
// Pulse.ticker(el, fn(t)→number, {every, format}) — throttled live number (keeps a trailing <small> unit)
function ticker(el, fn, o) {
  o = Object.assign({ every: .11, format: fmt }, o); var lt = -9;
  return { tick: function (t, force) {
    if (!force && t - lt < o.every) return; lt = t;
    var s = o.format(fn(t)), n = el.firstChild;
    if (n && n.nodeType === 3) n.nodeValue = s; else el.insertBefore(D.createTextNode(s), el.firstChild);
  } };
}

/* ================= INIT ================= */
var layoutFns = [];
function layout() {
  W = innerWidth; H = innerHeight; resizeCanvas(cv, W, H);
  $$('canvas.p-fx').forEach(function (c) { resizeCanvas(c, W, H); });
  Stage.slides.forEach(buildLinks);
  layoutFns.forEach(function (fn) { try { fn(); } catch (e) { console.error('[pulse]', e); } });
  if (cur.slide && GT.to) { var d2 = dockOf(cur.slide, W, H); if (!d2.keepGeo) { GT.to.cx = d2.cx; GT.to.cy = d2.cy; GT.to.r = d2.r; } }
  dirty = true;
}
(function init() {
  if (!$('.p-bg')) { var bg = D.createElement('div'); bg.className = 'p-bg stage-bg'; bg.innerHTML = '<i class="neb n1"></i><i class="neb n2"></i><i class="neb n3"></i><i class="grid"></i><i class="scan"></i><i class="vig"></i>'; D.body.insertBefore(bg, D.body.firstChild); }
  cv = $('canvas.p-globe');
  if (!cv) { cv = D.createElement('canvas'); cv.className = 'p-globe stage-bg'; cv.setAttribute('aria-hidden', 'true'); $('.p-bg').after(cv); }
  cx2 = cv.getContext('2d');
  $$('svg[data-chip]').forEach(chip);
  if (window.lucide) window.lucide.createIcons();
  // beams' final state (light targets) for scenes that use data-links — also runs on overview clones + print
  var keys = {};
  $$('.slide').forEach(function (s, i) {
    if (!$('svg.p-beams[data-links]', s)) return;
    if (!s.dataset.scene) s.dataset.scene = 'p-links-' + i;
    if (!keys[s.dataset.scene]) { keys[s.dataset.scene] = 1; Stage.hook(s.dataset.scene, { final: function (slide) { finalLinks(slide); } }); }
  });
  var laidOut = false, thumbs = false;
  Stage.onChange(function (to, from, dir, slide) {
    if (!laidOut) { laidOut = true; layout(); }
    if (cur.slide && cur.slide !== slide) resetLinks(cur.slide);
    cur.slide = slide; cur.t0 = nowS(); resetLinks(slide);
    if (Stage.reduced) finalLinks(slide);     // reduced motion: hooks get enter(ctx.reduced), not final() → show the end state now
    dock(slide, from < 0);
  });
  Stage.raf(frame);
  var rs = 0; addEventListener('resize', function () { clearTimeout(rs); rs = setTimeout(layout, 80); });
  // fonts.ready resolves BEFORE the engine boots (its own .then runs later) → defer past boot
  var after = function () { setTimeout(function () { if (!Stage.slides.length) return after(); layout(); if (!thumbs) { thumbs = true; renderThumbs(); } }, 60); };
  if (D.fonts && D.fonts.ready) { Stage.waitFor(D.fonts.ready); D.fonts.ready.then(after); } else after();
})();

window.Pulse = {
  version: '1.0',
  globe: {
    get state() { return G; }, regions: REG, presets: PRESETS,
    lit: function (n) { litPow = null; G.lit = n; dirty = true; },
    fire: function (delayS) { G.fireAt = nowS() + (delayS || 0); dirty = true; },
    calm: function () { G.fireAt = null; },
    boost: function (v) { G.boost = v == null ? 1 : v; },
    dock: dockOf, draw: drawGlobe
  },
  beams: { defs: beamDefs, add: addBeam, set: setBeam, curve: curve, build: buildLinks, final: finalLinks },
  packet: packet, emitter: emitter, ignite: ignite, flash: flash, chip: chip, spark: spark, ticker: ticker, comet: comet,
  loop: loop, layout: layout, onLayout: function (fn) { layoutFns.push(fn); }, thumbs: renderThumbs,
  u: unit, posIn: posIn, boxOrigin: boxOrigin, svgEl: svgEl, fmt: fmt, clamp: clamp, lerp: lerp, easeIO: easeIO, easeOut: easeOut, DPR: DPR
};
})();
