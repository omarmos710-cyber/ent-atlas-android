// Engine check on the hand-written questions: is the right line (or its section) among the 10 lines shown
const {S,DOCS}=require("/home/claude/ent-atlas-android/tools/bench/harness.js");const fs=require("fs");
const H=[...JSON.parse(fs.readFileSync("hand_train.json")),...JSON.parse(fs.readFileSync("hand_hold.json"))];const L=JSON.parse(fs.readFileSync("lines.json"));
let line=0,sec=0,cand=0;const miss=[];
for(const h of H){const R=S.search(h.q,{n:8});const A=S.answer(R,{n:10});const C=S.candidates(R,{});const it=(A&&A.items)||[];
 const l=it.some(x=>x.i===h.d&&x.k===h.k),s=it.some(x=>x.i===h.d),c=!!(C&&C.items.some(x=>x.i===h.d&&x.k===h.k));line+=l;sec+=s;cand+=c||l;
 if(!s)miss.push([h.q,DOCS[h.d][2]+" ("+DOCS[h.d][3]+")",(A&&A.entity)||"-",it[0]?it[0].title:"-"])}
console.log("n",H.length,"line shown",line,"section shown",sec,"line among candidates",cand);if(process.argv[2])for(const m of miss)console.log(m.join(" | "));
