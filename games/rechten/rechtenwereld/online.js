/* Durable server state, one native workboard. Never sends correctness or client timestamps. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),frame=$('board'),base=new URL('.',location.href);
 const names={hellingrug:'Hellingrug',grenspas:'Grenspas',formulewerf:'Formulewerf',signaalstad:'Signaalstad'};let lobbyData=null;
 let initialized=false,account=null,epoch=0,id=new URLSearchParams(location.search).get('match'),state=null,busy=false,busyAction='',timer,frameReady=false,sent='',clock={server:0,local:0},queuedAnswer=null;
 const tab=()=>window.AxiomaSocial?.state().tabId||sessionStorage.getItem('axioma-social-tab')||crypto.randomUUID();
 const button=(label,action)=>{const b=document.createElement('button');b.textContent=label;b.onclick=action;return b;};
 const queueKey=()=>`rechten-duo-answer:${account?.id}:${id}`;const saveQueue=()=>{try{if(queuedAnswer)localStorage.setItem(queueKey(),JSON.stringify(queuedAnswer));else localStorage.removeItem(queueKey());}catch{}};
 const message=text=>{$('error').hidden=!text;$('error').textContent=text;};
 async function call(action,data={}){
  const turn=epoch;if(!account)return;if(busy){if(['state','lobby'].includes(action))return;await new Promise(r=>setTimeout(r,80));if(turn!==epoch)return;return call(action,data);}busy=true;busyAction=action;
  try{
   const {data:result,error}=await AxiomaAuth.client().functions.invoke('rechten-duo',{body:{action,data:{...data,tab_id:tab(),...(id?{id}: {})}}});
   if(turn!==epoch)return;
   if(error){let detail;try{detail=await error.context?.json();}catch{}throw Error(detail?.error||'Verbinding verbroken. We proberen opnieuw; bevestigde antwoorden blijven bewaard.');}
   if(result?.error)throw Error(result.error);
   message('');clock={server:Date.parse(result.server_time),local:performance.now()};
   if(result.id){state=result;id=result.id;const u=new URL(location.href);u.searchParams.set('match',id);history.replaceState(null,'',u);renderMatch();}
   else renderLobby(result);
   return result;
  }catch(e){if(turn===epoch){message(e.message);$('soloFallback').hidden=false;}}finally{if(turn===epoch){busy=false;busyAction='';}}
 }
 let requestedWorld=new URLSearchParams(location.search).get('world');
 function renderLobby(data){
  lobbyData=data;const selected=requestedWorld||$('duelWorld').value;requestedWorld=null;const worlds=data.worlds||[],signature=JSON.stringify(worlds);if($('duelWorld').dataset.worlds!==signature){$('duelWorld').dataset.worlds=signature;$('duelWorld').replaceChildren();for(const id of worlds)$('duelWorld').append(new Option(names[id]||id,id));if(!worlds.length)$('duelWorld').append(new Option('Nog geen afgeronde wereld',''));}if(worlds.includes(selected))$('duelWorld').value=selected;$('duelWorld').disabled=!worlds.length;
  $('soloFallback').hidden=false;$('lobby').hidden=false;$('match').hidden=true;$('login').hidden=account?.role==='student';
  const invitationsKey=JSON.stringify([account?.id,data.invitations||[]]);if($('invitations').dataset.rows!==invitationsKey){$('invitations').dataset.rows=invitationsKey;$('invitations').replaceChildren();
  for(const inv of data.invitations||[]){const row=document.createElement('div');row.className='invitation';const text=document.createElement('p');const mine=inv.sender_id===account.id;text.textContent=mine?`Je hebt ${inv.recipient_alias} uitgedaagd.`:`${inv.sender_alias} daagt je uit voor ${names[inv.world]||'Rechtenwereld'}.`;row.append(text);
   const act=action=>{id=inv.id;call(action);};
   if(inv.status==='accepted')row.append(button('Battle hervatten',()=>act('state')));
   else if(mine)row.append(button('Intrekken',()=>act('cancel')));
   else row.append(button('Accepteren',()=>act('accept')),button('Weigeren',()=>act('decline')));
   $('invitations').append(row);
  }
  }
  const playersKey=JSON.stringify([account?.id,account?.role,$('duelWorld').value,data.worlds,data.players]);if($('players').dataset.rows!==playersKey){$('players').dataset.rows=playersKey;$('players').replaceChildren();
  for(const p of (data.players||[]).filter(p=>p.worlds?.includes($('duelWorld').value))){const row=document.createElement('div');row.className='person';const name=document.createElement('span');name.textContent=p.alias;row.append(name,button('Uitdagen',()=>call('invite',{target:p.id,world:$('duelWorld').value})));$('players').append(row);}
  if(!$('players').children.length)$('players').textContent=account?.role==='student'?(data.worlds?.length?'Geen geschikte klasgenoot online voor deze wereld. Je kunt alleen verder leren.':'Rond eerst een wereld af en bewaar je voortgang in je account.'):'Meld je aan met je leerlingaccount om iemand uit te dagen.';
  }
 }
 const send=data=>frame.contentWindow?.postMessage(data,location.origin);
 function renderMatch(){
  const s=state,me=s.a.id===account.id?s.a:s.b,other=me===s.a?s.b:s.a;
  $('soloFallback').hidden=!['finished'].includes(s.phase);$('lobby').hidden=true;$('match').hidden=false;
  $('round').textContent=`ONLINE DUEL · ${s.round>5?'Sudden death · ':''}Ronde ${s.round}/5`;
  $('score').textContent=`${s.a.alias} ${s.a.score} — ${s.b.score} ${s.b.alias}`;
  $('opponent').textContent=`${other.alias} ${other.confirmed?'✓ bevestigd':other.online?'● bezig':'· verbinding herstellen'}`;
  $('ready').hidden=s.phase!=='waiting'||!s.pool.length;$('ready').disabled=me.ready||!frameReady;
  $('next').hidden=s.phase!=='round_result';$('next').disabled=me.ready;
  $('back').hidden=s.phase!=='finished';$('leave').hidden=s.phase==='finished';
  const live=['countdown','playing','resolving','round_result'].includes(s.phase);
  frame.hidden=!live;frame.inert=s.phase!=='playing'||me.confirmed;
  const key=id+':'+s.round;
  if(s.phase==='playing'&&frameReady&&sent!==key){sent=key;send({type:'vector-battle-question',match:id,index:s.round,...s.task});}
  if(me.confirmed||['resolving','round_result','finished'].includes(s.phase))send({type:'vector-battle-resolved',match:id,index:s.round,message:me.confirmed?'Bevestigd · wachten op de uitslag.':'Ronde afgelopen.'});
  const panel=$('roundPanel'),signature=JSON.stringify([s.phase,s.round,s.reason,s.winner,s.a.correct,s.b.correct,me.ready]);if(panel.dataset.state===signature){tick();return;}panel.dataset.state=signature;panel.replaceChildren();
  if(s.phase==='invite'){
   const mine=s.a.id===account.id;panel.append(document.createTextNode(mine?`Wachten op ${s.b.alias}…`:`${s.a.alias} daagt je uit voor ${names[s.world]||'Rechtenwereld'}.`));
   panel.append(button(mine?'Intrekken':'Accepteren',()=>call(mine?'cancel':'accept')));
   if(!mine)panel.append(button('Weigeren',()=>call('decline')));
  }else if(s.phase==='waiting')panel.textContent=me.ready?'Wachten tot jullie allebei klaar zijn…':'Klaar? De opgaven komen uit jullie gezamenlijke leerpad.';
  else if(s.phase==='countdown')panel.textContent='Maak je klaar…';
  else if(s.phase==='resolving')panel.textContent='Beide antwoorden worden nagekeken…';
  else if(['round_result','finished'].includes(s.phase)){
   panel.textContent=s.reason==='no_common_skills'?'Rond eerst allebei de gekozen wereld af.':s.reason==='expired'?'Deze battle is verlopen.':s.reason==='left'?'De battle is gestopt.':['cancel','decline'].includes(s.reason)?'Uitnodiging afgesloten.':`${s.a.alias} ${s.a.correct?'✓':'✗'} · ${s.b.alias} ${s.b.correct?'✓':'✗'} · ${s.winner?(s.winner===s.a.id?s.a.alias:s.b.alias)+(s.phase==='finished'?' wint de match!':' +1'):'Geen rondepunt (gelijk of beide fout).'}`;
  }
  tick();
 }
 function tick(){if(!state)return;const now=clock.server+performance.now()-clock.local,end=Date.parse(state.phase==='countdown'?state.started_at:state.deadline);$('timer').textContent=['playing','countdown'].includes(state.phase)?`${Math.max(0,Math.ceil((end-now)/1000))} s`:'';
  if(state.phase==='playing'&&end<=now){frame.inert=true;send({type:'vector-battle-resolved',match:id,index:state.round,message:'Tijd verstreken · uitslag ophalen…'});}
 }
 async function poll(){clearTimeout(timer);if(account?.role!=='student')return;
  if(queuedAnswer){const answer=queuedAnswer;const result=await call('submit',answer);if(result&&queuedAnswer===answer){queuedAnswer=null;saveQueue();}}
  if(id){const latest=await call('state');if(latest&&(latest.phase!=='playing'||(latest.a.id===account.id?latest.a:latest.b).confirmed)){queuedAnswer=null;saveQueue();}}else await call('lobby');
  timer=setTimeout(poll,id?1000:4000);
 }
 addEventListener('message',e=>{if(e.source!==frame.contentWindow||e.origin!==location.origin)return;const d=e.data;
  if(d?.type==='vector-battle-ready'){frameReady=true;sent='';if(state)renderMatch();}
  if(d?.type==='vector-battle-answer'&&state?.phase==='playing'&&d.match===id&&d.index===state.round&&!queuedAnswer){queuedAnswer={round:state.round,answer:d.answer};saveQueue();poll();}
 });
 $('duelWorld').onchange=()=>{if(lobbyData)renderLobby(lobbyData);};
 $('ready').onclick=()=>call('ready');$('next').onclick=()=>call('next',{round:state.round});$('leave').onclick=()=>call('leave');$('signIn').onclick=()=>LeraarBobTopbar.openAccount();
 async function changed(detail){if(detail.pending)return;const next=detail.account;if(initialized&&account?.id===next?.id&&account?.role===next?.role)return;initialized=true;epoch++;clearTimeout(timer);busy=false;account=next;state=null;queuedAnswer=null;sent='';frame.inert=true;frame.hidden=true;
  if(account?.role==='student'){try{queuedAnswer=JSON.parse(localStorage.getItem(queueKey())||'null');}catch{}poll();}else renderLobby({});
 }
 window.LeraarBobDuo=Object.freeze({snapshot:()=>({accountId:account?.id||null,id,phase:state?.phase||'setup',busy,canOpenInvite:!id&&(!busy||['state','lobby'].includes(busyAction))}),openMatch:async next=>{
  if(account?.role!=='student'||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(next||'')||id&&id!==next)return false;
  if(id===next)return true;if(busy&&!['state','lobby'].includes(busyAction))return false;const turn=epoch;while(busy&&turn===epoch)await new Promise(r=>setTimeout(r,50));if(turn!==epoch||id&&id!==next)return false;id=next;await call('state');poll();return state?.id===next;
 }});
 AxiomaAuth.onChange(changed);AxiomaAuth.ready().then(changed);setInterval(tick,200);addEventListener('online',poll);
})();
