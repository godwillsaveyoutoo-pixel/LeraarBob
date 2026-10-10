(async()=>{
'use strict';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const Registry=window.LeraarBobGameRegistry,Routes=window.LeraarBobRoutes;
await Registry.ready();await LeraarBobPlayModes.ready();
const games=Object.freeze(Registry.list().flatMap(g=>{
 const mode=Registry.modes(g.id,{includeReferences:false}).find(m=>m.id==='classroom');
 return mode?[{id:mode.providerId,catalogId:g.id,title:g.title,subject:g.subject||g.subtitle,solo:g.route?.entry||g.href,classroom:mode.href,topics:mode.topics||[]}]:[];
}));
const root=new URL('../',location.href),params=new URLSearchParams(location.search),game=id=>games.find(g=>g.id===id||Registry.presentation(id)?.id===g.catalogId),origin=game(params.get('game'));
const moduleViews=['home','selection','session','rankings','students'];
const launchContext={world:params.get('world')||params.get('topic')||'',level:params.get('level')||'',returnTo:params.get('returnTo')||'',skills:params.has('skills')?params.get('skills'):undefined,count:params.get('count')||'',seconds:params.get('seconds')||'',participate:params.get('participate'),moduleView:moduleViews.includes(params.get('moduleView'))?params.get('moduleView'):'',activity:['learn','battle'].includes(params.get('activity'))?params.get('activity'):'battle',audience:['duo','class'].includes(params.get('audience'))?params.get('audience'):'class'};
const embedded=window.parent!==window;if(embedded)document.body.classList.add('hub-embedded');
const progress=document.createElement('output');progress.id='classFlowXP';progress.dataset.platformProgress='xp';progress.dataset.value='NaN';progress.hidden=true;document.querySelector('.hubTopbar').append(progress);
let account=null,data=null,epoch=0,request=0,view='overview',pendingLaunch=null,currentModule=null;
let learnGame=params.get('learning')||Registry.presentation(params.get('game'))?.id||'',pendingLearning=null;
const modules=new Map(),phases={setup:'Instellen',login:'Aanmelden',lobby:'Wachtkamer',question:'Ronde bezig',grading:'Nakijken',results:'Uitslag',finished:'Afgerond',closed:'Gestopt'};
function notice(text){$('notice').textContent=text||'';}
function date(value){const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleDateString('nl-BE',{day:'numeric',month:'short',year:'numeric'}):'';}
function login(){window.LeraarBobAccount?.open($('loginBtn'));}
function updateURL(replace=false){const url=new URL(location.href);if(currentModule)url.searchParams.set('game',currentModule.game.id);url.searchParams.set('view',view);if(view==='learn'&&learnGame)url.searchParams.set('learning',learnGame);if(currentModule){for(const key of ['world','level','skills','count','seconds','participate','moduleView','activity','audience']){const value=currentModule[key];if(value!==undefined&&value!==null&&value!=='')url.searchParams.set(key,String(value));else if(key==='skills'&&value==='')url.searchParams.set(key,'');else url.searchParams.delete(key);}url.searchParams.set('provider',currentModule.provider);if(currentModule.settings)url.searchParams.set('create','1');else url.searchParams.delete('create');if(currentModule.sessionId)url.searchParams.set('session',currentModule.sessionId);else url.searchParams.delete('session');if(currentModule.simulation)url.searchParams.set('simulation','1');else url.searchParams.delete('simulation');}url.searchParams.delete('code');if(replace||url.href===location.href)history.replaceState(history.state,'',url.href);else history.pushState({...history.state,hubView:view},'',url.href);}

function show(next,replace=false){
 if(!['overview','learn','rankings','session'].includes(next))return;
 if(next==='session'&&!currentModule){notice('Kies eerst een wereld voor je battle.');next='overview';}
 if(next==='session')notice('');
 view=next;document.body.dataset.view=next;document.body.dataset.playing=String(next==='session'&&!!currentModule?.playing);
 for(const id of ['overview','learn','rankings','session'])$(id+'View').hidden=id!==next;
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-current',b.dataset.view===next?'page':'false'));
 $('hubCrumb').textContent=next==='session'?currentModule.game.title:next==='rankings'?'Ranglijsten':next==='learn'?'Samen leren':'Overzicht';
 $('savedBattleNav').hidden=$('savedBattleMenu').hidden=!currentModule;updateURL(replace);
 if(next==='rankings')renderRankings();if(next==='learn')renderLearn();
}
async function rpc(action,payload={}){
 let timeout;const query=AxiomaAuth.client().rpc('axioma_class_battle_hub',{p_action:action,p_data:payload});
 let response;try{response=await Promise.race([query,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Geen verbinding. Gebruik Vernieuwen om opnieuw te proberen.')),15000);})]);}finally{clearTimeout(timeout);}
 if(response.error)throw Error(response.error.message||'Het battleoverzicht is tijdelijk niet bereikbaar.');
 return response.data;
}
async function load(){
 if(!account)return;const captured=epoch,serial=++request;
 try{const client=AxiomaAuth.client(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  const extra=client.functions?.invoke?client.functions.invoke('numbers-session',{body:{action:'overview',data:{}},signal:controller.signal}).then(r=>{if(r.error||r.data?.error)throw Error('Getallenwereld tijdelijk niet bereikbaar.');return r.data;}).finally(()=>clearTimeout(timer)):Promise.resolve(null);
  const [legacy,numbers]=await Promise.allSettled([rpc('overview',{class:account.role==='teacher'?$('rankingClass').value||null:null}),extra]);clearTimeout(timer);
  if(epoch!==captured||serial!==request)return;if(legacy.status==='rejected')throw legacy.reason;
  data=legacy.value;if(numbers.status==='fulfilled'&&numbers.value?.rooms)data.rooms=[...(data.rooms||[]),...numbers.value.rooms].sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).slice(0,60);
  render();notice(numbers.status==='rejected'&&view!=='session'?'De nieuwste Getallenwereld-sessies konden nog niet worden geladen. Gebruik Vernieuwen.':'');}
 catch(e){if(epoch===captured&&serial===request){notice('Je battleoverzicht kon niet worden geladen. '+e.message);$('rankingContent').textContent='De ranglijst is tijdelijk niet bereikbaar. Gebruik Vernieuwen om opnieuw te proberen.';}}
}
function render(){
 const teacher=account?.role==='teacher';$('loginBtn').hidden=!!account;$('joinHint').textContent=account?teacher?'Maak een battle of kies Simulatie.':'De code brengt je naar de juiste wereld.': 'Meld je aan en gebruik de code op het klasbord.';
 $('codeForm').querySelector('button[type=submit]').disabled=false;
 $('gamesHint').textContent=teacher?'Kies een wereld.':'Doe mee met je code.';
 $('gameCards').innerHTML=games.map(g=>{const s=data?.stats?.find(x=>x.game===g.id),mine=data?.leaderboards?.find(x=>x.game===g.id&&x.mine);
 return '<article class="panel gameCard" data-origin="'+(g.id===origin?.id)+'"><h3>'+g.title+'</h3><p>'+g.subject+'</p>'+(s?'<div class="gameStats"><div><strong>'+Number(s.points)+'<span> punten</span></strong><span>'+s.sessions+' battles</span></div><div><strong>'+(s.graded?Math.round(100*s.correct/s.graded)+'%':'—')+'</strong><span>juiste inzendingen'+(mine?' · plaats '+mine.place:'')+'</span></div></div>':'<p class="muted">'+(teacher?'':account?'Nog geen battle gespeeld.':'Meld je aan voor je resultaten.')+'</p>')+'<div class="cardActions"><button class="primary" data-launch="'+g.id+'">'+(teacher?'Battle maken':'Battle openen')+'</button>'+(teacher?'<button data-simulate="'+g.id+'">Simulatie</button>':'')+(g.id==='bewerkingen'?(teacher?'<a class="button" href="../games/bewerkingen-trainer/start.html?view=learn&audience=class">Klaslearn</a>':'')+'<a class="button" href="../games/bewerkingen-trainer/start.html?view=rankings">XP & resultaten</a>':'')+'</div></article>';
 }).join('');
 $('classFilter').hidden=!teacher;$('accountScope').textContent=account?(teacher?'Leerkrachtaccount · ranglijsten per klas':(account.alias||'Leerling')+' · '+(account.class_code||'je klas')):'';
 const stats=(data?.stats||[]).filter(s=>s.graded>=5).sort((a,b)=>b.correct/b.graded-a.correct/a.graded);
 $('insightTitle').textContent=teacher?'Test en begeleid je klas':'Je eigen battleoverzicht';
 $('insight').textContent=teacher?'Simulatie gebruikt virtuele leerlingen en telt niet mee.':stats.length?'Je hoogste percentage juiste inzendingen staat bij '+(game(stats[0].game)?.title||stats[0].game)+': '+Math.round(100*stats[0].correct/stats[0].graded)+'% over '+stats[0].graded+' inzendingen.':account?'Je resultaten groeien met je deelname. Na een afgeronde battle zie je je punten en plaats per wereld.':'Na het aanmelden vind je hier je deelname en resultaten per wereld.';
 const selected=$('rankingClass').value;$('rankingClass').replaceChildren(new Option('Kies een klas',''));for(const c of data?.classes||[])if(c)$('rankingClass').append(new Option(c,c));if([...$('rankingClass').options].some(o=>o.value===selected))$('rankingClass').value=selected;
 $('recentSection').hidden=!account;
 $('recentRooms').innerHTML=(data?.rooms||[]).filter(r=>game(r.game)).map(r=>'<article class="panel roomItem"><div><h3>'+game(r.game).title+(r.activity==='learn'?' · Learn':'')+' · '+(phases[r.phase]||r.phase)+'</h3><p>'+date(r.created_at)+' · '+r.participants+' leerlingen'+(r.active?' · code '+esc(r.code):' · '+r.points+' punten'+(r.graded?' · '+Math.round(100*r.correct/r.graded)+'% juiste inzendingen':''))+'</p></div>'+(r.active?'<button data-launch="'+r.game+'" data-code="'+esc(r.code)+'" data-provider="'+esc(r.provider||'legacy')+'" data-session="'+esc(r.id)+'">Hervatten →</button>':r.provider==='numbers'?'<a class="button" href="../games/bewerkingen-trainer/start.html?view=rankings">Resultaten →</a>':'<button data-ranking="'+r.game+'">Ranglijst →</button>')+'</article>').join('')||'<p class="empty">'+(account?'Je hebt nog geen groepsbattle gemaakt of meegespeeld.':'Meld je aan om je battles te zien.')+'</p>';
 renderRankings();renderLearn();
}
function learningWorlds(){
 const role=account?.role==='teacher'?'teacher':'student';
 return Registry.list().map(g=>({...g,modes:LeraarBobPlayModes.modes(g.id,{role}).filter(m=>m.purpose==='learn'&&(m.participation!=='solo'||m.id==='teacher')).sort((a,b)=>({learn:0,classlearn:1,teacher:2}[a.id]??3)-({learn:0,classlearn:1,teacher:2}[b.id]??3))})).filter(g=>g.modes.length);
}
function renderLearn(){
 const worlds=learningWorlds();learnGame=Registry.presentation(learnGame)?.id||worlds[0]?.id||'';
 const selected=Registry.presentation(learnGame),originWorld=Registry.presentation(params.get('game'));
 const choices=[...worlds];if(originWorld&&!choices.some(g=>g.id===originWorld.id))choices.unshift(originWorld);
 if(selected&&!choices.some(g=>g.id===selected.id))choices.unshift(selected);
 $('learnFilters').innerHTML=choices.map(g=>`<button type="button" data-learn-world="${esc(g.id)}" aria-pressed="${g.id===learnGame}">${esc(g.title)}</button>`).join('');
 const g=worlds.find(g=>g.id===learnGame);
 $('learnCards').innerHTML=g?g.modes.map(m=>`<article class="panel learnCard"><h2>${esc(m.title)}</h2><p>${esc(m.devices||'Elk een toestel')}</p><p class="muted">${esc(m.description||'Werk samen aan de opgaven.')}</p><div class="cardActions"><button class="primary" data-learn-game="${esc(g.id)}" data-learn-mode="${esc(m.id)}">${m.id==='teacher'?'Open borduitleg':'Instellen'} →</button>${account?.role==='teacher'&&g.id==='getallenwereld'&&m.id==='classlearn'?'<button data-learn-game="getallenwereld" data-learn-mode="classlearn" data-learn-simulation="1">Simulatie</button>':''}</div></article>`).join(''):`<article class="panel learnCard"><h2>${esc(selected?.title||'Samen leren')}</h2><p>Voor deze wereld is samen leren nog niet beschikbaar.</p><div class="cardActions">${selected&&Registry.modes(selected.id).some(m=>m.id==='solo')?'<button data-learn-solo="'+esc(selected.id)+'">Solo oefenen →</button>':''}${game(selected?.id)?'<button data-learn-battle="'+esc(game(selected.id).id)+'">Klasbattle →</button>':''}</div></article>`;
 $('learnScope').textContent=account?'Je stelt eerst je sessie in.':'Meld je aan om een gezamenlijke sessie te starten.';
}
function openLearning(gameId,modeId,simulation=false){
 const g=learningWorlds().find(g=>g.id===gameId),mode=g?.modes.find(m=>m.id===modeId);if(!mode)return;
 if(!account){pendingLearning={gameId,modeId,simulation:false};login();return;}
 if(simulation&&(account.role!=='teacher'||gameId!=='getallenwereld'||modeId!=='classlearn'))return;
 const same=origin?.catalogId===gameId,topic=same?launchContext.world:undefined;
 const destination=Registry.destination(gameId,modeId,{topicId:topic,returnTo:Routes.safeReturn(launchContext.returnTo,location.pathname+'?view=learn&game='+encodeURIComponent(gameId))});
 if(!destination)return;const url=new URL(destination);
 if(gameId==='getallenwereld'&&same&&launchContext.skills)url.searchParams.set('skills',launchContext.skills);
 if(simulation)url.searchParams.set('simulation','1');
 location.assign(url);
}
function renderRankings(){
 let link=$('numbersRankingLink');if(!link){link=document.createElement('a');link.id='numbersRankingLink';link.className='button';link.href='../games/bewerkingen-trainer/start.html?view=rankings';link.textContent='Getallenwereld · XP en recente resultaten';$('rankingScope').after(link);}link.hidden=$('rankingGame').value!=='bewerkingen';
 const g=game($('rankingGame').value)||games[0],rows=(data?.leaderboards||[]).filter(r=>r.game===g.id);
 $('rankingScope').textContent=data?.class?'Klas '+data.class+' · '+g.title+' · top 20 en je eigen plaats':account?.role==='teacher'?'Kies een klas om haar ranglijsten te bekijken.':'Ranglijst van je eigen klas · '+g.title;
 if(!account){$('rankingContent').innerHTML='<p class="empty">Meld je aan bij leraarBob om de ranglijsten van je klas te zien.</p><button type="button" data-login>Aanmelden</button>';return;}
 if(!rows.length){$('rankingContent').innerHTML='<p class="empty">'+(account.role==='teacher'&&!data?.class?'Kies hierboven een klas.':'Er zijn nog geen afgeronde battles in deze wereld voor deze klas.')+'</p>';return;}
 $('rankingContent').innerHTML='<div class="tableWrap"><table class="rankingTable"><thead><tr><th scope="col">Plaats</th><th scope="col">Leerling</th><th scope="col">Punten</th><th scope="col">Juist</th><th scope="col">Battles</th></tr></thead><tbody>'+rows.map(r=>'<tr'+(r.mine?' class="mine"':'')+'><td>'+r.place+'</td><th scope="row">'+esc(r.alias)+(r.mine?' (jij)':'')+'</th><td>'+r.points+'</td><td>'+(r.graded?Math.round(100*r.correct/r.graded)+'%':'—')+'</td><td>'+r.sessions+'</td></tr>').join('')+'</tbody></table></div>';
}
function moduleKey(g,provider,simulation,settings,topic,level){return g.id+(provider==='numbers'?':numbers':'')+':'+(simulation?'simulation':'live')+(settings?':settings:'+topic+':'+level:'');}
function launch(id,simulation=false,code='',context={}){
 const g=game(id);if(!g)return;
 if(!account){pendingLaunch={id,simulation,code,context};login();return;}
 if(!['student','teacher'].includes(account.role)){notice('Gebruik een leerling- of leerkrachtaccount voor Klasbattle.');return;}
 if(simulation&&account.role!=='teacher'){notice('Een leerkracht kan een simulatie starten.');return;}
 const provider=g.id==='bewerkingen'&&(context.provider==='numbers'||(!context.sessionId&&(!code||code.length===8)))?'numbers':'legacy';
 const topic=context.world||launchContext.world,level=context.level||launchContext.level,key=moduleKey(g,provider,simulation,!!context.create,topic,level);let module=modules.get(key);
 if(module&&context.sessionId&&module.sessionId!==context.sessionId){module.frame.remove();modules.delete(key);module=null;}
 if(module&&code){let savedCode=module.code;try{savedCode=(provider==='numbers'?module.frame.contentWindow.NumbersSpace?.snapshot()?.state:module.frame.contentWindow.LeraarBobClassroom?.snapshot())?.code||savedCode;}catch{}if(savedCode!==code){module.frame.remove();modules.delete(key);module=null;}}
 if(!module){
  const frame=document.createElement('iframe'),src=new URL(provider==='numbers'?'games/bewerkingen-trainer/start.html':g.classroom,root),contextValue=name=>Object.hasOwn(context,name)?context[name]:launchContext[name];
  src.searchParams.set('hub','1');src.searchParams.set('classFlow','1');if(topic)src.searchParams.set('world',topic);if(level)src.searchParams.set('level',level);if(context.create)src.searchParams.set('create','1');if(context.sessionId)src.searchParams.set('session',context.sessionId);if(launchContext.returnTo)src.searchParams.set('returnTo',Routes.safeReturn(launchContext.returnTo));if(simulation)src.searchParams.set('simulation','1');
  if(provider==='numbers'){src.searchParams.set('view',context.sessionId?'session':code?'home':'battle');for(const name of ['skills','count','seconds','participate','moduleView','activity','audience']){const value=contextValue(name);if(value!==undefined&&value!==null&&(value!==''||name==='skills'))src.searchParams.set(name,String(value));}if(!src.searchParams.has('audience'))src.searchParams.set('audience','class');if(!src.searchParams.has('activity'))src.searchParams.set('activity','battle');}
  if((provider==='numbers'?/^[A-Fa-f0-9]{8}$/:/^[A-Fa-f0-9]{6}$/).test(code)){src.searchParams.set('code',code);if(account.role==='student'&&!context.sessionId)src.searchParams.set('join','1');}
  frame.src=src.href;frame.className='battleModule';frame.title=(simulation?'Simulatie · ':'Klasbattle · ')+g.title;module={game:g,provider,simulation,code,frame,phase:'setup',playing:false,settings:!!context.create,sessionId:context.sessionId||'',world:topic||'',level:level||''};for(const name of ['skills','count','seconds','participate','moduleView','activity','audience'])module[name]=contextValue(name);modules.set(key,module);$('moduleHost').append(frame);frame.addEventListener('load',()=>syncFrameTheme(frame));
 }
 for(const m of modules.values())m.frame.hidden=m!==module;currentModule=module;progress.dataset.value=Number.isFinite(module.xp)?String(module.xp):'NaN';
 $('originGame').hidden=false;$('originGame').href=Routes.safeReturn(launchContext.returnTo,new URL(g.solo,root).href);$('originGame').textContent='Terug naar '+(Registry.current(new URL($('originGame').href,root).href)?.title||g.title)+' →';
 $('sessionWorld').textContent=g.title;$('sessionKind').textContent=module.simulation?'Leerkrachtsimulatie':'Klasbattle';$('simulationNote').hidden=!module.simulation;$('sessionPhase').textContent=phases[module.phase]||'Instellen';show('session',context.replace===true);
}
function rekey(module){const next=moduleKey(module.game,module.provider,module.simulation,module.settings,module.world,module.level);for(const [key,other]of modules){if(other===module)modules.delete(key);else if(key===next){other.frame.remove();modules.delete(key);}}modules.set(next,module);}

function syncFrameTheme(frame){try{frame.contentDocument.documentElement.dataset.mode=document.documentElement.dataset.mode||'light';frame.contentDocument.body.classList.toggle('portal-collapsed',document.body.classList.contains('topbar-collapsed'));}catch{}}
new MutationObserver(()=>{for(const m of modules.values())syncFrameTheme(m.frame);}).observe(document.body,{attributes:true,attributeFilter:['class']});
new MutationObserver(()=>{for(const m of modules.values())syncFrameTheme(m.frame);}).observe(document.documentElement,{attributes:true,attributeFilter:['data-mode']});
addEventListener('message',e=>{
 if(e.origin!==location.origin)return;const m=[...modules.values()].find(x=>x.frame.contentWindow===e.source),d=e.data;if(!m||d?.game!==m.game.id)return;
 if(d.type==='leraarbob-class-launch'){if(d.mode==='live'&&m===currentModule&&m.simulation&&account?.role==='teacher')launch(m.game.id,false,'',{provider:m.provider,create:true,world:m.world,level:m.level,skills:m.skills,count:m.count,seconds:m.seconds,participate:m.participate,activity:'battle',audience:'class',moduleView:'selection'});return;}
 if(d.type!=='leraarbob-class-status'||!Object.hasOwn(phases,d.phase))return;m.phase=d.phase;
 if(typeof d.sessionId==='string'&&d.sessionId.length<128)m.sessionId=d.sessionId;
 if(typeof d.world==='string'&&(m.game.topics.includes(d.world)||m.provider==='legacy'&&d.world==='mixed'))m.world=d.world;
 if(typeof d.level==='string'&&d.level.length<128)m.level=d.level;
 if(m.provider==='numbers'){
  if(moduleViews.includes(d.moduleView))m.moduleView=d.moduleView;if(['learn','battle'].includes(d.activity))m.activity=d.activity;if(['duo','class'].includes(d.audience))m.audience=d.audience;
  if(typeof d.skills==='string'&&d.skills.length<1024)m.skills=d.skills;if([5,10,20].includes(d.count))m.count=d.count;if([60,120,180,300].includes(d.seconds))m.seconds=d.seconds;if(typeof d.participate==='boolean')m.participate=d.participate?'1':'0';m.xp=Number.isFinite(d.xp)?d.xp:null;
 }
 if(typeof d.simulation==='boolean'&&account?.role==='teacher'&&m.simulation!==d.simulation){m.simulation=d.simulation;rekey(m);m.frame.title=(m.simulation?'Simulatie · ':'Klasbattle · ')+m.game.title;}
 m.playing=d.playing===true;
 if(m.settings&&['lobby','question','results','finished','closed'].includes(m.phase)){m.settings=false;rekey(m);}
 if(m===currentModule){$('sessionPhase').textContent=phases[m.phase];$('sessionKind').textContent=m.simulation?'Leerkrachtsimulatie':'Klasbattle';$('simulationNote').hidden=!m.simulation;progress.dataset.value=Number.isFinite(m.xp)&&!m.simulation?String(m.xp):'NaN';document.body.dataset.playing=String(m.playing);syncFrameTheme(m.frame);updateURL(true);}
 if(['finished','closed'].includes(m.phase)&&!m.simulation)load();
});

async function identity(next){
 if(account?.id===next?.id&&account?.role===next?.role){const changed=account?.alias!==next?.alias||account?.class_code!==next?.class_code;account=next;if(changed){render();load();}return;}epoch++;request++;account=next;data=null;
 for(const m of modules.values())m.frame.remove();modules.clear();currentModule=null;progress.dataset.value='NaN';render();show(['learn','rankings'].includes(params.get('view'))?params.get('view'):'overview',true);
 if(!account)return;if(!['student','teacher'].includes(account.role)){notice('Gebruik een leerling- of leerkrachtaccount voor Klasbattle.');return;}
 if(pendingLearning){const item=pendingLearning;pendingLearning=null;openLearning(item.gameId,item.modeId,item.simulation);return;}
 await load();
 if(pendingLaunch){const item=pendingLaunch;pendingLaunch=null;launch(item.id,item.simulation,item.code,item.context);}
 else if(['session','create'].includes(params.get('view'))&&origin)launch(origin.id,params.get('simulation')==='1',params.get('code')||'',{...launchContext,provider:params.get('provider')||'',create:params.get('view')==='create'||params.get('create')==='1',sessionId:params.get('session')||''});else if(/^[A-Fa-f0-9]{8}$/.test(params.get('code')||'')){launch('bewerkingen',false,params.get('code'));}else if(params.get('code')&&account.role==='student'){const ownerEpoch=epoch;const resolved=await rpc('code',{code:params.get('code')});if(ownerEpoch===epoch)launch(resolved.game,false,resolved.code);}else if(['learn','rankings'].includes(params.get('view')))show(params.get('view'));
}
$('codeForm').onsubmit=async e=>{e.preventDefault();if(!account){login();return;}if(/^[A-Fa-f0-9]{8}$/.test($('battleCode').value.trim())){launch('bewerkingen',false,$('battleCode').value.trim().toUpperCase());return;}if(account.role!=='student'){notice('Gebruik een leerlingaccount voor deze oudere battlecode.');return;}const button=e.submitter;button.disabled=true;const captured=epoch;try{const resolved=await rpc('code',{code:$('battleCode').value.trim().toUpperCase()});if(epoch===captured)launch(resolved.game,false,resolved.code);}catch(err){if(epoch===captured)notice(err.message);}finally{button.disabled=false;}};
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.view)show(b.dataset.view);if(b.dataset.learnWorld){learnGame=b.dataset.learnWorld;renderLearn();updateURL(true);}if(b.dataset.learnBattle)launch(b.dataset.learnBattle,false,'',{create:true});if(b.dataset.learnSolo){const dest=Registry.destination(b.dataset.learnSolo,'solo',{returnTo:location.pathname+location.search});if(dest)location.assign(dest);}if(b.dataset.learnMode)openLearning(b.dataset.learnGame,b.dataset.learnMode,b.dataset.learnSimulation==='1');if(b.dataset.launch)launch(b.dataset.launch,false,b.dataset.code||'',{create:!b.dataset.code,sessionId:b.dataset.session||'',provider:b.dataset.provider||''});if(b.dataset.simulate)launch(b.dataset.simulate,true,'',{create:true});if(b.dataset.ranking){$('rankingGame').value=b.dataset.ranking;show('rankings');}if(b.hasAttribute('data-login'))login();});
$('gameHomeBtn').onclick=()=>show('overview');$('refreshBtn').onclick=$('refreshRankings').onclick=load;$('rankingGame').onchange=renderRankings;$('rankingClass').onchange=load;$('loginBtn').onclick=login;
for(const g of games)$('rankingGame').append(new Option(g.title,g.id));if(origin){$('rankingGame').value=origin.id;$('originGame').hidden=false;$('originGame').href=Routes.safeReturn(launchContext.returnTo,new URL(origin.solo,root).href);$('originGame').textContent='Terug naar '+(Registry.current(new URL($('originGame').href,root).href)?.title||origin.title)+' →';}
render();show(['learn','rankings'].includes(params.get('view'))?params.get('view'):'overview',true);
AxiomaAuth.onChange(({account:a,pending})=>identity(pending?null:a));AxiomaAuth.ready().then(({account:a})=>identity(a)).catch(e=>notice(e.message));
addEventListener('popstate',()=>{const p=new URLSearchParams(location.search),v=p.get('view');if(v==='learn')learnGame=Registry.presentation(p.get('learning')||p.get('game'))?.id||learnGame;if(['session','create'].includes(v)&&game(p.get('game')))launch(p.get('game'),p.get('simulation')==='1',p.get('code')||'',{provider:p.get('provider')||'',moduleView:moduleViews.includes(p.get('moduleView'))?p.get('moduleView'):'',activity:['learn','battle'].includes(p.get('activity'))?p.get('activity'):'battle',audience:['duo','class'].includes(p.get('audience'))?p.get('audience'):'class',skills:p.has('skills')?p.get('skills'):undefined,count:p.get('count')||'',seconds:p.get('seconds')||'',participate:p.get('participate'),sessionId:p.get('session')||'',create:v==='create'||p.get('create')==='1',world:p.get('world')||p.get('topic')||'',level:p.get('level')||'',replace:true});else show(['learn','rankings'].includes(v)?v:'overview',true);});
window.LeraarBobClassHub=Object.freeze({games,show,launch,snapshot:()=>({view,account:account?.role||null,game:currentModule?.game.id||null,simulation:currentModule?.simulation||false,modules:modules.size})});
})().catch(error=>{document.getElementById('notice').textContent=error.message||'Klasbattle kon niet laden.';});
