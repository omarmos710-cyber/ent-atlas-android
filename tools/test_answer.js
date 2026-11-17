/* Regression test for the quick-answer box (search/xsmart.js answer()).
   Each question must produce a box containing a line with the expected words.
   Run: node tools/test_answer.js  (after build_articles.py) */
const fs=require("fs"),path=require("path");const W=path.join(__dirname,"../app/src/main/assets/www/search/");
const S=require(W+"xsmart.js");const lj=(f,a,b)=>{const s=fs.readFileSync(W+f,"utf8");return JSON.parse(s.slice(s.indexOf(a),s.lastIndexOf(b)+1))};
S.setModel(lj("sm_meta.js","{","}"),fs.readFileSync(W+"sm_tok.bin").buffer,fs.readFileSync(W+"sm_vec.bin").buffer);
if(!S.buildDocs(lj("full.js","[","]").concat(lj("sm_q.js","[","]")))){console.log("smart search vectors do not match: run tools/build_smart.py");process.exit(1)}
const T=[
 ["hashimoto treatment","thyroxine"],
 ["signs of aom","Otalgia, fever"],
 ["treatment of graves disease","Antithyroid drugs are first line"],
 ["complications of tonsillectomy","haemorrhage"],
 ["causes of facial palsy","Bell's palsy, Ramsay Hunt"],
 ["management of epistaxis","First aid"],
 ["symptoms of menieres","rotatory vertigo"],
 ["symptoms of nasopharyngeal carcinoma","Nasal obstruction"],
 ["signs of laryngomalacia","Stridor appears at birth"],
 ["treatment of allergic rhinitis","Intranasal corticosteroid"],
 ["indications for tracheostomy","Retained secretions"],
 ["what is cholesteatoma","keratinising stratified squamous epithelium"],
 ["blood supply of the nose","Sphenopalatine artery"],
 ["ludwig angina treatment","intravenous antibiotics"],
 ["staging of laryngeal cancer","T1:"],
 ["investigation of sudden hearing loss","Pure-tone audiogram"],
 ["clinical features of cholesteatoma","Earache, headache, vertigo"],
 ["bppv treatment","Epley"],
 ["hashimto tretment","thyroxine"],
];
let ok=0;for(const [q,want] of T){const A=S.answer(S.search(q,{n:5,perArticle:2}));const got=A?A.items.map(x=>x.text):[];
 if(got.some(t=>t.toLowerCase().includes(want.toLowerCase())))ok++;else console.log("MISS",q,"\n   ",got.join("\n    ")||"(no box)")}
for(const q of ["viva questions on facial palsy","hello there"]){const A=S.answer(S.search(q,{n:5}));if(A){console.log("UNEXPECTED BOX",q);ok--}}
console.log(`quick answers: ${ok}/${T.length} questions answered with the expected line`);process.exit(ok/T.length>=.9?0:1);
