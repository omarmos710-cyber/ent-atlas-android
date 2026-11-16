window.BOARDS={"thyroid":1};

/* Full-screen viewer for the whiteboard summaries (opened from the button at the top of an article) */
(function(){
 const W=1760;let OV=null,Z=false,H=0;
 function fit(){if(!OV)return;const sc=OV.querySelector(".bdsc"),fr=OV.querySelector("iframe"),wr=OV.querySelector(".bdwrap");
  const f=sc.clientWidth/W,s=Z?Math.max(.75,f):f;fr.style.transform="scale("+s+")";wr.style.width=(W*s)+"px";wr.style.height=((H||1300)*s)+"px";
  OV.querySelector('[data-bd="zoom"]').textContent=Z?"Fit":"Zoom"}
 function open(id,title){close();Z=false;H=0;OV=document.createElement("div");OV.className="bdov";OV.setAttribute("role","dialog");OV.setAttribute("aria-modal","true");OV.setAttribute("aria-label","Summary board");
  OV.innerHTML='<div class="bdbar"><b></b><button type="button" data-bd="zoom">Zoom</button><button type="button" data-bd="close">Close</button></div><div class="bdsc"><div class="bdwrap"><iframe title="Summary board" tabindex="-1"></iframe></div></div><p class="bdhint">Tap Zoom, or double-tap the board, to read it closely. Turn the phone sideways for a wider view.</p>';
  OV.querySelector("b").textContent=title||"Summary board";const fr=OV.querySelector("iframe");
  fr.onload=()=>{try{H=fr.contentDocument.documentElement.scrollHeight;fr.style.height=H+"px"}catch(e){}fit()};
  fr.src="clinic/board/"+id+".html";document.body.appendChild(OV);document.body.style.overflow="hidden";fit();
  OV.querySelector('[data-bd="close"]').focus({preventScroll:true})}
 function close(){if(OV&&OV.isConnected)OV.remove();if(OV)document.body.style.overflow="";OV=null}
 function zoomAt(x,y){const sc=OV.querySelector(".bdsc"),r=sc.getBoundingClientRect(),px=(sc.scrollLeft+x-r.left)/sc.scrollWidth,py=(sc.scrollTop+y-r.top)/sc.scrollHeight;
  Z=!Z;fit();sc.scrollLeft=px*sc.scrollWidth-(x-r.left);sc.scrollTop=py*sc.scrollHeight-(y-r.top)}
 document.addEventListener("click",ev=>{const b=ev.target.closest("[data-arboard]");if(b){ev.preventDefault();ev.stopPropagation();open(b.dataset.arboard,b.dataset.title);return}
  if(!OV)return;const c=ev.target.closest("[data-bd]");if(c){ev.stopPropagation();if(c.dataset.bd==="close")close();else{const sc=OV.querySelector(".bdsc"),r=sc.getBoundingClientRect();zoomAt(r.left+r.width/2,r.top+r.height/3)}}},true);
 document.addEventListener("dblclick",ev=>{if(OV&&ev.target.closest(".bdsc")){ev.preventDefault();zoomAt(ev.clientX,ev.clientY)}},true);
 let lastTap=0;document.addEventListener("touchend",ev=>{if(!OV||!ev.target.closest(".bdsc")||ev.changedTouches.length!==1)return;const t=Date.now();if(t-lastTap<300){ev.preventDefault();const p=ev.changedTouches[0];zoomAt(p.clientX,p.clientY);lastTap=0}else lastTap=t},{capture:true,passive:false});
 document.addEventListener("keydown",ev=>{if(OV&&ev.key==="Escape"){ev.stopPropagation();close()}},true);
 window.addEventListener("resize",fit);
 window.openBoard=open;
 const st=document.createElement("style");st.textContent=`
.bdov{position:fixed;inset:0;z-index:9999;background:#fbfbf7;display:flex;flex-direction:column}
.bdbar{display:flex;align-items:center;gap:8px;padding:calc(10px + env(safe-area-inset-top)) 12px 10px;border-bottom:1px solid #e3e0d6;background:#fff;color:#1d2330}
.bdbar b{flex:1;font:600 15px/1.2 system-ui,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bdbar button{font:600 14px system-ui,sans-serif;border:1px solid #cfcabd;background:#fff;color:#1d2330;border-radius:999px;padding:7px 14px}
.bdsc{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y}
.bdwrap{position:relative;overflow:hidden}
.bdwrap iframe{position:absolute;left:0;top:0;width:${W}px;height:1300px;border:0;transform-origin:0 0;pointer-events:none;background:#fbfbf7}
.bdhint{margin:0;padding:8px 14px calc(8px + env(safe-area-inset-bottom));font:13px/1.3 system-ui,sans-serif;color:#6b6759;background:#fff;border-top:1px solid #e3e0d6}
.arboardbtn{display:flex;align-items:center;gap:12px;width:100%;margin:14px 0 4px;padding:12px 14px;border:1px solid var(--line,#ddd);border-radius:14px;background:var(--card,#fff);color:inherit;text-align:left;cursor:pointer}
.arboardbtn .bdi{flex:none;width:40px;height:30px;border-radius:6px;background:#fbfbf7;border:1.5px solid #1d2330;position:relative}
.arboardbtn .bdi:before{content:"";position:absolute;left:6px;right:6px;top:7px;height:2px;background:#1f5fbf;box-shadow:0 6px 0 #d33a2c,0 12px 0 #1f8a4c}
.arboardbtn b{display:block;font-weight:600}.arboardbtn small{display:block;opacity:.7;font-size:.85em;margin-top:1px}`;
 document.head.appendChild(st);
})();
