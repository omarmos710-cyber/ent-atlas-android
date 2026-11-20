#!/usr/bin/env python3
"""Build the mind maps of the Clinical library.

Each map is written by hand as JSON in content/maps/<map id>.json and joins several related articles: one
branch per article (branch id = article id), three levels (topic → heading → fact), with links between
topics. This script renders every map with the engine in tools/maps (map.js, map.css, template.html) into
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
  article(id){close();if(typeof go==="function")go("cl:t-"+id)},board(id,title){close();if(window.openBoard)window.openBoard(id,title)},close};
 window.openMapFor=openFor;
 document.addEventListener("click",ev=>{const b=ev.target.closest("[data-armap],[data-mapidx],[data-mm]");if(!b)return;
  if(b.dataset.armap){ev.preventDefault();ev.stopPropagation();openFor(b.dataset.armap)}
  else if(b.hasAttribute("data-mapidx")){ev.preventDefault();ev.stopPropagation();window.MAPVIEW.index()}
  else if(b.dataset.mm==="close"){ev.stopPropagation();close()}},true);
 document.addEventListener("keydown",ev=>{if(OV&&ev.key==="Escape"){ev.stopPropagation();close()}},true);
 const st=document.createElement("style");st.textContent=`
.mmov{position:fixed;inset:0;z-index:9999;background:#fbfbf7;display:flex;flex-direction:column}
.mmbar{display:flex;align-items:center;gap:8px;padding:calc(10px + env(safe-area-inset-top)) 12px 10px;border-bottom:1px solid var(--line,#e3e0d6);background:var(--surface,#fff);color:var(--ink,#1d2330)}
.mmbar b{flex:1;font:600 15px/1.2 system-ui,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mmbar button{font:600 14px system-ui,sans-serif;border:1px solid var(--line,#cfcabd);background:transparent;color:inherit;border-radius:999px;padding:7px 14px;min-height:36px}
.mmov iframe{flex:1;width:100%;border:0;background:#fbfbf7}
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
          '<span><b>Mind map</b><small>This topic among its neighbours</small></span></button>`:""}')
HOMEBTN = ('${M!=="dr"&&(window.MAPLIST||[]).length?`<button type="button" class="clmapbtn" data-mapidx><span class="mmi" aria-hidden="true"></span>'
           '<span><b>Mind maps</b><small>${window.MAPLIST.length} maps that join related topics, with a recall mode</small></span></button>`:""}')

ALL = '''<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mind maps</title><style>
@font-face{font-family:Caveat;src:url(../board/fonts/Caveat.ttf)}@font-face{font-family:Hand;src:url(../board/fonts/PatrickHand.ttf)}@font-face{font-family:Kalam;src:url(../board/fonts/KalamBold.ttf)}
*{box-sizing:border-box;margin:0;padding:0}body{background:#fbfbf7;color:#1d2330;font:17px/1.35 Hand,sans-serif;padding:18px 16px 40px;max-width:1100px;margin:0 auto;
background-image:radial-gradient(rgba(0,0,0,.04) 1px,transparent 1px);background-size:18px 18px}
h1{font:700 46px/1 Caveat}.lead{font:21px Caveat;color:#666;margin:4px 0 16px}
h2{font:700 30px/1 Caveat;margin:22px 0 8px}
.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:12px}
a{display:block;text-decoration:none;color:inherit;background:#fff;border:2.4px solid var(--c);border-radius:22px 10px 20px 12px;padding:10px 14px 12px}
a:focus-visible{outline:3px solid #f2c200;outline-offset:2px}
a b{font:700 28px/1.05 Caveat;color:var(--c);display:block}
a span{display:block;font-size:15px;color:#444;margin-top:4px}
a i{font-style:normal;display:inline-block;width:9px;height:9px;border-radius:50%;margin:0 5px 1px 0}
</style></head><body><h1>Mind maps</h1><p class="lead">Related topics on one map · tap a map, then a topic · ✎ Recall hides the facts so you can test yourself</p>
{BODY}</body></html>'''

PAL = {'blue': '#1f5fbf', 'orange': '#e07b1a', 'green': '#1f8a4c', 'red': '#d33a2c', 'purple': '#7b44b8', 'teal': '#138a8a', 'pink': '#c2387a', 'brown': '#8a5a2b'}


def load():
    maps = []
    for f in sorted(os.listdir(SRC)):
        if f.endswith('.json'):
            maps.append(json.load(open(os.path.join(SRC, f), encoding='utf-8')))
    maps.sort(key=lambda m: ([s for s, _ in SECS].index(m['sec']), m.get('order', 99), m['id']))
    return maps


def build():
    os.makedirs(OUT, exist_ok=True)
    tpl = open(os.path.join(ENG, 'template.html'), encoding='utf-8').read()
    for f in ('map.js', 'map.css'):
        shutil.copy(os.path.join(ENG, f), os.path.join(OUT, f))
    titles = {}
    try:
        d = open(os.path.join(WWW, 'clinic', 'data.js'), encoding='utf-8').read()
        titles = {t['id']: t['t'] for t in json.loads(d[d.index('=') + 1:].rstrip().rstrip(';'))['t']}
    except Exception:
        pass
    maps = load()
    art2map, lst, ids = {}, [], []
    for m in maps:
        n = len(m['branches'])
        sec = dict(SECS)[m['sec']]
        page = (tpl.replace('{TITLE}', html.escape(m['title'] + ' · mind map'))
                   .replace('{H1}', html.escape(m['title']))
                   .replace('{SUB}', html.escape('Mind map · %s · %d topics' % (sec, n)))
                   .replace('{DATA}', json.dumps(m, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')))
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
            c = PAL.get(m['branches'][0]['c'], '#1d2330')
            arts = ''.join('<i style="background:%s"></i>%s<br>' % (PAL.get(b['c'], b['c']), html.escape(titles.get(b['id'], b['name']))) for b in m['branches'])
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

    files = ['clinic/map/index.js', 'clinic/map/map.js', 'clinic/map/map.css', 'clinic/map/all.html'] + ['clinic/map/%s.html' % i for i in ids]
    print('mind maps: %d maps, %d topics' % (len(ids), len(art2map)))
    return files


def pages(ids):
    """Render only the given maps' pages (safe to run in parallel; shared files untouched)."""
    os.makedirs(OUT, exist_ok=True)
    tpl = open(os.path.join(ENG, 'template.html'), encoding='utf-8').read()
    for f in ('map.js', 'map.css'):
        if not os.path.exists(os.path.join(OUT, f)):
            shutil.copy(os.path.join(ENG, f), os.path.join(OUT, f))
    for i in ids:
        m = json.load(open(os.path.join(SRC, i + '.json'), encoding='utf-8'))
        page = (tpl.replace('{TITLE}', html.escape(m['title'] + ' · mind map')).replace('{H1}', html.escape(m['title']))
                   .replace('{SUB}', html.escape('Mind map · %s · %d topics' % (dict(SECS)[m['sec']], len(m['branches']))))
                   .replace('{DATA}', json.dumps(m, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')))
        open(os.path.join(OUT, i + '.html'), 'w', encoding='utf-8').write(page)
        print('page: clinic/map/%s.html' % i)


if __name__ == '__main__':
    import sys
    if len(sys.argv) > 2 and sys.argv[1] == '--page':
        pages(sys.argv[2:])
    else:
        build()
