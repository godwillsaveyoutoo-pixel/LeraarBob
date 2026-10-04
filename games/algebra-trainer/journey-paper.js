(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'),require('./learning-core.js'));else root.AlgebraJourneyPaper=factory(root.AlgebraCore,root.AlgebraLearning)})(globalThis,(C,L)=>{
'use strict';
function question(t){
 const eq=C.latexEq(t.ex.start,t.ex.policy),math=t.display||eq;
 const extra=t.kind==='repair'?'Foute regel: '+C.fallbackText(C.latexEq(t.fault,t.ex.policy)):t.kind==='verify'?'Voorgesteld: x = '+C.fallbackText(C.ratLatex(t.proposed,t.ex.policy)):t.kind==='routes'?t.routes.map((r,i)=>(i?'B':'A')+': '+L.operationText(r,t.ex.policy)+' op beide leden.').join('   '):'';
 return {math,prompt:t.prompt,extra,kind:t.kind};
}
function answer(t){
 if(t.kind==='solve')return {lines:t.ex.states.map(s=>C.latexEq(s,t.ex.policy)),note:'Eén standaardroute. Andere equivalente routes zijn ook geldig.'};
 if(['repair','predict','expand'].includes(t.kind))return {lines:[C.latexEq(t.expected,t.ex.policy)],note:t.kind==='repair'?'De buitenfactor moet elke term binnen de groep vermenigvuldigen.':''};
 if(t.kind==='build')return {lines:[C.ratLatex(t.expectedNumber,t.ex.policy)],note:'Getal in het vak.'};
 if(t.kind==='verify'){const a=L.evaluate(t.ex.start.l,t.proposed),b=L.evaluate(t.ex.start.r,t.proposed);return {lines:['L = '+C.ratLatex(a,t.ex.policy),'R = '+C.ratLatex(b,t.ex.policy)],note:a.eq(b)?'De oplossing klopt.':'De oplossing klopt niet.'};}
 if(t.kind==='routes'){const indices=t.routes.map((r,i)=>L.validate(t,{choice:String(i)}).ok?i:-1).filter(i=>i>=0);return {lines:indices.map(i=>C.latexEq(C.applyEquation(t.ex.start,t.routes[i].op,t.routes[i].operand),t.ex.policy)),note:indices.map(i=>i?'B':'A').join(' en ')+'. Beide bewerkingen zijn geldig; deze route past bij het gevraagde doel.'};}
 throw Error('Onbekende opdracht.');
}
return Object.freeze({question,answer});
});
