(function(){
'use strict';
const {VectorMath:M,TaskValidator:Validator,TaskGenerator:Generator,TrainerScheduler:Scheduler,parseNumber,format,coord}=VectorTrainerCore;
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg',KEY='axioma-vectorentrainer-v020';
const titles={locked:'Nog te ontdekken',new:'Nieuw',guided:'Begeleid',learning:'In opbouw',solid:'Stevig'};
let progress=Scheduler.freshState(),session=null,task=null,answer={strokes:[],values:['',''],point:null,choice:null},intro=false,done=false,dirty=false,errorCode=null,stage=0,role='vector',activeSlot=0,free=false,previousScreen='home',view={},anchor=null,drag=null,cursor=M.point(0,0),cursorVisible=false,seedSerial=Date.now()>>>0;
let restored=null,lessonStep=0,helpStep=0,helpTask=null,feedbackState=null,lastXP=0,paintRoot=null;
const lesson=t=>VectorTrainerLessons.build(t);
try{const raw=JSON.parse(window.AxiomaGame.storage.getItem(KEY)||'null');progress=Scheduler.sanitize(raw?.progress);if(raw?.mode==='dark')document.documentElement.dataset.mode='dark';if(raw?.draft&&Generator.skills.some(s=>s.id===raw.draft.skill))restored=raw.draft;}catch{storageError()}
// Vector symbols have an arrow; point names and choice numbers deliberately do not.
const vectorPattern=()=>/(?<![\p{L}\p{M}])(?:[A-Z]{2}|e[ₓᵧ]|[abcruv])(?![\p{L}\p{M}])/gu;
function mathText(element,text){
 text=String(text||'');element.replaceChildren();let end=0;
 for(const match of text.matchAll(vectorPattern())){
  element.append(document.createTextNode(text.slice(end,match.index)));
  const symbol=document.createElement('span');symbol.className='vector-symbol';symbol.dataset.vector=match[0];symbol.setAttribute('role','math');symbol.setAttribute('aria-label','vector '+match[0]);
  const letters=document.createElement('span');letters.textContent=match[0];letters.setAttribute('aria-hidden','true');symbol.append(letters);
  const accent=document.createElementNS(NS,'svg');accent.setAttribute('viewBox','0 0 32 8');accent.setAttribute('preserveAspectRatio','none');accent.setAttribute('aria-hidden','true');
  const path=document.createElementNS(NS,'path');path.setAttribute('d','M1 4H30M25 1L30 4L25 7');path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.5');accent.append(path);symbol.append(accent);element.append(symbol);end=match.index+match[0].length;
 }
 element.append(document.createTextNode(text.slice(end)));
}
function optionText(text){return text.replace(vectorPattern(),name=>name.length===1?name+'⃗':name.startsWith('e')?'e⃗'+name.slice(1):name+'⃗')}
function storageError(){$('storageWarning').hidden=false;$('storageWarning').textContent='Deze browser kan je voortgang niet bewaren. Je kunt wel blijven oefenen.'}
function save(){try{const draft=task?{skill:task.skill,seed:task.seed,variant:task.variant,level:task.level,repair:task.repair,intro,done,dirty,errorCode,stage,free,session,answer,lessonStep,feedbackState,lastXP}:restored;window.AxiomaGame.storage.setItem(KEY,JSON.stringify({progress,mode:document.documentElement.dataset.mode||'light',draft}));window.AxiomaGame.report(Generator.skills.filter(s=>Scheduler.phase(progress,s.id)==='solid').map(s=>s.id),Generator.skills.length);}catch{storageError()}}
function screen(name){cancelGesture();document.body.dataset.screen=name;AxiomaPlatform.trainerScreen(({play:'play',helpScreen:'help',progressScreen:'progress'})[name]||'');for(const id of ['home','play','progressScreen','helpScreen','summary'])$(id).hidden=id!==name;if(name==='play')requestAnimationFrame(()=>renderBoard());if(name==='helpScreen')requestAnimationFrame(paintHelp);if(name==='home')renderHome()}
function renderXP(){const xp=progress.xp||0;$('xpLabel').textContent=`${xp} XP`;$('xpLabel').title=`${xp} XP totaal · ${session?.xp||0} XP deze sessie`;}
function displayFeedback(){
 const visible=!!feedbackState?.kind&&!intro;$('feedbackPanel').hidden=!visible;$('work').classList.toggle('has-feedback',visible);
 if(!visible)return;
 $('feedbackPanel').className='teaching-panel '+feedbackState.kind;
 $('feedbackTitle').textContent=feedbackState.title||({good:done?'Juist!':'Deze stap klopt',repair:'Kijk nog eens',method:'Resultaat juist · methode nog niet af'})[feedbackState.kind];
 mathText($('feedback'),feedbackState.text);mathText($('feedbackReason'),feedbackState.reason||'');$('feedbackReason').hidden=!feedbackState.reason;
 $('earnedXP').textContent=done&&!free?(lastXP?`+${lastXP} XP · ${dirty?'opgelost met hulp of na verbetering':'zelfstandig opgelost'}`:'Geen XP voor overgeslagen oefeningen'):done?'Vrij oefenen · geen XP':'';
 $('dismissFeedback').hidden=done;$('dismissFeedback').textContent=feedbackState.kind==='good'?'Verder tekenen':'Pas mijn antwoord aan';
}
function message(text,kind=''){
 feedbackState=kind?{text,kind}:null;$('activityHint').textContent=kind?'Lees de feedback naast je oefening.':text;displayFeedback();requestAnimationFrame(()=>renderBoard());
}
$('dismissFeedback').onclick=()=>{feedbackState=null;displayFeedback();save();requestAnimationFrame(()=>renderBoard())};
function renderLesson(){
 $('lessonPanel').hidden=!intro;$('work').classList.toggle('is-lesson',intro);
 if(!intro)return;
 const steps=lesson(task).steps;lessonStep=Math.min(lessonStep,steps.length-1);const step=steps[lessonStep];
 $('lessonCount').textContent=`Voorbeeld · stap ${lessonStep+1} van ${steps.length}`;mathText($('lessonTitle'),step.title);mathText($('lessonText'),step.text);mathText($('lessonCalculation'),step.calculation);
 $('lessonBack').disabled=lessonStep===0;$('lessonBack').hidden=false;
}
$('lessonBack').onclick=()=>{lessonStep=Math.max(0,lessonStep-1);updateUI();save()};
function newSeed(){return (++seedSerial+Math.floor(Math.random()*1e8))>>>0}
function taskLevel(id){const s=progress.skills[id];return s.seen<2?0:s.seen<5?1:2}
function nextTask(){
 if(!free&&session?.answered>=12){showSummary();return}
 const choice=free?{id:task.skill,mode:'practice'}:Scheduler.choose(progress,{round:session?.answered||0});
 const id=choice.id,variant=free?(task.variant+1):progress.skills[id].seen;
 let level=free?task.level:taskLevel(id);
 if(choice.mode==='repair'&&['coords','ab','coordadd','coordscale','headtail'].includes(id))level=0;
 let t;for(let i=0;i<15;i++){t=Generator.generate(id,{seed:newSeed(),level,variant,repair:choice.repair});if(!progress.lastSignatures.includes(t.signature))break}
 task=t;intro=!free&&choice.mode==='intro';resetAnswer();updateUI();screen('play');save();
}
function resetAnswer(){lessonStep=0;feedbackState=null;lastXP=0;answer={strokes:[],values:['',''],point:null,choice:null};done=false;dirty=false;errorCode=null;stage=0;role='vector';activeSlot=0;cursor=M.point(0,0);cursorVisible=false;cancelGesture()}
function startSession(){free=false;session={answered:0,clean:0,repairs:0,xp:0};nextTask()}
function explore(id){free=true;session=null;task=Generator.generate(id,{seed:newSeed(),level:1,variant:0});intro=false;resetAnswer();updateUI();screen('play');save()}
function finish(clean,solved=true){
 if(done)return;
 done=true;if(!free){lastXP=Scheduler.record(progress,task,{clean,solved,code:errorCode||'practice'});session.xp=(session.xp||0)+lastXP;session.answered++;if(clean)session.clean++;if(task.repair&&clean)session.repairs++;}
 if(solved){const example=lesson(task);feedbackState={...feedbackState,title:dirty?(errorCode==='help'?'Juist met hulp':'Juist na verbetering'):'Juist!',reason:task.interaction==='number'?example.conclusion:Generator.skills.find(s=>s.id===task.skill).intro};}
 updateUI(false);save();
}
function guidedPrompt(){if(task.guidedSteps&&!intro&&stage<2)return stage===0?'Maak vanuit P een kopie van u.':'Voeg nu een kopie van v toe aan je route.';return task.prompt}
function updateUI(resetFeedback=true){
 if(!task)return;
 mathText($('prompt'),intro?task.prompt:guidedPrompt());
 $('modeLabel').textContent=`${free?'Vrij oefenen':intro?'Nieuw begrip':task.repair?'Herstel · nieuwe voorstelling':task.level===0?'Begeleid':task.level===1?'Zelf proberen':'Gemengd oefenen'} · ${Generator.skills.find(s=>s.id===task.skill).label}`;mathText($('modeLabel'),$('modeLabel').textContent);
 $('roundLabel').textContent=free?'Vrij oefenen':`Oefening ${Math.min(12,(session?.answered||0)+(done?0:1))} / 12`;
 const choice=task.interaction==='choice',numeric=task.interaction==='number',symbolic=task.representation==='symbolic';
 $('work').className='work '+(numeric?symbolic?'symbolic':'grid-number':choice?'choice-grid':'');$('numberWork').hidden=!numeric;$('choiceWork').hidden=!choice;renderChoices();
 mathText($('givens'),task.givens||task.prompt);mathText($('scaffold'),intro?'Volg de uitwerking stap voor stap.':(task.scaffold||''));
 $('toolHint').textContent=intro?'Bekijk het voorbeeld. Daarna probeer je andere getallen.':choice?'Tik je antwoord. Elk roostervakje stelt één stap voor.':numeric?'x eerst, y daarna. ± voor negatief; / voor een breuk.':task.interaction==='point'?(task.givens||'Tik een roosterpunt en controleer.'):'Sleep, of tik begin → einde. Niets wordt beoordeeld vóór Controleer.';
 mathText($('toolHint'),$('toolHint').textContent);
 $('drawTools').hidden=intro||numeric||choice;
 $('vectorTool').hidden=task.interaction==='point';
 $('resultTool').hidden=task.interaction!=='sketch'||!['headtail','ordered','parallelogram'].includes(task.policy)||task.guidedSteps&&stage<2;
 $('vectorTool').setAttribute('aria-pressed',String(role==='vector'));$('resultTool').setAttribute('aria-pressed',String(role==='result'));
 for(const id of ['vectorTool','resultTool','undoBtn'])$(id).disabled=done;
 $('commit').hidden=choice&&!done&&!intro;
 $('commit').textContent=intro?(lessonStep<lesson(task).steps.length-1?'Volgende stap →':'Zelf proberen →'):done?'Verder →':'Controleer';$('skip').hidden=intro||done;
 mathText($('labelX'),task.slotLabels?.[0]||'x · horizontaal');mathText($('labelY'),task.slotLabels?.[1]||'y · verticaal');
 $('coordinateEditor').setAttribute('aria-label',task.slotLabels?'Coëfficiënten van eenheidsvectoren':'Coördinaten invoeren');
 if(resetFeedback)message(intro?'Dit is een uitgewerkt voorbeeld.':free?'Vrij oefenen telt niet mee voor je leerroute.':task.repair?repairHint(task.repair):'Je kiest zelf waar je tekent. Je kunt altijd een stap terug.');
 renderLesson();renderSlots();displayFeedback();renderXP();renderBoard();
}

function renderChoices(){
 const root=$('choiceWork');root.replaceChildren();if(task.interaction!=='choice')return;
 root.className=task.choiceFormat==='arrows'?'arrow-choices':'';
 task.options.forEach((v,i)=>{
  const b=document.createElement('button');b.className='choice-answer';b.dataset.choice=String(i);b.textContent=task.choiceFormat==='coordinates'?coord(v):`Keuze ${i+1}`;
  b.disabled=intro||done;
  if(answer.choice===i)b.classList.add(M.vectorEquals(v,task.target)?'correct':'incorrect');
  b.onclick=()=>{answer.choice=i;commit();renderChoices()};root.append(b);
 });
}
function showHelp(){
 if(task&&!intro&&!done&&!free){dirty=true;errorCode=errorCode||'help';save()}
 const select=$('helpTopic');select.replaceChildren();
 for(const skill of Generator.skills){const option=document.createElement('option');option.value=skill.id;option.textContent=optionText(skill.label);select.append(option)}
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
 $('helpCount').textContent=`Voorbeeld · stap ${helpStep+1} van ${steps.length}`;mathText($('helpStepTitle'),step.title);mathText($('helpConcept'),step.text);mathText($('helpExample'),step.calculation);$('helpExample').hidden=!step.calculation;
 $('helpBoard').hidden=helpTask.representation==='symbolic';$('helpPrevious').disabled=helpStep===0;$('helpNext').disabled=helpStep===steps.length-1;
 requestAnimationFrame(paintHelp);
}
function paintHelp(){if(helpTask&&!$('helpScreen').hidden)renderBoard(helpTask,$('helpBoard'),true,helpStep,{strokes:[],point:null},false)}
$('helpTopic').onchange=selectHelp;$('helpPrevious').onclick=()=>{helpStep--;renderHelp()};$('helpNext').onclick=()=>{helpStep++;renderHelp()};
$('closeHelp').onclick=()=>task?resume():startSession();

function repairHint(code){return ({xy:'Let deze keer op het verschil tussen horizontaal en verticaal.',ba:'Volg van begin naar einde; trek de begincoördinaten af.',opposite:'Controleer de zin: welke kant wijst de pijl op?',scale:'Vergelijk de factor en de lengte van je nieuwe vector.','one-component':'De factor geldt voor zowel x als y.',headtail:'Onderzoek waar de volgende verplaatsing moet beginnen.',resultant:'Kijk naar het begin en einde van de volledige route.',order:'De gevraagde volgorde hoort hier bij de methode.'})[code]||'Probeer het opnieuw met andere getallen en een andere plaats.'}
function commit(){
 if(intro&&lessonStep<lesson(task).steps.length-1){lessonStep++;updateUI();save();return}
 if(intro){progress.skills[task.skill].intro=true;const old=task;task=Generator.generate(old.skill,{seed:newSeed(),level:0,variant:progress.skills[old.skill].seen,repair:old.repair});intro=false;resetAnswer();updateUI();save();return}
 if(done){nextTask();return}
 let result;
 if(task.guidedSteps&&stage<2){
  const start=stage===0?task.start:M.endPointFromVector(task.start,task.parts[0]);
  const sub={...task,policy:'free',start,target:task.parts[stage]};result=Validator.validate(sub,answer);
  if(!result.ok&&stage===1&&answer.strokes.some(s=>M.vectorEquals(s,task.parts[1])))result={...result,code:'headtail',message:'v zelf klopt. Leg zijn staart aan de kop van u.'};
  if(result.ok){stage++;role=stage===2?'result':'vector';updateUI(false);message(stage===1?'u klopt. Voeg nu v toe.':'De route klopt. Teken nu de resultante.', 'good');save();return}
 }else result=Validator.validate(task,answer);
 if(result.ok){message(result.message,'good');finish(!dirty);renderBoard();return}
 if(!['input','empty','components'].includes(result.code)){dirty=true;errorCode=result.code;}
 message(result.message,result.RESULT_OK?'method':'repair');save();
}
function renderSlots(){
 const vals=intro&&lessonStep===lesson(task).steps.length-1? [format(task.target.dx),format(task.target.dy)]:answer.values;
 for(const [i,id] of ['X','Y'].entries()){$('value'+id).textContent=vals[i]||'?';$('slot'+id).setAttribute('aria-pressed',String(i===activeSlot));$('slot'+id).disabled=intro||done;}
 for(const b of $('keypad').children)b.disabled=intro||done;
}
function key(value){
 if(!task||task.interaction!=='number'||intro||done)return;
 let s=answer.values[activeSlot];
 if(value==='next')activeSlot=1-activeSlot;
 else if(value==='back')answer.values[activeSlot]=s.slice(0,-1);
 else if(value==='sign')answer.values[activeSlot]=s.startsWith('-')?s.slice(1):'-'+s;
 else if(s.length<12){if(value==='.'&&!s.split('/').at(-1).includes('.'))answer.values[activeSlot]=s+(s===''||s==='-'||s.endsWith('/')?'0.':'.');else if(value==='/'&&!s.includes('/')&&/\d$/.test(s))answer.values[activeSlot]=s+'/';else if(/^\d$/.test(value))answer.values[activeSlot]=s+value;}
 renderSlots();save();
}
const keyDefs=[['7','7'],['8','8'],['9','9'],['back','⌫'],['sign','±'],['4','4'],['5','5'],['6','6'],['/','/'],['next','→'],['1','1'],['2','2'],['3','3'],['0','0'],['.',' , ']];
for(const [value,label] of keyDefs){const b=document.createElement('button');b.textContent=label;b.dataset.key=value;b.setAttribute('aria-label',({back:'Laatste teken wissen',sign:'Teken omkeren',next:'Andere component','/':'Breukstreep','.':'Decimaalteken'})[value]||label);b.onclick=()=>key(value);$('keypad').append(b)}
$('slotX').onclick=()=>{activeSlot=0;renderSlots()};$('slotY').onclick=()=>{activeSlot=1;renderSlots()};
$('coordinateEditor').addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;if(/^\d$/.test(e.key)){e.preventDefault();key(e.key)}else if(['Backspace','-','/',',','.'].includes(e.key)){e.preventDefault();key(({Backspace:'back','-':'sign',',':'.'})[e.key]||e.key)}});
function node(tag,attrs={},text){const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el}
function put(tag,attrs,text,parent=paintRoot||$('board')){const el=node(tag,attrs,text);parent.append(el);return el}
function project(p){return {x:view.ox+p.x*view.unit,y:view.oy-p.y*view.unit}}
function line(a,b,attrs={},parent=paintRoot||$('board')){const p=project(a),q=project(b);return put('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,...attrs},undefined,parent)}
function arrow(start,v,name='',kind='given',dashed=false){
 const end=M.endPointFromVector(start,v),a=project(start),b=project(end),g=put('g',{class:kind});
 if(M.isZero(v)){put('circle',{cx:a.x,cy:a.y,r:7,fill:'none',stroke:'currentColor','stroke-width':3},undefined,g);}
 else {put('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'currentColor','stroke-width':kind==='result'?3.5:2.7,'stroke-dasharray':dashed?'5 4':'none'},undefined,g);const theta=Math.atan2(b.y-a.y,b.x-a.x),size=9;put('path',{d:`M${b.x-size*Math.cos(theta-.5)},${b.y-size*Math.sin(theta-.5)}L${b.x},${b.y}L${b.x-size*Math.cos(theta+.5)},${b.y-size*Math.sin(theta+.5)}`,fill:'none',stroke:'currentColor','stroke-width':2.7},undefined,g);}
 if(name){
  const x=Math.max(12,Math.min(view.w-45,(a.x+b.x)/2+9)),y=Math.max(27,Math.min(view.h-8,(a.y+b.y)/2-9));
  const label=put('text',{x,y,fill:'currentColor',class:'vector-label'},name,g);
  for(const match of name.matchAll(vectorPattern())){
   const left=x+(match.index?label.getSubStringLength(0,match.index):0),width=Math.max(10,label.getSubStringLength(match.index,match[0].length)),top=y-18;
   put('path',{'data-vector':match[0],d:`M${left} ${top}H${left+width}M${left+width-4} ${top-3}L${left+width} ${top}L${left+width-4} ${top+3}`,fill:'none',stroke:'currentColor','stroke-width':1.3},undefined,g);
  }
 }
 return g;
}
function drawPoint(p,name='',selected=false){const q=project(p);put('circle',{cx:q.x,cy:q.y,r:selected?6:4,fill:'var(--paper)',stroke:selected?'var(--selection)':'var(--ink)','stroke-width':2});if(name)put('text',{x:Math.max(8,Math.min(view.w-20,q.x+9)),y:Math.max(15,Math.min(view.h-8,q.y+18)),fill:'var(--ink)',class:'vector-label'},name)}
function modelBounds(task,example){
 const b={...task.bounds};if(example){
  const points=lesson(task).steps.flatMap(step=>[...step.strokes.flatMap(s=>[s.start,s.end]),step.point].filter(Boolean));
  b.minX=Math.min(b.minX,...points.map(p=>p.x))-1;b.maxX=Math.max(b.maxX,...points.map(p=>p.x))+1;
  b.minY=Math.min(b.minY,...points.map(p=>p.y))-1;b.maxY=Math.max(b.maxY,...points.map(p=>p.y))+1;
 }return b;
}
function renderBoard(drawTask=task,svg=$('board'),example=intro,step=lessonStep,drawingAnswer=answer,interactive=true,drawingDone=done){
 if(!drawTask||(interactive&&$('play').hidden))return;
 const task=drawTask,intro=example,answer=drawingAnswer,done=interactive&&drawingDone;
 const box=svg.getBoundingClientRect();if(!box.width||!box.height)return;
 const b=modelBounds(task,intro),pad=24,unit=Math.min((box.width-2*pad)/(b.maxX-b.minX),(box.height-2*pad)/(b.maxY-b.minY));
 if(unit<=0)return;
 const previousView=view,previousRoot=paintRoot;paintRoot=svg;try{
 const centerX=(b.minX+b.maxX)/2,centerY=(b.minY+b.maxY)/2;
 view={minX:Math.ceil(centerX-(box.width-2*pad)/(2*unit)),maxX:Math.floor(centerX+(box.width-2*pad)/(2*unit)),minY:Math.ceil(centerY-(box.height-2*pad)/(2*unit)),maxY:Math.floor(centerY+(box.height-2*pad)/(2*unit)),w:box.width,h:box.height,unit,ox:box.width/2-centerX*unit,oy:box.height/2+centerY*unit};
 Object.assign(b,{minX:view.minX,maxX:view.maxX,minY:view.minY,maxY:view.maxY});svg.setAttribute('viewBox',`0 0 ${view.w} ${view.h}`);svg.replaceChildren();
 for(let x=Math.ceil(b.minX);x<=b.maxX;x++)line(M.point(x,b.minY),M.point(x,b.maxY),{stroke:x===0&&task.axes?'var(--muted)':'var(--grid)','stroke-width':1});
 for(let y=Math.ceil(b.minY);y<=b.maxY;y++)line(M.point(b.minX,y),M.point(b.maxX,y),{stroke:y===0&&task.axes?'var(--muted)':'var(--grid)','stroke-width':1});
 if(task.axes){for(let x=Math.ceil(b.minX);x<=b.maxX;x++){if(x===0||x%2&&unit<22)continue;const p=project(M.point(x,0));put('text',{x:p.x,y:p.y+13,'text-anchor':'middle',class:'grid-label'},x)}for(let y=Math.ceil(b.minY);y<=b.maxY;y++){if(y===0||y%2&&unit<22)continue;const p=project(M.point(0,y));put('text',{x:p.x-6,y:p.y+3,'text-anchor':'end',class:'grid-label'},y)}const x=project(M.point(b.maxX,0)),y=project(M.point(0,b.maxY));put('text',{x:x.x,y:x.y-7,class:'grid-label'},'x');put('text',{x:y.x+7,y:y.y,class:'grid-label'},'y');}
 for(const [a,b] of task.segments||[])line(a,b,{stroke:'var(--muted)','stroke-width':1.5});
 for(const dir of task.dirs||[]){const k=30/Math.max(1,M.length(dir)),a=M.endPointFromVector(task.start,M.scale(dir,-k)),b=M.endPointFromVector(task.start,M.scale(dir,k));line(a,b,{stroke:'var(--muted)','stroke-width':1.3,'stroke-dasharray':'4 5'})}
 for(const r of task.refs)arrow(r.start,r.v,r.name+(task.interaction==='number'&&task.skill!=='coords'&&task.skill!=='ab'?' '+coord(r.v):''),'given');
 if(task.choicePositions)task.options.forEach((v,i)=>arrow(task.choicePositions[i],v,String(i+1),'given'));
 for(const s of answer.strokes)arrow(s.start,s,s.role==='result'?'r':'',s.role==='result'?'result':'student');
 if(answer.point)drawPoint(answer.point,task.pointName||'?',true);
 if(intro){const frame=lesson(task).steps[step];if(frame.point)drawPoint(frame.point,task.pointName||'P',true);for(const s of frame.strokes)arrow(s.start,s,s.name||'',s.role==='result'?'result':'example',true);}
 if(done&&task.policy==='commute'){
  arrow(task.start,task.target,'u+v','result');arrow(task.secondStart,task.target,'v+u','result');
 }
 if(done&&!intro&&task.policy==='decompose'){const label=coord(task.target);put('text',{x:16,y:view.h-12,fill:'var(--teal)',class:'vector-label'},`Δx = ${format(task.target.dx)} · Δy = ${format(task.target.dy)} → ${label}`);}
 for(const m of task.points)drawPoint(m.p,m.name);
 if(interactive&&anchor){const p=project(anchor);put('circle',{cx:p.x,cy:p.y,r:9,fill:'none',stroke:'var(--selection)','stroke-width':2});}
 if(interactive&&drag?.moved)arrow(drag.start,M.vectorFromPoints(drag.start,drag.last),'',role==='result'?'result':'student',true);
 if(interactive&&cursorVisible){const p=project(cursor);put('circle',{cx:p.x,cy:p.y,r:11,fill:'none',stroke:'var(--ink)','stroke-width':1.5,'stroke-dasharray':'3 3'});}
 }finally{paintRoot=previousRoot;if(!interactive)view=previousView;}
}
function snap(clientX,clientY){const r=$('board').getBoundingClientRect();if(!view.unit||clientX<r.left||clientY<r.top||clientX>r.right||clientY>r.bottom)return null;
 const x=Math.round((clientX-r.left-view.ox)/view.unit),y=Math.round((view.oy-clientY+r.top)/view.unit);return x>=view.minX&&x<=view.maxX&&y>=view.minY&&y<=view.maxY?M.point(x,y):null;
}
function editable(){return task&&!intro&&!done&&!feedbackState?.kind&&['sketch','point'].includes(task.interaction)&&document.body.dataset.screen==='play'}
function cancelGesture(){anchor=null;drag=null;}
function draw(start,end){if(!editable())return;if(answer.strokes.length>=24){message('Je hebt 24 pijlen getekend. Gebruik Undo om plaats te maken.');return}answer.strokes.push(M.stroke(start,end,role));message('Tekening bewaard. Controleer als je klaar bent.');save();renderBoard()}
function tap(p){if(task.interaction==='point'){answer.point=p;message('Punt gekozen. Controleer als je klaar bent.');save();renderBoard();return}if(anchor){const a=anchor;anchor=null;draw(a,p)}else{anchor=p;message('Beginpunt gekozen. Tik nu het eindpunt.');renderBoard()}}
$('board').addEventListener('pointerdown',e=>{if(!editable()||e.button>0)return;const p=snap(e.clientX,e.clientY);if(!p)return;e.preventDefault();$('board').focus({preventScroll:true});cursorVisible=false;drag={id:e.pointerId,start:p,last:p,x:e.clientX,y:e.clientY,moved:false};$('board').setPointerCapture(e.pointerId)});
$('board').addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;const p=snap(e.clientX,e.clientY);if(!p)return;drag.last=p;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>6){drag.moved=true;renderBoard()}});
$('board').addEventListener('pointerup',e=>{if(drag?.id!==e.pointerId)return;const d=drag,p=snap(e.clientX,e.clientY);drag=null;if(!p){anchor=null;renderBoard();return}if(d.moved&&task.interaction==='sketch'){anchor=null;draw(d.start,p)}else tap(p)});
$('board').addEventListener('pointercancel',()=>{cancelGesture();renderBoard()});
$('board').addEventListener('keydown',e=>{if(!editable())return;cursorVisible=true;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();cursor=M.point(Math.max(Math.ceil(view.minX),Math.min(Math.floor(view.maxX),cursor.x+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0))),Math.max(Math.ceil(view.minY),Math.min(Math.floor(view.maxY),cursor.y+(e.key==='ArrowUp'?1:e.key==='ArrowDown'?-1:0))));renderBoard()}else if(e.key==='Enter'||e.key===' '){e.preventDefault();tap(cursor)}else if(e.key==='Escape'){cancelGesture();renderBoard()}});
$('undoBtn').onclick=()=>{if(!editable())return;if(anchor)anchor=null;else if(task.interaction==='point')answer.point=null;else answer.strokes.pop();message('Laatste stap teruggenomen.');save();renderBoard()};
for(const [id,value] of [['vectorTool','vector'],['resultTool','result']])$(id).onclick=()=>{role=value;cancelGesture();updateUI(false)};
$('commit').onclick=commit;
$('skip').onclick=()=>{if(!task||done||intro)return;dirty=true;errorCode=errorCode||'practice';finish(false,false);nextTask()};
function renderHome(){
 renderXP();
 $('resumeBtn').hidden=!task&&!restored;$('startBtn').textContent=progress.total?'Start een nieuwe sessie →':'Start een sessie →';
 const solid=Generator.skills.filter(s=>Scheduler.phase(progress,s.id)==='solid').length;$('masteryCount').textContent=`${solid} / ${Generator.skills.length} stevig`;
 $('skillList').replaceChildren();Generator.skills.forEach((s,i)=>{const phase=Scheduler.phase(progress,s.id),row=document.createElement('div');row.className='skill-row '+phase;const n=document.createElement('span');n.className='number';n.textContent=String(i+1).padStart(2,'0');const name=document.createElement('div'),title=document.createElement('strong'),small=document.createElement('small');mathText(title,s.label);small.textContent=titles[phase];name.append(title,document.createElement('br'),small);const b=document.createElement('button');b.textContent='Verkennen';b.setAttribute('aria-label',`${s.label} vrij verkennen`);b.onclick=()=>explore(s.id);row.append(n,name,b);$('skillList').append(row)});
}
function showProgress(){previousScreen=document.body.dataset.screen;$('progressRows').replaceChildren();
 for(const s of Generator.skills){const data=progress.skills[s.id],phase=Scheduler.phase(progress,s.id),row=document.createElement('div');row.className='skill-row';const label=document.createElement('span');label.textContent=phase==='solid'?'✓':'·';const detail=document.createElement('div'),strong=document.createElement('strong'),small=document.createElement('small');mathText(strong,s.label);small.textContent=`${data.clean} zelfstandig juist · ${data.seen} geoefend${progress.repairs.some(r=>r.skill===s.id)?' · herstel gepland':''}`;detail.append(strong,document.createElement('br'),small);const status=document.createElement('div');status.textContent=titles[phase];status.style.fontSize='12px';const meter=document.createElement('div');meter.className='meter';const fill=document.createElement('i');fill.style.width=Math.round(data.strength*100)+'%';meter.append(fill);status.append(meter);row.append(label,detail,status);$('progressRows').append(row)}screen('progressScreen');
}
function showSummary(){progress.sessions++;$('summaryStats').replaceChildren();for(const [n,label] of [[session.xp||0,'XP verdiend'],[progress.xp||0,'XP totaal'],[session.answered,'geoefend'],[session.clean,'zelfstandig juist'],[session.repairs,'herstelvragen juist']]){const d=document.createElement('div'),strong=document.createElement('strong'),span=document.createElement('span');strong.textContent=n;span.textContent=label;d.append(strong,span);$('summaryStats').append(d)}$('summaryText').textContent=progress.repairs.length?`Je volgende sessie haalt ${progress.repairs.length} vaardigheid${progress.repairs.length===1?'':'en'} opnieuw op met andere vragen. Zo kan je laten zien dat het ook zelfstandig lukt.`:'Je volgende sessie wisselt nieuwe begrippen af met herhaling. Stevig wordt een vaardigheid pas wanneer verschillende voorstellingen zelfstandig lukken.';task=null;restored=null;screen('summary');save()}
function resume(){
 if(restored&&!task){const d=restored;restored=null;try{
  task=Generator.generate(d.skill,{seed:Number(d.seed)>>>0,level:Math.max(0,Math.min(2,Number(d.level)||0)),variant:Math.max(0,Number(d.variant)||0),repair:typeof d.repair==='string'?d.repair:null});
  const isPoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<1000&&Math.abs(p.y)<1000;
  answer={strokes:(d.answer?.strokes||[]).filter(s=>isPoint(s.start)&&isPoint(s.end)).slice(0,24).map(s=>M.stroke(s.start,s.end,s.role==='result'?'result':'vector')),values:[0,1].map(i=>typeof d.answer?.values?.[i]==='string'?d.answer.values[i].slice(0,12):''),point:isPoint(d.answer?.point)?d.answer.point:null,choice:Number.isInteger(d.answer?.choice)?d.answer.choice:null};
  lessonStep=Math.max(0,Math.min(lesson(task).steps.length-1,Number(d.lessonStep)||0));feedbackState=d.feedbackState&&['good','repair','method'].includes(d.feedbackState.kind)?d.feedbackState:null;lastXP=Math.max(0,Math.min(18,Number(d.lastXP)||0));
  free=!!d.free;intro=!!d.intro;done=!!d.done;dirty=!!d.dirty;errorCode=typeof d.errorCode==='string'?d.errorCode:null;stage=Math.max(0,Math.min(2,Number(d.stage)||0));session={xp:Math.max(0,Math.min(10000,Number(d.session?.xp)||0)),answered:Math.max(0,Math.min(12,Number(d.session?.answered)||0)),clean:Math.max(0,Math.min(12,Number(d.session?.clean)||0)),repairs:Math.max(0,Math.min(12,Number(d.session?.repairs)||0))};
 }catch{task=null;startSession();return}}
 if(task){screen('play');updateUI(!feedbackState);if(done&&!feedbackState)message('Deze oefening is al verwerkt. Ga verder naar een nieuwe vraag.','good')}
}
$('libraryBtn').onclick=$('summaryHome').onclick=$('rotateHome').onclick=()=>{save();screen('home')};
 AxiomaPlatform.bindTrainer({play:()=>task||restored?resume():startSession(),help:showHelp,progress:showProgress});$('closeProgress').onclick=()=>screen(previousScreen);$('startBtn').onclick=$('again').onclick=startSession;$('resumeBtn').onclick=resume;
$('themeBtn').onclick=()=>{document.documentElement.dataset.mode=document.documentElement.dataset.mode==='dark'?'light':'dark';save();renderBoard();paintHelp()};
$('fullBtn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{if(task)message('Volledig scherm is hier niet beschikbaar. De oefening blijft bruikbaar.')}};
new ResizeObserver(entries=>{const r=entries[0].contentRect;if(Math.abs(r.width-(view.w||0))>1||Math.abs(r.height-(view.h||0))>1)cancelGesture();renderBoard()}).observe($('boardWrap'));
new ResizeObserver(paintHelp).observe($('helpBoard'));
window.addEventListener('pagehide',save);
// Read-only geometry inspection for reproducible release checks. No answer data is shown in the UI.
window.AxiomaVectorTrainer=Object.freeze({inspect:()=>structuredClone({task,answer,intro,done,dirty,stage,free,session,progress,view,lessonStep}),project:p=>project(p)});
renderHome();if(restored)resume();else startSession();
})();
