/* ENT Companion mind-map engine (Buzan style): one central image, tapered curved limbs, one colour per
   topic, keywords written on the lines, three levels (topic → heading → fact).
   Data: window.MAP = {id,title,sec,hub:{t,s,icon},branches:[{id,name,c,icon,subs:[[heading,[facts]]]}],
   links:[[from,to,label]],abbr:{ABBR:"meaning"}}. Built by tools/build_maps.py from content/maps/<id>.json. */
{
const NS='http://www.w3.org/2000/svg',DATA=window.MAP;
const PAL={blue:'#1f5fbf',orange:'#e07b1a',green:'#1f8a4c',red:'#d33a2c',purple:'#7b44b8',teal:'#138a8a',pink:'#c2387a',brown:'#8a5a2b'};
const col=c=>PAL[c]||c;
/* icon library: strokes in a ±14 box */
const IC={
 ear:'<path d="M5-12c-9-2-15 4-14 11 1 5 5 6 5 10 0 4 4 6 8 3"/><path d="M2-5c-4 0-6 4-3 7"/>',
 drum:'<ellipse rx="10" ry="14"/><path d="M-2-9L3 6"/>',
 hole:'<ellipse rx="10" ry="14"/><ellipse cx="2" cy="3" rx="4" ry="5" class="f"/>',
 pearl:'<circle r="11" class="lf"/><path d="M-5-4a6 6 0 0 1 6-4"/><circle cx="7" cy="9" r="3" class="f"/>',
 cells:'<circle cx="-7" cy="-6" r="5"/><circle cx="4" cy="-8" r="5"/><circle cx="-9" cy="5" r="5"/><circle cx="2" cy="4" r="5"/><circle cx="10" cy="4" r="5"/><circle cx="-2" cy="13" r="4"/>',
 bone:'<path d="M-14 10L0-13 14 10Z"/><circle cy="3" r="3.5" class="f"/>',
 brain:'<path d="M-13 4c-5-9 3-17 9-14 3-5 11-4 12 2 7 1 8 10 2 13 0 6-8 8-12 4-4 4-12 2-11-5z"/><path d="M-3-9c3 4-1 8 3 12M5 0c-3 2-2 6 1 8" stroke-width="1.8"/>',
 sound:'<path d="M-13-4v8h5l7 6v-20l-7 6z"/><path d="M4-6a8 8 0 0 1 0 12M8-10a13 13 0 0 1 0 20"/>',
 cochlea:'<path d="M1 1a3 3 0 1 1 3-3a7 7 0 1 1-7-7a11 11 0 1 1 11 11"/>',
 vertigo:'<path d="M-11-3a11 11 0 0 1 20-5M11 3a11 11 0 0 1-20 5"/><path d="M9-8l1-5M9-8l-5 0M-9 8l-1 5M-9 8l5 0"/>',
 nerve:'<path d="M-14 0h5l3-8 5 16 3-8h12"/>',
 face:'<circle r="12"/><circle cx="-4.5" cy="-3" r="1.6" class="f"/><circle cx="4.5" cy="-4" r="1.6" class="f"/><path d="M-6 5q4 3 9-2"/>',
 eye:'<path d="M-13 0q13-12 26 0q-13 12-26 0z"/><circle r="4" class="f"/>',
 tear:'<path d="M-13-3q13-12 26 0q-13 12-26 0z"/><circle cy="-3" r="3.5" class="f"/><path d="M8 4c2 3 3 5 3 6a3 3 0 0 1-6 0c0-1 1-3 3-6z"/>',
 nose:'<path d="M-1-13c0 9-8 14-8 19 0 3 4 3 6 2 2 2 6 2 7-1"/>',
 sinus:'<path d="M-12-6h9v12h-9zM3-6h9v12h-9z"/><path d="M0-13l-3 10h6z"/>',
 smell:'<path d="M-5-13c0 9-7 14-7 19 0 3 3 3 5 2 2 2 5 2 6-1"/><path d="M5-11q3 3 0 6q-3 3 0 6M10-9q3 3 0 6q-3 3 0 6"/>',
 drop:'<path d="M0-13c6 8 9 12 9 16a9 9 0 0 1-18 0c0-4 3-8 9-16z" class="lf"/>',
 microbe:'<circle r="7" class="lf"/><path d="M0-8v-5M0 8v5M-8 0h-5M8 0h5M-6-6l-3-3M6 6l3 3M6-6l3-3M-6 6l-3 3"/>',
 flame:'<path d="M0-13c6 7 9 10 9 15a9 9 0 0 1-18 0c0-4 3-6 4-9 2 3 4 3 5 1 0-3-1-5 0-7z"/>',
 crust:'<path d="M-11-4l5-7 6 3 7-4 4 7-3 6 3 6-8 4-5-3-6 3-4-7z"/>',
 throat:'<path d="M-12-12h24l-8 12v12h-8v-12z"/>',
 tonsils:'<ellipse cx="-7" cy="2" rx="4" ry="7"/><ellipse cx="7" cy="2" rx="4" ry="7"/><path d="M0-12v8"/><circle cy="-3" r="1.6" class="f"/>',
 tooth:'<path d="M-9-10c3-3 6 0 9 0s6-3 9 0c2 4 0 9-2 12l-2 10-3-8h-4l-3 8-2-10c-2-3-4-8-2-12z"/>',
 mouth:'<path d="M-13 0q13-12 26 0q-13 12-26 0z"/><path d="M-13 0h26"/>',
 ulcer:'<path d="M-13 0q13-12 26 0q-13 12-26 0z"/><circle cx="4" cy="3" r="2.6" class="f"/>',
 larynx:'<path d="M-8-12q8-6 16 0"/><path d="M0-8l-8 20M0-8l8 20"/><path d="M-12 12q12 4 24 0"/>',
 voice:'<path d="M-14 0h4l2-7 3 14 3-10 2 6 2-3h12"/>',
 airway:'<path d="M-6-13v26M6-13v26"/><path d="M-6-8h12M-6-2h12M-6 4h12M-6 10h12"/>',
 child:'<circle cy="-7" r="5"/><path d="M-8 13c0-7 3-11 8-11s8 4 8 11"/>',
 lump:'<path d="M-9-13c2 8 2 18 0 26"/><path d="M-9-3q9-7 12 2q-2 9-12 5"/>',
 gland:'<circle cx="-5" cy="-4" r="4.5"/><circle cx="3" cy="-7" r="4.5"/><circle cx="-2" cy="4" r="4.5"/><circle cx="6" cy="1" r="4.5"/><path d="M8 5l6 7"/>',
 thyroid:'<path d="M0-2c-3-8-12-10-12 0s9 10 12 2c3 8 12 8 12-2s-9-8-12 0z"/>',
 pill:'<path d="M-10 4l10-10a5 5 0 0 1 7 7l-10 10a5 5 0 0 1-7-7z"/><path d="M-5-1l7 7"/>',
 scalpel:'<path d="M-13 11l14-14 4 4-14 14z"/><path d="M1-3l7-9c2-2 5 0 4 3l-7 10"/>',
 laser:'<path d="M-13 12l17-17"/><circle cx="7" cy="-8" r="3" class="f"/><path d="M7-14v-2M13-8h2M11-12l2-2M11-4l2 2M3-12l-2-2"/>',
 scan:'<circle r="12"/><ellipse rx="5" ry="7"/><path d="M-12 0h7M5 0h7"/>',
 target:'<circle r="12"/><circle r="7"/><circle r="2.5" class="f"/>',
 skull:'<path d="M-11 2c-2-10 4-15 11-15s13 5 11 15l-3 3v6h-16v-6z"/><circle cx="-5" cy="1" r="3" class="f"/><circle cx="5" cy="1" r="3" class="f"/>',
 shield:'<path d="M0-13l11 4v6c0 8-5 13-11 16-6-3-11-8-11-16v-6z"/>',
 clock:'<circle r="12"/><path d="M0-7v7l5 4"/>',
 question:'<circle r="12"/><path d="M-4-4a4 4 0 1 1 6 3c-2 1-2 2-2 4"/><circle cy="7" r="1.4" class="f"/>',
 swallow:'<path d="M-5-13v26M5-13v26"/><circle cy="-4" r="3.5" class="f"/><path d="M0 4v6M-3 7l3 3 3-3"/>',
 sleep:'<path d="M4-11a12 12 0 1 0 8 16a10 10 0 0 1-8-16z"/>',
 radiation:'<circle r="2.5" class="f"/><path d="M0-4L-4-11a12 12 0 0 1 8 0zM3.5 2L11 5a12 12 0 0 1-4 7zM-3.5 2L-11 5a12 12 0 0 0 4 7z"/>',
 flap:'<path d="M-12 8c4-14 20-14 24 0"/><path d="M-12 8h24" stroke-dasharray="3 3"/>',
 vessel:'<path d="M-14-5c6 0 7 7 14 7s7-7 14-7M-14 3c6 0 7 7 14 7s7-7 14-7"/>',
 needle:'<path d="M-12 12l17-17M5-5l4-4M7-11l4 4"/><path d="M-12 12l-2 2"/>',
 spark:'<path d="M2-13l-10 15h8l-2 11 10-15h-8z"/>',
 gene:'<path d="M-6-13c12 8 0 18 12 26M6-13c-12 8 0 18-12 26"/><path d="M-4-6h8M-4 6h8"/>',
 fracture:'<path d="M-13-4h26v8h-26z"/><path d="M-1-4l3 3-3 2 3 3" stroke-width="2"/>',
 aid:'<path d="M-5-12c8 0 12 6 10 12-1 4-6 4-6 9 0 3-3 4-5 2"/><circle cx="-1" cy="-4" r="2" class="f"/>',
 nodes:'<path d="M-11-10Q0 0 -6 12"/><circle cx="-11" cy="-10" r="3" class="f"/><circle cx="-4" cy="-2" r="3" class="f"/><circle cx="-4" cy="6" r="3" class="f"/><circle cx="6" cy="2" r="3"/>',
 book:'<path d="M0-9c-4-3-9-3-13-1v20c4-2 9-2 13 1 4-3 9-3 13-1v-20c-4-2-9-2-13 1zM0-9v21"/>'
};
const svg=document.getElementById('map'),world=document.getElementById('world');
const sheet=document.getElementById('sheet'),toast=document.getElementById('toast');
const embedded=(()=>{try{return window.parent!==window&&!!window.parent.MAPVIEW}catch(e){return false}})();
const wide=()=>innerWidth>=1000,narrow=()=>innerWidth<700;
const BR=DATA.branches.map(b=>({...b,c:col(b.c)})),byId=Object.fromEntries(BR.map(b=>[b.id,b]));
let open=new Set(wide()?BR.map(b=>b.id):[]),focus=null,recall=false,showLinks=true,pos={},R0=300;
const reveal=new Set();
const el=(t,a={},p)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e};
const meas=el('text',{class:'meas',x:-9999,y:-9999},svg);
function tw(txt,cls){meas.setAttribute('class','meas '+cls);meas.textContent=txt;return meas.getComputedTextLength()}
function taper(g,x0,y0,x1,y1,w0,w1,c){
 const dx=x1-x0,P=[[x0,y0],[x0+dx*.55,y0],[x1-dx*.45,y1],[x1,y1]],L=[],R=[],N=28;
 for(let i=0;i<=N;i++){const t=i/N,u=1-t;
  const x=u*u*u*P[0][0]+3*u*u*t*P[1][0]+3*u*t*t*P[2][0]+t*t*t*P[3][0];
  const y=u*u*u*P[0][1]+3*u*u*t*P[1][1]+3*u*t*t*P[2][1]+t*t*t*P[3][1];
  const tx=3*u*u*(P[1][0]-P[0][0])+6*u*t*(P[2][0]-P[1][0])+3*t*t*(P[3][0]-P[2][0]);
  const ty=3*u*u*(P[1][1]-P[0][1])+6*u*t*(P[2][1]-P[1][1])+3*t*t*(P[3][1]-P[2][1]);
  const l=Math.hypot(tx,ty)||1,w=(w0+(w1-w0)*Math.pow(t,.8))/2;
  L.push([x-ty/l*w,y+tx/l*w]);R.push([x+ty/l*w,y-tx/l*w]);}
 const f=p=>p[0].toFixed(1)+','+p[1].toFixed(1);
 return el('path',{d:'M'+L.map(f).join('L')+'L'+R.reverse().map(f).join('L')+'Z',fill:c},g);
}
function icon(g,name,x,y,c,r=23){
 const s=el('g',{transform:`translate(${x},${y})`,class:'ico',stroke:c,fill:'none','stroke-width':2.6,'stroke-linecap':'round','stroke-linejoin':'round',style:'--ic:'+c},g);
 el('circle',{r,fill:'#fff',stroke:c,'stroke-width':2.4},s);
 const i=el('g',{transform:`scale(${r/23})`},s);i.innerHTML=IC[name]||IC.question;return s;
}
function earsection(hub){
 const ear=el('g',{transform:'translate(-4,-36) scale(1.05)',fill:'none','stroke-linecap':'round','stroke-linejoin':'round'},hub);
 el('path',{d:'M-78 18c-14-14-12-44 6-50 14-5 22 8 18 20',stroke:'#c98e6b','stroke-width':4},ear);
 el('path',{d:'M-56 6H-12M-56 22H-12',stroke:'#8a6b55','stroke-width':3},ear);
 el('path',{d:'M-10 2q5 12 0 24',stroke:'#1f5fbf','stroke-width':4},ear);
 el('rect',{x:-6,y:-4,width:30,height:34,rx:8,fill:'rgba(211,58,44,.12)',stroke:'#d33a2c','stroke-width':2.4},ear);
 for(const [a,b] of [[2,8],[10,4],[18,10]])el('circle',{cx:a,cy:b,r:2.8,fill:'#1d2330'},ear);
 el('path',{d:'M34 18a8 8 0 1 1 8-8a5 5 0 1 1-5-5',stroke:'#7b44b8','stroke-width':2.6},ear);
 for(const [a,b] of [[28,38],[40,40],[52,34],[36,50],[48,48]])el('circle',{cx:a,cy:b,r:5,stroke:'#e07b1a','stroke-width':2.2},ear);
 el('path',{d:'M-8-12Q20-22 60-12',stroke:'#1f8a4c','stroke-width':3},ear);
 el('path',{d:'M-20-22Q20-48 70-24',stroke:'#d33a2c','stroke-width':2.6,'stroke-dasharray':'5 5'},ear);
}
const SUBH=48,LEAFH=33,BGAP=40,SGAP=14;
const outs=id=>(DATA.links||[]).filter(l=>l[0]===id);
const baseH=b=>74+(showLinks?outs(b.id).length*30:0);
const fullH=b=>Math.max(baseH(b)+20,b.subs.reduce((h,s)=>h+Math.max(SUBH,s[1].length*LEAFH)+SGAP,-SGAP));
/* clockwise reading order: the first k topics down the right, the rest up the left; k balances the two sides */
let SPLIT=Math.ceil(BR.length/2);{let best=1e9;for(let k=1;k<BR.length;k++){const a=BR.slice(0,k).reduce((h,b)=>h+fullH(b),0),z=BR.slice(k).reduce((h,b)=>h+fullH(b),0),d=Math.abs(a-z)+Math.abs(k-BR.length/2)*60;if(d<best){best=d;SPLIT=k}}}
function sides(){if(narrow())return[[1,BR]];return[[1,BR.slice(0,SPLIT)],[-1,BR.slice(SPLIT).reverse()]]}
let HUBX=150,HUBY=108;
function layout(){
 world.innerHTML='';pos={};HUBX=Math.max(150,(tw(DATA.hub.t,'thub')/2+22)/.9,(tw(DATA.hub.s||'','thubs')/2+16)/.69);R0=narrow()?HUBX+80:HUBX+150;
 const gb=el('g',{},world);
 for(const [side,bs] of sides()){
  const H=b=>Math.max(baseH(b)+20,open.has(b.id)?fullH(b):0);
  const tot=bs.reduce((h,b)=>h+H(b),0)+BGAP*(bs.length-1);let y=-tot/2;
  bs.forEach((b,bi)=>{
   const h=H(b),my=y+h/2,g=el('g',{class:'br'+(focus&&focus!==b.id?' dim':''),'data-id':b.id},gb);
   const tW=tw(b.name,'tmain'),x0=side*R0,xIcon=x0+side*28,xT=x0+side*60,xE=xT+side*tW;
   const n=bs.length,sy=(bi-(n-1)/2)*Math.min(46,HUBY*1.5/Math.max(1,n-1));
   taper(g,side*HUBX*.84,sy,x0,my,28,11,b.c);
   el('line',{x1:x0,y1:my,x2:xE+side*8,y2:my,stroke:b.c,'stroke-width':6,'stroke-linecap':'round'},g);
   const hit=el('g',{class:'hit','data-id':b.id},g);
   el('rect',{x:Math.min(x0,xE)-6,y:my-58,width:Math.abs(xE-x0)+20,height:66,fill:'transparent'},hit);
   icon(hit,b.icon,xIcon,my-27,b.c);
   el('text',{x:xT,y:my-12,class:'tmain','text-anchor':side>0?'start':'end',fill:b.c},hit).textContent=b.name;
   pos[b.id]={x:xE,y:my,x0,side,c:b.c};
   if(!open.has(b.id)){const n=b.subs.reduce((a,s)=>a+s[1].length,0),cx=xE+side*30;
    el('circle',{cx,cy:my,r:17,fill:'#fff',stroke:b.c,'stroke-width':2.4},hit);
    el('text',{x:cx,y:my+6,'text-anchor':'middle',class:'tmore',fill:b.c},hit).textContent='+'+n;}
   else{let sy2=y+(h-fullH(b))/2;
    b.subs.forEach(([k,leaves],si)=>{
     const sh=Math.max(SUBH,leaves.length*LEAFH),cy=sy2+sh/2,kw=tw(k,'tsub'),sx=xE+side*44,se=sx+side*kw;
     taper(g,xE+side*6,my,sx,cy,9,4,b.c);
     el('line',{x1:sx,y1:cy,x2:se+side*6,y2:cy,stroke:b.c,'stroke-width':3.2,'stroke-linecap':'round'},g);
     el('text',{x:sx+side*2,y:cy-8,class:'tsub','text-anchor':side>0?'start':'end'},g).textContent=k;
     const top=cy-leaves.length*LEAFH/2;
     leaves.forEach((lf,li)=>{
      const ly=top+LEAFH*li+LEAFH*.72,lx=se+side*30,lw=tw(lf,'tleaf'),key=b.id+si+'.'+li;
      taper(g,se+side*6,cy,lx,ly,3,1.4,b.c).setAttribute('opacity',.75);
      const lg=el('g',{class:'leaf'+(reveal.has(key)?' shown':''),'data-k':key},g);
      el('line',{x1:lx,y1:ly,x2:lx+side*(lw+6),y2:ly,stroke:b.c,'stroke-width':1.6,opacity:.55},lg);
      el('rect',{x:Math.min(lx,lx+side*(lw+6)),y:ly-24,width:lw+6,height:28,class:'veil',rx:6},lg);
      el('text',{x:lx+side*3,y:ly-6,class:'tleaf','text-anchor':side>0?'start':'end'},lg).textContent=lf;
     });
     sy2+=sh+SGAP;});
   }
   if(showLinks)outs(b.id).forEach(([,to,lab],li)=>{const tb=byId[to];if(!tb)return;
    const cg=el('g',{class:'go','data-to':to},g),t=el('text',{x:xE-side*14,y:my+30+li*30,class:'tgo','text-anchor':side>0?'end':'start'},cg);const a=el('tspan',{},t);a.textContent=lab+' ';const z=el('tspan',{fill:tb.c,'font-weight':700},t);z.textContent='→ '+tb.name;});
   y+=h+BGAP;
  });
 }
 const hub=el('g',{id:'hub',class:'hub'},world);
 el('ellipse',{cx:6,cy:8,rx:HUBX+4,ry:HUBY+4,fill:'rgba(255,226,74,.55)'},hub);
 el('ellipse',{rx:HUBX,ry:HUBY,fill:'#fff',stroke:'#1d2330','stroke-width':3.4},hub);
 if(DATA.hub.icon==='earsection')earsection(hub);else{const s=icon(hub,DATA.hub.icon,0,-38,'#1d2330',40);s.querySelector('circle').setAttribute('stroke-width',0)}
 el('text',{y:42,'text-anchor':'middle',class:'thub'},hub).textContent=DATA.hub.t;
 el('text',{y:78,'text-anchor':'middle',class:'thubs'},hub).textContent=DATA.hub.s||'';
 world.setAttribute('class',recall?'recall':'');
}
let cam={x:0,y:0,s:1},anim=null;
function apply(){const W=svg.clientWidth,H=svg.clientHeight;svg.setAttribute('viewBox',`${cam.x-W/2/cam.s} ${cam.y-H/2/cam.s} ${W/cam.s} ${H/cam.s}`)}
function target(bb,pad=.9){const W=svg.clientWidth,H=svg.clientHeight;return{x:bb.x+bb.width/2,y:bb.y+bb.height/2,s:Math.min(W/bb.width,H/bb.height)*pad}}
function fly(t,ms=520){cancelAnimationFrame(anim);const a={...cam},t0=performance.now();
 const step=n=>{let k=Math.min(1,(n-t0)/ms);k=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
  cam={x:a.x+(t.x-a.x)*k,y:a.y+(t.y-a.y)*k,s:a.s*Math.pow(t.s/a.s,k)};apply();if(k<1)anim=requestAnimationFrame(step)};
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){cam=t;apply()}else anim=requestAnimationFrame(step)}
function fit(ms){fly(target(world.getBBox(),.94),ms)}
function focusOn(id,ms){
 if(!byId[id])return;focus=id;open.add(id);layout();
 const g=world.querySelector(`.br[data-id="${id}"]`),bb=g.getBBox(),hb=document.getElementById('hub').getBBox();
 let x0=Math.min(bb.x,hb.x+hb.width*.35),x1=Math.max(bb.x+bb.width,hb.x+hb.width*.65);
 if(narrow()){x0=pos[id].x-10;x1=bb.x+bb.width}
 const t=target({x:x0,y:bb.y-20,width:x1-x0,height:bb.height+40},.96);
 if(narrow()){const W=svg.clientWidth,H=svg.clientHeight;t.s=W/(x1-x0)*.97;t.x=(x0+x1)/2;t.y=Math.min(t.y,bb.y-20+H/2/t.s)}
 fly(t,ms);
 const b=byId[id];sheet.querySelector('.sn').textContent=b.name;sheet.style.setProperty('--c',b.c);sheet.dataset.id=id;sheet.classList.add('on');
}
function overview(){focus=null;if(!wide())open.clear();else open=new Set(BR.map(b=>b.id));layout();sheet.classList.remove('on');fit()}
const pts=new Map();let moved=0,last=null,pinch0=null;
svg.addEventListener('pointerdown',e=>{pts.set(e.pointerId,[e.clientX,e.clientY]);moved=0;last=[e.clientX,e.clientY];
 if(pts.size===2){const [p,q]=[...pts.values()];pinch0={d:Math.hypot(p[0]-q[0],p[1]-q[1]),s:cam.s}}});
svg.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,[e.clientX,e.clientY]);
 if(pts.size===2&&pinch0){const [p,q]=[...pts.values()];cam.s=Math.max(.08,Math.min(4,pinch0.s*Math.hypot(p[0]-q[0],p[1]-q[1])/pinch0.d));moved=99;apply();return}
 const dx=e.clientX-last[0],dy=e.clientY-last[1];moved+=Math.abs(dx)+Math.abs(dy);last=[e.clientX,e.clientY];
 if(moved>6){cancelAnimationFrame(anim);cam.x-=dx/cam.s;cam.y-=dy/cam.s;apply()}});
const up=e=>{const single=pts.size===1;pts.delete(e.pointerId);if(pts.size<2)pinch0=null;if(pts.size===1)last=[...pts.values()][0];
 if(e.type==='pointerup'&&single&&moved<=6)tap(document.elementFromPoint(e.clientX,e.clientY))};
svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',up);svg.addEventListener('pointerleave',e=>{pts.delete(e.pointerId)});
svg.addEventListener('wheel',e=>{e.preventDefault();const r=svg.getBoundingClientRect(),k=Math.exp(-e.deltaY*.0015);
 const mx=cam.x+(e.clientX-r.left-r.width/2)/cam.s,my=cam.y+(e.clientY-r.top-r.height/2)/cam.s;
 const s=Math.max(.08,Math.min(4,cam.s*k));cam={x:mx-(mx-cam.x)*cam.s/s,y:my-(my-cam.y)*cam.s/s,s};apply()},{passive:false});
function tap(t){if(!t||!t.closest)return;
 const go=t.closest('.go');if(go){focusOn(go.dataset.to);return}
 const leaf=t.closest('.leaf');if(leaf&&recall){const k=leaf.dataset.k;reveal.has(k)?reveal.delete(k):reveal.add(k);leaf.classList.toggle('shown');return}
 const h=t.closest('.hit');if(h){const id=h.dataset.id;if(focus===id)overview();else focusOn(id);return}
 if(t.closest('#hub'))overview()}
document.getElementById('tools').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.a;
 if(a==='fit')overview();
 if(a==='in'||a==='out')fly({...cam,s:cam.s*(a==='in'?1.35:1/1.35)},220);
 if(a==='recall'){recall=!recall;reveal.clear();b.setAttribute('aria-pressed',recall);layout();say(recall?'Recall on: facts hidden. Tap one to check yourself':'Recall off')}
 if(a==='links'){showLinks=!showLinks;b.setAttribute('aria-pressed',showLinks);layout()}
 if(a==='all'){open=new Set(BR.map(b=>b.id));focus=null;sheet.classList.remove('on');layout();fit()}
 if(a==='abbr')document.getElementById('abbr').classList.toggle('on');
 if(a==='pdf'){document.getElementById('abbr').classList.remove('on');DL.classList.toggle('on')}
 if(a==='maps'){if(embedded)window.parent.MAPVIEW.index();else location.href='all.html'}});
sheet.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const id=sheet.dataset.id,t=byId[id];
 if(b.dataset.a==='art'){if(embedded)window.parent.MAPVIEW.article(id);else say('In the app this opens the article')}
 if(b.dataset.a==='board'){if(embedded)window.parent.MAPVIEW.board(id,t.name);else say('In the app this opens the summary board')}
 if(b.dataset.a==='close')overview()});
let tt;function say(t){toast.textContent=t;toast.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>toast.classList.remove('on'),2400)}
let rw=innerWidth;addEventListener('resize',()=>{if(narrow()!==(rw<700)){rw=innerWidth;layout();fit(0)}else{rw=innerWidth;apply()}});
/* PDF downloads: the whole map on one page, and every topic's article PDF joined in map order.
   tools/make_map_pdfs.py makes them; build_maps.py adds DATA.pdf only when both match the current map. */
const DL=document.getElementById('dl'),PDF=DATA.pdf;
if(PDF){const pb=document.querySelector('[data-a="pdf"]');pb.hidden=false;
 const mb=n=>n<1048576?Math.max(1,Math.round(n/1024))+' KB':(n/1048576).toFixed(1)+' MB';
 DL.querySelector('[data-d="map"] small').textContent='1 page · every topic open · '+mb(PDF.map.b);
 DL.querySelector('[data-d="all"] small').textContent='Mind map + '+BR.length+' articles · '+PDF.all.p+' pages · '+mb(PDF.all.b);
 DL.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  const f=b.dataset.d==='map'?PDF.map:PDF.all,name='The ENT Companion - '+DATA.title+(b.dataset.d==='map'?' - mind map':' - all topics');
  if(embedded&&window.parent.MAPVIEW.pdf){window.parent.MAPVIEW.pdf(f.id,name);DL.classList.remove('on');return}
  const a=document.createElement('a');a.href='../../pdf/'+f.id+'.pdf';a.download=name.replace(/[^\w ,.-]/g,'')+'.pdf';document.body.appendChild(a);a.click();a.remove();
  DL.classList.remove('on');say('PDF saved to your downloads')});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')DL.classList.remove('on')});
 svg.addEventListener('pointerdown',()=>DL.classList.remove('on'));}
const ab=DATA.abbr||{},ak=Object.keys(ab).sort((a,b)=>a.localeCompare(b));
document.getElementById('abbr').innerHTML=ak.length?ak.map(k=>`<span><b>${k}</b> ${ab[k]}</span>`).join(' · '):'No abbreviations on this map.';
(document.fonts?document.fonts.ready:Promise.resolve()).then(()=>{layout();cam=target(world.getBBox(),.94);apply();
 const h=decodeURIComponent((location.hash||'').slice(1));
 if(h&&byId[h])setTimeout(()=>focusOn(h,700),250);else if(!wide())say('Tap a topic to open it · pinch to zoom')});
addEventListener('hashchange',()=>{const h=decodeURIComponent((location.hash||'').slice(1));if(byId[h])focusOn(h)});
window.MAPENGINE={layout,focusOn,overview,get open(){return open},set open(v){open=v},get state(){return{focus,recall}}};
}
