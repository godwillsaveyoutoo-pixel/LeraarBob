(function(root,factory){if(typeof module==='object')module.exports=factory(require('../../core/wave-core.js'),require('./grenspas-core.js'),require('../../../../shared/worksheet-render.js'));else root.GrenspasWorksheetView=factory(root.RechtenWave,root.GrenspasWorksheet,root.LeraarBobWorksheetRender)})(globalThis,(W,C,R)=>{
'use strict';
const n=W.html,blank='<span class="answer-blank">&nbsp;</span>';
const lines=count=>`<div class="writing-lines" aria-label="Schrijfruimte">${'<span></span>'.repeat(count)}</div>`;
const term=q=>q.n<0?'('+n(q)+')':n(q);
const formula=t=>W.formula(t.params.model.a,t.params.model.b).replace('y =','f(x) =');
function graph(t,key=false){
 const {model,root}=t.params,py=y=>140-22*W.num(y),clip=`clip-${t.id}-${key?'key':'questions'}`;let svg='';
 for(let i=-5;i<=5;i+=.5){const p=140+22*i,whole=Number.isInteger(i);svg+=`<path d="M${p} 30V250M30 ${p}H250" stroke="${whole?'#bec4c5':'#e3e6e6'}" stroke-width="${whole?.7:.45}"/>`;}
 svg+='<path d="M30 140H255l-5-3m5 3-5 3M140 250V25l-3 5m3-5 3 5" stroke="#263b40" stroke-width="1.2" fill="none"/>';
 for(let i=-4;i<=4;i++)if(i)svg+=`<text x="${140+22*i}" y="156" text-anchor="middle">${i}</text><text x="130" y="${144-22*i}" text-anchor="end">${i}</text>`;
 svg+='<text x="145" y="156">0</text><text x="262" y="139">x</text><text x="147" y="22">f(x)</text>';
 svg+=`<path d="M30 ${py(W.add(W.mul(model.a,-5),model.b))}L250 ${py(W.add(W.mul(model.a,5),model.b))}" stroke="#182c32" stroke-width="1.8" clip-path="url(#${clip})"/>`;
 if(key)svg+=`<circle cx="${140+22*W.num(root)}" cy="140" r="3.5" fill="#182c32" stroke="#182c32" stroke-width="1.5"/>`;
 return `<svg class="worksheet-grid" viewBox="0 0 280 280" role="img" aria-label="Grafiek van een lineaire functie; de kleine roosterstap is een halve eenheid"><defs><clipPath id="${clip}"><rect x="30" y="30" width="220" height="220"/></clipPath></defs>${svg}</svg>`;
}
function signchart(t,key=false){
 const root=key?n(t.params.root):blank,{chartLeft,chartZero,chartRight}=t.chart;
 return `<table class="worksheet-signchart" aria-label="${key?'Ingevuld':'In te vullen'} tekenschema"><tbody><tr><th scope="row">x</th><td>−∞</td><td>${root}</td><td>+∞</td></tr><tr><th scope="row">f(x)</th><td>${key?chartLeft:blank}</td><td>${key?chartZero:blank}</td><td>${key?chartRight:blank}</td></tr></tbody></table>`;
}
function student(t){
 const given=t.graph?'':`<p class="given math">${formula(t)}</p>`;
 switch(t.type){
 case 'zeroRead':return `<p>Lees de nulwaarde af uit de grafiek.</p>${t.guided?`<p class="hint">Zoek het snijpunt met de x-as. Eén klein hokje is 0,5.</p><p>Daar is f(x) = ${blank}.</p>`:''}<p>De nulwaarde is x = ${blank}.</p><p>Het snijpunt is (${blank}; ${blank}).</p>${lines(2)}`;
 case 'zero':return `${given}<p>Bereken de nulwaarde. Controleer je antwoord.</p>${t.guided?`<p class="hint">Stel f(x) = 0. Isoleer daarna x.</p><p class="math">${W.formula(t.params.model.a,0).replace('y = ','')} = ${blank}</p><p>x = ${blank}</p><p>Controle: f(${blank}) = ${blank}</p>${lines(1)}`:lines(6)}`;
 case 'signchart':return `${given}<p>Vul de nulwaarde en de tekens van f(x) in.</p>${t.guided?'<p class="hint">Zoek eerst de nulwaarde. Controleer het teken links, op en rechts van die grens.</p>':''}${signchart(t)}<p>Leg je keuze van de tekens uit.</p>${lines(2)}`;
 case 'positive':case 'negative':{const symbol=t.type==='positive'?'&gt;':'&lt;',word=t.type==='positive'?'boven':'onder';return `<p>Voor welke x-waarden is f(x) ${symbol} 0?</p>${t.guided?`<p class="hint">Zoek de nulwaarde. Waar ligt de grafiek ${word} de x-as?</p>${signchart(t)}`:lines(3)}<p>Antwoord: x ${blank}</p><p>Hoort de nulwaarde erbij? Leg uit.</p>${lines(2)}`;}
 }
}
function answer(t){
 const {root,model}=t.params,atZero=W.add(W.mul(model.a,root),model.b),direction=model.a.n>0?'stijgende':'dalende';
 switch(t.type){
 case 'zeroRead':return `<p>De nulwaarde is <strong>x = ${n(root)}</strong>.</p><p>Het snijpunt met de x-as is (${n(root)}; 0). Daar is f(x) = 0.</p><p>Lees de x-coördinaat af, niet de y-coördinaat.</p>`;
 case 'zero':return `<p class="given math">${formula(t)}</p><p>${formula(t).replace('f(x) =','0 =')}</p><p class="math">${W.formula(model.a,0).replace('y = ','')} = ${n(W.mul(-1,model.b))}</p><p><strong>x = ${n(root)}</strong></p><p>Controle:</p><p class="math">f(${n(root)}) = ${term(model.a)} · ${term(root)} ${model.b.n<0?'−':'+'} ${n(W.q(Math.abs(model.b.n),model.b.d))} = ${n(atZero)}</p>`;
 case 'signchart':return `${t.graph?'':`<p class="given math">${formula(t)}</p>`}${signchart(t,true)}<p>Bij deze ${direction} rechte is f(x) links ${t.chart.chartLeft==='+'?'positief':'negatief'} en rechts ${t.chart.chartRight==='+'?'positief':'negatief'}.</p><p>Op x = ${n(root)} geldt f(x) = 0.</p>`;
 case 'positive':case 'negative':{const symbol=t.type==='positive'?'&gt;':'&lt;';return `${signchart(t,true)}<p><strong>f(x) ${symbol} 0 voor x ${t.symbol==='>'?'&gt;':'&lt;'} ${n(root)}.</strong></p><p>De nulwaarde hoort er <strong>niet</strong> bij: daar is f(x) = 0.</p><p>Het gaat om de x-waarden ${t.symbol==='>'?'rechts':'links'} van de grens, ook buiten het getekende rooster.</p>`;}
 }
}
function render(doc,kind='questions'){return R.render(doc,kind,{title:'Grenspas',types:C.types,modes:C.modes,graph,student,answer})}
return Object.freeze({render,graph,student,answer});
});
