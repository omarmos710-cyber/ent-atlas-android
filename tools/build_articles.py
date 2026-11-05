#!/usr/bin/env python3
"""Compile Clinical long-form articles from content/clinic/*.txt into
app/src/main/assets/www/clinic/art/<id>.js  (+ art/index.js).

Authoring format (one file per topic, file name = topic id):

  @stand Opening paragraph shown under the title.
  # Chapter title | one-line chapter intro (optional)
  ## Section title                      -> numbered 1.1, 1.2 (collapsible)
  ### Branch title                      -> numbered 1.1.1
  Plain lines form paragraphs (blank line ends a paragraph).
  - item                                -> bullet list
  !fig d13-1 d13-2 | Caption text       -> figure plate (files in clinic/fig/)
  !pearl Title / !flag / !exam / !update / !note / !ward Title ... !!   -> boxes
  !differ ... !!   lines "Dhingra: ..." "Lee: ..." then a note
  !table Title ... !!   rows "a | b | c", first row is the header
  !tree Root ... !!     rows "Key | Bold | rest"
  !ladder ... !!        rows "Title | text"
  Inline: **bold**, *term*, [[4.1]] cross-reference to a numbered heading.
"""
import html, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'content', 'clinic')
WWW = os.path.join(ROOT, 'app', 'src', 'main', 'assets', 'www')
OUT = os.path.join(WWW, 'clinic', 'art')
FIGDIR = os.path.join(WWW, 'clinic', 'fig')
CHEV = '<svg class="arch" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'
BOXES = {'pearl': 'Pearl', 'flag': 'Red flags', 'exam': 'What the examiner wants', 'update': 'Guideline update',
         'note': 'Note', 'ward': 'On the ward', 'pit': 'Common pitfalls', 'differ': 'Where the books differ'}
WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen']
BOOK = {'d': 'Dhingra', 'l': 'K.J. Lee'}
_FIGKEYS = None


def app_fig_keys():
    """Keys of the app's own anatomy figures (FIG in index.html)."""
    global _FIGKEYS
    if _FIGKEYS is None:
        h = open(os.path.join(WWW, 'index.html'), encoding='utf-8').read()
        i = h.find('const FIG={'); j = h.find('};', i)
        _FIGKEYS = set(re.findall(r'"([^"]+)":\[', h[i:j]))
    return _FIGKEYS


def inline(s, refs):
    s = html.escape(s, quote=False)
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    s = re.sub(r'(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])', r'<em class="term">\1</em>', s)
    def xr(m):
        n = m.group(1)
        if n not in refs:
            raise ValueError('unknown cross-reference [[%s]]' % n)
        return '<button type="button" class="arx" data-artgo="%s">%s</button>' % (refs[n], n)
    return re.sub(r'\[\[([\d.]+)\]\]', xr, s)


def plain(s):
    s = re.sub(r'\[\[[\d.]+\]\]', '', s)
    return re.sub(r'\s+', ' ', s.replace('**', '').replace('*', '')).strip()


def fig_cite(name):
    m = re.match(r'([dl])(\d+)-(\d+)', name)
    return '%s, fig. %s.%s' % (BOOK[m.group(1)], m.group(2), m.group(3)) if m else ''


def compile_one(tid, text):
    lines = text.split('\n')
    # pass 1: numbering and cross-reference table
    refs, c, s, b = {}, 0, 0, 0
    for ln in lines:
        if ln.startswith('### '):
            b += 1; refs['%d.%d.%d' % (c, s, b)] = 'a-b%d-%d-%d' % (c, s, b)
        elif ln.startswith('## '):
            s += 1; b = 0; refs['%d.%d' % (c, s)] = 'a-s%d-%d' % (c, s)
        elif ln.startswith('# '):
            c += 1; s = 0; b = 0; refs[str(c)] = 'a-c%d' % c
    out, meta = [], {'stand': '', 'ch': [], 'figs': [], 'fx': []}
    here = {'c': '', 's': ''}
    where = lambda: ' › '.join(x for x in (here['c'], here['s']) if x)
    c = s = b = 0
    open_sec = open_br = False
    para, lst, olst = [], [], []
    box = None  # (kind, title, rows)
    fign = 0
    words = 0

    def flush():
        nonlocal para, lst, olst, words
        if para:
            t = ' '.join(para); words += len(t.split())
            out.append('<p>%s</p>' % inline(t, refs)); para = []
        def li(x):
            # sub-items: ('-', text) bullet, ('1', text) numbered, ('p', text) plain note
            sub, run = '', []
            def emit(run):
                if not run: return ''
                k = run[0][0]
                if k == 'p': return ''.join('<p class="arli2p">%s</p>' % inline(t, refs) for _, t in run)
                tag = 'ol' if k == '1' else 'ul'
                return '<%s class="arli2%s">%s</%s>' % (tag, ' n' if k == '1' else '', ''.join('<li>%s</li>' % inline(t, refs) for _, t in run), tag)
            for it in x[1]:
                if run and run[-1][0] != it[0]: sub += emit(run); run = []
                run.append(it)
            sub += emit(run)
            return '<li>%s%s</li>' % (inline(x[0], refs), sub)
        if lst:
            words += sum(len((x[0] + ' ' + ' '.join(t for _, t in x[1])).split()) for x in lst)
            out.append('<ul class="arl">%s</ul>' % ''.join(li(x) for x in lst)); lst = []
        if olst:
            words += sum(len((x[0] + ' ' + ' '.join(t for _, t in x[1])).split()) for x in olst)
            out.append('<ol class="arol">%s</ol>' % ''.join(li(x) for x in olst)); olst = []

    def close_br():
        nonlocal open_br
        flush()
        if open_br: out.append('</div>'); open_br = False

    def close_sec():
        nonlocal open_sec
        close_br()
        if open_sec: out.append('</div></details>'); open_sec = False

    def render_box(kind, title, rows):
        nonlocal words
        if kind == 'table':
            cells = [[x.strip() for x in r.split('|')] for r in rows if r.strip()]
            h = '<div class="artw"><table class="artb">%s<thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>' % (
                '<caption>%s</caption>' % inline(title, refs) if title else '',
                ''.join('<th scope="col">%s</th>' % inline(x, refs) for x in cells[0]),
                ''.join('<tr>%s</tr>' % ''.join(('<th scope="row">%s</th>' if i == 0 and cells[0][0] == '' else '<td>%s</td>') % inline(x, refs) for i, x in enumerate(r)) for r in cells[1:]))
            words += sum(len(' '.join(r).split()) for r in cells)
            return h
        if kind == 'tree':
            items = []
            for r in rows:
                if not r.strip(): continue
                p = [x.strip() for x in r.split('|')] + ['', '']
                items.append('<li>%s<b>%s</b> <span>%s</span></li>' % ('<span class="k">%s</span>' % inline(p[0], refs) if p[0] else '', inline(p[1], refs), inline(p[2], refs)))
            return '<div class="artree"><span class="root">%s</span><ul>%s</ul></div>' % (inline(title or '', refs), ''.join(items))
        if kind == 'ladder':
            items = []
            for i, r in enumerate([r for r in rows if r.strip()]):
                p = [x.strip() for x in r.split('|')] + ['']
                items.append('<li><span class="dot">%d</span><div><b>%s</b><span>%s</span></div></li>' % (i + 1, inline(p[0], refs), inline(p[1], refs)))
            n = len(items)
            return '<ol class="arlad" style="--n:%d">%s</ol>' % (n, ''.join(items))
        if kind == 'differ':
            cols, note = [], []
            for r in rows:
                m = re.match(r'(Dhingra|Lee|K\.J\. Lee|[A-Z][\w .-]{1,24}):\s+(.*)', r)
                if m and len(cols) < 3 and not note:
                    cols.append('<div><b>%s</b>%s</div>' % (html.escape(m.group(1)), inline(m.group(2), refs)))
                elif r.strip():
                    note.append(r.strip())
            words += len(' '.join(rows).split())
            return '<div class="arbox k-differ"><h5>%s</h5><div class="cols">%s</div>%s</div>' % (
                BOXES['differ'] + (' · ' + html.escape(title) if title else ''), ''.join(cols), '<p>%s</p>' % inline(' '.join(note), refs) if note else '')
        # prose boxes
        body, ps, ls, ol = [], [], [], []
        def fl():
            nonlocal ps, ls, ol
            if ps: body.append('<p>%s</p>' % inline(' '.join(ps), refs)); ps = []
            if ls: body.append('<ul>%s</ul>' % ''.join('<li>%s</li>' % inline(x, refs) for x in ls)); ls = []
            if ol: body.append('<ol>%s</ol>' % ''.join('<li>%s</li>' % inline(x, refs) for x in ol)); ol = []
        for r in rows:
            if r.startswith('- '): (fl() if ps or ol else None); ls.append(r[2:])
            elif re.match(r'\d+\.\s', r): (fl() if ps or ls else None); ol.append(re.sub(r'^\d+\.\s+', '', r))
            elif not r.strip(): fl()
            else: (fl() if ls or ol else None); ps.append(r.strip())
        fl()
        words += len(' '.join(rows).split())
        return '<div class="arbox k-%s"><h5>%s</h5>%s</div>' % (kind, html.escape(title or BOXES.get(kind, '')), ''.join(body))

    for raw in lines + ['']:
        ln = raw.rstrip()
        if box is not None:
            if ln.strip() == '!!':
                flush(); out.append(render_box(*box)); box = None
            else:
                box[2].append(ln.strip())
            continue
        if ln.startswith('@stand '):
            meta['stand'] = ln[7:].strip(); words += len(meta['stand'].split()); continue
        if ln.startswith('# '):
            close_sec()
            if c: out.append('</section>')
            c += 1; s = b = 0
            t, _, intro = ln[2:].partition('|')
            meta['ch'].append(t.strip()); here['c'] = t.strip(); here['s'] = ''
            out.append('<section class="arch-c" id="a-c%d" data-t="%s"><div class="archd"><span class="arnum">%d</span><div class="arkick">Chapter %s</div><h2>%s</h2></div>%s' % (
                c, html.escape(t.strip()), c, WORDS[c - 1] if c <= len(WORDS) else c, inline(t.strip(), refs),
                '<p class="arintro">%s</p>' % inline(intro.strip(), refs) if intro.strip() else ''))
            continue
        if ln.startswith('## '):
            close_sec(); s += 1; b = 0; here['s'] = plain(ln[3:].strip())
            out.append('<details class="arsub" id="a-s%d-%d" open><summary><span class="arsn">%d.%d</span><h3>%s</h3>%s</summary><div class="arbody">' % (
                c, s, c, s, inline(ln[3:].strip(), refs), CHEV))
            open_sec = True; continue
        if ln.startswith('### '):
            close_br(); b += 1
            out.append('<div class="arbr" id="a-b%d-%d-%d"><h4><i>%d.%d.%d</i>%s</h4>' % (c, s, b, c, s, b, inline(ln[4:].strip(), refs)))
            open_br = True; continue
        if ln.strip() == '!/':  # end the current branch, continue in the section body
            close_br(); continue
        if ln.startswith('!fig '):
            flush()
            spec, _, cap = ln[5:].partition('|')
            names = spec.split()
            for n in names:
                if not os.path.exists(os.path.join(FIGDIR, n + '.jpg')):
                    raise FileNotFoundError('%s: figure %s missing' % (tid, n))
            fign += 1
            cites = sorted({fig_cite(n).split(', fig. ')[1] for n in names})
            book = BOOK[names[0][0]]
            cite = '%s, fig%s %s' % (book, 's' if len(cites) > 1 else '.', ' and '.join(cites))
            meta['figs'] += names
            imgs = ''.join('<button type="button" class="arimg" data-arfig="%s" aria-label="Enlarge figure %d"><img src="clinic/fig/%s.jpg" alt="" loading="lazy" decoding="async"></button>' % (n, fign, n) for n in names)
            meta['fx'].append({'n': fign, 'f': names, 't': plain(cap.strip()), 'w': where(), 'c': cite})
            out.append('<figure class="arfig" id="a-f%d"><div class="%s">%s</div><figcaption><b>Figure %d</b>%s<cite>%s</cite></figcaption></figure>' % (
                fign, 'pair' if len(names) > 1 else 'one', imgs, fign, inline(cap.strip(), refs), html.escape(cite)))
            words += len(cap.split())
            continue
        if ln.startswith('!anat '):
            flush()
            spec, _, cap = ln[6:].partition('|')
            keys = spec.split()
            for k in keys:
                if k not in app_fig_keys():
                    raise KeyError('%s: app figure %s not found' % (tid, k))
            fign += 1
            imgs = ''.join('<button type="button" class="arimg" data-fig="%s" data-set="%s" aria-label="Enlarge figure %d"><img src="fig2/t/%s.jpg" alt="" loading="lazy" decoding="async"></button>' % (k, ','.join(keys), fign, k) for k in keys)
            meta['fx'].append({'n': fign, 'k': keys, 't': plain(cap.strip()), 'w': where(), 'c': 'Anatomy atlas'})
            out.append('<figure class="arfig arapp" id="a-f%d"><div class="%s">%s</div><figcaption><b>Figure %d</b>%s<cite data-figcite="%s">From the anatomy atlas</cite></figcaption></figure>' % (
                fign, 'pair' if len(keys) > 1 else 'one', imgs, fign, inline(cap.strip(), refs), ','.join(keys)))
            words += len(cap.split())
            continue
        if ln.startswith('!ops'):
            close_br()
            spec, _, lead = ln[4:].partition('|')
            out.append('<div class="arops" data-arops="%s" data-lead="%s"></div>' % (html.escape(' '.join(spec.split())), html.escape(lead.strip())))
            continue
        if ln.startswith('!imaging'):
            flush()
            spec, _, lead = ln[8:].partition('|')
            out.append('<div class="arcases" data-arcases="%s" data-lead="%s"></div>' % (html.escape(' '.join(spec.split())), html.escape(lead.strip())))
            continue
        m = re.match(r'!(\w+)\s*(.*)', ln)
        if m and m.group(1) in ('pearl', 'flag', 'exam', 'update', 'note', 'ward', 'pit', 'differ', 'table', 'tree', 'ladder'):
            flush(); box = (m.group(1), m.group(2).strip(), []); continue
        m = re.match(r'\s{2,}(?:(- )|(\d+\.\s+))?(\S.*)', ln)
        if m and (lst or olst):
            (lst or olst)[-1][1].append(('-' if m.group(1) else '1' if m.group(2) else 'p', m.group(3).strip())); continue
        if ln.startswith('- '):
            if para or olst: flush()
            lst.append([ln[2:].strip(), []]); continue
        m = re.match(r'\d+\.\s+(.*)', ln)
        if m:
            if para or lst: flush()
            olst.append([m.group(1).strip(), []]); continue
        if not ln.strip():
            flush(); continue
        if lst or olst: flush()
        para.append(ln.strip())
    close_sec()
    if c: out.append('</section>')
    meta['w'] = len(re.sub(r'<[^>]+>', ' ', ''.join(out)).split())
    meta['n'] = sum(1 for k in refs if k.count('.') == 1)
    return ''.join(out), meta


def main():
    os.makedirs(OUT, exist_ok=True)
    ids, idx, figs = [], {}, []
    for f in sorted(os.listdir(SRC)):
        if not f.endswith('.txt'): continue
        tid = f[:-4]
        h, meta = compile_one(tid, open(os.path.join(SRC, f), encoding='utf-8').read())
        rec = {'h': h, 'stand': meta['stand'], 'ch': meta['ch'], 'w': meta['w'], 'n': meta['n']}
        with open(os.path.join(OUT, tid + '.js'), 'w', encoding='utf-8') as o:
            o.write('(window.CLART=window.CLART||{})[%s]=%s;\n' % (json.dumps(tid), json.dumps(rec, ensure_ascii=False)))
        idx[tid] = {'w': meta['w'], 'n': meta['n'], 'c': len(meta['ch']), 'f': len(meta['figs'])}
        ids.append(tid)
        for x in meta['fx']:
            x['a'] = tid; figs.append(x)
        print('%-10s %5d words  %2d chapters  %2d sections  %2d figures' % (tid, meta['w'], len(meta['ch']), meta['n'], len(meta['figs'])))
    with open(os.path.join(OUT, 'index.js'), 'w') as o:
        o.write('window.CLART_IDX=%s;\n' % json.dumps(idx))
    # every figure in every article, for the app-wide search
    with open(os.path.join(OUT, 'figs.js'), 'w', encoding='utf-8') as o:
        o.write('window.CLART_FIGS=%s;\n' % json.dumps(figs, ensure_ascii=False, separators=(',', ':')))
    print(len(figs), 'figures indexed for search')
    print(len(ids), 'articles')
    build_hub()
    update_sw(ids)


def hub_files():
    """Practice hub scripts in load order: core, topic list, question banks, then the hub itself."""
    d = os.path.join(WWW, 'hub')
    banks = sorted(f for f in os.listdir(d) if f.startswith('qbank-') and f.endswith('.js'))
    return ['hub/qcore.js', 'hub/topics.js'] + ['hub/' + f for f in banks], ['hub/hub.js', 'hub/hub.css']


def build_hub():
    """Write hub/topics.js (id -> [group, title], in library order) and wire the hub scripts into index.html."""
    s = open(os.path.join(WWW, 'clinic', 'data.js'), encoding='utf-8').read()
    D = json.loads(s[len('window.CLINIC_DATA='):].rstrip().rstrip(';'))
    qt = {t['id']: [t['g'], t['t']] for t in D['t']}
    with open(os.path.join(WWW, 'hub', 'topics.js'), 'w', encoding='utf-8') as o:
        o.write('window.QT=%s;\n' % json.dumps(qt, ensure_ascii=False, separators=(',', ':')))
    pre, post = hub_files()
    p = os.path.join(WWW, 'index.html'); h = open(p, encoding='utf-8').read()
    h = re.sub(r'<script src="hub/[^"]+"></script>\n?|<link rel="stylesheet" href="hub/[^"]+">\n?', '', h)
    tags = ''.join('<script src="%s"></script>\n' % f for f in pre)
    h = h.replace('<script src="xsearch.js"></script>\n', tags + '<script src="xsearch.js"></script>\n<link rel="stylesheet" href="hub/hub.css">\n<script src="hub/hub.js"></script>\n', 1)
    open(p, 'w', encoding='utf-8').write(h)


def update_sw(ids):
    """Precache the articles in the web build and bump the offline cache version."""
    import hashlib
    sw = os.path.join(ROOT, 'web', 'sw.js')
    s = open(sw, encoding='utf-8').read()
    s = re.sub(r'"clinic/art/[^"]+",', '', s)
    add = ''.join('"clinic/art/%s.js",' % i for i in ['index', 'figs'] + ids)
    # book figures used by the articles go into the offline media cache too
    s = re.sub(r'"clinic/fig/[^"]+",', '', s)
    add += ''.join('"clinic/fig/%s",' % f for f in sorted(os.listdir(FIGDIR)) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')))
    s = s.replace('"clinic/links.js",', '"clinic/links.js",' + add, 1)
    pre, post = hub_files()
    s = re.sub(r'"hub/[^"]+",', '', s)
    s = s.replace('"xsearch.js",', '"xsearch.js",' + ''.join('"%s",' % f for f in pre + post), 1)
    h = hashlib.md5()
    for f in ['index.html', 'xsearch.js', 'clinic/clinic.js', 'clinic/clinic.css', 'clinic/data.js', 'theatre/theatre.js', 'theatre/theatre.css'] + sum(hub_files(), []) + ['clinic/art/%s.js' % i for i in ['index', 'figs'] + ids]:
        h.update(open(os.path.join(WWW, f), 'rb').read())
    s = re.sub(r'const CACHE="ent-atlas-[0-9a-f]+"', 'const CACHE="ent-atlas-%s"' % h.hexdigest()[:10], s)
    if 'clinic\\/fig' not in s:
        s = s.replace('/\\/(theatre\\/c|fig2\\/m|fig2\\/t\\/m)\\//', '/\\/(theatre\\/c|fig2\\/m|fig2\\/t\\/m|clinic\\/fig)\\//')
    open(sw, 'w', encoding='utf-8').write(s)


if __name__ == '__main__':
    main()
