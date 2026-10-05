/* Compatibility facade: all game membership, providers and routes come from games.json. */
(() => {
 'use strict';if(window.LeraarBobPlayModes)return;
 const root=new URL('../',document.currentScript.src),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const definitions={
  solo:{group:'learning',title:'Alleen leren',devices:'1 leerling',description:'Kies een level en volg je eigen leerroute.',access:'Ook zonder aanmelding',glyph:'route'},
  series:{group:'learning',title:'Reeks samenstellen',devices:'1 leerling',description:'Kies vraagvormen, moeilijkheid en aantal opgaven.',access:'Ook zonder aanmelding',glyph:'route'},
  learn:{group:'learning',title:'Samen leren',devices:'2–3 leerlingen · elk een toestel',description:'Eerst je eigen idee, daarna samen bouwen en controleren.',access:'Leerlingaccounts · uitnodiging op alias',glyph:'classroom'},
  teacher:{group:'learning',title:'Samen leren op het klasbord',devices:'Leerkracht en klas · één scherm',access:'Leerkrachtaccount',glyph:'classroom'},
  classlearn:{group:'learning',title:'Klaslearn',devices:'De klas · elk een toestel',description:'Iedereen werkt zelf; de leerkracht begeleidt en bespreekt.',access:'leraarBob-account · sessiecode',glyph:'classroom'},
  local:{group:'battle',title:'Duo-battle op één toestel',devices:'2 spelers · één scherm',description:'Speel tegen elkaar op twee werkborden naast elkaar.',access:'Ook zonder aanmelding',glyph:'battle'},
  online:{group:'battle',title:'Online duel',devices:'2 leerlingen · elk een toestel',description:'Nodig een leerling uit op alias.',access:'Leerlingaccounts · uitnodiging',glyph:'battle'},
  classroom:{group:'battle',title:'Klasbattle',devices:'De hele klas · elk een toestel',description:'Kies de instellingen en deel de sessiecode.',teacherDescription:'Start een sessie, deel de code en kies wanneer de ronde begint.',studentDescription:'Voer de code van je leerkracht in en speel mee met de klas.',access:'leraarBob-account · sessiecode',glyph:'classroom'},
  group:{group:'battle',title:'Groepssessie',devices:'Meerdere spelers · elk een toestel',access:'Leerlingaccounts',glyph:'classroom'}
 };
 const boot=window.LeraarBobGameRegistry?Promise.resolve():new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL('shared/game-registry.js?v=20261006-platform',root).href;s.onload=resolve;s.onerror=reject;document.head.append(s);});
 const ready=()=>boot.then(()=>window.LeraarBobGameRegistry.ready());
 const register=()=>window.LeraarBobGameRegistry;
 const adapt=g=>g&&({...g,name:g.title,subject:g.subject||g.category,path:g.route?.prefix||g.href.split(/[?#]/)[0],modes:register().modes(g.id).filter(m=>m.id!=='solo').map(m=>m.id)});
 const game=id=>adapt(register()?.presentation(id)),current=()=>adapt(register()?.current(location.href));
 function modes(id,{solo=false,role='',topicId,world}={}){return (register()?.modes(id,{role:role||undefined,topicId:topicId||world})||[]).filter(m=>(solo||m.id!=='solo')&&(m.id!=='teacher'||role==='teacher')).map(m=>{
  const d=definitions[m.id]||{},description=role==='teacher'?d.teacherDescription||d.description:role==='student'?d.studentDescription||d.description:d.description;
  return {...d,...m,group:m.purpose==='battle'?'battle':'learning',description:m.description||description,...(m.isReference?{access:'Verwijzing naar '+m.providerTitle,description:m.description||'Je opent '+m.providerTitle+' voor deze spelvorm.'}:{}),file:m.href.split('/').pop().split('?')[0]};
 });}
 function destination(id,mode,world){
  const topicId=world&&typeof world==='object'?world.topicId||world.world:world;
  const entry=register()?.modes(id,{topicId}).find(e=>e.id===mode);if(!entry)return null;
  const origin=entry.isReference?location.href:undefined;
  const result=register().destination(id,mode,{topicId,hub:mode==='classroom',returnTo:origin});
  if(!result)return null;const url=new URL(result);
  if(mode==='classroom'){url.searchParams.set('view','create');const source=new URL(location.href);for(const key of ['level','topic','screen'])if(source.searchParams.has(key))url.searchParams.set(key,source.searchParams.get(key));url.searchParams.set('returnTo',source.pathname+source.search+source.hash);}
  return url.href;
 }
 function cards(id,options={}){
  const entries=modes(id,options),item=game(id);if(!item)return '';
  return ['learning','battle'].map(group=>{const list=entries.filter(m=>m.group===group);return !list.length?'':`<section class="play-mode-section"><h3>${group==='learning'?'Leren':'Battles'}</h3><div class="mode-links">${list.map(m=>`<a class="play-mode" data-play-mode="${escape(m.id)}" data-participation="${m.participation}" data-purpose="${m.purpose}" href="${escape(destination(id,m.id,options.topicId||options.world))}" aria-label="${escape(item.name+': '+m.title)}"><span class="play-mode-copy"><strong>${escape(m.title)}</strong><span class="play-mode-devices">${escape(m.devices)}</span><span class="play-mode-description">${escape(m.description)}</span><small>${escape(m.access)}</small></span><span class="play-mode-arrow" aria-hidden="true">→</span></a>`).join('')}</div></section>`;}).join('');
 }
 function navigation(node,id){
  if(!game(id))return null;const key=node.id==='battleBtn'?'local':node.id==='classBtn'?'classroom':null;
  if(key)return modes(id).find(m=>m.id===key)||null;if(!node.href)return null;
  const target=new URL(node.href),routeKeys=['view','audience','mode','intent'];
  return modes(id).find(m=>[m.href,destination(id,m.id)].filter(Boolean).some(path=>{const candidate=new URL(path,root);return candidate.origin===target.origin&&candidate.pathname===target.pathname&&routeKeys.every(k=>candidate.searchParams.get(k)===target.searchParams.get(k));}))||null;
 }
 function hubDestination(view='overview',{gameId=current()?.id,topicId,returnTo=location.href}={}){
  const url=new URL('klasbattle/',root),source=new URL(location.href),g=game(gameId);
  url.searchParams.set('view',['learn','rankings','overview'].includes(view)?view:'overview');
  if(g)url.searchParams.set('game',g.id);
  const topic=topicId||source.searchParams.get('topic')||source.searchParams.get('world');
  if(topic&&g?.topics?.some(t=>t.id===topic))url.searchParams.set('world',topic);
  for(const key of ['level','skills'])if(source.searchParams.has(key))url.searchParams.set(key,source.searchParams.get(key));
  const back=register()?.safeReturn(returnTo);if(back)url.searchParams.set('returnTo',back);
  return url.href;
 }
  const css=`
    .play-mode-section{margin:14px 0 0}.play-mode-section>h3{margin:0 0 7px;font:700 12px/1.4 system-ui,sans-serif;letter-spacing:.07em;text-transform:uppercase;color:inherit}
    .mode-links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.mode-links>.play-mode:only-child{grid-column:1/-1}
    .mode-links .play-mode{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;min-height:44px;padding:12px;border:1px solid var(--lb-line,#c2cfca);border-radius:0;background:var(--lb-surface,#faf9f4);color:var(--lb-ink,#183b3d);text-decoration:none;line-height:1.35;min-width:0}
    .play-mode:hover{background:var(--lb-hover,#e8f0e9)}.play-mode:focus-visible{outline:3px solid #c6a24f;outline-offset:2px}.play-mode-copy{display:grid;gap:4px;min-width:0}.play-mode strong{font-size:14px;font-weight:750}.play-mode-devices{font-size:12px;font-weight:600}.play-mode-description{font-size:13px}.play-mode small{font-size:11px;margin-top:3px}.play-mode-arrow{font-size:20px;flex:none;line-height:1}
    @media(max-width:480px){.mode-links{grid-template-columns:minmax(0,1fr)}.mode-links .play-mode{padding:10px 12px}.play-mode-description{font-size:12px}}
  `;
 window.LeraarBobPlayModes=Object.freeze({ready,get games(){return (register()?.list()||[]).filter(g=>g.capabilities?.modes?.length).map(adapt);},game,current,modes,cards,destination,navigation,hubDestination,css});
 function retainWorld(){
  const item=current();if(!item||location.pathname.endsWith('/classroom.html'))return;
  const world=new URLSearchParams(location.search).get('world'),entry=register().modes(item.id).find(m=>m.id==='classroom'&&!m.isReference);if(!entry)return;
  if(item.id==='rechtenwereld'&&item.topics?.some(t=>t.id===world))for(const link of document.querySelectorAll('a[href="play.html"]'))link.href='play.html?world='+encodeURIComponent(world);
  const local=new URL(entry.href,root).pathname;
  for(const link of document.querySelectorAll('a[href]')){const target=new URL(link.href);if(target.pathname!==local||['hub','join','room','code','session'].some(k=>target.searchParams.has(k)))continue;link.href=destination(item.id,'classroom',target.searchParams.get('world')||world);}
 }
 ready().then(()=>{retainWorld();if(document.body)new MutationObserver(retainWorld).observe(document.body,{childList:true,subtree:true});}).catch(()=>{});
})();
