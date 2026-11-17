#!/usr/bin/env python3
"""Build the full-text search index (www/search/full.js) from the generated article files.

Every subsection of every clinical article, operation chapter and surgical-basics chapter
becomes one search entry, and every "Current evidence" box becomes its own entry, so search
can find any sentence in the app and open the article at that exact section.

Entry format (array, to keep the file small):
  [type, route, title, where, text]
  type  : "sec" clinical section, "osec" operation section, "bsec" basics section, "ev" evidence box
  route : the data-go value, with "~<anchor>" to open the article at that section
  title : the section heading
  where : article title and chapter, shown as the result's path
  text  : plain text of the section
"""
import json, os, re, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WWW = os.path.join(ROOT, 'app', 'src', 'main', 'assets', 'www')
OUT = os.path.join(WWW, 'search', 'full.js')

TAG = re.compile(r'<[^>]+>')
WS = re.compile(r'\s+')
BOX = re.compile(r'<div class="arbox k-(update|evidence)">(.*?)</div>', re.S)
SECTION = re.compile(r'<section class="arch-c" id="a-(c\d+)" data-t="([^"]*)">')
SUB = re.compile(r'<details class="arsub" id="a-(s\d+-\d+)"[^>]*><summary>.*?<h3>(.*?)</h3>', re.S)
LEVEL = re.compile(r'<span class="lv[^"]*">[^<]*</span>')
SVG = re.compile(r'<svg.*?</svg>', re.S)
FIGCAP = re.compile(r'<figure.*?</figure>', re.S)


def text(h, blocks=False):
    """Plain text. With blocks=True every paragraph, list item, heading or cell ends in a newline,
    so the offline answer box can tell sentences from headings (shown as spaces everywhere else)."""
    h = SVG.sub(' ', h)
    if blocks:
        # table cells and the parts of labelled rows (term + explanation, step number + step) end in a tab,
        # header cells in a vertical tab; rows, paragraphs and headings in a newline
        h = re.sub(r'</th>', '\x03', h)
        h = re.sub(r'</td>', '\x02', h)
        h = re.sub(r'(<span class="root">[^<]*</span>)', lambda m: m.group(1)[:-7] + '\x01', h)
        h = re.sub(r'</(b|em|strong|span|i)>\s*(?=<(span|b|div|ul|em|strong)\b)', '\x02', h)
        h = re.sub(r'(<span class="(?:n|dot|k)">[^<]*</span>)', lambda m: m.group(1) + '\x02', h)
    h = re.sub(r'</(p|li|h\d|tr|td|th|div|summary|dt|dd|figcaption|caption)>', '\x01' if blocks else ' ', h)
    t = WS.sub(' ', html.unescape(TAG.sub(' ', h)))
    if blocks:
        t = re.sub(r' *\x03[ \x02\x03]*', '\t\t', t)  # header cells: a double tab
        t = re.sub(r' *\x02[ \x02]*', '\t', t).replace('\t\t\t', '\t\t')
        t = re.sub(r'[ \t\v\x01]*\x01[ \t\v\x01]*', '\n', t)
    return t.strip()


def load(path, var):
    """Read one generated article file: (window.X=window.X||{})["id"]={"h": "..."}"""
    s = open(path, encoding='utf-8').read()
    i = s.index('={') + 1
    return json.loads(s[i:].rstrip().rstrip(';'))['h']


def entries_for(h, article, route, kind):
    out = []
    # chapters, then subsections inside each chapter
    chs = list(SECTION.finditer(h))
    for ci, cm in enumerate(chs):
        cend = chs[ci + 1].start() if ci + 1 < len(chs) else len(h)
        chap_html = h[cm.start():cend]
        chap_id, chap_t = cm.group(1), html.unescape(cm.group(2))
        if chap_t.lower().startswith('for the examination'):
            where_ex = True
        else:
            where_ex = False
        subs = list(SUB.finditer(chap_html))
        # text before the first subsection (chapter intro, boxes placed directly under the chapter)
        pre = chap_html[:subs[0].start()] if subs else chap_html
        segs = [(chap_id, chap_t, pre)]
        for si, sm in enumerate(subs):
            send = subs[si + 1].start() if si + 1 < len(subs) else len(chap_html)
            title = text(LEVEL.sub('', sm.group(2)))
            segs.append((sm.group(1), title, chap_html[sm.start():send]))
        for anchor, title, seg in segs:
            # evidence boxes become their own entries
            for bm in BOX.finditer(seg):
                body = text(bm.group(2), True)
                body = re.sub(r'^(Current evidence|Evidence)\s*', '', body)
                if len(body) > 40:
                    out.append(['ev', f'{route}~{anchor}', f'{article}: current evidence',
                                f'{article} · {chap_t}', body])
            seg_wo = LEVEL.sub(' ', BOX.sub(' ', seg))
            # drop the chapter heading block from the chapter-intro segment
            seg_wo = re.sub(r'<div class="archd">.*?</div>\s*</div>', ' ', seg_wo, flags=re.S)
            body = text(seg_wo, True)
            if anchor == chap_id:
                body = re.sub(r'^\d+\s+Chapter \w+\s+' + re.escape(chap_t) + r'\s*', '', body)
                if len(body) < 60:
                    continue
                title = chap_t
            else:
                body = re.sub(r'^[\d.]+\s+' + re.escape(title) + r'\s*', '', body)
            if not body:
                continue
            out.append([kind, f'{route}~{anchor}', title, f'{article} · {chap_t}', body[:1600]])
    return out


def main():
    allx = []
    # clinical articles: titles from the clinic data file
    cd = open(os.path.join(WWW, 'clinic', 'data.js'), encoding='utf-8').read()
    cd = json.loads(cd[cd.index('{'):].rstrip().rstrip(';'))
    titles = {t['id']: t['t'] for t in cd['t']}
    groups = cd['g']
    gof = {t['id']: groups.get(t['g'], '') for t in cd['t']}
    adir = os.path.join(WWW, 'clinic', 'art')
    for fn in sorted(os.listdir(adir)):
        if not fn.endswith('.js') or fn in ('index.js', 'figs.js'):
            continue
        aid = fn[:-3]
        if aid not in titles:
            continue
        h = load(os.path.join(adir, fn), 'CLART')
        allx += entries_for(h, titles[aid], f'cl:t-{aid}', 'sec')
    # operation chapters
    ti = open(os.path.join(WWW, 'theatre', 'index.js'), encoding='utf-8').read()
    ti = json.loads(ti[ti.index('{'):].rstrip().rstrip(';'))
    otitles = {str(c['n']): c['t'] for c in ti['ch']}
    odir = os.path.join(WWW, 'theatre', 'art')
    for fn in sorted(os.listdir(odir)):
        n = fn[:-3]
        if n not in otitles:
            continue
        h = load(os.path.join(odir, fn), 'THART')
        allx += entries_for(h, otitles[n], f'th:op-{n}', 'osec')
    # surgical basics
    bi = open(os.path.join(WWW, 'theatre', 'basics', 'index.js'), encoding='utf-8').read()
    bi = json.loads(bi[bi.index('['):].rstrip().rstrip(';'))
    btitles = {c['id']: c['t'] for p in bi for c in p['c']}
    bdir = os.path.join(WWW, 'theatre', 'basics')
    for fn in sorted(os.listdir(bdir)):
        bid = fn[:-3]
        if bid not in btitles:
            continue
        h = load(os.path.join(bdir, fn), 'THB')
        allx += entries_for(h, btitles[bid], f'th:b-{bid}', 'bsec')
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    js = 'window.XFULL=' + json.dumps(allx, ensure_ascii=False, separators=(',', ':')) + ';\n'
    open(OUT, 'w', encoding='utf-8').write(js)
    kinds = {}
    for e in allx:
        kinds[e[0]] = kinds.get(e[0], 0) + 1
    print(f'search index: {len(allx)} entries {kinds}, {len(js)//1024} KB')


if __name__ == '__main__':
    main()
