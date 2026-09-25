/* Touch-first controls; no editable elements or native keyboard in exercises. */
(function(root){
'use strict';const C=root.RechtenWave,H=C.html;
const labels={subPoint:'Sleep het punt in de vergelijking',subA:'Vervang a door de gegeven helling',ys:'Kies twee y-coördinaten voor de teller',xs:'Kies twee x-coördinaten voor de noemer',dy:'Bereken Δy',dx:'Bereken Δx',a:'Bereken a = Δy / Δx',point:'Kies een punt om b te berekenen',subY:'Plaats de y-coördinaat links',subX:'Plaats de x-coördinaat bij a',ax:'Bereken a · x',b:'Bereken b = y − ax',formulaA:'Vul de helling in je formule in',formulaB:'Vul de constante term in je formule in',verifyA:'Controleer punt A: bereken de uitvoer',verifyB:'Controleer punt B: bereken de uitvoer',classify:'Welke rechte bepalen deze punten?',property:'Welke eigenschap hoort hierbij?',axis:'Welke coördinaat blijft vast?',constant:'Vul de vaste waarde in',function:'Is deze rechte een functie y = f(x)?',behavior:'Wat gebeurt er met y als x toeneemt?'};
const signed=v=>v.n<0?`(${H(v)})`:H(v);
const point=(name,p)=>`${name}(${H(p.x)}; ${H(p.y)})`;
function graph(p,{alternatives=false}={}){const xy=v=>100+18*C.num(v),yy=v=>100-18*C.num(v);let s='<svg viewBox="0 0 200 200" role="img" aria-label="Rechte op een rooster van min vijf tot vijf">';for(let i=-5;i<=5;i++)s+=`<path d="M${100+18*i} 10V190 M10 ${100+18*i}H190" stroke="${i?'#dbe5df':'#59747a'}" fill="none"/>`;s+='<path class="axis-arrow" d="M184 96l6 4-6 4 M96 16l4-6 4 6" fill="none" stroke="#59747a" stroke-width="1.5"/><text x="181" y="96" font-size="10">x</text><text x="104" y="15" font-size="10">y</text><text x="103" y="112" font-size="9">0</text><text x="180" y="112" font-size="9">5</text><text x="103" y="25" font-size="9">5</text>';const m=p.model;s+='<defs><clipPath id="wave-clip"><rect x="10" y="10" width="180" height="180"/></clipPath></defs>';if(m.kind==='vertical')s+=`<path d="M${xy(m.c)} 10V190" stroke="#4c8fd8" stroke-width="3"/>`;if(m.kind==='affine')s+=`<path d="M10 ${yy(C.add(C.mul(m.a,-5),m.b))}L190 ${yy(C.add(C.mul(m.a,5),m.b))}" clip-path="url(#wave-clip)" stroke="#4c8fd8" stroke-width="3"/>`;if(alternatives){const A=p.A,x=xy(A.x),y=yy(A.y);s+=`<path class="possible-lines" d="M10 ${y}H190 M10 ${y+x-10}L190 ${y+x-190}" clip-path="url(#wave-clip)" stroke="#789888" stroke-width="2" stroke-dasharray="5 4" fill="none"/>`}for(const name of ['A','B']){const a=p[name];s+=`<circle cx="${xy(a.x)}" cy="${yy(a.y)}" r="3" fill="#245f54"/><text x="${Math.min(m.kind==='identical'?155:181,xy(a.x)+5)}" y="${Math.max(12,yy(a.y)-6)}" font-size="11">${m.kind==='identical'?'A = B':name}</text>`;if(m.kind==='identical')break}return s+'</svg>'}
const pointTask=t=>!t.legacyTransfer&&['intercept_from_point','equation_from_point_slope','equation_from_two_points'].includes(t.skill)&&t.params.model.kind==='affine';
const slopeTitle='Bereken richtingscoëfficiënt a met deze twee punten van een rechte.';
function pointQuestion(t,w,stage,question){
 const known=t.skill==='equation_from_two_points'?!!w.values.a:!!w.values.subA;
 const equation=w.done?C.formula(t.params.model.a,t.params.model.b):`y = ${known?H(t.params.model.a):'a'}x + b`;
 const cue=['ys','xs','a'].includes(stage)?'Bepaal het functievoorschrift. Bepaal eerst a.':stage==='subA'?'Bepaal het functievoorschrift. Vul de gegeven a in.':['point','subPoint'].includes(stage)?`Bepaal b. ${t.skill==='equation_from_two_points'?'Kies één van de twee punten en sleep het':'Sleep punt A'} in de vergelijking.`:['ax','b'].includes(stage)?'Bepaal b door de vergelijking uit te werken.':stage.startsWith('verify')?labels[stage]:w.done?'Het functievoorschrift is gevonden.':'Vul b in het functievoorschrift in.';
 question.innerHTML=`<div class="worksheet-question"><div class="worksheet-function">${equation}</div><div class="worksheet-prompt">${cue}</div></div>`;
}
function pointWorksheet(t,w,stage){
 const p=t.params,A=p[w.values.point||'A'],m=p.model,v=w.values,two=t.skill==='equation_from_two_points',choosing=['point','subPoint'].includes(stage);
 const source=name=>`<button type="button" class="given-chip point-chip" data-given-point="${name}" aria-label="Sleep punt ${name} in de vergelijking">${point(name,p[name])}</button>`;
 const givens=stage==='subA'?`${point('A',A)} · <button type="button" class="given-chip" data-given="a">a = ${H(m.a)}</button>`:choosing?(two?source('A')+' '+source('B'):source('A')):`${point(v.point||'A',A)} · a = ${H(m.a)}`;
 const step=stage==='subA'?0:['point','subPoint','ax','b'].includes(stage)?1:2;
 let equation=stage==='subA'?'y = <span class="substitution-slot active" data-substitution="a">a</span>x + b':choosing?`<div class="point-drop-equation" data-point-equation role="group" aria-label="Vul het gekozen punt in de vergelijking in">y = ${H(m.a)}x + b</div>`:w.done?C.formula(m.a,m.b):'';
 return `<div class="wave-context point-worksheet"><div class="wave-givens">${givens}</div>
 <div class="derivation-progress">${[two?'a bepalen':'a invullen','b bepalen','Functievoorschrift'].map((label,i)=>`<span class="${i===step?'active':''}">${i+1} · ${label}</span>`).join('')}</div>
 ${stage.startsWith('formula')||w.done?`<div class="point-found">b = ${H(m.b)}</div>`:''}
 <div class="wave-equation">${equation}</div>
 ${stage==='subA'?'<p class="equation-cue">Sleep de gegeven a naar de letter, of tik de waarde aan.</p>':choosing?'<p class="equation-cue">Sleep het hele punt in de vergelijking, of tik het punt aan.</p>':''}
 </div>`;
}
function context(t,w,stage){if(pointTask(t)&&!['ys','xs','a','verifyA','verifyB'].includes(stage))return pointWorksheet(t,w,stage);if(['line_behavior','special_lines'].includes(t.skill)||t.params.model.kind!=='affine')return root.RechtenConceptUI.context(t,w,stage,graph);const p=t.params,m=p.model,v=w.values,A=p[v.point||'A'];let title=['intercept_from_point','equation_from_point_slope'].includes(t.skill)?`${point('A',p.A)} · <span class="wave-a">a = ${H(m.a)}</span>`:`${point('A',p.A)} · ${point('B',p.B)}`;
 if(t.skill==='line_behavior'&&p.representation==='slope')title=`a = ${H(m.a)}`;
 let line='';const diff=axis=>{const tokens=v[axis==='y'?'ys':'xs']||w.tokens;return tokens.map(k=>k?signed(p[k][axis]):'□').join(' − ')||'□ − □'};
 if(stage==='subA')line='y = <span class="substitution-slot active" data-substitution="a">a</span>x + b';
 else if(['ys','xs','dy','dx','a'].includes(stage)){const y=v.ys||[],x=v.xs||[];line=`<span class="wave-a">a = <span class="frac"><span>${stage==='ys'?diff('y'):y.map(k=>signed(p[k].y)).join(' − ')||'□ − □'}</span><span>${stage==='xs'?diff('x'):x.map(k=>signed(p[k].x)).join(' − ')||'□ − □'}</span></span></span><small>Δy: ${y.length===2?y[1]+'→'+y[0]:'…'} · Δx: ${x.length===2?x[1]+'→'+x[0]:w.tokens.length===2&&stage==='xs'?w.tokens[1]+'→'+w.tokens[0]:'…'}</small>`;if(v.dy&&v.dx)line+=`<small>Δy = ${H(v.dy)} · Δx = ${H(v.dx)}</small>`}
 else if(['subY','subX','ax','b'].includes(stage)){
  const slot=(key,symbol,value)=>v[key]?H(value):`<span class="substitution-slot ${stage===key?'active':''}" ${stage===key?`data-substitution="${symbol}"`:""}>${symbol}</span>`;
  line=`${slot('subY','y',A.y)} = ${H(m.a)} · (${slot('subX','x',A.x)}) + <span class="wave-b">b</span>`;
 }

 else if(['formulaA','formulaB'].includes(stage))line=`<span class="wave-a">a = ${H(m.a)}</span> · <span class="wave-b">b = ${H(m.b)}</span><br>y = ${v.formulaA?H(v.formulaA):'□'}x + □`;
 else if(stage.startsWith('verify')){const P=p[stage==='verifyB'?'B':'A'];line=`${C.formula(m.a,m.b)}<small>y = ${H(m.a)} · (${H(P.x)}) + (${H(m.b)})<br>Gegeven y = ${H(P.y)}</small>`}
 else if(stage==='point')line=`<span class="wave-a">a = ${H(v.a)}</span>`;
 else if(stage==='constant')line=(v.axis||'□')+' = □';
 else if(stage==='function')line=m.kind==='vertical'?`x = ${H(m.c)}`:C.formula(m.a,m.b);
 if(['subA','subY','subX'].includes(stage)){const given=(key,value,label=H(value))=>`<button type="button" class="given-chip" data-given="${key}" aria-label="Sleep ${key} = ${C.text(value)} naar ${key} in de formule">${label}</button>`;title=stage==='subA'?`${point(w.values.point||'A',A)} · ${given('a',m.a,'a = '+H(m.a))}`:`${w.values.point||'A'}(${given('x',A.x)}; ${given('y',A.y)}) · <span class="wave-a">a = ${H(m.a)}</span>`;}
 if(stage==='formulaA'||stage==='formulaB')title=`<span class="wave-a">a = ${H(m.a)}</span> · <span class="wave-b">b = ${H(m.b)}</span>`;
 const step=['subA','subY','subX','ax','b','formulaA','formulaB'].includes(stage)?`<div class="derivation-progress"><span class="${stage==='subA'?'active':''}">1 · a invullen</span><span class="${['subY','subX'].includes(stage)?'active':''}">2 · punt invullen</span><span class="${['ax','b'].includes(stage)?'active':''}">3 · b bepalen</span><span class="${stage.startsWith('formula')?'active':''}">4 · voorschrift</span></div>`:'';
 return `<div class="wave-context ${['subA','subY','subX'].includes(stage)?'substitution-sheet':''}">${step}<div class="wave-givens">${title}</div>${line?`<div class="wave-equation">${line}</div>`:p.representation==='graph'?`<div class="wave-graph">${graph(p)}</div>`:''}</div>`;
}
function explanation(skill){if(C.transferSkills.includes(skill))return root.RechtenTransferUI.explanation(skill);if(C.algebraSkills.includes(skill))return root.RechtenAlgebraUI.explanation(skill);if(C.constructionSkills.includes(skill))return root.RechtenConstructionUI.explanation(skill);const descriptions={slope_from_two_points:['a = <span class="frac"><span>yB − yA</span><span>xB − xA</span></span>','Kies eerst beide y-coördinaten, daarna beide x-coördinaten. B − A en A − B mogen allebei, als teller en noemer dezelfde richting hebben.'],line_behavior:['x neemt toe → kijk naar y','Positieve a: stijgend. Negatieve a: dalend. a = 0: constant. De volgorde van A en B verandert dit niet.'],special_lines:['Gelijke y · gelijke x · identieke punten','Gelijke y: horizontaal, a = 0, y = b, functie. Gelijke x bij verschillende punten: verticaal, Δx = 0, x = c, geen functie. Identiek: geen unieke rechte.'],intercept_from_point:['a invullen → b bepalen → functievoorschrift','Vul a in en sleep het punt in de vergelijking. Voeg de factoren samen, verplaats de losse term en reken de getallen samen om b te vinden.'],equation_from_point_slope:['a invullen → b bepalen → functievoorschrift','Vul a in en sleep het punt in de vergelijking. Voeg de factoren samen, verplaats de losse term en reken de getallen samen om b te vinden.'],equation_from_two_points:['punten → a → punt → b → formule','Bepaal a en kies zelf A of B voor b. Bouw je formule en controleer beide oorspronkelijke punten. Een juiste a blijft staan als je b verbetert.']};const [big,sub]=descriptions[skill];return {title:C.catalog[skill].label,visual:graph({A:{x:C.q(-1),y:C.q(0)},B:{x:C.q(1),y:C.q(2)},model:{kind:'affine',a:C.q(1),b:C.q(1)}}),big,sub}}
function mount(t,{visual,answers,question,status,footer,onChange,onDone,onNext,onResult,onRendered,dev=false}){
 visual.classList.remove('construction-visual','algebra-visual','transfer-visual','transfer-grid-visual');
 if(C.transferSkills.includes(t.skill))return root.RechtenTransferUI.mount(t,{visual,answers,question,status,footer,onChange,onDone,onNext,onResult,onRendered,dev});
 if(C.algebraSkills.includes(t.skill))return root.RechtenAlgebraUI.mount(t,{visual,answers,question,status,footer,onChange,onDone,onNext,onResult,onRendered,dev});
 if(C.constructionSkills.includes(t.skill))return root.RechtenConstructionUI.mount(t,{visual,answers,question,status,footer,onChange,onDone,onNext,onResult,onRendered,dev});
 const w=C.resumeWork(t),stage=C.stages(t)[w.index]||'done';question.textContent=pointTask(t)?'Bepaal het functievoorschrift. Gegeven is punt A en richtingscoëfficiënt a.':t.skill==='slope_from_two_points'&&t.params.model.kind==='affine'?slopeTitle:w.done?'Controle afgerond':labels[stage];if(pointTask(t))pointQuestion(t,w,stage,question);visual.innerHTML=context(t,w,stage);answers.className='answers wave-controls';answers.replaceChildren();footer.replaceChildren();if(['line_behavior','special_lines'].includes(t.skill)||t.params.model.kind!=='affine')answers.classList.add('concept-choices');
 const button=(label,action,where=answers)=>{const b=document.createElement('button');b.type='button';b.innerHTML=label;root.RechtenEquationEditor.activate(b,action);where.append(b);return b};
 function redraw(){onChange();mount(t,{visual,answers,question,status,footer,onChange,onDone,onNext,onResult,onRendered,dev});onRendered?.()}
 function submit(value){const result=C.submit(t,w,value);onResult?.(result);status.className='status '+(result.ok?'good':'bad');status.textContent=result.ok?'Stap klopt.':result.message;if(w.done){onDone();status.textContent=w.errors.length||w.help?'Hersteld met hulp. Je correcte deelstappen zijn bewaard.':'Goed gecontroleerd.'}redraw()}
 if(w.done){if(t.skill==='slope_from_two_points'&&t.params.model.kind==='affine')visual.innerHTML=`<div class="concept-context with-graph"><div class="concept-givens">${point('A',t.params.A)} · ${point('B',t.params.B)}</div><div class="concept-graph">${graph(t.params)}</div><p class="concept-note">a = ${H(t.params.model.a)}: de helling van de rechte door A en B.</p></div>`;const m=t.params.model;answers.innerHTML=`<div class="wave-result">${m.kind==='identical'?'Identieke punten bepalen geen unieke rechte.':m.kind==='vertical'?`x = ${H(m.c)}<small>Δx = 0 · geen functie y = f(x)</small>`:t.skill==='line_behavior'?`${C.expected(t,w,'behavior')}<small>Als x toeneemt, ${m.a.n>0?'neemt y toe':m.a.n<0?'neemt y af':'blijft y gelijk'}.</small>`:`${C.formula(m.a,m.b)}<small>${t.skill==='slope_from_two_points'?'a = '+H(m.a):'De oorspronkelijke punten voldoen.'}</small>`}</div>`;if(pointTask(t))answers.replaceChildren();button(dev?'Nieuwe variant':'Verder →',onNext,footer);return}
 if(['ys','xs','a'].includes(stage)){root.RechtenCoordinateBuilder.mount(t.params,w,stage,{visual,answers,question,status,footer,redraw,submit,undo:()=>C.undo(w),title:t.skill==='slope_from_two_points'?slopeTitle:'Bepaal eerst a.'});if(pointTask(t))pointQuestion(t,w,stage,question);return}
 else if(['point','subPoint'].includes(stage)){
  for(const source of visual.querySelectorAll('[data-given-point]'))root.RechtenEquationEditor.draggable(source,{targets:()=>[visual.querySelector('[data-point-equation]')],drop:()=>submit(source.dataset.givenPoint),tap:()=>submit(source.dataset.givenPoint)});
 }
 else if(['subA','subY','subX'].includes(stage)){
  const A=t.params[w.values.point||'A'];
  if(!pointTask(t)){const cue=document.createElement('p');cue.className='equation-cue';cue.textContent='Sleep de gegeven waarde naar de gemarkeerde letter. Je kunt de waarde ook aantikken.';visual.querySelector('.wave-context').append(cue);}
  for(const source of visual.querySelectorAll('[data-given]')){
   const key=source.dataset.given;
   const value=key==='a'?t.params.model.a:A[key];source.dataset.dragLabel=H(value);
   root.RechtenEquationEditor.draggable(source,{targets:()=>[...visual.querySelectorAll('[data-substitution]')],drop:()=>submit(stage==='subA'?(key==='a'?value:null):key),tap:()=>submit(stage==='subA'?(key==='a'?value:null):key)});
  }
 }

 else if(stage==='ax'||stage==='b'&&!w.bEquation){
  root.RechtenEquationEditor.pointArithmetic(t,w,{host:visual.querySelector('.wave-equation'),stage,submit,redraw});
 }
 else if(stage==='b'){
  if(!pointTask(t))question.textContent='Maak b vrij';
  const e=C.pointEquation(t,w);
  root.RechtenEquationEditor.mount(e,w,{host:visual.querySelector('.wave-equation'),answers,axis:'y',symbol:'b',submit,redraw});
  if(C.isolated(e,'y'))button('b gevonden →',()=>submit(e.right.c),footer);
 }
 else if(stage==='formulaA'||stage==='formulaB'){
  if(!pointTask(t))question.textContent='Geef het functievoorschrift';
  const g=w.formulaBuild||(w.formulaBuild=pointTask(t)?{formula:{a:t.params.model.a,variable:'x',sign:null,b:null}}:{});
  let palette=answers;if(pointTask(t)){palette=document.createElement('div');visual.querySelector('.point-worksheet').append(palette)}
  root.RechtenConstructionUI.formulaBuilder(t.params.model,g,{host:visual.querySelector('.wave-equation'),answers:palette,onChange:redraw,onComplete:value=>{
   const result=C.constructionCheck({skill:'equation_from_ab',params:t.params},value);
   if(!result.ok){if(!w.errors.includes(result.code))w.errors.push(result.code);w.steps.push({stage:'formula',value,ok:false,code:result.code});onResult?.(result);status.className='status bad';status.textContent=result.message;redraw();return}
   if(stage==='formulaA')C.submit(t,w,value.a);
   submit(C.mul(value.sign==='−'?-1:1,value.b));
  }});
 }

 else if(['behavior','classify','property','axis','function'].includes(stage)){const options={behavior:[['stijgend','stijgend'],['dalend','dalend'],['constant','constant']],classify:[['horizontaal','horizontaal'],['verticaal','verticaal'],['identiek','geen unieke rechte']],property:[['a0','a = 0'],['dx0','Δx = 0']],axis:[['x','x = c'],['y','y = b']],function:[['functie','functie'],['geen functie','geen functie']]};for(const [value,label] of options[stage]){const b=button(`<span class="orb-content">${label}</span>`,()=>submit(value));b.className='bubble answer-orb wide-orb'}}
 else root.RechtenNumberEntry.mount(w,{host:visual.querySelector('.wave-context,.concept-context'),answers,footer,label:stage==='a'?'a':stage==='constant'?(w.values.axis||'waarde'):stage==='ax'?'a · x':'y',submit,redraw,status});

 button('Terug',()=>{C.undo(w);redraw()},footer).disabled=!w.history.length;
}
root.RechtenWaveUI={mount,explanation,graph,context,labels};
})(globalThis);
