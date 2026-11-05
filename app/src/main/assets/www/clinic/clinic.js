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
 if(!A)return `<div class="clw arw"><span class="cle">Clinical · ${e(GN[t.g])}</span><h1>${e(t.t)}</h1><p class="armeta">Opening the article…</p></div>`;
 const mins=Math.max(3,Math.round(A.w/220));const nq=QUIZ.filter(q=>q.tp===id).length,nc=CARDS.filter(c=>c.tp===id).length,L=LK(id);
 const subs=c=>{const m=[...A.h.matchAll(new RegExp('<details class="arsub" id="a-s'+c+'-(\\d+)"[^>]*><summary><span class="arsn">([\\d.]+)</span><h3>(.*?)</h3>','g'))];return m.map(x=>({id:"a-s"+c+"-"+x[1],n:x[2],t:x[3]}))};
 const ch=A.ch.map((x,i)=>({id:"a-c"+(i+1),n:i+1,t:x,s:subs(i+1)}));
 const more=`<section class="arend arch-c" id="a-end" data-t="Continue"><div class="archd"><span class="arnum">${ch.length+1}</span><div class="arkick">In the atlas</div><h2>Continue from here</h2></div>
  <div class="clprac">${nq?`<button class="btn primary wide" data-cltq="${id}">Quiz this topic (${nq})</button>`:""}${nc?`<button class="btn wide" data-deck="cl-${t.g}" data-mode="smart">${e(GN[t.g])} flashcards</button>`:""}</div>
  ${t.ops.length&&!A.h.includes("data-arops")?`<div class="clh3" style="color:#1F5B4A">Operations in Theatre</div><div class="cllist">${t.ops.map(([n,w])=>row(`data-clop="${n}"`,D.ops[n]||("Myers ch. "+n),w,"op")).join("")}</div>`:""}
  ${A.h.includes("data-arcases")?notesOnly(id):dxExtra(id)}
  ${t.an.length?`<div class="clh3" style="color:var(--accent)">Related anatomy</div><div class="cllist">${t.an.map(r=>RMAP[r]?row(`data-go="region:${r}"`,RMAP[r].name,"","an"):"").join("")}</div>`:""}
  ${t.rel.length?`<div class="clgh">Related diseases</div><div class="cllist">${t.rel.map(r=>BY[r]?row(`data-go="cl:t-${r}"`,BY[r].t):"").join("")}</div>`:""}
  <p class="clsrc">Written for this app from ${e(t.srcs)}. Figures reproduced from the books for private study. Study reference only: follow local protocols and senior advice for patients.</p></section>`;
 return `<div class="clw arw"><span class="cle">Clinical · ${e(GN[t.g])}</span><h1>${e(t.t)}</h1>
 ${A.stand?`<p class="arstand">${md(A.stand)}</p>`:`<p class="arstand">${md(t.one)}</p>`}
 <div class="armeta"><span><b>Reading</b> about ${mins} min</span><span><b>Outline</b> ${ch.length} chapters · ${A.n} sections</span><span><b>Sources</b> ${e(t.srcs)}</span></div>
 <nav class="artoc" aria-label="Chapters"><ol>${ch.map(c=>`<li data-c="${c.id}"><button type="button" data-artgo="${c.id}"><i>${c.n}</i>${e(c.t)}</button></li>`).join("")}<li data-c="a-end"><button type="button" data-artgo="a-end"><i>${ch.length+1}</i>Continue</button></li></ol></nav>
 ${t.sum&&t.sum.length?`<div class="arglance"><h4>At a glance</h4><ul>${t.sum.map(x=>`<li>${md(x)}</li>`).join("")}</ul></div>`:""}
 <div class="arcont"><div class="arconth"><h4>Contents</h4><div><button type="button" data-arall="1">Expand all</button><button type="button" data-arall="0">Collapse all</button></div></div>
 <ol class="artree0">${ch.map(c=>`<li><button type="button" data-artgo="${c.id}"><i>${c.n}</i>${e(c.t)}</button><ul>${c.s.map(x=>`<li><button type="button" data-artgo="${x.id}">${x.n}&ensp;${x.t}</button></li>`).join("")}</ul></li>`).join("")}</ol></div>
 <div class="arart">${A.h}</div>${more}</div>`}
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
let AOBS=null;
function armArticle(v){if(AOBS){AOBS.disconnect();AOBS=null}const toc=v.querySelector(".artoc");if(!toc)return;const lis=[...toc.querySelectorAll("li")];let cur="";
 AOBS=new IntersectionObserver(es=>es.forEach(en=>{if(!en.isIntersecting||cur===en.target.id)return;cur=en.target.id;lis.forEach(l=>l.classList.toggle("on",l.dataset.c===cur));const on=lis.find(l=>l.dataset.c===cur);if(on){const ol=toc.querySelector("ol");ol.scrollTo({left:on.offsetLeft-ol.clientWidth/2+on.offsetWidth/2,behavior:"smooth"})}}),{rootMargin:"-35% 0px -60% 0px"});
 v.querySelectorAll(".arch-c").forEach(s=>AOBS.observe(s));if(lis[0])lis[0].classList.add("on")}
function artGo(id){const el=document.getElementById(id);if(!el)return;const d=el.closest("details");if(d)d.open=true;if(el.tagName==="DETAILS")el.open=true;el.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"})}
let ALB=null;
function arLB(img,cap){if(ALB)ALB.remove();ALB=document.createElement("div");ALB.className="arlb";ALB.setAttribute("role","dialog");ALB.setAttribute("aria-modal","true");
 ALB.innerHTML=`<div class="arlbbar"><button type="button" data-arlb="zoom">Zoom</button><button type="button" data-arlb="close">Close</button></div><div class="stage"><img alt="" data-arlb="zoom"></div><p></p>`;
 ALB.querySelector("img").src=img;ALB.querySelector("p").textContent=cap;document.body.appendChild(ALB);document.body.style.overflow="hidden";ALB.querySelector('[data-arlb="close"]').focus({preventScroll:true})}
function arLBclose(){if(!ALB)return;ALB.remove();ALB=null;document.body.style.overflow=""}
function vHome(){return `<div class="clw"><span class="cle">Diseases</span><h1>Clinical</h1><input class="clsearch" id="clq" type="search" aria-label="Search diseases" placeholder="Search a disease or symptom" value="${e(QQ)}"><div id="cllist">${list()}</div></div>`}
function list(){const q=QQ.trim().toLowerCase();if(q){const L=D.t.filter(t=>(t.t+" "+t.one+" "+t.ddx.join(" ")).toLowerCase().includes(q));return L.length?`<div class="cllist">${L.map(t=>row(`data-go="cl:t-${t.id}"`,t.t,GN[t.g])).join("")}</div>`:`<p class="clsrc">No topic matches yet.</p>`}
 return Object.keys(GN).map(g=>`<div class="clgh">${e(GN[g])}</div><div class="cllist">${D.t.filter(t=>t.g===g).map(t=>row(`data-go="cl:t-${t.id}"`,t.t)).join("")}</div>`).join("")}
function tbs(t){return (t.tb||[]).map(b=>`<div class="clh3">${e(b.t)}</div><div class="cltw"><table class="cltb"><thead><tr>${b.h.map(x=>`<th>${e(x)}</th>`).join("")}</tr></thead><tbody>${b.r.map(r=>`<tr>${r.map(x=>`<td>${e(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`).join("")}
function vTopic(id){const t=BY[id];if(!t)return vHome();window.CL_LAST=t;if(hasArt(id))return vArticle(id);return vQuick(id)}
function vQuick(id){const t=BY[id],o=OPEN[id]=OPEN[id]||{};
 const nq=QUIZ.filter(q=>q.tp===id).length,nc=CARDS.filter(c=>c.tp===id).length;
 const nim=LK(id).im.length;const sec=(k,n)=>{const has=t[k]&&t[k].length||(k==="cls"&&t.tb&&t.tb.length)||(k==="tx"&&t.ops.length)||(k==="dx"&&(nim||LK(id).rd.length));if(!has)return "";const on=o[k]!==undefined?o[k]:(k==="tx"||(k==="cls"&&!(t.tx||[]).length));
  return `<section class="clsec"><button data-cls="${id}:${k}" aria-expanded="${on}"><span>${n}${k==="dx"&&nim?`<small class="clbadge">${nim} imaging</small>`:""}</span><i aria-hidden="true">${on?"−":"+"}</i></button>${on?`<div class="sec">${ul(t[k]||[])}${k==="cls"?tbs(t):""}${k==="dx"?dxExtra(id):""}${k==="tx"&&t.ops.length?`<div class="clh3" style="color:#1F5B4A">Surgical treatment</div><div class="cllist">${t.ops.map(([n,w])=>row(`data-clop="${n}"`,D.ops[n]||("Myers ch. "+n),w,"op")).join("")}</div>`:""}</div>`:""}</section>`};
 return `<div class="clw"><span class="cle">Clinical · ${e(GN[t.g])}</span><h1>${e(t.t)}</h1><p class="cllede">${md(t.one)}</p>
 ${t.sum&&t.sum.length?`<section class="clsum"><h2>Summary</h2><ul>${t.sum.map(x=>`<li>${md(x)}</li>`).join("")}</ul></section>`:""}
 ${t.call.length?`<div class="clcall"><h2>On call: what you do first</h2><ol>${t.call.map(x=>`<li>${md(x)}</li>`).join("")}</ol></div>`:""}
 ${SECS.map(([k,n])=>sec(k,n)).join("")}
 <div class="clprac">${nq?`<button class="btn primary wide" data-cltq="${id}">Quiz this topic (${nq})</button>`:""}${nc?`<button class="btn wide" data-deck="cl-${t.g}" data-mode="smart">${e(GN[t.g])} flashcards</button>`:""}</div>
 ${t.an.length?`<div class="clh3" style="color:var(--accent)">Related anatomy</div><div class="cllist">${t.an.map(r=>RMAP[r]?row(`data-go="region:${r}"`,RMAP[r].name,"","an"):"").join("")}</div>`:""}
 ${t.rel.length?`<div class="clgh">Related diseases</div><div class="cllist">${t.rel.map(r=>BY[r]?row(`data-go="cl:t-${r}"`,BY[r].t):"").join("")}</div>`:""}
 <p class="clsrc">Written for this app from ${e(t.srcs)}. Study summary only: follow local protocols and senior advice for patients.</p></div>`}
function render(arg){arg=arg||"home";const v=document.getElementById("view");if(arg==="home"){v.innerHTML=vHome();return}
 if(arg.startsWith("t-")){const [tp,fg]=arg.split("~"),id=tp.slice(2);v.innerHTML=vTopic(id);if(typeof linkTerms==="function")linkTerms(v.querySelector(".arart")?v.querySelector(".arend")||v:v,(BY[id]&&BY[id].an[0])||"");if(v.querySelector(".arart"))fillArticle(v,id);armArticle(v);if(fg)toFig(v,fg);
  if(hasArt(id)&&!(window.CLART||{})[id])loadArt(id).then(()=>{const w=v.querySelector(".arw");if(w&&!w.querySelector(".arart")&&(window.CL_LAST||{}).id===id)render(arg)}).catch(()=>{const w=v.querySelector(".arw .armeta");if(w)w.textContent="The article could not load. Check your connection and try again."});return}
 v.innerHTML=vHome()}
/* open an article at one of its figures (from the app-wide search): t-<id>~f<n> */
function toFig(v,fg){const f=v.querySelector("#a-"+fg);if(!f)return;const d=f.closest("details");if(d)d.open=true;
 let moved=false;const stop=()=>moved=true;addEventListener("touchstart",stop,{once:true,passive:true});addEventListener("wheel",stop,{once:true,passive:true});
 const to=()=>{if(!moved&&f.isConnected)f.scrollIntoView({block:"start"})};
 /* images above load lazily and push the figure down, so settle the position a few times */
 requestAnimationFrame(()=>{to();f.classList.add("arflash");setTimeout(()=>f.classList.remove("arflash"),2400)});[250,700,1400].forEach(t=>setTimeout(to,t))}
window.CLINIC={render};
document.addEventListener("keydown",ev=>{if(ALB&&ev.key==="Escape"){ev.stopPropagation();arLBclose()}},true);
document.addEventListener("input",ev=>{if(ev.target.id==="clq"){QQ=ev.target.value;clearTimeout(window._clt);window._clt=setTimeout(()=>{const l=document.getElementById("cllist");if(l)l.innerHTML=list()},120)}});
document.addEventListener("click",ev=>{const T=x=>ev.target.closest(x);let b;
 if(b=T("[data-cls]")){const [id,k]=b.dataset.cls.split(":"),o=OPEN[id];const t=BY[id],cur=o[k]!==undefined?o[k]:(k==="tx"||(k==="cls"&&!(t.tx||[]).length));o[k]=!cur;const y=scrollY;render("t-"+id);scrollTo(0,y);return}
 if(b=T("[data-artgo]")){ev.preventDefault();artGo(b.dataset.artgo);return}
 if(b=T("[data-arall]")){const o=b.dataset.arall==="1";document.querySelectorAll(".arsub").forEach(d=>d.open=o);return}
 if(b=T("[data-arfig]")){const f=b.closest("figure"),c=f?f.querySelector("figcaption"):null;arLB(b.querySelector("img").src,c?[...c.childNodes].filter(n=>n.nodeName!=="B"&&n.nodeName!=="CITE").map(n=>n.textContent).join("").trim()+(c.querySelector("cite")?" · "+c.querySelector("cite").textContent:""):"");return}
 if(ALB&&(b=T("[data-arlb]"))){if(b.dataset.arlb==="zoom"){ALB.classList.toggle("zoom");ALB.querySelector(".arlbbar [data-arlb=zoom]").textContent=ALB.classList.contains("zoom")?"Fit":"Zoom"}else arLBclose();return}
 if(ALB&&ev.target===ALB){arLBclose();return}
 if(b=T("[data-cltq]")){const id=b.dataset.cltq,pool=QUIZ.filter(q=>q.tp===id);QZ={r:"cl-"+BY[id].g,qs:shuffle(pool).map(q=>({...q,order:shuffle(q.o.map((_,i)=>i))})),i:0,ans:[]};go("quiz");return}
 if(b=T("[data-clop]")){window.CL_FROM=window.CL_LAST?{id:window.CL_LAST.id,t:window.CL_LAST.t}:null;go("th:op-"+b.dataset.clop);return}
});
})();
