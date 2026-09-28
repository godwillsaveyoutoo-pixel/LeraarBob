/* Exact, reversible algebra with touch tokens and contextual numeric controls. */
(function(root){
'use strict';const C=root.RechtenWave,H=C.html;
const labels={algebra:'Kies een bewerking op beide leden',modelKind:'Welke relatie heb je gevonden?',subOutput:'Plaats de gegeven uitvoer in de vergelijking',subPoint:'Kies de coördinaat die x vervangt',pointValue:'Bereken de uitvoer bij deze x',pointVerdict:'Vergelijk je berekening met de gegeven y',verifyInput:'Controleer x in de oorspronkelijke formule',constantSolutions:'Welke x-waarden geven deze uitvoer?',constantVerify:'Controleer de constante uitvoer bij x = 2'};
const escapeText=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const pHTML=p=>`P(${H(p.x)}; ${H(p.y)})`;
function explanation(skill){const data={rewrite_linear_equation:['Dezelfde bewerking op beide leden','Sleep een volledige term naar het andere lid om hem weg te werken. Pak alleen de factor vóór een letter vast en sleep die naar het andere lid om beide leden te delen. De preview toont de bewerking en de volgende regel. Je mag eerst delen of eerst termen wegwerken. Maak y vrij; bij een verticale rechte maak je x vrij. Delen door nul kan niet.'],input_from_output:['f(x) gegeven → x vrijmaken → controleren','Vervang f(x) door de gegeven uitvoer. Trek b van beide leden af en deel door a, of kies een andere geldige route. Controleer je x in de oorspronkelijke formule. Als a = 0: alle x bij uitvoer b, anders geen x.'],point_on_line:['x invullen → berekenen → vergelijken','Gebruik de x-coördinaat om a × x + b te berekenen. Vergelijk de uitkomst met de y-coördinaat van P. Alleen als die gelijk zijn, ligt P op de rechte.']};const [big,sub]=data[skill];return {title:C.catalog[skill].label,big,sub,visual:'<div class="construction-example">2x − 3 = 5<small>x = 4 → 2 · 4 − 3 = 5</small></div>'}}
function pointGraph(p){const range=Math.max(5,Math.ceil(Math.abs(C.num(p.P.y)))+1),unit=90/range,x=v=>100+unit*C.num(v),y=v=>100-unit*C.num(v);let s='<svg viewBox="0 0 200 200" role="img" aria-label="Grafiek en te controleren punt P">';for(let i=-range;i<=range;i++)s+=`<path d="M${x(i)} 10V190 M10 ${y(i)}H190" fill="none" stroke="${i?'#dbe5df':'#59747a'}"/>`;s+='<path class="axis-arrow" d="M184 96l6 4-6 4 M96 16l4-6 4 6" fill="none" stroke="#59747a" stroke-width="1.5"/><defs><clipPath id="algebra-grid"><rect x="10" y="10" width="180" height="180"/></clipPath></defs>';s+=`<path d="M10 ${y(C.add(C.mul(p.model.a,-range),p.model.b))}L190 ${y(C.add(C.mul(p.model.a,range),p.model.b))}" clip-path="url(#algebra-grid)" stroke="#4c8fd8" stroke-width="3"/><circle cx="${x(p.P.x)}" cy="${y(p.P.y)}" r="4" fill="#b56325"/><text x="${x(p.P.x)+5}" y="${y(p.P.y)-5}">P</text><text x="105" y="112">0</text><text x="180" y="112">${range}</text><text x="105" y="20">${range}</text></svg>`;return s}
function mount(t,opts){
 const {visual,answers,question,status,footer,onChange,onDone,onNext,dev=false}=opts,w=t.work||(t.work=C.fresh(t)),p=t.params,stage=C.stages(t)[w.index]||'done';
 visual.classList.add('algebra-visual');question.textContent=w.done?'Controle afgerond':stage==='algebra'?`Maak ${t.skill==='input_from_output'||p.model.kind==='vertical'?'x':'y'} vrij met dezelfde bewerking op beide leden`:labels[stage];answers.className='answers wave-controls algebra-controls';answers.replaceChildren();footer.replaceChildren();
 const button=(label,action,where=answers,role)=>{const b=document.createElement('button');b.type='button';b.innerHTML=label;if(role)b.dataset.footerAction=role;root.RechtenEquationEditor.activate(b,action);where.append(b);return b};
 const redraw=()=>{onChange();mount(t,opts);opts.onRendered?.()};
 const submit=value=>{const r=C.submit(t,w,value);opts.onResult?.(r);status.className='status '+(r.ok?'good':'bad');status.textContent=r.ok?r.message||'Stap klopt.':r.message;if(w.done){onDone();status.textContent=w.errors.length||w.help?'Gecontroleerd na herstel of hulp.':'Zelfstandig gecontroleerd.'}redraw()};
 let givens=t.skill==='rewrite_linear_equation'?C.equationHTML(p.equation):C.formula(p.model.a,p.model.b).replace('y =','f(x) =');
 if(t.skill==='point_on_line')givens+=' · '+pHTML(p.P);if(t.skill==='input_from_output'){if(stage==='subOutput')givens=givens.replace('f(x)', '<span class="substitution-slot active" data-output-slot>f(x)</span>');givens+=`<div class="function-target">f(x) = ${stage==='subOutput'?`<button type="button" class="given-chip" data-output aria-label="Vul de gegeven functiewaarde in">${H(p.target)}</button>`:H(p.target)}</div>${stage==='subOutput'?'<small>Bereken x. Sleep de functiewaarde naar f(x).</small>':''}`;}
 let line='';
 if(stage==='algebra'||stage==='modelKind')line=C.equationHTML(C.algebraEquation(t,w));
 if(stage==='subPoint')line='f(□) = a · □ + b';
 if(stage==='subOutput')line='';
 if(stage==='pointValue')line=`f(${H(p.P.x)}) = ${H(p.model.a)} · (${H(p.P.x)}) + (${H(p.model.b)})`;
 if(stage==='pointVerdict')line=`Berekend: ${H(w.values.pointValue)}<small>Gegeven y: ${H(p.P.y)}</small>`;
 if(stage==='verifyInput')line=`x = ${H(C.algebraEquation(t,w).right.c)}<small>f(x) = ${H(p.model.a)} · (${H(C.algebraEquation(t,w).right.c)}) + (${H(p.model.b)})</small>`;
 if(stage==='constantSolutions')line=`${H(p.target)} = 0 · x + (${H(p.model.b)})`;
 if(stage==='constantVerify')line=`f(2) = 0 · 2 + (${H(p.model.b)})`;
 let extra='';
 if(p.representation==='table'&&stage==='subOutput')extra=`<table class="algebra-table"><tr><th>x</th><td>?</td></tr><tr><th>f(x)</th><td>${H(p.target)}</td></tr></table>`;
 if(t.skill==='point_on_line'&&p.representation==='table'&&stage==='subPoint')extra=`<table class="algebra-table"><tr><th>x</th><td>${H(p.P.x)}</td></tr><tr><th>gegeven y</th><td>${H(p.P.y)}</td></tr></table>`;
 if(t.skill==='point_on_line'&&p.representation==='graph'&&stage==='subPoint'){extra=`<div class="algebra-graph">${pointGraph(p)}</div>`;line=''}
 const previous=stage==='algebra'&&w.lastOperation&&w.history.length?(w.history.at(-1).equation||C.algebraEquation(t,{...w,equation:null})):null;
 visual.innerHTML=`<div class="wave-context"><div class="wave-givens">${givens}</div>${previous?`<div class="algebra-previous">${C.equationHTML(previous)}<small>${escapeText(w.lastOperation)}</small></div>`:''}<div class="wave-equation">${line}</div>${extra}</div>`;
 if(w.done){let result;if(t.skill==='point_on_line'){const on=C.eq(p.value,p.P.y),distance=C.sub(p.P.y,p.value);result=`P ligt ${on?'op':'naast'} de rechte.<small>f(${H(p.P.x)}) = ${H(p.value)}; gegeven y = ${H(p.P.y)}${on?'':`<br>Verticale afstand: ${H(C.q(Math.abs(distance.n),distance.d))}`}</small>`}else if(t.skill==='input_from_output')result=p.model.a.n?`x = ${H(p.solution)}<small>Controle: f(x) = ${H(p.target)}</small>`:`${C.eq(p.target,p.model.b)?'Alle x ∈ ℝ':'Geen x'}<small>De uitvoer is altijd ${H(p.model.b)}.</small>`;else result=p.model.kind==='vertical'?`x = ${H(p.model.c)}<small>Verticale rechte · geen functie y = f(x)</small>`:`${C.formula(p.model.a,p.model.b)}<small>a = ${H(p.model.a)} · b = ${H(p.model.b)}</small>`;answers.innerHTML=`<div class="wave-result">${result}</div>`;button(dev?'Nieuwe variant':'Verder →',onNext,footer);return}
 if(stage==='subOutput'){question.textContent='Bereken x';visual.querySelector('.wave-context').classList.add('substitution-sheet');root.RechtenEquationEditor.draggable(visual.querySelector('[data-output]'),{targets:()=>[visual.querySelector('[data-output-slot]')],drop:()=>submit('output'),tap:()=>submit('output')});return}
 const numeric=['pointValue','verifyInput','constantVerify'].includes(stage)||(stage==='algebra'&&w.operation?.term);
 if(numeric){
  const op=w.operation;
  root.RechtenNumberEntry.mount(w,{host:visual.querySelector('.wave-context'),answers,footer,label:op?(op.kind==='divide'?'Delen door':op.kind==='subtract'?'Aftrekken':'Optellen'):'Uitkomst',submit:value=>submit(op?{...op,value}:value),redraw,status,confirm:op?'Pas toe':'Controleer'});

 }else if(stage==='algebra'){
  if(w.operation){question.textContent='Kies je bewerking';for(const [kind,label] of [['add','+'],['subtract','−'],['divide','÷']]){const b=button(label,()=>{w.operation.kind=kind;if(kind==='divide')w.operation.term='c';redraw()});b.classList.toggle('selected',w.operation.kind===kind)}for(const [term,label] of [['x','x-term'],['y','y-term'],['c','getal']])button(label,()=>{w.operation.term=term;redraw()})}
  else {
   const axis=t.skill==='input_from_output'||p.model.kind==='vertical'?'x':'y',e=C.algebraEquation(t,w);
   question.textContent=`Maak ${axis} vrij`;
   root.RechtenEquationEditor.mount(e,w,{host:visual.querySelector('.wave-equation'),answers,axis,submit,redraw});
   if(C.isolated(e,axis))button('Verder →',()=>{delete w.selectedTerm;submit({kind:'finish'})},footer);
   else button('Andere bewerking',()=>{w.operation={kind:'subtract',term:null};redraw()},footer,'tools');
  }

 }else {const choices={subPoint:[['x','x = '+H(p.P?.x||C.q(0))],['y','y = '+H(p.P?.y||C.q(0))]],subOutput:[['output','Vul f(x) in →']],pointVerdict:[['on','ligt erop'],['off','ligt ernaast']],modelKind:[['function','functie y = f(x)'],['vertical','verticale rechte']],constantSolutions:[['all','alle x ∈ ℝ'],['none','geen x'],['one','één x']]};for(const [value,label] of choices[stage])button(label,()=>submit(value))}
 if(w.operation)button('Annuleer',()=>{w.operation=null;w.entry=['','1'];w.part=0;redraw()},footer,'back');
 else button('Terug',()=>{C.undo(w);redraw()},footer,'back').disabled=!w.history.length;
}
root.RechtenAlgebraUI={mount,explanation};
})(globalThis);
