#!/usr/bin/env python3
"""Accuracy and layout check for the route maps (content/maps/*.json; schema in tools/maps/ROUTE.md).

  1. Coverage: every article that has a summary board is on exactly one map, and every article listed on a
     map has at least one card.
  2. Shape: zones, stations, lines, segment labels, cards and checkpoints are well formed and short enough.
  3. Numbers: every number on a card or checkpoint appears in that card's own article; numbers anywhere else
     (stations, segment labels, the subtitle, How to ride) appear in one of the map's articles.
  4. Abbreviations: every abbreviation is defined in "abbr", and every definition is used.
  5. Layout (needs Playwright + Chrome; skip with --no-layout): the A3 poster fits its page, no card text is
     clipped, no label on the route strip collides with another label, a line or a station, every card is
     joined to its station, and the phone list of stops has no sideways scroll or script error.
Usage: python3 tools/check_maps.py [map ids] [--no-layout]
"""
import os, re, sys, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
from check_boards import nums
SRC = os.path.join(ROOT, 'content', 'maps')
WWW = os.path.join(ROOT, 'app', 'src', 'main', 'assets', 'www')
PAL = {'blue', 'orange', 'green', 'red', 'purple', 'teal', 'pink', 'brown', 'grey'}
SECS = {'ear', 'nose', 'mouth', 'larynx', 'neck'}
ROMAN = set('I II III IV V VI VII VIII IX X XI XII IVA IVB IVC IA IB IIA IIB IIIA IIIB'.split())
LIM = {'sub': 130, 'st': 18, 'seg': 24, 'line': 26, 'zone': 24, 't': 34, 'tag': 14, 'why': 230, 'item': 64,
       'warn': 120, 'q': 80, 'o': 44, 'ride': 120}


def card_text(c):
    return [c.get('t', ''), c.get('tag', ''), c.get('why', ''), c.get('warn', '')] + c.get('see', []) + c.get('do', [])


def all_text(m):
    """(owner article or None, text) for every string printed on the map."""
    yield None, m.get('title', '')
    yield None, m.get('sub', '')
    for z in m.get('zones', []):
        yield None, z[0]
    for s in m.get('st', {}).values():
        yield None, s.get('t', '')
    for l in m.get('lines', []):
        yield None, l.get('name', '')
    for sg in m.get('segs', []):
        yield None, sg[2]
    for c in m.get('cards', []):
        for t in card_text(c):
            yield c.get('art'), t
    for t in (m.get('ride') or {}).get('text', []):
        yield None, t
    for q in (m.get('checks') or {}).get('q', []):
        for t in [q.get('q', '')] + q.get('o', []):
            yield q.get('art'), t


def check(m, fn):
    err = []
    E = err.append
    if m.get('id') + '.json' != fn: E('id does not match file name')
    if m.get('sec') not in SECS: E('sec must be one of ' + ', '.join(sorted(SECS)))
    if len(m.get('sub', '')) > LIM['sub']: E('subtitle over %d chars' % LIM['sub'])
    br = [b.get('id') for b in m.get('branches', [])]
    if not 3 <= len(br) <= 8: E('needs 3-8 articles in "branches", has %d' % len(br))
    for b in br:
        if not os.path.exists(os.path.join(ROOT, 'content', 'clinic', '%s.txt' % b)): E('%s: no such article' % b)
    zs = m.get('zones', [])
    if not 3 <= len(zs) <= 6: E('needs 3-6 zones, has %d' % len(zs))
    if abs(sum(z[1] for z in zs) - 400) > .01: E('zone widths must add up to 400, they add up to %g' % sum(z[1] for z in zs))
    for z in zs:
        if len(z[0]) > LIM['zone']: E('zone name too long: %s' % z[0])
    st = m.get('st', {})
    if not 5 <= len(st) <= 26: E('needs 5-26 stations, has %d' % len(st))
    for k, s in st.items():
        if not (4 <= s.get('x', -1) <= 396 and 3 <= s.get('y', -1) <= 60): E('station %s: x must be 4-396, y 3-60' % k)
        if len(s.get('t', '')) > LIM['st']: E('station %s: name over %d chars' % (k, LIM['st']))
        if s.get('lab', 'a') not in ('a', 'b', 'l', 'r'): E('station %s: lab must be a, b, l or r' % k)
    on_line = set()
    lines = m.get('lines', [])
    if len(lines) < 2: E('needs at least 2 lines')
    for i, l in enumerate(lines):
        if l.get('c') not in PAL: E('line %d: colour %s not in palette' % (i, l.get('c')))
        if len(l.get('name', '')) > LIM['line']: E('line %d: name too long' % i)
        stops = l.get('stops', [])
        if len([x for x in stops if not x.startswith('@')]) < 2: E('line %d: needs 2+ stations' % i)
        for x in stops:
            if x.startswith('@'):
                if not re.fullmatch(r'@-?\d+(\.\d+)?,-?\d+(\.\d+)?', x): E('line %d: bad bend point %s' % (i, x))
            elif x not in st: E('line %d: unknown station %s' % (i, x))
            else: on_line.add(x)
    if not any(l.get('name') for l in lines): E('no line has a name for the legend')
    for k in st:
        if k not in on_line: E('station %s is on no line' % k)
    for sg in m.get('segs', []):
        if len(sg) not in (3, 5): E('segment label must be [from, to, text] or [from, to, text, dx, dy]: %s' % sg); continue
        a, b = sg[0], sg[1]
        ok = any(a in [x for x in l['stops'] if not x.startswith('@')] and b in [x for x in l['stops'] if not x.startswith('@')]
                 and [x for x in l['stops'] if not x.startswith('@')].index(b) == [x for x in l['stops'] if not x.startswith('@')].index(a) + 1 for l in lines)
        if not ok: E('segment label %s → %s: not consecutive stations on any line' % (a, b))
        if len(sg[2]) > LIM['seg']: E('segment label too long: %s' % sg[2])
    cards = m.get('cards', [])
    if not 6 <= len(cards) <= 20: E('needs 6-20 cards, has %d' % len(cards))
    used = set()
    for i, c in enumerate(cards):
        who = 'card %d (%s)' % (i, c.get('t', '?'))
        if c.get('st') not in st: E('%s: unknown station %s' % (who, c.get('st')))
        if c.get('art') not in br: E('%s: article %s not in branches' % (who, c.get('art')))
        used.add(c.get('art'))
        if c.get('c') not in PAL: E('%s: colour %s not in palette' % (who, c.get('c')))
        if c.get('row') not in ('top', 'bottom'): E('%s: row must be top or bottom' % who)
        if not isinstance(c.get('zone'), int) or not 0 <= c['zone'] < len(zs): E('%s: zone must be 0-%d' % (who, len(zs) - 1))
        if len(c.get('t', '')) > LIM['t']: E('%s: title over %d chars' % (who, LIM['t']))
        if len(c.get('tag', '')) > LIM['tag']: E('%s: tag over %d chars' % (who, LIM['tag']))
        if len(c.get('why', '')) > LIM['why']: E('%s: why over %d chars' % (who, LIM['why']))
        if len(c.get('warn', '')) > LIM['warn']: E('%s: warn over %d chars' % (who, LIM['warn']))
        if not (c.get('see') or c.get('do') or c.get('why')): E('%s: empty card' % who)
        for k in ('see', 'do'):
            if len(c.get(k, [])) > 6: E('%s: more than 6 "%s" items' % (who, k))
            for x in c.get(k, []):
                if len(x) > LIM['item']: E('%s: item over %d chars: "%s"' % (who, LIM['item'], x))
    for b in br:
        if b not in used: E('article %s has no card' % b)
    for k, v in (m.get('cells') or {}).items():
        if not re.fullmatch(r'(top|bottom)-\d', k) or int(k[-1]) >= len(zs) or v != 'stack': E('bad cell %s: %s' % (k, v))
    for k in ('ride', 'checks'):
        x = m.get(k)
        if x and (x.get('row') not in ('top', 'bottom') or not 0 <= x.get('zone', -1) < len(zs)): E('%s: bad row/zone' % k)
    for t in (m.get('ride') or {}).get('text', []):
        if len(t) > LIM['ride']: E('ride text too long: %s' % t)
    qs = (m.get('checks') or {}).get('q', [])
    if m.get('checks') and not 2 <= len(qs) <= 5: E('needs 2-5 checkpoints')
    for q in qs:
        if q.get('art') not in br: E('checkpoint "%s": article %s not in branches' % (q.get('q'), q.get('art')))
        if len(q.get('q', '')) > LIM['q']: E('checkpoint too long: %s' % q.get('q'))
        if not 2 <= len(q.get('o', [])) <= 4 or not 0 <= q.get('a', -1) < len(q.get('o', [])): E('checkpoint "%s": needs 2-4 options and a valid answer' % q.get('q'))
        for o in q.get('o', []):
            if len(o) > LIM['o']: E('checkpoint option too long: %s' % o)
    # numbers
    arts = {b: open(os.path.join(ROOT, 'content', 'clinic', b + '.txt'), encoding='utf-8').read() for b in br
            if os.path.exists(os.path.join(ROOT, 'content', 'clinic', b + '.txt'))}
    allnum = set().union(*[nums(a) for a in arts.values()]) if arts else set()
    for who, t in all_text(m):
        pool = nums(arts[who]) if who in arts else allnum
        miss = sorted(nums(t) - pool - {'0'}, key=float)
        if miss: E('%s: NOT IN ARTICLE %s  ("%s")' % (who or 'map', ' '.join(miss), t))
    # abbreviations
    defined = set()
    for k in m.get('abbr', {}):
        defined |= {x.strip() for x in k.split(',')}
    texts = [t for _, t in all_text(m)]
    usedab = set()
    for t in texts:
        usedab |= set(re.findall(r'\b[A-Za-z0-9]*[A-Z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*\b', t))
    miss = sorted(u for u in usedab - defined - ROMAN if not re.fullmatch(r'[IVX]+[A-C]?', u) and not re.fullmatch(r"(Mac|Mc|Di|De|La|Le|Van)[A-Z][a-z]+", u))
    if miss: E('abbreviations not defined: ' + ' '.join(miss))
    unused = sorted(k for k in defined if k not in usedab and k not in ROMAN and not any(re.search(r'(?<![A-Za-z])%s(?![A-Za-z])' % re.escape(k), t) for t in texts))
    if unused: E('defined but not used: ' + ' '.join(unused))
    return err


POSTER = r'''() => {
 const out=[], page=document.getElementById('page'), P=page.getBoundingClientRect();
 const foot=page.querySelector('.pfoot').getBoundingClientRect();
 if(page.scrollHeight>page.clientHeight+1) out.push('poster: content taller than the A3 page');
 page.querySelectorAll('.prow').forEach(r=>{const b=r.getBoundingClientRect();
   [...r.querySelectorAll('.card')].forEach(c=>{const q=c.getBoundingClientRect();
     if(q.bottom>foot.top-2) out.push('poster: card runs into the footer or off the page: '+(c.querySelector('h3')||c).textContent.slice(0,40));})});
 page.querySelectorAll('.card, .card h3, .card li, .card p').forEach(e=>{if(e.scrollWidth>e.clientWidth+1) out.push('poster: text cut at the side: '+e.textContent.slice(0,50))});
 page.querySelectorAll('.prow .cell').forEach(c=>{if(c.scrollWidth>c.clientWidth+2) out.push('poster: cards too wide for their zone: '+c.textContent.slice(0,40))});
 const svg=document.getElementById('strip'), T=[...svg.querySelectorAll('text')].map(t=>{const b=t.getBBox();return{x:b.x,y:b.y,w:b.width,h:b.height,s:t.textContent,cls:t.getAttribute('class')}});
 for(const a of T){ if(a.x<-.5||a.x+a.w>400.5||a.y<-.5||a.y+a.h>66.5) out.push('strip: label outside the strip: '+a.s); }
 for(let i=0;i<T.length;i++)for(let j=i+1;j<T.length;j++){const a=T[i],b=T[j];
   const ox=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),oy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
   if(ox>.3&&oy>.5) out.push('strip: labels overlap: "'+a.s+'" × "'+b.s+'"');}
 const inside=(t,x,y,pad)=>x>t.x+pad&&x<t.x+t.w-pad&&y>t.y+pad+.35&&y<t.y+t.h-pad-.35;
 for(const l of window.ROUTE.LINES){const p=l.pts;const lw=(l.w||3)/2;
   for(let k=1;k<p.length;k++){const n=Math.ceil(Math.hypot(p[k][0]-p[k-1][0],p[k][1]-p[k-1][1])/.4);
     for(let s=0;s<=n;s++){const x=p[k-1][0]+(p[k][0]-p[k-1][0])*s/n,y=p[k-1][1]+(p[k][1]-p[k-1][1])*s/n;
       for(const t of T){if(t.cls==='zlab')continue; if(inside({x:t.x-lw*.6,y:t.y-lw*.6,w:t.w+lw*1.2,h:t.h+lw*1.2},x,y,.15)){out.push('strip: a line runs through the label "'+t.s+'"');t.cls='zlab';}}}}}
 for(const [id,s] of Object.entries(window.MAP.st)){const r=s.ix?3.1:2;
   for(const t of T){ if(t.cls==='zlab') continue; const cx=Math.max(t.x,Math.min(s.x,t.x+t.w)),cy=Math.max(t.y,Math.min(s.y,t.y+t.h));
     if(Math.hypot(cx-s.x,cy-s.y)<r-.2) out.push('strip: station '+id+' sits on the label "'+t.s+'"');}}
 const ids=Object.keys(window.MAP.st);
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const a=window.MAP.st[ids[i]],b=window.MAP.st[ids[j]];
   if(Math.hypot(a.x-b.x,a.y-b.y)<(a.ix?3.1:2)+(b.ix?3.1:2)+1) out.push('strip: stations too close: '+ids[i]+', '+ids[j]);}
 (window.ROUTE_DROPPED||[]).forEach(t=>out.push('poster: no clear path for the connector of card "'+t+'"'));
 const ov=document.getElementById('ov').getBoundingClientRect();
 document.querySelectorAll('#ov path').forEach(p=>{const b=p.getBoundingClientRect();if(b.left<P.left+12||b.right>P.right-12) out.push('poster: a connector runs into the page margin')});
 return out}'''


def layout(ids):
    """Render each built map: the A3 poster (print mode), the wide screen and the phone list."""
    import threading, functools, http.server
    from playwright.sync_api import sync_playwright
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=WWW))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    port = srv.server_address[1]
    bad = 0
    try:
        exe = '/usr/bin/google-chrome' if os.path.exists('/usr/bin/google-chrome') else None
        with sync_playwright() as p:
            br = p.chromium.launch(executable_path=exe) if exe else p.chromium.launch()
            for mid in ids:
                res = []
                for mode, (w, h) in (('print', (1588, 1123)), ('wide', (1440, 900)), ('phone', (390, 844))):
                    pg = br.new_page(viewport={'width': w, 'height': h})
                    errs = []
                    pg.on('pageerror', lambda e: errs.append(str(e)))
                    pg.on('console', lambda c: errs.append(c.text) if c.type == 'error' else None)
                    pg.goto('http://127.0.0.1:%d/clinic/map/%s.html%s' % (port, mid, '?print' if mode == 'print' else ''))
                    pg.wait_for_function('window.ROUTE_READY && document.fonts.status==="loaded"')
                    pg.wait_for_timeout(250)
                    if mode == 'print':
                        res += pg.evaluate(POSTER)
                    if mode == 'phone':
                        if pg.evaluate('document.scrollingElement.scrollWidth') > w + 1: res.append('phone: the list of stops scrolls sideways')
                        pg.click('[data-a="recall"]'); pg.wait_for_timeout(50)
                        if pg.evaluate('document.querySelectorAll("#stops .reveal").length') == 0: res.append('phone: recall shows no reveal buttons')
                        pg.click('[data-a="view"]'); pg.wait_for_timeout(100)
                    res += ['%s: script error: %s' % (mode, e) for e in errs]
                    pg.close()
                print('%-18s layout %s' % (mid, 'ok' if not res else 'FAIL\n    ' + '\n    '.join(res[:25])))
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
