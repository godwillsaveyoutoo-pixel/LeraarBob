/* Preview observations only: never mutates the production mastery state. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.RechtenV2Evidence=api})(globalThis,()=>{
'use strict';
const clone=v=>JSON.parse(JSON.stringify(v));
const phases=new Set(['predict','execute','diagnose','transfer']);
function record(state,input){
 if(!state||state.schema!==1||!Array.isArray(state.events))throw Error('Ongeldige proefstate.');
 for(const k of ['taskId','attemptId','skill'])if(typeof input?.[k]!=='string'||!input[k])throw Error('Ontbrekend evidenceveld: '+k);
 if(!phases.has(input.phase))throw Error('Ongeldige evidencefase.');
 const result=clone(state),existing=result.events.find(e=>e.taskId===input.taskId&&e.attemptId===input.attemptId);
 if(existing)return {state:result,event:clone(existing),duplicate:true};
 const errorKind=['interaction_error','authoring_error'].includes(input.errorKind)?input.errorKind:null;
 const helpLevel=Math.max(0,Math.min(5,Number(input.helpLevel)||0));
 const prior=result.events.filter(e=>e.taskId===input.taskId);
 const inheritedSupport=prior.some(e=>e.supported||e.helpLevel>0)||prior.some(e=>e.phase===input.phase&&!e.correct&&!e.errorKind);
 const supported=!!input.supported||helpLevel>0||!!input.feedbackSeen||input.mode==='discover'||inheritedSupport;
 const event={taskId:input.taskId,attemptId:input.attemptId,skill:input.skill,phase:input.phase,
  mode:input.mode||'practice',variant:input.variant??null,representation:input.representation||null,
  correct:input.correct===true&&!errorKind,supported,helpLevel,feedbackSeen:!!input.feedbackSeen,
  independent:input.correct===true&&!errorKind&&!supported,mastery:false,
  misconception:errorKind?null:input.misconception||null,errorKind,
  revision:Math.max(0,Number(input.revision)||0),at:input.at||new Date().toISOString()};
 result.events.push(event);return {state:result,event:clone(event),duplicate:false};
}
return Object.freeze({record});
});
