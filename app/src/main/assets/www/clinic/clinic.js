/* Clinical library: loaded when first opened */
(function(){
const D=window.CLINIC_DATA,BY={};D.t.forEach(t=>BY[t.id]=t);
const GN=D.g,e=s=>esc(String(s)),md=s=>e(s).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>");
const OPEN={};let QQ="";
const row=(a,t,s,cls)=>`<button class="clrow ${cls||""}" ${a}><span class="m"><b>${e(t)}</b>${s?`<small>${e(s)}</small>`:""}</span>${ic("chev",16)}</button>`;
const SECS=[["cls","Classification"],["why","Causes and risks"],["feat","Clinical features"],["dx","Diagnosis"],["ddx","Differential diagnosis"],["tx","Treatment"],["cx","Complications"],["pearl","Resident pearls"],["fu","Follow-up and counselling"],["diff","Where the books differ"]];
const ul=a=>`<ul>${a.map(x=>`<li>${md(x)}</li>`).join("")}</ul>`;
/* Diagnosis: matching imaging cases and notes sections from the rest of the app */
const LK=id=>(window.CLINIC_LINKS||{})[id]||{im:[],rd:[]};
const imgOf=k=>typeof imSrc==="function"?imSrc(k):"im/"+k+".jpg";
function dxExtra(id){const L=LK(id),C=typeof CONDS!=="undefined"?CONDS:[],S=typeof SECTIONS!=="undefined"?SECTIONS:[];
 const cs=L.im.map(i=>C.find(c=>c.id===i)).filter(Boolean),rs=L.rd.map(i=>S.find(s=>s.id===i)).filter(Boolean);if(!cs.length&&!rs.length)return "";
 return (cs.length?`<div class="clh3 clim">Imaging in the app<small>${cs.length} case${cs.length>1?"s":""}</small></div><div class="climgs">${cs.map(c=>`<button class="climc" data-go="cond:${c.id}">${c.imgs&&c.imgs[0]?`<img src="${imgOf(c.imgs[0])}" alt="" loading="lazy" decoding="async">`:`<i></i>`}<span><b>${e(c.t)}</b><small>${e(c.cat||"")}${c.imgs&&c.imgs.length?` · ${c.imgs.length} image${c.imgs.length>1?"s":""}`:""}</small></span></button>`).join("")}</div>`:"")
 +(rs.length?`<div class="clh3 clim">Read in the notes</div><div class="cllist">${rs.map(x=>row(`data-go="region:${x.r}" data-sec="${x.id}"`,x.t,(RMAP[x.r]||{}).name||"","an")).join("")}</div>`:"")}

/* ---------------- long-form articles ---------------- */
const AIDX=()=>window.CLART_IDX||{};
const MODE="art";
const hasArt=(id,any)=>!!AIDX()[id]&&(any||MODE==="art");
const modeBar=()=>`<div class="armode" role="group" aria-label="Reading mode"><button type="button" data-armode="art" aria-pressed="${MODE==="art"}">Article</button><button type="button" data-armode="quick" aria-pressed="${MODE!=="art"}">Quick notes</button></div>`;
const ALOAD={};
function loadArt(id){return ALOAD[id]=ALOAD[id]||new Promise((ok,no)=>{if(window.CLART&&window.CLART[id])return ok();const sc=document.createElement("script");sc.src="clinic/art/"+id+".js";sc.onload=ok;sc.onerror=()=>{delete ALOAD[id];no()};document.head.appendChild(sc)})}
function vArticle(id){const t=BY[id],A=(window.CLART||{})[id];
 if(!A)return `<div class="clw arw"><span class="cle">${e(kick(t))}</span><h1>${e(t.t)}</h1><p class="armeta">Opening the article…</p></div>`;
 const mins=Math.max(3,Math.round(A.w/220));const nq=QUIZ.filter(q=>q.tp===id).length,nc=CARDS.filter(c=>c.tp===id).length,L=LK(id);
 const subs=c=>{const m=[...A.h.matchAll(new RegExp('<details class="arsub" id="a-s'+c+'-(\\d+)"[^>]*><summary><span class="arsn">([\\d.]+)</span><h3>(.*?)</h3>','g'))];return m.map(x=>({id:"a-s"+c+"-"+x[1],n:x[2],t:x[3]}))};
 const ch=A.ch.map((x,i)=>({id:"a-c"+(i+1),n:i+1,t:x,s:subs(i+1)}));
 const endBody=`<div class="clprac" data-clend="${id}">${window.hubPrac?hubPrac(id):`${nq?`<button class="btn primary wide" data-cltq="${id}">Quiz this topic (${nq})</button>`:""}${nc?`<button class="btn wide" data-deck="cl-${t.g}" data-mode="smart">${e(GN[t.g])} flashcards</button>`:""}`}</div>
  ${t.ops.length&&!A.h.includes("data-arops")?`<div class="clh3" style="color:#1F5B4A">Operations in Theatre</div><div class="cllist">${t.ops.map(([n,w])=>row(`data-clop="${n}"`,D.ops[n]||("Myers ch. "+n),w,"op")).join("")}</div>`:""}
  ${A.h.includes("data-arcases")?notesOnly(id):dxExtra(id)}
  ${t.an.length?`<div class="clh3" style="color:var(--accent)">Related anatomy</div><div class="cllist">${t.an.map(r=>RMAP[r]?row(`data-go="region:${r}"`,RMAP[r].name,"","an"):"").join("")}</div>`:""}
  ${t.rel.length?`<div class="clgh">Related diseases</div><div class="cllist">${t.rel.map(r=>BY[r]?row(`data-go="cl:t-${r}"`,BY[r].t):"").join("")}</div>`:""}
  <p class="clsrc">Written for this app from ${e(t.srcs)}. Figures reproduced from the books for private study. Study reference only: follow local protocols and senior advice for patients.</p>`;
 const more=`<section class="arend arch-c" id="a-end" data-t="Continue"><div class="archd"><span class="arnum">${ch.length+1}</span><div class="arkick">In the atlas</div><h2>Continue from here</h2></div>
  ${endBody}</section>`;
 if(A.lay==="amboss")return vAmb(id,t,A,ch,mins,endBody);
 return `<div class="clw arw"><span class="cle">${e(kick(t))}</span><h1>${e(t.t)}</h1>
 ${A.stand?`<p class="arstand">${md(A.stand)}</p>`:`<p class="arstand">${md(t.one)}</p>`}
 <div class="armeta"><span><b>Reading</b> about ${mins} min</span><span><b>Outline</b> ${ch.length} chapters · ${A.n} sections</span><span><b>Sources</b> ${e(t.srcs)}</span></div>  ${(window.BOARDS||{})[id]?`<button type="button" class="arboardbtn" data-arboard="${id}" data-title="${e(t.t)}"><span class="bdi" aria-hidden="true"></span><span><b>Summary board</b><small>The whole topic on one whiteboard</small></span></button>`:""}${(window.MAPS||{})[id]?`<button type="button" class="armapbtn" data-armap="${id}"><span class="mmi" aria-hidden="true"></span><span><b>Mind map</b><small>This topic on its route map</small></span></button>`:""}
 <nav class="artoc" aria-label="Chapters"><ol>${ch.map(c=>`<li data-c="${c.id}"><button type="button" data-artgo="${c.id}"><i>${c.n}</i>${e(c.t)}</button></li>`).join("")}<li data-c="a-end"><button type="button" data-artgo="a-end"><i>${ch.length+1}</i>Continue</button></li></ol></nav>
 ${t.sum&&t.sum.length?`<div class="arglance"><h4>At a glance</h4><ul>${t.sum.map(x=>`<li>${md(x)}</li>`).join("")}</ul></div>`:""}
 <div class="arcont"><div class="arconth"><h4>Contents</h4><div><button type="button" data-arall="1">Expand all</button><button type="button" data-arall="0">Collapse all</button></div></div>
 <ol class="artree0">${ch.map(c=>`<li><button type="button" data-artgo="${c.id}"><i>${c.n}</i>${e(c.t)}</button><ul>${c.s.map(x=>`<li><button type="button" data-artgo="${x.id}">${x.n}&ensp;${x.t}</button></li>`).join("")}</ul></li>`).join("")}</ol></div>
 <div class="arart">${A.h}</div>${more}</div>`}
/* AMBOSS-style layout ("@layout amboss" articles): a list of chapter titles that open in place,
   a circular reading menu and an outline sheet */
const AMI=d=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const AMCH='<svg class="arch" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
const AMIC={tools:'<path d="M4 6h7m4 0h5m-9-2v4M4 12h3m4 0h9M7 10v4m-3 4h10m4 0h2m-6-2v4"/>',
 back:'<path d="M15 18l-6-6 6-6"/>',fwd:'<path d="M9 6l6 6-6 6"/>',all:'<path d="M12 3v6M9 6l3 3 3-3M12 21v-6M9 18l3-3 3 3M5 12h14"/>',
 find:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><circle cx="11.5" cy="13.5" r="3"/><path d="M13.7 15.7L16.5 18.5"/>',outline:'<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M14.5 4v16"/>',
 up:'<path d="M6 15l6-6 6 6"/>',down:'<path d="M6 9l6 6 6-6"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>'};
function vAmb(id,t,A,ch,mins,endBody){
 const strip=x=>x.replace(/<[^>]+>/g,"");
 return `<div class="clw arw amb"><span class="cle">${e(kick(t))}</span><h1>${e(t.t)}</h1>
 ${A.stand?`<p class="arstand">${md(A.stand)}</p>`:`<p class="arstand">${md(t.one)}</p>`}
 <div class="armeta"><span><b>Reading</b> about ${mins} min</span><span><b>Outline</b> ${ch.length} chapters · ${A.n} sections</span><span><b>Sources</b> ${e(t.srcs)}</span></div>  ${(window.BOARDS||{})[id]?`<button type="button" class="arboardbtn" data-arboard="${id}" data-title="${e(t.t)}"><span class="bdi" aria-hidden="true"></span><span><b>Summary board</b><small>The whole topic on one whiteboard</small></span></button>`:""}${(window.MAPS||{})[id]?`<button type="button" class="armapbtn" data-armap="${id}"><span class="mmi" aria-hidden="true"></span><span><b>Mind map</b><small>This topic on its route map</small></span></button>`:""}
 <div class="amlist"><div class="arart">${A.h}</div>
 <section class="arend arch-c amc" id="a-end" data-t="Practice and related"><details class="amch"><summary><h2>Practice and related</h2>${AMCH}</summary><div class="amchb">${endBody}</div></details></section></div>
 <div class="amtool">
  <button type="button" class="amtool-toggle" data-amt="menu" aria-expanded="false" aria-controls="amtool-actions">${AMI(AMIC.tools)}<span>Tools</span></button>
  <div class="amtool-actions" id="amtool-actions" role="group" aria-label="Article tools" inert aria-hidden="true">
   <button type="button" data-amt="back">${AMI(AMIC.back)}<span>Back</span></button>
   <button type="button" data-amt="fwd" disabled>${AMI(AMIC.fwd)}<span>Forward</span></button>
   <button type="button" data-amt="all">${AMI(AMIC.all)}<span>Expand</span></button>
   <button type="button" data-amt="find" aria-label="Find text">${AMI(AMIC.find)}<span>Find</span></button>
   <button type="button" data-amt="outline">${AMI(AMIC.outline)}<span>Outline</span></button>
  </div>
 </div>
 <div class="amfind" hidden><input type="search" id="amfq" placeholder="Find in this article" autocomplete="off" enterkeyhint="search" aria-label="Find in this article"><output aria-live="polite"></output><button type="button" data-amt="fprev" aria-label="Previous match">${AMI(AMIC.up)}</button><button type="button" data-amt="fnext" aria-label="Next match">${AMI(AMIC.down)}</button><button type="button" data-amt="fx" aria-label="Close search">${AMI(AMIC.x)}</button></div>
 <div class="amout" hidden><div class="amsheet" role="dialog" aria-label="Outline"><h4>Outline<button type="button" data-amt="outx" aria-label="Close outline">${AMI(AMIC.x)}</button></h4>
 <ol>${ch.map(c=>`<li><button type="button" data-artgo="${c.id}">${e(c.t)}</button>${c.s.length?`<ul>${c.s.map(x=>`<li><button type="button" data-artgo="${x.id}">${strip(x.t)}</button></li>`).join("")}</ul>`:""}</li>`).join("")}<li><button type="button" data-artgo="a-end">Practice and related</button></li></ol></div></div></div>`}
function amPlace(){
 const article=document.querySelector("#view .amb");
 const tabs=document.getElementById("tabs");
 if(!article||!tabs)return;
 if(!tabs.offsetHeight){article.style.removeProperty("--amtb");return}
 const gap=document.documentElement.clientHeight-tabs.getBoundingClientRect().top+10;
 article.style.setProperty("--amtb",Math.max(10,Math.ceil(gap))+"px");
}
window.addEventListener("resize",amPlace);
const amTabs=document.getElementById("tabs");
if(amTabs&&window.ResizeObserver)new ResizeObserver(amPlace).observe(amTabs);
function amArm(v){if(!v.querySelector(".amb"))return;amPlace();amSync()}
function amSetMenu(article,open){
 article.classList.toggle("am-tools-open",open);
 article.querySelector(".amtool-toggle").setAttribute("aria-expanded",String(open));
 const actions=article.querySelector(".amtool-actions");
 actions.toggleAttribute("inert",!open);
 actions.setAttribute("aria-hidden",String(!open));
}
function amSync(){
 const w=document.querySelector("#view .amb");if(!w)return;
 const any=[...w.querySelectorAll(".amch")].some(d=>d.open),b=w.querySelector('[data-amt="all"]');
 b.querySelector("span").textContent=any?"Collapse":"Expand";
 b.classList.toggle("on",any);
 const history=window.articleHistory;
 w.querySelector('[data-amt="fwd"]').disabled=Boolean(history&&!history.canForward());
}
let AMF={h:[],i:-1};
function openUp(el){for(let x=el;x;x=x.parentElement)if(x.tagName==="DETAILS")x.open=true;const c=el.matches&&el.matches(".amc")?el.querySelector(".amch"):null;if(c)c.open=true;amSync()}
function amClear(){AMF.h.forEach(m=>{if(m.isConnected){const p=m.parentNode;m.replaceWith(document.createTextNode(m.textContent));p.normalize()}});AMF={h:[],i:-1};amCount()}
function amCount(){const o=document.querySelector(".amfind output");if(o)o.textContent=AMF.h.length?(AMF.i+1)+" of "+AMF.h.length:(document.getElementById("amfq")||{}).value?"0":""}
function amFind(q){amClear();q=(q||"").trim().toLowerCase();const root=document.querySelector(".amb .amlist");if(!root||q.length<2)return;
 const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement.closest("svg,script,style,.amtool")?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});const ns=[];while(tw.nextNode())ns.push(tw.currentNode);
 ns.forEach(n=>{const t=n.nodeValue,l=t.toLowerCase();let i=l.indexOf(q);if(i<0)return;const f=document.createDocumentFragment();let p=0;
  while(i>=0){f.append(t.slice(p,i));const m=document.createElement("mark");m.className="amhit";m.textContent=t.slice(i,i+q.length);f.append(m);AMF.h.push(m);p=i+q.length;i=l.indexOf(q,p)}f.append(t.slice(p));n.replaceWith(f)});
 if(AMF.h.length)amStep(1);else amCount()}
function amStep(d){if(!AMF.h.length)return;if(AMF.h[AMF.i])AMF.h[AMF.i].classList.remove("on");AMF.i=(AMF.i+d+AMF.h.length)%AMF.h.length;const m=AMF.h[AMF.i];m.classList.add("on");openUp(m);m.scrollIntoView({block:"center",behavior:"smooth"});amCount()}
function amTool(k){
 const w=document.querySelector("#view .amb");
 if(!w)return;
 const launcher=w.querySelector(".amtool-toggle");
 if(k==="menu")amSetMenu(w,!w.classList.contains("am-tools-open"));
 else if(k==="back"||k==="fwd"){
  amSetMenu(w,false);
  launcher.focus({preventScroll:true});
  const history=window.articleHistory||window.history;
  if(k==="back")history.back();else history.forward();
 }else if(k==="all"){
  const ds=[...w.querySelectorAll(".amch")],any=ds.some(d=>d.open);
  ds.forEach(d=>d.open=!any);
  if(any)w.querySelector(".amlist").scrollIntoView({block:"start"});
  amSync();
 }else if(k==="find"){
  amSetMenu(w,false);
  const find=w.querySelector(".amfind");
  if(find.hidden){find.hidden=false;find.querySelector("input").focus()}
  else amTool("fx");
 }else if(k==="outline"){
  amSetMenu(w,false);
  w.querySelector(".amout").hidden=false;
  w.querySelector('[data-amt="outx"]').focus({preventScroll:true});
 }else if(k==="outx"){
  w.querySelector(".amout").hidden=true;
  launcher.focus({preventScroll:true});
 }else if(k==="fnext")amStep(1);else if(k==="fprev")amStep(-1);
 else if(k==="fx"){
  clearTimeout(window._amt);
  w.querySelector(".amfind").hidden=true;
  w.querySelector("#amfq").value="";
  amClear();
  launcher.focus({preventScroll:true});
 }
}
document.addEventListener("toggle",ev=>{if(ev.target.classList&&ev.target.classList.contains("amch"))amSync()},true);
document.addEventListener("input",ev=>{if(ev.target.id==="amfq"){clearTimeout(window._amt);window._amt=setTimeout(()=>amFind(ev.target.value),180)}});
document.addEventListener("keydown",ev=>{
 if(ev.target.id==="amfq"&&ev.key==="Enter"){ev.preventDefault();amStep(ev.shiftKey?-1:1);return}
 if(ev.key!=="Escape"||ev.defaultPrevented)return;
 if(document.querySelector("#view .amout:not([hidden])"))amTool("outx");
 else if(document.querySelector("#view .am-tools-open")){
  amTool("menu");
  document.querySelector("#view .amtool-toggle").focus({preventScroll:true});
 }else if(ev.target.closest?.(".amfind"))amTool("fx");
});
function caseCards(list){const C=typeof CONDS!=="undefined"?CONDS:[];const cs=list.map(i=>C.find(c=>c.id===i||c.id.replace(/\s+/g,"-")===i)).filter(Boolean);if(!cs.length)return "";
 return `<div class="climgs">${cs.map(c=>`<button class="climc" data-go="cond:${c.id}">${c.imgs&&c.imgs[0]?`<img src="${imgOf(c.imgs[0])}" alt="" loading="lazy" decoding="async">`:`<i></i>`}<span><b>${e(c.t)}</b><small>${e(c.cat||"")}${c.imgs&&c.imgs.length?` · ${c.imgs.length} image${c.imgs.length>1?"s":""}`:""}</small></span></button>`).join("")}</div>`}
function notesOnly(id){const S=typeof SECTIONS!=="undefined"?SECTIONS:[],rs=LK(id).rd.map(i=>S.find(s=>s.id===i)).filter(Boolean);
 return rs.length?`<div class="clh3 clim">Read in the anatomy notes</div><div class="cllist">${rs.map(x=>row(`data-go="region:${x.r}" data-sec="${x.id}"`,x.t,(RMAP[x.r]||{}).name||"","an")).join("")}</div>`:""}
function fillArticle(v,id){
 const t=BY[id];v.querySelectorAll("[data-arops]").forEach(sl=>{const want=sl.dataset.arops.trim();const ns=want?want.split(/\s+/).map(Number):t.ops.map(o=>o[0]);
  const rows=ns.filter(n=>D.ops[n]).map(n=>{const o=t.ops.find(x=>x[0]===n);return row(`data-clop="${n}"`,D.ops[n],o?o[1]:"","op")});
  if(!rows.length){sl.remove();return}
  sl.innerHTML=`<div class="aropsh"><span>Operative guides in Theatre</span><small>${rows.length} operation${rows.length>1?"s":""}</small></div>${sl.dataset.lead?`<p class="arcasel">${e(sl.dataset.lead)}</p>`:""}<div class="cllist">${rows.join("")}</div>`});
 v.querySelectorAll("[data-arcases]").forEach(sl=>{const want=sl.dataset.arcases.trim();const list=want?want.split(/\s+/):LK(id).im;const h=caseCards(list);
  if(!h){sl.remove();return}const n=(h.match(/class="climc"/g)||[]).length;
  sl.innerHTML=`<div class="arcaseh"><span>Imaging in the app</span><small>${n} case${n>1?"s":""}</small></div>${sl.dataset.lead?`<p class="arcasel">${e(sl.dataset.lead)}</p>`:""}${h}`});
 v.querySelectorAll("[data-figcite]").forEach(c=>{const ks=c.dataset.figcite.split(",");try{if(typeof figShort==="function"&&typeof FIG!=="undefined")c.textContent="Anatomy atlas · "+[...new Set(ks.filter(k=>FIG[k]).map(k=>figShort(k)))].join(", ")}catch(x){}})}
let AOBS=null,ROBS=null;
function armRead(v){if(ROBS){ROBS.disconnect();ROBS=null}const end=v.querySelector("[data-clend]");if(!end)return;const id=end.dataset.clend;if(RD()[id])return;
 ROBS=new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)&&scrollY>300){RD()[id]=Date.now();save();ROBS.disconnect();ROBS=null;if(typeof studied==="function")studied()}});ROBS.observe(end)}
function armArticle(v){if(AOBS){AOBS.disconnect();AOBS=null}const toc=v.querySelector(".artoc");if(!toc)return;const lis=[...toc.querySelectorAll("li")];let cur="";
 AOBS=new IntersectionObserver(es=>es.forEach(en=>{if(!en.isIntersecting||cur===en.target.id)return;cur=en.target.id;lis.forEach(l=>l.classList.toggle("on",l.dataset.c===cur));const on=lis.find(l=>l.dataset.c===cur);if(on){const ol=toc.querySelector("ol");ol.scrollTo({left:on.offsetLeft-ol.clientWidth/2+on.offsetWidth/2,behavior:"smooth"})}}),{rootMargin:"-35% 0px -60% 0px"});
 v.querySelectorAll(".arch-c").forEach(s=>AOBS.observe(s));if(lis[0])lis[0].classList.add("on")}
function artGo(id){const el=document.getElementById(id);if(!el)return;openUp(el);el.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"})}
let ALB=null;
function arLB(img,cap){if(ALB)ALB.remove();ALB=document.createElement("div");ALB.className="arlb";ALB.setAttribute("role","dialog");ALB.setAttribute("aria-modal","true");
 ALB.innerHTML=`<div class="arlbbar"><button type="button" data-arlb="zoom">Zoom</button><button type="button" data-arlb="close">Close</button></div><div class="stage"><img alt="" data-arlb="zoom"></div><p></p>`;
 ALB.querySelector("img").src=img;ALB.querySelector("p").textContent=cap;document.body.appendChild(ALB);document.body.style.overflow="hidden";ALB.querySelector('[data-arlb="close"]').focus({preventScroll:true})}
function arLBclose(){if(!ALB)return;ALB.remove();ALB=null;document.body.style.overflow=""}
/* reading progress: ST.clo = opened, ST.clr = read to the end, ST.cll = last article opened */
const RD=()=>ST.clr=ST.clr||{},OP=()=>ST.clo=ST.clo||{};
const NEWIN=["oesoph","fbfood","laser","skullbase","cleft","facplast","hnrecon","hncprinc","saltum","vascneck","hnrt","hivent","skinca","jaw"];
const amin=id=>{const i=AIDX()[id];return i?Math.max(3,Math.round(i.w/220)):0};
function trow(t,sub){const r=RD()[t.id],o=OP()[t.id],nw=!o&&NEWIN.includes(t.id);
 return `<button class="clrow clt ${r?"rd":o?"op":""}" data-go="cl:t-${t.id}"><i class="clst" aria-hidden="true"></i><span class="m"><b>${e(t.t)}</b><small>${e(sub!=null?sub:(amin(t.id)?amin(t.id)+" min read":"Quick notes"))}${r?" · Read":o?" · Started":""}</small></span>${nw?`<em class="clnew">New</em>`:""}${ic("chev",16)}</button>`}
function nextUp(){const r=RD(),o=OP(),l=ST.cll;if(l&&BY[l]&&!r[l])return [BY[l],"Continue reading"];const nw=NEWIN.find(id=>BY[id]&&!o[id]&&BY[id].g!==IMGL);if(nw)return [BY[nw],"New in the library"];const u=D.t.find(t=>!r[t.id]&&t.g!==IMGL);return u?[u,"Up next"]:null}
/* two branches: diseases (by region) and "Approach to" (by presenting symptom, sub-grouped by system) */
const APL="hl ap_otorr otalgia ap_full tinnitus ap_dizzy ap_face ap_block ap_rhin epistaxis ap_pnd ap_pain ap_smell ap_crust ap_epiph ap_sore ap_ulcer osa ap_hoarse ap_dysph ap_globus stridor neckmass ap_saliv".split(" "),APO=id=>{const i=APL.indexOf(id);return i<0?99:i};
const LMODE=()=>ST.clmode==="ap"?"ap":ST.clmode==="dr"?"dr":"dz",AP="appr",DRG="drug",SYS={ear:"Ear",nose:"Nose & sinuses",mouth:"Mouth & throat",larynx:"Larynx & airway",neck:"Neck"};
const IMGL="imgl",inMode=t=>t.g!==IMGL&&(LMODE()==="dr"?t.g===DRG:t.g!==DRG&&(LMODE()==="ap"?(t.g===AP||!!t.xap):t.g!==AP));
const DCL=()=>(D.dc||{}),kick=t=>t.g===IMGL?"Imaging course"+(t.les?" · Lesson "+t.les:""):t.g===DRG?"Drugs · "+(DCL()[t.dc]||""):"Clinical · "+GN[t.g];
function vHome(){const r=RD(),M=LMODE(),T=D.t.filter(inMode),n=T.filter(t=>r[t.id]).length,N=T.length,nx=nextUp(),ap=M==="ap",dr=M==="dr";
 return `<div class="clw"><span class="cle">${ap?"By presenting symptom":dr?"Pharmacology for ENT":"Diseases"}</span><h1>Clinical</h1>
 <div class="clseg" role="group" aria-label="Library"><button data-clmode="dz" aria-pressed="${M==="dz"}">Diseases</button><button data-clmode="ap" aria-pressed="${ap}">Approach to…</button><button data-clmode="dr" aria-pressed="${dr}">Drugs</button></div>
 ${M!=="dr"&&(window.MAPLIST||[]).length?`<button type="button" class="clmapbtn" data-mapidx><span class="mmi" aria-hidden="true"></span><span><b>Mind maps</b><small>${window.MAPLIST.length} route maps that follow a disease from stop to stop</small></span></button>`:""}
 ${ap?`<p class="clapl">Start from what the patient tells you: the questions to ask, the signs to look for, the tests in order, and when to act today.</p>`:""}
 ${dr?`<p class="clapl">Every drug an ENT surgeon prescribes, injects or must recognise: how it works, when to use it, the dose, what goes wrong, and what the examiner asks. Doses follow UK adult and paediatric practice; check your local formulary before prescribing.</p>`:""}
 ${dr?`<button class="mhero dchero" data-go="cl:calc"><span class="eyebrow">Tool</span><strong>Dose calculator</strong><span class="mhs">Weight-based doses, local anaesthetic maximums, emergency drugs and reversal</span></button>`:""}
 ${nx&&M==="dz"?`<button class="mhero" data-go="cl:t-${nx[0].id}"><span class="eyebrow">${nx[1]} · ${e(GN[nx[0].g])}</span><strong>${e(nx[0].t)}</strong><span class="mhs">${amin(nx[0].id)?amin(nx[0].id)+" min read":"Open"} · ${n} of ${N} read</span><span class="mhbar"><i style="width:${N?100*n/N:0}%"></i></span></button>`:`<p class="clprog"><span><i style="width:${N?100*n/N:0}%"></i></span><small>${n} of ${N} ${ap?"approaches":dr?"drugs":"articles"} read</small></p>`}
 <input class="clsearch" id="clq" type="search" aria-label="Search" placeholder="${ap?"Search a symptom: hoarseness, dizziness…":dr?"Search a drug or class: ciprofloxacin, steroid…":"Search a disease or symptom"}" value="${e(QQ)}"><div id="cllist">${list()}</div></div>`}
/* topic search: every meaningful word of the query in the topic (so "hashimoto treatment" still finds the thyroid topic),
   and for a question, the smart search's quoted answer underneath */
const QSTOP=new Set("a an the of and or in on at to for with by from what is are how why when which who do does should i you we treatment treat management manage managing causes cause signs symptoms features clinical picture diagnosis investigation investigations complications prognosis types classification indications contraindications differential vs versus difference between child children childhood infant infants adult adults elderly patient patients baby old year years in".split(" "));
function topicHits(q){const w=q.split(/\s+/).filter(x=>x&&!QSTOP.has(x));const hay=t=>(t.t+" "+t.one+" "+t.ddx.join(" ")+" "+(t.alias||"")).toLowerCase();
 const has=(h,x)=>h.includes(x.length>5?x.slice(0,x.length-1):x);
 let L=D.t.filter(t=>hay(t).includes(q));if(!L.length&&w.length)L=D.t.filter(t=>{const h=hay(t);return w.every(x=>has(h,x))});
 /* no topic has every word: the topics that have most of them, title first */
 if(!L.length&&w.length>1){const sc=t=>w.filter(x=>has(t.t.toLowerCase(),x)).length*2+w.filter(x=>has(hay(t),x)).length;L=D.t.map(t=>[t,sc(t)]).filter(x=>x[1]>=2).sort((a,b)=>b[1]-a[1]).slice(0,4).map(x=>x[0]);return L}
 return L.sort((a,b)=>inMode(b)-inMode(a))}
function clSmart(q){const X=window.XSEARCH;if(!X||!X.ask||q.split(/\s+/).length<2)return "";const h=X.ask(q,4);
 if(h===null){X.ready&&X.ready();return `<div class="clsmart" id="clsmart"><h3>Answers from the articles</h3><p class="clsrc">Reading your question…</p></div>`}
 const rows=h?"":(X.askRows?X.askRows(q,3):"");if(!h&&!rows)return "";
 return `<div class="clsmart" id="clsmart"><h3>Answers from the articles</h3>${h}${rows?`<div class="xl">${rows}</div>`:""}<button type="button" class="clsmore" data-xask="${e(q)}">Search everything for “${e(q)}”</button></div>`}
document.addEventListener("xsmartready",()=>{const l=document.getElementById("cllist");if(l&&QQ.trim())l.innerHTML=list()});
function list(){const q=QQ.trim().toLowerCase();if(q){const L=topicHits(q);return (L.length?`<div class="cllist">${L.map(t=>trow(t,(t.g===AP?"Approach to":t.g===IMGL?"Imaging course":t.g===DRG?"Drugs · "+(DCL()[t.dc]||""):GN[t.g])+(amin(t.id)?" · "+amin(t.id)+" min":""))).join("")}</div>`:`<p class="clsrc">No topic matches yet.</p>`)+clSmart(QQ.trim())}
 const r=RD(),ap=LMODE()==="ap",dr=LMODE()==="dr";
 const grp=dr?Object.keys(DCL()).map(k=>[DCL()[k],D.t.filter(t=>t.g===DRG&&t.dc===k)]):ap?Object.keys(SYS).map(k=>[SYS[k],D.t.filter(t=>(t.g===AP&&t.sys===k)||t.xap===k).sort((a,b)=>APO(a.id)-APO(b.id))]):Object.keys(GN).filter(g=>g!==AP&&g!==IMGL&&g!==DRG).map(g=>[GN[g],D.t.filter(t=>t.g===g)]);
 return grp.filter(x=>x[1].length).map(([name,ts])=>{const n=ts.filter(t=>r[t.id]).length;const body=`<div class="cllist">${ts.map(t=>trow(t)).join("")}</div>`;return window.fold?fold("cg-"+(dr?"r":ap?"a":"d")+"-"+name,e(name),n?n+" of "+ts.length+" read":ts.length+(ap?" approaches":dr?(ts.length>1?" drugs":" drug"):" articles"),body):`<div class="clgh"><span>${e(name)}</span></div>${body}`}).join("")}
function tbs(t){return (t.tb||[]).map(b=>`<div class="clh3">${e(b.t)}</div><div class="cltw"><table class="cltb"><thead><tr>${b.h.map(x=>`<th>${e(x)}</th>`).join("")}</tr></thead><tbody>${b.r.map(r=>`<tr>${r.map(x=>`<td>${e(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`).join("")}
function vTopic(id){const t=BY[id];if(!t)return vHome();window.CL_LAST=t;if(hasArt(id))return vArticle(id);return vQuick(id)}
function vQuick(id){const t=BY[id],o=OPEN[id]=OPEN[id]||{};
 const nq=QUIZ.filter(q=>q.tp===id).length,nc=CARDS.filter(c=>c.tp===id).length;
 const nim=LK(id).im.length;const sec=(k,n)=>{const has=t[k]&&t[k].length||(k==="cls"&&t.tb&&t.tb.length)||(k==="tx"&&t.ops.length)||(k==="dx"&&(nim||LK(id).rd.length));if(!has)return "";const on=o[k]!==undefined?o[k]:(k==="tx"||(k==="cls"&&!(t.tx||[]).length));
  return `<section class="clsec"><button data-cls="${id}:${k}" aria-expanded="${on}"><span>${n}${k==="dx"&&nim?`<small class="clbadge">${nim} imaging</small>`:""}</span><i aria-hidden="true">${on?"−":"+"}</i></button>${on?`<div class="sec">${ul(t[k]||[])}${k==="cls"?tbs(t):""}${k==="dx"?dxExtra(id):""}${k==="tx"&&t.ops.length?`<div class="clh3" style="color:#1F5B4A">Surgical treatment</div><div class="cllist">${t.ops.map(([n,w])=>row(`data-clop="${n}"`,D.ops[n]||("Myers ch. "+n),w,"op")).join("")}</div>`:""}</div>`:""}</section>`};
 return `<div class="clw"><span class="cle">${e(kick(t))}</span><h1>${e(t.t)}</h1><p class="cllede">${md(t.one)}</p>
 ${t.sum&&t.sum.length?`<section class="clsum"><h2>Summary</h2><ul>${t.sum.map(x=>`<li>${md(x)}</li>`).join("")}</ul></section>`:""}
 ${t.call.length?`<div class="clcall"><h2>On call: what you do first</h2><ol>${t.call.map(x=>`<li>${md(x)}</li>`).join("")}</ol></div>`:""}
 ${SECS.map(([k,n])=>sec(k,n)).join("")}
 <div class="clprac" data-clend="${id}">${window.hubPrac?hubPrac(id):`${nq?`<button class="btn primary wide" data-cltq="${id}">Quiz this topic (${nq})</button>`:""}${nc?`<button class="btn wide" data-deck="cl-${t.g}" data-mode="smart">${e(GN[t.g])} flashcards</button>`:""}`}</div>
 ${t.an.length?`<div class="clh3" style="color:var(--accent)">Related anatomy</div><div class="cllist">${t.an.map(r=>RMAP[r]?row(`data-go="region:${r}"`,RMAP[r].name,"","an"):"").join("")}</div>`:""}
 ${t.rel.length?`<div class="clgh">Related diseases</div><div class="cllist">${t.rel.map(r=>BY[r]?row(`data-go="cl:t-${r}"`,BY[r].t):"").join("")}</div>`:""}
 <p class="clsrc">Written for this app from ${e(t.srcs)}. Study summary only: follow local protocols and senior advice for patients.</p></div>`}
function render(arg){arg=arg||"home";const v=document.getElementById("view");if(arg==="home"){v.innerHTML=vHome();return}
 if(arg==="calc"||arg==="calc-rules"){const go2=()=>window.DOSECALC.render(arg==="calc"?"":"rules");if(window.DOSECALC)go2();else{v.innerHTML='<div style="padding:60px 0;color:var(--muted)">Opening…</div>';const sc=document.createElement("script");sc.src="clinic/calc.js";sc.onload=go2;document.head.appendChild(sc)}return}
 if(arg.startsWith("t-")){const [tp,fg]=arg.split("~"),id=tp.slice(2);if(BY[id]){ST.cll=id;OP()[id]=OP()[id]||Date.now();save()}v.innerHTML=vTopic(id);if(typeof linkTerms==="function")linkTerms(v.querySelector(".arart")?v.querySelector(".arend")||v:v,(BY[id]&&BY[id].an[0])||"");if(v.querySelector(".arart"))fillArticle(v,id);amArm(v);{const m=v.querySelector(".armeta");if(m&&BY[id]&&!m.querySelector("[data-pdf]"))m.insertAdjacentHTML("beforeend",`<button class="arpdf" data-pdf="cl_${id}" data-pdfname="The ENT Companion - ${e(BY[id].t)}">${ic("pdf",14)}PDF</button>`)}armArticle(v);armRead(v);if(fg)toFig(v,fg);
  if(hasArt(id)&&!(window.CLART||{})[id])loadArt(id).then(()=>{const w=v.querySelector(".arw");if(w&&!w.querySelector(".arart")&&(window.CL_LAST||{}).id===id)render(arg)}).catch(()=>{const w=v.querySelector(".arw .armeta");if(w)w.textContent="The article could not load. Check your connection and try again."});return}
 v.innerHTML=vHome()}
/* open an article at one of its figures (from the app-wide search): t-<id>~f<n> */
function toFig(v,fg){const f=v.querySelector("#a-"+fg);if(!f)return;openUp(f);
 let moved=false;const stop=()=>moved=true;addEventListener("touchstart",stop,{once:true,passive:true});addEventListener("wheel",stop,{once:true,passive:true});
 const to=()=>{if(!moved&&f.isConnected)f.scrollIntoView({block:"start"})};
 /* images above load lazily and push the figure down, so settle the position a few times */
 requestAnimationFrame(()=>{to();f.classList.add("arflash");setTimeout(()=>f.classList.remove("arflash"),2400)});[250,700,1400].forEach(t=>setTimeout(to,t))}
window.CLINIC={render};
document.addEventListener("keydown",ev=>{if(ALB&&ev.key==="Escape"){ev.stopPropagation();arLBclose()}},true);
document.addEventListener("click",ev=>{const b=ev.target.closest("[data-clmode]");if(b){ST.clmode=b.dataset.clmode;save();const v=document.getElementById("view");if(v){v.innerHTML=vHome()}}});
document.addEventListener("input",ev=>{if(ev.target.id==="clq"){QQ=ev.target.value;clearTimeout(window._clt);window._clt=setTimeout(()=>{const l=document.getElementById("cllist");if(l)l.innerHTML=list()},120)}});
document.addEventListener("click",ev=>{const T=x=>ev.target.closest(x);let b;
 const openMenu=document.querySelector("#view .am-tools-open");
 if(openMenu&&!T(".amtool"))amSetMenu(openMenu,false);
 if(b=T("[data-cls]")){const [id,k]=b.dataset.cls.split(":"),o=OPEN[id];const t=BY[id],cur=o[k]!==undefined?o[k]:(k==="tx"||(k==="cls"&&!(t.tx||[]).length));o[k]=!cur;const y=scrollY;render("t-"+id);scrollTo(0,y);return}
 if(b=T("[data-amt]")){amTool(b.dataset.amt);return}
 if(ev.target.classList&&ev.target.classList.contains("amout")){amTool("outx");return}
 if(b=T("[data-artgo]")){ev.preventDefault();if(b.closest(".amout"))amTool("outx");artGo(b.dataset.artgo);return}
 if(b=T("[data-arall]")){const o=b.dataset.arall==="1";document.querySelectorAll(".arsub").forEach(d=>d.open=o);return}
 if(b=T("[data-arfig]")){const f=b.closest("figure"),c=f?f.querySelector("figcaption"):null;arLB(b.querySelector("img").src,c?[...c.childNodes].filter(n=>n.nodeName!=="B"&&n.nodeName!=="CITE").map(n=>n.textContent).join("").trim()+(c.querySelector("cite")?" · "+c.querySelector("cite").textContent:""):"");return}
 if(ALB&&(b=T("[data-arlb]"))){if(b.dataset.arlb==="zoom"){ALB.classList.toggle("zoom");ALB.querySelector(".arlbbar [data-arlb=zoom]").textContent=ALB.classList.contains("zoom")?"Fit":"Zoom"}else arLBclose();return}
 if(ALB&&ev.target===ALB){arLBclose();return}
 if(b=T("[data-cltq]")){const id=b.dataset.cltq,pool=QUIZ.filter(q=>q.tp===id);QZ={r:"cl-"+BY[id].g,qs:shuffle(pool).map(q=>({...q,order:shuffle(q.o.map((_,i)=>i))})),i:0,ans:[]};go("quiz");return}
 if(b=T("[data-clop]")){window.CL_FROM=window.CL_LAST?{id:window.CL_LAST.id,t:window.CL_LAST.t}:null;go("th:op-"+b.dataset.clop);return}
});
})();
