"""Crop labelled figures from the two imaging books into clinic/fig/ for the imaging course.
usage: python3 crop_book_figs.py <ia|di> <pdf page 1-based> [row ...] [--cols]   (no rows = list rows only)
Each 'row' is a horizontal band of images. For Imaging Anatomy the label text beside the images is kept
(labelled plates); for Diagnostic Imaging only the images are kept, because its captions sit beside them. Output: clinic/fig/<book><page>-<row>.jpg (max 1000 px wide)."""
import sys, os, subprocess, tempfile
import pdfplumber
from PIL import Image
PDF = {'ia': '/mnt/user-data/uploads/Imaging_Anatomy_Head_and_Neck__1e_Philip_R_Chapman__Nicholas_A_Koontz_2.pdf',
       'di': '/mnt/user-data/uploads/Diagnostic_Imaging__Head_and_Neck__3e___PDFDrive___2.pdf'}
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app/src/main/assets/www/clinic/fig')
DPI = 170

def rows_on(page, widen=True):
    ims = [i for i in page.images if (i['x1'] - i['x0']) > 60 and (i['bottom'] - i['top']) > 60]
    ims.sort(key=lambda i: i['top'])
    rows = []
    for i in ims:
        for r in rows:
            if i['top'] < r['bottom'] - 8 and i['bottom'] > r['top'] + 8:
                r['top'] = min(r['top'], i['top']); r['bottom'] = max(r['bottom'], i['bottom'])
                r['x0'] = min(r['x0'], i['x0']); r['x1'] = max(r['x1'], i['x1']); r['n'] += 1; break
        else:
            rows.append({'top': i['top'], 'bottom': i['bottom'], 'x0': i['x0'], 'x1': i['x1'], 'n': 1})
    words = page.extract_words()
    for r in (rows if widen else []):   # widen to the label text sitting beside the images in the same band
        ws = [w for w in words if w['top'] >= r['top'] - 2 and w['bottom'] <= r['bottom'] + 2 and w['x0'] > 50]
        if ws:
            r['x0'] = min(r['x0'], min(w['x0'] for w in ws)); r['x1'] = max(r['x1'], max(w['x1'] for w in ws))
    return rows

def main():
    book, pg = sys.argv[1], int(sys.argv[2]); want = [int(x) for x in sys.argv[3:] if x.isdigit()]
    with pdfplumber.open(PDF[book]) as pdf:
        page = pdf.pages[pg - 1]; rows = rows_on(page, widen=(book == 'ia')); W, H = page.width, page.height
    if not want:
        for k, r in enumerate(rows, 1): print(k, 'n=%d' % r['n'], 'y %.0f-%.0f' % (r['top'], r['bottom']), 'x %.0f-%.0f' % (r['x0'], r['x1']))
        return
    with tempfile.TemporaryDirectory() as td:
        subprocess.run(['pdftoppm', '-f', str(pg), '-l', str(pg), '-r', str(DPI), '-png', PDF[book], os.path.join(td, 'p')], check=True)
        im = Image.open(os.path.join(td, sorted(os.listdir(td))[0])).convert('RGB'); sc = im.width / W
        for k in want:
            r = rows[k - 1]; pad = 6
            box = [max(0, r['x0'] - pad), max(0, r['top'] - pad), min(W, r['x1'] + pad), min(H, r['bottom'] + pad)]
            c = im.crop(tuple(int(v * sc) for v in box))
            if c.width > 1000: c = c.resize((1000, int(c.height * 1000 / c.width)), Image.LANCZOS)
            fn = os.path.join(OUT, '%s%d-%d.jpg' % (book, pg, k)); c.save(fn, quality=80, optimize=True, progressive=True)
            print(fn, c.size, os.path.getsize(fn) // 1024, 'KB')
main()
