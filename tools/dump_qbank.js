#!/usr/bin/env node
/* Print the clinical question bank (hub/qbank-*.js) as JSON documents for smart search:
   [id, type, title, where, text]  type: q (single best answer), viva, essay, case, card.
   Used by tools/build_smart.py; ids are the bank's stable ids (qb-<topic>-m0 ...). */
const fs=require("fs"),path=require("path"),vm=require("vm");
const H=path.join(__dirname,"..","app","src","main","assets","www","hub");
const QUIZ=[],CARDS=[];
const ctx={window:{},console:{warn(){},log(){}},QUIZ,CARDS,Q:(r,q,o,c,x)=>QUIZ.push({r,q,o,c,x}),C:(r,q,a)=>CARDS.push({r,q,a})};
ctx.window=ctx;vm.createContext(ctx);
const files=["topics.js","qcore.js",...fs.readdirSync(H).filter(f=>/^qbank-.*\.js$/.test(f)).sort()];
for(const f of files)vm.runInContext(fs.readFileSync(path.join(H,f),"utf8"),ctx,{filename:f});
const QB=ctx.QB,T=tp=>(QB[tp]&&QB[tp].t)||tp,out=[];
for(const q of QUIZ)if(q.id)out.push([q.id,"q",q.q,"Questions · "+T(q.tp),`Answer: ${q.o[q.c||0]}. ${q.x||""}`.trim()]);
for(const c of CARDS)if(c.id)out.push([c.id,"card",c.q,"Flashcards · "+T(c.tp),c.a]);
for(const tp of Object.keys(QB).sort()){const B=QB[tp];
 (B.v||[]).forEach(x=>out.push([x.id,"viva",x.q,"Questions · "+B.t+" · viva",(x.p||[]).join(". ")]));
 (B.e||[]).forEach(x=>out.push([x.id,"viva",x.q,"Questions · "+B.t+" · short essay",(x.p||[]).join(". ")]));
 (B.k||[]).forEach(x=>out.push([x.id,"viva",(x.t?x.t+": ":"")+String(x.s).slice(0,120),"Questions · "+B.t+" · case",x.s+" "+x.q.map(y=>y.q+" "+(y.o?y.o[y.c||0]:"")).join(" ")]))}
process.stdout.write(JSON.stringify(out));
