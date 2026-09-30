/* Only the owning frame can start or freeze a round. No account or progress writes. */
(function(){
 const opaque=location.protocol==='file:'||location.origin==='null',origin=opaque?'null':location.origin,target=opaque?'*':location.origin;
 let hooks,round,locked=true,timer;const send=data=>parent.postMessage(data,target);
 const api=window.BattlePlayer={classroom:new URLSearchParams(location.search).get('mode')==='class',cooperative:new URLSearchParams(location.search).get('mode')==='learn',online:['online','learn'].includes(new URLSearchParams(location.search).get('mode'))||(['rechten','algebra'].includes(window.BattleGame?.id)&&new URLSearchParams(location.search).get('mode')==='class'),singleAttempt:['class','online','learn'].includes(new URLSearchParams(location.search).get('mode')),
 connect(value){hooks=value;send({type:'vector-battle-ready'});},
 submit(answer,skipped=false){if(!round||locked)return;const correct=!api.online&&!skipped&&BattleGame.validate(BattleGame.generate(round),answer).ok;
  if(api.singleAttempt||correct||skipped){locked=true;hooks.freeze(api.online?'Bevestigd · wachten op de uitslag.':api.singleAttempt?'Antwoord verstuurd.':'Wacht op de volgende ronde.');send({type:'vector-battle-answer',match:round.match,index:round.index,answer,skipped});}
  else{locked=true;hooks.freeze('Nog niet juist. Probeer opnieuw over 3 seconden.');timer=setTimeout(()=>{locked=false;hooks.retry();},3000);}
 },
 changed(answer){if(api.cooperative&&round&&!locked)send({type:'rechten-learn-draft',match:round.match,index:round.index,answer});},
 get locked(){return locked;}
 };
 addEventListener('message',e=>{if(e.source!==parent||e.origin!==origin||!hooks)return;const d=e.data;if(!d||typeof d!=='object')return;
 if(d.type==='vector-battle-ping'){send({type:'vector-battle-ready'});return;}
 if(d.type==='vector-battle-question'&&typeof d.match==='string'&&Number.isInteger(d.index)&&Number.isInteger(d.seed)&&Number.isInteger(d.variant)&&BattleGame.skills.some(s=>s.id===d.skill)){clearTimeout(timer);if(api.online&&round?.match===d.match&&round.index===d.index)return;round=d;locked=false;hooks.start(d);}
 if(api.cooperative&&d.type==='rechten-learn-sync'&&round&&d.match===round.match&&d.index===round.index){locked=!!d.readOnly;hooks.sync?.(d.answer,locked);return;}
 if(d.type==='vector-battle-resolved'&&round&&d.match===round.match&&d.index===round.index){clearTimeout(timer);locked=true;hooks.freeze(String(d.message||'Ronde afgerond.'));}
 });
})();
