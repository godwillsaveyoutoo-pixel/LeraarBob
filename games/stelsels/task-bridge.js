(()=>{'use strict';
 const send=d=>parent.postMessage(d,location.origin),submit=document.getElementById('taskSubmit'),skip=document.getElementById('taskSkip'),status=document.getElementById('taskStatus');
 let spec=null,locked=true,syncing=false,last='';
 window.StelselsTaskBridge={changed(){
  if(!spec||syncing||locked)return;const draft=StelselsTask.snapshot(),key=JSON.stringify(draft);
  submit.disabled=!draft.kind;
  if(key!==last){last=key;send({type:'rechten-learn-draft',match:spec.match,index:spec.index,answer:draft});}
 }};
 function freeze(text){locked=true;StelselsTask.freeze(true);submit.disabled=skip.disabled=true;status.textContent=text;}
 function answer(skipped){if(locked||!spec)return;const a=skipped?{}:StelselsTask.snapshot();delete a.history;freeze('Antwoord versturen…');send({type:'vector-battle-answer',match:spec.match,index:spec.index,answer:a,skipped});}
 submit.onclick=()=>answer(false);skip.onclick=()=>answer(true);
 addEventListener('message',e=>{
  if(e.source!==parent||parent===window||e.origin!==location.origin||!window.StelselsTask)return;
  const d=e.data;if(!d||typeof d!=='object')return;
  if(d.type==='vector-battle-ping')send({type:'vector-battle-ready'});
  if(d.type==='vector-battle-question'){
   try{StelselsTaskConfig.generate(d);}catch{return;}
   if(spec?.match===d.match&&spec.index===d.index)return;
   spec=d;syncing=true;locked=false;StelselsTask.freeze(false);StelselsTask.start(d);syncing=false;last='';submit.disabled=true;skip.disabled=false;status.textContent='';
  }
  if(d.type==='rechten-learn-sync'&&spec?.match===d.match&&spec.index===d.index){
   syncing=true;try{const answer=d.answer||{};StelselsTask.restore({...answer,method:spec.method==='choice'?answer.method:spec.method,studyMode:spec.studyMode});}catch{StelselsTask.start(spec);status.textContent='De bewaarde tussenstappen konden niet worden hersteld.';}finally{syncing=false;}
   locked=!!d.readOnly;StelselsTask.freeze(locked);submit.disabled=locked||!StelselsTask.snapshot().kind;skip.disabled=locked;status.textContent=locked?'Jouw ingeleverde uitwerking':'';
  }
  if(d.type==='vector-battle-resolved'&&spec?.match===d.match&&spec.index===d.index)freeze(d.message||'Antwoord bewaard.');
 });
 send({type:'vector-battle-ready'});
})();
