(function(root,factory){if(typeof module==='object')module.exports=factory(require('../../core/wave-core.js'),require('./hellingrug-core.js'),require('../../../../shared/worksheet-layout.js'));else root.HellingrugWorksheetView=factory(root.RechtenWave,root.HellingrugWorksheet,root.LeraarBobWorksheetLayout)})(globalThis,(W,C,L)=>{
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=W.html,coordinate=p=>`(${number(p.x)}; ${number(p.y)})`,term=q=>q.n<0?'('+number(q)+')':number(q);
const fraction=(a,b)=>`<span class="fraction"><span>${a}</span><span>${b}</span></span>`;
const blank='<span class="answer-blank">&nbsp;</span>';
const lines=n=>`<div class="writing-lines" aria-label="Schrijfruimte">${'<span></span>'.repeat(n)}</div>`;
function graph(t,key=false){
 const px=x=>140+W.num(x)*22,py=y=>140-W.num(y)*22,{A,B,model}=t.params;
 const clip=`clip-${t.id}-${key?'key':'questions'}`;let svg='';
 // Half-unit minor lines keep fractional coordinates readable, with equal x/y scales.
 const half=[A.x,A.y,B.x,B.y].some(n=>n.d!==1);
 for(let i=-5;i<=5;i+=half?.5:1){const p=140+i*22,integer=Number.isInteger(i);svg+=`<path d="M${p} 30V250M30 ${p}H250" stroke="${integer?'#bec4c5':'#e3e6e6'}" stroke-width="${integer?.7:.45}"/>`;}
 svg+='<path d="M30 140H255l-5-3m5 3-5 3M140 250V25l-3 5m3-5 3 5" stroke="#263b40" stroke-width="1.2" fill="none"/>';
 for(let i=-4;i<=4;i++){if(i){svg+=`<text x="${140+i*22}" y="155" text-anchor="middle">${i}</text><text x="130" y="${144-i*22}" text-anchor="end">${i}</text>`}}
 svg+='<text x="145" y="155">0</text><text x="262" y="139">x</text><text x="147" y="22">y</text>';
 if(t.type!=='special_lines'||key){
  if(model.kind==='affine')svg+=`<path d="M30 ${py(W.add(W.mul(model.a,-5),model.b))}L250 ${py(W.add(W.mul(model.a,5),model.b))}" stroke="#182c32" stroke-width="1.8" clip-path="url(#${clip})"/>`;
  if(model.kind==='vertical')svg+=`<path d="M${px(model.c)} 30V250" stroke="#182c32" stroke-width="1.8"/>`;
 }
 const points=model.kind==='identical'?[[A,'A = B']]:[[A,'A'],[B,'B']];
 for(const [p,label] of points){const x=px(p.x),y=py(p.y),left=W.num(p.x)>2,labelY=Math.abs((y-9)-150)<12?y+18:y-9;
  svg+=`<circle cx="${x}" cy="${y}" r="3.5" fill="#182c32"/><text class="point-label" x="${x+(left?-9:9)}" y="${labelY}" text-anchor="${left?'end':'start'}">${label}</text>`;
 }
 return `<svg class="worksheet-grid" viewBox="0 0 280 280" role="img" aria-label="${esc(key?'Grafiek bij het antwoord':'Coördinatenrooster met punten A en B')}"><defs><clipPath id="${clip}"><rect x="30" y="30" width="220" height="220"/></clipPath></defs>${svg}</svg>`;
}
function student(t){
 const pair=`A${coordinate(t.params.A)} en B${coordinate(t.params.B)}`;
 switch(t.type){
 case 'delta':return `<p>Lees de punten af. Bepaal de verandering van A naar B.</p>${t.guided?`<p>A${blank} &nbsp; B${blank}</p><p>Δx = x<sub>B</sub> − x<sub>A</sub> = ${blank}</p><p>Δy = y<sub>B</sub> − y<sub>A</sub> = ${blank}</p>`:`<p>Δx = ${blank} &nbsp; Δy = ${blank}</p>${lines(3)}`}`;
 case 'slope':return `<p>Bereken de helling van de rechte. Toon je berekening.</p>${t.guided?`<p>Δx = ${blank}</p><p>Δy = ${blank}</p><p class="math">a = ${fraction('Δy','Δx')} = ${fraction(blank,blank)} = ${blank}</p>`:lines(5)}`;
 case 'slope_from_two_points':return `<p class="given">${pair}</p><p>Bereken de helling van de rechte door A en B.</p>${t.guided?`<p class="math">a = ${fraction('y<sub>B</sub> − y<sub>A</sub>','x<sub>B</sub> − x<sub>A</sub>')} = ${fraction(blank,blank)}</p>${lines(2)}`:lines(4)}`;
 case 'line_behavior':return `<p>Is deze rechte stijgend, dalend of constant? Verklaar met de helling.</p>${t.guided?'<p class="hint">Lees van links naar rechts. Wat vertelt het teken van a?</p>':''}${lines(5)}`;
 case 'special_lines':return `<p>Teken de unieke rechte door A en B, als dat mogelijk is.</p><p>Welk soort rechte krijg je? Wat is de helling? Is dit een functie van x?</p>${t.guided?'<p class="hint">Vergelijk de x- en y-coördinaten. Vallen de punten samen?</p>':''}${lines(t.guided?3:4)}`;
 case 'error_analysis':return `<p class="given">${pair}</p><p>Een leerling schrijft:</p><p class="math">a = ${fraction(`${term(t.params.B.y)} − ${term(t.params.A.y)}`,`${term(t.params.A.x)} − ${term(t.params.B.x)}`)} = ${number(t.wrongSlope)}</p><p>Leg uit wat er fout gaat en verbeter de berekening.</p>${t.guided?'<p class="hint">Controleer de volgorde van A en B in beide aftrekkingen.</p>':''}${lines(2)}`;
 }
}
function answer(t){
 const {A,B,model}=t.params;
 const deltas=`<p>Δx = ${term(B.x)} − ${term(A.x)} = <strong>${number(t.dx)}</strong><br>Δy = ${term(B.y)} − ${term(A.y)} = <strong>${number(t.dy)}</strong></p>`;
 const slope=model.kind==='affine'?`<p class="math">a = ${fraction(number(t.dy),number(t.dx))} = <strong>${number(model.a)}</strong></p>`:'';
 switch(t.type){
 case 'delta':return `<p>A${coordinate(A)} &nbsp; B${coordinate(B)}</p>${deltas}<p>Negatief betekent naar links of naar beneden.</p>`;
 case 'slope':case 'slope_from_two_points':return `<p>A${coordinate(A)} &nbsp; B${coordinate(B)}</p>${deltas}${slope}<p>De volgorde B → A in beide verschillen is ook correct.</p>`;
 case 'line_behavior':return `${slope}<p>De rechte is <strong>${model.a.n>0?'stijgend':model.a.n<0?'dalend':'constant'}</strong>, want a is ${model.a.n>0?'positief':model.a.n<0?'negatief':'nul'}.</p>`;
 case 'special_lines':return model.kind==='identical'?'<p>A en B vallen samen. Eén punt bepaalt <strong>geen unieke rechte</strong>. De helling en of de rechte een functie voorstelt, zijn niet te bepalen.</p>':model.kind==='vertical'?`<p><strong>Verticaal:</strong> x = ${number(model.c)}.</p><p>Δx = 0: de helling is <strong>niet gedefinieerd</strong>. Delen door nul kan niet.</p><p>Dit is geen functie van x: bij dezelfde x horen meerdere y-waarden.</p>`:`<p><strong>Horizontaal:</strong> y = ${number(model.b)}.</p><p>Δy = 0 en Δx ≠ 0, dus <strong>a = 0</strong>.</p><p>Dit is een functie van x: bij elke x hoort één y.</p>`;
 case 'error_analysis':return `<p>De y-waarden staan in de volgorde B − A, maar de x-waarden in A − B. Gebruik <strong>dezelfde volgorde</strong> in teller en noemer.</p>${deltas}${slope}<p>A − B in beide aftrekkingen is eveneens correct.</p>`;
 }
}
function render(doc,kind='questions'){
 if(!['questions','key'].includes(kind))throw Error('Onbekend document');
 const key=kind==='key';
 const items=doc.tasks.map(t=>({...t,height:key&&!t.graph?64:t.height})),pages=L.paginate(items);
 return {count:pages.length,html:pages.map((rows,i)=>`<section class="worksheet-page" aria-label="${key?'Verbetersleutel':'Oefenblad'} pagina ${i+1}"><header class="sheet-heading"><div><span class="sheet-brand">leraarBob · Rechtenwereld</span><h2>Hellingrug${key?' · verbetersleutel':''}</h2></div><div class="sheet-identity">${key?`Reeks ${esc(doc.code)}<br>${esc(C.modes[doc.config.mode])}`:'Naam: ___________________<br>Klas: ______ &nbsp; Datum: __________'}</div></header><div class="sheet-content">${rows.map(row=>`<div class="worksheet-row" style="height:${row.height}mm">${row.items.map(t=>`<article class="worksheet-question span-${t.span}" data-question="${t.number}" data-skill="${t.skill}"><h3><span class="question-number">${t.number}</span>${esc(C.types.find(c=>c.id===t.type).label)}${!key&&t.guided?'<small>Met tussenstappen</small>':''}</h3><div class="question-body${t.graph?' has-graph':''}">${t.graph?graph(t,key):''}<div class="question-work">${key?answer(t):student(t)}</div></div></article>`).join('')}</div>`).join('')}</div><footer class="sheet-footer"><span>${key?'Verbetersleutel':'Oefenblad'} · ${esc(doc.code)} · ${esc(C.modes[doc.config.mode])}</span><span>${i+1} / ${pages.length}</span></footer></section>`).join('')};
}
return Object.freeze({render,graph,student,answer});
});
