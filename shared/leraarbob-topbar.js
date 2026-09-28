/* Shared platform chrome. Existing engine controls retain their nodes and handlers. */
(() => {
'use strict';
if(window.LeraarBobTopbar||window.VectorBattlePlayer||window!==window.top)return;
const script=document.currentScript,root=new URL('../',script.src),home=new URL('index.html',root).href;
const title=script.dataset.title||document.title.split('·')[0].trim();
document.body.dataset.platformPage=title;
const isHome=script.dataset.page==='home',selector=script.dataset.header||'header';
const KEY='leraarbob-topbar-collapsed',mounted=new WeakSet();let collapsed=false,current=null,account=null,queued=false;
try{collapsed=localStorage.getItem(KEY)==='true';}catch{}
const icon={account:'<circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',settings:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',up:'<path d="m6 15 6-6 6 6"/>',down:'<path d="m6 9 6 6 6-6"/>'};
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
 right:'<path d="m9 5 7 7-7 7"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>'
});
const menuStyle={playBtn:['route','cyan'],freeBtn:['arrow','green'],canvasBtn:['pencil','violet'],battleBtn:['battle','amber'],classBtn:['classroom','blue'],helpBtn:['help','cyan'],progressBtn:['chart','green']};
// Read each text role separately: textContent alone joins icons, titles and subtitles.
function menuDetails(node){
 const description=node.querySelector('small')?.textContent.trim()||'';
 const copy=node.cloneNode(true);copy.querySelectorAll('small,svg,[aria-hidden="true"],.menu-icon').forEach(n=>n.remove());
 const label=(copy.textContent.trim()||node.getAttribute('aria-label')||node.title||'').replace(/\s+/g,' ');
 const [glyph,tone]=menuStyle[node.id]||['arrow','cyan'];
 return {label,description,glyph,tone};
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
function watchAccount(){if(watched||!window.AxiomaAuth)return;watched=true;AxiomaAuth.ready().then(v=>{account=v?.account||null;syncAccount();}).catch(()=>{});AxiomaAuth.onChange?.(v=>{if(!v.pending){account=v.account;syncAccount();}});}
addEventListener('axioma:login-complete',event=>{account=event.detail.account;syncAccount();});
function syncAccount(){if(!current)return;const b=current.host.shadowRoot.querySelector('.account');const label=account?.role==='teacher'?'Leerkracht':account?.alias||'Inloggen';b.querySelector('span').textContent=label;b.title='leraarBob-account · '+label;b.setAttribute('aria-label',b.title);current.host.shadowRoot.querySelector('.teacher-link').hidden=account?.role!=='teacher'||script.dataset.page==='teacher';}
// Read the live game record, never a second XP balance or unscoped local-storage key.
function progressSummary(){
 if(window.AxiomaGame&&!window.AxiomaGame.active)return null;
 const source=current?.header.querySelector('[data-platform-progress]');
 if(source)return {kind:source.dataset.platformProgress,value:Number(source.dataset.value),total:Number(source.dataset.total)};
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
 const label=summary.kind==='xp'?value+' XP':value+(total?'/'+total:'')+' levels';
 const description=summary.kind==='xp'?(summary.home?'Totale XP over je spellen':'XP in '+title)+': '+value:(count??0)+' van '+total+' levels afgerond in '+title;
 if(badge.dataset.signature===label+'|'+description)return;
 badge.dataset.signature=label+'|'+description;
 badge.dataset.kind=summary.kind;
 badge.querySelector('.progress-icon').textContent=summary.kind==='xp'?'★':'✓';
 badge.querySelector('.progress-value').textContent=label;
 badge.title=description;badge.setAttribute('aria-label',description);
}
function nativeMenu(header){return header.querySelector('#trainerMenu,#main-menu,.appNav');}
function showMenu(kind){
 const {host,header}=current,s=host.shadowRoot,dialog=s.querySelector('dialog'),list=s.querySelector('.menu-list');list.replaceChildren();
 const settings=kind==='settings';dialog.dataset.kind=kind;
 s.querySelector('.menu-title').textContent=settings?'Instellingen':title;
 s.querySelector('.menu-eyebrow').textContent=settings?'MAAK HET JOUW PLEK':'WAAR WIL JE HEEN?';
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
 if(!settings){
  const nav=section('','menu-nav');add(nav,'leraarBob',()=>location.assign(home),{description:'Alle spellen',glyph:'home'});
  if(account?.role==='teacher'&&script.dataset.page!=='teacher')add(nav,'Mijn klassen',()=>location.assign(new URL('teacher/',root)),{description:'Leraarmodus en groepsbattles',glyph:'classroom'});
  if(!isHome&&script.dataset.menuOverview!=='false')add(nav,title,()=>navigateGame(),{description:'Naar het overzicht',glyph:'compass'});
  const options=section(script.dataset.menuHeading||'Spelen & ontdekken','menu-options');
  const menu=nativeMenu(header);
  const nodes=menu?menu.querySelectorAll('button,a'):header.querySelectorAll('.lb-gamebar button,.lb-gamebar a');
  for(const node of nodes){
   if(node.hidden||node.matches('[data-collapse-topbar],#themeBtn,#fullBtn,[data-platform-home],.axiomaHome,.lb-legacy-brand,#logout')||(!menu&&node.closest('[hidden]')))continue;
   const details=menuDetails(node);if(details.label)add(options,details.label,()=>node.click(),{...details,source:node});
  }
  if(options.children.length===1)options.remove();
  if(window.AxiomaSocial){const social=section('Met anderen','menu-nav');const entry=add(social,'Samen spelen',()=>window.AxiomaSocial.open(s.querySelector('.menu')),{description:'Duo, groepsbattle en online spelers',glyph:'account'});entry.classList.add('social-entry');entry.setAttribute('aria-haspopup','dialog');syncSocialMenu();}
 }else{
  const options=section('Weergave','menu-options');
  add(options,document.fullscreenElement?'Volledig scherm verlaten':'Volledig scherm',()=>{const p=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();p?.catch(()=>{});},{description:'Gebruik alle schermruimte',glyph:'full'});
  const mode=document.querySelector('#themeBtn,#modeBtn[aria-pressed],#theme');if(mode){const details=menuDetails(mode);add(options,details.label||'Weergave',()=>mode.click(),{...details,glyph:'settings',source:mode});}
 }
 const footer=section('','menu-footer');add(footer,'Bovenbalk inklappen',()=>setCollapsed(true,true),{glyph:'up'});
 s.querySelector(settings?'.settings':'.menu').setAttribute('aria-expanded','true');dialog.showModal();
}
let socialWatched=false;
function syncSocialMenu(){
 const entry=current?.host.shadowRoot.querySelector('.social-entry');if(!entry)return;
 const social=window.AxiomaSocial?.state(),signedIn=!!social?.account;
 entry.parentElement.hidden=!signedIn;
 if(!signedIn)return;
 const invitations=social.invitations.filter(i=>i.status==='pending'&&i.recipient_id===social.account.id).length;
 const count=social.players.filter(p=>p.id!==social.account.id).length;
 const description=invitations?`${invitations} ${invitations===1?'uitnodiging':'uitnodigingen'} · bekijk en antwoord`:social.connected?count?`${count} ${count===1?'andere speler':'andere spelers'} online`:'Duo, groepsbattle en online spelers':'Verbinding herstellen…';
 const node=entry.querySelector('.menu-description');if(node.textContent!==description)node.textContent=description;
}
function watchSocial(){if(!socialWatched&&window.AxiomaSocial){socialWatched=true;window.AxiomaSocial.onChange(syncSocialMenu);}}
function navigateGame(){const node=current.header.querySelector('#crumbWorld,[data-screen="world"],#gameHomeBtn,#brandBtn,#homeBtn:not([data-platform-home]),#home');if(node)node.click();else if(script.dataset.gameHref)location.assign(new URL(script.dataset.gameHref,root));else if(!isHome)location.assign(location.pathname);}
function syncCrumbs(){
 if(!current)return;const bar=current.host.shadowRoot.querySelector('.crumbs');
 const homeSections=isHome&&current.header.querySelector('[data-platform-sections]');
 if(homeSections){
  if(current.signature==='home-sections')return;current.signature='home-sections';bar.replaceChildren();
  for(const node of homeSections.querySelectorAll('button,a')){const b=document.createElement('button');b.type='button';b.textContent=node.textContent.trim();b.setAttribute('part','home-link');if(node.id==='homeGames'){b.setAttribute('aria-current','page');b.setAttribute('part','home-link home-active');}b.onclick=()=>node.click();bar.append(b);}return;
 }
 const source=current.header.querySelector('.mission-breadcrumbs,.breadcrumbs');
 const suffix=location.pathname.endsWith('/battle.html')?'Battle':location.pathname.endsWith('/canvas.html')?'Vrij kanvas':location.pathname.endsWith('/classroom.html')?'Klasmodus':'';
 const signature=source?[...source.children].filter(n=>!n.hidden&&n.textContent.trim()&&!n.matches('.crumb-divider,svg')).map(n=>n.textContent.trim()).join('|'):suffix;
 if(current.signature===signature)return;current.signature=signature;bar.replaceChildren();
 const first=document.createElement('button');first.type='button';first.setAttribute('part','crumb-game');first.textContent=isHome?'Startpagina':title;first.onclick=navigateGame;if(isHome){first.disabled=true;first.setAttribute('aria-current','page');}bar.append(first);
 if(!source&&suffix){const sep=document.createElement('span');sep.textContent='›';sep.setAttribute('part','crumb-separator');const label=document.createElement('span');label.textContent=suffix;label.setAttribute('part','crumb-current');label.setAttribute('aria-current','page');bar.append(sep,label);}
 if(source)for(const node of source.children){const text=node.textContent.trim();if(node.hidden||!text||node.matches('.crumb-divider,svg')||text===title||text==='Wereldkaart'||text==='Rechten')continue;const sep=document.createElement('span');sep.textContent='›';sep.setAttribute('part','crumb-separator');sep.setAttribute('aria-hidden','true');const b=document.createElement(node.matches('a,button')?'button':'span');b.textContent=text;b.setAttribute('part',b.tagName==='BUTTON'?'crumb-link':'crumb-current');if(b.tagName==='BUTTON'){b.type='button';b.onclick=()=>node.click();}else b.setAttribute('aria-current','page');bar.append(sep,b);}
}
function mount(header){
 if(mounted.has(header))return;current?.resizeObserver?.disconnect();mounted.add(header);
 const context=document.createElement('div');context.className='lb-gamebar';
 // Keep live nodes: game event handlers and progress updates continue to work.
 while(header.firstChild)context.append(header.firstChild);
 header.classList.add('lb-header');for(const [property,value] of [['visibility','visible'],['pointer-events','auto'],['transform','none'],['opacity','1']])header.style.setProperty(property,value,'important');header.removeAttribute('data-collapsible-topbar');header.hidden=false;header.inert=false;if(!header.id)header.id='leraarbob-header';
 const host=document.createElement('leraarbob-topbar');const shadow=host.attachShadow({mode:'open'});
 shadow.innerHTML=`<style>
 :host{display:block;flex:none;color:var(--lb-ink,#e7f1fa);background:var(--lb-surface,#102333);font:600 14px/1.25 system-ui,sans-serif}*{box-sizing:border-box}button,a{font:inherit;color:inherit}button,a.brand{min-height:44px;border:1px solid transparent;border-radius:var(--lb-control-radius,8px);background:none;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:8px}button:hover,a:hover{background:var(--lb-hover,#ffffff12)}button:focus-visible,a:focus-visible{outline:3px solid #e5b957;outline-offset:2px}svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}.row{display:flex;align-items:center;gap:16px;min-height:60px;padding:6px 20px;border-bottom:1px solid var(--lb-line,#799aae50)}.brand{font-weight:850;font-size:24px;letter-spacing:-1px;font-style:italic;white-space:nowrap}.crumbs{display:flex;align-items:center;gap:5px;flex:1;min-width:0;overflow:auto;scrollbar-width:thin}.crumbs button,.crumbs>span{white-space:nowrap;font-size:13px}.crumbs button:disabled{opacity:1;cursor:default}.actions{display:flex;align-items:center;gap:5px;flex-shrink:0}.actions button{min-width:44px}.account{gap:8px}.account span{max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
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
 dialog[data-kind=settings] .menu-options{grid-template-columns:1fr}dialog[data-kind=settings] .menu-card{flex-wrap:nowrap;min-height:76px}dialog[data-kind=settings] .menu-copy{flex-basis:auto}
 @media(max-width:500px){dialog{inset:8px;width:calc(100vw - 16px);height:calc(100dvh - 16px);border-radius:var(--lb-panel-radius,14px)}.dialog-head{padding:20px}.menu-list{padding:16px;gap:20px}.menu-options .menu-card{padding:12px;min-height:108px;flex-direction:column;align-items:flex-start;justify-content:flex-start}.menu-nav .menu-card{padding:10px 6px;gap:4px}}
 @media(max-height:550px){.dialog-head{padding:12px 20px}.menu-options .menu-card{flex-wrap:nowrap;min-height:76px}.menu-options .menu-copy{flex-basis:auto}.menu-list{gap:14px;padding:16px}}

 @media(max-width:650px){.row{gap:8px;padding:5px 10px;flex-wrap:wrap}.brand{font-size:22px}.actions{margin-left:auto}.account span{display:none}.crumbs{order:3;flex-basis:100%;gap:3px}.crumbs:empty{display:none}.crumbs button{min-height:44px}.actions button{padding:6px}}
 @media(max-width:370px){.row{gap:3px;padding-inline:6px}.brand{font-size:20px;padding-inline:3px}.actions{gap:0}}
 @media(max-height:500px) and (min-width:600px){.row{flex-wrap:nowrap;gap:8px;padding:4px 10px}.crumbs{order:0;flex-basis:auto}.account span{display:none}.brand{font-size:22px}}
 @media(max-width:650px){.row{flex-wrap:wrap}.brand{order:0}.crumbs{order:1;flex:1;min-width:0}.actions{order:2;flex-basis:100%;margin-left:0;justify-content:flex-end;gap:4px}.progress{margin-right:auto;padding:6px 9px;font-size:12px}.account span{display:none}}
 </style><div class="row" part="row"><a part="brand" class="brand" data-platform-home href="${home}" aria-label="leraarBob, startpagina">leraarBob</a><nav part="crumbs" class="crumbs" aria-label="Je locatie"></nav><div class="actions" part="actions"><output class="progress" part="progress" hidden role="status" aria-live="polite" aria-atomic="true"><span class="progress-icon" aria-hidden="true"></span><span class="progress-value" aria-hidden="true"></span></output><a class="teacher-link" part="teacher-link" href="${new URL('teacher/',root)}" hidden>Mijn klassen</a><button part="toolbar-button account" class="account" type="button">${svg('account')}<span part="account-label">Inloggen</span></button><button part="toolbar-button settings" class="settings" type="button" aria-haspopup="dialog" aria-label="Instellingen" title="Instellingen">${svg('settings')}</button><button part="toolbar-button menu" class="menu" type="button" aria-haspopup="dialog" aria-label="Menu" title="Menu">${svg('menu')}</button><button part="toolbar-button collapse" class="collapse" type="button" aria-label="Bovenbalk inklappen" title="Bovenbalk inklappen" aria-controls="${header.id}">${svg('up')}</button></div></div><dialog aria-labelledby="lb-menu-title"><div class="dialog-head"><div><span class="menu-eyebrow"></span><h2 id="lb-menu-title" class="menu-title">Menu</h2></div><button class="close" type="button" aria-label="Menu sluiten" autofocus>${svg('close')}</button></div><div class="menu-list"></div></dialog>`;
 header.append(host,context);
 const parent=header.parentElement,layout=getComputedStyle(parent);
 if(layout.display==='grid'){const rows=layout.gridTemplateRows.split(' ').length;parent.classList.add(rows>=4?'lb-grid-four':rows===3?'lb-grid-three':'lb-grid-two');}
 const measure=()=>{if(!header.isConnected||current?.header!==header)return;const height=collapsed?0:Math.ceil(header.getBoundingClientRect().height);document.documentElement.style.setProperty('--lb-header-height',height+'px');if(header.matches('.atlas-header'))document.documentElement.style.setProperty('--header-height',height+'px');};
 const resizeObserver=new ResizeObserver(measure);resizeObserver.observe(header);
 current={header,host,context,resizeObserver,collapse:shadow.querySelector('.collapse')};
 shadow.querySelector('dialog').addEventListener('close',()=>{shadow.querySelector('.menu').setAttribute('aria-expanded','false');shadow.querySelector('.settings').setAttribute('aria-expanded','false');});
 shadow.querySelector('.account').onclick=openAccount;shadow.querySelector('.settings').onclick=()=>showMenu('settings');shadow.querySelector('.menu').onclick=()=>showMenu('menu');shadow.querySelector('.close').onclick=()=>shadow.querySelector('dialog').close();current.collapse.onclick=()=>setCollapsed(true,true);
 // Redundant navigation is replaced; lesson controls and game indicators stay below.
 for(const node of context.querySelectorAll('.brand,.atlas-brand,.mission-breadcrumbs,.breadcrumbs,.brand-caption,#accountBtn,#guestBtn,#identity,#logout,#menuBtn,#menu,.topbar-collapse,.brandline,.rf-game-brand,#profileBtn,.atlas-actions>[data-screen=profile],.atlas-actions>[data-fullscreen]'))node.classList.add('lb-legacy-nav');
 for(const node of context.querySelectorAll('[data-platform-home],.axiomaHome,#axioma-home'))node.classList.add('lb-legacy-nav');
 const menu=nativeMenu(header);if(menu)menu.classList.add('lb-legacy-nav');
 context.querySelector('.topline')?.classList.add('lb-legacy-nav');
 if(isHome)context.classList.add('lb-empty');
 if(script.dataset.context==='none')context.classList.add('lb-empty');
 const vector=location.pathname.includes('/vectoren/');if(vector){for(const a of context.querySelectorAll('a[href*="Axioma_Vectorentrainer"]'))a.classList.add('lb-legacy-nav');for(const n of context.querySelectorAll('h1,strong,header>span'))if(!n.closest('.status-chip,.round-chip'))n.classList.add('lb-legacy-nav');}
 context.classList.toggle('lb-empty',context.classList.contains('lb-empty')||![...context.querySelectorAll('button,a,span,h1,h2,strong,select')].some(n=>!n.closest('.lb-legacy-nav,[hidden]')&&n.textContent.trim()));
 syncCrumbs();syncAccount();syncProgress();setCollapsed(collapsed);
}
function scan(){queued=false;if(!cssReady)return;const header=document.querySelector(selector);if(header){mount(header);if(header.inert!==collapsed)header.inert=collapsed;syncCrumbs();syncProgress();}watchAccount();watchSocial();}
new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(scan);}}).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden','inert']});
for(const event of ['axioma:game-ready','axioma:game-progress'])window.addEventListener(event,syncProgress);
window.LeraarBobTopbar=Object.freeze({setCollapsed,openAccount});scan();
})();
