#!/usr/bin/env python3
"""Make the downloadable PDF of each whiteboard summary.

usage: python3 tools/build_articles.py, then python3 tools/make_board_pdfs.py [ids...]
       (then build_articles.py once more so the app offers the new PDFs)

Each built board (app/src/main/assets/www/clinic/board/<id>.html) is printed by Chrome
to a single landscape vector page, app/src/main/assets/www/pdf/bd_<id>.pdf, exactly the
size of the board. tools/boards/pdfs.json records which version of each board the PDF was
made from, so unchanged boards are skipped and the app only offers PDFs that match the
board on screen. Needs Python Playwright with Chrome or Chromium.
"""
import os, sys, json, hashlib, shutil
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WWW = os.path.join(ROOT, 'app', 'src', 'main', 'assets', 'www')
BOARD = os.path.join(WWW, 'clinic', 'board')
PDF = os.path.join(WWW, 'pdf')
MAN = os.path.join(ROOT, 'tools', 'boards', 'pdfs.json')
W = 1760


def chrome():
    for c in ('google-chrome', 'chromium', 'chromium-browser'):
        p = shutil.which(c)
        if p:
            return p
    return None


def main(only):
    man = json.load(open(MAN, encoding='utf-8')) if os.path.exists(MAN) else {}
    ids = sorted(f[:-5] for f in os.listdir(BOARD) if f.endswith('.html'))
    todo = []
    for i in ids:
        h = hashlib.md5(open(os.path.join(BOARD, i + '.html'), 'rb').read()).hexdigest()
        if (only and i not in only) or (man.get(i) == h and os.path.exists(os.path.join(PDF, 'bd_%s.pdf' % i))):
            continue
        todo.append((i, h))
    if not todo:
        print('board PDFs: all up to date')
        return
    with sync_playwright() as p:
        exe = chrome()
        b = p.chromium.launch(executable_path=exe) if exe else p.chromium.launch()
        pg = b.new_page(viewport={'width': W, 'height': 1000})
        for i, h in todo:
            pg.goto('file://' + os.path.join(BOARD, i + '.html'))
            pg.evaluate('document.fonts.ready')
            pg.wait_for_timeout(300)
            hgt = pg.evaluate('Math.ceil(document.body.getBoundingClientRect().height)')
            pg.pdf(path=os.path.join(PDF, 'bd_%s.pdf' % i), width='%dpx' % W, height='%dpx' % (hgt + 2),
                   print_background=True, margin={'top': '0', 'right': '0', 'bottom': '0', 'left': '0'}, page_ranges='1')
            man[i] = h
            print('board PDF: %s (%d KB)' % (i, os.path.getsize(os.path.join(PDF, 'bd_%s.pdf' % i)) // 1024))
        b.close()
    man = {k: man[k] for k in sorted(man) if k in ids}
    with open(MAN, 'w', encoding='utf-8') as f:
        json.dump(man, f, indent=1, sort_keys=True)
        f.write('\n')


if __name__ == '__main__':
    main(set(sys.argv[1:]))
