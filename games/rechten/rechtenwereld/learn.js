(()=>{'use strict';
 const $=id=>document.getElementById(id),frame=$('learnBoard'),origin=location.origin;
 let initialized=false,account=null,state=null,busy=false,epoch=0,timer,ready=false,frameKey='',drawn='',pending=null,draft=null,draftTimer,forceSync=false,preview=null;
 let inviteBusy=false,incomingBusy=false;
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const tabId=()=>{const social=window.AxiomaSocial?.state()?.tabId;if(social)return social;try{const id=sessionStorage.getItem('axioma-social-tab')||crypto.randomUUID();sessionStorage.setItem('axioma-social-tab',id);return id;}catch{return null;}};
 const requestedWorld=new URLSearchParams(location.search).get('world');
 const worldSkills={puntenbaai:'point_plot',hellingrug:'delta',formulewerf:'graph_from_equation'};
 const requestedSkill=Object.hasOwn(worldSkills,requestedWorld)?worldSkills[requestedWorld]:null;
 if(requestedSkill)$('learnSkill').value=requestedSkill;
 const labels={point_plot:'Punten plaatsen',delta:'Δx en Δy',graph_from_equation:'Rechte tekenen'};
 const cache=()=>`rechten-learn:${account?.id}`,safeRead=key=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}},save=(key,value)=>{try{value===null?localStorage.removeItem(key):localStorage.setItem(key,JSON.stringify(value));}catch{}};
 let room=new URLSearchParams(location.search).get('session');
 const note=text=>{$('learnNotice').hidden=!text;$('learnNotice').textContent=text||'';};
 const send=data=>frame.contentWindow?.postMessage(data,origin);
 function board(){
  if(!ready||!state?.participating)return;
  const s=state,isBuilder=s.builder===account.id,readOnly=preview?true:s.phase==='idea'?s.mine.idea:s.phase==='build'?!isBuilder:s.phase==='individual'?!!s.mine.check:true;
  const key=s.id+':'+s.round+':'+s.task.seed;
  let answer=s.phase==='build'||s.phase==='result'?s.draft:s.phase==='idea'?s.mine.answer:null;
  if(preview)answer=preview.answer;
  if(draft&&draft.round===s.round&&draft.phase===s.phase&&!readOnly)answer=draft.answer;
  if(frameKey!==key){frameKey=key;drawn='';send({type:'vector-battle-question',match:s.id,index:s.round,...s.task});}
  const signature=JSON.stringify([key,answer,readOnly]);
  if(drawn!==signature||forceSync){drawn=signature;forceSync=false;send({type:'rechten-learn-sync',match:s.id,index:s.round,answer,readOnly});}
 }
 const renderedLists=new WeakMap();
 function updateList(id,html){
  const list=$(id);if(renderedLists.get(list)===html)return;renderedLists.set(list,html);
  const focused=list.contains(document.activeElement)?document.activeElement:null;
  list.innerHTML=html;
  if(focused){const next=[...list.querySelectorAll('button')].find(b=>b.dataset.action===focused.dataset.action&&b.dataset.id===focused.dataset.id);(next||$('learnPhase')).focus({preventScroll:true});}
 }
 function renderIncoming(){
  const social=window.AxiomaSocial?.state(),invites=social?.account?.id===account?.id?(social.invitations||[]).filter(i=>i.game==='rechten-learn'&&i.status==='pending'&&i.recipient_id===account?.id):[];
  $('learnIncoming').hidden=!invites.length||!!state;
  updateList('learnIncoming',invites.map(i=>`<div class="learn-invite"><p><strong>${escape(i.sender_alias)}</strong> nodigt je uit om samen te leren.</p><div class="learn-invite-actions"><button class="primary" data-action="accept" data-id="${escape(i.id)}" ${incomingBusy?'disabled':''}>Meedoen</button><button data-action="decline" data-id="${escape(i.id)}" ${incomingBusy?'disabled':''}>Niet nu</button></div></div>`).join(''));
 }
 function renderInvites(){
  const s=state,visible=s?.participating&&s.phase==='lobby'&&s.host===account.id&&s.members.length<s.capacity;
  $('learnInvitePanel').hidden=!visible;$('learnPlaces').hidden=s?.phase!=='lobby';
  if(s?.phase==='lobby')$('learnPlaces').textContent=`${s.members.length} van ${s.capacity} leerlingen aanwezig`;
  if(!visible)return;
  const invites=[...new Map((s.invitees||[]).map(i=>[i.recipient_id,i])).values()].filter(i=>!s.members.some(m=>m.id===i.recipient_id)),reserved=invites.filter(i=>i.status==='pending').length,full=s.members.length+reserved>=s.capacity;
  const labels={pending:'Wacht op antwoord',accepted:'Doet mee',declined:'Niet nu',cancelled:'Ingetrokken',expired:'Verlopen — je kunt opnieuw uitnodigen',finished:'Afgesloten'};
  const sent=invites.filter(i=>i.status!=='accepted').map(i=>`<div class="learn-peer"><div><strong>${escape(i.alias)}</strong><small>${labels[i.status]||''}</small></div>${i.status==='pending'?`<button data-action="cancel" data-id="${escape(i.id)}" ${inviteBusy?'disabled':''}>Intrekken</button>`:''}</div>`).join('');
  const peers=(s.peers||[]).map(p=>`<div class="learn-peer"><div><strong>${escape(p.alias)}</strong><small>Beschikbaar · jouw klas</small></div><button data-action="invite" data-id="${escape(p.id)}" ${inviteBusy||full?'disabled':''}>Uitnodigen</button></div>`).join('');
  const empty=full?(reserved?'Plaats gereserveerd. Wacht op antwoord of trek de uitnodiging in.':'Je groepje is klaar om te starten.'):'Nog geen beschikbare klasgenoot. Deel de code of leer alleen verder.';
  updateList('learnInviteList',sent+(peers||`<p class="learn-meta">${empty}</p>`));
 }
 async function inviteAction(action,id){
  if(inviteBusy||!state||!account)return;inviteBusy=true;const turn=epoch;
  $('learnInviteNotice').hidden=true;renderInvites();
  try{
   const {data,error}=await AxiomaAuth.client().functions.invoke('rechten-learn',{body:{action,data:{id:room,tab_id:tabId(),...(action==='invite'?{target:id}:{invite:id})}}});
   if(turn!==epoch)return;let detail;if(error)try{detail=await error.context?.json();}catch{}
   if(error||data?.error)throw Error(detail?.error||data?.error||'Verzenden lukte niet. Probeer opnieuw.');
   $('learnInviteNotice').textContent=action==='invite'?'Uitnodiging verstuurd.':'Uitnodiging ingetrokken.';
   $('learnInviteNotice').hidden=false;await call('state');window.AxiomaSocial?.refresh?.();
  }catch(e){if(turn===epoch){$('learnInviteNotice').textContent=e.message;$('learnInviteNotice').hidden=false;}}
  finally{if(turn===epoch){inviteBusy=false;render();}}
 }
 $('learnInviteList').onclick=e=>{const b=e.target.closest('button[data-action]');if(b)inviteAction(b.dataset.action,b.dataset.id);};
 $('learnIncoming').onclick=async e=>{
  const b=e.target.closest('button[data-action]');if(!b||incomingBusy)return;const turn=epoch;incomingBusy=true;renderIncoming();
  try{const result=await window.AxiomaSocial?.answerInvitation?.(b.dataset.id,b.dataset.action);if(turn===epoch&&!result)window.AxiomaSocial?.open?.();}
  finally{if(turn===epoch){incomingBusy=false;renderIncoming();}}
 };
 window.AxiomaSocial?.onChange(renderIncoming);
 $('learnPhase').tabIndex=-1;
 function render(){
  document.querySelectorAll('#learnForms button').forEach(b=>b.disabled=busy);
  const s=state;$('learnSetup').hidden=!!s;$('learnSession').hidden=!s;renderIncoming();if(!s)return;renderInvites();
  const me=account.id,builder=s.builder===me,members=s.members,allApproved=members.every(m=>m.approved);
  $('learnRoomCode').textContent=s.code;$('learnRound').textContent=s.phase==='lobby'?'Groepje vormen':s.round<6?`${labels[s.skill]} · ${s.round+1}/6`:'Eigen eindcheck';
  const phaseNames={lobby:'Wie doet er mee?',idea:'Eerst jouw idee',build:builder?'Jij bouwt':'Jij controleert',result:s.correct?'Samen opgelost!':'Bekijk het nog eens',individual:'Nu zelf proberen',finished:'Reeks afgerond',paused:'Je partner is vertrokken'};
  $('learnPhase').textContent=s.participating?phaseNames[s.phase]:'Je bent uit de groep';
  $('learnInstruction').textContent=preview?'Je bekijkt het eerste idee van '+preview.alias+'. Keer terug naar jullie voorstel om het te controleren.':!s.participating?'Je eigen leerroute staat nog klaar.':s.phase==='lobby'?(s.host===me?'Kies je klasgenoten. Start zodra jullie er zijn.':'Je bent erbij. De maker start jullie reeks.'):s.phase==='idea'?(s.mine.idea?'Je idee is bewaard. Wacht op je partners.':'Maak je eigen voorstel. Jullie zien elkaars ideeën daarna.'):s.phase==='build'?(builder?'Bouw jullie voorstel. Laat iedereen controleren en klik daarna op Controleer samen.':members.find(m=>m.id===me)===members.filter(m=>m.id!==s.builder)[1]?'Controleer met een punt of proef of het voorstel klopt.':'Controleer richting, getallen en de stappen van je partner.'):s.phase==='result'?(s.correct?'De rollen wisselen bij de volgende opgave.':'Bespreek het verschil en pas jullie voorstel aan.'):s.phase==='individual'?(s.mine.check?'Je eindcheck is bewaard. Wacht op je partners.':'Los deze nieuwe opgave zelfstandig op.'):s.phase==='finished'?(s.mine.check?.correct?'Je eigen eindcheck is juist. Ga verder in je leerroute.':'Je eigen eindcheck was nog niet juist. Oefen verder in je leerroute.'): 'Je kunt altijd alleen verder leren.';
  $('learnMembers').replaceChildren();for(const m of members){const li=document.createElement('li'),avatar=LeraarBobAvatar.create(m),text=document.createElement('span');avatar.classList.add('learn-avatar');avatar.setAttribute('aria-hidden','true');text.textContent=m.alias+(m.id===me?' (jij)':'')+(!m.online?' · verbinding weg':s.phase==='build'?(m.id===s.builder?' · bouwt':' · controleert')+(m.approved?' ✓':''):m.idea&&s.phase==='idea'?' · klaar':'');li.append(avatar,text);$('learnMembers').append(li);}
  const show=(id,yes,disabled=false)=>{$(id).hidden=!yes;$(id).disabled=disabled||!!pending;};
  show('learnStart',s.phase==='lobby'&&s.host===me,members.length<2||members.some(m=>!m.online)||inviteBusy);show('learnSkip',s.phase==='idea'&&!s.mine?.idea);show('learnApprove',s.phase==='build',members.find(m=>m.id===me)?.approved||!s.draft?.steps?.length||!!draft||!!preview);show('learnReturn',!!preview);show('learnClear',s.phase==='build'&&builder);show('learnCheck',s.phase==='build'&&builder,!allApproved||!!draft);show('learnRetry',s.phase==='result'&&!s.correct&&builder);show('learnNext',s.phase==='result'&&s.correct&&builder);show('learnDuo',members.length===3&&members.some(m=>!m.online)&&s.participating,s.continueVotes.includes(me));
  $('learnIdeas').hidden=!['build','result'].includes(s.phase);$('learnProposals').replaceChildren();
  for(const idea of s.ideas||[]){const b=document.createElement('button');b.textContent=(builder?'Gebruik':'Bekijk')+' voorstel van '+idea.alias+(idea.skipped?' · nog geen idee':'');b.disabled=idea.skipped||busy;b.onclick=()=>{if(builder&&s.phase==='build'){preview=null;draft={round:s.round,phase:s.phase,answer:idea.answer};queueDraft();}else{preview=idea;render();}};$('learnProposals').append(b);}
  frame.hidden=!s.participating||!['idea','build','result','individual'].includes(s.phase);frame.inert=!!pending||!s.participating;
  $('learnSolo').href='index.html?practice='+encodeURIComponent(s.skill);board();
 }
 function accept(next){if(state&&(next.phase!==state.phase||next.revision!==state.revision))preview=null;state=next;if(draft&&(draft.phase!==state.phase||draft.round!==state.round)){draft=null;save(cache()+':draft',null);}room=state.id;save(cache(),room);const url=new URL(location.href);url.searchParams.set('session',room);history.replaceState(null,'',url);render();}
 async function call(action,data={}){
  if(busy||!account)return null;busy=true;const turn=epoch;render();
  try{const {data:result,error}=await AxiomaAuth.client().functions.invoke('rechten-learn',{body:{action,data:{...data,tab_id:tabId(),...(room?{id:room}:{})}}});if(turn!==epoch)return null;
   if(error){let detail;try{detail=await error.context?.json();}catch{}if(detail?.error){pending=null;save(cache()+':pending',null);}throw Error(detail?.error||'Verbinding onderbroken. Je voorstel blijft op dit toestel bewaard.');}if(result?.error){pending=null;save(cache()+':pending',null);throw Error(result.error);}
   note(result.stale?'Het bord is gewijzigd. Bekijk het nieuwe voorstel en bevestig opnieuw.':'');accept(result);return result;
  }catch(e){if(turn===epoch)note(e.message);return null;}finally{if(turn===epoch){busy=false;render();}}
 }
 async function flush(){
  if(!pending||busy)return;const op=pending;const result=await call(op.action,op.data);if(!result||pending!==op)return;
  pending=null;save(cache()+':pending',null);
  if(result.stale){
   const retryable=(op.action==='draft'||op.action==='approve')&&result.phase==='build'&&op.data.revision===result.revision||op.action==='idea'&&result.phase==='idea'&&!result.mine.idea||op.action==='individual'&&result.phase==='individual'&&!result.mine.check||op.action==='leave';
   if(retryable){pending={...op,data:{...op.data,version:result.version,revision:result.revision}};save(cache()+':pending',pending);return;}
   if(draft)save(cache()+':draft-backup',draft);draft=null;save(cache()+':draft',null);forceSync=true;render();return;}
  if(op.action==='draft'&&draft&&JSON.stringify(draft.answer)===JSON.stringify(op.data.answer)){draft=null;save(cache()+':draft',null);}
  if(op.action==='leave'){room=null;state=null;save(cache(),null);history.replaceState(null,'',location.pathname);render();return;}
  if(draft&&state.phase==='build')queueDraft();else if(draft&&(state.phase!==draft.phase||state.round!==draft.round)){draft=null;save(cache()+':draft',null);}
  render();
 }
 function act(action,data={}){if(pending||!state)return;pending={action,data:{...data,id:room,version:state.version,revision:state.revision,request:crypto.randomUUID()}};save(cache()+':pending',pending);if(busy)setTimeout(flush,300);else flush();}
 function queueDraft(){clearTimeout(draftTimer);draftTimer=setTimeout(()=>{if(draft&&state?.phase==='build'&&state.builder===account.id&&!pending&&!busy)act('draft',{answer:draft.answer});else if(draft&&state?.phase==='build')queueDraft();},250);}
 async function poll(){clearTimeout(timer);if(account?.role!=='student')return;if(pending)await flush();else if(room)await call('state');timer=setTimeout(poll,2000);}
 $('learnCreate').onsubmit=async e=>{e.preventDefault();room=null;await call('create',{skill:$('learnSkill').value,capacity:Number($('learnCapacity').value)});poll();};
 $('learnJoin').onsubmit=async e=>{e.preventDefault();room=null;await call('join',{code:$('learnCode').value.trim().toUpperCase()});poll();};
 $('learnSignIn').onclick=()=>LeraarBobTopbar.openAccount();
 for(const [id,action] of Object.entries({learnStart:'start',learnApprove:'approve',learnCheck:'check',learnRetry:'retry',learnNext:'next',learnDuo:'continue-duo',learnExit:'leave'}))$(id).onclick=()=>act(action);
 // Leaving for solo releases the seat too. Persist the intent before navigation;
 // the shared social service retries it if the network is temporarily down.
 $('learnSolo').onclick=async e=>{
  if(!state?.participating||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
  e.preventDefault();const url=$('learnSolo').href,turn=epoch;
  clearTimeout(draftTimer);if(draft)save(cache()+':draft-backup',draft);
  pending={action:'leave',data:{id:room,version:state.version,revision:state.revision,request:crypto.randomUUID()}};
  save(cache()+':pending',pending);
  await Promise.race([flush(),new Promise(resolve=>setTimeout(resolve,900))]);
  if(turn===epoch)location.assign(url);
 };
 $('learnReturn').onclick=()=>{preview=null;render();};
 $('learnClear').onclick=()=>{draft=null;save(cache()+':draft',null);act('draft',{answer:{steps:[]}});};
 $('learnSkip').onclick=()=>act('idea',{answer:{steps:[]},skipped:true});
 frame.addEventListener('load',()=>send({type:'vector-battle-ping'}));
 addEventListener('message',e=>{if(e.source!==frame.contentWindow||e.origin!==origin)return;const d=e.data;
  if(d?.type==='vector-battle-ready'){ready=true;frameKey='';board();return;}
  if(!state||d?.match!==room||d?.index!==state.round||!state.participating)return;
  if(d.type==='rechten-learn-draft'&&['idea','build','individual'].includes(state.phase)){
   draft={round:state.round,phase:state.phase,answer:d.answer};save(cache()+':draft',draft);drawn=JSON.stringify([frameKey,d.answer,false]);if(state.phase==='build')queueDraft();
  }
  if(d.type==='vector-battle-answer'){
   forceSync=true;if(state.phase==='idea')act('idea',{answer:d.answer});else if(state.phase==='individual')act('individual',{answer:d.answer});else if(state.phase==='build'){draft={round:state.round,phase:state.phase,answer:d.answer};queueDraft();render();}
  }
 });
 async function identity(detail){if(detail.pending)return;const a=detail.account;if(initialized&&a?.id===account?.id)return;if(initialized){room=null;history.replaceState(null,'',location.pathname);}initialized=true;epoch++;clearTimeout(timer);clearTimeout(draftTimer);account=a;preview=null;state=null;busy=false;inviteBusy=false;incomingBusy=false;$('learnInviteNotice').hidden=true;$('learnInviteList').replaceChildren();renderedLists.delete($('learnInviteList'));pending=null;draft=null;ready=false;frameKey='';frame.src='battle-player.html?mode=learn';$('learnForms').hidden=a?.role!=='student';$('learnLogin').hidden=a?.role==='student';
  if(a?.role==='student'){room=room||safeRead(cache());pending=safeRead(cache()+':pending');draft=safeRead(cache()+':draft');if(pending?.data.id!==room)pending=null;poll();}render();
 }
 AxiomaAuth.onChange(identity);AxiomaAuth.ready().then(identity);addEventListener('online',poll);
})();
