/* Question bank core: every clinical topic registers its MCQs, cards, viva items, short essays and cases here.
   IDs are stable ("qb-<topic>-m0") so spaced repetition and the mistakes list survive updates.
   Format: QBADD(topic, group, title, {m:[[stem,[correct,...wrong],0,explanation,diff]], c:[[q,a]], v:[[q,[points]]], e:[[q,[points]]], k:[{s:stem,q:[[q,[correct,...],0,expl]]}]}) */
window.QB=window.QB||{};
function QBADD(tp,g,t,o){const B=QB[tp]=QB[tp]||{g,t,v:[],e:[],k:[]};B.g=g;B.t=t;const r="cl-"+g;
 (o.m||[]).forEach(x=>{const i=(B.nm=(B.nm||0))+0;B.nm++;Q(r,x[0],x[1],x[2]||0,x[3]||"");const q=QUIZ[QUIZ.length-1];q.id="qb-"+tp+"-m"+i;q.tp=tp;if(x[4])q.d=x[4]});
 (o.c||[]).forEach(x=>{const i=(B.nc=(B.nc||0))+0;B.nc++;C(r,x[0],x[1]);const c=CARDS[CARDS.length-1];c.id="qb-"+tp+"-c"+i;c.tp=tp});
 (o.v||[]).forEach(x=>B.v.push({id:"qb-"+tp+"-v"+B.v.length,tp,q:x[0],p:x[1]}));
 (o.e||[]).forEach(x=>B.e.push({id:"qb-"+tp+"-e"+B.e.length,tp,q:x[0],p:x[1]}));
 (o.k||[]).forEach(x=>{const k=B.k.length;B.k.push({id:"qb-"+tp+"-k"+k,tp,s:x.s,t:x.t||"",q:x.q.map((y,j)=>({id:"qb-"+tp+"-k"+k+"-"+j,tp,r,q:y[0],o:y[1],c:y[2]||0,x:y[3]||""}))})})}
/* shorthand: group and title come from hub/topics.js */
function QB_(tp,o){const x=(window.QT||{})[tp];if(!x){console.warn("qbank: unknown topic",tp);return}QBADD(tp,x[0],x[1],o)}
/* full marking points for a viva or essay item, by id (used by qbank-points*.js) */
function QBP(id,p){const m=id.match(/^qb-(.+)-([ve])(\d+)$/);if(!m||!QB[m[1]])return;const it=QB[m[1]][m[2]][+m[3]];if(it)it.p=p}
