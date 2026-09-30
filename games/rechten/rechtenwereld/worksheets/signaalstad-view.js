(function(root,factory){if(typeof module==='object')module.exports=factory(require('../../core/wave-core.js'),require('./signaalstad-core.js'),require('./formulewerf-view.js'),require('../../../../shared/worksheet-render.js'));else root.SignaalstadWorksheetView=factory(root.RechtenWave,root.SignaalstadWorksheet,root.FormulewerfWorksheetView,root.LeraarBobWorksheetRender)})(globalThis,(W,C,F,R)=>{
'use strict';
const n=W.html,blank='<span class="answer-blank">&nbsp;</span>',lines=count=>`<div class="writing-lines" aria-label="Schrijfruimte">${'<span></span>'.repeat(count)}</div>`;
function table(t){return `<table class="worksheet-values"><tbody><tr><th scope="row">x</th>${t.params.table.map(p=>`<td>${n(p.x)}</td>`).join('')}</tr><tr><th scope="row">f(x)</th>${t.params.table.map(p=>`<td>${n(p.y)}</td>`).join('')}</tr></tbody></table>`}
function graph(t,key=false){
 const base=F.graph(t,key);if(!key)return base;
 const pins=t.params.table.map((p,i)=>{const x=140+22*W.num(p.x),y=140-22*W.num(p.y);return `<circle cx="${x}" cy="${y}" r="3" fill="#182c32"/><text class="point-label" x="${x+(W.num(p.x)>0?-7:7)}" y="${y-8}" text-anchor="${W.num(p.x)>0?'end':'start'}">${['P','Q','R'][i]}</text>`}).join('');
 return base.replace('</svg>',pins+'</svg>');
}
function student(t){return `${table(t)}<p>Teken de rechte die bij deze tabel hoort.</p>${t.guided?`<p class="hint">Elke kolom geeft een punt (x; f(x)). Lees x en f(x) uit dezelfde kolom.</p><p>P (${blank}; ${blank})</p><p>Q (${blank}; ${blank})</p><p class="hint">Plaats twee punten en trek de rechte erdoor. Controleer met de derde kolom.</p>${lines(1)}`:`<p>Noteer de punten die je gebruikt. Controleer of je rechte bij alle kolommen past.</p>${lines(5)}`}`}
function answer(t){return `${table(t)}${t.params.table.map((p,i)=>`<p>${['P','Q','R'][i]} (${n(p.x)}; ${n(p.y)})</p>`).join('')}<p>De volledige rechte loopt door alle drie de punten. Je mag met elk tweetal beginnen.</p><p class="hint">Ter controle: ${W.formula(t.params.model.a,t.params.model.b).replace('y =','f(x) =')}. De leerling hoeft dit voorschrift niet te bepalen.</p>`}
function render(doc,kind='questions'){return R.render(doc,kind,{title:'Signaalstad',types:C.types,modes:C.modes,graph,student,answer})}
return Object.freeze({render,graph,student,answer});
});
