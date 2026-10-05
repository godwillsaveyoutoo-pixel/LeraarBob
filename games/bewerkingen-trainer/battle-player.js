(()=>{
'use strict';
const C=BewerkingenCore,host=document.getElementById('work'),status=document.getElementById('status');let task,current,control,answer='',smart={};
const math=tex=>katex.renderToString(tex,{throwOnError:false,strict:'ignore'}),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const draftKey=()=>`bewerkingen-class-draft:${current.learner}:${current.match}:${current.index}`;
function freeze(message){control?.setDisabled(true);host.querySelectorAll('button').forEach(e=>e.disabled=true);status.textContent=message;}
BattlePlayer.connect({start(spec){current=spec;task=BattleGame.generate(spec);document.body.classList.toggle('projector',!!spec.projector);status.textContent='';answer='';smart={};
 if(!spec.projector)try{const raw=sessionStorage.getItem(draftKey());try{const saved=JSON.parse(raw);answer=saved?.value||'';smart=saved?.smart||{};}catch{answer=raw||'';}}catch{}
 host.innerHTML=`<article class="work-card"><h2>${esc(C.SKILLS.find(s=>s.id===task.skill).label)}</h2><div class="question">${math(task.tex)}</div>${task.instruction?`<p class="task-instruction">${esc(task.instruction)}</p>`:''}<p class="condition">${esc(task.condition)}</p><form id="answerForm" class="answer-form"><div id="smartBattleAnswer"></div><button class="primary" id="sendAnswer" ${answer?'':'disabled'}>Dien antwoord in</button></form><button id="pass">Ik pas</button><div id="review"></div></article>`;
 control=SmartAnswer.mount(document.getElementById('smartBattleAnswer'),task,{state:smart,value:answer,disabled:!!spec.projector,onChange(next,value){if(BattlePlayer.locked||spec.projector)return;smart=next;answer=value;document.getElementById('sendAnswer').disabled=!value;try{sessionStorage.setItem(draftKey(),JSON.stringify({smart,value}))}catch{}}});
 host.querySelector('form').onsubmit=e=>{e.preventDefault();if(BattlePlayer.locked||spec.projector||!answer)return;BattlePlayer.submit({value:answer});};document.getElementById('pass').onclick=()=>{if(!spec.projector)BattlePlayer.submit({},true);};
},freeze,retry(){control?.setDisabled(false);document.getElementById('pass').disabled=false;document.getElementById('sendAnswer').disabled=!answer;status.textContent='Probeer opnieuw.';}});
addEventListener('message',e=>{if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='vector-class-review'||!current||e.data.match!==current.match||e.data.index!==current.index)return;freeze('Bespreek de uitwerking.');document.getElementById('review').innerHTML='<div class="steps">'+task.steps.map(s=>`<div class="step">${math(s)}</div>`).join('')+'</div>';});
})();
