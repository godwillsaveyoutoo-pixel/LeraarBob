(()=>{
'use strict';
const L=GetallenLessons,C=BewerkingenCore,$=id=>document.getElementById(id),KEY='leraarbob.getallenwereld.v1';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const math=t=>katex.renderToString(t,{throwOnError:false,strict:'ignore',output:'htmlAndMathml'});
const seed=()=>crypto.getRandomValues(new Uint32Array(1))[0];
const R=window.LeraarBobRoutes;let router=null;
let state={version:1,screen:'home',theme:'machten',selected:'machten-betekenis',entries:{},runs:{},mission:null},message='',error=false,ok=false,activeSlot=0,wrongRule='',helpTask=null,helpStep=0,previous='home';
function context(){return {gameId:'getallenwereld',world:'getallen',topic:state.theme,level:state.selected,runLevel:state.mission?.id||'',screen:state.screen,returnTo:R?.read(location.href).returnTo||state.navigation?.returnTo||''};}
function sync(){router?.update(context());}
// Links are rendered before history is updated; derive the return target from live selection.
function returnPath(){return R.href(location.href,{...context(),returnTo:''});}
function providerPath(path,{topic=state.theme,mode='solo',worksheet=false}={}){
 const url=new URL(path,R.root);url.searchParams.set('mode',mode);if(worksheet)url.searchParams.set('intent','worksheet');
 return R.href(url.href,{gameId:'getallenwereld',world:topic,topic,screen:'setup',returnTo:returnPath()});
}
function scientificLink(){return providerPath('games/bewerkingen-trainer/',{topic:'wetenschappelijk'});}
function worldLinks(){
 const registry=window.LeraarBobGameRegistry;if(!registry)return '';
 const role=AxiomaGame.account?.role||'guest';
 const entries=[...registry.modes('getallenwereld',{topicId:state.theme}).filter(e=>e.id!=='solo'&&(e.id!=='teacher'||role==='teacher')),...registry.worksheets('getallenwereld').map(e=>({...e,worksheet:true}))];
 return entries.map(e=>{
  const key=e.worksheet?'worksheet':e.id;
  let destination=e.worksheet?providerPath(e.href,{worksheet:true}):registry.destination('getallenwereld',e.id,{topicId:state.theme,hub:e.id==='classroom',returnTo:returnPath()});
  if(!destination)return '';
  if(!e.worksheet&&e.id!=='classroom')destination=providerPath(destination,{mode:e.id==='local'?'duo':e.id==='teacher'?'teacher':'solo'});
  const label=e.worksheet?'Oefenblad maken':e.title||e.label||({local:'Duo-battle',classroom:'Klasbattle'})[e.id];
  const detail=e.worksheet?'Met verbetersleutel':e.devices||({local:'Met twee op één toestel',classroom:'Met een code op eigen toestellen'})[e.id]||e.description||'';
  return '<a data-world-link data-world-mode="'+esc(key)+'" data-platform-route href="'+esc(destination)+'">'+esc(label)+'<small>'+esc(detail)+'</small></a>';
 }).join('');
}
function worldActions(){return '<nav class="world-actions" aria-label="Manieren van oefenen">'+worldLinks()+'</nav>';}
function updateReferences(){const menu=$('trainerMenu');menu.querySelectorAll('a[data-world-link],a[data-scientific-link]').forEach(a=>a.remove());menu.insertAdjacentHTML('beforeend','<a data-scientific-link data-platform-route href="'+esc(scientificLink())+'">Wetenschappelijke schrijfwijze</a>'+worldLinks());}
function task(){const m=state.mission;return m?L.make(m.id,(m.seed+Math.imul(m.index+1,2654435761))>>>0,m.index,m.edition||1):null;}
function restoredRun(m){
 if(!m||!L.stop(m.id)||!Number.isInteger(m.seed)||m.seed<0||m.seed>4294967295||!Number.isInteger(m.index)||m.index<0||m.index>=6)return null;
 let edition=m.edition===2?2:1;
 const untouched=!m.done&&(m.stage<0||m.stage===0)&&!(m.values||[]).some(v=>v);
 if(untouched&&['wortels-factor','wortels-vereenvoudigen'].includes(m.id))edition=2;
 const t=L.make(m.id,(m.seed+Math.imul(m.index+1,2654435761))>>>0,m.index,edition);
 if(!Number.isInteger(m.stage)||m.stage< -1||m.stage>=t.stages.length)return null;
 const count=m.stage<0?0:t.stages[m.stage].slots.length,values=Array.from({length:count},(_,i)=>/^[-]?\d{0,7}$/.test(m.values?.[i]||'')?m.values[i]||'':'');
 return{id:m.id,edition,seed:m.seed,index:m.index,stage:m.stage,done:m.done===true&&m.stage===t.stages.length-1&&L.checkStage(t,m.stage,values).ok,assisted:m.assisted===true,attempts:Math.max(0,Math.min(999,Number(m.attempts)||0)),values};
}
function restore(){
 try{
  const saved=JSON.parse(AxiomaGame.storage.getItem(KEY)||'null');
  if(saved?.version!==1)return;
  if(saved.navigation&&typeof saved.navigation==='object')state.navigation={...saved.navigation,returnTo:saved.navigation.returnTo?R?.safeReturn(saved.navigation.returnTo):''};
  if(L.theme(saved.theme))state.theme=saved.theme;if(L.stop(saved.selected))state.selected=saved.selected;
  for(const s of L.STOPS){const e=saved.entries?.[s.id];if(!e)continue;state.entries[s.id]={done:Array.isArray(e.done)?[...new Set(e.done.filter(x=>/^\d+:\d$/.test(x)))].slice(-6):[],independent:Array.isArray(e.independent)?[...new Set(e.independent.filter(x=>/^\d+:\d$/.test(x)))].slice(-6):[]};}
  for(const s of L.STOPS){const run=restoredRun(saved.runs?.[s.id]);if(run&&run.id===s.id)state.runs[s.id]=run;}
  state.mission=restoredRun(saved.mission);if(state.mission)state.runs[state.mission.id]=state.mission;
  if(['home','chapter','play','summary'].includes(saved.screen)&&(!['play','summary'].includes(saved.screen)||state.mission))state.screen=saved.screen;
  if(['help','menu'].includes(saved.screen)&&state.mission)state.screen='play';
 }catch{message='De vorige oefening kon niet worden geopend. Je kunt opnieuw beginnen.';}
}
function persist(){
 if(!AxiomaGame.active)return;
 if(state.mission)state.runs[state.mission.id]=state.mission;
 const done=L.STOPS.filter(s=>state.entries[s.id]?.done.length===L.GOAL).map(s=>s.id);
 AxiomaGame.storage.setItem(KEY,JSON.stringify(state));
 AxiomaGame.report(done,L.STOPS.length,state.selected);AxiomaGame.emit(done,L.STOPS.length,state.selected);
 const badge=$('getallenProgress');badge.dataset.value=String(done.length);badge.dataset.total=String(L.STOPS.length);
}
const completed=theme=>L.STOPS.filter(s=>(!theme||s.theme===theme)&&state.entries[s.id]?.done.length===6).length;
function status(id){const e=state.entries[id],n=e?.done.length||0,run=state.runs[id];return n===6?(e.independent.length===6?'Zelfstandig afgerond':'Afgerond · nog zelfstandig oefenen'):n?n+'/6 opgelost':run?'Bezig · '+(run.index+1)+'/6':'Nog te ontdekken';}
function resetMessage(){message='';error=false;ok=false;wrongRule='';}
function go(screen){resetMessage();state.screen=screen;render();persist();sync();}
function heading(title,copy,meta){return `<div class="heading"><div><h1>${esc(title)}</h1><p>${esc(copy)}</p></div><div class="meta">${meta}</div></div>`;}
function footer(){return `<footer class="foot"><span>Rekenregels herkennen · uitwerkingen bouwen</span><span>Je werk wordt bewaard</span></footer>`;}
function home(){return `<section class="screen home">${heading('Getallenwereld','Machten, wortels en wetenschappelijke schrijfwijze.',completed()+'/'+L.STOPS.length+' onderdelen<small>Rekenregels afgerond</small>')}
 <div class="themes">${L.THEMES.map((t,i)=>`<button class="theme" data-theme="${t.id}"><span class="eyebrow">Hoofdstuk 0${i+1} · ${t.stops.length} onderdelen</span><span class="theme-title">${esc(t.title)} <span aria-hidden="true">↗</span></span><p>${esc(t.intro)}</p><span class="example">${math(t.example)}</span><span class="theme-bottom"><span>${completed(t.id)}/${t.stops.length} afgerond</span><strong>Bekijk de onderdelen →</strong></span></button>`).join('')}
 <a class="theme" data-topic="wetenschappelijk" data-platform-route href="${esc(scientificLink())}"><span class="eyebrow">Hoofdstuk 03</span><span class="theme-title">Wetenschappelijke schrijfwijze <span aria-hidden="true">↗</span></span><p>Grote en kleine getallen schrijven met machten van tien.</p><span class="example">${math('170\\,000=1{,}7\\cdot10^5')}</span><span class="theme-bottom"><span>Drie moeilijkheidsgraden</span><strong>Kies je reeks →</strong></span></a></div>
 ${worldActions()}<div class="dock"><div><p>${state.mission?'Je oefening staat klaar.':'Kies een hoofdstuk en daarna je onderdeel.'}</p><small>${state.mission?esc(L.stop(state.mission.id).title)+' · opgave '+(state.mission.index+1)+'/6':'Start wanneer je klaar bent.'}</small></div>${state.mission?'<button class="primary" data-action="resume">Oefening hervatten →</button>':'<button class="primary" data-theme="machten">Naar machten →</button>'}</div>${footer()}</section>`;}
function chapter(){
 const t=L.theme(state.theme),items=L.STOPS.filter(s=>s.theme===t.id),sel=L.stop(state.selected)?.theme===t.id?L.stop(state.selected):items[0];state.selected=sel.id;
 const continuing=state.runs[sel.id]&&!state.runs[sel.id].done;
 return `<section class="screen chapter">${heading(t.title,t.intro,completed(t.id)+'/'+items.length+' afgerond<small>Getallenwereld</small>')}<div class="stops" data-count="${items.length}">${items.map(s=>`<button class="stop" data-id="${s.id}" data-stop="${s.id}" data-status="${state.entries[s.id]?.done.length===6?'done':state.entries[s.id]?.done.length||state.mission?.id===s.id?'started':'new'}" ${sel.id===s.id?'aria-current="step"':''}><span class="stop-head"><span class="number">0${s.number}</span><strong><span class="full">${esc(s.title)}</span><span class="short">${esc(s.short)}</span></strong></span><span class="example">${math(s.example)}</span><span class="stop-status"><i class="dot" aria-hidden="true"></i>${esc(status(s.id))}</span></button>`).join('')}</div>${worldActions()}<div class="dock"><div><p><strong>0${sel.number} · ${esc(sel.title)}</strong></p><small>${esc(sel.intro)}</small></div><button class="primary" data-action="start">${continuing?'Verder oefenen':'Start dit onderdeel'} →</button></div>${footer()}</section>`;
}
function playHead(t,help=false){const s=L.stop(t.id),m=state.mission;return `<div class="playhead"><button data-action="chapter">← ${esc(L.theme(s.theme).title)}</button><div><span class="eyebrow">${help?'Hulp · ander voorbeeld':'Bouw de uitwerking'}</span><h1><span class="full">${esc(s.title)}</span><span class="short">${esc(s.short)}</span></h1></div><div class="counter">${help?'Stap '+(helpStep+1)+'/'+(helpTask.stages.length+1):'Opgave '+(m.index+1)+'/6'}${!help?`<div class="progress" aria-hidden="true">${Array.from({length:6},(_,i)=>`<i class="${i<m.index||i===m.index&&m.done?'done':i===m.index?'current':''}"></i>`).join('')}</div>`:''}</div></div>`;}
function renderedStage(s,values,active=-1){return math(L.fill(s.template,values.map((v,i)=>v&&v!=='-'?'{'+esc(v)+'}':i===active?'\\color{#c46713}{\\boxed{\\phantom{00}}}':'\\boxed{\\phantom{00}}')));}
function question(t){return `<span class="eyebrow">${state.screen==='help'?'Ander voorbeeld':'De opgave'}</span><div class="question">${math(t.tex)}</div><p class="condition">${esc(t.condition)}</p>${t.note?`<p class="note">${esc(t.note)}</p>`:''}`;}
function play(){
 const t=task(),m=state.mission,s=t.stages[m.stage];
 const left=question(t)+(s?`<div class="working"><span class="phase">${m.done?'Jouw uitwerking':'Stap '+(m.stage+1)+'/'+t.stages.length}</span><div class="formula">${m.done&&s.expression&&s.accept!=='square-factor'?math(t.answerTex):renderedStage(s,m.values,activeSlot)}</div>${m.done?'<p class="answer-seal">✓ Juist uitgewerkt</p>':m.stage>0?`<div class="trail">${math(L.fill(t.stages[m.stage-1].template,t.stages[m.stage-1].slots.map(s=>s.answer)))}</div>`:''}</div>`:'');
 let right;
 if(m.done)right=`<p class="eyebrow">Opgelost</p><p class="help-explanation">${esc(s.explanation)}</p><p class="note">${m.assisted?'Je gebruikte hulp. Een volgende opgave kun je zelfstandig proberen.':'Je hebt deze opgave zelfstandig uitgewerkt.'}</p>`;
 else if(m.stage<0)right=`<p class="prompt">${esc(t.rulePrompt||'Welke rekenregel gebruik je eerst?')}</p><div class="rule-options">${t.choices.map(c=>`<button class="rule-choice ${wrongRule===c.id?'wrong':''}" data-rule="${c.id}"><span>${esc(c.label)}</span><span class="rule-math">${math(c.tex)}</span></button>`).join('')}</div>`;
 else right=`<p class="prompt">${esc(s.prompt)}</p><div class="slots">${s.slots.map((x,i)=>`<button class="slot" data-slot="${i}" aria-pressed="${activeSlot===i}" aria-label="${esc(x.label)}: ${esc(m.values[i]||'leeg')}"><span>${esc(x.label)}</span><b>${esc(m.values[i]||'?')}</b></button>`).join('')}</div>${s.squareChoices&&activeSlot===0?`<div class="square-picks" aria-label="Kies een kwadraatfactor">${s.squareChoices.map(k=>`<button data-square="${k}" aria-label="${k}, het kwadraat van ${Math.sqrt(k)}">${math(k+'='+Math.sqrt(k)+'^2')}</button>`).join('')}</div>`:`<div class="keypad" aria-label="Getal invoeren">${['1','2','3','4','5','6','7','8','9','−','0','⌫'].map(k=>`<button data-key="${k}" ${k==='⌫'?'aria-label="Laatste teken wissen" class="erase"':k==='−'?'aria-label="Minteken"':''}>${k}</button>`).join('')}</div>`}`;
 return `<section class="screen play">${playHead(t)}<div class="workbench"><div class="work-left">${left}</div><div class="work-right">${right}</div></div><footer class="workfoot"><p class="feedback" role="status" data-error="${error}" data-ok="${ok}">${esc(message||(m.stage<0?'Kies de regel die past bij de bewerking.':m.done?'Klaar voor de volgende opgave.':'Tik een vak aan en vul het getal in. Je kunt ook je toetsenbord gebruiken.'))}</p><button data-action="undo" ${m.stage<0?'disabled':''}>↶ Vorige stap</button><button data-action="help">Hulp</button>${m.done?'<button class="primary" data-action="next">'+(m.index===5?'Bekijk resultaat':'Volgende opgave')+' →</button>':m.stage>=0?'<button class="primary" data-action="check">Controleer →</button>':''}</footer></section>`;
}
function start(){
 const parked=state.runs[state.selected];if(parked&&!parked.done){state.mission=parked;activeSlot=0;go('play');return;}
 if(state.mission?.id===state.selected&&!state.mission.done){go('play');return;}
 let fresh;for(let i=0;i<500;i++){fresh=seed();const expressions=Array.from({length:6},(_,index)=>L.make(state.selected,(fresh+Math.imul(index+1,2654435761))>>>0,index).expression);if(new Set(expressions).size===6)break;}
 state.mission={id:state.selected,edition:2,seed:fresh,index:0,stage:-1,values:[],done:false,assisted:false,attempts:0};activeSlot=0;go('play');
}
function chooseRule(id){
 const m=state.mission,t=task();if(!m||m.stage!==-1)return;
 if(id!==t.correct){m.attempts++;wrongRule=id;error=true;message='Deze regel past niet bij de eerste bewerking. Kijk naar het grondtal, de haakjes en het bewerkingsteken.';}
 else{resetMessage();m.stage=0;m.values=t.stages[0].slots.map(()=>'');activeSlot=0;message='Juist gekozen. Bouw nu de uitwerking.';ok=true;}
 render();persist();
}
function key(k){
 const m=state.mission;if(!m||m.done||m.stage<0||state.screen!=='play')return;
 let v=m.values[activeSlot]||'';if(k==='⌫')v=v.slice(0,-1);else if(k==='−')v=v.startsWith('-')?v.slice(1):'-'+v;else if(/^\d$/.test(k)&&v.replace('-','').length<7)v=(v==='0'?k:v==='-0'?'-'+k:v+k);
 m.values[activeSlot]=v;resetMessage();render();persist();
}
function check(){
 const m=state.mission;if(!m||m.done||m.stage<0)return;const t=task(),result=L.checkStage(t,m.stage,m.values);message=result.message;error=!result.ok;ok=result.ok;
 if(!result.ok)m.attempts++;
 else if(m.stage===t.stages.length-1){
  m.done=true;const e=state.entries[m.id]||{done:[],independent:[]},evidence=m.seed+':'+m.index;
  if(!e.done.includes(evidence))e.done=[...e.done,evidence].slice(-6);
  if(!m.assisted&&!e.independent.includes(evidence))e.independent=[...e.independent,evidence].slice(-6);
  state.entries[m.id]=e;
 }else{m.stage++;m.values=t.stages[m.stage].slots.map(()=>'');activeSlot=0;message='Juist. '+t.stages[m.stage].prompt;}
 render();persist();
}
function next(){
 const m=state.mission;if(!m?.done)return;
 if(m.index===5){go('summary');return;}
 m.index++;m.edition=2;m.stage=-1;m.values=[];m.done=false;m.assisted=false;m.attempts=0;activeSlot=0;go('play');
}
function undo(){
 const m=state.mission;if(!m||m.stage<0)return;
 // Evidence reflects a solved question even when its displayed steps are revisited.
 m.done=false;m.stage--;m.values=m.stage<0?[]:task().stages[m.stage].slots.map(()=> '');activeSlot=0;resetMessage();render();persist();
}
function openHelp(){
 if(!state.mission)return;state.mission.assisted=true;const original=task();let candidate;
 for(let i=0;i<100;i++){candidate=L.make(original.id,seed(),original.index,state.mission.edition||1);if(candidate.expression!==original.expression)break;}
 helpTask=candidate;helpStep=0;go('help');
}
function help(){
 const t=helpTask,s=t.stages[helpStep-1],r=t.choices.find(c=>c.id===t.correct);
 return `<section class="screen help">${playHead(t,true)}<div class="workbench"><div class="work-left">${question(t)}<div class="working"><span class="phase">${s?'Uitwerkingsstap '+helpStep:'De passende rekenregel'}</span><div class="formula">${s?renderedStage(s,s.slots.map(x=>x.answer)):math(r.tex)}</div></div></div><div class="work-right"><span class="help-label">HULP · KIJK HOE DE REGEL WERKT</span><p class="help-explanation">${esc(s?s.explanation:r.label+'. '+L.stop(t.id).intro)}</p><p class="note">Dit is een ander voorbeeld. Je eigen opgave blijft bewaard.</p></div></div><footer class="workfoot"><p class="feedback" role="status">${s?esc(s.prompt):'Herken eerst de bewerking. Kies daarna de rekenregel.'}</p><button data-action="help-prev" ${helpStep===0?'disabled':''}>← Terug</button><button data-action="help-return">Mijn opgave</button><button class="primary" data-action="help-next">${helpStep<t.stages.length?'Volgende stap →':'Zelf proberen →'}</button></footer></section>`;
}
function summary(){
 const m=state.mission,s=L.stop(m.id),e=state.entries[m.id],n=e?.independent.length||0;
 return `<section class="screen summary">${heading(L.theme(s.theme).title,'Onderdeel 0'+s.number+' · '+s.title,'6/6 uitgewerkt<small>Getallenwereld</small>')}<div class="summary-body"><div class="summary-seal" aria-hidden="true">✓</div><h2>Je hebt dit onderdeel uitgewerkt.</h2><p>${esc(s.intro)}</p><p><strong>${n}/6 verschillende opgaven zelfstandig opgelost.</strong><br>${n<6?'Oefen gerust nog eens: de vragen veranderen, de rekenregel blijft dezelfde.':'Je hebt de rekenregel op zes verschillende opgaven toegepast.'}</p></div><div class="dock"><button data-action="chapter">Naar de onderdelen</button><button data-action="again">Nog een reeks</button><button class="primary" data-action="next-stop">Volgend onderdeel →</button></div></section>`;
}
function menu(){return `<section class="screen menu">${heading('Getallenwereld','Kies je hoofdstuk of speelvorm.',completed()+'/'+L.STOPS.length+' onderdelen<small>Rekenregels afgerond</small>')}<div class="menu-grid"><section class="menu-group"><h2>Hoofdstukken</h2><div class="menu-links"><button data-action="home">Getallenwereld<small>Alle hoofdstukken</small></button><button data-action="resume" class="primary" ${!state.mission?'disabled':''}>Oefening hervatten<small>${state.mission?esc(L.stop(state.mission.id).title):'Start eerst een onderdeel'}</small></button><button data-theme="machten">Machten<small>${L.theme('machten').stops.length} onderdelen</small></button><button data-theme="wortels">Vierkantswortels<small>${L.theme('wortels').stops.length} onderdelen</small></button><a data-platform-route href="${esc(scientificLink())}">Wetenschappelijke schrijfwijze<small>Drie moeilijkheidsgraden</small></a><button data-action="help" ${!state.mission?'disabled':''}>Hulp bij mijn opgave<small>Een ander voorbeeld</small></button></div></section><section class="menu-group"><h2>Spelen en oefenbladen</h2><div class="menu-links">${worldLinks()}</div></section></div><div class="dock"><div><small>Je opgave en uitwerking blijven bewaard.</small></div><button data-action="menu-close">Menu sluiten →</button></div></section>`;}
function render(){
 const focus=document.activeElement&&$('app').contains(document.activeElement);
 document.body.dataset.screen=state.screen;$('menuBtn').setAttribute('aria-expanded',String(state.screen==='menu'));$('menuBtn').innerHTML=state.screen==='menu'?'× <span>Sluiten</span>':'☰ <span>Menu</span>';
 $('crumbChapter').textContent=['play','summary','help'].includes(state.screen)&&state.mission?L.theme(L.stop(state.mission.id).theme).title:state.screen==='chapter'?L.theme(state.theme).title:'';
 $('crumbChapter').hidden=!$('crumbChapter').textContent;
 $('crumbLevel').textContent=['play','summary','help'].includes(state.screen)&&state.mission?L.stop(state.mission.id).title:'';
 $('crumbLevel').hidden=!$('crumbLevel').textContent;
 $('resumeMenu').disabled=!state.mission;$('helpMenu').disabled=!state.mission;
 if(state.screen==='help'&&!helpTask)state.screen='play';
 $('app').innerHTML=({home,chapter,play,help,summary,menu}[state.screen]||home)();
 updateReferences();if(focus)$('app').focus({preventScroll:true});
}
async function fullscreen(){
 try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else throw Error();}
 catch{message='Volledig scherm is hier niet beschikbaar. Gebruik eventueel het menu van je browser.';error=true;if(state.screen==='play')render();else{const n=$('app').querySelector('.menu-notice,.dock small');if(n)n.textContent=message;}}
}
function actions(action){
 switch(action){
  case 'home':go('home');break;
  case 'chapter':if(state.mission&&['play','help','summary'].includes(state.screen)){state.theme=L.stop(state.mission.id).theme;state.selected=state.mission.id;}go('chapter');break;
  case 'resume':if(state.mission)go('play');break;
  case 'start':start();break;
  case 'check':check();break;
  case 'next':next();break;
  case 'undo':undo();break;
  case 'help':openHelp();break;
  case 'help-prev':helpStep=Math.max(0,helpStep-1);render();break;
  case 'help-next':if(helpStep<helpTask.stages.length){helpStep++;render();}else go('play');break;
  case 'help-return':go('play');break;
  case 'menu-close':go(previous==='help'?'play':previous);break;
  case 'again':state.mission=null;start();break;
  case 'next-stop':{const old=L.stop(state.mission.id),list=L.STOPS.filter(s=>s.theme===old.theme),next=list[old.number];if(next){state.theme=next.theme;state.selected=next.id;state.mission=null;start();}else go('home');break;}
  case 'profile':$('profileBtn').click();break;
  case 'theme':{const mode=document.documentElement.dataset.mode==='dark'?'light':'dark';document.documentElement.dataset.mode=mode;try{localStorage.setItem('axioma-mode',mode);}catch{}render();break;}
  case 'fullscreen':fullscreen();break;
 }
}
$('app').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled||!AxiomaGame.active)return;
 if(b.dataset.theme){state.theme=b.dataset.theme;state.selected=L.STOPS.find(s=>s.theme===state.theme).id;go('chapter');}
 else if(b.dataset.stop){state.selected=b.dataset.stop;resetMessage();render();persist();sync();}
 else if(b.dataset.rule)chooseRule(b.dataset.rule);
 else if(b.dataset.slot!==undefined){activeSlot=Number(b.dataset.slot);render();}
 else if(b.dataset.square){const m=state.mission,s=m&&task().stages[m.stage];if(state.screen==='play'&&!m.done&&s?.squareChoices?.includes(Number(b.dataset.square))){m.values[0]=b.dataset.square;activeSlot=1;resetMessage();render();persist();}}
 else if(b.dataset.key)key(b.dataset.key);
 else if(b.dataset.action)actions(b.dataset.action);
});
$('gameHomeBtn').onclick=()=>{if(AxiomaGame.active)go('home');};
$('profileBtn').onclick=()=>window.LeraarBobTopbar?.openAccount();
 $('trainerMenu').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled||!AxiomaGame.active)return;if(b.dataset.theme){state.theme=b.dataset.theme;state.selected=L.STOPS.find(s=>s.theme===state.theme).id;go('chapter');}else if(b.dataset.action)actions(b.dataset.action);});
 $('crumbChapter').onclick=()=>{if(AxiomaGame.active)actions('chapter');};
$('menuBtn').onclick=()=>{if(!AxiomaGame.active)return;if(state.screen==='menu')actions('menu-close');else{previous=state.screen;resetMessage();state.screen='menu';render();persist();sync();}};
document.addEventListener('keydown',e=>{
 if(!AxiomaGame.active||e.composedPath().some(n=>n.id==='axioma-game-status'||n.matches?.('input,textarea,select,[contenteditable=true]')||n.tagName==='DIALOG'&&n.open))return;
 if(e.key==='Escape'){if(state.screen==='menu')actions('menu-close');else if(state.screen==='help')go('play');return;}
 if(state.screen!=='play'||!state.mission||state.mission.done||state.mission.stage<0)return;
 if(/^\d$/.test(e.key)){e.preventDefault();key(e.key);}else if(e.key==='-'||e.key==='Backspace'){e.preventDefault();key(e.key==='-'?'−':'⌫');}
 else if(e.key==='Enter'&&e.target.tagName!=='BUTTON'){e.preventDefault();check();}
 else if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const len=task().stages[state.mission.stage].slots.length;activeSlot=(activeSlot+(e.key==='ArrowRight'?1:len-1))%len;render();}
});
window.GetallenWorld=Object.freeze({snapshot:()=>JSON.parse(JSON.stringify(state)),task:()=>task()&&JSON.parse(JSON.stringify(task()))});
restore();try{document.documentElement.dataset.mode=localStorage.getItem('axioma-mode')==='dark'?'dark':'light';}catch{}
const requested=new URLSearchParams(location.search),requestedTheme=requested.get('topic')||requested.get('thema')||(L.theme(requested.get('world'))?requested.get('world'):null),requestedStop=L.stop(requested.get('level')||requested.get('onderdeel'));
if(requestedStop){state.theme=requestedStop.theme;state.selected=requestedStop.id;state.screen='chapter';}else if(L.theme(requestedTheme)){state.theme=requestedTheme;state.selected=L.STOPS.find(s=>s.theme===state.theme).id;state.screen='chapter';}
const requestedScreen=requested.get('screen');
if(['home','chapter','menu'].includes(requestedScreen))state.screen=requestedScreen;
if(['play','summary'].includes(requestedScreen)){const parked=state.runs[requested.get('activeLevel')||requestedStop?.id||state.mission?.id];if(parked){state.mission=parked;state.screen=requestedScreen;}else state.screen='chapter';}
if(R)router=R.mount({gameId:'getallenwereld',enabled:()=>AxiomaGame.active,read:context,onChange:c=>{state.navigation=c;persist();},apply:c=>{const stop=L.stop(c.level);if(stop){state.selected=stop.id;state.theme=stop.theme;}else if(L.theme(c.topic))state.theme=c.topic;let screen=c.screen;if(['play','summary','help'].includes(screen)){const parked=state.runs[c.runLevel||c.level];if(parked)state.mission=parked;else screen='chapter';}if(screen==='help'&&!helpTask)screen='play';state.screen=['home','chapter','menu','play','help','summary'].includes(screen)?screen:'home';resetMessage();render();persist();}});
window.AxiomaAuth?.onChange(detail=>{if(detail.pending||!AxiomaGame.active||detail.account?.id!==AxiomaGame.account?.id){$('app').style.visibility='hidden';$('app').inert=true;$('getallenProgress').dataset.value='0';}});
window.LeraarBobGameRegistry?.ready().then(()=>{updateReferences();if(['menu','home','chapter'].includes(state.screen)&&AxiomaGame.active)render();});
render();persist();
})();
