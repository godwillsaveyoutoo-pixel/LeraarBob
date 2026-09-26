/* Formulewerf B: explicit substitution and derivation, using existing exact validators. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('../trainer/wave-core.js'),require('./semantic-math-core.js'),require('./hills-core.js'));else root.RechtenV2Derive=factory(root.RechtenWave,root.RechtenV2Math,root.RechtenV2Hills)})(globalThis,function(W,M,H){
'use strict';
const skills=['intercept_from_point','equation_from_point_slope','equation_from_two_points'],count=6;
const titles={intercept_from_point:'Bepaal b met helling en een punt',equation_from_point_slope:'Voorschrift uit helling en een punt',equation_from_two_points:'Voorschrift uit twee punten'};
const slopeSlots=['y1','y0','x1','x0'],subSlots=['subY','subA','subX'],formulaSlots=['answerFactor','answerSign','answerConstant'];
const firstPhase=skill=>skill==='equation_from_two_points'?'derive-fill':'derive-substitute';
const phases=skill=>[...(skill==='equation_from_two_points'?['derive-fill','derive-slope']:[]),'derive-substitute','derive-product','derive-intercept',...(skill==='intercept_from_point'?[]:['derive-formula'])];
const nextPhase=(skill,phase)=>phases(skill)[phases(skill).indexOf(phase)+1]||'next-task';
const slots=phase=>phase==='derive-fill'?slopeSlots:phase==='derive-substitute'?subSlots:phase==='derive-formula'?formulaSlots:[];
function makeTask(skill,index=0,run=1){
 if(!skills.includes(skill))throw Error('Onbekende afleidingsvaardigheid');
 const rows=skill==='equation_from_two_points'?[[-2,2,1,0],[2,-1,-1,2],[.5,1,-2,2],[-.5,-1,1,3],[0,2,-3,2],[1.5,.5,-1,1]]:skill==='equation_from_point_slope'?[[-2,-2,0],[2,1,1],[.5,-1,2],[-.5,2,-2],[0,-3,3],[1.5,.5,-1]]:[[2,1,1],[-2,-2,-1],[.5,-1,2],[-.5,2,-2],[0,-3,3],[1.5,.5,-1]];
 const [a,b,x,other]=rows[index%count],model={kind:'affine',a:W.fromNumber(a),b:W.fromNumber(b+[0,1,-1][(run-1)%3])},point=x=>({x:W.fromNumber(x),y:W.add(W.mul(model.a,W.fromNumber(x)),model.b)}),A=point(x),B=other===undefined?null:point(other);
 return {id:`rechten-v2:formulewerf:${skill}:${run}:${index}`,world:'formulewerf',skill_id:skill,family_id:'F7',index,count,model,points:{A,...(B?{B}:{})},variant:!a?'horizontal':model.a.d>1?'fraction':a<0?'negative':'positive',mode:index===0?'discover':'practice',given_representations:[B?'two-points':'point-and-slope'],legacy:{skill,params:{A,B:B||point(x+1),model}}};
}
const selectedPoint=v=>v.derivePoint==='B'?'B':'A';
function coordinate(t,token){return token==='a'?t.model.a:/^[AB]\.[xy]$/.test(token||'')?t.points[token[0]]?.[token[2]]||null:null}
function tokens(t,v,phase){
 if(phase==='derive-fill')return ['A.x','A.y','B.x','B.y'];
 if(phase==='derive-substitute'){const p=selectedPoint(v);return [p+'.x',p+'.y','a']}
 if(phase==='derive-formula'){const a=M.parse(v.a)||t.model.a,b=M.parse(v.b);if(!b)return [];return [a,W.mul(-1,b),b,W.q(0),W.q(1)].map(W.text).filter((q,i,all)=>all.indexOf(q)===i).concat('+','−')}
 return [];
}
const syntax=message=>({ok:false,kind:'interaction_error',code:'input.missing',message,keep:{}});
const result=(ok,code,message,keep={})=>({ok,kind:ok?'correct':'hypothesis',code:ok?null:code,message,keep});
function check(t,v,phase){
 if(phase==='derive-fill')return H.check(t,v,'hill-fill');
 if(phase==='derive-substitute'){
  if(!subSlots.every(k=>coordinate(t,v[k])&&tokens(t,v,phase).includes(v[k])))return syntax('Vul de drie vakjes met de gegevens van het gekozen punt en de helling.');
  const p=selectedPoint(v),want={subY:p+'.y',subA:'a',subX:p+'.x'},keep=Object.fromEntries(subSlots.map(k=>[k,v[k]===want[k]])),ok=Object.values(keep).every(Boolean);
  return result(ok,'substitution.position',ok?'Juist ingevuld. Bereken nu het product.':'Zet de y-coördinaat links, a bij de vermenigvuldiging en de x-coördinaat ernaast.',keep);
 }
 if(phase==='derive-formula'){
  const a=M.parse(v.answerFactor),b=M.parse(v.answerConstant);if(!a||!b||!['+','−'].includes(v.answerSign))return syntax('Vul de coëfficiënt, het teken en de constante term in.');
  const r=W.constructionCheck({skill:'equation_from_ab',params:{model:t.model}},{a,b,variable:'x',sign:v.answerSign}),bOK=W.eq(W.mul(v.answerSign==='−'?-1:1,b),t.model.b);
  return result(r.ok,r.code,r.ok?'Juist! Je voorschrift past bij de gegevens.':'Gebruik jouw gevonden a en b. Het teken en het laatste getal vormen samen b.',{answerFactor:W.eq(a,t.model.a),answerSign:bOK,answerConstant:bOK});
 }
 const entry={ 'derive-slope':['a','a'], 'derive-product':['product','ax'], 'derive-intercept':['b','b']}[phase];
 if(!entry)return syntax('Deze stap is niet beschikbaar.');
 const value=M.parse(v[entry[0]]);if(!value)return syntax('Vul een getal in. Een decimaal of breuk mag ook.');
 const r=W.check(t.legacy,{index:W.stages(t.legacy).indexOf(entry[1]),values:{point:selectedPoint(v)}},value);
 const messages={'derive-slope':['De helling klopt. Kies nu een punt om b te bepalen.','Deel het y-verschil door het x-verschil. Houd dezelfde richting.'],'derive-product':['Het product klopt. Maak nu b vrij.','Bereken a maal de x-coördinaat. Let op de tekens.'],'derive-intercept':['Je hebt b juist bepaald.','Trek het product a · x af van de y-coördinaat. Let op: een negatief getal aftrekken is optellen.']};
 return result(r.ok,r.code,messages[phase][r.ok?0:1]);
}
function retainedFields(phase){return phase==='derive-fill'?slopeSlots:phase==='derive-substitute'?[...subSlots,'derivePoint']:phase==='derive-slope'?['a']:phase==='derive-product'?['product']:phase==='derive-intercept'?['b']:formulaSlots}
function hints(t,phase){const first={ 'derive-fill':'Teller: y-verschil. Noemer: x-verschil. Kies dezelfde richting.', 'derive-slope':'Bereken eerst beide verschillen, en deel daarna.', 'derive-substitute':'Een punt geeft x én y. Vul beide op de juiste plaats in.', 'derive-product':'Vermenigvuldig de helling met de x-coördinaat.', 'derive-intercept':'Maak b vrij door aan beide kanten hetzelfde af te trekken.', 'derive-formula':'Gebruik je gevonden waarden in y = ax + b.'};return [first[phase]||'Werk stap voor stap.', 'b is de y-coördinaat van het snijpunt met de y-as.', 'Voor een punt op de rechte geldt y = a · x + b. Dus b = y − a · x.', 'Bij x = 0 is het product a · x nul. Bij negatieve getallen helpen haakjes.', 'Ander voorbeeld: a = 4 en P(2, 13). Dan b = 13 − 4 · 2 = 5, dus y = 4x + 5. Probeer een nieuw geval.']}
return Object.freeze({skills,count,titles,firstPhase,phases,nextPhase,slots,makeTask,selectedPoint,coordinate,tokens,check,retainedFields,hints});
});
