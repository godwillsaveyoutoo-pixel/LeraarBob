(()=>{
'use strict';
const C=BewerkingenCore,$=id=>document.getElementById(id),q=new URLSearchParams(location.search);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const math=s=>katex.renderToString(s,{throwOnError:false,strict:'ignore'});
let previewOnly=q.get('simulation')==='1';
let account=undefined,view='home',activity='learn',audience='class',group=C.GROUPS.some(g=>g.id===q.get('world'))?q.get('world'):'machten';
let selected=C.SKILLS.filter(s=>s.group===group).map(s=>s.id),level=[0,1,2].includes(Number(q.get('level')))&&q.has('level')?Number(q.get('level')):1,count=[5,10,20].includes(Number(q.get('count')))?Number(q.get('count')):5,seconds=180,participate=true,state=null,pending=null,epoch=0,busy=false,poll=null,boardKey='',offset=0,report=null,simulation=null,lastInput=Date.now(),lastPulse=0,requestSerial=0,smartControl=null;
const requestedSkills=(q.get('skills')||'').split(',').filter(id=>C.SKILLS.some(s=>s.id===id));if(requestedSkills.length)selected=[...new Set(requestedSkills)];
const key=()=>`leraarbob:numbers-session:${account?.id}`,draftKey=()=>`${key()}:${state?.id}:${state?.round}`,simulationKey=()=>`${key()}:simulation`;
const save=(k,v)=>{try{sessionStorage.setItem(k,JSON.stringify(v))}catch{}};
const read=k=>{try{return JSON.parse(sessionStorage.getItem(k)||'null')}catch{return null}};
async function loadXP(){if(!account||simulation)return;try{const data=await rpc('summary');$('numbersXP').dataset.value=data.xp;}catch{}}
function notice(s=''){$('spaceNotice').textContent=s;}
function title(s){$('spaceTitle').textContent=s;$('spaceCrumb').textContent=s;}
function setView(next,{url=true}={}){view=next;document.body.dataset.view=next;boardKey='';$('spaceContent').replaceChildren();notice();if(url){const u=new URL(location.href);u.searchParams.set('view',next);if(state)u.searchParams.set('session',state.id);else u.searchParams.delete('session');history.replaceState(null,'',u);}render();}
function login(){window.LeraarBobTopbar?.openAccount();}
const needsAccount=()=>{if(account)return false;notice('Meld je aan om samen te spelen en je klasresultaten te bekijken.');login();return true;};
function routeNative(intent,mode='solo'){
 const url=new URL('./',location.href);url.searchParams.set('screen','setup');url.searchParams.set('mode',mode);url.searchParams.set('world',group);url.searchParams.set('returnTo',LeraarBobRoutes.safeReturn(q.get('returnTo'),'games/getallenwereld/'));url.searchParams.set('skills',selected.join(','));url.searchParams.set('level',level);url.searchParams.set('count',count);if(intent)url.searchParams.set('intent',intent);location.href=url;
}
function render(){
 $('resumeSession').hidden=!state||view==='session';
 if(view==='home')home();else if(view==='selection')selection();else if(view==='session')session();else if(view==='rankings'||view==='students')reports();
}
function home(){
 title('Wat wil je doen?');const teacher=account?.role==='teacher';
 $('spaceContent').innerHTML=`<div class="space-actions ${teacher?'teacher-actions':''}">
 <button class="space-action" data-go="solo"><strong>Solo oefenen</strong><span>Eigen tempo · hints · XP</span></button>
 <button class="space-action" data-go="paper"><strong>Oefenblad</strong><span>Vragen en verbetersleutel</span></button>
 <button class="space-action" data-go="duo-learn"><strong>Duo Learn</strong><span>Samen leren · twee toestellen</span></button>
 <button class="space-action" data-go="duo-battle"><strong>Duo Battle</strong><span>Tegen elkaar · twee toestellen</span></button>${teacher?'<button class="space-action" data-go="class-learn"><strong>Klaslearn</strong><span>Eigen antwoorden · samen bespreken</span></button><button class="space-action" data-go="class-battle"><strong>Klasbattle</strong><span>De klas speelt tegen de klok</span></button>':''}
 <button class="space-action" data-go="rankings"><strong>Ranglijsten</strong><span>XP en battlepunten per klas</span></button>
 <button class="space-action" data-go="${teacher?'students':'duo'}"><strong>${teacher?'Leerlingen':'Bordduo'}</strong><span>${teacher?'Zoeken, sorteren en opvolgen':'Met twee op één toestel'}</span></button></div>
 <div class="space-bottom"><form id="joinSpace"><label for="sessionCode">Sessiecode</label><input id="sessionCode" aria-label="Sessiecode" value="${esc(q.get('code')||'')}" maxlength="8" pattern="[A-Fa-f0-9]{8}" placeholder="8 tekens" required><button class="primary">Deelnemen →</button></form>${teacher?'<div><button data-go="duo">Bordduo</button> <button data-go="board">Borduitleg</button></div>':'<small>Machten · wortels · wetenschappelijke schrijfwijze</small>'}</div>`;
}
function selection(){
 title((previewOnly?'Simulatie · ':'')+(audience==='duo'?'Duo ':'Klas')+(activity==='learn'?'Learn':'Battle'));
 $('spaceContent').innerHTML=`<form id="createSpace" class="selection-screen"><nav class="group-tabs" aria-label="Onderwerp">${C.GROUPS.map(g=>`<button type="button" data-group="${g.id}" aria-pressed="${group===g.id}">${esc(({machten:'Machten',wortels:'Wortels',wetenschappelijk:'Schrijfwijze'})[g.id])}</button>`).join('')}</nav>
 <div class="skill-grid">${C.SKILLS.filter(s=>s.group===group).map(s=>`<label class="skill-choice"><input type="checkbox" name="skills" value="${s.id}" ${selected.includes(s.id)?'checked':''}><span>${esc(s.label)}</span></label>`).join('')}</div>
 <div class="selection-options"><label>Niveau<select id="sessionLevel"><option value="0">Start</option><option value="1">Basis</option><option value="2">Verdieping</option></select></label><label>Vragen<select id="sessionCount">${[5,10,20].map(n=>`<option>${n}</option>`).join('')}</select></label>${activity==='battle'?'<label>Per vraag<select id="sessionSeconds"><option value="60">1 minuut</option><option value="120">2 minuten</option><option value="180">3 minuten</option><option value="300">5 minuten</option></select></label>':''}${account?.role==='teacher'?`<label>Met wie<select id="sessionAudience"><option value="class">Met de klas</option><option value="duo">Met twee online</option></select></label><label class="participate"><input id="participate" type="checkbox" ${participate?'checked':''}>Ik doe mee</label>`:''}</div>
 <div class="space-bottom"><small>${selected.length} vraagvormen · ${activity==='learn'?'op eigen tempo verbeteren':'één inzending per vraag'}</small><div>${account?.role==='teacher'&&!previewOnly?'<button type="button" id="simulateSpace">Simulatie</button> ':''}<button class="primary" ${selected.length?'':'disabled'}>${previewOnly?'Simulatie starten':'Maak sessie'} →</button></div></div></form>`;
 $('sessionLevel').value=level;$('sessionCount').value=count;if($('sessionSeconds'))$('sessionSeconds').value=seconds;if($('sessionAudience'))$('sessionAudience').value=audience;
}
function settings(){return {skills:selected,level,count,seconds,activity,audience,participate};}
async function rpc(action,data={}){
 const captured=epoch,client=AxiomaAuth.client(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{const r=await client.functions.invoke('numbers-session',{body:{action,data},signal:controller.signal});if(captured!==epoch)throw Error('Je account is gewijzigd.');
 if(r.error){let body;try{body=await r.error.context?.json()}catch{}throw Error(body?.error||'De sessie is niet bereikbaar. Probeer opnieuw.');}if(r.data?.error)throw Error(r.data.error);return r.data;
 }finally{clearTimeout(timer);}
}
function accept(next){state=next;offset=Date.parse(next.server_time)-Date.now();if(simulation){save(simulationKey(),simulation);}else save(key(),{id:state.id});if(pending&&(state.round!==pending.round||state.phase!=='question'||(state.mine&&state.mine.attempts>=pending.expectedAttempts))){pending=null;save(key()+':pending',null);}if(view==='session')session();$('resumeSession').hidden=view==='session';schedule();}
async function action(name,data={}){
 if(busy)return;busy=true;const serial=++requestSerial;clearTimeout(poll);notice();
 document.querySelectorAll('#createSpace button,#hostStart,#hostNext,#hostEnd,#submitAnswer').forEach(b=>b.disabled=true);
 try{const next=simulation?simulate(name,data):await rpc(name,{id:state?.id,...data});if(serial!==requestSerial)return;if(name==='leave'&&!next.owner){state=null;pending=null;sessionStorage.removeItem(key());sessionStorage.removeItem(key()+':pending');setView('home');return;}accept(next);if(name==='submit'&&!simulation)loadXP();if(view!=='session')setView('session');}
 catch(e){notice(e.message);if(view==='selection')selection();else if(view==='session')session();}finally{busy=false;document.querySelectorAll('[data-busy-disabled]').forEach(b=>b.disabled=false);if(view==='session')session();schedule();}
}
function schedule(){clearTimeout(poll);if(!state||!account||['finished','closed'].includes(state.phase))return;const captured=epoch;
 poll=setTimeout(async()=>{if(busy){schedule();return;}const serial=++requestSerial;
 try{let next;if(simulation)next=simulate('state');else next=await rpc('state',{id:state.id});if(captured!==epoch||serial!==requestSerial)return;accept(next);if(pending&&state.phase==='question')await sendAnswer();}catch(e){if(captured===epoch){notice('Verbinding onderbroken. Je invoer blijft bewaard.');schedule();}}},1800);
}
function session(){
 if(!state){setView('home');return;}document.body.dataset.phase=state.phase;title(`${state.activity==='learn'?'Learn':'Battle'} · ${state.audience==='class'?'klas':'duo'}`);
 const me=state.members.find(m=>m.id===(simulation?'preview':account?.id)),waiting=me&&me.eligible>state.round;
 const keyNow=state.id+':'+state.round+':'+state.phase;
 if(boardKey!==keyNow){boardKey=keyNow;
  $('spaceContent').innerHTML=`<div class="session-strip"><button id="sessionBack" aria-label="Terug naar overzicht">←</button><span>${simulation?'<span class="simulation-badge">SIMULATIE · </span>':''}<strong>${simulation?'':esc(state.code)}</strong> · ${state.round<0?'Wachtkamer':`${state.round+1} / ${state.total}`}</span><span id="sessionClock"></span><div><button id="copySession" ${simulation?'hidden':''}>Link</button> <button id="showMembers">${state.members.length} spelers</button></div></div><div id="sessionWork" class="waiting-card"></div><div class="space-bottom" id="sessionActions"></div>`;
  if(['question','review'].includes(state.phase)){
   const task=C.generate(state.spec.skill,state.spec.seed,state.spec.level,state.spec.variant),draft=read(draftKey())||{};
   $('sessionWork').className='session-work';$('sessionWork').innerHTML=`<section class="question-side"><p>${esc(C.SKILLS.find(s=>s.id===task.skill).label)}</p><div class="space-formula">${math(task.tex)}</div><p>${esc(task.instruction||task.condition)}</p></section><form id="sessionAnswer" class="answer-side"><div id="smartSessionAnswer"></div><p id="answerFeedback" class="space-feedback" role="status"></p><div class="panel-actions"><button class="primary" id="submitAnswer" form="sessionAnswer">${state.activity==='learn'?'Controleer':'Indienen'}</button>${state.activity==='learn'?'<button type="button" id="sessionHint">Hint</button>':''}${state.phase==='review'?'<button type="button" id="showSolution">Uitwerking</button>':''}</div></form>`;$('sessionWork').querySelector('.question-side').append($('answerFeedback'));
   smartControl=SmartAnswer.mount($('smartSessionAnswer'),task,{state:draft.smart,value:draft.value??state.mine?.value??'',onChange(smart,value){lastInput=Date.now();const d=read(draftKey())||{};save(draftKey(),{...d,smart,value});$('submitAnswer').disabled=!value;}});
  }
 }
 $('showMembers').textContent=state.members.filter(m=>!m.left).length+' spelers';
 if(state.phase==='lobby'){
  $('sessionWork').innerHTML=`<p>Deel de code. Iedereen gebruikt zijn eigen toestel.</p><strong class="big-code">${esc(state.code)}</strong><div class="member-chips">${state.members.filter(m=>!m.left).map(m=>`<span>${esc(m.alias)}</span>`).join('')||'<span>Wachten op deelnemers…</span>'}</div>`;
 }else if(['finished','closed'].includes(state.phase)){
  $('sessionWork').innerHTML=`<h2>${state.phase==='finished'?'Reeks afgerond':'Sessie gesloten'}</h2><div class="member-chips">${state.members.map(m=>`<span><strong>${esc(m.alias)}</strong> · ${simulation?'voorbeeld':m.xp+' XP'}${state.activity==='battle'?' · '+m.points+' punten':''}</span>`).join('')}</div><button id="backHome">Naar overzicht</button>`;
 }else{
  const readonly=state.phase!=='question'||!me||waiting||state.mine?.correct===true||(state.activity==='battle'&&!!state.mine)||!!pending;
  smartControl?.setDisabled(readonly||busy);for(const id of ['submitAnswer','sessionHint'])if($(id))$(id).disabled=readonly||busy||(id==='submitAnswer'&&!smartControl?.value());
  $('submitAnswer').hidden=state.phase==='review';
  $('answerFeedback').textContent=waiting?'Je doet mee vanaf de volgende vraag.':!me?'De klas werkt. Open Spelers voor de voortgang.':pending?'Je antwoord wordt verstuurd…':state.mine?(state.activity==='battle'&&state.phase==='question'?'Ingediend. Wacht op de uitslag.':state.mine.correct?`Juist! ${simulation?'':`+${state.mine.xp} XP · `}${state.phase==='question'?'Wacht op de volgende vraag.':''}`:'Nog niet juist. '+(state.activity==='learn'&&state.phase==='question'?'Probeer opnieuw.':'')):state.phase==='review'?'Geen antwoord ingediend.':'';
  $('answerFeedback').dataset.ok=state.mine?.correct===undefined?'':String(state.mine.correct);
 }
 const discussion=state.phase==='review'&&state.activity==='learn'&&state.audience==='duo';
 if(discussion){let list=$('discussionAnswers');if(!list){list=document.createElement('div');list.id='discussionAnswers';list.className='discussion-answers';$('sessionWork').append(list);}list.innerHTML=state.members.map(m=>{let rendered;try{rendered=m.answer?math(C.tex(m.answer)):'—'}catch{rendered=esc(m.answer||'—')}return `<div><strong>${esc(m.alias)}</strong><span>${rendered}</span><small>${m.reviewed?'Besproken':'Nog bespreken'}</small></div>`}).join('');$('sessionAnswer').hidden=true;}
 const unanswered=state.members.filter(m=>!m.left&&m.eligible<=state.round&&!m.answered).length;
 const answerActions=$('sessionAnswer')?.querySelector('.panel-actions')||$('sessionActions').querySelector('.answer-actions');
 $('sessionActions').innerHTML=`<button id="leaveSession">${state.owner?'Sessie afsluiten':'Verlaten'}</button><small>${state.phase==='question'?`${unanswered} nog bezig`:state.phase==='review'?'Bespreek de antwoorden.':''}</small>${state.phase==='review'&&state.activity==='learn'&&state.audience==='duo'&&me?`<button id="approveDiscussion" ${me.reviewed?'disabled':''}>${me.reviewed?'Bespreking bevestigd':'Besproken · klaar'}</button>`:''}${state.owner?(state.phase==='lobby'?'<button id="hostStart" class="primary">Start →</button>':state.phase==='question'?'<button id="hostEnd">Vraag afronden</button>':state.phase==='review'?`<button id="hostNext" class="primary" ${discussion&&!state.members.filter(m=>!m.left).every(m=>m.reviewed)?'disabled':''}>${state.round+1===state.total?'Afronden':'Volgende vraag'} →</button>`:''):''}`;
 if(answerActions){answerActions.classList.add('answer-actions');$('sessionActions').append(answerActions);}
 if(busy)$('sessionActions').querySelectorAll('button').forEach(b=>b.disabled=true);clock();
}
async function sendAnswer(){if(!pending||busy)return;await action('submit',pending);}
function panel(titleText,body){$('panelTitle').textContent=titleText;$('panelContent').innerHTML=body;if(!$('spacePanel').open)$('spacePanel').showModal();}
function roster(){panel('Spelers',`<table><thead><tr><th>Alias</th><th>Deze vraag</th><th>XP</th></tr></thead><tbody>${state.members.map(m=>`<tr><td>${esc(m.alias)}${m.left?' · vertrokken':''}</td><td>${m.correct===true?'Juist':m.answered?'Ingediend':'Bezig'}${m.answer?'<br>'+esc(m.answer):''}${m.reviewed?' · besproken':''}</td><td>${m.xp??'—'}</td></tr>`).join('')}</tbody></table>${simulation?'<p>Voorbeeldleerlingen. Er worden geen resultaten opgeslagen.</p><button id="simulateAnswers">Laat voorbeeldleerlingen antwoorden</button>':''}`);}
function clock(){if(!$('sessionClock'))return;const remaining=state?.deadline?Math.max(0,Math.ceil((Date.parse(state.deadline)-Date.now()-offset)/1000)):null;$('sessionClock').textContent=remaining!==null&&state.phase==='question'?`${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`:state?.activity==='learn'?'Eigen tempo':'';}
function clearSimulationURL(){const u=new URL(location.href);u.searchParams.delete('simulation');history.replaceState(null,'',u);}
function startSimulation(){
 requestSerial++;clearTimeout(poll);pending=null;$('numbersXP').dataset.value='NaN';
 const deck=Array.from({length:Math.max(count,selected.length)},(_,i)=>({skill:selected[i%selected.length],seed:crypto.getRandomValues(new Uint32Array(1))[0],level,variant:i%4}));
 simulation={id:'simulation-'+crypto.randomUUID(),code:'VOORBEELD',activity,audience,owner:true,participant:true,round:-1,total:deck.length,deck,phase:'lobby',members:['Jij als leerling','Voorbeeld Noor','Voorbeeld Sam','Voorbeeld Alex'].slice(0,audience==='duo'?2:4).map((alias,i)=>({id:i?'sample'+i:'preview',alias,eligible:0,xp:0,points:0})),mine:null};
 const u=new URL(location.href);u.searchParams.set('simulation','1');history.replaceState(null,'',u);accept(simulate('state'));setView('session');
}
function simulate(name,data={}){
 const s=simulation;
 if(name==='start'||name==='next'){s.round++;s.phase=s.round>=s.total?'finished':'question';s.round=Math.min(s.round,s.total-1);s.spec=s.deck[s.round];s.mine=null;s.members.forEach(m=>{m.answered=false;m.correct=null;m.reviewed=false});s.deadline=s.activity==='battle'?new Date(Date.now()+seconds*1000).toISOString():null;}
 if(name==='end'||s.phase==='question'&&s.deadline&&Date.now()>=Date.parse(s.deadline))s.phase='review';
 if(name==='approve')s.members[0].reviewed=true;
 if(name==='close'||name==='leave')s.phase='closed';
 if(name==='submit'&&s.phase==='question'){
  const t=C.generate(s.spec.skill,s.spec.seed,s.spec.level,s.spec.variant),correct=C.check(t,data.value).ok,tries=(s.mine?.attempts||0)+1;
  if(!s.mine?.correct&&(s.activity==='learn'||!s.mine)){s.mine={value:data.value,correct,attempts:tries,xp:correct?(tries===1?10:5):0};s.members[0].answered=true;s.members[0].correct=correct;}
 }
 if(s.activity==='learn'&&s.audience==='duo'&&s.phase==='question'&&s.members.every(m=>m.correct))s.phase='review';
 return {...structuredClone(s),server_time:new Date().toISOString()};
}
function reports(){
 const teacher=account?.role==='teacher',students=view==='students';if(students&&!teacher){setView('home');return;}title(students?'Leerlingen':'Ranglijsten');
 const now=new Date(),start=new Date(now);start.setDate(start.getDate()-30);const local=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 $('spaceContent').innerHTML=`<div class="report-tools"><label>Van<input id="reportFrom" type="date" value="${local(start)}"></label><label>Tot en met<input id="reportUntil" type="date" value="${local(now)}"></label>${teacher?`<label>Klas<select id="reportClass"><option value="">Alle klassen</option>${(AxiomaAuth.CLASSES||[]).map(c=>`<option>${esc(c)}</option>`).join('')}</select></label>`:''}<button id="refreshReport">Toon</button></div><div class="report-tools"><label>Zoek alias<input type="search" id="reportSearch" placeholder="Alias"></label><label>Sorteren<select id="reportSort"><option value="xp">Meeste XP</option><option value="points">Battlepunten</option><option value="alias">Alias A–Z</option><option value="correct">Juiste antwoorden</option>${teacher?'<option value="active_seconds">Actieve tijd</option>':''}<option value="last_at">Recent actief</option></select></label>${teacher?'<button id="exportReport">CSV</button>':''}</div><div id="reportRows" class="report-list"><p>Resultaten ophalen…</p></div><p class="report-note">Opgeslagen solo- en onlineactiviteiten · ${teacher?'Actieve tijd: schatting bij zichtbaar, recent bediend scherm. ':''}XP: 10 bij een eerste juist antwoord, 5 na hulp of verbetering. <a href="../../klasbattle/?view=rankings&game=getallenwereld">Eerdere klasbattles</a>${teacher?' · <a href="../../teacher/?game=getallenwereld">Solo-voortgang</a>':''}</p>`;
 const filters=read(key()+':report-filters');if(filters)for(const id of ['reportFrom','reportUntil','reportClass','reportSearch','reportSort'])if($(id)&&filters[id]!==undefined)$(id).value=filters[id];
 loadReport();
}
function saveFilters(){const filters={};for(const id of ['reportFrom','reportUntil','reportClass','reportSearch','reportSort'])if($(id))filters[id]=$(id).value;save(key()+':report-filters',filters);}
async function loadReport(){saveFilters();if(!account){$('reportRows').textContent='Meld je aan om je klasresultaten te bekijken.';return;}const capture=epoch,serial=++requestSerial;try{const result=await rpc('report',{from:$('reportFrom').value,until:$('reportUntil').value,class:$('reportClass')?.value});if(capture!==epoch||serial!==requestSerial)return;report=result;drawReport();notice();}catch(e){if(capture!==epoch||serial!==requestSerial||!$('reportRows'))return;notice(e.message);$('reportRows').textContent='Nog niet geladen. Gebruik Toon om opnieuw te proberen.';}}
function reportRows(){const search=$('reportSearch')?.value.toLocaleLowerCase()||'',sort=$('reportSort')?.value||'xp';return(report?.rows||[]).filter(r=>r.alias.toLocaleLowerCase().includes(search)).sort((a,b)=>sort==='alias'?a.alias.localeCompare(b.alias,'nl'):sort==='last_at'?String(b.last_at||'').localeCompare(String(a.last_at||'')):(b[sort]||0)-(a[sort]||0)||a.alias.localeCompare(b.alias,'nl'));}
function drawReport(){if(!$('reportRows'))return;const teacher=account.role==='teacher',rows=reportRows();$('reportRows').innerHTML=`<table><thead><tr><th>Alias</th><th>XP</th><th>Battle</th><th>Juist</th>${teacher?'<th>Actief</th><th>Laatst</th>':''}</tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${esc(r.alias)}${r.mine?' · jij':''}</strong><small>${esc(r.class_code)}</small></td><td>${r.xp}</td><td>${r.points}</td><td>${r.correct}/${r.questions}</td>${teacher?`<td>${Math.floor(r.active_seconds/60)}m ${r.active_seconds%60}s</td><td>${r.last_at?new Date(r.last_at).toLocaleDateString('nl-BE'):'—'}</td>`:''}</tr>`).join('')||'<tr><td colspan="6">Geen resultaten voor deze selectie.</td></tr>'}</tbody></table>`;}
function exportReport(){const fields=['alias','class_code','xp','points','correct','questions','attempts','sessions','active_seconds','last_at'],cell=v=>'"'+String(v??'').replace(/^[=+\-@\t\r]/,"'$&").replace(/"/g,'""')+'"',csv=[fields.join(','),...reportRows().map(r=>fields.map(k=>cell(r[k])).join(','))].join('\r\n'),url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='getallenwereld-resultaten.csv';a.click();URL.revokeObjectURL(url);}
$('space').addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;const go=b.dataset.go;
 if(go){if(go==='solo'||go==='paper'||go==='duo'||go==='board'){routeNative(go==='paper'?'worksheet':'',go==='duo'?'duo':go==='board'?'teacher':'solo');return;}if(needsAccount())return;if(/^(duo|class)-(learn|battle)$/.test(go)){[audience,activity]=go.split('-');previewOnly=false;clearSimulationURL();setView('selection');}else setView(go);return;}
 if(b.dataset.group){group=b.dataset.group;selected=C.SKILLS.filter(s=>s.group===group).map(s=>s.id);selection();return;}
  switch(b.id){
 case'spaceBack':if(view==='home'){location.href=LeraarBobRoutes.safeReturn(q.get('returnTo'),'games/getallenwereld/?screen=home');}else setView('home');break;
 case'sessionBack':
 case'backHome':setView('home');break;
 case'resumeSession':setView('session');break;
 case'simulateSpace':startSimulation();break;
 case'approveDiscussion':await action('approve');break;
 case'hostStart':await action('start');break;
 case'hostNext':await action('next');break;
 case'hostEnd':panel('Vraag afronden?',`<p>${state.members.filter(m=>!m.left&&!m.correct).length} spelers hebben nog geen juist antwoord. Daarna kun je de uitwerking bespreken.</p><div class="panel-actions"><button id="confirmEnd" class="primary">Afronden</button><button data-close-panel>Verder werken</button></div>`);break;
 case'leaveSession':panel(state.owner?'Sessie afsluiten?':'Sessie verlaten?',`<p>${state.owner?'Alle deelnemers stoppen.':'Je eerdere antwoorden blijven bewaard.'}</p><button id="confirmLeave" class="primary">${state.owner?'Afsluiten':'Verlaten'}</button>`);break;
 case'copySession':{const u=new URL('start.html',location.href);u.searchParams.set('code',state.code);try{await navigator.clipboard.writeText(u.href);notice('Deelnamelink gekopieerd.');}catch{panel('Deelnamelink',`<input aria-label="Deelnamelink" readonly value="${esc(u.href)}">`);}break;}
 case'showMembers':roster();break;
 case'sessionHint':{const t=C.generate(state.spec.skill,state.spec.seed,state.spec.level,state.spec.variant),d=read(draftKey())||{};save(draftKey(),{...d,assisted:true});panel('Hint',`<p>${esc(t.hint)}</p>`);break;}
 case'showSolution':{const t=C.generate(state.spec.skill,state.spec.seed,state.spec.level,state.spec.variant);panel('Uitwerking',t.steps.map(s=>'<p>'+math(s)+'</p>').join(''));break;}
 case'refreshReport':await loadReport();break;case'exportReport':exportReport();break;
 }
});
$('space').addEventListener('submit',e=>{e.preventDefault();if(e.target.id==='joinSpace'){if(needsAccount())return;simulation=null;clearSimulationURL();action('join',{code:$('sessionCode').value});}if(e.target.id==='createSpace'){if(previewOnly&&account?.role==='teacher')startSimulation();else{simulation=null;clearSimulationURL();action('create',settings());}}if(e.target.id==='sessionAnswer'){const value=smartControl?.value()||'';try{C.parse(value)}catch(err){notice(err.message);return;}if(pending)return;pending={id:state.id,round:state.round,value,assisted:!!read(draftKey())?.assisted,request_id:crypto.randomUUID(),expectedAttempts:(state.mine?.attempts||0)+1};save(key()+':pending',pending);sendAnswer();}});
$('space').addEventListener('input',e=>{if(e.target.id==='reportSearch'){saveFilters();drawReport();}});
$('space').addEventListener('change',e=>{const t=e.target;if(t.name==='skills'){selected=[...document.querySelectorAll('[name=skills]:checked')].map(e=>e.value);selection();}if(t.id==='sessionLevel')level=Number(t.value);if(t.id==='sessionCount')count=Number(t.value);if(t.id==='sessionSeconds')seconds=Number(t.value);if(t.id==='sessionAudience'){audience=t.value;title((audience==='duo'?'Duo ':'Klas')+(activity==='learn'?'Learn':'Battle'));}if(t.id==='participate')participate=t.checked;if(t.id==='reportSort'){saveFilters();drawReport();}});
$('closePanel').onclick=()=>$('spacePanel').close();$('spacePanel').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-close-panel'))$('spacePanel').close();if(b.id==='confirmEnd'){$('spacePanel').close();action('end');}if(b.id==='confirmLeave'){$('spacePanel').close();action(state.owner?'close':'leave');}if(b.id==='simulateAnswers'){simulation.members.slice(1).forEach((m,i)=>{m.answered=true;m.correct=i!==1;m.reviewed=true;m.xp=m.correct?10:0;m.points=m.correct?1100:0;});accept(simulate('state'));roster();}});
async function identity(next){if(account!==undefined&&account?.id===next?.id&&account?.role===next?.role)return;epoch++;requestSerial++;clearTimeout(poll);account=next;previewOnly=previewOnly&&account?.role==='teacher';state=null;pending=null;simulation=null;report=null;boardKey='';smartControl=null;$('numbersXP').dataset.value='NaN';$('spacePanel').close();$('spaceContent').replaceChildren();title('Even laden…');const identityEpoch=epoch;
 if(account){const sim=read(simulationKey()),saved=read(key());if(new URLSearchParams(location.search).get('simulation')==='1'&&sim){simulation=sim;accept(simulate('state'));}else if((q.get('session')||saved?.id)&&!q.get('code'))try{state=await rpc('state',{id:q.get('session')||saved.id});pending=read(key()+':pending');accept(state);}catch{if(identityEpoch!==epoch)return;notice('Een vorige sessie kon nog niet worden geladen.');}}
 if(identityEpoch!==epoch)return;
 if(!simulation)loadXP();else $('numbersXP').dataset.value='NaN';
 const requested=q.get('view');if(requested==='students'&&account?.role!=='teacher'){setView('home');return;}if(['rankings','students'].includes(requested))setView(requested);else if(requested==='session'&&state)setView('session');else if(['learn','battle'].includes(requested)&&account){activity=requested;audience=q.get('audience')==='duo'?'duo':account.role==='teacher'?'class':'duo';setView('selection');}else setView('home');
}
AxiomaAuth.ready().then(()=>AxiomaAuth.getAccount()).then(identity).catch(e=>{home();notice('Je account kon niet laden. Solo en oefenbladen blijven bereikbaar.');});AxiomaAuth.onChange(()=>AxiomaAuth.getAccount().then(identity));
setInterval(()=>{clock();if(!simulation&&state?.phase==='question'&&account&&!document.hidden&&Date.now()-lastInput<60000&&Date.now()-lastPulse>=15000&&!busy){lastPulse=Date.now();rpc('pulse',{id:state.id}).catch(()=>{});}},1000);
addEventListener('online',()=>{if(pending)sendAnswer();else schedule();});
window.NumbersSpace={snapshot:()=>({view,selected,activity,state:structuredClone(state),pending:structuredClone(pending)}),get ready(){return !!$('spaceContent').children.length}};
})();
