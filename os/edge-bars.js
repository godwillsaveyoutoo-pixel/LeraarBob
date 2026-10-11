/* Bar handles float in free space. Collapsing never reserves a replacement row. */
(()=>{
 'use strict';
 let queued=false,observedFrame=null,observedDocument=null,nativeObserver=null,nativeResize=null,drag=null,fullscreenSession=null;
 const handles=new WeakSet();
 const watchedDocs=new WeakSet(),size=44,gap=3;
 const controls='button,a[href],input,select,textarea,output,fieldset,[role="button"],[role="spinbutton"],[role="group"],[contenteditable="true"],[data-os-protect],.rescueEquation,.shotEquation';
 const text='h1,h2,h3,p,label,svg text,.instruction';
 function rects(doc,ox=0,oy=0){
  const boxes=[];
  if(!watchedDocs.has(doc)){watchedDocs.add(doc);doc.addEventListener('scroll',refresh,true);doc.addEventListener('load',refresh,true);}
  function add(r,control){
   if(!r.width||!r.height||r.bottom<=0||r.top>=doc.defaultView.innerHeight)return;
   boxes.push({left:r.left+ox,right:r.right+ox,top:r.top+oy,bottom:r.bottom+oy,control});
  }
  for(const n of doc.querySelectorAll(controls+','+text)){
   if(n.matches('.os-edge-handle,.lb-restore')||n.closest('[inert]')||doc.defaultView.getComputedStyle(n).visibility==='hidden')continue;
   if(n.matches(controls))add(n.getBoundingClientRect(),true);
   else{
    // Protect the actual text, not the empty width of a paragraph or heading.
    const range=doc.createRange();range.selectNodeContents(n);
    for(const r of range.getClientRects())add(r,false);
   }
  }
  for(const f of doc.querySelectorAll('iframe'))try{const r=f.getBoundingClientRect();if(r.width&&r.height&&f.contentDocument)boxes.push(...rects(f.contentDocument,ox+r.left,oy+r.top));}catch{}
  return boxes;
 }
 function style(n,name,value){if(n.style.getPropertyValue(name)!==value)n.style.setProperty(name,value);}
 function folded(edge){return document.body.classList.contains(edge==='top'?'topbar-collapsed':'os-bottom-collapsed');}
 function setFolded(edge,value){
  if(edge==='top')window.LeraarBobTopbar?.setCollapsed(value,true);
  else window.LeraarBobDesktop?.setBottomCollapsed(value);
 }
 function endDrag(cancelled=false){
  const d=drag;if(!d)return;drag=null;d.node.style.removeProperty('--os-grip-drag');
  try{d.node.releasePointerCapture(d.id);}catch{}
  if(d.moved)d.suppress.until=performance.now()+500;
  if(!cancelled&&d.direction*d.dy>=18&&Math.abs(d.dy)>Math.abs(d.dx))setFolded(d.edge,!d.closed);
  refresh();
 }
 function bindHandle(node,edge){
  if(!node||handles.has(node))return;handles.add(node);
  const suppress={until:0};
  node.addEventListener('pointerdown',e=>{
   if(!e.isPrimary||e.button!==0||drag)return;
   suppress.until=0; // A fresh press is intentional, even just after a drag.
   const closed=folded(edge);
   drag={node,edge,id:e.pointerId,x:e.clientX,y:e.clientY,dx:0,dy:0,moved:false,closed,direction:(edge==='top'?1:-1)*(closed?1:-1),suppress};
   node.setPointerCapture(e.pointerId);
  });
  node.addEventListener('pointermove',e=>{
   if(drag?.node!==node||drag.id!==e.pointerId)return;
   drag.dx=e.clientX-drag.x;drag.dy=e.clientY-drag.y;drag.moved ||= Math.hypot(drag.dx,drag.dy)>7;
   if(drag.moved){e.preventDefault();style(node,'--os-grip-drag',Math.max(-24,Math.min(24,drag.dy))+'px');}
  });
  node.addEventListener('pointerup',e=>{if(drag?.node===node&&drag.id===e.pointerId)endDrag();});
  for(const type of ['pointercancel','lostpointercapture'])node.addEventListener(type,()=>{if(drag?.node===node)endDrag(true);});
  // A completed drag must not also trigger the button's ordinary click toggle.
  node.addEventListener('click',e=>{if(e.detail&&performance.now()<suppress.until){suppress.until=0;e.preventDefault();e.stopImmediatePropagation();}},true);
  node.addEventListener('keydown',e=>{
   if(!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();
   setFolded(edge,edge==='top'?e.key==='ArrowUp':e.key==='ArrowDown');
  });
 }
 function syncFullscreen(){
  const active=document.fullscreenElement||document.webkitFullscreenElement;
  if(active&&!fullscreenSession){
   fullscreenSession={top:folded('top')};
   setFolded('top',true);setFolded('bottom',true);
  }else if(!active&&fullscreenSession){
   const previous=fullscreenSession;fullscreenSession=null;
   window.LeraarBobDesktop?.resetBottomPresentation();setFolded('top',previous.top);
  }
  refresh();
 }
 function place(edge,area,boxes){
  const minX=area.left,maxX=area.right-size,minY=area.top,maxY=area.bottom-size;
  const center=Math.max(minX,(minX+maxX)/2),edgeY=edge==='top'?minY:maxY;
  const xs=new Set([center,minX,maxX]),ys=new Set([edgeY]);
  // A busy outer edge uses a gap just inside it, never a full-width strip.
  for(const r of boxes){xs.add(r.right+gap);xs.add(r.left-size-gap);ys.add(r.bottom+gap);ys.add(r.top-size-gap);}
  const xValues=[...xs].filter(x=>x>=minX&&x<=maxX).sort((a,b)=>Math.abs(a-center)-Math.abs(b-center));
  const yValues=[...ys].filter(y=>y>=minY&&y<=maxY).sort((a,b)=>Math.abs(a-edgeY)-Math.abs(b-edgeY));
  const overlap=(x,y,r)=>Math.max(0,Math.min(x+size+gap,r.right)-Math.max(x-gap,r.left))*Math.max(0,Math.min(y+size+gap,r.bottom)-Math.max(y-gap,r.top));
  let best={x:center,y:edgeY},cost=Infinity;
  for(const y of yValues)for(const x of xValues){
   let score=0;
   for(const r of boxes){score+=overlap(x,y,r)*(r.control?1000:1);if(score>=cost)break;}
   if(score===0)return {x,y};
   if(score<cost){cost=score;best={x,y};}
  }
  return best;
 }
 function layout(){
  queued=false;const top=document.querySelector('.lb-restore'),bottom=document.getElementById('taskbarToggle');if(!bottom)return;
  if(top&&!top.classList.contains('os-edge-handle'))top.classList.add('os-edge-handle');
  const collapse=document.querySelector('leraarbob-topbar')?.shadowRoot?.querySelector('.collapse');
  for(const [node,edge] of [[collapse,'top'],[top,'top'],[bottom,'bottom']]){
   bindHandle(node,edge);if(!node)continue;
   const direction=(edge==='top')===folded(edge)?'omlaag':'omhoog';
   const hint='Klik of trek '+direction+' om de '+(edge==='top'?'bovenbalk':'onderbalk')+' '+(folded(edge)?'uit':'in')+' te klappen.';
   if(node.getAttribute('aria-description')!==hint)node.setAttribute('aria-description',hint);
   node.title=hint;
  }
  if(drag)return;
  const frame=document.querySelector('.frame-wrapper:not([hidden])>iframe');
  if(frame!==observedFrame||frame?.contentDocument!==observedDocument){nativeObserver?.disconnect();nativeResize?.disconnect();observedFrame=frame;observedDocument=frame?.contentDocument;try{if(observedDocument?.body){nativeObserver=new MutationObserver(refresh);nativeObserver.observe(observedDocument.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class']});nativeResize=new ResizeObserver(refresh);nativeResize.observe(frame);nativeResize.observe(observedDocument.body);}}catch{}}
  const bars=[['top',top,folded('top')],['bottom',bottom,folded('bottom')]];
  if(!bars.some(([,handle,closed])=>handle&&closed))return;
  const desktop=document.getElementById('desktop'),r=desktop.getBoundingClientRect();
  const area={left:0,right:innerWidth,top:Math.max(0,r.top),bottom:Math.min(innerHeight,r.bottom)};
  let boxes=[];try{boxes=rects(document).filter(b=>b.bottom>area.top&&b.top<area.bottom&&b.right>0&&b.left<innerWidth);}catch{}
  for(const [edge,handle,closed] of bars){
   if(!handle||!closed)continue;
   const p=place(edge,area,boxes);
   style(handle,'left',p.x+'px');style(handle,'--os-handle-offset',(edge==='top'?p.y:innerHeight-p.y-size)+'px');
   boxes.push({left:p.x,right:p.x+size,top:p.y,bottom:p.y+size,control:true});
  }
 }
 function refresh(){if(!queued){queued=true;requestAnimationFrame(layout);}}
 new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
 addEventListener('resize',refresh);
 document.addEventListener('load',e=>{if(e.target.tagName==='IFRAME')refresh();},true);
 document.addEventListener('scroll',refresh,true);
 document.addEventListener('topbar:change',refresh);document.addEventListener('click',refresh,true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag){e.preventDefault();endDrag(true);}},true);
 addEventListener('blur',()=>endDrag(true));
 for(const event of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(event,syncFullscreen);
 window.LeraarBobEdgeBars=Object.freeze({refresh,fullscreenActive:()=>!!fullscreenSession});refresh();
})();
