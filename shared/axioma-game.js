// Account-bound lifecycle for games. Engines use storage below, never browser-wide progress.
(() => {
'use strict';
const script=document.currentScript, gameId=script.dataset.gameId;
const config=window.AxiomaGameAdapters?.[gameId] || {};
const clone=v=>JSON.parse(JSON.stringify(v));
let account=null, cacheKey='', record={state:{storage:{}},revision:0,dirty:false};
let active=false, started=false, booting=false, busy=false, timer=null, edit=0, status='loading', storageFailed=false;
let host, dock, panel, message, actions, readyResolve;
const ready=new Promise(resolve=>readyResolve=resolve);
const nativeStorage=()=>window.localStorage;
function deadline(promise){
 let timeout;
 return Promise.race([promise,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Verbinding duurt te lang')),12000)})]).finally(()=>clearTimeout(timeout));
}
const label=()=>account?.role==='student'?(account.alias||'Leerling'):account?.role==='teacher'?'Leerkracht':'Gast';
const accountKey=a=>a ? a.role+':'+a.id : 'guest';
const keyFor=a=>'axioma:progress:v2:'+encodeURIComponent(window.AXIOMA_CONFIG?.url||'offline')+':'+accountKey(a)+':'+gameId;

function setStatus(value){
 status=value;
 if(dock)dock.textContent=label()+' · '+({loading:'Laden…',saved:'Opgeslagen',saving:'Opslaan…',pending:'Nog te bewaren',offline:'Alleen op dit toestel',guest:'Op dit toestel',teacher:'Oefenmodus',conflict:'Voortgang gewijzigd',error:'Controle nodig',changed:'Account gewijzigd',untracked:'Vrij verkennen',multiplayer:'Samen spelen'})[value];
 if(dock){dock.title=dock.textContent;dock.setAttribute('aria-label','Account en opslag: '+dock.textContent);dock.dataset.status=value;}
 if(storageFailed&&dock)dock.textContent=label()+' · Opslag niet beschikbaar';
}
function persist(){
 try{nativeStorage().setItem(cacheKey,JSON.stringify(record));return true}
 catch(_){storageFailed=true;setStatus(status);return false}
}
function notice(text,buttons,blocking=false){
 message.textContent=text;actions.replaceChildren();
 for(const [text,fn] of buttons){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=fn;actions.append(b)}
 panel.dataset.blocking=String(blocking);panel.hidden=false;
 actions.querySelector('button')?.focus();
}
function home(){return window.AxiomaPlatform?.homeURL() || new URL('../',location.href).href}
function login(){const url=new URL(home());url.searchParams.set('login','1');url.searchParams.set('return',location.href);location.href=url.href}
function details(){
 if(!active&&!started)return;
 if(!active&&started){if(status==='conflict')conflict();else changed();return}
 const explanation=storageFailed?'Bewaren op dit toestel lukt niet. Laat deze pagina open en probeer opnieuw.':({saved:'Je voortgang is gekoppeld aan '+label()+'. Je kunt op een ander toestel verdergaan.',saving:'Je wijzigingen worden bewaard.',pending:'Je laatste wijzigingen staan op dit toestel en worden nog online bewaard.',offline:'Online bewaren lukt momenteel niet. Je wijzigingen blijven apart voor jouw account op dit toestel staan. Probeer opnieuw voordat je op een ander toestel verdergaat.',guest:'Je oefent als gast. Deze voortgang blijft op dit toestel en wordt niet automatisch naar een leerlingaccount overgenomen.',teacher:'Je oefent als leerkracht. Dit telt niet als leerlingvoortgang.',untracked:'Dit is een vrije verkenning zonder persoonlijke voortgang.',multiplayer:'Partijen en ranglijsten worden door het samenspel bijgehouden.'})[status]||'Je account en voortgang worden gecontroleerd.';
 notice(explanation,[...(['offline','pending','saving'].includes(status)?[['Opnieuw bewaren',async()=>{await flush();if(status==='saved')panel.hidden=true;else details()}]]:[]),[account?'Account op startpagina':'Inloggen',login],['Sluiten',()=>panel.hidden=true]]);
}
function mount(){
 host=document.createElement('div');host.id='axioma-game-status';
 // Shadow DOM keeps game button/layout rules out of the shared account controls.
 const root=host.attachShadow({mode:'open'});
 root.innerHTML='<style>:host{display:inline-flex;flex:0 1 auto;min-width:34px;vertical-align:middle;z-index:10000;font:12px/1.4 system-ui;color:#132d34}:host([data-floating]){position:fixed;top:6px;left:6px}button{font:inherit;cursor:pointer;border:1px solid #80989e;border-radius:7px;padding:7px 10px;background:#f5f8f9;color:#132d34;min-height:32px}button:focus-visible{outline:3px solid #cd9930;outline-offset:2px}.dock{max-width:165px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;box-shadow:0 1px 5px #0003}.panel{position:fixed;inset:0;background:#102028a6;display:grid;place-items:center;padding:16px}.panel[hidden]{display:none}.box{background:#f5f8f9;color:#132d34;padding:20px;border-radius:12px;width:min(420px,calc(100vw - 48px));box-shadow:0 8px 36px #0005}p{margin:0 0 16px}.actions{display:flex;gap:8px;flex-wrap:wrap}@media(max-width:1100px){.dock{font-size:0;width:34px;padding:4px;min-height:34px}.dock:before{content:"◉";font-size:20px}.dock[data-status="saved"]{color:#277457}.dock[data-status="offline"],.dock[data-status="conflict"],.dock[data-status="pending"]{color:#936615}}@media(prefers-color-scheme:dark){button,.box{background:#17343d;color:#e9f2f5}}</style><button class="dock" aria-label="Account en opslagstatus"></button><section class="panel" hidden role="dialog" aria-modal="true" aria-label="Account en voortgang"><div class="box"><p role="status"></p><div class="actions"></div></div></section>';
 document.body.append(host);dock=root.querySelector('.dock');panel=root.querySelector('.panel');message=root.querySelector('p');actions=root.querySelector('.actions');dock.onclick=details;setStatus('loading');
 new MutationObserver(placeDock).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','inert','class']});
 window.addEventListener('resize',placeDock);placeDock();
 root.addEventListener('keydown',event=>{
  if(panel.hidden)return;
  if(event.key==='Escape'&&panel.dataset.blocking!=='true'){event.preventDefault();panel.hidden=true;dock.focus()}
  if(event.key==='Tab'){
   const buttons=[...actions.querySelectorAll('button')];if(!buttons.length)return;
   const index=buttons.indexOf(root.activeElement);event.preventDefault();buttons[(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length].focus();
  }
 });
 // Block input to the old engine immediately on logout or account replacement.
 for(const type of ['click','pointerdown','keydown','touchstart'])document.addEventListener(type,event=>{
  if((!active||!panel.hidden)&&!event.composedPath().includes(host)){
   if(event.composedPath().some(node=>node.matches?.('a[data-platform-home]')))return;
   event.preventDefault();event.stopImmediatePropagation();
  }
 },true);
}
function placeDock(){
 if(!host)return;
 const header=[...document.querySelectorAll('.header-actions'),...document.querySelectorAll('header')].find(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&r.top>=-5&&r.bottom<=innerHeight&&!el.closest('[inert]')&&getComputedStyle(el).visibility!=='hidden'});
 const parent=header||document.body;if(host.parentNode!==parent)parent.append(host);
 if(host.hasAttribute('data-floating')===!!header)host.toggleAttribute('data-floating',!header);
}
function changed(){
 if(!started)return;
 active=false;clearTimeout(timer);setStatus('changed');
 notice('Je account is gewijzigd. Open het spel opnieuw om met de juiste voortgang verder te gaan.',[['Verder met mijn account',()=>location.reload()]],true);
}
function check(detail){
 if(started&&(detail.pending||accountKey(detail.account)!==accountKey(account)))changed();
}
function dirty(){
 if(!active)return;
 record.dirty=true;edit++;persist();
 if(account?.role==='student'){
  setStatus(status==='offline'?'offline':'pending');clearTimeout(timer);timer=setTimeout(flush,700);
 }
}
function getItem(key){
 key=String(key);
 if(Object.hasOwn(record.state.storage,key))return record.state.storage[key];
 // Unassigned legacy browser progress is available only in guest mode.
 if(!account){try{return nativeStorage().getItem(key)}catch(_){return null}}
 return null;
}
function setItem(key,value){
 if(!active)return;
 key=String(key);value=String(value);
 if(record.state.storage[key]===value)return;
 record.state.storage[key]=value;
 const summary=config.onWrite?.(key,value,record.state);
 if(summary)Object.assign(record.state,summary,{finished:!!summary.total&&summary.completed.length>=summary.total});
 dirty();
}
function removeItem(key){if(!active)return;record.state.storage[String(key)]=null;dirty()}
function report(completed,total,current){
 if(!active)return;
 const units=[...new Set((Array.isArray(completed)?completed:[]).map(String))];
 const next={completed:units,total:Math.max(0,Number(total)||0),finished:!!total&&units.length>=total};
 if(current!=null)next.current=current;
 if(Object.entries(next).some(([key,v])=>JSON.stringify(record.state[key])!==JSON.stringify(v))){Object.assign(record.state,next);dirty()}
}
function emit(completed,total,current){
 window.dispatchEvent(new CustomEvent('axioma:game-progress',{detail:{gameId,accountId:account?.id||null,completed,total,current}}));
}
function snapshot(){
 const state=clone(record.state);
 // Only declared engine save keys go online (no device telemetry or incidental UI keys).
 state.storage=Object.fromEntries(Object.entries(state.storage).filter(([key])=>(config.keys||[]).includes(key)));
 state.schemaVersion=2;
 return state;
}
function conflict(){
 active=false;setStatus('conflict');
 notice('Dit spel is ook op een ander tabblad of toestel gewijzigd. Je werk op dit toestel blijft apart bewaard. Laad de online versie om verder te gaan.',[['Laad online voortgang',()=>{
  try{nativeStorage().setItem(cacheKey+':conflict:'+Date.now(),JSON.stringify(record));nativeStorage().removeItem(cacheKey)}catch(_){notice('De reservekopie kan niet worden bewaard. Maak ruimte vrij op dit toestel en probeer opnieuw.',[['Opnieuw proberen',conflict]],true);return}
  location.reload();
 }]],true);
}
async function flush(){
 if(config.external){window.dispatchEvent(new Event('axioma:retry-save'));return}
 if(!active||busy||!record.dirty||account?.role!=='student'||config.tracking===false)return;
 busy=true;const version=edit,owner=account.id,state=snapshot();setStatus('saving');
 try{
  const result=await window.AxiomaProgress.save(gameId,state,record.revision,owner);
  if(!active)return;
  if(result?.status==='conflict'){conflict();return}
  if(!result||result.status==='guest')throw Error('Niet bewaard');
  record.revision=Number(result.revision)||record.revision+1;
  record.dirty=edit!==version;persist();setStatus(record.dirty?'pending':'saved');
 }catch(_){if(active)setStatus('offline')}
 finally{busy=false;if(active&&record.dirty&&status==='pending'){clearTimeout(timer);timer=setTimeout(flush,700)}}
}
async function engines(){
 for(const placeholder of document.querySelectorAll('script[type="text/axioma-game"]')){
  if(!active)return;
  const executable=document.createElement('script');
  if(placeholder.dataset.src){
   executable.src=placeholder.dataset.src;executable.async=false;
   await new Promise((resolve,reject)=>{executable.onload=resolve;executable.onerror=()=>reject(Error('Spelbestand kon niet laden'));placeholder.after(executable)});
  }else{executable.textContent=placeholder.textContent;placeholder.after(executable)}
 }
 placeDock();window.dispatchEvent(new Event('axioma:game-ready'));
}
async function boot(){
 if(booting||started)return;booting=true;
 notice('Je account en voortgang worden geladen…',[],true);
 try{
  if(!Object.hasOwn(window.AxiomaGameAdapters||{},gameId))throw Error('Spelkoppeling ontbreekt');
  if(location.protocol!=='file:'){
   await deadline(window.AxiomaAuth.ready());account=await deadline(window.AxiomaAuth.getAccount());
   if(account&& !['student','teacher'].includes(account.role))throw Error('Account niet beschikbaar');
  }
  cacheKey=keyFor(account);
  let cached=null;try{cached=JSON.parse(nativeStorage().getItem(cacheKey)||'null')}catch(_){}
  record={state:{storage:{}},revision:0,dirty:false};
  if(cached?.state?.storage&&typeof cached.state.storage==='object')record=cached;
  if(account?.role==='student'&&config.tracking!==false){
   let remote;
   try{remote=await deadline(window.AxiomaProgress.load(gameId,account.id))}
   catch(error){
    if(!cached){throw error}
    setStatus('offline');
   }
   if(remote){
    if(record.dirty&&record.revision!==remote.revision){conflict();return}
    if(!record.dirty){record={state:remote.state||{storage:{}},revision:remote.revision,dirty:false};record.state.storage ||= {}}
    setStatus(record.dirty?'pending':'saved');
   }
  }else setStatus(config.external?(account?.role==='student'?'loading':account?'teacher':'guest'):config.tracking===false?(config.multiplayer?'multiplayer':'untracked'):account?'teacher':'guest');
  // Recheck after network requests; never mount an old account's engine.
  if(location.protocol!=='file:'&&accountKey(await window.AxiomaAuth.getAccount())!==accountKey(account))throw Error('Account gewijzigd');
  if(account?.role==='student')config.hydrate?.(record.state);
  active=true;started=true;panel.hidden=true;persist();
  window.AxiomaAuth?.onChange(check);
  readyResolve();await engines();
  if(record.dirty)timer=setTimeout(flush,700);
 }catch(_){
  active=false;setStatus('error');
  notice('Je account of opgeslagen voortgang kon niet worden geladen. Probeer opnieuw; je bestaande voortgang blijft behouden.',[['Opnieuw proberen',()=>{if(started)location.reload();else boot()}],['Naar startpagina',()=>location.href=home()]],true);
 }finally{booting=false}
}
window.AxiomaGame=Object.freeze({ready,storage:Object.freeze({getItem,setItem,removeItem}),report,emit,flush,
 get state(){return clone(record.state)},get account(){return account},get active(){return active},get status(){return status}
});
window.addEventListener('pagehide',()=>{if(active){persist();flush()}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});
window.addEventListener('online',()=>{if(active)flush()});
window.addEventListener('axioma:save-status',event=>{if(config.external&&active)setStatus(event.detail)});
window.addEventListener('pageshow',event=>{if(event.persisted)window.AxiomaAuth?.getAccount().then(a=>check({account:a})).catch(changed)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{mount();boot()},{once:true});else{mount();boot()}
})();
