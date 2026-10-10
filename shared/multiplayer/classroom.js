(function(){
'use strict';
const $=id=>document.getElementById(id),Game=window.BattleGame,baseFrame=$('board');
let frame=baseFrame;
const simulationBoards=new Map();
const BattlePresentation=window.LeraarBobBattlePresentation;
if(BattlePresentation){document.body.classList.add('battle-stage');const host=document.createElement('div');host.id='battleStandings';$('ranking').before(host);host.append($('ranking'));}
const boardQuestions=new WeakMap();
const moduleURL=new URL('.',document.currentScript.src),parameters=new URLSearchParams(location.search),embedded=parameters.get('hub')==='1'&&window.parent!==window;
const classFlow=Game.id==='rechten'&&(parameters.get('classFlow')==='1'||document.body.classList.contains('rechten-start')),Flow=window.LeraarBobClassActivityFlow;
const simulationRequested=()=>new URLSearchParams(location.search).get('simulation')==='1';
let simulator=null,simulationLoading=null;
const simulationKey=()=>`leraarbob-class-simulation:${Game.id}:${account.id}`;
const simulationStore=value=>{try{if(value===null)sessionStorage.removeItem(simulationKey());else sessionStorage.setItem(simulationKey(),JSON.stringify(value));}catch{}};
const simulationRead=()=>{try{return JSON.parse(sessionStorage.getItem(simulationKey())||'null');}catch{return null;}};
function portalStatus(){if(embedded)window.parent.postMessage({type:'leraarbob-class-status',game:Game.id,phase:state?.phase||(!$('login').hidden?'login':'setup'),playing:document.body.dataset.playing==='true',sessionId:state?.id||'',world:Game.id==='algebra'&&state?.spec?(state.spec.skill==='S1'?'systems':'equations'):$('world')?.value,level:Game.id==='algebra'&&((state?.spec?.skill==='S1')||(!state&&$('world')?.value==='systems'))?'S1':$('classPreset')?.value||parameters.get('level')||'',simulation:!!simulator||simulationRequested()},location.origin);}
const presentation=document.createElement('link');presentation.rel='stylesheet';presentation.href=new URL('simulation.css',moduleURL);document.head.append(presentation);
if(embedded)document.body.classList.add('classroom-embedded');
const opaque=location.protocol==='file:'||location.origin==='null',target=opaque?'*':location.origin,peerOrigin=opaque?'null':location.origin;
let account=null,state=null,epoch=0,chain=Promise.resolve(),pollTimer,frameReady=false,frameKey='',offset=0,pending=null,grading=false,actionBusy=false,lastRanking='';
let inviteCode='',reviewOpen=false,reviewKey='';
const serverFunction=Game.classFunction||(Game.id==='rechten'?'rechten-class':null);
function updateInviteCode(){
const invite=new URLSearchParams(location.search).get('code');
inviteCode=/^[A-Fa-f0-9]{6}$/.test(invite||'')?invite.toUpperCase():'';

if(inviteCode){$('joinCode').value=inviteCode;$('loginHint').textContent='De sessiecode '+inviteCode+' staat na het aanmelden al voor je klaar.';}
}
updateInviteCode();
const waiting=()=>!state.owner&&state.members.find(p=>p.user_id===account.id)?.eligible_from_round>state.round;
const storageKey=()=>`${Game.id==='vectoren'?'vector':Game.id}-class-session:${account.id}`;
const pendingKey=()=>`${Game.id==='vectoren'?'vector':Game.id}-class-answer:${account.id}`;
function store(key,value){try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,JSON.stringify(value));}catch{}}
function read(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
function notice(text){$('notice').textContent=text||'';}
function display(screen){if(classFlow){if(screen!=='setup')delete document.body.dataset.classFlow;if(screen!=='session'&&$('classFlowLobby')){Flow?.restore($('classFlowLobby'));$('classFlowLobby').hidden=true;}if(screen==='setup'&&account?.role==='teacher')mountClassSetup();}document.body.dataset.playing='false';if(screen!=='session')delete document.body.dataset.classStage;for(const id of ['login','setup','session'])$(id).hidden=id!==screen;portalStatus();}
function errorText(e){if(e?.code==='PGRST202'||/could not find.*function/i.test(e?.message||''))return 'De online klasmodus is nog niet beschikbaar. Probeer later opnieuw.';return e?.message||'De verbinding is onderbroken. Probeer opnieuw.';}
// Serialize requests so an older poll cannot replace a newer round or submission.
function rpc(action,data={}){
 const expected=epoch;
 const work=chain.catch(()=>{}).then(async()=>{
  if(expected!==epoch)throw Error('Je account is gewijzigd.');
  const client=AxiomaAuth.client();
  const controller=new AbortController();let timeout;
  const request=serverFunction?client.functions.invoke(serverFunction,{body:{action,data},signal:controller.signal}):client.rpc(Game.rpc,{p_action:action,p_data:{...data,game:Game.id}});
  let response;try{response=await Promise.race([request,new Promise((_,reject)=>{timeout=setTimeout(()=>{controller.abort();reject(Error('Geen verbinding. Probeer opnieuw; je sessie blijft bewaard.'));},15000);})]);}finally{clearTimeout(timeout);}
  const {data:result,error}=response;
  if(error&&serverFunction){let detail;try{detail=await error.context?.json();}catch{}throw Error(detail?.error||'De klasbattle is tijdelijk niet bereikbaar. Je kunt altijd alleen verder oefenen.');}
  if(result?.error)throw Error(result.error);
  if(expected!==epoch)throw Error('Je account is gewijzigd.');if(error)throw error;return result;
 });chain=work;return work;
}
function send(data){if(frameReady)frame.contentWindow.postMessage(data,target);}
function connectBoard(board){board.addEventListener('load',()=>{boardQuestions.delete(board);if(board===frame){frameReady=false;frameKey='';board.contentWindow.postMessage({type:'vector-battle-ping'},target);}});}
function selectSimulationBoard(){
 if(!simulator)return;
 const view=state.studentView?'student':'teacher';
 if(!simulationBoards.size){simulationBoards.set(view,frame);return;}
 let next=simulationBoards.get(view);
 if(!next){next=document.createElement('iframe');next.title=baseFrame.title;next.src=Game.playerURL+'?mode=class';next.hidden=true;connectBoard(next);simulationBoards.set(view,next);$('playArea').append(next);}
 if(next===frame)return;
 // Keep both DOMs in place: changing a view must not discard a half-filled answer.
 frame.id='simulation'+(state.studentView?'Teacher':'Student')+'Board';frame.hidden=true;
 frame=next;frame.id='board';frame.hidden=false;frameReady=false;frameKey='';reviewKey='';
 frame.contentWindow.postMessage({type:'vector-battle-ping'},target);
}
function resetSimulationBoards(){
 for(const board of simulationBoards.values())if(board!==baseFrame)board.remove();
 simulationBoards.clear();frame=baseFrame;frame.id='board';frame.hidden=false;
}
function rank(rows,key){const sorted=[...rows].sort((a,b)=>b[key]-a[key]||a.alias.localeCompare(b.alias)||a.user_id.localeCompare(b.user_id));let previous=null,place=0;return new Map(sorted.map((p,i)=>{if(p[key]!==previous)place=i+1;previous=p[key];return[p.user_id,place]}));}
function renderRanking(){
 const signature=JSON.stringify([state.phase,state.round,state.members]);if(signature===lastRanking)return;lastRanking=signature;
 if(BattlePresentation){BattlePresentation.render($('battleStandings'),{rows:state.members.map(p=>({id:p.user_id,alias:p.alias,points:p.points,previousPoints:state.round>0?p.previous_points:undefined})),ownId:account.id,final:['finished','closed'].includes(state.phase),roundKey:state.id+':'+state.round,list:$('ranking')});return;}
 const ranks=rank(state.members,'points'),before=rank(state.members,'previous_points');$('ranking').replaceChildren();
 const sorted=[...state.members].sort((a,b)=>ranks.get(a.user_id)-ranks.get(b.user_id)||a.alias.localeCompare(b.alias));
 const shown=sorted.filter((p,index)=>index<10||p.user_id===account.id);
 for(const p of shown){const li=document.createElement('li');if(p.user_id===account.id)li.className='mine';const movement=before.get(p.user_id)-ranks.get(p.user_id);
  for(const [value,cls] of [[ranks.get(p.user_id),'place'],[p.alias,'name'],[`${p.points} punten`,'points'],[state.round>0?(movement>0?`↑ ${movement}`:movement<0?`↓ ${-movement}`:'—'):'','movement '+(movement>0?'rise':movement<0?'fall':'')]]){const span=document.createElement('span');span.textContent=value;span.className=cls;li.append(span);}$('ranking').append(li);
 }
 $('ranking').classList.remove('changed');requestAnimationFrame(()=>$('ranking').classList.add('changed'));
}
function renderBoard(){
 if(state)selectSimulationBoard();
 if(!state||!frameReady||!state.spec||(!reviewOpen&&(waiting()||!['question','grading'].includes(state.phase))))return;
 const key=state.id+':'+state.round;
 const student=!!simulator&&state.studentView,submitted=student&&state.members[0].answered;
 if(frameKey!==key){frameKey=key;if(boardQuestions.get(frame)!==key){boardQuestions.set(frame,key);send({type:'vector-battle-question',match:state.id,index:state.round,...state.spec,singleAttempt:true,projector:!!state.owner&&!student,learner:student?state.members[0].user_id:account.id});}}
 if(reviewOpen){if(reviewKey!==key){reviewKey=key;send({type:'vector-class-review',match:state.id,index:state.round});}return;}
 if((state.owner&&!student)||submitted||state.mine?.submitted||state.phase==='grading'||pending)send({type:'vector-battle-resolved',match:state.id,index:state.round,message:simulator?submitted?'Antwoord ontvangen. Wacht op de uitslag.':'Leerkrachtbeeld · kies Leerlingbeeld om mee te doen.':state.owner?'De klas werkt.':state.mine?.submitted?'Antwoord ontvangen. Wacht op de uitslag.':pending?'Je inzending wordt verstuurd.':'De tijd is om. Wacht op de uitslag.'});
}
function accept(next){
 if(!state||next.round!==state.round||next.phase!==state.phase){reviewOpen=false;reviewKey='';}
 if(next.game&&next.game!==Game.id)throw Error('Deze sessie hoort bij een ander spel. Open de deelnamelink van je leerkracht.');
 {const url=new URL(location.href);url.searchParams.delete('create');history.replaceState(history.state,'',url);}
 state=next;if(!state.owner){const url=new URL(location.href);url.searchParams.set('code',state.code);if(url.href!==location.href){history.replaceState(null,'',url.href);updateInviteCode();}}offset=Date.parse(next.server_time)-Date.now();if(simulator)simulationStore(simulator.serialize());else store(storageKey(),state.id);
 if(!simulator&&(state.mine?.submitted||!pending||pending.id!==state.id||pending.round!==state.round||state.phase!=='question')){pending=null;store(pendingKey(),null);}
 display('session');render();schedule();
 if(!simulator&&!serverFunction&&state.owner&&state.phase==='grading')grade();portalStatus();
}
function render(){
 const phase=state.phase,late=waiting(),activeMembers=state.members.filter(p=>(p.eligible_from_round||0)<=state.round),ended=['finished','closed'].includes(phase),results=phase==='results'||ended;
 if(BattlePresentation){if(phase==='lobby'||results)document.body.dataset.classStage=phase;else delete document.body.dataset.classStage;$('battleStandings').hidden=reviewOpen;}
 const settingsOpen=!!$('classSimulationControls')?.open;document.body.dataset.playing=String(!late&&!settingsOpen&&['question','grading'].includes(phase));document.body.dataset.simulationSettings=String(settingsOpen);$('session').dataset.phase=phase;$('session').classList.toggle('host',state.owner);$('code').textContent=state.code;$('phaseLabel').textContent=({lobby:'WACHTKAMER',question:'RONDE BEZIG',grading:'ANTWOORDEN NAKIJKEN',results:'RANGLIJST',finished:'MISSIE VOLTOOID',closed:'SESSIE GESLOTEN'})[phase];
 $('sessionTitle').textContent=phase==='lobby'?'Wachten op de klas':ended?'Samen op koers':`Ronde ${state.round+1} van ${state.total}`;
 $('closeSession').hidden=!state.owner||ended;$('leaveSession').hidden=state.owner||phase!=='lobby';$('copyLink').hidden=!!simulator||!state.owner||ended;$('joinInstructions').hidden=!!simulator||!state.owner||phase!=='lobby';
 $('lobby').hidden=phase!=='lobby';$('playArea').hidden=late||settingsOpen||!['question','grading'].includes(phase);$('lateWait').hidden=!late||phase==='lobby'||ended;$('lateTitle').textContent=state.round+1<state.total?'Even wachten op de volgende ronde':'De laatste ronde is bezig';$('lateHelp').textContent=state.round+1<state.total?'Je alias staat in de sessie. Je speelt mee vanaf ronde '+(state.round+2)+', zodra je leerkracht die start.':'De laatste ronde is al gestart. Je kunt de eindranglijst bekijken en bij een nieuwe battle meedoen.';$('results').hidden=!results;
 $('members').replaceChildren();for(const p of state.members){const li=document.createElement('li');if(window.LeraarBobAvatar)li.append(LeraarBobAvatar.create(p));li.append(document.createTextNode(p.alias));$('members').append(li);}
 $('count').textContent=`${state.members.length} ${state.members.length===1?'leerling':'leerlingen'} in de sessie`;
 $('lobbyHelp').textContent=simulator?'Virtuele klas · stel antwoorden en snelheid in.':state.owner?'Deel de code. Start wanneer de klas klaar is.':'Wacht op de start.';
 $('start').hidden=!state.owner;$('start').disabled=!state.members.length||actionBusy;
 $('answered').textContent=`${activeMembers.filter(p=>p.answered).length} / ${activeMembers.length} ingediend`;
 const lateMembers=state.members.filter(p=>p.eligible_from_round>state.round);$('lateCount').hidden=!state.owner||!lateMembers.length;$('lateCount').textContent=lateMembers.length+' later aangesloten: '+lateMembers.map(p=>p.alias).join(', ');
 $('submissionStatus').textContent=phase==='grading'?'Wachten op de uitslag…':state.mine?.submitted?'Je antwoord is ontvangen.':pending?'Je antwoord is nog niet bevestigd.':state.owner?'':'Vul je antwoord in.';
 $('retrySubmit').hidden=!pending||phase!=='question'||!!state.mine?.submitted;
 $('resultTitle').textContent=phase==='finished'?'Eindranglijst':phase==='closed'?'Sessie gestopt':'Uitslag van deze ronde';
 $('resultSummary').textContent=state.round>=0?`${activeMembers.filter(p=>p.correct).length} van de ${activeMembers.length} leerlingen beantwoordden deze ronde juist.`:'De sessie is gesloten voordat een ronde begon.';
 $('ownResult').textContent=state.owner||late?'':state.mine?.submitted?(state.mine.correct?`Juist! +${state.mine.points} punten.`:'Deze ronde was je antwoord niet juist.'):state.round>=0?'Geen antwoord ingediend in deze ronde.':'';
 $('next').hidden=!state.owner||phase!=='results';$('next').textContent=state.round+1===state.total?'Bekijk eindranglijst →':'Volgende ronde →';$('newSession').hidden=!ended;
 if($('endRound')){$('endRound').hidden=!state.owner||phase!=='question';$('endRound').disabled=actionBusy;}
 if($('reviewToggle')){
  const available=Game.classReview&&state.spec&&['results','finished'].includes(phase);
  $('reviewToggle').hidden=!available;$('reviewToggle').textContent=reviewOpen?'Terug naar ranglijst':'Antwoord bespreken';$('reviewToggle').setAttribute('aria-expanded',String(reviewOpen));
  $('reviewHost').hidden=!reviewOpen;$('ranking').hidden=reviewOpen;$('rankingHelp').hidden=reviewOpen;
  // Moving an iframe reloads it; load/ready restores the current round, never its submission.
  const parent=reviewOpen?$('reviewHost'):$('playArea');
  if(frame.parentElement!==parent){frameReady=false;frameKey='';reviewKey='';parent.append(frame);}
  $('roundBreakdown').replaceChildren();
  if(results&&state.round>=0){for(const [label,count] of [['Juist',activeMembers.filter(p=>p.correct===true).length],['Onjuist',activeMembers.filter(p=>p.answered&&p.correct!==true).length],['Geen antwoord',activeMembers.filter(p=>!p.answered).length]]){const item=document.createElement('span');item.textContent=count+' '+label;item.dataset.kind=label;$('roundBreakdown').append(item);}}
 }
 if($('classAccuracy')){const pct=activeMembers.length?Math.round(100*activeMembers.filter(p=>p.correct===true).length/activeMembers.length):0;$('classAccuracy').value=pct;$('classAccuracy').textContent=pct+'%';$('classAccuracyText').textContent=pct+'% juist';$('classAccuracy').dataset.band=pct>=75?'high':pct>=40?'middle':'low';}if(results)renderRanking();renderSimulation();mountClassLobby(phase);renderBoard();tick();
}
function tick(){if(!state)return;if(simulator&&simulator.advance()){accept(simulator.snapshot());return;}const left=Math.max(0,Math.ceil((Date.parse(state.deadline)-Date.now()-offset)/1000));$('timer').textContent=state.phase==='question'?`${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`:'Tijd afgelopen';if(state.phase==='question'&&left===0)send({type:'vector-battle-resolved',match:state.id,index:state.round,message:'De tijd is om. Wacht op de uitslag.'});}
function schedule(){clearTimeout(pollTimer);if(simulator||!state||['closed','finished'].includes(state.phase))return;const captured=epoch;pollTimer=setTimeout(async()=>{try{const next=await rpc('state',{id:state.id});if(captured===epoch){notice('');accept(next);if(pending&&state.phase==='question')submit();}}catch(e){if(captured===epoch){notice('Verbinding onderbroken. We proberen opnieuw. '+errorText(e));schedule();}}},1500);}
async function action(name,data={}){if(actionBusy)return;actionBusy=true;document.querySelectorAll('form button,#start,#next,#confirmStop').forEach(b=>b.disabled=true);try{notice('');accept(simulator?simulator.action(name):await rpc(name,{id:state?.id,...data}));}catch(e){notice(errorText(e));}finally{actionBusy=false;document.querySelectorAll('form button,#start,#next,#confirmStop').forEach(b=>b.disabled=false);if(state)render();}}
async function grade(){
 if(grading)return;grading=true;const current=state;
 try{const task=Game.generate(current.spec);const grades=current.submissions.map(s=>{let correct=false;try{correct=!s.skipped&&Game.validate(task,s.answer).ok;}catch{}return{user_id:s.user_id,correct};});accept(await rpc('grade',{id:current.id,round:current.round,grades}));}
 catch(e){notice('Nakijken lukt nog niet. '+errorText(e));}finally{grading=false;}
}
async function submit(){if(!pending)return;try{notice('');const current=pending;accept(await rpc('submit',current));}catch(e){notice('Je inzending is nog niet bevestigd. '+errorText(e));if(state)render();}}
async function identity(next){
 if(account?.id===next?.id&&account?.role===next?.role)return;
 if(classFlow){Flow?.restore($('hostForm'));if($('classFlowLobby'))Flow?.restore($('classFlowLobby'));delete document.body.dataset.classFlow;}epoch++;clearTimeout(pollTimer);state=null;simulator=null;pending=null;frameKey='';lastRanking='';account=next;notice('');if($('resumeClassSession'))$('resumeClassSession').hidden=true;document.body.classList.remove('class-simulation');if($('classSimulationControls'))$('classSimulationControls').hidden=true;if($('classSimulationSetup'))$('classSimulationSetup').hidden=true;if($('simulationEndRound'))$('simulationEndRound').hidden=true;
 // Drop the old account's board and answer on an account switch.
 resetSimulationBoards();frameReady=false;frame.src=Game.playerURL+'?mode=class';
 $('identity').textContent=account?(account.role==='teacher'?'Leerkracht':account.alias||'Account'):'';$('logout').hidden=!account;
 if(!account){display('login');return;}
 if(!['teacher','student'].includes(account.role)){display('login');notice('Dit account heeft geen leerling- of leerkrachtprofiel.');return;}
 display('setup');$('setupTitle').textContent=account.role==='teacher'?'Speel samen met je klas.':'Welkom, '+account.alias+'.';$('joinIdentity').textContent='Je doet mee als '+(account.alias||'leerling')+' met je leraarBob-account.';$('hostForm').hidden=account.role!=='teacher';$('joinForm').hidden=account.role!=='student';$('setupText').textContent=account.role==='teacher'?'Kies de oefeningen en de rondetijd. Je ontvangt een code die je met de klas deelt.':'Voer de code van je leerkracht in. Je naam verschijnt vanzelf in de wachtkamer.';
 if(account.role==='teacher'){restoreClassConfig();mountSimulationSetup();mountClassSetup();portalStatus();}
 if(simulationRequested()){if(account.role!=='teacher'){notice('Alleen een leerkrachtaccount kan een simulatie starten.');return;}simulationLabels();const saved=simulationRead();if(saved&&parameters.get('create')!=='1')await beginSimulation(saved);else if(saved)mountResume(()=>beginSimulation(saved),'Hervat simulatie');return;}
 if(embedded&&parameters.get('join')==='1'&&inviteCode&&account.role==='student'){
  const captured=epoch,id=read(storageKey());if(id){try{const previous=await rpc('state',{id});if(captured!==epoch)return;if(previous.code===inviteCode){pending=read(pendingKey());accept(previous);return;}}catch(e){if(captured!==epoch)return;}}
  await action('join',{code:inviteCode});return;
 }
 const id=parameters.get('session')||read(storageKey());if(id&&parameters.get('create')==='1'){mountResume(async()=>{pending=read(pendingKey());await action('state',{id});},'Lopende battle hervatten');return;}if(id){try{const previous=await rpc('state',{id});if(inviteCode&&previous.code!==inviteCode)return;pending=read(pendingKey());accept(previous);}catch(e){notice('Je vorige sessie kon nog niet worden hervat. Je bewaarde inzending blijft behouden. '+errorText(e));}}
}
for(const world of Game.worlds)$('world').append(new Option(world.name,world.id));
$('world').append(new Option('Mixed · meerdere werelden','mixed'));
function pool(){return $('world').value==='mixed'?Game.mixedSkills:(Game.worlds.find(w=>w.id===$('world').value)?.skills||Game.mixedSkills);}
function updateSkills(){ $('skill').replaceChildren(new Option('Mix van dit onderdeel','mix'));for(const id of pool())$('skill').append(new Option(Game.skills.find(s=>s.id===id).label,id)); }
// Presentation settings are separate from a live session and never award progress.
const algebraSettings=Game.id==='algebra'&&!!$('classWorlds');
const configKey=()=>`leraarbob-class-config:${Game.id}:${account?.id}`;
function classConfig(){return {world:$('world').value,preset:$('classPreset')?.value,rounds:$('rounds').value,seconds:$('seconds').value,types:[...document.querySelectorAll('[name=classType]:checked')].map(e=>e.value),negative:$('classNegative')?.checked,fractions:$('classFractions')?.checked,decimals:$('classDecimals')?.checked};}
function saveClassConfig(){
 if(!algebraSettings||account?.role!=='teacher')return;
 try{sessionStorage.setItem(configKey(),JSON.stringify(classConfig()));}catch{}
 const url=new URL(location.href);url.searchParams.set('world',$('world').value);url.searchParams.set('level',$('world').value==='systems'?'S1':$('classPreset').value);history.replaceState(history.state,'',url);portalStatus();
}
function summarizeClassConfig(){
 if(!algebraSettings)return;
 const chosen=[...document.querySelectorAll('[name=classType]:checked')].filter(e=>pool().includes(e.value));
 $('classSelectionSummary').textContent=$('world').value==='systems'?'Eenvoudige stelsels · hele getallen':chosen.length+' vraagvorm'+(chosen.length===1?'':'en');
}
function chooseClassPreset(id,save=true){
 const preset=Game.presets?.find(p=>p.id===id);if(!preset)return;
 $('classPreset').value=id;const selected=new Set(preset.skills);
 document.querySelectorAll('[name=classType]').forEach(e=>e.checked=selected.has(e.value));
 if(selected.size>Number($('rounds').value))$('rounds').value=String([3,5,10,20].find(n=>n>=selected.size)||20);
 summarizeClassConfig();if(save)saveClassConfig();
}
function chooseClassWorld(id,preset='',save=true){
 if(!algebraSettings||!Game.worlds.some(w=>w.id===id))return;
 const changed=$('world').value!==id;$('world').value=id;updateSkills();window.AlgebraShell?.classroomOrigin(id);
 document.querySelectorAll('[data-class-world]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.classWorld===id)));
 document.querySelectorAll('#classTypes fieldset').forEach(g=>g.hidden=g.dataset.world!==id);
 $('classPresetLabel').hidden=$('classAdvanced').hidden=id==='systems';
 if(id==='systems'){document.querySelectorAll('[name=classType]').forEach(e=>e.checked=e.value==='S1');if(changed||!save)$('seconds').value='180';}
 else chooseClassPreset(preset||$('classPreset').value||Game.presets?.[0]?.id,false);
 summarizeClassConfig();if(save)saveClassConfig();
}
function restoreClassConfig(){
 if(!algebraSettings)return;
 let draft;try{draft=JSON.parse(sessionStorage.getItem(configKey())||'null');}catch{}
 const requested=parameters.get('world')||parameters.get('topic'),level=parameters.get('level');
 if(draft&&(!requested||requested===draft.world)&&(!level||level===draft.preset||level==='S1'&&draft.world==='systems')){
  chooseClassWorld(draft.world,draft.preset,false);
  for(const id of ['rounds','seconds'])if([...$(id).options].some(o=>o.value===draft[id]))$(id).value=draft[id];
  const selected=new Set(Array.isArray(draft.types)?draft.types:[]);document.querySelectorAll('[name=classType]').forEach(e=>e.checked=selected.has(e.value)&&pool().includes(e.value));
  for(const [field,prop] of [['classNegative','negative'],['classFractions','fractions'],['classDecimals','decimals']])$(field).checked=!!draft[prop];summarizeClassConfig();
 }else{chooseClassWorld(requested==='systems'?'systems':'equations',level,false);if(!['equations','systems'].includes(requested)&&Game.skills.some(s=>s.level===requested)){document.querySelectorAll('[name=classType]').forEach(e=>e.checked=Game.skills.some(s=>s.id===e.value&&s.level===requested));summarizeClassConfig();}}
 saveClassConfig();
}
function mountClassSetup(){
 if(!classFlow||account?.role!=='teacher'||!$('startSimulation'))return;
 const form=$('hostForm'),preview=simulationRequested(),label=id=>$(id)?.closest('label');
 for(const [id,text]of [['world','Onderwerp'],['skill','Vraagvorm'],['rounds','Rondes'],['seconds','Tijd per ronde']]){const node=label(id);if(node?.firstChild?.nodeType===3)node.firstChild.textContent=text;}
 $('startSimulation').textContent='Simulatie';
 Flow?.setup(form,{world:'Rechtenwereld',topic:label('world'),skills:label('skill'),options:[label('rounds'),label('seconds'),preview?label('simulationCount'):null],help:form.querySelector('p.hint'),submit:preview?$('startSimulation'):form.querySelector('button.primary'),secondary:preview?[$('resumeClassSession')&&!$('resumeClassSession').hidden?$('resumeClassSession'):null]:[$('startSimulation'),$('resumeClassSession')&&!$('resumeClassSession').hidden?$('resumeClassSession'):null],simulation:preview});
}
function mountClassLobby(phase){
 if(!classFlow)return;let host=$('classFlowLobby');if(phase!=='lobby'){if(host){Flow?.restore(host);host.hidden=true;}$('lobby').hidden=true;document.querySelector('.session-bar').hidden=false;delete document.body.dataset.classFlow;return;}
 if(!host){host=document.createElement('section');host.id='classFlowLobby';$('lobby').before(host);}host.hidden=false;
 Flow?.lobby(host,{world:'Rechtenwereld',code:$('code'),members:$('members'),count:$('count'),help:$('lobbyHelp'),start:state.owner?$('start'):null,copy:!simulator&&state.owner?$('copyLink'):null,stop:state.owner?$('closeSession'):$('leaveSession'),stopLabel:state.owner?'Sessie afsluiten':'Sessie verlaten',simulation:!!simulator});
 $('lobby').hidden=true;document.querySelector('.session-bar').hidden=true;
}
function loadSimulation(){
 if(window.LeraarBobClassSimulation)return Promise.resolve(window.LeraarBobClassSimulation);
 if(!simulationLoading)simulationLoading=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('simulation.js?v=20261005-student-view',moduleURL);script.onload=()=>resolve(window.LeraarBobClassSimulation);script.onerror=()=>{simulationLoading=null;reject(Error('De simulatie kon niet laden. Herlaad de pagina en probeer opnieuw.'));};document.head.append(script);});return simulationLoading;
}
function buildDeck(){
 if(classFlow){const world=$('world').value,skill=$('skill').value;if(!(Game.worlds.some(w=>w.id===world)||world==='mixed')||!(skill==='mix'||pool().includes(skill)))throw Error('Kies een geldig onderwerp en een geldige vraagvorm.');}
 const selected=Game.multiSelect?[...document.querySelectorAll('[name=classType]:checked')].map(e=>e.value).filter(id=>!algebraSettings||pool().includes(id)):$('skill').value==='mix'?pool():[$('skill').value],count=Number($('rounds').value);
 if(!selected.length)throw Error('Kies minstens één vraagvorm.');if(Game.multiSelect&&selected.length>count)throw Error('Kies meer rondes of minder types, zodat elk gekozen type aan bod komt.');
 const seeds=crypto.getRandomValues(new Uint32Array(count));return Array.from({length:count},(_,i)=>({skill:selected[i%selected.length],seed:seeds[i],variant:i%4,level:Game.levelSelect&&$('classLevel')?Number($('classLevel').value):1,...(Game.multiSelect?{fractions:$('classFractions').checked,decimals:$('classDecimals').checked,negative:$('classNegative').checked}:{})}));
}
function mountResume(resume,label){
 let button=$('resumeClassSession');if(!button){button=document.createElement('button');button.id='resumeClassSession';button.type='button';button.className='resume-class';$('setup').prepend(button);}
 button.textContent=label;button.hidden=false;button.onclick=async()=>{button.disabled=true;try{await resume();button.hidden=true;}catch(e){notice(errorText(e));}finally{button.disabled=false;}};mountClassSetup();
}
function mountSimulationSetup(){
 if($('classSimulationSetup')){$('classSimulationSetup').hidden=false;return;}
 const panel=document.createElement('section');panel.id='classSimulationSetup';panel.className='class-simulation-setup';panel.innerHTML='<h2>Simulatie</h2><label>Virtuele leerlingen <select id="simulationCount"><option value="4">4 leerlingen</option><option value="6" selected>6 leerlingen</option><option value="8">8 leerlingen</option><option value="12">12 leerlingen</option></select></label><button id="startSimulation" type="button">Start simulatie →</button><small>Geen echte resultaten.</small>';
 $('hostForm').after(panel);$('startSimulation').onclick=()=>beginSimulation().catch(e=>notice(errorText(e)));
}
function simulationLabels(){$('hostForm').querySelector('h2').textContent='Simulatie instellen';$('hostForm').querySelector('button.primary').hidden=true;$('setupTitle').textContent='Simulatie';$('setupText').textContent='';mountClassSetup();}
async function beginSimulation(saved=null){
 if(account?.role!=='teacher')throw Error('Alleen een leerkrachtaccount kan een simulatie starten.');const owner=account.id,currentEpoch=epoch,options=saved?{saved}:{deck:buildDeck(),seconds:Number($('seconds').value),count:Number($('simulationCount').value)};
 const engine=await loadSimulation();if(currentEpoch!==epoch||account?.id!==owner||account?.role!=='teacher')return;
 clearTimeout(pollTimer);simulator=engine.create({game:Game,...options});pending=null;frameKey='';reviewKey='';lastRanking='';document.body.classList.add('class-simulation');const url=new URL(location.href);url.searchParams.set('simulation','1');url.searchParams.delete('code');history.replaceState(null,'',url);simulationLabels();notice('');accept(simulator.snapshot());
}
function renderSimulation(){
 if(!simulator)return;
 if(!$('endRound')&&!$('simulationEndRound')){const end=document.createElement('button');end.id='simulationEndRound';end.type='button';end.textContent='Ronde afronden';end.onclick=()=>action('end_round');document.querySelector('.round-status').append(end);}if($('simulationEndRound'))$('simulationEndRound').hidden=state.phase!=='question';
 let controls=$('classSimulationControls');if(!controls){controls=document.createElement('details');controls.id='classSimulationControls';controls.className='class-simulation-controls';controls.innerHTML='<summary>Virtuele klas</summary><span class="class-simulation-badge">SIMULATIE · GEEN LEERLINGRESULTATEN</span><p>Kies antwoord en snelheid.</p><div class="class-simulation-actions"><button id="simulationTry" type="button">Zelf proberen</button><a id="simulationReal">Naar echte klasbattle</a></div><p id="simulationTryStatus" role="status"></p><ul id="simulationLearners" class="class-simulation-learners"></ul>';document.querySelector('.session-bar').after(controls);controls.addEventListener('toggle',()=>{if(state){render();portalStatus();}});
  $('simulationTry').onclick=()=>{try{accept(simulator.tryBoard());$('classSimulationControls').open=false;}catch(e){notice(errorText(e));}};
  const real=new URL(location.href);real.searchParams.delete('simulation');$('simulationReal').href=real.href;if(embedded)$('simulationReal').onclick=e=>{e.preventDefault();window.parent.postMessage({type:'leraarbob-class-launch',game:Game.id,mode:'live'},location.origin);};
 }
 controls.hidden=false;controls.dataset.phase=state.phase;
 const list=$('simulationLearners');if(list.dataset.match!==state.id){list.dataset.match=state.id;list.replaceChildren();for(const p of state.members){const li=document.createElement('li'),name=document.createElement('strong');name.textContent=p.alias;li.append(name);for(const [kind,choices]of [['plan',[['correct','Juist'],['wrong','Onjuist'],['none','Geen antwoord']]],['pace',[['fast','Snel'],['normal','Gemiddeld'],['slow','Langzaam']]]]){const label=document.createElement('label'),select=document.createElement('select');select.dataset.learner=p.user_id;select.dataset.setting=kind;select.setAttribute('aria-label',(kind==='plan'?'Antwoord van ':'Snelheid van ')+p.alias);for(const [value,text]of choices)select.append(new Option(text,value));select.value=p[kind];select.onchange=()=>accept(simulator.configure(p.user_id,kind==='plan'?select.value:null,kind==='pace'?select.value:null));label.append(select);li.append(label);}const status=document.createElement('span');status.className='simulation-answer';status.dataset.simulationLearner=p.user_id;li.append(status);list.append(li);}}
 for(const p of state.members){const status=list.querySelector('[data-simulation-learner="'+p.user_id+'"]');status.textContent=p.answered?(p.correct?'Juist · +'+p.round_points+' punten':'Onjuist · 0 punten'):state.phase==='lobby'?'Klaar voor de start':state.phase==='question'?'Nog geen antwoord':'Geen antwoord';}
 $('simulationTry').disabled=state.phase!=='question';$('simulationTry').textContent=state.studentView?'Leerkrachtbeeld':'Leerlingbeeld';$('simulationTryStatus').textContent=state.tryResult||(state.studentView?'Leerlingbeeld · je speelt als '+state.members[0].alias+'.':'Leerkrachtbeeld');
}
const requestedWorld=new URLSearchParams(location.search).get('world');
if(Game.worlds.some(w=>w.id===requestedWorld)||requestedWorld==='mixed')$('world').value=requestedWorld;
$('world').onchange=updateSkills;updateSkills();
$('logout').onclick=async()=>{try{await AxiomaAuth.signOut();await identity(null);}catch(e){notice(errorText(e));}};
if(Game.multiSelect&&$('classTypes')){
 for(const world of Game.worlds){const group=document.createElement('fieldset'),title=document.createElement('legend');title.textContent=world.name;group.dataset.world=world.id;group.append(title);for(const id of world.skills){const item=Game.skills.find(s=>s.id===id),label=document.createElement('label'),input=document.createElement('input'),text=document.createElement('span');input.type='checkbox';input.value=id;input.name='classType';input.checked=world.id===Game.worlds[0].id;text.textContent=item.label;label.title=item.description;label.append(input,text);group.append(label);}$('classTypes').append(group);}
}
if(algebraSettings){
 for(const world of Game.worlds){const b=document.createElement('button');b.type='button';b.dataset.classWorld=world.id;b.textContent=world.name;b.onclick=()=>chooseClassWorld(world.id);$('classWorlds').append(b);}
 for(const preset of Game.presets||[])$('classPreset').append(new Option(preset.label,preset.id));
 $('classPreset').onchange=()=>chooseClassPreset($('classPreset').value);
 $('world').onchange=()=>chooseClassWorld($('world').value);
 $('hostForm').addEventListener('change',()=>{summarizeClassConfig();saveClassConfig();});
 chooseClassWorld(parameters.get('world')==='systems'||parameters.get('topic')==='systems'?'systems':'equations',parameters.get('level'),false);
}
$('hostForm').onsubmit=e=>{e.preventDefault();try{if(new URLSearchParams(location.search).get('simulation')==='1'){beginSimulation().catch(error=>notice(errorText(error)));return;}action('create',{deck:buildDeck(),seconds:Number($('seconds').value)});}catch(error){notice(errorText(error));}};
$('joinForm').onsubmit=e=>{e.preventDefault();action('join',{code:$('joinCode').value.trim().toUpperCase()});};
if($('endRound'))$('endRound').onclick=()=>action('end_round');
if($('reviewToggle'))$('reviewToggle').onclick=()=>{reviewOpen=!reviewOpen;reviewKey='';render();};
$('start').onclick=()=>action('start');$('next').onclick=()=>action('next');$('retrySubmit').onclick=submit;
$('newSession').onclick=()=>{clearTimeout(pollTimer);if(simulator){simulationStore(null);simulator=null;document.body.classList.remove('class-simulation');$('classSimulationControls').hidden=true;if($('simulationEndRound'))$('simulationEndRound').hidden=true;}else{store(storageKey(),null);store(pendingKey(),null);}state=null;pending=null;frameKey='';const url=new URL(location.href);for(const key of ['session','code','join'])url.searchParams.delete(key);url.searchParams.set('create','1');history.replaceState(history.state,'',url);display('setup');};
$('leaveSession').onclick=async()=>{try{await rpc('leave',{id:state.id});$('newSession').click();}catch(e){notice(errorText(e));}};
$('closeSession').onclick=()=>$('stopDialog').showModal();$('cancelStop').onclick=()=>$('stopDialog').close();$('confirmStop').onclick=async()=>{await action('close');$('stopDialog').close();};
$('copyLink').onclick=async()=>{const osEntry=classFlow&&parameters.get('osEntry')==='1',url=new URL(osEntry?'../../../os/':classFlow?'../../../klasbattle/':location.href,location.href);url.search='';url.searchParams.set(osEntry?'classCode':'code',state.code);try{await navigator.clipboard.writeText(url.href);notice('Deelnamelink gekopieerd.');}catch{notice(`Deel deze code met je klas: ${state.code}`);}};
addEventListener('message',event=>{
 if(event.source!==frame.contentWindow||event.origin!==peerOrigin)return;const data=event.data;if(!data||typeof data!=='object')return;
 if(data.type==='vector-battle-ready'){frameReady=true;frameKey='';reviewKey='';renderBoard();return;}
 if(data.type==='vector-battle-answer'&&simulator&&state?.trying&&state.phase==='question'&&data.match===state.id&&data.index===state.round){accept(simulator.submit(data.answer,!!data.skipped));return;}
 if(data.type!=='vector-battle-answer'||!state||state.owner||waiting()||state.phase!=='question'||state.mine?.submitted||pending||data.match!==state.id||data.index!==state.round)return;
 pending={id:state.id,round:state.round,answer:data.answer,skipped:!!data.skipped};store(pendingKey(),pending);renderBoard();submit();
});
connectBoard(baseFrame);
setInterval(tick,250);
addEventListener('online',()=>{if(state){schedule();if(pending)submit();}});
addEventListener('axioma:login-complete',async event=>{await identity(event.detail.account);if(!$('setup').hidden)(account?.role==='teacher'?(algebraSettings?document.querySelector('[data-class-world][aria-pressed=true]'):$('world')):$('joinCode')).focus();});
AxiomaAuth.onChange(({account:a,pending:p})=>identity(p?null:a));
AxiomaAuth.ready().then(({account:a})=>{if(!a){display('login');return;}return identity(a);}).catch(e=>{display('login');notice(errorText(e));});
window.LeraarBobClassroom=Object.freeze({snapshot:()=>state?JSON.parse(JSON.stringify(state)):null,simulation:()=>!!simulator});
})();
