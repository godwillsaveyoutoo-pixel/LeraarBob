(function(root,factory){if(typeof module==='object')module.exports=factory(require('./core.js'));else root.BattleGame=factory(root.BewerkingenCore);})(globalThis,C=>{
 const skills=C.SKILLS.map(s=>({id:s.id,label:s.label,description:s.hint}));
 const worlds=C.GROUPS.map(g=>({id:g.id,name:g.label,skills:C.SKILLS.filter(s=>s.group===g.id).map(s=>s.id)}));
 const generate=s=>C.generate(s.skill,s.seed,s.level??1,s.variant);
 const validate=(task,answer)=>C.check(task,typeof answer?.value==='string'?answer.value:'');
 return Object.freeze({id:'bewerkingen',title:'Getallenwereld',rpc:'axioma_game_class',classFunction:'bewerkingen-class',classReview:true,multiSelect:true,levelSelect:true,playerURL:'battle-player.html',skills,worlds,mixedSkills:skills.map(s=>s.id),generate,validate});
});
