const T=require("./corpus.js");const files=process.argv.slice(2);let bad=0,n=0;
for(const f of files)for(const [lib,q,arts,re] of require("./"+f)){n++;const A=arts.split("|");
 const miss=A.filter(a=>!T[a]);const hit=A.filter(a=>T[a]&&re.test(T[a].replace(/\s+/g," ")));
 if(miss.length&&miss.length===A.length){bad++;console.log("NOART",lib,q,arts);continue}
 if(!hit.length){bad++;console.log("NOMATCH",lib,"|",q,"|",arts,re)}}
console.log(n,"questions,",bad,"problems")
