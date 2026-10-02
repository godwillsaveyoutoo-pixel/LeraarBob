(()=>{
'use strict';
const {gcd,lcm,Rat,R,ratKey,reciprocal,terminatingPlaces,N,V,Add,Mul,Div,EQ,cloneExpr,cloneEq,isNum,isVar,num,linearCoeff,makeLinearTerm,simplify,negExpr,simplifyEq,exprSig,eqSig,exprNodeCount,equationComplexity,containsVar,countType,solvedEquation,operandIsNumeric,applyEquation,decimalText,hashRat,autoNumberFormat,ratLatex,splitSign,latexExpr,latexEq,operationLatex,fallbackText,texHTML,renderMathNodes,TYPES,LEVEL_META,INT_COEFF,INT_SHIFT,FRAC_COEFF,FRAC_SHIFT,DEC_COEFF,DEC_SHIFT,pick,chance,currentPolicy,pickFmt,pickParam,pickSolution,numNodeFromParam,nice,rhsFmt,positiveDifferentCoeffs,step,generateExercise,topTerms,absExpr,exprIsZero,collectNumericDenominators,outerScalar,operandRepresentable,canonicalStepAt,candidateOperands}=window.AlgebraCore;
const {contextOperations,checkProgress}=window.AlgebraWorkbench;
const L=AlgebraLearning;let runs={},learningRun=null,freeSession=null,historyIndex=0;
const selection={};
TYPES.forEach(t=>selection[t.id]={checked:t.level==='beginner',count:t.level==='beginner'?2:1});
let activeLevel='beginner';
let activeSet=[];
let trainerIndex=0;
let trainerStates=[];
let trainerStepLog=[];
let selectedOp=null;
let manualOpen=false,reminderOpen=false,valuePage=0;
const VALUE_PAGE_SIZE=2;
let currentSolved=false;
let settingsDirty=true;
let screen='world',restoring=false,perExercise={},solvedTypes=new Set();
let journey=AlgebraWorld.normalize(null),mission=null,worldView=null,worldLegacy=[],mapLocation=null;
const SAVE_KEY='leraarbob.algebra.v1';

const $=s=>document.querySelector(s);
const setupScreen=$('#setupScreen'),trainerScreen=$('#trainerScreen'),previewScreen=$('#previewScreen');
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
  const policy=currentSettings(),out=[];
  try{
    chosen.forEach(t=>{
      for(let i=0;i<selection[t.id].count;i++)out.push(generateExercise(t.id,policy,i));
    });
  }catch(err){
    showSetupMessage('De generator vond geen nette combinatie. Probeer opnieuw of kies minder uitzonderlijke opties.',true);
    return null;
  }
  if($('#shuffleQuestions').checked){
    for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
  }
  if(learningRun)learningRun.work=perExercise;mission=null;learningRun=null;activeSet=out;perExercise={};trainerStates=[];trainerIndex=0;settingsDirty=false;
  renderPreview();
  refreshNav();
  return out;
}

/* ============================================================
   9. NAVIGATIE
   ============================================================ */
function showScreen(name){
  screen=name;document.body.dataset.screen=name;
  $('#worldScreen').classList.toggle('hidden',name!=='world');
  $('#toolsScreen').classList.toggle('hidden',name!=='tools');
  if(name==='world')worldView?.render();$('#resumeFreeBtn').hidden=!freeSession;document.querySelectorAll('[data-nav]').forEach(b=>b.setAttribute('aria-current',b.dataset.nav===name?'page':'false'));
  setupScreen.classList.toggle('hidden',name!=='setup');
  trainerScreen.classList.toggle('hidden',name!=='trainer');
  previewScreen.classList.toggle('hidden',name!=='preview');
  $('#historyScreen').classList.toggle('hidden',name!=='history');$('#summaryScreen').classList.toggle('hidden',name!=='summary');
  document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));
  if(name==='preview'){renderPreview();renderMathNodes(previewScreen)}
  persist();
}
function refreshNav(){
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
  return `${op==='*'?'×':op==='/'?'÷':op==='-'?'−':'+'} ${fallbackText(latexExpr(operand,policy))} op beide leden`;
}
function actionLatex(op,operand,policy){
  const expression=latexExpr(operand,policy);
  const symbol=op==='*'?'\\times':op==='/'?'\\div':op==='-'?'-':'+';
  return `${symbol}\\;${operand.t==='add'?`\\left(${expression}\\right)`:expression}`;
}
function task(){return learningRun?.tasks[trainerIndex]||null}
function result(){return learningRun?.results[trainerIndex]||null}
function renderDerivation(){
  const ex=currentExercise();if(!ex)return;const t=task(),eq=currentEquation();
  $('#givenEquation').dataset.mathTex=t?.display||latexEq(ex.start,ex.policy);$('#givenEquation').innerHTML=texHTML($('#givenEquation').dataset.mathTex);
  const shown=t?.kind==='repair'?t.fault:t?.kind==='build'?null:eq;
  const previous=trainerStates.length>1?trainerStates.at(-2):null;
  derivationStack.innerHTML=(previous?`<div class="previousEquation"><span>Vorige · ${escapeHTML(stepText(trainerStepLog.at(-1).op,trainerStepLog.at(-1).operand,ex.policy))}</span>${texHTML(latexEq(previous,ex.policy))}</div>`:'')+`<div class="derivationLine current"><div class="derivationAction">${t?.kind==='repair'?'Foute regel':t?.kind==='verify'?'Voorgesteld: x = '+fallbackText(ratLatex(t.proposed,ex.policy)):t?.kind==='predict'?escapeHTML(stepText(t.operation.op,t.operation.operand,ex.policy)):'Nu'}</div><div class="derivationMath">${shown?texHTML(latexEq(shown,ex.policy)):texHTML(t.display)}</div></div>`;
  derivationStack.querySelector('.derivationMath').dataset.mathTex=shown?latexEq(shown,ex.policy):t.display;fitMath();
}
function fitMath(){requestAnimationFrame(()=>{for(const el of document.querySelectorAll('#givenEquation,.derivationMath,.previousEquation,#historyEquation')){
 if(!el.getClientRects().length)continue;
 el.style.fontSize='';const base=parseFloat(getComputedStyle(el).fontSize);if(el.dataset.mathTex)el.innerHTML=texHTML(el.dataset.mathTex);el.style.fontSize=base+'px';
 const m=el.querySelector('.katex');if(!m)continue;const width=m.getBoundingClientRect().width,limit=el.clientWidth-8;
 if(width>limit){el.style.fontSize=Math.max(16,base*limit/width)+'px';if(m.getBoundingClientRect().width>limit&&el.classList.contains('previousEquation')){el.hidden=true;continue;}if(m.getBoundingClientRect().width>limit&&el.dataset.mathTex){const parts=el.dataset.mathTex.split(' = ');if(parts.length===2){el.innerHTML=texHTML('\\begin{aligned}&'+parts[0]+'\\\\={}&'+parts[1]+'\\end{aligned}');const previous=$('.previousEquation');if(previous)previous.hidden=true;}}}
 }});}
function renderProduction(){
 const t=task(),r=result(),form=$('#production');if(!t||t.kind==='solve'){form.classList.add('hidden');return}form.classList.remove('hidden');
 let fields='';
 if(t.kind==='routes')fields=t.routes.map((st,i)=>`<button type="button" data-route="${i}" aria-pressed="${r.choice===String(i)}">${escapeHTML(L.operationText(st,t.ex.policy))} op beide leden</button>`).join('');
 else if(t.kind==='verify')fields=`<div class="verifyValues"><label>Links<input name="left" aria-label="Waarde linker lid" value="${escapeHTML(r.left)}" placeholder="getal"></label><label>Rechts<input name="right" aria-label="Waarde rechter lid" value="${escapeHTML(r.right)}" placeholder="getal"></label></div><div class="verifyChoice"><button type="button" data-answer="yes" aria-pressed="${r.choice==='yes'}">Klopt</button><button type="button" data-answer="no" aria-pressed="${r.choice==='no'}">Klopt niet</button></div>`;
 else {if(t.kind==='repair')fields=`<div class="faultChoices"><button type="button" data-location="group" aria-pressed="${r.location==='group'}">Term in groep</button><button type="button" data-location="both" aria-pressed="${r.location==='both'}">Rechter lid</button></div>`;fields+=`<label>${t.kind==='build'?'Getal in het vak':'Jouw volledige regel'}<input name="input" aria-label="${t.kind==='build'?'Getal in het vak':'Jouw nieuwe vergelijking'}" value="${escapeHTML(r.input)}" placeholder="${t.kind==='build'?'getal':'linker lid = rechter lid'}" autocomplete="off" spellcheck="false"></label>`;}
 form.innerHTML=fields+(r.done?'<p class="productionSuccess">✓ Opdracht afgerond</p>':'<button class="primarybtn" type="submit">Controleer →</button>');
 form.querySelectorAll('input').forEach(inp=>{inp.disabled=r.done;inp.oninput=()=>{r[inp.name]=inp.value;persist()}});
 form.querySelectorAll('[data-route],[data-answer],[data-location]').forEach(b=>{b.disabled=r.done;b.onclick=()=>{if(b.dataset.location)r.location=b.dataset.location;else r.choice=b.dataset.route??b.dataset.answer;renderTrainer()}});
 form.onsubmit=e=>{e.preventDefault();if(r.done)return;try{const checked=L.validate(t,r);feedback.className='feedback '+(checked.ok?'good':checked.valid?'warn':'bad');feedback.textContent=checked.message;if(checked.ok){r.done=true;currentSolved=true;}else r.errors++;renderTrainer();if(checked.ok)$('#nextExerciseBtn').focus({preventScroll:true});}catch(err){r.errors++;feedback.className='feedback bad';feedback.textContent=err.message;persist();}};
}
function renderTrainer(animateNew=false){
  const ex=currentExercise();if(!ex)return;
  const eq=currentEquation(),t=task(),r=result(),production=!!t&&t.kind!=='solve';if(production)currentSolved=!!r.done;
  $('#taskGoal').textContent=t?t.stage:'Maak x vrij';$('#taskPrompt').textContent=t?t.prompt:'Doel: maak x vrij met dezelfde bewerking op beide leden.';
  $('#trainProgress').textContent=`${trainerIndex+1} / ${activeSet.length}`;
  renderDerivation(animateNew);
  trainProgress.textContent=`${trainerIndex+1} / ${activeSet.length}`;
  trainProgress.title=TYPES.find(t=>t.id===ex.type)?.label||ex.type;
  $('#operationTitle').textContent=reminderOpen?'Een aanwijzing':currentSolved?'Afgerond':production?({predict:'Produceer de volgende regel',repair:'Lokaliseer en herstel',expand:'Werk zelf uit',build:'Bouw de vergelijking',verify:'Controleer door invullen',routes:'Vergelijk routes'})[t.kind]:manualOpen?'Bewerking op beide leden':'Kies een bewerking';
  $('#moreOperationsBtn').textContent=manualOpen?'Terug':'Andere';
  $('#moreOperationsBtn').hidden=reminderOpen||currentSolved||production;
  $('#moreOperationsBtn').setAttribute('aria-expanded',String(manualOpen));
  $('#reminderBtn').setAttribute('aria-expanded',String(reminderOpen));
  $('#algebraReminder').classList.toggle('hidden',!reminderOpen);
  $('#solvedNote').classList.toggle('hidden',!currentSolved||reminderOpen);
  $('#manualOperations').classList.toggle('hidden',!manualOpen||reminderOpen||currentSolved||production);
  const direct=$('#contextOperations');
  direct.classList.toggle('hidden',manualOpen||reminderOpen||currentSolved||production);
  const operations=contextOperations(ex,eq);if(t&&!t.guided&&!manualOpen&&!production&&!currentSolved){manualOpen=true;$('#manualOperations').classList.remove('hidden');direct.classList.add('hidden');$('#operationTitle').textContent='Taak: maak x vrij';}
  direct.innerHTML=operations.map((choice,i)=>`<button class="contextOp ${choice.op==='*'||choice.op==='/'?'is-scale':''}" data-choice="${i}" aria-label="${escapeHTML(stepText(choice.op,choice.operand,ex.policy))}">${texHTML(actionLatex(choice.op,choice.operand,ex.policy))}</button>`).join('');
  direct.querySelectorAll('.contextOp').forEach((button,i)=>button.onclick=()=>performOperation(operations[i].op,operations[i].operand));

  document.querySelectorAll('.opBtn').forEach(b=>b.classList.toggle('active',b.dataset.op===selectedOp));
  if(selectedOp&&!currentSolved&&!production){
    const vals=candidateOperands(ex,eq,selectedOp);
    const pages=Math.ceil(vals.length/VALUE_PAGE_SIZE);valuePage=Math.max(0,Math.min(valuePage,pages-1));
    valueZone.classList.remove('hidden');
    valueGrid.innerHTML=vals.slice(valuePage*VALUE_PAGE_SIZE,(valuePage+1)*VALUE_PAGE_SIZE).map((v,i)=>`<button class="valueBtn" data-index="${valuePage*VALUE_PAGE_SIZE+i}" aria-label="${escapeHTML(stepText(selectedOp,v,ex.policy))}"><span data-tex="${escapeHTML(latexExpr(v,ex.policy))}"></span></button>`).join('');
    renderMathNodes(valueGrid);
    valueGrid.querySelectorAll('.valueBtn').forEach(btn=>btn.onclick=()=>performOperation(selectedOp,vals[Number(btn.dataset.index)]));
    $('#valuePages').hidden=pages<=1;
    $('#valuePageLabel').textContent=`${valuePage+1} / ${pages}`;
    $('#prevValuesBtn').disabled=valuePage===0;$('#nextValuesBtn').disabled=valuePage>=pages-1;
  }else valueZone.classList.add('hidden');

  nextBox.classList.toggle('hidden',!currentSolved);
  $('#checkBtn').hidden=currentSolved||production;$('#production').classList.toggle('hidden',!production||reminderOpen);if(production&&!reminderOpen)renderProduction();
  if(reminderOpen){$('#hintText').textContent=t?L.hint(t,eq,Math.max(1,r.hints)):'Doe dezelfde bewerking op beide leden. Vermenigvuldig of deel met een getal dat niet nul is.';}
  $('#undoBtn').disabled=production?!r.done&&!r.input&&!r.choice:trainerStates.length<=1;$('#prevExerciseBtn').disabled=trainerIndex===0;$('#forwardExerciseBtn').disabled=trainerIndex>=activeSet.length-1||!!learningRun&&!r.done;
  document.querySelectorAll('.opBtn').forEach(b=>{b.disabled=currentSolved;b.setAttribute('aria-pressed',String(b.dataset.op===selectedOp));b.setAttribute('aria-label',({'+' :'Optellen','-':'Aftrekken','*':'Vermenigvuldigen','/':'Delen'})[b.dataset.op]+' aan beide kanten')});
  $('#nextExerciseBtn').textContent=trainerIndex===activeSet.length-1?(learningRun?'Missie afronden →':'Bekijk je reeks →'):'Volgende oefening →';
  persist();
}
function startExercise(index){
  rememberExercise();trainerIndex=index;const ex=currentExercise(),previous=perExercise[index];
  trainerStates=previous?.states?.length?previous.states.map(cloneEq):[cloneEq(ex.start)];trainerStepLog=previous?.log||[];selectedOp=null;currentSolved=task()&&task().kind!=='solve'?!!result().done:solvedEquation(currentEquation());
  manualOpen=false;reminderOpen=false;valuePage=0;
  feedback.className='feedback'+(currentSolved?' good':'');feedback.textContent=currentSolved?'Opdracht afgerond.':task()?.guided?'Je begint met zichtbare ondersteuning.':task()?'Probeer zelfstandig. Hulp blijft bereikbaar.':'Werk tot x alleen staat.';
  derivationStack.innerHTML='';
  renderTrainer(true);
}
document.querySelectorAll('.opBtn').forEach(b=>b.onclick=()=>{
  if(currentSolved)return;
  manualOpen=true;reminderOpen=false;valuePage=0;
  selectedOp=selectedOp===b.dataset.op?null:b.dataset.op;
  feedback.className='feedback';
  feedback.textContent=selectedOp?'Kies nu waarmee je die bewerking op beide leden uitvoert.':'Kies een bewerking.';
  renderTrainer();
});
$('#moreOperationsBtn').onclick=()=>{manualOpen=!manualOpen;selectedOp=null;valuePage=0;renderTrainer()};
$('#prevValuesBtn').onclick=()=>{valuePage--;renderTrainer()};
$('#nextValuesBtn').onclick=()=>{valuePage++;renderTrainer()};
$('#reminderBtn').onclick=()=>{reminderOpen=!reminderOpen;if(reminderOpen&&result()){result().hints=Math.max(1,result().hints);result().supported=true;}renderTrainer()};
$('#moreHintBtn').onclick=()=>{if(result()){result().hints++;result().supported=true;}renderTrainer()};
$('#checkBtn').onclick=()=>{
  const checked=checkProgress(currentEquation());
  feedback.className='feedback'+(checked.solved?' good':'');feedback.textContent=checked.message;
};
function performOperation(op,operand){
  const before=currentEquation();
  try{
    const after=applyEquation(before,op,operand);
    trainerStates.push(after);trainerStepLog.push({op,operand:cloneExpr(operand)});selectedOp=null;manualOpen=false;reminderOpen=false;valuePage=0;
    currentSolved=solvedEquation(after);

    feedback.className='feedback'+(currentSolved?' good':'');feedback.textContent=L.causal(before,after,op,operand);
    if(currentSolved){solvedTypes.add(currentExercise().type);if(result())result().done=true;}
    renderTrainer(true);
    (currentSolved?$('#nextExerciseBtn'):$('#contextOperations button'))?.focus({preventScroll:true});
  }catch(err){
    feedback.className='feedback bad';feedback.textContent=err.message;selectedOp=null;renderTrainer();
  }
}
$('#undoBtn').onclick=()=>{
  if(task()&&task().kind!=='solve'){result().done=false;result().input='';result().left='';result().right='';result().choice='';result().location='';currentSolved=false;feedback.textContent='Antwoord teruggenomen.';renderTrainer();return;}
  if(trainerStates.length<=1)return;
  if(result())result().done=false;trainerStates.pop();trainerStepLog.pop();selectedOp=null;manualOpen=false;reminderOpen=false;valuePage=0;currentSolved=solvedEquation(currentEquation());
  feedback.className='feedback';feedback.textContent='Laatste stap ongedaan gemaakt.';
  renderTrainer();
};
$('#nextExerciseBtn').onclick=()=>{
  if(trainerIndex<activeSet.length-1)startExercise(trainerIndex+1);
  else{
    if(learningRun){finishMission();}
    else{showScreen('setup');showSetupMessage('Reeks doorlopen. Kies een nieuwe reeks of herneem je oefeningen.');}
  }
};
$('#prevExerciseBtn').onclick=()=>{if(trainerIndex>0)startExercise(trainerIndex-1)};
$('#forwardExerciseBtn').onclick=()=>{if(trainerIndex<activeSet.length-1)startExercise(trainerIndex+1)};
$('#backSetupBtn').onclick=()=>{if(mission)worldView?.open(AlgebraWorld.topic(mission)?.world);showScreen('world');};

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
  const host=$('#previewStack');
  if(!activeSet.length){host.innerHTML='';return}
  const qs=chunks(activeSet,12);
  let html=qs.map((c,i)=>qPage(c,i+1,qs.length,i*12)).join('');
  if($('#includeKey').checked){
    const ks=chunks(activeSet,6);
    html+=ks.map((c,i)=>keyPage(c,i+1,ks.length,i*6)).join('');
  }
  host.innerHTML=html;renderMathNodes(host);
}
$('#printBtn').onclick=()=>{renderMathNodes(previewScreen);setTimeout(()=>window.print(),50)};
$('#regenBtn').onclick=()=>{
  const set=makeSet();if(!set)return;
  trainerStates=[];trainerIndex=0;
  showScreen('preview');
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
  trainerStates=[];trainerIndex=0;showScreen('preview');
};

/* ============================================================
   13. INIT
   ============================================================ */
function rememberExercise(){if(learningRun){learningRun.index=trainerIndex;learningRun.work=perExercise;}if(activeSet[trainerIndex]&&trainerStates.length)perExercise[trainerIndex]={states:trainerStates.map(cloneEq),log:trainerStepLog.map(s=>({op:s.op,operand:cloneExpr(s.operand)}))};}
function persist(){
 if(restoring||!window.AxiomaGame?.active)return;
 rememberExercise();
 const save={version:1,runs,freeSession,journey,worldLegacy,mission,mapLocation,activeLevel,selection,settings:currentSettings(),includeKey:$('#includeKey').checked,shuffle:$('#shuffleQuestions').checked,activeSet,trainerIndex,perExercise,solvedTypes:[...solvedTypes],screen,settingsDirty};
 AxiomaGame.storage.setItem(SAVE_KEY,JSON.stringify(save));let systems=null;try{systems=JSON.parse(AxiomaGame.storage.getItem('leraarbob.stelsels.workshop.v1')||'null')}catch{}const routeProgress=AlgebraWorld.platformProgress(AlgebraWorld.merge(journey,systems?.journey));AxiomaGame.report(routeProgress.completed,routeProgress.total);
 const badge=$('#algebraProgress');badge.dataset.platformProgress='xp';badge.dataset.value=String(AlgebraWorld.xp(worldView?.progress()||journey));badge.textContent=badge.dataset.value+' XP';
 AxiomaGame.emit(routeProgress.completed,routeProgress.total);
}
function restore(){
 restoring=true;
 try{
  const raw=AxiomaGame.storage.getItem(SAVE_KEY);if(!raw)return;
  const saved=JSON.parse(raw,(k,v)=>v&&typeof v==='object'&&Object.keys(v).length===2&&Number.isSafeInteger(v.n)&&Number.isSafeInteger(v.d)?new Rat(v.n,v.d):v);
  if(saved.version!==1)return;
  runs=saved.runs&&typeof saved.runs==='object'?saved.runs:{};freeSession=saved.freeSession||null;
  mapLocation=AlgebraWorld.world(saved.mapLocation)?.id||null;journey=AlgebraWorld.normalize(saved.journey);worldLegacy=(Array.isArray(saved.worldLegacy)?saved.worldLegacy:saved.solvedTypes||[]).filter(id=>TYPES.some(t=>t.id===id));mission=AlgebraWorld.topic(saved.mission)?.engine==='equations'?saved.mission:null;
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
  settingsDirty=saved.settingsDirty!==false;screen=saved.screen==='setup'&&!saved.journey?'world':['world','tools','setup','trainer','preview','summary','history'].includes(saved.screen)&&(['world','tools','setup'].includes(saved.screen)||activeSet.length)?saved.screen:'world';
 }catch{activeSet=[];perExercise={};trainerStates=[];screen='world';showSetupMessage('Je reeks kon niet worden hervat. Kies een nieuwe reeks.',true)}finally{restoring=false}
}
function startTopic(id){
 const t=AlgebraWorld.topic(id);if(!t||t.engine!=='equations'||!AlgebraWorld.unlocked(worldView.progress(),id,worldView.legacy()))return;
 rememberExercise();if(learningRun)learningRun.work=perExercise;else if(!mission&&activeSet.length)freeSession={activeSet,perExercise,trainerIndex};
 mission=id;learningRun=runs[id];
 if(!learningRun||learningRun.completed){learningRun=L.mission(t.skill,crypto.getRandomValues(new Uint32Array(1))[0]);learningRun.work={};runs[id]=learningRun;}
 activeSet=learningRun.tasks.map(t=>t.ex);perExercise=learningRun.work||{};trainerStates=[];
 const i=learningRun.results.findIndex(r=>!r.done);startExercise(i<0?4:i);showScreen('trainer');
}
function finishMission(){
 if(!learningRun||learningRun.results.some(r=>!r.done))return;learningRun.completed=true;
 const reward=AlgebraWorld.recordMission(journey,mission,learningRun.results,worldView.legacy());journey=reward.progress;renderSummary();showScreen('summary');
}
function recommended(){const next=AlgebraWorld.topics.find(t=>t.engine==='equations'&&t.requires.includes(mission)&&AlgebraWorld.unlocked(worldView.progress(),t.id,worldView.legacy())&&!worldView.progress().topics[t.id]?.finished);if(next)return next;return AlgebraWorld.topics.find(t=>t.engine==='equations'&&AlgebraWorld.unlocked(worldView.progress(),t.id,worldView.legacy())&&!worldView.progress().topics[t.id]?.finished);}
function renderSummary(){if(!learningRun)return;const independent=learningRun.results.filter(r=>!r.supported),aided=learningRun.results.filter(r=>r.supported);$('#summaryContent').innerHTML=`<div class="summaryTitle"><h1>Missie afgerond</h1><p>${escapeHTML(AlgebraWorld.topic(mission).title)} · 5 opdrachten</p></div><div class="summaryEvidence"><section><h2>Zelfstandig · ${independent.length}</h2>${independent.map(r=>`<p>✓ ${escapeHTML(r.goal)}${r.errors?' · na verbetering':''}</p>`).join('')||'<p>Deze ronde werkte je met ondersteuning.</p>'}</section><section><h2>Met ondersteuning · ${aided.length}</h2>${aided.map(r=>`<p>${escapeHTML(r.goal)}</p>`).join('')}</section></div><p class="summaryRecommendation">${independent.length<2?'Aanbevolen: herhaal deze halte met minder hulp.':recommended()?'Volgende halte: '+escapeHTML(recommended().title):'Je vergelijkingroute is afgerond. Ontdek nu stelsels.'}</p>`;}
$('#summaryWorldBtn').onclick=()=>{worldView.open(AlgebraWorld.topic(mission).world);showScreen('world')};
$('#summaryNextBtn').onclick=()=>{const repeat=learningRun.results.filter(r=>!r.supported).length<2,t=repeat?AlgebraWorld.topic(mission):recommended();if(t)startTopic(t.id);else{worldView.open('systems');showScreen('world')}};
function renderHistory(){const ex=currentExercise();historyIndex=Math.max(0,Math.min(trainerStates.length-1,historyIndex));$('#historyPosition').textContent=`${historyIndex+1} / ${trainerStates.length}`;$('#historyEquation').dataset.mathTex=latexEq(trainerStates[historyIndex],ex.policy);$('#historyEquation').innerHTML=texHTML($('#historyEquation').dataset.mathTex);$('#historyAction').textContent=historyIndex?stepText(trainerStepLog[historyIndex-1].op,trainerStepLog[historyIndex-1].operand,ex.policy):'Oorspronkelijke opgave';$('#historyPrevBtn').disabled=historyIndex===0;$('#historyNextBtn').disabled=historyIndex===trainerStates.length-1;fitMath();}
$('#historyBtn').onclick=()=>{historyIndex=trainerStates.length-1;renderHistory();showScreen('history')};$('#closeHistoryBtn').onclick=()=>showScreen('trainer');$('#historyPrevBtn').onclick=()=>{historyIndex--;renderHistory()};$('#historyNextBtn').onclick=()=>{historyIndex++;renderHistory()};
$('#resumeFreeBtn').onclick=()=>{rememberExercise();if(learningRun)learningRun.work=perExercise;mission=null;learningRun=null;activeSet=freeSession.activeSet;perExercise=freeSession.perExercise;trainerStates=[];startExercise(freeSession.trainerIndex);showScreen('trainer')};
window.addEventListener('resize',fitMath);
function init(){
  restore();
  worldView=AlgebraWorldView.mount({progress:()=>journey,solved:()=>worldLegacy,location:()=>mapLocation,remember:id=>{mapLocation=id;persist();},run:id=>runs[id],canResume:()=>activeSet.length>0&&(!learningRun||!learningRun.completed),start:startTopic,resume:()=>{if(!trainerStates.length)startExercise(trainerIndex);showScreen('trainer')}});
  const requestedWorld=new URLSearchParams(location.search).get('world');if(AlgebraWorld.world(requestedWorld)){worldView.open(requestedWorld);if(performance.getEntriesByType('navigation')[0]?.type!=='reload')screen='world';}
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
window.AlgebraTrainer=Object.freeze({snapshot:()=>JSON.parse(JSON.stringify({screen,trainerIndex,activeSet,trainerStates,solvedTypes:[...solvedTypes],journey,mission,runs,learningRun}))});

})();
