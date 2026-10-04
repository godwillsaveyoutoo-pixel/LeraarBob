(()=>{
'use strict';
const J=AlgebraJourney,W=AlgebraWorld,esc=AlgebraCore.escapeHTML;
function mount(api){
 const host=document.getElementById('worldHost');let selectedWorld=J.worldFor(api.location()),selectedStop=null;
 function systems(){try{return JSON.parse(AxiomaGame.storage.getItem('leraarbob.stelsels.workshop.v1')||'null')}catch{return null}}
 const progress=()=>W.merge(api.progress(),systems()?.journey),legacy=()=>api.solved().map(id=>'eq-'+id);
 function info(s){
  if(J.stop(s.id))return J.info(api.chapter(),s.id,api.runs(),api.progress(),api.solved());
  const r=systems()?.systemRuns?.[s.id],e=systems()?.journey?.topics?.[s.id];
  const started=!!r&&!r.completed,finished=!!e?.finished,independent=finished&&e.evidence?.filter(x=>!x.supported&&!x.errors).length>=3;
  return {started,finished,independent,done:Object.values(r?.work||{}).filter(x=>x.done).length,status:started?'Bezig':independent?'Zelfstandig gelukt':finished?'Geoefend':'Nog te oefenen'};
 }
 function render(){
  const w=J.world(selectedWorld)||J.world('equations');selectedWorld=w.id;
  const stops=w.stops||[],suggested=w.id==='equations'?J.next(api.chapter(),api.runs(),api.progress(),api.solved()):stops.find(s=>!info(s).finished);
  if(!stops.some(s=>s.id===selectedStop))selectedStop=(w.id==='equations'?stops.find(s=>s.id===api.current?.()||s.skills?.some(k=>'eq-'+k===api.current?.())):null)?.id||(suggested||stops[0])?.id;
  const chosen=stops.find(s=>s.id===selectedStop),state=chosen&&info(chosen),done=stops.filter(s=>info(s).finished).length;
  const totalXP=W.xp(progress())+J.xp(api.chapter());
  const points=stops.map((s,i)=>({x:(i+.5)*1000/stops.length,y:i%2?102:62}));
  host.innerHTML=`<div class="journeyMap">
   <nav class="worldShelf" aria-label="Kies je wereld">${J.worlds.map(v=>{
    const n=(v.stops||[]).filter(s=>info(s).finished).length;
    return `<button type="button" class="worldChoice ${v.id===w.id?'selected':''}" data-world="${v.id}" aria-pressed="${v.id===w.id}" aria-controls="journeyRoute"><span class="worldName">${esc(v.title)}</span><span class="worldCount">${v.ready?n+' / '+v.stops.length+' haltes':'Binnenkort'}</span>${v.ready?`<span class="worldMeter" aria-hidden="true"><i style="width:${100*n/v.stops.length}%"></i></span>`:''}</button>`;
   }).join('')}</nav>
   <header class="routeHeading"><h1>${esc(w.title)}</h1><span>${w.ready?done+' / '+stops.length+' geoefend':'In opbouw'}</span><output aria-label="Verdiende ervaringspunten">${totalXP} XP</output></header>
   <section id="journeyRoute" class="routeField" aria-label="Haltes in ${esc(w.title)}">
    ${w.ready?`<svg class="routeTrail" viewBox="0 0 1000 210" preserveAspectRatio="none" aria-hidden="true"><path d="${points.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(' ')}"/></svg><ol class="routeStops">${stops.map((s,i)=>{
     const r=info(s),mark=r.independent?'★':r.finished?'✓':r.started?'◐':i+1;
     return `<li style="--rise:${i%2?1:0}"><button type="button" data-stop="${s.id}" class="routeStop ${s.id===selectedStop?'selected':''} ${r.finished?'finished':''} ${r.independent?'independent':''}" aria-pressed="${s.id===selectedStop}" aria-label="Halte ${i+1}: ${esc(s.title)}. ${esc(r.status)}"><span class="stopStone" aria-hidden="true">${mark}</span><strong>${esc(s.short||s.title)}</strong><span class="stopStatus">${esc(r.status)}</span></button></li>`;
    }).join('')}</ol>`:`<div class="comingWorld"><h2>Deze wereld groeit nog.</h2><p>${esc(w.goal)}</p><button class="softbtn" data-world="equations">Speel Vergelijkingen →</button></div>`}
   </section>
   <footer class="routeDock">${chosen?`<div class="chosenStop" role="status"><strong>Halte ${stops.indexOf(chosen)+1} · ${esc(chosen.title)}</strong><span>${state.started?'Hervat bij opdracht '+Math.min(state.done+1,state.total||5)+' van '+(state.total||5):esc(chosen.goal||w.goal)}</span></div><button class="primarybtn" data-start="${state.started&&state.activeId?state.activeId:chosen.id}">${state.started?'Hervat deze halte':state.finished?'Nieuwe reeks voor deze halte':'Begin deze halte'} →</button>`:`<p>Speelbare werelden: Vergelijkingen en Stelsels.</p>`}</footer>
   <div class="routeLegend"><span>○ Nog te oefenen</span><span>◐ Bezig</span><span>✓ Geoefend</span><span>★ Zelfstandig gelukt</span></div>
  </div>`;
 }
 host.addEventListener('click',e=>{
  if(!AxiomaGame.active)return;const b=e.target.closest('button');if(!b)return;
  if(b.dataset.world){selectedWorld=b.dataset.world;selectedStop=null;api.remember(selectedWorld);render();host.querySelector(`[data-world="${selectedWorld}"]`)?.focus({preventScroll:true});}
  if(b.dataset.stop){selectedStop=b.dataset.stop;render();host.querySelector(`[data-stop="${selectedStop}"]`)?.focus({preventScroll:true});}
  if(b.dataset.start){if(J.stop(b.dataset.start)||W.topic(b.dataset.start)?.engine==='equations')api.start(b.dataset.start);else location.href='stelsels.html?topic='+encodeURIComponent(b.dataset.start);}
 });
 render();
 return {render,open:id=>{selectedWorld=J.worldFor(id);selectedStop=null;api.remember(selectedWorld);render();},progress,legacy};
}
window.AlgebraWorldView=Object.freeze({mount});
})();
