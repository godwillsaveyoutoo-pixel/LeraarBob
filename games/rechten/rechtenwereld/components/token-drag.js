/* Shared visual drag feedback. Draft motion never changes an exercise answer. */
(function(root){
'use strict';
function create({app,kinds,enabled,onStart=()=>{}}){
 let drag=null,blockedUntil=0,cancelledPointer=null;
 const blank=document.createElement('canvas');blank.width=blank.height=1;
 const selectable=e=>e&&!e.disabled&&!e.closest('[inert]');
 function sourceAt(el){
  if(!enabled())return null;
  for(const kind of kinds){const source=el.closest?.(kind.source);if(source&&app.contains(source)&&selectable(source))return {kind,source,value:kind.read(source)};}
  return null;
 }
 function clear(){
  if(!drag)return;
  const old=drag;drag=null;
  old.source.classList.remove('is-held','is-drag-source');
  old.target?.classList.remove('is-drop-target');
  old.ready?.forEach(e=>e.classList.remove('is-drop-ready'));
  old.ghost?.remove();document.body.classList.remove('is-token-dragging');
  if(old.pointerId!==undefined&&old.source.hasPointerCapture?.(old.pointerId))old.source.releasePointerCapture(old.pointerId);
 }
 function cancel(){if(drag?.moving){blockedUntil=Date.now()+500;cancelledPointer=drag.pointerId}clear()}
 function visual(source){
  const wrap=document.createElement('div');wrap.className='token-drag-preview';wrap.setAttribute('aria-hidden','true');wrap.inert=true;
  if(source instanceof SVGElement){
   const label=document.createElement('span');label.className='drag-point-preview';label.dataset.point=drag.value;label.textContent=drag.value;wrap.append(label);
  }else{
   const clone=source.cloneNode(true),originals=[source,...source.querySelectorAll('*')],copies=[clone,...clone.querySelectorAll('*')];
   // Snapshot inherited colors, fractions and type size so a body-level preview
   // looks identical to its tile, even outside the lesson's CSS container.
   originals.forEach((original,i)=>{const copy=copies[i],style=getComputedStyle(original);for(const name of style)copy.style.setProperty(name,style.getPropertyValue(name));for(const attr of [...copy.attributes])if(attr.name==='id'||attr.name==='name'||attr.name==='draggable'||attr.name.startsWith('data-'))copy.removeAttribute(attr.name);copy.removeAttribute('aria-pressed');copy.tabIndex=-1;});
   const r=source.getBoundingClientRect();Object.assign(clone.style,{width:r.width+'px',height:r.height+'px',minWidth:'0',minHeight:'0',maxWidth:'none',maxHeight:'none',margin:'0',transform:'none',opacity:'1',outline:'none',boxShadow:'none',pointerEvents:'none'});
   clone.classList.remove('is-held','is-drag-source');wrap.append(clone);
  }
  document.body.append(wrap);return wrap;
 }
 function start(){
  drag.moving=true;drag.ghost=visual(drag.source);
  drag.source.classList.remove('is-held');drag.source.classList.add('is-drag-source');
  drag.ready=[...app.querySelectorAll(drag.kind.target)].filter(selectable);drag.ready.forEach(e=>e.classList.add('is-drop-ready'));
  document.body.classList.add('is-token-dragging');onStart();
 }
 function targetAt(x,y){
  const target=document.elementFromPoint(x,y)?.closest(drag.kind.target);
  return selectable(target)&&app.contains(target)&&(!drag.kind.accept||drag.kind.accept(target,{clientX:x,clientY:y}))?target:null;
 }
 function move(x,y){
  if(!drag?.moving)return;
  const r=drag.ghost.getBoundingClientRect(),touch=drag.pointerType!=='mouse',offsetY=touch?r.height+18:r.height/2;
  const left=Math.max(4,Math.min(innerWidth-r.width-4,x-r.width/2)),top=Math.max(4,Math.min(innerHeight-r.height-4,y-offsetY));
  drag.ghost.style.transform=`translate3d(${left}px,${top}px,0)`;
  const target=targetAt(x,y);if(target!==drag.target){drag.target?.classList.remove('is-drop-target');target?.classList.add('is-drop-target');drag.target=target}
  drag.ghost.classList.toggle('has-drop-target',!!target);
 }
 function finish(x,y){
  const active=drag,target=enabled()&&active.source.isConnected?targetAt(x,y):null;
  blockedUntil=Date.now()+500;clear();
  if(target)active.kind.drop(target,active.value,{clientX:x,clientY:y});
 }
 app.addEventListener('pointerdown',e=>{
  if(!e.isPrimary||e.button!==0)return;
  // A new deliberate gesture is never swallowed by the previous drop's click guard.
  blockedUntil=0;cancel();blockedUntil=0;cancelledPointer=null;
  const found=sourceAt(e.target);if(!found)return;
  drag={...found,x:e.clientX,y:e.clientY,pointerId:e.pointerId,pointerType:e.pointerType,moving:false,native:e.pointerType==='mouse'&&!(found.source instanceof SVGElement)};
  drag.source.classList.add('is-held');
  if(!drag.native)drag.source.setPointerCapture(e.pointerId);
 },true);
 document.addEventListener('pointermove',e=>{
  if(!drag||drag.native||e.pointerId!==drag.pointerId)return;
  if(!enabled()){cancel();return}
  if(!drag.moving&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>6)start();
  if(drag.moving){e.preventDefault();move(e.clientX,e.clientY)}
 },{capture:true,passive:false});
 document.addEventListener('pointerup',e=>{
  if(e.pointerId===cancelledPointer){cancelledPointer=null;e.preventDefault();e.stopImmediatePropagation();return}
  if(!drag||e.pointerId!==drag.pointerId)return;
  if(drag.native&&drag.moving)return; // Native drop/dragend owns this gesture.
  if(!drag.moving){clear();return}
  e.preventDefault();e.stopImmediatePropagation();finish(e.clientX,e.clientY);
 },true);
 document.addEventListener('pointercancel',e=>{if(drag&&!drag.native&&e.pointerId===drag.pointerId)cancel()},true);
 document.addEventListener('lostpointercapture',e=>{if(drag&&!drag.native&&e.pointerId===drag.pointerId)cancel()},true);
 app.addEventListener('dragstart',e=>{
  const found=sourceAt(e.target);if(!found)return;
  if(drag&&!drag.native){e.preventDefault();return}
  clear();drag={...found,native:true,pointerType:'mouse',moving:false};
  e.dataTransfer.setData('text/plain',found.kind.prefix+found.value);e.dataTransfer.effectAllowed='copy';
  start();e.dataTransfer.setDragImage(blank,0,0);move(e.clientX,e.clientY);
 });
 document.addEventListener('dragover',e=>{
  if(!drag?.native||!drag.moving)return;
  if(!enabled()){cancel();return}
  move(e.clientX,e.clientY);if(drag.target){e.preventDefault();e.dataTransfer.dropEffect='copy'}
 },true);
 document.addEventListener('drop',e=>{if(!drag?.native||!drag.moving)return;e.preventDefault();e.stopImmediatePropagation();finish(e.clientX,e.clientY)},true);
 document.addEventListener('dragend',cancel,true);
 document.addEventListener('click',e=>{if(Date.now()<blockedUntil&&e.detail!==0){e.preventDefault();e.stopImmediatePropagation()}},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag?.moving){e.preventDefault();e.stopImmediatePropagation();cancel()}},true);
 window.addEventListener('blur',cancel);window.addEventListener('resize',cancel);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel()});
 return {cancel};
}
root.RechtenV2TokenDrag=Object.freeze({create});
})(globalThis);
