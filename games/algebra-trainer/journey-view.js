(()=>{
'use strict';
const J=AlgebraJourney,W=AlgebraWorld,esc=AlgebraCore.escapeHTML;
function mount(api){
 const host=document.getElementById('worldHost');
 function systems(){try{return JSON.parse(AxiomaGame.storage.getItem('leraarbob.stelsels.workshop.v1')||'null')}catch{return null}}
 const progress=()=>W.merge(api.progress(),systems()?.journey),legacy=()=>api.solved().map(id=>'eq-'+id);
 function completed(s){return J.stop(s.id)?J.info(api.chapter(),s.id,api.runs(),api.progress(),api.solved()).finished:!!systems()?.journey?.topics?.[s.id]?.finished;}
 function render(){
  const ready=J.worlds.filter(w=>w.ready),future=J.worlds.filter(w=>!w.ready);
  host.innerHTML='<div class="worldOverview"><header class="algebraRouteHeading"><div><h1>Algebra</h1><p>Kies een wereld. Selecteer daarna een level en druk op Spelen.</p></div><span class="worldAvailability">2 werelden beschikbaar</span></header><div class="worldCards">'+ready.map((w,i)=>{
   const done=w.stops.filter(completed).length;
   return '<button type="button" class="worldCard" data-world="'+w.id+'"><span class="menuStopHeading"><span class="menuStopNumber">'+String(i+1).padStart(2,'0')+'</span><strong>'+esc(w.title)+'</strong></span><span class="worldExample">'+(w.id==='equations'?'3x + 6 = 18':'x + y = 5<br>x − y = 1')+'</span><span class="worldDescription">'+esc(w.goal)+'</span><span class="worldCardFoot"><span>'+done+' / '+w.stops.length+' levels geoefend</span><strong>Levels bekijken →</strong></span></button>';
  }).join('')+'</div><section class="futureWorlds" aria-label="Werelden in voorbereiding"><h2>In voorbereiding</h2><div>'+future.map(w=>'<article><h3>'+esc(w.title)+'</h3><p>'+esc(w.goal)+'</p><span>Binnenkort</span></article>').join('')+'</div></section></div>';
 }
 host.addEventListener('click',e=>{const b=e.target.closest('[data-world]');if(b&&AxiomaGame.active)api.openWorld(b.dataset.world);});
 render();return {render,open:id=>{api.remember(J.worldFor(id));render();},progress,legacy};
}
window.AlgebraWorldView=Object.freeze({mount});
})();
