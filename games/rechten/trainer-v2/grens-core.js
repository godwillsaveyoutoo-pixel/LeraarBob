/* Grenspas practice sequences over the existing exact root/interval validators. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('../trainer/wave-core.js'),require('./semantic-math-core.js'));else root.RechtenV2Grens=factory(root.RechtenWave,root.RechtenV2Math)})(globalThis,function(W,M){
'use strict';
const skills=['zeroRead','zero','signchart','positive','negative'],count=6;
const titles={zeroRead:'Nulwaarde aflezen',zero:'Nulwaarde berekenen',signchart:'Tekenschema',positive:'Wanneer is f(x) > 0?',negative:'Wanneer is f(x) < 0?'};
const slots=['chartLeft','chartZero','chartRight'];
const firstPhase=skill=>skill==='signchart'?'grens-chart':['positive','negative'].includes(skill)?'grens-root':'grens-zero';
function choices(root,model,seed){
 const candidates=[root,W.mul(-1,root),model.b,W.q(0),W.add(root,1),W.sub(root,1),W.add(root,2)];
 const unique=[];for(const q of candidates)if(!unique.some(p=>W.eq(p,q)))unique.push(q);
 const result=unique.slice(0,4);for(let i=result.length-1;i>0;i--){seed=(seed*1664525+1013904223)>>>0;const j=seed%(i+1);[result[i],result[j]]=[result[j],result[i]]}return result;
}
function makeTask(skill,index=0,run=1){
 if(!skills.includes(skill))throw Error('Onbekende Grenspas-vaardigheid');
 const rows=skill==='positive'?[[-1,-2],[1,3],[-.5,0],[2,-1.5],[-2,1.5],[.5,-3]]:skill==='signchart'?[[1,1],[1,3],[-1,-2],[-.5,0],[2,-1.5],[-2,1.5]]:[[1,skill==='zeroRead'?3:2],[-1,-2],[2,0],[-.5,3],[2,1.5],[-2,-1.5]];
 const [slope,boundary]=rows[index%count],root=W.fromNumber(boundary+[0,.5,-.5][(run-1)%3]),a=W.fromNumber(slope),model={kind:'affine',a,b:W.mul(-1,W.mul(a,root))};
 const representation=skill==='zero'?'formula':skill==='signchart'&&index%2?'formula':'graph',sign=['positive','negative'].includes(skill);
 const t={id:`rechten-v2:grenspas:${skill}:${run}:${index}`,world:'grenspas',key:skill,skill_id:sign?'sign':skill,family_id:'F6',index,count,mode:index===0?'discover':'practice',variant:`${skill}:${a.n>0?'rising':'falling'}:${root.n===0?'zero':root.n<0?'negative':'positive'}:${root.d>1?'fraction':'integer'}:${representation}`,model,root,ask:skill==='negative'?'negative':'positive',representation,given_representations:[representation],bounds:{xMin:-5,xMax:5,yMin:-5,yMax:5},options:choices(root,model,run*31+index*17+skills.indexOf(skill)),hints:skill==='signchart'?[
  'Kijk links en rechts van de nulwaarde.',
  'Boven de x-as is f(x) positief; onder de x-as is f(x) negatief.',
  'Op de nulwaarde is f(x) gelijk aan 0.',
  'Bij een stijgende rechte staat links − en rechts +. Bij een dalende rechte is dat omgekeerd.',
  'Ander voorbeeld: f(x) = −x + 4 heeft nulwaarde 4 en tekens +, 0, −. Probeer een nieuw geval.'
 ]:sign?[
  'Zoek eerst waar de grafiek de x-as snijdt.',
  skill==='negative'?'Zoek de x-waarden waarvoor de grafiek onder de x-as ligt.':'Zoek de x-waarden waarvoor de grafiek boven de x-as ligt.',
  'Links van de nulwaarde betekent x < de nulwaarde; rechts betekent x > de nulwaarde.',
  'Op de nulwaarde is f(x) = 0. Die grens hoort niet bij f(x) > 0 of f(x) < 0.',
  'Ander voorbeeld: f(x) = x − 4 is positief voor x > 4 en negatief voor x < 4. Probeer een nieuw geval.'
 ]:[
  skill==='zero'?'Stel f(x) gelijk aan 0.':'Lees de x-waarde waar de grafiek de x-as snijdt.',
  'De nulwaarde is een x-waarde, niet de hoogte op de y-as.',
  'In ax + b = 0 breng je b naar rechts en deel je door a.',
  'Controleer door je gekozen x in de formule in te vullen: de uitkomst moet 0 zijn.',
  'Ander voorbeeld: 2x − 8 = 0 geeft 2x = 8 en dus x = 4. Probeer een nieuw geval.'
 ]};return {...t,hints:hintsFor(t)};
}
function hintsFor(t){return t.key==='signchart'&&t.representation==='formula'?[
 'Kijk naar de richtingscoëfficiënt a: de coëfficiënt van x.',
 'Bij x is a = 1. Bij −x is a = −1. Het losse getal is niet de richtingscoëfficiënt.',
 'Als a > 0, stijgt de rechte: links van de nulwaarde −, rechts +.',
 'Als a < 0, daalt de rechte: links van de nulwaarde +, rechts −. Op de nulwaarde staat 0.',
 'Ander voorbeeld: f(x) = −2x + 8 heeft a = −2 en nulwaarde 4. Het tekenschema is +, 0, −. Probeer een nieuw geval.'
 ]:t.hints;}
const syntax=message=>({ok:false,kind:'interaction_error',code:'input.missing',message,keep:{}});
const signOf=q=>q.n<0?'-':q.n>0?'+':'0';
function expectedChart(t){return {chartLeft:signOf(M.at(t.model,W.sub(t.root,1))),chartZero:'0',chartRight:signOf(M.at(t.model,W.add(t.root,1)))}}
function check(t,v,phase){
 if(phase==='grens-zero'||phase==='grens-root'){
  const answer=/^[0-3]$/.test(String(v.answer??''))?t.options[Number(v.answer)]:null;
  if(!answer)return syntax('Kies eerst een antwoord.');
  const r=M.checkRoot(t,W.text(answer));return {...r,keep:{answer:r.ok},message:r.ok?`Juist: de nulwaarde is ${W.text(t.root)}.`:t.representation==='formula'?`Met jouw x krijg je f(x) = ${W.text(M.at(t.model,answer))}. Zoek de x waarvoor f(x) = 0.`:r.message};
 }
 if(phase==='grens-chart'){
  if(slots.some(k=>!['-','0','+'].includes(v[k])))return syntax('Vul eerst alle drie de tekens in.');
  const want=expectedChart(t),keep=Object.fromEntries(slots.map(k=>[k,v[k]===want[k]])),wrong=slots.find(k=>!keep[k]);
  return {ok:!wrong,kind:wrong?'hypothesis':'correct',code:wrong==='chartZero'?'zero.output_zero':wrong?'sign.side_reversed':null,keep,message:!wrong?'Juist: je tekens passen links, op en rechts van de nulwaarde.':wrong==='chartZero'?'Op de nulwaarde is f(x) = 0. Behoud je juiste tekens.':t.representation==='formula'?'Kijk naar a, de coëfficiënt van x. Bij a > 0 zijn de tekens −, 0, +; bij a < 0 zijn ze +, 0, −. Je juiste tekens blijven staan.':`Kijk ${wrong==='chartLeft'?'links':'rechts'} van de nulwaarde: ligt de grafiek boven of onder de x-as? Je juiste tekens blijven staan.`};
 }
 if(phase==='grens-inequality'){
  if(!['<','=','>'].includes(v.inequality))return syntax('Kies eerst het juiste x-gebied.');
  const r=M.checkInterval(t,{boundary:W.text(t.root),symbolBoundary:W.text(t.root),closed:false,side:v.inequality==='<'?'left':v.inequality==='>'?'right':'point',symbol:v.inequality});
  return {...r,keep:{answer:true},message:r.ok?`Juist: f(x) ${t.ask==='negative'?'<':'>'} 0 voor x ${v.inequality} ${W.text(t.root)}.`:r.message};
 }
 return syntax('Deze stap is nog niet beschikbaar.');
}
return Object.freeze({skills,count,titles,slots,firstPhase,makeTask,hintsFor,expectedChart,check});
});
