#!/usr/bin/env python3
"""Accuracy and layout check for the mind maps (content/maps/*.json).

  1. Coverage: every article that has a summary board is a branch of exactly one map.
  2. Shape: 3–8 topics a map, 2–6 headings a topic, 1–6 facts a heading, short keyword-style text,
     known colours and icons, one colour per topic, links between topics of the same map.
  3. Numbers: every number on a branch appears in that branch's article (as for the boards).
  4. Abbreviations: every abbreviation on the map is defined in its "abbr" list (roman numerals excepted).
  5. Layout (needs Playwright + Chrome; skip with --no-layout): the map is drawn fully open on a wide and a
     phone screen and no two words may overlap.
Usage: python3 tools/check_maps.py [map ids] [--no-layout]
"""
import os, re, sys, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
from check_boards import nums
SRC = os.path.join(ROOT, 'content', 'maps')
WWW = os.path.join(ROOT, 'app', 'src', 'main', 'assets', 'www')
PAL = {'blue', 'orange', 'green', 'red', 'purple', 'teal', 'pink', 'brown'}
SECS = {'ear', 'nose', 'mouth', 'larynx', 'neck'}
ROMAN = set('I II III IV V VI VII VIII IX X XI XII IVA IVB IVC IA IB IIA IIB IIIA IIIB'.split())
LIM = {'name': 22, 'head': 20, 'fact': 46, 'hub': 26, 'hubs': 34, 'link': 26}
icons = set(re.findall(r'^ (\w+):\'', open(os.path.join(ROOT, 'tools', 'maps', 'map.js'), encoding='utf-8').read(), re.M)) | {'earsection'}


def words(m):
    yield 'hub', m['hub']['t'] + ' ' + m['hub'].get('s', '')
    for b in m['branches']:
        yield b['id'], b['name']
        for k, fs in b['subs']:
            yield b['id'], k
            for f in fs:
                yield b['id'], f
    for a, b, t in m.get('links', []):
        yield a, t


def check(m, fn):
    err = []
    E = err.append
    if m.get('id') + '.json' != fn: E('id does not match file name')
    if m.get('sec') not in SECS: E('sec must be one of ' + ', '.join(sorted(SECS)))
    h = m.get('hub', {})
    if h.get('icon') not in icons: E('hub icon unknown: %s' % h.get('icon'))
    if len(h.get('t', '')) > LIM['hub'] or len(h.get('s', '')) > LIM['hubs']: E('hub text too long')
    bs = m.get('branches', [])
    if not 3 <= len(bs) <= 8: E('needs 3-8 topics, has %d' % len(bs))
    cols = [b.get('c') for b in bs]
    if len(set(cols)) != len(cols): E('colours repeat: ' + ' '.join(cols))
    for b in bs:
        bid = b.get('id')
        if not os.path.exists(os.path.join(ROOT, 'content', 'clinic', '%s.txt' % bid)): E('%s: no such article' % bid); continue
        if b.get('c') not in PAL: E('%s: colour %s not in palette' % (bid, b.get('c')))
        if b.get('icon') not in icons: E('%s: icon %s unknown' % (bid, b.get('icon')))
        if len(b.get('name', '')) > LIM['name']: E('%s: topic name over %d chars' % (bid, LIM['name']))
        subs = b.get('subs', [])
        if not 2 <= len(subs) <= 6: E('%s: needs 2-6 headings, has %d' % (bid, len(subs)))
        for k, fs in subs:
            if len(k) > LIM['head']: E('%s: heading "%s" over %d chars' % (bid, k, LIM['head']))
            if not 1 <= len(fs) <= 6: E('%s: "%s" needs 1-6 facts' % (bid, k))
            for f in fs:
                if len(f) > LIM['fact']: E('%s: fact over %d chars: "%s"' % (bid, LIM['fact'], f))
    ids = {b['id'] for b in bs}
    for l in m.get('links', []):
        if len(l) != 3 or l[0] not in ids or l[1] not in ids or l[0] == l[1]: E('bad link %s' % l)
        elif len(l[2]) > LIM['link']: E('link label too long: %s' % l[2])
    # numbers: each branch against its own article; hub against all of the map's articles
    arts = {b['id']: open(os.path.join(ROOT, 'content', 'clinic', b['id'] + '.txt'), encoding='utf-8').read() for b in bs if os.path.exists(os.path.join(ROOT, 'content', 'clinic', b['id'] + '.txt'))}
    allnum = set().union(*[nums(a) for a in arts.values()]) if arts else set()
    for who, t in words(m):
        pool = nums(arts[who]) if who in arts else allnum
        miss = sorted(nums(t) - pool - {'0'}, key=float)
        if miss: E('%s: NOT IN ARTICLE %s  ("%s")' % (who, ' '.join(miss), t))
    # abbreviations
    defined = set()
    for k in m.get('abbr', {}):
        defined |= {x.strip() for x in k.split(',')}
    used = set()
    for who, t in words(m):
        used |= set(re.findall(r'\b[A-Za-z0-9]*[A-Z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*\b', t))
    miss = sorted(u for u in used - defined - ROMAN if not re.fullmatch(r'[IVX]+[A-C]?', u) and not re.fullmatch(r"(Mac|Mc|Di|De|La|Le|Van)[A-Z][a-z]+", u))
    if miss: E('abbreviations not defined: ' + ' '.join(miss))
    unused = sorted(k for k in defined if k not in used and k not in ROMAN and not any(k in t for _, t in words(m)))
    if unused: E('defined but not used: ' + ' '.join(unused))
    return err


def layout(ids):
    """Draw each built map fully open, wide and on a phone, and report overlapping words."""
    import threading, functools, http.server
    from playwright.sync_api import sync_playwright
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    H = functools.partial(Q, directory=WWW)
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    port = srv.server_address[1]
    JS = '''() => {const E=window.MAPENGINE;E.open=new Set(window.MAP.branches.map(b=>b.id));E.layout();
     const T=[...document.querySelectorAll('#world text')].filter(t=>t.textContent.trim()&&!t.closest('.ico')).map(t=>{const b=t.getBBox();return{x:b.x,y:b.y,w:b.width,h:b.height,s:t.textContent}});
     const out=[];for(let i=0;i<T.length;i++)for(let j=i+1;j<T.length;j++){const a=T[i],b=T[j];
      const ox=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),oy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
      if(ox>2&&oy>4)out.push(a.s+'  ×  '+b.s)}
     return out}'''
    bad = 0
    try:
        exe = '/usr/bin/google-chrome' if os.path.exists('/usr/bin/google-chrome') else None
        with sync_playwright() as p:
            br = p.chromium.launch(executable_path=exe) if exe else p.chromium.launch()
            for mid in ids:
                res = []
                for w, h in ((1600, 1000), (390, 844)):
                    pg = br.new_page(viewport={'width': w, 'height': h})
                    errs = []
                    pg.on('pageerror', lambda e: errs.append(str(e)))
                    pg.goto('http://127.0.0.1:%d/clinic/map/%s.html' % (port, mid))
                    pg.wait_for_function('window.MAPENGINE&&document.fonts.status==="loaded"')
                    pg.wait_for_timeout(300)
                    ov = pg.evaluate(JS)
                    res += ['%s: %s' % ('wide' if w > 900 else 'phone', o) for o in ov] + ['script error: ' + e for e in errs]
                    pg.close()
                print('%-18s layout %s' % (mid, 'ok' if not res else 'FAIL\n    ' + '\n    '.join(res[:12])))
                bad += bool(res)
            br.close()
    finally:
        srv.shutdown()
    return bad


def main(argv):
    want = [a for a in argv if not a.startswith('--')]
    files = sorted(f for f in os.listdir(SRC) if f.endswith('.json'))
    seen, bad = {}, 0
    for f in files:
        m = json.load(open(os.path.join(SRC, f), encoding='utf-8'))
        for b in m.get('branches', []):
            seen.setdefault(b.get('id'), []).append(m.get('id'))
        if want and m.get('id') not in want: continue
        e = check(m, f)
        print('%-18s %s' % (m.get('id'), 'ok' if not e else 'FAIL\n    ' + '\n    '.join(e)))
        bad += bool(e)
    if not want:
        boards = {f[:-5] for f in os.listdir(os.path.join(ROOT, 'content', 'boards')) if f.endswith('.html')}
        missing = sorted(boards - set(seen))
        twice = sorted(k for k, v in seen.items() if len(v) > 1)
        if missing: print('coverage: articles on no map (%d): %s' % (len(missing), ' '.join(missing)))
        if twice: print('coverage: articles on more than one map: ' + ' '.join(twice)); bad += 1
        if missing: bad += 1
        if not missing and not twice: print('coverage: all %d articles on exactly one map' % len(boards))
    if '--no-layout' not in argv:
        ids = want or [f[:-5] for f in files]
        bad += layout(ids)
    return bad


if __name__ == '__main__':
    sys.exit(1 if main(sys.argv[1:]) else 0)
