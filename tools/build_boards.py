#!/usr/bin/env python3
"""Build the whiteboard summaries of Clinical topics.

Each board is written by hand as an HTML fragment in content/boards/<topic id>.html,
using the classes in tools/boards/template.html. This script wraps every fragment in
the template, writes app/src/main/assets/www/clinic/board/<id>.html, writes the list
of boards and the full-screen viewer to clinic/board/index.js. tools/build_articles.py
calls it and adds the returned files to the offline cache in web/sw.js.
"""
import os, re, json, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'content', 'boards')
WWW = os.path.join(ROOT, 'app', 'src', 'main', 'assets', 'www')
OUT = os.path.join(WWW, 'clinic', 'board')
TPL = os.path.join(ROOT, 'tools', 'boards', 'template.html')

VIEWER = r'''
/* Full-screen viewer for the whiteboard summaries (opened from the button at the top of an article) */
(function(){
 const W=1760;let OV=null,Z=false,H=0;
 function fit(){if(!OV)return;const sc=OV.querySelector(".bdsc"),fr=OV.querySelector("iframe"),wr=OV.querySelector(".bdwrap");
  const f=sc.clientWidth/W,s=Z?Math.max(.75,f):f;fr.style.transform="scale("+s+")";wr.style.width=(W*s)+"px";wr.style.height=((H||1300)*s)+"px";
  OV.querySelector('[data-bd="zoom"]').textContent=Z?"Fit":"Zoom"}
 function open(id,title){close();Z=false;H=0;OV=document.createElement("div");OV.className="bdov";OV.setAttribute("role","dialog");OV.setAttribute("aria-modal","true");OV.setAttribute("aria-label","Summary board");
  OV.innerHTML='<div class="bdbar"><b></b><button type="button" data-bd="zoom">Zoom</button><button type="button" data-bd="close">Close</button></div><div class="bdsc"><div class="bdwrap"><iframe title="Summary board" tabindex="-1"></iframe></div></div><p class="bdhint">Tap Zoom, or double-tap the board, to read it closely. Turn the phone sideways for a wider view.</p>';
  OV.querySelector("b").textContent=title||"Summary board";const fr=OV.querySelector("iframe");
  fr.onload=()=>{try{H=Math.ceil(fr.contentDocument.body.getBoundingClientRect().height);fr.style.height=H+"px"}catch(e){}fit()};
  fr.src="clinic/board/"+id+".html";document.body.appendChild(OV);document.body.style.overflow="hidden";fit();
  OV.querySelector('[data-bd="close"]').focus({preventScroll:true})}
 function close(){if(OV&&OV.isConnected)OV.remove();if(OV)document.body.style.overflow="";OV=null}
 function zoomAt(x,y){const sc=OV.querySelector(".bdsc"),r=sc.getBoundingClientRect(),px=(sc.scrollLeft+x-r.left)/sc.scrollWidth,py=(sc.scrollTop+y-r.top)/sc.scrollHeight;
  Z=!Z;fit();sc.scrollLeft=px*sc.scrollWidth-(x-r.left);sc.scrollTop=py*sc.scrollHeight-(y-r.top)}
 document.addEventListener("click",ev=>{const b=ev.target.closest("[data-arboard]");if(b){ev.preventDefault();ev.stopPropagation();open(b.dataset.arboard,b.dataset.title);return}
  if(!OV)return;const c=ev.target.closest("[data-bd]");if(c){ev.stopPropagation();if(c.dataset.bd==="close")close();else{const sc=OV.querySelector(".bdsc"),r=sc.getBoundingClientRect();zoomAt(r.left+r.width/2,r.top+r.height/3)}}},true);
 document.addEventListener("dblclick",ev=>{if(OV&&ev.target.closest(".bdsc")){ev.preventDefault();zoomAt(ev.clientX,ev.clientY)}},true);
 let lastTap=0;document.addEventListener("touchend",ev=>{if(!OV||!ev.target.closest(".bdsc")||ev.changedTouches.length!==1)return;const t=Date.now();if(t-lastTap<300){ev.preventDefault();const p=ev.changedTouches[0];zoomAt(p.clientX,p.clientY);lastTap=0}else lastTap=t},{capture:true,passive:false});
 document.addEventListener("keydown",ev=>{if(OV&&ev.key==="Escape"){ev.stopPropagation();close()}},true);
 window.addEventListener("resize",fit);
 window.openBoard=open;
 const st=document.createElement("style");st.textContent=`
.bdov{position:fixed;inset:0;z-index:9999;background:#fbfbf7;display:flex;flex-direction:column}
.bdbar{display:flex;align-items:center;gap:8px;padding:calc(10px + env(safe-area-inset-top)) 12px 10px;border-bottom:1px solid #e3e0d6;background:#fff;color:#1d2330}
.bdbar b{flex:1;font:600 15px/1.2 system-ui,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bdbar button{font:600 14px system-ui,sans-serif;border:1px solid #cfcabd;background:#fff;color:#1d2330;border-radius:999px;padding:7px 14px}
.bdsc{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y}
.bdwrap{position:relative;overflow:hidden}
.bdwrap iframe{position:absolute;left:0;top:0;width:${W}px;height:1300px;border:0;transform-origin:0 0;pointer-events:none;background:#fbfbf7}
.bdhint{margin:0;padding:8px 14px calc(8px + env(safe-area-inset-bottom));font:13px/1.3 system-ui,sans-serif;color:#6b6759;background:#fff;border-top:1px solid #e3e0d6}
.arboardbtn{display:flex;align-items:center;gap:12px;width:100%;margin:14px 0 4px;padding:12px 14px;border:1px solid var(--line,#ddd);border-radius:14px;background:var(--card,#fff);color:inherit;text-align:left;cursor:pointer}
.arboardbtn .bdi{flex:none;width:40px;height:30px;border-radius:6px;background:#fbfbf7;border:1.5px solid #1d2330;position:relative}
.arboardbtn .bdi:before{content:"";position:absolute;left:6px;right:6px;top:7px;height:2px;background:#1f5fbf;box-shadow:0 6px 0 #d33a2c,0 12px 0 #1f8a4c}
.arboardbtn b{display:block;font-weight:600}.arboardbtn small{display:block;opacity:.7;font-size:.85em;margin-top:1px}`;
 document.head.appendChild(st);
})();
'''

BTN = ('${(window.BOARDS||{})[id]?`<button type="button" class="arboardbtn" data-arboard="${id}" data-title="${e(t.t)}">'
       '<span class="bdi" aria-hidden="true"></span><span><b>Summary board</b><small>The whole topic on one whiteboard</small></span></button>`:""}')


def build():
    tpl = open(TPL, encoding='utf-8').read()
    os.makedirs(OUT, exist_ok=True)
    ids = []
    for f in sorted(os.listdir(SRC)):
        if not f.endswith('.html'):
            continue
        tid = f[:-5]
        body = open(os.path.join(SRC, f), encoding='utf-8').read().strip()
        m = re.search(r'<h1>(.*?)</h1>', body, re.S)
        title = html.unescape(re.sub('<[^>]+>', '', m.group(1))).strip() if m else tid
        page = tpl.replace('{TITLE}', html.escape(title + ' · summary board')).replace('{BODY}', body)
        open(os.path.join(OUT, tid + '.html'), 'w', encoding='utf-8').write(page)
        ids.append(tid)
    for f in os.listdir(OUT):
        if f.endswith('.html') and f[:-5] not in ids:
            os.remove(os.path.join(OUT, f))
    with open(os.path.join(OUT, 'index.js'), 'w', encoding='utf-8') as o:
        o.write('window.BOARDS=%s;\n' % json.dumps({i: 1 for i in ids}, separators=(',', ':')))
        o.write(VIEWER)

    # the clinical library loads the board list with its other data
    ip = os.path.join(WWW, 'index.html'); h = open(ip, encoding='utf-8').read()
    if 'clinic/board/index.js' not in h:
        a = 'load("clinic/art/index.js").catch(()=>0)]'
        assert a in h, 'clinic loader not found in index.html'
        h = h.replace(a, 'load("clinic/art/index.js").catch(()=>0),load("clinic/board/index.js").catch(()=>0)]', 1)
        open(ip, 'w', encoding='utf-8').write(h)

    # the button sits under the reading time and sources, above the chapter tabs
    cp = os.path.join(WWW, 'clinic', 'clinic.js'); c = open(cp, encoding='utf-8').read()
    if 'data-arboard' not in c:
        a = '<span><b>Sources</b> ${e(t.srcs)}</span></div>'
        assert c.count(a) == 1, 'article header not found in clinic.js'
        c = c.replace(a, a + '  ' + BTN, 1)
        open(cp, 'w', encoding='utf-8').write(c)

    files = ['clinic/board/index.js'] + ['clinic/board/fonts/' + f for f in sorted(os.listdir(os.path.join(OUT, 'fonts')))] + ['clinic/board/%s.html' % i for i in ids]
    print('boards: %d' % len(ids))
    return files


if __name__ == '__main__':
    print('Run tools/build_articles.py: it builds the boards and updates the offline cache.')
