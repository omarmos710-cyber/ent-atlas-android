// Training pairs for the second reader, made only from the app's own content (never from the test questions):
// A) question-bank question -> the article line that carries its answer (positive), other candidate lines (negatives)
// B) "<condition> <aspect>" -> lines the answer map labels for that pair (positive), other lines of the condition (negatives)
const {S,DOCS}=require("./harness.js");const fs=require("fs");
const tk=s=>new Set(S.toks(s).filter(x=>x.length>2));const jac=(a,b)=>{let n=0;for(const x of a)if(b.has(x))n++;return n/Math.max(1,a.size+b.size-n)};const cov=(a,b)=>{let n=0;for(const x of a)if(b.has(x))n++;return n/Math.max(1,a.size)};
const TEST=[...require("./bench_a.js"),...require("./bench_b.js"),...require("./bench_c.js"),...require("./bench_fresh.js")].map(x=>tk(x[1]));
const ctx=d=>d[3]+" › "+d[2]+". ";
const out=[];let skipped=0;
// A
for(const d of DOCS){if(!/^(q|card|viva)$/.test(d[0]))continue;const q=d[2];const qt=tk(q);if(qt.size<2)continue;if(TEST.some(t=>jac(t,qt)>=.5)){skipped++;continue}
 const ans=tk(d[4].replace(/^Answer:\s*/i,""));if(ans.size<3)continue;
 const R=S.search(q,{n:8});const C=S.candidates(R,{n:16,extra:8});if(!C||C.items.length<4)continue;
 const sc=C.items.map(x=>cov(ans,tk(x.text)));const best=Math.max(...sc);if(best<.5)continue;
 C.items.forEach((x,j)=>{const t=C.texts[j];if(sc[j]>=Math.max(.5,best*.9))out.push([q,t,1]);else if(sc[j]<.15)out.push([q,t,0])})}
const nA=out.length;
// B
const M=JSON.parse(fs.readFileSync(require("path").join(__dirname,"../../app/src/main/assets/www/search/sm_ans.js"),"utf8").replace(/^window.XSMA=/,"").replace(/;\s*$/,""));
const by=new Map();for(let j=0;j<M.l.length;j+=5){const [d,k,e,a,w]=M.l.slice(j,j+5);const key=e+"|"+a;if(!by.has(key))by.set(key,[]);by.get(key).push([d,k,w])}
const LBL={tx:"treatment",cf:"clinical features",dx:"investigations",why:"causes",cx:"complications",ddx:"differential diagnosis",cls:"classification",ind:"indications",ci:"contraindications",dose:"dose",se:"side effects",nerve:"nerve supply",blood:"blood supply",bound:"boundaries",cont:"contents",branch:"branches",flag:"red flags",how:"steps of the operation",px:"prognosis",def:"definition"};
let rnd=1;const rand=()=>(rnd=(rnd*48271)%2147483647)/2147483647;
const ents=[...new Set([...by.keys()].map(k=>+k.split("|")[0]))];
for(const e of ents){for(const [ai,a] of M.asp.entries()){if(!LBL[a])continue;const pos=(by.get(e+"|"+ai)||[]).filter(x=>x[2]>=9);if(!pos.length)continue;if(rand()>.35)continue;
  const q=M.e[e][0].replace(/\s*\(.*?\)\s*/g," ").trim()+" "+LBL[a];if(TEST.some(t=>jac(t,tk(q))>=.6))continue;
  const neg=[];for(const [bi,b] of M.asp.entries()){if(b===a||b==="def")continue;for(const x of (by.get(e+"|"+bi)||[]))if(x[2]>=9&&!pos.some(p=>p[0]===x[0]&&p[1]===x[1]))neg.push(x)}
  const line=([d,k])=>{const D=DOCS[d];const u=S._units(D[4])[k];return u?ctx(D)+(u.label?u.label+": ":"")+u.t:null};
  for(const p of pos.slice(0,3)){const t=line(p);if(t)out.push([q,t,1])}
  for(const n of neg.sort(()=>rand()-.5).slice(0,4)){const t=line(n);if(t)out.push([q,t,0])}}}
fs.writeFileSync("/home/claude/work/pairs.json",JSON.stringify(out));
console.log("pairs",out.length,"from question bank",nA,"positives",out.filter(x=>x[2]).length,"skipped (close to a test question)",skipped);
