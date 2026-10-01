(function(){
'use strict';
const $=id=>document.getElementById(id),Game=window.BattleGame,frame=$('board');
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
function display(screen){document.body.dataset.playing='false';for(const id of ['login','setup','session'])$(id).hidden=id!==screen;}
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
function rank(rows,key){const sorted=[...rows].sort((a,b)=>b[key]-a[key]||a.alias.localeCompare(b.alias)||a.user_id.localeCompare(b.user_id));let previous=null,place=0;return new Map(sorted.map((p,i)=>{if(p[key]!==previous)place=i+1;previous=p[key];return[p.user_id,place]}));}
function renderRanking(){
 const signature=JSON.stringify([state.phase,state.round,state.members]);if(signature===lastRanking)return;lastRanking=signature;
 const ranks=rank(state.members,'points'),before=rank(state.members,'previous_points');$('ranking').replaceChildren();
 const sorted=[...state.members].sort((a,b)=>ranks.get(a.user_id)-ranks.get(b.user_id)||a.alias.localeCompare(b.alias));
 const shown=sorted.filter((p,index)=>index<10||p.user_id===account.id);
 for(const p of shown){const li=document.createElement('li');if(p.user_id===account.id)li.className='mine';const movement=before.get(p.user_id)-ranks.get(p.user_id);
  for(const [value,cls] of [[ranks.get(p.user_id),'place'],[p.alias,'name'],[`${p.points} punten`,'points'],[state.round>0?(movement>0?`↑ ${movement}`:movement<0?`↓ ${-movement}`:'—'):'','movement '+(movement>0?'rise':movement<0?'fall':'')]]){const span=document.createElement('span');span.textContent=value;span.className=cls;li.append(span);}$('ranking').append(li);
 }
 $('ranking').classList.remove('changed');requestAnimationFrame(()=>$('ranking').classList.add('changed'));
}
function renderBoard(){
 if(!state||!frameReady||!state.spec||(!reviewOpen&&(waiting()||!['question','grading'].includes(state.phase))))return;
 const key=state.id+':'+state.round;
 if(frameKey!==key){frameKey=key;send({type:'vector-battle-question',match:state.id,index:state.round,...state.spec,singleAttempt:true,projector:!!state.owner,learner:account.id});}
 if(reviewOpen){if(reviewKey!==key){reviewKey=key;send({type:'vector-class-review',match:state.id,index:state.round});}return;}
 if(state.owner||state.mine?.submitted||state.phase==='grading'||pending)send({type:'vector-battle-resolved',match:state.id,index:state.round,message:state.owner?'De leerlingen werken op hun eigen toestel.':state.mine?.submitted?'Antwoord ontvangen. Wacht op de uitslag.':pending?'Je inzending wordt verstuurd.':'De tijd is om. Wacht op de uitslag.'});
}
function accept(next){
 if(!state||next.round!==state.round||next.phase!==state.phase){reviewOpen=false;reviewKey='';}
 if(next.game&&next.game!==Game.id)throw Error('Deze sessie hoort bij een ander spel. Open de deelnamelink van je leerkracht.');state=next;if(!state.owner){const url=new URL(location.href);url.searchParams.set('code',state.code);if(url.href!==location.href){history.replaceState(null,'',url.href);updateInviteCode();}}offset=Date.parse(next.server_time)-Date.now();store(storageKey(),state.id);
 if(state.mine?.submitted||!pending||pending.id!==state.id||pending.round!==state.round||state.phase!=='question'){pending=null;store(pendingKey(),null);}
 display('session');render();schedule();
 if(!serverFunction&&state.owner&&state.phase==='grading')grade();
}
function render(){
 const phase=state.phase,late=waiting(),activeMembers=state.members.filter(p=>(p.eligible_from_round||0)<=state.round),ended=['finished','closed'].includes(phase),results=phase==='results'||ended;
 document.body.dataset.playing=String(!late&&['question','grading'].includes(phase));$('session').dataset.phase=phase;$('session').classList.toggle('host',state.owner);$('code').textContent=state.code;$('phaseLabel').textContent=({lobby:'WACHTKAMER',question:'RONDE BEZIG',grading:'ANTWOORDEN NAKIJKEN',results:'RANGLIJST',finished:'MISSIE VOLTOOID',closed:'SESSIE GESLOTEN'})[phase];
 $('sessionTitle').textContent=phase==='lobby'?'Wachten op de klas':ended?'Samen op koers':`Ronde ${state.round+1} van ${state.total}`;
 $('closeSession').hidden=!state.owner||ended;$('leaveSession').hidden=state.owner||phase!=='lobby';$('copyLink').hidden=!state.owner||ended;$('joinInstructions').hidden=!state.owner||phase!=='lobby';
 $('lobby').hidden=phase!=='lobby';$('playArea').hidden=late||!['question','grading'].includes(phase);$('lateWait').hidden=!late||phase==='lobby'||ended;$('lateTitle').textContent=state.round+1<state.total?'Even wachten op de volgende ronde':'De laatste ronde is bezig';$('lateHelp').textContent=state.round+1<state.total?'Je alias staat in de sessie. Je speelt mee vanaf ronde '+(state.round+2)+', zodra je leerkracht die start.':'De laatste ronde is al gestart. Je kunt de eindranglijst bekijken en bij een nieuwe battle meedoen.';$('results').hidden=!results;
 $('members').replaceChildren();for(const p of state.members){const li=document.createElement('li');if(window.LeraarBobAvatar)li.append(LeraarBobAvatar.create(p));li.append(document.createTextNode(p.alias));$('members').append(li);}
 $('count').textContent=`${state.members.length} ${state.members.length===1?'leerling':'leerlingen'} in de sessie`;
 $('lobbyHelp').textContent=state.owner?'Deel de code of deelnamelink. Jij kiest wanneer je start; leerlingen kunnen ook later aansluiten. '+(serverFunction?'Je kunt deze sessie na herladen hervatten.':'Houd dit leerkrachtvenster open tijdens de sessie.'):'Je doet mee! Wacht tot je leerkracht de eerste ronde start.';
 $('start').hidden=!state.owner;$('start').disabled=!state.members.length||actionBusy;
 $('answered').textContent=`${activeMembers.filter(p=>p.answered).length} / ${activeMembers.length} ingediend`;
 const lateMembers=state.members.filter(p=>p.eligible_from_round>state.round);$('lateCount').hidden=!state.owner||!lateMembers.length;$('lateCount').textContent=lateMembers.length+' later aangesloten: '+lateMembers.map(p=>p.alias).join(', ');
 $('submissionStatus').textContent=phase==='grading'?'Wachten op de uitslag…':state.mine?.submitted?'Je antwoord is ontvangen.':pending?'Je antwoord is nog niet bevestigd.':state.owner?'Eén antwoord per leerling.':'Werk je antwoord uit.';
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
 if($('classAccuracy')){const pct=activeMembers.length?Math.round(100*activeMembers.filter(p=>p.correct===true).length/activeMembers.length):0;$('classAccuracy').value=pct;$('classAccuracy').textContent=pct+'%';$('classAccuracyText').textContent=pct+'% juist';$('classAccuracy').dataset.band=pct>=75?'high':pct>=40?'middle':'low';}if(results)renderRanking();renderBoard();tick();
}
function tick(){if(!state)return;const left=Math.max(0,Math.ceil((Date.parse(state.deadline)-Date.now()-offset)/1000));$('timer').textContent=state.phase==='question'?`${left} s`:'Tijd afgelopen';if(state.phase==='question'&&left===0)send({type:'vector-battle-resolved',match:state.id,index:state.round,message:'De tijd is om. Wacht op de uitslag.'});}
function schedule(){clearTimeout(pollTimer);if(!state||['closed','finished'].includes(state.phase))return;const captured=epoch;pollTimer=setTimeout(async()=>{try{const next=await rpc('state',{id:state.id});if(captured===epoch){notice('');accept(next);if(pending&&state.phase==='question')submit();}}catch(e){if(captured===epoch){notice('Verbinding onderbroken. We proberen opnieuw. '+errorText(e));schedule();}}},1500);}
async function action(name,data={}){if(actionBusy)return;actionBusy=true;document.querySelectorAll('form button,#start,#next,#confirmStop').forEach(b=>b.disabled=true);try{notice('');accept(await rpc(name,{id:state?.id,...data}));}catch(e){notice(errorText(e));}finally{actionBusy=false;document.querySelectorAll('form button,#start,#next,#confirmStop').forEach(b=>b.disabled=false);if(state)render();}}
async function grade(){
 if(grading)return;grading=true;const current=state;
 try{const task=Game.generate(current.spec);const grades=current.submissions.map(s=>{let correct=false;try{correct=!s.skipped&&Game.validate(task,s.answer).ok;}catch{}return{user_id:s.user_id,correct};});accept(await rpc('grade',{id:current.id,round:current.round,grades}));}
 catch(e){notice('Nakijken lukt nog niet. '+errorText(e));}finally{grading=false;}
}
async function submit(){if(!pending)return;try{notice('');const current=pending;accept(await rpc('submit',current));}catch(e){notice('Je inzending is nog niet bevestigd. '+errorText(e));if(state)render();}}
async function identity(next){
 if(account?.id===next?.id&&account?.role===next?.role)return;
 epoch++;clearTimeout(pollTimer);state=null;pending=null;frameKey='';lastRanking='';account=next;notice('');
 // Drop the old account's board and answer on an account switch.
 frameReady=false;frame.src=Game.playerURL+'?mode=class';
 $('identity').textContent=account?(account.role==='teacher'?'Leerkracht':account.alias||'Account'):'';$('logout').hidden=!account;
 if(!account){display('login');return;}
 if(!['teacher','student'].includes(account.role)){display('login');notice('Dit account heeft geen leerling- of leerkrachtprofiel.');return;}
 display('setup');$('setupTitle').textContent=account.role==='teacher'?'Speel samen met je klas.':'Welkom, '+account.alias+'.';$('joinIdentity').textContent='Je doet mee als '+(account.alias||'leerling')+' met je leraarBob-account.';$('hostForm').hidden=account.role!=='teacher';$('joinForm').hidden=account.role!=='student';$('setupText').textContent=account.role==='teacher'?'Kies de oefeningen en de rondetijd. Je ontvangt een code die je met de klas deelt.':'Voer de code van je leerkracht in. Je naam verschijnt vanzelf in de wachtkamer.';
 const id=read(storageKey());if(id){try{const previous=await rpc('state',{id});if(account.role==='student'&&inviteCode&&previous.code!==inviteCode)return;pending=read(pendingKey());accept(previous);}catch(e){notice('Je vorige sessie kon nog niet worden hervat. Je bewaarde inzending blijft behouden. '+errorText(e));}}
}
for(const world of Game.worlds)$('world').append(new Option(world.name,world.id));
$('world').append(new Option('Mixed · meerdere werelden','mixed'));
function pool(){return $('world').value==='mixed'?Game.mixedSkills:Game.worlds.find(w=>w.id===$('world').value).skills;}
function updateSkills(){ $('skill').replaceChildren(new Option('Mix van dit onderdeel','mix'));for(const id of pool())$('skill').append(new Option(Game.skills.find(s=>s.id===id).label,id)); }
const requestedWorld=new URLSearchParams(location.search).get('world');
if(Game.worlds.some(w=>w.id===requestedWorld))$('world').value=requestedWorld;
$('world').onchange=updateSkills;updateSkills();
$('logout').onclick=async()=>{try{await AxiomaAuth.signOut();await identity(null);}catch(e){notice(errorText(e));}};
if(Game.multiSelect&&$('classTypes')){
 for(const world of Game.worlds){const group=document.createElement('fieldset'),title=document.createElement('legend');title.textContent=world.name;group.append(title);for(const id of world.skills){const item=Game.skills.find(s=>s.id===id),label=document.createElement('label'),input=document.createElement('input'),text=document.createElement('span');input.type='checkbox';input.value=id;input.name='classType';input.checked=world.id===Game.worlds[0].id;text.textContent=item.label;label.title=item.description;label.append(input,text);group.append(label);}$('classTypes').append(group);}
}
$('hostForm').onsubmit=e=>{e.preventDefault();const selected=Game.multiSelect?[...document.querySelectorAll('[name=classType]:checked')].map(e=>e.value):$('skill').value==='mix'?pool():[$('skill').value],count=Number($('rounds').value);if(!selected.length){notice('Kies minstens één vraagvorm.');return;}if(Game.multiSelect&&selected.length>count){notice('Kies meer rondes of minder types, zodat elk gekozen type aan bod komt.');return;}const seeds=crypto.getRandomValues(new Uint32Array(count));const deck=Array.from({length:count},(_,i)=>({skill:selected[i%selected.length],seed:seeds[i],variant:i%4,level:Game.levelSelect&&$('classLevel')?Number($('classLevel').value):1,...(Game.multiSelect?{fractions:$('classFractions').checked,decimals:$('classDecimals').checked,negative:$('classNegative').checked}:{})}));action('create',{deck,seconds:Number($('seconds').value)});};
$('joinForm').onsubmit=e=>{e.preventDefault();action('join',{code:$('joinCode').value.trim().toUpperCase()});};
if($('endRound'))$('endRound').onclick=()=>action('end_round');
if($('reviewToggle'))$('reviewToggle').onclick=()=>{reviewOpen=!reviewOpen;reviewKey='';render();};
$('start').onclick=()=>action('start');$('next').onclick=()=>action('next');$('retrySubmit').onclick=submit;
$('newSession').onclick=()=>{clearTimeout(pollTimer);store(storageKey(),null);store(pendingKey(),null);state=null;pending=null;frameKey='';display('setup');};
$('leaveSession').onclick=async()=>{try{await rpc('leave',{id:state.id});$('newSession').click();}catch(e){notice(errorText(e));}};
$('closeSession').onclick=()=>$('stopDialog').showModal();$('cancelStop').onclick=()=>$('stopDialog').close();$('confirmStop').onclick=async()=>{await action('close');$('stopDialog').close();};
$('copyLink').onclick=async()=>{const url=new URL(location.href);url.search='';url.searchParams.set('code',state.code);try{await navigator.clipboard.writeText(url.href);notice('Deelnamelink gekopieerd.');}catch{notice(`Deel deze code met je klas: ${state.code}`);}};
addEventListener('message',event=>{
 if(event.source!==frame.contentWindow||event.origin!==peerOrigin)return;const data=event.data;if(!data||typeof data!=='object')return;
 if(data.type==='vector-battle-ready'){frameReady=true;frameKey='';reviewKey='';renderBoard();return;}
 if(data.type!=='vector-battle-answer'||!state||state.owner||waiting()||state.phase!=='question'||state.mine?.submitted||pending||data.match!==state.id||data.index!==state.round)return;
 pending={id:state.id,round:state.round,answer:data.answer,skipped:!!data.skipped};store(pendingKey(),pending);renderBoard();submit();
});
frame.addEventListener('load',()=>frame.contentWindow.postMessage({type:'vector-battle-ping'},target));
setInterval(tick,250);
addEventListener('online',()=>{if(state){schedule();if(pending)submit();}});
addEventListener('axioma:login-complete',async event=>{await identity(event.detail.account);if(!$('setup').hidden)(account?.role==='teacher'?$('world'):$('joinCode')).focus();});
AxiomaAuth.onChange(({account:a,pending:p})=>{if(!p)identity(a);});
AxiomaAuth.ready().then(({account:a})=>{if(!a){display('login');return;}return identity(a);}).catch(e=>{display('login');notice(errorText(e));});
})();
