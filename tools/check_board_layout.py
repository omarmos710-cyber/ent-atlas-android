#!/usr/bin/env python3
"""Layout check for the whiteboard summaries.

usage: python3 tools/check_board_layout.py [ids...]   (after tools/build_articles.py)

Opens each built board (app/src/main/assets/www/clinic/board/<id>.html) in Chrome at its
real width and reports:
  cols  the natural bottom of each of the four columns, and the gap between the longest and
        the shortest (a board is balanced when the gap is at most 60 px; <div class="grid even">
        then stretches the last card of each column so all four end on one line)
  over  anything wider than the box it sits in (cards, tables, chips, drawings)
  svg   labels inside a drawing that overlap each other or run outside it
Exit status 1 if any board fails.
"""
import os, sys
from playwright.sync_api import sync_playwright
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOARD = os.path.join(ROOT, 'app', 'src', 'main', 'assets', 'www', 'clinic', 'board')
GAP = 60

JS = r'''() => {
 const r = {cols: [], over: [], svg: []};
 // columns are measured at their natural height: an "even" grid stretches the last card of
 // each column to the same bottom, which would hide an unbalanced board
 const ev = [...document.querySelectorAll('.grid.even')]; ev.forEach(g => g.classList.remove('even'));
 const cols = [...document.querySelectorAll('.grid > .gcol')];
 const top = document.querySelector('.grid').getBoundingClientRect().top;
 r.cols = cols.map(c => { const k = c.lastElementChild; return k ? Math.round(k.getBoundingClientRect().bottom - top) : 0 });
 ev.forEach(g => g.classList.add('even'));
 const txt = e => (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50);
 document.querySelectorAll('.card, .card *').forEach(e => {
  if (e.closest('svg') && e.tagName.toLowerCase() !== 'svg') return;
  const p = e.closest('.card'); if (!p) return;
  const box = (e === p ? p.closest('.gcol') : p).getBoundingClientRect(), b = e.getBoundingClientRect();
  if (b.width && (b.right > box.right + 1 || b.left < box.left - 1)) r.over.push(txt(e) || e.tagName);
  if (e !== p && e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== 'visible') r.over.push('scroll: ' + txt(e));
 });
 document.querySelectorAll('svg').forEach(s => {
  const sb = s.getBoundingClientRect();
  const t = [...s.querySelectorAll('text')].map(x => ({x, b: x.getBoundingClientRect()}));
  t.forEach(a => { if (a.b.left < sb.left - 1 || a.b.right > sb.right + 1 || a.b.top < sb.top - 1 || a.b.bottom > sb.bottom + 1) r.svg.push('outside: ' + a.x.textContent) });
  for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) {
   const a = t[i].b, b = t[j].b, ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
   if (ox > 2 && oy > 3) r.svg.push('overlap: ' + t[i].x.textContent + ' / ' + t[j].x.textContent);
  }
 });
 r.h = Math.ceil(document.body.getBoundingClientRect().height);
 return r;
}'''


def main(only):
    ids = sorted(f[:-5] for f in os.listdir(BOARD) if f.endswith('.html'))
    if only:
        ids = [i for i in ids if i in only]
    bad = 0
    exe = next((shutil.which(c) for c in ('google-chrome', 'chromium', 'chromium-browser') if shutil.which(c)), None)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=exe) if exe else p.chromium.launch()
        pg = b.new_page(viewport={'width': 1760, 'height': 1000})
        for i in ids:
            pg.goto('file://' + os.path.join(BOARD, i + '.html'))
            pg.evaluate('document.fonts.ready')
            pg.wait_for_timeout(200)
            r = pg.evaluate(JS)
            gap = max(r['cols']) - min(r['cols'])
            ok = gap <= GAP and not r['over'] and not r['svg']
            bad += not ok
            print('%-12s %s  h=%d cols=%s gap=%d%s%s' % (i, 'ok  ' if ok else 'FAIL', r['h'], r['cols'], gap,
                  ('\n   over: ' + ' | '.join(sorted(set(r['over'])))) if r['over'] else '',
                  ('\n   svg: ' + ' | '.join(r['svg'])) if r['svg'] else ''))
        b.close()
    return bad


if __name__ == '__main__':
    sys.exit(1 if main(sys.argv[1:]) else 0)
