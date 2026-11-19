const {S,DOCS}=require("/home/claude/ent-atlas-android/tools/bench/harness.js");const fs=require("fs");
const M=JSON.parse(fs.readFileSync("/home/claude/ent-atlas-android/app/src/main/assets/www/search/sm_ans.js","utf8").replace(/^window.XSMA=/,"").replace(/;\s*$/,""));
let rnd=11;const rand=()=>(rnd=(rnd*48271)%2147483647)/2147483647;
const seen=new Set(),byLib={};
for(let j=0;j<M.l.length;j+=5){const [d,k,e,a,w]=M.l.slice(j,j+5);if(w<9)continue;const D=DOCS[d];if(!D)continue;const u=S._units(D[4])[k];if(!u)continue;const t=u.t.replace(/\s+/g," ");if(t.length<40||t.length>300)continue;
 const key=d+":"+k;if(seen.has(key))continue;seen.add(key);const lib=String(D[1]).split(/[:\-~]/)[0];(byLib[lib]=byLib[lib]||[]).push({d,k,e:M.e[e][0],a:M.asp[a],sec:D[3]+" › "+D[2],t:(u.label?u.label+": ":"")+t})}
const out=[];const N=+process.argv[2]||500;const libs=Object.keys(byLib);console.error(libs.map(l=>l+":"+byLib[l].length).join(" "));
const per=Math.ceil(N/libs.length);for(const l of libs){const L=byLib[l].sort(()=>rand()-.5);out.push(...L.slice(0,Math.max(per,Math.round(N*byLib[l].length/seen.size))))}
const pick=out.sort(()=>rand()-.5).slice(0,N);fs.writeFileSync("/home/claude/work/lines.json",JSON.stringify(pick));
pick.forEach((x,i)=>console.log(i+"|"+x.e+"|"+x.a+"|"+x.t.slice(0,200)));
