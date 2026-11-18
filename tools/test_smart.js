#!/usr/bin/env node
/* Regression test for smart search (www/search/xsmart.js): each question must find one of the
   expected sections among the top three answers. Run: node tools/test_smart.js */
const fs=require("fs"),path=require("path");
const W=path.join(__dirname,"..","app","src","main","assets","www","search");
const S=require(path.join(W,"xsmart.js"));
const lj=(f,o,c)=>{const s=fs.readFileSync(path.join(W,f),"utf8");return JSON.parse(s.slice(s.indexOf(o),s.lastIndexOf(c)+1))};
const X=lj("full.js","[","]").concat(lj("sm_q.js","[","]"));
S.setModel(lj("sm_meta.js","{","}"),fs.readFileSync(path.join(W,"sm_tok.bin")).buffer,fs.readFileSync(path.join(W,"sm_vec.bin")).buffer);
if(!S.buildDocs(X)){console.log("smart search vectors do not match search/full.js: run tools/build_smart.py");process.exit(1)}
const T=[
 ["hashimoto treatment",["Thyroiditis","Hashimoto"]],
 ["clinical picture of RLN injury",["Vocal fold paralysis"]],
 ["signs of AOM",["Acute otitis media › Clinical picture","Acute otitis media › Clinical features"]],
 ["how to manage quinsy",["Quinsy drainage","Peritonsillar abscess › Treatment"]],
 ["causes of bilateral vocal cord paralysis",["Vocal fold paralysis · Causes","Bilateral"]],
 ["treatment of meniere disease",["Ménière's disease · Management","Ménière's disease · Overview"]],
 ["investigation of sudden hearing loss",["Sudden sensorineural hearing loss · Investigations","Sudden sensorineural hearing loss · Diagnosis"]],
 ["complications of tonsillectomy",["Tonsillectomy · Aftercare › Complications","Tonsillectomy › Complications"]],
 ["management of epistaxis",["Epistaxis ·"]],
 ["signs of mastoiditis",["mastoiditis · Clinical features"]],
 ["treatment of bell palsy",["Bell's palsy"]],
 ["staging of laryngeal cancer",["Cancer of the larynx · Diagnosis and staging","Cancer of the larynx · Diagnosis › T staging"]],
 ["treatment of acute sinusitis",["Acute rhinosinusitis and orbital complications · Management"]],
 ["symptoms of nasopharyngeal carcinoma",["Nasopharyngeal carcinoma · Clinical features"]],
 ["indications for tracheostomy",["Tracheostomy › Indications"]],
 ["causes of stridor in infants",["paediatric causes","Approach to stridor"]],
 ["how to diagnose otosclerosis",["Otosclerosis · Investigations","Otosclerosis · Diagnosis"]],
 ["treatment of allergic rhinitis",["Allergic rhinitis › Treatment","Allergic rhinitis › Management"]],
 ["management of post tonsillectomy bleeding",["onsillar haemorrhage","Post-tonsillectomy haemorrhage"]],
 ["cholesteatoma on CT",["The temporal bone on CT"]],
 ["treatment of graves disease",["Graves disease"]],
 ["how to treat necrotising otitis externa",["Necrotising otitis externa"]],
 ["signs of laryngomalacia",["Laryngomalacia › Features","Laryngomalacia › Clinical features"]],
 ["parotid tumour treatment",["Salivary gland tumours · Treatment","Salivary gland tumours · Management"]],
 ["nasal fracture management",["Nasal fractures › Treatment","Nasal and facial fractures"]],
 ["button battery in oesophagus",["Button (disc) batteries"]],
 ["drugs for vertigo",["vertigo · Acute continuous vertigo › Management","Vertigo: BPPV, neuritis and central causes · Management"]],
 ["hypocalcaemia after thyroidectomy treatment",["Hypoparathyroidism and hypocalcaemia › Management","After total thyroidectomy"]],
 ["child swallowed coin",["Swallowed foreign bodies"]],
 ["blood supply of the nose",["Epistaxis · Applied anatomy","Epistaxis · Pathophysiology › Arterial supply"]],
 ["nerve supply of the larynx",["Recurrent laryngeal nerve","Nerve supply"]],
 ["dizzy when turning in bed",["BPPV"]],
 ["nosebleed in a child",["Epistaxis"]],
 ["hashimto tretment",["Thyroiditis"]],
 ["sings of acute otitis media",["Acute otitis media › Clinical picture","Acute otitis media › Clinical features"]],
 ["complciations of tonsilectomy",["Tonsillectomy"]],
 ["tretment of alergic rinitis",["Allergic rhinitis › Treatment","Allergic rhinitis › Management"]],
 ["symptons of nasopharyngel carcinoma",["Nasopharyngeal carcinoma"]],
 ["viva questions on facial palsy",["viva › How do you manage Bell's palsy"]],
];
let ok=0;
for(const [q,want] of T){const r=S.search(q,{n:3});const got=r.list.map(x=>{const d=S.doc(x.i);return d.where+" › "+d.title});
 const hit=got.some(g=>want.some(w=>g.includes(w)));if(hit)ok++;else console.log("MISS",q,"\n   ",got.join("\n    "))}
console.log(`smart search: ${ok}/${T.length} questions answered in the top three`);process.exit(ok/T.length>=.9?0:1);
