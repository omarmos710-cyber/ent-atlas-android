/* ENT Atlas v21: one search for everything, and the minimal launcher Home.
   Also indexes every figure placed in the clinical articles (clinic/art/figs.js), the full text of every
   article, operation and surgical-basics section and evidence box (search/full.js, built by tools/build_search.py),
   and the whole question bank (single best answers, viva, essays and cases).
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
/* words are normalised once each and cached: the full-text index has millions of words but only tens of thousands of distinct ones */
const WC=new Map();function cw(w){let c=WC.get(w);if(c===undefined){let x=w;for(const [a,b] of CANON)x=x.replace(a,b);c=STOP.has(x)?"":stem(x);WC.set(w,c)}return c}
function toks(s){const out=[];for(const w of fold(s).split(/[^a-z0-9]+/)){if(!w||STOP.has(w))continue;const c=cw(w);if(c)out.push(c)}return out}

/* ---------- lay symptoms, abbreviations and synonyms (expanded at query time) ---------- */
const SYN={
"nosebleed":["epistaxis"],"nose bleed":["epistaxis"],"bleeding nose":["epistaxis"],"bleeding":["hemorrhage"],"bleed":["hemorrhage"],"hemorrhage":["bleeding"],"haemorrhage":["bleeding"],"guideline":["recommends"],"trial":["randomised","randomized"],"evidence":["current evidence"],
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
const TYPES={cl:["Clinical",1.3],sec:["In articles",1.0],ev:["Evidence",1.04],osec:["In operations",.96],bsec:["Surgical basics",.96],q:["Questions",.86],viva:["Viva and essays",.86],sym:["Symptom",1.5],op:["Surgical",1.12],note:["Anatomy notes",1],cond:["Imaging",1.06],tab:["Tables",.95],fig:["Figures",.82],afig:["Clinical figures",.9],card:["Flashcards",.78],mn:["Mnemonics",.8],tr:["Tracer",.95],dz:["Danger structures",1],lbl:["Labelled on figures",1]};
const loadJS=u=>new Promise((ok,no)=>{const s=document.createElement("script");s.src=u;s.onload=ok;s.onerror=no;document.head.appendChild(s)});
async function needData(){const w=[];if(!window.CLINIC_DATA)w.push(loadJS("clinic/data.js").catch(()=>0));if(!window.THEATRE_INDEX)w.push(loadJS("theatre/index.js").catch(()=>0));if(!window.THEATRE_AUTH)w.push(loadJS("theatre/auth.js").catch(()=>0));if(!window.CLART_FIGS)w.push(loadJS("clinic/art/figs.js").catch(()=>0));if(!window.THB_IDX)w.push(loadJS("theatre/basics/index.js").catch(()=>0));if(!window.XFULL)w.push(loadJS("search/full.js").catch(()=>0));await Promise.all(w)}
const rn=r=>((typeof RMAP!=="undefined"?RMAP:undefined)&&RMAP[r]&&RMAP[r].name)||"";
const J=a=>(a||[]).map(x=>Array.isArray(x)?x.join(" — "):x).join(" · ");
function build(){const items=[];const add=(o)=>{o.i=items.length;items.push(o)};
 const C=window.CLINIC_DATA;if(C){C.t.forEach(t=>add({ty:"cl",t:t.t,k:(C.g[t.g]||"")+" "+(t.ddx||[]).join(" "),b:[t.one,J(t.call),J(t.cls),J(t.why),J(t.feat),J(t.dx),J(t.ddx),J(t.tx),J(t.cx),J(t.pearl)].join(" · "),path:"Clinical · "+(C.g[t.g]||""),go:`data-go="cl:t-${t.id}"`,id:t.id}))}
 (window.THB_IDX||[]).forEach(p=>p.c.forEach(c=>{if(!c.soon)add({ty:"op",t:c.t,k:p.t+" surgical basics "+(c.k||""),b:c.one||"",path:"Surgical · Basics · "+p.t,go:`data-go="th:b-${c.id}"`})}));
 const TI=window.THEATRE_INDEX,TA=window.THEATRE_AUTH||{};if(TI){TI.ch.forEach(c=>{const g=TA[c.n];add({ty:"op",t:c.t,k:(c.s||"")+" "+(c.z||[]).map(i=>TI.zones[i]&&TI.zones[i].t).join(" "),b:g?[J(g.why),J(g.no),J(g.land),g.steps.map(s=>s.t+": "+s.d).join(" · "),J(g.err),J(g.risk),J(g.cx),J(g.post)].join(" · "):"",path:"Surgical · Myers ch. "+c.n,go:`data-go="th:op-${c.n}"`})});
  (TI.zones||[]).forEach((z,i)=>add({ty:"dz",t:z.t,k:"danger structure at risk "+(z.l||""),b:z.d||"",path:"Surgical · structure at risk",go:`data-go="th:zone-${i}"`}))}
 ((typeof SECTIONS!=="undefined"?SECTIONS:undefined)||[]).forEach(s=>add({ty:"note",t:s.t,k:rn(s.r)+" "+(s.k||""),b:(s.p||[]).join(" "),path:"Anatomy · "+rn(s.r),go:`data-go="region:${s.r}" data-sec="${s.id}"`}));
 ((typeof CONDS!=="undefined"?CONDS:undefined)||[]).forEach(c=>add({ty:"cond",t:c.t,k:(c.cat||"")+" "+(c.sec||"")+" "+rn(c.r),b:[c.ddx,J(c.pts),J(c.paras)].join(" · "),path:"Imaging · "+(c.cat||""),go:`data-go="cond:${c.id}"`,th:c.imgs&&c.imgs[0]?{im:c.imgs[0]}:null}));
 ((typeof TABLES!=="undefined"?TABLES:undefined)||[]).forEach(x=>add({ty:"tab",t:x.title,k:(x.regions||[]).map(rn).join(" "),b:[J(x.head),(x.rows||[]).map(r=>r.join(" ")).join(" · "),x.note||""].join(" · "),path:"Table · "+(x.regions||[]).map(rn).slice(0,2).join(", "),go:`data-go="tables" data-sec="tb-${x.id}"`}));
 if((typeof FIG!=="undefined"?FIG:undefined))Object.keys(FIG).forEach(k=>{if(k.startsWith("m/"))return;const f=FIG[k];add({ty:"fig",t:f[0],k:rn(f[3]),b:"",path:"Figure · "+rn(f[3]),fig:k,th:{fig:k}})});
 /* every figure placed in a clinical article (book figures and anatomy plates), opening the article at that figure */
 const CT={};if(C)C.t.forEach(t=>CT[t.id]=t.t);(window.CLART_FIGS||[]).forEach(x=>{const top=CT[x.a]||x.a;add({ty:"afig",t:x.t,k:top+" "+x.w+" "+x.c,b:"",path:"Clinical figure · "+top.replace(/\s*:.*$/,""),sub:x.c+(x.w?" · "+x.w:""),go:`data-go="cl:t-${x.a}~f${x.n}"`,th:x.f?{src:"clinic/fig/"+x.f[0]+".jpg"}:x.k&&x.k[0]?{fig:x.k[0]}:null})});
 ((typeof CARDS!=="undefined"?CARDS:undefined)||[]).forEach(c=>add({ty:"card",t:c.q,k:rn(c.r),b:c.a,path:"Flashcard · "+rn(c.r),card:c}));
 ((typeof MNEM!=="undefined"?MNEM:undefined)||[]).forEach(m=>add({ty:"mn",t:m.topic,k:m.m,b:m.x,path:"Mnemonic · "+rn(m.r),mn:m}));
 /* full text: every section of every article, operation and basics chapter, and every evidence box */
 (window.XFULL||[]).forEach(x=>{const [ty,route,t,where,b]=x;add({ty,t,k:where,b,path:TYPES[ty][0]+" · "+where,go:`data-go="${route}"`,base:route.split("~")[0]})});
 /* the question bank: single best answers, viva and essay questions, and cases */
 const tpName=tp=>{const B=window.QB&&QB[tp];return (B&&B.t)||tp||""};
 ((typeof QUIZ!=="undefined"?QUIZ:undefined)||[]).forEach(q=>{if(!q||!q.q||!q.o)return;const ans=q.o[q.c||0];add({ty:"q",t:q.q,k:tpName(q.tp)+" "+(q.r?rn(q.r):""),b:ans+" · "+(q.x||""),path:"Question · "+(q.tp?tpName(q.tp):rn(q.r)||"Single best answer"),qz:q})});
 if(window.QB)Object.values(QB).forEach(B=>{["v","e"].forEach(kind=>(B[kind]||[]).forEach(x=>add({ty:"viva",t:x.q,k:B.t||"",b:(x.p||[]).join(" · "),path:(kind==="v"?"Viva · ":"Short essay · ")+(B.t||""),qb:x})));
  (B.k||[]).forEach(c=>add({ty:"viva",t:(c.t||"Case")+": "+String(c.s||"").slice(0,90),k:B.t||"",b:c.s+" · "+c.q.map(y=>y.q+" "+(y.o?y.o[y.c||0]:"")).join(" · "),path:"Case · "+(B.t||""),qc:c}))});
 ((typeof TRACE!=="undefined"?TRACE:undefined)||[]).forEach(t=>add({ty:"tr",t:t.name,k:(t.kind||"")+" "+(t.regions||[]).map(rn).join(" "),b:t.intro||"",path:"Tracer · nerve and vessel course",go:`data-go="tracer:${t.id}"`}));
 return items}
/* postings are built in small chunks so the page never freezes */
async function post(items){const V=new Map();const W={t:10,k:5,b:2};let n=0;
 for(const it of items){if(++n%400===0)await new Promise(r=>setTimeout(r,0));const seen=new Map();const T={};
  for(const f of ["t","k","b"]){T[f]=toks(it[f]);for(const w of T[f]){const prev=seen.get(w)||0;if(W[f]>prev)seen.set(w,W[f])}}it.tt=T.t.join(" ");it.tb=T.k.concat(T.b).join(" ");
  seen.forEach((wt,w)=>{let l=V.get(w);if(!l){l=[];V.set(w,l)}l.push(it.i,wt)});it.nt=T.t.length}
 const vocab=[...V.keys()].sort();IX={items,V,vocab};return IX}
async function ready(){if(IX)return IX;if(!BUILDING)BUILDING=needData().then(build).then(post).then(ix=>{smartLoad();return ix});return BUILDING}
/* ---------- smart search (search/xsmart.js): questions such as "hashimoto treatment", answered offline ---------- */
let SMART=null,SMARTP=null,SMX=[],IXQ=null;
/* question-bank answers open inline, like the question rows below them */
function ixq(id){if(!IXQ){IXQ=new Map();for(const it of IX.items){const o=it.qz||it.qb||it.qc||it.card;if(o&&o.id)IXQ.set(o.id,it.i)}}return IXQ.get(id)}
function smartLoad(){if(SMARTP)return SMARTP;SMARTP=(async()=>{try{
  if(!window.XSMART)await loadJS("search/xsmart.js");if(!window.XSM)await loadJS("search/sm_meta.js");if(!window.XSMQ)await loadJS("search/sm_q.js").catch(()=>{window.XSMQ=[]});if(!window.XSMATL)await loadJS("search/sm_atlas.js").catch(()=>{window.XSMATL=[]});
  const [a,b]=await Promise.all(["search/sm_tok.bin","search/sm_vec.bin"].map(u=>fetch(u).then(r=>{if(!r.ok)throw new Error(u);return r.arrayBuffer()})));
  XSMART.setModel(window.XSM,a,b);window.XSM.vocab=null;await new Promise(r=>setTimeout(r,0));SMX=(window.XFULL||[]).concat(window.XSMQ||[],window.XSMATL||[]);if(XSMART.buildDocs(SMX)){SMART=XSMART;try{if(!window.XSMA)await loadJS("search/sm_ans.js");XSMART.setAnswers(window.XSMA)}catch(e){}}
  const box=document.getElementById("xres");if(box&&box.isConnected&&currentQ().trim().length>=2)run(currentQ(),box);
  const hx=document.getElementById("hx");if(hx&&hx.isConnected&&hx.value.trim().length>=2)homeLive(hx.value);
  document.dispatchEvent(new Event("xsmartready"))}catch(e){SMART=null}})();return SMARTP}
const key=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const studyKey=s=>key(s).replace(/^(what are|list|name) the /,'');
function prepare(S,docs,cases,images){
 const saved=new Map();
 for(const d of docs.filter(d=>['card','q','viva'].includes(d[0]))){
  const k=studyKey(d[2]);if(!saved.has(k))saved.set(k,d);else if(saved.get(k)?.[4]!==d[4])saved.set(k,null);
 }
 return function select(q,r,a){
  const k=key(q);
  if(/\b(its|their|this patient|this scan|this case)\b/.test(k)||!k.replace(/\b(what|which|are|is|the|most|common|risks?|complications?|causes?|treatment|of|about|please|list|and|how|do|you|manage)\b/g,'').trim())return null;
  const d=saved.get(studyKey(q));
  if(d&&!/\b(following|pictured|shown)\b/.test(k))return {source:d[1],text:d[4]};
  // The parser can turn an omitted subject into an aspect label, e.g. "Clinical picture".
  // Ignore wording that cannot identify a condition, procedure or structure on its own.
  const topic=r.P.topic.toLowerCase().replace(/\b(usual|usually|typical|typically|common|commonly|can|could|occur|after|before|clinical picture|definition|treatment|management|classification|complications?|signs?|findings?|causes?|risks?|symptoms?|diagnosis|investigation|prognosis|indications?|technique|expected|possible|likely)\b/g," ").trim();
  if(!topic||/\b(not|never|except|excluding|neither|without|my child|my baby)\b/.test(k))return null;
  const mode=k.match(/\b(ct|mri)\b/);
  if(mode&&/\b(findings?|features?|shows?|appearances?)\b/.test(k)){
   const subject=s=>key(s).split(' ').filter(w=>!['what','does','on','of','the','a','in','ct','mri','show','shows','findings','features','appearance','are'].includes(w)).sort().join(' ');
   const hits=cases.filter(c=>subject(c.t)===subject(q));if(hits.length!==1)return null;
   const c=hits[0],caps=c.imgs.map(id=>images[id]).filter(f=>f&&key(f[2]).split(' ')[0]===mode[1]&&f[3]);
   return caps.length?{source:'cond:'+c.id,text:caps.map(f=>f[3]).join('\n')}:null;
  }
  if(!a?.items?.length)return null;
  const compound=r.P.aspects.length>1;
  const groups=new Map();for(const x of a.items){
   const source=compound?x.route.split("~")[0]:x.route;
   if(!groups.has(source))groups.set(source,[]);groups.get(source).push(x);
  }
  for(const [source,all] of groups){
   const items=compound?all.filter(x=>{
    const child=/children|paediatric|pediatric/i.test(q);
    return (!child||/child|paediatric|pediatric/i.test(x.where+" "+x.title+" "+x.text))&&
     !/complications/i.test(x.where);
   }):all;
   if(!items.length)continue;
   if(r.P.parts||r.P.aspects.length>1&&r.P.aspects.some(z=>!items.some(x=>x.part===z.label)))continue;
   const x=items[0],body=items.map(x=>x.text).join('\n'),context=[x.title,x.where,body].join(' ');
   const words=new Set(S.toks(context.replace(/mastoid (surgery|operations?)/gi,'mastoid surgery mastoidectomy').replace(/\bchild\b/gi,'child children')));if(S.toks(topic).some(t=>t.length>2&&!words.has(t)))continue;
   if(/\bcontraindicat(?:ions?|ed)\b/i.test(q)&&!/contraindicat|avoid/i.test(context))continue;
   if(/\bindicat(?:ions?|ed)\b/i.test(q)&&(!/\bindications?\b/i.test(context)||/contraindicat/i.test(x.title)))continue;
   if(/\bcomplications?\b/i.test(q)&&!/complication|adverse|risk/i.test(x.title+" "+x.where+" "+(x.label||"")))continue;
   const multi=r.P.aspects.length>1||/\b(treatment|management|findings|stages|types|steps|causes|signs|symptoms|indications|contraindications|complications)\b/i.test(q);
   const section=docs[x.i]?.[4]||"";
   if(r.P.aspects.some(z=>z.id==="cls")){
    const lines=section.split("\n"),start=lines.findIndex(t=>t.includes("\t\t"));
    if(start>=0){
     const table=[lines[start]];
     for(const row of lines.slice(start+1)){if(!row.includes("\t"))break;table.push(row)}
     if(table.length>2)return {source,text:[x.title,...table].join("\n")};
    }
   }
   const quote=item=>[item.label,item.text].filter(Boolean).join(": ");
   const text=multi?items.map(quote).join("\n"):quote(x);
   if(/\bhow (often|frequent|common)|\bpercentage\b/i.test(q)&&!/%|\b(one in|per |rarely|usually|frequently)/i.test(text))continue;
   if(/\b(dose|dosage)\b/i.test(q)&&!/[0-9]\s*(mg|g|ml|microgram|unit)/i.test(text))continue;
   return {source,text:[x.title,text].join("\n")};
  }return null;
 }
}
// Subject names from the app's own answer map, imaging cases and article titles.
function subjectCheck(S,docs,cases,aliases){
 const names=aliases.flat().concat(cases.map(c=>c.t),docs.filter(d=>['sec','osec','bsec','cond','note','tab'].includes(d[0])).map(d=>d[3].split(' · ')[0]));
 const generic=new Set(S.toks('what how why which their this that when where possible definition usual common typical any after before about occur happens wrong surgery surgical procedure patient cases child adult signs symptoms side effects complications imaging investigation treatment diagnosis management medicine disease choices features findings clinical picture approach risks stages causes prognosis dose medicines therapies MRI CT scan'));
 const vocabulary=new Set(names.flatMap(s=>S.toks(s)).filter(t=>t.length>=3&&!generic.has(t)));
 return topic=>S.toks(topic).some(t=>vocabulary.has(t));
}
function refinePassage(S,docs,checkSubject){
 const bySource=new Map(docs.map(d=>[d[1],d]));
 const key=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const signatures=[
  [/^(?:what are (?:the )?|list (?:the )?|name (?:the )?)?(complications|contraindications|indications|symptoms|causes|stages|types|boundaries|contents|branches|parts) (?:of|for|to) (?:the )?(.+)$/,(m)=>m[1]+" "+m[2]],
  [/^(?:how (?:do you|to) (?:treat|manage)|(?:what is the )?(?:treatment|management) of) (?:the )?(.+)$/,(m)=>"management "+m[1]],
  [/^(?:what (?:structures? )?passes?|which structures pass|structures passing) through (?:the )?(.+)$/,(m)=>"contents "+m[1]]
 ];
 function signature(s){for(const [pattern,form] of signatures){const m=key(s).match(pattern);if(m)return form(m)}}
 const questions=new Map();
 for(const d of docs.filter(d=>["card","viva","q"].includes(d[0]))){
  const k=signature(d[2]);if(!k)continue;
  if(!questions.has(k))questions.set(k,d);else if(questions.get(k)?.[4]!==d[4])questions.set(k,null);
 }
 const rows=new Map();
 for(const d of docs){
  let header=null;
  for(const line of d[4].split('\n')){
   if(line.includes('\t\t')){header=line.split(/\t+/);continue}
   if(!line.includes('\t')){header=null;continue}
   const cells=line.split('\t'),name=key(cells[0]);
   if(!header||name.length<6||!name.includes(' ')||cells.length!==header.length)continue;
   if(!rows.has(name))rows.set(name,[]);
   rows.get(name).push({header,cells,source:d[1]});
  }
 }
 return function finish(q,answer){
  const topic=S.parse(q).topic;
  if(!checkSubject(topic))return null;
  const direct=questions.get(signature(q));if(direct===null)return null;
  if(direct)return {source:direct[1],text:direct[4]};
  const m=key(q).match(/^(?:what (?:are|is) (?:the )?)?(contents|boundaries|branches|parts) of (?:the )?(.+?)$/);
  if(m){
   const hits=(rows.get(m[2])||[]).flatMap(row=>row.header.map((h,i)=>i>0&&key(h).includes(m[1])?{source:row.source,text:row.cells[0]+'\n'+h+': '+row.cells[i]}:null).filter(Boolean));
   if(hits.length)return hits.every(h=>h.text===hits[0].text)?hits[0]:null;
   // A different structure in a neighbouring table row cannot answer this question.
   if(answer){const doc=bySource.get(answer.source);if(doc?.[4].includes('\t')&&!key(answer.text.split('\n').slice(1).join(' ')).includes(m[2]))return null}
  }
  if(!answer)return null;
  const doc=bySource.get(answer.source);
  if(doc&&/\b(nerve supply|blood supply|cartilages|boundaries|stages)\b/i.test(q)&&doc[4].length<=1100&&
    key(q).includes(key(doc[2]))&&/\n/.test(doc[4])&&!doc[4].includes('\t'))return {source:answer.source,text:doc[4]};
  if(doc&&doc[4].length<=850&&!doc[4].includes('\t')&&!/where the books differ/i.test(doc[4])){
   const parsed=S.parse(q);
   if(parsed.aspects.length===1&&parsed.aspects[0].h.test(doc[2].toLowerCase())&&parsed.aspects[0].id!=="def"){
    const quoted=answer.text.split('\n').filter(Boolean);
    if(quoted.some(t=>t.length>24&&doc[4].includes(t)))return {source:answer.source,text:doc[2]+'\n'+doc[4]};
   }
  }
  return answer;
 }
}
// A new box after a delay needs a direct statement in the passage itself.
function allowLate(S,q,answer){
 if(!answer)return false;
 const lines=answer.text.split('\n').slice(1);
 const topic=S.parse(q).topic;
 const ignore=new Set(S.toks('what where which how why when usual often most common cause site location felt procedure operation signs symptoms treatment supply nerve dose therapy approach surgery management test imaging findings indication contraindication age of choice'));
 const terms=S.toks(topic).filter(t=>t.length>2&&!ignore.has(t));
 if(!terms.length)return false;
 // Doses, exceptions and recommendations need their own verified clinical entry.
 if(/\b(dose|doses|dosage|first.line|contraindications?|avoid|best|of choice|in children)\b/i.test(q))return false;
 return lines.some(line=>{
  const words=new Set(S.toks(line));
  if(!terms.every(t=>words.has(t)))return false;
  if(/\bwhere\b|\blocation\b/i.test(q))return /\b(felt|located|lies|arises|situated|found)\b/i.test(line);
  if(/\bnerve supply\b/i.test(q))return /\b(supplied|innervated|branch of)\b/i.test(line);
  if(/\b(signs|features|symptoms|findings|criteria|score|triad|classification|stages|techniques|materials)\b/i.test(q))return false;
  // A named term explicitly defined at the start of its own line.
  const split=line.match(/^([^:]{3,75}):\s+(.{15,})/);
  return !!split&&terms.every(t=>new Set(S.toks(split[1])).has(t));
 });
}
function supported(S,q,answer,doc,direct){
 if(!answer)return false;
 if(answer.source.startsWith('qb:')||/^(CT|MRI)\b/i.test(answer.text)||direct(S,q,answer))return true;
 if(!doc)return false;
 const p=S.parse(q),text=answer.text,title=doc[2],section=doc[3].split(' · ').slice(1).join(' ');
 if(/\bindicated\b/i.test(q)&&/(^|\n)Indications?:\s/i.test(text))return true;
 if(p.aspects.length>1)return false;
 if(p.aspects.length===1){
  const a=p.aspects[0];
  if(a.id==='ind'&&/contraindicat/i.test(title))return false;
  if(a.id==='cls'&&text.includes('\t'))return true;
  if(text.split("\n").some(line=>{const m=line.match(/^([^:]{3,35}):\s+.{10}/);return m&&!(a.id==="ind"&&/contraindicat/i.test(m[1]))&&a.h.test(m[1].toLowerCase())}))return true;
  if(a.h.test(title.toLowerCase())||a.h.test(section.toLowerCase()))return true;
 }
 const terms=S.toks(p.topic).filter(t=>t.length>2);
 const titleWords=new Set(S.toks(title));
 return terms.length>=2&&terms.every(t=>titleWords.has(t))&&text.length>=70;
}
let selectPassage;
const finished=new Map(),pending=new Set();
function smartFor(q){
 if(!SMART||q.trim().split(/\s+/).length<2)return null;
 if(!selectPassage){
  const choose=prepare(SMART,SMX,CONDS,IMG);
  const subject=subjectCheck(SMART,SMX,CONDS,window.XSMA?.e||[]);
  const polish=refinePassage(SMART,SMX,subject);
  const byRoute=new Map(SMX.map(d=>[d[1],d]));
  selectPassage=(q,r,a)=>{
   const candidate=polish(q,choose(q,r,a));
   const compound=candidate&&!candidate.source.includes("~")&&candidate.text.includes("\n")&&r.P.aspects.length>1;
   return compound||supported(SMART,q,candidate,byRoute.get(candidate?.source),allowLate)?candidate:null;
  };
 }
 const S=SMART.search(q,{n:5,perArticle:2});
 S.ans=finished.has(q)?finished.get(q):selectPassage(q,S,SMART.answer(S,{n:10}));
 if(!finished.has(q)&&!pending.has(q)){pending.add(q);setTimeout(()=>refine(q,S),0)}
 return S;
}
async function refine(q,S){
 try{
  const C=SMART.candidates(S);
  let answer=S.ans;
  if(C){
   if(!window.XRANK)await loadJS("search/xrank.js");
   await XRANK.load();const scores=[];
   for(const line of C.texts)scores.push((await XRANK.score(q,[line],1))[0]);
   const candidate=selectPassage(q,S,SMART.rerank(C,scores));
   if(candidate&&(S.ans||allowLate(SMART,q,candidate)))answer=candidate;
  }
  finished.set(q,answer);
  if(S.ans?.source===answer?.source&&S.ans?.text===answer?.text)return;
  for(const slot of document.querySelectorAll("[data-best-query]")){
   const input=document.querySelector("#xq,#hx,#clq");
   if(slot.dataset.bestQuery===q&&input?.value.trim()===q)slot.innerHTML=bestHTML(answer);
  }
 }catch{ /* Keep the checked first result if the local reader is unavailable. */ }finally{pending.delete(q)}
}
function bestHTML(answer){
 if(!answer)return "";
 const d=SMX.find(x=>x[1]===answer.source)||SMX.find(x=>x[1].split("~")[0]===answer.source);
 if(!d)return "";
 const title=d[3]+" › "+d[2],idx=answer.source.startsWith("qb:")?ixq(answer.source.slice(3)):undefined;
 const source=idx!==undefined?`<details><summary>${E(title)}</summary><p>${E(d[4])}</p></details>`:`<button class="xans-src" ${goAttr(answer.source)} data-needle="${E(answer.text.split("\n")[0])}">${E(title)}</button>`;
 return `<div class="xans"><p class="xans-h">Quick answer</p>${answer.text.split("\n").map(t=>`<p>${E(t)}</p>`).join("")}${source}</div>`;
}
function slot(q,S){return `<div data-best-query="${E(q)}">${bestHTML(S?.ans)}</div>`}
/* where a line or a result opens: an anatomy note or table ("region:larynx~larynx-s9") opens its region at that section */
function goAttr(route){route=String(route||"");const m=route.match(/^(region:[^~]+)~(.+)$/);return m?`data-go="${E(m[1])}" data-sec="${E(m[2])}"`:`data-go="${E(route)}"`}
/* the quick answer: the lines of the best sections that answer the question, word for word, each linked to its place */
let ANSQ="";
function askHTML(q){const S=smartFor(q);return S?slot(q,S):null}
function askRows(){return ""}
function smartHTML(S){return S?slot(S.P.raw,S):""}
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
  if(tks.length>1){if(it.tt.includes(phrase))sc+=14;else if(it.tb.includes(phrase))sc+=5}
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
const thumb=it=>it.th?(it.th.src?`<img class="xth" src="${it.th.src}" alt="" loading="lazy" decoding="async">`:it.th.fig?(typeof FIG!=="undefined"&&FIG[it.th.fig]?`<img class="xth" src="${figThumb(it.th.fig)}" alt="" loading="lazy" decoding="async">`:""):(typeof imSrc==="function"?`<img class="xth" src="${imSrc(it.th.im)}" alt="" loading="lazy" decoding="async">`:"")):"";
function qzHTML(q,words){const ans=q.o[q.c||0];return `<p><b>Answer:</b> ${hl(ans,words)}</p>${q.x?`<p>${hl(q.x,words)}</p>`:""}${q.tp?`<button class="xlink" data-go="cl:t-${q.tp}">Open the topic</button>`:""}`}
function rowHTML(r,words,figset){const it=r.it;const ty=TYPES[it.ty][0];
 const attrs=it.go?it.go:it.fig?`data-fig="${it.fig}" data-set="${figset}"`:`data-xexp="${it.i}"`;
 const sn=it.ty==="fig"?"":it.ty==="afig"?it.sub:snippet(it,words);
 return `<div class="xr"><button class="xrh" ${attrs}>${thumb(it)}<span class="xm"><span class="xp"><i class="xt xt-${it.ty}">${E(ty)}</i>${E(it.path.replace(/^[^·]*·\s*/,""))}</span><b>${hl(it.t,words)}</b>${sn?`<small>${hl(sn,words)}</small>`:""}</span>${it.go||it.fig?ic("chev",16):`<span class="xplus" aria-hidden="true">+</span>`}</button><div class="xb" hidden></div></div>`}
function symHTML(s,words){const C=window.CLINIC_DATA;if(!C)return "";const by={};C.t.forEach(t=>by[t.id]=t);
 return `<div class="xsym"><span class="xp"><i class="xt xt-sym">Symptom</i>Think of</span><b>${E(s.n)}</b><div class="xchips">${s.ids.map(i=>by[i]).filter(Boolean).map(t=>`<button data-go="cl:t-${t.id}">${E(t.t.replace(/\s*:.*$/,""))}</button>`).join("")}</div></div>`}

/* ---------- highlight on arrival: after opening a result, the matching text glows for a few seconds ---------- */
let XHL=null;
const normWS=t=>t.replace(/\s+/g," ");
function xhlArm(btn){const sm=btn.querySelector("small");let needle=btn.dataset.needle||(sm?sm.textContent.replace(/^…|…$/g,"").trim():"");
 const go=btn.dataset.go||"",sec=btn.dataset.sec||"";XHL={needle,words:(RES&&RES.words)||[],go,sec,t:Date.now()};setTimeout(xhlRun,120)}
function xhlTarget(){const H=XHL;if(!H)return null;const anc=H.go.includes("~")?H.go.split("~")[1]:"";
 if(anc&&!/^f\d/.test(anc))return document.getElementById("a-"+anc);
 if(anc)return document.getElementById("a-"+anc);
 if(H.sec)return document.getElementById(H.sec);
 return typeof V==="function"?V():document.querySelector("main")}
/* text nodes of a container (skipping figures, svg and buttons), with their offsets in the joined text */
function xhlNodes(root){const out=[];let pos=0;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentElement;if(!p||p.closest("svg,script,style,figure,.xhlskip,button.arpdf,.armode,.artoc"))return NodeFilter.FILTER_REJECT;return n.nodeValue.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});
 let n;while((n=w.nextNode())){out.push([n,pos]);pos+=n.nodeValue.length}return out}
function xhlFind(nodes,needle){if(!needle)return null;const full=nodes.map(([n])=>n.nodeValue).join("");
 /* compare with whitespace and case folded; map folded positions back to the raw text */
 const map=[];let f="";let prevSp=false;for(let i=0;i<full.length;i++){const c=full[i];const sp=/\s/.test(c);if(sp&&prevSp)continue;f+=sp?" ":c.toLowerCase();map.push(i);prevSp=sp}
 const tries=[];const nd=normWS(needle).toLowerCase().trim();tries.push(nd.slice(0,160));const fs=nd.split(/(?<=[.;:])\s/)[0];if(fs&&fs.length>25)tries.push(fs.slice(0,160));tries.push(nd.slice(0,70));tries.push(nd.slice(0,40));
 for(const t of tries){if(t.length<12)continue;const i=f.indexOf(t);if(i>=0){const a=map[i],b=map[Math.min(map.length-1,i+t.length-1)]+1;return [a,b]}}
 return null}
function xhlWrap(nodes,a,b){const marks=[];for(const [n,p] of nodes){const L=n.nodeValue.length;if(p+L<=a||p>=b)continue;const s0=Math.max(0,a-p),e0=Math.min(L,b-p);if(e0<=s0)continue;
  let t=n;if(s0>0)t=t.splitText(s0);if(e0-s0<t.nodeValue.length)t.splitText(e0-s0);const m=document.createElement("mark");m.className="xhl";t.parentNode.insertBefore(m,t);m.appendChild(t);marks.push(m)}return marks}
function xhlWords(root,words){const marks=[];if(!words.length)return marks;const re=new RegExp("\\b("+words.filter(w=>w.length>=3).map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")+")[a-z]*","gi");if(re.source.length<12)return marks;
 for(const [n] of xhlNodes(root)){if(marks.length>=6)break;const m=re.exec(n.nodeValue);re.lastIndex=0;if(!m)continue;const r=xhlNodes(n.parentNode).find(x=>x[0]===n);if(!r)continue;marks.push(...xhlWrap([[n,0]],m.index,m.index+m[0].length))}return marks}
function xhlRun(){const H=XHL;if(!H)return;if(Date.now()-H.t>6000){XHL=null;return}
 const el=xhlTarget();if(!el||!el.textContent||el.textContent.trim().length<20||(el===V()&&/Opening…|Preparing…/.test(el.textContent))){setTimeout(xhlRun,150);return}
 /* articles load in a moment: wait until the body text is there */
 if(H.go.startsWith("cl:t-")&&!el.closest(".arart")&&!document.querySelector(".arart")&&Date.now()-H.t<2500){setTimeout(xhlRun,150);return}
 XHL=null;const d=el.closest&&el.closest("details");if(d)d.open=true;if(el.tagName==="DETAILS")el.open=true;
 const nodes=xhlNodes(el);const r=xhlFind(nodes,H.needle);let marks=r?xhlWrap(nodes,r[0],r[1]):[];
 if(!marks.length)marks=xhlWords(el,H.words);if(!marks.length)return;
 /* the page scrolls its section to the top first; then bring the highlight into view if it is off screen */
 setTimeout(()=>{const m=marks[0];if(!m.isConnected)return;const b=m.getBoundingClientRect();if(b.top<70||b.bottom>innerHeight-90)m.scrollIntoView({block:"center",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})},H.go.includes("~")?1500:200);
 setTimeout(()=>marks.forEach(m=>m.classList.add("out")),5200);
 setTimeout(()=>marks.forEach(m=>{if(!m.isConnected)return;const p=m.parentNode;while(m.firstChild)p.insertBefore(m.firstChild,m);p.removeChild(m);p.normalize()}),6600)}
document.addEventListener("click",e=>{const b=e.target.closest("#xres .xrh[data-go], #hxres .xrh[data-go], #xres .xans [data-go], #hxres .xans [data-go]");if(b)xhlArm(b)},true);

/* ---------- search page ---------- */
let SF="all",RES=null,LBL=[];const PER=6;
function groups(){const g={};RES.list.forEach(r=>{(g[r.it.ty]=g[r.it.ty]||[]).push(r)});return g}
function labelRows(q){LBL=[];try{if(q.trim().length>=4&&typeof findLabels==="function")LBL=findLabels(q.trim())||[]}catch(e){}return LBL}
function renderResults(box,q){if(!RES){box.innerHTML=`<p class="xnote">Building the index…</p>`;return}
 const words=RES.words,g=groups();labelRows(q);const order=["cl","sec","ev","op","osec","bsec","afig","note","cond","q","viva","card","lbl","fig","tab","mn","tr","dz"];
 const counts=order.map(k=>[k,k==="lbl"?LBL.length:(g[k]||[]).length]).filter(x=>x[1]);
 if(!counts.length&&!RES.syms.length&&!(RES.smart&&RES.smart.list.length)){box.innerHTML=`<p class="xnote">Nothing found for “${E(q)}”. Try fewer words, or a different spelling.</p>`;return}
 if(SF!=="all"&&!counts.some(c=>c[0]===SF))SF="all";const total=counts.reduce((a,c)=>a+c[1],0);
 const chips=`<div class="xchipsf" role="group" aria-label="Show results from"><button data-xsf="all" aria-pressed="${SF==="all"}">All <small>${total}</small></button>${counts.map(([k,n])=>`<button data-xsf="${k}" aria-pressed="${SF===k}">${E(TYPES[k][0])} <small>${n}</small></button>`).join("")}</div>`;
 const figset=typeof fsetId==="function"?fsetId((g.fig||[]).map(r=>r.it.fig)):"";
 let html=chips;
 if(SF==="all"){html+=smartHTML(RES.smart,words);html+=RES.syms.map(s=>symHTML(s,words)).join("");
  const top=[],per={};for(const r of RES.list){const b=r.it.base||r.it.go||r.it.i;if((per[b]=(per[b]||0)+1)>2)continue;top.push(r);if(top.length>=6)break}if(top.length)html+=`<section class="xg"><h2>Best matches</h2><div class="xl">${top.map(r=>rowHTML(r,words,figset)).join("")}</div></section>`}
 for(const [k] of counts){if(SF!=="all"&&SF!==k)continue;if(k==="lbl"){html+=`<section class="xg"><h2>Labelled on figures<small>${LBL.length}</small></h2><div class="xl">${LBL.slice(0,SF==="lbl"?40:PER).map((m,j)=>`<div class="xr"><button class="xrh" data-xlbl="${j}"><img class="xth" src="${figThumb(m.k)}" alt="" loading="lazy"><span class="xm"><span class="xp"><i class="xt xt-lbl">Label</i>${E(rn(FIG[m.k][3]))}</span><b>${hl(m.t,words)}</b><small>${E(FIG[m.k][0])} · opens zoomed on the label</small></span>${ic("chev",16)}</button></div>`).join("")}</div></section>`;continue}
  const L=g[k];const n=SF===k?Math.min(L.length,60):PER;html+=`<section class="xg"><h2>${E(TYPES[k][0])}<small>${L.length}</small></h2><div class="xl" data-xg="${k}">${L.slice(0,n).map(r=>rowHTML(r,words,figset)).join("")}</div>${L.length>n?`<button class="xmore" data-xmore="${k}">Show all ${L.length}</button>`:""}</section>`}
 box.innerHTML=html;if(typeof linkTerms==="function"){}}
function run(q,box){q=String(q||"");if(q.trim().length<2){box.innerHTML=emptyState();return}
 if(!IX){box.innerHTML=`<p class="xnote">Building the index…</p>`;ready().then(()=>{if(box.isConnected)run(currentQ(),box)});return}
 RES=search(q);if(RES)RES.smart=smartFor(q);renderResults(box,q);remember(q)}
const currentQ=()=>{const i=document.getElementById("xq")||document.getElementById("hx");return i?i.value:""};
function recent(){try{return JSON.parse(localStorage.getItem("xs_recent")||"[]")}catch(e){return []}}
let RT=0;function remember(q){clearTimeout(RT);RT=setTimeout(()=>{q=q.trim();if(q.length<3)return;try{const r=recent().filter(x=>x.toLowerCase()!==q.toLowerCase());r.unshift(q);localStorage.setItem("xs_recent",JSON.stringify(r.slice(0,8)))}catch(e){}},1500)}
function emptyState(){const r=recent();const ex=["hoarse voice","nosebleed","facial nerve","parotidectomy","Keros","cholesteatoma CT","RLN","dizzy"];
 return `${r.length?`<section class="xg"><h2>Recent</h2><div class="xchips">${r.map(x=>`<button data-xq="${E(x)}">${E(x)}</button>`).join("")}</div></section>`:""}<section class="xg"><h2>Try</h2><div class="xchips">${ex.map(x=>`<button data-xq="${E(x)}">${E(x)}</button>`).join("")}</div></section><p class="xnote">Searches symptoms, ${window.CLINIC_DATA?CLINIC_DATA.t.length:42} clinical topics, 209 operations, ${((typeof SECTIONS!=="undefined"?SECTIONS:undefined)||[]).length} note sections, labelled structures, ${(typeof FIG!=="undefined"?FIG:undefined)?Object.keys(FIG).filter(k=>!k.startsWith("m/")).length:""} figures, figures in the clinical articles, ${((typeof CONDS!=="undefined"?CONDS:undefined)||[]).length} imaging cases, tables, flashcards and mnemonics.</p>`}
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
 };
function homeLive(q){const box=document.getElementById("hxres"),rest=document.getElementById("hxrest");if(!box)return;
 if(q.trim().length<2){box.innerHTML="";if(rest)rest.hidden=false;return}if(rest)rest.hidden=true;
 if(!IX){box.innerHTML=`<p class="xnote">Building the index…</p>`;ready().then(()=>{if(box.isConnected)homeLive(currentQ())});return}
 RES=search(q);const words=RES.words;const top=RES.list.slice(0,7);const figset=typeof fsetId==="function"?fsetId(top.filter(r=>r.it.fig).map(r=>r.it.fig)):"";
 /* questions ("treatment of hashimoto") are answered here too, by the smart search, quoted from the articles */
 const many=q.trim().split(/\s+/).length>=2;const ans=many?askHTML(q,3):null;const S=many&&SMART?smartFor(q):null;
 const n=RES.list.length;
 box.innerHTML=(ans||"")+RES.syms.slice(0,1).map(s=>symHTML(s,words)).join("")+(top.length?`<div class="xl">${top.map(r=>rowHTML(r,words,figset)).join("")}</div>`:(many&&!SMART?`<p class="xnote">Reading your question…</p>`:`<p class="xnote">Nothing found for “${E(q)}”.</p>`))+(n||ans?`<button class="xall" data-xall>${RES.list.length?`See all ${RES.list.length} results`:"See all answers"}${ic("chev",16)}</button>`:"");remember(q);
 if(many&&!SMART)smartLoad()}

/* ---------- events ---------- */
let T=0;
document.addEventListener("input",e=>{const id=e.target.id;if(id==="xq"){if(typeof QTXT!=="undefined")QTXT=e.target.value;clearTimeout(T);T=setTimeout(()=>run(e.target.value,document.getElementById("xres")),110)}
 else if(id==="hx"){clearTimeout(T);T=setTimeout(()=>homeLive(e.target.value),110)}});
/* Build the index only when the person reaches for search, never at launch */
/* build the index quietly once the app is idle, so the first search is instant */
setTimeout(()=>{const go=()=>ready().catch(()=>0);if("requestIdleCallback" in window)requestIdleCallback(go,{timeout:8000});else go()},6000);
document.addEventListener("focusin",e=>{const id=e.target&&e.target.id;if(id==="hx"||id==="xq")ready()});
document.addEventListener("pointerdown",e=>{if(e.target.closest&&e.target.closest('[data-go="search"]'))ready()},true);
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.id==="hx"&&e.target.value.trim()){QTXT=e.target.value.trim();go("search")}});
document.addEventListener("click",e=>{const T2=x=>e.target.closest(x);let b;
 if(b=T2("[data-xall]")){QTXT=currentQ().trim();go("search");return}
 if(b=T2("[data-xask]")){QTXT=(b.dataset.xask||ANSQ||currentQ()).trim();go("search");return}
 if(b=T2("[data-xq]")){const i=document.getElementById("xq");if(i){i.value=b.dataset.xq;QTXT=i.value;run(i.value,document.getElementById("xres"))}return}
 if(b=T2("[data-xsf]")){SF=b.dataset.xsf;renderResults(document.getElementById("xres"),currentQ());window.scrollTo(0,0);return}
 if(b=T2("[data-xmore]")){SF=b.dataset.xmore;renderResults(document.getElementById("xres"),currentQ());window.scrollTo(0,0);return}
 if(b=T2("[data-xlbl]")){e.preventDefault();e.stopPropagation();if(typeof openLabel==="function")openLabel(LBL,+b.dataset.xlbl);return}
 if(b=T2("[data-xexp]")){const it=IX.items[+b.dataset.xexp],body=b.nextElementSibling,open=!body.hidden;
  if(!open&&!body.dataset.f){const words=RES?RES.words:[];body.innerHTML=it.qz?qzHTML(it.qz,words):it.qb?`<ul>${(it.qb.p||[]).map(p=>`<li>${hl(p,words)}</li>`).join("")}</ul>${it.qb.tp?`<button class="xlink" data-go="cl:t-${it.qb.tp}">Open the topic</button>`:""}`:it.qc?`<p>${hl(it.qc.s,words)}</p><ul>${it.qc.q.map(y=>`<li>${hl(y.q,words)} <b>${hl(y.o?y.o[y.c||0]:"",words)}</b></li>`).join("")}</ul>${it.qc.tp?`<button class="xlink" data-go="cl:t-${it.qc.tp}">Open the topic</button>`:""}`:it.card?`<p>${hl(it.card.a,words)}</p><button class="xlink" data-go="region:${it.card.r}">Open ${E(rn(it.card.r))} notes</button>`:it.mn?`<p><b>${E(it.mn.m)}</b>: ${hl(it.mn.x,words)}</p><button class="xlink" data-go="region:${it.mn.r}">Open ${E(rn(it.mn.r))} notes</button>`:"";body.dataset.f="1"}
  body.hidden=open;b.classList.toggle("on",!open);return}},true);
window.XSEARCH={ready,search,ask:askHTML,askRows,smartLoad,smartReady:()=>!!SMART};
if(typeof cur!=="undefined"){if(cur==="home")vHome();else if(cur==="search")vSearch()}
})();
