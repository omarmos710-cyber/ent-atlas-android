const fs=require("fs"),path=require("path");const W=process.env.W||require("path").join(__dirname,"../../app/src/main/assets/www/search/");
const S=require(W+"xsmart.js");const lj=(f,a,b)=>{const s=fs.readFileSync(W+f,"utf8");return JSON.parse(s.slice(s.indexOf(a),s.lastIndexOf(b)+1))};
S.setModel(lj("sm_meta.js","{","}"),fs.readFileSync(W+"sm_tok.bin").buffer,fs.readFileSync(W+"sm_vec.bin").buffer);
const DOCS=lj("full.js","[","]").concat(lj("sm_q.js","[","]")).concat(fs.existsSync(W+"sm_atlas.js")?lj("sm_atlas.js","[","]"):[]);S.buildDocs(DOCS);S.setAnswers(lj("sm_ans.js","{","}"));
function run(q,n=8){const R=S.search(q,{n:20});const A=S.answer(R,{n});return {R,A}}
module.exports={S,run,DOCS};
if(require.main===module){for(const q of process.argv.slice(2)){const {R,A}=run(q);console.log("\n### "+q);console.log(" top:",(R.list||[]).slice(0,3).map(r=>DOCS[r.i]?DOCS[r.i][1]+" | "+DOCS[r.i][3]:JSON.stringify(r).slice(0,80)).join("\n      "));
 if(!A)console.log(" (no answer)");else{console.log(" entity:",A.entity,"conf",A.conf);for(const it of (A.items||[]).slice(0,6))console.log("  -",JSON.stringify(it).slice(0,220))}}}
