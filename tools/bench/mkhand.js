const {S,DOCS}=require("/home/claude/ent-atlas-android/tools/bench/harness.js");const fs=require("fs");const B="/home/claude/ent-atlas-android/tools/bench/";
const L=JSON.parse(fs.readFileSync("lines.json"));const Q={};for(const f of ["q1","q2","q3","q4"])for(const ln of fs.readFileSync(f+".txt","utf8").split("\n")){const m=ln.match(/^(\d+)\|(.+)$/);if(m&&m[2].trim()!=="-")Q[+m[1]]=m[2].trim()}
const tk=s=>new Set(S.toks(s).filter(x=>x.length>2));const jac=(a,b)=>{let n=0;for(const x of a)if(b.has(x))n++;return n/Math.max(1,a.size+b.size-n)};const cov=(a,b)=>{let n=0;for(const x of a)if(b.has(x))n++;return n/Math.max(1,a.size)};
const TEST=[...require(B+"bench_a.js"),...require(B+"bench_b.js"),...require(B+"bench_c.js"),...require(B+"bench_fresh.js")].map(x=>tk(x[1]));
const ctx=D=>D[3]+" › "+D[2]+". ";const train=[],hold=[];let close=0,found=0;
for(const [i,q] of Object.entries(Q)){const x=L[i];const qt=tk(q);if(TEST.some(t=>jac(t,qt)>=.5)){close++;continue}
 const D=DOCS[x.d];const u=S._units(D[4])[x.k];const pos=ctx(D)+(u.label?u.label+": ":"")+u.t;const pt=tk(u.t);
 const R=S.search(q,{n:8});const C=S.candidates(R,{});const negs=[];let hit=false;
 if(C)C.items.forEach((y,j)=>{if(y.i===x.d&&y.k===x.k){hit=true;return}if(y.text===u.t||cov(pt,tk(y.text))>.5||cov(tk(y.text),pt)>.5)return;negs.push(C.texts[j])});
 found+=hit;const rec={q,pos,negs,d:x.d,k:x.k,hit};(((+i)%4===3)?hold:train).push(rec)}
fs.writeFileSync("hand_train.json",JSON.stringify(train));fs.writeFileSync("hand_hold.json",JSON.stringify(hold));
console.log("questions",Object.keys(Q).length,"too close to a test question",close,"train",train.length,"hold-out",hold.length,"right line among reader candidates",found);
