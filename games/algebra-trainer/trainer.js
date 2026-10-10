(()=>{
'use strict';
const {gcd,lcm,Rat,R,ratKey,reciprocal,terminatingPlaces,N,V,Add,Mul,Div,EQ,cloneExpr,cloneEq,isNum,isVar,num,linearCoeff,makeLinearTerm,simplify,negExpr,simplifyEq,exprSig,eqSig,exprNodeCount,equationComplexity,containsVar,countType,solvedEquation,operandIsNumeric,applyEquation,decimalText,hashRat,autoNumberFormat,ratLatex,splitSign,latexExpr,latexEq,operationLatex,fallbackText,texHTML,renderMathNodes,TYPES,LEVEL_META,INT_COEFF,INT_SHIFT,FRAC_COEFF,FRAC_SHIFT,DEC_COEFF,DEC_SHIFT,pick,chance,currentPolicy,pickFmt,pickParam,pickSolution,numNodeFromParam,nice,rhsFmt,positiveDifferentCoeffs,step,generateExercise,topTerms,absExpr,exprIsZero,collectNumericDenominators,outerScalar,operandRepresentable,canonicalStepAt,candidateOperands}=window.AlgebraCore;
const {contextOperations,checkProgress}=window.AlgebraWorkbench;
const L=AlgebraLearning,J=AlgebraJourney;let chapterJourney=J.normalize(null);let paperSelection=null;let routeContext={};let runs={},learningRun=null,freeSession=null,historyIndex=0;
const selection={};
TYPES.forEach(t=>selection[t.id]={checked:t.level==='beginner',count:t.level==='beginner'?2:1});
let activeLevel='beginner';
let activeSet=[];
let trainerIndex=0;
let trainerStates=[];
let trainerStepLog=[];
let selectedOp=null;
let manualOpen=false,valuePage=0;let navigation=null;
const compactQuery=matchMedia("(max-height:500px) and (min-width:601px)");
const choicePages=new Map();
function compactControls(){return compactQuery.matches;}
// Paging changes only the visible choices, never the task or answer.
function pageChoices(host,selector,label){
 if(!host)return;host.parentElement.querySelectorAll("[data-choice-pager=\""+host.id+"\"]").forEach(n=>n.remove());
 const choices=[...host.querySelectorAll(selector)];choices.forEach(b=>b.hidden=false);
 if(!compactControls()||choices.length<=2)return;
 const key=mission+":"+trainerIndex+":"+host.id+":"+choices.map(b=>b.textContent).join("|");
 const pages=Math.ceil(choices.length/2);let page=Math.max(0,Math.min(choicePages.get(key)||0,pages-1));
 const bar=document.createElement("div");bar.className="choicePagination";bar.dataset.choicePager=host.id;
 const prev=document.createElement("button"),next=document.createElement("button"),range=document.createElement("output");
 prev.type=next.type="button";prev.textContent="←";next.textContent="→";prev.setAttribute("aria-label","Vorige "+label);next.setAttribute("aria-label","Volgende "+label);prev.setAttribute("aria-controls",host.id);next.setAttribute("aria-controls",host.id);range.setAttribute("aria-live","polite");
 function show(){choices.forEach((b,i)=>{b.hidden=Math.floor(i/2)!==page;b.setAttribute("aria-keyshortcuts",String(i%2+1));});prev.disabled=page===0;next.disabled=page===pages-1;range.textContent=(page*2+1)+"–"+Math.min((page+1)*2,choices.length)+" / "+choices.length;choicePages.set(key,page);}
 prev.onclick=()=>{page--;show();};next.onclick=()=>{page++;show();};bar.append(prev,range,next);host.after(bar);bar.hidden=host.hidden||host.classList.contains("hidden");show();
}
function pageProduction(){const form=$("#production");for(const [selector,label,id] of [[".routeChoices","bewerkingsroutes","routeChoices"],[".termPalette","bouwstenen","termChoices"],[".fractionNumbers","getallen","fractionNumberChoices"],[".fractionOperations","bewerkingen","fractionOperationChoices"]]){const host=form.querySelector(selector);if(host){host.id=id;pageChoices(host,"button",label);}}}
let currentSolved=false;
let settingsDirty=true;
let screen='menu',restoring=false,perExercise={},solvedTypes=new Set();
let journey=AlgebraWorld.normalize(null),mission=null,worldView=null,worldLegacy=[],mapLocation=null;
const SAVE_KEY='leraarbob.algebra.v1';
let lesson=null,motionFrame=null;
let touchField="lhs";
const touchKinds=["predict","repair","expand","build","verify","fractions"];
const fractionView=AlgebraFractionView.mount({task,result,render:()=>renderTrainer(),feedback:(message,bad)=>{feedback.className='feedback'+(bad?' bad':'');feedback.textContent=message;}});
const motionPlayer=new AlgebraMotion.Player(onMotionFrame,onMotionFinished);

const $=s=>document.querySelector(s);
const setupScreen=$('#setupScreen'),trainerScreen=$('#trainerScreen'),previewScreen=$('#previewScreen');
const archive=window.LeraarBobWorksheetSave?.mount({host:previewScreen.querySelector('.previewHead'),getSnapshot:worksheetSnapshot,isValid:()=>AxiomaGame.active!==false&&!!(paperSelection?.run?.tasks?.length||learningRun?.tasks?.length||activeSet.length)});
const typeHost=$('#typeHost'),totalCount=$('#totalCount'),selectionSummary=$('#selectionSummary');
const levelTitle=$('#levelTitle'),levelSubtitle=$('#levelSubtitle'),setupMessage=$('#setupMessage');
const derivationStack=$('#derivationStack'),feedback=$('#feedback'),valueZone=$('#valueZone'),valueGrid=$('#valueGrid'),nextBox=$('#nextBox'),trainProgress=$('#trainProgress');

function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function currentSettings(){
  return {
    allowFractions:$('#allowFractions').checked,
    allowDecimals:$('#allowDecimals').checked,
    allowNegative:$('#allowNegative').checked
  };
}
function markDirty(){settingsDirty=true;hideSetupMessage();persist()}
function showSetupMessage(msg,bad=false){
  setupMessage.textContent=msg;setupMessage.classList.add('show');
  setupMessage.style.background=bad?'var(--redSoft)':'var(--greenSoft)';
  setupMessage.style.color=bad?'var(--red)':'var(--green)';
}
function hideSetupMessage(){setupMessage.classList.remove('show')}

function renderTypeLevel(){
  const meta=LEVEL_META[activeLevel];
  levelTitle.textContent=meta.label;levelSubtitle.textContent=meta.subtitle;
  const types=TYPES.filter(t=>t.level===activeLevel);
  typeHost.innerHTML=`<div class="typeGrid">${
    types.map(t=>{
      const s=selection[t.id];
      return `<label class="typeRow">
        <input class="typeCheck" data-id="${t.id}" type="checkbox" ${s.checked?'checked':''}>
        <span class="typeInfo"><strong>${escapeHTML(t.label)}</strong><small>${escapeHTML(t.desc)}</small></span>
        <input class="countBox" data-count="${t.id}" type="number" aria-label="Aantal oefeningen ${escapeHTML(t.label)}" min="1" max="20" value="${s.count}" ${s.checked?'':'disabled'}>
      </label>`;
    }).join('')
  }</div>`;

  typeHost.querySelectorAll('.typeCheck').forEach(ch=>ch.onchange=()=>{
    const id=ch.dataset.id;selection[id].checked=ch.checked;
    typeHost.querySelector(`[data-count="${id}"]`).disabled=!ch.checked;
    updateTotal();markDirty();
  });
  typeHost.querySelectorAll('.countBox').forEach(inp=>inp.oninput=()=>{
    selection[inp.dataset.count].count=Math.max(1,Math.min(20,parseInt(inp.value||1,10)));
    updateTotal();markDirty();
  });
  document.querySelectorAll('.levelTab').forEach(b=>{
    b.classList.toggle('active',b.dataset.level===activeLevel);
    b.setAttribute('aria-selected',String(b.dataset.level===activeLevel));
  });
}
function updateTotal(){
  const chosen=TYPES.filter(t=>selection[t.id].checked);
  totalCount.textContent=chosen.reduce((s,t)=>s+selection[t.id].count,0);
  const levels=new Set(chosen.map(t=>t.level));
  selectionSummary.textContent=!chosen.length?'geen types gekozen':`${chosen.length} type${chosen.length===1?'':'s'} · ${levels.size} niveau${levels.size===1?'':'s'}`;
}
document.querySelectorAll('.levelTab').forEach(b=>b.onclick=()=>{activeLevel=b.dataset.level;renderTypeLevel();persist()});
$('#selectLevelBtn').onclick=()=>{TYPES.filter(t=>t.level===activeLevel).forEach(t=>selection[t.id].checked=true);renderTypeLevel();updateTotal();markDirty()};
$('#clearLevelBtn').onclick=()=>{TYPES.filter(t=>t.level===activeLevel).forEach(t=>selection[t.id].checked=false);renderTypeLevel();updateTotal();markDirty()};
['allowFractions','allowDecimals','allowNegative','includeKey','shuffleQuestions'].forEach(id=>$('#'+id).onchange=markDirty);

function makeSet(){
  const chosen=TYPES.filter(t=>selection[t.id].checked);
  if(!chosen.length){showSetupMessage('Kies minstens één vraagtype.',true);return null}
  if(chosen.reduce((n,t)=>n+selection[t.id].count,0)>60){showSetupMessage('Kies maximaal 60 oefeningen per reeks.',true);return null}
  const policy=currentSettings(),out=[],oldQuestions=new Set(activeSet.map(e=>eqSig(e.start)));
  try{
    chosen.forEach(t=>{
      for(let i=0;i<selection[t.id].count;i++){
        let ex;
        for(let tries=0;tries<256;tries++){ex=generateExercise(t.id,policy,i);if(!oldQuestions.has(eqSig(ex.start)))break;}
        if(oldQuestions.has(eqSig(ex.start)))throw Error('Geen nieuwe combinatie.');
        out.push(ex);
      }
    });
  }catch(err){
    showSetupMessage('De generator vond geen nette combinatie. Probeer opnieuw of kies minder uitzonderlijke opties.',true);
    return null;
  }
  if($('#shuffleQuestions').checked){
    for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
  }
  if(learningRun)learningRun.work=perExercise;mission=null;learningRun=null;paperSelection=null;activeSet=out;perExercise={};trainerStates=[];trainerIndex=0;settingsDirty=false;
  renderPreview();
  refreshNav();
  return out;
}

/* ============================================================
   9. NAVIGATIE
   ============================================================ */
function showScreen(name){
 if(name==='preview'&&window.LeraarBobWorksheetEntry)return LeraarBobWorksheetEntry.open(navigation?.selected());
  if(lesson||motionPlayer.active){stopPresentation();if(trainerStates.length)renderTrainer();}
  screen=name;document.body.dataset.screen=name;
  $('#navigationScreen').classList.toggle('hidden',name!=='menu');if(name==='menu')navigation?.render();
  $('#worldScreen').classList.toggle('hidden',name!=='world');
  $('#toolsScreen').classList.toggle('hidden',name!=='tools');
  if(name==='world')worldView?.render();$('#resumeFreeBtn').hidden=!freeSession;document.querySelectorAll('[data-nav]').forEach(b=>b.setAttribute('aria-current',b.dataset.nav===name?'page':'false'));
  setupScreen.classList.toggle('hidden',name!=='setup');
  trainerScreen.classList.toggle('hidden',name!=='trainer');
  previewScreen.classList.toggle('hidden',name!=='preview');
  $('#historyScreen').classList.toggle('hidden',name!=='history');$('#summaryScreen').classList.toggle('hidden',name!=='summary');
  document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));
  if(name==='preview'){renderPreview();renderMathNodes(previewScreen)}
  navigation?.sync();persist();
}
function refreshNav(){
  document.querySelectorAll('[data-current-series]').forEach(button=>button.disabled=!activeSet.length);
  document.querySelectorAll('[data-nav=trainer],[data-nav=preview]').forEach(b=>b.setAttribute('aria-disabled',String(!activeSet.length)));
}
document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{
  const name=b.dataset.nav;
  if(['setup','world','tools'].includes(name)){showScreen(name);return}
  if(!activeSet.length){
    showScreen('setup');showSetupMessage(`Bevestig eerst je reeks onderaan voordat je naar ${name==='trainer'?'Trainer':'Oefenblad'} gaat.`,true);
    return;
  }
  if(name==='trainer'){
    if(!trainerStates.length)startExercise(0);
    showScreen('trainer');
  }else showScreen('preview');
});

/* ============================================================
   10. TRAINER
   ============================================================ */
function currentExercise(){return activeSet[trainerIndex]}
function currentEquation(){return trainerStates[trainerStates.length-1]}
function stepText(op,operand,policy){
  return `${op==='*'?'·':op==='/'?'÷':op==='-'?'−':'+'} ${fallbackText(latexExpr(operand,policy))} op beide leden`;
}
function actionLatex(op,operand,policy){
  const expression=latexExpr(operand,policy);
  const symbol=op==='*'?'\\cdot':op==='/'?'\\div':op==='-'?'-':'+';
  return `${symbol}\\;${operand.t==='add'||splitSign(operand).neg?`\\left(${expression}\\right)`:expression}`;
}
const operationNames={'+':'Optellen','-':'Aftrekken','*':'Vermenigvuldigen','/':'Delen'};
const operationKinds={'+':'add','-':'subtract','*':'multiply','/':'divide'};
function choiceMath(tex,index,label=''){return (label?'<small class="choiceLabel">'+escapeHTML(label)+'</small>':'')+'<span class="choiceMath">'+texHTML(tex)+'</span><kbd class="choiceShortcut" aria-hidden="true">'+(index+1)+'</kbd>';}
function termChoice(item,sign,policy,index){
 const added=sign==='-'?negExpr(cloneExpr(item.expr)):item.expr;
 const tex=latexExpr(added,policy);
 return choiceMath(tex,index)+(sign==='-'&&splitSign(item.expr).neg?'<small class="signPreview">− ('+escapeHTML(fallbackText(item.tex))+') = '+escapeHTML(fallbackText(tex))+'</small>':'');
}
function task(){return learningRun?.tasks[trainerIndex]||null}
function result(){return learningRun?.results[trainerIndex]||null}
function motionHTML(tex){
 if(window.katex)return window.katex.renderToString(tex,{throwOnError:false,strict:'ignore',trust:context=>context.command==='\\htmlClass'});
 return texHTML(tex);
}
function renderDerivation(animateNew=false){
 const ex=currentExercise();if(!ex)return;const t=task(),eq=currentEquation();
 $('#givenEquation').dataset.mathTex=t?.display||latexEq(ex.start,ex.policy);$('#givenEquation').innerHTML=texHTML($('#givenEquation').dataset.mathTex);
 if(t&&touchKinds.includes(t.kind)){renderTouchAnswer();return;}
 $('#touchAnswer').hidden=true;
 const shown=t?.kind==='repair'?t.fault:t?.kind==='build'?null:eq;
 const previous=trainerStates.length>1?trainerStates.at(-2):null;
 const tex=motionFrame?.tex||(shown?latexEq(shown,ex.policy):t.display);
 const previousTex=previous?latexEq(previous,ex.policy):null;
 drawSteps(previousTex,tex,motionFrame?'Nieuwe stap':t?.kind==='repair'?'Foute regel':t?.kind==='verify'?'Voorgestelde oplossing':t?.kind==='predict'?stepText(t.operation.op,t.operation.operand,ex.policy):'Stap '+(trainerStates.length-1),animateNew);
}
function drawSteps(previous,tex,label,shift=false){
 const old=derivationStack.querySelector('.derivationMath')?.getBoundingClientRect();
 derivationStack.innerHTML=(previous?'<div class="previousEquation'+(shift?' motion-shift':'')+'"><span>Vorige stap</span>'+motionHTML(previous)+'</div>':'')+'<div class="derivationLine current motion-current'+(shift?' motion-arrive':'')+'"><div class="derivationAction">'+escapeHTML(label)+'</div><div class="derivationMath"></div></div>';
 const math=derivationStack.querySelector('.derivationMath');math.dataset.mathTex=tex;math.innerHTML=motionHTML(tex);
 if(shift&&old){const previousNode=derivationStack.querySelector('.previousEquation');if(previousNode)previousNode.style.setProperty('--step-distance',Math.max(0,old.top-previousNode.getBoundingClientRect().top)+'px');}
 fitMath();
}
function stopPresentation(){
 motionPlayer.cancel();lesson=null;motionFrame=null;document.body.classList.remove('demonstrating','step-playing','lesson-paused');$('#liveLessonPanel').hidden=true;derivationStack.setAttribute('aria-live','polite');$('#watchDemoBtn').hidden=false;
}
function onMotionFrame(frame,index){
 motionFrame=frame;
 if(lesson){lesson.frame=frame;renderLesson(!!frame.shift);}
 else{feedback.className='feedback';feedback.textContent=frame.caption;renderDerivation(index===0);}
}
function onMotionFinished(){
 if(lesson){lesson.finished=true;renderLesson();return;}
 motionFrame=null;document.body.classList.remove('step-playing');derivationStack.setAttribute('aria-live','polite');
 const st=trainerStepLog.at(-1);feedback.className='feedback'+(currentSolved?' good':'');feedback.textContent=L.causal(trainerStates.at(-2),currentEquation(),st.op,st.operand);renderTrainer();
 (currentSolved?$('#nextExerciseBtn'):$('#contextOperations button'))?.focus({preventScroll:true});
}
function startLesson(){
 if(motionPlayer.active&&!lesson)return;
 const fractionDemo=task()?.kind==='fractions'?(lesson?.fractionDemo||AlgebraFractions.demo(task(),AlgebraFractions.init(task(),result()),crypto.getRandomValues(new Uint32Array(1))[0])):null;
 if(fractionDemo&&!lesson&&result()){result().hints=Math.max(1,result().hints);result().supported=true;persist();}
 let example=fractionDemo?.ex||lesson?.ex;
 if(!example){
  const own=currentExercise();if(!own)return;
  for(let i=0;i<8;i++){example=AlgebraCore.generateSeeded(own.type,own.policy,0,crypto.getRandomValues(new Uint32Array(1))[0]);if(eqSig(example.start)!==eqSig(own.start))break;}
  if(result()){result().hints=Math.max(1,result().hints);result().supported=true;persist();}
 }
 motionPlayer.cancel();lesson={ex:example,frame:null,finished:false,fractionDemo};document.body.classList.add('demonstrating');document.body.classList.remove('step-playing');$('#liveLessonPanel').hidden=false;$('#watchDemoBtn').hidden=true;derivationStack.setAttribute('aria-live','off');
 let timeline=[{tex:latexEq(example.start,example.policy),previous:null,caption:'We maken x vrij. De gelijkheid blijft behouden.',step:0,delay:1600}];
 example.steps.forEach((st,i)=>{const record=AlgebraMotion.frames(example.states[i],st.op,st.operand,example.policy);record.frames.forEach((f,j)=>timeline.push({...f,previous:latexEq(example.states[i],example.policy),step:i+1,shift:j===0}));});
 if(fractionDemo){timeline=fractionDemo.timeline;lesson.total=fractionDemo.total;}
 if(task()?.kind==='verify'){timeline=AlgebraTouch.verifyDemo(example,example.solution.add(R(1)));lesson.total=timeline.at(-1).step;}
 motionPlayer.start(timeline);
}
function renderLesson(shift=false){
 if(!lesson)return;const frame=lesson.frame,ex=lesson.ex;
 document.body.classList.remove('touch-writing','fraction-writing');$('#touchAnswer').hidden=true;
 document.body.classList.toggle('lesson-paused',motionPlayer.paused);
 $('#taskGoal').textContent='Hulp · live voorbeeld';$('#trainProgress').textContent='Voorbeeld';$('#taskPrompt').textContent='Andere getallen · dezelfde aanpak';
 $('#givenEquation').dataset.mathTex=latexEq(ex.start,ex.policy);$('#givenEquation').innerHTML=texHTML($('#givenEquation').dataset.mathTex);
 drawSteps(frame?.previous||null,frame?.tex||latexEq(ex.start,ex.policy),'Stap '+(frame?.step||0),shift);
 $('#lessonCaption').textContent=lesson.finished?'Nu jij. Pas deze aanpak toe op je eigen opgave.':frame?.caption||'We beginnen met de opgave.';
 $('#lessonPhase').textContent='Stap '+(frame?.step||0)+' / '+(lesson.total||ex.steps.length)+' · '+(lesson.finished?'Voorbeeld klaar':motionPlayer.paused?'Gepauzeerd':'Live uitvoering');
 $('#lessonPauseBtn').textContent=motionPlayer.paused?'Verder':'Pauze';$('#lessonPauseBtn').disabled=lesson.finished;
 $('#lessonReturnBtn').textContent=lesson.finished?'Zelf proberen →':'Mijn opgave →';
}
$('#watchDemoBtn').onclick=startLesson;
$('#lessonReplayBtn').onclick=startLesson;
$('#lessonReturnBtn').onclick=()=>{stopPresentation();renderTrainer();$('#watchDemoBtn').focus({preventScroll:true});};
$('#lessonPauseBtn').onclick=()=>{if(motionPlayer.paused)motionPlayer.resume();else motionPlayer.pause();renderLesson();};
// Moving away never lets an unseen demo complete or a timer write to another task.
document.addEventListener('visibilitychange',()=>{if(document.hidden&&lesson&&motionPlayer.active){motionPlayer.pause();renderLesson();}});
function fitMath(){requestAnimationFrame(()=>{for(const el of document.querySelectorAll('#givenEquation,.derivationMath,.previousEquation,#historyEquation,.touchFieldMath,.fractionMath')){
 if(!el.getClientRects().length)continue;
 el.style.fontSize='';const base=parseFloat(getComputedStyle(el).fontSize);if(el.dataset.mathTex)el.innerHTML=motionHTML(el.dataset.mathTex);el.style.fontSize=base+'px';
 const m=el.querySelector('.katex');if(!m)continue;const width=m.getBoundingClientRect().width,limit=el.clientWidth-8;
 if(width>limit){el.style.fontSize=Math.max(el.classList.contains('previousEquation')?12:16,base*limit/width)+'px';if(m.getBoundingClientRect().width>limit&&el.dataset.mathTex){const parts=el.dataset.mathTex.split(' = ');if(parts.length===2)el.innerHTML=motionHTML('\\begin{aligned}&'+parts[0]+'\\\\={}&'+parts[1]+'\\end{aligned}');}}
 }});}
function touchNames(t){return t.kind==='verify'?['left','right']:t.kind==='build'?['input']:['lhs','rhs'];}
function touchValue(name){
 const t=task(),r=result();if(t.kind==='verify'||t.kind==='build')return r[name]||'';
 const p=(r.input||'').split('=');return p[name==='lhs'?0:1]||'';
}
function touchSet(name,value){
 const t=task(),r=result();if(t.kind==='verify'||t.kind==='build'){r[name]=value;return;}
 const p=[touchValue('lhs'),touchValue('rhs')];p[name==='lhs'?0:1]=value;r.input=p.join('=');
}
function touchBlocks(){
 const t=task(),r=result();if(!r.blocks)r.blocks=Object.fromEntries(touchNames(t).map(name=>[name,AlgebraTouch.blocksFromText(touchValue(name))]));return r.blocks;
}
function rememberBuild(){
 const r=result();r.buildHistory=r.buildHistory||[];r.buildHistory.push(JSON.parse(JSON.stringify({input:r.input,left:r.left,right:r.right,choice:r.choice,location:r.location,blocks:r.blocks,pendingSigns:r.pendingSigns||{},verifyPhase:r.verifyPhase})));if(r.buildHistory.length>24)r.buildHistory.shift();$('#undoBtn').disabled=false;
}
function renderTouchAnswer(){
 const t=task(),r=result(),host=$('#touchAnswer');host.hidden=false;
 if(t.kind==='fractions'){fractionView.renderAnswer(t,r);fitMath();return;}
 if(t.kind==='verify'){renderVerification();return;}
 const names=touchNames(t),blocks=touchBlocks();if(!names.includes(touchField))touchField=names[0];
 if(t.kind==='repair'&&r.location!=='group'&&!r.done){host.innerHTML='<div class="verifyCandidate"><small>Foute regel</small>'+texHTML(latexEq(t.fault,t.ex.policy))+'</div><p class="touchPrompt">Vergelijk met de haakjes bovenaan.</p>';return;}
 const labels={lhs:'Links',rhs:'Rechts',input:'Ontbrekend getal'};
 const context=t.kind==='repair'?'<div class="touchContext"><small>Foute regel</small>'+texHTML(latexEq(t.fault,t.ex.policy))+'</div>':'';
 host.innerHTML=context+'<div class="touchFields">'+names.map((name,i)=>(i?'<span class="touchEquals">=</span>':'')+'<button type="button" class="touchField" data-edit-field="'+name+'" aria-label="'+labels[name]+' bewerken" aria-keyshortcuts="'+(name==='lhs'?'L':name==='rhs'?'R':'')+'" aria-pressed="'+(name===touchField)+'" '+(r.done?'disabled':'')+'><small>'+labels[name]+(name===touchField&&!r.done?' · actief':'')+'</small><span class="touchFieldMath" data-answer-name="'+name+'"></span></button>').join('')+'</div><p class="touchPrompt">'+(r.done?'Jouw regel klopt.':'Kies een bouwsteen voor '+(touchField==='lhs'?'links':'rechts')+'.')+'</p>';
 if(t.kind==='build')host.querySelector('.touchPrompt').textContent=r.done?'Het getal klopt.':'Kies het getal dat in het vak past.';
 host.querySelectorAll('[data-answer-name]').forEach(el=>{const name=el.dataset.answerName,items=blocks[name]||[],base=items.length?AlgebraTouch.blockTex(items,t.ex.policy):touchValue(name)?AlgebraTouch.preview(touchValue(name)):'',sign=r.pendingSigns?.[name],tex=(base+(sign?' '+sign+' \\square':''))||'\\square';el.dataset.mathTex=tex;el.innerHTML=texHTML(tex);});
 host.querySelectorAll('[data-edit-field]').forEach(el=>el.onclick=()=>{touchField=el.dataset.editField;renderTouchAnswer();renderProduction();});fitMath();
}
function addTerm(item){
 const t=task(),r=result(),blocks=touchBlocks();if(t.kind!=='build'&&(blocks[touchField]||[]).length>=4){feedback.textContent='Gebruik ↶ of wis dit lid om een term te vervangen.';return;}
 const sign=r.pendingSigns?.[touchField];
 if(t.kind!=='build'&&blocks[touchField]?.length&&!sign){feedback.textContent='Kies eerst + of − tussen de termen.';return;}
 rememberBuild();const term=sign==='-'?AlgebraCore.negExpr(cloneExpr(item.expr)):cloneExpr(item.expr);
 blocks[touchField]=t.kind==='build'?[term]:[...(blocks[touchField]||[]),term];
 if(r.pendingSigns)delete r.pendingSigns[touchField];
 touchSet(touchField,AlgebraTouch.blockText(blocks[touchField]));feedback.textContent='';renderTouchAnswer();renderProduction();persist();
}
function chooseTermSign(sign){rememberBuild();const r=result();r.pendingSigns=r.pendingSigns||{};r.pendingSigns[touchField]=sign;feedback.textContent='Kies de volgende term.';renderTouchAnswer();renderProduction();persist();}
function clearTerms(){rememberBuild();touchBlocks()[touchField]=[];if(result().pendingSigns)delete result().pendingSigns[touchField];touchSet(touchField,'');renderTouchAnswer();renderProduction();persist();}
function verifyPhase(){return result().done?4:result().verifyPhase||0;}
function renderVerification(){
 const t=task(),r=result(),host=$('#touchAnswer'),phase=verifyPhase(),p=t.ex.policy,x=AlgebraCore.ratLatex(t.proposed,'auto',p);
 if(phase===0){host.innerHTML='<div class="verifyCandidate">'+texHTML('x = '+x)+'</div><p class="touchPrompt">Vul deze waarde in voor elke x.</p>';return;}
 const left=phase>=2||r.done?AlgebraCore.ratLatex(L.evaluate(t.ex.start.l,t.proposed),'auto',p):AlgebraTouch.substitution(t.ex.start.l,t.proposed,p);
 const right=phase>=3||r.done?AlgebraCore.ratLatex(L.evaluate(t.ex.start.r,t.proposed),'auto',p):AlgebraTouch.substitution(t.ex.start.r,t.proposed,p);
 host.innerHTML='<div class="verifyProof '+(phase===1||phase===2?'substituting':'')+'"><div class="proofLine '+(phase===1?'active':'')+'"><small>Links</small><span class="touchFieldMath" data-proof="left"></span></div><div class="proofLine '+(phase===2?'active':'')+'"><small>Rechts</small><span class="touchFieldMath" data-proof="right"></span></div></div><p class="touchPrompt">'+(phase>=3?'Testwaarde: x = '+escapeHTML(fallbackText(x)):'Dezelfde x-waarde is links en rechts ingevuld.')+'</p>';
 for(const [name,tex] of [['left',left],['right',right]]){const el=host.querySelector('[data-proof="'+name+'"]');el.dataset.mathTex=tex;el.innerHTML=motionHTML(tex);}fitMath();
}
function startVerification(){
 rememberBuild();const t=task(),r=result();r.verifyPhase=containsVar(t.ex.start.l)?1:containsVar(t.ex.start.r)?2:3;
 if(!containsVar(t.ex.start.l))r.left=AlgebraTouch.expressionText(N(L.evaluate(t.ex.start.l,t.proposed)));
 if(!containsVar(t.ex.start.r))r.right=AlgebraTouch.expressionText(N(L.evaluate(t.ex.start.r,t.proposed)));
 r.choice='';renderTrainer();
}
function chooseProofValue(item){
 const t=task(),r=result(),side=verifyPhase()===1?'left':'right',eqSide=side==='left'?'l':'r',actual=L.evaluate(t.ex.start[eqSide],t.proposed),value=item.expr.q;
 if(!value.eq(actual)){
  r.errors++;const a=L.affine(t.ex.start[eqSide]);
  const product=a.a.mul(t.proposed),other=L.evaluate(t.ex.start[side==='left'?'r':'l'],t.proposed);
  feedback.className='feedback bad';feedback.textContent=!a.b.isZero()&&value.eq(product)?'De vermenigvuldiging klopt. Reken ook de losse term mee.':value.eq(other)?'Die waarde hoort bij '+(side==='left'?'rechts':'links')+'. Reken het ingevulde '+(side==='left'?'linker':'rechter')+' lid uit.':a.a.n<0&&t.proposed.n<0&&value.eq(a.a.mul(t.proposed.neg()).add(a.b))?'Let op: min maal min geeft plus. Reken daarna verder.':'Controleer het teken en reken het volledige lid uit.';persist();return;
 }
 rememberBuild();r[side]=item.text;r.verifyPhase=side==='left'&&containsVar(t.ex.start.r)?2:3;r.choice='';feedback.className='feedback';feedback.textContent=side==='left'?'Links is uitgerekend.':'Rechts is uitgerekend.';renderTrainer();
}
function productionMessage(t,r,checked){
 if(t.kind==='verify'){
  if(!checked.ok)return 'Bekijk de twee waarden. Zijn ze hetzelfde?';
  const p=t.ex.policy,l=L.evaluate(t.ex.start.l,t.proposed),right=L.evaluate(t.ex.start.r,t.proposed),x=fallbackText(AlgebraCore.ratLatex(t.proposed,'auto',p));
  return 'Links: '+fallbackText(AlgebraCore.ratLatex(l,'auto',p))+'. Rechts: '+fallbackText(AlgebraCore.ratLatex(right,'auto',p))+'. '+(l.eq(right)?'Gelijk: x = '+x+' is een oplossing.':'Verschillend: x = '+x+' is geen oplossing.');
 }
 if(!checked.ok&&t.kind==='predict'&&r.input){try{const a=L.parseEquation(r.input);if(L.sameExpr(a.l,t.expected.l)&&L.sameExpr(a.r,t.ex.start.r)&&!L.sameExpr(t.expected.r,t.ex.start.r))return 'Je hebt links veranderd. Voer dezelfde bewerking ook rechts uit.';const own=L.affine(a.l),expected=L.affine(t.expected.l);if(!expected.a.isZero()&&own.a.eq(expected.a.neg()))return 'Behoud het minteken van de x-term.';}catch{}}
 return checked.message;
}
function renderProduction(){
 const t=task(),r=result(),form=$('#production');if(!t||t.kind==='solve'){form.classList.add('hidden');return;}form.classList.remove('hidden');
 form.classList.toggle('fractionProduction',t.kind==='fractions');
 if(t.kind==='fractions'){fractionView.renderControls(t,r);pageProduction();return;}
 const touch=touchKinds.includes(t.kind);form.classList.toggle('touchProduction',touch);let fields='';
 if(r.done)fields='';
 else if(t.kind==='routes')fields='<div class="routeChoices">'+t.routes.map((st,i)=>`<button type="button" class="operationChoice" data-route="${i}" data-op-kind="${operationKinds[st.op]}" aria-pressed="${r.choice===String(i)}" aria-keyshortcuts="${i+1}" aria-label="${escapeHTML(L.operationText(st,t.ex.policy))} op beide leden">${choiceMath(actionLatex(st.op,st.operand,t.ex.policy),i,operationNames[st.op])}</button>`).join('')+'</div>';
 else if(!r.done){
  if(t.kind==='verify'){
   const phase=verifyPhase();
   if(phase===0)fields='<button type="button" id="substituteBtn" class="primarybtn">Vervang x door '+texHTML(AlgebraCore.ratLatex(t.proposed,'auto',t.ex.policy))+'</button>';
   else if(phase===3)fields='<div class="verifyChoice"><button type="button" data-answer="yes">Gelijk '+texHTML('=')+'</button><button type="button" data-answer="no">Verschillend '+texHTML('\\ne')+'</button></div>';
   else{const options=AlgebraTouch.valueChoices(t,phase===1?'left':'right');fields='<p class="termLabel">Uitkomst '+(phase===1?'links':'rechts')+'</p><div class="termPalette">'+options.map((item,i)=>'<button type="button" class="termTile" data-proof-value="'+i+'" aria-keyshortcuts="'+(i+1)+'">'+choiceMath(item.tex,i)+'</button>').join('')+'</div>';}
  }else if(t.kind==='repair'&&r.location!=='group'){fields='<p class="termLabel">Waar zit de fout?</p><div class="faultChoices"><button type="button" data-location="group">Term uit de haakjes</button><button type="button" data-location="both">Rechter lid</button></div>';}else{
   const options=AlgebraTouch.palette(t),name=t.kind==='build'?'dit vak':touchField==='lhs'?'links':'rechts',sign=r.pendingSigns?.[touchField],needsSign=t.kind!=='build'&&touchBlocks()[touchField]?.length&&!sign;
   const signs=t.kind==='build'?'':'<div class="termSigns" role="group" aria-label="Teken voor de volgende bouwsteen">'+['+','-'].map(op=>'<button type="button" data-term-sign="'+op+'" data-op-kind="'+operationKinds[op]+'" aria-label="'+(op==='+'?'Volgende bouwsteen optellen':'Volgende bouwsteen aftrekken')+'" aria-keyshortcuts="'+op+'" aria-pressed="'+(sign===op)+'">'+(op==='+'?'+':'−')+'<small>term</small></button>').join('')+'</div>';
   fields='<div class="termHead"><span>'+ (t.kind==='build'?'Kies het getal':'Bouw '+name)+'</span>'+signs+'<button type="button" data-edit-action="clear">Wis</button></div><p class="termLabel" role="status">'+(needsSign?'Kies + of − voor de volgende bouwsteen.':sign==='-'?'Nieuwe term na −':sign==='+'?'Nieuwe term na +':'Kies een bouwsteen.')+'</p><div class="termPalette">'+options.map((item,i)=>'<button type="button" class="termTile" '+(needsSign?'disabled ':'')+'data-term="'+item.key+'" data-term-index="'+i+'" aria-keyshortcuts="'+(i+1)+'" aria-label="Voeg '+escapeHTML(fallbackText(latexExpr(sign==='-'?negExpr(item.expr):item.expr,t.ex.policy)))+' toe '+name+'">'+termChoice(item,sign,t.ex.policy,i)+'</button>').join('')+'</div>';
  }
 }
 form.innerHTML=fields+(r.done?'<p class="productionSuccess">✓ Opdracht afgerond</p>':touch?'':'<button class="primarybtn" type="submit">Controleer →</button>');
 form.querySelectorAll('[data-location]').forEach(b=>b.onclick=()=>{r.location=b.dataset.location;if(r.location!=='group'){r.errors++;feedback.className='feedback bad';feedback.textContent='Vergelijk elke term met de oorspronkelijke haakjes.';}renderTrainer();});
 form.querySelectorAll('[data-route],[data-answer]').forEach(b=>{b.disabled=r.done;b.onclick=()=>{r.choice=b.dataset.route??b.dataset.answer;if(t.kind==='verify')form.requestSubmit();else renderTrainer();};});
 form.querySelectorAll('[data-term-index]').forEach(b=>b.onclick=()=>addTerm(AlgebraTouch.palette(t)[Number(b.dataset.termIndex)]));
 form.querySelectorAll('[data-term-sign]').forEach(b=>b.onclick=()=>chooseTermSign(b.dataset.termSign));
 form.querySelector('[data-edit-action]')?.addEventListener('click',clearTerms);
 form.querySelector('#substituteBtn')?.addEventListener('click',startVerification);
 form.querySelectorAll('[data-proof-value]').forEach(b=>b.onclick=()=>chooseProofValue(AlgebraTouch.valueChoices(t,verifyPhase()===1?'left':'right')[Number(b.dataset.proofValue)]));
 pageProduction();
 form.onsubmit=e=>{e.preventDefault();if(r.done)return;try{
  if(t.kind==='verify'&&verifyPhase()!==3)return;
  if(['predict','repair','expand'].includes(t.kind)&&(!touchValue('lhs')||!touchValue('rhs'))){feedback.textContent='Vul links en rechts met bouwstenen.';return;}
  if(Object.values(r.pendingSigns||{}).some(Boolean)){feedback.textContent='Kies nog een term, of tik op ↶.';return;}
  const checked=L.validate(t,r);feedback.className='feedback '+(checked.ok?'good':checked.valid?'warn':'bad');feedback.textContent=productionMessage(t,r,checked);
  if(checked.ok){r.done=true;currentSolved=true;}else if(!checked.valid)r.errors++;renderTrainer();if(checked.ok)$('#nextExerciseBtn').focus({preventScroll:true});
 }catch(err){r.errors++;feedback.className='feedback bad';feedback.textContent=err.message;persist();}};
}
function renderTrainer(animateNew=false){
  if(lesson){renderLesson();return;}
  $('#watchDemoBtn').disabled=!!motionFrame;
  const ex=currentExercise();if(!ex)return;
  const eq=currentEquation(),t=task(),r=result(),production=!!t&&t.kind!=='solve';if(production)currentSolved=!!r.done;
  document.body.classList.toggle('touch-writing',!!t&&touchKinds.includes(t.kind));
  document.body.classList.toggle('fraction-writing',t?.kind==='fractions');
  const title=J.stop(mission)?.title||AlgebraWorld.topic(mission)?.title;$('#taskGoal').innerHTML=(title?'<small>'+escapeHTML(title)+'</small>':'')+escapeHTML(t?.kind==='verify'?'Test een x-waarde':t?t.stage.replace(/Schrijf/g,'Bouw'):'Maak x vrij');$('#solvedNote p').textContent=t&&t.kind!=='solve'?'Opdracht afgerond. Ga verder.':'x staat vrij. Ga verder.';$('#taskPrompt').textContent=t?.kind==='fractions'?AlgebraFractions.prompt(AlgebraFractions.init(t,r)):t?.kind==='verify'?AlgebraTouch.verifyPrompt(t,verifyPhase()):t?.kind==='repair'?(r.location==='group'?'Herstel de volledige regel met de bouwstenen.':'Welke term is fout uitgewerkt?'):t?t.prompt.replace(/Schrijf/g,'Bouw').replace(/×/g,'·'):'Doel: maak x vrij met dezelfde bewerking op beide leden.';
  $('#trainProgress').textContent=`${trainerIndex+1} / ${activeSet.length}`;
  renderDerivation(animateNew);
  trainProgress.textContent=`${trainerIndex+1} / ${activeSet.length}`;
  trainProgress.title=TYPES.find(t=>t.id===ex.type)?.label||ex.type;
  $('#operationTitle').textContent=currentSolved?'Afgerond':production?({predict:'Nieuwe regel',repair:'Herstel de regel',expand:'Werk de haakjes uit',build:'Vul aan',verify:'Controleer x',routes:'Kies je bewerking',fractions:'Breuken'})[t.kind]:manualOpen?'Eigen bewerking':'Op beide leden';
  $('#moreOperationsBtn').textContent=manualOpen?'Bij deze regel':'Eigen keuze';
  $('#moreOperationsBtn').hidden=currentSolved||production;
  $('#moreOperationsBtn').setAttribute('aria-expanded',String(manualOpen));
  $('#solvedNote').classList.toggle('hidden',!currentSolved);
  $('#manualOperations').classList.toggle('hidden',!manualOpen||currentSolved||production);
  $('#manualOperations').dataset.stage=selectedOp?'operand':'operation';
  const direct=$('#contextOperations');
  direct.classList.toggle('hidden',manualOpen||currentSolved||production);
  const operations=contextOperations(ex,eq);
  direct.innerHTML=operations.map((choice,i)=>`<button class="contextOp operationChoice ${choice.op==='*'||choice.op==='/'?'is-scale':''}" data-choice="${i}" data-op-kind="${operationKinds[choice.op]}" aria-keyshortcuts="${i+1}" aria-label="${escapeHTML(stepText(choice.op,choice.operand,ex.policy))}">${choiceMath(actionLatex(choice.op,choice.operand,ex.policy),i,operationNames[choice.op])}</button>`).join('');
  direct.querySelectorAll('.contextOp').forEach((button,i)=>button.onclick=()=>performOperation(operations[i].op,operations[i].operand));
  pageChoices(direct,'.contextOp','bewerkingskeuzes');

  document.querySelectorAll('.opBtn').forEach(b=>b.classList.toggle('active',b.dataset.op===selectedOp));
  if(selectedOp&&!currentSolved&&!production){
    const VALUE_PAGE_SIZE=compactControls()?2:6;
    const vals=candidateOperands(ex,eq,selectedOp);
    const pages=Math.ceil(vals.length/VALUE_PAGE_SIZE);valuePage=Math.max(0,Math.min(valuePage,pages-1));
    valueZone.classList.remove('hidden');
    $('#valueChoiceLabel span').textContent=({'+':'Wat tel je op?','-':'Wat trek je af?','*':'Waarmee vermenigvuldig je?','/':'Waardoor deel je?'})[selectedOp];
    valueGrid.innerHTML=vals.slice(valuePage*VALUE_PAGE_SIZE,(valuePage+1)*VALUE_PAGE_SIZE).map((v,i)=>`<button class="valueBtn" data-index="${valuePage*VALUE_PAGE_SIZE+i}" data-op-kind="${operationKinds[selectedOp]}" aria-keyshortcuts="${i+1}" aria-label="${escapeHTML(stepText(selectedOp,v,ex.policy))}">${choiceMath(actionLatex(selectedOp,v,ex.policy),i)}</button>`).join('');
    renderMathNodes(valueGrid);
    valueGrid.querySelectorAll('.valueBtn').forEach(btn=>btn.onclick=()=>performOperation(selectedOp,vals[Number(btn.dataset.index)]));
    $('#valuePages').hidden=pages<=1;
    $('#valuePageLabel').textContent=`Keuzes ${valuePage*VALUE_PAGE_SIZE+1}–${Math.min((valuePage+1)*VALUE_PAGE_SIZE,vals.length)} / ${vals.length}`;
    $('#prevValuesBtn').disabled=valuePage===0;$('#nextValuesBtn').disabled=valuePage>=pages-1;
  }else valueZone.classList.add('hidden');

  nextBox.classList.toggle('hidden',!currentSolved);
  $('#checkBtn').hidden=currentSolved||t?.kind==='fractions'&&r.fraction?.phase!=='build'||t?.kind==='verify'||t?.kind==='repair'&&r.location!=='group'||(production&&!touchKinds.includes(t.kind)&&!(compactControls()&&t.kind==='routes'));$('#production').classList.toggle('hidden',!production);if(production)renderProduction();
  $('#undoBtn').disabled=t?.kind==='fractions'?!r.fractionUndo?.length:production?!r.done&&!r.input&&!r.choice&&!r.buildHistory?.length:trainerStates.length<=1;$('#prevExerciseBtn').disabled=trainerIndex===0;$('#forwardExerciseBtn').disabled=trainerIndex>=activeSet.length-1||!!learningRun&&!r.done;
  document.querySelectorAll('.opBtn').forEach(b=>{b.disabled=currentSolved;b.setAttribute('aria-pressed',String(b.dataset.op===selectedOp));b.setAttribute('aria-label',({'+' :'Optellen','-':'Aftrekken','*':'Vermenigvuldigen','/':'Delen'})[b.dataset.op]+' aan beide kanten')});
  $('#nextExerciseBtn').textContent=trainerIndex===activeSet.length-1?(learningRun?'Missie afronden →':'Bekijk je reeks →'):t?.kind==='fractions'?'Volgende →':'Volgende oefening →';
  persist();
}
function startExercise(index){
  stopPresentation();
  rememberExercise();trainerIndex=index;const ex=currentExercise(),previous=perExercise[index];
  trainerStates=previous?.states?.length?previous.states.map(cloneEq):[cloneEq(ex.start)];trainerStepLog=previous?.log||[];selectedOp=null;currentSolved=task()&&task().kind!=='solve'?!!result().done:solvedEquation(currentEquation());
  manualOpen=false;valuePage=0;
  touchField=task()?touchNames(task())[0]:'lhs';
  feedback.className='feedback'+(currentSolved?' good':'');feedback.textContent=currentSolved?'Opdracht afgerond.':task()?.guided?'Je begint met zichtbare ondersteuning.':task()?'Probeer zelfstandig. Hulp blijft bereikbaar.':'Werk tot x alleen staat.';
  derivationStack.innerHTML='';
  renderTrainer(true);
}
const valueChoiceLabel=document.createElement('div');valueChoiceLabel.id='valueChoiceLabel';valueChoiceLabel.className='operandLabel';valueChoiceLabel.innerHTML='<span></span><button type="button" id="changeOperationBtn">Bewerking wijzigen</button>';valueZone.prepend(valueChoiceLabel);
$('#changeOperationBtn').onclick=()=>{selectedOp=null;valuePage=0;renderTrainer();$('#manualOperations .opBtn').focus({preventScroll:true});};
document.querySelectorAll('.opBtn').forEach(b=>{b.dataset.opKind=operationKinds[b.dataset.op];b.innerHTML='<span class="opSymbol" aria-hidden="true">'+({'+':'+','-':'−','*':'·','/':'÷'})[b.dataset.op]+'</span><small>'+operationNames[b.dataset.op]+'</small>';b.setAttribute('aria-keyshortcuts',b.dataset.op);b.onclick=()=>{
  if(currentSolved)return;
  manualOpen=true;valuePage=0;
  selectedOp=selectedOp===b.dataset.op?null:b.dataset.op;
  feedback.className='feedback';
  feedback.textContent='';
  renderTrainer();
};});
$('#moreOperationsBtn').onclick=()=>{manualOpen=!manualOpen;selectedOp=null;valuePage=0;renderTrainer()};
$('#prevValuesBtn').onclick=()=>{valuePage--;renderTrainer()};
$('#nextValuesBtn').onclick=()=>{valuePage++;renderTrainer()};
document.addEventListener('keydown',event=>{
 if(screen!=='trainer'||lesson||motionPlayer.active||event.repeat||event.ctrlKey||event.metaKey||event.altKey||document.querySelector('dialog[open]')||[...document.querySelectorAll('leraarbob-topbar')].some(host=>host.shadowRoot?.querySelector('dialog[open]')))return;
 // Account/menu controls (including the shared topbar's shadow DOM) keep their
 // own keyboard behavior. Exercise shortcuts are local to the workboard.
 if(event.target!==document.body&&event.target!==document.documentElement&&!trainerScreen.contains(event.target))return;
 if(event.composedPath().some(node=>node instanceof Element&&node.matches('input,textarea,select,[contenteditable="true"],dialog[open]')))return;
 const visible=el=>el&&el.getClientRects().length&&!el.closest('.hidden,[hidden]');
 let button=null;const key=event.key.toLowerCase(),t=task();
 if(/^[1-6]$/.test(key)){
  const choices=[...document.querySelectorAll('#contextOperations button,#valueGrid button,#production [data-term],#production [data-proof-value],#production [data-route],#production [data-answer],#production [data-fraction-route],#production [data-fraction-number],#production [data-fraction-operation],#production [data-fraction-index]')].filter(visible);
  button=choices[Number(key)-1];
 }else if(['+','-','*','/'].includes(key)){
  button=t?.kind==='fractions'?$('#production [data-fraction-sign="'+key+'"]'):t&&touchKinds.includes(t.kind)?$('#production [data-term-sign="'+key+'"]'):$('.opBtn[data-op="'+key+'"]');
  // The manual picker is the same control opened by its visible menu button.
  if(button?.classList.contains('opBtn')&&!currentSolved){manualOpen=true;$('#manualOperations').classList.remove('hidden');$('#manualOperations').dataset.stage='operation';}
 }else if(['l','r','='].includes(key)){
  const side=key==='='?(t?.kind==='fractions'?result().fraction?.field:touchField)==='lhs'?'rhs':'lhs':key==='l'?'lhs':'rhs';
  button=t?.kind==='fractions'?$('[data-fraction-field="'+side+'"]'):$('[data-edit-field="'+side+'"]');
 }else if(key==='backspace')button=$('#undoBtn');
 else if(key==='enter'&&!event.target.closest('button,a'))button=currentSolved?$('#nextExerciseBtn'):visible($('#substituteBtn'))?$('#substituteBtn'):visible($('#checkBtn'))?$('#checkBtn'):$('#production button[type="submit"]');
 else if(key==='pagedown')button=[...document.querySelectorAll('.choicePagination button:last-child,#nextValuesBtn')].find(visible);
 else if(key==='pageup')button=[...document.querySelectorAll('.choicePagination button:first-child,#prevValuesBtn')].find(visible);
 if(visible(button)&&!button.disabled){event.preventDefault();button.click();}
});
$('#checkBtn').onclick=()=>{
  if(task()&&(touchKinds.includes(task().kind)||task().kind==='routes')){$('#production').requestSubmit();return;}
  const checked=checkProgress(currentEquation());
  feedback.className='feedback'+(checked.solved?' good':'');feedback.textContent=checked.message;
};
function performOperation(op,operand){
  if(lesson||motionPlayer.active)return;
  const before=currentEquation();
  try{
    const record=AlgebraMotion.frames(before,op,operand,currentExercise().policy),after=record.after;
    trainerStates.push(after);trainerStepLog.push({op,operand:cloneExpr(operand)});selectedOp=null;manualOpen=false;valuePage=0;
    currentSolved=solvedEquation(after);

    feedback.className='feedback'+(currentSolved?' good':'');feedback.textContent=L.causal(before,after,op,operand);
    if(currentSolved){solvedTypes.add(currentExercise().type);if(result())result().done=true;}
    document.body.classList.add('step-playing');derivationStack.setAttribute('aria-live','off');
    motionFrame=record.frames[0];renderTrainer(true);motionPlayer.start(record.frames);
    (currentSolved?$('#nextExerciseBtn'):$('#contextOperations button'))?.focus({preventScroll:true});
  }catch(err){
    if(result())result().errors++;feedback.className='feedback bad';feedback.textContent=err.message;selectedOp=null;renderTrainer();
  }
}
$('#undoBtn').onclick=()=>{
  stopPresentation();
  if(task()?.kind==='fractions'){fractionView.undo();return;}
  if(task()&&task().kind!=='solve'){
   const r=result(),old=r.buildHistory?.pop();if(old){r.pendingSigns={};Object.assign(r,old);if(r.blocks)for(const name of Object.keys(r.blocks))r.blocks[name]=r.blocks[name].map(cloneExpr);}
   else{r.input='';r.left='';r.right='';r.choice='';r.location='';delete r.blocks;delete r.pendingSigns;r.verifyPhase=0;}
   r.done=false;currentSolved=false;feedback.textContent='Laatste keuze teruggenomen.';renderTrainer();return;
  }
  if(trainerStates.length<=1)return;
  if(result())result().done=false;trainerStates.pop();trainerStepLog.pop();selectedOp=null;manualOpen=false;valuePage=0;currentSolved=solvedEquation(currentEquation());
  feedback.className='feedback';feedback.textContent='Laatste stap ongedaan gemaakt.';
  renderTrainer();
};
$('#nextExerciseBtn').onclick=()=>{
  if(learningRun&&!result()?.done)return;
  if(trainerIndex<activeSet.length-1)startExercise(trainerIndex+1);
  else{
    if(learningRun){finishMission();}
    else{showScreen('setup');showSetupMessage('Reeks doorlopen. Kies een nieuwe reeks of herneem je oefeningen.');}
  }
};
$('#prevExerciseBtn').onclick=()=>{if(trainerIndex>0)startExercise(trainerIndex-1)};
$('#forwardExerciseBtn').onclick=()=>{if((!learningRun||result()?.done)&&trainerIndex<activeSet.length-1)startExercise(trainerIndex+1)};

/* ============================================================
   11. OEFENBLAD + VERBETERSLEUTEL
   ============================================================ */
function chunks(a,n){const out=[];for(let i=0;i<a.length;i+=n)out.push(a.slice(i,i+n));return out}
function qPage(items,page,total,startNo){
  return `<section class="paperPage">
    <div class="sheetHeader">
      <div><h2>Algebra · vergelijkingen</h2><p>Werk stap voor stap. Voer op beide leden dezelfde bewerking uit.</p></div>
      <div class="sheetMeta">Naam: ____________________<br>Klas: __________ &nbsp; Datum: __________</div>
    </div>
    <div class="exerciseGrid">
      ${items.map((ex,i)=>`<div class="exercise">
        <span class="nr">${startNo+i+1}.</span>
        <div class="q" data-tex="${escapeHTML(latexEq(ex.start,ex.policy))}"></div>
        <div class="writeLines"><span></span><span></span><span></span></div>
      </div>`).join('')}
    </div>
    <div class="pageFoot"><span>leraarBob · Algebra Trainer</span><span>Oefeningen ${page}/${total}</span></div>
  </section>`;
}
function keyPage(items,page,total,startNo){
  return `<section class="paperPage">
    <div class="sheetHeader">
      <div><h2>Verbetersleutel</h2><p>Eén nette standaardroute. Andere equivalente routes kunnen ook correct zijn.</p></div>
      <div class="sheetMeta">Algebra Trainer<br>verbetersleutel</div>
    </div>
    <div class="answerList">
      ${items.map((ex,i)=>`<div class="answerItem">
        <div class="title">${startNo+i+1}. <span data-tex="${escapeHTML(latexEq(ex.start,ex.policy))}"></span></div>
        ${ex.states.map((st,j)=>`<div class="keyStep">
          <div class="keyMath" data-tex="${escapeHTML(latexEq(st,ex.policy))}"></div>
          <div class="keyWhy">${j===0?'start':escapeHTML(stepText(ex.steps[j-1].op,ex.steps[j-1].operand,ex.policy))}</div>
        </div>`).join('')}
      </div>`).join('')}
    </div>
    <div class="pageFoot"><span>leraarBob · Algebra Trainer</span><span>Sleutel ${page}/${total}</span></div>
  </section>`;
}
function renderPreview(){
  archive?.refresh();
  const host=$('#previewStack');
  if(paperSelection?.run){renderMissionPaper(host,paperSelection.run,paperSelection.id);return;}
  if(!activeSet.length){host.innerHTML='';return}
  if(learningRun){renderMissionPaper(host);return;}
  const qs=chunks(activeSet,12);
  let html=qs.map((c,i)=>qPage(c,i+1,qs.length,i*12)).join('');
  if($('#includeKey').checked){
    const ks=chunks(activeSet,6);
    html+=ks.map((c,i)=>keyPage(c,i+1,ks.length,i*6)).join('');
  }
  host.innerHTML=html;renderMathNodes(host);
}
function renderMissionPaper(host,run=learningRun,id=mission,includeKey=$('#includeKey').checked,onlyKey=false){
 const tasks=run.tasks,title=J.stop(id)?.title||AlgebraWorld.topic(id)?.title||'Vergelijkingen';
 const header=(key)=>`<div class="sheetHeader"><div><h2>${key?'Verbetersleutel':'Vergelijkingen'} · ${escapeHTML(title)}</h2><p>${key?'De antwoorden horen bij deze opdrachten. Andere geldige oplosroutes zijn mogelijk.':'Lees elke opdracht. Schrijf je uitwerking en controle op.'}</p></div><div class="sheetMeta">Naam: __________________<br>Klas: ______ Datum: ______</div></div>`;
 let html=onlyKey?'':chunks(tasks,3).map((items,p)=>`<section class="paperPage missionPaper">${header(false)}<div class="missionQuestions">${items.map((t,i)=>{const q=AlgebraJourneyPaper.question(t);return `<article><h3>${p*3+i+1}. ${escapeHTML(q.prompt)}</h3><div data-tex="${escapeHTML(q.math)}"></div>${q.extra?'<p>'+escapeHTML(q.extra)+'</p>':''}<div class="writeLines"><span></span><span></span><span></span></div></article>`}).join('')}</div><div class="pageFoot">leraarBob · Opgaven ${p+1}/${Math.ceil(tasks.length/3)}</div></section>`).join('');
 if(includeKey)html+=chunks(tasks,3).map((items,p)=>`<section class="paperPage missionPaper">${header(true)}<div class="missionAnswers">${items.map((t,i)=>{const a=AlgebraJourneyPaper.answer(t);return `<article><h3>${p*3+i+1}. ${escapeHTML(t.stage)}</h3>${a.lines.map(l=>'<div data-tex="'+escapeHTML(l)+'"></div>').join('')}<p>${escapeHTML(a.note)}</p></article>`}).join('')}</div><div class="pageFoot">leraarBob · Sleutel ${p+1}/${Math.ceil(tasks.length/3)}</div></section>`).join('');
 host.innerHTML=html;renderMathNodes(host);
}
function worksheetSnapshot(){
 const run=paperSelection?.run||learningRun,id=paperSelection?.id||mission,questions=document.createElement('div'),key=document.createElement('div');
 if(run){renderMissionPaper(questions,run,id,false);renderMissionPaper(key,run,id,true,true);}
 else{if(!activeSet.length)throw Error('Maak eerst een oefenblad.');const qs=chunks(activeSet,12),ks=chunks(activeSet,6);questions.innerHTML=qs.map((c,i)=>qPage(c,i+1,qs.length,i*12)).join('');key.innerHTML=ks.map((c,i)=>keyPage(c,i+1,ks.length,i*6)).join('');renderMathNodes(questions);renderMathNodes(key);}
 const title=J.stop(id)?.title||AlgebraWorld.topic(id)?.title||'Vergelijkingen',data=JSON.parse(JSON.stringify(run?{tasks:run.tasks,version:run.version,seed:run.seed}:{exercises:activeSet}));
 let hash=2166136261;for(const char of questions.textContent)hash=Math.imul(hash^char.charCodeAt(0),16777619);
 return {sourceId:'algebra-trainer:equations',title:title+' · '+(run?.tasks.length||activeSet.length)+' oefeningen',theme:'algebra',topic:id||'equations',code:(hash>>>0).toString(36).toUpperCase(),questionsHTML:'<div class="previewStack">'+questions.innerHTML+'</div>',keyHTML:'<div class="previewStack">'+key.innerHTML+'</div>',styles:['shared/vendor/katex/katex.min.css','games/algebra-trainer/style.css','games/algebra-trainer/journey.css'],config:{level:id||activeLevel,settings:currentSettings()},data};
}
$('#printBtn').onclick=()=>{renderMathNodes(previewScreen);setTimeout(()=>window.print(),50)};
$('#backPaperLevels').onclick=()=>navigation.open();
function levelWorksheet(id,fresh=false){
 if(window.LeraarBobWorksheetEntry)return LeraarBobWorksheetEntry.open(id);
 const st=J.stop(id);if(!st)return;
 // Paper keeps its own generated series and never changes a live round or its input.
 const active=runs[id]&&!runs[id].completed?runs[id]:null;
 if(fresh||paperSelection?.id!==id||!paperSelection?.run)paperSelection={id,run:!fresh&&active?active:J.freshMission(id,fresh?paperSelection?.run:null,crypto.getRandomValues(new Uint32Array(1))[0])};
 archive?.invalidate();showScreen('preview');archive?.save(true);
}
$('#regenBtn').onclick=()=>{
  if(paperSelection){levelWorksheet(paperSelection.id,true);return;}
  const set=makeSet();if(!set)return;
  trainerStates=[];trainerIndex=0;
  archive?.invalidate();showScreen('preview');archive?.save(true);
};

/* ============================================================
   12. BEVESTIGEN
   ============================================================ */
$('#startTrainerBtn').onclick=()=>{
  const set=makeSet();if(!set)return;
  trainerStates=[];startExercise(0);showScreen('trainer');
};
$('#makeSheetBtn').onclick=()=>{
  const set=makeSet();if(!set)return;
  trainerStates=[];trainerIndex=0;archive?.invalidate();showScreen('preview');archive?.save(true);
};

/* ============================================================
   13. INIT
   ============================================================ */
function rememberExercise(){if(learningRun){learningRun.index=trainerIndex;learningRun.work=perExercise;}if(activeSet[trainerIndex]&&trainerStates.length)perExercise[trainerIndex]={states:trainerStates.map(cloneEq),log:trainerStepLog.map(s=>({op:s.op,operand:cloneExpr(s.operand)}))};}
function persist(){
 if(restoring||!window.AxiomaGame?.active)return;
 rememberExercise();
 const save={version:1,routeContext,chapterJourney,paperSelection,runs,freeSession,journey,worldLegacy,mission,mapLocation,activeLevel,selection,settings:currentSettings(),includeKey:$('#includeKey').checked,shuffle:$('#shuffleQuestions').checked,activeSet,trainerIndex,perExercise,solvedTypes:[...solvedTypes],screen,settingsDirty};
 AxiomaGame.storage.setItem(SAVE_KEY,JSON.stringify(save));let systems=null;try{systems=JSON.parse(AxiomaGame.storage.getItem('leraarbob.stelsels.workshop.v1')||'null')}catch{}const routeProgress=J.platform(chapterJourney,journey,systems?.journey);AxiomaGame.report(routeProgress.completed,routeProgress.total);
 const badge=$('#algebraProgress');badge.dataset.platformProgress='xp';badge.dataset.value=String(AlgebraWorld.xp(worldView?.progress()||journey)+J.xp(chapterJourney)+J.xp(systems?.roundJourney));badge.textContent=badge.dataset.value+' XP';
 AxiomaGame.emit(routeProgress.completed,routeProgress.total);
}
function restore(){
 restoring=true;
 try{
  const raw=AxiomaGame.storage.getItem(SAVE_KEY);if(!raw)return;
  const saved=JSON.parse(raw,(k,v)=>v&&typeof v==='object'&&Object.keys(v).length===2&&Number.isSafeInteger(v.n)&&Number.isSafeInteger(v.d)?new Rat(v.n,v.d):v);
  if(saved.version!==1)return;routeContext=saved.routeContext||{};
  runs=saved.runs&&typeof saved.runs==='object'?saved.runs:{};freeSession=saved.freeSession||null;
  chapterJourney=J.normalize(saved.chapterJourney);paperSelection=J.stop(saved.paperSelection?.id)&&saved.paperSelection?.run?.tasks?.length===6?saved.paperSelection:null;mapLocation=J.worldFor(saved.mapLocation);journey=AlgebraWorld.normalize(saved.journey);worldLegacy=(Array.isArray(saved.worldLegacy)?saved.worldLegacy:saved.solvedTypes||[]).filter(id=>TYPES.some(t=>t.id===id));mission=J.stop(saved.mission)||AlgebraWorld.topic(saved.mission)?.engine==='equations'?saved.mission:null;
  learningRun=mission&&runs[mission]?.version===2?runs[mission]:null;
  for(const t of TYPES){const s=saved.selection?.[t.id];if(s)selection[t.id]={checked:!!s.checked,count:Math.max(1,Math.min(20,Number(s.count)||1))}}
  activeLevel=Object.hasOwn(LEVEL_META,saved.activeLevel)?saved.activeLevel:'beginner';
  for(const id of ['allowFractions','allowDecimals','allowNegative'])$('#'+id).checked=!!saved.settings?.[id];
  $('#includeKey').checked=saved.includeKey!==false;$('#shuffleQuestions').checked=saved.shuffle!==false;
  solvedTypes=new Set((saved.solvedTypes||[]).filter(id=>TYPES.some(t=>t.id===id)));
  if(Array.isArray(saved.activeSet)&&saved.activeSet.length<=60&&saved.activeSet.every(e=>TYPES.some(t=>t.id===e.type)&&e.start&&Array.isArray(e.steps))){
   activeSet=saved.activeSet;perExercise=saved.perExercise||{};trainerIndex=Math.max(0,Math.min(activeSet.length-1,saved.trainerIndex||0));
   if(activeSet.length)startExercise(trainerIndex);
  }
  settingsDirty=saved.settingsDirty!==false;screen=saved.screen==='setup'&&!saved.journey?'world':['world','tools','setup','trainer','preview','summary','history','menu'].includes(saved.screen)&&(['world','tools','setup','menu'].includes(saved.screen)||saved.screen==='preview'&&paperSelection||activeSet.length)?saved.screen:'menu';
 }catch{activeSet=[];perExercise={};trainerStates=[];screen='menu';showSetupMessage('Je reeks kon niet worden hervat. Kies een nieuwe reeks.',true)}finally{restoring=false}
}
function startTopic(id){
 const t=J.stop(id)||AlgebraWorld.topic(id);if(!t||(!J.stop(id)&&t.engine!=='equations'))return;
 rememberExercise();if(learningRun)learningRun.work=perExercise;else if(!mission&&activeSet.length)freeSession={activeSet,perExercise,trainerIndex};
 mission=id;learningRun=runs[id];
 if(!learningRun||learningRun.completed){const seed=crypto.getRandomValues(new Uint32Array(1))[0];learningRun=J.freshMission(id,learningRun,seed);learningRun.rewardId=id+':'+crypto.randomUUID();learningRun.work={};runs[id]=learningRun;}
 activeSet=learningRun.tasks.map(t=>t.ex);perExercise=learningRun.work||{};trainerStates=[];
 const i=learningRun.results.findIndex(r=>!r.done);startExercise(i<0?activeSet.length-1:i);showScreen('trainer');
}
function resumeRoute(id){
 if(!id||id===mission)return !!activeSet.length;
 const saved=runs[id];if(saved?.version!==2)return false;
 rememberExercise();if(learningRun)learningRun.work=perExercise;
 mission=id;learningRun=saved;activeSet=saved.tasks.map(t=>t.ex);perExercise=saved.work||{};trainerStates=[];trainerIndex=Math.max(0,Math.min(activeSet.length-1,saved.index||0));startExercise(trainerIndex);return true;
}
function finishMission(){
 if(!learningRun||learningRun.results.some(r=>!r.done))return;if(learningRun.completed){renderSummary();showScreen('summary');return;}learningRun.completed=true;
 const reward=J.stop(mission)?J.record(chapterJourney,mission,learningRun.results,journey):AlgebraWorld.recordMission(journey,mission,learningRun.results,worldView.legacy());if(J.stop(mission))chapterJourney=reward.progress;else journey=reward.progress;const round=J.rewardRound(chapterJourney,mission,learningRun,learningRun.results,reward.xp);chapterJourney=round.progress;learningRun.lastReward=round.xp;renderSummary();showScreen('summary');
}
function recommended(){return J.next(chapterJourney,runs,journey,worldLegacy);}
function renderSummary(){
 if(!learningRun)return;
 const clean=learningRun.results.filter(r=>!r.supported&&!r.hints&&!r.errors),aided=learningRun.results.filter(r=>r.supported||r.hints),corrected=learningRun.results.filter(r=>r.errors),practice=learningRun.results.filter(r=>r.supported||r.hints||r.errors);
 const title=J.stop(mission)?.title||AlgebraWorld.topic(mission)?.title||'Vergelijkingen';
 const independent=J.independently(learningRun.results),next=recommended();
 $('#summaryContent').innerHTML=`<div class="summaryTitle"><h1><span class="summarySeal" aria-hidden="true">${independent?'★':'✓'}</span>${independent?'Zelfstandig gelukt':'Halte geoefend'}</h1><p>${escapeHTML(title)} · ${learningRun.tasks.length} opdrachten</p></div><p class="summaryFacts">${clean.length} zonder hulp of verbetering · ${aided.length} met hulp · ${corrected.length} antwoord${corrected.length===1?'':'en'} verbeterd${learningRun.lastReward?' · +'+learningRun.lastReward+' XP':''}</p><div class="summaryEvidence"><section><h2>Zelfstandig gelukt</h2>${clean.map(r=>`<p>✓ ${escapeHTML(r.goal)}</p>`).join('')||'<p>Herhaal om met minder hulp te oefenen.</p>'}</section><section><h2>Verder oefenen</h2>${practice.map(r=>`<p>${escapeHTML(r.goal)}${r.supported||r.hints?' · met hulp':''}${r.errors?' · na verbetering':''}</p>`).join('')||'<p>Alle opdrachten lukten zelfstandig.</p>'}</section></div><p class="summaryRecommendation">${!independent?'Je mag verder. Herhalen met minder hulp blijft beschikbaar.':next?'Volgende halte: '+escapeHTML(next.title):'Alle haltes voor vergelijkingen zijn geoefend. Ontdek Stelsels.'}</p>`;
 $('#summaryNextBtn').textContent=next?'Volgende halte →':'Naar Stelsels →';
}
$('#summaryReplayBtn').onclick=()=>startTopic(mission);
$('#summaryWorldBtn').onclick=()=>navigation.open();
$('#summaryNextBtn').onclick=()=>{const t=recommended();if(t)startTopic(t.id);else{worldView.open('systems');showScreen('world')}};
function historyEntries(){const t=task(),ex=currentExercise();return t?.kind==='fractions'?fractionView.history(t,result()):t&&touchKinds.includes(t.kind)?AlgebraTouch.history(t,result()):trainerStates.map((eq,i)=>({tex:latexEq(eq,ex.policy),caption:i?stepText(trainerStepLog[i-1].op,trainerStepLog[i-1].operand,ex.policy):'Oorspronkelijke opgave'}));}
function renderHistory(){const entries=historyEntries();historyIndex=Math.max(0,Math.min(entries.length-1,historyIndex));$('#historyPosition').textContent=`${historyIndex+1} / ${entries.length}`;$('#historyEquation').dataset.mathTex=entries[historyIndex].tex;$('#historyEquation').innerHTML=motionHTML(entries[historyIndex].tex);$('#historyAction').textContent=entries[historyIndex].caption;$('#historyPrevBtn').disabled=historyIndex===0;$('#historyNextBtn').disabled=historyIndex===entries.length-1;fitMath();}
$('#historyBtn').onclick=()=>{historyIndex=historyEntries().length-1;renderHistory();showScreen('history')};$('#closeHistoryBtn').onclick=()=>showScreen('trainer');$('#historyPrevBtn').onclick=()=>{historyIndex--;renderHistory()};$('#historyNextBtn').onclick=()=>{historyIndex++;renderHistory()};
$('#resumeFreeBtn').onclick=()=>{rememberExercise();if(learningRun)learningRun.work=perExercise;mission=null;learningRun=null;activeSet=freeSession.activeSet;perExercise=freeSession.perExercise;trainerStates=[];startExercise(freeSession.trainerIndex);showScreen('trainer')};
window.addEventListener('resize',fitMath);
compactQuery.addEventListener('change',()=>{if(screen==='trainer'&&!lesson&&!motionPlayer.active)renderTrainer();});
function init(){
  restore();
  worldView=AlgebraWorldView.mount({progress:()=>journey,chapter:()=>chapterJourney,runs:()=>runs,current:()=>mission,solved:()=>worldLegacy,location:()=>mapLocation,remember:id=>{mapLocation=id;persist();if(screen==='world')navigation?.sync();},run:id=>runs[id],canResume:()=>activeSet.length>0&&(!learningRun||!learningRun.completed),openWorld:id=>{if(id==='systems')AlgebraShell.openRoute(LeraarBobRoutes.href('games/algebra-trainer/stelsels.html',{gameId:'algebra-trainer',world:'systems',topic:'systems',level:'',screen:'menu'}));else navigation.open();},start:startTopic,resume:()=>{if(!trainerStates.length)startExercise(trainerIndex);showScreen('trainer')}});
  navigation=AlgebraNavigation.mount({
   activeLevel:()=>mission||'',routeResume:resumeRoute,routeApply:c=>{if(c.screen==='world'){if(c.world==='overview')worldView.open(null);else if(J.world(c.world)||AlgebraWorld.world(c.world))worldView.open(c.world);}},routeRead:()=>routeContext,routeSave:c=>{routeContext=c;persist();},routeWorld:()=>screen==='world'?(mapLocation||'overview'):'equations',screen:()=>screen,show:showScreen,canResume:()=>!!activeSet.length,canResumeFree:()=>mission?!!freeSession:!!activeSet.length,resumeFree:()=>mission?$('#resumeFreeBtn').click():showScreen('trainer'),
   navigate:name=>{if(name==='world'){if(mission)worldView.open(J.worldFor(mission));showScreen('world');}else if(name==='trainer'){if(activeSet.length){if(!trainerStates.length)startExercise(trainerIndex);showScreen('trainer');}}else if(name==='preview')levelWorksheet(navigation.selected());else showScreen(name);},
   title:()=>J.stop(mission)?.title||AlgebraWorld.topic(mission)?.title||'Bewaard werk',position:()=>activeSet.length?(trainerIndex+1)+' / '+activeSet.length:'',
   worksheet:levelWorksheet,world:()=> 'Vergelijkingen',stops:()=>J.stops.map((st,i)=>{const info=J.info(chapterJourney,st.id,runs,journey,worldLegacy);return {id:st.id,number:i+1,title:st.title,status:info.status,startId:info.activeId,total:info.total,current:st.id===mission||st.skills.some(k=>'eq-'+k===mission)};}),start:startTopic
  });
  // A fresh open lands on the designed menu; reloading keeps the current work screen.
  const navigationType=performance.getEntriesByType('navigation')[0]?.type;
  if(navigationType&&navigationType!=='reload')screen='menu';
  const params=new URLSearchParams(location.search),requestedWorld=params.get('world');if(J.world(requestedWorld)||AlgebraWorld.world(requestedWorld)){worldView.open(requestedWorld);if(performance.getEntriesByType('navigation')[0]?.type!=='reload')screen='world';}
  const requestedTopic=J.stop(params.get('topic'))||AlgebraWorld.topic(params.get('topic'));if((J.stop(requestedTopic?.id)||requestedTopic?.engine==='equations')&&!params.has('level')&&performance.getEntriesByType('navigation')[0]?.type!=='reload'){startTopic(requestedTopic.id);navigation.select(J.stop(requestedTopic.id)?.id||J.stops.find(st=>st.skills.includes(requestedTopic.skill))?.id);screen='trainer';}
  if(['setup','preview','tools','menu','world'].includes(params.get('screen')))screen=params.get('screen');
  if(J.stop(params.get('level')))navigation.select(params.get('level'));
  if(['trainer','history','summary'].includes(params.get('screen'))){screen=resumeRoute(params.get('activeLevel')||params.get('level'))?params.get('screen'):'menu';}
  navigation.connect();
  renderTypeLevel();updateTotal();refreshNav();if(screen==='summary')renderSummary();if(screen==='history'&&activeSet.length)renderHistory();showScreen(screen);
  /* Wanneer KaTeX later klaar is dan de app, render nogmaals zonder de toestand te wijzigen. */
  setTimeout(()=>{
    if(window.katex){
      renderMathNodes(document);
      if(!trainerScreen.classList.contains('hidden')&&trainerStates.length)renderTrainer();
      if(!previewScreen.classList.contains('hidden'))renderPreview();
    }
  },500);
}
init();
window.AlgebraTrainer=Object.freeze({animationSnapshot:()=>({active:motionPlayer.active,paused:motionPlayer.paused,index:motionPlayer.index||0,demo:!!lesson,finished:!!lesson?.finished,tex:motionFrame?.tex||null,example:lesson?{start:latexEq(lesson.ex.start,lesson.ex.policy),type:lesson.ex.type,steps:lesson.total||lesson.ex.steps.length}:null}),snapshot:()=>JSON.parse(JSON.stringify({screen,trainerIndex,activeSet,trainerStates,solvedTypes:[...solvedTypes],journey,chapterJourney,mission,runs,learningRun})),worksheetSnapshot});

})();
