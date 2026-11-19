// For every benchmark + fresh question: engine features, reader scores, and whether the first 5 shown lines hold the fact
const {S}=require("/home/claude/ent-atlas-android/tools/bench/harness.js");const fs=require("fs");const X=require("/home/claude/ent-atlas-android/app/src/main/assets/www/search/xrank.js");
const ort=require("./nodeort/node_modules/onnxruntime-web");ort.env.wasm.numThreads=1;const B="/home/claude/ent-atlas-android/tools/bench/";
const sets={bench:[...require(B+"bench_a.js"),...require(B+"bench_b.js"),...require(B+"bench_c.js")],fresh:require(B+"bench_fresh.js")};
const ns=s=>String(s).replace(/\s+/g," ");const txtOf=(A,k)=>ns([(A&&A.entity)||""].concat(((A&&A.items)||[]).slice(0,k).map(i=>(i.label?i.label+": ":"")+i.text+" ("+i.title+")")).join(" \n "));
const MD=process.env.MD||"/home/claude/models/ce";
(async()=>{await X.init(ort,fs.readFileSync(MD+"/model_quantized.onnx"),JSON.parse(fs.readFileSync("/home/claude/models/ce/vocab.json")));
 const rows=[];
 for(const [set,Q] of Object.entries(sets))for(const [lib,q,arts,re] of Q){const R=S.search(q,{n:8});const A=S.answer(R,{n:10});let Bx=A;const C=S.candidates(R,{});let mx=null,top=null,raw=[];
  if(C){for(const t of C.texts)raw.push((await X.score(q,[t],1))[0]);Bx=S.rerank(C,raw,{});mx=Math.max(...raw);const shown=Bx.items.slice(0,5).map(x=>raw[C.items.indexOf(C.items.find(y=>y.text===x.text))]);top=Math.max(...shown)}
  const bank=S.bankMatch(q);
  rows.push({set,lib,q,map:!!(A&&A.map),conf:A?A.conf:null,ent:A?A.entity:"",has:!!(A&&A.items.length),parts:!!(A&&A.items.some(x=>x.part)),mx,top,bank:!!bank,ok5:re.test(txtOf(Bx,5))||(!!bank&&re.test(bank.text)),ok10:re.test(txtOf(Bx,10))||(!!bank&&re.test(bank.text))})}
 fs.writeFileSync(process.env.OUT||"feats.json",JSON.stringify(rows));console.log("rows",rows.length,"ok5",rows.filter(r=>r.ok5).length)})();
