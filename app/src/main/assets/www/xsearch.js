/* ENT Atlas v21: one search for everything, and the minimal launcher Home.
   Indexes clinical topics, operations (with their guides), anatomy notes, labelled figures, figures,
   imaging cases, tables, flashcards, mnemonics, tracer routes and danger structures.
   Understands lay symptoms, abbreviations, British/American spelling, plurals and small typos. */
(function(){
"use strict";
/* ---------- text normalisation ---------- */
const CANON=[[/oesophag/g,"esophag"],[/haem/g,"hem"],[/oedem/g,"edem"],[/paed/g,"ped"],[/anaes/g,"anes"],[/aemi/g,"emi"],[/tumour/g,"tumor"],[/colour/g,"color"],[/behaviour/g,"behavior"],[/fibre/g,"fiber"],[/centre/g,"center"],[/ae(?=tiol)/g,"e"],[/isation/g,"ization"],[/ise(d|s)?\b/g,"ize$1"],[/otorrhoea/g,"otorrhea"],[/rhinorrhoea/g,"rhinorrhea"],[/diarrhoea/g,"diarrhea"],[/apnoea/g,"apnea"],[/dyspnoea/g,"dyspnea"],[/coeliac/g,"celiac"],[/foetal/g,"fetal"],[/grey/g,"gray"],[/sulph/g,"sulf"]];
const strip=s=>String(s==null?"":s).replace(/<[^>]+>/g," ").replace(/\*\*/g,"").replace(/&[a-z]+;/g," ");
const fold=s=>strip(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
function canon(s){s=fold(s);for(const [a,b] of CANON)s=s.replace(a,b);return s}
const STOP=new Set("a an the of and or in on at to for with by from as is are be its it this that into than then also not no but if".split(" "));
function stem(w){if(w.length>5&&w.endsWith("ies"))return w.slice(0,-3)+"y";if(w.length>4&&/(ss|us|is|os)$/.test(w))return w;if(w.length>4&&/(xes|ches|shes|sses)$/.test(w))return w.slice(0,-2);if(w.length>3&&w.endsWith("s"))return w.slice(0,-1);return w}
function toks(s){return canon(s).split(/[^a-z0-9]+/).filter(w=>w&&!STOP.has(w)).map(stem)}

/* ---------- lay symptoms, abbreviations and synonyms (expanded at query time) ---------- */
const SYN={
"nosebleed":["epistaxis"],"nose bleed":["epistaxis"],"bleeding nose":["epistaxis"],
"dizzy":["vertigo"],"dizziness":["vertigo"],"giddiness":["vertigo"],"spinning":["vertigo"],"imbalance":["vertigo","balance"],
"ringing":["tinnitus"],"ringing in the ear":["tinnitus"],"buzzing":["tinnitus"],
"deaf":["hearing loss"],"deafness":["hearing loss"],"cant hear":["hearing loss"],"hard of hearing":["hearing loss"],
"hoarse":["hoarseness","dysphonia"],"hoarse voice":["hoarseness","dysphonia"],"voice change":["hoarseness","dysphonia"],"lost voice":["hoarseness","aphonia"],
"neck lump":["neck mass"],"lump in neck":["neck mass"],"neck swelling":["neck mass"],"swollen gland":["lymphadenopathy","neck mass"],"swollen glands":["lymphadenopathy","neck mass"],
"ear discharge":["otorrhea"],"runny ear":["otorrhea"],"discharging ear":["otorrhea"],"earache":["otalgia","ear pain"],"ear ache":["otalgia","ear pain"],
"sore throat":["pharyngitis","tonsillitis"],"throat pain":["pharyngitis","tonsillitis","odynophagia"],"painful swallowing":["odynophagia"],
"difficulty swallowing":["dysphagia"],"trouble swallowing":["dysphagia"],"cant swallow":["dysphagia"],"food sticking":["dysphagia","pouch"],
"noisy breathing":["stridor"],"cant breathe":["stridor","airway obstruction"],"breathing difficulty":["stridor","airway"],
"blocked nose":["nasal obstruction"],"stuffy nose":["nasal obstruction","rhinitis"],"runny nose":["rhinorrhea","rhinitis"],"sneezing":["rhinitis"],
"facial weakness":["facial palsy","facial nerve palsy"],"face droop":["facial palsy"],"bells palsy":["bell palsy","facial palsy"],"bell's palsy":["bell palsy","facial palsy"],
"snoring":["sleep apnea","snoring"],"sleep apnoea":["sleep apnea"],"loss of smell":["anosmia","olfaction","smell"],"smell loss":["anosmia","smell"],
"bad breath":["halitosis"],"dry mouth":["xerostomia"],"jaw stiffness":["trismus"],"cant open mouth":["trismus"],"drooling":["sialorrhea","drooling"],
"swollen face":["parotid","salivary"],"cheek swelling":["parotid","salivary"],"double vision":["diplopia"],"eye swelling":["periorbital","orbital cellulitis"],
"vs":["vestibular schwannoma"],"acoustic neuroma":["vestibular schwannoma"],"an":["acoustic neuroma"],"osa":["obstructive sleep apnea"],"csf":["cerebrospinal fluid"],
"rln":["recurrent laryngeal nerve"],"sln":["superior laryngeal nerve"],"ebsln":["external branch superior laryngeal"],"tors":["transoral robotic surgery"],"tlm":["transoral laser microsurgery"],
"fess":["endoscopic sinus surgery"],"ess":["endoscopic sinus surgery"],"ome":["otitis media with effusion"],"aom":["acute otitis media"],"csom":["chronic suppurative otitis media"],
"snhl":["sensorineural hearing loss"],"ssnhl":["sudden sensorineural hearing loss"],"chl":["conductive hearing loss"],"bppv":["benign paroxysmal positional vertigo"],
"hht":["hereditary hemorrhagic telangiectasia"],"jna":["juvenile angiofibroma"],"npc":["nasopharyngeal carcinoma"],"scc":["squamous cell carcinoma"],"bcc":["basal cell carcinoma"],
"fna":["fine needle aspiration"],"fnac":["fine needle aspiration"],"pth":["parathyroid hormone"],"tm":["tympanic membrane"],"eac":["external auditory canal"],"iac":["internal auditory canal"],
"ica":["internal carotid artery"],"eca":["external carotid artery"],"cca":["common carotid artery"],"ijv":["internal jugular vein"],"ejv":["external jugular vein"],"scm":["sternocleidomastoid"],
"tef":["tracheoesophageal"],"tep":["tracheoesophageal puncture"],"dise":["drug induced sleep endoscopy"],"mma":["maxillomandibular advancement"],"uppp":["uvulopalatopharyngoplasty"],
"gpa":["granulomatosis polyangiitis"],"wegener":["granulomatosis polyangiitis"],"wegeners":["granulomatosis polyangiitis"],"ent":["otolaryngology"],"lpr":["laryngopharyngeal reflux"],
"gerd":["reflux"],"rrp":["recurrent respiratory papillomatosis"],"vf":["vocal fold"],"vfp":["vocal fold paralysis"],"cpa":["cerebellopontine angle"],"ossicle":["ossicular"],
"cn vii":["facial nerve"],"cn7":["facial nerve"],"7th nerve":["facial nerve"],"seventh nerve":["facial nerve"],"cn x":["vagus"],"cn xi":["accessory nerve"],"cn xii":["hypoglossal nerve"],"cn ix":["glossopharyngeal nerve"],"cn v":["trigeminal"],"cn viii":["vestibulocochlear"],
"grommet":["tympanostomy tube","grommet"],"grommets":["tympanostomy tube","grommet"],"ventilation tube":["tympanostomy tube"],"tonsillectomy":["tonsillectomy","tonsil"],
"glue ear":["otitis media with effusion"],"swimmers ear":["otitis externa"],"swimmer's ear":["otitis externa"],"quinsy":["peritonsillar abscess"],"pharyngeal pouch":["zenker","pouch"],"zenker's":["zenker"],
"thyroid lump":["thyroid nodule"],"goiter":["goitre","goiter"],"goitre":["goitre","goiter"],"parotid lump":["parotid","pleomorphic adenoma"],"voice box":["larynx"],"windpipe":["trachea"],"gullet":["esophagus"],"eardrum":["tympanic membrane"],"ear drum":["tympanic membrane"]};
const SYNK=Object.keys(SYN).map(k=>[k,toks(k).join(" ")]).filter(x=>x[1]).sort((a,b)=>b[1].length-a[1].length);

/* Symptom entry points: what to think of */
const SYMS=[["Ear pain or discharge","otalgia otorrhea ear pain earache ear discharge",["om","oe","csom","chole","mastoiditis","icc"]],["Hearing loss","hearing loss deaf deafness",["ssnhl","otosc","om","tinnitus","vs","chole"]],["Vertigo and dizziness","vertigo dizzy dizziness imbalance",["meniere","vs","chole","tbfx","icc"]],["Tinnitus","tinnitus ringing",["tinnitus","vs","otosc","meniere","tumear"]],["Facial weakness","facial palsy facial weakness bell",["facial","tbfx","salivary","chole","vs"]],["Blocked nose","nasal obstruction blocked nose",["crs","rhinitis","septum","juv","sinus_ca","afs"]],["Nosebleed","epistaxis nosebleed",["epistaxis","hht","juv","sinus_ca"]],["Loss of smell","anosmia smell",["crs","rhinitis","sinus_ca"]],["Sore throat","sore throat pharyngitis tonsillitis odynophagia",["tonsil","deepneck","tonsil_ca","croup"]],["Hoarse voice","hoarseness hoarse dysphonia voice",["benign","vfp","lxca"]],["Noisy breathing","stridor noisy breathing airway",["stridor","croup","fb"]],["Neck lump","neck mass neck lump lymphadenopathy",["neckmass","paeds_neck","thyroid","salivary","deepneck"]],["Swallowing trouble","dysphagia swallowing",["pouch","lxca","tonsil_ca","npc"]],["Snoring and sleep apnoea","snoring sleep apnea",["osa","tonsil"]],["Swollen face or cheek","parotid salivary cheek swelling",["salivary","deepneck"]],["Swollen eye after a cold","periorbital orbital cellulitis eye swelling",["abs","afs"]]].map(([n,terms,ids])=>({n,terms:new Set(toks(terms)),ids}));

/* ---------- index ---------- */
let IX=null,BUILDING=null;
const TYPES={cl:["Clinical",1.3],sym:["Symptom",1.5],op:["Surgical",1.12],note:["Anatomy notes",1],cond:["Imaging",1.06],tab:["Tables",.95],fig:["Figures",.82],card:["Flashcards",.78],mn:["Mnemonics",.8],tr:["Tracer",.95],dz:["Danger structures",1],lbl:["Labelled on figures",1]};
const loadJS=u=>new Promise((ok,no)=>{const s=document.createElement("script");s.src=u;s.onload=ok;s.onerror=no;document.head.appendChild(s)});
async function needData(){const w=[];if(!window.CLINIC_DATA)w.push(loadJS("clinic/data.js").catch(()=>0));if(!window.THEATRE_INDEX)w.push(loadJS("theatre/index.js").catch(()=>0));if(!window.THEATRE_AUTH)w.push(loadJS("theatre/auth.js").catch(()=>0));await Promise.all(w)}
const rn=r=>((typeof RMAP!=="undefined"?RMAP:undefined)&&RMAP[r]&&RMAP[r].name)||"";
const J=a=>(a||[]).map(x=>Array.isArray(x)?x.join(" — "):x).join(" · ");
function build(){const items=[];const add=(o)=>{o.i=items.length;items.push(o)};
 const C=window.CLINIC_DATA;if(C){C.t.forEach(t=>add({ty:"cl",t:t.t,k:(C.g[t.g]||"")+" "+(t.ddx||[]).join(" "),b:[t.one,J(t.call),J(t.cls),J(t.why),J(t.feat),J(t.dx),J(t.ddx),J(t.tx),J(t.cx),J(t.pearl)].join(" · "),path:"Clinical · "+(C.g[t.g]||""),go:`data-go="cl:t-${t.id}"`,id:t.id}))}
 const TI=window.THEATRE_INDEX,TA=window.THEATRE_AUTH||{};if(TI){TI.ch.forEach(c=>{const g=TA[c.n];add({ty:"op",t:c.t,k:(c.s||"")+" "+(c.z||[]).map(i=>TI.zones[i]&&TI.zones[i].t).join(" "),b:g?[J(g.why),J(g.no),J(g.land),g.steps.map(s=>s.t+": "+s.d).join(" · "),J(g.err),J(g.risk),J(g.cx),J(g.post)].join(" · "):"",path:"Surgical · Myers ch. "+c.n,go:`data-go="th:op-${c.n}"`})});
  (TI.zones||[]).forEach((z,i)=>add({ty:"dz",t:z.t,k:"danger structure at risk "+(z.l||""),b:z.d||"",path:"Surgical · structure at risk",go:`data-go="th:zone-${i}"`}))}
 ((typeof SECTIONS!=="undefined"?SECTIONS:undefined)||[]).forEach(s=>add({ty:"note",t:s.t,k:rn(s.r)+" "+(s.k||""),b:(s.p||[]).join(" "),path:"Anatomy · "+rn(s.r),go:`data-go="region:${s.r}" data-sec="${s.id}"`}));
 ((typeof CONDS!=="undefined"?CONDS:undefined)||[]).forEach(c=>add({ty:"cond",t:c.t,k:(c.cat||"")+" "+(c.sec||"")+" "+rn(c.r),b:[c.ddx,J(c.pts),J(c.paras)].join(" · "),path:"Imaging · "+(c.cat||""),go:`data-go="cond:${c.id}"`,th:c.imgs&&c.imgs[0]?{im:c.imgs[0]}:null}));
 ((typeof TABLES!=="undefined"?TABLES:undefined)||[]).forEach(x=>add({ty:"tab",t:x.title,k:(x.regions||[]).map(rn).join(" "),b:[J(x.head),(x.rows||[]).map(r=>r.join(" ")).join(" · "),x.note||""].join(" · "),path:"Table · "+(x.regions||[]).map(rn).slice(0,2).join(", "),go:`data-go="tables" data-sec="tb-${x.id}"`}));
 if((typeof FIG!=="undefined"?FIG:undefined))Object.keys(FIG).forEach(k=>{if(k.startsWith("m/"))return;const f=FIG[k];add({ty:"fig",t:f[0],k:rn(f[3]),b:"",path:"Figure · "+rn(f[3]),fig:k,th:{fig:k}})});
 ((typeof CARDS!=="undefined"?CARDS:undefined)||[]).forEach(c=>add({ty:"card",t:c.q,k:rn(c.r),b:c.a,path:"Flashcard · "+rn(c.r),card:c}));
 ((typeof MNEM!=="undefined"?MNEM:undefined)||[]).forEach(m=>add({ty:"mn",t:m.topic,k:m.m,b:m.x,path:"Mnemonic · "+rn(m.r),mn:m}));
 ((typeof TRACE!=="undefined"?TRACE:undefined)||[]).forEach(t=>add({ty:"tr",t:t.name,k:(t.kind||"")+" "+(t.regions||[]).map(rn).join(" "),b:t.intro||"",path:"Tracer · nerve and vessel course",go:`data-go="tracer:${t.id}"`}));
 /* postings */
 const V=new Map();const W={t:10,k:5,b:2};
 items.forEach(it=>{it.ct=canon(it.t);it.cb=canon(it.k+" "+it.b);const seen=new Map();
  for(const f of ["t","k","b"]){for(const w of toks(it[f])){const prev=seen.get(w)||0;if(W[f]>prev)seen.set(w,W[f])}}
  seen.forEach((wt,w)=>{let l=V.get(w);if(!l){l=[];V.set(w,l)}l.push(it.i,wt)});it.nt=toks(it.t).length});
 const vocab=[...V.keys()].sort();IX={items,V,vocab};return IX}
async function ready(){if(IX)return IX;if(!BUILDING)BUILDING=needData().then(build);return BUILDING}

/* ---------- matching ---------- */
function ed(a,b,max){if(Math.abs(a.length-b.length)>max)return max+1;const m=a.length,n=b.length;let p=new Array(n+1),c=new Array(n+1);for(let j=0;j<=n;j++)p[j]=j;
 for(let i=1;i<=m;i++){c[0]=i;let mn=c[0];for(let j=1;j<=n;j++){c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));if(c[j]<mn)mn=c[j]}if(mn>max)return max+1;[p,c]=[c,p]}return p[n]}
function lowerBound(a,x){let lo=0,hi=a.length;while(lo<hi){const m=(lo+hi)>>1;if(a[m]<x)lo=m+1;else hi=m}return lo}
function expand(tk){const {V,vocab}=IX;const out=[];if(V.has(tk))out.push([tk,1]);
 if(tk.length>=3){for(let i=lowerBound(vocab,tk);i<vocab.length&&vocab[i].startsWith(tk);i++){if(vocab[i]!==tk)out.push([vocab[i],tk.length>=5?.8:.7]);if(out.length>60)break}}
 if(tk.length>=5&&out.length<3){const max=tk.length>=8?2:1;for(const w of vocab){if(w[0]!==tk[0]&&max<2)continue;if(Math.abs(w.length-tk.length)>max)continue;if(ed(tk,w,max)<=max)out.push([w,.55])}}
 return out}
function variants(q){const base=toks(q).join(" ");const vs=[[base,1]];for(const [k,ck] of SYNK){const re=new RegExp("(^| )"+ck.replace(/ /g," ")+"( |$)");if(re.test(base)){for(const s of SYN[k]){const rep=base.replace(re,"$1"+toks(s).join(" ")+"$2").trim();if(!vs.some(v=>v[0]===rep))vs.push([rep,.92])}}}
 return vs.slice(0,6)}
function scoreVariant(qs){const tks=qs.split(" ").filter(Boolean);if(!tks.length)return new Map();const per=tks.map(tk=>{const m=new Map();for(const [w,qual] of expand(tk)){const l=IX.V.get(w);for(let i=0;i<l.length;i+=2){const s=l[i+1]*qual;if(s>(m.get(l[i])||0))m.set(l[i],s)}}return m});
 const res=new Map();const need=tks.length>=3?tks.length-1:tks.length;const counts=new Map();per.forEach(m=>m.forEach((s,i)=>{res.set(i,(res.get(i)||0)+s);counts.set(i,(counts.get(i)||0)+1)}));
 const phrase=tks.join(" ");res.forEach((s,i)=>{const c=counts.get(i);if(c<need){res.delete(i);return}const it=IX.items[i];let sc=s*(c<tks.length?.55:1);
  if(tks.length>1){if(toks(it.t).join(" ").includes(phrase))sc+=14;else if(toks(it.k+" "+it.b).join(" ").includes(phrase))sc+=5}
  if(c===tks.length&&it.nt&&it.nt<=tks.length+2)sc+=3;res.set(i,sc*TYPES[it.ty][1])});return res}
function search(q){if(!IX)return null;const vs=variants(q);const all=new Map();for(const [v,w] of vs){scoreVariant(v).forEach((s,i)=>{const x=s*w;if(x>(all.get(i)||0))all.set(i,x)})}
 const list=[...all.entries()].sort((a,b)=>b[1]-a[1]).map(([i,s])=>({it:IX.items[i],s}));
 /* symptoms */
 const qt=new Set(vs.flatMap(v=>v[0].split(" ")));const syms=SYMS.filter(s=>vs.some(([v])=>{const t=v.split(" ").filter(Boolean);return t.length&&t.every(x=>s.terms.has(x))})).slice(0,2);
 return {list,syms,words:[...qt].filter(t=>t.length>=3)}}

/* ---------- rendering ---------- */
const E=s=>esc(String(s==null?"":s));
function hl(text,words){let t=E(strip(text));if(!words.length)return t;const re=new RegExp("\\b("+words.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")+")[a-z]*","gi");return t.replace(re,m=>`<mark>${m}</mark>`)}
function snippet(it,words){if(!it.b)return "";const src=strip(it.b);if(!words.length)return src.slice(0,140);const lw=src.toLowerCase();let best=-1;for(const w of words){const i=lw.search(new RegExp("\\b"+w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));if(i>=0&&(best<0||i<best))best=i}
 if(best<0)return src.slice(0,140)+(src.length>140?"…":"");let s=Math.max(0,src.lastIndexOf(" ",Math.max(0,best-50)));const e=Math.min(src.length,s+170);return (s>0?"…":"")+src.slice(s,e).trim()+(e<src.length?"…":"")}
const thumb=it=>it.th?(it.th.fig?`<img class="xth" src="${figThumb(it.th.fig)}" alt="" loading="lazy" decoding="async">`:(typeof imSrc==="function"?`<img class="xth" src="${imSrc(it.th.im)}" alt="" loading="lazy" decoding="async">`:"")):"";
function rowHTML(r,words,figset){const it=r.it;const ty=TYPES[it.ty][0];
 const attrs=it.go?it.go:it.fig?`data-fig="${it.fig}" data-set="${figset}"`:`data-xexp="${it.i}"`;
 const sn=it.ty==="fig"?"":snippet(it,words);
 return `<div class="xr"><button class="xrh" ${attrs}>${thumb(it)}<span class="xm"><span class="xp"><i class="xt xt-${it.ty}">${E(ty)}</i>${E(it.path.replace(/^[^·]*·\s*/,""))}</span><b>${hl(it.t,words)}</b>${sn?`<small>${hl(sn,words)}</small>`:""}</span>${it.go||it.fig?ic("chev",16):`<span class="xplus" aria-hidden="true">+</span>`}</button><div class="xb" hidden></div></div>`}
function symHTML(s,words){const C=window.CLINIC_DATA;if(!C)return "";const by={};C.t.forEach(t=>by[t.id]=t);
 return `<div class="xsym"><span class="xp"><i class="xt xt-sym">Symptom</i>Think of</span><b>${E(s.n)}</b><div class="xchips">${s.ids.map(i=>by[i]).filter(Boolean).map(t=>`<button data-go="cl:t-${t.id}">${E(t.t.replace(/\s*:.*$/,""))}</button>`).join("")}</div></div>`}

/* ---------- search page ---------- */
let SF="all",RES=null,LBL=[];const PER=6;
function groups(){const g={};RES.list.forEach(r=>{(g[r.it.ty]=g[r.it.ty]||[]).push(r)});return g}
function labelRows(q){LBL=[];try{if(q.trim().length>=4&&typeof findLabels==="function")LBL=findLabels(q.trim())||[]}catch(e){}return LBL}
function renderResults(box,q){if(!RES){box.innerHTML=`<p class="xnote">Building the index…</p>`;return}
 const words=RES.words,g=groups();labelRows(q);const order=["cl","op","note","cond","lbl","fig","tab","card","mn","tr","dz"];
 const counts=order.map(k=>[k,k==="lbl"?LBL.length:(g[k]||[]).length]).filter(x=>x[1]);
 if(!counts.length&&!RES.syms.length){box.innerHTML=`<p class="xnote">Nothing found for “${E(q)}”. Try fewer words, or a different spelling.</p>`;return}
 if(SF!=="all"&&!counts.some(c=>c[0]===SF))SF="all";const total=counts.reduce((a,c)=>a+c[1],0);
 const chips=`<div class="xchipsf" role="group" aria-label="Show results from"><button data-xsf="all" aria-pressed="${SF==="all"}">All <small>${total}</small></button>${counts.map(([k,n])=>`<button data-xsf="${k}" aria-pressed="${SF===k}">${E(TYPES[k][0])} <small>${n}</small></button>`).join("")}</div>`;
 const figset=typeof fsetId==="function"?fsetId((g.fig||[]).map(r=>r.it.fig)):"";
 let html=chips;
 if(SF==="all"){html+=RES.syms.map(s=>symHTML(s,words)).join("");
  const top=RES.list.slice(0,6);if(top.length)html+=`<section class="xg"><h2>Best matches</h2><div class="xl">${top.map(r=>rowHTML(r,words,figset)).join("")}</div></section>`}
 for(const [k] of counts){if(SF!=="all"&&SF!==k)continue;if(k==="lbl"){html+=`<section class="xg"><h2>Labelled on figures<small>${LBL.length}</small></h2><div class="xl">${LBL.slice(0,SF==="lbl"?40:PER).map((m,j)=>`<div class="xr"><button class="xrh" data-xlbl="${j}"><img class="xth" src="${figThumb(m.k)}" alt="" loading="lazy"><span class="xm"><span class="xp"><i class="xt xt-lbl">Label</i>${E(rn(FIG[m.k][3]))}</span><b>${hl(m.t,words)}</b><small>${E(FIG[m.k][0])} · opens zoomed on the label</small></span>${ic("chev",16)}</button></div>`).join("")}</div></section>`;continue}
  const L=g[k];const n=SF===k?Math.min(L.length,60):PER;html+=`<section class="xg"><h2>${E(TYPES[k][0])}<small>${L.length}</small></h2><div class="xl" data-xg="${k}">${L.slice(0,n).map(r=>rowHTML(r,words,figset)).join("")}</div>${L.length>n?`<button class="xmore" data-xmore="${k}">Show all ${L.length}</button>`:""}</section>`}
 box.innerHTML=html;if(typeof linkTerms==="function"){}}
function run(q,box){q=String(q||"");if(q.trim().length<2){box.innerHTML=emptyState();return}
 if(!IX){box.innerHTML=`<p class="xnote">Building the index…</p>`;ready().then(()=>{if(box.isConnected)run(currentQ(),box)});return}
 RES=search(q);renderResults(box,q);remember(q)}
const currentQ=()=>{const i=document.getElementById("xq")||document.getElementById("hx");return i?i.value:""};
function recent(){try{return JSON.parse(localStorage.getItem("xs_recent")||"[]")}catch(e){return []}}
let RT=0;function remember(q){clearTimeout(RT);RT=setTimeout(()=>{q=q.trim();if(q.length<3)return;try{const r=recent().filter(x=>x.toLowerCase()!==q.toLowerCase());r.unshift(q);localStorage.setItem("xs_recent",JSON.stringify(r.slice(0,8)))}catch(e){}},1500)}
function emptyState(){const r=recent();const ex=["hoarse voice","nosebleed","facial nerve","parotidectomy","Keros","cholesteatoma CT","RLN","dizzy"];
 return `${r.length?`<section class="xg"><h2>Recent</h2><div class="xchips">${r.map(x=>`<button data-xq="${E(x)}">${E(x)}</button>`).join("")}</div></section>`:""}<section class="xg"><h2>Try</h2><div class="xchips">${ex.map(x=>`<button data-xq="${E(x)}">${E(x)}</button>`).join("")}</div></section><p class="xnote">Searches symptoms, ${window.CLINIC_DATA?CLINIC_DATA.t.length:42} clinical topics, 209 operations, ${((typeof SECTIONS!=="undefined"?SECTIONS:undefined)||[]).length} note sections, labelled structures, ${(typeof FIG!=="undefined"?FIG:undefined)?Object.keys(FIG).filter(k=>!k.startsWith("m/")).length:""} figures, ${((typeof CONDS!=="undefined"?CONDS:undefined)||[]).length} imaging cases, tables, flashcards and mnemonics.</p>`}
vSearch=function(){SF="all";V().innerHTML=`<div class="xs"><div class="xsq">${ic("search",18)}<input type="search" id="xq" autocomplete="off" enterkeyhint="search" placeholder="Symptoms, anatomy, surgery…" aria-label="Search everything" value="${E(typeof QTXT==="string"?QTXT:"")}"></div><div id="xres" aria-live="polite"></div></div>`;
 const box=document.getElementById("xres"),inp=document.getElementById("xq");run(inp.value,box);ready().then(()=>{if(box.isConnected&&inp.value.trim().length>=2)run(inp.value,box)});setTimeout(()=>inp.focus(),40)};

/* ---------- Home: minimal launcher ---------- */
const TILES=[["atlas","Anatomy","atlas"],["cl:home","Clinical","lesion"],["th:home","Surgical","drill"],["imaging","Imaging","imaging"],["tables","Tables","tables"],["tracer","Tracer","tracer"],["cards","Cards","study"],["quiz","Quiz","quiz"],["practical","Bench","bone"]];
vHome=function(){let cont="";try{const s=continueSec();if(s)cont=`<button class="xcont" data-go="region:${s.r}" data-sec="${s.id}"><span class="xm"><span class="eyebrow">Continue</span><b>${E(rn(s.r))}</b><small>${E(s.t)}</small></span>${ic("chev",18)}</button>`}catch(e){}
 let due="";try{const t=todayCounts();const n=t.due+t.dd+t.mc;if(n)due=`<button class="xdue" data-today>${E(t.due?t.due+" cards due":t.dd?t.dd+" drill figures due":t.mc+" mistakes to review")} · about ${t.mins} min</button>`}catch(e){}
 V().innerHTML=`<div class="xhome"><h1>What are you looking for?</h1>
 <div class="xsq big">${ic("search",20)}<input type="search" id="hx" autocomplete="off" enterkeyhint="search" placeholder="Symptoms, anatomy, surgery…" aria-label="Search everything"></div>
 <div id="hxres" aria-live="polite"></div>
 <div id="hxrest">${cont}${due}
 <div class="xgrid">${TILES.map(([g,l,i])=>`<button data-go="${g}">${ic(i,24)}<span>${E(l)}</span></button>`).join("")}</div></div></div>`;
 if("requestIdleCallback" in window)requestIdleCallback(()=>ready());else setTimeout(ready,300)};
function homeLive(q){const box=document.getElementById("hxres"),rest=document.getElementById("hxrest");if(!box)return;
 if(q.trim().length<2){box.innerHTML="";if(rest)rest.hidden=false;return}if(rest)rest.hidden=true;
 if(!IX){box.innerHTML=`<p class="xnote">Building the index…</p>`;ready().then(()=>{if(box.isConnected)homeLive(currentQ())});return}
 RES=search(q);const words=RES.words;const top=RES.list.slice(0,7);const figset=typeof fsetId==="function"?fsetId(top.filter(r=>r.it.fig).map(r=>r.it.fig)):"";
 box.innerHTML=RES.syms.slice(0,1).map(s=>symHTML(s,words)).join("")+(top.length?`<div class="xl">${top.map(r=>rowHTML(r,words,figset)).join("")}</div>`:`<p class="xnote">Nothing found for “${E(q)}”.</p>`)+`<button class="xall" data-xall>See all ${RES.list.length} results${ic("chev",16)}</button>`;remember(q)}

/* ---------- events ---------- */
let T=0;
document.addEventListener("input",e=>{const id=e.target.id;if(id==="xq"){if(typeof QTXT!=="undefined")QTXT=e.target.value;clearTimeout(T);T=setTimeout(()=>run(e.target.value,document.getElementById("xres")),110)}
 else if(id==="hx"){clearTimeout(T);T=setTimeout(()=>homeLive(e.target.value),110)}});
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.id==="hx"&&e.target.value.trim()){QTXT=e.target.value.trim();go("search")}});
document.addEventListener("click",e=>{const T2=x=>e.target.closest(x);let b;
 if(b=T2("[data-xall]")){QTXT=currentQ().trim();go("search");return}
 if(b=T2("[data-xq]")){const i=document.getElementById("xq");if(i){i.value=b.dataset.xq;QTXT=i.value;run(i.value,document.getElementById("xres"))}return}
 if(b=T2("[data-xsf]")){SF=b.dataset.xsf;renderResults(document.getElementById("xres"),currentQ());window.scrollTo(0,0);return}
 if(b=T2("[data-xmore]")){SF=b.dataset.xmore;renderResults(document.getElementById("xres"),currentQ());window.scrollTo(0,0);return}
 if(b=T2("[data-xlbl]")){e.preventDefault();e.stopPropagation();if(typeof openLabel==="function")openLabel(LBL,+b.dataset.xlbl);return}
 if(b=T2("[data-xexp]")){const it=IX.items[+b.dataset.xexp],body=b.nextElementSibling,open=!body.hidden;
  if(!open&&!body.dataset.f){const words=RES?RES.words:[];body.innerHTML=it.card?`<p>${hl(it.card.a,words)}</p><button class="xlink" data-go="region:${it.card.r}">Open ${E(rn(it.card.r))} notes</button>`:it.mn?`<p><b>${E(it.mn.m)}</b>: ${hl(it.mn.x,words)}</p><button class="xlink" data-go="region:${it.mn.r}">Open ${E(rn(it.mn.r))} notes</button>`:"";body.dataset.f="1"}
  body.hidden=open;b.classList.toggle("on",!open);return}},true);
window.XSEARCH={ready,search};
if(typeof cur!=="undefined"){if(cur==="home")vHome();else if(cur==="search")vSearch()}
})();
