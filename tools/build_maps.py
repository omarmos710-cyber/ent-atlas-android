#!/usr/bin/env python3
"""Build the mind maps of the Clinical library.

Each map is written by hand as JSON in content/maps/<map id>.json and joins several related articles as a
route map (schema: tools/maps/ROUTE.md): lines are the roads a disease takes, zones its depth or stage,
stations its stops, each with a note card tied to one article. This script renders every map with the engine
in tools/maps (route.js, route.css, route-template.html) into
app/src/main/assets/www/clinic/map/<map id>.html, writes the index page all.html, and writes
clinic/map/index.js: the article → map lookup, the list of maps and the full-screen viewer. It also adds the
"Mind map" button under every article header and the "Mind maps" entry on the Clinical home page.
tools/build_articles.py calls it; tools/check_maps.py checks every map against its articles.
"""
import os, re, json, html, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'content', 'maps')
ENG = os.path.join(ROOT, 'tools', 'maps')
WWW = os.path.join(ROOT, 'app', 'src', 'main', 'assets', 'www')
OUT = os.path.join(WWW, 'clinic', 'map')
SECS = [('ear', 'Ear'), ('nose', 'Nose & sinuses'), ('mouth', 'Mouth & throat'), ('larynx', 'Larynx & airway'), ('neck', 'Neck & head and neck cancer')]

VIEWER = r'''
/* Full-screen viewer for the mind maps (opened from an article, or from Mind maps on the Clinical home page).
   The map page talks back through window.MAPVIEW: open an article, open a summary board, go to the list of maps. */
(function(){
 let OV=null;
 function frame(src,title){if(!OV){OV=document.createElement("div");OV.className="mmov";OV.setAttribute("role","dialog");OV.setAttribute("aria-modal","true");
   OV.innerHTML='<div class="mmbar"><b></b><button type="button" data-mm="close">Close</button></div><iframe title="Mind map"></iframe>';
   document.body.appendChild(OV);document.body.style.overflow="hidden"}
  OV.querySelector("b").textContent=title||"Mind maps";OV.querySelector("iframe").src=src;OV.querySelector('[data-mm="close"]').focus({preventScroll:true})}
 function close(){if(OV){OV.remove();document.body.style.overflow=""}OV=null}
 function openFor(id){const m=(window.MAPS||{})[id];if(!m)return;const t=(window.MAPLIST||[]).find(x=>x.id===m);frame("clinic/map/"+m+".html#"+id,t?t.title+" · mind map":"Mind map")}
 window.MAPVIEW={index(){frame("clinic/map/all.html","Mind maps")},open(m,t){frame("clinic/map/"+m+".html",t)},
  article(id){close();if(typeof go==="function")go("cl:t-"+id)},board(id,title){close();if(window.openBoard)window.openBoard(id,title)},close,
  /* PDF downloads go through the app's own [data-pdf] handler (Android keeps a copy; the web saves the file) */
  pdf(id,name){const b=document.createElement("button");b.hidden=true;b.dataset.pdf=id;b.dataset.pdfname=name;document.body.appendChild(b);b.click();setTimeout(()=>b.remove(),0)}};
 window.openMapFor=openFor;
 document.addEventListener("click",ev=>{const b=ev.target.closest("[data-armap],[data-mapidx],[data-mm]");if(!b)return;
  if(b.dataset.armap){ev.preventDefault();ev.stopPropagation();openFor(b.dataset.armap)}
  else if(b.hasAttribute("data-mapidx")){ev.preventDefault();ev.stopPropagation();window.MAPVIEW.index()}
  else if(b.dataset.mm==="close"){ev.stopPropagation();close()}},true);
 document.addEventListener("keydown",ev=>{if(OV&&ev.key==="Escape"){ev.stopPropagation();close()}},true);
 const st=document.createElement("style");st.textContent=`
.mmov{position:fixed;inset:0;z-index:9999;background:#eef1f0;display:flex;flex-direction:column}
.mmbar{display:flex;align-items:center;gap:8px;padding:calc(10px + env(safe-area-inset-top)) 12px 10px;border-bottom:1px solid var(--line,#e3e0d6);background:var(--surface,#fff);color:var(--ink,#1d2330)}
.mmbar b{flex:1;font:600 15px/1.2 system-ui,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mmbar button{font:600 14px system-ui,sans-serif;border:1px solid var(--line,#cfcabd);background:transparent;color:inherit;border-radius:999px;padding:7px 14px;min-height:36px}
.mmov iframe{flex:1;width:100%;border:0;background:#eef1f0}
.armapbtn{display:flex;align-items:center;gap:12px;width:100%;margin:8px 0 4px;padding:12px 14px;border:1px solid var(--line,#ddd);border-radius:14px;background:var(--surface,#fff);color:var(--ink,#1d2330);text-align:left;cursor:pointer;font:inherit}
.armapbtn .mmi{flex:none;width:40px;height:30px;position:relative}
.armapbtn .mmi:before{content:"";position:absolute;left:14px;top:9px;width:12px;height:12px;border-radius:50%;border:2px solid #1d2330;background:#fff;box-shadow:-12px -7px 0 -3px #1f5fbf,13px -7px 0 -3px #e07b1a,-12px 9px 0 -3px #7b44b8,13px 9px 0 -3px #1f8a4c}
.armapbtn b{display:block;font-weight:600;color:var(--ink,#1d2330)}.armapbtn small{display:block;color:var(--muted,#6b6759);font-size:.85em;margin-top:1px}
.clmapbtn{display:flex;align-items:center;gap:12px;width:100%;margin:12px 0 14px;padding:12px 14px;border:1px solid var(--line,#ddd);border-radius:14px;background:var(--surface,#fff);color:var(--ink,#1d2330);text-align:left;cursor:pointer;font:inherit}
.clmapbtn b{display:block;font-weight:600}.clmapbtn small{display:block;color:var(--muted,#6b6759);font-size:.85em}
.clmapbtn .mmi{flex:none;width:40px;height:30px;position:relative}
.clmapbtn .mmi:before{content:"";position:absolute;left:14px;top:9px;width:12px;height:12px;border-radius:50%;border:2px solid currentColor;box-shadow:-12px -7px 0 -3px #1f5fbf,13px -7px 0 -3px #e07b1a,-12px 9px 0 -3px #7b44b8,13px 9px 0 -3px #1f8a4c}`;
 document.head.appendChild(st);
})();
'''

MAPBTN = ('${(window.MAPS||{})[id]?`<button type="button" class="armapbtn" data-armap="${id}"><span class="mmi" aria-hidden="true"></span>'
          '<span><b>Mind map</b><small>This topic on its route map</small></span></button>`:""}')
HOMEBTN = ('${M!=="dr"&&(window.MAPLIST||[]).length?`<button type="button" class="clmapbtn" data-mapidx><span class="mmi" aria-hidden="true"></span>'
           '<span><b>Mind maps</b><small>${window.MAPLIST.length} route maps that follow a disease from stop to stop</small></span></button>`:""}')

ALL = '''<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mind maps</title><link rel="stylesheet" href="route.css"><style>
body{padding:18px 16px 40px;max-width:1100px;margin:0 auto}
h1{font-size:30px;line-height:1.1}.lead{color:var(--mut);margin:4px 0 16px}
h2{font-size:19px;margin:24px 0 8px;color:var(--mut)}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:12px}
a{display:block;text-decoration:none;color:inherit;background:var(--card);border:1px solid var(--line);border-left:5px solid var(--c);border-radius:16px;padding:12px 14px}
a:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
a b{font-size:19px;display:block;margin-bottom:4px}
a span{display:block;font-size:14px;color:var(--mut);line-height:1.6}
a i{display:inline-block;width:9px;height:9px;border-radius:50%;margin:0 6px 1px 0}
</style></head><body><h1>Mind maps</h1><p class="lead">Each map follows a disease along its roads, stop by stop · ✎ Recall hides what you see and do so you can test yourself · ⤓ every map prints on one A3 page</p>
{BODY}</body></html>'''

PDFMAN = os.path.join(ENG, 'pdfs.json')


def src_hash(mid):
    """What the map PDF is drawn from: the map's JSON and the drawing engine (not the page around it)."""
    import hashlib
    h = hashlib.md5()
    for f in (os.path.join(SRC, mid + '.json'), os.path.join(ENG, 'route.js'), os.path.join(ENG, 'route.css')):
        h.update(open(f, 'rb').read())
    return h.hexdigest()


def arts_hash(arts):
    """What the merged PDF is made of: each topic's article PDF, in map order."""
    import hashlib
    h = hashlib.md5()
    for a in arts:
        f = os.path.join(WWW, 'pdf', 'cl_%s.pdf' % a)
        h.update(a.encode() + (open(f, 'rb').read() if os.path.exists(f) else b'-'))
    return h.hexdigest()


def pdf_info(m):
    """The map's two PDFs (tools/make_map_pdfs.py), offered only when both exist and match the current map."""
    try:
        e = json.load(open(PDFMAN, encoding='utf-8')).get(m['id'])
    except Exception:
        return None
    if not e or e.get('src') != src_hash(m['id']) or e.get('arts') != arts_hash([b['id'] for b in m['branches']]):
        return None
    out = {}
    for k, pre in (('map', 'mm_'), ('all', 'mmall_')):
        f = os.path.join(WWW, 'pdf', pre + m['id'] + '.pdf')
        if not os.path.exists(f):
            return None
        out[k] = {'id': pre + m['id'], 'b': os.path.getsize(f), 'p': e.get(k + '_pages', 1)}
    return out


def page_html(tpl, m):
    d = dict(m)
    p = pdf_info(m)
    if p:
        d['pdf'] = p
    return (tpl.replace('{TITLE}', html.escape(m['title'] + ' · mind map'))
               .replace('{H1}', html.escape(m['title']))
               .replace('{SUB}', html.escape('Route map · %s · %d topics' % (dict(SECS)[m['sec']], len(m['branches']))))
               .replace('{DATA}', json.dumps(d, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')))


PAL = {'blue': '#4f7fbf', 'orange': '#d08a3a', 'green': '#5a9668', 'red': '#c05a63', 'purple': '#8a6cc0', 'teal': '#36968f', 'pink': '#b85c8f', 'brown': '#b07a3f', 'grey': '#8a949c'}


def load():
    maps = []
    for f in sorted(os.listdir(SRC)):
        if f.endswith('.json'):
            maps.append(json.load(open(os.path.join(SRC, f), encoding='utf-8')))
    maps.sort(key=lambda m: ([s for s, _ in SECS].index(m['sec']), m.get('order', 99), m['id']))
    return maps


def build():
    os.makedirs(OUT, exist_ok=True)
    tpl = open(os.path.join(ENG, 'route-template.html'), encoding='utf-8').read()
    for f in ('route.js', 'route.css'):
        shutil.copy(os.path.join(ENG, f), os.path.join(OUT, f))
    for f in ('map.js', 'map.css'):   # the old mind-map engine, no longer used
        if os.path.exists(os.path.join(OUT, f)):
            os.remove(os.path.join(OUT, f))
    titles = {}
    try:
        d = open(os.path.join(WWW, 'clinic', 'data.js'), encoding='utf-8').read()
        titles = {t['id']: t['t'] for t in json.loads(d[d.index('=') + 1:].rstrip().rstrip(';'))['t']}
    except Exception:
        pass
    maps = load()
    art2map, lst, ids = {}, [], []
    for m in maps:
        page = page_html(tpl, m)
        open(os.path.join(OUT, m['id'] + '.html'), 'w', encoding='utf-8').write(page)
        ids.append(m['id'])
        for b in m['branches']:
            art2map[b['id']] = m['id']
        lst.append({'id': m['id'], 'title': m['title'], 'sec': m['sec'], 'arts': [b['id'] for b in m['branches']]})
    for f in os.listdir(OUT):
        if f.endswith('.html') and f[:-5] not in ids and f != 'all.html':
            os.remove(os.path.join(OUT, f))
    body = ''
    for s, name in SECS:
        ms = [m for m in maps if m['sec'] == s]
        if not ms:
            continue
        body += '<h2>%s</h2><div class="g">' % html.escape(name)
        for m in ms:
            col = lambda a: PAL.get(next((c['c'] for c in m['cards'] if c['art'] == a), 'grey'), '#8a949c')
            c = PAL.get(m['lines'][0]['c'], '#26303a')
            arts = ''.join('<i style="background:%s"></i>%s<br>' % (col(b['id']), html.escape(titles.get(b['id'], b['name']))) for b in m['branches'])
            body += '<a href="%s.html" style="--c:%s"><b>%s</b><span>%s</span></a>' % (m['id'], c, html.escape(m['title']), arts)
        body += '</div>'
    open(os.path.join(OUT, 'all.html'), 'w', encoding='utf-8').write(ALL.replace('{BODY}', body))
    with open(os.path.join(OUT, 'index.js'), 'w', encoding='utf-8') as o:
        o.write('window.MAPS=%s;\n' % json.dumps(art2map, separators=(',', ':')))
        o.write('window.MAPLIST=%s;\n' % json.dumps(lst, ensure_ascii=False, separators=(',', ':')))
        o.write(VIEWER)

    # the clinical library loads the map list with its other data
    ip = os.path.join(WWW, 'index.html'); h = open(ip, encoding='utf-8').read()
    if 'clinic/map/index.js' not in h:
        a = 'load("clinic/board/index.js").catch(()=>0)]'
        assert a in h, 'clinic loader not found in index.html'
        h = h.replace(a, 'load("clinic/board/index.js").catch(()=>0),load("clinic/map/index.js").catch(()=>0)]', 1)
        open(ip, 'w', encoding='utf-8').write(h)
    # the Mind map button sits under the Summary board button; the Mind maps entry under the library switch
    cp = os.path.join(WWW, 'clinic', 'clinic.js'); c = open(cp, encoding='utf-8').read()
    if 'data-armap' not in c:
        import build_boards
        assert build_boards.BTN in c, 'board button not found in clinic.js'
        c = c.replace(build_boards.BTN, build_boards.BTN + MAPBTN)
    if 'data-mapidx' not in c:
        a = '<button data-clmode="dr" aria-pressed="${dr}">Drugs</button></div>'
        assert c.count(a) == 1, 'library switch not found in clinic.js'
        c = c.replace(a, a + '\n ' + HOMEBTN, 1)
    open(cp, 'w', encoding='utf-8').write(c)

    files = ['clinic/map/index.js', 'clinic/map/route.js', 'clinic/map/route.css', 'clinic/map/all.html'] + ['clinic/map/%s.html' % i for i in ids]
    print('mind maps: %d maps, %d topics' % (len(ids), len(art2map)))
    return files


def pages(ids):
    """Render only the given maps' pages (safe to run in parallel; shared files untouched)."""
    os.makedirs(OUT, exist_ok=True)
    tpl = open(os.path.join(ENG, 'route-template.html'), encoding='utf-8').read()
    for f in ('route.js', 'route.css'):
        shutil.copy(os.path.join(ENG, f), os.path.join(OUT, f))
    for i in ids:
        m = json.load(open(os.path.join(SRC, i + '.json'), encoding='utf-8'))
        page = page_html(tpl, m)
        open(os.path.join(OUT, i + '.html'), 'w', encoding='utf-8').write(page)
        print('page: clinic/map/%s.html' % i)


if __name__ == '__main__':
    import sys
    if len(sys.argv) > 2 and sys.argv[1] == '--page':
        pages(sys.argv[2:])
    else:
        build()
