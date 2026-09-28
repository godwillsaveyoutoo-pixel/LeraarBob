/* Direct algebra gestures: move a signed term across =, or detach its factor. */
(function(root){
'use strict';
const C=root.RechtenWave,H=C.html;
let handledPointer=false;
document.addEventListener('pointerdown',()=>{handledPointer=false},true);
document.addEventListener('click',e=>{if(handledPointer&&e.detail){handledPointer=false;e.preventDefault();e.stopImmediatePropagation()}},true);
function activate(button,action){
 let down=null;
 button.onpointerdown=e=>{if(e.isPrimary&&e.button===0)down={x:e.clientX,y:e.clientY}};
 button.onpointercancel=()=>{down=null};
 button.onpointerup=e=>{if(!down)return;const tap=Math.hypot(e.clientX-down.x,e.clientY-down.y)<8;down=null;if(tap){handledPointer=true;e.preventDefault();action()}};
 button.onclick=e=>{if(!e.detail)action()};
}
function draggable(source,{targets,drop,tap,preview=()=>{},finish=()=>{}}){
 let drag=null,ghost=null;const footprint=source.dataset.action==='move'&&source.closest('.equation-product')||source;
 const clear=()=>{ghost?.remove();ghost=null;footprint.classList.remove('dragging');targets().forEach(t=>t.classList.remove('drop-ready','drop-near'));preview(null);finish()};
 const targetAt=(x,y,regions)=>regions.find(({rect:r})=>x>=r.left-12&&x<=r.right+12&&y>=r.top-12&&y<=r.bottom+12)?.target;
 source.onpointerdown=e=>{if(!e.isPrimary||e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false,target:null,regions:targets().map(target=>({target,rect:target.getBoundingClientRect()}))};source.setPointerCapture(e.pointerId)};
 source.onpointermove=e=>{if(!drag||e.pointerId!==drag.id)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7)drag.moved=true;if(!drag.moved)return;e.preventDefault();
  if(!ghost){ghost=document.createElement('div');ghost.className='equation-drag-ghost';ghost.innerHTML=source.dataset.dragLabel||source.innerHTML;ghost.setAttribute('aria-hidden','true');document.body.append(ghost);footprint.classList.add('dragging');targets().forEach(t=>t.classList.add('drop-ready'))}
  ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';drag.target=targetAt(e.clientX,e.clientY,drag.regions);targets().forEach(t=>t.classList.toggle('drop-near',t===drag.target));preview(drag.target);
 };
 source.onpointerup=e=>{if(!drag||e.pointerId!==drag.id)return;const d=drag;drag=null;handledPointer=true;e.preventDefault();clear();if(source.hasPointerCapture(e.pointerId))source.releasePointerCapture(e.pointerId);if(d.moved){const target=targetAt(e.clientX,e.clientY,d.regions);if(target)drop(target)}else tap?.()};
 source.onpointercancel=source.onlostpointercapture=()=>{if(drag){drag=null;clear()}};
 source.onclick=e=>{if(!e.detail)tap?.()};
 source.onkeydown=e=>{if(e.key==='Escape'){drag=null;clear()}else if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat)tap?.()}};
}
function mount(e,w,{host,answers,axis='y',symbol=axis,submit,redraw}){
 answers.replaceChildren();
 const selected=w.selectedTerm;
 const letter=k=>k==='c'?'':k===axis?symbol:k;
 const termHTML=(v,k,first)=>{const abs=C.q(Math.abs(v.n),v.d);return `${v.n<0?'−':first?'':'+'}${k!=='c'&&C.eq(abs,1)?'':H(abs)}${letter(k)}`};
 function term(side,k,first){
  const v=e[side][k],full=termHTML(v,k,first),factor=k!=='c'&&!C.eq(v,1);
  const attrs=`data-side="${side}" data-term="${k}"`;
  return factor?`<span class="equation-product"><button type="button" class="equation-factor" ${attrs} data-action="divide" aria-label="Deel beide leden door ${C.text(v)}">${v.n>0&&!first?'+':''}${H(v)}</button><button type="button" class="equation-term" ${attrs} data-action="move" data-drag-label="${full.replaceAll('"','&quot;')}" aria-label="Verplaats de hele term ${C.text(v)}${letter(k)}">${letter(k)}</button></span>`:`<button type="button" class="equation-term" ${attrs} data-action="move" aria-label="Verplaats ${C.text(v)}${letter(k)}">${full}</button>`;
 }
 host.innerHTML=`<div class="equation-sheet"><div class="equation-balance">${['left','right'].map((side,i)=>`${i?'<span class="equation-equals">=</span>':''}<div class="equation-member" data-member="${side}" role="group" aria-label="${i?'Rechterlid':'Linkerlid'}">${['x','y','c'].filter(k=>e[side][k].n).map((k,j)=>term(side,k,j===0)).join('')||'<span>0</span>'}</div>`).join('')}</div><div class="equation-preview" aria-live="polite"></div><p class="equation-cue">${C.isolated(e,axis)?`${symbol} staat vrij.`:'Sleep een term over =. Pak alleen de factor om beide leden te delen.'}</p><p class="equation-tap-cue">${C.isolated(e,axis)?'':'Of tik een deel aan en daarna het andere lid.'}</p></div>`;
 const preview=host.querySelector('.equation-preview');
 const opFor=s=>s.action==='divide'?{kind:'divide',value:e[s.side][s.term]}:{kind:'subtract',term:s.term,value:e[s.side][s.term]};
 function show(s){if(!s){preview.innerHTML='';return}const op=opFor(s),v=op.value,abs=C.q(Math.abs(v.n),v.d),verb=op.kind==='divide'?`÷ (${H(v)})`:`${v.n<0?'+':'−'} ${H(abs)}${letter(s.term)}`;let next;try{next=C.operate(e,op)}catch{return}preview.innerHTML=`<small>${verb} op beide leden</small><div>${C.equationHTML(next).replaceAll(axis,symbol)}</div>`}
 const apply=s=>{delete w.selectedTerm;submit(opFor(s))};
 for(const source of host.querySelectorAll('[data-action]')){
  const s={side:source.dataset.side,term:source.dataset.term,action:source.dataset.action};
  const opposite=()=>[host.querySelector(`[data-member="${s.side==='left'?'right':'left'}"]`)];
  source.classList.toggle('selected',selected?.side===s.side&&selected.term===s.term&&selected.action===s.action);
  draggable(source,{targets:opposite,drop:()=>apply(s),tap:()=>{if(selected&&selected.side!==s.side){apply(selected);return}w.selectedTerm=s;redraw()},preview:target=>show(target?s:null)});
 }
 if(selected){
  const target=host.querySelector(`[data-member="${selected.side==='left'?'right':'left'}"]`);
  target.classList.add('drop-ready');target.tabIndex=0;target.setAttribute('role','button');target.setAttribute('aria-label','Pas de verplaatsing toe op dit lid');
  target.onclick=e=>{if(e.target.closest('[data-action]'))return;apply(selected)};
  target.onkeydown=e=>{if(e.target===target&&(e.key==='Enter'||e.key===' ')){e.preventDefault();apply(selected)}};
  show(selected);
 }
}
// Keep each operation visible until the learner joins or moves its pieces.
function pointArithmetic(t,w,{host,stage,submit,redraw}){
 const A=t.params[w.values.point||'A'],a=t.params.model.a,product=C.mul(a,A.x),moved=!!w.bArithmetic?.moved;
 const number=(id,value,label=H(value))=>`<button type="button" class="equation-term" data-point-piece="${id}" aria-label="${C.text(value)}">${label}</button>`;
 let left=H(A.y),right='',cue='';
 if(stage==='ax'){
  right=number('factor-a',a)+'<span>·</span>'+number('factor-x',A.x,`(${H(A.x)})`)+'<span>+ b</span>';
  cue='Sleep de twee factoren op elkaar om het product te berekenen.';
 }else if(!moved){
  right=number('constant',product)+'<span>+ b</span>';
  cue='Sleep de losse term naar de andere kant van het gelijkheidsteken.';
 }else{
  const inverse=C.mul(-1,product),abs=C.q(Math.abs(inverse.n),inverse.d);
  left=number('value-y',A.y)+number('value-neg-product',inverse,(inverse.n<0?'− ':'+ ')+H(abs));
  right='b';cue='Sleep de twee getallen op elkaar om b te vinden.';
 }
 host.innerHTML=`<div class="equation-sheet point-arithmetic"><div class="equation-balance"><div class="equation-member" data-point-member="left">${left}</div><span>=</span><div class="equation-member" data-point-member="right">${right}</div></div><p class="equation-cue">${cue}</p><p class="equation-tap-cue">Of tik eerst het ene deel en dan het andere aan.</p></div>`;
 const commit=()=>{delete w.pointGesture;submit(stage==='ax'?product:{kind:moved?'combineConstants':'moveConstant'})};
 const targetFor=id=>host.querySelector(stage==='ax'?`[data-point-piece="${id==='factor-a'?'factor-x':'factor-a'}"]`:moved?`[data-point-piece="${id==='value-y'?'value-neg-product':'value-y'}"]`:'[data-point-member="left"]');
 for(const source of host.querySelectorAll('[data-point-piece]')){
  const id=source.dataset.pointPiece,target=targetFor(id);
  source.classList.toggle('selected',w.pointGesture===id);
  draggable(source,{targets:()=>[target],drop:commit,tap:()=>{
   if(w.pointGesture&&w.pointGesture!==id){commit();return}
   w.pointGesture=id;redraw();
  }});
 }
 if(w.pointGesture){
  const target=targetFor(w.pointGesture);target.classList.add('drop-ready');
  if(!target.matches('button')){target.tabIndex=0;target.setAttribute('role','button');target.setAttribute('aria-label','Verplaats de losse term naar dit lid');target.onclick=commit;target.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();commit()}}}
 }
}

root.RechtenEquationEditor={mount,pointArithmetic,draggable,activate};
})(globalThis);
