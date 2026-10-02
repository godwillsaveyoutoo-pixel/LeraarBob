/* Signaalstad levels 5 and 6: explicit inverse steps and calculated membership. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('../checks-core.js'),require('./values-view.js'),require('./workbench.js'),require('./shell-view.js'),require('../../core/wave-core.js'));else root.RechtenV2ChecksView=factory(root.RechtenV2Checks,root.RechtenV2ValuesView,root.RechtenV2Workbench,root.RechtenV2Shell,root.RechtenWave)})(globalThis,function(K,V,C,S,W){
'use strict';const esc=C.esc,input=(m,n,label)=>V.input(m,n,label,K),number=(m,n)=>W.html(W.parse(m.values[n])||W.q(0));
const term=t=>`${t.model.b.n<0?'−':'+'} ${W.html(W.q(Math.abs(t.model.b.n),t.model.b.d))}`;
function choices(m,name,options,label){return `<div class="check-choices" role="group" aria-label="${esc(label)}">${options.map(([value,text])=>`<button type="button" data-choice="${name}" data-value="${value}" aria-pressed="${m.values[name]===value}" ${m.feedback||m.locks[name]?'disabled':''}>${text}</button>`).join('')}</div>`}
function inverse(m){const t=m.task,p=m.phase;let body,title,help;
 const request=`<p class="value-request">Welke x geeft f(x) = ${W.html(t.target)}?</p>`;
 if(p==='input-equation'){
  title='1 · Vul de functiewaarde in';help='Vervang f(x) door de gegeven uitvoer. x blijft onbekend.';
  body=`<div class="value-substitution check-equation"><span>${W.html(t.model.a)}x ${term(t)} =</span>${input(m,'givenOutput','Gegeven functiewaarde in de vergelijking')}</div>`;
 }else if(p==='input-isolate'){
  title='2 · Werk de constante term weg';help=t.model.b.n<0?'Tel de tegengestelde van b op aan beide kanten.':'Trek b af aan beide kanten.';
  body=`<p class="value-substitution">${W.html(t.model.a)}x ${term(t)} = ${number(m,'givenOutput')}</p><div class="check-operation">${t.model.b.n<0?'Tel '+W.html(W.mul(t.model.b,-1))+' op':'Trek '+W.html(t.model.b)+' af'} aan beide kanten</div><div class="value-substitution check-equation"><span>${W.html(t.model.a)}x =</span>${input(m,'residual','Uitvoer na het wegwerken van de constante term')}</div>`;
 }else if(p==='input-solve'){
  title='3 · Bereken x';help='Deel beide kanten door de coëfficiënt van x.';
  body=`<p class="value-substitution">${W.html(t.model.a)}x = ${number(m,'residual')}</p><div class="value-substitution check-equation"><span>x =</span><span class="check-quotient" role="math"><span>${number(m,'residual')}</span><span>${W.html(t.model.a)}</span></span><span>=</span>${input(m,'input','Gevonden invoer x')}</div>`;
 }else if(p==='input-verify'){
  title='4 · Controleer je x';help='Bereken met je gevonden x. Levert het voorschrift de gevraagde functiewaarde op?';
  body=`<p class="check-found">Gevonden: x = ${number(m,'input')}</p><div class="value-substitution check-equation"><span>f(${number(m,'input')}) = ${W.html(t.model.a)} · (${number(m,'input')}) ${term(t)} =</span>${input(m,'verification','Functiewaarde bij je gevonden x')}</div>`;
 }else{
  title='2 · Bekijk de constante functie';help='Bij a = 0 is de uitvoer altijd b. Vergelijk die met de gevraagde functiewaarde.';
  body=`<div class="value-substitution check-equation"><span>f(x) =</span>${input(m,'constantValue','Vaste functiewaarde bij a is nul')}</div>${choices(m,'solutions',[['all','Elke x is mogelijk'],['none','Geen x is mogelijk']],'Aantal mogelijke x-waarden')}`;
 }
 return `<section class="value-paper value-answer answer-tray check-answer" aria-label="Invoer vinden bij een functiewaarde"><h2>${title}</h2>${request}${body}<p class="value-answer-help">${help}</p></section>`;
}
function point(m){const t=m.task,p=m.phase,x=W.html(t.point.x),y=W.html(t.point.y);let body,title,help;
 const request=`<p class="value-request check-point">P = (${x}; ${y})</p>`;
 if(p==='point-substitute'){
  title='1 · Vul de x-coördinaat in';help='Vervang x door de eerste coördinaat van P. Bewaar y om straks te vergelijken.';
  body=`<div class="value-substitution value-replace"><span>f(${x}) = ${W.html(t.model.a)} · (</span>${input(m,'substitution','x-coördinaat van P in het voorschrift')}<span>) ${term(t)}</span></div>`;
 }else if(p==='point-calculate'){
  title='2 · Bereken f(x)';help='Vermenigvuldig eerst. Verwerk daarna de constante term.';
  body=`<p class="value-substitution value-retained">f(${x}) = ${W.html(t.model.a)} · (<strong>${number(m,'substitution')}</strong>) ${term(t)}</p><div class="value-calculation"><label class="value-step"><span>Product</span><div><span>${W.html(t.model.a)} · (${number(m,'substitution')}) =</span>${input(m,'product','Product van a en de x-coördinaat')}</div></label><label class="value-step"><span>Functiewaarde</span><div><span>f(${x}) =</span>${input(m,'answer','Berekende functiewaarde bij P')}</div></label></div>`;
 }else{
  title='3 · Vergelijk met de y-coördinaat';help='Zijn beide waarden precies gelijk? Dan ligt P op de rechte.';
  body=`<div class="check-comparison"><div><span>Jouw berekening</span><strong>f(${x}) = ${number(m,'answer')}</strong></div><div><span>y-coördinaat van P</span><strong>y = ${y}</strong></div></div>${choices(m,'verdict',[['on','P ligt op de rechte'],['off','P ligt niet op de rechte']],'Ligt P op de rechte?')}`;
 }
 return `<section class="value-paper value-answer answer-tray check-answer" aria-label="Punt op de rechte controleren"><h2>${title}</h2>${request}${body}<p class="value-answer-help">${help}</p></section>`;
}
function render(m,header){const t=m.task,f=m.feedback,inverseSkill=m.skill==='input_from_output',complete=m.completed,p=K.phases(t),step=p.indexOf(m.phase)+1;
 const instruction={ 'input-equation':'Vul de gegeven uitvoer in voor f(x).','input-isolate':'Werk b weg aan beide kanten.','input-solve':'Deel om x te vinden.','input-verify':'Controleer de gevonden x in het voorschrift.','input-constant':'Vergelijk de vaste uitvoer met de gevraagde waarde.','point-substitute':'Vul de x-coördinaat van P in.','point-calculate':'Bereken het product en de functiewaarde.','point-verdict':'Vergelijk f(x) met de y-coördinaat van P.'};
 const feedback=complete?'Je werk is bewaard.':f?(f.result.ok?'✓ ':'')+esc(f.result.message):m.hintOpen&&m.hints?esc(t.hints[m.hints-1]):instruction[m.phase];
 const done=`<section class="value-complete"><span aria-hidden="true">✓</span><h2>${inverseSkill?'Je vindt x bij een functiewaarde':'Je controleert punten op een rechte'}</h2><p>Je hebt zes voorschriften onderzocht.</p><button type="button" data-restart="signaalstad" data-skill="${m.skill}">Opnieuw oefenen</button></section>`;
 const action=complete?'<button type="button" class="primary" data-screen="area" data-area="signaalstad">Naar Signaalstad →</button>':m.hints>=5&&!f?'<button type="button" class="primary" id="new-example">Nieuw geval →</button>':f?`<button type="button" class="primary" id="continue">${f.result.ok?(f.next==='next-task'?(m.index===K.count-1?'Afronden':'Volgende'):'Volgende stap'):'Herstel'} →</button>`:'<button type="submit" class="primary" id="commit">Controleer →</button>';
 const source=m.phase==='point-verdict'?`<section class="value-paper value-source check-verdict-source" aria-label="Berekening afgerond"><h2>Je berekening staat vast</h2><p class="value-source-help">Vergelijk links jouw functiewaarde met de y-coördinaat. Kies daarna of P op de rechte ligt.</p>${V.keypad({...m,completed:true})}</section>`:V.source(m);
 return `<form id="mission" class="boundary-mission value-mission check-mission" data-world="signaalstad" data-skill="${m.skill}" data-phase="${m.phase}" novalidate>${header}<main class="boundary-workspace value-workspace"><header class="value-heading"><div><span>Signaalstad · Level ${inverseSkill?5:6} · Opgave ${Math.min(m.index+1,K.count)} / ${K.count}${complete?'':` · Stap ${step} / ${p.length}`}</span><h1>${complete?'Goed gedaan!':inverseSkill?'Welke x hoort bij deze functiewaarde?':'Ligt P op de rechte?'}</h1></div>${complete?'':`<div class="value-formula" role="math" aria-label="Gegeven functievoorschrift">${V.formula(t)}</div>`}</header>${complete?done:(inverseSkill?inverse(m):point(m))+source}</main><footer class="boundary-footer value-footer"><div class="value-history"><button type="button" id="pause" aria-label="Pauzeer en ga naar Signaalstad">${S.icon('back',22)}</button><button type="button" id="undo" aria-label="Maak laatste invoer ongedaan" ${f||complete||!m.history.length?'disabled':''}>${S.icon('undo',22)}</button></div><div class="feedback-bubble"><button type="button" class="hint-button" id="hint" aria-label="Volgende hint" ${complete||f||m.hints>=5?'disabled':''}>${S.icon('light',22)}</button><div id="feedback" class="feedback ${f?f.result.ok?'success':'error':''}" role="status" aria-live="polite">${feedback}</div></div>${action}</footer></form><section id="rotateGate"><span class="rotate-symbol" aria-hidden="true">↻</span><h1>Even je scherm draaien</h1><p>Liggend heb je ruimte voor het voorschrift en je antwoorden. Je werk blijft bewaard.</p><button type="button" class="paper-pill" data-screen="area" data-area="signaalstad">Terug naar Signaalstad</button></section>`;
}
return Object.freeze({render});
});
