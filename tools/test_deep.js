/* Regression test for longer, exam-style questions in the quick-answer box (search/xsmart.js):
   comparisons, several questions at once, superlatives ("drug of choice", "gold standard"),
   contraindications, "why" questions and clinical scenarios. Each answer must contain every
   expected phrase; "first" means the phrase must be in the first line.
   Run: node tools/test_deep.js  (after build_articles.py) */
const fs=require("fs"),path=require("path");const W=path.join(__dirname,"../app/src/main/assets/www/search/");
const S=require(W+"xsmart.js");const lj=(f,a,b)=>{const s=fs.readFileSync(W+f,"utf8");return JSON.parse(s.slice(s.indexOf(a),s.lastIndexOf(b)+1))};
S.setModel(lj("sm_meta.js","{","}"),fs.readFileSync(W+"sm_tok.bin").buffer,fs.readFileSync(W+"sm_vec.bin").buffer);
if(!S.buildDocs(lj("full.js","[","]").concat(lj("sm_q.js","[","]")))){console.log("smart search vectors do not match: run tools/build_smart.py");process.exit(1)}
if(!S.setAnswers(lj("sm_ans.js","{","}"))){console.log("answer map does not match search/full.js: run tools/build_answers.js");process.exit(1)}
const T=[
 ["difference between laryngomalacia and subglottic stenosis",["omega","Cotton"]],
 ["pleomorphic adenoma vs warthin tumour",["pleomorphic","Warthin"]],
 ["what is the drug of choice for acute otitis media",[],"first-line"],
 ["gold standard investigation for obstructive sleep apnoea",[],"Polysomnography is the gold standard"],
 ["can you give amoxicillin in infectious mononucleosis",["rash"]],
 ["contraindications of adenoidectomy",["submucous cleft"]],
 ["contraindications to tonsillectomy",["Haemoglobin below"]],
 ["treatment of eagle syndrome",["shortened"]],
 ["management of ranula",["sublingual gland"]],
 ["how is malignant otitis externa diagnosed",["scan"]],
 ["prognosis of anaplastic thyroid carcinoma",["median survival"]],
 ["what to do for a child who swallowed a button battery",["honey"]],
 ["why is the left recurrent laryngeal nerve more often paralysed",[],"longer course"],
 ["what is the commonest site of nasopharyngeal carcinoma",["Rosenmüller"]],
 ["complications of acute otitis media in children",["Perforation"]],
 ["indications for surgery in chronic rhinosinusitis",["persist despite"]],
 ["first line treatment of bell's palsy",["72 hours"]],
 ["when should I do tonsillectomy in a child with recurrent tonsillitis",["Seven or more"]],
 ["investigation of choice for cholesteatoma",["CT"]],
 ["causes and treatment of epistaxis in children",["#Treatment","#Causes"]],
 ["a 60 year old smoker with hoarseness for 6 weeks what should I do",["laryngoscopy"]],
 ["what is the treatment of hashimoto thyroiditis and its complications",["thyroxine"]],
 ["how do you manage posterior epistaxis not responding to packing",["embolisation"]],
 ["signs of a carotid body tumour",["Fontaine"]],
];
let ok=0;for(const [q,want,first] of T){const A=S.answer(S.search(q,{n:5,perArticle:2}));const items=A?A.items:[];const txt=items.map(x=>x.text.toLowerCase()).join("\n"),parts=new Set(items.map(x=>x.part));
 const good=items.length&&want.every(w=>w.startsWith("#")?parts.has(w.slice(1)):txt.includes(w.toLowerCase()))&&(!first||items[0].text.toLowerCase().includes(first.toLowerCase()));
 if(good)ok++;else console.log("MISS",q,"\n   ",items.map(x=>(x.part?"["+x.part+"] ":"")+x.text.slice(0,140)).join("\n    ")||"(no box)")}
console.log(`deep questions: ${ok}/${T.length} answered with the expected lines`);process.exit(ok/T.length>=.9?0:1);
