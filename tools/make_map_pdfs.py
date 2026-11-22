#!/usr/bin/env python3
"""Make the two downloadable PDFs of each mind map.

usage: python3 tools/build_maps.py (or build_articles.py), then python3 tools/make_map_pdfs.py [map ids...],
       then build_maps.py once more so the map pages offer the new PDFs.

For every map in content/maps:
  pdf/mm_<map id>.pdf     the whole map drawn fully open (every topic, heading and fact, with the links
                          between topics) on one vector page, with the map's title and its abbreviations.
  pdf/mmall_<map id>.pdf  the map page first, then every topic's Clinical article PDF (pdf/cl_<article id>.pdf)
                          joined in the map's order, with one bookmark for the map and one per article.
tools/maps/pdfs.json records what each pair was made from (the map's JSON + the drawing engine, and the
article PDFs), so unchanged maps are skipped and build_maps.py only offers PDFs that match the map on screen.
Rebuild after make_pdfs.js changes the article PDFs. Needs Python Playwright with Chrome or Chromium, and pypdf.
"""
import os, sys, json, shutil
from playwright.sync_api import sync_playwright
from pypdf import PdfReader, PdfWriter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import build_maps as BM

WWW = BM.WWW
PDF = os.path.join(WWW, 'pdf')
MAPS = os.path.join(WWW, 'clinic', 'map')
VIEW_W = 1600   # wide enough that the map is drawn on both sides with every topic open
PAD = 36

# Keep the header (title, subtitle) and the abbreviations; drop the app controls; lay the drawing out at its
# own size so it is printed whole on one page.
PRINT = r'''() => {
  const svg = document.getElementById('map'), world = document.getElementById('world');
  const bb = world.getBBox(), P = %d;
  const w = Math.ceil(bb.width + 2 * P), h = Math.ceil(bb.height + 2 * P);
  const keep = svg.cloneNode(true);
  keep.setAttribute('viewBox', `${bb.x - P} ${bb.y - P} ${w} ${h}`);
  keep.setAttribute('width', w); keep.setAttribute('height', h);
  keep.style.cssText = `display:block;flex:none;width:${w}px;height:${h}px;cursor:default`;
  keep.querySelectorAll('.meas').forEach(n => n.remove());
  const head = document.querySelector('header').cloneNode(true);
  head.querySelector('nav').remove();
  head.style.cssText = 'border:0;background:none;padding:22px 30px 0';
  head.querySelector('h1').style.fontSize = '72px';
  head.querySelector('.st').style.cssText = 'display:block;font-size:34px';
  const ab = document.getElementById('abbr').cloneNode(true);
  ab.removeAttribute('id');
  ab.style.cssText = 'display:block;position:static;max-width:none;margin:0 30px 26px;font-size:17px;line-height:1.5;background:#fff;border:2px solid #1d2330;border-radius:14px 8px 16px 9px;padding:10px 14px';
  const foot = document.createElement('div');
  foot.textContent = 'The ENT Companion · mind map';
  foot.style.cssText = 'font:20px Caveat;color:#888;margin:0 30px 18px;text-align:right';
  document.body.innerHTML = '';
  document.documentElement.style.cssText = 'height:auto;overflow:visible';
  document.body.style.cssText = 'height:auto;overflow:visible;display:block;width:' + Math.max(w, 900) + 'px';
  document.body.append(head, keep, ab, foot);
  return {w: Math.max(w, 900), h: Math.ceil(document.body.getBoundingClientRect().height) + 2};
}''' % PAD


def chrome():
    for c in ('google-chrome', 'chromium', 'chromium-browser'):
        p = shutil.which(c)
        if p:
            return p
    return None


def titles():
    try:
        d = open(os.path.join(WWW, 'clinic', 'data.js'), encoding='utf-8').read()
        return {t['id']: t['t'] for t in json.loads(d[d.index('=') + 1:].rstrip().rstrip(';'))['t']}
    except Exception:
        return {}


def merge(m, names):
    """The map page, then the topics' article PDFs in map order; one bookmark each."""
    w = PdfWriter()
    w.append(PdfReader(os.path.join(PDF, 'mm_%s.pdf' % m['id'])), import_outline=False)   # the map first
    w.add_outline_item('Mind map: %s' % m['title'], 0)
    for b in m['branches']:
        f = os.path.join(PDF, 'cl_%s.pdf' % b['id'])
        if not os.path.exists(f):
            raise SystemExit('missing article PDF: pdf/cl_%s.pdf (map %s); run tools/make_pdfs.js first' % (b['id'], m['id']))
        start = len(w.pages)
        w.append(PdfReader(f), import_outline=False)
        w.add_outline_item(names.get(b['id'], b['name']), start)
    w.add_metadata({'/Title': 'The ENT Companion - %s - all topics' % m['title'], '/Author': 'The ENT Companion'})
    w.page_mode = '/UseOutlines'
    try:
        w.compress_identical_objects()
    except Exception:
        pass
    out = os.path.join(PDF, 'mmall_%s.pdf' % m['id'])
    with open(out, 'wb') as fh:
        w.write(fh)
    return len(w.pages), out


def main(only):
    man = json.load(open(BM.PDFMAN, encoding='utf-8')) if os.path.exists(BM.PDFMAN) else {}
    maps = BM.load()
    names = titles()
    todo = []
    for m in maps:
        arts = [b['id'] for b in m['branches']]
        e = man.get(m['id'], {})
        fresh = (e.get('src') == BM.src_hash(m['id']) and e.get('arts') == BM.arts_hash(arts)
                 and all(os.path.exists(os.path.join(PDF, p + m['id'] + '.pdf')) for p in ('mm_', 'mmall_')))
        if (only and m['id'] not in only) or (fresh and not only):
            continue
        todo.append(m)
    if not todo:
        print('map PDFs: all up to date')
        return
    with sync_playwright() as p:
        exe = chrome()
        br = p.chromium.launch(executable_path=exe) if exe else p.chromium.launch()
        pg = br.new_page(viewport={'width': VIEW_W, 'height': 1000})
        for m in todo:
            pg.goto('file://' + os.path.join(MAPS, m['id'] + '.html'))
            pg.evaluate('document.fonts.ready')
            pg.wait_for_function('document.querySelectorAll("#world .leaf").length > 0')
            pg.wait_for_timeout(300)
            n_leaf = pg.evaluate('document.querySelectorAll("#world .leaf").length')
            want = sum(len(fs) for b in m['branches'] for _, fs in b['subs'])
            assert n_leaf == want, '%s: drawn %d facts, map has %d (not every topic open?)' % (m['id'], n_leaf, want)
            size = pg.evaluate(PRINT)
            pg.wait_for_timeout(150)
            mp = os.path.join(PDF, 'mm_%s.pdf' % m['id'])
            pg.pdf(path=mp, width='%dpx' % size['w'], height='%dpx' % size['h'], print_background=True,
                   margin={'top': '0', 'right': '0', 'bottom': '0', 'left': '0'}, page_ranges='1')
            pages, ap = merge(m, names)
            man[m['id']] = {'src': BM.src_hash(m['id']), 'arts': BM.arts_hash([b['id'] for b in m['branches']]),
                            'map_pages': 1, 'all_pages': pages}
            print('map PDFs: %-18s map %4d KB (%dx%d px) · merged %d articles, %d pages, %.1f MB' % (
                m['id'], os.path.getsize(mp) // 1024, size['w'], size['h'], len(m['branches']), pages,
                os.path.getsize(ap) / 1048576))
        br.close()
    ids = {m['id'] for m in maps}
    man = {k: man[k] for k in sorted(man) if k in ids}
    with open(BM.PDFMAN, 'w', encoding='utf-8') as f:
        json.dump(man, f, indent=1, sort_keys=True)
    print('next: python3 tools/build_maps.py (pages offer the PDFs), then python3 tools/build_sw.py')


if __name__ == '__main__':
    main(set(sys.argv[1:]))
