/* Shared coordinate placement for slopes, using exact values and point identity. */
(function(root){
'use strict';
const C=root.RechtenWave;
// A completed pointer gesture may replace its DOM target. Consume its later
// compatibility click, but never the next pointer gesture or keyboard action.
let handledPointer=false;
document.addEventListener('pointerdown',()=>{handledPointer=false},true);
document.addEventListener('click',e=>{if(handledPointer&&e.detail){handledPointer=false;e.preventDefault();e.stopImmediatePropagation()}},true);
function mount(points,w,stage,{visual,answers,question,status,footer,redraw,submit,undo}){
 function activate(b,action){let down=null,handled=false;b.onpointerdown=e=>{if(e.isPrimary&&e.button===0){down={x:e.clientX,y:e.clientY};handled=false}};b.onpointercancel=()=>{down=null};b.onpointerup=e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8){handled=true;handledPointer=true;e.preventDefault();action(e)}down=null};b.onclick=e=>{if(!e.detail||!handled)action(e);handled=false}}
 const axis=stage==='ys'?'y':'x',row=stage==='ys'?'teller':'noemer';
 question.textContent=`Plaats de ${axis}-coördinaten in de ${row}`;
 answers.replaceChildren();footer.replaceChildren();
 const active=w.tokens||[],chosen=w.coordinateSelected;
 const value=(point,axis)=>{const v=points[point][axis];return v.n<0?`(${C.html(v)})`:C.html(v)};
 const slot=(r,i)=>{const a=r==='ys'?'y':'x',point=r===stage?active[i]:w.values[r]?.[i];return `<button type="button" class="coordinate-slot ${point?'filled':''}" data-coord-slot="${i}" data-coord-row="${r}" ${r!==stage?'disabled':''} aria-label="${r==='ys'?'Teller':'Noemer'}, ${i===0?'eerste':'tweede'} coördinaat${point?', '+point+': '+C.text(points[point][a]):', leeg'}">${point?`<small>${point} · ${a}</small><span class="coordinate-value">${value(point,a)}</span>`:`<small>${a}-coördinaat</small><span>?</span>`}</button>`};
 visual.innerHTML=`<div class="coordinate-builder"><div class="coordinate-points" aria-label="Gegeven punten">${['A','B'].map(point=>`<div class="coordinate-point"><strong>${point}</strong><span>(</span>${['x','y'].map(a=>`<button type="button" class="coordinate-token ${chosen?.point===point&&chosen.axis===a?'selected':''}" data-coord-point="${point}" data-coord-axis="${a}" aria-label="${point}, ${a} = ${C.text(points[point][a])}" aria-pressed="${chosen?.point===point&&chosen.axis===a}"><small>${a}</small><span class="coordinate-value">${C.html(points[point][a])}</span></button>`).join('<span>;</span>')}<span>)</span></div>`).join('')}</div><p class="coordinate-instruction">Sleep een waarde naar een vakje, of kies eerst de waarde en dan het vakje.</p><div class="coordinate-equation"><span class="coordinate-a">a =</span><div class="coordinate-fraction"><div class="coordinate-row ${stage==='ys'?'active':''}"><span class="coordinate-label">Δy</span>${slot('ys',0)}<span>−</span>${slot('ys',1)}</div><div class="coordinate-row ${stage==='xs'?'active':''}"><span class="coordinate-label">Δx</span>${slot('xs',0)}<span>−</span>${slot('xs',1)}</div></div></div><p class="coordinate-direction">${w.values.ys?`Teller: ${w.values.ys.join(' − ')}. Gebruik dezelfde volgorde in de noemer.`:'Je mag A − B of B − A kiezen. Houd dezelfde volgorde boven en onder.'}</p></div>`;
 function place(point,a,i,keyboard=false){
  if(a!==axis){status.className='status bad';status.textContent=`Gebruik hier de ${axis}-coördinaten voor ${stage==='ys'?'Δy':'Δx'}.`;return}
  const tokens=[w.tokens[0]||null,w.tokens[1]||null];const prev=tokens.indexOf(point);if(prev!==-1)tokens[prev]=null;
  tokens[i]=point;w.tokens=tokens;delete w.coordinateSelected;
  status.className='status';status.textContent='';redraw();if(keyboard)visual.querySelector(`[data-coord-row="${stage}"][data-coord-slot="${i}"]`)?.focus({preventScroll:true});
 }
 visual.querySelectorAll('[data-coord-slot]').forEach(b=>activate(b,e=>{if(chosen)place(chosen.point,chosen.axis,Number(b.dataset.coordSlot),e.type==='click'&&!e.detail);else{status.className='status';status.textContent='Kies eerst een coördinaat uit A of B.'}}));
 visual.querySelectorAll('[data-coord-point]').forEach(b=>{
  const point=b.dataset.coordPoint,a=b.dataset.coordAxis;let drag=null,ghost=null,dragged=false;
  function clean(){ghost?.remove();ghost=null;visual.querySelectorAll('.drop-ready').forEach(e=>e.classList.remove('drop-ready'))}
  const select=e=>{w.coordinateSelected={point,axis:a};status.className='status';status.textContent=`Kies een vakje voor ${point}, ${a} = ${C.text(points[point][a])}.`;redraw();if(e.type==='click'&&!e.detail)visual.querySelector(`[data-coord-point="${point}"][data-coord-axis="${a}"]`)?.focus({preventScroll:true})};
  b.onclick=e=>{if(!e.detail||!dragged)select(e);dragged=false};
  b.onpointerdown=e=>{if(!e.isPrimary||e.button!==0)return;dragged=false;drag={x:e.clientX,y:e.clientY,moved:false};b.setPointerCapture(e.pointerId)};
  b.onpointermove=e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>6)drag.moved=true;if(!drag.moved)return;if(!ghost){ghost=b.cloneNode(true);ghost.className='coordinate-drag';ghost.setAttribute('aria-hidden','true');ghost.removeAttribute('id');document.body.append(ghost);if(a===axis)visual.querySelectorAll('[data-coord-slot]:not(:disabled)').forEach(el=>el.classList.add('drop-ready'))}ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px'};
  b.onpointerup=e=>{if(!drag)return;const moved=drag.moved,target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-coord-slot]');drag=null;clean();if(b.hasPointerCapture(e.pointerId))b.releasePointerCapture(e.pointerId);if(moved){dragged=true;handledPointer=true;if(target&&visual.contains(target)&&!target.disabled){const i=Number(target.dataset.coordSlot);setTimeout(()=>{if(b.isConnected)place(point,a,i)},0)}}else{dragged=true;handledPointer=true;e.preventDefault();select(e)}};
  b.onpointercancel=()=>{drag=null;clean()};b.onlostpointercapture=()=>{drag=null;clean()};b.onkeydown=e=>{if(e.key==='Escape'){drag=null;clean();delete w.coordinateSelected;redraw()}};
 });
 const button=(text,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=text;activate(b,fn);footer.append(b);return b};
 button('Wis keuze',()=>{w.tokens=[];delete w.coordinateSelected;redraw()});
 button('Controleer',()=>{delete w.coordinateSelected;submit(w.tokens.slice())}).disabled=!(active.length===2&&new Set(active).size===2&&[0,1].every(i=>active[i]==='A'||active[i]==='B'));
 button('Terug',()=>{delete w.coordinateSelected;undo();redraw()}).disabled=!w.history.length;
}
root.RechtenCoordinateBuilder={mount};
})(globalThis);
