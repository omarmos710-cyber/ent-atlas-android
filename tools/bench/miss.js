// questions whose answer box (engine, 10 lines, bank first) lacks the fact; optional library filter
const {S,run}=require("./harness.js");const lib0=process.argv[2];const files=(process.argv[3]||"bench_a.js,bench_b.js,bench_c.js").split(",");
const Q=files.flatMap(f=>require("./"+f));const ns=s=>String(s).replace(/\s+/g," ");
for(const [lib,q,arts,re] of Q){if(lib0&&lib!==lib0)continue;const r=run(q,10);let A=r.A;const b=S.bankMatch(q);const items=[...(b?[b]:[]),...((A&&A.items)||[])];
 const txt=ns([(A&&A.entity)||""].concat(items.map(i=>(i.label?i.label+": ":"")+i.text+" ("+i.title+")")).join(" \n "));
 if(!re.test(txt)){console.log("\n# "+q+"  ["+((A&&A.entity)||"-")+" | asp "+r.R.P.aspects.map(a=>a.id)+"]");for(const i of items.slice(0,4))console.log("   ",i.route.replace(/^cl:t-/,""),"|",i.text.slice(0,110))}}
