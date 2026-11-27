/* Route-map engine for the Clinical mind maps (data: content/maps/<id>.json, schema in tools/maps/ROUTE.md).
   One JSON draws three things: the A3 poster (wide screens and the PDF), the list of stops (phones) and the
   recall mode. Text from the JSON is always set as text, never as markup. */
{
const D=window.MAP,NS='http://www.w3.org/2000/svg';
const qs=new URLSearchParams(location.search),PRINT=qs.has('print');
const embedded=(()=>{try{return window.parent!==window&&!!window.parent.MAPVIEW}catch(e){return false}})();
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const C=k=>`var(--${k||'grey'})`;
if(PRINT){document.documentElement.style.colorScheme='light';document.body.classList.add('print')}
if(embedded)document.body.classList.add('app');
const ZW=D.zones.map(z=>z[1]),ZT=ZW.reduce((a,b)=>a+b,0),cols=ZW.map(w=>w+'fr').join(' ');
const ST=D.st,ART=Object.fromEntries((D.branches||[]).map(b=>[b.id,b.name]));
const zoneOf=x=>{let a=0;for(let i=0;i<ZW.length;i++){a+=ZW[i]/ZT*400;if(x<a)return i}return ZW.length-1};

/* ---- lines: octilinear routes between consecutive stops ("@x,y" = a bend point) ---- */
function pt(s){if(typeof s==='string'&&s[0]==='@'){const [x,y]=s.slice(1).split(',').map(Number);return[x,y]}const t=ST[s];return[t.x,t.y]}
function route(stops){const out=[];let p=pt(stops[0]);out.push(p);
 for(let i=1;i<stops.length;i++){const q=pt(stops[i]),dx=q[0]-p[0],dy=q[1]-p[1],ax=Math.abs(dx),ay=Math.abs(dy);
  if(dx&&dy&&ax!==ay){if(ax>ay)out.push([q[0]-Math.sign(dx)*ay,p[1]]);else out.push([p[0],q[1]-Math.sign(dy)*ax])}
  out.push(q);p=q}
 return out}
const LINES=D.lines.map(l=>({...l,pts:route(l.stops)}));

/* ---- poster ---- */
function cardHTML(c,i){
 const two=(c.see&&c.see.length)&&(c.do&&c.do.length)&&(c.w||1)>=1.4;
 const list=(lab,a)=>a&&a.length?`<div><p class="lab">${lab}</p><ul class="ls">${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:'';
 const lists=two?`<div class="two">${list('See',c.see)}${list('Do',c.do)}</div>`:list(c.do&&c.do.length&&c.see&&c.see.length?'See':'',c.see)+list(c.see&&c.see.length?'Do':'',c.do);
 return `<div class="card" id="c${i}" data-i="${i}" data-art="${esc(c.art)}" style="--c:${C(c.c)};flex-grow:${c.w||1}"><h3><i></i><span>${esc(c.t)}${c.tag?` <em>· ${esc(c.tag)}</em>`:''}</span></h3>`+
  (c.why?`<p class="why">${esc(c.why)}</p>`:'')+lists.replace(/<p class="lab"><\/p>/g,'')+(c.warn?`<div class="warn">${esc(c.warn)}</div>`:'')+'</div>'}
function boxHTML(kind){
 if(kind==='ride'&&D.ride)return `<div class="card ride" style="--c:var(--ink)"><h3>How to ride</h3>${D.ride.text.map(t=>`<p>${esc(t)}</p>`).join('')}</div>`;
 if(kind==='checks'&&D.checks){const L='abcdef';return `<div class="card checks" style="--c:var(--ink)"><h3>Checkpoints</h3><ol>`+
  D.checks.q.map(q=>`<li>${esc(q.q)} <span>${q.o.map((o,j)=>L[j]+') '+esc(o)).join(' · ')}</span></li>`).join('')+
  `</ol><p class="ans">Answers: ${D.checks.q.map((q,j)=>(j+1)+' '+L[q.a]).join(' · ')}</p></div>`}
 return ''}
function rowHTML(row){
 let h=`<div class="prow p${row}" style="grid-template-columns:${cols}">`;
 for(let z=0;z<ZW.length;z++){const stack=(D.cells||{})[row+'-'+z]==='stack';
  let inner=D.cards.map((c,i)=>c.row===row&&c.zone===z?cardHTML(c,i):'').join('');
  for(const k of ['ride','checks'])if(D[k]&&D[k].row===row&&D[k].zone===z)inner=(D[k].first?boxHTML(k)+inner:inner+boxHTML(k));
  h+=`<div class="cell${stack?' stack':''}">${inner}</div>`}
 return h+'</div>'}
function stripSVG(){
 let h='';
 D.zones.forEach((z,i)=>{const x=ZW.slice(0,i).reduce((a,b)=>a+b,0)/ZT*400;h+=`<text class="zlab" x="${x+2}" y="64.6">${esc(z[0])}</text>`});
 LINES.forEach(l=>{h+=`<polyline points="${l.pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${C(l.c)}" stroke-width="${l.w||3}" stroke-linejoin="round" stroke-linecap="round"${l.dash?' stroke-dasharray="1.5 1.5"':''}/>`});
 (D.segs||[]).forEach(([a,b,t,dx,dy])=>{const p=pt(a),q=pt(b);h+=`<text class="rs" x="${(p[0]+q[0])/2+(dx||0)}" y="${(p[1]+q[1])/2+(dy||0)}" text-anchor="middle">${esc(t)}</text>`});
 for(const [id,s] of Object.entries(ST)){
  h+=s.ix?`<circle class="sto" data-st="${esc(id)}" cx="${s.x}" cy="${s.y}" r="3.1" stroke-width="1.2"/><circle class="sti" cx="${s.x}" cy="${s.y}" r="1.3"/>`:`<circle class="sto" data-st="${esc(id)}" cx="${s.x}" cy="${s.y}" r="2" stroke-width=".9"/>`;
  const L=s.lab||'a',pos=L==='a'?[s.x,s.y-4.2,'middle']:L==='b'?[s.x,s.y+(s.ix?7.4:6.6),'middle']:L==='l'?[s.x-3.6,s.y+1.2,'end']:[s.x+3.6,s.y+1.2,'start'];
  h+=`<text class="sn" x="${pos[0]+(s.dx||0)}" y="${pos[1]+(s.dy||0)}" text-anchor="${pos[2]}">${esc(s.t)}</text>`}
 return h}
function poster(){
 const legend=LINES.filter(l=>l.name).map(l=>`<span style="--c:${C(l.c)}"><i${l.dash?' class="d"':''}></i>${esc(l.name)}</span>`).join('');
 const ab=D.abbr||{},ak=Object.keys(ab).sort((a,b)=>a.localeCompare(b));
 return `<div class="page" id="page"><div class="zbg" style="grid-template-columns:${cols}">${ZW.map(()=>'<div></div>').join('')}</div>`+
  `<div class="phead"><h2>${esc(D.title)} · route map<small>${esc(D.sub||'')}</small></h2><div class="legend">${legend}</div></div>`+
  rowHTML('top')+`<svg id="strip" viewBox="0 0 400 66" preserveAspectRatio="none">${stripSVG()}</svg>`+rowHTML('bottom')+
  `<div class="pfoot"><span>The ENT Companion · ${esc(D.title)}. Numbers, doses and signs from the Clinical articles on this map; italic “why” lines and checkpoint cases are teaching summaries.</span><span>${ak.map(k=>esc(k)+' '+esc(ab[k])).join(' · ')}</span></div>`+
  `<svg class="ov" id="ov"></svg></div>`}

/* connectors: card edge → its station, drawn only where the path crosses no other card */
function box(el,root){const a=el.getBoundingClientRect(),b=root.getBoundingClientRect(),k=b.width/root.offsetWidth||1;return{x:(a.left-b.left)/k,y:(a.top-b.top)/k,w:a.width/k,h:a.height/k}}
function connectors(){
 const page=document.getElementById('page');if(!page.offsetWidth)return;const strip=document.getElementById('strip'),so=box(strip,page),sw=so.w/400,sh=so.h/66;
 const cards=[...page.querySelectorAll('.card[data-i]')].map(el=>({el,i:+el.dataset.i,...box(el,page)}));
 const hit=(x1,y1,x2,y2,r)=>{for(let t=0;t<=1;t+=.02){const x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;if(x>r.x+1&&x<r.x+r.w-1&&y>r.y+1&&y<r.y+r.h-1)return true}return false};
 let h='',dropped=[];
 cards.forEach(c=>{const d=D.cards[c.i],s=ST[d.st];if(!s){dropped.push(d.t);return}
  const sx=so.x+s.x*sw,sy=so.y+s.y*sh,r=(s.ix?3.1:2)*sh+.8,top=d.row==='top',ey=top?sy-r:sy+r,others=cards.filter(o=>o!==c);
  const clear=P=>!others.some(o=>P.some((p,k)=>k&&hit(P[k-1][0],P[k-1][1],p[0],p[1],o)));
  const x0=Math.max(c.x+8,Math.min(c.x+c.w-8,sx)),y0=top?c.y+c.h:c.y,my=(y0+ey)/2,gy=top?so.y-1.5*sh:so.y+so.h+1.5*sh,yy=c.y+Math.min(c.h/2,22);
  const tries=[[[x0,y0],[x0,my],[sx,ey]],[[c.x+c.w,yy],[c.x+c.w+5,yy],[c.x+c.w+5,gy],[sx,ey]],[[c.x,yy],[c.x-5,yy],[c.x-5,gy],[sx,ey]]];
  const P=tries.find(clear);if(!P){dropped.push(d.t);return}
  h+=`<path d="M${P.map(p=>p.join(',')).join('L')}" fill="none" stroke="${C(d.c)}" stroke-width="1" stroke-dasharray="2.4 2" opacity=".8"/><circle cx="${P[0][0]}" cy="${P[0][1]}" r="1.8" fill="${C(d.c)}"/>`});
 document.getElementById('ov').innerHTML=h;window.ROUTE_DROPPED=dropped}

/* ---- stops list ---- */
function stops(){
 const inc={};(D.segs||[]).forEach(([a,b,t])=>{(inc[b]=inc[b]||[]).push([a,t])});
 const linesAt=id=>LINES.filter(l=>l.stops.includes(id)&&l.name);
 const L='abcdef';
 let h=`<p class="intro">${esc(D.sub||'')}</p><div class="lines">${LINES.filter(l=>l.name).map(l=>`<span style="--c:${C(l.c)}"><i></i>${esc(l.name)}</span>`).join('')}</div>`;
 if(D.ride)h+=`<div class="box"><h3>How to ride</h3>${D.ride.text.map(t=>`<p>${esc(t)}</p>`).join('')}</div>`;
 D.zones.forEach((z,zi)=>{const cs=D.cards.map((c,i)=>[c,i]).filter(([c])=>(ST[c.st]?zoneOf(ST[c.st].x):c.zone)===zi).sort((a,b)=>(a[0].row==='top'?0:1)-(b[0].row==='top'?0:1)||(ST[a[0].st]?.x||0)-(ST[b[0].st]?.x||0));
  if(!cs.length)return;
  h+=`<div class="zh">${esc(z[0])}</div>`;
  cs.forEach(([c,i])=>{const list=(lab,a)=>a&&a.length?`<p class="lab">${lab}</p><ul>${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'';
   const body=list('You’ll see',c.see)+list('You do',c.do);
   h+=`<article class="stop" id="s${i}" data-art="${esc(c.art)}" style="--c:${C(c.c)}"><h3>${esc(c.t)}${c.tag?`<em>${esc(c.tag)}</em>`:''}</h3>`+
    `<div class="chips">${linesAt(c.st).map(l=>`<span style="--c:${C(l.c)}">${esc(l.name)}</span>`).join('')}</div>`+
    (inc[c.st]||[]).map(([a,t])=>`<p class="from">↳ from ${esc(ST[a]?ST[a].t:a)}: ${esc(t)}</p>`).join('')+
    (c.why?`<p class="why">${esc(c.why)}</p>`:'')+`<div class="body" data-b="${i}">${body}</div>`+(c.warn?`<div class="warn">${esc(c.warn)}</div>`:'')+
    `<div class="acts"><button class="sbtn" data-art="${esc(c.art)}">Article: ${esc(ART[c.art]||c.art)}</button><button class="sbtn" data-board="${esc(c.art)}">Board</button></div></article>`})});
 if(D.checks)h+=`<div class="box"><h3>Checkpoints</h3><ol>${D.checks.q.map(q=>`<li>${esc(q.q)} <span>${q.o.map((o,j)=>L[j]+') '+esc(o)).join(' · ')}</span></li>`).join('')}</ol><p class="ans">Answers: ${D.checks.q.map((q,j)=>(j+1)+' '+L[q.a]).join(' · ')}</p></div>`;
 return h}

/* ---- build the page ---- */
const stage=document.getElementById('stage'),scaler=document.getElementById('scaler'),stopsEl=document.getElementById('stops');
scaler.innerHTML=poster();stopsEl.innerHTML=stops();
let scale=1,view=PRINT?'poster':(innerWidth>=1000?'poster':'stops'),recall=false;
const mm=document.createElement('div');mm.style.width='100mm';document.body.appendChild(mm);const PXMM=mm.offsetWidth/100;mm.remove();
function fit(){const w=stage.clientWidth-28;scale=Math.min(1,w/(420*PXMM));apply()}
function apply(){scaler.style.transform=`scale(${scale})`;scaler.style.width=420*PXMM*scale+'px';scaler.style.height=297*PXMM*scale+'px'}
function setView(v){view=v;document.body.classList.toggle('vposter',v==='poster');document.body.classList.toggle('vstops',v==='stops');
 const b=document.querySelector('[data-a="view"]');if(b){b.querySelector('span').textContent=v==='poster'?'Stops':'Poster';b.firstChild.textContent=v==='poster'?'▤ ':'▦ '}
 if(v==='poster'&&!PRINT){fit();requestAnimationFrame(connectors)}}
function setRecall(on){recall=on;document.body.classList.toggle('recall',on);const b=document.querySelector('[data-a="recall"]');if(b)b.setAttribute('aria-pressed',on);
 stopsEl.querySelectorAll('.body').forEach(el=>{el.hidden=on;let r=el.nextElementSibling&&el.nextElementSibling.classList.contains('reveal')?el.nextElementSibling:null;
  if(on&&!r){r=document.createElement('button');r.className='reveal';r.textContent='Think first: what would you see and do? Tap to reveal';el.after(r)}
  if(!on&&r)r.remove()})}
let tt;function say(t){const T=document.getElementById('toast');T.textContent=t;T.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>T.classList.remove('on'),2200)}
function openArt(a){if(embedded)window.parent.MAPVIEW.article(a);else say('In the app this opens the article')}
function openBoard(a){if(embedded)window.parent.MAPVIEW.board(a,ART[a]||a);else say('In the app this opens the summary board')}
function highlight(a){document.querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));if(!a)return;
 const s=[...stopsEl.querySelectorAll('.stop')].filter(e=>e.dataset.art===a),p=[...scaler.querySelectorAll('.card[data-art]')].filter(e=>e.dataset.art===a);
 s.concat(p).forEach(e=>e.classList.add('hl'));if(view==='stops'&&s[0])s[0].scrollIntoView({block:'start'})}

document.getElementById('tools').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.a;
 if(a==='view')setView(view==='poster'?'stops':'poster');
 if(a==='recall')setRecall(!recall);
 if(a==='in'||a==='out'){scale=Math.max(.15,Math.min(3,scale*(a==='in'?1.3:1/1.3)));apply()}
 if(a==='fit')fit();
 if(a==='abbr'){document.getElementById('dl').classList.remove('on');document.getElementById('abbr').classList.toggle('on')}
 if(a==='pdf'){document.getElementById('abbr').classList.remove('on');document.getElementById('dl').classList.toggle('on')}
 if(a==='maps'){if(embedded)window.parent.MAPVIEW.index();else location.href='all.html'}});
stopsEl.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.classList.contains('reveal')){const body=b.previousElementSibling;body.hidden=false;b.remove();return}
 if(b.dataset.art)openArt(b.dataset.art);if(b.dataset.board)openBoard(b.dataset.board)});
scaler.addEventListener('click',e=>{const c=e.target.closest('.card[data-art]');if(c&&embedded)openArt(c.dataset.art)});
const ab=D.abbr||{},ak=Object.keys(ab).sort((a,b)=>a.localeCompare(b));
document.getElementById('abbr').innerHTML=ak.length?ak.map(k=>`<span><b>${esc(k)}</b> ${esc(ab[k])}</span>`).join(' · '):'No abbreviations on this map.';
/* PDF downloads: the poster on one A3 page, and the poster plus every topic's article (tools/make_map_pdfs.py) */
const DL=document.getElementById('dl'),PDF=D.pdf;
if(PDF){const pb=document.querySelector('[data-a="pdf"]');pb.hidden=false;
 const mb=n=>n<1048576?Math.max(1,Math.round(n/1024))+' KB':(n/1048576).toFixed(1)+' MB';
 DL.querySelector('[data-d="map"] small').textContent='1 page, A3 landscape · '+mb(PDF.map.b);
 DL.querySelector('[data-d="all"] small').textContent='Route map + '+D.branches.length+' articles · '+PDF.all.p+' pages · '+mb(PDF.all.b);
 DL.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  const f=b.dataset.d==='map'?PDF.map:PDF.all,name='The ENT Companion - '+D.title+(b.dataset.d==='map'?' - route map':' - all topics');
  if(embedded&&window.parent.MAPVIEW.pdf){window.parent.MAPVIEW.pdf(f.id,name);DL.classList.remove('on');return}
  const a=document.createElement('a');a.href='../../pdf/'+f.id+'.pdf';a.download=name.replace(/[^\w ,.-]/g,'')+'.pdf';document.body.appendChild(a);a.click();a.remove();
  DL.classList.remove('on');say('PDF saved to your downloads')})}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){DL.classList.remove('on');document.getElementById('abbr').classList.remove('on')}});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#dl,#abbr,nav')){DL.classList.remove('on');document.getElementById('abbr').classList.remove('on')}});
addEventListener('resize',()=>{if(view==='poster'&&!PRINT)fit()});
addEventListener('hashchange',()=>highlight(decodeURIComponent(location.hash.slice(1))));
setView(view);
(document.fonts?document.fonts.ready:Promise.resolve()).then(()=>{connectors();if(view==='poster'&&!PRINT)fit();
 const h=decodeURIComponent((location.hash||'').slice(1));if(h)setTimeout(()=>highlight(h),60);
 window.ROUTE_READY=true});
window.ROUTE={setView,setRecall,connectors,LINES,pt};
}
