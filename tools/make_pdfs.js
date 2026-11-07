/* Clinical and imaging PDF volumes, rendered from the app itself.
   usage: (serve app/src/main/assets/www on :8765) node tools/make_pdfs.js [volume ids...]
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
const VOL=[...D.t.map(t=>({id:'cl_'+t.id,kind:t.g==='imgl'?'Imaging':'Clinical',title:t.t,single:true,arts:[t.id],ids:t.g==='imgl'?null:((LINKS[t.id]||{}).im||[]).filter(x=>CONDS.some(c=>c.id===x))})),
 ...AREAS.map(a=>({id:'imc_'+a[0],kind:'Imaging',title:'Imaging conditions: '+a[1],sub:'Key facts and case images for the core conditions, then the advanced and rare',conds:a[2]}))];
const PCSS=`
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
.part details>summary{list-style:none;pointer-events:none}
.part details>summary::-webkit-details-marker{display:none}
.part details>summary :is(svg,.arsi,i){display:none!important}
.part button{all:unset;display:block}
.part figure,.part tr,.part .arglance{break-inside:avoid}
.part .archd,.part .arintro,.part .chead,.part summary{break-after:avoid}
.part .tbl [hidden]{display:block!important}
.part img{max-height:95mm;object-fit:contain}
.part .arch-c{break-before:auto}
.part .archd{break-after:avoid}
.part h2,.part h3,.part summary{break-after:avoid}
.part .clrow svg,.part .clrow i{display:none}
.part .clsrc{font-size:8pt;color:#888;margin-top:6mm}
.part .arfig .pair{display:grid!important;grid-template-columns:1fr 1fr!important;gap:3mm}
.part a{color:inherit;text-decoration:none}
.pimgch{break-before:page}
.pchead{margin:0 0 6mm;padding-bottom:4mm;border-bottom:.6pt solid #b08d57;break-after:avoid}
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
.pk figcaption{font-size:6.8pt;line-height:1.3;color:#555;margin-top:1mm;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.pk cite{display:block;font-style:normal;color:#999;margin-top:.5mm}
.psrc{font-size:7.5pt;color:#999;margin:1.5mm 0 0}
.padv{columns:2;column-gap:8mm}
.padv>div{break-inside:avoid;padding:2mm 0;border-bottom:.3pt solid #e4e4e4;font-size:9pt}
.padv b{font:500 11pt var(--f-display);display:block}.padv small{color:#999;font-size:7.5pt}.padv p{margin:1mm 0 0;color:#444;font-size:8.5pt}
`;
const want=process.argv.slice(2);
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:820,height:1100}});
 p.on('pageerror',e=>console.log('pageerror',e.message));
 for(const V of VOL.filter(v=>!want.length||want.includes(v.id))){
  await p.goto('http://localhost:8765/');await p.waitForTimeout(1200);
  await p.evaluate(()=>new Promise(r=>{go('cl:home');setTimeout(r,1200)}));
  const arts=[];
  for(const id of (V.arts||[])){
   await p.evaluate(id=>go('cl:t-'+id),id);
   await p.waitForFunction(()=>document.querySelector('#view .arart'),null,{timeout:20000}).catch(()=>console.log('no art',id));
   await p.waitForTimeout(250);
   arts.push(await p.evaluate(id=>{const w=document.querySelector('#view .arw').cloneNode(true);
     w.querySelectorAll('.artoc,.arcont,.clprac,.h-prac,.arbar,.arnav,.arprog,[data-arall],.arsubtools,.starbtn,.arstar').forEach(x=>x.remove());
     const end=w.querySelector('.arend');if(end){const src=end.querySelector('.clsrc');end.replaceWith(...(src?[src]:[]))}
     w.querySelectorAll('details').forEach(d=>d.setAttribute('open',''));
     w.querySelectorAll('.coll').forEach(x=>{x.classList.remove('coll');x.removeAttribute('data-coll')});w.querySelectorAll('[aria-expanded]').forEach(x=>x.setAttribute('aria-expanded','true'));w.querySelectorAll('.chead').forEach(h=>[...h.children].forEach(c=>{if(!/^H[1-6]$/.test(c.tagName))c.remove()}));w.querySelectorAll('.texp').forEach(x=>x.remove());
     w.querySelectorAll('img').forEach(i=>{i.removeAttribute('loading');if(i.dataset.src)i.src=i.dataset.src;i.src=i.src});
     w.querySelectorAll('[id]').forEach(e=>e.id=id+'-'+e.id);
     const h=w.querySelector('h1');return {id,t:h?h.textContent:id,html:w.outerHTML}},id));
  }
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
      ${all&&adv.length?`<div class="pchead"><span>Imaging</span><h2>Advanced and rare</h2><p>Once the core is secure. Each has its full set of images in the app.</p></div><div class="padv">${adv.map(c=>`<div><b>${esc(c.t)}</b><small>${esc((RMAP[c.r]||{}).name||"")} · ${esc(c.cat)}</small>${c.pts&&c.pts.length?`<p>${esc(c.pts.slice(0,2).join(" · "))}</p>`:""}</div>`).join("")}</div>`:""}</section>`},[V.conds||[],!V.ids,V.les||null,V.ids||null]);}
  const date=new Date().toLocaleDateString('en-GB',{month:'long',year:'numeric'});
  await p.evaluate(({V,arts,conds,date,PCSS})=>{
   document.querySelectorAll('#tabs,#side,header,.topbar,.dock,#toast').forEach(x=>x&&x.remove());
   const toc=arts.map((a,i)=>`<li><span>${String(i+1).padStart(2,"0")}</span><a href="#a-${a.id}">${a.t}</a></li>`).join("")+(conds?`<li><span>${V.kind==="Imaging"?"":"·"}</span><a href="#imaging">${V.kind==="Imaging"?"Core conditions":"Imaging for this region"}</a></li>`:"");
   document.body.className='pbody';
   document.body.innerHTML=V.single?`${arts.map(a=>`<div class="part" id="a-${a.id}">${a.html}</div>`).join("")}${conds}`:`<div class="pcover"><div class="pmark">ENT ATLAS</div><div class="pkind">${V.kind}</div><h1>${V.title}</h1>${V.sub?`<p class="psub">${V.sub}</p>`:""}<p class="pdate">${arts.length?arts.length+" "+(V.kind==="Imaging"?"lessons":"articles"):""}${conds&&arts.length?" · imaging key facts":""} · ${date}</p></div>
    ${arts.length>1?`<div class="ptoc"><h2>Contents</h2><ol>${toc}</ol></div>`:""}
    ${arts.map(a=>`<div class="part" id="a-${a.id}">${a.html}</div>`).join("")}${conds}`;
   const st=document.createElement('style');st.textContent=PCSS;document.head.appendChild(st);
   document.documentElement.setAttribute('data-theme','light');
  },{V,arts,conds,date,PCSS}).catch(e=>console.log(e));
  await p.evaluate(()=>Promise.all([...document.images].map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r}))));
  await p.waitForTimeout(500);
  const f=path.join(OUT,V.id+'.pdf');
  await p.pdf({path:f,format:'A4',printBackground:true,margin:{top:'16mm',bottom:'16mm',left:'15mm',right:'15mm'},displayHeaderFooter:true,
   headerTemplate:`<div style="width:100%;font:7px Helvetica,Arial;letter-spacing:.18em;color:#9a8a6a;padding:0 15mm;text-transform:uppercase">ENT Atlas · ${V.kind} · ${V.title.replace(/&/g,'&amp;')}</div>`,
   footerTemplate:`<div style="width:100%;font:7.5px Helvetica,Arial;color:#888;padding:0 15mm;display:flex;justify-content:space-between"><span>For personal study. Follow local protocols and senior advice for patients.</span><span class="pageNumber"></span></div>`});
  console.log(V.id,arts.length,'articles',(fs.statSync(f).size/1e6).toFixed(1)+' MB');
 }
 await b.close()})();
