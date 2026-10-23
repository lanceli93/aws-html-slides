/* ===========================================================
   INLINE EDITOR + SAVE-TO-FILE  (opt-in only; inline AFTER stage-engine.js)
   E = edit · Esc = save & exit · Ctrl/Cmd+S = write back into index.html
   Builds its own UI. Edits text elements inside .slide:
   h1–h4, p, li, span.edit, [data-edit]  (skip a subtree with [data-no-edit]).
   Rules kept from html-template.md:
   - JS hover hotzone with 400ms grace (never a CSS ~ hover chain)
   - showOpenFilePicker (NEVER showSaveFilePicker), handle kept in IndexedDB
   - read the file BEFORE createWritable() (it truncates), abort if < 50 chars
     or no .slide in the picked file; DOMParser diff-and-patch only
   - never write runtime artifacts: split spans, is-* and stage-* classes,
     contenteditable/spellcheck, rendered Lucide SVGs
   =========================================================== */
(function () {
'use strict';
var D = document, body = D.body, Stage = window.Stage;
if (!Stage) return console.warn('[editor] load stage-engine.js first');
var SEL = 'h1,h2,h3,h4,p,li,span.edit,[data-edit]';
var STORE = 'stage-edit:' + location.pathname;
var norm = function (t) { return (t || '').replace(/\s+/g, ' ').trim(); };
var ICON = {
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>'
};

/* === CLEAN SERIALIZATION — what gets compared / stored / written === */
function clean(el) {
    var c = el.cloneNode(true);
    c.querySelectorAll('svg[data-lucide]').forEach(function (svg) {         // rendered icon → source tag
        var i = D.createElement('i'); i.setAttribute('data-lucide', svg.getAttribute('data-lucide'));
        var keep = (svg.getAttribute('class') || '').split(/\s+/).filter(function (k) { return k && !/^lucide/.test(k); });
        if (keep.length) i.className = keep.join(' ');
        svg.replaceWith(i);
    });
    c.querySelectorAll('*').forEach(function (n) {
        n.removeAttribute('contenteditable'); n.removeAttribute('spellcheck');
        if (n.classList.length) {
            Array.prototype.slice.call(n.classList).forEach(function (k) { if (/^(is|stage)-/.test(k)) n.classList.remove(k); });
            if (!n.classList.length) n.removeAttribute('class');
        }
    });
    return c.innerHTML;
}

/* === RECORDS — indexed on the pristine DOM, before the engine boots === */
// key s{slide}_e{element} uses the SAME indexing on the parsed file (querySelectorAll order)
var recs = [], byKey = {};
Array.prototype.filter.call(D.querySelectorAll('.slide'), function (s) { return !s.closest('.stage-ov'); })
.forEach(function (s, si) {
    s.querySelectorAll(SEL).forEach(function (el, ei) {
        if (el.closest('[data-no-edit], .slide-index, [data-stage-label]') || (el.parentElement && el.parentElement.closest(SEL) &&
            s.contains(el.parentElement.closest(SEL)))) return;                // top-most editable only
        var r = { key: 's' + si + '_e' + ei, si: si, ei: ei, el: el, text: norm(el.textContent), base: clean(el) };
        recs.push(r); byKey[r.key] = r;
    });
});
var fp = (function (str) {                        // fingerprint of the file's text → ignore stale storage
    var h = 5381; for (var i = 0; i < str.length; i++) h = (h * 33 ^ str.charCodeAt(i)) >>> 0; return h.toString(36);
})(recs.map(function (r) { return r.text; }).join('|'));

// restore localStorage edits (before the engine splits anything)
try {
    var saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (saved && saved.fp === fp) Object.keys(saved.edits || {}).forEach(function (k) { if (byKey[k]) byKey[k].el.innerHTML = saved.edits[k]; });
} catch (e) {}

// snapshot changed elements (clean HTML). Split text is restored first, re-split afterwards.
function changes() {
    var resplit = Stage.frozen ? [] : Stage.fx.unsplitAll(), out = {};
    recs.forEach(function (r) { var h = clean(r.el); if (h !== r.base) out[r.key] = h; });
    resplit.forEach(function (x) { Stage.fx.split(x.el, x.mode); });
    return out;
}
function saveLocal() {
    var ch = changes();
    try {
        if (Object.keys(ch).length) localStorage.setItem(STORE, JSON.stringify({ fp: fp, edits: ch }));
        else localStorage.removeItem(STORE);
    } catch (e) {}
    return ch;
}

/* === UI === */
function mk(tag, cls, htmlStr, parent) { var e = D.createElement(tag); e.className = cls; if (htmlStr) e.innerHTML = htmlStr; (parent || body).appendChild(e); return e; }
var hotzone = mk('div', 'edit-hotzone');
var toggleBtn = mk('button', 'edit-toggle', ICON.edit + '<span>Edit</span>');
toggleBtn.title = 'Edit mode (E)'; toggleBtn.type = 'button';
var saveBtn = mk('button', 'edit-save-file', ICON.save + '<span>Save to file</span>');
saveBtn.title = 'Save to file (Ctrl/Cmd+S)'; saveBtn.type = 'button';
var bar = mk('div', 'edit-bar');
bar.innerHTML = '<button type="button" data-a="prev" aria-label="Previous slide">&larr;</button><span class="edit-pos"></span>' +
    '<button type="button" data-a="next" aria-label="Next slide">&rarr;</button><button type="button" data-a="ov">Overview</button>' +
    '<button type="button" data-a="done">Done</button>';
var toast = mk('div', 'edit-toast'); toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite');
var pos = bar.querySelector('.edit-pos');
Stage.onChange(function (i) { pos.textContent = (i + 1) + ' / ' + Stage.count; });
bar.addEventListener('click', function (e) {
    var a = e.target.closest('button'); a = a && a.dataset.a;
    if (a === 'prev') Stage.prev(); else if (a === 'next') Stage.next();
    else if (a === 'ov') Stage.overview.open(); else if (a === 'done') editor.toggle();
});

function showToast(msg, isError) {
    toast.textContent = msg; toast.classList.toggle('error', !!isError); toast.classList.add('show');
    clearTimeout(showToast.t); showToast.t = setTimeout(function () { toast.classList.remove('show'); }, 2600);
}

/* === EDITOR === */
var editor = window.__editor = {
    isActive: false,
    editableSelector: SEL,
    toggle: function () { editor.isActive ? editor.exit() : editor.enter(); },
    enter: function () {
        if (editor.isActive) return;
        Stage.freeze();                                   // current slide final, split text restored, nav off
        recs.forEach(function (r) { r.el.setAttribute('contenteditable', 'true'); r.el.setAttribute('spellcheck', 'false'); });
        editor.isActive = true;
        body.classList.add('editing-active'); toggleBtn.classList.add('active', 'show');
        pos.textContent = (Stage.index + 1) + ' / ' + Stage.count;
    },
    exit: function () {
        if (!editor.isActive) return;
        if (D.activeElement && D.activeElement.isContentEditable) D.activeElement.blur();
        recs.forEach(function (r) { r.el.removeAttribute('contenteditable'); r.el.removeAttribute('spellcheck'); });
        var n = Object.keys(saveLocal()).length;
        editor.isActive = false;
        body.classList.remove('editing-active'); toggleBtn.classList.remove('active', 'show');
        Stage.thaw();
        if (n) showToast(n + ' edit' + (n > 1 ? 's' : '') + ' kept in this browser · Ctrl/Cmd+S writes the file');
    },
    saveToFile: saveToFile,
    showToast: showToast
};

/* === WIRING — click, 400ms hover grace, keys === */
toggleBtn.addEventListener('click', editor.toggle);
hotzone.addEventListener('click', editor.toggle);
saveBtn.addEventListener('click', saveToFile);
var hideT = null;
function hideLater() { clearTimeout(hideT); hideT = setTimeout(function () { if (!editor.isActive) toggleBtn.classList.remove('show'); }, 400); }
hotzone.addEventListener('mouseenter', function () { clearTimeout(hideT); toggleBtn.classList.add('show'); });
hotzone.addEventListener('mouseleave', hideLater);
toggleBtn.addEventListener('mouseenter', function () { clearTimeout(hideT); });
toggleBtn.addEventListener('mouseleave', hideLater);

D.addEventListener('keydown', function (e) {
    var t = e.target, typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) { e.preventDefault(); return saveToFile(); }
    if (Stage.overview.isOpen || Stage.lightbox.isOpen) return;    // engine already handled Esc for overlays
    if (e.key === 'Escape' && editor.isActive) { e.preventDefault(); return editor.exit(); }
    if ((e.key === 'e' || e.key === 'E') && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); editor.toggle(); }
});

/* === SAVE TO FILE (File System Access API, Chromium desktop) === */
var HANDLE_DB = 'slide-editor', HANDLE_STORE = 'handles', HANDLE_KEY = 'html:' + location.pathname;
function openHandleDB() {
    return new Promise(function (resolve, reject) {
        var req = indexedDB.open(HANDLE_DB, 1);
        req.onupgradeneeded = function () { req.result.createObjectStore(HANDLE_STORE); };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
    });
}
function idb(mode, fn) {
    return openHandleDB().then(function (db) {
        return new Promise(function (resolve, reject) {
            var tx = db.transaction(HANDLE_STORE, mode), req = fn(tx.objectStore(HANDLE_STORE));
            tx.oncomplete = function () { resolve(req && req.result); };
            tx.onerror = function () { reject(tx.error); };
        });
    });
}
var getSavedHandle = function () { return idb('readonly', function (s) { return s.get(HANDLE_KEY); }); };
var setSavedHandle = function (h) { return idb('readwrite', function (s) { return s.put(h, HANDLE_KEY); }); };
var clearSavedHandle = function () { return idb('readwrite', function (s) { return s.delete(HANDLE_KEY); }); };

// a writable handle to the EXISTING index.html (showOpenFilePicker never truncates)
async function ensureHandle() {
    if (!('showOpenFilePicker' in window)) throw new Error('Browser does not support File System Access API. Use Chrome or Edge.');
    var handle = await getSavedHandle().catch(function () { return null; });
    if (handle) {
        if (await handle.queryPermission({ mode: 'readwrite' }) === 'granted') return handle;
        if (await handle.requestPermission({ mode: 'readwrite' }) === 'granted') return handle;
        await clearSavedHandle();                               // permission revoked → re-pick
    }
    var picked = (await window.showOpenFilePicker({ multiple: false, types: [{ description: 'HTML', accept: { 'text/html': ['.html', '.htm'] } }] }))[0];
    if (await picked.requestPermission({ mode: 'readwrite' }) !== 'granted') throw new Error('Write permission denied.');
    await setSavedHandle(picked);
    return picked;
}

async function saveToFile() {
    var live = changes();                                       // clean HTML of changed elements only
    if (!Object.keys(live).length) return showToast('No changes to save');
    var handle;
    try { handle = await ensureHandle(); }
    catch (e) { if (e.name !== 'AbortError') showToast(e.message, true); return; }
    try {
        // CRITICAL: read BEFORE createWritable() — createWritable() truncates the file.
        var originalHtml = await (await handle.getFile()).text();
        if (!originalHtml || originalHtml.length < 50) throw new Error('Source file is empty or too small — aborting to avoid data loss. Pick the correct index.html again.');
        var doc = new DOMParser().parseFromString(originalHtml, 'text/html');
        var parsed = doc.querySelectorAll('.slide');
        if (!parsed.length) throw new Error('No .slide elements found in picked file — wrong file?');
        var done = [], skipped = 0;
        Object.keys(live).forEach(function (k) {
            var r = byKey[k], ps = parsed[r.si], pel = ps && ps.querySelectorAll(SEL)[r.ei];
            // identity check: the file's element must still hold the text we loaded
            if (!pel || norm(pel.textContent) !== r.text) { skipped++; return; }
            pel.innerHTML = live[k]; done.push(k);
        });
        if (!done.length) throw new Error('Picked file does not match this deck — nothing written.');
        var writable = await handle.createWritable();
        await writable.write('<!DOCTYPE html>\n' + doc.documentElement.outerHTML);
        await writable.close();
        done.forEach(function (k) { var r = byKey[k]; r.base = live[k]; r.text = norm(r.el.textContent); });   // file = new baseline
        saveLocal();                                            // keeps only edits that were skipped
        showToast('Saved to ' + handle.name + (skipped ? ' · ' + skipped + ' element(s) skipped (file changed)' : ''), !!skipped);
    } catch (e) {
        console.error(e);
        showToast('Save failed: ' + e.message, true);
    }
}
})();
