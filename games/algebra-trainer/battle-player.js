(()=>{'use strict';
const C=AlgebraCore,S=StelselsCore,G=BattleGame,B=BattlePlayer,host=document.getElementById('work'),status=document.getElementById('status');
let task,spec,states=[],operations=[],selected=null,locked=true,view='answer',operandPage=0,historyIndex=0,draft={};
const math=tex=>`<span data-tex="${C.escapeHTML(tex)}"></span>`,eq=value=>math(C.latexEq(value,task.policy)),current=()=>states.at(-1),system=()=>task.topic==='systems';
const key=()=>`algebra-class-work:${spec.learner||'guest'}:${spec.match}:${spec.index}`;
function readDraft(){for(const id of system()?['answerX','answerY']:['answer']){const input=document.getElementById(id);if(input)draft[id]=input.value;}}
function save(){if(spec.projector)return;readDraft();try{localStorage.setItem(key(),JSON.stringify({operations,value:draft.answer||'',x:draft.answerX||'',y:draft.answerY||'',view}));}catch{}}
function solvedValue(){const e=current();if(!C.solvedEquation(e))return '';const q=e.l.t==='var'?e.r.q:e.l.q;return q.d===1?String(q.n):q.n+'/'+q.d;}
function fitMath(){requestAnimationFrame(()=>{for(const el of host.querySelectorAll('.given,.working-equation,.history-equation')){el.style.fontSize='';const base=parseFloat(getComputedStyle(el).fontSize),k=el.querySelector('.katex');if(!k)continue;const range=document.createRange();range.selectNodeContents(k.querySelector('.katex-html')||k);const width=Math.max(k.getBoundingClientRect().width,k.scrollWidth,range.getBoundingClientRect().width),available=el.clientWidth-8;if(available>0&&width>available)el.style.fontSize=Math.max(18,base*available/width)+'px';}});}
function setView(next){readDraft();view=next;selected=null;render();save();}
function answerForm(){
 const fields=system()?`<div class="xy-answer"><label class="answer-label" for="answerX"><span>x =</span><input id="answerX" aria-label="Waarde van x" value="${C.escapeHTML(draft.answerX||'')}"></label><label class="answer-label" for="answerY"><span>y =</span><input id="answerY" aria-label="Waarde van y" value="${C.escapeHTML(draft.answerY||'')}"></label></div>`:`<label class="answer-label" for="answer"><span>x =</span><input id="answer" aria-label="Waarde van x" value="${C.escapeHTML(draft.answer||'')}"></label>`;
 return `<form id="answerForm"><fieldset id="controls" ${locked?'disabled':''}><legend class="sr-only">Jouw antwoord</legend>${fields}<p id="inputError" role="alert"></p><div class="answer-actions"><button class="primary" id="submit">Indienen →</button>${!system()?'<button type="button" id="steps">Tussenstappen</button>':''}</div></fieldset></form>`;
}
function stepControls(){
 if(view==='history')return `<section class="step-controls"><p class="step-heading">Stap ${historyIndex+1} / ${states.length}</p><div class="history-actions"><button type="button" id="historyPrev" aria-label="Vorige stap" ${historyIndex===0?'disabled':''}>←</button><button type="button" id="historyNext" aria-label="Volgende stap" ${historyIndex===states.length-1?'disabled':''}>→</button><button type="button" data-view="steps">Bewerken</button></div><button type="button" data-view="answer">Antwoord →</button></section>`;
 const controls=selected?(()=>{const values=C.candidateOperands(task,current(),selected),maxPage=Math.max(0,Math.ceil(values.length/4)-1);operandPage=Math.min(operandPage,maxPage);return `<div class="operand-grid">${values.slice(operandPage*4,operandPage*4+4).map((v,i)=>`<button type="button" data-value="${operandPage*4+i}">${math(C.latexExpr(v,task.policy))}</button>`).join('')}</div><div class="choice-actions"><button type="button" id="cancelOperation">← Bewerking</button><button type="button" id="choicePrev" aria-label="Vorige keuzes" ${operandPage===0?'disabled':''}>←</button><button type="button" id="choiceNext" aria-label="Meer keuzes" ${operandPage===maxPage?'disabled':''}>→</button></div>`;})():`<div class="op-buttons" role="group" aria-label="Bewerk beide leden">${[['+','+','Optellen'],['-','−','Aftrekken'],['*','×','Vermenigvuldigen'],['/','÷','Delen']].map(([op,symbol,label])=>`<button type="button" data-op="${op}" aria-label="${label} aan beide leden"><span>${symbol}</span><small>${label}</small></button>`).join('')}</div><div class="step-actions"><button type="button" id="undo" ${!operations.length?'disabled':''}>↶ Terug</button><button type="button" id="history">Stappen (${operations.length})</button><button type="button" data-view="answer">Antwoord →</button></div>`;
 return `<section class="step-controls"><fieldset id="controls" ${locked?'disabled':''}><legend class="sr-only">Tussenstappen</legend>${controls}<p id="inputError" role="alert"></p></fieldset></section>`;
}
function render(){
 host.dataset.round=String(spec.index);host.dataset.topic=system()?'systems':'equations';
 host.className=spec.projector?'projector':system()?'system-board':view==='answer'?'answer-board':'steps-board';
 const given=system()?math(S.systemTex(task.start)):eq(spec.projector||!operations.length?task.start:current());
 const paper=view==='history'&&!system()?`<section class="paper"><h1>Jouw stappen</h1><div class="history-equation">${eq(states[historyIndex])}</div><p class="step-operation">${historyIndex?math(C.operationLatex(operations[historyIndex-1].op,operations[historyIndex-1].operand,task.policy)):'Start'}</p></section>`:`<section class="paper"><h1>${system()?'Los het stelsel op':view==='answer'?'Los de vergelijking op':selected?{'+':'Tel op aan beide leden','-':'Trek af van beide leden','*':'Vermenigvuldig beide leden','/':'Deel beide leden'}[selected]:'Bewerk beide leden'}</h1><div class="given">${given}</div></section>`;
 host.innerHTML=paper+(spec.projector?'':view==='answer'||system()?answerForm():stepControls());C.renderMathNodes(host);fitMath();if(spec.projector)return;
 host.querySelectorAll('input').forEach(input=>{input.type='text';input.inputMode='text';input.maxLength=40;input.autocomplete='off';input.autocapitalize='off';input.spellcheck=false;input.placeholder='Getal of breuk';input.oninput=()=>{document.getElementById('inputError').textContent='';save();};});
 host.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
 if(view==='answer'||system()){
  document.getElementById('steps')?.addEventListener('click',()=>setView('steps'));
  document.getElementById('answerForm').onsubmit=e=>{e.preventDefault();if(locked)return;readDraft();const answer=system()?{x:draft.answerX,y:draft.answerY}:{value:draft.answer};if(system()?!G.parse(answer.x)||!G.parse(answer.y):!G.parse(answer.value)){document.getElementById('inputError').textContent=system()?'Vul x en y in als getal of breuk.':'Vul een getal of breuk in.';fitMath();return;}save();B.submit(answer);};return;
 }
 if(view==='history'){
  document.getElementById('historyPrev').onclick=()=>{historyIndex--;render();};document.getElementById('historyNext').onclick=()=>{historyIndex++;render();};return;
 }
 host.querySelectorAll('[data-op]').forEach(b=>b.onclick=()=>{selected=b.dataset.op;operandPage=0;render();});
 if(selected){
  const values=C.candidateOperands(task,current(),selected);
  host.querySelectorAll('[data-value]').forEach(b=>b.onclick=()=>{try{if(operations.length>=30)throw Error('Ga eerst een stap terug.');const operand=values[Number(b.dataset.value)],next=C.applyEquation(current(),selected,operand);if(C.exprNodeCount(next.l)+C.exprNodeCount(next.r)>160)throw Error('Ga eerst een stap terug.');operations.push({op:selected,operand:C.cloneExpr(operand)});states.push(next);draft.answer=solvedValue();selected=null;render();save();}catch(e){document.getElementById('inputError').textContent=e.message;}});
  document.getElementById('cancelOperation').onclick=()=>{selected=null;render();};document.getElementById('choicePrev').onclick=()=>{operandPage--;render();};document.getElementById('choiceNext').onclick=()=>{operandPage++;render();};
 }else{
  document.getElementById('undo').onclick=()=>{operations.pop();states.pop();draft.answer=solvedValue();render();save();};document.getElementById('history').onclick=()=>{historyIndex=states.length-1;setView('history');};
 }
}
function start(value){
 spec=value;task=G.generate(spec);operations=[];states=system()?[]:[C.cloneEq(task.start)];selected=null;view='answer';locked=false;status.textContent='';draft={};
 if(!spec.projector)try{const stored=JSON.parse(localStorage.getItem(key())||'null');if(stored){if(!system()&&Array.isArray(stored.operations)&&stored.operations.length<=30){for(const op of stored.operations){if(!['+','-','*','/'].includes(op.op))throw Error();const operand=C.cloneExpr(op.operand),next=C.applyEquation(current(),op.op,operand);if(C.exprNodeCount(next.l)+C.exprNodeCount(next.r)>160)throw Error();states.push(next);operations.push({op:op.op,operand});}}
  draft={answer:typeof stored.value==='string'?stored.value.slice(0,40):'',answerX:typeof stored.x==='string'?stored.x.slice(0,40):'',answerY:typeof stored.y==='string'?stored.y.slice(0,40):''};if(!system()&&['answer','steps','history'].includes(stored.view))view=stored.view;historyIndex=states.length-1;
 }}catch{states=system()?[]:[C.cloneEq(task.start)];operations=[];draft={};view='answer';}
 render();
}
B.connect({start,freeze(message){locked=true;document.getElementById('controls')?.setAttribute('disabled','');status.textContent=message;fitMath();},retry(){start(spec);}});
addEventListener('resize',fitMath);
addEventListener('message',event=>{const d=event.data;if(event.source!==parent||event.origin!==location.origin||d?.type!=='vector-class-review'||d.match!==spec?.match||d.index!==spec?.index)return;locked=true;status.textContent='';host.className=system()?'system-review':'review';host.innerHTML=system()?`<section class="paper"><h1>Oplossing</h1><div class="given">${math(S.systemTex(task.start))}</div><div class="system-solution">${math('x='+S.text(task.solution.x)+'\\qquad y='+S.text(task.solution.y))}</div></section>`:`<section class="paper"><h1>Een mogelijke uitwerking</h1><ol class="review-steps"><li>${eq(task.start)}</li>${task.steps.map((step,i)=>`<li><small>${math(C.operationLatex(step.op,step.operand,task.policy))}</small>${eq(task.states[i+1])}</li>`).join('')}</ol></section>`;C.renderMathNodes(host);fitMath();});
})();
