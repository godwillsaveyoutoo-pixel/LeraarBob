/* Bar handles float in free space. Collapsing never reserves a replacement row. */
(()=>{
 'use strict';
 let queued=false,observedFrame=null,observedDocument=null,nativeObserver=null,nativeResize=null;
 const watchedDocs=new WeakSet(),size=44,gap=3;
 const controls='button,a[href],input,select,textarea,[role="button"],[role="spinbutton"],[contenteditable="true"],[data-os-protect],.rescueEquation,.shotEquation';
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
  const frame=document.querySelector('.frame-wrapper:not([hidden])>iframe');
  if(frame!==observedFrame||frame?.contentDocument!==observedDocument){nativeObserver?.disconnect();nativeResize?.disconnect();observedFrame=frame;observedDocument=frame?.contentDocument;try{if(observedDocument?.body){nativeObserver=new MutationObserver(refresh);nativeObserver.observe(observedDocument.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class']});nativeResize=new ResizeObserver(refresh);nativeResize.observe(frame);nativeResize.observe(observedDocument.body);}}catch{}}
  const folded=[['top',top,document.body.classList.contains('topbar-collapsed')],['bottom',bottom,document.body.classList.contains('os-bottom-collapsed')]];
  if(!folded.some(([,handle,closed])=>handle&&closed))return;
  const desktop=document.getElementById('desktop'),r=desktop.getBoundingClientRect();
  const area={left:0,right:innerWidth,top:Math.max(0,r.top),bottom:Math.min(innerHeight,r.bottom)};
  let boxes=[];try{boxes=rects(document).filter(b=>b.bottom>area.top&&b.top<area.bottom&&b.right>0&&b.left<innerWidth);}catch{}
  for(const [edge,handle,closed] of folded){
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
 window.LeraarBobEdgeBars=Object.freeze({refresh});refresh();
})();
