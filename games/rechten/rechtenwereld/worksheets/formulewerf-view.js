(function(root,factory){if(typeof module==='object')module.exports=factory(require('../../core/wave-core.js'),require('./formulewerf-core.js'),require('../../../../shared/worksheet-render.js'));else root.FormulewerfWorksheetView=factory(root.RechtenWave,root.FormulewerfWorksheet,root.LeraarBobWorksheetRender)})(globalThis,(W,C,R)=>{
'use strict';
const n=W.html,blank='<span class="answer-blank">&nbsp;</span>',lines=count=>`<div class="writing-lines" aria-label="Schrijfruimte">${'<span></span>'.repeat(count)}</div>`;
const pair=p=>`(${n(p.x)}; ${n(p.y)})`,term=q=>q.n<0?'('+n(q)+')':n(q),formula=t=>W.formula(t.params.model.a,t.params.model.b);
function equation(e){const member=(m,order)=>{let out='';for(const k of order){const q=m[k];if(!q.n)continue;const abs=W.q(Math.abs(q.n),q.d);out+=(out?(q.n<0?' − ':' + '):q.n<0?'−':'')+(k!=='c'&&W.eq(abs,1)?'':n(abs))+(k==='c'?'':k)}return out||'0'};return member(e.left,['y','x','c'])+' = '+member(e.right,['x','y','c'])}
function table(rows){return `<table class="worksheet-values"><tbody><tr><th scope="row">x</th>${rows.map(p=>`<td>${n(p.x)}</td>`).join('')}</tr><tr><th scope="row">y</th>${rows.map(p=>`<td>${n(p.y)}</td>`).join('')}</tr></tbody></table>`}
function given(t){const {model,points,table:rows}=t.params;if(rows)return table(rows);if(t.type==='equation_from_two_points')return `<p class="given math">A ${pair(points.A)} &nbsp; B ${pair(points.B)}</p>`;return `<p class="given math">a = ${n(model.a)} &nbsp; P ${pair(points.A)}</p>`}
function graph(t,key=false){
 const {model}=t.params,X=x=>140+22*(typeof x==='number'?x:W.num(x)),Y=y=>140-22*(typeof y==='number'?y:W.num(y)),clip='clip-'+t.id+(key?'-key':'');let svg='';
 for(let i=-5;i<=5;i+=.5){const whole=Number.isInteger(i);svg+=`<path d="M${X(i)} 30V250M30 ${Y(i)}H250" stroke="${whole?'#a6b5b9':'#d8dfe1'}" stroke-width="${whole?.8:.5}"/>`;if(!whole)svg+=`<path d="M${X(i)} 137V143M137 ${Y(i)}H143" stroke="#61777e" stroke-width=".8"/>`;}
 svg+='<path d="M30 140H255l-5-3m5 3-5 3M140 250V25l-3 5m3-5 3 5" stroke="#263b40" stroke-width="1.2" fill="none"/>';
 for(let i=-4;i<=4;i++)if(i)svg+=`<text x="${X(i)}" y="156" text-anchor="middle">${i}</text><text x="130" y="${Y(i)+4}" text-anchor="end">${i}</text>`;
 svg+='<text x="145" y="156">0</text><text x="262" y="139">x</text><text x="147" y="22">y</text><text x="140" y="276" text-anchor="middle" font-size="10">1 klein hokje = ½ = 0,5</text>';
 if(key||t.type==='equation_from_graph')svg+=`<path d="M30 ${Y(W.add(W.mul(model.a,-5),model.b))}L250 ${Y(W.add(W.mul(model.a,5),model.b))}" stroke="#182c32" stroke-width="1.8" clip-path="url(#${clip})"/>`;
 return `<svg class="worksheet-grid" viewBox="0 0 280 280" role="img" aria-label="${key||t.type==='equation_from_graph'?'Grafiek van een rechte':'Leeg tekenrooster'}; één klein hokje is een halve eenheid"><defs><clipPath id="${clip}"><rect x="30" y="30" width="220" height="220"/></clipPath></defs>${svg}</svg>`;
}
function student(t){const {model}=t.params;
 switch(t.type){
 case 'equation_from_ab':return `<p class="given math">a = ${n(model.a)} &nbsp; b = ${n(model.b)}</p><p>Schrijf het voorschrift.</p>${t.guided?'<p class="hint">Vul a en b in y = ax + b in. Let op het teken van b.</p>':''}${lines(4)}`;
 case 'graph_from_equation':return `<p class="given math">${formula(t)}</p><p>Teken de rechte. Bereken eerst twee verschillende punten.</p>${t.guided?`<p class="hint">Kies eerst x = 0. Kies daarna een andere x met een punt binnen het rooster.</p>`:''}<p>P (${blank}; ${blank})</p><p>Q (${blank}; ${blank})</p>${lines(3)}`;
 case 'equation_from_graph':return `<p>Bepaal het voorschrift van deze rechte.</p>${t.guided?`<p class="hint">Lees b af op de y-as. Kies twee roosterpunten om a te bepalen.</p><p>b = ${blank} &nbsp; a = ${blank}</p>`:''}${lines(6)}`;
 case 'rewrite_linear_equation':return `<p class="given math">${equation(t.params.equation)}</p><p>Schrijf in de vorm y = ax + b.</p>${t.guided?'<p class="hint">Isoleer y. Voer elke bewerking uit op beide volledige leden.</p>':''}${lines(5)}`;
 default:{const slope=['equation_from_two_points','equation_from_table'].includes(t.type),onlyB=t.type==='intercept_from_point';return `${given(t)}<p>${onlyB?'Bereken de y-afsnede b.':'Bepaal het voorschrift y = ax + b.'}</p>${t.guided?`<p class="hint">${slope?'Bereken a met twee verschillende punten. ':''}Vul ${slope?'één van de punten':'P'} in y = ax + b in. Bepaal daarna b.</p>${slope?`<p>a = (${blank} − ${blank}) / (${blank} − ${blank}) = ${blank}</p>`:''}<p>${blank} = ${blank} · ${blank} + b</p><p>b = ${blank}</p>${onlyB?'':`<p>Voorschrift: y = ${blank}</p>`}${lines(2)}`:lines(t.params.table?6:7)}`;}
 }
}
function answer(t){const {model,points}=t.params,{a,b}=model;
 switch(t.type){
 case 'equation_from_ab':return `<p>a = ${n(a)} &nbsp; b = ${n(b)}</p><p class="math"><strong>${formula(t)}</strong></p><p>Ook een gelijkwaardige, nog niet vereenvoudigde vorm is juist.</p>`;
 case 'graph_from_equation':{const x=W.q(a.d),rows=[{x:W.q(0),y:b},{x,y:W.add(W.mul(a,x),b)}];if(Math.abs(W.num(rows[1].y))>5){rows[1].x=W.mul(-1,x);rows[1].y=W.add(W.mul(a,rows[1].x),b)}return `<p class="math">${formula(t)}</p><p>Bijvoorbeeld met deze punten:</p>${table(rows)}<p>Teken de volledige rechte door beide punten. Andere juiste punten zijn ook goed.</p>`;}
 case 'equation_from_graph':return `<p>b = ${n(b)}</p><p>Bij Δx = ${a.d} hoort Δy = ${a.n}.</p><p>a = ${n(a)}</p><p class="math"><strong>${formula(t)}</strong></p>`;
 case 'rewrite_linear_equation':return `<p class="math">${equation(t.params.equation)}</p><p class="math">${n(t.params.equation.left.y)}y = ${W.formula(W.mul(a,t.params.equation.left.y),W.mul(b,t.params.equation.left.y)).replace('y = ','')}</p><p>Deel beide leden door ${n(t.params.equation.left.y)}.</p><p class="math"><strong>${formula(t)}</strong></p><p>Een andere equivalente volgorde is ook juist.</p>`;
 default:{const p=points.A,slope=['equation_from_two_points','equation_from_table'].includes(t.type);return `${given(t)}${slope?`<p class="math">a = (${term(points.B.y)} − ${term(p.y)}) / (${term(points.B.x)} − ${term(p.x)}) = ${n(a)}</p>`:''}<p class="math">${n(p.y)} = ${term(a)} · ${term(p.x)} + b</p><p class="math">b = ${term(p.y)} − ${term(W.mul(a,p.x))} = <strong>${n(b)}</strong></p>${t.type==='intercept_from_point'?'':`<p class="math"><strong>${formula(t)}</strong></p>`}<p>Controle: invullen van ${slope?'beide punten':'het gegeven punt'} moet kloppen.</p>`;}
 }
}
function render(doc,kind='questions'){return R.render(doc,kind,{title:'Formulewerf',types:C.types,modes:C.modes,graph,student,answer})}
return Object.freeze({render,graph,student,answer,equation});
});
