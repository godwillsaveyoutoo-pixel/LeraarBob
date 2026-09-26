/* Read-only presentation of the existing planner; no second skill model. */
(function(root,factory){const api=typeof module==='object'?factory(require('../trainer/wave-core.js'),require('../trainer/journey-core.js')):factory(root.RechtenWave,root.RechtenJourney);if(typeof module==='object')module.exports=api;else root.RechtenV2Scheduler=api})(globalThis,(W,J)=>{
'use strict';
const map=Object.freeze({zeroRead:'grenspas',zero:'grenspas',sign:'grenspas',signchart:'grenspas',delta:'hellingrug',slope:'hellingrug',slope_from_two_points:'hellingrug',intercept:'signaalstad',ab:'signaalstad',equation_from_ab:'signaalstad'});
function recommend(snapshot){
 const raw=snapshot?.state||snapshot;
 if(!raw?.skills)return {skill:null,mission:'grenspas',kind:'preview',available:true,source:'prototype',reason:'Probeer een missie. Je bestaande leerroute blijft behouden.'};
 const state=W.migrate(raw);state.review ||= [];state.total ||= 0;state.session ||= {answered:0};
 for(const skill of [...W.order,...W.disabledSkills])state.skills[skill]={intro:false,seen:0,strength:0,recent:[],lastSeen:-999,...state.skills[skill]};
 const unlocked=W.unlock(state),choice=J.choice(state,unlocked,W.ready)||J.recommend(state,unlocked,W.ready,W.order);
 const skill=choice?.skill||choice?.place?.skills?.find(k=>unlocked.includes(k))||null;
 const mission=map[skill]||null;
 return {skill,mission,kind:choice?.kind||'practice',available:!!mission&&unlocked.includes(skill)&&!W.disabledSkills.includes(skill),source:'legacy-planner',reason:choice?.reason||(mission?'Deze missie past bij je bestaande leerroute.':'Deze stap staat in de huidige Rechtentrainer.'),reviewId:choice?.reviewId||null,scaffold:!!choice?.scaffold};
}
return Object.freeze({recommend,missionFor:skill=>map[skill]||null});
});
