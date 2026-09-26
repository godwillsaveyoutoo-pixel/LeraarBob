/* Formulewerf A: exact construction and algebra adapters; no new mastery rules. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('../trainer/wave-core.js'),require('./semantic-math-core.js'));else root.RechtenV2Formula=factory(root.RechtenWave,root.RechtenV2Math)})(globalThis,function(W,M){
'use strict';
const skills=['equation_from_ab','graph_from_equation','equation_from_graph','rewrite_linear_equation'],count=6;
const titles={equation_from_ab:'Voorschrift uit a en b',graph_from_equation:'Rechte uit voorschrift',equation_from_graph:'Voorschrift uit grafiek',rewrite_linear_equation:'Vergelijking herschrijven'};
const slots=['factor','variable','operator','constant'];
const phases={equation_from_ab:'formula-build',graph_from_equation:'formula-plot',equation_from_graph:'formula-read',rewrite_linear_equation:'formula-rewrite'};
const firstPhase=skill=>phases[skill];
const hints={
 equation_from_ab:['Gebruik de vorm y = ax + b.','De coëfficiënt van x is a. De constante term is b.','Kies het teken en het getal zo dat ze samen b voorstellen.','Ook 0 en negatieve coëfficiënten zijn mogelijk. Een bouwsteen mag je meermaals gebruiken.','Ander voorbeeld: a = −3 en b = 4 geven y = −3x + 4. Probeer een nieuw geval.'],
 graph_from_equation:['Bepaal zelf a en b uit het voorschrift.','b geeft de y-coördinaat van het snijpunt met de y-as.','a vertelt hoe y verandert als x met één toeneemt. Let op het teken.','Je kunt ook twee x-waarden kiezen en hun y-waarden berekenen. Gebruik twee verschillende punten.','Ander voorbeeld: bij y = −3x + 4 liggen (0, 4) en (1, 1) op de rechte. Probeer een nieuw geval.'],
 equation_from_graph:['Lees eerst b af. Onderzoek daarna hoe de rechte stijgt of daalt.','Op de y-as is x = 0. De hoogte van de rechte is daar b.','Kies twee goed afleesbare roosterpunten. a is Δy gedeeld door Δx.','Bij een horizontale rechte is a = 0. Een dalende rechte heeft een negatieve a.','Ander voorbeeld: een rechte door (0, 4) en (1, 1) heeft a = −3 en b = 4. Probeer een nieuw geval.'],
 rewrite_linear_equation:['Werk tot y alleen links staat.','Pas elke bewerking toe op beide volledige leden.','Werk de x-term en eventuele constante links weg.','Deel beide leden door de coëfficiënt van y. Je mag ook een andere geldige volgorde kiezen.','Ander voorbeeld: 3y + 9x = 12 wordt 3y = −9x + 12 en dan y = −3x + 4. Probeer een nieuw geval.']
};
function makeTask(skill,index=0,run=1){
 if(!skills.includes(skill))throw Error('Onbekende Formulewerf-vaardigheid');
 const rows=skill==='equation_from_ab'?[[2,2],[-1,3],[1,-2],[.5,0],[-.5,-1],[0,2]]:skill==='rewrite_linear_equation'?[[2,3],[-1,-2],[.5,1],[-.5,-1],[0,2],[1,0]]:[[2,1],[1,-1],[-1,2],[.5,-2],[-.5,1],[0,-1]];
 const [slope,intercept]=rows[index%count],model={kind:'affine',a:W.fromNumber(slope),b:W.fromNumber(intercept+[0,1,-1][(run-1)%3])};
 const factor=W.q([2,3,-2,2,4,-2][index%count]),equation={left:W.expr(W.mul(-1,W.mul(model.a,factor)),factor),right:W.expr(0,0,W.mul(model.b,factor))};
 const tokens=[model.a,W.q(Math.abs(model.b.n),model.b.d),W.mul(-1,model.a),model.b,W.q(0),W.q(1),W.q(-1),W.q(2)].map(W.text).filter((v,i,a)=>a.indexOf(v)===i);
 // Shuffle only the number tiles; their order must not encode the solution.
 let seed=run*31+index*19;for(let i=tokens.length-1;i>0;i--){seed=(seed*1664525+1013904223)>>>0;const j=seed%(i+1);[tokens[i],tokens[j]]=[tokens[j],tokens[i]]}tokens.push('x','+','−');
 return {id:`rechten-v2:formulewerf:${skill}:${run}:${index}`,world:'formulewerf',skill_id:skill,family_id:'F7',index,count,model,equation,tokens,gridStep:model.a.d>1?.5:1,parameterStep:.5,bounds:{xMin:-5,xMax:5,yMin:-5,yMax:5},mode:index===0?'discover':'practice',variant:!model.a.n?'horizontal':model.a.d>1?(model.a.n<0?'negative-fraction':'positive-fraction'):model.a.n<0?'negative':'positive',given_representations:[skill==='equation_from_ab'?'coefficients':skill==='equation_from_graph'?'graph':'equation'],hints:[...hints[skill]],legacy:{skill:skill==='equation_from_graph'?'equation_from_ab':skill,params:{model,equation,scaleX:W.q(1),scaleY:W.q(1)}}};
}
const syntax=message=>({ok:false,kind:'interaction_error',code:'input.missing',message,keep:{}});
const result=(ok,code,message,keep={})=>({ok,kind:ok?'correct':'hypothesis',code:ok?null:code,message,keep});
const validPoint=(t,p)=>!!p&&['x','y'].every(k=>typeof p[k]==='number'&&Number.isFinite(p[k])&&Math.abs(p[k])<=5&&Number.isInteger(p[k]/t.gridStep));
const rationalPoint=p=>({x:W.fromNumber(p.x),y:W.fromNumber(p.y)});
function currentEquation(t,v){return v.algebraSteps?.at(-1)?.equation||t.equation}
function operations(t,v){const e=currentEquation(t,v),abs=q=>W.q(Math.abs(q.n),q.d),x=abs(e.left.x.n?e.left.x:t.equation.left.x.n?t.equation.left.x:W.q(2)),c=abs(e.left.c.n?e.left.c:e.right.c.n?e.right.c:W.q(1)),factor=!W.eq(e.left.y,1)&&e.left.y.n?e.left.y:t.equation.left.y;
 return [{kind:'add',term:'x',value:x},{kind:'subtract',term:'x',value:x},{kind:'add',term:'c',value:c},{kind:'subtract',term:'c',value:c},{kind:'divide',value:factor},{kind:'divide',value:W.div(1,factor),multiply:true}];
}
function operationLabel(op){const value=op.multiply?W.div(1,op.value):op.value,label=W.text(value),wrapped=value.n<0?'('+label+')':label;return (op.kind==='divide'?(op.multiply?'× ':'÷ '):op.kind==='add'?'+':'−')+wrapped+(op.kind!=='divide'&&op.term==='x'?'x':'')}
function applyOperation(t,v,index){const op=operations(t,v)[index];if(!op)return {error:'Kies een bewerking.'};if((v.algebraSteps?.length||0)>=8)return {error:'Maak een stap ongedaan om je uitwerking kort te houden.'};const r=W.check(t.legacy,{index:0,equation:currentEquation(t,v)},op);return r.ok?{equation:r.next,operation:operationLabel(op)}:{error:r.message}}
function check(t,v,phase){
 if(phase==='formula-build'){
  const a=M.parse(v.factor),b=M.parse(v.constant);if(!a||!b||v.variable!=='x'||!['+','−'].includes(v.operator))return syntax('Vul de vier vakjes in: getal, x, teken en getal.');
  const r=W.constructionCheck(t.legacy,{a,b,variable:v.variable,sign:v.operator}),aOK=W.eq(a,t.model.a),bOK=W.eq(W.mul(v.operator==='−'?-1:1,b),t.model.b);
  return result(r.ok,r.code,r.ok?'Juist: je voorschrift heeft de gegeven a en b.':r.message,{factor:aOK,variable:true,operator:bOK,constant:bOK});
 }
 if(phase==='formula-plot'){
  if(!validPoint(t,v.plotA)||!validPoint(t,v.plotB))return syntax('Plaats eerst twee punten op het rooster.');
  const points=[rationalPoint(v.plotA),rationalPoint(v.plotB)],r=W.constructionCheck(t.legacy,points),same=W.eq(points[0].x,points[1].x)&&W.eq(points[0].y,points[1].y),keep={plotA:W.onLine(points[0],t.model),plotB:!same&&W.onLine(points[1],t.model)};
  return result(r.ok,r.code,r.ok?'Juist: de rechte door jouw punten hoort bij het voorschrift.':r.message,keep);
 }
 if(phase==='formula-read'){
  const a=M.parse(v.a),b=M.parse(v.b);if(!a||!b)return syntax('Vul a en b in. Een breuk of decimaal mag ook.');
  const r=W.constructionCheck(t.legacy,{a,b,variable:'x',sign:'+'}),keep={a:W.eq(a,t.model.a),b:W.eq(b,t.model.b)};
  return result(r.ok,r.code,r.ok?'Juist: a en b beschrijven deze grafiek.':!keep.b?'Lees b opnieuw af op de y-as. Een juiste a blijft staan.':'Controleer de verandering van y per stap in x. Een juiste b blijft staan.',keep);
 }
 if(phase==='formula-rewrite'){
  if(!v.algebraSteps?.length)return syntax('Kies eerst een bewerking voor beide leden.');
  const equation=currentEquation(t,v);if(!W.equivalent(t.equation,equation))return result(false,'algebra.equivalence','Je uitwerking moet dezelfde vergelijking blijven voorstellen. Gebruik ongedaan maken.');
  const r=W.check(t.legacy,{index:0,equation},{kind:'finish'});return result(r.ok,r.code,r.ok?'Juist: y staat alleen links en de vergelijking is equivalent.':r.message);
 }
 return syntax('Deze stap is niet beschikbaar.');
}
return Object.freeze({skills,count,titles,slots,firstPhase,makeTask,validPoint,currentEquation,operations,operationLabel,applyOperation,check});
});
