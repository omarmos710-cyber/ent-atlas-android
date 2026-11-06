/* Today, the practice hub and the exam modes: question bank, clinical cases, picture questions, viva and short essays.
   Loads after xsearch.js, so its Today page replaces the search launcher while keeping the same search box. */
(function(){
"use strict";
const E=s=>esc(String(s==null?"":s));
const md=s=>E(s).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>");
const GN={ear:"Ear",nose:"Nose & sinuses",mouth:"Mouth & throat",larynx:"Larynx & airway",neck:"Neck, thyroid & salivary",appr:"Approach to"};
const GK=Object.keys(GN);
const QT=()=>window.QT||{};
/* topics added most recently, newest first: shown as "New in the app" until opened */
const NEWIN=["oral_ca","paeds_vs","anaes","syndr","ap_dizzy","ap_hoarse","ap_block","ap_dysph","ap_otorr","ap_face","ap_sore","ap_smell","ap_full","ap_rhin","ap_pnd","ap_pain","ap_epiph","ap_crust","ap_ulcer","ap_globus","ap_saliv","oesoph","fbfood","laser","skullbase","cleft","facplast","hnrecon","hncprinc","saltum","vascneck","hnrt","hivent","skinca","jaw"];
Object.assign(ICON,{
 viva:'<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>',
 essay:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
 kase:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M12 11v5M9.5 13.5h5"/>',
 cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 bank:'<path d="M4 6h16M4 12h16M4 18h10"/><circle cx="19" cy="18" r="2"/>',
 bars:'<path d="M5 20V10M12 20V4M19 20v-7"/>',
 book:'<path d="M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-5v18h5a2 2 0 0 1 2 2z"/>'});

/* ---------- state ---------- */
const HS=()=>{const h=ST.hub=ST.hub||{};h.tq=h.tq||{};h.v=h.v||{};h.e=h.e||{};h.k=h.k||{};h.set=h.set||{};return h};
const CLR=()=>ST.clr=ST.clr||{};const CLO=()=>ST.clo=ST.clo||{};
const tname=tp=>(QB[tp]&&QB[tp].t)||(QT()[tp]||[])[1]||tp;
const tgroup=tp=>(QB[tp]&&QB[tp].g)||(QT()[tp]||[])[0]||"";
const topics=g=>Object.keys(QT()).filter(id=>!g||QT()[id][0]===g);
const qkey=q=>q.tp?"t:"+q.tp:"r:"+q.r;
const kname=k=>k.startsWith("t:")?tname(k.slice(2)):((RMAP[k.slice(2)]||{}).name||k.slice(2));
function rec(q,ok){const h=HS(),k=qkey(q),a=h.tq[k]=h.tq[k]||[0,0,0];a[1]++;if(ok)a[0]++;a[2]=Date.now();
 if(q.id&&!/-k\d+-\d+$/.test(q.id)){const m=MS();if(ok)delete m.q[q.id];else m.q[q.id]={t:Date.now(),n:((m.q[q.id]||{}).n||0)+1}}}
function weak(n){return Object.entries(HS().tq).filter(([,a])=>a[1]>=3).map(([k,a])=>({k,s:a[0],n:a[1],pct:Math.round(100*a[0]/a[1])})).filter(x=>x.pct<80).sort((x,y)=>x.pct-y.pct||y.n-x.n).slice(0,n)}
const mins=id=>{const i=(window.CLART_IDX||{})[id];return i?Math.max(3,Math.round(i.w/220)):0};
const LJ={};const lj=(src,ok)=>ok()?Promise.resolve():LJ[src]=LJ[src]||new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.onload=res;s.onerror=()=>{delete LJ[src];rej()};document.head.appendChild(s)});
const needIdx=()=>lj("clinic/art/index.js",()=>window.CLART_IDX).catch(()=>0);
const needFigs=()=>lj("clinic/art/figs.js",()=>window.CLART_FIGS).catch(()=>0);
window.HUB={rec,tname,qkey,kname,HS};

/* ---------- scopes: all | anat | clin | g:<group> | r:<region> | t:<topic> ---------- */
function inScope(q,s){if(!s||s==="all")return true;const cl=String(q.r||"").startsWith("cl-");if(s==="anat")return !cl;if(s==="clin")return cl;
 const a=s[0],b=s.slice(2);if(a==="g")return q.r==="cl-"+b;if(a==="r")return q.r===b;if(a==="t")return q.tp===b;return true}
function scopeName(s){if(!s||s==="all")return "Everything";if(s==="anat")return "All anatomy";if(s==="clin")return "All clinical";const a=s[0],b=s.slice(2);
 if(a==="g")return GN[b]||b;if(a==="r")return (RMAP[b]||{}).name||b;if(a==="t")return tname(b);return s}
const items=kind=>Object.values(QB).flatMap(B=>(B[kind]||[]).map(x=>({...x,r:"cl-"+B.g})));
const caseQs=()=>items("k").flatMap(c=>c.q);
const set=(m,d)=>{const h=HS().set;h[m]=Object.assign({},d,h[m]||{});return h[m]};
const DEF={mcq:{s:"all",n:10,f:"mix",m:"prac"},viva:{s:"clin",n:5,t:90},essay:{s:"clin",t:15},case:{s:"clin",n:3},pic:{s:"all",n:10}};

/* ---------- small pieces ---------- */
const chip=(on,attr,label,sub)=>`<button type="button" class="h-chip" aria-pressed="${!!on}" ${attr}>${E(label)}${sub!=null?`<small>${E(sub)}</small>`:""}</button>`;
const hrow=(attr,icon,t,s,tag)=>`<button class="h-row" ${attr}><span class="h-ico">${ic(icon,19)}</span><span class="h-rt"><b>${E(t)}</b>${s?`<small>${s}</small>`:""}</span>${tag?`<em class="h-tag">${E(tag)}</em>`:""}${ic("chev",16)}</button>`;
const bar=(label,s,n,attr)=>{const p=n?Math.round(100*s/n):0;return `<button class="h-bar" ${attr||""}><span class="h-bl">${E(label)}</span><span class="h-bt"><i style="width:${p}%" class="${p<50?"lo":p<75?"mid":"hi"}"></i></span><em>${p}%<small>${s}/${n}</small></em></button>`};
const qhead=(i,n)=>`<div class="qhead"><button class="back" data-hend aria-label="End"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button><div class="qbar2"><i style="width:${100*i/Math.max(1,n)}%"></i></div><span class="qcount">${i+1} / ${n}</span></div>`;
const diff=q=>q.d?`<span class="qdiff d-${q.d}">${q.d==="H"?"Hard":"Medium"}</span>`:"";
function ring(p,label,sub,attr){const R=26,C=2*Math.PI*R;p=Math.max(0,Math.min(1,p||0));
 return `<button class="h-ring" ${attr||""}><svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="${R}" fill="none" stroke="var(--soft)" stroke-width="5"/><circle cx="32" cy="32" r="${R}" fill="none" stroke="var(--accent)" stroke-width="5" stroke-linecap="round" transform="rotate(-90 32 32)" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-p)}" class="h-arc" style="--c:${C}"/></svg><span class="h-rv">${Math.round(p*100)}<i>%</i></span><b>${E(label)}</b><small>${E(sub)}</small></button>`}
const fmtD=d=>d.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"});
function examDays(){const d=HS().exam;if(!d)return null;const t=new Date(d+"T00:00:00"),n=new Date();n.setHours(0,0,0,0);return Math.round((t-n)/864e5)}

/* ---------- clinical reading progress ---------- */
const order=()=>Object.keys(QT());
function clinicNext(){const r=CLR(),o=CLO(),last=ST.cll;if(last&&!r[last]&&QT()[last])return last;
 const nw=NEWIN.find(id=>QT()[id]&&!o[id]);if(nw)return nw;return order().find(id=>!r[id])||null}
function clinicDone(){const r=CLR();return order().filter(id=>r[id]).length}

/* ======================= TODAY ======================= */
function plan(){const t=todayCounts(),S=[];
 if(t.due)S.push({i:"study",t:`Review ${t.due} due card${t.due>1?"s":""}`,s:`about ${Math.max(1,Math.round(t.due*.4))} min`,a:"due"});
 else if(t.dd)S.push({i:"drill",t:`Label ${t.dd} due figure${t.dd>1?"s":""}`,s:`about ${Math.max(1,Math.round(t.dd*1.5))} min`,a:"drill"});
 else if(t.fresh)S.push({i:"study",t:"Learn 10 new cards",s:"about 5 min",a:"new"});
 const w=weak(1)[0];S.push(w?{i:"quiz",t:`10 questions: ${kname(w.k)}`,s:`your weakest topic, ${w.pct}% so far`,a:"weak:"+w.k}:{i:"quiz",t:"10 mixed questions",s:"anatomy and clinical, about 8 min",a:"mix"});
 const cn=clinicNext();if(cn)S.push({i:"book",t:`Read ${tname(cn)}`,s:mins(cn)?`about ${mins(cn)} min`:"clinical article",a:"read:"+cn});
 if(t.mc&&S.length<4)S.push({i:"mistakes",t:`Redo ${t.mc} mistake${t.mc>1?"s":""}`,s:"from earlier sessions",a:"miss"});
 return S.slice(0,3)}
function doPlan(a){if(a==="due")return startDeck("all","due");if(a==="drill")return startDrill("all");if(a==="new")return startDeck("all","new");
 if(a==="mix")return startRun(QUIZ,"Mixed questions",{n:10});if(a==="miss")return go("mistakes");
 if(a.startsWith("weak:"))return weakRun(a.slice(5));if(a.startsWith("read:"))return go("cl:t-"+a.slice(5))}
function weakRun(k){const pool=k.startsWith("t:")?QUIZ.filter(q=>q.tp===k.slice(2)):QUIZ.filter(q=>q.r===k.slice(2)&&!q.tp);startRun(pool,kname(k),{n:10})}
function vivaOfDay(){const all=items("v");if(!all.length)return null;const d=today().replace(/-/g,"");let h=0;for(const c of d)h=(h*31+c.charCodeAt(0))>>>0;return all[h%all.length]}
function vToday(){
 const hr=new Date().getHours(),greet=hr<5?"Good evening":hr<12?"Good morning":hr<18?"Good afternoon":"Good evening";
 const sk=streak(),ed=examDays();const sub=[sk?`${sk}-day streak`:"",ed!=null?(ed>0?`${ed} day${ed>1?"s":""} to your exam`:ed===0?"Exam day. Good luck":""):""].filter(Boolean).join(" · ");
 const P=plan();
 const secR=SECTIONS.filter(s=>ST.read[s.id]).length,nArt=order().length||100,artR=clinicDone();
 const learned=CARDS.filter(c=>!isNew(c)).length;
 let qs=0,qn=0;ST.quiz.slice(-60).forEach(x=>{qs+=x.s;qn+=x.n});
 let cont="";try{const s=continueSec();if(s)cont=`<button class="h-cont" data-go="region:${s.r}" data-sec="${s.id}"><span class="eyebrow">Anatomy</span><b>${E((RMAP[s.r]||{}).name||"")}</b><small>${E(s.t)}</small></button>`}catch(e){}
 const cn=clinicNext();if(cn)cont+=`<button class="h-cont" data-go="cl:t-${cn}"><span class="eyebrow">${ST.cll===cn?"Keep reading":CLO()[cn]?"Clinical":"Start reading"}</span><b>${E(tname(cn))}</b><small>${E(GN[tgroup(cn)]||"Clinical")}${mins(cn)?` · ${mins(cn)} min`:""}</small></button>`;
 const W=weak(6);const vd=vivaOfDay();const nw=NEWIN.filter(id=>QT()[id]&&!CLO()[id]).slice(0,4);
 V().innerHTML=`<div class="h-today">
 <header class="h-greet"><span class="eyebrow">${E(fmtD(new Date()))}</span><h1>${greet}</h1>${sub?`<p>${E(sub)}</p>`:""}</header>
 <div class="xsq big">${ic("search",20)}<input type="search" id="hx" autocomplete="off" enterkeyhint="search" placeholder="Symptoms, anatomy, surgery…" aria-label="Search everything"></div>
 <div id="hxres" aria-live="polite"></div>
 <div id="hxrest">
  <section class="h-plan"><div class="h-planh"><span class="eyebrow">Today's plan</span><small>${P.length} step${P.length>1?"s":""}</small></div>
   <ol>${P.map((p,i)=>`<li><button data-hplan="${E(p.a)}"><span class="h-pn">${i+1}</span><span class="h-pt"><b>${E(p.t)}</b><small>${E(p.s)}</small></span>${ic("chev",16)}</button></li>`).join("")}</ol>
   <button class="h-go" data-hplan="${E(P[0].a)}">Start with step 1</button></section>
  ${cont?`<div class="h-pair">${cont}</div>`:""}
  <section class="h-sec"><div class="h-sech"><h2>Your progress</h2><button class="linkbtn" data-go="hub:res">By topic</button></div>
   <div class="h-rings">${ring(secR/SECTIONS.length,"Anatomy",`${secR} of ${SECTIONS.length} sections`,'data-go="atlas"')}${ring(artR/nArt,"Clinical",`${artR} of ${nArt} articles`,'data-go="cl:home"')}${ring(learned/CARDS.length,"Cards",`${learned} of ${CARDS.length} learned`,'data-go="cards"')}${ring(qn?qs/qn:0,"Questions",qn?`${qn} recent answers`:"none answered yet",'data-go="hub:mcq"')}</div></section>
  ${W.length?`<section class="h-sec"><div class="h-sech"><h2>Weak spots</h2><small>tap for 10 questions</small></div><div class="h-weak">${W.map(w=>`<button data-hweak="${E(w.k)}"><b>${E(kname(w.k))}</b><span><i style="width:${w.pct}%"></i></span><small>${w.pct}% of ${w.n}</small></button>`).join("")}</div></section>`:""}
  ${vd?`<section class="h-vod"><span class="eyebrow">Viva question of the day</span><p class="h-vq">${E(vd.q)}</p><small>${E(tname(vd.tp))}</small><div class="h-vans" hidden><ul>${vd.p.map(x=>`<li>${md(x)}</li>`).join("")}</ul></div><div class="h-vact"><button class="btn" data-hvod>Show the model answer</button><button class="linkbtn" data-go="hub:viva">Viva simulator</button></div></section>`:""}
  ${nw.length?`<section class="h-sec"><div class="h-sech"><h2>New in the app</h2><button class="linkbtn" data-go="cl:home">All articles</button></div><div class="h-list">${nw.map(id=>hrow(`data-go="cl:t-${id}"`,"book",tname(id),E(GN[tgroup(id)]||"")+(mins(id)?` · ${mins(id)} min read`:""),"New")).join("")}</div></section>`:""}
 </div></div>`;
 if(!window.CLART_IDX)needIdx().then(()=>{if(cur==="home"&&document.querySelector(".h-today")&&!(document.getElementById("hx")||{}).value)vToday()})}
vHome=vToday;

/* ======================= PRACTICE HUB ======================= */
const TABS=[["learn","Learn"],["test","Test"],["exam","Exam"],["fix","Fix"]];
function vHub(arg){const h=HS();if(arg&&TABS.some(t=>t[0]===arg))h.tab=arg;const tab=h.tab||"test";
 const t=todayCounts(),mc=missCounts().total,ed=examDays();
 const nv=items("v").length,ne=items("e").length,nk=items("k").length;
 const P=plan()[0];
 const L={
 learn:[hrow('data-go="cards"',"study","Flashcards",`${t.due} due · ${CARDS.length} cards with spaced repetition`),
  hrow('data-go="drill"',"drill","Label drills",`${DRILLKEYS.length} figures with the labels hidden`),
  hrow('data-go="order"',"order","Build the order",`${ORDERS.length} sequences: layers, branches, steps`),
  hrow('data-go="tracer"',"tracer","Tracer and lesion simulators",`${TRACE.length} nerves and vessels to follow`),
  hrow('data-go="tables"',"tables","Tables","comparisons and classifications"),
  hrow('data-go="cl:home"',"book","Clinical articles",`${clinicDone()} of ${order().length||100} read`)],
 test:[hrow('data-go="hub:mcq"',"bank","Question bank",`${QUIZ.length} single best answers · choose area, topic and mode`),
  hrow('data-go="hub:case"',"kase","Clinical cases",nk?`${nk} cases, each with follow-on questions`:"coming with the next content update"),
  hrow('data-go="hub:pic"',"figures","Picture questions","clinical photos, scans and anatomy figures"),
  hrow('data-go="spot"',"spot","Spot diagnosis",`${CONDS.length} conditions from real scans`),
  hrow('data-go="lab:tf"',"quiz","True or false","judge a proposed answer"),
  hrow('data-go="lab:type"',"essay","Type the answer","recall without options, then mark yourself"),
  hrow('data-go="lab:match"',"tables","Match-up","pair items from the tables")],
 exam:[`<div class="h-exam"><span class="h-ico">${ic("cal",19)}</span><label class="h-rt"><b>${ed==null?"Set your exam date":ed>0?`${ed} day${ed>1?"s":""} to go`:ed===0?"Exam day":"Exam date passed"}</b><small>the countdown shows on Today</small></label><input type="date" id="hexam" value="${E(h.exam||"")}" aria-label="Exam date"></div>`,
  hrow('data-go="lab:mock"',"test","Timed MCQ paper","answers hidden until the end, one minute per question"),
  hrow('data-go="hub:viva"',"viva","Viva simulator",nv?`${nv} examiner questions with marking points`:"coming with the next content update"),
  hrow('data-go="hub:essay"',"essay","Short essays",ne?`${ne} written questions with a marking checklist`:"coming with the next content update"),
  hrow('data-go="hub:case"',"kase","Long and short cases",nk?`${nk} clinical scenarios`:""),
  hrow('data-go="practical"',"bone","Bench exam",`${BENCH.length} timed stations on bones and specimens`)],
 fix:[hrow('data-go="mistakes"',"mistakes","Mistakes",mc?`${mc} to redo`:"nothing to redo yet"),
  hrow('data-go="hub:res"',"bars","Results by topic","every topic you have been tested on, weakest first")]};
 const W=weak(5);
 V().innerHTML=`<div class="hero h-hhead"><span class="eyebrow">Study</span><h1>Practise</h1><p class="lede">Learn it, test it, sit it as the exam would, then fix what went wrong.</p></div>
 <button class="recommend h-rec" data-hplan="${E(P.a)}"><span class="eyebrow">Recommended next</span><strong>${E(P.t)}</strong><span>${E(P.s)}</span></button>
 <div class="h-tabs" role="tablist">${TABS.map(([k,l])=>`<button role="tab" aria-selected="${k===tab}" data-htab="${k}">${l}</button>`).join("")}</div>
 <div class="h-list" role="tabpanel">${L[tab].join("")}</div>
 ${tab==="fix"?(W.length?`<section class="h-sec"><div class="h-sech"><h2>Weakest topics</h2><small>tap for 10 questions</small></div>${W.map(w=>bar(kname(w.k),w.s,w.n,`data-hweak="${E(w.k)}"`)).join("")}</section>`:`<p class="h-empty">Answer a few questions and your weakest topics will gather here.</p>`):""}`}
EXTRA.study=vHub;

/* ======================= SETUP SHEETS ======================= */
const MODES={mcq:["Question bank","Single best answers from the whole app. Pick an area, narrow it to a topic if you like, and choose practice or timed."],
 viva:["Viva simulator","The examiner asks; you answer aloud against the clock. Then reveal the marking points and tick what you covered."],
 essay:["Short essays","Write a structured answer as you would on the paper, then mark it against the checklist."],
 case:["Clinical cases","A patient, then a run of questions that follow the case from diagnosis to management."],
 pic:["Picture questions","A figure from the clinical articles or the anatomy atlas. Say what it shows."]};
function pool(mode,S){
 if(mode==="mcq"){let p=QUIZ.filter(q=>inScope(q,S.s));const m=MS().q;if(S.f==="new"){const seen=new Set(ST.hub&&ST.hub.seen||[]);p=p.filter(q=>!seen.has(q.id))}if(S.f==="miss")p=p.filter(q=>m[q.id]);return p}
 if(mode==="viva")return items("v").filter(x=>inScope(x,S.s));
 if(mode==="essay")return items("e").filter(x=>inScope(x,S.s));
 if(mode==="case")return items("k").filter(x=>inScope(x,S.s));
 return []}
function scopeRows(mode,S){const clinOnly=mode!=="mcq";const cnt=s=>mode==="pic"?"":pool(mode,Object.assign({},S,{s,f:"mix"})).length;
 const top=clinOnly?[["clin","All clinical"]]:[["all","Everything"],["anat","Anatomy"],["clin","Clinical"]];
 const s=S.s,inG=s.startsWith("g:")||s.startsWith("t:")||s==="clin",inA=s==="anat"||s.startsWith("r:");
 let h=`<div class="h-field"><span class="h-fl">Area</span><div class="h-chips">${top.map(([k,l])=>chip(k===s||(k==="clin"&&inG&&!clinOnly)||(k==="anat"&&inA),`data-hs="${mode}|s|${k}"`,l,cnt(k))).join("")}</div></div>`;
 if(inG||clinOnly){const g=s.startsWith("g:")?s.slice(2):s.startsWith("t:")?tgroup(s.slice(2)):"";
  h+=`<div class="h-field"><span class="h-fl">Specialty</span><div class="h-chips">${GK.map(k=>chip(k===g,`data-hs="${mode}|s|g:${k}"`,GN[k],cnt("g:"+k))).join("")}</div></div>`;
  if(g){const ts=topics(g).map(id=>[id,cnt("t:"+id)]).filter(x=>x[1]);
   h+=`<div class="h-field"><span class="h-fl">Topic</span><div class="h-chips h-tchips">${chip(s==="g:"+g,`data-hs="${mode}|s|g:${g}"`,"Any topic")}${ts.map(([id,n])=>chip(s==="t:"+id,`data-hs="${mode}|s|t:${id}"`,tname(id),n)).join("")}</div></div>`}}
 if(inA&&!clinOnly){h+=`<div class="h-field"><span class="h-fl">Region</span><div class="h-chips h-tchips">${chip(s==="anat",`data-hs="${mode}|s|anat"`,"Any region")}${REGIONS.filter(r=>!r.id.startsWith("cl-")).map(r=>[r,cnt("r:"+r.id)]).filter(x=>x[1]).map(([r,n])=>chip(s==="r:"+r.id,`data-hs="${mode}|s|r:${r.id}"`,r.name,n)).join("")}</div></div>`}
 return h}
const opts=(mode,key,label,list,S)=>`<div class="h-field"><span class="h-fl">${label}</span><div class="h-chips">${list.map(([v,l])=>chip(S[key]===v,`data-hs="${mode}|${key}|${v}"`,l)).join("")}</div></div>`;
function vSetup(mode){const [t,lede]=MODES[mode];const S=set(mode,DEF[mode]);let body="",n=0,label="";
 if(mode==="pic"){body=`<div class="h-field"><span class="h-fl">Figures</span><div class="h-chips">${[["all","Everything"],["clin","Clinical articles"],["anat","Anatomy atlas"]].concat(GK.map(g=>["g:"+g,GN[g]])).map(([k,l])=>chip(S.s===k,`data-hs="pic|s|${k}"`,l)).join("")}</div></div>`+opts(mode,"n","Questions",[[5,"5"],[10,"10"],[20,"20"]],S);label=`Start · ${S.n} pictures`;n=1}
 else{body=scopeRows(mode,S);const P=pool(mode,S);n=P.length;
  if(mode==="mcq"){body+=opts(mode,"n","Questions",[[5,"5"],[10,"10"],[20,"20"],[40,"40"]],S)+opts(mode,"f","Include",[["mix","All"],["new","Not seen yet"],["miss","Got wrong before"]],S)+opts(mode,"m","Mode",[["prac","Practice: answers as you go"],["timed","Timed: answers at the end"]],S);label=n?`Start · ${Math.min(S.n,n)} of ${n} questions`:"No questions match"}
  if(mode==="viva"){body+=opts(mode,"n","Questions",[[5,"5"],[10,"10"],[15,"15"]],S)+opts(mode,"t","Time per question",[[60,"1 min"],[90,"1½ min"],[120,"2 min"],[0,"No timer"]],S);label=n?`Start · ${Math.min(S.n,n)} of ${n} questions`:"No viva questions here yet"}
  if(mode==="essay"){body+=opts(mode,"t","Time",[[10,"10 min"],[15,"15 min"],[20,"20 min"],[0,"No timer"]],S);label=n?`Start · 1 of ${n} essays`:"No essays here yet"}
  if(mode==="case"){body+=opts(mode,"n","Cases",[[1,"1"],[3,"3"],[5,"5"]],S);label=n?`Start · ${Math.min(S.n,n)} of ${n} cases`:"No cases here yet"}}
 V().innerHTML=`<div class="hero"><span class="eyebrow"><button class="linkbtn h-up" data-go="study">Practise</button></span><h1>${t}</h1><p class="lede">${lede}</p></div>
 <section class="h-sheet">${body}</section><div class="qfoot2"><button class="btn primary wide" data-hstart="${mode}" ${n?"":"disabled"}>${E(label)}</button></div>`}
function startMode(mode){const S=set(mode,DEF[mode]);
 if(mode==="mcq"){const P=pool(mode,S);return startRun(P,scopeName(S.s),{n:S.n,timed:S.m==="timed"})}
 if(mode==="viva")return startViva(pool(mode,S),S);
 if(mode==="essay")return startEssay(pool(mode,S),S);
 if(mode==="case")return startCase(pool(mode,S),S);
 if(mode==="pic")return startPic(S)}

/* ======================= MCQ RUNNER ======================= */
let RUN=null;
function startRun(P,title,o){o=o||{};const qs=shuffle(P.slice()).slice(0,o.n||P.length).map(q=>({...q,order:shuffle(q.o.map((_,i)=>i))}));
 if(!qs.length)return toast("No questions here yet");
 if(o.timed){LAB.r="all";LAB.s={q:qs,i:0,ans:[],left:qs.length*60,mode:"mock",r:"all"};go("lab:mock");return}
 RUN={title,qs,i:0,ans:[]};go("hub:run")}
window.hubRun=startRun;
function vRun(){const R=RUN;if(!R)return go("study");if(R.i>=R.qs.length)return runResult();
 const q=R.qs[R.i],a=R.ans[R.i],done=a!=null,ok=R.ans.filter((x,i)=>x===R.qs[i].c).length;
 V().innerHTML=`${qhead(R.i,R.qs.length)}<div class="qstage enter"><span class="eyebrow">${E(kname(qkey(q)))}${ok?` · <span class="qscore">${ok} correct</span>`:""}</span><p class="qtext">${diff(q)}${E(q.q)}</p>
 <div class="qopts">${q.order.map((k,j)=>`<button class="qopt ${done?(k===q.c?"ok":k===a?"bad":"mute"):""}" data-hrun="${k}" ${done?"disabled":""}><span class="ql">${"ABCDEF"[j]}</span><span class="qo">${E(q.o[k])}</span></button>`).join("")}</div>
 ${done?`<div class="qexp"><span class="verdict ${a===q.c?"good":"poor"}">${a===q.c?"Correct":"Not quite"}</span>${q.x?`<p>${md(q.x)}</p>`:""}<div>${q.tp?`<button class="linkbtn" data-go="cl:t-${q.tp}">Read the article</button>`:`<button class="linkbtn" data-go="region:${q.r}">Open the notes</button>`}</div></div>`:""}</div>
 ${done?`<div class="qfoot2"><button class="btn primary wide" data-hrunnext>${R.i+1<R.qs.length?"Next question":"See results"}</button></div>`:""}`}
function byTopic(list){const tb={};list.forEach(([q,ok])=>{const k=qkey(q);tb[k]=tb[k]||[0,0];tb[k][1]++;if(ok)tb[k][0]++});return Object.entries(tb).sort((a,b)=>a[1][0]/a[1][1]-b[1][0]/b[1][1]||b[1][1]-a[1][1])}
function runResult(){const R=RUN,res=R.qs.map((q,i)=>[q,R.ans[i]===q.c]),s=res.filter(x=>x[1]).length;
 if(!R.saved){R.saved=1;const by={};res.forEach(([q,ok])=>{by[q.r]=by[q.r]||[0,0];by[q.r][1]++;if(ok)by[q.r][0]++});ST.quiz.push({r:"all",s,n:res.length,t:Date.now(),by});ST.quiz=ST.quiz.slice(-300);studied();save()}
 const tb=byTopic(res),miss=res.filter(x=>!x[1]).map(x=>x[0]);
 V().innerHTML=`${labResult(R.title,s,res.length,`${Math.round(100*s/res.length)}% correct.${miss.length?" Missed questions go to your mistakes list.":""}`)}
 ${tb.length>1?`<section class="h-sec"><div class="h-sech"><h2>By topic</h2></div>${tb.map(([k,a])=>bar(kname(k),a[0],a[1],`data-hweak="${E(k)}"`)).join("")}</section>`:""}
 ${miss.length?`<section class="h-sec"><div class="h-sech"><h2>Review what you missed</h2></div>${miss.map(q=>`<div class="labrev"><span class="eyebrow">${E(kname(qkey(q)))}</span><p class="qtext">${E(q.q)}</p><p><b>Answer:</b> ${E(q.o[q.c])}</p>${q.x?`<p class="h-x">${md(q.x)}</p>`:""}</div>`).join("")}</section>`:""}
 <div class="qfoot2"><button class="btn primary wide" data-hagain>Another ${res.length}</button></div>`;RUN.again=()=>startRun(R.qs,R.title,{n:R.qs.length})}

/* ======================= VIVA ======================= */
let VV=null;
function startViva(P,S){if(!P.length)return toast("No viva questions here yet");VV={q:shuffle(P.slice()).slice(0,S.n||P.length),i:0,show:false,tk:{},res:[],secs:S.t||0,left:S.t||0,title:scopeName(S.s)};go("hub:vivarun")}
function vViva(){const s=VV;if(!s)return go("hub:viva");stopLab();const it=s.q[s.i];
 if(!it){const sc=s.res.reduce((a,x)=>a+x.s,0),mx=s.res.reduce((a,x)=>a+x.n,0);
  V().innerHTML=`${labResult("Viva · "+s.title,sc,mx,"Marking points you covered. Examiners pass a candidate who gives the key points in a safe order, not every detail.")}
  ${s.res.filter(x=>x.s<x.n).map(x=>`<div class="labrev"><span class="eyebrow">${E(tname(x.it.tp))} · ${x.s} of ${x.n}</span><p class="qtext">${E(x.it.q)}</p><ul class="h-pts">${x.it.p.map((p,i)=>`<li class="${x.tk[i]?"ok":""}">${md(p)}</li>`).join("")}</ul></div>`).join("")}
  <div class="qfoot2"><button class="btn primary wide" data-go="hub:viva">Another viva</button></div>`;return}
 V().innerHTML=`${qhead(s.i,s.q.length)}<div class="qstage enter"><div class="labmeta"><span class="eyebrow">The examiner asks · ${E(tname(it.tp))}</span>${s.show||!s.secs?"":`<span class="labtime" id="labtime">${fmtT(s.left)}</span>`}</div>
 <p class="qtext h-vivaq">${E(it.q)}</p>
 ${s.show?`<div class="labpoints">${it.p.map((p,i)=>`<label class="labpoint"><input type="checkbox" data-hvtick="${i}" ${s.tk[i]?"checked":""}><span>${md(p)}</span></label>`).join("")}</div><p class="h-hint">Tick each point you actually said.</p>`:`<p class="h-hint">Answer aloud, in the order you would give it to an examiner: define, classify, then the key facts and your management. Reveal when you have finished.</p>`}</div>
 <div class="qfoot2">${s.show?`<button class="btn primary wide" data-hvnext>${s.i+1<s.q.length?"Next question":"See your score"}</button>`:`<button class="btn primary wide" data-hvshow>Reveal the marking points</button>`}</div>`;
 if(!s.show&&s.secs)startTick(()=>{s.left--;const t=document.getElementById("labtime");if(!t)return;t.textContent=fmtT(Math.max(0,s.left));t.classList.toggle("low",s.left<=15);if(s.left<=0){s.show=true;toast("Time. Reveal and mark");vViva()}})}

/* ======================= SHORT ESSAY ======================= */
let ES=null;
function startEssay(P,S){if(!P.length)return toast("No essays here yet");const done=HS().e;const fresh=P.filter(x=>!done[x.id]);const it=shuffle((fresh.length?fresh:P).slice())[0];
 ES={it,txt:"",secs:(S.t||0)*60,left:(S.t||0)*60,shown:false,tk:{},S};go("hub:essayrun")}
function vEssay(){const s=ES;if(!s)return go("hub:essay");stopLab();const it=s.it;
 if(!s.shown){V().innerHTML=`<div class="qhead"><button class="back" data-hend aria-label="End"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button><span class="eyebrow h-grow">Short essay · ${E(tname(it.tp))}</span>${s.secs?`<span class="labtime" id="labtime">${fmtT(s.left)}</span>`:""}</div>
  <div class="qstage"><p class="qtext">${E(it.q)}</p><textarea id="hessay" class="h-essay" placeholder="Plan in headings: definition, aetiology, features, investigation, management, complications. Then write." aria-label="Your answer">${E(s.txt)}</textarea><small class="h-wc" id="hwc">${wc(s.txt)} words</small></div>
  <div class="qfoot2"><button class="btn primary wide" data-hemark>Finish and mark</button></div>`;
  if(s.secs)startTick(()=>{s.left--;const t=document.getElementById("labtime");if(!t)return;t.textContent=fmtT(Math.max(0,s.left));t.classList.toggle("low",s.left<=60);if(s.left<=0){const a=document.getElementById("hessay");if(a)s.txt=a.value;markEssay();toast("Time. Pens down")}});return}
 const got=it.p.filter((_,i)=>s.tk[i]).length,mark=Math.round(10*got/it.p.length*2)/2;
 V().innerHTML=`<div class="hero"><span class="eyebrow">Short essay · ${E(tname(it.tp))}</span><h1 class="h-mark">${mark}<small>/10</small></h1><p class="lede">${got} of ${it.p.length} marking points. Points your answer seems to mention are ticked for you; adjust them honestly.</p></div>
 <div class="qstage"><p class="qtext">${E(it.q)}</p><div class="labpoints">${it.p.map((p,i)=>`<label class="labpoint"><input type="checkbox" data-hetick="${i}" ${s.tk[i]?"checked":""}><span>${md(p)}</span></label>`).join("")}</div>
 <details class="h-your"><summary>Your answer · ${wc(s.txt)} words</summary><div>${s.txt?E(s.txt).replace(/\n/g,"<br>"):"<i>No answer written.</i>"}</div></details>
 <div><button class="linkbtn" data-go="cl:t-${it.tp}">Read the article</button></div></div>
 <div class="qfoot2"><button class="btn primary wide" data-henext>Save and try another</button></div>`}
const wc=t=>(String(t).trim().match(/\S+/g)||[]).length;
function markEssay(){const s=ES;stopLab();s.shown=true;s.tk={};s.it.p.forEach((p,i)=>{const k=keyHits(p,s.txt);if(k.tot&&k.hit/k.tot>=.5)s.tk[i]=true});vEssay();window.scrollTo(0,0)}

/* ======================= CASES ======================= */
let CS=null;
function startCase(P,S){if(!P.length)return toast("No cases here yet");CS={c:shuffle(P.slice()).slice(0,S.n||1),ci:0,qi:0,ans:{},title:scopeName(S.s)};go("hub:caserun")}
function vCase(){const s=CS;if(!s)return go("hub:case");const c=s.c[s.ci];
 if(!c){const all=s.c.flatMap(c=>c.q.map(q=>[q,s.ans[q.id]===q.c])),sc=all.filter(x=>x[1]).length;
  V().innerHTML=`${labResult("Cases · "+s.title,sc,all.length,`${s.c.length} case${s.c.length>1?"s":""}, ${all.length} questions.`)}${byTopic(all).length>1?`<section class="h-sec"><div class="h-sech"><h2>By topic</h2></div>${byTopic(all).map(([k,a])=>bar(kname(k),a[0],a[1],`data-go="cl:t-${k.slice(2)}"`)).join("")}</section>`:""}<div class="qfoot2"><button class="btn primary wide" data-go="hub:case">More cases</button></div>`;return}
 const tot=s.c.reduce((a,x)=>a+x.q.length,0),pos=s.c.slice(0,s.ci).reduce((a,x)=>a+x.q.length,0)+s.qi;
 const shown=c.q.slice(0,s.qi+1);const q=c.q[s.qi],a=s.ans[q.id],done=a!=null;
 if(!q.order)c.q.forEach(x=>x.order=shuffle(x.o.map((_,i)=>i)));
 V().innerHTML=`${qhead(pos,tot)}<div class="qstage"><article class="h-case"><span class="eyebrow">Case ${s.ci+1}${s.c.length>1?` of ${s.c.length}`:""}${c.t?` · ${E(c.t)}`:""}</span><p>${md(c.s)}</p></article>
 ${shown.slice(0,-1).map((x,j)=>`<div class="h-caseq done"><span class="h-qn">${j+1}</span><div><p>${E(x.q)}</p><p class="${s.ans[x.id]===x.c?"ok":"bad"}">${E(x.o[x.c])}</p></div></div>`).join("")}
 <div class="h-caseq"><span class="h-qn">${s.qi+1}</span><p class="qtext">${E(q.q)}</p></div>
 <div class="qopts">${q.order.map((k,j)=>`<button class="qopt ${done?(k===q.c?"ok":k===a?"bad":"mute"):""}" data-hcase="${k}" ${done?"disabled":""}><span class="ql">${"ABCDEF"[j]}</span><span class="qo">${E(q.o[k])}</span></button>`).join("")}</div>
 ${done&&q.x?`<div class="qexp"><span class="verdict ${a===q.c?"good":"poor"}">${a===q.c?"Correct":"Not quite"}</span><p>${md(q.x)}</p></div>`:""}</div>
 ${done?`<div class="qfoot2"><button class="btn primary wide" data-hcnext>${s.qi+1<c.q.length?"Next question":s.ci+1<s.c.length?"Next case":"See results"}</button></div>`:""}`}

/* ======================= PICTURE QUESTIONS ======================= */
let PQ=null;
const firstSent=t=>{t=String(t).replace(/^First,\s*/i,"");const m=t.match(/^(.+?[.!?])(\s|$)/);t=m?m[1]:t;t=t.replace(/[.]$/,"");return t.charAt(0).toUpperCase()+t.slice(1)};
async function startPic(S){toast("Choosing pictures…");if(S.s!=="anat")await needFigs();
 const out=[];
 if(S.s!=="anat"&&window.CLART_FIGS){const g=S.s.startsWith("g:")?S.s.slice(2):"";
  const F=CLART_FIGS.filter(f=>((f.f&&f.f.length===1)||(f.k&&f.k.length===1))&&f.t&&!/^First,/i.test(f.t)&&(!g||tgroup(f.a)===g));
  shuffle(F.slice()).forEach(f=>{const cap=firstSent(f.t);if(cap.length<14||cap.length>150)return;
   const others=shuffle(F.filter(o=>o.a!==f.a&&tgroup(o.a)===tgroup(f.a))).map(o=>firstSent(o.t)).filter((x,i,a)=>x!==cap&&x.length<=150&&a.indexOf(x)===i).slice(0,3);if(others.length<3)return;
   out.push({src:f.f?"clinic/fig/"+f.f[0]+".jpg":figSrc(f.k[0]),o:[cap,...others],c:0,cap:f.t,cite:f.c,go:"cl:t-"+f.a+"~f"+f.n,gol:"Open it in "+tname(f.a),tag:tname(f.a)})})}
 if(S.s==="all"||S.s==="anat"){const K=ALLFIGS.filter(k=>!k.startsWith("m/")&&FIG[k][3]&&RMAP[FIG[k][3]]);
  shuffle(K.slice()).slice(0,200).forEach(k=>{const cap=FIG[k][0];const others=shuffle(K.filter(o=>o!==k&&FIG[o][3]===FIG[k][3]&&FIG[o][0]!==cap)).map(o=>FIG[o][0]).filter((x,i,a)=>a.indexOf(x)===i).slice(0,3);if(others.length<3)return;
   out.push({src:figSrc(k),o:[cap,...others],c:0,cap,cite:typeof figCite==="function"?figCite(k):"",fig:k,tag:RMAP[FIG[k][3]].name})})}
 const qs=shuffle(out).slice(0,S.n).map(q=>({...q,order:shuffle(q.o.map((_,i)=>i))}));if(!qs.length)return toast("No pictures to use here yet");
 PQ={q:qs,i:0,ans:[],title:S.s==="all"?"Everything":S.s==="anat"?"Anatomy atlas":S.s==="clin"?"Clinical articles":scopeName(S.s)};go("hub:picrun")}
function vPic(){const s=PQ;if(!s)return go("hub:pic");const q=s.q[s.i];
 if(!q){const sc=s.q.filter((q,i)=>s.ans[i]===q.c).length;if(!s.saved){s.saved=1;studied()}V().innerHTML=`${labResult("Pictures · "+s.title,sc,s.q.length,`${Math.round(100*sc/s.q.length)}% recognised.`)}<div class="qfoot2"><button class="btn primary wide" data-go="hub:pic">More pictures</button></div>`;return}
 const a=s.ans[s.i],done=a!=null;
 V().innerHTML=`${qhead(s.i,s.q.length)}<div class="qstage enter"><span class="eyebrow">What does this show?${done?` · ${E(q.tag)}`:""}</span><figure class="h-pic"><img src="${E(q.src)}" alt="Figure to identify" decoding="async"></figure>
 <div class="qopts">${q.order.map((k,j)=>`<button class="qopt ${done?(k===q.c?"ok":k===a?"bad":"mute"):""}" data-hpic="${k}" ${done?"disabled":""}><span class="ql">${"ABCDEF"[j]}</span><span class="qo">${E(q.o[k])}</span></button>`).join("")}</div>
 ${done?`<div class="qexp"><span class="verdict ${a===q.c?"good":"poor"}">${a===q.c?"Correct":"Not quite"}</span><p>${E(q.cap)}${q.cite?` <small class="h-cite">${E(q.cite)}</small>`:""}</p><div>${q.go?`<button class="linkbtn" data-go="${E(q.go)}">${E(q.gol)}</button>`:q.fig?`<button class="linkbtn" data-fig="${E(q.fig)}">Open the full figure</button>`:""}</div></div>`:""}</div>
 ${done?`<div class="qfoot2"><button class="btn primary wide" data-hpnext>${s.i+1<s.q.length?"Next picture":"See results"}</button></div>`:""}`}

/* ======================= RESULTS BY TOPIC ======================= */
function vRes(){const h=HS().tq;const rows=Object.entries(h).map(([k,a])=>({k,s:a[0],n:a[1],p:a[0]/a[1]}));
 const grp=k=>k.startsWith("r:")?"Anatomy":(GN[tgroup(k.slice(2))]||"Clinical");
 const G={};rows.forEach(r=>(G[grp(r.k)]=G[grp(r.k)]||[]).push(r));
 const ks=["Anatomy",...GK.map(g=>GN[g]),"Clinical"].filter(g=>G[g]);
 const tot=rows.reduce((a,r)=>[a[0]+r.s,a[1]+r.n],[0,0]);
 V().innerHTML=`<div class="hero"><span class="eyebrow"><button class="linkbtn h-up" data-go="study">Practise</button></span><h1>Results by topic</h1><p class="lede">${tot[1]?`${tot[1]} answers across ${rows.length} topics, ${Math.round(100*tot[0]/tot[1])}% correct. Weakest first; tap a topic for ten fresh questions.`:"Nothing yet. Every question you answer in the question bank, the cases and the timed papers is counted here by topic."}</p></div>
 ${ks.map(g=>`<section class="h-sec"><div class="h-sech"><h2>${E(g)}</h2><small>${G[g].length} topic${G[g].length>1?"s":""}</small></div>${G[g].sort((a,b)=>a.p-b.p||b.n-a.n).map(r=>bar(kname(r.k),r.s,r.n,`data-hweak="${E(r.k)}"`)).join("")}</section>`).join("")}
 ${tot[1]?"":`<div class="qfoot2"><button class="btn primary wide" data-go="hub:mcq">Open the question bank</button></div>`}`}

/* ======================= ARTICLE PANEL ======================= */
window.hubPrac=function(id){const B=QB[id]||{},nq=QUIZ.filter(q=>q.tp===id).length,nc=CARDS.filter(c=>c.tp===id).length,nv=(B.v||[]).length,ne=(B.e||[]).length,nk=(B.k||[]).length;
 const b=(a,i,t,s)=>`<button class="h-pb" ${a}><span class="h-ico">${ic(i,18)}</span><b>${E(t)}</b><small>${E(s)}</small></button>`;
 const L=[nq&&b(`data-htopic="${id}"`,"quiz","Test me on this",`${nq} question${nq>1?"s":""}`),nk&&b(`data-hgo="case|t:${id}"`,"kase","Clinical case",`${nk} case${nk>1?"s":""}`),nv&&b(`data-hgo="viva|t:${id}"`,"viva","Viva questions",`${nv} with marking points`),ne&&b(`data-hgo="essay|t:${id}"`,"essay","Short essay",`${ne} question${ne>1?"s":""}`),nc&&b(`data-hdeck="${id}"`,"study","Flashcards",`${nc} card${nc>1?"s":""}`)].filter(Boolean);
 return L.length?`<div class="h-prac">${L.join("")}</div>`:""};

/* ======================= ROUTES & EVENTS ======================= */
Object.assign(EXTRA,{hub:function(arg){const a=arg||"";
 if(MODES[a])return vSetup(a);if(a==="run")return vRun();if(a==="vivarun")return vViva();if(a==="essayrun")return vEssay();if(a==="caserun")return vCase();if(a==="picrun")return vPic();if(a==="res")return vRes();return vHub()}});
TABOF.hub="study";
document.addEventListener("click",e=>{const T=x=>e.target.closest(x);let b;
 if(b=T("[data-hplan]")){e.preventDefault();doPlan(b.dataset.hplan);return}
 if(b=T("[data-hweak]")){e.preventDefault();weakRun(b.dataset.hweak);return}
 if(b=T("[data-htab]")){HS().tab=b.dataset.htab;save();vHub();return}
 if(b=T("[data-hs]")){const [m,k,v]=b.dataset.hs.split("|");const S=set(m,DEF[m]);S[k]=/^\d+$/.test(v)?+v:v;save();const y=scrollY;vSetup(m);scrollTo(0,y);return}
 if(b=T("[data-hstart]")){startMode(b.dataset.hstart);return}
 if(b=T("[data-hgo]")){const [m,s]=b.dataset.hgo.split("|");const S=Object.assign({},set(m,DEF[m]),{s});startMode0(m,S);return}
 if(b=T("[data-htopic]")){const id=b.dataset.htopic;startRun(QUIZ.filter(q=>q.tp===id),tname(id));return}
 if(b=T("[data-hdeck]")){const id=b.dataset.hdeck,q=shuffle(CARDS.filter(c=>c.tp===id));if(!q.length)return;FC={r:"cl-"+tgroup(id),mode:"all",q,i:0,flip:false,seen:0};go("cards");return}
 if(b=T("[data-hend]")){stopLab();go("study");return}
 if(b=T("[data-hvod]")){const s=b.closest(".h-vod"),a=s.querySelector(".h-vans");a.hidden=!a.hidden;b.textContent=a.hidden?"Show the model answer":"Hide the answer";return}
 if(b=T("[data-hagain]")){if(RUN&&RUN.again)RUN.again();return}
 if(RUN&&(b=T("[data-hrun]"))){const q=RUN.qs[RUN.i];if(RUN.ans[RUN.i]!=null)return;RUN.ans[RUN.i]=+b.dataset.hrun;const ok=RUN.ans[RUN.i]===q.c;rec(q,ok);seen(q);save();vRun();return}
 if(RUN&&T("[data-hrunnext]")){RUN.i++;vRun();scrollTo(0,0);return}
 if(VV&&T("[data-hvshow]")){VV.show=true;stopLab();vViva();return}
 if(VV&&(b=T("[data-hvtick]"))){VV.tk[+b.dataset.hvtick]=b.checked;return}
 if(VV&&T("[data-hvnext]")){const it=VV.q[VV.i],got=it.p.filter((_,i)=>VV.tk[i]).length;VV.res.push({it,s:got,n:it.p.length,tk:VV.tk});HS().v[it.id]={s:got,n:it.p.length,t:Date.now()};studied();save();VV.i++;VV.show=false;VV.tk={};VV.left=VV.secs;vViva();scrollTo(0,0);return}
 if(ES&&T("[data-hemark]")){const a=document.getElementById("hessay");if(a)ES.txt=a.value;markEssay();return}
 if(ES&&(b=T("[data-hetick]"))){ES.tk[+b.dataset.hetick]=b.checked;const got=ES.it.p.filter((_,i)=>ES.tk[i]).length,m=document.querySelector(".h-mark");if(m)m.innerHTML=`${Math.round(10*got/ES.it.p.length*2)/2}<small>/10</small>`;return}
 if(ES&&T("[data-henext]")){const it=ES.it,got=it.p.filter((_,i)=>ES.tk[i]).length;HS().e[it.id]={s:got,n:it.p.length,t:Date.now()};studied();save();startEssay(pool("essay",ES.S),ES.S);return}
 if(CS&&(b=T("[data-hcase]"))){const c=CS.c[CS.ci],q=c.q[CS.qi];if(CS.ans[q.id]!=null)return;CS.ans[q.id]=+b.dataset.hcase;rec(q,CS.ans[q.id]===q.c);save();vCase();return}
 if(CS&&T("[data-hcnext]")){const c=CS.c[CS.ci];if(CS.qi+1<c.q.length)CS.qi++;else{HS().k[c.id]={s:c.q.filter(q=>CS.ans[q.id]===q.c).length,n:c.q.length,t:Date.now()};studied();save();CS.ci++;CS.qi=0;scrollTo(0,0)}vCase();return}
 if(PQ&&(b=T("[data-hpic]"))){if(PQ.ans[PQ.i]!=null)return;PQ.ans[PQ.i]=+b.dataset.hpic;vPic();return}
 if(PQ&&T("[data-hpnext]")){PQ.i++;vPic();scrollTo(0,0);return}
},true);
function startMode0(m,S){if(m==="viva")return startViva(pool(m,S),Object.assign({},S,{n:99}));if(m==="essay")return startEssay(pool(m,S),S);if(m==="case")return startCase(pool(m,S),Object.assign({},S,{n:99}))}
function seen(q){const h=ST.hub;h.seen=h.seen||[];if(!h.seen.includes(q.id)){h.seen.push(q.id);if(h.seen.length>4000)h.seen=h.seen.slice(-4000)}}
document.addEventListener("input",e=>{if(e.target.id==="hessay"&&ES){ES.txt=e.target.value;const w=document.getElementById("hwc");if(w)w.textContent=wc(ES.txt)+" words"}});
document.addEventListener("change",e=>{if(e.target.id==="hexam"){HS().exam=e.target.value||"";save();vHub()}});
/* questions answered in the older engines count towards results by topic too */
document.addEventListener("click",e=>{const o=e.target.closest("[data-opt]");if(o&&typeof QZ!=="undefined"&&QZ&&QZ.ans[QZ.i]==null){const q=QZ.qs[QZ.i];if(q)rec(q,+o.dataset.opt===q.c)}
 const t=e.target.closest("[data-labtf]");if(t&&LAB.s&&LAB.s.a==null){const q=LAB.s.q[LAB.s.i];if(q)HUBREC(q,(t.dataset.labtf==="1")===q.truth)}},true);
function HUBREC(q,ok){const h=HS(),k=qkey(q),a=h.tq[k]=h.tq[k]||[0,0,0];a[1]++;if(ok)a[0]++;a[2]=Date.now()}
const _fm=finishMock;finishMock=function(){const s=LAB.s,was=s&&s.saved;_fm.apply(this,arguments);if(s&&!was&&s.saved){s.q.forEach((q,i)=>HUBREC(q,s.ans[i]===q.c));save()}};
/* the article "Quiz this topic" button runs in the new engine */
document.addEventListener("click",e=>{const b=e.target.closest("[data-cltq]");if(b){e.preventDefault();e.stopImmediatePropagation();const id=b.dataset.cltq;startRun(QUIZ.filter(q=>q.tp===id),tname(id))}},true);
if(typeof cur!=="undefined"&&cur==="home")vToday();
})();
