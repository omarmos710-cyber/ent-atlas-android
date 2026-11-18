/* ENT Atlas: the second reader of the quick answer, fully offline.
   A small sentence-pair model (MiniLM-L6 cross-encoder, MS MARCO, int8, about 23 MB, in search/rr/) reads the
   question together with each candidate line and scores how well the line answers it. It runs on the phone
   through onnxruntime-web (WebAssembly, one thread); no network is used.
   It only re-ranks lines that are already quoted from the articles: it can change which quoted lines are shown
   and in what order, never their words.
   Browser: window.XRANK.load() then XRANK.score(question, texts) -> Promise<Float32Array>.
   Node (tests): require("./xrank.js").init(ort, modelBytes, vocabArray). */
(function(root){
"use strict";
let ORT=null,SESS=null,VOCAB=null,LOADING=null;const MAXLEN=192;
/* ---------- BERT uncased tokenizer (the model's own WordPiece vocabulary) ---------- */
function isPunct(c){const cp=c.codePointAt(0);if((cp>=33&&cp<=47)||(cp>=58&&cp<=64)||(cp>=91&&cp<=96)||(cp>=123&&cp<=126))return true;return /\p{P}/u.test(c)}
function basic(text){
 text=String(text).replace(/[\u0000�]|\p{Cc}/gu,c=>/[\t\n\r]/.test(c)?" ":"");
 text=text.toLowerCase().normalize("NFD").replace(/\p{Mn}/gu,"");
 const out=[];for(const w of text.split(/\s+/)){if(!w)continue;let cur="";for(const c of w){if(isPunct(c)||/[一-鿿]/.test(c)){if(cur)out.push(cur);out.push(c);cur=""}else cur+=c}if(cur)out.push(cur)}
 return out}
let VMAP=null;
function wordpiece(w){if(w.length>100)return [VMAP.get("[UNK]")];const ids=[];let s=0;
 while(s<w.length){let e=w.length,id;while(s<e){const sub=(s>0?"##":"")+w.slice(s,e);id=VMAP.get(sub);if(id!==undefined)break;e--}if(id===undefined)return [VMAP.get("[UNK]")];ids.push(id);s=e}return ids}
function encode(text){const ids=[];for(const w of basic(text))for(const i of wordpiece(w))ids.push(i);return ids}
function pair(q,t){const CLS=VMAP.get("[CLS]"),SEP=VMAP.get("[SEP]");let a=encode(q),b=encode(t);
 /* longest-first truncation, as the model was trained */
 while(a.length+b.length>MAXLEN-3){if(b.length>=a.length)b.pop();else a.pop()}
 return {ids:[CLS,...a,SEP,...b,SEP],types:[...Array(a.length+2).fill(0),...Array(b.length+1).fill(1)]}}
function setVocab(v){VOCAB=v;VMAP=new Map(v.map((w,i)=>[w,i]))}
/* ---------- scoring ---------- */
async function score(q,texts,batch){if(!SESS)throw new Error("reranker not loaded");batch=batch||16;const out=new Float32Array(texts.length);
 for(let s=0;s<texts.length;s+=batch){const P=texts.slice(s,s+batch).map(t=>pair(q,t));const L=Math.max(...P.map(p=>p.ids.length)),n=P.length;
  const ids=new BigInt64Array(n*L),mask=new BigInt64Array(n*L),tt=new BigInt64Array(n*L);
  P.forEach((p,j)=>{for(let k=0;k<p.ids.length;k++){ids[j*L+k]=BigInt(p.ids[k]);mask[j*L+k]=1n;tt[j*L+k]=BigInt(p.types[k])}});
  const r=await SESS.run({input_ids:new ORT.Tensor("int64",ids,[n,L]),attention_mask:new ORT.Tensor("int64",mask,[n,L]),token_type_ids:new ORT.Tensor("int64",tt,[n,L])});
  const lg=r.logits.data;for(let j=0;j<n;j++)out[s+j]=lg[j]}
 return out}
async function init(ort,model,vocab){ORT=ort;setVocab(vocab);SESS=await ORT.InferenceSession.create(model,{executionProviders:["wasm"],graphOptimizationLevel:"all"});return true}
/* browser: everything from search/rr/, loaded on first use only */
function load(){if(LOADING)return LOADING;LOADING=(async()=>{
 const base=(root.XRANK_BASE||"search/rr/");
 if(!root.ort)await new Promise((ok,no)=>{const s=document.createElement("script");s.src=base+"ort.wasm.min.js";s.onload=ok;s.onerror=no;document.head.appendChild(s)});
 /* the runtime's module and WebAssembly are handed over as a Blob and bytes, so the Android asset loader's
    content types (it does not know .mjs or .wasm) cannot block them */
 const [js,wasm,m,v]=await Promise.all([fetch(base+"ort-wasm-simd-threaded.mjs").then(r=>r.text()),fetch(base+"ort-wasm-simd-threaded.wasm").then(r=>r.arrayBuffer()),
  fetch(base+"ce.onnx").then(r=>r.arrayBuffer()),fetch(base+"vocab.json").then(r=>r.json())]);
 const E=root.ort.env.wasm;E.numThreads=1;E.wasmBinary=wasm;const self=new URL(base+"ort-wasm-simd-threaded.mjs",location.href).href;
 E.wasmPaths={mjs:URL.createObjectURL(new Blob([js.replace(/import\.meta\.url/g,JSON.stringify(self))],{type:"text/javascript"})),wasm:new URL(base+"ort-wasm-simd-threaded.wasm",location.href).href};
 await init(root.ort,new Uint8Array(m),v);return true})().catch(e=>{LOADING=null;throw e});return LOADING}
const API={load,init,score,encode,pair,ready:()=>!!SESS,_basic:basic};
if(typeof module!=="undefined"&&module.exports)module.exports=API;else root.XRANK=API;
})(typeof window!=="undefined"?window:globalThis);
