/* Exact inverse inputs and point membership, with independently retained steps. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('../core/wave-core.js'),require('./semantic-math-core.js'),require('./values-core.js'));else root.RechtenV2Checks=factory(root.RechtenWave,root.RechtenV2Math,root.RechtenV2Values)})(globalThis,function(W,M,V){
'use strict';
const skills=['input_from_output','point_on_line'],count=6;
const output=(t,x)=>W.add(W.mul(t.model.a,x),t.model.b);
function makeTask(skill,index=0,run=1){
 if(!skills.includes(skill))throw Error('Onbekende controlevaardigheid');
 const offset=[0,1,-1][(run-1)%3],inverse=skill==='input_from_output';
 const [a,b,x,y]=inverse?[[2,1,0,9],[-3,2,0,11],[2,-1,0,0],[-.5,-2,0,-3.5],[0,3,0,3],[0,-2,0,1]][index%count]:[[2,1,2,5],[-1,3,-2,4],[.5,-1,-3,-2.5],[-.5,0,3,-1],[0,-2,4,-2],[0,2,-3,3]][index%count];
 const model={kind:'affine',a:W.fromNumber(a),b:W.fromNumber(b+offset)},target=W.fromNumber(y+offset),point={x:W.fromNumber(x),y:target};
 const solution=a?W.div(W.sub(target,model.b),model.a):null;
 const variant=inverse?(a?(solution.d>1?'fraction':solution.n<0?'negative':'integer'):W.eq(target,model.b)?'all':'none'):(!a?'constant-':'')+(W.eq(output({model},point.x),point.y)?'on':'off');
 return {id:`rechten-v2:signaalstad:${skill}:${run}:${index}`,world:'signaalstad',skill_id:skill,family_id:'F4',index,count,model,target,point,solution,variant,mode:index===0?'discover':'practice',given_representations:inverse?['formula','output']:['formula','point'],hints:inverse?[
  'De functiewaarde is gegeven. Welke invoer x levert die waarde op?',
  'Vervang f(x) door de gegeven functiewaarde. x blijft onbekend.',
  a?'Werk eerst de constante term weg aan beide kanten. Deel daarna door de coëfficiënt van x.':'Bij a = 0 is de functiewaarde altijd b. Vergelijk die vaste waarde met de gevraagde uitvoer.',
  a?'Controleer je gevonden x door die in het oorspronkelijke voorschrift in te vullen.':'Een constante functie levert de gevraagde uitvoer voor elke x of voor geen enkele x.',
  'Ander voorbeeld: f(x) = 2x + 3 en f(x) = 11. Dan 2x = 8, dus x = 4. Controle: 2 · 4 + 3 = 11. Probeer een nieuw geval.'
 ]:[
  'Voer de x-coördinaat van het punt in. Vergelijk de uitkomst met zijn y-coördinaat.',
  'In P = (x; y) staat de invoer eerst en de hoogte daarna.',
  'Bereken eerst het product a · x en verwerk dan de constante term b.',
  'Een punt ligt precies op de rechte als f(x) gelijk is aan zijn y-coördinaat. Bijna gelijk is niet genoeg.',
  'Ander voorbeeld: f(x) = 2x + 1 en P = (3; 8). f(3) = 7. Omdat 7 niet gelijk is aan 8, ligt P niet op de rechte. Probeer een nieuw geval.'
 ]};
}
const firstPhase=skill=>skill==='input_from_output'?'input-equation':'point-substitute';
const phases=t=>t.skill_id==='input_from_output'?['input-equation',...(t.model.a.n?['input-isolate','input-solve','input-verify']:['input-constant'])]:['point-substitute','point-calculate','point-verdict'];
function nextPhase(t,phase){const p=phases(t);return p[p.indexOf(phase)+1]||'next-task'}
const fields=(t,phase=firstPhase(t.skill_id))=>({'input-equation':['givenOutput'],'input-isolate':['residual'],'input-solve':['input'],'input-verify':['verification'],'input-constant':['constantValue','solutions'],'point-substitute':['substitution'],'point-calculate':['product','answer'],'point-verdict':['verdict']}[phase]||[]);
const numericFields=(t,phase)=>fields(t,phase).filter(name=>!['solutions','verdict'].includes(name));
function expected(t,name){switch(name){case 'givenOutput':case 'verification':return t.target;case 'residual':return W.sub(t.target,t.model.b);case 'input':return t.solution;case 'constantValue':return t.model.b;case 'solutions':return W.eq(t.target,t.model.b)?'all':'none';case 'substitution':return t.point.x;case 'product':return W.mul(t.model.a,t.point.x);case 'answer':return output(t,t.point.x);case 'verdict':return W.eq(output(t,t.point.x),t.point.y)?'on':'off';default:return null}}
function check(t,v,phase){
 if(!phases(t).includes(phase))return {ok:false,kind:'interaction_error',code:'input.phase',message:'Deze stap is niet beschikbaar.',keep:{}};
 const names=fields(t,phase),numeric=numericFields(t,phase),parsed=Object.fromEntries(names.map(name=>[name,numeric.includes(name)?M.parse(v[name]):(['on','off','all','none'].includes(v[name])?v[name]:null)]));
 const keep=Object.fromEntries(names.map(name=>[name,!!parsed[name]&&(numeric.includes(name)?W.eq(parsed[name],expected(t,name)):parsed[name]===expected(t,name))]));
 if(names.some(name=>!parsed[name]))return {ok:false,kind:'interaction_error',code:'input.missing',message:phase==='point-verdict'?'Vergelijk de twee waarden en kies of P op de rechte ligt.':phase==='input-constant'?'Vul de vaste functiewaarde in en kies hoeveel x-waarden mogelijk zijn.':'Vul elk antwoordvak van deze stap in. Een breuk of decimaal mag ook.',keep};
 const wrong=names.find(name=>!keep[name]),messages={
  givenOutput:'De functiewaarde is gegeven. Vul die in voor f(x); x blijft de onbekende.',
  residual:`Werk de constante term ${W.text(t.model.b)} weg aan beide kanten. Bereken de gegeven uitvoer min b.`,
  input:`Deel beide kanten door ${W.text(t.model.a)} om x alleen over te houden. Let op het teken.`,
  verification:'Vul je gevonden x terug in het oorspronkelijke voorschrift. Bereken eerst het product, daarna de constante term.',
  constantValue:'Bij a = 0 is het product 0 voor elke x. De functiewaarde is dus altijd b.',
  solutions:'Vergelijk de vaste functiewaarde met de gevraagde uitvoer. Gelijk: elke x is mogelijk. Verschillend: geen enkele x is mogelijk.',
  substitution:'Vervang x door de eerste coördinaat van P. De tweede coördinaat is de y-waarde waarmee je straks vergelijkt.',
  product:'Controleer het product a · x met de x-coördinaat van P. Let op de tekens.',
  answer:'Het product klopt. Verwerk nu de constante term om f(x) te vinden.',
  verdict:'Vergelijk jouw berekende f(x) met de gegeven y-coördinaat. Alleen bij exact gelijke waarden ligt P op de rechte.'
 };
 const success={
  'input-equation':'Juist: je hebt de gegeven uitvoer ingevuld. Zoek nu welke x daarbij hoort.',
  'input-isolate':'Juist: de constante term is weggewerkt. Deel nu om x te vinden.',
  'input-solve':'Juist: je hebt x gevonden. Controleer die in het oorspronkelijke voorschrift.',
  'input-verify':`Juist: de controle levert ${W.text(t.target)} op, de gevraagde functiewaarde.`,
  'input-constant':W.eq(t.target,t.model.b)?'Juist: de uitvoer is altijd de gevraagde waarde. Elke x is mogelijk.':'Juist: de vaste uitvoer verschilt van de gevraagde waarde. Er is geen passende x.',
  'point-substitute':'Juist: de x-coördinaat staat op de plaats van x. Bereken nu f(x).',
  'point-calculate':'Juist: je hebt f(x) berekend. Vergelijk die nu met de y-coördinaat van P.',
  'point-verdict':W.eq(output(t,t.point.x),t.point.y)?'Juist: f(x) en de y-coördinaat zijn gelijk. P ligt op de rechte.':'Juist: f(x) en de y-coördinaat verschillen. P ligt niet op de rechte.'
 };
 return {ok:!wrong,kind:wrong?'hypothesis':'correct',code:wrong?'check.'+wrong:null,message:wrong?messages[wrong]:success[phase],keep};
}
function selected(m){const names=numericFields(m.task,m.phase),name=m.values.valueField;return names.includes(name)&&!m.locks[name]?name:names.find(name=>!m.locks[name])||null}
function enter(m,key,selection){if(m.feedback||m.completed)return null;const name=selected(m);if(!name)return null;const next=V.editText(m.values[name],key,selection);return next?selection?{name,...next}:{name,value:next.value}:null;}
return Object.freeze({skills,count,makeTask,output,firstPhase,phases,nextPhase,fields,numericFields,expected,check,selected,enter});
});
