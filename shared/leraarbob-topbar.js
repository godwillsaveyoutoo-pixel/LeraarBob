/* Shared platform chrome. Existing engine controls retain their nodes and handlers. */
(() => {
'use strict';
// The central Klasbattle page owns account, social and presentation controls.
// Exit before creating observers, loading helpers or mounting hidden chrome.
if(location.pathname.endsWith('/classroom.html')&&new URLSearchParams(location.search).get('hub')==='1'&&window.parent!==window)return;
if(window.LeraarBobTopbar||window.VectorBattlePlayer||window!==window.top)return;
const script=document.currentScript,root=new URL('../',script.src),home=new URL('index.html',root).href;
const title=script.dataset.title||document.title.split('·')[0].trim();
const navPilot=script.dataset.navPilot==='true';
document.body.dataset.platformPage=title;
document.body.classList.toggle('lb-nav-pilot',navPilot);
const isHome=script.dataset.page==='home',selector=script.dataset.header||'header';
const KEY='leraarbob-topbar-collapsed',mounted=new WeakSet();let collapsed=false,current=null,account=null,queued=false;
try{collapsed=localStorage.getItem(KEY)==='true';}catch{}
const icon={account:'<circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',up:'<path d="m6 15 6-6 6 6"/>',down:'<path d="m6 9 6 6 6-6"/>'};
Object.assign(icon,{
 home:'<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
 compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5Z"/>',
 route:'<circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 18h8a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h7"/>',
 arrow:'<path d="M5 19 19 5M8 5h11v11"/>',
 pencil:'<path d="m4 16 12-12 4 4L8 20H4ZM13 7l4 4"/>',
 battle:'<path d="m4 4 16 16M4 20 20 4M4 4h5M4 4v5M20 4h-5M20 4v5M2 16l6 6M16 22l6-6"/>',
 classroom:'<path d="M3 4h18v12H3ZM9 21l3-5 3 5M7 8h5M7 12h10"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2c-2 1-2 1-2 3M12 17h.01"/>',
 chart:'<path d="M4 3v17h17M8 16v-4M13 16V8M18 16V5"/>',
 full:'<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',
 fullExit:'<path d="M3 8h5V3M16 3v5h5M8 21v-5H3M21 16h-5v5"/>',
 moon:'<path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
 contrast:'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor"/>',
 right:'<path d="m9 5 7 7-7 7"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>'
});
const menuStyle={playBtn:['route','cyan'],freeBtn:['arrow','green'],canvasBtn:['pencil','violet'],battleBtn:['battle','amber'],classBtn:['classroom','blue'],helpBtn:['help','cyan'],progressBtn:['chart','green'],roomsNav:['compass','cyan'],rulesNav:['help','cyan']};
// Read each text role separately: textContent alone joins icons, titles and subtitles.
function menuDetails(node){
 const description=node.dataset.navDescription||node.querySelector('small')?.textContent.trim()||'';
 const copy=node.cloneNode(true);copy.querySelectorAll('small,svg,[aria-hidden="true"],.menu-icon').forEach(n=>n.remove());
 const label=(node.dataset.navLabel||copy.textContent.trim()||node.getAttribute('aria-label')||node.title||'').replace(/\s+/g,' ');
 const [fallbackGlyph,fallbackTone]=menuStyle[node.id]||['arrow','cyan'];
 const glyph=node.dataset.navIcon||fallbackGlyph,tone=node.dataset.navTone||fallbackTone;
 return {label,description,glyph,tone,group:node.dataset.navGroup||'',groupLabel:node.dataset.navGroupLabel||''};
}
const svg=name=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icon[name]}</svg>`;
let cssReady=false;const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('shared/leraarbob-topbar.css',root);style.onload=()=>{cssReady=true;scan();};document.head.append(style);
const restore=document.createElement('button');restore.type='button';restore.className='lb-restore';restore.innerHTML=svg('down');restore.title='Bovenbalk uitklappen';restore.setAttribute('aria-label',restore.title);restore.hidden=true;document.body.append(restore);
function setCollapsed(value,focus=false){
 collapsed=value;try{localStorage.setItem(KEY,String(value));}catch{}
 document.dispatchEvent(new CustomEvent('topbar:change',{detail:{collapsed:value}}));
 document.body.classList.toggle('topbar-collapsed',value);document.body.classList.add('has-collapsible-topbar');
 if(current){current.header.classList.toggle('lb-collapsed',value);current.host.hidden=value;current.context.hidden=value;current.header.inert=value;current.collapse.setAttribute('aria-expanded',String(!value));restore.setAttribute('aria-controls',current.header.id);}
 restore.hidden=!value;restore.setAttribute('aria-expanded',String(!value));if(focus)(value?restore:current?.collapse)?.focus({preventScroll:true});
}
restore.onclick=()=>setCollapsed(false,true);
addEventListener('storage',e=>{if(e.key===KEY)setCollapsed(e.newValue==='true');});
function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL(src,root);s.onload=resolve;s.onerror=reject;document.head.append(s);});}
if(!window.LeraarBobAvatar){window.LeraarBobAvatarReady ||= load('shared/learner-avatar.js');window.LeraarBobAvatarReady.then(()=>syncAccount()).catch(()=>{window.LeraarBobAvatarReady=null;});}
const modesReady=(window.LeraarBobPlayModes?Promise.resolve():load('shared/play-modes.js?v=20261006-platform')).then(()=>window.LeraarBobPlayModes.ready()).catch(()=>{});
const routesReady=window.LeraarBobRoutes?Promise.resolve():load('shared/platform-routes.js').catch(()=>{});
let loginLoading;
async function openAccount(){
 const opener=current?.host.shadowRoot.querySelector('.account');
 if(window.LeraarBobAccount){window.LeraarBobAccount.open(opener);return;}
 if(document.getElementById('accountBtn')){document.getElementById('accountBtn').click();return;}
 if(!loginLoading)loginLoading=(async()=>{
  if(!window.AxiomaAuth){if(!window.supabase)await load('shared/vendor/supabase.js');if(!window.AXIOMA_CONFIG)await load('shared/supabase-config.js');await load('shared/axioma-auth.js');}
  if(!document.getElementById('authOverlay')){
   const dialog=document.createElement('dialog');dialog.id='authOverlay';dialog.dataset.authContext='embedded';dialog.className='lb-account-dialog';dialog.hidden=true;dialog.setAttribute('aria-labelledby','authTitle');
   dialog.innerHTML='<div class="lb-dialog-heading"><h2 id="authTitle">Aanmelden bij leraarBob</h2><button id="authClose" type="button" aria-label="Aanmelding sluiten">×</button></div><div id="authContent"></div>';
   document.body.append(dialog);
   const trigger=document.createElement('button');trigger.type='button';trigger.dataset.axiomaLogin='';trigger.hidden=true;document.body.append(trigger);
  }
  await load('js/account-ui.js');watchAccount();
 })().catch(e=>{loginLoading=null;throw e;});
 try{await loginLoading;window.LeraarBobAccount?.open(opener);}catch{current?.host.shadowRoot.querySelector('.account').setAttribute('title','Aanmelden kon niet laden. Probeer opnieuw.');}
}
let watched=false;
function watchAccount(){if(watched||!window.AxiomaAuth)return;watched=true;AxiomaAuth.ready().then(v=>{account=v?.account||null;syncAccount();}).catch(()=>{});AxiomaAuth.onChange?.(v=>{account=v.pending?null:v.account;syncAccount();});}
addEventListener('axioma:login-complete',event=>{account=event.detail.account;syncAccount();});
function syncAccount(){if(!current)return;syncLiveEntry();const b=current.host.shadowRoot.querySelector('.account');const label=account?.role==='teacher'?'Leerkracht':account?.alias||'Inloggen';b.querySelector('.account-label').textContent=label;const mark=b.querySelector('.account-mark'),signature=account?[account.id,account.avatar_id,account.alias,account.role].join(':'):'guest';if(mark&&mark.dataset.signature!==signature){mark.dataset.signature=signature;if(account&&window.LeraarBobAvatar){mark.replaceChildren(LeraarBobAvatar.create(account));}else{mark.innerHTML=svg('account');if(account)delete mark.dataset.signature;}}b.title='leraarBob-account · '+label;b.setAttribute('aria-label',b.title);current.host.shadowRoot.querySelector('.teacher-link').hidden=account?.role!=='teacher'||script.dataset.page==='teacher';}
function syncLiveEntry(){
 if(!current)return;const link=current.host.shadowRoot.querySelector('.live-entry');link.hidden=!account;
 if(!account)return;let joined=false;try{joined=!!localStorage.getItem('lesson-stage-room:'+account.id);}catch{}
 link.href=new URL('lessons/rechten-arbeid/'+(account.role==='teacher'?'index.html#lessessie':'join.html'),root).href;
 const label=account.role==='teacher'?'Live les geven':joined?'Live les hervatten':'Deelnemen aan een live les';link.title=label;link.setAttribute('aria-label',label);link.classList.toggle('joined',joined);
 if(location.pathname===new URL(link.href).pathname)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
}
addEventListener('lesson:membership',syncLiveEntry);addEventListener('storage',e=>{if(e.key?.startsWith('lesson-stage-room:'))syncLiveEntry();});
// Read the live game record, never a second XP balance or unscoped local-storage key.
function progressSummary(){
 if(window.AxiomaGame&&!window.AxiomaGame.active)return null;
 const source=current?.header.querySelector('[data-platform-progress]');
 if(source)return {kind:source.dataset.platformProgress,value:Number(source.dataset.value),total:Number(source.dataset.total),unit:source.dataset.unit};
 if(isHome){const value=document.getElementById('totalXP')?.textContent.trim();return {kind:'xp',value:value&&value!=='—'?Number(value.replace(/[^0-9]/g,'')):null,home:true};}
 const xp=document.getElementById('xpLabel')||document.getElementById('xp');
 if(xp){xp.closest('.xp-chip')?.classList.add('lb-progress-source');return {kind:'xp',value:Number(xp.textContent.replace(/[^0-9]/g,''))};}
 const completed=document.getElementById('completedCount')?.textContent.match(/(\d+)\s*\/\s*(\d+)/);
 if(completed)return {kind:'levels',value:Number(completed[1]),total:Number(completed[2])};
 if(window.AxiomaGame?.active){const state=window.AxiomaGame.state;if(state.total>0&&Array.isArray(state.completed))return {kind:'levels',value:new Set(state.completed.map(String)).size,total:state.total};}
 return null;
}
function syncProgress(){
 if(!current)return;
 const badge=current.host.shadowRoot.querySelector('.progress'),summary=progressSummary();
 badge.hidden=!summary;if(!summary)return;
 const count=Number.isFinite(summary.value)?Math.max(0,Math.floor(summary.value)):null;
 const total=Number.isFinite(summary.total)?Math.max(0,Math.floor(summary.total)):0;
 const value=count===null?'—':Math.min(count,summary.kind==='levels'&&total?total:Infinity).toLocaleString('nl-BE');
 const label=summary.kind==='xp'?value+' XP':value+(total?'/'+total:'')+' '+(summary.unit||'levels');
 const description=summary.kind==='xp'?(summary.home?'Totale XP over je spellen':'XP in '+title)+': '+value:(count??0)+' van '+total+' '+(summary.unit||'levels')+' afgerond in '+title;
 if(badge.dataset.signature===label+'|'+description)return;
 badge.dataset.signature=label+'|'+description;
 badge.dataset.kind=summary.kind;
 badge.querySelector('.progress-icon').textContent=summary.kind==='xp'?'★':'✓';
 badge.querySelector('.progress-value').textContent=label;
 badge.title=description;badge.setAttribute('aria-label',description);
}
// Direct display actions reuse the engine's theme handler and never alter game state.
let fullscreenPending=false;
const fullscreenActive=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
function themeSource(){return document.querySelector('#themeBtn,#modeBtn[aria-pressed],#theme');}
function syncDisplayControls(){
 if(!current)return;
 const s=current.host.shadowRoot,full=s.querySelector('.fullscreen'),on=fullscreenActive();
 const label=on?'Volledig scherm verlaten':'Volledig scherm';
 full.title=label;full.setAttribute('aria-label',label);full.setAttribute('aria-pressed',String(on));full.disabled=fullscreenPending;
 if(full.dataset.active!==String(on)){full.dataset.active=String(on);full.innerHTML=svg(on?'fullExit':'full');}
 const theme=s.querySelector('.theme-toggle'),source=themeSource();
 if(current.themeSource!==source){
  current.themeObserver?.disconnect();current.themeSource=source;
  if(source){current.themeObserver=new MutationObserver(syncDisplayControls);current.themeObserver.observe(source,{attributes:true,attributeFilter:['aria-pressed','aria-label','title','disabled'],childList:true,subtree:true,characterData:true});}
 }
 theme.hidden=!source&&script.dataset.themeMode!=='site';if(theme.hidden)return;
 const contrast=!!source&&/contrast/i.test(source.textContent+' '+source.getAttribute('aria-label'));
 const pressed=source?.hasAttribute('aria-pressed')?source.getAttribute('aria-pressed')==='true':document.documentElement.dataset.mode==='dark';
 const themeLabel=contrast?'Extra contrast':pressed?'Lichte weergave':'Donkere weergave';
 theme.title=themeLabel;theme.setAttribute('aria-label',themeLabel);theme.setAttribute('aria-pressed',String(pressed));theme.disabled=source?.disabled===true;
 const glyph=contrast?'contrast':pressed?'sun':'moon';
 if(theme.dataset.icon!==glyph){theme.dataset.icon=glyph;theme.innerHTML=svg(glyph);}
}
function toggleTheme(){
 const source=themeSource();
 if(source)source.click();
 else if(script.dataset.themeMode==='site'){
  const mode=document.documentElement.dataset.mode==='dark'?'light':'dark';
  document.documentElement.dataset.mode=mode;
  try{localStorage.setItem('axioma-mode',mode);}catch{}
  const color=document.querySelector('meta[name="theme-color"]');if(color)color.content=mode==='dark'?'#14241e':'#f7f8f4';
 }
 syncDisplayControls();
}
async function toggleFullscreen(){
 if(fullscreenPending)return;
 const s=current.host.shadowRoot,notice=s.querySelector('.display-notice');notice.hidden=true;
 const on=fullscreenActive(),target=on?document:document.documentElement;
 const method=on?(document.exitFullscreen||document.webkitExitFullscreen):(target.requestFullscreen||target.webkitRequestFullscreen);
 const enabled=document.documentElement.requestFullscreen?document.fullscreenEnabled:document.webkitFullscreenEnabled;
 const explain=message=>{notice.querySelector('span').textContent=message;notice.hidden=false;};
 if(!method||(!on&&enabled===false)){explain('Volledig scherm is hier niet beschikbaar. Probeer de optie in het menu van je browser.');return;}
 fullscreenPending=true;syncDisplayControls();
 try{await method.call(target);}catch{explain(on?'Volledig scherm verlaten lukte niet. Probeer de Escape-toets of het menu van je browser.':'Volledig scherm openen lukte niet. Probeer opnieuw of gebruik het menu van je browser.');}
 finally{fullscreenPending=false;syncDisplayControls();}
}
for(const event of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(event,syncDisplayControls);
new MutationObserver(syncDisplayControls).observe(document.documentElement,{attributes:true,attributeFilter:['data-mode','class']});
function nativeMenu(header){return header.querySelector('#trainerMenu,#main-menu,.appNav');}
function goPlatformSection(id,hash){
 if(isHome){const node=document.getElementById(id);if(node){node.click();return;}}
 location.assign(home+(hash||''));
}
async function showMenu(){
 await Promise.all([modesReady,routesReady]);if(!current)return;
 const {host,header}=current,s=host.shadowRoot,dialog=s.querySelector('dialog'),list=s.querySelector('.menu-list');list.replaceChildren();
 s.querySelector('.menu-title').textContent=navPilot?(isHome?'leraarBob':title):title;
 s.querySelector('.menu-eyebrow').textContent=navPilot?'NAVIGATIE':'WAAR WIL JE HEEN?';
 const section=(label,className)=>{const group=document.createElement('section');group.className=className;if(label){const heading=document.createElement('h3');heading.textContent=label;group.append(heading);}list.append(group);return group;};
 const add=(group,label,action,{description='',glyph='arrow',tone='cyan',source}={})=>{
  const b=document.createElement('button');b.type='button';b.className='menu-card';b.dataset.tone=tone;
  const mark=document.createElement('span');mark.className='menu-mark';mark.innerHTML=svg(glyph);
  const text=document.createElement('span');text.className='menu-copy';const name=document.createElement('span');name.className='menu-name';name.textContent=label;text.append(name);
  if(description){const sub=document.createElement('span');sub.className='menu-description';sub.textContent=description;text.append(sub);}
  const arrow=document.createElement('span');arrow.className='menu-chevron';arrow.innerHTML=svg('right');b.append(mark,text,arrow);
  if(source){b.dataset.source=source.id;b.disabled=source.disabled===true;}
  b.onclick=()=>{dialog.close();action();};group.append(b);return b;
 };
  let classroomEntry=null;
  if(!isHome){
   const game=section('Huidig spel','menu-options menu-game');
   const menu=nativeMenu(header);
   const nodes=[...(menu||header).querySelectorAll(menu?'button,a':'.lb-gamebar button,.lb-gamebar a')].filter(node=>!node.hidden&&!node.matches('[data-nav-hidden],[data-collapse-topbar],#themeBtn,#modeBtn[aria-pressed],#theme,#fullBtn,[data-fullscreen],[data-platform-home],.axiomaHome,.lb-legacy-brand,#logout')&&(menu||!node.closest('[hidden]')));
   const modes=window.LeraarBobPlayModes,gameId=modes?.current()?.id;
   const entries=nodes.map(node=>{const details=menuDetails(node),mode=modes?.navigation(node,gameId);if(mode)Object.assign(details,{label:mode.title,description:mode.devices,glyph:mode.glyph,group:mode.group==='battle'?'multiplayer':'learning'});return {node,details,mode};}).filter(e=>e.details.label);
   classroomEntry=entries.find(e=>e.mode?.id==='classroom'||e.node.id==='classBtn'||e.node.matches('a[href]')&&new URL(e.node.href).pathname.endsWith('/classroom.html')||/^Klasbattle$/.test(e.details.label));
   if(classroomEntry?.node.matches('a')&&!classroomEntry.node.hasAttribute('data-platform-route')&&gameId&&modes.modes(gameId).some(m=>m.id==='classroom')){const params=new URLSearchParams(location.search);classroomEntry.node.href=modes.destination(gameId,'classroom',params.get('topic')||params.get('world'));}
   const isBattle=e=>e.details.group==='multiplayer'||['battleBtn','classBtn'].includes(e.node.id)||/^(Duo|Groepsbattle|Online duo|Klasmodus|Battle met twee)/i.test(e.details.label);
   const isLearning=e=>e.details.group==='learning';
   const isProgress=e=>e.node.id==='progressBtn'||e.node.dataset.screen==='book'||/^(Mijn voortgang|Spelvoortgang)$/.test(e.details.label);
   const overview=entries.find(e=>['proLevels','roomsNav'].includes(e.node.id));
   if(overview)add(game,'Spelmenu',()=>overview.node.click(),{...overview.details,source:overview.node});
   else if(script.dataset.menuOverview!=='false')add(game,'Spelmenu',navigateGame,{glyph:'compass'});
   const progress=entries.find(isProgress);
   if(progress)add(game,'Spelvoortgang',()=>progress.node.click(),{...progress.details,source:progress.node});
   for(const e of entries){if(e===classroomEntry||e===overview||isProgress(e)||isBattle(e)||isLearning(e))continue;
    add(game,e.node.id==='canvasBtn'?'Vrij tekenen':e.details.label,()=>e.node.click(),{...e.details,source:e.node});
   }
   const learning=entries.filter(isLearning);
   if(learning.length){const group=section('Leren','menu-options menu-learning');for(const e of learning)add(group,e.details.label,()=>e.node.click(),{...e.details,source:e.node});}
   const battles=entries.filter(e=>e!==classroomEntry&&isBattle(e));
   if(battles.length){const group=section('Battles','menu-options menu-battles');for(const e of battles){
    const label=/online/i.test(e.details.label)?'Online duel':/groep|klas/i.test(e.details.label)?'Klasbattle':'Duo-battle op één toestel';
    add(group,label,()=>e.node.click(),{...e.details,source:e.node});
   }}
   if(game.children.length===1)game.remove();
  }
  const requestedReturn=new URLSearchParams(location.search).get('returnTo');
  if(requestedReturn&&window.LeraarBobRoutes){const target=window.LeraarBobRoutes.safeReturn(requestedReturn),origin=window.LeraarBobGameRegistry?.current(new URL(target,root).href);const back=section('Terug naar je leerroute','menu-options menu-return');add(back,'Terug naar '+(origin?.title||'leraarBob'),()=>location.assign(target),{glyph:'route',description:'Je bewaarde werk en geselecteerde onderdeel blijven behouden.'});}
  const platform=section('leraarBob','menu-nav menu-platform');
  add(platform,'Spellen',()=>goPlatformSection('homeGames','#ontdek'),{glyph:'home'});
  add(platform,'Klasbattle',()=>{
   if(classroomEntry){classroomEntry.node.click();return;}
   const gameId=window.LeraarBobPlayModes?.current()?.id;
   const destination=gameId&&window.LeraarBobPlayModes.destination(gameId,'classroom');
   if(destination){location.assign(destination);return;}
   const hub=new URL('klasbattle/',root);hub.searchParams.set('returnTo',window.LeraarBobRoutes.safeReturn(location.href));location.assign(hub);
  },{glyph:'classroom',description:'Battles en ranglijsten voor alle spellen',source:classroomEntry?.node});
  add(platform,'Samen leren',()=>location.assign(window.LeraarBobPlayModes.hubDestination('learn')),{glyph:'classroom',description:'Duo Learn, Klaslearn en borduitleg'});
  add(platform,'Alle oefenbladen',()=>location.assign(new URL('oefenbladen.html',root)),{glyph:'pencil'});
  add(platform,'Alle ranglijsten',()=>location.assign(window.LeraarBobPlayModes.hubDestination('rankings')),{glyph:'chart',description:'Resultaten per klas en wereld'});
  add(platform,'Mijn leerpad',()=>goPlatformSection('homeProgress','#playerProgress'),{glyph:'chart'});
  if(account?.role==='teacher'&&script.dataset.page!=='teacher')add(platform,'Mijn klassen',()=>location.assign(new URL('teacher/',root)),{glyph:'classroom'});
  if(window.AxiomaSocial&&script.dataset.social!=='false'){
   const entry=add(platform,'Uitnodigingen',()=>window.AxiomaSocial.open(s.querySelector(getComputedStyle(s.querySelector('.mobile-menu')).display!=='none'?'.mobile-menu':'.menu')),{description:'Een leerling uitnodigen of reageren',glyph:'battle'});
   entry.classList.add('social-entry');entry.setAttribute('aria-haspopup','dialog');syncSocialMenu();
  }
  const accountGroup=section('Account','menu-nav menu-account');
  add(accountGroup,account?'Profiel':'Inloggen',openAccount,{glyph:'account'});
 const footer=section('','menu-footer');const folded=collapsed;add(footer,folded?'Bovenbalk tonen':navPilot?'Bovenbalk verbergen':'Bovenbalk inklappen',()=>setCollapsed(!folded,true),{glyph:folded?'down':'up'});
 for(const button of s.querySelectorAll('.menu,.mobile-menu'))button.setAttribute('aria-expanded','true');
 const opener=s.querySelector(getComputedStyle(s.querySelector('.mobile-menu')).display!=='none'?'.mobile-menu':'.menu');
 const r=opener.getBoundingClientRect();dialog.style.setProperty('--close-x',r.x+'px');dialog.style.setProperty('--close-y',r.y+'px');
 if(!dialog.open)dialog.showModal();
}
let socialWatched=false,socialLoading=false;
function syncSocialMenu(){
 if(!current)return;
 const social=window.AxiomaSocial?.state(),signedIn=!!social?.account;
 const invitations=(social?.invitations||[]).filter(i=>i.status==='pending'&&i.recipient_id===social.account?.id).length;
 for(const button of current.host.shadowRoot.querySelectorAll('.menu,.mobile-menu')){
  button.classList.toggle('has-invitations',invitations>0);
  button.setAttribute('aria-label',invitations?'Menu · '+invitations+' uitnodigingen':'Menu openen');
 }
 restore.classList.toggle('has-invitations',invitations>0);
 restore.dataset.invitationCount=String(invitations);
 restore.title=invitations?'Bovenbalk uitklappen · '+invitations+' uitnodigingen':'Bovenbalk uitklappen';
 restore.setAttribute('aria-label',restore.title);
 const entry=current.host.shadowRoot.querySelector('.social-entry');if(!entry)return;
 entry.hidden=!signedIn;if(!signedIn)return;
 entry.querySelector('.menu-name').textContent=invitations?'Uitnodigingen · '+invitations:'Uitnodigingen';
 const description=invitations?`${invitations} uitnodigingen · bekijk en antwoord`:social.connected?'Een leerling uitnodigen of reageren':'Verbinding herstellen…';
 const node=entry.querySelector('.menu-description');if(node&&node.textContent!==description)node.textContent=description;
}
function watchSocial(){
 if(script.dataset.social==='false')return;
 if(!socialWatched&&window.AxiomaSocial){socialWatched=true;window.AxiomaSocial.onChange(syncSocialMenu);syncSocialMenu();}
 else if(!window.AxiomaSocial&&window.AxiomaAuth&&!socialLoading){
  socialLoading=true;
  const existing=document.querySelector('script[src*="/axioma-social.js"]');
  if(existing)existing.addEventListener('load',watchSocial,{once:true});
  else load('shared/axioma-social.js?v=0.6.1').then(watchSocial).catch(()=>{});
 }
}
function navigateGame(){const node=current.header.querySelector('#crumbWorld,[data-screen="world"],#gameHomeBtn,#brandBtn,#homeBtn:not([data-platform-home]),#home');if(node)node.click();else if(script.dataset.gameHref)location.assign(new URL(script.dataset.gameHref,root));else if(!isHome)location.assign(location.pathname);}
function syncCrumbs(){
 if(!current)return;const bar=current.host.shadowRoot.querySelector('.crumbs');
 const homeSections=isHome&&current.header.querySelector('[data-platform-sections]');
 if(homeSections){
  if(current.signature==='home-sections')return;current.signature='home-sections';bar.replaceChildren();
  for(const node of homeSections.querySelectorAll('button,a')){const b=document.createElement('button');b.type='button';b.textContent=node.textContent.trim();b.setAttribute('part','home-link');if(node.id==='homeGames'){b.setAttribute('aria-current','page');b.setAttribute('part','home-link home-active');}b.onclick=()=>node.click();bar.append(b);}return;
 }
 const source=current.header.querySelector('.mission-breadcrumbs,.breadcrumbs');
 const suffix=({'battle.html':'Duo-battle','canvas.html':'Vrij kanvas','classroom.html':'Klasbattle','online.html':'Online duel','learn.html':'Samen leren','play.html':'Leren en spelen'})[location.pathname.split('/').pop()]||'';
 const signature=source?[...source.children].filter(n=>!n.hidden&&n.textContent.trim()&&!n.matches('.crumb-divider,svg')).map(n=>n.textContent.trim()).join('|'):suffix;
 if(current.signature===signature)return;current.signature=signature;bar.replaceChildren();
 const first=document.createElement('button');first.type='button';first.setAttribute('part','crumb-game');first.textContent=isHome?'Startpagina':title;first.onclick=navigateGame;if(isHome){first.disabled=true;first.setAttribute('aria-current','page');}bar.append(first);
 if(!source&&suffix){const sep=document.createElement('span');sep.textContent='›';sep.setAttribute('part','crumb-separator');const label=document.createElement('span');label.textContent=suffix;label.setAttribute('part','crumb-current');label.setAttribute('aria-current','page');bar.append(sep,label);}
 if(source)for(const node of source.children){const text=node.textContent.trim();if(node.hidden||!text||node.matches('.crumb-divider,svg')||text===title||text==='Wereldkaart'||text==='Rechten')continue;const sep=document.createElement('span');sep.textContent='›';sep.setAttribute('part','crumb-separator');sep.setAttribute('aria-hidden','true');const b=document.createElement(node.matches('a,button')?'button':'span');b.textContent=text;b.setAttribute('part',b.tagName==='BUTTON'?'crumb-link':'crumb-current');if(b.tagName==='BUTTON'){b.type='button';b.onclick=()=>node.click();}else b.setAttribute('aria-current','page');bar.append(sep,b);}
}
function syncMobileContext(){
 if(!current||!navPilot)return;
 const s=current.host.shadowRoot,titleNode=s.querySelector('.mobile-title'),detailNode=s.querySelector('.mobile-detail');
 if(!titleNode||!detailNode)return;
 titleNode.textContent=isHome?'leraarBob':title;
 let detail='';
 if(script.dataset.mobileContext){try{detail=document.querySelector(script.dataset.mobileContext)?.textContent.trim()||'';}catch{}}
 if(!detail&&!isHome){const crumbs=[...s.querySelectorAll('.crumbs button,.crumbs>span')].map(n=>n.textContent.trim()).filter(Boolean);detail=crumbs.at(-1)||'';}
 if(detail===title||detail==='Startpagina')detail='';
 detailNode.textContent=detail;detailNode.hidden=!detail;
}
function mount(header){
 if(mounted.has(header))return;current?.resizeObserver?.disconnect();current?.themeObserver?.disconnect();mounted.add(header);
 const context=document.createElement('div');context.className='lb-gamebar';
 // Keep live nodes: game event handlers and progress updates continue to work.
 while(header.firstChild)context.append(header.firstChild);
 header.classList.add('lb-header');for(const [property,value] of [['visibility','visible'],['pointer-events','auto'],['transform','none'],['opacity','1']])header.style.setProperty(property,value,'important');header.removeAttribute('data-collapsible-topbar');header.hidden=false;header.inert=false;if(!header.id)header.id='leraarbob-header';
 const host=document.createElement('leraarbob-topbar');if(navPilot)host.dataset.navPilot='true';if(title==='Algebrawereld'||script.dataset.breadcrumbEmphasis==='true')host.dataset.breadcrumbEmphasis='true';const shadow=host.attachShadow({mode:'open'});
 shadow.innerHTML=`<style>
 :host{display:block;flex:none;color:var(--lb-ink,#e7f1fa);background:var(--lb-surface,#102333);font:600 14px/1.25 system-ui,sans-serif}*{box-sizing:border-box}button,a{font:inherit;color:inherit}button,a.brand{min-height:44px;border:1px solid transparent;border-radius:var(--lb-control-radius,8px);background:none;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:8px}button:hover,a:hover{background:var(--lb-hover,#ffffff12)}button:focus-visible,a:focus-visible{outline:3px solid #e5b957;outline-offset:2px}svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}.row{display:flex;align-items:center;gap:16px;min-height:60px;padding:6px 20px;border-bottom:1px solid var(--lb-line,#799aae50)}.mobile-menu,.mobile-context{display:none}.brand{font-weight:850;font-size:24px;letter-spacing:-1px;font-style:italic;white-space:nowrap}.crumbs{display:flex;align-items:center;gap:5px;flex:1;min-width:0;overflow:auto;scrollbar-width:thin}.crumbs button,.crumbs>span{white-space:nowrap;font-size:13px}.crumbs button:disabled{opacity:1;cursor:default}.actions{display:flex;align-items:center;gap:5px;flex-shrink:0}.actions button{min-width:44px}.account{gap:8px}.account-mark{display:inline-flex;align-items:center;justify-content:center;flex:none;--avatar-size:30px}.account-mark .learner-avatar{display:inline-grid!important}.account .account-label{max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
 .teacher-link{display:inline-flex;align-items:center;min-height:44px;padding:8px 12px;border:1px solid var(--lb-line,#799aae50);text-decoration:none;font-size:13px;font-weight:750;color:inherit;white-space:nowrap}.teacher-link[hidden]{display:none}.teacher-link:hover{background:var(--lb-hover,#ffffff12)}
 .actions:has(.teacher-link:not([hidden])){flex-wrap:wrap}
 .progress{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:40px;padding:7px 11px;margin-right:5px;white-space:nowrap;border:1px solid var(--lb-line,#799aae50);border-radius:var(--lb-control-radius,4px);background:var(--lb-hover,#ffffff12);font-size:13px;font-weight:750;font-variant-numeric:tabular-nums;color:inherit}.progress[hidden]{display:none}.progress-icon{font-size:18px}.progress-value{line-height:1.3}
 dialog{position:fixed;inset:12px 12px 12px auto;margin:0;width:min(480px,calc(100vw - 24px));height:calc(100dvh - 24px);max-height:none;max-width:none;padding:0;border:1px solid var(--lb-line,#799aae50);border-radius:var(--lb-panel-radius,18px);background:var(--lb-surface,#102333);color:inherit;box-shadow:0 24px 100px #0008;overflow:hidden}
 dialog[open]{display:flex;flex-direction:column}
 dialog::backdrop{background:#02081199;backdrop-filter:blur(5px)}
 .dialog-head{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:20px 24px 18px;border-bottom:1px solid var(--lb-line,#799aae35);background:linear-gradient(120deg,#54dcf51a,transparent)}
 .menu-eyebrow{display:block;font-size:10px;letter-spacing:.18em;opacity:.65;margin-bottom:7px}
 .dialog-head h2{font-size:26px;letter-spacing:-.04em;margin:0}
 .dialog-head .close{width:44px;height:44px;flex:none;border-color:var(--lb-line,#799aae50);border-radius:var(--lb-control-radius,50%)}
 .menu-list{display:flex;flex-direction:column;gap:18px;padding:18px 24px;overflow:auto;min-height:0;flex:1;overscroll-behavior:contain}
 .menu-list h3{grid-column:1/-1;margin:0 0 2px;font-size:11px;text-transform:uppercase;letter-spacing:.12em;opacity:.65}
 .menu-list>section[hidden]{display:none}
 .menu-nav,.menu-options{display:grid;grid-template-columns:1fr 1fr;gap:10px}
 .menu-list .menu-card{--tile-color:#54d9ed;display:flex;gap:12px;align-items:center;justify-content:flex-start;min-width:0;min-height:64px;padding:12px;text-align:left;border:1px solid var(--lb-line,#799aae35);border-radius:var(--lb-tile-radius,12px);background:linear-gradient(135deg,color-mix(in srgb,var(--tile-color) 7%,transparent),transparent);transition:background .15s,border-color .15s}
 .menu-card[data-tone=green]{--tile-color:#62d4b3}.menu-card[data-tone=violet]{--tile-color:#bc9cfa}.menu-card[data-tone=amber]{--tile-color:#f4c56d}.menu-card[data-tone=blue]{--tile-color:#83b8ff}
 .menu-list .menu-card:hover{border-color:var(--tile-color);background:color-mix(in srgb,var(--tile-color) 13%,transparent)}
 .menu-list .menu-card:disabled{opacity:.45;cursor:default}
 .menu-mark{width:36px;height:36px;display:grid;place-items:center;flex:none;color:var(--tile-color);border:1px solid color-mix(in srgb,var(--tile-color) 25%,transparent);border-radius:var(--lb-mark-radius,10px);background:color-mix(in srgb,var(--tile-color) 9%,transparent)}
 .menu-copy{display:block;min-width:0}.menu-name{display:block;font-size:14px;font-weight:700;line-height:1.35}.menu-description{display:block;margin-top:5px;font-size:12px;font-weight:400;line-height:1.5;opacity:.65}
 .menu-chevron{display:none;opacity:.5}.menu-chevron svg{width:15px;height:15px}
 .menu-options .menu-card{gap:10px;min-height:84px}.menu-options .menu-mark{width:30px;height:34px}
 .menu-nav .menu-card{padding:10px;gap:9px}.menu-nav .menu-mark{width:28px;height:28px;background:none;border:0}.menu-nav .menu-name{font-size:13px}.menu-nav .menu-description{font-size:11px;margin-top:3px}
 .menu-footer{margin-top:auto;padding-top:14px;border-top:1px solid var(--lb-line,#799aae35)}
 .menu-footer .menu-card{width:100%;min-height:44px;padding:2px 8px;border:0;background:none}.menu-footer .menu-mark{border:0;background:none}.menu-footer .menu-name{font-size:12px;font-weight:500;opacity:.75}.menu-footer .menu-chevron{display:block;margin-left:auto}
 @media(max-width:500px){dialog{inset:8px;width:calc(100vw - 16px);height:calc(100dvh - 16px);border-radius:var(--lb-panel-radius,14px)}.dialog-head{padding:20px}.menu-list{padding:16px;gap:20px}.menu-options .menu-card{padding:12px;min-height:108px;flex-direction:column;align-items:flex-start;justify-content:flex-start}.menu-nav .menu-card{padding:10px 6px;gap:4px}}
 @media(max-height:550px){.dialog-head{padding:12px 20px}.menu-options .menu-card{flex-wrap:nowrap;min-height:76px}.menu-options .menu-copy{flex-basis:auto}.menu-list{gap:14px;padding:16px}}

 @media(max-width:650px){:host(:not([data-nav-pilot=true])) .row{gap:8px;padding:5px 10px;flex-wrap:wrap}:host(:not([data-nav-pilot=true])) .brand{font-size:22px}:host(:not([data-nav-pilot=true])) .actions{margin-left:auto}:host(:not([data-nav-pilot=true])) .account .account-label{display:none}:host(:not([data-nav-pilot=true])) .crumbs{order:3;flex-basis:100%;gap:3px}:host(:not([data-nav-pilot=true])) .crumbs:empty{display:none}:host(:not([data-nav-pilot=true])) .crumbs button{min-height:44px}:host(:not([data-nav-pilot=true])) .actions button{padding:6px}}
 @media(max-width:370px){:host(:not([data-nav-pilot=true])) .row{gap:3px;padding-inline:6px}:host(:not([data-nav-pilot=true])) .brand{font-size:20px;padding-inline:3px}:host(:not([data-nav-pilot=true])) .actions{gap:0}}
 @media(max-height:500px) and (min-width:600px){:host(:not([data-nav-pilot=true])) .row{flex-wrap:nowrap;gap:8px;padding:4px 10px}:host(:not([data-nav-pilot=true])) .crumbs{order:0;flex-basis:auto}:host(:not([data-nav-pilot=true])) .account .account-label{display:none}:host(:not([data-nav-pilot=true])) .brand{font-size:22px}}
 @media(max-width:650px){:host(:not([data-nav-pilot=true])) .row{flex-wrap:wrap}:host(:not([data-nav-pilot=true])) .brand{order:0}:host(:not([data-nav-pilot=true])) .crumbs{order:1;flex:1;min-width:0}:host(:not([data-nav-pilot=true])) .actions{order:2;flex-basis:100%;margin-left:0;justify-content:flex-end;gap:4px}:host(:not([data-nav-pilot=true])) .progress{margin-right:auto;padding:6px 9px;font-size:12px}:host(:not([data-nav-pilot=true])) .account .account-label{display:none}}
 @media (max-width:650px),(max-height:500px) and (max-width:900px){
  :host([data-nav-pilot=true]) .row{height:52px;min-height:52px;gap:4px;padding:4px max(6px,env(safe-area-inset-left)) 4px max(6px,env(safe-area-inset-right));flex-wrap:nowrap}
  :host([data-nav-pilot=true]) .brand,:host([data-nav-pilot=true]) .crumbs{display:none}
  :host([data-nav-pilot=true]) .mobile-menu{display:inline-flex;min-width:44px;width:44px;height:44px;padding:9px;flex:none;border-color:var(--lb-line,#799aae35)}
  :host([data-nav-pilot=true]) .mobile-context{display:flex;flex:1;min-width:0;align-items:baseline;gap:7px;padding:0 4px;overflow:hidden}
  :host([data-nav-pilot=true]) .mobile-title{font-size:14px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  :host([data-nav-pilot=true]) .mobile-detail{font-size:11px;font-weight:650;opacity:.65;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  :host([data-nav-pilot=true]) .actions{display:flex;flex:none;gap:0;margin-left:auto}
  :host([data-nav-pilot=true]) .teacher-link,:host([data-nav-pilot=true]) .account,:host([data-nav-pilot=true]) .menu{display:none}
  :host([data-nav-pilot=true]) .actions button{width:44px;min-width:44px;height:44px;padding:9px}
  :host([data-nav-pilot=true]) .progress{min-height:40px;margin:0 2px 0 0;padding:5px 7px;border:0;background:none;font-size:11px}
  :host([data-nav-pilot=true]) .progress-icon{display:none}
  :host([data-nav-pilot=true]) dialog{inset:0 auto 0 0;width:min(86vw,360px);height:100dvh;border-radius:0 var(--lb-panel-radius,18px) var(--lb-panel-radius,18px) 0;border-left:0}
  :host([data-nav-pilot=true]) dialog::backdrop{background:#02081180;backdrop-filter:blur(2px)}
  :host([data-nav-pilot=true]) .dialog-head{padding:max(14px,env(safe-area-inset-top)) 16px 12px;min-height:64px;background:none}
  :host([data-nav-pilot=true]) .dialog-head h2{font-size:20px;letter-spacing:-.02em}
  :host([data-nav-pilot=true]) .menu-eyebrow{font-size:9px;margin-bottom:3px}
  :host([data-nav-pilot=true]) .menu-list{gap:14px;padding:12px 12px max(14px,env(safe-area-inset-bottom))}
  :host([data-nav-pilot=true]) .menu-nav,:host([data-nav-pilot=true]) .menu-options{grid-template-columns:1fr;gap:4px}
  :host([data-nav-pilot=true]) .menu-list h3{margin:4px 8px 2px;font-size:10px}
  :host([data-nav-pilot=true]) .menu-list .menu-card,:host([data-nav-pilot=true]) .menu-options .menu-card{min-height:52px;padding:7px 8px;gap:10px;flex-direction:row;align-items:center;border-color:transparent;background:none;border-radius:10px}
  :host([data-nav-pilot=true]) .menu-list .menu-card:hover{background:var(--lb-hover,#ffffff12);border-color:var(--lb-line,#799aae35)}
  :host([data-nav-pilot=true]) .menu-mark,:host([data-nav-pilot=true]) .menu-options .menu-mark{width:34px;height:34px;border:0;background:color-mix(in srgb,var(--tile-color) 8%,transparent)}
  :host([data-nav-pilot=true]) .menu-name,:host([data-nav-pilot=true]) .menu-nav .menu-name{font-size:14px}
  :host([data-nav-pilot=true]) .menu-description,:host([data-nav-pilot=true]) .menu-nav .menu-description{font-size:11px;margin-top:2px}
  :host([data-nav-pilot=true]) .menu-chevron{display:block;margin-left:auto}
  :host([data-nav-pilot=true]) .menu-footer{padding-top:8px}
 }

 .has-invitations{box-shadow:inset 0 0 0 3px #c69136}
 /* v10: one compact navigation contract, preserving the engine's controls. */
 dialog .menu-list{gap:8px;padding:8px 12px;overflow:auto}
 dialog .menu-options,dialog .menu-nav{display:grid;grid-template-columns:1fr;gap:0}
 dialog .menu-list h3{margin:6px 8px 2px;font-size:10px}
 dialog .menu-list .menu-card{min-height:44px;padding:4px 8px;gap:8px;flex-direction:row;flex-wrap:nowrap;align-items:center;border:0;background:none}
 dialog .menu-list .menu-mark{width:28px;height:28px;flex:none}
 dialog .menu-list .menu-copy{flex:1;min-width:0}
 dialog .menu-list .menu-name{font-size:14px}
 dialog .menu-list .menu-description{display:none}
 dialog .menu-list .menu-chevron{display:block;margin-left:auto}
 dialog .menu-footer{padding-top:0}
 dialog .dialog-head{padding:8px 16px 8px 60px;min-height:52px;background:none}
 dialog .dialog-head h2{font-size:18px}
 dialog .dialog-head .close{position:fixed;left:var(--close-x,6px);top:var(--close-y,4px);width:44px;height:44px;background:var(--lb-surface,#102333);z-index:2}
 :host([data-nav-pilot=true]) dialog .menu-list{gap:8px;padding:8px 12px}
 :host([data-nav-pilot=true]) dialog .menu-list .menu-card{min-height:44px;padding:4px 8px;gap:8px;border:0;flex-wrap:nowrap}
 :host([data-nav-pilot=true]) dialog .menu-list .menu-mark{width:28px;height:28px}
 :host([data-nav-pilot=true]) dialog .menu-description{display:none}
 :host([data-nav-pilot=true]) dialog .dialog-head{padding:8px 16px 8px 60px;min-height:52px}
 @media(max-width:650px),(max-height:500px) and (max-width:900px){
  :host([data-nav-pilot=true]) .account{display:inline-flex}
  :host([data-nav-pilot=true]) .account .account-label{display:none}
  :host([data-nav-pilot=true]) .mobile-detail{display:none}
 }
 /* Icons stay small while every action retains a 44px touch target. */
 .fullscreen svg,.theme-toggle svg{width:20px;height:20px}
 .actions button[hidden],.display-notice[hidden]{display:none!important}
 .theme-toggle[aria-pressed=true]{background:var(--lb-hover,#ffffff12)}
 .display-notice{display:flex;align-items:center;gap:12px;padding:4px 12px;border-bottom:1px solid var(--lb-line,#799aae50);font-size:13px;font-weight:500}
 .display-notice span{flex:1}.display-notice button{min-width:44px;flex:none}
 /* Reserve both compact rows, including games with a fixed-height ::part(row). */
 @media(max-width:430px){
  :host([data-nav-pilot=true]) .row:has(.theme-toggle:not([hidden])){display:grid;grid-template-columns:44px minmax(0,1fr);grid-template-rows:24px 44px;gap:0 4px!important;padding:4px 6px!important;height:auto!important;min-height:77px!important}
  :host([data-nav-pilot=true]) .row:has(.theme-toggle:not([hidden])) .mobile-menu{grid-column:1;grid-row:1/3}
  :host([data-nav-pilot=true]) .row:has(.theme-toggle:not([hidden])) .mobile-context{grid-column:2;grid-row:1}
  :host([data-nav-pilot=true]) .row:has(.theme-toggle:not([hidden])) .actions{grid-column:2;grid-row:2;width:100%;justify-content:flex-end}
  :host([data-nav-pilot=true]) .row:has(.theme-toggle:not([hidden])) .progress{margin-right:auto}
 }
 /* Algebra's hierarchy remains readable beside the shared account controls. */
 :host([data-breadcrumb-emphasis=true]) .crumbs{gap:8px}
 :host([data-breadcrumb-emphasis=true]) [part=crumb-game]{font-size:17px;font-weight:850;padding-inline:12px;background:var(--lb-hover,#ffffff12);border-color:var(--lb-line,#799aae50)}
 :host([data-breadcrumb-emphasis=true]) [part=crumb-current],:host([data-breadcrumb-emphasis=true]) [part=crumb-link]{font-size:14px;font-weight:750}
 :host([data-breadcrumb-emphasis=true]) [part=crumb-separator]{font-size:21px;opacity:.65}
 @media(max-width:650px),(max-height:500px) and (max-width:900px){
  :host([data-breadcrumb-emphasis=true]) .mobile-context{gap:5px}
  :host([data-breadcrumb-emphasis=true]) .mobile-title{font-size:13px}
  :host([data-breadcrumb-emphasis=true]) .mobile-detail{display:block;font-size:11px;opacity:.8}
  :host([data-breadcrumb-emphasis=true]) .mobile-detail[hidden]{display:none}
  :host([data-breadcrumb-emphasis=true]) .mobile-detail::before{content:'› ';font-weight:800}
 }

 .live-entry{display:inline-flex;align-items:center;justify-content:center;gap:5px;min-height:44px;min-width:52px;padding:6px;border:1px solid var(--lb-line,#799aae50);border-radius:var(--lb-control-radius,8px);text-decoration:none;font-size:12px;font-weight:750;white-space:nowrap}.live-entry[hidden]{display:none!important}.live-dot{width:7px;height:7px;border-radius:50%;background:#bc6245}.live-entry.joined .live-dot{background:#4faf84}.live-entry[aria-current=page]{background:var(--lb-hover,#ffffff12)}
 @media(max-width:430px){
 :host([data-nav-pilot=true]) .row:has(.live-entry:not([hidden])){display:grid;grid-template-columns:44px minmax(0,1fr);grid-template-rows:44px 44px;gap:0 4px!important;padding:4px 6px!important;height:auto!important;min-height:96px!important}
 :host([data-nav-pilot=true]) .row:has(.live-entry:not([hidden])) .mobile-menu{grid-column:1;grid-row:1}
 :host([data-nav-pilot=true]) .row:has(.live-entry:not([hidden])) .mobile-context{grid-column:2;grid-row:1}
 :host([data-nav-pilot=true]) .row:has(.live-entry:not([hidden])) .actions{grid-column:1/3;grid-row:2;width:100%;justify-content:flex-end}
 :host([data-nav-pilot=true]) .row:has(.live-entry:not([hidden])) .progress{margin-right:auto}
 }
 </style><div class="row" part="row"><button part="mobile-menu" class="mobile-menu" type="button" aria-haspopup="dialog" aria-expanded="false" aria-label="Menu openen" title="Menu">${svg('menu')}</button><a part="brand" class="brand" data-platform-home href="${home}" aria-label="leraarBob, startpagina">leraarBob</a><nav part="crumbs" class="crumbs" aria-label="Je locatie"></nav><div class="mobile-context" part="mobile-context" aria-live="polite"><strong class="mobile-title">${isHome?'leraarBob':title}</strong><span class="mobile-detail" hidden></span></div><div class="actions" part="actions"><output class="progress" part="progress" hidden role="status" aria-live="polite" aria-atomic="true"><span class="progress-icon" aria-hidden="true"></span><span class="progress-value" aria-hidden="true"></span></output><a class="teacher-link" part="teacher-link" href="${new URL('teacher/',root)}" hidden>Mijn klassen</a><button part="toolbar-button account" class="account" type="button"><i class="account-mark" aria-hidden="true">${svg('account')}</i><span class="account-label" part="account-label">Inloggen</span></button><a class="live-entry" part="live-entry" hidden><span class="live-dot" aria-hidden="true"></span>Live</a><button part="toolbar-button fullscreen" class="fullscreen" type="button" aria-label="Volledig scherm" title="Volledig scherm" aria-pressed="false">${svg('full')}</button><button part="toolbar-button theme-toggle" class="theme-toggle" type="button" aria-label="Donkere weergave" title="Donkere weergave" aria-pressed="false" hidden>${svg('moon')}</button><button part="toolbar-button menu" class="menu" type="button" aria-haspopup="dialog" aria-label="Menu" title="Menu">${svg('menu')}</button><button part="toolbar-button collapse" class="collapse" type="button" aria-label="Bovenbalk inklappen" title="Bovenbalk inklappen" aria-controls="${header.id}">${svg('up')}</button></div></div><div class="display-notice" role="status" hidden><span></span><button type="button" class="dismiss-notice" aria-label="Melding sluiten">${svg('close')}</button></div><dialog aria-labelledby="lb-menu-title"><div class="dialog-head"><div><span class="menu-eyebrow"></span><h2 id="lb-menu-title" class="menu-title">Menu</h2></div><button class="close" type="button" aria-label="Menu sluiten" autofocus>${svg('close')}</button></div><div class="menu-list"></div></dialog>`;
 header.append(host,context);
 const parent=header.parentElement,layout=getComputedStyle(parent);
 if(layout.display==='grid'){const rows=layout.gridTemplateRows.split(' ').length;parent.classList.add(rows>=4?'lb-grid-four':rows===3?'lb-grid-three':'lb-grid-two');}
 const measure=()=>{if(!header.isConnected||current?.header!==header)return;const height=collapsed?0:Math.ceil(header.getBoundingClientRect().height);document.documentElement.style.setProperty('--lb-header-height',height+'px');if(header.matches('.atlas-header'))document.documentElement.style.setProperty('--header-height',height+'px');};
 const resizeObserver=new ResizeObserver(measure);resizeObserver.observe(header);
 current={header,host,context,resizeObserver,collapse:shadow.querySelector('.collapse')};
 shadow.querySelector('dialog').addEventListener('close',()=>{for(const button of shadow.querySelectorAll('.menu,.mobile-menu'))button.setAttribute('aria-expanded','false');});
 shadow.querySelector('.account').onclick=openAccount;shadow.querySelector('.fullscreen').onclick=toggleFullscreen;shadow.querySelector('.theme-toggle').onclick=toggleTheme;shadow.querySelector('.dismiss-notice').onclick=()=>{shadow.querySelector('.display-notice').hidden=true;shadow.querySelector('.fullscreen').focus();};shadow.querySelector('.menu').onclick=()=>showMenu();shadow.querySelector('.mobile-menu').onclick=()=>showMenu();shadow.querySelector('.close').onclick=()=>shadow.querySelector('dialog').close();current.collapse.onclick=()=>setCollapsed(true,true);
 if(navPilot){let start=null;shadow.querySelector('dialog').addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;start={x:e.clientX,y:e.clientY};},{passive:true});shadow.querySelector('dialog').addEventListener('pointermove',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(dx<-70&&Math.abs(dx)>Math.abs(dy)*1.35){start=null;shadow.querySelector('dialog').close();}else if(Math.abs(dy)>45)start=null;},{passive:true});shadow.querySelector('dialog').addEventListener('pointerup',()=>{start=null;},{passive:true});}
 // Redundant navigation is replaced; lesson controls and game indicators stay below.
 for(const node of context.querySelectorAll('.brand,.atlas-brand,.mission-breadcrumbs,.breadcrumbs,.brand-caption,#accountBtn,#guestBtn,#identity,#logout,#menuBtn,#menu,.topbar-collapse,.brandline,.rf-game-brand,#profileBtn,#themeBtn,#modeBtn[aria-pressed],#theme,#fullBtn,.atlas-actions>[data-screen=profile],.atlas-actions>[data-fullscreen]'))node.classList.add('lb-legacy-nav');
 for(const node of context.querySelectorAll('[data-platform-home],.axiomaHome,#axioma-home'))node.classList.add('lb-legacy-nav');
 const menu=nativeMenu(header);if(menu)menu.classList.add('lb-legacy-nav');
 context.querySelector('.topline')?.classList.add('lb-legacy-nav');
 if(isHome)context.classList.add('lb-empty');
 if(script.dataset.context==='none')context.classList.add('lb-empty');
 const vector=location.pathname.includes('/vectoren/');if(vector){for(const a of context.querySelectorAll('a[href*="Axioma_Vectorentrainer"]'))a.classList.add('lb-legacy-nav');for(const n of context.querySelectorAll('h1,strong,header>span'))if(!n.closest('.status-chip,.round-chip'))n.classList.add('lb-legacy-nav');}
 context.classList.toggle('lb-empty',context.classList.contains('lb-empty')||![...context.querySelectorAll('button,a,span,h1,h2,strong,select')].some(n=>!n.closest('.lb-legacy-nav,[hidden]')&&n.textContent.trim()));
 syncCrumbs();syncAccount();syncProgress();syncMobileContext();syncDisplayControls();setCollapsed(collapsed);
}
function scan(){queued=false;if(!cssReady)return;const header=document.querySelector(selector);if(header){mount(header);if(header.inert!==collapsed)header.inert=collapsed;syncCrumbs();syncProgress();syncMobileContext();syncDisplayControls();}watchAccount();watchSocial();}
new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(scan);}}).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden','inert']});
for(const event of ['axioma:game-ready','axioma:game-progress'])window.addEventListener(event,syncProgress);
window.LeraarBobTopbar=Object.freeze({setCollapsed,openAccount,openMenu:()=>showMenu()});scan();
})();
