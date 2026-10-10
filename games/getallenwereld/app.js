(()=>{
'use strict';
const L=GetallenLessons,C=BewerkingenCore,W=GetallenWorkshop,$=id=>document.getElementById(id),KEY='leraarbob.getallenwereld.v1';
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
 const focused=state.screen!=='home'&&L.stop(state.selected)?.theme===topic,skills=focused?L.practiceSkills(state.selected):[];
 if(skills.length)url.searchParams.set('skills',skills.join(','));
 if(focused){url.searchParams.set('lesson',state.selected);if(!skills.length)url.searchParams.set('scope','chapter');}
 return R.href(url.href,{gameId:'getallenwereld',world:topic,topic,screen:'setup',returnTo:returnPath()});
}
function worldLinks(){
 const registry=window.LeraarBobGameRegistry;if(!registry)return '';
 const series=registry.modes('getallenwereld',{topicId:state.theme}).find(m=>m.id==='series')?.href;
 const paper=registry.worksheets('getallenwereld')[0]?.href;if(!series||!paper)return '';
 const reportPath=view=>{const u=new URL(series,R.root);u.searchParams.set('view',view);return u.href;};
 const teacher=AxiomaGame.account?.role==='teacher';
 const actions=[
  ['series','Oefenen & samen',teacher?'Solo · duo · klas':'Solo · duo · meedoen',series],
  ['worksheet','Oefenblad','Met verbetersleutel',paper],
  ['rankings','Ranglijsten','XP en battlepunten',reportPath('rankings')],
  ...(teacher?[['students','Leerlingen','Resultaten per alias',reportPath('students')]]:[])
 ];
 return actions.map(([id,label,detail,path])=>'<a data-world-link data-world-mode="'+id+'" data-platform-route href="'+esc(providerPath(path,{worksheet:id==='worksheet'}))+'">'+label+'<small>'+detail+'</small></a>').join('');
}
function worldActions(){return '<nav class="world-actions" aria-label="Manieren van oefenen">'+worldLinks()+'</nav>';}
function updateReferences(){const menu=$('trainerMenu');menu.querySelectorAll('a[data-world-link],a[data-scientific-link],button[data-scientific-link]').forEach(a=>a.remove());menu.insertAdjacentHTML('beforeend','<button data-scientific-link data-theme="wetenschappelijk">Wetenschappelijke notatie</button>'+worldLinks());}
function task(){const m=state.mission;return m?L.make(m.id,(m.seed+Math.imul(m.index+1,2654435761))>>>0,m.index,m.edition||1):null;}
function restoredRun(m){
 if(!m||!L.stop(m.id)||!Number.isInteger(m.seed)||m.seed<0||m.seed>4294967295||!Number.isInteger(m.index)||m.index<0||m.index>=6)return null;
 let edition=m.edition===2?2:1;
 const untouched=!m.done&&(m.stage<0||m.stage===0)&&!(m.values||[]).some(v=>v);
 if(untouched&&['wortels-factor','wortels-vereenvoudigen'].includes(m.id))edition=2;
 const t=L.make(m.id,(m.seed+Math.imul(m.index+1,2654435761))>>>0,m.index,edition);
 if(!Number.isInteger(m.stage)||m.stage< -1||m.stage>=t.stages.length)return null;
 const count=m.stage<0?0:t.stages[m.stage].slots.length,values=Array.from({length:count},(_,i)=>/^[-]?\d{0,7}$/.test(m.values?.[i]||'')?m.values[i]||'':'');
 const pilot=m.id==='machten-product'&&m.pathVersion===W.VERSION&&((m.track==='basis'&&edition===1)||(m.track==='verdieping'&&edition===2));
 return{id:m.id,edition,seed:m.seed,index:m.index,stage:m.stage,done:m.done===true&&m.stage===t.stages.length-1&&L.checkStage(t,m.stage,values).ok,assisted:m.assisted===true,attempts:Math.max(0,Math.min(999,Number(m.attempts)||0)),values,...(pilot?{pathVersion:W.VERSION,track:m.track}:{})};
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
  if(['home','chapter','play','summary','help','menu'].includes(saved.screen)&&(!['play','summary','help'].includes(saved.screen)||state.mission))state.screen=saved.screen;
  const h=saved.help;
  if(state.mission&&h?.id===state.mission.id&&h.index===state.mission.index&&Number.isInteger(h.seed)&&h.seed>=0&&h.seed<=4294967295&&h.edition===(state.mission.edition||1)){
   const candidate=L.make(h.id,h.seed,h.index,h.edition);
   if(Number.isInteger(h.step)&&h.step>=0&&h.step<=candidate.stages.length){state.help={...h};helpTask=candidate;helpStep=h.step;}
  }
  previous=['home','chapter','play','help','summary'].includes(saved.menuFrom)?saved.menuFrom:'home';state.menuFrom=previous;
  if(state.screen==='help'&&(!helpTask||helpTask.id!==state.mission?.id||helpTask.index!==state.mission?.index))state.screen='play';
  if(state.screen==='summary'&&(!state.mission?.done||state.mission.index!==5))state.screen=state.mission?'play':'chapter';
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
function home(){return `<section class="screen home workshop-home">${heading('Getallenwereld','Machten, wortels en wetenschappelijke schrijfwijze.',completed()+'/'+L.STOPS.length+' onderdelen<small>Rekenregels afgerond</small>')}
 <div class="themes">${L.THEMES.map((t,i)=>`<button class="theme" data-theme="${t.id}" data-topic="${t.id}"><span class="eyebrow">Hoofdstuk 0${i+1} · ${t.stops.length} onderdelen</span><span class="theme-title">${esc(t.title)} <span aria-hidden="true">↗</span></span><p>${esc(t.intro)}</p><span class="example">${math(t.example)}</span><span class="theme-bottom"><span>${completed(t.id)}/${t.stops.length} afgerond</span><strong>Bekijk de onderdelen →</strong></span></button>`).join('')}
</div>
 ${worldActions()}<div class="dock"><div><p>${state.mission?'Je oefening staat klaar.':'Kies een hoofdstuk en daarna je onderdeel.'}</p><small>${state.mission?esc(L.stop(state.mission.id).title)+' · opgave '+(state.mission.index+1)+'/6':'Start wanneer je klaar bent.'}</small></div>${state.mission?'<button class="primary" data-action="resume">Oefening hervatten →</button>':'<button class="primary" data-theme="machten">Naar machten →</button>'}</div>${footer()}</section>`;}
function chapter(){
 const t=L.theme(state.theme),items=L.STOPS.filter(s=>s.theme===t.id),sel=L.stop(state.selected)?.theme===t.id?L.stop(state.selected):items[0];state.selected=sel.id;
 return W.chapter({lessons:L,selected:sel.id,entries:state.entries,runs:state.runs,math,status,links:worldLinks()});
}
function playHead(t,help=false){const s=L.stop(t.id),m=state.mission;return `<div class="playhead"><button data-action="chapter">← ${esc(L.theme(s.theme).title)}</button><div><span class="eyebrow">${help?'Hulp · ander voorbeeld':'Bouw de uitwerking'}</span><h1><span class="full">${esc(s.title)}</span><span class="short">${esc(s.short)}</span></h1></div><div class="counter">${help?'Stap '+(helpStep+1)+'/'+(helpTask.stages.length+1):'Opgave '+(m.index+1)+'/6'}${!help?`<div class="progress" aria-hidden="true">${Array.from({length:6},(_,i)=>`<i class="${i<m.index||i===m.index&&m.done?'done':i===m.index?'current':''}"></i>`).join('')}</div>`:''}</div></div>`;}
function renderedStage(s,values,active=-1){return math(L.fill(s.template,values.map((v,i)=>v&&v!=='-'?'{'+esc(v)+'}':i===active?'\\color{#c46713}{\\boxed{\\phantom{00}}}':'\\boxed{\\phantom{00}}')));}
function question(t){return `<span class="eyebrow">${state.screen==='help'?'Ander voorbeeld':'De opgave'}</span><div class="question">${math(t.tex)}</div><p class="condition">${esc(t.condition)}</p>${t.note?`<p class="note">${esc(t.note)}</p>`:''}`;}
function play(){
 const t=task(),m=state.mission,s=t.stages[m.stage];
 if(s)activeSlot=Math.min(activeSlot,s.slots.length-1);
 let work;
 if(m.done)work=`<div class="guided-result"><div class="formula">${math(s.expression&&s.accept!=='square-factor'?t.answerTex:L.fill(s.template,m.values))}</div><p class="answer-seal">✓ Juist uitgewerkt</p><p>${esc(s.explanation)}</p></div>`;
 else if(m.stage<0)work=`<p class="prompt">${esc(t.rulePrompt||'Welke rekenregel gebruik je eerst?')}</p><div class="rule-options">${t.choices.map(c=>`<button class="rule-choice ${wrongRule===c.id?'wrong':''}" data-rule="${c.id}"><span>${esc(c.label)}</span><span class="rule-math">${math(c.tex)}</span></button>`).join('')}</div>`;
 else work=`<p class="prompt">${esc(s.prompt)}</p>${GuidedAnswer.render(t,m.stage,m.values,activeSlot)}`;
 const workFooter=`<footer class="workfoot"><p class="feedback" role="status" data-error="${error}" data-ok="${ok}">${esc(m.done?(m.assisted?'Met hulp uitgewerkt.':'Zelfstandig uitgewerkt.'):(message||(m.stage<0?'Kies de passende regel.':'Tik een antwoorddeel aan en kies.')))}</p><button data-action="undo" ${m.stage<0?'disabled':''}>↶ Vorige stap</button><button data-action="help">Hulp</button>${m.done?'<button class="primary" data-action="next">'+(m.index===5?'Bekijk resultaat':'Volgende opgave')+' →</button>':m.stage>=0?'<button class="primary" data-action="check">Controleer →</button>':''}</footer>`;
 return W.play({task:t,mission:m,work,question:question(t),head:playHead(t),footer:workFooter,math,error});
}
function freshRunSeed(id,edition){
 const distinct=candidate=>new Set(Array.from({length:6},(_,index)=>L.make(id,(candidate+Math.imul(index+1,2654435761))>>>0,index,edition).expression)).size===6;
 for(let i=0;i<500;i++){const candidate=seed();if(distinct(candidate))return candidate;}
 // Some native generators have very few seeds with six distinct expressions.
 // Probe independently of random retries; keep the native questions and grader.
 for(let i=0;i<4096;i++){const candidate=Math.imul(i+1,2654435761)>>>0;if(distinct(candidate))return candidate;}
 throw new Error('Geen reeks met zes verschillende opgaven gevonden.');
}
function start(track='basis'){
 const parked=state.runs[state.selected];if(W.resumable(parked)){state.mission=parked;activeSlot=0;go('play');return;}
 if(state.mission?.id===state.selected&&W.resumable(state.mission)){go('play');return;}
 const pilot=state.selected==='machten-product',edition=pilot&&track==='basis'?1:2;
 const fresh=freshRunSeed(state.selected,edition);
 state.mission={id:state.selected,edition,seed:fresh,index:0,stage:-1,values:[],done:false,assisted:false,attempts:0,...(pilot?{pathVersion:W.VERSION,track}:{})};activeSlot=0;go('play');
}
function chooseRule(id){
 const m=state.mission,t=task();if(!m||m.stage!==-1)return;
 if(id!==t.correct){m.attempts++;wrongRule=id;error=true;message='Deze regel past niet bij de eerste bewerking. Kijk naar het grondtal, de haakjes en het bewerkingsteken.';}
 else{resetMessage();m.stage=0;m.values=t.stages[0].slots.map(()=>'');activeSlot=0;message='Juist gekozen.';ok=true;}
 render();persist();
}
function chooseValue(value){
 const m=state.mission;if(!m||m.done||m.stage<0||state.screen!=='play')return;
 if(!GuidedAnswer.choices(task(),m.stage,activeSlot,m.values).includes(value))return;
 m.values[activeSlot]=value;const next=m.values.findIndex(v=>!v);if(next>=0)activeSlot=next;
 resetMessage();render();persist();$('app').querySelector('[data-slot="'+activeSlot+'"]')?.focus({preventScroll:true});
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
 m.index++;m.edition=m.pathVersion===W.VERSION&&m.track==='basis'?1:2;m.stage=-1;m.values=[];m.done=false;m.assisted=false;m.attempts=0;activeSlot=0;helpTask=null;helpStep=0;delete state.help;go('play');
}
function undo(){
 const m=state.mission;if(!m||m.stage<0)return;
 // Evidence reflects a solved question even when its displayed steps are revisited.
 m.done=false;m.stage--;m.values=m.stage<0?[]:task().stages[m.stage].slots.map(()=> '');activeSlot=0;resetMessage();render();persist();
}
function openHelp(){
 if(!state.mission)return;state.mission.assisted=true;const original=task();let candidate;
 let helpSeed;for(let i=0;i<100;i++){helpSeed=seed();candidate=L.make(original.id,helpSeed,original.index,state.mission.edition||1);if(candidate.expression!==original.expression)break;}
 helpTask=candidate;helpStep=0;state.help={id:original.id,index:original.index,edition:state.mission.edition||1,seed:helpSeed,step:0};go('help');
}
function help(){
 const t=helpTask,s=t.stages[helpStep-1],r=t.choices.find(c=>c.id===t.correct);
 return W.help({head:playHead(t,true),question:question(t),phase:s?'Uitwerkingsstap '+helpStep:'De passende rekenregel',step:s?renderedStage(s,s.slots.map(x=>x.answer)):math(r.tex),explanation:s?s.explanation:r.label+'. '+L.stop(t.id).intro,footer:`<footer class="workfoot"><p class="feedback" role="status">${s?esc(s.prompt):'Bekijk de regel en daarna de uitwerking.'}</p><button data-action="help-prev" ${helpStep===0?'disabled':''}>← Terug</button><button data-action="help-return">Mijn opgave</button><button class="primary" data-action="help-next">${helpStep<t.stages.length?'Volgende stap →':'Zelf proberen →'}</button></footer>`});
}
function summary(){
 const m=state.mission,s=L.stop(m.id),e=state.entries[m.id];
 return W.summary({mission:m,stop:s,entry:e,math});
}
function menu(){return `<section class="screen menu">${heading('Getallenwereld','Kies je hoofdstuk of speelvorm.',completed()+'/'+L.STOPS.length+' onderdelen<small>Rekenregels afgerond</small>')}<div class="menu-grid"><section class="menu-group"><h2>Hoofdstukken</h2><div class="menu-links"><button data-action="home">Getallenwereld<small>Alle hoofdstukken</small></button><button data-action="resume" class="primary" ${!state.mission?'disabled':''}>Oefening hervatten<small>${state.mission?esc(L.stop(state.mission.id).title):'Start eerst een onderdeel'}</small></button><button data-theme="machten">Machten<small>${L.theme('machten').stops.length} onderdelen</small></button><button data-theme="wortels">Vierkantswortels<small>${L.theme('wortels').stops.length} onderdelen</small></button><button data-theme="wetenschappelijk">Wetenschappelijke notatie<small>${L.theme('wetenschappelijk').stops.length} onderdelen</small></button><button data-action="help" ${!state.mission?'disabled':''}>Hulp bij mijn opgave<small>Een ander voorbeeld</small></button></div></section><section class="menu-group"><h2>Spelen en oefenbladen</h2><div class="menu-links">${worldLinks()}</div></section></div><div class="dock"><div><small>Je opgave en uitwerking blijven bewaard.</small></div><button data-action="menu-close">Menu sluiten →</button></div></section>`;}
function render(){
 if(state.screen==='help'&&(!helpTask||helpTask.id!==state.mission?.id||helpTask.index!==state.mission?.index))state.screen='play';
 if(state.screen==='summary'&&(!state.mission?.done||state.mission.index!==5))state.screen=state.mission?'play':'chapter';
 const focus=document.activeElement&&$('app').contains(document.activeElement);
 document.body.dataset.screen=state.screen;$('menuBtn').setAttribute('aria-expanded',String(state.screen==='menu'));$('menuBtn').innerHTML=state.screen==='menu'?'× <span>Sluiten</span>':'☰ <span>Menu</span>';
 $('crumbChapter').textContent=['play','summary','help'].includes(state.screen)&&state.mission?L.theme(L.stop(state.mission.id).theme).title:state.screen==='chapter'?L.theme(state.theme).title:'';
 $('crumbChapter').hidden=!$('crumbChapter').textContent;
 $('crumbLevel').textContent=['play','summary','help'].includes(state.screen)&&state.mission?L.stop(state.mission.id).title:'';
 $('crumbLevel').hidden=!$('crumbLevel').textContent;
 $('resumeMenu').disabled=!state.mission;$('helpMenu').disabled=!state.mission;
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
  case 'start-basis':start('basis');break;
  case 'start-advanced':start('verdieping');break;
  case 'results':{const run=state.runs[state.selected];if(run?.done&&run.index===5){state.mission=run;go('summary');}break;}
  case 'check':check();break;
  case 'next':next();break;
  case 'undo':undo();break;
  case 'help':openHelp();break;
  case 'help-prev':helpStep=Math.max(0,helpStep-1);state.help.step=helpStep;render();persist();break;
  case 'help-next':if(helpStep<helpTask.stages.length){helpStep++;state.help.step=helpStep;render();persist();}else go('play');break;
  case 'help-return':go('play');break;
  case 'menu-close':go(previous==='help'&&!helpTask?'play':previous);break;
  case 'menu-open':previous=state.screen;state.menuFrom=previous;go('menu');break;
  case 'again':{const track=state.mission?.track||'basis';state.selected=state.mission.id;state.mission=null;start(track);break;}
  case 'next-stop':{const old=L.stop(state.mission.id),list=W.orderFor(old.theme).map(id=>L.stop(id)),next=list[list.findIndex(s=>s.id===old.id)+1];if(next){state.theme=next.theme;state.selected=next.id;go('chapter');}else go('home');break;}
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
 else if(b.dataset.slot!==undefined){activeSlot=Number(b.dataset.slot);render();$('guidedChoices')?.querySelector('button')?.focus({preventScroll:true});}
 else if(b.dataset.choice!==undefined)chooseValue(b.dataset.choice);
 else if(b.dataset.action)actions(b.dataset.action);
});
$('gameHomeBtn').onclick=()=>{if(AxiomaGame.active)go('home');};
$('profileBtn').onclick=()=>window.LeraarBobTopbar?.openAccount();
 $('trainerMenu').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled||!AxiomaGame.active)return;if(b.dataset.theme){state.theme=b.dataset.theme;state.selected=L.STOPS.find(s=>s.theme===state.theme).id;go('chapter');}else if(b.dataset.action)actions(b.dataset.action);});
 $('crumbChapter').onclick=()=>{if(AxiomaGame.active)actions('chapter');};
$('menuBtn').onclick=()=>{if(!AxiomaGame.active)return;if(state.screen==='menu')actions('menu-close');else{previous=state.screen;state.menuFrom=previous;resetMessage();state.screen='menu';render();persist();sync();}};
document.addEventListener('keydown',e=>{
 if(!AxiomaGame.active||e.composedPath().some(n=>n.id==='axioma-game-status'||n.matches?.('input,textarea,select,[contenteditable=true]')||n.tagName==='DIALOG'&&n.open))return;
 if(e.key==='Escape'){if(state.screen==='menu')actions('menu-close');else if(state.screen==='help')go('play');return;}

});
window.GetallenWorld=Object.freeze({snapshot:()=>JSON.parse(JSON.stringify(state)),task:()=>task()&&JSON.parse(JSON.stringify(task()))});
restore();try{document.documentElement.dataset.mode=localStorage.getItem('axioma-mode')==='dark'?'dark':'light';}catch{}
const requested=new URLSearchParams(location.search),requestedTheme=requested.get('topic')||requested.get('thema')||(L.theme(requested.get('world'))?requested.get('world'):null),requestedStop=L.stop(requested.get('level')||requested.get('onderdeel'));
if(requestedStop){state.theme=requestedStop.theme;state.selected=requestedStop.id;state.screen='chapter';}else if(L.theme(requestedTheme)){state.theme=requestedTheme;state.selected=L.STOPS.find(s=>s.theme===state.theme).id;state.screen='chapter';}
const requestedScreen=requested.get('screen');
if(['home','chapter','menu'].includes(requestedScreen))state.screen=requestedScreen;
if(['play','summary','help'].includes(requestedScreen)){const parked=state.runs[requested.get('activeLevel')||requestedStop?.id||state.mission?.id];if(parked){state.mission=parked;state.screen=requestedScreen;}else state.screen='chapter';}
if(state.screen==='help'&&(!helpTask||helpTask.id!==state.mission?.id||helpTask.index!==state.mission?.index))state.screen='play';
if(state.screen==='summary'&&(!state.mission?.done||state.mission.index!==5))state.screen=state.mission?'play':'chapter';
if(R)router=R.mount({gameId:'getallenwereld',enabled:()=>AxiomaGame.active,read:context,onChange:c=>{state.navigation=c;persist();},apply:c=>{const stop=L.stop(c.level);if(stop){state.selected=stop.id;state.theme=stop.theme;}else if(L.theme(c.topic))state.theme=c.topic;let screen=c.screen;if(['play','summary','help'].includes(screen)){const parked=state.runs[c.runLevel||c.level];if(parked)state.mission=parked;else screen='chapter';}if(screen==='help'&&!helpTask)screen='play';state.screen=['home','chapter','menu','play','help','summary'].includes(screen)?screen:'home';resetMessage();render();persist();}});
window.AxiomaAuth?.onChange(detail=>{if(detail.pending||!AxiomaGame.active||detail.account?.id!==AxiomaGame.account?.id){$('app').style.visibility='hidden';$('app').inert=true;$('getallenProgress').dataset.value='0';}});
window.LeraarBobGameRegistry?.ready().then(()=>{updateReferences();if(['menu','home','chapter'].includes(state.screen)&&AxiomaGame.active)render();});
render();persist();
})();
