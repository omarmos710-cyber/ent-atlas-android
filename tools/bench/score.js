// Score the smart search on the benchmark. Usage: node score.js [W=path to www/search/] [--fail]
const {S,run,DOCS}=require("./harness.js");
const Q=[...require("./bench_a.js"),...require("./bench_b.js"),...require("./bench_c.js")];
const art=r=>String(r||"").split("~")[0].replace(/^(cl:t-|th:)/,"").replace(/^region:/,"an:").replace(/^cond:/,"img:");
const ns=s=>String(s).replace(/\s+/g," ");
const held=q=>{let h=0;for(const c of q)h=(h*31+c.charCodeAt(0))>>>0;return h%10<3};
let BANKN=0,BANKOK=0;const out={};let fails=[];const REC={};
for(const [lib,q,arts,re] of Q){const A=arts.split("|");const okA=a=>A.some(x=>x===a||(x.startsWith("an:")&&!x.includes("-s")&&a.startsWith(x+"-s"))||(x.startsWith("an:")&&a===x));
 let r;try{r=run(q,10)}catch(e){r={R:{list:[]},A:null}}
 if(process.env.BANK){const b=S.bankMatch(q);if(b){BANKN++;if(re.test(b.text))BANKOK++;r.A=r.A?Object.assign({},r.A,{items:[b,...r.A.items]}):{entity:"",items:[b]}}}
 const tops=[];for(const x of (r.R.list||[])){const d=DOCS[x.i];const a=d?art(d[1]):"";if(a&&!tops.includes(a))tops.push(a);if(tops.length>=3)break}
 const items=(r.A&&r.A.items)||[];const txt=ns([(r.A&&r.A.entity)||""].concat(items.map(i=>(i.label?i.label+": ":"")+i.text+" ("+i.title+")")).join(" \n "));const t3=ns(items.slice(0,3).map(i=>i.text).join(" \n "));
 const rec={r3:tops.some(okA),ans:re.test(txt),first:re.test(t3),src:items.some(i=>re.test(ns(i.text))&&okA(art(i.route)))};
 for(const k of [lib,"ALL",held(q)?"HELD-OUT":"DEV"]){const o=out[k]=out[k]||{n:0,r3:0,ans:0,first:0,src:0};o.n++;for(const m of ["r3","ans","first","src"])o[m]+=rec[m]?1:0}
 if(!rec.src)fails.push([lib,q,arts,tops.join(","),(r.A&&r.A.entity)||"-"]);REC[q]=rec.ans?1:0;
}
const pc=(a,b)=>(100*a/b).toFixed(0).padStart(4)+"%";
console.log("library      n   found-article  answer-has-fact  in-first-3  fact-from-right-article");
for(const [k,o] of Object.entries(out))console.log(k.padEnd(10),String(o.n).padStart(4),pc(o.r3,o.n),"        ",pc(o.ans,o.n),"          ",pc(o.first,o.n),"     ",pc(o.src,o.n));
if(process.env.BANK)console.log("bank matches",BANKN,"with the fact",BANKOK);
if(process.argv.includes("--fail"))for(const f of fails)console.log("FAIL",f.join(" | "));

const fs=require("fs");const prev=fs.existsSync("last.json")?JSON.parse(fs.readFileSync("last.json")):null;
if(prev&&process.argv.includes("--diff")){for(const q in REC)if(prev[q]!==undefined&&prev[q]!==REC[q])console.log(REC[q]?"  + fixed:":"  - BROKE:",q)}
if(!process.argv.includes("--nosave"))fs.writeFileSync("last.json",JSON.stringify(REC));
