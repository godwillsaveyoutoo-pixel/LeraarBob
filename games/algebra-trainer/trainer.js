(()=>{
'use strict';
const {gcd,lcm,Rat,R,ratKey,reciprocal,terminatingPlaces,N,V,Add,Mul,Div,EQ,cloneExpr,cloneEq,isNum,isVar,num,linearCoeff,makeLinearTerm,simplify,negExpr,simplifyEq,exprSig,eqSig,exprNodeCount,equationComplexity,containsVar,countType,solvedEquation,operandIsNumeric,applyEquation,decimalText,hashRat,autoNumberFormat,ratLatex,splitSign,latexExpr,latexEq,operationLatex,fallbackText,texHTML,renderMathNodes,TYPES,LEVEL_META,INT_COEFF,INT_SHIFT,FRAC_COEFF,FRAC_SHIFT,DEC_COEFF,DEC_SHIFT,pick,chance,currentPolicy,pickFmt,pickParam,pickSolution,numNodeFromParam,nice,rhsFmt,positiveDifferentCoeffs,step,generateExercise,topTerms,absExpr,exprIsZero,collectNumericDenominators,outerScalar,operandRepresentable,canonicalStepAt,candidateOperands}=window.AlgebraCore;
const selection={};
TYPES.forEach(t=>selection[t.id]={checked:t.level==='beginner',count:t.level==='beginner'?2:1});
let activeLevel='beginner';
let activeSet=[];
let trainerIndex=0;
let trainerStates=[];
let trainerStepLog=[];
let selectedOp=null;
let currentSolved=false;
let settingsDirty=true;
let screen='setup',restoring=false,perExercise={},solvedTypes=new Set();
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
  activeSet=out;perExercise={};trainerStates=[];trainerIndex=0;settingsDirty=false;
  renderPreview();
  refreshNav();
  return out;
}

/* ============================================================
   9. NAVIGATIE
   ============================================================ */
function showScreen(name){
  screen=name;document.body.dataset.screen=name;document.querySelectorAll('[data-nav]').forEach(b=>b.setAttribute('aria-current',b.dataset.nav===name?'page':'false'));
  setupScreen.classList.toggle('hidden',name!=='setup');
  trainerScreen.classList.toggle('hidden',name!=='trainer');
  previewScreen.classList.toggle('hidden',name!=='preview');
  document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===name));
  if(name==='preview'){renderPreview();renderMathNodes(previewScreen)}
  persist();
}
function refreshNav(){
  document.querySelectorAll('[data-nav=trainer],[data-nav=preview]').forEach(b=>b.setAttribute('aria-disabled',String(!activeSet.length)));
}
document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{
  const name=b.dataset.nav;
  if(name==='setup'){showScreen('setup');return}
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
function renderDerivation(animateNew=false){
  const ex=currentExercise();if(!ex)return;
  derivationStack.replaceChildren();
  trainerStates.forEach((eq,i)=>{
    const line=document.createElement('div');line.className='derivationLine '+(i===trainerStates.length-1?'current':'past');
    if(i){const action=document.createElement('div');action.className='derivationAction';action.textContent=stepText(trainerStepLog[i-1].op,trainerStepLog[i-1].operand,ex.policy);line.append(action)}
    const math=document.createElement('div');math.className='derivationMath';math.innerHTML=texHTML(latexEq(eq,ex.policy));line.append(math);derivationStack.append(line);
  });
  if(animateNew)requestAnimationFrame(()=>{derivationStack.scrollTop=derivationStack.scrollHeight});
}
function renderTrainer(animateNew=false){
  const ex=currentExercise();if(!ex)return;
  const eq=currentEquation();
  renderDerivation(animateNew);
  trainProgress.textContent=`${trainerIndex+1} / ${activeSet.length} · ${TYPES.find(t=>t.id===ex.type)?.label||ex.type}`;

  document.querySelectorAll('.opBtn').forEach(b=>b.classList.toggle('active',b.dataset.op===selectedOp));
  if(selectedOp&&!currentSolved){
    const vals=candidateOperands(ex,eq,selectedOp);
    valueZone.classList.remove('hidden');
    valueGrid.innerHTML=vals.map((v,i)=>`<button class="valueBtn" data-index="${i}"><span data-tex="${escapeHTML(latexExpr(v,ex.policy))}"></span></button>`).join('');
    renderMathNodes(valueGrid);
    valueGrid.querySelectorAll('.valueBtn').forEach((btn,i)=>btn.onclick=()=>performOperation(selectedOp,vals[i]));
  }else valueZone.classList.add('hidden');

  nextBox.classList.toggle('hidden',!currentSolved);
  $('#undoBtn').disabled=trainerStates.length<=1;$('#prevExerciseBtn').disabled=trainerIndex===0;$('#forwardExerciseBtn').disabled=trainerIndex>=activeSet.length-1;
  document.querySelectorAll('.opBtn').forEach(b=>{b.disabled=currentSolved;b.setAttribute('aria-pressed',String(b.dataset.op===selectedOp));b.setAttribute('aria-label',({'+' :'Optellen','-':'Aftrekken','*':'Vermenigvuldigen','/':'Delen'})[b.dataset.op]+' aan beide kanten')});
  $('#nextExerciseBtn').textContent=trainerIndex===activeSet.length-1?'Bekijk je reeks →':'Volgende oefening →';
  persist();
}
function startExercise(index){
  rememberExercise();trainerIndex=index;const ex=currentExercise(),previous=perExercise[index];
  trainerStates=previous?.states?.length?previous.states.map(cloneEq):[cloneEq(ex.start)];trainerStepLog=previous?.log||[];selectedOp=null;currentSolved=solvedEquation(currentEquation());
  feedback.className='feedback';feedback.textContent='Kies een bewerking.';
  derivationStack.innerHTML='';
  renderTrainer();
}
document.querySelectorAll('.opBtn').forEach(b=>b.onclick=()=>{
  if(currentSolved)return;
  selectedOp=selectedOp===b.dataset.op?null:b.dataset.op;
  feedback.className='feedback';
  feedback.textContent=selectedOp?'Kies nu waarmee je die bewerking op beide leden uitvoert.':'Kies een bewerking.';
  renderTrainer();
});
function performOperation(op,operand){
  const before=currentEquation(),beforeScore=equationComplexity(before);
  try{
    const after=applyEquation(before,op,operand);
    trainerStates.push(after);trainerStepLog.push({op,operand:cloneExpr(operand)});selectedOp=null;
    currentSolved=solvedEquation(after);

    if(currentSolved){
      solvedTypes.add(currentExercise().type);feedback.className='feedback good';feedback.textContent='Juist. x staat vrij.';
    }else{
      const afterScore=equationComplexity(after);
      if(afterScore<beforeScore){
        feedback.className='feedback good';feedback.textContent='Geldige stap. De structuur is eenvoudiger geworden.';
      }else if(afterScore===beforeScore){
        feedback.className='feedback';feedback.textContent='Geldige stap. De gelijkheid blijft behouden.';
      }else{
        feedback.className='feedback warn';feedback.textContent='Geldig, maar je maakt de vergelijking voorlopig complexer.';
      }
    }
    renderTrainer(true);
  }catch(err){
    feedback.className='feedback bad';feedback.textContent=err.message;selectedOp=null;renderTrainer();
  }
}
$('#undoBtn').onclick=()=>{
  if(trainerStates.length<=1)return;
  trainerStates.pop();trainerStepLog.pop();selectedOp=null;currentSolved=solvedEquation(currentEquation());
  feedback.className='feedback';feedback.textContent='Laatste stap ongedaan gemaakt.';
  renderTrainer();
};
$('#nextExerciseBtn').onclick=()=>{
  if(trainerIndex<activeSet.length-1)startExercise(trainerIndex+1);
  else{
    showScreen('setup');showSetupMessage('Reeks doorlopen. Kies een nieuwe reeks of herneem je oefeningen.');
  }
};
$('#prevExerciseBtn').onclick=()=>{if(trainerIndex>0)startExercise(trainerIndex-1)};
$('#forwardExerciseBtn').onclick=()=>{if(trainerIndex<activeSet.length-1)startExercise(trainerIndex+1)};
$('#backSetupBtn').onclick=()=>{
  showScreen('setup');
  showSetupMessage('Je huidige bevestigde reeks blijft bestaan. Pas je keuzes aan en bevestig onderaan om ze te vervangen.');
};

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
function rememberExercise(){if(activeSet[trainerIndex]&&trainerStates.length)perExercise[trainerIndex]={states:trainerStates.map(cloneEq),log:trainerStepLog.map(s=>({op:s.op,operand:cloneExpr(s.operand)}))};}
function persist(){
 if(restoring||!window.AxiomaGame?.active)return;
 rememberExercise();
 const save={version:1,activeLevel,selection,settings:currentSettings(),includeKey:$('#includeKey').checked,shuffle:$('#shuffleQuestions').checked,activeSet,trainerIndex,perExercise,solvedTypes:[...solvedTypes],screen,settingsDirty};
 AxiomaGame.storage.setItem(SAVE_KEY,JSON.stringify(save));AxiomaGame.report([...solvedTypes],TYPES.length);
 const badge=$('#algebraProgress');badge.dataset.value=String(solvedTypes.size);badge.textContent=solvedTypes.size+'/'+TYPES.length+' oefenvormen geoefend';
 AxiomaGame.emit([...solvedTypes],TYPES.length);
}
function restore(){
 restoring=true;
 try{
  const raw=AxiomaGame.storage.getItem(SAVE_KEY);if(!raw)return;
  const saved=JSON.parse(raw,(k,v)=>v&&typeof v==='object'&&Object.keys(v).length===2&&Number.isSafeInteger(v.n)&&Number.isSafeInteger(v.d)?new Rat(v.n,v.d):v);
  if(saved.version!==1)return;
  for(const t of TYPES){const s=saved.selection?.[t.id];if(s)selection[t.id]={checked:!!s.checked,count:Math.max(1,Math.min(20,Number(s.count)||1))}}
  activeLevel=Object.hasOwn(LEVEL_META,saved.activeLevel)?saved.activeLevel:'beginner';
  for(const id of ['allowFractions','allowDecimals','allowNegative'])$('#'+id).checked=!!saved.settings?.[id];
  $('#includeKey').checked=saved.includeKey!==false;$('#shuffleQuestions').checked=saved.shuffle!==false;
  solvedTypes=new Set((saved.solvedTypes||[]).filter(id=>TYPES.some(t=>t.id===id)));
  if(Array.isArray(saved.activeSet)&&saved.activeSet.length<=60&&saved.activeSet.every(e=>TYPES.some(t=>t.id===e.type)&&e.start&&Array.isArray(e.steps))){
   activeSet=saved.activeSet;perExercise=saved.perExercise||{};trainerIndex=Math.max(0,Math.min(activeSet.length-1,saved.trainerIndex||0));
   if(activeSet.length)startExercise(trainerIndex);
  }
  settingsDirty=saved.settingsDirty!==false;screen=['setup','trainer','preview'].includes(saved.screen)&&activeSet.length?saved.screen:'setup';
 }catch{activeSet=[];perExercise={};trainerStates=[];screen='setup';showSetupMessage('Je reeks kon niet worden hervat. Kies een nieuwe reeks.',true)}finally{restoring=false}
}
function init(){
  restore();renderTypeLevel();updateTotal();refreshNav();showScreen(screen);
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
window.AlgebraTrainer=Object.freeze({snapshot:()=>JSON.parse(JSON.stringify({screen,trainerIndex,activeSet,trainerStates,solvedTypes:[...solvedTypes]}))});

})();
