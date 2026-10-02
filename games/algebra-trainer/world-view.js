(()=>{
'use strict';
const W=AlgebraWorld,esc=AlgebraCore.escapeHTML;
function illustration(w){
 const ground='<ellipse cx="60" cy="76" rx="49" ry="11" fill="#9cc2b5"/><path d="M12 72Q22 54 42 60T83 57Q102 60 109 72Q91 85 58 83Q27 84 12 72" fill="#d5dfad"/><path d="M24 88q15 5 28 0m18 2q12 3 23-2" fill="none" stroke="#6cabb9" stroke-width="3" stroke-linecap="round"/>';
 const scenes={
  balance:'<path d="M60 30v39M42 70h36M33 37h54M38 37l-12 23h24L38 37m44 0L70 60h24L82 37" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><circle cx="60" cy="29" r="5" fill="#e5b75c"/>',
  steps:'<path d="M29 67V37l14-11 14 11v30m5 0V29l14-10 15 10v38" fill="#dfc693" stroke="currentColor" stroke-width="3"/><path d="M38 41h10m-10 9h10m24-13h9m-9 10h9m-9 10h9" stroke="currentColor" stroke-width="4"/><path d="M48 68q7-9 17 0" fill="none" stroke="#f8f3dd" stroke-width="5"/>',
  brackets:'<path d="M25 68V42l35-21 35 21v26" fill="#c4b6d2" stroke="currentColor" stroke-width="3"/><path d="M24 43h73" stroke="currentColor" stroke-width="4"/><text x="60" y="65" text-anchor="middle" font-family="Georgia" font-size="26" fill="currentColor">(x)</text>',
  both:'<path d="M17 68q43-64 86 0M17 59h86M26 60v10m17-10v7m17-7v7m17-7v7m17-7v10" fill="none" stroke="currentColor" stroke-width="4"/><path d="M36 34h46m-8-6 8 6-8 6" fill="none" stroke="#c58b3a" stroke-width="4"/>',
  powers:'<path d="m20 71 30-43 15 17 13-27 30 53" fill="#89a596" stroke="currentColor" stroke-width="3"/><path d="m37 47 13-19 15 17-11-4-7 7m19-3 12-27 10 19-10-4" fill="#faf8ef"/><text x="60" y="70" text-anchor="middle" font-family="Georgia" font-size="22" fill="#faf8ef">x²</text>',
  roots:'<path d="M34 71V35m26 36V25m26 46V39" stroke="#806d4b" stroke-width="5"/><path d="m18 52 16-30 16 30zm21-7 21-35 21 35zm31 12 16-29 16 29z" fill="#74a98d" stroke="currentColor" stroke-width="2"/><text x="60" y="73" text-anchor="middle" font-family="Georgia" font-size="25" fill="currentColor">√</text>',
  scientific:'<path d="M38 70h44l-9-9V36H47v25z" fill="#b6a6cb" stroke="currentColor" stroke-width="3"/><path d="M40 36a20 20 0 0 1 40 0z" fill="#d8cbee" stroke="currentColor" stroke-width="3"/><path d="m64 19 12-9 4 4-12 9" stroke="currentColor" stroke-width="4"/><path d="m25 19 2-6 2 6 6 2-6 2-2 6-2-6-6-2zm70 18 2-5 2 5 5 2-5 2-2 5-2-5-5-2z" fill="#d5ad4f"/>',
  systems:'<path d="M18 32 102 70M26 76 91 26" stroke="#f7f4ec" stroke-width="13"/><path d="M18 32 102 70M26 76 91 26" stroke="currentColor" stroke-width="3" stroke-dasharray="5 5"/><circle cx="60" cy="51" r="8" fill="#d5ad4f"/>'
 };
 return '<svg viewBox="0 0 120 100" aria-hidden="true">'+ground+(scenes[w.id]||'<text x="60" y="60" text-anchor="middle" font-size="32" fill="currentColor">'+esc(w.icon||'x')+'</text>')+'</svg>';
}
function cachedOperations(){
 try{const a=AxiomaGame.account,key='axioma:progress:v2:'+encodeURIComponent(window.AXIOMA_CONFIG?.url||'offline')+':'+(a?a.role+':'+a.id:'guest')+':bewerkingen-trainer';const record=JSON.parse(localStorage.getItem(key)||'null');return {record,save:JSON.parse(record?.state?.storage?.['leraarbob.bewerkingen.v1']||'null')};}catch{return {record:null,save:null};}
}
function mount(api){
 let selectedWorld=api.location?.()||null,other=cachedOperations().save,loadFailed=false;
 const host=document.getElementById('worldHost');
 const systems=()=>{try{return JSON.parse(AxiomaGame.storage.getItem('leraarbob.stelsels.workshop.v1')||'null')}catch{return null}};
 const progress=()=>W.merge(api.progress(),other?.journey,systems()?.journey);
 const legacy=()=>[...api.solved().map(id=>'eq-'+id),...(other?.worldLegacy||other?.solved||[]).map(id=>'op-'+id)];
 function done(t){const r=progress().topics[t.id];return t.engine==='operations'?r?.answers.length===W.GOAL:!!r?.finished;}
 function counts(w){return w.topics.filter(done).length;}
 function start(id){const t=W.topic(id);if(!t||!W.unlocked(progress(),id,legacy()))return;
  if(t.engine==='equations'){api.start(id);return;}
  const url=t.engine==='operations'?new URL('../bewerkingen-trainer/',location.href):new URL('stelsels.html',location.href);url.searchParams.set('topic',id);location.href=url.href;
 }
 function nextTopic(){return W.topics.find(t=>W.unlocked(progress(),t.id,legacy())&&!done(t))||W.topics.find(t=>W.unlocked(progress(),t.id,legacy())&&!progress().topics[t.id]?.rewarded)||W.topics[0];}
 function render(){
  const p=progress(),old=legacy(),total=W.topics.filter(done).length;
  const badge=document.getElementById('algebraProgress');badge.dataset.platformProgress='xp';badge.dataset.value=String(W.xp(p));badge.textContent=W.xp(p)+' XP';
  if(selectedWorld){
   const w=W.world(selectedWorld);host.innerHTML=`<button class="softbtn worldBack" data-world-back>← Alle subwerelden</button><div class="worldHero"><div><div class="kicker">${esc(w.subject)}</div><h1>${esc(w.title)}</h1><p>${esc(w.description)}</p></div><div class="worldScore"><strong>${counts(w)} / ${w.topics.length}</strong><small>haltes afgerond</small></div></div><p class="worldHint">Elke missie bevat ${w.engine==='operations'?W.GOAL:5} opdrachten. Ontdek, oefen, produceer en pas toe. Je ziet achteraf wat zelfstandig lukte en waar hulp nodig was.</p><ol class="topicRoute">${w.topics.map((t,i)=>{
    const available=W.unlocked(p,t.id,old),r=p.topics[t.id],finished=done(t),run=api.run?.(t.id)||(t.engine==='systems'?systems()?.systemRuns?.[t.id]:null),started=run&&!run.completed;
    const required=W.topic(t.requires.find(id=>!W.complete(p,id,old)));
    const status=started?'Bezig'+(finished?' · herhaling':'')+' · '+(run.results?run.results.filter(r=>r.done).length:Object.values(run.work||{}).filter(s=>s.done).length)+' / 5 opdrachten':finished?'Afgerond · '+W.REWARD+' XP':!available?'Speel eerst “'+(required?.title||'het vorige topic')+'”.':old.includes(t.id)||r?.answers.length?'Eerder geoefend · begin de nieuwe missie.':'Beschikbaar · '+(t.engine==='operations'?W.GOAL:5)+' opdrachten';
    return `<li class="topicCard ${available?'':'locked'}"><span class="topicNumber" aria-hidden="true">${finished?'✓':started?'◐':i+1}</span><div><h2>${esc(t.title)}</h2><p class="topicExample">${esc(t.example)}</p><p class="topicGoal">${esc(t.engine==='equations'?AlgebraLearning.goals[t.skill]:t.engine==='systems'?({graphic:'Verbind twee vergelijkingen met hun rechten en vind de gezamenlijke oplossing.',substitution:'Maak een onbekende vrij en vervang die in de andere vergelijking.',combination:'Combineer twee geldige veelvouden om een onbekende te elimineren.',unique:'Vind het paar dat aan beide vergelijkingen voldoet.',none:'Toon waarom geen paar aan beide vergelijkingen voldoet.',infinite:'Herken twee vergelijkingen van dezelfde rechte.'})[t.skill]:t.title)}</p><div class="topicStatus">${esc(status)}</div><button class="${available?'primarybtn':'softbtn'}" data-topic="${t.id}" ${available?'':'disabled'}>${!available?'Nog gesloten':started?'Hervat missie →':finished?'Opnieuw oefenen':'Begin missie →'}</button></div></li>`;
   }).join('')}</ol>`;
  }else{
   const next=nextTopic(),resume=api.canResume();
   host.innerHTML=`<div class="worldHero"><div><div class="kicker">Jouw algebrawereld</div><h1>Jouw leerroute</h1><p>Kies een leergebied. Elke halte heeft één doel en een korte missie met verschillende opdrachten.</p></div><div class="worldScore"><strong>${W.xp(p)} XP</strong><small>${total} / ${W.topics.length} haltes afgerond</small></div></div><div class="worldContinue"><div><strong>${resume?'Je missie staat klaar':esc(next.title)}</strong><p>${resume?'Ga verder waar je gebleven was.':esc(W.world(next.world).title)+' · '+(next.engine==='operations'?W.GOAL:5)+' opdrachten'}</p></div><button class="primarybtn" ${resume?'data-resume':'data-topic="'+next.id+'"'}>${resume?'Hervat oefening →':'Begin hier →'}</button></div><h2 class="worldSectionTitle">Vergelijkingen & stelsels</h2><div class="worldMap">${W.worlds.filter(w=>w.engine!=='operations').map(island).join('')}</div><h2 class="worldSectionTitle">Machten, wortels & getallen</h2><div class="worldMap">${W.worlds.filter(w=>w.engine==='operations').map(island).join('')}</div>${loadFailed?'<p class="worldHint">De bewaarde voortgang van Machten & wortels kon niet online worden opgehaald. Je ziet de gegevens die op dit toestel beschikbaar zijn.</p>':''}<p class="worldHint">Elke afgeronde halte levert één keer ${W.REWARD} XP op. Afronden is geen bewijs van beheersing. Eerder geoefende vormen blijven toegankelijk. Oefenbladen en klasbattles vind je bij Werkvormen.</p>`;
  }
  function island(w){const n=counts(w),available=w.topics.some(t=>W.unlocked(p,t.id,old));const required=W.topic(w.requires.find(id=>!W.complete(p,id,old)));return `<button class="island" data-world="${w.id}" data-color="${w.color}" aria-label="${esc(w.title+' · '+w.subject)}"><span class="islandIcon" aria-hidden="true">${illustration(w)}</span><span class="islandInfo"><span class="islandSubject">${esc(w.subject)}</span><strong>${esc(w.title)}</strong><small>${esc(w.description)}</small><span class="islandProgress" aria-hidden="true"><i style="width:${100*n/w.topics.length}%"></i></span><small>${available?n+' / '+w.topics.length+' topics · ontdek de route':'Nog gesloten · speel eerst '+esc(required?.title||'de vorige route')}</small></span><span class="islandArrow" aria-hidden="true">${available?'→':'⌁'}</span></button>`;}
 }
 host.addEventListener('click',e=>{if(!AxiomaGame.active)return;const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-world-back')){selectedWorld=null;api.remember?.(selectedWorld);render();}
  if(b.dataset.world){selectedWorld=b.dataset.world;api.remember?.(selectedWorld);render();}
  if(b.dataset.topic)start(b.dataset.topic);
  if(b.hasAttribute('data-resume'))api.resume();
  if(b.dataset.world||b.hasAttribute('data-world-back')){host.closest('.main').scrollTop=0;host.querySelector('h1').tabIndex=-1;host.querySelector('h1').focus({preventScroll:true});}
 });
 async function refreshOther(){const a=AxiomaGame.account;if(a?.role!=='student')return;
  try{const loaded=await AxiomaProgress.load('bewerkingen-trainer',a.id);if(!AxiomaGame.active||AxiomaGame.account?.id!==a.id)return;const cache=cachedOperations();if(cache.record?.dirty)other=cache.save;else if(loaded?.gameId==='bewerkingen-trainer')other=JSON.parse(loaded.state?.storage?.['leraarbob.bewerkingen.v1']||'null');render();}catch{loadFailed=true;render();}
 }
 render();refreshOther();
 return {render,open:id=>{selectedWorld=W.world(id)?id:null;api.remember?.(selectedWorld);render();},progress,legacy};
}
window.AlgebraWorldView=Object.freeze({mount});
})();
