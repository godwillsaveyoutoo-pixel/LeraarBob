(function(){
'use strict';
const J=window.RechtenJourney;
// Selection, route location and learning evidence remain independent.
const shown=new WeakMap(),routes=new WeakMap();
const icons={check:'M5 12l4 4L19 6',star:'m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',lock:'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5zM12 14v3',review:'M19 7a8 8 0 1 0 1 9M19 2v6h-6',pin:'M12 21s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12zM12 6v6M9 9h6'};
const icon=name=>`<svg class="journey-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[name]}"/></svg>`;
// Original vector landmarks, one recognisable destination per chapter.
const landmarks={
 points:'<path fill="#dfb677" d="M31 73V33h38v40z"/><path fill="#f9e8c3" d="M31 33h23v40H31z"/><path fill="#476e61" d="m24 34 26-23 26 23z"/><path fill="#71917b" d="m24 34 26-23 4 23z"/><path fill="#345b50" d="M44 73V54h12v19M39 38h8v9M54 38h8v9"/><path d="M50 12V4h17l-5 6H50" fill="#d58b48"/><path d="M28 74h46" stroke="#365b4e" stroke-width="4" stroke-linecap="round"/>',
 properties:'<path d="M17 69h66M24 69V32m52 37V32M24 34q26 33 52 0" fill="none" stroke="#b88151" stroke-width="7" stroke-linecap="round"/><path d="M25 37q25 30 50 0M35 46v23m15-17v17m15-23v23" fill="none" stroke="#f0d29e" stroke-width="3"/><path d="M14 79q16-8 31 0t40 0" fill="none" stroke="#80b4ae" stroke-width="5" stroke-linecap="round"/><path d="M46 34V12m-12 3h30l6 7-6 7H34z" fill="#426f60" stroke="#426f60" stroke-width="3"/><path d="M44 22h16m-5-4 5 4-5 4" fill="none" stroke="#fff3d7" stroke-width="2"/>',
 representations:'<path fill="#d9ae75" d="M24 72V45h53v27z"/><path fill="#f7e6bd" d="M24 45h29v27H24z"/><path fill="#486f63" d="M19 46h63L66 28H36z"/><path fill="#365d51" d="M44 72V54h12v18M30 53h8v9m25-9h8v9"/><path d="M50 27 62 11l14 6-10 18z" fill="#dca45f"/><path d="m64 9 15 7" stroke="#365d51" stroke-width="6" stroke-linecap="round"/><path d="m57 27 12 6" stroke="#fff1cf" stroke-width="3"/><path d="M20 74h62" stroke="#365d51" stroke-width="4" stroke-linecap="round"/><path d="M19 21h7m-3-4v8m59 10h6m-3-3v6" stroke="#b99a61" stroke-width="2"/>',
 zeros:'<path fill="#8da993" d="m12 75 29-51 30 51z"/><path fill="#52796a" d="m40 75 21-41 28 41z"/><path fill="#f8f2db" d="m30 43 11-19 12 20-12-6zM54 47l7-13 9 13-9-4z"/><path d="M41 24V7" stroke="#365d51" stroke-width="3"/><path d="M42 6h22l-5 7 5 7H42z" fill="#d58b48"/><path d="M39 75q-9-10 0-17t2-12" fill="none" stroke="#f1ddb4" stroke-width="4" stroke-linecap="round"/>',
 equations:'<path fill="#d2a46c" d="M25 73V39h53v34z"/><path fill="#f7e4bb" d="M25 39h30v34H25z"/><path fill="#b67950" d="m19 40 32-22 33 22z"/><path fill="#dcaa70" d="m19 40 32-22 4 22z"/><path d="M65 26V14h8v17" fill="#537266"/><path fill="#3e6556" d="M45 73V55h13v18M31 47h8v11m26-11h7v11"/><path d="M73 7q-7-4 0-8" stroke="#a5b4a0" stroke-width="3" fill="none"/><circle cx="51" cy="37" r="8" fill="#fff1cc"/><path d="M47 37h8m-4-4v8M21 74h62" stroke="#365d51" stroke-width="3" stroke-linecap="round" fill="none"/>'
};
function landmark(region,place){
 const art=place?`<path d="${place.icon}" transform="translate(15 8) scale(1.17)" fill="none" stroke="#365f50" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`:landmarks[region];
 return `<svg class="journey-building" viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="80" rx="39" ry="13" fill="#c4d4b5"/><ellipse cx="50" cy="77" rx="39" ry="12" fill="#e4e9ce"/>${art}</svg>`;
}
const tree=(x,y,k=1)=>`<g transform="translate(${x} ${y}) scale(${k})"><ellipse cy="17" rx="16" ry="5" fill="#b4c5a0" opacity=".4"/><path d="M0 0v19" stroke="#8b9776" stroke-width="3"/><path d="m0-25 15 27h-30z" fill="#91ae86"/><path d="m0-14 19 26h-38z" fill="#759778"/><path d="m0-14 0 26h-19z" fill="#8caa83"/></g>`;
const landscape=`<svg class="journey-land" viewBox="0 0 1000 540" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="1000" height="540" fill="#eaf0df"/><path d="M0 0h440c-40 90-120 82-150 170S78 218 0 182z" fill="#dce7cd"/><path d="M650 0h350v290c-95-21-61-114-192-113S725 71 650 0" fill="#dce6ca"/><path d="M0 430c120-67 185-16 306-3s175 95 381 32 225-17 313-29v110H0z" fill="#d8e4cb"/><g fill="none" stroke="#cfdbc1" stroke-width="1.5"><path d="M-20 73C131-30 248 30 275 85S170 180 94 140-20 163-20 163M-20 91C131-12 233 45 254 89S160 161 90 155-20 183-20 183M713-10c0 90 133 4 169 108s133 55 144 95M739-10c0 66 132 4 166 100s112 47 121 76M305 530c43-137 196-15 283-80s181-64 225-39 105 21 187-14"/></g><path d="M-30 300c100-70 124 119 236 126s99-71 164-20 79 107 194 89 104 18 132 70" fill="none" stroke="#c0dcd3" stroke-width="54"/><path d="M-30 300c100-70 124 119 236 126s99-71 164-20 79 107 194 89 104 18 132 70" fill="none" stroke="#b0d1ca" stroke-width="36"/><g stroke="#d9ebe1" stroke-width="2" stroke-linecap="round"><path d="M110 366h24m90 64h30m112-32h18m87 86h27m-49-11h19"/></g>${[[44,95,1],[76,115,.7],[61,64,.65],[405,50,.9],[437,68,.7],[941,84,1],[969,107,.8],[810,365,.85],[839,383,.65],[778,390,.7],[62,487,.9],[89,506,.7],[690,296,.7]].map(v=>tree(...v)).join('')}<g fill="#c3cfae"><ellipse cx="546" cy="67" rx="12" ry="5"/><ellipse cx="563" cy="71" rx="8" ry="4"/><ellipse cx="467" cy="369" rx="9" ry="4"/></g><g fill="none" stroke="#a9bd95" stroke-width="2"><path d="m145 57 4-6 5 6m346 284 4-6 5 6m413 116 4-6 5 6"/></g></svg>`;
const stateLabel=s=>s.review?'↻ Herhaling gepland':s.strong?'★ Beheerst':s.completed?'✓ Ronde afgerond':!s.open?'Later op je route':s.introduced?'Aan het oefenen':'Klaar om te starten';

// Connect real landmark centres so the road stays attached at every screen size.
function connectRoute(root){
 routes.get(root)?.disconnect();
 const terrain=root.querySelector('.journey-terrain'),svg=root.querySelector('.journey-road');
 const draw=()=>{
  if(!terrain.isConnected||!terrain.clientWidth)return;
  const box=terrain.getBoundingClientRect(),vertical=getComputedStyle(terrain).getPropertyValue('--route-vertical').trim()==='1';
  const nodes=[...terrain.querySelectorAll('[data-route-stop]')].map(el=>{const b=el.querySelector('.journey-landmark').getBoundingClientRect();return {x:b.x+b.width/2-box.x,y:b.y+b.height/2-box.y,el}});
  svg.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);
  svg.innerHTML=nodes.slice(1).map((p,i)=>{
   const from=nodes[i],dx=(p.x-from.x)*.52,dy=(p.y-from.y)*.52;
   const d=vertical?`M${from.x} ${from.y}C${from.x} ${from.y+dy} ${p.x} ${p.y-dy} ${p.x} ${p.y}`:`M${from.x} ${from.y}C${from.x+dx} ${from.y} ${p.x-dx} ${p.y} ${p.x} ${p.y}`;
   const done=from.el.dataset.complete==='true'&&p.el.dataset.complete==='true',approach=from.el.dataset.complete==='true'&&p.el.getAttribute('aria-current')==='step';
   return `<g class="journey-road-segment ${done?'is-complete':approach?'is-approach':''}" data-from="${from.el.dataset.routeStop}" data-to="${p.el.dataset.routeStop}"><path class="road-edge" d="${d}"/><path class="road-surface" d="${d}"/><path class="road-centre" d="${d}"/></g>`;
  }).join('');
 };
 const observer=new ResizeObserver(draw);observer.observe(terrain);routes.set(root,observer);requestAnimationFrame(draw);
}

window.RechtenJourneyUI={render(root,{state,unlocked,ready,phase,order,requirements,labels,busy,activity='learn',onActivity,onPrepare,onSelect,onRegion,onAtlas,onRecommend,onStart,onResume,onStop}){
 const j=J.data(state),a=j.active,rec=J.recommend(state,unlocked,ready,order),r=J.regions.find(r=>r.id===j.region)||J.regions[0];
 const view=j.view,selected=view==='atlas'?rec.place:r.places.find(p=>p.id===j.selected)||r.places[0];
 const stats=p=>J.status(state,p,unlocked,phase),s=stats(selected),resume=a||busy,round=(state.routeStep||0)+1;
 const location=J.places.find(p=>p.id===a?.place)||rec.place,chapter=J.regions.findIndex(region=>region.id===(view==='atlas'?location.region:r.id))+1;
 const proof=J.skills.filter(k=>j.proof[k]),needs=J.missing(state,ready),completed=J.places.filter(p=>stats(p).completed).length,mastered=J.places.filter(p=>stats(p).strong).length;
 const areaDone=r.places.filter(p=>stats(p).completed).length,answered=state.session?.answered||0;
 const last=j.last,newSkills=last?.newSkills||[],lastName=last?.mode==='camp'?'Herhaalronde':last?.mode==='challenge'?'Onderwerptoets':J.places.find(p=>p.id===last?.place)?.name||'Oefenronde';
 const previous=shown.get(j),seen=previous?.round===state.routeStep?previous.views:new Set(),reactionKey=`${state.routeStep}:${view}:${view==='area'?j.region:''}`;
 const react=!!last&&!seen.has(reactionKey);if(last){seen.add(reactionKey);shown.set(j,{round:state.routeStep,views:seen})}
 const activeName=a?.mode==='challenge'?'Onderwerptoets':a?.mode==='camp'?'Herhaalronde':J.places.find(p=>p.id===a?.place)?.name||'Je lopende oefenronde';
 const inspect=activity==='challenge'&&view==='area'&&r.id==='points'?'challenge':null;
 const sameRound=!!resume&&(view==='atlas'||a&&(inspect==='challenge'?a.mode==='challenge':a.mode==='discover'&&a.place===selected.id));
 const recommended=selected.id===rec.place.id;
 const skillLabel=k=>({point:'Coördinaten lezen',point_plot:'Een punt plaatsen',slope_from_two_points:'Helling uit twee punten'})[k]||labels[k]?.label||k;
 const focus=inspect==='challenge'?'Onderwerptoets':view==='area'?selected.name:resume?activeName:(skillLabel(rec.skill)||selected.name);
 const intro=inspect==='challenge'?'Laat zien wat je zelfstandig kunt met punten, verschillen en helling. Alleen zelfstandig opgeloste opgaven tellen als bewijs.':view==='area'?`${selected.story}${recommended&&(rec.transition||rec.kind==='review')?' '+rec.reason:''}`:resume?'Je antwoorden staan klaar. Ga verder met dezelfde opgave.':rec.reason;
 const focusSkills=(inspect==='challenge'?J.skills:selected.skills).map(k=>`<li><span>${labels[k].label}</span><small>${!unlocked.includes(k)?'Nog niet beschikbaar':!state.skills[k].intro?'Nieuwe stap':ready(state,k)?'Voldoende voorbereid':state.skills[k].seen<4?'Nog aan het opbouwen':'Verder oefenen'}</small></li>`).join('');
 const missing=[...new Set(selected.skills.flatMap(k=>(requirements[k]||[]).filter(dep=>!ready(state,dep))))];
 const action=sameRound?'<button class="primary" data-primary data-resume>Hervat opdracht →</button>':inspect==='challenge'?(needs.length?'<button class="primary" data-primary data-prepare>Verder voorbereiden →</button>':`<button class="primary" data-primary data-start="challenge">${proof.length?'Start nieuwe toetspoging':'Start onderwerptoets'} →</button>`):s.open?`<button class="primary" data-primary ${view==='atlas'?'data-next-round':`data-start="discover"${recommended?' data-next-round':''}`}>${resume?'Start bij deze stop':state.routeStep?'Start volgende ronde':'Start je reis'} →</button>`:'<button class="primary" data-primary data-recommend>Ga naar beschikbare stap →</button>';
 const result=last?`<details class="journey-result ${react?'result-arrived':''}"><summary><span class="journey-result-star" aria-hidden="true">✓</span><span><strong>Ronde ${state.routeStep} afgerond</strong><small>${last.independent}/${last.answered} zelfstandig gelukt</small></span></summary><div><p>${lastName}</p>${last.practice?.length?'<p>Wat nog hulp vroeg, komt later terug. Je afgeronde ronde blijft staan.</p>':''}${newSkills.length?`<p>Nieuw beschikbaar: ${newSkills.map(k=>labels[k]?.label||k).join(' · ')}</p>`:''}</div></details>`:'';
 const details=`<aside class="journey-details" aria-label="Geselecteerde stop"><div class="journey-detail-main"><span class="journey-context">${inspect==='challenge'?'De eindhalte van dit hoofdstuk':sameRound?'Verder waar je was':recommended?`Ronde ${round} · jouw volgende stop`:'Deze stop bekijken'}</span><h3 tabindex="-1">${focus}</h3>${!inspect&&view==='area'&&recommended&&!sameRound&&rec.skill?`<p class="journey-focus">Deze ronde: <strong>${skillLabel(rec.skill)}</strong></p>`:''}${!inspect&&!s.open&&!sameRound?`<p class="journey-preparation">Bereid eerst ${missing.map(k=>labels[k]?.label||k).join(' en ')||'de eerdere leerdoelen'} voor.</p>`:''}${inspect==='challenge'?`<div class="journey-test-progress"><span>${J.skills.length-needs.length} van 5 leerdoelen voorbereid</span><span>${proof.length} van 5 zelfstandig aangetoond</span></div>${needs.length?`<p class="journey-preparation">Oefen nog: ${needs.map(skillLabel).join(', ')}.</p>`:''}`:''}${sameRound?`<div class="journey-round-progress"><span>Ronde ${round}<strong>${answered} / 12</strong></span><progress max="12" value="${answered}" aria-label="Beantwoorde opgaven in de lopende ronde"></progress></div>`:''}${action}<p class="journey-small">${sameRound?'Je voortgang is bewaard.':inspect==='challenge'?'12 opgaven · 5 leerdoelen':'12 opgaven · op jouw tempo'}</p>${resume&&!sameRound?'<p class="journey-small">Als je hier start, stopt de huidige ronde. Je behaalde resultaten blijven bewaard.</p>':''}${!inspect&&view==='atlas'?'<button class="journey-text-button" data-recommend>Bekijk de stopplaatsen →</button>':!inspect&&!recommended&&s.open&&!resume?'<button class="journey-text-button" data-recommend>Terug naar mijn volgende stop →</button>':''}</div><div class="journey-detail-extra">${result}<p class="journey-status">${inspect==='challenge'?(proof.length===5?'✓ Alle vijf leerdoelen zelfstandig aangetoond':needs.length?'Nog voorbereiding nodig':'Klaar voor een toetspoging'):stateLabel(s)}${!inspect&&s.completed&&s.review?' · ✓ Ronde afgerond':''}</p><details class="journey-goals journey-description"><summary>${inspect==='challenge'?'Over deze toets':'Over deze stap'}</summary><p>${intro}</p><ul>${focusSkills}</ul></details></div></aside>`;
 const here=`<span class="journey-you">${icon('pin')}Jij bent hier</span>`;
 function badges(t){return `${t.completed?`<span class="journey-earned" aria-label="Ronde afgerond">${icon('check')}</span>`:''}${t.strong?`<span class="journey-mastery" aria-label="Beheerst">${icon('star')}</span>`:''}${t.review?`<span class="journey-review" aria-label="Herhaling gepland">${icon('review')}</span>`:''}`}
 function stop({id,title,region,place,t,i,count,current,selected=false,attribute,subtitle,meta='',newly=false,justDone=false}){
  const positions=count===5?[[12,66],[30,22],[50,66],[70,22],[88,66]]:count===4?[[15,62],[38,23],[62,62],[85,23]]:count===3?[[19,62],[50,23],[81,62]]:[[28,58],[72,29]];
  return `<button class="journey-place ${selected?'selected':''} ${t.open?'':'later'} ${t.completed?'is-completed':''} ${t.strong?'is-mastered':''} ${t.review?'has-review':''} ${current?'is-current recommended':''} ${react&&justDone?'just-completed':''} ${react&&newly?'just-unlocked':''}" style="--stop-x:${positions[i][0]}%;--stop-y:${positions[i][1]}%" ${attribute} data-route-stop="${id}" data-complete="${t.completed}" ${current?'aria-current="step"':''}><span class="journey-landmark">${current?here:''}<span class="journey-stop-number" aria-label="${place?'Stop':'Hoofdstuk'} ${i+1}">${i+1}</span>${landmark(region,place)}${badges(t)}</span><span class="journey-stop-caption"><strong>${title}</strong><span class="journey-stop-status">${!t.open?icon('lock'):''}${subtitle}</span>${meta}${newly?'<small class="journey-new-label">Nieuw beschikbaar</small>':''}</span></button>`;
 }
 let stops;
 if(view==='atlas'){
  stops=J.regions.map((region,i)=>{
   const ss=region.places.map(stats),done=ss.filter(s=>s.completed).length,strong=ss.filter(s=>s.strong).length,current=location.region===region.id;
   const t={open:ss.some(s=>s.open),completed:done===ss.length,strong:strong===ss.length,review:ss.some(s=>s.review)};
   const meta=`<span class="journey-stop-progress" aria-label="${done} van ${ss.length} stopplaatsen afgerond">${ss.map(s=>`<i class="${s.completed?'done':''} ${s.strong?'mastered':''}"></i>`).join('')}</span>`;
   return stop({id:region.id,title:region.name,region:region.id,t,i,count:5,current,attribute:`data-region="${region.id}"`,subtitle:!t.open?'Later':`${done}/${ss.length} afgerond${strong?` · ${strong} ★`:''}`,meta,newly:region.places.some(p=>p.skills.some(k=>newSkills.includes(k))),justDone:last?.mode!=='camp'&&region.places.some(p=>p.id===last?.place)});
  }).join('');
 }else{
  const count=r.places.length+(r.id==='points'?1:0);
  stops=r.places.map((p,i)=>{
   const t=stats(p),current=p.id===location.id&&a?.mode!=='challenge';
   return stop({id:p.id,title:p.name,region:r.id,place:p,t,i,count,current,selected:!inspect&&p.id===selected.id,attribute:`data-place="${p.id}" aria-pressed="${!inspect&&p.id===selected.id}"`,subtitle:current&&a?`${answered}/12 in deze ronde`:stateLabel(t),newly:p.skills.some(k=>newSkills.includes(k)),justDone:last?.place===p.id&&last.mode!=='camp'});
  }).join('');
  if(r.id==='points')stops+=stop({id:'assessment',title:'Onderwerptoets',region:r.id,place:{icon:'M20 12h-5v39h30V12h-5M23 8h14v9H23zM21 28l4 4 8-9M21 41h17'},t:{open:!needs.length,completed:proof.length===5,strong:proof.length===5},i:3,count,current:a?.mode==='challenge',selected:!!inspect,attribute:`data-activity="challenge" aria-pressed="${!!inspect}"`,subtitle:proof.length===5?'Zelfstandig aangetoond':needs.length?`${5-needs.length}/5 voorbereid`:'Klaar voor de toets'});
 }
 const map=`<section class="journey-map ${view==='area'?'journey-area':''}" aria-label="${view==='atlas'?'Hoofdkaart Rechten':`Deelkaart ${r.name}`}"><div class="journey-map-top"><div><span class="journey-map-eyebrow">${view==='atlas'?'DE REIS DOOR RECHTEN':`HOOFDSTUK ${chapter} VAN 5`}</span><p>${view==='atlas'?'5 hoofdstukken':`${areaDone} van ${r.places.length} stopplaatsen afgerond`}</p></div><button class="journey-locate" data-locate>${icon('pin')}<span>Mijn plek</span></button></div><div class="journey-terrain">${landscape}<svg class="journey-road" aria-hidden="true"></svg><div class="journey-stops">${stops}</div><span class="journey-compass" aria-hidden="true">N<span>✧</span></span></div><div class="journey-map-key"><span>${icon('check')}Afgerond</span><span>${icon('star')}Beheerst</span><span>${icon('review')}Herhalen</span><span class="journey-key-later">${icon('lock')}Later</span></div></section>`;
 const running=resume?`<div class="journey-running"><span class="journey-running-dot" aria-hidden="true"></span><div><span>Je lopende ronde</span><strong>${activeName}</strong><small>${answered} van 12 beantwoord</small></div><button data-resume>Hervatten →</button><button class="journey-text-button" data-stop-round>Stoppen</button></div>`:'';
 const header=`<div class="journey-heading"><div><span>${view==='atlas'?`JOUW LEERREIS · HOOFDSTUK ${chapter} VAN 5`:'RECHTEN / JOUW LEERREIS'}</span><h2 tabindex="-1">${view==='atlas'?'Jouw rechtenwereld':r.name}</h2></div>${view==='area'?'<button data-atlas>← Alle hoofdstukken</button>':`<div class="journey-total"><span><strong>${completed}</strong> / ${J.places.length} afgerond</span><span>${icon('star')}<strong>${mastered}</strong> beheerst</span><progress max="${J.places.length}" value="${completed}" aria-label="Afgeronde stopplaatsen"></progress></div>`}</div>`;
 root.innerHTML=`<div class="journey-content ${resume?'has-round':''}">${header}${running}<div class="journey-body">${map}${details}</div></div>`;
 connectRoute(root);
 const showSelection=()=>{if(innerWidth<=900)root.querySelector('.journey-details').scrollIntoView({block:'start'})};
 root.querySelectorAll('[data-activity]').forEach(b=>b.onclick=()=>{onActivity(b.dataset.activity);showSelection()});
 root.querySelector('[data-prepare]')?.addEventListener('click',()=>onPrepare(needs[0]));
 root.querySelectorAll('[data-resume]').forEach(b=>b.addEventListener('click',onResume));
 root.querySelector('[data-stop-round]')?.addEventListener('click',onStop);
 root.querySelector('[data-atlas]')?.addEventListener('click',onAtlas);
 root.querySelectorAll('[data-region]').forEach(b=>b.onclick=()=>onRegion(b.dataset.region));
 root.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>{onSelect(b.dataset.place);showSelection()});
 root.querySelector('[data-next-round]:not([data-start])')?.addEventListener('click',()=>onStart(rec.place.id,'discover'));
 root.querySelectorAll('[data-recommend]').forEach(b=>b.onclick=onRecommend);
 root.querySelector('[data-locate]').onclick=()=>{
  if(view==='area'){
   if(r.id!==location.region)onRecommend();
   if(a?.mode==='challenge')onActivity('challenge');
   else if(r.id===location.region)onSelect(location.id);
  }
  const current=root.querySelector('[aria-current="step"]');
  current?.focus({preventScroll:true});
  current?.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 };
 root.querySelectorAll('[data-start]').forEach(b=>{b.disabled=b.dataset.start==='challenge'&&!!needs.length;b.onclick=()=>onStart(selected.id,b.dataset.start)});
}};
})();
