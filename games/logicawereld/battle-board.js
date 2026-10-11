// Only the containing session may assign a question or lock this native board.
(()=>{'use strict';
 let api,question=null,locked=true,message='',label='Battle',draftKey='';
 const send=data=>parent.postMessage(data,location.origin);
 window.LogicaBattle=Object.freeze({
  get locked(){return locked;},get message(){return message;},get label(){return label;},
  save(draft){if(!draftKey)return;try{sessionStorage.setItem(draftKey,JSON.stringify(draft));}catch{}},
  submit(answer){if(!question||locked)return;locked=true;message='Antwoord versturen…';send({type:'vector-battle-answer',match:question.match,index:question.index,answer});},
  connect(value){api=value;send({type:'vector-battle-ready'});}
 });
 addEventListener('message',event=>{
  if(event.source!==parent||parent===window||event.origin!==location.origin||!api)return;
  const d=event.data;if(!d||typeof d!=='object')return;
  if(d.type==='vector-battle-ping'){send({type:'vector-battle-ready'});return;}
  if(d.type==='vector-battle-question'){
   try{BattleGame.generate(d);}catch{return;}
   if(question?.match===d.match&&question.index===d.index)return;
   question=d;locked=!!d.projector;message=locked?'Leerkrachtbeeld · de klas werkt.':'';label=(d.projector?'Klasbattle':'Battle')+' · ronde '+(d.index+(new URLSearchParams(location.search).get('mode')==='online'?0:1));
   draftKey='logica-battle-draft:'+JSON.stringify([d.learner||'projector',d.match,d.index,d.skill,d.seed,d.variant]);
   let draft;try{draft=JSON.parse(sessionStorage.getItem(draftKey)||'null');}catch{}
   api.question(d,draft);return;
  }
  if(d.type==='vector-battle-resolved'&&question?.match===d.match&&question.index===d.index){locked=true;message=d.message||'Ronde afgelopen.';api.render();}
 });
})();
