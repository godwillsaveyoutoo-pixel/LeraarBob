/* Each battle pane uses the existing trainer with volatile, local-only state. */
(function(){
'use strict';
window.AxiomaGame={account:null,storage:{getItem:()=>null,setItem:()=>{}},report:()=>{}};
window.AxiomaPlatform={trainerScreen:()=>{},bindTrainer:()=>{}};
document.body.classList.add('battle-player');
let hooks,round=null,cooldown=null;
// Local files have an opaque messaging origin even when location.origin says file://.
const opaque=location.protocol==='file:'||location.origin==='null';
const target=opaque?'*':location.origin,peerOrigin=opaque?'null':location.origin;
const send=data=>parent.postMessage(data,target);
window.VectorBattlePlayer={
 singleAttempt:new URLSearchParams(location.search).get('mode')==='class',
 cooling:false,
 connect(api){hooks=api;send({type:'vector-battle-ready'});},
 submit(answer,skipped){if(round)send({type:'vector-battle-answer',match:round.match,index:round.index,answer,skipped});},
 penalize(){
  this.cooling=true;let left=3;hooks.cooldown(left);clearInterval(cooldown);
  cooldown=setInterval(()=>{left--;if(left){hooks.cooldown(left);return;}clearInterval(cooldown);this.cooling=false;hooks.cooldown(0);},1000);
 },
};
addEventListener('message',event=>{
 if(event.source!==parent||event.origin!==peerOrigin)return;
 const data=event.data;if(!data||typeof data!=='object'||!hooks)return;
 if(data.type==='vector-battle-ping'){send({type:'vector-battle-ready'});return;}
 if(data.type==='vector-battle-question'&&typeof data.match==='string'&&Number.isInteger(data.index)&&data.index>=0&&VectorTrainerCore.TaskGenerator.skills.some(s=>s.id===data.skill)&&Number.isInteger(data.seed)&&Number.isInteger(data.variant)){
  clearInterval(cooldown);window.VectorBattlePlayer.cooling=false;round={match:data.match,index:data.index};hooks.start(data);
 }else if(data.type==='vector-battle-resolved'&&round&&data.match===round.match&&data.index===round.index){
  clearInterval(cooldown);window.VectorBattlePlayer.cooling=false;hooks.freeze(String(data.message||'Ronde afgerond'));
 }
});
})();
