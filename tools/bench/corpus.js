// Unified text of every library, keyed by article id, for benchmark validation
const {DOCS}=require("./harness.js");const {get}=require("./loadapp.js");
const T={};const add=(k,s)=>{T[k]=(T[k]||"")+"\n"+s};
for(const d of DOCS){if(!/^(sec|osec|bsec|ev)$/.test(d[0]))continue;const a=String(d[1]).split("~")[0].replace(/^(cl:t-|th:)/,"");add(a,d[2]+"\n"+d[4])}
const st=s=>String(s||"").replace(/\*\*/g,"").replace(/<[^>]+>/g," ");
for(const s of get("SECTIONS")){const txt=st(s.t)+"\n"+(s.p||[]).map(st).join("\n")+"\n"+st(s.k);add("an:"+s.id,txt);add("an:"+s.r,txt)}
for(const c of get("CONDS")){add("img:"+c.id,[c.t,c.ddx,(c.pts||[]).join("\n"),(c.paras||[]).join("\n"),(c.figs||[]).map(f=>f.t).join("\n")].map(st).join("\n"))}
module.exports=T;
if(require.main===module)console.log(Object.keys(T).length)
