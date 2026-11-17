/* ENT Atlas smart search: understands questions such as "hashimoto treatment",
   "clinical picture of RLN injury" or "signs of AOM", fully offline.
   1. The question is parsed: abbreviations are expanded, and the "aspect" asked for
      (treatment, clinical picture, investigation, causes, complications ...) is separated
      from the topic ("hashimoto", "recurrent laryngeal nerve injury").
   2. Every article section is scored three ways:
      keywords  BM25 on the topic words (title, place and text), with a stemmer that
                folds treat/treated/treatment and British/American spelling;
      meaning   cosine similarity between the topic and two-sentence chunks of the section,
                using a static medical embedding model (PubMedBERT distilled with model2vec,
                built by tools/build_smart.py) - a lookup and an average, no network;
      aspect    whether the section's heading (or its chapter) is about the aspect asked for.
   3. The three are blended, and the best chunk of each section is returned as the snippet.
   Works in the browser (window.XSMART) and in Node (module.exports) for testing. */
(function(root){
"use strict";
/* ---------- text ---------- */
const CANON=[[/oesophag/g,"esophag"],[/haem/g,"hem"],[/oedem/g,"edem"],[/paed/g,"ped"],[/anaes/g,"anes"],[/aemi/g,"emi"],[/tumour/g,"tumor"],[/colour/g,"color"],[/fibre/g,"fiber"],[/centre/g,"center"],[/aetiol/g,"etiol"],[/isation/g,"ization"],[/ise(d|s)?\b/g,"ize$1"],[/rrhoea/g,"rrhea"],[/apnoea/g,"apnea"],[/dyspnoea/g,"dyspnea"],[/coeliac/g,"celiac"],[/grey/g,"gray"],[/sulph/g,"sulf"],[/ae/g,"e"],[/^rhinosinusit/,"sinusit"],[/^laryng(eal|e)$/,"larynx"],[/^pharyng(eal|e)$/,"pharynx"],[/^nasal$/,"nose"],[/^tonsillar$/,"tonsil"],[/^trachea[l]?$/,"trachea"],[/^esophageal$/,"esophagus"],[/^aural$/,"ear"],[/^otic$/,"ear"],[/^cochlear$/,"cochlea"],[/^mandibular$/,"mandible"],[/^maxillary$/,"maxilla"],[/^thyroidal$/,"thyroid"],[/^parotid(s)?$/,"parotid"],[/^vocal cords?$/,"vocal fold"],[/^cords?$/,"fold"],[/^tumou?rs?$/,"tumor"],[/^neoplasms?$/,"tumor"],[/^carcinomas?$/,"carcinoma"],[/^paralys[ie]s$/,"palsy"],[/^paralysed$/,"palsy"],[/^paralyzed$/,"palsy"],[/^palsies$/,"palsy"]];
const STOP=new Set("a an the of and or in on at to for with by from as is are be its it this that into than then also not no but if what which how why when who whose whom does do did can could should would will there their them they his her he she we you your our my me i was were been being has have had about over under between per via vs versus".split(" "));
const fold=s=>String(s==null?"":s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
/* a small Porter-style stemmer: enough to fold treat/treated/treating/treatment, injury/injuries, palsy/palsies */
function stem(w){
 if(w.length<=3)return w;
 for(const [suf,rep,min] of [["ational","ate",4],["ization","ize",4],["ations","ate",4],["ation","ate",4],["ments","",4],["ment","",4],["ness","",4],["ings","",4],["ing","",4],["edly","",4],["ies","y",3],["ied","y",3],["ed","",4],["ers","",4],["er","",5],["es","",4],["s","",3]]){
  if(w.endsWith(suf)&&w.length-suf.length>=min){
   if((suf==="es"||suf==="s")&&/(ss|us|is|os|sis)$/.test(w))return w;
   if(suf==="es"&&!/(x|ch|sh|ss|z|o)es$/.test(w)){w=w.slice(0,-1);break}
   w=w.slice(0,w.length-suf.length)+rep;break}}
 if(w.length>4&&/(.)\1$/.test(w)&&!/(ll|ss|zz)$/.test(w))w=w.slice(0,-1);
 if(w.length>4&&w.endsWith("e"))w=w.slice(0,-1);
 return w}
const WC=new Map();
function cw(w){let c=WC.get(w);if(c===undefined){let x=w;for(const [a,b] of CANON)x=x.replace(a,b);c=STOP.has(w)?"":stem(x);WC.set(w,c)}return c}
function toks(s){const out=[];for(const w of fold(s).split(/[^a-z0-9]+/)){if(!w)continue;const c=cw(w);if(c)out.push(c)}return out}

/* ---------- abbreviations (curated; the build adds those defined in the text) ---------- */
const ABBR={aom:"acute otitis media",ome:"otitis media with effusion",csom:"chronic suppurative otitis media",com:"chronic otitis media",oe:"otitis externa",noe:"necrotising otitis externa",
 snhl:"sensorineural hearing loss",ssnhl:"sudden sensorineural hearing loss",chl:"conductive hearing loss",nihl:"noise induced hearing loss",bppv:"benign paroxysmal positional vertigo",
 vs:"vestibular schwannoma",cpa:"cerebellopontine angle",iac:"internal auditory canal",eac:"external auditory canal",tm:"tympanic membrane",et:"eustachian tube",etd:"eustachian tube dysfunction",
 scd:"superior canal dehiscence",lva:"large vestibular aqueduct",ci:"cochlear implant",baha:"bone anchored hearing aid",vemp:"vestibular evoked myogenic potential",abr:"auditory brainstem response",oae:"otoacoustic emissions",
 crs:"chronic rhinosinusitis",crswnp:"chronic rhinosinusitis with nasal polyps",abs:"acute bacterial sinusitis",afs:"allergic fungal sinusitis",ar:"allergic rhinitis",
 fess:"functional endoscopic sinus surgery",ess:"endoscopic sinus surgery",hht:"hereditary haemorrhagic telangiectasia",jna:"juvenile nasopharyngeal angiofibroma",
 gpa:"granulomatosis with polyangiitis",csf:"cerebrospinal fluid",npc:"nasopharyngeal carcinoma",omu:"ostiomeatal unit",
 osa:"obstructive sleep apnoea",osas:"obstructive sleep apnoea",dise:"drug induced sleep endoscopy",cpap:"continuous positive airway pressure",uppp:"uvulopalatopharyngoplasty",
 pta:"peritonsillar abscess",ida:"infectious mononucleosis",ebv:"epstein barr virus",hpv:"human papillomavirus",gas:"group a streptococcus",
 rln:"recurrent laryngeal nerve",sln:"superior laryngeal nerve",ebsln:"external branch of the superior laryngeal nerve",vfp:"vocal fold paralysis",vcp:"vocal cord paralysis",
 lpr:"laryngopharyngeal reflux",gord:"gastro oesophageal reflux",gerd:"gastro oesophageal reflux",rrp:"recurrent respiratory papillomatosis",sgs:"subglottic stenosis",
 mtd:"muscle tension dysphonia",ilo:"inducible laryngeal obstruction",tlm:"transoral laser microsurgery",tors:"transoral robotic surgery",tep:"tracheoesophageal puncture",tef:"tracheoesophageal fistula",
 cico:"cannot intubate cannot oxygenate",fona:"front of neck access",
 scc:"squamous cell carcinoma",hnscc:"head and neck squamous cell carcinoma",bcc:"basal cell carcinoma",cup:"carcinoma of unknown primary",
 fna:"fine needle aspiration",fnac:"fine needle aspiration cytology",ptc:"papillary thyroid carcinoma",mtc:"medullary thyroid carcinoma",tsh:"thyroid stimulating hormone",
 pth:"parathyroid hormone",phpt:"primary hyperparathyroidism",men:"multiple endocrine neoplasia",rai:"radioactive iodine",
 ica:"internal carotid artery",eca:"external carotid artery",ijv:"internal jugular vein",scm:"sternocleidomastoid",
 orn:"osteoradionecrosis",mronj:"medication related osteonecrosis of the jaw",imrt:"intensity modulated radiotherapy",pet:"positron emission tomography",
 tb:"tuberculosis",hiv:"human immunodeficiency virus",ent:"ear nose and throat",fb:"foreign body",tmj:"temporomandibular joint",ugi:"upper gastrointestinal",
 rhs:"ramsay hunt syndrome",fn:"facial nerve",hb:"house brackmann"};
const SKIPABBR=new Set(["it","on","so","cs","cr","ap","sp","an","as","at","or","in","us","am","pm","mt","pna","fk"]);

/* ---------- aspects of a question ---------- */
/* q: phrases in the question (longest first); h: heading words that answer it; c: cue words in the text */
const ASPECTS=[
 {id:"tx",label:"Treatment",q:["how to treat","how do you treat","how to manage","how do you manage","line of treatment","drug of choice","drugs for","medication for","medical treatment","dose of","dosage","dose","surgical treatment","treatment options","treatment","treatments","treat","treated","management","managing","manage","therapy","tx","rx","cure"],h:/\b(treatment|management|manag|therap|medical|surgery|surgical|operation|drug|antibiotic|steroid|repair|what to do|options?|choosing)\b/,c:/\b(treat\w*|manag\w*|therap\w*|steroid|antibiotic|surgery|excis\w*|drain\w*|repair\w*)\b/},
 {id:"cf",label:"Clinical picture",q:["clinical picture","clinical features","clinical presentation","presenting features","signs and symptoms","clinical findings","on examination","presentation","picture","features","feature","signs","sign","symptoms","symptom","manifestations","presents","present with","presenting","findings","clinically","clinical","examination","examine","on examination","looks like","recognise","recognize"],h:/\b(clinical|features?|picture|presentation|presents?|symptoms?|signs?|(?<!natural )history|examination|findings|recognising|recognition|manifestation)\b/,c:/\b(present\w*|symptom\w*|sign\w*|complain\w*|feature\w*|causes?|gives?|pain\w*|hoarse\w*|breath\w*|stridor|fever\w*|swell\w*|discharg\w*|weak\w*|loss|bleed\w*|tender\w*|red|bulging|cough\w*|aspirat\w*)\b/},
 {id:"dx",label:"Investigation",q:["how to diagnose","how do you diagnose","how to investigate","work up","workup","work-up","investigations","investigation","investigate","diagnosis","diagnose","diagnostic","tests","test","imaging","scan","assessment","assess","evaluation","evaluate","confirm"],h:/\b(investigat|diagnos|tests?|imaging|scans?|assessment|evaluation|work-?up|audiometry|ct|mri|ultrasound|biopsy|confirm)\b/,c:/\b(ct|mri|ultrasound|audiogram|biopsy|test\w*|imag\w*|scan\w*|confirm\w*)\b/},
 {id:"why",label:"Causes",q:["what causes","causes of","risk factors","aetiology","etiology","pathogenesis","pathophysiology","pathology","causes","cause","caused","why","mechanism","risk","due to"],h:/\b(causes?|aetiolog|etiolog|risk|pathogenesis|pathophysiolog|mechanism|why|pathology|organisms?|who gets)\b/,c:/\b(caus\w*|due to|risk|result\w* from|follow\w*)\b/},
 {id:"cx",label:"Complications",q:["complications","complication","sequelae","side effects","adverse effects","risks of","dangers"],h:/\b(complications?|sequelae|adverse|side effects|risks?|dangers?|cautions?|crisis)\b/,c:/\b(complicat\w*|risk|injur\w*|fistula|bleed\w*|haemorrhage|infection)\b/},
 {id:"ddx",label:"Differential diagnosis",q:["differential diagnosis","differential diagnoses","differentials","differential","ddx","mimics","versus","vs","distinguish","difference between"],h:/\b(differential|mimics?|versus|distinguish|or\b)/,c:/\b(differential|mimic\w*|distinguish\w*)\b/},
 {id:"cls",label:"Classification",q:["classification","classify","types","type","staging","stage","grading","grade","grades","stages","scale","scoring","score"],h:/\b(classification|types?|staging|stages?|grading|grades?|scale|score|kinds)\b/,c:/\b(type|grade|stage|class\w*)\b/},
 {id:"an",keep:1,label:"Anatomy",q:["anatomy","course","relations","blood supply","nerve supply","supply","drainage","landmarks","boundaries","embryology"],h:/\b(anatomy|course|relations|supply|drainage|landmarks?|boundaries|embryolog|nerves?|vessels)\b/,c:/\b(lies|runs|supplied|drains?|between|relation\w*)\b/},
 {id:"ind",label:"Indications",q:["indications for","indications","indication","when to operate","when to refer","when to do","contraindications","contraindication","criteria"],h:/\b(indications?|contraindications?|criteria|when|who needs|selection|choosing)\b/,c:/\b(indicat\w*|criteria)\b/},
 {id:"how",label:"Technique",q:["how to do","how is it done","technique","procedure","steps","step by step","operation","operative steps","surgical steps","approach"],h:/\b(technique|steps?|procedure|operation|approach|incision|exposure|stage by stage)\b/,c:/\b(incis\w*|elevat\w*|dissect\w*|expos\w*)\b/},
 {id:"px",label:"Prognosis",q:["prognosis","outcome","outcomes","survival","recurrence rate","natural history","recovery"],h:/\b(prognosis|outcomes?|survival|natural history|recovery|follow-?up)\b/,c:/\b(prognos\w*|survival|recover\w*|outcome\w*)\b/},
 {id:"def",label:"Definition",q:["what is","what are","define","definition","meaning of","describe"],h:/\b(definitions?|what it is|overview|nature)\b/,c:/\bis an?\b/}
];
/* soft synonyms: searched with half weight, never needed for a match */
const SOFT={injury:["palsy","damage","trauma"],injuries:["palsy","damage"],damage:["injury","palsy"],cancer:["carcinoma","tumor","malignancy"],carcinoma:["cancer"],tumor:["tumour","neoplasm","cancer"],bleeding:["haemorrhage","hemorrhage","bleed"],haemorrhage:["bleeding"],syndrome:["triad","disease"],disease:["syndrome"],infant:["child","neonate","newborn"],infants:["children","neonates"],child:["paediatric","infant"],children:["paediatric"],kid:["child"],kids:["children"],baby:["infant","neonate"],drugs:["drug","medication"],swallowed:["ingested","swallow"],coin:["coins","foreign body"],surgery:["operation","surgical"],operation:["surgery"],nerve:["nerves"],deafness:["hearing loss"],deaf:["hearing loss"]};
/* lay words and phrases, replaced before searching */
const LAY=[["nose bleed","epistaxis"],["nosebleed","epistaxis"],["nosebleeds","epistaxis"],["bleeding nose","epistaxis"],["dizzy","vertigo"],["dizziness","vertigo"],["giddiness","vertigo"],["ringing in the ears","tinnitus"],["ringing in the ear","tinnitus"],["ringing","tinnitus"],
 ["hard of hearing","hearing loss"],["deafness","hearing loss"],["deaf","hearing loss"],["hoarse voice","hoarseness"],["lost voice","aphonia"],["voice box","larynx"],["windpipe","trachea"],["gullet","oesophagus"],["food pipe","oesophagus"],["ear drum","tympanic membrane"],["eardrum","tympanic membrane"],
 ["glue ear","otitis media with effusion"],["swimmers ear","otitis externa"],["swimmer's ear","otitis externa"],["ear wax","wax"],["earwax","wax"],["earache","otalgia"],["ear ache","otalgia"],["ear pain","otalgia"],["ear discharge","otorrhoea"],["discharging ear","otorrhoea"],
 ["blocked nose","nasal obstruction"],["stuffy nose","nasal obstruction"],["runny nose","rhinorrhoea"],["loss of smell","anosmia"],["smell loss","anosmia"],["sore throat","pharyngitis tonsillitis"],["painful swallowing","odynophagia"],["difficulty swallowing","dysphagia"],["trouble swallowing","dysphagia"],
 ["noisy breathing","stridor"],["neck lump","neck mass"],["lump in the neck","neck mass"],["swollen glands","lymphadenopathy"],["bad breath","halitosis"],["dry mouth","xerostomia"],["tongue tie","tongue-tie"],["lockjaw","trismus"],["facial weakness","facial palsy"],["face drooping","facial palsy"],["bells palsy","bell palsy"],["bell's palsy","bell palsy"],
 ["snoring","snoring sleep apnoea"],["adams apple","thyroid cartilage"],["swallowed battery","button battery"],["voice nerve","recurrent laryngeal nerve"]];
/* clinical equivalents: searched softly alongside the topic */
const CONCEPT=[[/recurrent laryngeal nerve (injury|palsy|damage|paralysis|lesion|trauma)|(injury|palsy|damage) (of|to) (the )?recurrent laryngeal nerve/,"vocal fold paralysis recurrent nerve paralysis hoarseness"],
 [/facial nerve (injury|damage|lesion|paralysis|weakness)/,"facial palsy"],[/post ?tonsillectomy (bleed|bleeding|haemorrhage|hemorrhage)|bleeding after tonsillectomy/,"post-tonsillectomy haemorrhage secondary haemorrhage"],
 [/hypocalcaemia after thyroidectomy|post ?thyroidectomy hypocalc/,"hypoparathyroidism calcium"],[/swallowed|ingested/,"foreign body"],[/sinusitis/,"rhinosinusitis"],[/vocal cord/,"vocal fold"],[/(cancer|carcinoma|tumou?r) of the (\w+)/,"$2 cancer"]];
const FILLER=new Set("a an the of and or in on at to for with by from please tell me about give list explain describe ent its this that those these patient patients case cases is are was were be does do did when where which who whom what how much many can could should would will must best most more get gets got usually commonly common typical typically important main".split(" "));

/* ---------- model ---------- */
let M=null;
const b64=s=>{if(typeof Buffer!=="undefined")return new Uint8Array(Buffer.from(s,"base64"));const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u};
function setModel(meta,tokBuf,vecBuf){
 const dim=meta.dim,vocab=new Map();meta.vocab.forEach((w,i)=>vocab.set(w,i));
 const tq=new Int8Array(tokBuf),vq=new Int8Array(vecBuf);
 const ts=new Float32Array(b64(meta.tscale).buffer.slice(0));
 const ch=new Uint32Array(b64(meta.chunks).buffer.slice(0));
 const n=meta.n,vn=new Float32Array(n);
 for(let j=0;j<n;j++){let s=0;const o=j*dim;for(let k=0;k<dim;k++){const x=vq[o+k];s+=x*x}vn[j]=Math.sqrt(s)||1}
 const first=new Int32Array(meta.sections||0).fill(-1),cnt=new Int32Array(meta.sections||0);for(let j=0;j<n;j++){const sec=ch[j*3];if(first[sec]<0)first[sec]=j;cnt[sec]++}
 const abbr=Object.assign({},ABBR);for(const [k,v] of Object.entries(meta.abbr||{}))if(!SKIPABBR.has(k)&&!abbr[k]&&k.length>=3)abbr[k]=v;
 M={dim,vocab,tq,ts,vq,vn,ch,n,abbr,first,cnt,fp:meta.fp};return M}

/* BERT WordPiece, matching the model's tokenizer (lower case, accents stripped, punctuation split) */
function wordpiece(text){const ids=[];const V=M.vocab;
 const words=fold(text).replace(/([!-\/:-@\[-`{-~])/g," $1 ").split(/\s+/).filter(Boolean);
 for(const w of words){if(w.length>100){continue}let start=0;const sub=[];let bad=false;
  while(start<w.length){let end=w.length,cur=-1;
   while(start<end){let p=w.slice(start,end);if(start>0)p="##"+p;const id=V.get(p);if(id!==undefined){cur=id;break}end--}
   if(cur<0){bad=true;break}sub.push(cur);start=end}
  if(bad){const u=V.get("[UNK]");if(u!==undefined)ids.push(u)}else ids.push(...sub)}
 return ids}
function encode(text){const {dim,tq,ts}=M;const v=new Float32Array(dim);const ids=wordpiece(text);if(!ids.length)return null;
 for(const id of ids){const s=ts[id],o=id*dim;for(let k=0;k<dim;k++)v[k]+=tq[o+k]*s}
 let n=0;for(let k=0;k<dim;k++)n+=v[k]*v[k];n=Math.sqrt(n)||1;for(let k=0;k<dim;k++)v[k]/=n;return v}

/* ---------- keyword index over the sections ---------- */
let D=null;
function buildDocs(X){if(M&&M.fp){let c=0;for(const x of X)c+=x[4].length;if(M.fp!==X.length+":"+c){M=null;return null}}const docs=[],df=new Map();let tot=0;
 X.forEach((x,i)=>{const [ty,route,title,where,body]=x;const art=where.split(" · ")[0],chap=where.split(" · ").slice(1).join(" ");
  const tf=new Map();const add=(t,w)=>{for(const k of toks(t))tf.set(k,(tf.get(k)||0)+w)};
  add(title,3);add(art,2.5);add(chap,1.5);add(body,1);
  let len=0;tf.forEach(v=>len+=v);tot+=len;tf.forEach((v,k)=>df.set(k,(df.get(k)||0)+1));
  docs.push({i,ty,route,title,art,chap,where,body,tf,len,exam:/^for the examination/i.test(chap),ctx:toks(title+" "+chap),actx:toks(title+" "+chap+" "+art),at:new Set(toks(art))})});
 const inv=new Map();docs.forEach((d,j)=>d.tf.forEach((v,k)=>{let l=inv.get(k);if(!l)inv.set(k,l=[]);l.push(j)}));
 D={docs,df,inv,avg:tot/docs.length,N:docs.length};return D}
function idf(t){const l=D.inv.get(t);const n=l?l.length:0;return Math.log(1+(D.N-n+.5)/(n+.5))}
function bm25(qt,soft){const {docs,inv,avg}=D;const sc=new Map(),hit=new Map();const k1=1.2,b=.75;
 const run=(t,w,cnt)=>{const l=inv.get(t);if(!l)return;const id=idf(t);for(const j of l){const d=docs[j],f=d.tf.get(t);const s=w*id*f*(k1+1)/(f+k1*(1-b+b*d.len/avg));sc.set(j,(sc.get(j)||0)+s);if(cnt)hit.set(j,(hit.get(j)||0)+cnt)}};
 for(const t of new Set(qt))run(t,1,idf(t));
 for(const t of new Set(soft||[]))if(!qt.includes(t))run(t,.5,0);
 return {sc,hit}}

/* ---------- question parsing ---------- */
const ASPQ=ASPECTS.flatMap(a=>a.q.map(p=>[fold(p),a])).sort((x,y)=>y[0].length-x[0].length);
function parse(q){let s=" "+fold(q).replace(/[?.,;:!]/g," ").replace(/\s+/g," ").trim()+" ";const aspects=[];
 for(const [a,b] of LAY){const re=new RegExp(" "+a.replace(/[-'\/\\^$*+?.()|[\]{}]/g,"\\$&")+" ","g");s=s.replace(re," "+b+" ")}
 for(const [p,a] of ASPQ){const re=new RegExp(" "+p.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")+" ","g");if(re.test(s)){if(!aspects.includes(a))aspects.push(a);if(!a.keep)s=s.replace(re," ")}}
 let words=s.split(" ").filter(w=>w&&!FILLER.has(w));
 /* a lone aspect word with no topic: keep it as the topic ("tracheostomy complications" keeps "tracheostomy") */
 const ab=M?M.abbr:ABBR;const expanded=[];const abbrUsed=[];
 for(const w of words){const x=ab[w.replace(/s$/,"")]||ab[w];if(x&&!(w.length<=2&&!ABBR[w])){expanded.push(x);abbrUsed.push([w,x])}else expanded.push(w)}
 let topic=expanded.join(" ").trim();
 if(!topic&&aspects.length){topic=aspects.map(a=>a.label).join(" ");aspects.length=0}
 const soft=[];for(const [re,x] of CONCEPT){const m=topic.match(re);if(m)soft.push(x.replace(/\$(\d)/g,(_,k)=>m[+k]||""))}
 return {topic,soft:soft.join(" "),aspects,abbr:abbrUsed,raw:q}}

/* ---------- search ---------- */
function core(P,topic,softText){
 const qt=toks(topic);const soft=toks(softText||"");for(const w of fold(topic).split(/\s+/))(SOFT[w]||[]).forEach(x=>soft.push(...toks(x)));
 const {sc:lex,hit}=bm25(qt,soft);const qw=new Map();let qwt=0;for(const t of new Set(qt)){const w=idf(t);qw.set(t,w);qwt+=w}qwt=qwt||1;
 let lmax=0;lex.forEach(v=>{if(v>lmax)lmax=v});
 /* meaning: best chunk per section */
 const qv=encode(topic+(softText?" "+softText:""));const sem=new Map(),best=new Map();
 if(qv){const {dim,vq,vn,ch,n}=M;const qi=new Float32Array(dim);for(let k=0;k<dim;k++)qi[k]=qv[k];
  for(let j=0;j<n;j++){let s=0;const o=j*dim;for(let k=0;k<dim;k++)s+=vq[o+k]*qi[k];s/=vn[j];const sec=ch[j*3];if(s>(sem.get(sec)||-1)){sem.set(sec,s);best.set(sec,j)}}}
 let smax=0;sem.forEach(v=>{if(v>smax)smax=v});
 /* candidate pool: keyword hits plus the top sections by meaning */
 const pool=new Set(lex.keys());[...sem.entries()].sort((a,b)=>b[1]-a[1]).slice(0,300).forEach(([s])=>pool.add(s));
 const nq=1,qset=new Set(qt);const out=[];
 for(const j of pool){const d=D.docs[j];const l=lmax?(lex.get(j)||0)/lmax:0;const cov=(hit.get(j)||0)/qwt;
  let sm=sem.has(j)?Math.max(0,(sem.get(j)-.25)/Math.max(.05,smax-.25)):0;
  /* meaning alone, with none of the topic words, is often a false friend (quinsy and quinolone share a token) */
  sm*=.45+.55*Math.min(1,cov*1.2);
  let asp=0;if(P.aspects.length){for(const a of P.aspects){let x=0;if(d.exam)x=0;else if(a.h.test(fold(d.title)))x=1;else if(a.h.test(fold(d.chap)))x=.85;if(x>asp)asp=x}}
  let pen=1;if(/^(viva essentials|common pitfalls|consent|crisis drills|skills to sign off|before you start|the case at a glance|where the books differ|summary)$/i.test(d.title))pen=.72;
  if(d.ty==="ev")pen*=.85;
  out.push({i:d.i,j,s:(.42*l*(.6+.4*cov)+.40*sm+(P.aspects.length?.30*asp:0))*pen,lex:l,sem:sm,asp,cov,pen,chunk:best.get(j)})}
 out.sort((a,b)=>b.s-a.s);
 /* passages: in the leading sections, find where the topic words and the aspect meet (a window of two chunks),
    and whether the section is about the topic (topic words in its heading or its opening) */
 for(const r of out.slice(0,200)){const d=D.docs[r.j];const f=M.first[r.j],c=M.cnt[r.j];let pbest=0,pj=r.chunk;
  for(let k=0;k<c;k++){const jj=f+k;const a=M.ch[jj*3+1],b=M.ch[(Math.min(k+1,c-1)+f)*3+2];const txt=d.body.slice(a,b);const tk=new Set(toks(txt));for(const t of d.ctx)tk.add(t);
   let h=0;qset.forEach(t=>{if(tk.has(t))h+=qw.get(t)});let p=h/qwt;
   if(P.aspects.length&&p>0&&P.aspects.some(x=>x.c.test(fold(txt))))p*=2;
   if(p>pbest){pbest=p;pj=jj}}
  const ht=new Set(toks(d.title+" "+d.body.slice(0,160)));for(const t of d.actx)ht.add(t);let fh=0;qset.forEach(t=>{if(ht.has(t))fh+=qw.get(t)});const focus=fh/qwt;
  let ah=0;qset.forEach(t=>{if(d.at.has(t))ah+=qw.get(t)});r.art=ah/qwt;
  r.pas=pbest;r.focus=focus;if(pbest>0)r.chunk=pj;r.s+=(.12*Math.min(2,pbest)+.18*focus+.25*r.art)*r.pen}
 return out}
function search(q,opt){opt=opt||{};if(!M||!D)return null;const P=parse(q);if(!P.topic)return {P,list:[]};
 let out=core(P,P.topic,P.soft);
 /* a clinical equivalent ("RLN injury" = "vocal fold paralysis") is searched as a second topic and the better score kept */
 if(P.soft){const by=new Map(out.map(r=>[r.j,r]));for(const r of core(P,P.soft,P.topic)){r.s*=.95;const o=by.get(r.j);if(!o||r.s>o.s)by.set(r.j,r)}out=[...by.values()]}
 out.sort((a,b)=>b.s-a.s);
 /* at most two sections from one article in the top answers, so different articles surface */
 const seen=new Map(),res=[];for(const r of out){if(r.cov<.34&&r.sem<.6)continue;const a=D.docs[r.i].art;const c=seen.get(a)||0;if(c>=(opt.perArticle||2))continue;seen.set(a,c+1);res.push(r);if(res.length>=(opt.n||8))break}
 for(const r of res){const j=r.chunk;if(j!==undefined){const d=D.docs[r.i];const a=M.ch[j*3+1],b=M.ch[j*3+2];r.snip=d.body.slice(a,b)}}
 return {P,list:res}}

const API={setModel,buildDocs,search,parse,encode,toks,stem,wordpiece,ASPECTS,get ready(){return !!(M&&D)},doc:i=>D&&D.docs[i]};
if(typeof module!=="undefined"&&module.exports)module.exports=API;else root.XSMART=API;
})(typeof window!=="undefined"?window:this);
