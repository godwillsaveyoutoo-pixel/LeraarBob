/* Small, independent bar handles. Never reload or resize a game's own state. */
(()=>{
 'use strict';
 let queued=false,observedFrame=null,observedDocument=null,nativeObserver=null,nativeResize=null;
 const watchedDocs=new WeakSet();
 const targets='button,a[href],input,select,textarea,[role="button"],[role="spinbutton"],h1,h2,h3,p,label,svg text,.instruction,.rescueEquation,.shotEquation,[data-os-protect]';
 function rects(doc,ox=0,oy=0){
  const boxes=[];
  if(!watchedDocs.has(doc)){watchedDocs.add(doc);doc.addEventListener('scroll',refresh,true);doc.addEventListener('load',refresh,true);}
  for(const n of doc.querySelectorAll(targets)){
   if(n.matches('.os-edge-handle,.lb-restore')||n.closest('[inert]'))continue;
   const r=n.getBoundingClientRect();if(!r.width||!r.height||r.bottom<0||r.top>doc.defaultView.innerHeight||doc.defaultView.getComputedStyle(n).visibility==='hidden')continue;
   boxes.push({left:r.left+ox,right:r.right+ox,top:r.top+oy,bottom:r.bottom+oy});
  }
  for(const f of doc.querySelectorAll('iframe'))try{const r=f.getBoundingClientRect();if(r.width&&r.height&&f.contentDocument)boxes.push(...rects(f.contentDocument,ox+r.left,oy+r.top));}catch{}
  return boxes;
 }
 function style(n,name,value){if(n.style.getPropertyValue(name)!==value)n.style.setProperty(name,value);}
 function layout(){
  queued=false;const top=document.querySelector('.lb-restore'),bottom=document.getElementById('taskbarToggle');if(!bottom)return;
  if(top&&!top.classList.contains('os-edge-handle'))top.classList.add('os-edge-handle');
  const frame=document.querySelector('.frame-wrapper:not([hidden])>iframe');
  if(frame!==observedFrame||frame?.contentDocument!==observedDocument){nativeObserver?.disconnect();nativeResize?.disconnect();observedFrame=frame;observedDocument=frame?.contentDocument;for(const edge of ['top','bottom'])style(document.documentElement,'--os-'+edge+'-reserve','0px');try{if(observedDocument?.body){nativeObserver=new MutationObserver(refresh);nativeObserver.observe(observedDocument.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class']});nativeResize=new ResizeObserver(refresh);nativeResize.observe(frame);nativeResize.observe(observedDocument.body);}}catch{}}
  const folded=[['top',top,document.body.classList.contains('topbar-collapsed')],['bottom',bottom,document.body.classList.contains('os-bottom-collapsed')]];
  for(const [edge,handle,closed] of folded){
   if(!handle)continue;
   const reserve='--os-'+edge+'-reserve';
   if(!closed){style(document.documentElement,reserve,'0px');continue;}
   const y=edge==='top'?0:innerHeight-44,width=64;
   // Only controls and task text near this edge matter. Try the centre first,
   // then nearby gaps. A crowded edge gets a transparent safety margin.
   let boxes=[];try{if(frame){const r=frame.getBoundingClientRect();boxes=rects(frame.contentDocument,r.left,r.top);}else boxes=rects(document.getElementById('desktop').ownerDocument).filter(r=>r.bottom>0&&r.top<innerHeight); }catch{}
   const safe=x=>!boxes.some(r=>r.left<x+width+3&&r.right>x-3&&r.top<y+44+3&&r.bottom>y-3);
   const center=Math.max(0,(innerWidth-width)/2),candidates=[center];for(let d=width+8;d<innerWidth;d+=width+8)candidates.push(center-d,center+d);
   candidates.push(4,innerWidth-width-4);
   const chosen=candidates.find(x=>x>=4&&x+width<=innerWidth-4&&safe(x));
   // Keep an existing margin until resize, app switch or reopening rather than
   // oscillating between a gap and the space created by the margin itself.
   if(chosen===undefined)style(document.documentElement,reserve,'44px');
   style(handle,'left',Math.round(chosen===undefined?center:chosen)+'px');
  }
 }
 function refresh(){if(!queued){queued=true;requestAnimationFrame(layout);}}
 new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
 addEventListener('resize',()=>{for(const edge of ['top','bottom'])document.documentElement.style.setProperty('--os-'+edge+'-reserve','0px');refresh();});
 document.addEventListener('load',e=>{if(e.target.tagName==='IFRAME')refresh();},true);
 document.addEventListener('scroll',refresh,true);
 document.addEventListener('topbar:change',refresh);document.addEventListener('click',refresh,true);
 window.LeraarBobEdgeBars=Object.freeze({refresh});refresh();
})();
