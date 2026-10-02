/* Signaalstad level 2: retain the measured intercept and unit step, then build a rule. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('../core/wave-core.js'),require('./semantic-math-core.js'));else root.RechtenV2AB=factory(root.RechtenWave,root.RechtenV2Math)})(globalThis,function(W,M){
'use strict';
const skills=['ab'],count=6,phases=['ab-intercept','ab-slope','ab-rule'];
const firstPhase=()=>phases[0],nextPhase=phase=>phases[phases.indexOf(phase)+1]||'next-task';
const retainedFields=phase=>phase==='ab-intercept'?['b']:phase==='ab-slope'?['a']:[];
const hints=[
 'Begin waar de rechte de verticale y-as raakt. Die hoogte is b.',
 'Op de y-as is x = 0. Zet je eerste punt op de rechte.',
 'Ga vanaf dat punt één eenheid naar rechts. Hoeveel moet je omhoog of omlaag om weer op de rechte te komen? Dat is a.',
 'Omhoog geeft een positieve a, omlaag een negatieve a. Bij een horizontale rechte is a = 0. Een halve stap is 0,5 of 1/2.',
 'Ander voorbeeld: van (0; 2) naar (1; 1) ga je één omlaag. Dan is a = −1, b = 2 en y = −x + 2. Probeer een nieuw geval.'
];
function makeTask(skill='ab',index=0,run=1){
 if(!skills.includes(skill))throw Error('Onbekende a/b-vaardigheid');
 const [slope,intercept]=[[2,1],[1,2],[-1,3],[0,-2],[.5,-1],[-.5,1]][index%count];
 const model={kind:'affine',a:W.fromNumber(slope),b:W.q(intercept+[0,1,-1][(run-1)%3])};
 const tokens=[model.a,model.b,W.q(Math.abs(model.b.n),model.b.d),W.mul(-1,model.a),W.mul(-1,model.b),W.q(0),W.q(1),W.q(2)].map(W.text).filter((v,i,a)=>a.indexOf(v)===i);
 let seed=run*37+index*23;for(let i=tokens.length-1;i>0;i--){seed=(seed*1664525+1013904223)>>>0;const j=seed%(i+1);[tokens[i],tokens[j]]=[tokens[j],tokens[i]]}tokens.push('x','+','−');
 return {id:`rechten-v2:signaalstad:ab:${run}:${index}`,world:'signaalstad',skill_id:'ab',family_id:'F3',index,count,model,tokens,gridStep:model.a.d>1?.5:1,bounds:{xMin:-5,xMax:5,yMin:-5,yMax:5},mode:index===0?'discover':'practice',variant:!model.a.n?'horizontal':model.a.d>1?(model.a.n<0?'negative-fraction':'positive-fraction'):model.a.n<0?'negative':'positive',given_representations:['graph'],hints:[...hints]};
}
const syntax=message=>({ok:false,kind:'interaction_error',code:'input.missing',message,keep:{}});
const result=(ok,code,message,keep={})=>({ok,kind:ok?'correct':'hypothesis',code:ok?null:code,message,keep});
function rule(values){const a=M.parse(values.factor),n=M.parse(values.constant);if(!a||!n||values.variable!=='x'||!['+','−'].includes(values.operator))return null;return {kind:'affine',a,b:W.mul(values.operator==='−'?-1:1,n)}}
function check(t,v,phase){
 if(phase==='ab-intercept'){
  const b=M.parse(v.b);if(!b)return syntax('Plaats je punt op de y-as of vul de hoogte b in.');
  const ok=W.eq(b,t.model.b);return result(ok,'intercept.read',ok?`Je punt (0; ${W.text(b)}) ligt op de rechte. Je hebt b gevonden.`:'Je punt ligt nog niet op de rechte. Zoek het snijpunt met de verticale y-as.',{b:ok});
 }
 if(phase==='ab-slope'){
  const a=M.parse(v.a),b=M.parse(v.b);if(!a||!b)return syntax('Maak de verticale stap of vul a in. Een breuk of decimaal mag ook.');
  const aOK=W.eq(a,t.model.a),bOK=W.eq(b,t.model.b),height=W.add(b,a),needed=W.add(t.model.b,t.model.a),ok=aOK&&bOK;
  return result(ok,'slope.rate',ok?`Eén stap x verandert y met ${W.text(a)}. Je hebt a gevonden.`:`Je eindpunt heeft y = ${W.text(height)}. De rechte heeft bij x = 1 hoogte ${W.text(needed)}. Pas je verticale stap aan.`,{a:aOK,b:bOK});
 }
 if(phase==='ab-rule'){
  const candidate=rule(v);if(!candidate)return syntax('Vul alle vier de vakjes: getal, x, teken en getal.');
  const aOK=W.eq(candidate.a,t.model.a),bOK=W.eq(candidate.b,t.model.b),ok=aOK&&bOK;
  const code=W.eq(candidate.a,t.model.b)&&W.eq(candidate.b,t.model.a)?'param.slope_intercept_swap':!aOK?'param.rate':'param.intercept';
  return result(ok,code,ok?'Je voorschrift past bij de rechte: a geeft de helling en b de hoogte bij x = 0.':!aOK?'Zet jouw gemeten a vóór x. Een juiste constante term blijft staan.':'Controleer het teken en het getal van b. Een juiste a blijft staan.',{factor:aOK,variable:true,operator:bOK,constant:bOK});
 }
 return syntax('Deze stap is niet beschikbaar.');
}
function step(m){return m.phase==='ab-intercept'?1:m.task.gridStep}
function selection(m,y){const name=m.phase==='ab-intercept'?'b':m.phase==='ab-slope'?'a':null;if(!name||!Number.isFinite(y))return null;const origin=name==='a'?M.parse(m.values.b):W.q(0);if(!origin)return null;const height=Math.max(-5,Math.min(5,Math.round(y/step(m))*step(m)));return {name,value:W.text(W.sub(W.fromNumber(height),origin))}}
function adjust(m,amount){const name=m.phase==='ab-intercept'?'b':m.phase==='ab-slope'?'a':null;if(!name||![-1,1].includes(amount))return null;const value=M.parse(m.values[name]||'0'),origin=name==='a'?M.parse(m.values.b):W.q(0);if(!value||!origin)return null;return selection(m,W.num(W.add(origin,value))+amount*step(m))}
return Object.freeze({skills,count,phases,firstPhase,nextPhase,retainedFields,makeTask,rule,check,step,selection,adjust});
});
