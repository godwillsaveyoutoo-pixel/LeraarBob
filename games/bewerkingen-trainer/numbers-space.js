(()=>{
'use strict';
const C=BewerkingenCore,$=id=>document.getElementById(id),q=new URLSearchParams(location.search);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const math=s=>katex.renderToString(s,{throwOnError:false,strict:'ignore'});
let previewOnly=q.get('simulation')==='1';
let account=undefined,view='home',activity='learn',audience='class',group=C.GROUPS.some(g=>g.id===q.get('world'))?q.get('world'):'machten';
let serverScientificVersion=1;
const taskFromSpec=spec=>C.generate(spec.skill,spec.seed,spec.level,spec.variant,spec.generatorVersion??1);
let selected=C.SKILLS.filter(s=>s.group===group).map(s=>s.id),level=[0,1,2].includes(Number(q.get('level')))&&q.has('level')?Number(q.get('level')):1,count=[5,10,20].includes(Number(q.get('count')))?Number(q.get('count')):5,seconds=180,participate=true,state=null,pending=null,epoch=0,busy=false,poll=null,boardKey='',offset=0,report=null,simulation=null,lastInput=Date.now(),lastPulse=0,requestSerial=0,smartControl=null;
const embedded=q.get('hub')==='1'&&window.parent!==window,classFlow=embedded&&q.get('classFlow')==='1',Flow=window.LeraarBobClassActivityFlow;
if(embedded)document.body.classList.add('numbers-embedded');
function commonSetup(){return classFlow&&account?.role==='teacher'&&activity==='battle'&&audience==='class';}
function portalStatus(){if(!embedded)return;const spec=state?.spec,skill=spec&&C.SKILLS.find(s=>s.id===spec.skill);window.parent.postMessage({type:'leraarbob-class-status',game:'bewerkingen',phase:view==='session'&&state?({question:'question',review:'results',finished:'finished',closed:'closed',lobby:'lobby'})[state.phase]||'setup':'setup',playing:view==='session'&&state?.phase==='question',sessionId:state?.id||'',moduleView:view,activity:view==='selection'?activity:state?.activity||activity,audience:view==='selection'?audience:state?.audience||audience,world:view==='selection'?group:skill?.group||group,level:String(view==='selection'?level:spec?.level??level),skills:selected.join(','),count,seconds,participate,simulation:!!simulation||previewOnly,xp:simulation||previewOnly?null:Number.isFinite(Number($('numbersXP').dataset.value))?Number($('numbersXP').dataset.value):null},location.origin);}
const requestedSkills=(q.get('skills')||'').split(',').filter(id=>C.SKILLS.some(s=>s.id===id));if(requestedSkills.length)selected=[...new Set(requestedSkills)];else if(q.has('skills')&&!q.get('skills'))selected=[];
if(['learn','battle'].includes(q.get('activity')))activity=q.get('activity');if(['duo','class'].includes(q.get('audience')))audience=q.get('audience');if([60,120,180,300].includes(Number(q.get('seconds'))))seconds=Number(q.get('seconds'));participate=q.get('participate')!=='0';
const key=()=>`leraarbob:numbers-session:${account?.id}`,draftKey=()=>`${key()}:${state?.id}:${state?.round}`,simulationKey=()=>`${key()}:simulation`;
const save=(k,v)=>{try{sessionStorage.setItem(k,JSON.stringify(v))}catch{}};
const read=k=>{try{return JSON.parse(sessionStorage.getItem(k)||'null')}catch{return null}};
async function loadXP(){if(!account||simulation)return;try{const data=await rpc('summary');$('numbersXP').dataset.value=data.xp;serverScientificVersion=data.protocolVersion===2&&data.generatorVersions?.includes(2)?2:1;scientificLevels();portalStatus();}catch{}}
function notice(s=''){$('spaceNotice').textContent=s;}
function title(s){$('spaceTitle').textContent=s;$('spaceCrumb').textContent=s;
 const label=view==='session'&&state?.spec?C.SKILLS.find(t=>t.id===state.spec.skill)?.label:selected.length===1?C.SKILLS.find(t=>t.id===selected[0])?.label:C.GROUPS.find(g=>g.id===group)?.label;
 $('spaceEyebrow').textContent=['rankings','students'].includes(view)?'GETALLENWERELD':(label||'GETALLENWERELD')+(view==='home'&&q.get('scope')==='chapter'?' · hoofdstukselectie':'');
}
function saveSelection(){const u=new URL(location.href);u.searchParams.set('world',group);u.searchParams.set('skills',selected.join(','));u.searchParams.set('level',level);u.searchParams.set('count',count);u.searchParams.set('activity',activity);u.searchParams.set('audience',audience);u.searchParams.set('seconds',seconds);u.searchParams.set('participate',participate?'1':'0');history.replaceState(null,'',u);portalStatus();}
function setView(next,{url=true}={}){if(Flow){Flow.restore($('createSpace'));if($('sessionWork'))Flow.restore($('sessionWork'));}delete document.body.dataset.classFlow;view=next;document.body.dataset.view=next;boardKey='';$('spaceContent').replaceChildren();notice();if(url){const u=new URL(location.href);u.searchParams.set('view',next);if(state)u.searchParams.set('session',state.id);else u.searchParams.delete('session');history.replaceState(null,'',u);saveSelection();}render();}
function login(){window.LeraarBobTopbar?.openAccount();}
const needsAccount=()=>{if(account)return false;notice('Meld je aan om samen te spelen en je klasresultaten te bekijken.');login();return true;};
function routeNative(intent,mode='solo'){
 const url=new URL('./',location.href);url.searchParams.set('screen','setup');url.searchParams.set('mode',mode);url.searchParams.set('world',group);url.searchParams.set('returnTo',LeraarBobRoutes.safeReturn(q.get('returnTo'),'games/getallenwereld/'));url.searchParams.set('skills',selected.join(','));url.searchParams.set('level',level);url.searchParams.set('count',count);if(intent)url.searchParams.set('intent',intent);location.href=url;
}
function render(){
 $('resumeSession').hidden=!state||view==='session';
 if(view==='home')home();else if(view==='selection')selection();else if(view==='session')session();else if(view==='rankings'||view==='students')reports();portalStatus();
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
function selection(){if($('createSpace'))Flow?.restore($('createSpace'));
 title((previewOnly?'Simulatie · ':'')+(audience==='duo'?'Duo ':'Klas')+(activity==='learn'?'Learn':'Battle'));
 $('spaceContent').innerHTML=`<form id="createSpace" class="selection-screen"><nav class="group-tabs" aria-label="Onderwerp">${C.GROUPS.map(g=>`<button type="button" data-group="${g.id}" aria-pressed="${group===g.id}">${esc(({machten:'Machten',wortels:'Wortels',wetenschappelijk:'Schrijfwijze'})[g.id])}</button>`).join('')}</nav>
 <div class="skill-grid">${C.SKILLS.filter(s=>s.group===group).map(s=>`<label class="skill-choice"><input type="checkbox" name="skills" value="${s.id}" ${selected.includes(s.id)?'checked':''}><span>${esc(s.label)}</span></label>`).join('')}</div>
 <div class="selection-options"><label>Niveau<select id="sessionLevel"><option value="0">Start</option><option value="1">Basis</option><option value="2">Verdieping</option></select></label><label>Vragen<select id="sessionCount">${[5,10,20].map(n=>`<option>${n}</option>`).join('')}</select></label>${activity==='battle'?'<label>Per vraag<select id="sessionSeconds"><option value="60">1 minuut</option><option value="120">2 minuten</option><option value="180">3 minuten</option><option value="300">5 minuten</option></select></label>':''}${account?.role==='teacher'?`<label>Met wie<select id="sessionAudience"><option value="class">Met de klas</option><option value="duo">Met twee online</option></select></label><label class="participate"><input id="participate" type="checkbox" ${participate?'checked':''}>Ik doe mee</label>`:''}</div>
 <div class="space-bottom"><small id="selectionSummary">${selected.length} vraagvormen · ${activity==='learn'?'op eigen tempo verbeteren':'één inzending per vraag'}</small><div>${account?.role==='teacher'&&!previewOnly?'<button type="button" id="simulateSpace">Simulatie</button> ':''}<button class="primary" ${selected.length?'':'disabled'}>${previewOnly?'Simulatie starten':'Maak sessie'} →</button></div></div></form>`;
 $('sessionLevel').value=level;$('sessionCount').value=count;if($('sessionSeconds'))$('sessionSeconds').value=seconds;if($('sessionAudience'))$('sessionAudience').value=audience;scientificLevels();
 if($('simulateSpace'))$('simulateSpace').disabled=!selected.length;
 if(commonSetup()){
  $('sessionAudience').closest('label').hidden=true;
  for(const [id,label]of [['sessionCount','Rondes'],['sessionSeconds','Tijd per ronde']]){const node=$(id)?.closest('label');if(node?.firstChild?.nodeType===3)node.firstChild.textContent=label;}
  const form=$('createSpace');Flow?.setup(form,{world:'Getallenwereld',topic:form.querySelector('.group-tabs'),skills:form.querySelector('.skill-grid'),options:form.querySelector('.selection-options'),help:[$('selectionSummary'),$('scientificSessionLevelHint')&&!$('scientificSessionLevelHint').hidden?$('scientificSessionLevelHint'):null],submit:form.querySelector('button.primary'),secondary:[$('simulateSpace'),!$('resumeSession').hidden?$('resumeSession'):null],simulation:previewOnly});
 }
}
function scientificLevels(){const select=$('sessionLevel');if(!select)return;const scientific=selected.length===1&&selected[0]==='scientific',version=previewOnly?2:serverScientificVersion;const labels=scientific&&version===2?['Start · grote gehele getallen','Basis · grote en kleine getallen','Verdieping · nullen en verre exponenten']:['Start','Basis','Verdieping'];[...select.options].forEach((option,i)=>option.textContent=labels[i]);let hint=$('scientificSessionLevelHint');if(!hint){hint=document.createElement('small');hint.id='scientificSessionLevelHint';(select.closest('.selection-options')||select.closest('.lb-class-options')).after(hint);}hint.hidden=!selected.includes('scientific');hint.textContent=version===2?C.SCIENTIFIC_LEVELS[level].description:'Deze online reeksen gebruiken de bestaande vraagmix. Bij wetenschappelijke schrijfwijze bevatten Basis en Verdieping dezelfde vragen. Nieuwe eigen reeksen en oefenbladen hebben drie verschillende niveaus.';}
function settings(){return {skills:selected,level,count,seconds,activity,audience,participate,generatorVersion:C.SCIENTIFIC_VERSION};}
async function rpc(action,data={}){
 const captured=epoch,client=AxiomaAuth.client(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{const r=await client.functions.invoke('numbers-session',{body:{action,data:{...data,generatorVersion:C.SCIENTIFIC_VERSION}},signal:controller.signal});if(captured!==epoch)throw Error('Je account is gewijzigd.');
 if(r.error){let body;try{body=await r.error.context?.json()}catch{}throw Error(body?.error||'De sessie is niet bereikbaar. Probeer opnieuw.');}if(r.data?.error)throw Error(r.data.error);return r.data;
 }finally{clearTimeout(timer);}
}
function accept(next){if(next.spec&&![1,2].includes(next.spec.generatorVersion??1))throw Error('Vernieuw Getallenwereld om deze sessie te openen.');state=next;offset=Date.parse(next.server_time)-Date.now();if(simulation){save(simulationKey(),simulation);}else save(key(),{id:state.id});if(pending&&(state.round!==pending.round||state.phase!=='question'||(state.mine&&state.mine.attempts>=pending.expectedAttempts))){pending=null;save(key()+':pending',null);}if(view==='session')session();$('resumeSession').hidden=view==='session';portalStatus();schedule();}
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
 document.body.classList.add('battle-stage');
 if(!state){setView('home');return;}document.body.dataset.phase=state.phase;title(`${state.activity==='learn'?'Learn':'Battle'} · ${state.audience==='class'?'klas':'duo'}`);
 const me=state.members.find(m=>m.id===(simulation?'preview':account?.id)),waiting=me&&me.eligible>state.round;
 const keyNow=state.id+':'+state.round+':'+state.phase;
 if(boardKey!==keyNow){if($('sessionWork'))Flow?.restore($('sessionWork'));delete document.body.dataset.classFlow;boardKey=keyNow;
  $('spaceContent').innerHTML=`<div class="session-strip"><button id="sessionBack" aria-label="Terug naar overzicht">←</button><span>${simulation?'<span class="simulation-badge">SIMULATIE · </span>':''}<strong>${simulation?'':esc(state.code)}</strong> · ${state.round<0?'Wachtkamer':`${state.round+1} / ${state.total}`}</span><span id="sessionClock"></span><div><button id="copySession" ${simulation?'hidden':''}>Link</button> <button id="showMembers">${state.members.length} spelers</button></div></div><div id="sessionWork" class="waiting-card"></div><div class="space-bottom" id="sessionActions"></div>`;
  if(['question','review'].includes(state.phase)&&!(state.activity==='battle'&&state.phase==='review')){
   const task=taskFromSpec(state.spec),draft=read(draftKey())||{};
   $('sessionWork').className='session-work';$('sessionWork').innerHTML=`<section class="question-side"><p>${esc(C.SKILLS.find(s=>s.id===task.skill).label)}</p><div class="space-formula">${math(task.tex)}</div><p>${esc(task.instruction||task.condition)}</p></section><form id="sessionAnswer" class="answer-side"><div id="smartSessionAnswer"></div><p id="answerFeedback" class="space-feedback" role="status"></p><div class="panel-actions"><button class="primary" id="submitAnswer" form="sessionAnswer">${state.activity==='learn'?'Controleer':'Indienen'}</button>${state.activity==='learn'?'<button type="button" id="sessionHint">Hint</button>':''}${state.phase==='review'?'<button type="button" id="showSolution">Uitwerking</button>':''}</div></form>`;$('sessionWork').querySelector('.question-side').append($('answerFeedback'));
   smartControl=SmartAnswer.mount($('smartSessionAnswer'),task,{state:draft.smart,value:draft.value??state.mine?.value??'',onChange(smart,value){lastInput=Date.now();const d=read(draftKey())||{};save(draftKey(),{...d,smart,value});$('submitAnswer').disabled=!value;}});
  }
 }
 $('showMembers').textContent=state.members.filter(m=>!m.left).length+' spelers';
 const uniformLobby=classFlow&&state.activity==='battle'&&state.audience==='class'&&state.phase==='lobby';
 if(uniformLobby&&$('sessionWork').querySelector('.lb-class-flow')){const list=$('classFlowMembers');list.replaceChildren(...state.members.filter(m=>!m.left).map(m=>{const node=document.createElement('span');node.textContent=m.alias;return node;}));$('classFlowCount').textContent=state.members.filter(m=>!m.left).length+' deelnemers';if($('hostStart'))$('hostStart').disabled=busy||!state.members.some(m=>!m.left);portalStatus();clock();return;}
 if(state.phase==='lobby'){
  $('sessionWork').innerHTML=`<p>Deel de code. Iedereen gebruikt zijn eigen toestel.</p><strong class="big-code">${esc(state.code)}</strong><div class="member-chips">${state.members.filter(m=>!m.left).map(m=>`<span>${esc(m.alias)}</span>`).join('')||'<span>Wachten op deelnemers…</span>'}</div>`;
 }else if(state.activity==='battle'&&['review','finished','closed'].includes(state.phase)){
  battleResults();
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
 $('sessionActions').innerHTML=`<button id="leaveSession">${state.owner?'Sessie afsluiten':'Verlaten'}</button><small>${state.phase==='question'?`${unanswered} nog bezig`:state.phase==='review'?'Bespreek de antwoorden.':''}</small>${state.phase==='review'&&state.activity==='learn'&&state.audience==='duo'&&me?`<button id="approveDiscussion" ${me.reviewed?'disabled':''}>${me.reviewed?'Bespreking bevestigd':'Besproken · klaar'}</button>`:''}${state.activity==='battle'&&state.phase==='review'?'<button id="showSolution">Uitwerking</button>':''}${state.owner?(state.phase==='lobby'?'<button id="hostStart" class="primary">Start →</button>':state.phase==='question'?'<button id="hostEnd">Vraag afronden</button>':state.phase==='review'?`<button id="hostNext" class="primary" ${discussion&&!state.members.filter(m=>!m.left).every(m=>m.reviewed)?'disabled':''}>${state.round+1===state.total?'Afronden':'Volgende vraag'} →</button>`:''):''}`;
 if(answerActions){answerActions.classList.add('answer-actions');$('sessionActions').append(answerActions);}
 if(busy)$('sessionActions').querySelectorAll('button').forEach(b=>b.disabled=true);
 if(uniformLobby){const work=$('sessionWork'),code=work.querySelector('.big-code'),members=work.querySelector('.member-chips'),help=work.querySelector('p'),countNode=document.createElement('p');members.id='classFlowMembers';countNode.id='classFlowCount';countNode.textContent=state.members.filter(m=>!m.left).length+' deelnemers';work.append(countNode);if($('hostStart'))$('hostStart').disabled=busy||!state.members.some(m=>!m.left);Flow?.lobby(work,{world:'Getallenwereld',code,members,count:countNode,help,start:$('hostStart'),copy:simulation?null:$('copySession'),stop:$('leaveSession'),secondary:$('sessionBack'),stopLabel:state.owner?'Sessie afsluiten':'Sessie verlaten',simulation:!!simulation});work.closest('#spaceContent').querySelector('.session-strip').hidden=true;}
 portalStatus();clock();
}
async function sendAnswer(){if(!pending||busy)return;await action('submit',pending);}
function panel(titleText,body){$('panelTitle').textContent=titleText;$('panelContent').innerHTML=body;if(!$('spacePanel').open)$('spacePanel').showModal();}
function battleResults(){
 const work=$('sessionWork');work.className='waiting-card';
 if(!work.querySelector('.battle-standings')){work.replaceChildren();const title=document.createElement('h2');title.textContent=state.phase==='review'?'Ronde afgerond':state.phase==='closed'?'Sessie gesloten':'Eindresultaat';const summary=document.createElement('p');summary.className='round-result-summary';summary.id='battleRoundSummary';const host=document.createElement('div');host.className='battle-standings';work.append(title,summary,host);}
 const eligible=state.members.filter(m=>m.eligible<=state.round);$('battleRoundSummary').textContent=(simulation?'Simulatie · ':'')+(state.round<0?'Geen ronde gespeeld.':`${eligible.filter(m=>m.correct===true).length} / ${eligible.length} juist deze ronde`)+(state.phase==='review'&&state.mine?(state.mine.correct?' · Jouw antwoord is juist.':' · Jouw antwoord is nog niet juist.'):'');
 const mine=state.members.find(m=>m.id===account?.id);if(!simulation&&Number.isFinite(mine?.xp))$('battleRoundSummary').append(document.createTextNode(' · '+mine.xp+' XP deze sessie'));
 LeraarBobBattlePresentation.render(work.querySelector('.battle-standings'),{rows:state.members.map(m=>({id:m.id,alias:m.alias,points:m.points})),ownId:simulation?'preview':account?.id,final:state.phase!=='review',roundKey:state.id+':'+state.round});
 if(state.phase!=='review'&&!$('backHome')){const back=document.createElement('button');back.id='backHome';back.textContent='Naar overzicht';work.append(back);}
}
function roster(){panel('Spelers',`<table><thead><tr><th>Alias</th><th>Deze vraag</th><th>XP</th></tr></thead><tbody>${state.members.map(m=>`<tr><td>${esc(m.alias)}${m.left?' · vertrokken':''}</td><td>${m.correct===true?'Juist':m.answered?'Ingediend':'Bezig'}${m.answer?'<br>'+esc(m.answer):''}${m.reviewed?' · besproken':''}</td><td>${m.xp??'—'}</td></tr>`).join('')}</tbody></table>${simulation?'<p>Voorbeeldleerlingen. Er worden geen resultaten opgeslagen.</p><button id="simulateAnswers">Laat voorbeeldleerlingen antwoorden</button>':''}`);}
function clock(){if(!$('sessionClock'))return;const remaining=state?.deadline?Math.max(0,Math.ceil((Date.parse(state.deadline)-Date.now()-offset)/1000)):null;$('sessionClock').textContent=remaining!==null&&state.phase==='question'?`${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`:state?.activity==='learn'?'Eigen tempo':'';}
function clearSimulationURL(){const u=new URL(location.href);u.searchParams.delete('simulation');history.replaceState(null,'',u);}
function startSimulation(){
 if(account?.role!=='teacher'||!selected.length){notice('Kies minstens één vraagvorm.');return;}
 requestSerial++;clearTimeout(poll);pending=null;$('numbersXP').dataset.value='NaN';
 const deck=Array.from({length:Math.max(count,selected.length)},(_,i)=>({skill:selected[i%selected.length],seed:crypto.getRandomValues(new Uint32Array(1))[0],level,variant:i%4,...(selected[i%selected.length]==='scientific'?{generatorVersion:C.SCIENTIFIC_VERSION}:{})}));
 simulation={id:'simulation-'+crypto.randomUUID(),code:'VOORBEELD',activity,audience,owner:true,participant:true,generatorVersion:selected.includes('scientific')?2:1,round:-1,total:deck.length,deck,phase:'lobby',members:['Jij als leerling','Voorbeeld Noor','Voorbeeld Sam','Voorbeeld Alex'].slice(0,audience==='duo'?2:4).map((alias,i)=>({id:i?'sample'+i:'preview',alias,eligible:0,xp:0,points:0})),mine:null};
 const u=new URL(location.href);u.searchParams.set('simulation','1');history.replaceState(null,'',u);accept(simulate('state'));setView('session');
}
function simulate(name,data={}){
 const s=simulation;
 if(name==='start'||name==='next'){s.round++;s.phase=s.round>=s.total?'finished':'question';s.round=Math.min(s.round,s.total-1);s.spec=s.deck[s.round];s.mine=null;s.members.forEach(m=>{m.answered=false;m.correct=null;m.reviewed=false});s.deadline=s.activity==='battle'?new Date(Date.now()+seconds*1000).toISOString():null;}
 if(name==='end'||s.phase==='question'&&s.deadline&&Date.now()>=Date.parse(s.deadline))s.phase='review';
 if(name==='approve')s.members[0].reviewed=true;
 if(name==='close'||name==='leave')s.phase='closed';
 if(name==='submit'&&s.phase==='question'){
  const t=taskFromSpec(s.spec),correct=C.check(t,data.value).ok,tries=(s.mine?.attempts||0)+1;
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
 if(go){if(go==='class-battle'&&classFlow&&(simulation||previewOnly)&&account?.role==='teacher'){window.parent.postMessage({type:'leraarbob-class-launch',game:'bewerkingen',mode:'live'},location.origin);return;}if(go==='solo'||go==='paper'||go==='duo'||go==='board'){routeNative(go==='paper'?'worksheet':'',go==='duo'?'duo':go==='board'?'teacher':'solo');return;}if(needsAccount())return;if(/^(duo|class)-(learn|battle)$/.test(go)){[audience,activity]=go.split('-');previewOnly=false;clearSimulationURL();setView('selection');}else setView(go);return;}
 if(b.dataset.group){group=b.dataset.group;selected=C.SKILLS.filter(s=>s.group===group).map(s=>s.id);saveSelection();selection();return;}
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
 case'copySession':{const u=new URL(classFlow?'../../klasbattle/':'start.html',location.href);u.searchParams.set('code',state.code);try{await navigator.clipboard.writeText(u.href);notice('Deelnamelink gekopieerd.');}catch{panel('Deelnamelink',`<input aria-label="Deelnamelink" readonly value="${esc(u.href)}">`);}break;}
 case'showMembers':roster();break;
 case'sessionHint':{const t=taskFromSpec(state.spec),d=read(draftKey())||{};save(draftKey(),{...d,assisted:true});panel('Hint',`<p>${esc(t.hint)}</p>`);break;}
 case'showSolution':{const t=taskFromSpec(state.spec);panel('Uitwerking',t.steps.map(s=>'<p>'+math(s)+'</p>').join(''));break;}
 case'refreshReport':await loadReport();break;case'exportReport':exportReport();break;
 }
});
$('space').addEventListener('submit',e=>{e.preventDefault();if(e.target.id==='joinSpace'){if(needsAccount())return;simulation=null;clearSimulationURL();action('join',{code:$('sessionCode').value});}if(e.target.id==='createSpace'){if(!selected.length){notice('Kies minstens één vraagvorm.');return;}if(previewOnly&&account?.role==='teacher')startSimulation();else{simulation=null;clearSimulationURL();action('create',settings());}}if(e.target.id==='sessionAnswer'){const value=smartControl?.value()||'';try{C.parse(value)}catch(err){notice(err.message);return;}if(pending)return;pending={id:state.id,round:state.round,value,assisted:!!read(draftKey())?.assisted,request_id:crypto.randomUUID(),expectedAttempts:(state.mine?.attempts||0)+1};save(key()+':pending',pending);sendAnswer();}});
$('space').addEventListener('input',e=>{if(e.target.id==='reportSearch'){saveFilters();drawReport();}});
$('space').addEventListener('change',e=>{const t=e.target;if(t.name==='skills'){selected=[...document.querySelectorAll('[name=skills]:checked')].map(e=>e.value);$('selectionSummary').textContent=selected.length+' vraagvormen · '+(activity==='learn'?'op eigen tempo verbeteren':'één inzending per vraag');document.querySelector('#createSpace button.primary').disabled=!selected.length;if($('simulateSpace'))$('simulateSpace').disabled=!selected.length;}if(t.id==='sessionLevel')level=Number(t.value);if(t.id==='sessionCount')count=Number(t.value);if(t.id==='sessionSeconds')seconds=Number(t.value);if(t.id==='sessionAudience'){audience=t.value;title((audience==='duo'?'Duo ':'Klas')+(activity==='learn'?'Learn':'Battle'));}if(t.id==='participate')participate=t.checked;if(t.id==='reportSort'){saveFilters();drawReport();}if(t.closest('#createSpace')){scientificLevels();saveSelection();}});
$('closePanel').onclick=()=>$('spacePanel').close();$('spacePanel').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-close-panel'))$('spacePanel').close();if(b.id==='confirmEnd'){$('spacePanel').close();action('end');}if(b.id==='confirmLeave'){$('spacePanel').close();action(state.owner?'close':'leave');}if(b.id==='simulateAnswers'){simulation.members.slice(1).forEach((m,i)=>{m.answered=true;m.correct=i!==1;m.reviewed=true;m.xp=m.correct?10:0;m.points=m.correct?1100:0;});accept(simulate('state'));roster();}});
async function identity(next){if(account!==undefined&&account?.id===next?.id&&account?.role===next?.role)return;epoch++;requestSerial++;clearTimeout(poll);account=next;if(account?.role!=='teacher')audience='duo';previewOnly=previewOnly&&account?.role==='teacher';state=null;pending=null;simulation=null;report=null;boardKey='';smartControl=null;$('numbersXP').dataset.value='NaN';$('spacePanel').close();$('spaceContent').replaceChildren();title('Even laden…');const identityEpoch=epoch;
 if(account){const sim=read(simulationKey()),saved=read(key());if(new URLSearchParams(location.search).get('simulation')==='1'&&sim){simulation=sim;accept(simulate('state'));}else if((q.get('session')||saved?.id)&&!q.get('code'))try{state=await rpc('state',{id:q.get('session')||saved.id});pending=read(key()+':pending');accept(state);}catch{if(identityEpoch!==epoch)return;notice('Een vorige sessie kon nog niet worden geladen.');}}
 if(identityEpoch!==epoch)return;
 if(!simulation)loadXP();else $('numbersXP').dataset.value='NaN';
 if(embedded&&q.get('join')==='1'&&/^[A-Fa-f0-9]{8}$/.test(q.get('code')||'')&&account?.role==='student'&&!state){await action('join',{code:q.get('code')});if(identityEpoch!==epoch)return;if(state){const u=new URL(location.href);u.searchParams.delete('code');u.searchParams.delete('join');history.replaceState(null,'',u);return;}}
 const requested=q.get('moduleView')||q.get('view');if(requested==='students'&&account?.role!=='teacher'){setView('home');return;}if(['rankings','students'].includes(requested))setView(requested);else if(requested==='session'&&state)setView('session');else if(requested==='selection'&&account){setView('selection');}else if(['learn','battle'].includes(requested)&&account){activity=requested;audience=q.get('audience')==='duo'?'duo':account.role==='teacher'?'class':'duo';setView('selection');}else setView('home');
}
AxiomaAuth.ready().then(()=>AxiomaAuth.getAccount()).then(identity).catch(e=>{home();notice('Je account kon niet laden. Solo en oefenbladen blijven bereikbaar.');});AxiomaAuth.onChange(()=>AxiomaAuth.getAccount().then(identity));
setInterval(()=>{clock();if(!simulation&&state?.phase==='question'&&account&&!document.hidden&&Date.now()-lastInput<60000&&Date.now()-lastPulse>=15000&&!busy){lastPulse=Date.now();rpc('pulse',{id:state.id}).catch(()=>{});}},1000);
addEventListener('online',()=>{if(pending)sendAnswer();else schedule();});
window.NumbersSpace={snapshot:()=>({view,selected,activity,state:structuredClone(state),pending:structuredClone(pending)}),get ready(){return !!$('spaceContent').children.length}};
})();
