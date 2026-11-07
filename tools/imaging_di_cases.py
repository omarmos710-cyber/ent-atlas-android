"""Add case images from Diagnostic Imaging: Head and Neck (Koch et al., 3rd ed.) to the core imaging conditions.
For each core condition (CONDS entries with kf.pg) the image panels of that diagnosis chapter are cropped one by one
to im/dk<pdfpage>_<n>.jpg, registered in const IMG (source "K", with the book's caption cleaned of arrow glyphs and
modality guessed from the caption) and appended to the condition's imgs. Also lists the files in web/sw.js.
Safe to re-run: earlier dk* entries are removed first."""
import json, os, re, subprocess, tempfile, glob
import pdfplumber
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WWW = os.path.join(ROOT, 'app/src/main/assets/www'); IDX = os.path.join(WWW, 'index.html'); IMD = os.path.join(WWW, 'im')
SW = os.path.join(ROOT, 'web/sw.js')
PDF = '/mnt/user-data/uploads/Diagnostic_Imaging__Head_and_Neck__3e___PDFDrive___2.pdf'
OFF, DPI, MAXP = 27, 220, 8

def jload(s, name):
    i = s.index('const %s=' % name); j = s.index('\n', i)
    return i, j, json.loads(s[i + len(name) + 7:j].rstrip().rstrip(';'))

def clean(t):
    t = re.sub(r'[-ﬀ-ﭏ]', '', t)
    t = re.sub(r'^\((Left|Right|Top|Bottom|Middle)\)\s*', '', t)
    t = re.sub(r'\s+\d{3,4}\s+[A-Z][A-Z ]{3,}.*$', '', t); t = re.sub(r'\s+\d{3,4}\s*(•.*)?$', '', t); t = re.sub(r'\s•.*$', '', t)
    t = re.sub(r'\s+([,.;:)])', r'\1', t); t = re.sub(r'\(\s+', '(', t); t = re.sub(r'\s{2,}', ' ', t).strip()
    t = re.sub(r'(\d+)\s?year[- ]old', r'\1-year-old', t)
    t = re.sub(r'\b(well|ill|capsule|rim|high|low|fat|time|non|post|pre|self)(defined|circumscribed|marginated|violating|sparing|enhancing|resolution|signal|density|attenuation|intensity|suppressed|saturated|of|enhanced|contrast|operative|treatment)\b', r'\1-\2', t, flags=re.I)
    return t

def modality(t):
    l = t.lower()
    if 'graphic' in l or 'photograph' in l: return 'Diagram'
    if 'ultrasound' in l or 'doppler' in l: return 'Ultrasound'
    if 'pet' in l.split() or 'pet/ct' in l or 'fdg' in l: return 'PET-CT'
    if 'esophagram' in l or 'barium' in l or 'swallow' in l: return 'Barium swallow'
    if 'angiogra' in l and 'cta' not in l.split(): return 'Angiography'
    if re.search(r'\b(c\+|post-?contrast|gadolinium|enhanced mr)', l) and re.search(r'\bt1|mr', l): return 'MRI T1+Gd'
    if re.search(r'\bt2|stir|fiesta|ciss|space\b|haste', l): return 'MRI T2'
    if re.search(r'\bt1', l): return 'MRI T1'
    if re.search(r'\b(mr|dwi|flair|diffusion|mra|mrv)', l): return 'MRI'
    if re.search(r'\b(ct|cect|nect|cta|cbct)\b', l) or 'bone ct' in l: return 'CT'
    if 'radiograph' in l or 'film' in l or 'scout' in l: return 'X-ray'
    if 'sestamibi' in l or 'scintig' in l: return ''
    return ''

def chapter_pages(start, starts):
    nxt = min([p for p in starts if p > start] or [start + 6])
    return range(start, min(nxt, start + 8))

def main():
    s = open(IDX, encoding='utf-8').read()
    caps = {}
    for line in open(os.path.join(ROOT, 'tools/data', 'di_caps.tsv'), encoding='utf-8'):
        k, _, v = line.rstrip('\n').partition('\t'); caps.setdefault(int(k[2:]), []).append(v)
    starts = sorted(int(l.split()[0]) for l in open(os.path.join(ROOT, 'tools/data', 'di_dx.txt')))
    ii, ij, IMG = jload(s, 'IMG')
    for k in [k for k in IMG if k.startswith('dk')]: del IMG[k]
    for f in glob.glob(os.path.join(IMD, 'dk*.jpg')): os.remove(f)
    ci, cj, C = jload(s, 'CONDS')
    new = []; pdf = pdfplumber.open(PDF)
    for c in C:
        c['imgs'] = [k for k in c['imgs'] if not k.startswith('dk')]; c['src'] = [x for x in c['src'] if x != 'K']
        if not (c.get('kf') and c['kf'].get('pg')): continue
        start = c['kf']['pg'] + OFF; got = []; ndiag = 0
        for p in chapter_pages(start, starts):
            page = pdf.pages[p - 1]
            ims = [i for i in page.images if (i['x1'] - i['x0']) > 60 and (i['bottom'] - i['top']) > 60]
            pans = []
            for i in ims:
                b = (round(i['x0']), round(i['top']), round(i['x1']), round(i['bottom']))
                if not any(abs(b[0] - q[0]) < 8 and abs(b[1] - q[1]) < 8 for q in pans): pans.append(b)
            pans.sort(key=lambda b: (round(b[1] / 20), b[0]))
            cs = caps.get(p, [])
            if not pans or len(cs) != len(pans): continue
            with tempfile.TemporaryDirectory() as td:
                subprocess.run(['pdftoppm', '-f', str(p), '-l', str(p), '-r', str(DPI), '-png', PDF, os.path.join(td, 'p')], check=True)
                im = Image.open(glob.glob(os.path.join(td, '*.png'))[0]).convert('RGB'); sc = im.width / page.width
                for n, (b, cap) in enumerate(zip(pans, cs), 1):
                    t = clean(cap); m = modality(t)
                    if len(t) < 25: continue
                    if m == 'Diagram':
                        if ndiag >= 1: continue
                        ndiag += 1
                    key = 'dk%d_%d' % (p, n)
                    crop = im.crop(tuple(int(v * sc) for v in b))
                    crop.save(os.path.join(IMD, key + '.jpg'), quality=82, optimize=True, progressive=True)
                    IMG[key] = [crop.width, crop.height, m, t, 'K', 'p. %d' % (p - OFF)]
                    got.append(key); new.append(key)
                    if len(got) >= MAXP: break
            if len(got) >= MAXP: break
        c['imgs'] += got
        c['src'] = [x for x in c['src'] if x != 'K'] + (['K'] if got else [])
    # write back (CONDS first: it comes later in the file than IMG? handle by position)
    parts = sorted([(ii, ij, 'const IMG=' + json.dumps(IMG, ensure_ascii=False, separators=(',', ':')) + ';'),
                    (ci, cj, 'const CONDS=' + json.dumps(C, ensure_ascii=False, separators=(',', ':')) + ';')], reverse=True)
    for a, b, txt in parts: s = s[:a] + txt + s[b:]
    if 'SRC.K=' not in s:
        s = s.replace('SRC.E="ESR Modern Radiology, Head and Neck Imaging"', 'SRC.E="ESR Modern Radiology, Head and Neck Imaging";SRC.K="Koch et al., Diagnostic Imaging: Head and Neck, 3rd ed."', 1)
    open(IDX, 'w', encoding='utf-8').write(s)
    w = open(SW, encoding='utf-8').read(); w = re.sub(r'"im/dk[^"]+",', '', w)
    last = re.findall(r'"im/[^"]+",', w)[-1]
    w = w.replace(last, last + ''.join('"im/%s.jpg",' % k for k in new), 1)
    open(SW, 'w', encoding='utf-8').write(w)
    print(len(new), 'images added to', sum(1 for c in C if any(k.startswith('dk') for k in c['imgs'])), 'conditions')

if __name__ == '__main__':
    main()
