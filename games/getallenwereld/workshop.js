/* Presentation for the whole number world. Lesson IDs, questions and grading stay native. */
(function(root,factory){if(typeof module==='object')module.exports=factory();else root.GetallenWorkshop=factory();})(globalThis,()=>{
'use strict';
const PHASES=Object.freeze([
 Object.freeze({title:'Begrijpen',copy:'Lees de macht.',ids:Object.freeze(['machten-betekenis'])}),
 Object.freeze({title:'Bewerken',copy:'Combineer exponenten.',ids:Object.freeze(['machten-product','machten-quotient','machten-negatief'])}),
 Object.freeze({title:'Haakjes',copy:'Kijk wat de macht omvat.',ids:Object.freeze(['machten-macht','machten-factoren','machten-haakjes'])}),
 Object.freeze({title:'Zelf kiezen',copy:'Combineer de regels.',ids:Object.freeze(['machten-mix'])})
]);
const ROOT_PHASES=Object.freeze([
 Object.freeze({title:'Begrijpen',copy:'Herken de kwadraten.',ids:Object.freeze(['wortels-factor'])}),
 Object.freeze({title:'Bewerken',copy:'Combineer onder één wortel.',ids:Object.freeze(['wortels-product','wortels-quotient'])}),
 Object.freeze({title:'Vereenvoudigen',copy:'Haal het kwadraat naar buiten.',ids:Object.freeze(['wortels-macht','wortels-vereenvoudigen'])}),
 Object.freeze({title:'Zelf kiezen',copy:'Voeg samen en toets de regel.',ids:Object.freeze(['wortels-som','wortels-regels'])})
]);
const ORDER=Object.freeze(PHASES.flatMap(p=>p.ids)),ROOT_ORDER=Object.freeze(ROOT_PHASES.flatMap(p=>p.ids)),VERSION='machtenwerkplaats-v1';
const orderFor=theme=>theme==='wortels'?ROOT_ORDER:ORDER;
const pathLabel=theme=>theme==='wortels'?'Mijn wortelpad':'Mijn machtenpad';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const resumable=run=>Boolean(run&&(!run.done||run.index<5));
const number=id=>String(orderFor(id.startsWith('wortels-')?'wortels':'machten').indexOf(id)+1).padStart(2,'0');
function art(index,extra=''){return `<div class="workshop-art ${extra}" data-art="${index}" aria-hidden="true"></div>`;}
function nav(label,action,extra=''){return `<nav class="workshop-nav" aria-label="Binnen Getallenwereld"><button data-action="${action}">← ${esc(label)}</button><span>${extra}</span><button data-action="menu-open">Onderdelen & werkvormen</button></nav>`;}
function chapter({lessons:L,selected,entries,runs,math,status,links}){
 const sel=L.stop(selected),theme=sel.theme,root=theme==='wortels',phases=root?ROOT_PHASES:PHASES,order=orderFor(theme),run=runs[selected],continuing=resumable(run),finished=run?.done&&run.index===5;
 const count=order.filter(id=>entries[id]?.done.length===6).length;
 const groups=phases.map((p,i)=>`<section class="path-group" aria-labelledby="phase-${i}"><div class="phase-heading"><span>${i+1}</span><div><h2 id="phase-${i}">${p.title}</h2><p>${p.copy}</p></div></div>${art(i)}<div class="path-stops">${p.ids.map(id=>{
  const s=L.stop(id),n=entries[id]?.done.length||0,progress=n===6?'done':n||runs[id]?'started':'new';
  return `<button class="path-stop" data-stop="${id}" data-status="${progress}" ${id===selected?'aria-current="step"':''}><span class="path-marker" aria-hidden="true">${progress==='done'?'✓':number(id)}</span><span><strong>${esc(s.title)}</strong><small>${esc(status(id))}</small></span><span class="path-arrow" aria-hidden="true">›</span></button>`;
 }).join('')}</div></section>`).join('');
 let label=continuing?'Verder oefenen':finished?'Bekijk resultaat':sel.id==='machten-product'?'Start basisreeks':'Start dit onderdeel',action=finished?'results':'start';
 const track=run?.pathVersion===VERSION?run.track==='basis'?'Basisreeks':'Verdieping':run?'Bestaande reeks':sel.id==='machten-product'?'Basisreeks':'';
 return `<section class="screen chapter powers-path">${nav('Getallenwereld','home','Begeleide leerroute · op eigen tempo')}<div class="path-layout"><div class="path-main"><header class="path-heading"><div><span class="eyebrow">${root?'Jouw wortelpad':'Jouw machtenpad'}</span><h1>${root?'Vierkantswortels':'Machten'}</h1><p>${root?'Van kwadraten herkennen naar zelf vereenvoudigen.':'Van begrijpen naar zelf de regel kiezen.'}</p></div><span class="path-count"><b>${count}/${order.length}</b> onderdelen uitgewerkt</span></header><div class="path-groups">${groups}</div><footer class="path-legend"><span><i class="dot path-done"></i>Uitgewerkt</span><span><i class="dot path-started"></i>Bezig</span><span><i class="dot"></i>Te ontdekken</span><p>Kies vrij. Je kunt elk onderdeel herhalen.</p></footer></div><aside class="path-detail" aria-labelledby="selected-part"><span class="eyebrow">Gekozen onderdeel · ${number(selected)}</span><h2 id="selected-part">${esc(sel.title)}</h2><div class="path-example">${math(sel.example)}</div><p>${esc(sel.intro)}</p><span class="path-run">${track?esc(track)+' · ':''}${continuing?'opgave '+(run.index+1)+' van 6':'6 opgaven'}</span><button class="primary" data-action="${action}">${label} →</button>${sel.id==='machten-product'&&!continuing?(finished?'<button data-action="start-basis">Nieuwe basisreeks</button>':'')+'<button class="path-advanced" data-action="start-advanced">Verdieping · ook negatieve exponenten</button>':''}<details class="path-explanation"><summary>Uitleg bekijken</summary><p>${esc(sel.intro)}</p><div>${math(sel.example)}</div></details><div class="path-links"><span class="eyebrow">Ook bij dit onderdeel</span>${links}</div><p class="path-save">Je vorige antwoord blijft bewaard.</p></aside></div></section>`;
}
function steps(mission,error){
 const ready=mission.stage>=0&&mission.values.length>0&&mission.values.every(v=>/^-?\d+$/.test(String(v)))&&!error;
 const active=mission.stage<0?0:ready?2:1;
 const labels=[['Herken de regel','Kijk naar grondtal en bewerking.'],['Bouw de uitwerking','Kies elk antwoorddeel in de formule.'],['Controleer','Laat je volledige stap nakijken.']];
 return `<aside class="workshop-steps" aria-labelledby="your-steps"><h2 id="your-steps">Jouw stappen</h2><ol>${labels.map(([title,copy],i)=>{const done=mission.done||i===0&&mission.stage>=0;return `<li data-step-state="${done?'done':active===i?'current':'pending'}" ${!done&&active===i?'aria-current="step"':''}><span class="step-marker" aria-hidden="true">${done?'✓':i+1}</span><div><h3>${title}</h3><p>${copy}</p></div></li>`;}).join('')}</ol>${art(2,'workshop-detail-art')}<p class="steps-note">Hulp toont een ander voorbeeld.</p></aside>`;
}
function play({task,mission,work,question,head,footer,math,error}){
 const chosen=task.choices.find(c=>c.id===task.correct);
 return `<section class="screen play guided-play powers-play" data-stage="${mission.stage<0?'rule':mission.done?'done':'answer'}">${nav(pathLabel(task.id.startsWith('wortels-')?'wortels':'machten'),'chapter',mission.pathVersion===VERSION?mission.track==='basis'?'Basisreeks · alleen oefenen':'Verdieping · alleen oefenen':'Bestaande reeks · alleen oefenen')}${head}<div class="workshop-body"><div class="workshop-main"><div class="guided-question">${question}</div>${mission.stage>=0?`<p class="chosen-rule"><span aria-hidden="true">✓</span> ${esc(chosen.label)}</p>`:''}<div class="guided-work">${work}</div></div>${steps(mission,error)}</div>${footer}</section>`;
}
function summary({mission,stop,entry,math}){
 const n=entry?.independent.length||0,order=orderFor(stop.theme),last=order.indexOf(stop.id)===order.length-1;
 return `<section class="screen summary powers-summary">${nav(pathLabel(stop.theme),'chapter','Begeleide leerroute · op eigen tempo')}<div class="workshop-summary"><span class="eyebrow">${mission.track==='basis'?'Basisreeks':mission.track==='verdieping'?'Verdieping':'Reeks'} · 6 van 6 uitgewerkt</span><span class="summary-seal" aria-hidden="true">✓</span><h1>Reeks afgerond.</h1><h2>${esc(stop.title)}</h2><div class="summary-rule">${math(stop.example)}</div><p><strong>In dit onderdeel: ${n}/6 verschillende opgaven zelfstandig opgelost.</strong><br>${n<6?'Met hulp oefenen telt mee. Probeer de regel ook eens zelfstandig.':'Je hebt deze regel op zes verschillende opgaven toegepast.'}</p><p class="summary-note">Eerdere reeksen tellen mee. Je werk blijft bewaard; je kunt vrij herhalen of verdergaan.</p><div class="summary-actions"><button data-action="chapter">${pathLabel(stop.theme)}</button><button data-action="again">Nog een reeks</button>${!last?'<button class="primary" data-action="next-stop">Volgend onderdeel →</button>':''}</div></div></section>`;
}
function help({head,question,phase,step,explanation,footer}){
 return `<section class="screen help powers-play powers-help">${nav('Terug naar mijn opgave','help-return','Hulp · een ander voorbeeld')}${head}<div class="workshop-body"><div class="workshop-main"><div class="guided-question">${question}</div><div class="help-working"><span class="eyebrow">${esc(phase)}</span><div class="formula">${step}</div></div></div><aside class="workshop-steps"><h2>Een ander voorbeeld</h2><p class="help-explanation">${esc(explanation)}</p>${art(2,'workshop-detail-art')}<p class="steps-note">Je eigen opgave en antwoord blijven bewaard.</p></aside></div>${footer}</section>`;
}
return Object.freeze({PHASES,ROOT_PHASES,ORDER,ROOT_ORDER,orderFor,VERSION,resumable,chapter,play,help,summary});
});
