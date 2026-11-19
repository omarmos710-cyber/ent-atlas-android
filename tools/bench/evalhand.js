// Hold-out of hand-written questions: does the reader put the right line in its first 5 (right line always added to the candidates)
const fs=require("fs");const X=require("/home/claude/ent-atlas-android/app/src/main/assets/www/search/xrank.js");const ort=require("./nodeort/node_modules/onnxruntime-web");ort.env.wasm.numThreads=1;
(async()=>{const MD=process.argv[2];await X.init(ort,fs.readFileSync(MD+"/model_quantized.onnx"),JSON.parse(fs.readFileSync("/home/claude/models/ce/vocab.json")));
 const H=JSON.parse(fs.readFileSync(process.argv[3]||"hand_hold.json"));let t1=0,t5=0,mrr=0;
 for(const h of H){const T=[h.pos,...h.negs];const s=[];for(const t of T)s.push((await X.score(h.q,[t],1))[0]);const r=s.filter(v=>v>s[0]).length;t1+=r<1;t5+=r<5;mrr+=1/(r+1)}
 console.log(MD.split("/").pop(),"n",H.length,"first",(100*t1/H.length).toFixed(0)+"%","in first 5",(100*t5/H.length).toFixed(0)+"%","MRR",(mrr/H.length).toFixed(3))})();
