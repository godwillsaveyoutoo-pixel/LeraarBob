(function(){
'use strict';
const {VectorMath:M,TaskValidator:Validator,TaskGenerator:Generator,TrainerScheduler:Scheduler,parseNumber,format,coord}=VectorTrainerCore;
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg',KEY='axioma-vectorentrainer-v020';
const titles={locked:'Nog te ontdekken',new:'Nieuw',guided:'Begeleid',learning:'In opbouw',solid:'Stevig'};
const {STATIONS,stationOfSkill}=VectorMission;
const battle=window.VectorBattlePlayer||null;
// Keep the isolated battle panes compact; the solo board gets dedicated side controls.
if(!battle){
 document.body.classList.add('side-controls');
 const left=document.createElement('aside'),right=document.createElement('aside');
 left.className='exercise-left';left.setAttribute('aria-label','Tekengereedschap en vorige vraag');
 right.className='exercise-right';right.setAttribute('aria-label','Antwoord, feedback en volgende vraag');
 left.append($('previousQuestion'),$('lessonBack'),$('coachPanel'),$('coachTab'),$('drawTools'));
 right.append($('choiceWork'),$('numberWork'),$('lessonPanel'),$('feedbackPanel'),$('activityHint'));
 const actions=document.createElement('div');actions.className='exercise-actions';actions.append($('skip'),$('commit'));right.append(actions);
 $('work').prepend(left);$('work').append(right);
}

let progress=Scheduler.freshState(),session=null,task=null,answer={strokes:[],values:['',''],point:null,choice:null},intro=false,done=false,dirty=false,errorCode=null,stage=0,role='vector',activeSlot=0,free=false,previousScreen='home',view={},anchor=null,drag=null,cursor=M.point(0,0),cursorVisible=false,seedSerial=Date.now()>>>0;
let suspendedSeries=null,restored=null,lessonStep=0,helpStep=0,helpTask=null,feedbackState=null,lastXP=0,paintRoot=null;
let questionHistory=[],reviewIndex=null,liveDraft=null;
let browseMode='series',selectedStationId='koerscentrum',progressStationId=null;
let coachCollapsed=compactCoach(),coachPreference=null,practiceDays=[];
function compactCoach(){return window.matchMedia('(max-height:500px), (max-width:900px)').matches}
const lesson=t=>VectorTrainerLessons.build(t);
const flight=VectorFlight.create({button:$('flightToggle'),meter:$('flightProgress'),status:$('flightStatus')});
function flightModel(){return !battle&&done&&!intro&&feedbackState?.kind==='good'?VectorFlight.model(task):null}
function renderFlightControls(){
 const model=flightModel();$('flightControls').hidden=!model;$('work').classList.toggle('has-flight',!!model);
 if(!model){flight.clear();return;}
 mathText($('flightExplanation'),model.explanation);
 mathText($('flightSourceName'),'a');mathText($('flightTargetName'),model.label);
}

try{const raw=JSON.parse(window.AxiomaGame.storage.getItem(KEY)||'null');progress=Scheduler.sanitize(raw?.progress);if(typeof raw?.coachCollapsed==='boolean')coachCollapsed=coachPreference=raw.coachCollapsed;practiceDays=Array.isArray(raw?.practiceDays)?raw.practiceDays.filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)).slice(-366):[];if(raw?.suspendedSeries&&!raw.suspendedSeries.free&&Generator.skills.some(s=>s.id===raw.suspendedSeries.skill))suspendedSeries=raw.suspendedSeries;if(raw?.mode==='dark')document.documentElement.dataset.mode='dark';if(raw?.draft&&Generator.skills.some(s=>s.id===raw.draft.skill))restored=raw.draft;}catch{storageError()}
// Vector symbols have an arrow; point names and choice numbers deliberately do not.
const vectorPattern=()=>/(?<![\p{L}\p{M}])(?:[A-Z]{2}|e[ₓᵧ]|[abcruv])(?![\p{L}\p{M}])/gu;
// Keep plain fractions in the mathematical model; typeset them only when presenting text.
const fractionPattern=()=>/(?<![\d/])([−+-]?)(\d+)\/(\d+)(?![\d/])/g;
function appendFractionText(element,text){
 let end=0;
 for(const match of text.matchAll(fractionPattern())){
  element.append(document.createTextNode(text.slice(end,match.index)));
  const fraction=document.createElement('span');fraction.className='math-fraction';fraction.setAttribute('role','math');
  fraction.setAttribute('aria-label',`${match[1]==='−'||match[1]==='-'?'min ':match[1]==='+'?'plus ':''}${match[2]} gedeeld door ${match[3]}`);
  if(match[1]){const sign=document.createElement('span');sign.textContent=match[1].replace('-','−');sign.setAttribute('aria-hidden','true');fraction.append(sign);}
  const stack=document.createElement('span');stack.className='fraction-stack';stack.setAttribute('aria-hidden','true');
  for(const [i,value] of [match[2],match[3]].entries()){const part=document.createElement('span');part.className=i?'fraction-denominator':'fraction-numerator';part.textContent=value;stack.append(part);}
  fraction.append(stack);element.append(fraction);end=match.index+match[0].length;
 }
 element.append(document.createTextNode(text.slice(end)));
}
function mathText(element,text){
 text=String(text||'');element.replaceChildren();let end=0;
 for(const match of text.matchAll(vectorPattern())){
  appendFractionText(element,text.slice(end,match.index));
  const symbol=document.createElement('span');symbol.className='vector-symbol';symbol.dataset.vector=match[0];symbol.setAttribute('role','math');symbol.setAttribute('aria-label','vector '+match[0]);
  const letters=document.createElement('span');letters.textContent=match[0];letters.setAttribute('aria-hidden','true');symbol.append(letters);
  const accent=document.createElementNS(NS,'svg');accent.setAttribute('viewBox','0 0 32 8');accent.setAttribute('preserveAspectRatio','none');accent.setAttribute('aria-hidden','true');
  const path=document.createElementNS(NS,'path');path.setAttribute('d','M1 4H30M25 1L30 4L25 7');path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.5');accent.append(path);symbol.append(accent);element.append(symbol);end=match.index+match[0].length;
 }
 appendFractionText(element,text.slice(end));
}

function storageError(){$('storageWarning').hidden=false;$('storageWarning').textContent='Deze browser kan je voortgang niet bewaren. Je kunt wel blijven oefenen.'}
function draftData(){return structuredClone({skill:task.skill,seed:task.seed,variant:task.variant,level:task.level,repair:task.repair,intro,done,dirty,errorCode,stage,free,session,answer,lessonStep,feedbackState,lastXP})}
function snapshot(){return reviewIndex!==null?structuredClone(liveDraft):task?{...draftData(),history:structuredClone(questionHistory)}:restored}
function resetHistory(){questionHistory=[];reviewIndex=null;liveDraft=null}
function rememberQuestion(){if(task&&!intro&&reviewIndex===null)questionHistory=[...questionHistory,draftData()].slice(-24)}
function reviewQuestion(index){
 if(battle||index<0||index>=questionHistory.length)return;
 if(reviewIndex===null)liveDraft=snapshot();
 reviewIndex=index;applyDraft(questionHistory[index]);done=true;session=structuredClone(liveDraft.session);
 if(!feedbackState)feedbackState={kind:'method',title:'Eerdere vraag',text:'Deze vraag heb je overgeslagen. Je ziet hier je bewaarde tekening.'};
 screen('play');updateUI(false);
}
function returnToCurrent(){
 if(reviewIndex===null)return;
 const draft=liveDraft;reviewIndex=null;liveDraft=null;applyDraft(draft);
 screen('play');updateUI(false);save();
}
$('previousQuestion').onclick=()=>reviewQuestion(reviewIndex===null?questionHistory.length-1:reviewIndex-1);
function save(){try{const draft=snapshot();window.AxiomaGame.storage.setItem(KEY,JSON.stringify({progress,mode:'dark',draft,suspendedSeries,practiceDays,coachCollapsed:coachPreference}));window.AxiomaGame.report(Generator.skills.filter(s=>Scheduler.phase(progress,s.id)==='solid').map(s=>s.id),Generator.skills.length);}catch{storageError()}}
function screen(name){
 cancelGesture();closeMenu();if(name!=='play')flight.clear();document.body.dataset.screen=name;
 AxiomaPlatform.trainerScreen(({play:'play',helpScreen:'help',progressScreen:'progress'})[name]||'');
 for(const id of ['home','stationScreen','play','progressScreen','helpScreen','summary'])$(id).hidden=id!==name;
 if(name==='play')requestAnimationFrame(()=>renderBoard());
 if(name==='helpScreen')requestAnimationFrame(paintHelp);
 if(name==='home')renderHome();
 if(name==='stationScreen')renderStation();
 renderBreadcrumbs();
 $('freeBtn').setAttribute('aria-current',name==='home'&&browseMode==='free'||name==='stationScreen'&&browseMode==='free'||name==='play'&&free?'page':'false');
 $('playBtn').setAttribute('aria-current',name==='home'&&browseMode==='series'||name==='stationScreen'&&browseMode==='series'||name==='play'&&!free?'page':'false');
}
function renderXP(){renderMissionStatus();const xp=progress.xp||0;$('xpLabel').textContent=`${xp} XP`;$('xpLabel').title=`${xp} XP totaal · ${session?.xp||0} XP deze sessie`;const meter=$('xpMeter');if(meter)meter.style.width=`${Math.min(100,xp%100)}%`;}
function guidedFlow(){return !!task?.guidedSteps&&!intro&&!done}
function guidedStart(){return stage===1?M.endPointFromVector(task.start,task.parts[0]):task.start}
function syncGuidedStage(){
 if(!task?.guidedSteps||intro||done)return;
 const remaining=[...answer.strokes],accepted=[];let start=task.start;
 for(const part of task.parts){const i=remaining.findIndex(s=>M.samePoint(s.start,start)&&M.vectorEquals(s,part));if(i<0)break;const s=remaining.splice(i,1)[0];accepted.push({...s,role:'vector'});start=s.end;}
 stage=accepted.length;role=stage===2?'result':'vector';
 answer.strokes=[...accepted,...(remaining.length?[{...remaining.at(-1),role}]:[])];
}
function displayFeedback(){
 renderFlightControls();
 const flow=guidedFlow();$('flowFeedback').hidden=!flow;
 if(flow){$('flowFeedback').dataset.kind=feedbackState?.kind||'';mathText($('flowFeedback'),feedbackState?.text||'Sleep een pijl, of tik begin en einde. Elke pijl wordt meteen nagekeken.');}
 const visible=!!feedbackState?.kind&&!intro&&!flow;$('feedbackPanel').hidden=!visible;$('work').classList.toggle('has-feedback',visible);
 if(!visible)return;
 $('feedbackPanel').className='teaching-panel '+feedbackState.kind;
 $('feedbackTitle').textContent=feedbackState.title||({good:done?'Juist!':'Deze stap klopt',repair:'Kijk nog eens',method:'Resultaat juist · methode nog niet af'})[feedbackState.kind];
 mathText($('feedback'),feedbackState.text);mathText($('feedbackReason'),feedbackState.reason||'');$('feedbackReason').hidden=!feedbackState.reason;
 $('earnedXP').hidden=free||!done;
 $('earnedXP').textContent=done&&!free?(lastXP?`+${lastXP} XP · ${dirty?'opgelost met hulp of na verbetering':'zelfstandig opgelost'}`:'Geen XP voor overgeslagen oefeningen'):done?'Vrij oefenen · geen XP':'';
 $('dismissFeedback').hidden=done;$('dismissFeedback').textContent=feedbackState.kind==='good'?'Verder tekenen':'Pas mijn antwoord aan';
}
function message(text,kind=''){
 feedbackState=kind?{text,kind}:null;$('activityHint').textContent=kind?(guidedFlow()?'Teken meteen verder, of gebruik Undo.':'Lees de feedback naast je oefening.'):text;displayFeedback();requestAnimationFrame(()=>renderBoard());
}
function clearRejectedStrokes(){
 if(task&&!done&&['repair','method'].includes(feedbackState?.kind))answer.strokes=VectorMission.retryStrokes(task,answer.strokes,M,Validator.validate);
 cancelGesture();renderCoach();
}
$('dismissFeedback').onclick=()=>{clearRejectedStrokes();feedbackState=null;displayFeedback();save();requestAnimationFrame(()=>renderBoard())};
function renderLesson(){
 $('lessonBack').hidden=!intro;$('lessonVisualKey').hidden=!intro||task.representation==='symbolic';$('lessonPanel').hidden=!intro;$('work').classList.toggle('is-lesson',intro);
 if(!intro)return;
 const steps=lesson(task).steps;lessonStep=Math.min(lessonStep,steps.length-1);const step=steps[lessonStep];
 $('lessonCount').textContent=`Voorbeeld · stap ${lessonStep+1} van ${steps.length}`;mathText($('lessonTitle'),step.title);mathText($('lessonText'),step.text);mathText($('lessonCalculation'),step.calculation);renderStepTrack($('lessonTrack'),steps,lessonStep);$('lessonVisualKey').hidden=task.representation==='symbolic';
 $('lessonBack').disabled=lessonStep===0;$('lessonBack').hidden=false;
}
$('lessonBack').onclick=()=>{lessonStep=Math.max(0,lessonStep-1);updateUI();save()};
function renderStepTrack(root,steps,current){root.replaceChildren();steps.forEach((s,i)=>{const dot=document.createElement('span');dot.className=i===current?'current':i<current?'complete':'';dot.textContent=i+1;dot.title=s.title;dot.setAttribute('aria-label',`Stap ${i+1}: ${s.title}${i===current?' (huidig)':''}`);root.append(dot)})}
function newSeed(){return (++seedSerial+Math.floor(Math.random()*1e8))>>>0}
function taskLevel(id){const s=progress.skills[id];return s.seen<2?0:s.seen<5?1:2}
function nextTask(){
 rememberQuestion();
 if(!free&&session?.answered>=12){showSummary();return}
 const choice=free?{id:task.skill,mode:'practice'}:Scheduler.choose(progress,{round:session?.answered||0});
 const id=choice.id,variant=free?(task.variant+1):progress.skills[id].seen;
 let level=free?task.level:taskLevel(id);
 if(choice.mode==='repair'&&['coords','ab','coordadd','coordscale','headtail'].includes(id))level=0;
 let t;for(let i=0;i<15;i++){t=Generator.generate(id,{seed:newSeed(),level,variant,repair:choice.repair});if(!progress.lastSignatures.includes(t.signature))break}
 task=t;intro=!free&&choice.mode==='intro';resetAnswer();updateUI();screen('play');save();
}
function resetAnswer(){if(coachPreference===null)coachCollapsed=compactCoach()||Scheduler.phase(progress,task.skill)==='solid';lessonStep=0;feedbackState=null;lastXP=0;answer={strokes:[],values:['',''],point:null,choice:null};done=false;dirty=false;errorCode=null;stage=0;role='vector';activeSlot=0;cursor=M.point(0,0);cursorVisible=false;cancelGesture()}
function startSession(){resetHistory();task=null;suspendedSeries=null;restored=null;free=false;session={answered:0,clean:0,repairs:0,xp:0};nextTask()}
function resumeSeries(){
 if((task&&!free)||(restored&&!restored.free))return resume();
 if(suspendedSeries){restored=suspendedSeries;suspendedSeries=null;task=null;resume();save();return}
 startSession();
}
function explore(id){if(task&&!free)suspendedSeries=snapshot();else if(restored&&!restored.free)suspendedSeries=restored;restored=null;resetHistory();free=true;session=null;task=Generator.generate(id,{seed:newSeed(),level:1,variant:0});intro=false;resetAnswer();updateUI();screen('play');save()}
function confirmExplore(id){
 if(browseMode==='free')return explore(id);
 const skill=Generator.skills.find(s=>s.id===id),dialog=$('practiceConfirm');
 $('practiceConfirmText').textContent=`Je kiest ‘${VectorTrainerLessons.topicLabel(skill)}’ buiten je oefeningenreeks. Je oefent hier zonder XP. Je oefeningenreeks blijft bewaard.`;
 dialog.returnValue='';
 dialog.onclose=()=>{if(dialog.returnValue==='practice')explore(id)};
 dialog.showModal();
}
function startGoldenDemo(){if(task&&!free)suspendedSeries=snapshot();else if(restored&&!restored.free)suspendedSeries=restored;restored=null;resetHistory();free=true;session=null;task=Generator.generate('headtail',{seed:71,level:1,variant:2});intro=false;resetAnswer();updateUI();screen('play');save()}
function finish(clean,solved=true){
 if(done)return;
 done=true;if(solved){const today=new Date().toLocaleDateString('sv-SE');practiceDays=[...new Set([...practiceDays,today])].slice(-366);}if(!free){lastXP=Scheduler.record(progress,task,{clean,solved,code:errorCode||'practice'});session.xp=(session.xp||0)+lastXP;session.answered++;if(clean)session.clean++;if(task.repair&&clean)session.repairs++;}
 if(solved){const example=lesson(task);feedbackState={...feedbackState,title:dirty?(errorCode==='help'?'Juist met hulp':'Juist na verbetering'):'Juist!',reason:task.interaction==='number'?example.conclusion:Generator.skills.find(s=>s.id===task.skill).intro};}
 updateUI(false);save();
}
function guidedPrompt(){if(guidedFlow())return ['1 / 3 · Teken u vanuit P.','2 / 3 · Teken v vanaf de kop van u.','3 / 3 · Teken u + v van P naar het einde van je route.'][stage];return task.prompt}
function renderCoach(){
 const panel=$('coachPanel'),tab=$('coachTab');if(!panel||!tab)return;
 const visible=task?.skill==='headtail'&&!intro&&!done;
 panel.hidden=!visible||coachCollapsed;tab.hidden=!visible||!coachCollapsed;$('work').classList.toggle('has-coach',visible&&!coachCollapsed);
 if(!visible)return;
 const ordered=task.policy==='ordered';$('coachTitle').textContent=ordered?'Kop-staart in volgorde':'Kop-staart';
 const route=VectorMission.headtailSteps(task,answer,M),current=guidedFlow()?stage:route.count;
 $('coachTab').setAttribute('aria-expanded',String(!coachCollapsed));
 const steps=ordered?[
  ['u','Teken u vanuit P.'],['v','Zet v kop-staart aan het einde van u.'],['r','Teken de resultante u + v vanuit P.']
 ]:[
  [route.order[0]===0?'u':'v',`Teken ${route.order[0]===0?'u':'v'} vanuit P.`],[route.order[1]===0?'u':'v',`Teken ${route.order[1]===0?'u':'v'} vanaf de kop van ${route.order[0]===0?'u':'v'}.`],['r','Teken de resultante u + v vanuit P.']
 ];
 const root=$('coachSteps');root.replaceChildren();steps.forEach(([tone,text],i)=>{const li=document.createElement('li');li.className=`coach-step tone-${tone} ${i<current?'complete':i===current?'current':''}`;const n=document.createElement('span');n.className='coach-number';n.textContent=i<current?'✓':String(i+1);const copy=document.createElement('span');mathText(copy,text);li.append(n,copy);root.append(li)});
 const tip=ordered?'Deze keer telt de volgorde: eerst u, daarna v.':'Beide volgordes mogen: u + v en v + u geven dezelfde resultante.';mathText($('coachTip'),tip);
}
function setCoachCollapsed(collapsed){coachCollapsed=coachPreference=collapsed;renderCoach();save();$(collapsed?'coachTab':'coachClose').focus();requestAnimationFrame(()=>renderBoard())}
$('coachClose').onclick=()=>setCoachCollapsed(true);
$('coachTab').onclick=()=>setCoachCollapsed(false);
function updateUI(resetFeedback=true){
 if(!task)return;document.body.dataset.skill=task.skill;document.body.dataset.interaction=task.interaction;
 mathText($('prompt'),(intro?task.prompt:guidedPrompt()).replace(' Beide volgordes mogen.',''));
 $('promptNote').textContent=task.skill==='headtail'&&!intro?(task.policy==='ordered'?'Volg deze keer de volgorde u, dan v.':'Beide volgordes mogen.'):'';
 $('modeLabel').textContent=`${free?'Vrij oefenen':intro?'Nieuw begrip':task.repair?'Herstel · nieuwe voorstelling':task.level===0?'Begeleid':task.level===1?'Zelf proberen':'Gemengd oefenen'} · ${Generator.skills.find(s=>s.id===task.skill).label}`;mathText($('modeLabel'),$('modeLabel').textContent);
 $('seriesReturn').hidden=!free;$('seriesReturn').textContent=suspendedSeries?'Hervat reeks · XP →':'Start reeks · XP →';$('practiceMode').textContent=free?'Vrij oefenen · geen XP':'Oefeningenreeks · met XP';
 renderBreadcrumbs();
 $('roundLabel').textContent=free?'Vrij oefenen':`Oefening ${Math.min(12,(session?.answered||0)+(done?0:1))} / 12`;
 const choice=task.interaction==='choice',numeric=task.interaction==='number',symbolic=task.representation==='symbolic';
 $('work').className='work '+(numeric?symbolic?'symbolic':'grid-number':choice?'choice-grid':'');$('numberWork').hidden=!numeric;$('choiceWork').hidden=!choice;renderChoices();renderCoach();
 mathText($('givens'),task.givens||task.prompt);mathText($('scaffold'),intro?'Volg de uitwerking stap voor stap.':(task.scaffold||''));
 mathText($('taskGivens'),task.givens||'');$('taskGivens').hidden=!task.givens;
 $('toolHint').textContent='';$('toolHint').hidden=!$('toolHint').textContent;
 mathText($('toolHint'),$('toolHint').textContent);
 $('drawTools').hidden=intro||numeric||choice;
 $('vectorTool').hidden=task.interaction==='point'||guidedFlow();
 $('resultTool').hidden=task.interaction!=='sketch'||!['headtail','ordered','parallelogram'].includes(task.policy)||guidedFlow();
 $('vectorTool').setAttribute('aria-pressed',String(role==='vector'));$('resultTool').setAttribute('aria-pressed',String(role==='result'));
 for(const id of ['vectorTool','resultTool','undoBtn'])$(id).disabled=done;
 $('commit').hidden=choice&&!done&&!intro||guidedFlow();
 $('commit').disabled=!!battle&&(done||battle.cooling);
 $('commit').textContent=intro?(lessonStep<lesson(task).steps.length-1?'Volgende stap →':'Zelf proberen →'):done?'Verder →':'Controleer';$('skip').hidden=intro||done;
 mathText($('labelX'),task.slotLabels?.[0]||'x · horizontaal');mathText($('labelY'),task.slotLabels?.[1]||'y · verticaal');
 $('coordinateEditor').setAttribute('aria-label',task.slotLabels?'Coëfficiënten van eenheidsvectoren':'Coördinaten invoeren');
 if(resetFeedback)message(intro?'Bekijk de constructie stap voor stap.':task.repair?repairHint(task.repair):task.interaction==='sketch'?'Sleep een pijl, of tik begin en einde.':'');
 renderLesson();renderSlots();displayFeedback();renderXP();renderBoard();
 $('previousQuestion').hidden=!!battle||!questionHistory.length;
 $('previousQuestion').disabled=reviewIndex===0;
 if(reviewIndex!==null){
  $('practiceMode').textContent=`Terugblik · vraag ${reviewIndex+1} van ${questionHistory.length}`;
  $('roundLabel').textContent='Eerdere vraag';$('drawTools').hidden=true;$('skip').hidden=true;
  $('commit').hidden=false;$('commit').textContent=reviewIndex<questionHistory.length-1?'Volgende vraag →':'Huidige vraag →';
  $('earnedXP').hidden=false;$('earnedXP').textContent='Bewaard antwoord · al verwerkt';
 }
 if(battle){$('skip').textContent='Pas';if(battle.singleAttempt)$('commit').textContent='Indienen';if(done)$('commit').textContent='Wachten…';}
}

function renderChoices(){
 const root=$('choiceWork');root.replaceChildren();if(task.interaction!=='choice')return;
 root.className=task.choiceFormat==='arrows'?'arrow-choices':'';
 task.options.forEach((v,i)=>{
  const b=document.createElement('button');b.className='choice-answer';b.dataset.choice=String(i);mathText(b,task.choiceFormat==='coordinates'?coord(v):`Keuze ${i+1}`);
  b.disabled=intro||done||!!battle?.cooling;
  if(answer.choice===i)b.classList.add(M.vectorEquals(v,task.target)?'correct':'incorrect');
  b.onclick=()=>{answer.choice=i;commit();renderChoices()};root.append(b);
 });
}
function showHelp(){
 if(task&&!intro&&!done&&!free){dirty=true;errorCode=errorCode||'help';save()}
 const select=$('helpTopic');select.replaceChildren();
 for(const skill of Generator.skills){const option=document.createElement('option');option.value=skill.id;option.textContent=VectorTrainerLessons.topicLabel(skill);select.append(option)}
 select.value=task?.skill||Generator.skills[0].id;selectHelp();screen('helpScreen');
}
function selectHelp(){
 const id=$('helpTopic').value;helpStep=0;
 helpTask=task?.skill===id&&intro?task:Generator.generate(id,{seed:512,level:0,variant:id==='props'?0:1});renderHelp();
}
function renderHelp(){
 if(!helpTask)return;
 const skill=Generator.skills.find(s=>s.id===helpTask.skill),steps=lesson(helpTask).steps,step=steps[helpStep];
 mathText($('helpTitle'),skill.label);mathText($('helpPrompt'),helpTask.prompt);mathText($('helpGivens'),helpTask.givens||'');
 renderStepTrack($('helpTrack'),steps,helpStep);$('helpVisualKey').hidden=helpTask.representation==='symbolic';
 $('helpCount').textContent=`Voorbeeld · stap ${helpStep+1} van ${steps.length}`;mathText($('helpStepTitle'),step.title);mathText($('helpConcept'),step.text);mathText($('helpExample'),step.calculation);$('helpExample').hidden=!step.calculation;
 $('helpGivens').hidden=!helpTask.givens;$('helpBoard').hidden=helpTask.representation==='symbolic';$('helpPrevious').disabled=helpStep===0;$('helpNext').disabled=helpStep===steps.length-1;
 requestAnimationFrame(paintHelp);
}
function paintHelp(){if(helpTask&&!$('helpScreen').hidden)renderBoard(helpTask,$('helpBoard'),true,helpStep,{strokes:[],point:null},false)}
$('helpTopic').onchange=selectHelp;$('helpPrevious').onclick=()=>{helpStep--;renderHelp()};$('helpNext').onclick=()=>{helpStep++;renderHelp()};
$('closeHelp').onclick=()=>task?resume():showWorld(browseMode);

function repairHint(code){return ({xy:'Let deze keer op het verschil tussen horizontaal en verticaal.',ba:'Volg van begin naar einde; trek de begincoördinaten af.',opposite:'Controleer de zin: welke kant wijst de pijl op?',scale:'Vergelijk de factor en de lengte van je nieuwe vector.','one-component':'De factor geldt voor zowel x als y.',headtail:'Onderzoek waar de volgende verplaatsing moet beginnen.',resultant:'Kijk naar het begin en einde van de volledige route.',order:'De gevraagde volgorde hoort hier bij de methode.'})[code]||'Probeer het opnieuw met andere getallen en een andere plaats.'}
function commit(){
 if(reviewIndex!==null){if(reviewIndex<questionHistory.length-1)reviewQuestion(reviewIndex+1);else returnToCurrent();return;}
 if(battle){
  if(done||battle.cooling)return;
  if(battle.singleAttempt){done=true;feedbackState={kind:'method',title:'Ingediend',text:'Je antwoord wordt verstuurd.'};updateUI(false);battle.submit(answer,false);return;}
  const result=Validator.validate(task,answer);
  if(result.ok){done=true;feedbackState={kind:'good',title:'Ingediend',text:'Je antwoord wordt nagekeken.'};updateUI(false);battle.submit(answer,false);return;}
  message(VectorMission.diagnostic(task,answer,M,result.message),'repair');
  if(!['input','empty','components'].includes(result.code)&&!(task.interaction==='point'&&!answer.point))battle.penalize();
  return;
 }
 if(intro&&lessonStep<lesson(task).steps.length-1){lessonStep++;updateUI();save();return}
 if(intro){progress.skills[task.skill].intro=true;const old=task;task=Generator.generate(old.skill,{seed:newSeed(),level:0,variant:progress.skills[old.skill].seen,repair:old.repair});intro=false;resetAnswer();updateUI();save();return}
 if(done){nextTask();return}
 let result;
 if(task.guidedSteps&&stage<2){
  const start=stage===0?task.start:M.endPointFromVector(task.start,task.parts[0]);
  const sub={...task,policy:'free',start,target:task.parts[stage]};result=Validator.validate(sub,{...answer,strokes:answer.strokes.slice(stage)});
  if(!result.ok&&stage===1&&answer.strokes.slice(stage).some(s=>M.vectorEquals(s,task.parts[1])))result={...result,code:'headtail',message:'v zelf klopt. Leg zijn staart aan de kop van u.'};
  if(result.ok){stage++;role=stage===2?'result':'vector';updateUI(false);message(stage===1?'u klopt. Voeg nu v toe.':'De route klopt. Teken nu de resultante.', 'good');save();return}
 }else result=Validator.validate(task,answer);
 if(result.ok){answer.strokes=VectorMission.retryStrokes(task,answer.strokes,M,Validator.validate);message(result.message,'good');finish(!dirty);renderBoard();return}
 if(!['input','empty','components'].includes(result.code)){dirty=true;errorCode=result.code;}
 message(VectorMission.diagnostic(task,answer,M,result.message),result.RESULT_OK?'method':'repair');save();
}
function renderSlots(){
 const vals=intro&&lessonStep===lesson(task).steps.length-1? [format(task.target.dx),format(task.target.dy)]:answer.values;
 for(const [i,id] of ['X','Y'].entries()){$('value'+id).textContent=vals[i]||'?';$('slot'+id).setAttribute('aria-pressed',String(i===activeSlot));$('slot'+id).disabled=intro||done;}
 for(const b of $('keypad').children)b.disabled=intro||done||!!battle?.cooling;
}
function key(value){
 if(!task||task.interaction!=='number'||intro||done||battle?.cooling)return;
 let s=answer.values[activeSlot];
 if(value==='next')activeSlot=1-activeSlot;
 else if(value==='back')answer.values[activeSlot]=s.slice(0,-1);
 else if(value==='sign')answer.values[activeSlot]=s.startsWith('-')?s.slice(1):'-'+s;
 else if(s.length<12){if(value==='.'&&!s.split('/').at(-1).includes('.'))answer.values[activeSlot]=s+(s===''||s==='-'||s.endsWith('/')?'0.':'.');else if(value==='/'&&!s.includes('/')&&/\d$/.test(s))answer.values[activeSlot]=s+'/';else if(/^\d$/.test(value))answer.values[activeSlot]=s+value;}
 renderSlots();save();
}
const keyDefs=[['7','7'],['8','8'],['9','9'],['back','⌫'],['sign','±'],['4','4'],['5','5'],['6','6'],['/','/'],['next','→'],['1','1'],['2','2'],['3','3'],['0','0'],['.',' , ']];
for(const [value,label] of keyDefs){const b=document.createElement('button');b.textContent=label;b.dataset.key=value;b.setAttribute('aria-label',({back:'Laatste teken wissen',sign:'Teken omkeren',next:'Andere component','/':'Breukstreep','.':'Decimaalteken'})[value]||label);b.title=b.getAttribute('aria-label');b.onclick=()=>key(value);$('keypad').append(b)}
$('slotX').onclick=()=>{activeSlot=0;renderSlots()};$('slotY').onclick=()=>{activeSlot=1;renderSlots()};
$('coordinateEditor').addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;if(/^\d$/.test(e.key)){e.preventDefault();key(e.key)}else if(['Backspace','-','/',',','.'].includes(e.key)){e.preventDefault();key(({Backspace:'back','-':'sign',',':'.'})[e.key]||e.key)}});
function node(tag,attrs={},text){const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el}
function put(tag,attrs,text,parent=paintRoot||$('board')){const el=node(tag,attrs,text);parent.append(el);return el}
function project(p){return {x:view.ox+p.x*view.unit,y:view.oy-p.y*view.unit}}
function line(a,b,attrs={},parent=paintRoot||$('board')){const p=project(a),q=project(b);return put('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,...attrs},undefined,parent)}
let boardLabels=null;
function arrow(start,v,name='',kind='given',dashed=false){
 const end=M.endPointFromVector(start,v),a=project(start),b=project(end),semantic=kind==='result'?' vector-result':/^[ua](?:\b|\+|$)/.test(name)?' vector-u':/^[vb](?:\b|\+|$)/.test(name)?' vector-v':/^[wc](?:\b|$)/.test(name)?' vector-w':'',g=put('g',{class:kind+semantic});
 const weight=kind==='result'?5:4;
 boardLabels?.segments.push({a,b});
 if(M.isZero(v)){put('circle',{cx:a.x,cy:a.y,r:7,fill:'none',stroke:'currentColor','stroke-width':weight},undefined,g);boardLabels?.occupied.push({x:a.x-10,y:a.y-10,width:20,height:20});}
 else {
  put('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'currentColor','stroke-width':weight,'stroke-linecap':'round','stroke-dasharray':dashed?'7 5':'none'},undefined,g);
  const theta=Math.atan2(b.y-a.y,b.x-a.x),size=Math.min(kind==='result'?15:13,Math.hypot(b.x-a.x,b.y-a.y)*.55),ux=Math.cos(theta),uy=Math.sin(theta);
  put('path',{class:'arrowhead',d:`M${b.x},${b.y}L${b.x-size*ux-size*.46*uy},${b.y-size*uy+size*.46*ux}L${b.x-size*ux+size*.46*uy},${b.y-size*uy-size*.46*ux}Z`,fill:'currentColor'},undefined,g);
  boardLabels?.occupied.push({x:b.x-size,y:b.y-size,width:2*size,height:2*size});
 }
 if(name){
  const labelGroup=put('g',{class:'vector-name'},undefined,g);
  svgMathLabel(labelGroup,name);
  boardLabels?.labels.push({group:labelGroup,a,b});
 }

 return g;
}
function svgMathLabel(group,text){
 let cursor=0,end=0;
 const run=value=>{
  if(!value)return;
  const label=put('text',{x:cursor,y:0,fill:'currentColor',class:'vector-label','xml:space':'preserve'},value,group),top=label.getBBox().y-4;
  for(const match of value.matchAll(vectorPattern())){
   const left=cursor+(match.index?label.getSubStringLength(0,match.index):0),width=Math.max(10,label.getSubStringLength(match.index,match[0].length));
   put('path',{'data-vector':match[0],d:`M${left} ${top}H${left+width}M${left+width-4} ${top-3}L${left+width} ${top}L${left+width-4} ${top+3}`,fill:'none',stroke:'currentColor','stroke-width':1.8,'stroke-linecap':'round','stroke-linejoin':'round'},undefined,group);
  }
  cursor+=label.getComputedTextLength();
 };
 for(const match of text.matchAll(fractionPattern())){
  run(text.slice(end,match.index));run(match[1].replace('-','−'));
  const fraction=put('g',{class:'svg-fraction',role:'math','aria-label':`${match[2]} gedeeld door ${match[3]}`},undefined,group);
  const numerator=put('text',{x:0,y:0,fill:'currentColor',class:'vector-label','text-anchor':'middle','aria-hidden':'true'},match[2],fraction);
  const denominator=put('text',{x:0,y:0,fill:'currentColor',class:'vector-label','text-anchor':'middle','aria-hidden':'true'},match[3],fraction);
  const size=parseFloat(getComputedStyle(numerator).fontSize);
  for(const label of [numerator,denominator])label.style.fontSize=size*.72+'px';
  const width=Math.max(numerator.getComputedTextLength(),denominator.getComputedTextLength())+size*.3,center=cursor+width/2,bar=-size*.3;
  numerator.setAttribute('x',center);numerator.setAttribute('y',bar-size*.2);
  denominator.setAttribute('x',center);denominator.setAttribute('y',bar+size*.9);
  put('line',{x1:cursor,y1:bar,x2:cursor+width,y2:bar,stroke:'currentColor','stroke-width':1.4,'aria-hidden':'true'},undefined,fraction);
  cursor+=width;end=match.index+match[0].length;
 }
 run(text.slice(end));
}
function placeBoardLabels(svg){
 const {labels,segments,occupied}=boardLabels;
 for(const text of svg.querySelectorAll('text:not(.grid-label)'))if(!text.closest('.vector-name')){
  const r=text.getBBox();occupied.push({x:r.x,y:r.y,width:r.width,height:r.height});
 }
 for(const {group,a,b} of labels){
  const r=group.getBBox(),placed=VectorMission.placeVectorLabel(a,b,r.width,r.height,view,segments,occupied);
  group.setAttribute('transform',`translate(${placed.x-r.x} ${placed.y-r.y})`);occupied.push(placed);
 }
}
function drawPoint(p,name='',selected=false,docked=false){const q=project(p);boardLabels?.occupied.push({x:q.x-9,y:q.y-9,width:18,height:18});put('circle',{cx:q.x,cy:q.y,r:selected?6:4,fill:'var(--paper)',stroke:selected?'var(--selection)':'var(--ink)','stroke-width':2});if(name)put('text',{x:Math.max(8,Math.min(view.w-20,q.x+(docked?24:9))),y:Math.max(15,Math.min(view.h-8,q.y+(docked?28:18))),fill:'var(--ink)',class:'vector-label'},name)}
const boardFrames=new WeakMap();
function modelBounds(task){
 if(!boardFrames.has(task))boardFrames.set(task,VectorMission.boardBounds(task,lesson(task).steps,M));
 return boardFrames.get(task);
}
function measure(start,v,label,vertical=false){
 if(M.isZero(v))return;
 const end=M.endPointFromVector(start,v),p=project(start),q=project(end),offset=vertical?18:22;
 const a=vertical?{x:p.x+offset,y:p.y}:{x:p.x,y:p.y+offset},b=vertical?{x:q.x+offset,y:q.y}:{x:q.x,y:q.y+offset};
 put('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'var(--teal)','stroke-width':1.5});
 for(const r of [a,b])put('line',{x1:r.x-(vertical?4:0),y1:r.y-(vertical?0:4),x2:r.x+(vertical?4:0),y2:r.y+(vertical?0:4),stroke:'var(--teal)','stroke-width':1.5});
 put('text',{x:(a.x+b.x)/2+(vertical?8:0),y:(a.y+b.y)/2+(vertical?5:16),'text-anchor':vertical?'start':'middle',class:'measurement'},label);
}
function renderBoard(drawTask=task,svg=$('board'),example=intro,step=lessonStep,drawingAnswer=answer,interactive=true,drawingDone=done){
 if(!drawTask||(interactive&&$('play').hidden))return;
 const task=drawTask,intro=example,answer=drawingAnswer,done=interactive&&drawingDone,axes=task.axes||task.skill==='headtail';
 const box=svg.getBoundingClientRect();if(!box.width||!box.height)return;
 const nextView=VectorMission.boardView(modelBounds(task),box.width,box.height);
 if(!nextView)return;
 const previousView=view,previousRoot=paintRoot,previousLabels=boardLabels;paintRoot=svg;boardLabels={labels:[],segments:[],occupied:[]};try{
 view=nextView;
 const b=view;svg.setAttribute('viewBox',`0 0 ${view.w} ${view.h}`);svg.replaceChildren();
 // The painted grid fills the cockpit; model coordinates and integer snapping stay unchanged.
 const cockpit=!battle&&svg===$('board'),grid=cockpit?{minX:(12-b.ox)/b.unit,maxX:(b.w-12-b.ox)/b.unit,minY:(b.oy-b.h+12)/b.unit,maxY:(b.oy-12)/b.unit}:b;
 if(cockpit&&view.unit>=48){
  for(let x=Math.ceil(grid.minX-.5)+.5;x<=grid.maxX;x++)line(M.point(x,grid.minY),M.point(x,grid.maxY),{class:'grid-minor',stroke:'var(--grid)','stroke-opacity':.3,'stroke-dasharray':'2 5'});
  for(let y=Math.ceil(grid.minY-.5)+.5;y<=grid.maxY;y++)line(M.point(grid.minX,y),M.point(grid.maxX,y),{class:'grid-minor',stroke:'var(--grid)','stroke-opacity':.3,'stroke-dasharray':'2 5'});
 }
 for(let x=Math.ceil(b.minX);x<=b.maxX;x++)line(M.point(x,grid.minY),M.point(x,grid.maxY),{class:x===0&&axes?'axis':'grid-line',stroke:x===0&&axes?'var(--muted)':'var(--grid)','stroke-width':1});
 for(let y=Math.ceil(b.minY);y<=b.maxY;y++)line(M.point(grid.minX,y),M.point(grid.maxX,y),{class:y===0&&axes?'axis':'grid-line',stroke:y===0&&axes?'var(--muted)':'var(--grid)','stroke-width':1});
 if(cockpit){
  put('rect',{class:'grid-edge',x:12,y:12,width:Math.max(0,b.w-24),height:Math.max(0,b.h-24),fill:'none',stroke:'var(--grid)','stroke-width':1,'pointer-events':'none'});
  if(view.unit>=48)for(let x=Math.ceil(b.minX);x<=b.maxX;x++)for(let y=Math.ceil(b.minY);y<=b.maxY;y++){const p=project(M.point(x,y));put('circle',{class:'grid-node',cx:p.x,cy:p.y,r:.9,fill:'var(--grid)','pointer-events':'none'});}
 }
 if(axes){for(let x=Math.ceil(b.minX);x<=b.maxX;x++){if(x===0||x%2&&view.unit<22)continue;const p=project(M.point(x,0));put('text',{x:p.x,y:p.y+13,'text-anchor':'middle',class:'grid-label'},x)}for(let y=Math.ceil(b.minY);y<=b.maxY;y++){if(y===0||y%2&&view.unit<22)continue;const p=project(M.point(0,y));put('text',{x:p.x-6,y:p.y+3,'text-anchor':'end',class:'grid-label'},y)}const x=project(M.point(b.maxX,0)),y=project(M.point(0,b.maxY));put('text',{x:x.x,y:x.y-7,class:'grid-label'},'x');put('text',{x:y.x+7,y:y.y,class:'grid-label'},'y');}
 for(const [a,b] of task.segments||[])line(a,b,{stroke:'var(--muted)','stroke-width':1.5});
 for(const dir of task.dirs||[]){const k=30/Math.max(1,M.length(dir)),a=M.endPointFromVector(task.start,M.scale(dir,-k)),b=M.endPointFromVector(task.start,M.scale(dir,k));line(a,b,{stroke:'var(--muted)','stroke-width':1.3,'stroke-dasharray':'4 5'})}
 for(const r of task.refs)arrow(r.start,r.v,r.name,'given');
 if(task.choicePositions)task.options.forEach((v,i)=>{
  const flight=interactive&&flightModel(),selected=flight&&M.vectorEquals(v,task.target);
  const g=arrow(task.choicePositions[i],v,selected?flight.label:String(i+1),selected?'student':'given');
  if(flight&&!selected)g.setAttribute('opacity','.3');
 });
 for(const [i,s] of answer.strokes.entries()){const part=task.skill==='headtail'?task.parts.findIndex(p=>M.vectorEquals(s,p)):-1;arrow(s.start,s,s.role==='result'?'r':part>=0?['u','v'][part]:interactive&&flightModel()?flightModel().label:task.guidedSteps&&i<stage?['u','v'][i]:'',s.role==='result'?'result':'student');}
 if(answer.point)drawPoint(answer.point,task.pointName||'?',true);
 if(intro){const frames=lesson(task).steps,frame=frames[step],previous=step?frames[step-1].strokes.length:0;
  if(frame.point)drawPoint(frame.point,task.pointName||'P',true);
  frame.strokes.forEach((s,i)=>{const g=arrow(s.start,s,s.name||'',s.role==='result'?'result':'example');if(step<frames.length-1&&i<previous&&frame.strokes.length>previous)g.classList.add('construction-previous')});
  for(const m of frame.measurements||[])measure(m.start,m.v,m.label,m.vertical);
 }
 if(done&&task.policy==='commute'){
  arrow(task.start,task.target,'u+v','result');arrow(task.secondStart,task.target,'v+u','result');
 }
 if(done&&!intro&&task.policy==='decompose'){const label=coord(task.target);put('text',{x:16,y:view.h-12,fill:'var(--teal)',class:'vector-label'},`Δx = ${format(task.target.dx)} · Δy = ${format(task.target.dy)} → ${label}`);}
 for(const m of task.points)drawPoint(m.p,m.name,false,interactive&&!battle&&!intro&&['opposite','scalar'].includes(task.skill)&&M.samePoint(m.p,task.start));
 if(interactive&&guidedFlow()){const p=project(guidedStart());put('circle',{'data-guided-start':'',cx:p.x,cy:p.y,r:12,fill:'none',stroke:'var(--teal)','stroke-width':2,'stroke-dasharray':'3 3'});}
 if(interactive&&anchor){const p=project(anchor);put('circle',{cx:p.x,cy:p.y,r:9,fill:'none',stroke:'var(--selection)','stroke-width':2});}
 if(interactive&&drag?.moved)arrow(drag.start,M.vectorFromPoints(drag.start,drag.last),'',role==='result'?'result':'student',true);
 if(interactive&&cursorVisible){const p=project(cursor);put('circle',{cx:p.x,cy:p.y,r:11,fill:'none',stroke:'var(--ink)','stroke-width':1.5,'stroke-dasharray':'3 3'});}
 placeBoardLabels(svg);
 if(interactive){const model=flightModel();if(model)flight.attach(svg,project,model,task);else if(!battle&&!intro)flight.park(svg,project,task);else flight.clear();}
 }finally{paintRoot=previousRoot;boardLabels=previousLabels;if(!interactive)view=previousView;}
}
function snap(clientX,clientY){const r=$('board').getBoundingClientRect();if(!view.unit||clientX<r.left||clientY<r.top||clientX>r.right||clientY>r.bottom)return null;
 const x=Math.round((clientX-r.left-view.ox)/view.unit),y=Math.round((view.oy-clientY+r.top)/view.unit);return x>=view.minX&&x<=view.maxX&&y>=view.minY&&y<=view.maxY?M.point(x,y):null;
}
function editable(){return task&&!intro&&!done&&!battle?.cooling&&(!feedbackState?.kind||guidedFlow())&&['sketch','point'].includes(task.interaction)&&document.body.dataset.screen==='play'}
function cancelGesture(){anchor=null;drag=null;}
function draw(start,end){
 if(!editable())return;
 if(guidedFlow()){
  // Replace only the current attempt; already accepted parts remain on the board.
  answer.strokes=answer.strokes.slice(0,stage);role=stage===2?'result':'vector';
  answer.strokes.push(M.stroke(start,end,role));commit();renderBoard();return;
 }
 // A one-vector question has one current attempt, not a pile of earlier arrows.
 if(!task.acceptChain&&['free','properties'].includes(task.policy))answer.strokes=[];
 if(answer.strokes.length>=24){message('Je hebt 24 pijlen getekend. Gebruik Undo om plaats te maken.');return}
 answer.strokes.push(M.stroke(start,end,role));renderCoach();message('Tekening bewaard. Controleer als je klaar bent.');save();renderBoard();
}
function tap(p){if(task.interaction==='point'){answer.point=p;message('Punt gekozen. Controleer als je klaar bent.');save();renderBoard();return}if(anchor){const a=anchor;anchor=null;draw(a,p)}else{anchor=p;message('Beginpunt gekozen. Tik nu het eindpunt.');renderBoard()}}
$('board').addEventListener('pointerdown',e=>{if(!editable()||e.button>0)return;const p=snap(e.clientX,e.clientY);if(!p)return;e.preventDefault();$('board').focus({preventScroll:true});cursorVisible=false;drag={id:e.pointerId,start:p,last:p,x:e.clientX,y:e.clientY,moved:false};$('board').setPointerCapture(e.pointerId)});
$('board').addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;const p=snap(e.clientX,e.clientY);if(!p)return;drag.last=p;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>6){drag.moved=true;renderBoard()}});
$('board').addEventListener('pointerup',e=>{if(drag?.id!==e.pointerId)return;const d=drag,p=snap(e.clientX,e.clientY);drag=null;if(!p){anchor=null;renderBoard();return}if(d.moved&&task.interaction==='sketch'){anchor=null;draw(d.start,p)}else tap(p)});
$('board').addEventListener('pointercancel',()=>{cancelGesture();renderBoard()});
$('board').addEventListener('keydown',e=>{if(!editable())return;if(!cursorVisible)cursor=M.point(Math.max(view.minX,Math.min(view.maxX,task.start.x)),Math.max(view.minY,Math.min(view.maxY,task.start.y)));cursorVisible=true;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();cursor=M.point(Math.max(Math.ceil(view.minX),Math.min(Math.floor(view.maxX),cursor.x+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0))),Math.max(Math.ceil(view.minY),Math.min(Math.floor(view.maxY),cursor.y+(e.key==='ArrowUp'?1:e.key==='ArrowDown'?-1:0))));renderBoard()}else if(e.key==='Enter'||e.key===' '){e.preventDefault();tap(cursor)}else if(e.key==='Escape'){cancelGesture();renderBoard()}});
$('undoBtn').onclick=()=>{if(!editable())return;if(anchor)anchor=null;else if(task.interaction==='point')answer.point=null;else answer.strokes.pop();syncGuidedStage();message('Laatste stap teruggenomen.');updateUI(false);save();renderBoard()};
for(const [id,value] of [['vectorTool','vector'],['resultTool','result']])$(id).onclick=()=>{role=value;cancelGesture();updateUI(false)};
$('commit').onclick=commit;
$('skip').onclick=()=>{if(!task||done||intro)return;if(battle){done=true;feedbackState={kind:'method',title:'Gepast',text:battle.singleAttempt?'Wacht tot de ronde afgelopen is.':'Je tegenstander speelt nog verder.'};updateUI(false);battle.submit(answer,true);return;}dirty=true;errorCode=errorCode||'practice';finish(false,false);nextTask()};
function recommendedSkillId(){
 if(task&&!free)return task.skill;
 if(restored&&!restored.free)return restored.skill;
 if(suspendedSeries&&!suspendedSeries.free)return suspendedSeries.skill;
 try{return Scheduler.choose(progress,{round:0}).id}catch{return 'props'}
}
function stationProgress(st){
 const values=st.skills.map(id=>progress.skills[id]?.strength||0);
 return values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length*100):0;
}
function stationSolidCount(st){return st.skills.filter(id=>Scheduler.phase(progress,id)==='solid').length}
function starMarkup(percent){const n=percent>=90?3:percent>=60?2:percent>=25?1:0;return Array.from({length:3},(_,i)=>i<n?'★':'<span class="off">★</span>').join('')}
function showWorld(mode='series'){
 browseMode=mode;selectedStationId=stationOfSkill(recommendedSkillId()).id;screen('home');save();
}
function openStation(id){selectedStationId=STATIONS.some(s=>s.id===id)?id:stationOfSkill(recommendedSkillId()).id;screen('stationScreen')}
// Derive route arrows from the actual responsive cards, never from fixed map coordinates.
function renderWorldRoutes(){
 const svg=$('worldRoutes'),box=svg.getBoundingClientRect();
 if(!box.width||!box.height||$('home').hidden)return;
 svg.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);svg.replaceChildren();
 const cards=STATIONS.map(st=>$('stationNodes').querySelector(`[data-station="${st.id}"]`));
 for(let i=0;i<cards.length-1;i++){
  if(!cards[i]||!cards[i+1])continue;
  const a=cards[i].getBoundingClientRect(),b=cards[i+1].getBoundingClientRect();
  const from={x:a.x+a.width/2-box.x,y:a.y+a.height/2-box.y},to={x:b.x+b.width/2-box.x,y:b.y+b.height/2-box.y};
  // On the illustrated map, leave the tall middle building clear of the top route.
  if(Math.abs(from.y-to.y)<5&&getComputedStyle(cards[i].querySelector('.station-structure')).position==='absolute')from.y=to.y=Math.max(a.y,b.y)-box.y+12;
  const dx=to.x-from.x,dy=to.y-from.y,distance=Math.hypot(dx,dy);
  if(!distance)continue;
  const ux=dx/distance,uy=dy/distance;
  const edge=r=>Math.min(Math.abs(ux)>1e-6?r.width/2/Math.abs(ux):Infinity,Math.abs(uy)>1e-6?r.height/2/Math.abs(uy):Infinity);
  const exit=edge(a),entry=distance-edge(b),gap=entry-exit;
  if(gap<=4)continue;
  const inset=Math.min(6,gap*.12),start=exit+inset,end=exit+gap*.76;
  const x1=from.x+ux*start,y1=from.y+uy*start,x2=from.x+ux*end,y2=from.y+uy*end;
  const head=Math.min(13,(end-start)*.42),wing=head*.48;
  const g=node('g',{'data-route-from':STATIONS[i].id,'data-route-to':STATIONS[i+1].id,style:`color:${getComputedStyle(cards[i]).getPropertyValue('--station-accent').trim()||'#61d7f1'}`});
  g.append(node('line',{x1,y1,x2:x2-ux*head*.45,y2:y2-uy*head*.45,stroke:'currentColor','stroke-width':3,'stroke-linecap':'round'}));
  g.append(node('path',{d:`M${x2} ${y2}L${x2-ux*head-uy*wing} ${y2-uy*head+ux*wing}L${x2-ux*head+uy*wing} ${y2-uy*head-ux*wing}Z`,fill:'currentColor'}));
  svg.append(g);
 }
}
new ResizeObserver(renderWorldRoutes).observe($('vectorWorld'));
document.fonts?.ready.then(()=>requestAnimationFrame(renderWorldRoutes));
function renderHome(){
 requestAnimationFrame(renderWorldRoutes);
 renderXP();$('roundLabel').textContent=browseMode==='free'?'Vrij oefenen':'Oefeningenreeks';
 const recSkill=recommendedSkillId(),recStation=stationOfSkill(recSkill),container=$('stationNodes');
 $('worldModeBadge').textContent=browseMode==='free'?'Vrij oefenen · alle haltes':'Oefeningenreeks · aanbevolen route';
 container.replaceChildren();
 const unlocked=new Set(Scheduler.unlocked(progress));
 for(const st of STATIONS){
  const pct=stationProgress(st),complete=stationSolidCount(st)===st.skills.length,available=st.skills.some(id=>unlocked.has(id));
  const b=document.createElement('button');b.type='button';b.className=`world-station station-${st.id}${st.id===recStation.id&&browseMode==='series'?' is-recommended':''}${complete?' is-complete':''}${!available&&browseMode==='series'?' is-future':''}`;
  b.dataset.station=st.id;b.setAttribute('aria-label',`${st.name}: ${pct}% voortgang. Open station.`);b.onclick=()=>openStation(st.id);
  b.innerHTML=`<span class="station-structure" aria-hidden="true"><img src="assets/stations/${st.id}.svg" alt="" draggable="false"></span><span class="station-badge">${st.number}</span><span class="world-station-copy"><strong>${st.name}</strong><small>${st.subtitle}</small></span><span class="station-score"><span class="station-state">${complete?'Voltooid':st.id===recStation.id&&browseMode==='series'?'Aanbevolen':available||browseMode==='free'?'Beschikbaar':'Later'}</span><b>${pct}%</b></span>`;
  container.append(b);
 }
 const overall=Math.round(Generator.skills.reduce((sum,s)=>sum+(progress.skills[s.id]?.strength||0),0)/Generator.skills.length*100);
 $('worldProgressFill').style.width=overall+'%';$('worldProgressText').textContent=overall+'%';$('worldMissionText').textContent=browseMode==='free'?'Kies vrij een station en oefen zonder XP.':'Volg de aanbevolen route of bekijk een ander station.';
 $('worldNextName').textContent=recStation.name;$('startBtn').innerHTML=`<span aria-hidden="true">🚀</span> ${browseMode==='free'?'Kies station':'Verder'} <span aria-hidden="true">›</span>`;
 $('startBtn').onclick=()=>browseMode==='series'?resumeSeries():openStation(selectedStationId||recStation.id);
 $('resumeBtn').hidden=!task&&!restored;$('resumeBtn').textContent='Hervat oefening';$('masteryCount').textContent=`${Generator.skills.filter(s=>Scheduler.phase(progress,s.id)==='solid').length} / ${Generator.skills.length} stevig`;
}
function renderStation(){
 renderXP();const st=STATIONS.find(s=>s.id===selectedStationId)||STATIONS[0],recSkill=recommendedSkillId(),unlocked=new Set(Scheduler.unlocked(progress)),pct=stationProgress(st);
 $('stationScreen').dataset.station=st.id;
 $('stationNumber').textContent=String(st.number).padStart(2,'0');$('stationModeLabel').textContent=browseMode==='free'?'Vrij oefenen · kies je halte':'Oefeningenreeks · jouw haltes';$('stationTitle').textContent=st.name;$('stationSubtitle').textContent=st.subtitle;
 $('stationPercent').textContent=pct+'%';$('stationMeterFill').style.width=pct+'%';$('stationCompletion').textContent=`${stationSolidCount(st)} / ${st.skills.length} stevig`;$('stationGoal').textContent=st.goal;
 const recHere=st.skills.includes(recSkill),root=$('skillList'),positions=VectorMission.stationLayout(st.skills.length);root.replaceChildren();
 $('stationPaths').replaceChildren();
 for(const [portrait,className] of [[false,'station-path-wide'],[true,'station-path-tall']]){
  const path=document.createElementNS(NS,'path');path.setAttribute('class',className);path.setAttribute('d',positions.map((p,i)=>`${i?'L':'M'}${(portrait?p.px:p.x)*10},${(portrait?p.py:p.y)*10}`).join(' '));$('stationPaths').append(path);
 }
 st.skills.forEach((id,i)=>{
  const skill=Generator.skills.find(s=>s.id===id),phase=Scheduler.phase(progress,id),strength=Math.round((progress.skills[id]?.strength||0)*100),recommended=browseMode==='series'&&id===recSkill;
  const resumeHere=task?.skill===id&&(browseMode==='free')===free;
  const card=document.createElement('article');card.className=`mission-card${phase==='solid'?' is-solid':''}${recommended?' is-recommended':''}${!unlocked.has(id)&&browseMode==='series'?' is-later':''}`;card.dataset.skill=id;
  const p=positions[i];for(const [key,value] of Object.entries({x:p.x,y:p.y,px:p.px,py:p.py}))card.style.setProperty('--stop-'+key,value+'%');
  const status=resumeHere&&!done?'Hervatten':phase==='solid'?'Stevig':recommended?'Aanbevolen':phase==='learning'?'In opbouw':phase==='guided'?'Begeleid':browseMode==='free'?'Vrij te kiezen':unlocked.has(id)?'Beschikbaar':'Later in je route';
  const actionLabel=resumeHere?'Hervat oefening':recommended?'Verder oefenen':'Vrij oefenen';
  card.innerHTML=`<button class="mission-action" type="button"><span class="mission-beacon">${VectorMission.skillArt(id)}<span class="mission-index">${phase==='solid'?'✓':i+1}</span></span><span class="mission-title"></span><span class="mission-state">${status}<span class="mission-strength"> · ${strength}%</span></span></button>`;
  mathText(card.querySelector('.mission-title'),skill.label);const button=card.querySelector('button');button.setAttribute('aria-label',`${skill.label} · ${status} · ${strength}% · ${actionLabel}`);button.onclick=()=>resumeHere?resume():recommended?resumeSeries():confirmExplore(id);root.append(card);
 });
 const recBtn=$('stationRecommendedBtn');recBtn.hidden=false;
 if(task&&stationOfSkill(task.skill).id===st.id&&(browseMode==='free')===free){recBtn.textContent='Hervat oefening →';recBtn.onclick=resume}
 else if(recHere&&browseMode==='series'){recBtn.textContent='Verder oefenen →';recBtn.onclick=resumeSeries}
 else if(browseMode==='free'){recBtn.textContent='Start eerste halte →';recBtn.onclick=()=>explore(st.skills[0])}
 else{recBtn.textContent=`Naar ${stationOfSkill(recSkill).name} →`;recBtn.onclick=()=>openStation(stationOfSkill(recSkill).id)}
}
function selectProgressStation(id){
 const st=STATIONS.find(s=>s.id===id)||STATIONS[0];progressStationId=st.id;
 for(const button of $('progressStations').children)button.setAttribute('aria-pressed',String(button.dataset.progressStation===st.id));
 $('progressStationPanel').dataset.station=st.id;$('progressStationTitle').textContent=st.name;$('progressStationSubtitle').textContent=st.subtitle;$('progressStationPercent').textContent=stationProgress(st)+'%';
 const root=$('progressRows');root.replaceChildren();
 for(const id of st.skills){
  const skill=Generator.skills.find(s=>s.id===id),data=progress.skills[id],phase=Scheduler.phase(progress,id),pct=Math.round(data.strength*100),repair=progress.repairs.some(r=>r.skill===id);
  const row=document.createElement('div');row.className='progress-skill';row.dataset.progressSkill=id;row.dataset.phase=phase;
  row.innerHTML=`<span class="progress-skill-mark" aria-hidden="true">${phase==='solid'?'✓':data.seen?'◒':'○'}</span><div class="progress-skill-copy"><strong></strong><small>${data.clean} zelfstandig juist · ${data.seen} geoefend${repair?' · herstel gepland':''}</small></div><span class="progress-phase">${titles[phase]}</span><div class="progress-skill-strength"><span>${pct}%</span><div class="progress-meter" aria-hidden="true"><i style="width:${pct}%"></i></div></div>`;
  mathText(row.querySelector('strong'),skill.label);root.append(row);
 }
 $('progressRows').parentElement.scrollTop=0;
}
function showProgress(){
 const current=document.body.dataset.screen;
 if(current!=='progressScreen'){
  previousScreen=current;
  if(current==='stationScreen')progressStationId=selectedStationId;
  else if(['play','helpScreen'].includes(current)&&task)progressStationId=stationOfSkill(task.skill).id;
 }
 progressStationId||=stationOfSkill(recommendedSkillId()).id;
 const solid=Generator.skills.filter(s=>Scheduler.phase(progress,s.id)==='solid').length;
 $('progressTotal').textContent=`${solid} / ${Generator.skills.length} stevig`;
 const navigation=$('progressStations');navigation.replaceChildren();
 for(const st of STATIONS){
  const pct=stationProgress(st),count=stationSolidCount(st),button=document.createElement('button');button.type='button';button.className='progress-station';button.dataset.progressStation=st.id;button.dataset.station=st.id;
  button.setAttribute('aria-controls','progressStationPanel');button.setAttribute('aria-label',`${st.name}: ${count} van ${st.skills.length} vaardigheden stevig, ${pct}% voortgang`);
  button.innerHTML=`<span class="progress-station-number" aria-hidden="true">${String(st.number).padStart(2,'0')}</span><span class="progress-station-copy"><strong>${st.name}</strong><small>${count} / ${st.skills.length} stevig</small></span><span class="progress-station-percent">${pct}%</span><span class="progress-meter" aria-hidden="true"><i style="width:${pct}%"></i></span>`;
  button.onclick=()=>selectProgressStation(st.id);navigation.append(button);
 }
 selectProgressStation(progressStationId);screen('progressScreen');
}
function showSummary(){progress.sessions++;$('summaryStats').replaceChildren();for(const [n,label] of [[session.xp||0,'XP verdiend'],[progress.xp||0,'XP totaal'],[session.answered,'geoefend'],[session.clean,'zelfstandig juist'],[session.repairs,'herstelvragen juist']]){const d=document.createElement('div'),strong=document.createElement('strong'),span=document.createElement('span');strong.textContent=n;span.textContent=label;d.append(strong,span);$('summaryStats').append(d)}$('summaryText').textContent=progress.repairs.length?`Je volgende sessie haalt ${progress.repairs.length} vaardigheid${progress.repairs.length===1?'':'en'} opnieuw op met andere vragen. Zo kan je laten zien dat het ook zelfstandig lukt.`:'Je volgende sessie wisselt nieuwe begrippen af met herhaling. Stevig wordt een vaardigheid pas wanneer verschillende voorstellingen zelfstandig lukken.';task=null;restored=null;screen('summary');save()}
function applyDraft(d){
 cancelGesture();
  task=Generator.generate(d.skill,{seed:Number(d.seed)>>>0,level:Math.max(0,Math.min(2,Number(d.level)||0)),variant:Math.max(0,Number(d.variant)||0),repair:typeof d.repair==='string'?d.repair:null});
  const isPoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<1000&&Math.abs(p.y)<1000;
  answer={strokes:(d.answer?.strokes||[]).filter(s=>isPoint(s.start)&&isPoint(s.end)).slice(0,24).map(s=>M.stroke(s.start,s.end,s.role==='result'?'result':'vector')),values:[0,1].map(i=>typeof d.answer?.values?.[i]==='string'?d.answer.values[i].slice(0,12):''),point:isPoint(d.answer?.point)?d.answer.point:null,choice:Number.isInteger(d.answer?.choice)?d.answer.choice:null};
  lessonStep=Math.max(0,Math.min(lesson(task).steps.length-1,Number(d.lessonStep)||0));feedbackState=d.feedbackState&&['good','repair','method'].includes(d.feedbackState.kind)?d.feedbackState:null;lastXP=Math.max(0,Math.min(18,Number(d.lastXP)||0));
  free=!!d.free;intro=!!d.intro;done=!!d.done;dirty=!!d.dirty;errorCode=typeof d.errorCode==='string'?d.errorCode:null;stage=Math.max(0,Math.min(2,Number(d.stage)||0));session=free?null:{xp:Math.max(0,Math.min(10000,Number(d.session?.xp)||0)),answered:Math.max(0,Math.min(12,Number(d.session?.answered)||0)),clean:Math.max(0,Math.min(12,Number(d.session?.clean)||0)),repairs:Math.max(0,Math.min(12,Number(d.session?.repairs)||0))};
}
function resume(){
 if(restored&&!task){const d=restored;restored=null;try{
  resetHistory();questionHistory=Array.isArray(d.history)?d.history.filter(h=>h&&Generator.skills.some(s=>s.id===h.skill)&&h.done&&!h.intro).slice(-24).map(h=>({...h,history:undefined})):[];
  applyDraft(d);
 }catch{task=null;startSession();return}}
 if(task){if(done&&!intro&&Validator.validate(task,answer).ok)answer.strokes=VectorMission.retryStrokes(task,answer.strokes,M,Validator.validate);syncGuidedStage();screen('play');updateUI(!feedbackState);if(guidedFlow()&&stage===2&&Validator.validate(task,answer).ok)commit();if(done&&!feedbackState)message('Deze oefening is al verwerkt. Ga verder naar een nieuwe vraag.','good')}
}
$('canvasBtn').onclick=()=>{save();location.href='canvas.html'};
$('battleBtn').onclick=()=>{save();location.href='battle.html'};
$('classBtn').onclick=()=>{save();location.href='classroom.html'};
$('freeBtn').onclick=$('libraryBtn').onclick=()=>{save();showWorld('free')};
$('summaryHome').onclick=$('rotateHome').onclick=()=>{save();showWorld('series')};
$('stationBack').onclick=()=>showWorld(browseMode);
AxiomaPlatform.bindTrainer({play:()=>showWorld('series'),help:showHelp,progress:showProgress});$('closeProgress').onclick=()=>screen(previousScreen);$('startBtn').onclick=$('seriesReturn').onclick=resumeSeries;$('again').onclick=startSession;$('resumeBtn').onclick=resume;
$('themeBtn').onclick=()=>{const on=document.documentElement.classList.toggle('high-contrast');$('themeBtn').setAttribute('aria-pressed',String(on));};
$('fullBtn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{if(task)message('Volledig scherm is hier niet beschikbaar. De oefening blijft bruikbaar.')}};
function closeMenu(){if(!$('trainerMenu'))return;$('trainerMenu').hidden=true;$('work').inert=false;$('menuBtn').setAttribute('aria-expanded','false')}
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('trainerMenu').hidden){closeMenu();$('menuBtn').focus();}});
document.addEventListener('pointerdown',event=>{if(!$('trainerMenu').hidden&&!event.target.closest('#trainerMenu,#menuBtn'))closeMenu();});
document.addEventListener('topbar:change',()=>{closeMenu();cancelGesture();});
$('menuBtn').onclick=()=>{const open=$('trainerMenu').hidden;$('trainerMenu').hidden=!open;$('work').inert=open;$('menuBtn').setAttribute('aria-expanded',String(open));if(open)$('playBtn').focus()};
function breadcrumbStation(){return ['play','helpScreen'].includes(document.body.dataset.screen)&&task?stationOfSkill(task.skill):STATIONS.find(st=>st.id===selectedStationId)}
function renderBreadcrumbs(){
 const current=document.body.dataset.screen,inStation=current==='stationScreen'||['play','helpScreen'].includes(current)&&!!task,st=breadcrumbStation();
 $('crumbWorld').setAttribute('aria-current',current==='home'?'page':'false');
 $('crumbStation').hidden=$('crumbStationDivider').hidden=!inStation;
 $('crumbStation').textContent=st?.name||'';$('crumbStation').setAttribute('aria-current',current==='stationScreen'?'page':'false');
 const label=current==='play'?Generator.skills.find(s=>s.id===task?.skill)?.label:({helpScreen:'Uitleg',progressScreen:'Mijn voortgang',summary:'Reeks afgerond'})[current];
 $('crumbExercise').hidden=$('crumbExerciseDivider').hidden=!label;$('crumbExercise').textContent=label||'';$('crumbExercise').title=label||'';
}
$('crumbWorld').onclick=()=>{const mode=['play','helpScreen'].includes(document.body.dataset.screen)&&task?(free?'free':'series'):browseMode;showWorld(mode)};
$('crumbStation').onclick=()=>{const st=breadcrumbStation();if(['play','helpScreen'].includes(document.body.dataset.screen))browseMode=free?'free':'series';save();openStation(st.id)};
$('guestBtn').onclick=()=>document.getElementById('axioma-game-status')?.shadowRoot?.querySelector('.dock')?.click();
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#trainerMenu,#menuBtn'))closeMenu()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('trainerMenu').hidden){closeMenu();$('menuBtn').focus()}else if(!$('coachPanel').hidden){$('coachClose').click()}}});
function renderMissionStatus(){
 const account=window.AxiomaGame.account;
 $('profileName').textContent=account?.alias||(account?.role==='teacher'?'Leerkracht':'Gast');
 const status=window.AxiomaGame.status||'guest';
 const detail=({saved:'Online opgeslagen',saving:'Opslaan…',pending:'Nog te bewaren',offline:'Alleen op dit toestel',conflict:'Voortgang gewijzigd',changed:'Account gewijzigd',error:'Opslag controleren',loading:'Voortgang laden…',teacher:'Oefenmodus',guest:'Op dit toestel'})[status]||'Mijn voortgang';
 $('profileDetail').textContent=detail;$('guestBtn').dataset.saveStatus=status;
 $('guestBtn').title=`${$('profileName').textContent} · ${detail}`;
 $('guestBtn').setAttribute('aria-label',`${$('profileName').textContent} · ${detail}. Bekijk account en opslag.`);
 const days=VectorMission.streak(practiceDays);$('streakValue').textContent=days;$('streakUnit').textContent=days===1?'dag':'dagen';$('streakLabel').title=days+' opeenvolgende oefendagen';
 $('sessionMeter').style.width=(free?0:Math.min(100,(session?.answered||0)/12*100))+'%';
}
// The shared runtime owns syncing; mirror its live status in this trainer's profile button.
const storageDock=document.getElementById('axioma-game-status')?.shadowRoot?.querySelector('.dock');
if(storageDock)new MutationObserver(renderMissionStatus).observe(storageDock,{childList:true,attributes:true,attributeFilter:['data-status']});
window.matchMedia('(max-height:500px), (max-width:900px)').addEventListener('change',e=>{if(coachPreference===null)coachCollapsed=e.matches;renderCoach();requestAnimationFrame(()=>renderBoard())});
new ResizeObserver(entries=>{const r=entries[0].contentRect;if(Math.abs(r.width-(view.w||0))>1||Math.abs(r.height-(view.h||0))>1)cancelGesture();renderBoard()}).observe($('boardWrap'));
new ResizeObserver(paintHelp).observe($('helpBoard'));
window.addEventListener('pagehide',save);
// Read-only geometry inspection for reproducible release checks. No answer data is shown in the UI.
window.AxiomaVectorTrainer=Object.freeze({inspect:()=>structuredClone({task,answer,intro,done,dirty,stage,free,session,progress,view,lessonStep}),project:p=>project(p)});
if(battle){
 battle.connect({
  start(spec){task=Generator.generate(spec.skill,{seed:spec.seed,variant:spec.variant,level:1});free=true;session=null;intro=false;coachCollapsed=true;resetAnswer();screen('play');updateUI();},
  freeze(text){done=true;cancelGesture();feedbackState={kind:'good',title:'Ronde afgelopen',text};updateUI(false);},
  cooldown(seconds){
   if(!seconds){clearRejectedStrokes();feedbackState=null;updateUI();return;}
   $('commit').disabled=true;$('commit').textContent=`Wacht ${seconds} s`;
   for(const button of $('choiceWork').children)button.disabled=true;
  }
 });
}else{
 // Opening the trainer always starts at the map; a saved draft waits for an explicit resume.
 const demo=new URLSearchParams(location.search).get('demo');
 if(demo==='headtail')startGoldenDemo();else showWorld('series');
}
})();
