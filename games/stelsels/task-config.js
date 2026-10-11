/* The tasks player uses the same fourteen systems as the standalone Stelsels. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('./exercises.js'));else root.StelselsTaskConfig=factory(root.StelselsExercises);})(globalThis,E=>{
 'use strict';
 const skills=E.map(e=>({id:'system_'+e.id,label:'Stelsel '+e.id}));
 function generate(spec){const e=E.find(e=>'system_'+e.id===spec?.skill);if(!e)throw Error('Onbekend stelsel.');return e;}
 function number(s){if(typeof s!=='string'||s.length>40||!/^[-+]?\d+(?:[.,]\d+)?(?:\/[-+]?\d+(?:[.,]\d+)?)?$/.test(s.trim()))return null;const [a,b='1']=s.trim().replaceAll(',','.').split('/').map(Number);return Number.isFinite(a/b)&&Math.abs(a/b)<=1e6?a/b:null;}
 function validate(task,answer){
  try{const [[a,b,c],[d,e,f]]=task.eq.map(row=>row.map(number));
   if(a*e-d*b===0)return {ok:answer?.kind===(a*f===d*c&&b*f===e*c?'coincident':'parallel')};
   const x=number(answer?.x),y=number(answer?.y);
   return {ok:x!==null&&y!==null&&Math.abs(a*x+b*y-c)<1e-9&&Math.abs(d*x+e*y-f)<1e-9};
  }catch{return {ok:false};}
 }
 return {skills,generate,validate,worlds:[{id:'basis',name:'Basis',skills:skills.slice(0,5).map(s=>s.id)},{id:'methodes',name:'Methodes oefenen',skills:skills.slice(5,10).map(s=>s.id)},{id:'uitdaging',name:'Breuken en bijzondere gevallen',skills:skills.slice(10).map(s=>s.id)}]};
});
