/* Calculate the toll for one gate opening and a caravan of carts. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('../core/wave-core.js'));else root.RechtenV2Context=factory(root.RechtenWave)})(globalThis,function(W){
'use strict';
const skills=['equation_from_context'],count=1,scenario='world-toll';
const phases=['context-start','context-add','context-table','context-check','context-rule','context-plot'];
const firstPhase=()=>phases[0],nextPhase=(_,phase)=>phases[phases.indexOf(phase)+1]||'next-task';
const fields=phase=>({'context-start':['openingCost'],'context-add':['onePrice'],'context-table':['twoPrice','threePrice'],'context-rule':['perUnit','gateFee'],'context-plot':['plotY1','plotY2'],'context-check':['caravanTotal']}[phase]||[]);
const numericFields=phase=>fields(phase),plotXs=[1,3];
function makeTask(skill,index=0,run=1){
 if(!skills.includes(skill))throw Error('Onbekende contextvaardigheid');
 const variant=(run-1)%3,[perUnit,gateFee]=[[3,2],[3,1],[2,2]][variant],groupSize=4;
 return {id:`rechten-v2:formulewerf:${skill}:${run}:0`,world:'formulewerf',skill_id:skill,family_id:'F7',scenario,index:0,count,variant,model:{kind:'affine',a:W.q(perUnit),b:W.q(gateFee)},perUnit,gateFee,groupSize,bounds:{xMax:4,yMax:16},mode:'practice',given_representations:['context','carts','tollboard','table']};
}
const total=(t,carts)=>W.num(W.add(W.mul(t.model.a,W.q(carts)),t.model.b));
const result=(ok,code,message,keep={})=>({ok,kind:ok?'correct':'hypothesis',code:ok?null:code,message,keep});
const syntax=message=>({ok:false,kind:'interaction_error',code:'input.missing',message,keep:{}});
function check(t,v,phase){
 const keys=numericFields(phase),q=keys.map(k=>W.parse(v[k]));
 if(!keys.length||q.some(x=>!x))return syntax('Tik een leeg bedrag aan en vul het in.');
 if(q.some(x=>x.d!==1||x.n<0))return syntax('Vul een heel aantal munten in: 0 of meer.');
 const expected={'context-start':[t.gateFee],'context-add':[total(t,1)],'context-table':[total(t,2),total(t,3)],'context-rule':[t.perUnit,t.gateFee],'context-plot':plotXs.map(x=>total(t,x)),'context-check':[total(t,t.groupSize)]}[phase];
 const keep=Object.fromEntries(keys.map((key,i)=>[key,W.eq(q[i],W.q(expected[i]))]));
 if(phase==='context-check'){
  const ok=keep.caravanTotal,price=total(t,t.groupSize);
  return result(ok,'context.toll',ok?`De tol voor ${t.groupSize} karren is ${price} munten: één keer ${t.gateFee} voor de poort en ${t.perUnit} per kar.`:'Tel de tol voor alle karren samen. Tel het openen van de poort één keer erbij.',keep);
 }
 const ok=Object.values(keep).every(Boolean),messages={
  'context-start':[`De poort openen kost ${t.gateFee} munten. Dat betaal je één keer voor de karavaan.`,'Lees op het tolbord wat de poort openen kost.'],
  'context-add':[`Eén kar: ${t.perUnit} munten + ${t.gateFee} voor de poort = ${total(t,1)} munten.`,'Tel de tol voor één kar en het openen van de poort samen.'],
  'context-table':[`Een extra kar kost ${t.perUnit} munten extra. De poort gaat maar één keer open.`, `Eén kar kost samen ${total(t,1)} munten. Tel per extra kar ${t.perUnit} erbij.`],
  'context-rule':[`De regel klopt: ${t.perUnit} per kar + één keer ${t.gateFee} voor de poort.`,'Het eerste aantal munten hoort bij elke kar. Het openen komt er één keer bij.'],
  'context-plot':['De punten tonen de tol voor de karavaan.','Lees in de tabel de tol bij 1 en bij 3 karren.']
 };
 return result(ok,'context.'+phase.slice(8),messages[phase][ok?0:1],keep);
}
function hint(phase,level=1){
 const hints={
  'context-start':['Wat kost het om de poort te openen?','Kijk naar het bedrag dat één keer voor de karavaan geldt.','De poort gaat één keer open, ongeacht het aantal karren.'],
  'context-add':['Er komt één kar door de poort.','Begin met de tol voor die kar.','Tel het openen van de poort erbij.'],
  'context-table':['Elke extra kar kost hetzelfde aantal munten.','Ga vanaf de vorige rij één kar verder. Tel de tol voor één kar erbij.','Het openen zit al in de vorige prijs. Tel dat niet opnieuw erbij.'],
  'context-check':['Hoeveel karren heeft jouw karavaan?','Tel de tol voor alle karren samen.','Tel het openen van de poort één keer erbij.'],
  'context-rule':['Wat betaal je per kar, en wat maar één keer?','Vermenigvuldig de tol per kar met het aantal karren.','Tel het openen van de poort erbij.'],
  'context-plot':['De tabel vertelt waar je punten komen.','Onderaan staat het aantal karren. Omhoog lees je de tol in munten.','Gebruik de tabelrijen bij 1 en bij 3 karren.']
 };
 return hints[phase]?.[Math.max(0,Math.min(2,level-1))]||'Werk stap voor stap.';
}
function enter(m,key){
 const open=numericFields(m.phase).filter(k=>!m.locks[k]),field=open.includes(m.values.contextField)?m.values.contextField:open[0];
 if(!field)return null;let value=String(m.values[field]??'');
 if(key==='back')value=value.slice(0,-1);else if(key==='clear')value='';else if(/^[0-9]$/.test(key)&&value.length<3)value+=key;else return null;
 return {field,value};
}
const evidenceSkill=phase=>phase==='context-plot'?'graph_from_equation':'equation_from_context';
return Object.freeze({skills,count,scenario,phases,plotXs,firstPhase,nextPhase,fields,numericFields,makeTask,total,check,hint,enter,evidenceSkill});
});
