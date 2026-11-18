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
 /* drugs */
 {id:"dose",label:"Dose",q:["duration of treatment","duration of antibiotics","how many days","duration","maximum dose","max dose","how much","doses","dose","dosage","dosing","regimen","how often"],h:/\b(doses?|dosage|dosing|regimen|duration)\b/,c:/\b\d+(\.\d+)? ?(mg|g|micrograms?|ml|units)\b/},
 {id:"preg",label:"Pregnancy and breastfeeding",q:["in pregnancy","pregnancy","pregnant","breastfeeding","breast feeding","breast-feeding","lactation"],h:/\b(pregnan\w*|breast-?feeding|lactation)\b/,c:/\b(pregnan\w*|breast-?feed\w*|teratogen\w*)\b/},
 {id:"se",label:"Side effects",q:["side effects","side effect","adverse effects","adverse effect","adverse reactions","toxicity","toxicities","unwanted effects"],h:/\b(adverse (effects?|reactions?)|side effects?|toxicit\w*|safety)\b/,c:/\b(toxicit\w*|side effects?)\b/},
 {id:"int",label:"Interactions",q:["drug interactions","interactions","interaction","interacts with","interact with"],h:/\binteractions?\b/,c:/\binteract\w*\b/},
 {id:"mech",label:"How it works",q:["mechanism of action","mode of action","how does it work","how do they work","how it works","pharmacology","pharmacokinetics"],h:/\b(how (it|they) works?|mechanism of action|mode of action|pharmacolog\w*|absorption and handling|^mechanism$)\b/,c:/\b(inhibits?|blocks?|binds?|agonist|antagonist)\b/},
 {id:"spec",label:"Spectrum",q:["antibacterial spectrum","organisms covered","spectrum"],h:/\bspectrum\b/,c:/\bspectrum\b/},
 /* presentations and operations */
 {id:"flag",label:"Red flags",q:["red flags","red flag","warning signs","warning features","worrying features","alarm features","alarm symptoms","danger signs","when to worry","urgent referral","refer urgently","do not miss"],h:/\b(red flags?|warning signs?|danger signs?|alarm|do not miss|when to worry)\b/,c:/\b(red flags?|suspected cancer pathway)\b/},
 {id:"hx",label:"History",q:["history taking","take a history","questions to ask","what to ask","history"],h:/\b((?<!natural )history|the questions|questions to ask|the first questions)\b/,c:/\bask (about|whether|how|when)\b/},
 {id:"exam",label:"Examination",q:["examination findings","how to examine","on examination","examination","examine"],h:/\b(examination|examine|inspection|palpation)\b/,c:/\b(examin\w*|palpat\w*)\b/},
 {id:"consent",label:"Consent",q:["what to tell the patient","risks to discuss","consenting","consent","counselling","counseling","counsel"],h:/\b(consent|what to tell the patient|counsel\w*)\b/,c:/\bconsent\w*\b/},
 {id:"pos",label:"Position",q:["patient position","positioning","position"],h:/\bposition(ing)?\b/,c:/\b(supine|shoulder roll|head ring|reverse trendelenburg|head turned)\b/},
 {id:"anaes",keep:1,label:"Anaesthesia",q:["type of anaesthesia","type of anesthesia","anaesthesia","anaesthetic","anesthesia","anesthetic"],h:/\b(anaesthe\w*|anesthe\w*)\b/,c:/\b(anaesthe\w*|anesthe\w*|intubat\w*)\b/},
 {id:"prep",keep:1,label:"Before the operation",q:["preoperative preparation","pre-operative preparation","preoperative assessment","pre-operative assessment","before the operation","before surgery","preparation","instruments","equipment","tray"],h:/\b(before the (procedure|operation)|preparation|pre-?operative|tray|instruments?|equipment|monitoring|antibiotics)\b/,c:/\b(pre-?operative\w*)\b/},
 {id:"post",label:"Aftercare",q:["postoperative care","post-operative care","post operative care","postoperative instructions","post-operative instructions","after the operation","after surgery","discharge advice","aftercare","after care"],h:/\b(after (the )?(operation|surgery|procedure|stapes surgery)|post-?operative|aftercare|discharge)\b/,c:/\b(post-?operative\w*)\b/},
 /* anatomy */
 {id:"nerve",keep:1,label:"Nerve supply",q:["nerve supply","sensory supply","motor supply","innervation","innervated by","supplied by which nerve"],h:/(^nerves?\b|\bnerve supply\b|\binnervation\b|\bnerves (of|related|and)\b|\bnerve and\b)/,c:/\b(supplied by|innervat\w*|nerve supply)\b/},
 {id:"blood",keep:1,label:"Blood supply",q:["arterial blood supply","blood supply","arterial supply","venous drainage","vascular supply"],h:/\b(blood supply|arterial supply|venous drainage|^arteries|^veins|^vessels|^arterial|pedicle)\b/,c:/\b(blood supply|venous drainage|pedicle)\b/},
 {id:"lymph",keep:1,label:"Lymphatic drainage",q:["lymphatic drainage","lymph drainage","lymphatics","lymphatic spread"],h:/\blymph\w*\b/,c:/\b(lymphatics?|drain\w* to the)\b/},
 {id:"bound",keep:1,label:"Boundaries",q:["boundaries","boundary","borders","walls","limits","bounded by"],h:/\b(boundar\w*|walls?|borders?|limits)\b/,c:/\b(bounded by|boundar\w*)\b/},
 {id:"cont",keep:1,label:"Contents",q:["structures passing through","what passes through","passes through","structures within","structures in","transmits","contents"],h:/\b(contents?|transmit\w*|structures (inside|within|in|passing))\b/,c:/\b(contains?|transmits?|passes? through)\b/},
 {id:"rel",keep:1,label:"Relations",q:["relations","relationship","related to"],h:/\brelations?\b/,c:/\b(related to|relations?)\b/},
 {id:"musc",keep:1,label:"Muscles",q:["muscles","muscle","musculature"],h:/\bmuscles?\b/,c:/\bmuscles?\b/},
 {id:"parts",keep:1,label:"Parts",q:["parts of","subdivisions","divisions","segments","subsites","components","parts"],h:/\b(parts?|divisions?|segments?|subsites?|components)\b/,c:/\b(divided into|segments?)\b/},
 {id:"branch",keep:1,label:"Branches",q:["branches of","branches","branch"],h:/\bbranch\w*\b/,c:/\bbranch\w*\b/},
 {id:"course",keep:1,label:"Course",q:["course of","course","pathway"],h:/\b(course|pathways?)\b/,c:/\b(runs|loops|hooks|ascends|descends)\b/},
 {id:"dev",label:"Development",q:["embryology","development","develops from","derived from","derivatives"],h:/\b(development|embryolog\w*|derivatives?)\b/,c:/\b(develops? from|derived from|pharyngeal arch)\b/},
 {id:"tx",label:"Treatment",q:["first aid","emergency treatment","treatment of choice","first line treatment","first-line treatment","first line","first-line","mainstay of treatment","how to treat","how do you treat","how to manage","how do you manage","managed","what to do","what should i do","what do you do","what do i do","how to deal with","next step","next steps","line of treatment","drug of choice","drugs for","medication for","medical treatment","surgical treatment","treatment options","treatment","treatments","treat","treated","management","managing","manage","therapy","tx","rx","cure"],h:/\b(treatment|management|manag\w*|therap\w*|medical|surgery|surgical|operation|drug|antibiotic|steroid|repair|what to do|options?|choosing)\b/,c:/\b(treat\w*|manag\w*|therap\w*|steroid|antibiotic|surgery|excis\w*|drain\w*|repair\w*)\b/,cx:/\b(treat\w*|manag\w*|therap\w*|steroids?|antibiotics?|surgery|surgical|excis\w*|drain\w*|repair\w*|drugs?|first[- ]line|medical\w*|\w+ectomy|\w+otomy|\w+plasty|radioiodine|radiotherapy|chemo\w*|cautery|packing|ligation|embolis\w*|antivirals?|analgesi\w*|decongestants?|antihistamines?|resect\w*|remov\w*)\b/},
 {id:"cf",label:"Clinical picture",q:["clinical picture","clinical features","clinical presentation","presenting features","signs and symptoms","clinical findings","presentation","picture","features","feature","signs","sign","symptoms","symptom","manifestations","presents","present with","presenting","findings","clinically","clinical","looks like","recognise","recognize"],h:/\b(clinical|features?|picture|presentation|presents?|symptoms?|signs?|(?<!natural )history|examination|findings|recognising|recognition|manifestation)\b/,c:/\b(present\w*|symptom\w*|sign\w*|complain\w*|feature\w*|pain\w*|hoarse\w*|breath\w*|stridor|fever\w*|swell\w*|discharg\w*|weak\w*|loss|bleed\w*|tender\w*|red|bulging|cough\w*|aspirat\w*)\b/,cx:/\b(present\w*|symptom\w*|sign\w*|complain\w*|feature\w*|pain\w*|hoarse\w*|breath\w*|stridor|fever\w*|swell\w*|discharg\w*|weak\w*|loss|bleed\w*|tender\w*|red|bulging|cough\w*|aspirat\w*|worse|better|onset|otalgia|vertigo|tinnitus|deafness|hearing|nausea|vomit\w*|itch\w*|obstruct\w*|dysphagia|odynophagia|lump|mass|ulcer\w*|numb\w*|palsy|diplopia|proptosis|headache|snor\w*|drool\w*|cry|voice|epistaxis)\b/},
 {id:"dx",label:"Investigation",q:["ct findings","ct signs","ct features","ct appearance","mri findings","mri signs","mri features","mri appearance","on ct","on mri","imaging findings","imaging features","radiological signs","radiological features","radiological findings","x-ray findings","radiology","diagnostic criteria","criteria for diagnosis","diagnostic features","investigation of choice","imaging of choice","test of choice","best investigation","best test","gold standard investigation","gold standard test","gold standard","how is it diagnosed","how is diagnosed","how to diagnose","diagnosed","confirmed","how do you diagnose","how to investigate","work up","workup","work-up","investigations","investigation","investigate","diagnosis","diagnose","diagnostic","tests","test","imaging","scan","assessment","assess","evaluation","evaluate","confirm"],h:/\b(investigat\w*|diagnos\w*|tests?|imaging|scans?|assessment|evaluation|work-?up|audiometry|ct|mri|ultrasound|biopsy|confirm)\b/,c:/\b(ct|mri|ultrasound|audiogram|biopsy|test\w*|imag\w*|scan\w*|confirm\w*)\b/},
 {id:"why",label:"Causes",q:["most common causes","most common cause","commonest causes","commonest cause","what causes","causes of","risk factors","aetiology","etiology","pathogenesis","pathophysiology","pathology","causes","cause","caused","why","mechanism","risk","due to"],h:/\b(causes?|aetiolog\w*|etiolog\w*|risk|pathogenesis|pathophysiolog\w*|mechanism|why|pathology|organisms?|who gets)\b/,c:/\b(caus\w*|due to|risk|result\w* from|follow\w*)\b/},
 {id:"cx",label:"Complications",q:["complications","complication","sequelae","risks of","dangers"],h:/\b(complications?|sequelae|adverse|side effects|risks?|dangers?|cautions?|crisis)\b/,c:/\b(complicat\w*|risk|injur\w*|fistula|bleed\w*|haemorrhage|infection)\b/},
 {id:"ddx",label:"Differential diagnosis",q:["differential diagnosis","differential diagnoses","differentials","differential","ddx","mimics","versus","vs","distinguish","difference between"],h:/\b(differential|mimics?|versus|distinguish|or\b)/,c:/\b(differential|mimic\w*|distinguish\w*)\b/},
 {id:"cls",label:"Classification",q:["classification","classify","types","type","staging","stage","grading","grade","grades","stages","scale","scoring","score"],h:/\b(classification|types?|staging|stages?|grading|grades?|scale|score|kinds)\b/,c:/\b(type|grade|stage|class\w*)\b/},
 {id:"an",keep:1,label:"Anatomy",q:["structures at risk","nerves at risk","at risk","danger structures","applied anatomy","surgical anatomy","anatomy","landmarks","landmark","supply","drainage"],h:/\b(anatomy|course|relations|supply|drainage|landmarks?|boundaries|embryolog\w*|nerves?|vessels)\b/,c:/\b(lies|runs|supplied|drains?|between|relation\w*)\b/},
 {id:"ci",label:"Contraindications",q:["contraindications to","contraindications for","contraindications of","contra indications","contra-indications","contraindications","contraindication","contraindicated","when not to","when to avoid","should not be given","should not be used"],h:/\b(contra-?indications?|contraindicated|cautions?|when not to|avoid)\b/,c:/\b(contra-?indicat\w*)\b/,cx:/\b(contra-?indicat\w*|avoid\w*|never|must not|should not|not (be )?(used|given|done))\b/},
 {id:"ind",label:"Indications",q:["what is it used for","used for","uses of","uses","when should i operate","when should i do","when should we do","when should you do","when to perform","when do you operate","when do you do","when is it indicated","who needs","indications for","indications","indication","when to operate","when to refer","when to do","criteria"],h:/\b(indications?|criteria|when|who needs|selection|choosing)\b/,c:/\b(?<!contra-?)(indicat\w*|criteria)\b/},
 {id:"how",label:"Technique",q:["how to do","how is it done","technique","procedure","steps","step by step","operation","operative steps","surgical steps","approach"],h:/\b(technique|steps?|procedure|operation|approach|incision|exposure|stage by stage)\b/,c:/\b(incis\w*|elevat\w*|dissect\w*|expos\w*)\b/},
 {id:"px",label:"Prognosis",q:["prognosis","outcome","outcomes","survival","recurrence rate","natural history","recovery"],h:/\b(prognosis|outcomes?|survival|natural history|recovery|follow-?up)\b/,c:/\b(prognos\w*|survival|recover\w*|outcome\w*)\b/},
 {id:"def",label:"Definition",q:["what does it stand for","stand for","stands for","abbreviation for","what is","what are","define","definition","meaning of","describe"],h:/\b(definitions?|what it is|overview|nature)\b/,c:/\bis an?\b/}
];
/* soft synonyms: searched with half weight, never needed for a match */
const SOFT={injury:["palsy","damage","trauma"],injuries:["palsy","damage"],damage:["injury","palsy"],cancer:["carcinoma","tumor","malignancy"],carcinoma:["cancer"],tumor:["tumour","neoplasm","cancer"],bleeding:["haemorrhage","hemorrhage","bleed"],haemorrhage:["bleeding"],syndrome:["triad","disease"],disease:["syndrome"],infant:["child","neonate","newborn"],infants:["children","neonates"],child:["paediatric","infant"],children:["paediatric"],kid:["child"],kids:["children"],baby:["infant","neonate"],drugs:["drug","medication"],swallowed:["ingested","swallow"],coin:["coins","foreign body"],surgery:["operation","surgical"],operation:["surgery"],nerve:["nerves"],deafness:["hearing loss"],deaf:["hearing loss"]};
/* lay words and phrases, replaced before searching */
const LAY=[["tympanogram","tympanometry"],["tympanograms","tympanometry"],["nose bleed","epistaxis"],["nosebleed","epistaxis"],["nosebleeds","epistaxis"],["bleeding nose","epistaxis"],["dizzy","vertigo"],["dizziness","vertigo"],["giddiness","vertigo"],["ringing in the ears","tinnitus"],["ringing in the ear","tinnitus"],["ringing","tinnitus"],
 ["hard of hearing","hearing loss"],["deafness","hearing loss"],["deaf","hearing loss"],["hoarse voice","hoarseness"],["lost voice","aphonia"],["voice box","larynx"],["windpipe","trachea"],["gullet","oesophagus"],["food pipe","oesophagus"],["ear drum","tympanic membrane"],["eardrum","tympanic membrane"],
 ["glue ear","otitis media with effusion"],["swimmers ear","otitis externa"],["swimmer's ear","otitis externa"],["ear wax","wax"],["earwax","wax"],["earache","otalgia"],["ear ache","otalgia"],["ear pain","otalgia"],["ear discharge","otorrhoea"],["discharging ear","otorrhoea"],
 ["blocked nose","nasal obstruction"],["stuffy nose","nasal obstruction"],["runny nose","rhinorrhoea"],["loss of smell","anosmia"],["smell loss","anosmia"],["sore throat","pharyngitis tonsillitis"],["painful swallowing","odynophagia"],["difficulty swallowing","dysphagia"],["trouble swallowing","dysphagia"],
 ["noisy breathing","stridor"],["neck lump","neck mass"],["lump in the neck","neck mass"],["swollen glands","lymphadenopathy"],["bad breath","halitosis"],["dry mouth","xerostomia"],["tongue tie","tongue-tie"],["lockjaw","trismus"],["facial weakness","facial palsy"],["face drooping","facial palsy"],["bells palsy","bell palsy"],["bell's palsy","bell palsy"],
 ["snoring","snoring sleep apnoea"],["adams apple","thyroid cartilage"],["swallowed battery","button battery"],["voice nerve","recurrent laryngeal nerve"]];
/* clinical equivalents: searched softly alongside the topic */
const CONCEPT=[[/recurrent laryngeal nerve (injury|palsy|damage|paralysis|lesion|trauma)|(injury|palsy|damage) (of|to) (the )?recurrent laryngeal nerve/,"vocal fold paralysis recurrent nerve paralysis hoarseness"],
 [/facial nerve (injury|damage|lesion|paralysis|weakness)/,"facial palsy"],[/post ?tonsillectomy (bleed|bleeding|haemorrhage|hemorrhage)|bleeding after tonsillectomy/,"post-tonsillectomy haemorrhage secondary haemorrhage"],
 [/hypocalcaemia after thyroidectomy|post ?thyroidectomy hypocalc/,"hypoparathyroidism calcium"],[/swallowed|ingested/,"foreign body"],[/sinusitis/,"rhinosinusitis"],[/vocal cord/,"vocal fold"],[/(cancer|carcinoma|tumou?r) of the (\w+)/,"$2 cancer"]];
const FILLER=new Set("choice year years old aged age month months week weeks day days history a an the of and or in on at to for with by from please tell me about give list explain describe ent its this that those these patient patients case cases is are was were be does do did when where which who whom what how much many can could should would will must best most more get gets got usually commonly common typical typically important main you your would i we me us".split(" "));

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
const ANATQ=new Set(["nerve","blood","lymph","bound","cont","rel","musc","parts","branch","course","dev"]);
const ASPQ=ASPECTS.flatMap(a=>a.q.map(p=>[fold(p),a])).sort((x,y)=>y[0].length-x[0].length);
/* misspelt aspect words ("sings", "managment", "complciations") are put right before parsing */
const ASPW=[...new Set(ASPECTS.flatMap(a=>a.q).filter(p=>!p.includes(" ")&&p.length>=5))];
function fixAspectWords(s,fixed){return s.split(" ").map(w=>{if(w.length<4||ASPW.includes(w))return w;let best=null,bd=9;
 for(const a of ASPW){const max=a.length>=8?2:1;if(Math.abs(a.length-w.length)>max)continue;const e=edit(w,a,max);if(e<=max&&e<bd){bd=e;best=a}}
 if(best&&!(D&&(surface(),SURFW.has(w)))){fixed.push([w,best]);return best}return w}).join(" ")}
function parse(q){const fixedA=[];let s=" "+fixAspectWords(fold(q).replace(/[?.,;:!]/g," ").replace(/\s+/g," ").trim(),fixedA)+" ";const aspects=[];
 for(const [a,b] of LAY){const re=new RegExp(" "+a.replace(/[-'\/\\^$*+?.()|[\]{}]/g,"\\$&")+" ","g");s=s.replace(re," "+b+" ")}
 for(const [p,a] of ASPQ){const re=new RegExp(" "+p.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")+" ","g");if(re.test(s)){if(!aspects.includes(a))aspects.push(a);
  /* "CT signs of X", "X on MRI": the modality stays in the topic, so the lines about that scan are the ones picked */
  if(!a.keep){const mod=p.match(/\b(ct|mri|x-ray|ultrasound)\b/);s=s.replace(re,mod?" "+mod[1]+" ":" ")}}}
 let words=s.split(" ").filter(w=>w&&!FILLER.has(w));
 /* a lone aspect word with no topic: keep it as the topic ("tracheostomy complications" keeps "tracheostomy") */
 const ab=M?M.abbr:ABBR;const expanded=[];const abbrUsed=[];
 for(const w of words){const x=ab[w.replace(/s$/,"")]||ab[w];if(x&&!(w.length<=2&&!ABBR[w])){expanded.push(x);abbrUsed.push([w,x])}else expanded.push(w)}
 let topic=expanded.join(" ").trim();
 if(!topic&&aspects.length){topic=aspects.map(a=>a.label).join(" ");aspects.length=0}
 /* "nerve supply", "blood supply": the part of the anatomy asked for, not anatomy in general */
 if(aspects.some(a=>ANATQ.has(a.id))){const k=aspects.findIndex(a=>a.id==="an");if(k>=0)aspects.splice(k,1)}
 /* "what is the treatment of X": the treatment is asked for, not a definition */
 if(aspects.length>1){const k=aspects.findIndex(a=>a.id==="def");if(k>=0)aspects.splice(k,1)}
 /* superlatives ("drug of choice", "commonest cause", "gold standard") pick out the line that names the one */
 const sup=SUPQ.test(fold(q));
 /* "difference between X and Y", "X vs Y", "compare X and Y": two conditions side by side */
 let parts=null;const fq=" "+fold(q).replace(/[?.,;:!]/g," ").replace(/\s+/g," ")+" ";
 if(/ (difference|differences|differentiate|distinguish|distinguishing|compare|comparison|contrast|versus|vs) /.test(fq)){
  let m=fq.match(/ (?:between|compare|comparing|comparison of|contrast|differentiate|distinguish|distinguishing) (.+?) (?:and|from|with|vs|versus) (.+?)(?: in | regarding | as to |$)/)||fq.match(/ (.+?) (?:vs|versus) (.+?)(?: in |$)/);
  if(m){const clean=x=>x.replace(/^ *(the|a|an) /,"").replace(/ (clinically|radiologically|on ct|on mri|on imaging|on examination|treatment|management|features|symptoms|signs)$/,"").trim();parts=[clean(m[1]),clean(m[2])].filter(Boolean);if(parts.length<2)parts=null}}
 if(parts){const k=aspects.findIndex(a=>a.id==="ddx");if(k>=0)aspects.splice(k,1)}
 const soft=[];for(const [re,x] of CONCEPT){const m=topic.match(re);if(m)soft.push(x.replace(/\$(\d)/g,(_,k)=>m[+k]||""))}
 return {topic,soft:soft.join(" "),aspects,abbr:abbrUsed,raw:q,fixed:fixedA,sup,parts}}
const SUPQ=/\b(commonest site|most common site|of choice|gold standard|first[- ]line|most common|commonest|mainstay|best (test|investigation|treatment|drug)|definitive|cornerstone)\b/;
const SUPL=/\b(of choice|gold standard|first[- ]line|most common|commonest|mainstay|definitive|cornerstone|the best|is the (main|usual|standard)|standard (treatment|test|investigation)|usually (needs|requires|treated)|most (cases|patients))\b/i;

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
  if(d.ty==="ev")pen*=.85;if(d.ty==="q"||d.ty==="viva"||d.ty==="card")pen*=.82;
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
/* spelling: a topic word that is in no section is replaced by the closest word that is (one or two letters off) */
let SURF=null,SURFW=null;
function surface(){if(SURF)return SURF;SURF=new Map();const seen=new Map();SURFW=seen;
 for(const d of D.docs)for(const w of fold(d.title+" "+d.body).split(/[^a-z0-9]+/)){if(w.length<3||seen.has(w))continue;seen.set(w,1);const c=cw(w);if(!c)continue;const l=SURF.get(c[0])||SURF.set(c[0],new Map()).get(c[0]);if(!l.has(c))l.set(c,w)}
 return SURF}
function edit(a,b,max){if(Math.abs(a.length-b.length)>max)return max+1;const n=b.length;let pp=null,p=[...Array(n+1).keys()],c;
 for(let i=1;i<=a.length;i++){c=new Array(n+1);c[0]=i;let mn=i;for(let j=1;j<=n;j++){let v=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));
  if(pp&&i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])v=Math.min(v,pp[j-2]+1);c[j]=v;if(v<mn)mn=v}if(mn>max)return max+1;pp=p;p=c}return p[n]}
function correct(topic){const fixed=[];const words=topic.split(" ").map(w=>{const t=toks(w);if(t.length!==1)return w;const k=t[0];if(k.length<4||D.inv.has(k)||/\d/.test(k))return w;
  const S=surface();const max=k.length>=8?2:1;let best=null,bd=9,bn=0;
  for(const first of new Set([k[0],k[1]])){const l=S.get(first);if(!l)continue;for(const [c,surf] of l){if(Math.abs(c.length-k.length)>max)continue;const e=edit(k,c,max);if(e>max)continue;const n=(D.inv.get(c)||[]).length;if(e<bd||(e===bd&&n>bn)){bd=e;bn=n;best=surf}}}
  if(best){fixed.push([w,best]);return best}return w});
 return {topic:words.join(" "),fixed}}
function search(q,opt){opt=opt||{};if(!M||!D)return null;const P=parse(q);if(!P.topic)return {P,list:[]};
 {const c=correct(P.topic);if(c.fixed.length){P.topic=c.topic;P.fixed=(P.fixed||[]).concat(c.fixed);const re=CONCEPT;const soft=[];for(const [r,x] of re){const m=P.topic.match(r);if(m)soft.push(x.replace(/\$(\d)/g,(_,k)=>m[+k]||""))}P.soft=soft.join(" ")}}
 let out=core(P,P.topic,P.soft);
 /* a clinical equivalent ("RLN injury" = "vocal fold paralysis") is searched as a second topic and the better score kept */
 if(P.soft){const by=new Map(out.map(r=>[r.j,r]));for(const r of core(P,P.soft,P.topic)){r.s*=.95;const o=by.get(r.j);if(!o||r.s>o.s)by.set(r.j,r)}out=[...by.values()]}
 /* a question about a scan ("cholesteatoma on CT") prefers the imaging course and the imaging cases */
 if(/\b(ct|mri|ultrasound|x-ray)\b/.test(P.topic))for(const r of out){const d=D.docs[r.i];if(d.ty==="cond"||/^cl:t-im_/.test(d.route))r.s*=1.3}
 out.sort((a,b)=>b.s-a.s);
 /* at most two sections from one article in the top answers, so different articles surface */
 const seen=new Map(),res=[];for(const r of out){if(r.cov<.34&&r.sem<.6)continue;const a=D.docs[r.i].art;const c=seen.get(a)||0;if(c>=(opt.perArticle||2))continue;seen.set(a,c+1);res.push(r);if(res.length>=(opt.n||8))break}
 for(const r of res){const j=r.chunk;if(j!==undefined){const d=D.docs[r.i];const a=M.ch[j*3+1],b=M.ch[j*3+2];r.snip=d.body.slice(a,b)}}
 const pool=[];for(const r of out){if(r.cov<.34&&r.sem<.6)continue;pool.push(r);if(pool.length>=40)break}
 return {P,list:res,pool}}

/* ---------- the answer box ----------
   Picks the three or four sentences that answer the question from the best sections, word for word.
   Nothing is generated, so nothing can be invented: every line is a quotation that links to where it stands.
   Sections arrive with one block (paragraph, list item, heading) per line; a short line without a full stop
   is a heading and labels the lines under it ("Unilateral", "2.1.2 Clinical picture"). */
const NOSPLIT=/(?:\b[A-Z]|\be\.g|\bi\.e|\bvs|\bapprox|\bcf|\bfig|\bFig|\bSt|\bDr|\bno|\bNo|\bspp|\bet al)\.$/;
function units(body){const out=[];let label="",head=null,skip=false;const lines=body.split("\n").map(x=>x.trim()).filter(Boolean);
 const two=ln=>{const c=ln.split("\t\t");return c.length===2&&!/\t/.test(c[0])&&!/\t/.test(c[1])&&c[0].trim()&&c[1].trim()?c:null};
 /* rows of a summary table ("Adult dose" + value): the first cell is a row header, so the row looks like a header row; a run of them, or one long value, is data */
 const lv=lines.map((ln,k)=>{const c=two(ln);return !!c&&(c[1].trim().length>30||!!two(lines[k-1]||"")||!!two(lines[k+1]||""))});
 lines.forEach((ln,k)=>{
  if(/\t\t/.test(ln)){const hc=ln.split("\t\t").map(x=>x.trim());
   /* a header row has short cells; "Adult dose\t\t500 mg three times daily" is a labelled row of a summary table (its first cell is a row header) */
   if(!lv[k])head=hc;else{const lab=hc[0].replace(/[:.]$/,"");out.push({t:lab+": "+hc[1],label,row:true,rowLabel:lab,first:false,k:out.length,line:k,needle:hc[1].slice(0,160)})}return} /* table header: cells end in a double tab */
  if(/^(figure|table|video) \d/i.test(ln))return;
  if(/^where the books differ/i.test(ln)){skip=true;return}
  if(skip){if(/^in practice\b/i.test(ln)){skip=false;ln=ln.replace(/^in practice:?\s*/i,"");if(!ln)return}else return}
  if(/\t/.test(ln)){const raw=ln.split("\t").map(x=>x.trim());const c=raw.filter(x=>x&&!/^\d+\.?$/.test(x));if(!c.length)return;
   let t;if(c.length>2&&head&&head.length===raw.length)t=c[0].replace(/[:.]$/,"")+": "+raw.slice(1).map((x,m)=>x?(head[m+1]?head[m+1]+" — ":"")+x:"").filter(Boolean).join("; ");
   else t=c.length>1?c[0].replace(/[:.]$/,"")+": "+c.slice(1).join("; "):c[0];
   out.push({t,label,row:true,first:false,k:out.length,line:k,needle:c.slice().sort((x,y)=>y.length-x.length)[0]});return}
  head=null;const words=ln.split(" ").length;
  if(k<lines.length-1&&words<=9&&!/[.!?;]$/.test(ln)&&!/:\s/.test(ln)){label=ln.replace(/^[\d.]+\s+/,"").replace(/:$/,"");return}
  const parts=[];let cur="";for(const piece of ln.split(/(?<=[.!?])\s+(?=[A-Z(\d])/)){cur=cur?cur+" "+piece:piece;if(!NOSPLIT.test(cur)){parts.push(cur);cur=""}}if(cur)parts.push(cur);
  parts.forEach((t,m)=>out.push({t:t.replace(/^In practice\s+/,""),label,row:false,first:m===0&&out.length===0,k:out.length,line:k}))});
 return out}
const XREF=/\b(is|are) in [A-Z][a-z]|\b(are|is) (described|covered|discussed|dealt with)( in full| in detail| fully)? (in|under)\b|\bare in [A-Z]|^see |^on call:|^approach:? /i;
function tidy(t){return t.replace(/\s+([,.;:)])/g,"$1").replace(/\(\s+/g,"(").replace(/\s+/g," ").trim()}
function cos(a,b){let s=0;for(let k=0;k<a.length;k++)s+=a[k]*b[k];return s}
const STRICT={ci:/\b(contra-?indications?|contraindicated)\b/,tx:/\b(treatment|management|therap\w*|medical|what to do|removal)\b/,ind:/\b(?<!contra-?)(indications?|criteria|who needs|selection)\b/,cx:/\b(complications?|sequelae|adverse|side effects)\b/,why:/\b(causes?|aetiolog\w*|etiolog\w*|risk factors?|pathogenesis)\b/,how:/\b(technique|steps?|stage by stage)\b/};
const HS=a=>STRICT[a.id]||a.h;
/* words that change which disease is meant: they must agree between the question and the section */
const QUAL=new Set("acute chronic recurrent necrotising necrotizing malignant benign pulsatile subjective objective unilateral bilateral congenital acquired paediatric pediatric child children infant infants neonatal adult primary secondary allergic nonallergic viral bacterial fungal invasive noninvasive suppurative secretory serous atrophic hypertrophic sudden progressive central peripheral conductive sensorineural mixed anterior posterior superior inferior external middle inner internal".split(" ").map(w=>cw(w)).filter(Boolean));
const PRON=/^(it|its|they|their|this|these|the (disease|condition|lesion|tumour|patient|operation|procedure|nerve|drug))\b/i;
/* ---------- the answer map (built by tools/build_answers.js from tools/answers/*.json) ----------
   Every line is labelled with the condition it is about and what it answers, so the lines that answer
   "treatment of Bell's palsy" are gathered from every article, the condition's own article first. */
let AM=null;
function setAnswers(m){AM=null;if(m&&m.asp)m.asp=m.asp;if(!m||!D)return false;const [n,len]=String(m.fp).split(":").map(Number);let c=0;for(let i=0;i<n&&i<D.docs.length;i++)c+=D.docs[i].body.length;if(c!==len)return false;
 const ab=M?M.abbr:ABBR;const ali=[];m.e.forEach((names,i)=>{for(const a of new Set(names)){const t=toks(a);if(t.length)ali.push({i,t,n:t.length});
   /* the same name with its abbreviations spelt out, as the question is ("tb lymphadenitis" -> "tuberculosis lymphadenitis") */
   const x=fold(a).split(/\s+/).map(w=>ab[w]&&w.length>1?ab[w]:w).join(" ");if(x!==fold(a)){const t2=toks(x);if(t2.length)ali.push({i,t:t2,n:t2.length})}}});ali.sort((a,b)=>b.n-a.n);
 const by=new Map(),cnt=new Map(),home=new Map();const L=m.l;
 for(let j=0;j<L.length;j+=5){const [doc,k,e,a,w]=[L[j],L[j+1],L[j+2],L[j+3],L[j+4]];const key=e+"|"+m.asp[a];let l=by.get(key);if(!l)by.set(key,l=[]);l.push([doc,k,w/10]);
  const ar=D.docs[doc].route.split("~")[0];const hk=e+"|"+ar;cnt.set(hk,(cnt.get(hk)||0)+1)}
 cnt.forEach((v,hk)=>{const [e,ar]=hk.split("|");const h=home.get(+e);if(!h||v>h[1])home.set(+e,[ar,v])});(m.h||[]).forEach((r,e)=>{if(r)home.set(e,[r,1e9])});
 AM={names:m.e,ali,by,home,asp:[...new Set(m.asp)],par:m.p||[]};return true}
let ENTFOCUS=[];const KIDS=new Set(["child","children","infant","infants","paediatric","pediatric","childhood","neonate","neonatal","baby","babies"].map(w=>cw(w)).filter(Boolean));
const AGEW=new Set(["child","children","infant","infants","paediatric","pediatric","adult","neonatal"].map(w=>cw(w)).filter(Boolean));
/* every condition named in the question, longest names first, without overlaps */
function entitiesOf(topic){if(!AM)return [];const TA=toks(topic),T=new Set(TA);const used=new Set(),out=[];
 /* names of equal length: the one written in the question's own word order first ("otitis media with effusion become chronic" is
    effusion, not chronic otitis media), then the one with rarer words ("first aid for epistaxis" is epistaxis, not AIDS) */
 const ord=a=>{const j=TA.indexOf(a.t[0]);return j>=0&&a.t.every((x,k)=>TA[j+k]===x)?1:0};const rare=a=>D?a.t.reduce((m,x)=>m+idf(x),0):0;
 const C=AM.ali.filter(a=>a.t.every(x=>T.has(x))).map(a=>({a,o:ord(a),r:rare(a)})).sort((x,y)=>y.a.n-x.a.n||y.o-x.o||y.r-x.r).map(x=>x.a);
 for(const a of C){if(a.t.some(x=>used.has(x)))continue;if(out.some(o=>o.i===a.i))continue;
  /* the same name for two conditions: prefer the one that has its own description */
  out.push(a);a.t.forEach(x=>used.add(x))}
 return out}
/* the words of anatomy and other kept question phrases ("branches", "nerve supply") name the part asked about, not a narrower topic */
const KEEPTOK=new Set(ASPECTS.filter(a=>a.keep).flatMap(a=>a.q.flatMap(p=>toks(p))));
const PROC=/(ectomy|otomy|ostomy|oscopy|plasty|pexy|surgery|operation|repair|drainage|biopsy|dissection|implant|tracheostomy|grommets?|ventilation tubes?|myotomy|ligation|reduction)\b/i;
function entityOf(topic,asp){if(!AM)return null;const T=new Set(toks(topic));const all=entitiesOf(topic);if(!all.length)return null;
 let best=all[0];
 for(const a of all.slice(1))if(a.n===best.n&&AM.by.has(a.i+"|def")&&!AM.by.has(best.i+"|def"))best=a;
 /* "tonsillectomy in recurrent tonsillitis" asked for indications or risks is about the operation */
 if(all.length>1&&asp&&asp.some(x=>/^(ind|ci|how|cx|consent|pos|anaes|prep|post)$/.test(x))){const op=all.find(a=>PROC.test(AM.names[a.i][0]));if(op)best=op}
 /* "epidermoid on MRI": the scan is how, the condition is what */
 if(all.length>1&&/^(ct|mri|ultrasound|x-ray|imaging)$/i.test(AM.names[best.i][0])){const c=all.find(a=>!/^(ct|mri|ultrasound|x-ray|imaging)$/i.test(AM.names[a.i][0]));if(c)best=c}
 /* a drug question ("duration of amoxicillin for otitis media", "side effects of ...") is about the drug */
 if(all.length>1&&asp&&asp.some(x=>/^(dose|se|int|mech|spec|preg)$/.test(x))){const dr=all.find(a=>/^cl:t-dr_/.test((AM.home.get(a.i)||[""])[0]));if(dr)best=dr}
 /* otherwise a condition named as long as a procedure is the subject ("hoarseness before laryngoscopy") */
 else if(all.length>1&&PROC.test(AM.names[best.i][0])){const c=all.find(a=>a.n===best.n&&!PROC.test(AM.names[a.i][0]));if(c)best=c}
 /* a word that changes the disease (acute, chronic, necrotising) must not be left over, unless another condition in the question explains it */
 const covered=new Set(all.flatMap(a=>a.t));
 for(const t of T)if(QUAL.has(t)&&!AGEW.has(t)&&!best.t.includes(t)&&!(covered.has(t)&&best!==all[0]))return null;
 ENTFOCUS=[...T].filter(t=>!best.t.includes(t)&&t.length>2&&!KEEPTOK.has(t));
 return best.i}
let CTXK=new Set();
let HEADK=new Set(),CTXF=new Set();
function answerMap(P,opt){if(!AM)return null;CTXK=new Set();HEADK=new Set();CTXF=new Set();const e=opt.e!==undefined?opt.e:entityOf(P.topic,P.aspects.map(a=>a.id));if(e===null)return null;if(opt.e!==undefined)ENTFOCUS=opt.focus||[];
 const asp=P.aspects.length?P.aspects.map(a=>a.id):["def"];let lab=[];for(const a of asp)lab=lab.concat(AM.by.get(e+"|"+a)||[]);
 /* no aspect asked ("cartilages of the larynx", "triangles of the neck"): the definition first, but any section whose heading names what was asked can answer */
 if(!P.aspects.length){const TT0=toks(P.topic||"").filter(t=>t.length>2&&!STOP.has(t));const own=new Set(lab.map(x=>x[0]));
  for(const id of AM.asp){if(id==="def")continue;for(const [d,k,w] of AM.by.get(e+"|"+id)||[]){if(own.has(d))continue;const ht=new Set(toks(D.docs[d].title));if(TT0.length&&TT0.some(t=>ht.has(t)))lab.push([d,k,TT0.every(t=>ht.has(t))?w:w*.8])}}}
 /* a narrower question with no lines of its own takes the nearest wider one: side effects -> complications, dose -> treatment,
    nerve supply -> anatomy, red flags -> clinical picture */
 if(lab.reduce((m,x)=>Math.max(m,x[2]),0)<.5){const FB={dose:["tx"],se:["cx"],cx:["se"],preg:["ci"],int:["ci"],mech:["why","def"],why:["mech"],spec:["def","ind"],flag:["cf","dx"],hx:["cf"],exam:["cf","dx"],consent:["cx","ind"],pos:["how","prep"],anaes:["prep","how"],prep:["dx","how"],post:["tx","cx"],nerve:["an"],blood:["an"],lymph:["an"],bound:["an"],cont:["an"],rel:["an"],musc:["an"],parts:["an","def"],branch:["an"],course:["an"],dev:["an","why"],an:["def"],ind:["tx"]};
  for(const a of asp)for(const f of FB[a]||[])lab=lab.concat((AM.by.get(e+"|"+f)||[]).map(([d,k,w])=>[d,k,w*.9]))}
 /* "indications for surgery in X" when X has no indications heading: the treatment lines that say when */
 if(lab.reduce((m,x)=>Math.max(m,x[2]),0)<.5&&asp.some(a=>a==="ind"||a==="ci")){const re=asp.includes("ci")?/\b(contra-?indicat\w*|avoid\w*|never|must not|should not|cautions?|unsafe|not suitable)\b/i:/\b(persist\w*|despite|fail\w*|refractory|indicat\w*|when|unless|reserved for|for patients|if the)\b/i;
  const src=asp.includes("ci")?[...new Map(AM.asp.flatMap(id=>AM.by.get(e+"|"+id)||[]).map(x=>[x[0]+"|"+x[1],x])).values()]:(AM.by.get(e+"|tx")||[]);
  lab=lab.concat(src.filter(([d,k])=>{const u=units(D.docs[d].body)[k];return u&&re.test(u.t)}).map(([d,k,w])=>[d,k,Math.max(w,.6)*.9]))}
 /* words left over after the condition's name ("in a child") pick out the lines that mention them */
 const focus=ENTFOCUS.slice();if(/contra-?indicat/i.test(P.raw||""))focus.push(...toks("contraindication contraindicated contraindications"));if(focus.length){let all=lab;if(!P.aspects.length){all=[];for(const id of AM.asp)all=all.concat(AM.by.get(e+"|"+id)||[])}
  const hit=all.filter(([doc,k])=>{const u=units(D.docs[doc].body)[k];if(!u)return false;const tk=new Set(toks(u.t+" "+(u.label||"")+" "+D.docs[doc].title));return focus.some(f=>tk.has(f)||(KIDS.has(f)&&[...KIDS].some(x=>tk.has(x))))});
  /* a word that is only context ("in children") ranks the lines; any other word narrows them */
  const ctxOnly=P.aspects.length>0&&focus.every(f=>KIDS.has(f)||AGEW.has(f)); /* "infant vs adult tube": with nothing else asked, the age words are the question */
  if(!ctxOnly&&hit.length){const U2=(d,k)=>units(D.docs[d].body)[k];const head=([d,k])=>{const u=U2(d,k);const ht=new Set(toks((u&&u.label||"")+" "+D.docs[d].title));return focus.some(f=>ht.has(f))};
   const nf=([d,k])=>{const u=U2(d,k);const tk=new Set(toks((u?u.t+" "+(u.label||""):"")+" "+D.docs[d].title));return focus.filter(f=>tk.has(f)).length};
   lab=hit.map(x=>{const h=head(x);if(h)HEADK.add(x[0]+"|"+x[1]);return [x[0],x[1],Math.min(1,x[2]+(h?.3:.2)+.1*(nf(x)-1))]})}else if(hit.length){const hk=new Set(hit.map(([d,k])=>d+"|"+k));CTXK=hk;CTXF=new Set(hk);lab=lab.map(([d,k,w])=>[d,k,hk.has(d+"|"+k)?Math.min(1,w+.2):w])}}
 if(!lab.length&&!P.aspects.length){for(const id of ["cf","why"])lab=lab.concat(AM.by.get(e+"|"+id)||[])}
 /* "drug of choice", "commonest cause": the line that names the one comes first */
 const SUPK=new Set(CTXK);CTXK=new Set();
 /* "why ...": the line that gives the reason leads */
 if(/^\s*why\b/i.test(P.raw||"")&&ENTFOCUS.length){const W0=/\b(because|since|as it|so that|which is why|due to|owing to)\b/i;const have=new Set(lab.map(x=>x[0]+"|"+x[1]));
  for(const id of AM.asp)for(const [d,k,w] of AM.by.get(e+"|"+id)||[]){if(have.has(d+"|"+k))continue;const u=units(D.docs[d].body)[k];if(u&&W0.test(u.t)&&ENTFOCUS.some(f=>toks(u.t).includes(f))){have.add(d+"|"+k);lab.push([d,k,Math.max(w,.7)])}}}
 if(/^\s*why\b/i.test(P.raw||"")&&lab.length){const W=/\b(because|since|as it|as they|so that|which is why|due to|owing to|explains|the reason)\b/i;const ft=ENTFOCUS.slice();
  lab=lab.map(([d,k,w])=>{const u=units(D.docs[d].body)[k];if(u&&W.test(u.t)&&(!ft.length||ft.some(f=>toks(u.t).includes(f)))){SUPK.add(d+"|"+k);const tk=toks(u.t);return [d,k,.3+.5*w+.5*ft.filter(f=>tk.includes(f)).length/ft.length]} /* the reason that answers most of the question's words leads */return [d,k,w]})}
 /* "commonest site of X": no aspect of its own, so every line about X is a candidate and the superlative picks */
 if(P.sup&&asp.length===1&&asp[0]==="def"){let all=[];for(const id of AM.asp)all=all.concat(AM.by.get(e+"|"+id)||[]);const hit=all.filter(([d,k])=>{const u=units(D.docs[d].body)[k];return u&&SUPL.test(u.t)&&(!ENTFOCUS.length||ENTFOCUS.some(f=>toks(u.t).includes(f)))});if(hit.length)lab=hit.map(([d,k,w])=>[d,k,Math.max(w,.8)])}
 if(P.sup&&lab.length)lab=lab.map(([d,k,w])=>{const u=units(D.docs[d].body)[k];if(u&&SUPL.test(u.t)&&w>=.5){SUPK.add(d+"|"+k);return [d,k,Math.min(1,w+.3)]}return [d,k,w]});
 /* "dose of ...", "how much ...": lines that give an amount lead */
 if(/\b(doses?|dosage|dosing|how much|regimen)\b/i.test(P.raw||"")&&lab.length){const DQ=/\b\d+(\.\d+)? ?(mg|g|micrograms?|ml|units|million units)\b/i;lab=lab.map(([d,k,w])=>{const u=units(D.docs[d].body)[k];if(u&&DQ.test(u.t)&&w>=.5){SUPK.add(d+"|"+k);return [d,k,Math.min(1,w+.3)]}return [d,k,w]})}
 /* a subtype with little of its own ("treatment of papillary carcinoma") also takes its parent's lines ("thyroid cancer") */
 const par=AM.par[e];let parName=null;if(par>=0&&P.aspects.length&&lab.reduce((m,x)=>Math.max(m,x[2]),0)<.8){let pl=[];for(const a of asp)pl=pl.concat(AM.by.get(par+"|"+a)||[]);if(pl.length){lab=lab.concat(pl.map(([d,k,w])=>[d,k,w*.85]));parName=AM.names[par][0]}}
 /* nothing labelled for this aspect: the condition's own section, if it has one */
 if(P.aspects.length&&lab.reduce((m,x)=>Math.max(m,x[2]),0)<.5){const own=new Set((AM.by.get(e+"|def")||[]).filter(x=>x[2]>=.8).map(x=>x[0]));
  if(own.size){const seenK=new Set();for(const id of AM.asp)for(const [d,k] of AM.by.get(e+"|"+id)||[])if(own.has(d)&&!seenK.has(d+"|"+k)){seenK.add(d+"|"+k);lab.push([d,k,.55])}}}
 if(opt.art){lab=lab.filter(([d])=>D.docs[d].route.split("~")[0]===opt.art)}
 if(!lab.length)return null;const home=opt.art||(AM.home.get(e)||[""])[0];
 const groups=new Map();for(const [doc,k,w] of lab){const d=D.docs[doc];let g=groups.get(doc);if(!g)groups.set(doc,g={doc,d,u:new Map(),max:0});const o=g.u.get(k);if(!o||w>o)g.u.set(k,w);if(w>g.max)g.max=w}
 /* a section or article whose own heading repeats the question's words ("Draf III", "Malignant hyperthermia") is the one asked about */
 const TT=[...new Set(toks(P.topic||""))].filter(t=>t.length>1&&!STOP.has(t));const MODQ=/\b(ct|mri|ultrasound|x-ray)\b/.test(P.topic||"");
 const ET=new Set(AM.ali.filter(a=>a.i===e).flatMap(a=>a.t));const RT=[...new Set(toks(P.raw||""))].filter(t=>t.length>2&&!STOP.has(t)&&!ET.has(t)&&!TT.includes(t));
 const echoRaw=d=>{if(!RT.length)return 0;const ht=new Set(toks(d.title));return .25*RT.filter(t=>ht.has(t)).length/RT.length};
 const echo=d=>{if(!TT.length)return 0;const ht=new Set(toks(d.title)),at=new Set(toks(d.art));const inT=TT.filter(t=>ht.has(t)).length,inA=TT.filter(t=>ht.has(t)||at.has(t)).length;
  return inT===TT.length?.4:inA===TT.length?.3:.2*inA/TT.length};
 const G=[...groups.values()].map(g=>{const ar=g.d.route.split("~")[0];g.ar=ar;g.home=ar===home;const side=/^(cl:t-dr_|th:)/.test(ar)&&!g.home;g.sup=[...g.u.keys()].some(k=>SUPK.has(g.doc+"|"+k));g.echo=echo(g.d)+echoRaw(g.d)+(MODQ&&(g.d.ty==="cond"||/^cl:t-im_/.test(g.d.route))?.3:0);g.fac=P.aspects.some(a=>a.keep&&HS(a).test(fold(g.d.title)))?.25:0;g.score=g.max+(g.home?.35:0)+(g.sup?.3:0)+g.echo+g.fac+Math.min(.1,.02*g.u.size)+(g.d.ty==="ev"?-.2:0)+(side?-.1:0);return g}).sort((a,b)=>b.score-a.score||a.doc-b.doc);
 const top=G[0].max;const n=opt.n||6;
 /* sections that answer well; the condition's own article first, in its own order, then the others */
 const Q=G.filter((g,j)=>j===0||g.max>=Math.max(.6,top*.75)).slice(0,5);const lead=Q[0].ar;if(opt.dbg)opt.dbg(G.map(g=>[g.d.title,g.max,+g.score.toFixed(2),g.home,g.u.size]));
 const topS=Math.max(...Q.map(g=>g.score));const tier=g=>g.score>=topS*.85?1:0;
 /* within the lead article the author's order, unless one section is clearly the one asked about ("signs" -> the Signs section) */
 Q.sort((a,b)=>tier(b)-tier(a)||(b.ar===lead)-(a.ar===lead)||(a.ar===lead&&b.ar===lead?(Math.abs(a.score-b.score)>=.2?b.score-a.score:a.doc-b.doc):b.score-a.score));
 const quota=Math.max(1,Math.min(4,Math.ceil(n/Q.length)));const items=[],seen=[];let gi=0;
 for(const g of Q){if(items.length>=n)break;
  const U=units(g.d.body);const keep=[...g.u.entries()].filter(([k,w])=>w>=Math.max(.5,g.max*.7)).sort((a,b)=>a[0]-b[0]);
  const whole=gi===0&&keep.length<=n&&(((g.home||g.echo>=.3)&&g.max>=.95&&!(Q[1]&&Q[1].max>=.9&&Q[1].score>=g.score*.85))||(keep.length>1&&keep.every(([k])=>HEADK.has(g.doc+"|"+k))));
  const lim=Math.min(n-items.length,whole?n:keep.some(([k])=>U[k]&&U[k].row)?Math.max(quota,gi===0?5:quota):quota);let added=0;
  /* the strongest lines win the places, then read in the author's order */
  const best=new Set(keep.slice().sort((x,y)=>SUPK.has(g.doc+"|"+y[0])-SUPK.has(g.doc+"|"+x[0])||y[1]-x[1]||x[0]-y[0]).slice(0,lim+3).map(x=>x[0]));
  for(const [k,w] of keep.filter(([k])=>best.has(k)).sort((x,y)=>SUPK.has(g.doc+"|"+y[0])-SUPK.has(g.doc+"|"+x[0])||x[0]-y[0])){if(added>=lim)break;const u=U[k];if(!u)continue;const t=tidy(u.t);const tk=new Set(toks(t));
   if(!u.row&&seen.some(o=>{let c=0;for(const x of tk)if(o.has(x))c++;return c/Math.max(1,Math.min(tk.size,o.size))>.7}))continue;if(!u.row)seen.push(tk);
   items.push({sup:SUPK.has(g.doc+"|"+k),k,i:g.doc,route:g.d.route,text:t,needle:u.needle||t,label:u.row?"":(u.label&&u.label.length<40&&!P.aspects.some(a=>a.h.test(fold(u.label)))?u.label:""),title:g.d.title,where:g.d.where,s:w,g:gi});added++}
  if(added)gi++}
 if(!items.length||top<.55)return null;
 /* the line that names the one ("first line: amoxicillin") leads */
 /* lines from one section stay together; the line asked for most directly leads its section ("child dose" before the adult dose),
    and the section holding it leads the answer */
 if(SUPK.size||CTXF.size){const rk=x=>(CTXF.has(x.i+"|"+x.k)?2:0)+(x.sup?1:0);const gr=new Map();items.forEach((x,j)=>{x.o=j;const a=gr.get(x.g);if(!a)gr.set(x.g,[x]);else a.push(x)});
  const G2=[...gr.values()].map(a=>({a:a.sort((x,y)=>rk(y)-rk(x)||x.o-y.o),r:Math.max(...a.map(rk)),o:a[0].g,m:Math.max(...a.filter(x=>rk(x)>0).map(x=>x.s),0)}));G2.sort((x,y)=>(y.r>0)-(x.r>0)||(Math.abs(y.m-x.m)>=.1?y.m-x.m:0)||x.o-y.o);items.splice(0,items.length,...G2.flatMap(g=>g.a))}
 return {map:true,entity:AM.names[e][0]+(parName?" (with "+parName+")":""),conf:top,best:top,items}}

const ASPBY=id=>ASPECTS.find(a=>a.id===id);
/* two conditions side by side: a table that compares them, then each one's lines for the same questions */
function compare(P,opt){const es=P.parts.map(x=>entityOf(x));if(es.some(e=>e===null)||es[0]===es[1])return null;
 const names=es.map(e=>AM.names[e][0]);const asp=P.aspects.length?P.aspects:["cf","dx","tx"].map(ASPBY);const items=[];
 /* a table row or line that names both */
 const nt=es.map(e=>AM.ali.filter(a=>a.i===e).map(a=>a.t));const has=(tk,i)=>nt[i].some(t=>t.every(x=>tk.has(x)));
 for(const d of D.docs){if(d.ty==="q"||d.ty==="card"||d.ty==="viva"||d.exam)continue;const bt=new Set(toks(d.title+" "+d.chap));const body=fold(d.body);
  if(!nt.every(ts=>ts.some(t=>t.every(x=>body.includes(x.slice(0,4))||bt.has(x)))))continue;
  for(const u of units(d.body)){const tk=new Set(toks(u.t+" "+u.label));if(has(tk,0)&&has(tk,1)&&u.t.length>=25&&u.t.length<=420&&!XREF.test(u.t)){items.push({i:d.i,route:d.route,text:tidy(u.t),needle:u.needle||tidy(u.t),label:"",title:d.title,where:d.where,s:1,part:"Side by side"});if(items.length>=3)break}}
  if(items.length>=3)break}
 for(const a of asp)es.forEach((e,j)=>{const A=answerMap({topic:P.parts[j],aspects:[a],raw:P.raw,sup:P.sup},{e,n:2});if(!A)return;for(const x of A.items.filter(x=>!items.some(y=>y.text===x.text)).slice(0,2)){x.part=names[j]+" · "+a.label;items.push(x)}});
 if(items.length<2)return null;return {map:true,entity:names.join(" vs "),conf:1,best:1,items}}
/* several questions at once ("causes and treatment of X"): each answered under its own heading */
function multi(P,opt){const asp=P.aspects;const e=entityOf(P.topic,asp.map(a=>a.id));if(e===null)return null;const focus=ENTFOCUS.slice();const items=[];let name="";
 const per=Math.max(2,Math.ceil((opt.n||6)/asp.length));
 for(const a of asp){const A=answerMap(Object.assign({},P,{aspects:[a]}),{e,focus,n:per,art:opt.art});if(!A)continue;name=A.entity;for(const x of A.items){if(items.some(y=>y.text===x.text))continue;x.part=a.label;items.push(x)}}
 if(!items.length||new Set(items.map(x=>x.part)).size<2)return null;return {map:true,entity:name,conf:1,best:1,items}}
/* a named sign or eponym with no line that says "sign" ("steeple sign"): read the best lines about the name itself */
function answer(S,opt){const A=answer0(S,opt);if(A||!S||!S.P||!S.P.aspects.length||(opt&&opt.retry))return A;return answer0(Object.assign({},S,{P:Object.assign({},S.P,{aspects:[]})}),Object.assign({},opt||{},{retry:1,noMap:true}))}
function answer0(S,opt){opt=opt||{};if(!S||!S.list||!M)return null;let P=S.P;if(/\b(viva|questions?|mcqs?|essays?|flashcards?|quiz)\b/i.test(P.raw||""))return null;
 if(!opt.noMap&&AM){if(P.parts){const C=compare(P,opt);if(C)return C}
  /* "approach to a hoarse voice": the approach article, compiled in the order a clinician works: red flags, history, examination, tests, management */
  if(/\bapproach(es)? to\b/.test(fold(P.raw||""))&&P.aspects.every(a=>a.id==="how"||a.id==="def")){const e=entityOf(P.topic,[]);
   /* the "Approach to ..." article that speaks most about the condition */
   let apx="",best=0;if(e!==null){const cnt=new Map();for(const id of AM.asp)for(const [d] of AM.by.get(e+"|"+id)||[]){const dd=D.docs[d];if(/^approach to\b/i.test(dd.art)){const r=dd.route.split("~")[0];cnt.set(r,(cnt.get(r)||0)+1)}}cnt.forEach((v,r)=>{if(v>best){best=v;apx=r}})}
   if(apx){const A=multi(Object.assign({},P,{aspects:["flag","hx","exam","dx","tx"].map(ASPBY)}),Object.assign({},opt,{n:Math.max(opt.n||6,10),art:apx}));if(A)return A}}
  if(P.aspects.length>1){const A=multi(P,opt);if(A)return A}const A=answerMap(P,opt);if(A)return A}
 /* the quoting fallback reads a narrow anatomy question with the wider anatomy cues too */
 if(P.aspects.length&&P.aspects.every(a=>ANATQ.has(a.id)))P=Object.assign({},P,{aspects:P.aspects.concat([ASPBY("an")])});
 const asp=P.aspects;
 const okd=d=>d.ty!=="q"&&d.ty!=="card"&&d.ty!=="viva"&&!d.exam;
 const list=S.list.filter(r=>okd(D.docs[r.i]));const pool=(S.pool||[]).filter(r=>okd(D.docs[r.i]));if(!list.length)return null;
 const qt=toks(P.topic),st=toks(P.soft||"");const qw=new Map();let qwt=0;for(const t of new Set(qt)){const w=idf(t);qw.set(t,w);qwt+=w}for(const t of new Set(st))if(!qw.has(t))qw.set(t,idf(t)*.6);qwt=qwt||1;
 const qset=new Set(qt),qsoft=new Set(st);const qmain=[...qset].filter(q=>!QUAL.has(q)&&q.length>2);
 const qv=encode(P.topic+(asp.length?" "+asp.map(a=>a.label).join(" "):""));
 const covOf=(text,ctx,actx,aw)=>{const tk=new Set(toks(text));let h=0;qw.forEach((w,k)=>{if(tk.has(k))h+=w;else if(ctx&&ctx.has(k))h+=w;else if(actx&&actx.has(k))h+=(aw||.5)*w});return Math.min(1,h/qwt)};
 const cache=new Map();
 /* every line of a section, scored: about the topic (the line itself, its heading, or the subject of the line before) x answering the aspect x meaning */
 function lines(r){if(cache.has(r.i))return cache.get(r.i);const d=D.docs[r.i];const aw=(r.art||0)>=.99?1:.5;const ctx=new Set(toks(d.title+" "+d.chap)),actx=new Set(toks(d.art));
  const own=d.ty==="ev"||fold(d.title).includes(fold(d.art))?"":fold(d.title);
  const secAsp=asp.length?(own&&asp.some(a=>HS(a).test(own))?1:d.ty!=="ev"&&asp.some(a=>HS(a).test(fold(d.chap)))?.7:0):0;
  const sa=covOf("",ctx,actx,aw);const out=[];let carry=0,line=-1;
  if(d.ty==="ev"&&asp.length&&!asp.some(a=>/^(tx|px|cx|ind)$/.test(a.id))){const res={d,secAsp:0,sa,items:[],best:0};cache.set(r.i,res);return res}
  const pathT=new Set(toks(d.title+" "+d.chap+" "+d.art));
  /* a qualifier the question has but the section lacks, or one the section's own heading has but the question lacks, points to another disease */
  let qf=1;for(const q of qset){if(QUAL.has(q)&&!pathT.has(q))qf*=.55}for(const h of [d.title,d.chap]){const ht=toks(h);if(!ht.some(t=>qmain.includes(t)))continue;for(const t of ht){if(QUAL.has(t)&&!qset.has(t)&&!qsoft.has(t))qf*=.55}}
  for(const u of units(d.body)){const t=tidy(u.t);if(u.line!==line){carry=0;line=u.line}
   let cov=covOf(t+" "+u.label,ctx,actx,aw);const ownCov=covOf(t+" "+u.label);cov=Math.max(cov,carry);
   const subj=covOf(t.split(" ").slice(0,6).join(" "));carry=Math.max(subj*.9,PRON.test(t)?cov*.9:0);
   if(t.length<25||t.length>420||/\?$/.test(t)||XREF.test(t))continue;
   let a;if(asp.length){const lab=fold(u.label);if(lab&&asp.some(x=>HS(x).test(lab)))a=1;else{const m=asp.reduce((n,x)=>n+((fold(t).match(new RegExp((x.cx||x.c).source,"g"))||[]).length),0);a=secAsp?Math.min(1,secAsp*.8+m*.15):Math.min(1,m*.3)}}
   else a=u.k===0?1:.5;
   const v=encode(t),vc=encode(d.chap+" "+d.title+" "+(u.label||"")+" "+t);const sem=vc&&qv?Math.max(0,cos(vc,qv)):0;
   let comp=1;const lt=new Set(toks(t+" "+u.label));for(const q of qmain){if(!lt.has(q)&&!pathT.has(q)&&!(carry>0&&cov>=.5))comp*=.5}
   for(const q of qset)if(QUAL.has(q)&&!pathT.has(q)&&lt.has(q))comp/=.55*1; /* the line itself carries the qualifier */
   const rel=(.3+.7*cov)*(.35+.65*a)*(.6+.4*Math.min(1,sem/.6))*(.7+.3*sa)*Math.min(1,qf*comp);
   out.push({i:r.i,route:d.route,label:u.label,row:u.row,k:u.k,t,needle:u.needle||t,v,rel,cov,a,secAsp})}
  const res={d,secAsp,sa,items:out.filter(c=>c.cov>=.3&&(!asp.length||c.a>0)),best:0};res.best=res.items.reduce((m,c)=>Math.max(m,c.rel),0);cache.set(r.i,res);return res}
 /* the main section: the search's own ranking, unless a section just below it answers clearly better */
 let prim=null,pv=-1;const P0=(pool.length?pool:list);P0.slice(0,8).forEach((r,k)=>{const L=lines(r);const v=L.best*Math.pow(r.s/P0[0].s,2)*(asp.length?.6+.4*L.secAsp:1)*(.65+.35*L.sa);if(opt.debug)opt.debug([v.toFixed(2),L.best.toFixed(2),L.secAsp,L.d.title,L.items.length]);if(v>pv){pv=v;prim=r}});
 const L=lines(prim);if(!L.items.length||L.best<.2||pv<(opt.min===undefined?.2:opt.min))return null;const n=opt.n||4;let pick=[];
 const take=(L,lim,pw)=>{pw=pw||.02;const top=L.best;const ok=L.items.filter(c=>c.rel>=top*.65);
  /* a list or table that is itself the answer is read in the author's order */
  if(L.secAsp===1&&ok.filter(c=>c.row).length>=lim)return ok.filter(c=>c.row).sort((x,y)=>x.k-y.k).slice(0,lim);
  return ok.sort((x,y)=>y.rel*(1-pw*y.k)-x.rel*(1-pw*x.k)).slice(0,lim)};
 /* a chapter made of short sibling sections ("Clinical features": Vertigo, Hearing loss, Tinnitus): one line from each */
 const sibs=asp.length&&L.secAsp===.7&&covOf(L.d.title)<.5&&L.d.ty!=="ev"&&asp.some(a=>HS(a).test(fold(L.d.chap)))?pool.filter(r=>{const d=D.docs[r.i];return d.art===L.d.art&&d.chap===L.d.chap&&d.ty!=="ev"}):[];
 if(sibs.length>=3){const num=r=>(D.docs[r.i].route.split("~")[1]||"").replace(/\d+/g,m=>m.padStart(4,"0"));sibs.sort((x,y)=>num(x)<num(y)?-1:1);for(const r of sibs){if(pick.length>=n)break;const c=take(lines(r),1,.1)[0];if(c){if(!c.row&&!c.label)c.label=D.docs[r.i].title;pick.push(c)}}}
 else{const rows=L.items.some(c=>c.row);pick=take(L,rows?4:3);
  if(pick.length<2){for(const r of list.slice(1,4)){if(r===prim)continue;const c=take(lines(r),1)[0];if(c&&c.rel>=L.best*.8){pick.push(c);break}}}}
 const uniq=[];for(const c of pick)if(!uniq.some(p=>p.v&&c.v&&cos(p.v,c.v)>.93))uniq.push(c);pick=uniq;if(!pick.length)return null;
 const ord=new Map();pick.forEach(p=>{if(!ord.has(p.i))ord.set(p.i,p.i===prim.i?-1:ord.size)});
 pick.sort((x,y)=>ord.get(x.i)-ord.get(y.i)||x.k-y.k);
 const lab=l=>l&&l.length<40&&!asp.some(a=>a.h.test(fold(l)))?l:"";
 return {conf:pv,best:L.best,items:pick.map(p=>({i:p.i,route:p.route,text:p.t,needle:p.needle,label:p.row?"":lab(p.label),title:D.docs[p.i].title,where:D.docs[p.i].where,s:p.rel}))}}

/* ---------- the second reader (search/xrank.js) ----------
   candidates(): the lines the answer map picked (in its order) and the lines of the best-ranked sections, for the
   sentence-pair model to read with the question. rerank(): the sections whose lines it scores best come first (with
   the answer map's choice as a strong prior), and each section shows its best lines in the author's order. Nothing
   new is written: the result is a subset of the same quoted lines. Answers in parts (several questions, X vs Y,
   "approach to") keep their structure and are not re-read. */
function candidates(S,opt){opt=opt||{};if(!S||!S.list)return null;const A=answer(S,{n:opt.n||16});if(!A||!A.items.length||A.items.some(x=>x.part))return null;
 const out=[],seen=new Set();A.items.forEach((x,j)=>{if(seen.has(x.text))return;seen.add(x.text);out.push(Object.assign({},x,{eng:1,r:j}))});
 let extra=0;for(const r of (S.pool||S.list).slice(0,5)){const d=D.docs[r.i];if(!d||d.ty==="q"||d.ty==="card"||d.ty==="viva"||d.exam)continue;
  for(const u of units(d.body)){const t=tidy(u.t);if(t.length<25||t.length>420||XREF.test(t)||seen.has(t))continue;seen.add(t);
   out.push({i:d.i,k:u.k,route:d.route,text:t,needle:u.needle||t,label:u.row?"":(u.label&&u.label.length<40?u.label:""),title:d.title,where:d.where,s:.5,eng:0,r:99});if(++extra>=(opt.extra||8))break}
  if(extra>=(opt.extra||8))break}
 return {A,items:out,texts:out.map(x=>x.where+" › "+x.title+". "+(x.label?x.label+": ":"")+x.text)}}
function rerank(C,scores,opt){opt=opt||{};const it=C.items,n=it.length;if(!n)return C.A;const per=opt.per||3,lim=opt.n||10,prior=opt.prior===undefined?2:opt.prior;
 let m=0;for(const v of scores)m+=v;m/=n;let sd=0;for(const v of scores)sd+=(v-m)*(v-m);sd=Math.sqrt(sd/n)+1e-6;const z=Array.from(scores,v=>(v-m)/sd);
 const groups=new Map();it.forEach((x,j)=>{const key=x.route;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(j)});
 const gs=g=>Math.max(...g.map(j=>z[j]))+prior*Math.max(...g.map(j=>it[j].eng?1-Math.min(it[j].r,30)/30:0));
 const G=[...groups.values()].sort((a,b)=>gs(b)-gs(a));const items=[];
 /* the answer map's own first section, when the reader also ranks it first, keeps the lines the map chose (a table, a list) */
 const lead=it.find(x=>x.r===0);
 for(const g of G){if(items.length>=lim)break;const keepAll=opt.keepLead!==false&&g===G[0]&&lead&&it[g[0]].route===lead.route;
  const best=keepAll?g.filter(j=>it[j].eng).slice(0,Math.max(per,7)).slice(0,lim-items.length):g.slice().sort((a,b)=>z[b]-z[a]).slice(0,Math.min(per,lim-items.length));best.sort((a,b)=>g.indexOf(a)-g.indexOf(b));for(const j of best)items.push(Object.assign({},it[j],{rr:z[j]}))}
 return Object.assign({},C.A,{items,reranked:true})}
const API={setModel,buildDocs,search,answer,setAnswers,candidates,rerank,entityOf,_units:units,_x:{HS,QUAL,PRON,XREF,tidy,cw,fold,STRICT},parse,encode,toks,stem,wordpiece,ASPECTS,get ready(){return !!(M&&D)},doc:i=>D&&D.docs[i]};
if(typeof module!=="undefined"&&module.exports)module.exports=API;else root.XSMART=API;
})(typeof window!=="undefined"?window:this);
