/* Presentation only. World access follows the prerequisite chain from area-maps.js. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('./workbench.js'),require('../content/area-maps.js'));else root.RechtenV2Shell=factory(root.RechtenV2Workbench,root.RechtenV2Areas)})(globalThis,function(C,A){
'use strict';
const esc=C.esc;
const places=Object.freeze([
 {id:'puntenbaai',name:'Puntenbaai',number:1,art:0,caption:'Coördinaten',family:'F1'},
 {id:'hellingrug',name:'Hellingrug',number:2,art:1,caption:'Richting en helling',family:'F2'},
 {id:'grenspas',name:'Grenspas',number:3,art:3,caption:'Nulwaarden en tekens',family:'F6'},
 {id:'formulewerf',name:'Formulewerf',number:4,art:4,caption:'Voorschriften',family:'F7'},
 {id:'signaalstad',name:'Signaalstad',number:5,art:2,caption:'Functies en grafieken',family:'F3'}
]);
const worldCopy=Object.freeze({
 puntenbaai:{subtitle:'Van losse punten naar een rechte',bottom:'Punten, coördinaten en rechte lijnen'},
 hellingrug:{subtitle:'Richting geeft vorm aan de wereld',bottom:'De helling van een rechte (stijgen en dalen)'},
 grenspas:{subtitle:'Boven en onder een rechte',bottom:'Ongelijkheden, snijpunten en verschuiven'},
 formulewerf:{subtitle:'Bouw de wereld met y = ax + b',bottom:'Van punten en tabellen naar y = ax + b'},
 signaalstad:{subtitle:'Eén functie, vier gezichten',bottom:'Grafiek, tabel, voorschrift en situatie in één'}
});
function icon(name,size=24){const paths={
 fullscreen:'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5',fullscreenExit:'M3 8h5V3M21 8h-5V3M8 21v-5H3M16 21v-5h5',
 menu:'M4 6h16M4 12h16M4 18h16',profile:'M8 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0M4 22c0-9 16-9 16 0',
 arrow:'M4 12h15M13 5l7 7-7 7',back:'M20 12H5M11 5l-7 7 7 7',chevron:'M9 5l7 7-7 7',
 lock:'M6 10h12v11H6zM8 10V6a4 4 0 0 1 8 0v4',check:'M5 12l4 5L20 5',
 map:'M3 5l6-3 6 3 6-3v17l-6 3-6-3-6 3zM9 2v17M15 5v17',
 graph:'M4 3v17h18M2 15l7-5 5 2 7-9',calculator:'M5 2h14v20H5zM8 5h8v4H8zM8 13h1M12 13h1M16 13h1M8 17h1M12 17h1M16 17h1',
 table:'M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18',
 light:'M8 15c-6-6-1-13 4-13s10 7 4 13l-1 3H9zM9 22h6M12 0v-2',
 undo:'M8 7H3V2M3 7c8-9 22 6 11 13',close:'M6 6l12 12M18 6L6 18',
 flag:'M6 22V3c5-4 8 5 14 0v10c-6 5-9-4-14 0',fire:'M13 2c2 6-4 7-1 11 1-3 4-4 5-6 8 11 1 16-5 16C5 23 1 16 6 10c-1 4 3 5 4 2-3-5 2-7 3-10z'
 };return `<svg class="ui-icon" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name]||paths.graph}"/></svg>`}
function logo(){return `<svg class="brand-pencil" viewBox="0 0 28 52" aria-hidden="true"><path d="M3 43 20 7l7 4-18 35-6 4z" fill="#387fa4" stroke="#263e4c" stroke-width="2"/><path d="m3 43 6 3-6 4z" fill="#e9c994"/><path d="m20 7 2-4q2-3 5-1l1 3-1 6z" fill="#df8652"/><path d="m8 39 13-27" stroke="#c8ebf4" stroke-width="2"/></svg><span class="brand-lettering">leraarBob<small>TRAINER</small></span>`}
function route(state){return state.screen==='world'&&state.settings?.shell?.area?(A.selection(state).stop?'stop':'area'):state.screen}
function progress(state){const m=state.missions?.grenspas,done=(m?.completion||[]).filter(c=>c.variant===0||c.variant===1).length;const recorded=state.events?.some(e=>e.skill==='sign'&&e.correct&&((e.variant===0&&e.attemptId.startsWith('symbol:'))||(e.variant===1&&e.phase==='transfer')));const practice=Object.values(state.missions||{}).filter(x=>x.world==='grenspas'&&x.skill),finished=A.statuses(state,'grenspas').completed;return {m,done:done+finished,started:!!m||practice.length>0,complete:done>0||!!m?.completed||!!recorded||finished>0,phase:m?.phase||practice[0]?.phase||'root'};}
function header(state,{menuOpen=false,legacy=null,mission=false}={}){
 const screen=route(state),inArea=screen==='area'||screen==='stop'||mission,selected=A.selection(state),hillMission=mission&&['delta','slope','slope_from_two_points','line_behavior','special_lines'].includes(state.active),pointMission=mission&&state.missions?.[state.active]?.world==='puntenbaai',signalMission=mission&&state.active==='graph_from_table',formulaMission=mission&&state.missions?.[state.active]?.world==='formulewerf',areaName=mission?(signalMission?'Signaalstad':formulaMission?'Formulewerf':hillMission?'Hellingrug':pointMission?'Puntenbaai':'Grenspas'):selected.area.name,areaId=mission?(signalMission?'signaalstad':formulaMission?'formulewerf':hillMission?'hellingrug':pointMission?'puntenbaai':'grenspas'):selected.id,raw=legacy?.state||legacy;
 const summaries=places.map(p=>A.statuses(state,p.id,legacy)),completed=summaries.reduce((sum,p)=>sum+p.playableCompleted,0),total=summaries.reduce((sum,p)=>sum+p.playableTotal,0);
 const xp=Math.max(0,Number(state.platformXp)||0),stats=`<output hidden data-platform-progress="xp" data-value="${xp}" data-total="${total}">${xp} XP · ${completed}/${total} levels afgerond</output>`;
 return `<header class="atlas-header"><a href="../../../" class="atlas-brand" aria-label="leraarBob, naar het hoofdmenu van de website">${logo()}</a><nav class="breadcrumbs" aria-label="Broodkruimelpad"><a href="#wereld" data-screen="world">${inArea?'Rechten':'Wereldkaart'}</a>${inArea?`${icon('chevron',17)}<a href="#${areaId}" data-screen="area" data-area="${areaId}" ${screen==='area'?'aria-current="page"':''}>${areaName}</a>`:''}${mission?`${icon('chevron',17)}<span class="crumb-question" aria-current="page">${signalMission?'Rechte uit tabel':formulaMission?({equation_from_ab:'Voorschrift uit a en b',graph_from_equation:'Rechte uit voorschrift',equation_from_graph:'Voorschrift uit grafiek',rewrite_linear_equation:'Vergelijking herschrijven',intercept_from_point:'b uit helling en punt',equation_from_point_slope:'Voorschrift uit helling en punt',equation_from_two_points:'Voorschrift uit twee punten',equation_from_table:'Voorschrift uit tabel'})[state.active]:hillMission?({delta:state.missions[state.active].phase==='hill-dy'?'Δy':'Δx en Δy',slope:'Richtingscoëfficiënt',slope_from_two_points:'Helling uit twee punten',line_behavior:'Stijgend, dalend of constant',special_lines:'Bijzondere rechten'}[state.active]):pointMission?(state.active==='point'?'Coördinaten lezen':'Coördinaten plaatsen'):({zeroRead:'Nulwaarde aflezen',zero:'Nulwaarde berekenen',signchart:'Tekenschema',positive:'Wanneer is f(x) &gt; 0?',negative:'Wanneer is f(x) &lt; 0?'})[state.active]||'Wanneer is f(x) '+(state.missions?.grenspas?.task.ask==='negative'?'&lt;':'&gt;')+' 0?'}</span>`:''}${screen==='book'?`${icon('chevron',17)}<span aria-current="page">Spelvoortgang</span>`:''}${screen==='profile'?`${icon('chevron',17)}<span aria-current="page">Profiel</span>`:''}</nav>${stats}<div class="atlas-actions"><button type="button" class="icon-button fullscreen-toggle" data-fullscreen aria-label="Volledig scherm" title="Volledig scherm" aria-pressed="false">${icon('fullscreen',22)}</button><button type="button" class="icon-button" data-screen="profile" aria-label="Profiel">${icon('profile',29)}</button><button type="button" class="icon-button" id="menu" aria-label="Menu" aria-controls="main-menu" aria-expanded="${menuOpen}">${icon(menuOpen?'close':'menu',29)}</button></div><nav class="atlas-menu" id="main-menu" aria-label="Hoofdmenu" ${menuOpen?'':'hidden'}><a href="worksheets.html" data-nav-group="learning" data-nav-icon="pencil">Oefenbladen · Hellingrug</a><a href="learn.html" data-nav-group="learning" data-nav-icon="classroom">Samen leren · duo of trio</a><a href="online.html" data-nav-group="multiplayer" data-nav-icon="battle">Online duel</a><a href="battle.html" data-nav-group="multiplayer" data-nav-group-label="Samen spelen" data-nav-icon="battle" data-nav-tone="amber">Duo · op dit toestel</a><a href="classroom.html" data-nav-group="multiplayer" data-nav-group-label="Samen spelen" data-nav-icon="classroom" data-nav-tone="blue">Klasbattle</a><button type="button" data-screen="book" data-nav-group="progress" data-nav-group-label="Voortgang" data-nav-icon="chart" data-nav-tone="green">${icon('graph')}Spelvoortgang</button><button type="button" data-screen="profile" data-nav-hidden>${icon('profile')}Profiel</button></nav></header>`;
}
function sprite(place){return `<span class="island-art art-${place.art}" aria-hidden="true"></span>`}
function sea(){return `<div class="sea-atmosphere" aria-hidden="true"><svg class="horizon" viewBox="0 0 1600 250" preserveAspectRatio="none"><path d="M0 190 110 126l84 43 98-114 94 109 48-27 128 62 210-124 144 96 117-80 93 64 182-142 143 142 49-41v137H0z" fill="#88b7c9" opacity=".2"/><path d="M870 68c8-43 59-43 66-10 8-10 29-8 33 9h48M350 90c9-22 36-22 41-5 5-35 57-30 57 0 17-14 34-4 39 5h60" fill="none" stroke="#f7fcf7" stroke-width="8" stroke-linecap="round" opacity=".65"/></svg></div>`}
function world(state,options){
 const summaries=new Map(places.map(p=>[p.id,A.statuses(state,p.id,options?.legacy)])),
       completed=places.reduce((sum,p)=>sum+summaries.get(p.id).playableCompleted,0),
       total=places.reduce((sum,p)=>sum+summaries.get(p.id).playableTotal,0),
       recommended=A.recommendation(state,options?.legacy);
 const statusFor=place=>{
   const summary=summaries.get(place.id);
   return place.id==='puntenbaai'?'prior':
     !summary.unlocked?'locked':
     summary.complete?'completed':
     !summary.playableTotal?'soon':
     place.id===recommended.id&&recommended.node?'current':'available';
 };
 const islandStatus=place=>{
   const summary=summaries.get(place.id),status=statusFor(place);
   if(status==='prior')return summary.complete?`Voorkennis · ${summary.playableCompleted} / ${summary.playableTotal} afgerond`:'Voorkennis · vrij herhalen';
   if(status==='locked')return `Vergrendeld · eerst ${A.get(summary.prerequisite).name} afronden`;
   if(status==='soon')return 'Komt later';
   if(status==='current')return `Verder · ${summary.playableCompleted} / ${summary.playableTotal} afgerond`;
   return `${summary.playableCompleted} / ${summary.playableTotal} afgerond`;
 };
 const islands=places.map(place=>{
   const status=statusFor(place),summary=summaries.get(place.id);
   const locked=status==='locked',action=locked?'disabled aria-disabled="true"':`data-screen="area" data-area="${place.id}"`;
   return `<button type="button" class="island-node place-${place.id} is-${status}" data-world-node="${place.id}" data-state="${status}" ${action} aria-label="${place.name}. ${islandStatus(place)}${locked?'.':'. Openen'}">
    <img class="island-art world-island-art" src="assets/world-home/${place.id}.webp" alt="" aria-hidden="true" draggable="false">
    ${status==='current'?'<span class="current-rays" aria-hidden="true"></span>':''}
    <span class="island-marker" aria-hidden="true">${place.number}${status==='completed'||status==='prior'&&summary.complete?'<span class="island-check">'+icon('check',13)+'</span>':''}${locked?'<span class="island-lock">'+icon('lock',13)+'</span>':''}</span>
    <span class="island-label">${place.name}<small>${islandStatus(place)}</small></span>
   </button>`;
 }).join('');
 const nextName=A.get(recommended.id).name;
 return `<div class="atlas-page world-page">${header(state,options)}
  <main class="atlas-main">
   ${sea()}
   <section class="map-intro">
    <span class="tape-label">RECHTEN</span>
    <h1 id="world-title" tabindex="-1">Rechtenwereld</h1>
    <p>Volg het pad.<br>Of kies zelf een level.</p>
   </section>
   <div class="world-map" aria-label="Wereldkaart van Rechtenwereld">
    <div class="world-stage">
     <svg class="map-paths map-paths-wide" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
      <path d="M150 670 C235 600 300 385 410 310 C505 245 565 340 470 760 C560 700 650 720 730 740 C805 685 845 470 850 260"/>
     </svg>
     <svg class="map-paths map-paths-tall" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
      <path d="M250 160 C390 120 610 120 750 160 C690 285 610 385 500 480 C385 585 300 680 250 800 C410 765 600 765 750 800"/>
     </svg>
     ${islands}
    </div>
    <div class="map-compass" aria-hidden="true">
     <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" stroke-width="2"/><path d="M50 7 59 42 50 50 41 42zM50 93 41 58 50 50 59 58zM7 50 42 41 50 50 42 59zM93 50 58 59 50 50 58 41z" fill="currentColor" opacity=".72"/><circle cx="50" cy="50" r="5" fill="currentColor"/><text x="50" y="10" text-anchor="middle" font-size="10" fill="currentColor">N</text></svg>
    </div>
   </div>
  </main>
  <footer class="atlas-footer">
   <button type="button" class="progress-link" data-screen="book">${icon('map',27)}<span>Spelvoortgang<span class="small-meter" role="meter" aria-label="Afgeronde levels" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${completed}"><i style="width:${total?Math.round(completed/total*100):0}%"></i></span></span>${icon('chevron',18)}</button>
   <span class="footer-context">${recommended.node?(recommended.resume?'Verder in: ':'Volgende: '):'Vrij oefenen: '}<strong>${nextName}</strong></span>
   <button type="button" class="paint-button" id="start-recommended" aria-label="Naar ${nextName}" ${recommended.resume?nodeAction(recommended.node,recommended.id,recommended.zone):`data-screen="area" data-area="${recommended.id}" data-zone="${recommended.zone}"`}><span class="route-label">Verder</span><span class="route-label-compact">Verder</span>${icon('arrow',27)}</button>
  </footer>
 </div>`
}
const stateText={current:'Volgende',started:'Bezig',completed:'Afgerond',soon:'Komt later',locked:'Vergrendeld',available:'Vrij te kiezen'};
const statusLabel=n=>n.state==='completed'?'Afgerond':n.state==='started'?'Bezig':n.state==='available'?'Vrij':stateText[n.state];
function nodeAction(n,id,zone){return n.state==='locked'?'disabled aria-disabled="true"':n.playable?`data-start="${id}"${id==='formulewerf'||id==='signaalstad'?` data-formula-skill="${n.id}"`:id==='grenspas'?` data-grens-skill="${n.key}"`:['puntenbaai','hellingrug'].includes(id)?` data-point-skill="${n.id}"`:''}`:`data-screen="stop" data-area="${id}" data-zone="${zone}" data-stop="${n.key}"`}
function area(state,options){const {id,area:a,zone}=A.selection(state),summary=A.statuses(state,id,options?.legacy),nodes=summary.nodes.filter(n=>zone.nodes.some(s=>s.key===n.key)),recommended=nodes.find(n=>n.recommended),routeNext=A.recommendation(state,options?.legacy);
 const formula=id==='formulewerf',nextZone=summary.recommended&&a.zones.find(z=>z.nodes.some(n=>n.key===summary.recommended.key)),prerequisiteName=summary.prerequisite?A.get(summary.prerequisite).name:'';
 const nextAction=!summary.unlocked?`<button type="button" class="paint-button" data-screen="world">Terug naar wereldkaart ${icon('arrow',27)}</button>`:id==='puntenbaai'?`<button type="button" class="paint-button" data-screen="area" data-area="hellingrug">Naar Hellingrug ${icon('arrow',27)}</button>`:recommended?`<button type="button" class="paint-button" ${nodeAction(recommended,id,zone.id)}>${recommended.started?'Verder met':'Oefen'} level ${recommended.number} ${icon('arrow',27)}</button>`:formula&&summary.recommended?`<button type="button" class="paint-button" data-screen="area" data-area="formulewerf" data-zone="${nextZone.id}">Naar werkplaats ${nextZone.badge} ${icon('arrow',27)}</button>`:routeNext.node&&routeNext.id!==id?`<button type="button" class="paint-button" data-screen="area" data-area="${routeNext.id}" data-zone="${routeNext.zone}">Naar ${A.get(routeNext.id).name} ${icon('arrow',27)}</button>`:`<button type="button" class="paint-button" data-screen="world">Naar wereldkaart ${icon('arrow',27)}</button>`;
 const segments=nodes.slice(1).map((n,i)=>`<path d="M${nodes[i].x*10} ${nodes[i].y*10} L${n.x*10} ${n.y*10}"/>`).join('');
 const zones=a.zones.length>1?`<nav class="area-zones" aria-label="Werkplaatsen in Formulewerf">${a.zones.map((z,i)=>`<button type="button" data-screen="area" data-area="${id}" data-zone="${z.id}" ${z===zone?'aria-current="page"':''} ${summary.unlocked?'':'disabled aria-disabled="true"'}><span>${z.badge||i+1}</span> ${z.name}</button>`).join('')}</nav>`:'';
 const introLabel=!summary.unlocked?'VERGRENDELD':formula?'FORMULEWERF · WERKPLAATS '+zone.badge:id==='puntenbaai'?'VOORKENNIS · VRIJ HERHALEN':summary.playableTotal?summary.playableTotal+' LEVELS · '+summary.playableCompleted+' AFGEROND':'LEVELS IN VOORBEREIDING';
 const introText=!summary.unlocked?`Rond eerst ${prerequisiteName} af. Daarna gaat ${a.name} open.`:id==='puntenbaai'?'Dit ken je al. Herhaal als je wilt, of ga meteen naar Hellingrug.':!summary.playableTotal?'Deze levels komen later.':formula?zone.intro:'Volg de nummers, of kies zelf. Alle beschikbare levels in deze wereld zijn open.';
 const legend=!summary.unlocked?`<div class="area-legend"><span>${icon('lock',16)} Eerst ${prerequisiteName} afronden</span></div>`:`<div class="area-legend"><span>◉ Volgende</span><span>✓ Afgerond</span><span>○ Vrij te kiezen</span></div>`;
 return `<div class="atlas-page area-page mapped-area" data-area-id="${id}" data-zone-id="${zone.id}" data-world-unlocked="${summary.unlocked}">${header(state,options)}<main class="atlas-main">${sea()}<section class="map-intro area-intro"><span class="tape-label">${introLabel}</span><h1>${formula?zone.name:a.name}</h1><p>${introText}</p>${legend}<a class="area-play-link" href="play.html?world=${id}">${id==='hellingrug'?'Leren, spelen of papier':'Leren of samen spelen'} ${icon('arrow',18)}</a></section>${zones}<div class="area-map" aria-label="${a.name}: ${zone.name}"><div class="area-stage" data-density="${nodes.length>5?'dense':'normal'}"><img class="area-island" src="assets/${a.art}-island.webp" width="1536" height="1024" alt="" fetchpriority="high"><svg class="area-paths" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">${segments}</svg>${nodes.map(n=>`<button type="button" class="skill-node skill-${n.key} is-${n.state} ${n===recommended?'is-recommended':''}${n.culmination?' is-route-finish':''}" style="--x:${n.x}%;--y:${n.y}%" data-skill="${n.id}" data-node="${n.key}" data-state="${n.state}" ${n.variant?`data-variant="${n.variant}"`:''} ${nodeAction(n,id,zone.id)} ${n===recommended?'aria-current="step"':''} aria-label="${n.number}. ${esc(n.name)}. ${stateText[n.state]}. ${n.state==='locked'?`Eerst ${prerequisiteName} afronden.`:n===recommended?'Aanbevolen volgende level. ':''}${n.state==='locked'?'':n.playable?'Oefenen':'Level bekijken'}"><span class="skill-marker"><span class="stop-number">${n.number}</span>${n.state==='completed'?'<span class="skill-check" aria-hidden="true">'+icon('check',16)+'</span>':''}${n.state==='locked'?'<span class="skill-lock" aria-hidden="true">'+icon('lock',15)+'</span>':''}</span><span class="skill-label">${n.label}<small class="level-state">${statusLabel(n)}</small></span></button>`).join('')}</div></div></main><footer class="atlas-footer"><button type="button" class="paper-pill" data-screen="world">${icon('back',25)}<span>Terug naar kaart</span></button><span class="footer-context">${!summary.unlocked?'Eerst '+prerequisiteName+' afronden':nodes.some(n=>n.playable)?nodes.filter(n=>n.playable&&n.state==='completed').length+' / '+nodes.filter(n=>n.playable).length+' afgerond'+(nodes.some(n=>!n.playable)?' · '+nodes.filter(n=>!n.playable).length+' komen later':''):nodes.length+' levels komen later'}</span>${nextAction}</footer></div>`;
}
function stop(state,options){const {id,area:a,zone,stop:n}=A.selection(state);if(!n)return area(state,options);const summary=A.statuses(state,id,options?.legacy),status=summary.nodes.find(s=>s.key===n.key),prerequisiteName=summary.prerequisite?A.get(summary.prerequisite).name:'';return `<div class="atlas-page stop-page">${header(state,options)}<main class="stop-main">${sea()}<section class="stop-paper"><span class="tape-label">${a.name} · LEVEL ${n.number}</span><h1>${esc(n.name)}</h1><span class="proof-badge">${icon(status.state==='completed'?'check':status.state==='locked'?'lock':'flag')} ${stateText[status.state]}</span>${status.state==='locked'?`<p>Rond eerst ${prerequisiteName} af. Daarna gaat ${a.name} open.</p>`:n.playable?`<button type="button" class="paint-button" ${nodeAction(status,id,zone.id)}>Oefenen ${icon('arrow')}</button>`:'<p>De oefening voor dit level komt later.</p>'}<p class="stop-note">${status.state==='locked'?`Je voortgang in ${prerequisiteName} bepaalt wanneer deze wereld opengaat.`:!n.playable?'Dit level is nog in voorbereiding.':'Binnen een vrijgespeelde wereld mag je elk beschikbaar level kiezen.'}</p></section></main><footer class="atlas-footer"><button type="button" class="paper-pill" data-screen="world">${icon('back')}Terug naar kaart</button>${summary.unlocked?`<button type="button" class="paint-button" data-screen="area" data-area="${id}" data-zone="${zone.id}" data-return-node="${n.key}">Terug naar ${a.name} ${icon('arrow')}</button>`:''}</footer></div>`}
/* Read-only overview: use the same completion evidence as the island maps.
   A replay can be in progress while its previously earned completion remains. */
function journeyProgress(state,legacy){
 const events=state.events||[],missions=state.missions||{};
 const areas=places.map(place=>{
  const area=A.get(place.id),summary=A.statuses(state,place.id,legacy);
  const nodes=summary.nodes.map(n=>{
   const m=missions[place.id==='grenspas'?n.key:n.id];
   const mission=m?.world===place.id?m:null;
   const done=n.state==='completed',started=!!mission&&!mission.completed;
   const count=(mission?.completion?.length||0)+(mission?.feedback?.result?.ok&&mission.feedback.next==='next-task'?1:0);
   const zone=area.zones.find(z=>z.nodes.some(x=>x.key===n.key));
   const prerequisiteName=summary.prerequisite?A.get(summary.prerequisite).name:'';
   const detail=!summary.unlocked&&n.playable?`Vergrendeld · eerst ${prerequisiteName} afronden`:started?`${done?'Huidige ronde · ':''}${count} ${count===1?'opgave':'opgaven'} afgerond in deze ronde`:done?(mission?.completion?.length?`${count} opgaven afgerond in deze ronde`:'Eerder afgerond'):n.playable?(place.id==='puntenbaai'?'Voorkennis · vrij herhalen':'Vrij te kiezen'):'Komt later';
   return {...n,done,started,count,index:mission?.index||0,zone:zone.id,detail,action:started?'Verder':done?'Opnieuw':'Oefenen'};
  });
  return {...place,total:summary.playableTotal,completed:summary.playableCompleted,started:nodes.filter(n=>n.started).length,unlocked:summary.unlocked,prerequisite:summary.prerequisite,nodes};
 });
 return {areas,total:areas.reduce((s,a)=>s+a.total,0),completed:areas.reduce((s,a)=>s+a.completed,0),started:areas.reduce((s,a)=>s+a.started,0),supported:events.filter(e=>e.correct&&e.supported).length,independent:events.filter(e=>e.correct&&e.independent).length};
}
function book(state,options={}){
 const p=journeyProgress(state,options.legacy),recommended=A.recommendation(state,options.legacy);
 return `<div class="atlas-page journal-page progress-page">${header(state,options)}
 <main class="journal-main"><div class="journal-scroll" tabindex="0" role="region" aria-label="Voortgang van alle eilanden">
  <section class="journey-heading"><div><span class="tape-label">MIJN VOORTGANG</span><h1>Jouw ontdekkingen</h1><p>${options.account?'Je afgeronde levels en lopende oefeningen. Puntenbaai is voorkennis; daarna speel je de werelden in volgorde vrij.':'Je oefent als gast. Je voortgang blijft bewaard in deze browser op dit toestel.'}</p></div><div class="journey-totals"><p><strong>${p.completed}<small> / ${p.total}</small></strong><span>levels afgerond</span></p><p><strong>${p.started}</strong><span>${p.started===1?'ronde bezig':'rondes bezig'}</span></p></div></section>
  <p class="journey-instruction">Open een eiland om je oefeningen te bekijken.</p>
  <div class="journey-areas">${p.areas.map(a=>`<details class="journey-area" data-progress-island="${a.id}">
   <summary>${sprite(a)}<span class="journey-area-title"><strong>${a.name}</strong><span>${!a.unlocked?'Vergrendeld · eerst '+A.get(a.prerequisite).name+' afronden':a.total?a.completed+' van '+a.total+' beschikbare levels afgerond':'Komt later'}${a.id==='puntenbaai'?' · voorkennis':''}${a.started?' · '+a.started+' bezig':''}</span><span class="small-meter" aria-hidden="true"><i style="width:${(a.total?Math.round(a.completed/a.total*100):0)}%"></i></span></span>${a.unlocked?icon('chevron',21):icon('lock',21)}</summary>
   <ol class="journey-stops">${a.nodes.map(n=>`<li data-progress-stop="${n.key}" data-completed="${n.done}" data-started="${n.started}"><span class="journey-status ${n.done?'done':n.started?'started':''}" aria-hidden="true">${n.number}${n.done?'<span class="journey-check">'+icon('check',12)+'</span>':''}</span><div class="journey-stop-text"><strong>${esc(n.name)}</strong><span>${n.done?'<b>Afgerond</b> · ':n.started?'<b>Bezig</b> · ':''}${n.started&&!n.count?`${n.done?'Huidige ronde · ':''}opgave ${n.index+1}`:esc(n.detail)}</span></div>${n.playable&&a.unlocked?`<button type="button" class="journey-practice" ${nodeAction(n,a.id,n.zone)} aria-label="${n.action}: ${esc(n.name)}">${n.action} ${icon('arrow',17)}</button>`:''}</li>`).join('')}</ol>
   ${a.unlocked?`<button type="button" class="journey-area-link" data-screen="area" data-area="${a.id}">Naar ${a.name} ${icon('arrow',18)}</button>`:`<span class="journey-area-lock">${icon('lock',18)} Eerst ${A.get(a.prerequisite).name} afronden</span>`}
  </details>`).join('')}</div>
  <section class="journey-practice-summary" aria-label="Hoe je geoefend hebt"><h2>Zo heb je geoefend</h2><p>Een volledige opgave levert 10 XP op, of 5 XP met begeleiding. Bij herhalen telt alleen een verbetering. Eerder verdiende XP blijven behouden. Battlepunten staan apart.</p><p><strong>${p.independent}</strong> goede stappen zelfstandig <span>·</span> <strong>${p.supported}</strong> goede stappen met begeleiding</p><p>Een opgave kan uit meerdere stappen bestaan. Een level is afgerond na de hele oefenronde; herhalen helpt je verder.</p></section>
 </div></main><footer class="atlas-footer"><button type="button" class="paper-pill" data-screen="world">${icon('back')}<span class="back-label-full">Terug naar kaart</span><span class="back-label-short">Kaart</span></button><button type="button" class="paint-button" ${recommended.resume?nodeAction(recommended.node,recommended.id,recommended.zone):`data-screen="area" data-area="${recommended.id}" data-zone="${recommended.zone}"`}>Verder oefenen ${icon('arrow')}</button></footer></div>`;
}
function profile(state,options={}){
 const {account,status}=options,p=journeyProgress(state,options.legacy);
 return `<div class="atlas-page profile-page" data-profile-role="${esc(account?.role||'guest')}">${header(state,options)}<main class="journal-main"><section class="journal-paper profile-paper" aria-labelledby="profile-title">
 <div class="profile-overview"><div class="profile-identity"><span class="profile-avatar" aria-hidden="true">${icon('profile',36)}</span><div><h1 id="profile-title">Jouw plek</h1><p>${account?account.role==='teacher'?'Je bekijkt de wereld als docent.':'Je oefent met je leerlingaccount.':'Je oefent als gast op dit toestel.'}</p></div></div><button type="button" class="profile-progress" data-screen="book">${icon('map',26)}<span><strong>Spelvoortgang</strong><small>${p.completed} van ${p.total} levels afgerond${p.started?'<span class="profile-rounds"> · '+p.started+(p.started===1?' ronde bezig':' rondes bezig')+'</span>':''}</small></span>${icon('chevron',20)}</button></div>
 <div class="profile-sections"><section class="profile-section profile-saving" aria-labelledby="profile-saving-title"><h2 id="profile-saving-title">Account en bewaren</h2><p class="storage-status" id="save-status" role="status">${esc(status||'')}</p><div class="profile-actions"><a class="paint-button account-link" href="../../../?login=1&amp;return=games/rechten/rechtenwereld/">${account?'Account openen':'Inloggen'} ${icon('arrow',20)}</a>${account?.role==='student'?'<button type="button" id="sync">Synchroniseren</button>':''}</div><div class="profile-backup"><button type="button" id="backup">Bewaar een kopie</button><span>Download je voortgang.</span></div></section>
 <section class="profile-section profile-preferences" aria-labelledby="profile-preferences-title"><h2 id="profile-preferences-title">Tijdens het oefenen</h2><div class="practice-settings"><label class="motion-setting" for="reduced-motion"><span><strong>Minder beweging</strong><small>Beperk animaties.</small></span><input type="checkbox" id="reduced-motion" ${state.settings.reducedMotion?'checked':''}></label><label class="motion-setting" for="auto-advance"><span><strong>Automatisch verder</strong><small>Na een juist antwoord.</small></span><input type="checkbox" id="auto-advance" ${state.settings.autoAdvance!==false?'checked':''}></label></div></section></div>
 </section></main><footer class="atlas-footer"><button type="button" class="paper-pill" data-screen="world">${icon('back')}<span class="back-label-full">Terug naar kaart</span><span class="back-label-short">Kaart</span></button></footer></div>`;
}
return Object.freeze({places,icon,header,route,progress,journeyProgress,world,area,stop,book,profile});
});
