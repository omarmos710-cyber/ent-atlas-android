/* Clinical library: loaded when first opened */
(function(){
const D=window.CLINIC_DATA,BY={};D.t.forEach(t=>BY[t.id]=t);
const GN=D.g,e=s=>esc(String(s)),md=s=>e(s).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>");
const OPEN={};let QQ="";
const row=(a,t,s,cls)=>`<button class="clrow ${cls||""}" ${a}><span class="m"><b>${e(t)}</b>${s?`<small>${e(s)}</small>`:""}</span>${ic("chev",16)}</button>`;
const SECS=[["cls","Classification"],["why","Causes and risks"],["feat","Clinical features"],["dx","Diagnosis"],["ddx","Differential diagnosis"],["tx","Treatment"],["cx","Complications"],["pearl","Resident pearls"]];
const ul=a=>`<ul>${a.map(x=>`<li>${md(x)}</li>`).join("")}</ul>`;
function vHome(){return `<div class="clw"><span class="cle">Diseases</span><h1>Clinical</h1><input class="clsearch" id="clq" type="search" aria-label="Search diseases" placeholder="Search a disease or symptom" value="${e(QQ)}"><div id="cllist">${list()}</div></div>`}
function list(){const q=QQ.trim().toLowerCase();if(q){const L=D.t.filter(t=>(t.t+" "+t.one+" "+t.ddx.join(" ")).toLowerCase().includes(q));return L.length?`<div class="cllist">${L.map(t=>row(`data-go="cl:t-${t.id}"`,t.t,GN[t.g])).join("")}</div>`:`<p class="clsrc">No topic matches yet.</p>`}
 return Object.keys(GN).map(g=>`<div class="clgh">${e(GN[g])}</div><div class="cllist">${D.t.filter(t=>t.g===g).map(t=>row(`data-go="cl:t-${t.id}"`,t.t)).join("")}</div>`).join("")}
function vTopic(id){const t=BY[id];if(!t)return vHome();window.CL_LAST=t;const o=OPEN[id]=OPEN[id]||{};
 const nq=QUIZ.filter(q=>q.tp===id).length,nc=CARDS.filter(c=>c.tp===id).length;
 const sec=(k,n)=>{const has=t[k]&&t[k].length||(k==="tx"&&t.ops.length);if(!has)return "";const on=o[k]!==undefined?o[k]:(k==="tx");
  return `<section class="clsec"><button data-cls="${id}:${k}" aria-expanded="${on}"><span>${n}</span><i aria-hidden="true">${on?"−":"+"}</i></button>${on?`<div class="sec">${ul(t[k]||[])}${k==="tx"&&t.ops.length?`<div class="clh3" style="color:#1F5B4A">Surgical treatment</div><div class="cllist">${t.ops.map(([n,w])=>row(`data-clop="${n}"`,D.ops[n]||("Myers ch. "+n),w,"op")).join("")}</div>`:""}</div>`:""}</section>`};
 return `<div class="clw"><span class="cle">Clinical · ${e(GN[t.g])}</span><h1>${e(t.t)}</h1><p class="cllede">${md(t.one)}</p>
 ${t.call.length?`<div class="clcall"><h2>On call: what you do first</h2><ol>${t.call.map(x=>`<li>${md(x)}</li>`).join("")}</ol></div>`:""}
 ${SECS.map(([k,n])=>sec(k,n)).join("")}
 <div class="clprac">${nq?`<button class="btn primary wide" data-cltq="${id}">Quiz this topic (${nq})</button>`:""}${nc?`<button class="btn wide" data-deck="cl-${t.g}" data-mode="smart">${e(GN[t.g])} flashcards</button>`:""}</div>
 ${t.an.length?`<div class="clh3" style="color:var(--accent)">Related anatomy</div><div class="cllist">${t.an.map(r=>RMAP[r]?row(`data-go="region:${r}"`,RMAP[r].name,"","an"):"").join("")}</div>`:""}
 ${t.rel.length?`<div class="clgh">Related diseases</div><div class="cllist">${t.rel.map(r=>BY[r]?row(`data-go="cl:t-${r}"`,BY[r].t):"").join("")}</div>`:""}
 <p class="clsrc">Written for this app from ${e(t.srcs)}. Study summary only: follow local protocols and senior advice for patients.</p></div>`}
function render(arg){arg=arg||"home";const v=document.getElementById("view");if(arg==="home"){v.innerHTML=vHome();return}
 if(arg.startsWith("t-")){const id=arg.slice(2);v.innerHTML=vTopic(id);if(typeof linkTerms==="function")linkTerms(v,(BY[id]&&BY[id].an[0])||"");return}
 v.innerHTML=vHome()}
window.CLINIC={render};
document.addEventListener("input",ev=>{if(ev.target.id==="clq"){QQ=ev.target.value;clearTimeout(window._clt);window._clt=setTimeout(()=>{const l=document.getElementById("cllist");if(l)l.innerHTML=list()},120)}});
document.addEventListener("click",ev=>{const T=x=>ev.target.closest(x);let b;
 if(b=T("[data-cls]")){const [id,k]=b.dataset.cls.split(":"),o=OPEN[id];const cur=o[k]!==undefined?o[k]:(k==="tx");o[k]=!cur;const y=scrollY;render("t-"+id);scrollTo(0,y);return}
 if(b=T("[data-cltq]")){const id=b.dataset.cltq,pool=QUIZ.filter(q=>q.tp===id);QZ={r:"cl-"+BY[id].g,qs:shuffle(pool).map(q=>({...q,order:shuffle(q.o.map((_,i)=>i))})),i:0,ans:[]};go("quiz");return}
 if(b=T("[data-clop]")){window.CL_FROM=window.CL_LAST?{id:window.CL_LAST.id,t:window.CL_LAST.t}:null;go("th:op-"+b.dataset.clop);return}
});
})();
