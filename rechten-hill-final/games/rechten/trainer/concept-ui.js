/* A shared visual argument for direction, horizontal/vertical lines and uniqueness. */
(function(root){
'use strict';
const C=root.RechtenWave,H=C.html;
function context(t,w,stage,graph){
 const p=t.params,m=p.model,direction=t.skill==='line_behavior';
 const revealed=!!w.values.classify||w.done;
 const shared=!direction&&revealed?(m.kind==='vertical'?'x':m.kind==='affine'?'y':null):null;
 const point=name=>`<span class="concept-point">${name}(${['x','y'].map(axis=>`<span class="${axis===shared?'shared-coordinate':''}">${H(p[name][axis])}</span>`).join('; ' )})</span>`;
 const showGraph=p.representation==='graph'||(!direction&&revealed)||w.done;
 let formula='',note='';
 const heading=direction?'<div class="behavior-function">y = ax + b</div>':'';
 if(!direction){
  if(stage==='constant')formula=`${w.values.axis} = <span class="concept-blank" aria-label="nog in te vullen"></span>`;
  if(stage==='function')note=m.kind==='vertical'?'Kijk langs de verticale rechte: bij dezelfde x horen meerdere y-waarden.':'Kijk langs de horizontale rechte: bij elke x hoort precies één y, steeds dezelfde waarde.';
  if(stage==='function'||w.done&&m.kind!=='identical')formula=m.kind==='vertical'?`x = ${H(m.c)}`:`y = ${H(m.b)}`;
  if(w.done)note=m.kind==='vertical'?`Bij x = ${H(m.c)} horen meerdere y-waarden. Geen functie y = f(x).`:m.kind==='identical'?'Door één punt passen meerdere rechten. Er is geen unieke rechte.':`Bij elke x hoort dezelfde y = ${H(m.b)}. Dit is een constante functie; a = 0.`;
 }else if(w.done)note=m.a.n>0?'Van links naar rechts neemt y toe.':m.a.n<0?'Van links naar rechts neemt y af.':'Bij elke x blijft y gelijk.';
 const givens=direction&&p.representation==='slope'&&!w.done?`<span class="concept-slope">a = ${H(m.a)}</span>`:`${point('A')}${point('B')}`;
 return `<div class="concept-context ${(showGraph?'with-graph':'concept-data')+(direction?' behavior-context':'')}">${heading}${direction?'<p class="behavior-given-label">'+(p.representation==='slope'&&!w.done?'Gegeven is de richtingscoëfficiënt:':'Twee punten van de rechte zijn:')+'</p>':''}<div class="concept-givens">${givens}</div>${showGraph?`<div class="concept-graph">${graph(p,{alternatives:revealed&&m.kind==='identical'})}</div>`:''}${formula?`<div class="concept-formula">${formula}</div>`:''}${note?`<p class="concept-note">${note}</p>`:''}</div>`;
}
root.RechtenConceptUI={context};
})(globalThis);
