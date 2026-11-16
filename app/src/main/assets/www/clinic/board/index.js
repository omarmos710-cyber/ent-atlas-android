window.BOARDS={"chole":2,"csom":2,"facial":2,"fistula":2,"icc":2,"mastoiditis":2,"meniere":2,"myring":2,"oe":2,"om":2,"otosc":2,"perich":2,"petrous":2,"ssnhl":2,"tbfx":2,"thyroid":2,"tmperf":2,"tumear":2,"vs":2};

/* Full-screen viewer for the whiteboard summaries (opened from the button at the top of an article).
   Zoom: pinch, the − / + buttons, Fit, double-tap, or ctrl/trackpad wheel; any level from fit to 2x. */
(function(){
 const W=1760,MAX=2;let OV=null,S=0,F=1,H=0,FIT=true,PIN=null,lastTap=0;
 const q=s=>OV.querySelector(s);
 function fitScale(){return q(".bdsc").clientWidth/W}
 /* set the scale, keeping board point (bx,by) under viewport point (ax,ay) */
 function setScale(s,ax,ay,bx,by){if(!OV)return;const sc=q(".bdsc"),fr=q("iframe"),wr=q(".bdwrap");
  F=fitScale();s=Math.min(Math.max(MAX,F),Math.max(F,s));const old=S||F;
  if(ax==null){ax=sc.clientWidth/2;ay=sc.clientHeight/3}
  if(bx==null){bx=(sc.scrollLeft+ax)/old;by=(sc.scrollTop+ay)/old}
  S=s;FIT=Math.abs(s-F)<1e-3;fr.style.transform="scale("+s+")";wr.style.width=Math.round(W*s)+"px";wr.style.height=Math.round((H||1300)*s)+"px";
  sc.scrollLeft=bx*s-ax;sc.scrollTop=by*s-ay;
  q('[data-bd="pct"]').textContent=FIT?"Fit":Math.round(s/F*10)/10+"×";
  q('[data-bd="out"]').disabled=FIT;q('[data-bd="in"]').disabled=s>=Math.max(MAX,F)-1e-3}
 function step(k){const sc=q(".bdsc");setScale((S||F)*k,sc.clientWidth/2,sc.clientHeight/2)}
 function toggleAt(x,y){const r=q(".bdsc").getBoundingClientRect();setScale(FIT?Math.max(.75,F*2.5):F,x-r.left,y-r.top)}
 function open(id,title){close();S=0;H=0;FIT=true;const pdf=(window.BOARDS||{})[id]===2;
  OV=document.createElement("div");OV.className="bdov";OV.setAttribute("role","dialog");OV.setAttribute("aria-modal","true");OV.setAttribute("aria-label","Summary board");
  OV.innerHTML='<div class="bdbar"><b></b><button type="button" data-bd="close">Close</button></div>'+
   '<div class="bdsc"><div class="bdwrap"><iframe title="Summary board" tabindex="-1"></iframe></div></div>'+
   '<div class="bdctl"><button type="button" data-bd="out" aria-label="Zoom out">−</button><button type="button" data-bd="pct" aria-label="Fit to screen">Fit</button><button type="button" data-bd="in" aria-label="Zoom in">+</button>'+
   (pdf?'<button type="button" class="bddl" data-pdf="bd_'+id+'">Download PDF</button>':'')+'</div>';
  q("b").textContent=title||"Summary board";
  if(pdf)q(".bddl").dataset.pdfname="The ENT Companion - "+(title||id).normalize("NFD").replace(/[\u0300-\u036f]/g,"")+" - summary board";
  const fr=q("iframe");
  fr.onload=()=>{try{H=Math.ceil(fr.contentDocument.body.getBoundingClientRect().height);fr.style.height=H+"px"}catch(e){}setScale(F=fitScale())};
  fr.src="clinic/board/"+id+".html";document.body.appendChild(OV);document.body.style.overflow="hidden";setScale(fitScale());
  const sc=q(".bdsc");
  sc.addEventListener("touchstart",ev=>{if(ev.touches.length===2){const [a,b]=ev.touches,r=sc.getBoundingClientRect(),mx=(a.clientX+b.clientX)/2-r.left,my=(a.clientY+b.clientY)/2-r.top;
    PIN={d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),s:S||F,bx:(sc.scrollLeft+mx)/(S||F),by:(sc.scrollTop+my)/(S||F)};ev.preventDefault()}},{passive:false});
  sc.addEventListener("touchmove",ev=>{if(PIN&&ev.touches.length===2){ev.preventDefault();const [a,b]=ev.touches,r=sc.getBoundingClientRect();
    setScale(PIN.s*Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)/PIN.d,(a.clientX+b.clientX)/2-r.left,(a.clientY+b.clientY)/2-r.top,PIN.bx,PIN.by)}},{passive:false});
  sc.addEventListener("touchend",ev=>{if(PIN){if(ev.touches.length<2){PIN=null;lastTap=0}return}
    if(ev.changedTouches.length!==1||ev.touches.length)return;const t=Date.now();
    if(t-lastTap<300){ev.preventDefault();const p=ev.changedTouches[0];toggleAt(p.clientX,p.clientY);lastTap=0}else lastTap=t},{passive:false});
  sc.addEventListener("dblclick",ev=>{ev.preventDefault();toggleAt(ev.clientX,ev.clientY)});
  sc.addEventListener("wheel",ev=>{if(!ev.ctrlKey)return;ev.preventDefault();const r=sc.getBoundingClientRect();setScale((S||F)*Math.exp(-ev.deltaY/300),ev.clientX-r.left,ev.clientY-r.top)},{passive:false});
  q('[data-bd="close"]').focus({preventScroll:true})}
 function close(){if(OV&&OV.isConnected)OV.remove();if(OV)document.body.style.overflow="";OV=null;PIN=null}
 document.addEventListener("click",ev=>{const b=ev.target.closest("[data-arboard]");if(b){ev.preventDefault();ev.stopPropagation();open(b.dataset.arboard,b.dataset.title);return}
  if(!OV)return;const c=ev.target.closest("[data-bd]");if(!c)return;ev.stopPropagation();const k=c.dataset.bd;
  if(k==="close")close();else if(k==="in")step(1.4);else if(k==="out")step(1/1.4);else if(k==="pct")setScale(F)},true);
 document.addEventListener("keydown",ev=>{if(!OV)return;if(ev.key==="Escape"){ev.stopPropagation();close()}else if(ev.key==="+"||ev.key==="="){ev.preventDefault();step(1.4)}else if(ev.key==="-"){ev.preventDefault();step(1/1.4)}else if(ev.key==="0"){ev.preventDefault();setScale(F)}},true);
 window.addEventListener("resize",()=>{if(OV){const was=FIT;F=fitScale();setScale(was?F:S)}});
 window.openBoard=open;
 const st=document.createElement("style");st.textContent=`
.bdov{position:fixed;inset:0;z-index:9999;background:#fbfbf7;display:flex;flex-direction:column}
.bdbar,.bdctl{display:flex;align-items:center;gap:8px;background:var(--surface,#fff);color:var(--ink,#1d2330);border-color:var(--line,#e3e0d6)}
.bdbar{padding:calc(10px + env(safe-area-inset-top)) 12px 10px;border-bottom:1px solid var(--line,#e3e0d6)}
.bdbar b{flex:1;font:600 15px/1.2 system-ui,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bdctl{padding:8px 12px calc(8px + env(safe-area-inset-bottom));border-top:1px solid var(--line,#e3e0d6)}
.bdbar button,.bdctl button{font:600 14px system-ui,sans-serif;border:1px solid var(--line,#cfcabd);background:transparent;color:inherit;border-radius:999px;padding:7px 14px;min-height:36px}
.bdctl [data-bd=out],.bdctl [data-bd=in]{width:42px;padding:0;font-size:20px;line-height:1}
.bdctl [data-bd=pct]{min-width:64px}
.bdctl button:disabled{opacity:.35}
.bdctl .bddl{margin-left:auto;background:var(--ink,#1d2330);color:var(--surface,#fff);border-color:transparent}
.bdsc{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y;overscroll-behavior:contain}
.bdwrap{position:relative;overflow:hidden}
.bdwrap iframe{position:absolute;left:0;top:0;width:${W}px;height:1300px;border:0;transform-origin:0 0;pointer-events:none;background:#fbfbf7}
.arboardbtn{display:flex;align-items:center;gap:12px;width:100%;margin:14px 0 4px;padding:12px 14px;border:1px solid var(--line,#ddd);border-radius:14px;background:var(--surface,#fff);color:var(--ink,#1d2330);text-align:left;cursor:pointer;font:inherit}
.arboardbtn .bdi{flex:none;width:40px;height:30px;border-radius:6px;background:#fbfbf7;border:1.5px solid #1d2330;position:relative}
.arboardbtn .bdi:before{content:"";position:absolute;left:6px;right:6px;top:7px;height:2px;background:#1f5fbf;box-shadow:0 6px 0 #d33a2c,0 12px 0 #1f8a4c}
.arboardbtn b{display:block;font-weight:600;color:var(--ink,#1d2330)}.arboardbtn small{display:block;color:var(--muted,#6b6759);font-size:.85em;margin-top:1px}`;
 document.head.appendChild(st);
})();
