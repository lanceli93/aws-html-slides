"""QA a generated Stage Engine deck: one screenshot per slide, overflow check, console errors, overview shot.

Usage:
    uv run --with playwright python scripts/qa-shots.py <deck/index.html> [out_dir] [--sizes 1600x900,1280x640] [--settle 2800]

Uses the locally installed Google Chrome (channel="chrome"), so no browser download is needed.
For each viewport it:
  * opens the deck, then for every slide calls Stage.go(i) and waits --settle ms (the intro choreography)
  * saves <out_dir>/<WxH>-sNN.png
  * reports visible text that is cut off by the viewport or by its own container (overflow:hidden card, etc.);
    a cut must persist across two checks 1.5s apart, so live tickers/feeds mid-scroll don't count
    (mark anything else intentionally clipped with data-qa-ignore)
  * presses O and saves <out_dir>/<WxH>-overview.png (thumbnails must not be blank)
  * collects console errors and page errors
Exit code 1 if any errors or overflow were found. LOOK at the screenshots afterwards; passing is not the same as good.
"""
import os
import sys
from playwright.sync_api import sync_playwright

OVERFLOW_JS = r"""
() => {
  // Report text that is visible but cut off: by the viewport, or by an ancestor with overflow != visible.
  // Text that is fully hidden (collapsed panel, opacity 0, clipped away entirely) is intentional and ignored.
  const W = innerWidth, H = innerHeight, tol = 2, out = [], seen = new Set();
  const slide = Stage.current;
  const hidden = el => { for (let a = el; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return true; } return false; };
  const clipOf = el => { let r = { l: 0, t: 0, r: W, b: H };
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
        const b = a.getBoundingClientRect();
        r = { l: Math.max(r.l, b.left), t: Math.max(r.t, b.top), r: Math.min(r.r, b.right), b: Math.min(r.b, b.bottom) };
      }
    } return r; };
  const walker = document.createTreeWalker(slide, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    const key = el && (el.closest('[data-split]') || el);   // split text: report once per headline
    if (!el || seen.has(key)) continue;
    if (el.closest('[data-qa-ignore], .stage-bg, [aria-hidden="true"]') || hidden(el)) continue;
    const c = clipOf(el), r = document.createRange(); r.selectNodeContents(n);
    for (const b of r.getClientRects()) {
      if (b.width < 1 || b.height < 1) continue;
      const vw = Math.min(b.right, c.r) - Math.max(b.left, c.l), vh = Math.min(b.bottom, c.b) - Math.max(b.top, c.t);
      if (vw <= 0 || vh <= 0) continue;                                  // fully clipped away: intentional
      // the text box includes the font's internal leading above/below the glyphs, so tolerate a
      // small vertical trim (line-mask reveals clip it); horizontal clipping is always a real cut
      const vt = Math.max(tol, b.height * 0.15);
      if (b.left < c.l - tol || b.right > c.r + tol || b.top < c.t - vt || b.bottom > c.b + vt) {
        seen.add(key);
        out.push('text cut off: "' + key.textContent.trim().slice(0, 40) + '" at ' +
          [b.left, b.top, b.right, b.bottom].map(v => Math.round(v)).join(',') +
          ' (visible box ' + [c.l, c.t, c.r, c.b].map(v => Math.round(v)).join(',') + ')');
        break;
      }
    }
  }
  return out;
}
"""


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(2)
    deck = os.path.abspath(args[0])
    out = args[1] if len(args) > 1 and not args[1].startswith("--") else os.path.join(os.path.dirname(deck), "_qa")
    sizes, settle = ["1600x900", "1280x640"], 2800
    if "--sizes" in args:
        sizes = args[args.index("--sizes") + 1].split(",")
    if "--settle" in args:
        settle = int(args[args.index("--settle") + 1])
    os.makedirs(out, exist_ok=True)
    problems = 0

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True, args=["--ignore-gpu-blocklist", "--enable-gpu"])
        for size in sizes:
            w, h = map(int, size.split("x"))
            page = browser.new_page(viewport={"width": w, "height": h})
            errors = []
            page.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
            page.goto("file://" + deck)
            page.wait_for_function("window.Stage && Stage.count > 0", timeout=15000)
            page.wait_for_timeout(1500)
            count = page.evaluate("Stage.count")
            print(f"[{size}] {count} slides")
            for i in range(count):
                page.evaluate(f"Stage.go({i}, {{force: true}})")
                page.wait_for_timeout(settle)
                page.screenshot(path=f"{out}/{size}-s{i + 1:02d}.png")
                issues = page.evaluate(OVERFLOW_JS)
                if issues:  # re-check after a beat: only report cuts that persist (ignores tickers/feeds mid-scroll)
                    page.wait_for_timeout(1500)
                    again = {x.split('" at ')[0] for x in page.evaluate(OVERFLOW_JS)}
                    issues = [x for x in issues if x.split('" at ')[0] in again]
                label = page.evaluate("Stage.current.dataset.label || ''")
                for issue in issues:
                    print(f"  slide {i + 1} {label}: {issue}")
                problems += len(issues)
            page.keyboard.press("o")
            page.wait_for_timeout(1200)
            page.screenshot(path=f"{out}/{size}-overview.png")
            page.keyboard.press("Escape")
            for e in errors:
                print("  " + e)
            problems += len(errors)
            page.close()
        browser.close()

    print(f"screenshots: {out}")
    print("OK: no overflow, no console errors" if problems == 0 else f"FOUND {problems} problem(s)")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
