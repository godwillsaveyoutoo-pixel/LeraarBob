(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./logic.js'),require('./content.js'));else root.BattleGame=factory(root.Logic,root.LogicContent);})(typeof globalThis==='object'?globalThis:this,(L,C)=>{
 'use strict';
 const skills=C.stops.map(s=>({id:'L'+String(s.id+1).padStart(2,'0'),label:s.name}));
 const worlds=C.districts.map(d=>({id:d.id,name:d.name,skills:d.stops.map(i=>skills[i].id)}));
 function generate(spec){
  const index=skills.findIndex(s=>s.id===spec?.skill);
  if(index<0||!Number.isInteger(spec.seed)||spec.seed<0||spec.seed>4294967295||!Number.isInteger(spec.variant)||spec.variant<0||spec.variant>3)throw Error('Ongeldige logica-opgave.');
  // This version always selects from the original five tasks of a stop.
  return C.stops[index].tasks[(spec.seed+spec.variant)%C.stops[index].tasks.length];
 }
 function validate(task,answer){try{return {ok:L.validate(task,answer?.value).correct===true};}catch{return {ok:false};}}
 return {id:'logicawereld',appId:'logicawereld',title:'Logicawereld',rpc:'axioma_game_class',classFunction:'logica-class',coverEverySkill:true,playerURL:'battle-player.html',skills,worlds,mixedSkills:skills.map(s=>s.id),generate,validate};
});
