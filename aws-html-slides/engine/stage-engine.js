/* ===========================================================
   STAGE ENGINE — window.Stage   (inline verbatim at the END of <body>)
   Stacked slides + per-slide hooks + transitions + overview + lightbox.
   See engine/ENGINE.md for the authoring contract.
   =========================================================== */
(function () {
'use strict';
if (window.Stage && window.Stage.version) return;
var D = document, body = D.body, html = D.documentElement;
var mq = matchMedia('(prefers-reduced-motion: reduce)');
var REDUCED = mq.matches;
var slides = [], N = 0, cur = -1, gen = 0, booted = false, frozen = false, pending = null;
var HOOKS = {}, changeFns = [], transitionFn = null, tctx = null, waits = [];
var opts = { keys: true, wheel: true, touch: true, hash: true, clickToAdvance: false };
var noop = function () {};
var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
var pad = function (n) { return (n < 10 ? '0' : '') + n; };
var easeOut = function (t) { return 1 - Math.pow(1 - t, 4); };
function $$(sel, root) { return Array.prototype.slice.call((root || D).querySelectorAll(sel)); }
var STATE_CLS = ['is-active', 'is-entering', 'is-leaving', 'stage-in', 'stage-out', 'stage-reset'];
function st(s) { return s.__stage || (s.__stage = {}); }
function typing(t) { return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)); }
function hooksOf(s) { return (s && HOOKS[s.dataset.scene]) || []; }
function safe(fn, self, args) { try { return fn.apply(self, args); } catch (e) { console.error('[Stage]', e); } }
function cssMs(name, el) {
  var v = getComputedStyle(el || body).getPropertyValue(name).trim();
  return v ? parseFloat(v) * (/ms$/.test(v) ? 1 : 1000) : 700;
}

/* === RAF LOOP — one shared loop, paused while the tab is hidden === */
var loops = new Set(), rafId = 0, lastT = 0;
function frame(now) {
  rafId = 0;
  var dt = lastT ? Math.min(0.1, (now - lastT) / 1000) : 0.016; lastT = now;
  loops.forEach(function (l) { if (safe(l, null, [now, dt]) === false) loops.delete(l); });
  schedule();
}
function schedule() { if (!rafId && loops.size && !D.hidden) rafId = requestAnimationFrame(frame); }
function addLoop(fn) { loops.add(fn); schedule(); return function () { loops.delete(fn); }; }
D.addEventListener('visibilitychange', function () {
  if (D.hidden) { cancelAnimationFrame(rafId); rafId = 0; } else { lastT = 0; schedule(); }
});

/* === CTX — handed to hooks; everything it starts dies when the slide is left === */
function makeCtx(base) {
  var alive = true, stops = [];
  var ctx = Object.assign({ reduced: REDUCED, frozen: frozen }, base);
  ctx.alive = function () { return alive; };
  // await ctx.wait(ms): resolves only if still alive (otherwise never — the async fn just stops)
  ctx.wait = function (ms) {
    return new Promise(function (res) {
      if (!alive) return;
      var t = setTimeout(function () { if (alive) res(); }, ms || 0);
      stops.push(function () { clearTimeout(t); });
    });
  };
  // ctx.raf(fn(now, dt, elapsedMs)) — return false to stop; auto-stopped on leave
  ctx.raf = function (fn) {
    if (!alive) return noop;
    var t0 = -1, stop = addLoop(function (now, dt) {
      if (!alive) return false;
      if (t0 < 0) t0 = now;
      return fn(now, dt, now - t0);
    });
    stops.push(stop); return stop;
  };
  // ctx.tween({from, to, dur, delay, ease, on}) → Promise (resolves at the end, only if alive)
  ctx.tween = function (o) {
    o = Object.assign({ from: 0, to: 1, dur: 1000, delay: 0, ease: easeOut }, o);
    return new Promise(function (res) {
      if (!alive) return;
      if (REDUCED) { o.on && o.on(o.to, 1); return res(); }
      var t0 = performance.now() + o.delay;
      ctx.raf(function (now) {
        if (now < t0) return;
        var p = Math.min(1, (now - t0) / o.dur);
        o.on && o.on(o.from + (o.to - o.from) * o.ease(p), p);
        if (p >= 1) { res(); return false; }
      });
    });
  };
  // ctx.on(target, type, fn, opts) — listener removed on leave
  ctx.on = function (t, type, fn, o) {
    t.addEventListener(type, fn, o);
    stops.push(function () { t.removeEventListener(type, fn, o); });
  };
  ctx.cleanup = function (fn) { if (alive) stops.push(fn); else fn(); };   // run on leave / interrupt
  ctx._kill = function () { alive = false; stops.splice(0).forEach(function (f) { f(); }); };
  return ctx;
}

/* === FX — count-up, text split === */
function fmtCount(el, v) {
  var dec = +el.dataset.decimals || 0, s = v.toFixed(dec);
  if (el.hasAttribute('data-sep')) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  el.textContent = s;
}
// .count[data-count][data-decimals][data-delay(s)][data-dur(s)][data-ease="linear"] — HTML text must already be the final value
function countUp(root, ctx) {
  $$('.count[data-count]', root).forEach(function (el) {
    var to = +el.dataset.count, from = +(el.dataset.from || 0);
    if (!ctx || ctx.reduced || ctx.frozen || !ctx.alive()) return fmtCount(el, to);
    fmtCount(el, from);
    ctx.tween({ from: from, to: to, dur: (+el.dataset.dur || 1.6) * 1000,
      delay: (+el.dataset.delay || 0) * 1000 + cssMs('--rv-base', el),
      ease: el.dataset.ease === 'linear' ? function (t) { return t; } : easeOut,
      on: function (v) { fmtCount(el, v); } });
  });
}
function finalCounts(root) { $$('.count[data-count]', root).forEach(function (el) { fmtCount(el, +el.dataset.count); }); }

var SPLIT = new Map();   // el → { html, label }
function isClipText(el) {
  var cs = getComputedStyle(el);
  return cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text';
}
/* CJK: no spaces, so cut per ideograph (words mode: Intl.Segmenter words). Closing punctuation is glued to
   the previous piece and opening brackets to the next one, so no line starts with ，。」 or ends with 「（ */
var CJK = /[\u2E80-\u303F\u3040-\u30FF\u3100-\u31FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\uFF00-\uFFEF]|[\uD840-\uD87F][\uDC00-\uDFFF]/;
var OPEN = /^[「『（《〈【〔〖〘“‘［｛＜｟｢]+$/;
var CLOSE = /^[，。、：；！？」』）》〉】〕〗〙…—–’”・ー々〜～\u3001-\u3003\uFF01-\uFF07\uFF09-\uFF0F\uFF1A\uFF1B\uFF1D-\uFF20\uFF3D-\uFF40\uFF5D-\uFF61\uFF63-\uFF65]+$/;
var SEG = (function () { try { return new Intl.Segmenter('zh', { granularity: 'word' }); } catch (e) { return null; } })();
function cjkUnits(w, mode) {
  var raw = [];
  if (mode !== 'chars' && SEG) Array.from(SEG.segment(w)).forEach(function (x) { raw.push(x.segment); });
  else Array.from(w).forEach(function (ch) {              // per ideograph; keep Latin/digit runs together
    var k = raw.length - 1;
    if (k >= 0 && !CJK.test(ch) && !CJK.test(raw[k]) && !OPEN.test(ch) && !CLOSE.test(ch) && !CLOSE.test(raw[k])) raw[k] += ch;
    else raw.push(ch);
  });
  var out = [], open = '';
  raw.forEach(function (t) {
    if (OPEN.test(t)) open += t;
    else if (CLOSE.test(t) && out.length && !open) out[out.length - 1] += t;
    else { out.push(open + t); open = ''; }
  });
  if (open) out.push(open);
  return out;
}
// split(el, 'words'|'chars') — idempotent; gradient-clipped runs stay ONE piece (.sp-unit)
function split(el, mode) {
  if (!el || SPLIT.has(el)) return el;
  mode = mode || el.dataset.split || 'words';
  if (isClipText(el)) return el;                       // refuse: the clip would break
  var rec = { html: el.innerHTML, mode: mode, label: !el.hasAttribute('aria-label') }, i = 0;
  if (mode === 'chars' && rec.label) el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
  var piece = function (cls, txt) {
    var s = D.createElement('span'); s.className = cls; s.style.setProperty('--i', i++);
    if (txt != null) s.textContent = txt; return s;
  };
  (function walk(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (c) {
      if (c.nodeType === 1) {
        if (c.tagName === 'BR') return;                  // keep line breaks as real breaks
        if (/^(SVG|IMG|I)$/i.test(c.tagName) || isClipText(c)) { var u = piece('sp sp-unit'); c.replaceWith(u); u.appendChild(c); }
        else walk(c);
        return;
      }
      if (c.nodeType !== 3 || !c.data.trim()) return;
      var frag = D.createDocumentFragment();
      c.data.split(/(\s+)/).forEach(function (w) {
        if (!w) return;
        if (/^\s+$/.test(w)) return frag.appendChild(D.createTextNode(' '));
        (CJK.test(w) ? cjkUnits(w, mode) : [w]).forEach(function (u) {
          // chars mode: a Latin run becomes a nowrap word of char pieces; a CJK unit is one piece (breakable)
          if (mode !== 'chars' || (CJK.test(u) && !/[A-Za-z0-9]{2}/.test(u))) return frag.appendChild(piece('sp', u));
          var ww = D.createElement('span'); ww.className = 'sp-w';
          Array.from(u).forEach(function (ch) { ww.appendChild(piece('sp', ch)); });
          frag.appendChild(ww);
        });
      });
      c.replaceWith(frag);
    });
  })(el);
  SPLIT.set(el, rec);
  return el;
}
function unsplit(el) {
  var rec = SPLIT.get(el); if (!rec) return el;
  el.innerHTML = rec.html; if (rec.label) el.removeAttribute('aria-label');
  SPLIT.delete(el); return el;
}
// → [{el, mode}] so callers can re-split later
function unsplitAll() { var out = []; SPLIT.forEach(function (r, el) { out.push({ el: el, mode: r.mode }); unsplit(el); }); return out; }

// final state for a slide or an overview clone: .is-final + counters + hook.final()
function finalize(s, i) {
  s.classList.add('is-final');
  finalCounts(s);
  var src = i != null ? slides[i] : s;
  hooksOf(src).forEach(function (h) { h.final && safe(h.final, h, [s, { index: i != null ? i : slides.indexOf(s), clone: s !== src }]); });
}

/* === LIFECYCLE === */
function enterSlide(s, i, prev, dir) {
  var S = st(s);
  if (S.ctx) S.ctx._kill();
  if (S.lctx) S.lctx._kill();
  $$('[data-split]', s).forEach(function (el) { if (!frozen) split(el); });
  // commit the pre-reveal state with transitions off, then flip to active → reveals replay
  s.classList.add('stage-reset');
  s.classList.remove('is-active', 'is-leaving', 'stage-out');
  void s.offsetWidth;
  s.classList.remove('stage-reset');
  s.classList.add('is-active');
  s.classList.toggle('is-final', REDUCED || frozen);
  var ctx = S.ctx = makeCtx({ slide: s, index: i, prev: prev, dir: dir });
  if (frozen) return finalize(s);
  countUp(s, ctx);
  hooksOf(s).forEach(function (h) { h.enter && safe(h.enter, h, [s, ctx]); });
}
function leaveSlide(s, i, next, dir) {
  var S = st(s);
  if (S.ctx) { S.ctx._kill(); S.ctx = null; }
  var lctx = S.lctx = makeCtx({ slide: s, index: i, next: next, dir: dir });
  s.classList.remove('is-active', 'is-entering', 'stage-in');
  s.classList.add('is-leaving');
  hooksOf(s).forEach(function (h) { h.leave && safe(h.leave, h, [s, lctx]); });
}
function settleOut(s) {
  var S = st(s);
  if (S.lctx) { S.lctx._kill(); S.lctx = null; }
  if (S.ctx) { S.ctx._kill(); S.ctx = null; }
  STATE_CLS.forEach(function (c) { s.classList.remove(c); });
  if (!REDUCED) s.classList.remove('is-final');
}

// default: cross-dissolve with depth; incoming reveals overlap the dissolve
function defaultTransition(from, to, t) {
  from.classList.add('stage-out'); to.classList.add('stage-in');
  t.enter();
  return t.wait(t.duration);
}

/* === NAVIGATION === */
function go(n, o) {
  o = o || {};
  if (!booted) { pending = n; return; }
  n = clamp(Math.round(+n) || 0, 0, N - 1);
  if (n === cur && !o.force) return;
  var prev = cur, from = prev >= 0 && prev !== n ? slides[prev] : null, to = slides[n];
  var dir = n >= prev ? 'fwd' : 'back', my = ++gen;
  if (tctx) { tctx._kill(); tctx = null; }        // interrupt a running transition
  // settle anything a previous (interrupted) transition left behind
  slides.forEach(function (s, k) { if (k !== n && s !== from) settleOut(s); });
  if (from) from.classList.remove('stage-in', 'is-entering');
  cur = n;
  body.dataset.dir = dir;
  if (from) leaveSlide(from, prev, n, dir);
  chrome();
  if (opts.hash && !o.boot) try { history.replaceState(null, '', '#' + (n + 1)); } catch (e) {}
  if (n !== prev) changeFns.forEach(function (fn) { safe(fn, null, [n, prev, dir, to]); });

  var entered = false;
  var enter = function () {
    if (entered || my !== gen) return;
    entered = true; to.classList.remove('is-entering');
    enterSlide(to, n, prev, dir);
  };
  var finish = function () {
    if (my !== gen) return;
    enter();
    slides.forEach(function (s, k) { if (k !== n) settleOut(s); });
    to.classList.remove('stage-in', 'is-entering');
    body.classList.remove('stage-busy');
  };
  if (!from || REDUCED || frozen || o.instant) return finish();
  body.classList.add('stage-busy');
  to.classList.add('is-entering');
  var t = tctx = makeCtx({ from: from, to: to, index: n, prev: prev, dir: dir, duration: cssMs('--stage-dur') });
  t.enter = enter;
  var p = safe(transitionFn || defaultTransition, null, [from, to, t]);
  Promise.resolve(p).then(function () { if (t === tctx) { t._kill(); finish(); } },
              function (e) { console.error('[Stage]', e); if (t === tctx) finish(); });
}
function next() { go(cur + 1); }
function prev() { go(cur - 1); }

/* === CHROME — .progress-bar · .page-number · .nav-dots · .slide-index · [data-stage-label] === */
var dotsEl = null;
function chrome() {
  $$('.progress-bar').forEach(function (b) { b.style.setProperty('--stage-progress', N > 1 ? cur / (N - 1) : 1); });
  $$('.page-number').forEach(function (p) { p.textContent = (cur + 1) + ' / ' + N; });
  $$('.slide-index').forEach(function (el) {
    var s = el.closest('.slide'), k = s ? slides.indexOf(s) : cur;
    if (k >= 0) el.textContent = pad(k + 1) + ' / ' + pad(N);
  });
  $$('[data-stage-label]').forEach(function (el) { el.textContent = slides[cur].dataset.label || ''; });
  if (dotsEl) $$('button', dotsEl).forEach(function (b, k) {
    b.classList.toggle('on', k === cur); b.classList.toggle('done', k < cur);
    b.setAttribute('aria-current', k === cur ? 'step' : 'false');
  });
}

/* === OVERVIEW (Esc / O) — live-DOM clones in final state === */
var ov = { isOpen: false, focus: 0, el: null, grid: null };
function ovBuild() {
  if (!ov.el) {
    ov.el = D.createElement('div'); ov.el.className = 'stage-ov';
    ov.el.setAttribute('role', 'dialog'); ov.el.setAttribute('aria-label', 'Slide overview'); ov.el.setAttribute('aria-hidden', 'true');
    ov.el.innerHTML = '<div class="stage-ov-hint">Click a slide or press <kbd>Esc</kbd> to close</div><div class="stage-ov-grid"></div>';
    ov.grid = ov.el.lastChild;
    ov.el.addEventListener('click', function (e) { if (e.target === ov.el || e.target === ov.grid) ovClose(); });
    body.appendChild(ov.el);
  }
  ov.grid.innerHTML = '';
  var W = innerWidth, H = innerHeight;
  slides.forEach(function (s, i) {
    var card = D.createElement('button'); card.type = 'button'; card.className = 'stage-ov-card';
    card.setAttribute('aria-label', 'Go to slide ' + (i + 1) + (s.dataset.label ? ': ' + s.dataset.label : ''));
    if (s.dataset.thumb) card.style.background = s.dataset.thumb;
    var thumb = D.createElement('div'); thumb.className = 'stage-ov-thumb';
    var c = s.cloneNode(true);
    STATE_CLS.forEach(function (k) { c.classList.remove(k); });
    c.classList.add('is-active');
    $$('script', c).forEach(function (x) { x.remove(); });
    $$('[contenteditable]', c).forEach(function (x) { x.removeAttribute('contenteditable'); });
    var cc = $$('canvas', c);
    $$('canvas', s).forEach(function (lv, k) {
      try {
        var img = D.createElement('img'); img.src = lv.toDataURL('image/png');
        img.style.cssText = 'display:block;width:' + lv.offsetWidth + 'px;height:' + lv.offsetHeight + 'px';
        img.className = lv.className; cc[k].replaceWith(img);
      } catch (e) { /* tainted canvas — leave blank */ }
    });
    ['transform', 'transform-origin', 'visibility', 'opacity', 'filter', 'left', 'top'].forEach(function (p) { c.style.removeProperty(p); });
    c.style.width = W + 'px'; c.style.height = H + 'px';
    c.setAttribute('aria-hidden', 'true'); c.inert = true;
    finalize(c, i);
    thumb.appendChild(c);
    var num = D.createElement('span'); num.className = 'stage-ov-num';
    num.innerHTML = (i + 1) + ' / ' + N + (s.dataset.label ? '<em></em>' : '');
    if (s.dataset.label) num.lastChild.textContent = s.dataset.label;
    card.appendChild(thumb); card.appendChild(num);
    card.addEventListener('click', function () { ovJump(i); });
    card.addEventListener('focus', function () { ov.focus = i; });
    ov.grid.appendChild(card);
  });
}
function ovScale() {
  if (!ov.grid) return;
  $$('.stage-ov-card', ov.grid).forEach(function (card) {
    var c = card.firstChild.firstChild, w = parseFloat(c.style.width), h = parseFloat(c.style.height);
    var k = Math.min(card.clientWidth / w, card.clientHeight / h);
    c.style.transform = 'scale(' + k + ')';
    c.style.left = (card.clientWidth - w * k) / 2 + 'px'; c.style.top = (card.clientHeight - h * k) / 2 + 'px';
  });
}
function ovOpen() {
  if (ov.isOpen || !booted) return;
  ovBuild();
  ov.isOpen = true; ov.focus = cur;
  ov.el.classList.add('active'); ov.el.setAttribute('aria-hidden', 'false');
  body.classList.add('stage-ov-open');
  ovScale();
  var card = ov.grid.children[cur];
  card.classList.add('current'); card.focus({ preventScroll: true }); card.scrollIntoView({ block: 'nearest' });
}
function ovClose() {
  if (!ov.isOpen) return;
  ov.isOpen = false;
  ov.el.classList.remove('active'); ov.el.setAttribute('aria-hidden', 'true');
  body.classList.remove('stage-ov-open');
  if (ov.el.contains(D.activeElement)) D.activeElement.blur();
  setTimeout(function () { if (!ov.isOpen) ov.grid.innerHTML = ''; }, 300);   // free the clones
}
function ovJump(i) { ovClose(); go(i); }
function ovCols() {
  var cards = ov.grid.children, c = 1;
  while (c < cards.length && cards[c].offsetTop === cards[0].offsetTop) c++;
  return c;
}
function ovKey(e) {
  var k = e.key, n = ov.focus, last = N - 1, cols = ovCols();
  if (k === 'ArrowRight') n++; else if (k === 'ArrowLeft') n--;
  else if (k === 'ArrowDown') n += cols; else if (k === 'ArrowUp') n -= cols;
  else if (k === 'Home') n = 0; else if (k === 'End') n = last;
  else if (k === 'Enter' || k === ' ') { e.preventDefault(); return ovJump(ov.focus); }
  else if (k === 'o' || k === 'O') { e.preventDefault(); return ovClose(); }
  else return;
  e.preventDefault();
  ov.focus = clamp(n, 0, last); ov.grid.children[ov.focus].focus();
}

/* === LIGHTBOX — img[data-zoom] anywhere, or any .slide img outside [data-no-zoom] === */
var lb = { isOpen: false, el: null };
function lbOpen(src, alt) {
  if (!lb.el) {
    lb.el = D.createElement('div'); lb.el.className = 'stage-lb';
    lb.el.setAttribute('role', 'dialog'); lb.el.setAttribute('aria-label', 'Image viewer');
    lb.el.innerHTML = '<button class="stage-lb-close" aria-label="Close">&times;</button><img alt=""><span class="stage-lb-hint">Click anywhere or press Esc to close</span>';
    lb.el.addEventListener('click', lbClose);
    body.appendChild(lb.el);
  }
  var img = lb.el.querySelector('img'); img.src = src; img.alt = alt || '';
  lb.el.classList.add('active'); lb.isOpen = true;
}
function lbClose() { if (lb.el) lb.el.classList.remove('active'); lb.isOpen = false; }
D.addEventListener('click', function (e) {
  var img = e.target.closest && e.target.closest('img');
  if (!img || frozen || ov.isOpen || lb.isOpen) return;
  if (!img.hasAttribute('data-zoom') && (!img.closest('.slide') || img.closest('[data-no-zoom]'))) return;
  e.preventDefault(); e.stopPropagation();
  lbOpen(img.dataset.zoom || img.currentSrc || img.src, img.alt);
}, true);

/* === INPUT — keys · wheel · touch · hash · click (all no-op under overlays / editor) === */
var NEXT = ['ArrowRight', 'ArrowDown', 'PageDown', ' '], PREV = ['ArrowLeft', 'ArrowUp', 'PageUp'];
addEventListener('keydown', function (e) {
  if (!booted) return;
  var k = e.key;
  if (k === 'Escape') {        // priority: lightbox > overview (if open) > editor > open overview
    if (lb.isOpen) lbClose();
    else if (ov.isOpen) ovClose();
    else { if (frozen || typing(e.target)) return; ovOpen(); }
    e.preventDefault(); e.stopImmediatePropagation(); return;
  }
  if (lb.isOpen) { e.preventDefault(); return; }
  if (ov.isOpen) return ovKey(e);
  if (frozen || !opts.keys || typing(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
  if (k === 'o' || k === 'O') { e.preventDefault(); return ovOpen(); }
  if (k === ' ' && e.shiftKey) { e.preventDefault(); return prev(); }
  if (NEXT.indexOf(k) >= 0) { e.preventDefault(); next(); }
  else if (PREV.indexOf(k) >= 0) { e.preventDefault(); prev(); }
  else if (k === 'Home') { e.preventDefault(); go(0); }
  else if (k === 'End') { e.preventDefault(); go(N - 1); }
}, true);

// one slide per gesture: lock after a step, and treat a continuous trackpad-inertia stream as the same gesture
var wLock = 0, wLast = 0, wStream = false;
function scroller(t) {          // an element inside the slide that can actually scroll keeps the wheel
  for (; t && t.nodeType === 1 && !t.classList.contains('slide'); t = t.parentElement)
    if (t.scrollHeight > t.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(t).overflowY)) return true;
  return false;
}
addEventListener('wheel', function (e) {
  if (!booted || ov.isOpen || lb.isOpen || frozen || !opts.wheel || e.ctrlKey || scroller(e.target)) return;
  e.preventDefault();
  var now = performance.now(), gap = now - wLast; wLast = now;
  if (now < wLock) { wStream = true; return; }
  if (wStream && gap < 160) return;
  wStream = false;
  var d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  if (e.deltaMode === 1) d *= 16;
  if (Math.abs(d) < 6) return;
  wLock = now + 850;
  if (d > 0) next(); else prev();
}, { passive: false });

var tch = null;
addEventListener('touchstart', function (e) {
  tch = (e.touches.length === 1 && !typing(e.target)) ? [e.touches[0].clientX, e.touches[0].clientY] : null;
}, { passive: true });
addEventListener('touchend', function (e) {
  if (!tch || ov.isOpen || lb.isOpen || frozen || !opts.touch) return;
  var t = e.changedTouches[0], dx = t.clientX - tch[0], dy = t.clientY - tch[1]; tch = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 45) return;
  if ((Math.abs(dx) > Math.abs(dy) ? dx : dy) < 0) next(); else prev();
}, { passive: true });

D.addEventListener('click', function (e) {
  if (!opts.clickToAdvance || frozen || ov.isOpen || lb.isOpen || e.button !== 0) return;
  if (!e.target.closest('.slide') || e.target.closest('a,button,input,textarea,select,label,img,[data-no-advance]')) return;
  next();
});

function hashIndex() { var h = parseInt((location.hash || '').slice(1), 10); return h >= 1 && h <= N ? h - 1 : -1; }
addEventListener('hashchange', function () { var h = hashIndex(); if (opts.hash && h >= 0 && h !== cur) go(h); });

/* === REDUCED MOTION / PRINT === */
function applyReduced() {
  REDUCED = mq.matches; html.classList.toggle('stage-reduced', REDUCED);
  slides.forEach(function (s, k) { if (REDUCED) s.classList.add('is-final'); else if (k !== cur || !frozen) s.classList.remove('is-final'); });
}
mq.addEventListener && mq.addEventListener('change', applyReduced);
addEventListener('beforeprint', function () { unsplitAll(); slides.forEach(function (s, k) { finalize(s, k); }); });
addEventListener('afterprint', function () { if (booted) enterSlide(slides[cur], cur, cur, 'fwd'); slides.forEach(function (s, k) { if (k !== cur) settleOut(s); }); });

/* === FREEZE (editor) — current slide final, split text restored, input off === */
function freeze() {
  if (frozen || !booted) return;
  frozen = true; body.classList.add('stage-frozen');
  if (tctx) { tctx._kill(); tctx = null; }
  go(cur, { force: true, instant: true });      // settles any transition, applies finals
  unsplitAll();
}
function thaw() {
  if (!frozen) return;
  frozen = false; body.classList.remove('stage-frozen');
  go(cur, { force: true, instant: true });       // replay the current slide
}

/* === HOOK REGISTRATION (also drains window.STAGE_HOOKS queue) === */
function hook(key, h) {
  (HOOKS[key] || (HOOKS[key] = [])).push(h);
  var s = slides[cur];
  if (booted && s && s.dataset.scene === key && st(s).ctx) {     // registered late: run for the live slide
    if (frozen) h.final && safe(h.final, h, [s, { index: cur }]);
    else h.enter && safe(h.enter, h, [s, st(s).ctx]);
  }
}
var q = window.STAGE_HOOKS;
window.STAGE_HOOKS = { push: function () { Array.prototype.forEach.call(arguments, function (a) { hook(a[0], a[1]); }); } };
if (Array.isArray(q)) q.forEach(function (a) { hook(a[0], a[1]); });

/* === BOOT === */
function boot() {
  slides = $$('.slide').filter(function (s) { return !s.closest('.stage-ov'); });
  N = slides.length;
  if (!N) return console.warn('[Stage] no .slide elements');
  slides.forEach(function (s) {
    for (var p = s.parentElement; p && p !== body; p = p.parentElement) p.classList.add('stage-root');
    if (s.dataset.thumb) s.style.setProperty('--stage-thumb', s.dataset.thumb);
  });
  dotsEl = D.querySelector('.nav-dots');
  if (dotsEl && !dotsEl.children.length) slides.forEach(function (s, i) {
    var b = D.createElement('button'); b.type = 'button';
    b.setAttribute('aria-label', 'Slide ' + (i + 1) + (s.dataset.label ? ': ' + s.dataset.label : ''));
    b.addEventListener('click', function () { go(i); }); dotsEl.appendChild(b);
  });
  booted = true;
  applyReduced();
  var h = hashIndex();
  go(pending != null ? pending : h >= 0 ? h : 0, { force: true, boot: true });
}
function start() {
  var cap = new Promise(function (r) { setTimeout(r, 2500); });
  Promise.race([Promise.all(waits).catch(noop), cap]).then(boot);
}
if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', start); else setTimeout(start, 0);

/* === PUBLIC API === */
window.Stage = {
  version: '1.0',
  go: function (n, o) { go(n, o); }, next: next, prev: prev,
  get index() { return cur; }, get count() { return N; }, get slides() { return slides.slice(); },
  get current() { return slides[cur]; }, get reduced() { return REDUCED; }, get frozen() { return frozen; },
  get busy() { return body.classList.contains('stage-busy'); },
  hook: hook,
  onChange: function (fn) { changeFns.push(fn); if (booted && cur >= 0) safe(fn, null, [cur, -1, 'fwd', slides[cur]]); },
  setTransition: function (fn) { transitionFn = fn || null; }, dissolve: defaultTransition,
  raf: addLoop,
  waitFor: function (p) { waits.push(Promise.resolve(p)); },
  freeze: freeze, thaw: thaw,
  overview: { open: ovOpen, close: ovClose, toggle: function () { ov.isOpen ? ovClose() : ovOpen(); }, get isOpen() { return ov.isOpen; } },
  lightbox: { open: lbOpen, close: lbClose, get isOpen() { return lb.isOpen; } },
  fx: { countUp: countUp, split: split, unsplit: unsplit, unsplitAll: unsplitAll, finalize: finalize, easeOut: easeOut },
  opts: opts
};
addEventListener('resize', function () { if (ov.isOpen) { ovBuild(); ovScale(); ov.grid.children[cur].classList.add('current'); } });
})();
