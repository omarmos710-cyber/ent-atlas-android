// End-to-end check of the second reader: real JS candidates -> real JS model -> real JS rerank, scored like score.js
const {S}=require("./harness.js");const fs=require("fs");const X=require("../../app/src/main/assets/www/search/xrank.js");
const ort=require("onnxruntime-web");ort.env.wasm.numThreads=1;
const Q=[...require("./bench_a.js"),...require("./bench_b.js"),...require("./bench_c.js")];
const ns=s=>String(s).replace(/\s+/g," ");const held=q=>{let h=0;for(const c of q)h=(h*31+c.charCodeAt(0))>>>0;return h%10<3};
const txtOf=A=>ns([(A&&A.entity)||""].concat(((A&&A.items)||[]).map(i=>(i.label?i.label+": ":"")+i.text+" ("+i.title+")")).join(" \n "));
(async()=>{await X.init(ort,fs.readFileSync(require("path").join(__dirname,"../../app/src/main/assets/www/search/rr/ce.onnx")),JSON.parse(fs.readFileSync(require("path").join(__dirname,"../../app/src/main/assets/www/search/rr/vocab.json"))));
 const out={};const rec=[];const CFG=JSON.parse(process.env.CFG||"{}");
 for(const [lib,q,arts,re] of Q){const R=S.search(q,{n:8});const A=S.answer(R,{n:10});let B=A;const C=S.candidates(R,CFG);
  if(C){const sc=[];for(const t of C.texts)sc.push((await X.score(q,[t],1))[0]);B=S.rerank(C,sc,CFG)}
  const a=re.test(txtOf(A)),b=re.test(txtOf(B));rec.push([q,a,b,!!C]);
  for(const k of [lib,"ALL",held(q)?"HELD":"DEV"]){const o=out[k]=out[k]||{n:0,a:0,b:0,rr:0};o.n++;o.a+=a;o.b+=b;o.rr+=!!C}}
 for(const [k,o] of Object.entries(out))console.log(k.padEnd(10),o.n,"now",(100*o.a/o.n).toFixed(0)+"%","with reader",(100*o.b/o.n).toFixed(0)+"%","(re-read",o.rr+")");
 for(const [q,a,b] of rec)if(a!==b)console.log(b?" + ":" - ",q);
})();
