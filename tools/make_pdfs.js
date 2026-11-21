/* Clinical and imaging PDF volumes, rendered from the app itself.
   usage: node tools/make_pdfs.js [volume ids...]   (uses a server on :8765 if one is running, otherwise reads www/ from disk)
   Output: app/src/main/assets/www/pdf/<id>.pdf */
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const WWW=path.join(__dirname,'../app/src/main/assets/www'),OUT=path.join(WWW,'pdf');
const APL="hl ap_otorr otalgia ap_full tinnitus ap_dizzy ap_face ap_block ap_rhin epistaxis ap_pnd ap_pain ap_smell ap_crust ap_epiph ap_sore ap_ulcer osa ap_hoarse ap_dysph ap_globus stridor neckmass ap_saliv".split(" ");
const D=JSON.parse(fs.readFileSync(path.join(WWW,'clinic/data.js'),'utf8').replace(/^window.CLINIC_DATA=/,'').trim().replace(/;$/,''));
const RG={ear:['extear','midear','inner','temporal','facial','et'],nose:['nose','sinus','orbit','itf','trigeminal'],mouth:['oral','pharynx'],larynx:['larynx'],neck:['neck','vessels','thyroid','salivary']};
const LESS={ear:['im_tb','im_iac','im_skb'],nose:['im_sin','im_orb'],mouth:['im_oral'],larynx:['im_lx'],neck:['im_spaces','im_nodes','im_glands']};
const LINKS=JSON.parse(fs.readFileSync(path.join(WWW,'clinic/links.js'),'utf8').replace(/^[\s\S]*?window.CLINIC_LINKS=/,'').trim().replace(/;$/,''));
const IDX=fs.readFileSync(path.join(WWW,'index.html'),'utf8');const ci=IDX.indexOf('const CONDS=');
const CONDS=JSON.parse(IDX.slice(ci+12,IDX.indexOf('\n',ci)).trim().replace(/;$/,''));
const AREAS=[['ear','Ear',['extear','midear','inner','temporal','facial','et']],['nose','Nose, sinuses and orbit',['nose','sinus','orbit']],['mouth','Mouth, throat and salivary glands',['oral','pharynx','salivary']],['neck','Larynx and neck',['larynx','neck','vessels','thyroid']]];
const used=AREAS.flatMap(a=>a[2]);AREAS.push(['face','Face, jaw and skull base',[...new Set(CONDS.map(c=>c.r))].filter(r=>!used.includes(r))]);
const VOL=[...D.t.map(t=>({id:'cl_'+t.id,kind:t.g==='imgl'?'Imaging':t.g==='drug'?'Drugs':'Clinical',title:t.t,single:true,arts:[t.id],ids:t.g==='imgl'?null:((LINKS[t.id]||{}).im||[]).filter(x=>CONDS.some(c=>c.id===x))})),
 ...AREAS.map(a=>({id:'imc_'+a[0],kind:'Imaging',title:'Imaging conditions: '+a[1],sub:'Key facts and case images for the core conditions, then the advanced and rare',conds:a[2]}))];
const PCSS=`
@font-face{font-family:"Newsreader";font-weight:400;font-style:normal;src:local("NewsreaderPDF Regular")}
@font-face{font-family:"Newsreader";font-weight:500;font-style:normal;src:local("NewsreaderPDF Medium")}
@font-face{font-family:"Newsreader";font-weight:600;font-style:normal;src:local("NewsreaderPDF SemiBold")}
@font-face{font-family:"Newsreader";font-weight:700;font-style:normal;src:local("NewsreaderPDF SemiBold")}
@font-face{font-family:"Newsreader";font-weight:400;font-style:italic;src:local("NewsreaderPDF Italic")}
@font-face{font-family:"Newsreader";font-weight:500;font-style:italic;src:local("NewsreaderPDF Medium Italic")}
@font-face{font-family:"Newsreader";font-weight:600;font-style:italic;src:local("NewsreaderPDF Medium Italic")}
@font-face{font-family:"Manrope";font-weight:300;font-style:normal;src:local("ManropePDF Regular")}
@font-face{font-family:"Manrope";font-weight:400;font-style:normal;src:local("ManropePDF Regular")}
@font-face{font-family:"Manrope";font-weight:500;font-style:normal;src:local("ManropePDF Medium")}
@font-face{font-family:"Manrope";font-weight:600;font-style:normal;src:local("ManropePDF SemiBold")}
@font-face{font-family:"Manrope";font-weight:700;font-style:normal;src:local("ManropePDF Bold")}
@font-face{font-family:"Manrope";font-weight:800;font-style:normal;src:local("ManropePDF Bold")}
@page{size:A4}
html,body.pbody{background:#fff!important;color:#1b1d22}
body.pbody{margin:0;padding:0;font-size:10.5pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body.pbody #view,body.pbody main{all:unset}
.pbody *{animation:none!important;transition:none!important}
.pcover{height:255mm;display:flex;flex-direction:column;justify-content:center;padding:0 6mm;break-after:page;border-left:2px solid #b08d57}
.pmark{font:600 9pt var(--f-body);letter-spacing:.32em;color:#b08d57;margin-bottom:22mm}
.pkind{font:600 10pt var(--f-body);letter-spacing:.22em;text-transform:uppercase;color:#6b6f78}
.pcover h1{font:500 40pt/1.05 var(--f-display);letter-spacing:-.02em;margin:4mm 0 5mm;color:#151922}
.psub{font:italic 400 15pt/1.35 var(--f-display);color:#555b66;margin:0 0 12mm;max-width:140mm}
.pdate{font:400 9.5pt var(--f-body);color:#888;letter-spacing:.04em}
.ptoc{break-after:page}
.ptoc h2,.pchead h2{font:500 24pt/1.1 var(--f-display);margin:0 0 6mm}
.ptoc ol{list-style:none;padding:0;margin:0;columns:1}
.ptoc li{display:flex;gap:4mm;padding:2.1mm 0;border-bottom:.3pt solid #ddd;font:400 11.5pt var(--f-display)}
.ptoc li span{font:italic 400 10pt var(--f-display);color:#b08d57;width:8mm}
.ptoc a{color:inherit;text-decoration:none}
.part{break-before:page}
.part .arw{max-width:none!important;padding:0!important;margin:0!important}
.part h1{font:500 26pt/1.08 var(--f-display)!important;margin:2mm 0 4mm!important}
.part .cle{font:600 8pt var(--f-body);letter-spacing:.2em;text-transform:uppercase;color:#b08d57}
.part .armeta{display:none!important}
.part details>summary,.part summary{list-style:none;pointer-events:none}
:where(.part) summary{display:block}
.part details>summary::-webkit-details-marker{display:none}
.part summary :is(svg,.arsi,i){display:none!important}
.part button{all:unset;display:block}
.part button.arx{display:inline;font-weight:600;color:#1F4E6B}
.part figure,.part tr,.part .arglance{break-inside:avoid}
.part .archd,.part .arintro,.part .chead,.part summary{break-after:avoid}
.part .tbl [hidden]{display:block!important}
.part img{max-height:95mm;object-fit:contain}
.part .arch-c{break-before:auto}
.part .archd{break-after:avoid}
.part h2,.part h3,.part summary{break-after:avoid}
.part .clrow svg,.part .clrow i{display:none}
.part .clsrc,body>.clsrc{font-size:8pt;color:#888;margin-top:6mm}
.part .amchb{opacity:1!important;transform:none!important}
.part .amch>summary{position:static!important}
.part .arbox,.part .arcases,.part .arops,.part .cllist{break-inside:avoid}
.part .arbox>h5,.part .arbox>:first-child{break-after:avoid}
.part summary,.part h1,.part h2,.part h3,.part h4,.part h5,.part .archd{break-inside:avoid}
.part .arfig .one{display:flex;justify-content:center}
.part .arfig .one .arimg{display:inline-block}
.part .arfig .pair>*{min-width:0;display:block}
.part img{max-width:100%}
.part .climgs{display:flex!important;flex-wrap:wrap!important;overflow:visible!important;gap:3mm}
.part .artw{overflow:visible!important}
.part .artb{width:100%!important;max-width:100%}
.part .artb th,.part .artb td{overflow-wrap:break-word;min-width:0;white-space:normal!important}
.part .arfig .pair{display:grid!important;grid-template-columns:1fr 1fr!important;gap:3mm}
.part a{color:inherit;text-decoration:none}
.pimgch{break-before:page}
.pchead{margin:0 0 6mm;padding-bottom:4mm;border-bottom:.6pt solid #b08d57;break-after:avoid}
.pchead{break-inside:avoid}
.part+.pimgch{break-before:auto;margin-top:14mm}
.pchead span{font:600 8pt var(--f-body);letter-spacing:.2em;text-transform:uppercase;color:#b08d57}
.pchead p{font:italic 400 11pt/1.45 var(--f-display);color:#555b66;margin:2mm 0 0}
.pcond{break-inside:avoid;padding:5mm 0 4mm;border-bottom:.3pt solid #ddd}
.pck{font:600 7.5pt var(--f-body);letter-spacing:.16em;text-transform:uppercase;color:#8a8f99}
.pcond h3{font:500 15pt/1.2 var(--f-display);margin:1mm 0 2.5mm}
.pkf{display:grid;grid-template-columns:1.2fr 1fr;gap:6mm}
.pkf h4{font:600 7.5pt var(--f-body);letter-spacing:.14em;text-transform:uppercase;color:#b08d57;margin:0 0 1.2mm}
.pkf ul,.pcond>ul{margin:0 0 2.5mm;padding-left:4mm;font-size:9.5pt;line-height:1.42}
.pimgs{display:grid;grid-template-columns:repeat(4,1fr);gap:3mm;margin-top:2mm}
.pk{margin:0}.pk img{width:100%;height:38mm;object-fit:cover;border-radius:2mm;background:#111}
.pk figcaption{font-size:6.8pt;line-height:1.3;color:#555;margin-top:1mm}
.pk{break-inside:avoid}
.pimgs{align-items:start}
.pk cite{display:block;font-style:normal;color:#999;margin-top:.5mm}
.psrc{font-size:7.5pt;color:#999;margin:1.5mm 0 0}
.padv{columns:2;column-gap:8mm}
.padv>div{break-inside:avoid;padding:2mm 0;border-bottom:.3pt solid #e4e4e4;font-size:9pt}
.padv b{font:500 11pt var(--f-display);display:block}.padv small{color:#999;font-size:7.5pt}.padv p{margin:1mm 0 0;color:#444;font-size:8.5pt}
`;

// ---- keep-with-next helpers -------------------------------------------------
let PDFJS=null;
async function loadPdfjs(){try{PDFJS=await import(require('url').pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href)}catch(e){console.log('(pdfjs-dist not installed: headings left at page feet are not corrected)')}}
const nrm=s=>(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
// tag every heading-like element; data-kb marks the box that should move with it
async function markHeads(p){await p.evaluate(()=>{const out=[];let k=0;const pageH=1001;// A4 content height at 96 dpi
 const top0=document.body.getBoundingClientRect().top;
 for(const e of document.querySelectorAll('.part *, .pimgch *')){const t=(e.innerText||'').trim();if(!t||t.length>90||e.querySelector('img,figure,table,ul,ol,p'))continue;
  const s=getComputedStyle(e);if(!/block|flex|grid|table-header-group|table-row|list-item/.test(s.display))continue;
  const fs=parseFloat(s.fontSize),fw=+s.fontWeight;const head=/^H[1-6]$/.test(e.tagName)||e.tagName==='SUMMARY'||e.tagName==='THEAD'||e.tagName==='CAPTION'||(fs>=17&&fw>=500)||(s.textTransform==='uppercase'&&fw>=600)||(e.tagName==='B'&&e.parentElement.firstElementChild===e&&e.nextElementSibling);
  if(!head)continue;
  // climb to the box that starts with this heading (a callout, a table, a step, a chapter header)
  let b=e.closest('table')?(e.closest('.tbl')||e.closest('table')):(e.closest('.archd,.chead,summary,.pchead')||e);while(b.parentElement&&!b.parentElement.matches('.part,.arw,body,.amchb,.arbody')){const prev=[...b.parentElement.children].slice(0,[...b.parentElement.children].indexOf(b));
   if(prev.every(x=>(x.innerText||'').trim().length<=3&&!x.querySelector('img')))b=b.parentElement;else break}
  if(!b.dataset.kb)b.dataset.kb=++k;const fsx=[e,...e.querySelectorAll('*')].filter(x=>[...x.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).map(x=>parseFloat(getComputedStyle(x).fontSize));
  out.push({k:+b.dataset.kb,t:nrm(t),fs:Math.max(...(fsx.length?fsx:[fs]))*0.75,pg:Math.floor((e.getBoundingClientRect().top-top0)/pageH)})}
 window.__KN=out;function nrm(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'')}})}
async function stranded(buf,cands){const doc=await PDFJS.getDocument({data:new Uint8Array(buf),disableFontFace:true,verbosity:0}).promise;const fix=[];
 const strip=t=>t.replace(/^[0-9]+/,'');const by=new Map();for(const c of cands){const t=strip(c.t);if(t.length>=3)(by.get(t)||by.set(t,[]).get(t)).push(c)}// DOM order
 // every body line of the document, top to bottom, as plain letters and digits
 const P=[],Wd=[],Fs=[],Ys=[];for(let n=1;n<=doc.numPages;n++){const pg=await doc.getPage(n),H=pg.view[3],tc=await pg.getTextContent();const lines=new Map();
  for(const it of tc.items){const y=it.transform[5];if(!it.str.trim()||y<46||y>H-46)continue;const key=Math.round(y/2.5);(lines.get(key)||lines.set(key,[]).get(key)).push(it)}
  const ks=[...lines.keys()].sort((a,b)=>b-a);
  P.push(ks.map(k=>strip(nrm(lines.get(k).sort((a,b)=>a.transform[4]-b.transform[4]).map(i=>i.str).join('')))));
  Ys.push(ks.map(k=>Math.min(...lines.get(k).map(i=>i.transform[5]))));
  Fs.push(ks.map(k=>lines.get(k).map(i=>Math.hypot(i.transform[2],i.transform[3]))));   // every type size on the line
  Wd.push(ks.map(k=>{const its=lines.get(k);return Math.max(...its.map(i=>i.transform[4]+i.width))-Math.min(...its.map(i=>i.transform[4]))}))}
 const flat=[];P.forEach((ls,pi)=>ls.forEach((t,li)=>flat.push({pi,li,t,fs:Fs[pi][li]})));
 // the k-th line reading o in the document is the k-th heading with that text in the page's DOM order
 const occ=(o,pi,li,fs)=>{let c=0;for(let j=0;j<flat.length;j++){const f=flat[j];if(f.pi>pi||(f.pi===pi&&f.li>=li))break;if(!f.fs.some(z=>Math.abs(z-fs)<0.8))continue;const nx=flat[j+1];if(f.t===o||(nx&&nx.pi===f.pi&&strip(f.t+nx.t)===o))c++}return c};
 for(let pi=0;pi<P.length-1;pi++){const ls=P[pi];let top=null;
  for(let i=ls.length-1,wide=0;i>=Math.max(0,ls.length-4);i--){
   // only the foot of the page counts (lowest ~5 cm), unless the page ends in empty space because what follows did not fit
   if(Ys[pi][i]>46+150&&Ys[pi][ls.length-1]<46+120)break;
   const tries=[[ls[i],i]];if(i>0)tries.push([strip(ls[i-1]+ls[i]),i-1]);
   // same words in the same type size: a body line that happens to repeat a heading's words does not count
   for(const [o,at] of tries){const cs=(by.get(o)||[]).filter(c=>Fs[pi][at].some(z=>Math.abs(c.fs-z)<0.8));if(cs.length){top=cs[Math.min(occ(o,pi,at,cs[0].fs),cs.length-1)];break}}
   if(Wd[pi][i]>230&&++wide>=2||ls.length-i>3)break;    // two full-width lines (over ~45% of the column) under a heading are enough: stop climbing
  }
  if(top){fix.push({k:top.k,t:top.t});break}}            // one at a time: everything after it moves, so look again
 return [...new Map(fix.map(x=>[x.k,x])).values()]}
const want=process.argv.slice(2),failed=[];
(async()=>{await loadPdfjs();const b=await chromium.launch();const p=await b.newPage({viewport:{width:820,height:1100}});
 p.on('pageerror',e=>console.log('pageerror',e.message));
 // No server on :8765? Serve the app straight from disk through the browser's request routing.
 const up=await new Promise(r=>require('http').get('http://localhost:8765/',x=>{x.resume();r(true)}).on('error',()=>r(false)));
 if(!up){const MT={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.wasm':'application/wasm','.pdf':'application/pdf'};
  await p.route('http://localhost:8765/**',rt=>{let u=decodeURIComponent(new URL(rt.request().url()).pathname);if(u.endsWith('/'))u+='index.html';const f=path.join(WWW,path.normalize(u).replace(/^([.][.][\/\\])+/,''));
   if(!f.startsWith(WWW)||!fs.existsSync(f)||fs.statSync(f).isDirectory())return rt.fulfill({status:404,body:''});
   rt.fulfill({status:200,contentType:MT[path.extname(f).toLowerCase()]||'application/octet-stream',body:fs.readFileSync(f)})});
  console.log('(no server on :8765: serving',WWW,'from disk)')}
 for(const V of VOL.filter(v=>!want.length||want.includes(v.id))){
  await p.goto('http://localhost:8765/');await p.waitForTimeout(1200);
  await p.evaluate(()=>new Promise(r=>{go('cl:home');setTimeout(r,1200)}));
  const arts=[];
  for(const id of (V.arts||[])){
   await p.evaluate(id=>go('cl:t-'+id),id);
   const ok=await p.waitForFunction(()=>document.querySelector('#view .arart'),null,{timeout:20000}).then(()=>true,()=>false);
   if(!ok){console.log('ERROR: article did not open, PDF not written:',id);failed.push(id);continue}
   await p.waitForTimeout(250);
   arts.push(await p.evaluate(id=>{const w=document.querySelector('#view .arw').cloneNode(true);
     w.querySelectorAll('.artoc,.arcont,.clprac,.h-prac,.arbar,.arnav,.arprog,[data-arall],.arsubtools,.starbtn,.arstar').forEach(x=>x.remove());
     // AMBOSS-layout articles (Nov 2026): floating tools, find bar, outline sheet and the board/map buttons are app controls, not content
     w.querySelectorAll('.amtool,.amfind,.amout,.amsheet,.arboardbtn,.armapbtn,[data-amt]').forEach(x=>x.remove());
     const end=w.querySelector('.arend')||w.querySelector('#a-end');if(end){const src=end.querySelector('.clsrc');end.replaceWith(...(src?[src]:[]))}
     w.querySelectorAll('details').forEach(d=>d.setAttribute('open',''));
     // Chromium ignores forced page breaks inside <details>, so print them as plain blocks (classes and [open] kept, so the styles still match)
     [...w.querySelectorAll('details')].reverse().forEach(d=>{const n=document.createElement('div');for(const a of d.attributes)n.setAttribute(a.name,a.value);n.append(...d.childNodes);d.replaceWith(n)});
     w.querySelectorAll('.coll').forEach(x=>{x.classList.remove('coll');x.removeAttribute('data-coll')});w.querySelectorAll('[aria-expanded]').forEach(x=>x.setAttribute('aria-expanded','true'));w.querySelectorAll('.chead').forEach(h=>[...h.children].forEach(c=>{if(!/^H[1-6]$/.test(c.tagName))c.remove()}));w.querySelectorAll('.texp').forEach(x=>x.remove());
     w.querySelectorAll('img').forEach(i=>{i.removeAttribute('loading');if(i.dataset.src)i.src=i.dataset.src;i.src=i.src});
     w.querySelectorAll('[id]').forEach(e=>e.id=id+'-'+e.id);
     const h=w.querySelector('h1');return {id,t:h?h.textContent:id,html:w.outerHTML}},id));
  }
  if(V.arts&&arts.length<V.arts.length)continue;        // an article failed to open: keep the old PDF
  // imaging key facts
  let conds='';
  if(V.conds||(V.ids&&V.ids.length)){conds=await p.evaluate(([rg,all,les,ids])=>{const L=ids?ids.map(x=>CONDS.find(c=>c.id===x)).filter(Boolean):CONDS.filter(c=>rg.includes(c.r));all=!ids;const core=ids?L:L.filter(c=>c.core),adv=ids?[]:L.filter(c=>!c.core);
    const img=k=>{const v=IMG[k];return v?`<figure class="pk"><img src="${imSrc(k)}"><figcaption>${esc(v[3]||"")}<cite>${esc(SRC[v[4]]||"")}${v[5]?", "+esc(v[5]):""}</cite></figcaption></figure>`:""};
    const pick=c=>{const o=c.imgs.filter(k=>!k.startsWith('dk')&&IMG[k]&&IMG[k][2]!=="Diagram").slice(0,1),d=c.imgs.filter(k=>k.startsWith('dk')&&IMG[k][2]!=="Diagram").slice(0,all?3:1);return o.concat(d)};
    const card=c=>`<section class="pcond"><div class="pck">${esc((RMAP[c.r]||{}).name||"")} · ${esc(c.cat)}</div><h3>${esc(c.t)}</h3>
      ${c.kf?`<div class="pkf"><div><h4>Imaging findings</h4><ul>${c.kf.see.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div><div><h4>Top differentials</h4><ul>${c.kf.dd.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><h4>Checklist</h4><ul>${c.kf.chk.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div></div>`:(c.pts&&c.pts.length?`<ul>${c.pts.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:"")}
      <div class="pimgs">${pick(c).map(img).join("")}</div>${c.kf&&c.kf.pg?`<p class="psrc">Key facts after Koch, Hamilton, Hudgins and Harnsberger, Diagnostic Imaging: Head and Neck, 3rd ed., p. ${c.kf.pg}.</p>`:""}</section>`;
    const lesT=(les||[]).map(id=>ILES.find(x=>x[0]===id)).filter(Boolean);
    return `<section class="pimgch" id="imaging"><div class="pchead"><span>Imaging</span><h2>${all?"Core conditions":"On imaging"}</h2>
      <p>${all?"The common conditions every resident should recognise, each with its key imaging findings, top differentials, a short checklist and representative scans.":"The imaging of this topic: key findings, differentials and representative scans."+(lesT.length?` For the normal anatomy and a search pattern, see ${lesT.map(x=>`Lesson ${x[1]}, <i>${esc(x[3])}</i>`).join("; ")}.`:"")}</p></div>
      ${core.map(card).join("")}
      ${all&&adv.length?`<div class="pchead"><span>Imaging</span><h2>Advanced and rare</h2><p>Once the core is secure. Each has its full set of images in the app.</p></div><div class="padv">${adv.map(c=>`<div><b>${esc(c.t)}</b><small>${esc((RMAP[c.r]||{}).name||"")} · ${esc(c.cat)}</small>${c.pts&&c.pts.length?`<p>${esc(c.pts.join(" · "))}</p>`:""}</div>`).join("")}</div>`:""}</section>`},[V.conds||[],!V.ids,V.les||null,V.ids||null]);}
  const date=new Date().toLocaleDateString('en-GB',{month:'long',year:'numeric'});
  await p.evaluate(({V,arts,conds,date,PCSS})=>{
   document.querySelectorAll('#tabs,#side,header,.topbar,.dock,#toast').forEach(x=>x&&x.remove());
   const toc=arts.map((a,i)=>`<li><span>${String(i+1).padStart(2,"0")}</span><a href="#a-${a.id}">${a.t}</a></li>`).join("")+(conds?`<li><span>${V.kind==="Imaging"?"":"·"}</span><a href="#imaging">${V.kind==="Imaging"?"Core conditions":"Imaging for this region"}</a></li>`:"");
   document.querySelectorAll('link[href*="fonts.googleapis"],link[href*="fonts.gstatic"]').forEach(l=>l.remove());for(const f of [...document.fonts])if(/Newsreader|Manrope/.test(f.family))document.fonts.delete(f);document.body.className='pbody';
   document.body.innerHTML=V.single?`${arts.map(a=>`<div class="part" id="a-${a.id}">${a.html}</div>`).join("")}${conds}`:`<div class="pcover"><div class="pmark">THE ENT COMPANION</div><div class="pkind">${V.kind}</div><h1>${V.title}</h1>${V.sub?`<p class="psub">${V.sub}</p>`:""}<p class="pdate">${arts.length?arts.length+" "+(V.kind==="Imaging"?"lessons":"articles"):""}${conds&&arts.length?" · imaging key facts":""} · ${date}</p></div>
    ${arts.length>1?`<div class="ptoc"><h2>Contents</h2><ol>${toc}</ol></div>`:""}
    ${arts.map(a=>`<div class="part" id="a-${a.id}">${a.html}</div>`).join("")}${conds}`;
   // the article's source note would otherwise sit between the article and its imaging section: put it at the very end
   if(V.single&&document.querySelector('.pimgch'))document.querySelectorAll('.part .clsrc').forEach(c=>document.body.appendChild(c));
   const st=document.createElement('style');st.textContent=PCSS;document.head.appendChild(st);
   document.documentElement.setAttribute('data-theme','light');
   // anything fixed or sticky prints on every page over the text: make it flow normally
   for(const e of document.body.querySelectorAll('*')){const ps=getComputedStyle(e).position;if(ps==='fixed'||ps==='sticky')e.style.setProperty('position','static','important')}
  },{V,arts,conds,date,PCSS}).catch(e=>console.log(e));
  await p.evaluate(()=>document.fonts.ready);
  await p.evaluate(()=>Promise.all([...document.images].map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r}))));
  await p.waitForTimeout(500);
  // layout check at the printed width (A4 minus 15 mm margins = 180 mm): report anything wider than the page or clipped
  await p.setViewportSize({width:680,height:1100});await p.emulateMedia({media:'print'});await p.waitForTimeout(150);
  const wide=await p.evaluate(()=>{const W=document.body.getBoundingClientRect().right+2,o=[];
   // text that the PDF would not show: clamped, faded out, or cut off by a clipping box
   const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let t;
   while((t=tw.nextNode())){if(!t.textContent.trim())continue;const el=t.parentElement,rg=document.createRange();rg.selectNodeContents(t);const tr=rg.getBoundingClientRect();if(!tr.width)continue;
    for(let a=el;a&&a!==document.body;a=a.parentElement){const s=getComputedStyle(a);
     if(s.webkitLineClamp&&s.webkitLineClamp!=='none'){o.push('clamped: '+t.textContent.trim().slice(0,50));break}
     if(+s.opacity<0.3||s.visibility==='hidden'){o.push('invisible: '+t.textContent.trim().slice(0,50));break}
     if(s.overflow!=='visible'||s.overflowX!=='visible'||s.overflowY!=='visible'){const ar=a.getBoundingClientRect();if(tr.bottom>ar.bottom+2||tr.right>ar.right+2||tr.top<ar.top-2){o.push('cut off: '+t.textContent.trim().slice(0,50));break}}}}
   for(const e of document.querySelectorAll('.part *, .pimgch *')){const r=e.getBoundingClientRect();if(!r.width)continue;const s=getComputedStyle(e);
    if(r.right>W)o.push('wider than page: '+e.tagName+'.'+[...e.classList].join('.')+' ('+Math.round(r.right-W)+'px) '+e.textContent.trim().slice(0,40));
    else if(s.overflowX!=='visible'&&e.scrollWidth>e.clientWidth+2)o.push('clipped: '+e.tagName+'.'+[...e.classList].join('.')+' '+e.textContent.trim().slice(0,40))}
   return [...new Set(o)].slice(0,12)});
  wide.forEach(w=>console.log('  layout',V.id,w));
  if(process.env.PDF_TEXT_DIR)fs.writeFileSync(path.join(process.env.PDF_TEXT_DIR,V.id+'.txt'),await p.evaluate(()=>document.body.innerText));
  await p.setViewportSize({width:820,height:1100});await p.emulateMedia({media:'screen'});
  const f=path.join(OUT,V.id+'.pdf');
  const opts={format:'A4',printBackground:true,margin:{top:'16mm',bottom:'16mm',left:'15mm',right:'15mm'},displayHeaderFooter:true,
   headerTemplate:`<div style="width:100%;font:7px Helvetica,Arial;letter-spacing:.18em;color:#9a8a6a;padding:0 15mm;text-transform:uppercase">The ENT Companion · ${V.kind} · ${V.title.replace(/&/g,'&amp;')}</div>`,
   footerTemplate:`<div style="width:100%;font:7.5px Helvetica,Arial;color:#888;padding:0 15mm;display:flex;justify-content:space-between"><span>For personal study. Follow local protocols and senior advice for patients.</span><span class="pageNumber"></span></div>`};
  // Keep headings with what follows. Chromium does not honour break-after:avoid inside flex/grid boxes,
  // so render, find any heading, box label or table header left alone at the foot of a page, start it on
  // the next page instead, and render again, one page at a time (up to 14 passes).
  await markHeads(p);
  let buf=await p.pdf(opts),moved=[];const tried=new Set();
  for(let pass=0;pass<14&&PDFJS;pass++){
   const fix=await stranded(buf,(await p.evaluate(()=>window.__KN)).filter(c=>!tried.has(c.k)));if(!fix.length)break;fix.forEach(x=>tried.add(x.k));
   // a heading that already sits just under a page break we made would only leave a page with a heading on it: leave it
   const ok=await p.evaluate(ks=>ks.map(k=>{const e=document.querySelector(`[data-kb="${k}"]`);if(!e)return false;const y=e.getBoundingClientRect().top;
     return ![...document.querySelectorAll('[data-kfix],.part')].some(x=>{const d=y-x.getBoundingClientRect().top;return d>=0&&d<400&&x!==e})}),fix.map(x=>x.k));
   if(!ok[0]){pass--;if(tried.size>60)break;continue}
   await p.evaluate(ks=>ks.forEach(k=>{const e=document.querySelector(`[data-kb="${k}"]`);if(!e)return;
     // an earlier fix just below this heading (its table or first box) now starts the page with it: drop that break
     const y=e.getBoundingClientRect().top;document.querySelectorAll('[data-kfix]').forEach(x=>{const d=x.getBoundingClientRect().top-y;if(d>0&&d<400&&(e.compareDocumentPosition(x)&4)){x.style.removeProperty('break-before');x.removeAttribute('data-kfix')}});
     e.style.setProperty('break-before','page','important');e.setAttribute('data-kfix','')}),fix.map(x=>x.k));
   if(process.env.PDF_DEBUG)console.log('   pass',pass,JSON.stringify(fix),await p.evaluate(ks=>ks.map(k=>{const e=document.querySelector(`[data-kb="${k}"]`);if(!e)return 'none';const c=[];for(let x=e;x&&x!==document.body;x=x.parentElement){const s=getComputedStyle(x);c.push(x.tagName+'.'+[...x.classList].join('.')+'['+s.display+' bb='+s.breakBefore+' bi='+s.breakInside+' pos='+s.position+' fl='+s.float+']')}return c.join(' < ')+' :: '+e.innerText.slice(0,60)}),fix.map(x=>x.k)));
   moved.push(...fix.map(x=>x.t));buf=await p.pdf(opts);
  }
  if(moved.length)console.log('  kept with next',V.id,moved.length+':',moved.map(t=>t.slice(0,30)).join(' | '));
  fs.writeFileSync(f,buf);
  console.log(V.id,arts.length,'articles',(fs.statSync(f).size/1e6).toFixed(1)+' MB');
 }
 await b.close();if(failed.length){console.log('FAILED:',failed.join(' '));process.exitCode=1}})();
