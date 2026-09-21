(function(){
'use strict';
const C=RealNumbersCore,P=C.Progress,L=RealNumbersLessons,$=id=>document.getElementById(id),KEY='axioma-real-numbers-v1';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let progress=P.fresh(),task=null,answer=null,session=null,phase='answer',topic=null,dirty=false,errorCode=null,lessonStep=0,feedback=null,preview=null,activeSlot=0,activeGroup='A',serial=Date.now()>>>0,drag=null,digitDrag=null,setDrag=null,activeToken=0,previous='stage',suspendedSeries=null;
function m(e,overbar=false){
 const num=n=>`<mn>${esc(C.format(n))}</mn>`;
 function body(e){
  if(e.kind==='fraction')return `${e.n<0?'<mo>−</mo>':''}<mfrac>${num(Math.abs(e.n))}${num(e.d)}</mfrac>`;
  if(e.kind==='power')return `<msup><mrow><mo>(</mo>${num(e.base)}<mo>)</mo></mrow>${num(e.degree)}</msup>`;
  if(e.kind==='root'||e.kind==='radical'){const inside=e.kind==='radical'?body(e.radicand):num(e.n);return `${e.sign<0?'<mo>−</mo>':''}${e.degree===3?`<mroot><mrow>${inside}</mrow><mn>3</mn></mroot>`:`<msqrt><mrow>${inside}</mrow></msqrt>`}`;}
  if(e.kind==='pi')return '<mi>π</mi>';
  if(e.kind==='period')return `${num(e.whole||0)}<mo>,</mo><mn>${esc(e.lead||'')}</mn>${overbar?`<mover accent="true"><mn>${esc(e.repeat)}</mn><mo>¯</mo></mover>`:`<mn>${esc(e.repeat.repeat(3))}</mn><mo>…</mo>`}`;
  return num(e.kind==='decimal'?e.text:e.n)+(e.kind==='percent'?'<mo>%</mo>':'');
 }
 return `<math xmlns="http://www.w3.org/1998/Math/MathML" aria-label="${esc(C.label(e))}"><mrow>${body(e)}</mrow></math>`;
}
const rationalMath=r=>m(C.fraction(r.n,r.d));
const intervalText=C.intervalLabel;const endpointText=v=>v==='-inf'?'−∞':v==='inf'?'+∞':C.format(v||'?');
function snapshot(){return task?structuredClone({skill:task.skill,seed:task.seed,variant:task.variant,level:task.level,contentVersion:task.contentVersion,answer,session,phase,topic,dirty,errorCode,lessonStep,feedback,activeSlot,activeGroup,activeToken}):null}
function save(){try{AxiomaGame.storage.setItem(KEY,JSON.stringify({progress,mode:document.documentElement.dataset.mode||'light',draft:snapshot(),suspendedSeries}));AxiomaGame.report(C.skills.filter(s=>P.mastered(progress,s.id)).map(s=>s.id),C.skills.length)}catch{$('storageWarning').hidden=false;$('storageWarning').textContent='Bewaren lukt niet. Laat deze pagina open om je werk te behouden.'}}
function restore(){try{
 const raw=JSON.parse(AxiomaGame.storage.getItem(KEY)||'null');progress=P.sanitize(raw?.progress);if(raw?.mode==='dark')document.documentElement.dataset.mode='dark';suspendedSeries=raw?.suspendedSeries&&C.skills.some(s=>s.id===raw.suspendedSeries.skill)?raw.suspendedSeries:null;return restoreDraft(raw?.draft);
 }catch{return false}}
function restoreDraft(d){try{
 if(!d||!C.skills.some(s=>s.id===d.skill))return false;
 task=C.generate(d.skill,{contentVersion:[2,3].includes(d.contentVersion)?d.contentVersion:1,seed:Number(d.seed)>>>0,variant:Math.max(0,Math.floor(Number(d.variant)||0)),level:Math.min(2,Math.max(0,Math.floor(Number(d.level)||0)))});answer=C.freshAnswer(task);const a=d.answer||{};
 answer.values=[0,1].map(i=>typeof a.values?.[i]==='string'?a.values[i].slice(0,8):'');answer.sign=a.sign===-1?-1:1;answer.relation=[-1,0,1].includes(a.relation)?a.relation:null;answer.groups=Array.from({length:6},(_,i)=>['A','B'].includes(a.groups?.[i])?a.groups[i]:null);answer.labels=[...new Set((Array.isArray(a.labels)?a.labels:[]).filter(x=>['N','Z','Q','irr','R'].includes(x)))];answer.tick=Number.isInteger(a.tick)&&a.tick>=0&&a.tick<=32?a.tick:null;answer.closedLo=a.closedLo===true;answer.closedHi=a.closedHi===true;answer.stage=task.directBounds||a.stage===1?1:0;answer.noReal=a.noReal===true;
 for(const key of ['start','end'])answer[key]=Number.isInteger(a[key])&&a[key]>=0&&a[key]<(task.digits?.length||0)?a[key]:null;
 if(task.skill==='interval')C.orderInterval(answer);if(task.skill==='period'&&answer.start!==null&&answer.end===null)answer.end=answer.start;answer.periodAnchor=Number.isInteger(a.periodAnchor)&&a.periodAnchor===answer.start&&answer.start===answer.end?a.periodAnchor:null;
 answer.placements=Array.from({length:task.tokens?.length||4},(_,i)=>['N','Z','Q','R'].includes(a.placements?.[i])?a.placements[i]:null);answer.decimalType=Object.hasOwn(C.decimalNames,a.decimalType)?a.decimalType:null;activeToken=Math.max(0,Math.min((task.tokens?.length||4)-1,Number(d.activeToken)||0));
 phase=['intro','answer','feedback','done'].includes(d.phase)?d.phase:'answer';topic=C.skills.some(s=>s.id===d.topic)?d.topic:d.free===true?task.skill:null;dirty=d.dirty===true;errorCode=typeof d.errorCode==='string'?d.errorCode:null;lessonStep=Math.max(0,Math.min(L.build(task).length-1,Math.floor(Number(d.lessonStep)||0)));
 session={answered:0,clean:0,xp:0};for(const k of ['answered','clean','xp'])session[k]=Math.min(k==='xp'?10000:8,Math.max(0,Number(d.session?.[k])||0));
 feedback=d.feedback&&typeof d.feedback.message==='string'?{...d.feedback,message:d.feedback.message.slice(0,600)}:null;if(phase==='feedback'&&!feedback)phase='answer';if(phase==='done'&&!feedback)feedback={ok:true,message:'Deze oefening is al verwerkt. Je kunt verdergaan.',xp:0};activeSlot=d.activeSlot===1?1:0;activeGroup=d.activeGroup==='B'?'B':'A';return true;
 }catch{return false}}
function screen(name){document.body.dataset.screen=name;document.body.dataset.preview=String(!!preview);for(const id of ['stage','library','help','progress','summary'])$(id).hidden=id!==name;AxiomaPlatform.trainerScreen(preview?'help':({stage:'play',help:'help',progress:'progress'})[name]||'');$('xp').textContent=`${progress.xp} XP`;if(name==='stage')render();}
function makeTask(id){
 const previousTask=task?.skill===id?task.signature:null;preview=null;const s=progress.skills[id],level=s.seen<2?0:s.seen<5?1:2;
 let candidate;for(let i=0;i<30;i++){candidate=C.generate(id,{seed:++serial,variant:s.seen+(i>14?i-14:0),level});if(candidate.signature!==previousTask&&!s.signatures.slice(-3).includes(candidate.signature))break}task=candidate;
 answer=C.freshAnswer(task);phase=!s.intro?'intro':'answer';lessonStep=0;dirty=false;errorCode=null;feedback=null;activeSlot=0;activeToken=0;save();screen('stage');
}
function next(){if(session.answered>=8){finishSession();return}makeTask(topic||P.choose(progress))}
function start(){suspendedSeries=null;session={answered:0,clean:0,xp:0};topic=null;next()}
function resume(){preview=null;task?screen('stage'):start()}
function followRoute(){
 preview=null;
 if(!topic){resume();return}
 if(session.answered>=8){finishSession();return}
 topic=null;
 if(suspendedSeries){const draft=suspendedSeries,currentSession=session;suspendedSeries=null;if(restoreDraft(draft)){topic=null;session=currentSession;save();screen('stage');return}}
 next();
}
function explore(id){
 if(task&&!topic)suspendedSeries=snapshot();
 if(!session||session.answered>=8)session={answered:0,clean:0,xp:0};
 topic=id;makeTask(id);
}
function button(label,data,extra=''){return `<button ${data} ${extra}>${label}</button>`}
function slot(a,i,label,readonly){return button(`<small>${esc(label)}</small>${esc(endpointText(a.values[i]))}`,`class="slot" data-slot="${i}" aria-label="${esc(label)}" aria-pressed="${activeSlot===i}"`,readonly?'disabled':'')}
function pad(rootInput=false){return `<div class="keypad" aria-label="Getallen invoeren">${[['7','7'],['8','8'],['9','9'],['back','⌫'],['4','4'],['5','5'],['6','6'],['sign','±'],['1','1'],['2','2'],['3','3'],[rootInput==='single'?'slash':'next',rootInput==='single'?'/':'⇥'],['0','0'],['clear','Wis']].map(([key,label])=>button(label,`data-key="${key}" aria-label="${({back:'Laatste cijfer wissen',sign:'Teken wisselen',next:'Ander invoerveld',clear:'Actief veld wissen'})[key]||label}"`)).join('')}${rootInput==='pair'?button('/','data-key="slash" aria-label="Breukstreep"'):'<span class="empty-key"></span>'}</div>`}
function svgLine(){return '<svg class="line-canvas" id="numberline" role="application" tabindex="0" aria-label="Getallijn. Tik een plaats of gebruik de pijltjestoetsen en stapknoppen."></svg>'}
function relationButtons(a){return `<div class="relations">${[-1,0,1].map((v,i)=>button(['&lt;','=','&gt;'][i],`data-relation="${v}" aria-pressed="${a.relation===v}" aria-label="${['Kleiner dan','Gelijk aan','Groter dan'][i]}"`)).join('')}</div>`}
function taskMarkup(t,a,readonly){
 let canvas='',panel='';
 if(t.skill==='fraction'){
  canvas=`<div class="source-caption">Dezelfde waarde</div><div class="formula-row"><div class="math-large">${m(t.source)}</div><span class="math-medium">=</span><div class="fraction-answer">${button(a.sign===-1?'−':'+','class="sign" data-key="sign" aria-label="Teken van de breuk wisselen"',readonly?'disabled':'')}<div class="fraction-stack">${slot(a,0,'teller',readonly)}<span class="fraction-rule"></span>${slot(a,1,'noemer',readonly)}</div></div></div>`;panel=pad();
 }else if(t.skill==='compare'){
  canvas=`<div class="formula-row math-large">${m(t.left)}<span class="comparison-gap">${a.relation===null?'?':['<','=','>'][a.relation+1]}</span>${m(t.right)}</div>${t.representation==='numberline'?svgLine():'<p class="source-caption">Verschillende schrijfwijzen, echte waarden.</p>'}`;panel=relationButtons(a);
 }else if(t.skill==='line'){
  canvas=`<div class="math-large">${m(t.source)}</div>${svgLine()}`;panel=`<p class="muted">Tik op de lijn. Verfijn met de stapknoppen.</p><div class="line-tools">${button('−','data-step="-1" aria-label="Eén streepje naar links"')}<output>${a.tick===null?'Nog geen punt':C.decimalOf(C.rational(t.min*t.step.d+a.tick*t.step.n,t.step.d))}</output>${button('+','data-step="1" aria-label="Eén streepje naar rechts"')}</div><p class="muted">Eén streepje = ${C.decimalOf(t.step)}</p>`;
 }else if(t.skill==='group'){
  canvas=`<div class="token-grid">${t.tokens.map((e,i)=>button(`${m(e)}<small>Kaart ${i+1} · ${a.groups[i]?'groep '+a.groups[i]:'nog geen groep'}</small>`,`class="number-token" data-token="${i}" data-group="${a.groups[i]||''}" aria-label="Kaart ${i+1}: ${esc(C.label(e))}, ${a.groups[i]?'groep '+a.groups[i]:'nog geen groep'}"`)).join('')}</div>`;
  panel=`<p class="muted">Kies een groep. Tik daarna op de kaartjes die erbij horen.</p><div class="group-keys line-tools">${['A','B'].map(g=>button('Groep '+g,`data-group="${g}" data-select-group="${g}" aria-pressed="${activeGroup===g}"`)).join('')}</div><p class="muted">Nogmaals tikken maakt een kaartje vrij.</p>`;
 }else if(t.skill==='rootcalc'){
  canvas=`<div class="math-large">${m(t.source)}</div><div class="root-calculation-answer">${a.noReal?'<strong>Geen reële waarde</strong>':slot(a,0,'antwoord',readonly)}</div>${button('Geen reële waarde',`data-toggle="noReal" aria-pressed="${a.noReal}"`,readonly?'disabled':'')}`;
  panel=pad('single');
 }else if(t.skill==='rootsimplify'){
  canvas=`<div class="math-large">${m(t.source)}</div><div class="root-form-answer">${slot(a,0,'voor de wortel',readonly)}<div class="radical-input"><span aria-hidden="true">${t.degree===3?'∛':'√'}</span>${slot(a,1,'onder de wortel',readonly)}</div></div>`;
  panel=pad('pair');
 }else if(t.skill==='root'){
  const center=a.stage?m(t.source):m(C.integer(t.n)),powers=C.rootBounds(t,0);
  canvas=`${t.directBounds?'<p class="source-caption">Zoek twee opeenvolgende gehele getallen.</p>':a.stage?`<div class="saved-step">Vorige stap: ${powers[0]} &lt; ${t.n} &lt; ${powers[1]}</div>`:`<div class="source-caption">Twee opeenvolgende ${t.degree===3?'gehele derdemachten':'gehele kwadraten'}</div>`}<div class="formula-row">${slot(a,0,'ondergrens',readonly)}<span>&lt;</span><span class="math-medium">${center}</span><span>&lt;</span>${slot(a,1,'bovengrens',readonly)}</div>`;panel=pad();
 }else if(t.skill==='interval'){
  const source=t.sourceText?esc(t.sourceText):t.sourceMode==='notation'?esc(intervalText(t.lo,t.hi,t.closedLo,t.closedHi)):`x is groter ${t.closedLo?'dan of gelijk aan':'dan'} ${C.format(t.lo)} en kleiner ${t.closedHi?'dan of gelijk aan':'dan'} ${C.format(t.hi)}.`;
  canvas=`<div class="interval-source">${source}</div>${t.convention?`<p class="interval-convention">${esc(t.convention)}</p>`:''}${svgLine()}`;
  panel=`<div class="interval-controls">${[0,1].map(i=>button(`${a.values.every(Boolean)?i?'Rechts':'Links':'Punt'} ${esc(endpointText(a.values[i]))}`,`data-slot="${i}" aria-pressed="${activeSlot===i}"`)).join('')}</div><div class="line-tools">${button('−','data-step="-1" aria-label="Actief grenspunt één naar links"')}<span class="muted">Verplaats punt</span>${button('+','data-step="1" aria-label="Actief grenspunt één naar rechts"')}</div><div class="infinity-tools">${button('← −∞','data-infinity="-inf" aria-label="Onbegrensd naar links"')}${button('+∞ →','data-infinity="inf" aria-label="Onbegrensd naar rechts"')}</div>${button('Opnieuw tekenen','data-reset="interval"')}`;
 }else if(t.skill==='classify'){
  canvas=`<div class="math-large">${m(t.source)}</div><p class="source-caption">Meerdere namen kunnen tegelijk juist zijn.</p>`;
  panel=`<div class="sets">${[['N','ℕ'],['Z','ℤ'],['Q','ℚ'],['irr','irrationaal'],['R','ℝ']].map(([id,name])=>button(name,`data-set="${id}" aria-pressed="${a.labels.includes(id)}"`)).join('')}</div><p class="muted">ℕ bevat hier ook 0.</p>`;
  if(readonly&&a.labels.length)canvas+=`<div class="set-map">${a.labels.map(id=>({N:'ℕ',Z:'ℤ',Q:'ℚ',R:'ℝ',irr:'irrationaal'})[id]).join(' · ')}</div>`;
 }else if(t.skill==='sets'){
  const bank=t.tokens.map((e,i)=>readonly?`<span class="set-preview-token">${m(e)}</span>`:button(`${m(e)}<small>${a.placements[i]?({N:'ℕ',Z:'ℤ',Q:'ℚ',R:'ℝ'})[a.placements[i]]:'Kies of sleep'}</small>`,`class="set-token" data-sort-token="${i}" aria-pressed="${activeToken===i}" aria-label="${esc(C.label(e))}, ${a.placements[i]?'geplaatst in '+a.placements[i]:'nog te plaatsen'}"`)).join('');
  const region=i=>{const id=['R','Q','Z','N'][i];return `<div class="set-region"><strong class="set-label" aria-hidden="true">${({R:'ℝ',Q:'ℚ',Z:'ℤ',N:'ℕ'})[id]}</strong><button class="set-zone" data-zone="${id}" aria-label="Plaats in ${id}"><span class="set-elements">${t.tokens.map((e,j)=>a.placements[j]===id?`<span class="set-element"><i class="element-point" aria-hidden="true"></i>${m(e)}</span>`:'').join('')}</span></button>${i<3?region(i+1):''}</div>`};
  canvas=`<div class="set-bank">${bank}</div><div class="set-map-board">${region(0)}</div>`;
 }else if(t.skill==='decimaltype'){
  canvas=`<div class="math-large">${m(t.source)}</div>${t.rule?`<p class="rule">${esc(t.rule)}</p>`:''}${readonly&&a.decimalType?`<p class="type-answer">${esc(C.decimalNames[a.decimalType])}</p>`:''}`;
  panel=`<div class="decimal-types">${Object.entries(C.decimalNames).map(([id,name])=>button(name,`data-decimal-type="${id}" aria-pressed="${a.decimalType===id}"`)).join('')}</div>`;
 }else if(t.skill==='period'){
  const selected=a.start!==null&&a.end!==null;
  canvas=`<p class="rule">${esc(t.rule)}</p><div class="digits"><span class="digits-prefix">${t.whole},</span>${[...t.digits].map((digit,i)=>button(digit,`class="digit ${selected&&i>=a.start&&i<=a.end?'selected':''}" data-digit="${i}" aria-pressed="${selected&&i>=a.start&&i<=a.end}" aria-label="Decimaal ${i+1}: ${digit}"`)).join('')}<span>…</span></div><p class="source-caption" aria-live="polite">${selected?`Jouw blok: ${esc(t.digits.slice(a.start,a.end+1))}`:'Nog geen blok gekozen'}</p>${!readonly?`<div class="period-tools"><p class="muted">Eén cijfer? Tik één keer.<br>Meer cijfers? Sleep erover, of tik de twee uiteinden.</p>${button('Wis selectie','data-reset="period"')}</div>`:''}`;
 }
 return {canvas,panel};
}
function feedbackSource(t,a){
 const caption=text=>`<p class="source-caption">${esc(text)}</p>`,values=a.values.map(x=>esc(x||'?'));
 if(t.skill==='fraction')return caption('Gegeven')+m(t.source)+caption('Jouw breuk')+`<math><mrow>${a.sign<0?'<mo>−</mo>':''}<mfrac><mtext>${values[0]}</mtext><mtext>${values[1]}</mtext></mfrac></mrow></math>`;
 if(t.skill==='compare')return caption('Jouw vergelijking')+`<div class="feedback-comparison">${m(t.left)}<span>${esc(a.relation===null?'?':['<','=','>'][a.relation+1])}</span>${m(t.right)}</div>`;
 if(t.skill==='group')return (feedback.pair||[0,1]).map(i=>caption(`Kaart ${i+1} · ${a.groups[i]?'groep '+a.groups[i]:'geen groep'}`)+m(t.tokens[i])).join('');
 if(t.skill==='rootcalc'){const r=C.parseExact(a.values[0]);return caption('Gegeven')+m(t.source)+caption('Jouw antwoord')+(a.noReal?'<div>Geen reële waarde</div>':r?m(r.d===1?C.integer(r.n):C.fraction(r.n,r.d)):`<div>${values[0]}</div>`);}
 if(t.skill==='rootsimplify'){const c=C.parseExact(a.values[0]),inside=Number(a.values[1]);return caption('Gegeven')+m(t.source)+caption('Jouw wortelvorm')+(c&&Number.isInteger(inside)&&inside>0?`<div class="math-product">${m(c.d===1?C.integer(c.n):C.fraction(c.n,c.d))}${m(t.degree===3?C.cbrt(inside):C.sqrt(inside))}</div>`:`<div>(${values[0]})${t.degree===3?'∛':'√'}${values[1]}</div>`);}
 if(t.skill==='root')return caption('Jouw grenzen')+`<div class="feedback-comparison"><span>${values[0]}</span><span>&lt;</span>${a.stage?m(t.source):m(C.integer(t.n))}<span>&lt;</span><span>${values[1]}</span></div>`;
 if(t.skill==='interval')return caption('Gevraagd')+`<div>${esc(intervalText(t.lo,t.hi,t.closedLo,t.closedHi))}</div>`+caption('Jouw interval')+`<div>${esc(intervalText(a.values[0]==='-inf'?null:a.values[0]||'?',a.values[1]==='inf'?null:a.values[1]||'?',a.closedLo,a.closedHi))}</div>`;
 if(t.skill==='sets')return caption('Kleinste passende verzameling')+t.tokens.map((e,i)=>`<div class="feedback-set">${m(e)} → ${({N:'ℕ',Z:'ℤ',Q:'ℚ',R:'ℝ'})[a.placements[i]]||'?'}</div>`).join('');
 if(t.skill==='decimaltype')return m(t.source)+caption(C.decimalNames[a.decimalType]||'Nog niet gekozen');
 if(t.skill==='classify')return m(t.source)+caption('Jouw selectie')+`<div class="selected-sets">${a.labels.map(id=>({N:'ℕ',Z:'ℤ',Q:'ℚ',R:'ℝ',irr:'irrationaal'})[id]).join(' · ')||'Nog niets gekozen'}</div>`;
 if(t.skill==='period')return caption(t.rule)+caption(phase==='done'?'Drie herhalingen, daarna …':'Jouw herhaalblok')+(phase==='done'?m({kind:'period',whole:t.whole,lead:t.lead,repeat:t.repeat}):`<div>${a.start!==null&&a.end!==null?esc(t.digits.slice(a.start,a.end+1)):'?'}</div>`);
 return caption('Gevraagd')+m(t.source)+caption('Jouw punt')+`<div>${a.tick===null?'?':C.decimalOf(C.rational(t.min*t.step.d+a.tick*t.step.n,t.step.d))}</div>`;
}
function render(){
 if(!task&&!preview)return;
 const focused=document.activeElement,focusKey=focused&&$('workspace').contains(focused)?['slot','key','token','set','selectGroup','digit','toggle','step','reset','sortToken','zone','decimalType','infinity'].find(k=>focused.dataset[k]!==undefined):null,focusValue=focusKey?focused.dataset[focusKey]:null,focusLine=focused?.id==='numberline';
 const t=preview?.task||task,isLesson=!!preview||phase==='intro',step=isLesson?L.build(t)[preview?preview.step:lessonStep]:null,a=step?.answer||answer;
 document.body.dataset.preview=String(!!preview);$('xp').textContent=`${progress.xp} XP`;$('xp').title=`${progress.xp} XP totaal · ${session?.xp||0} XP deze reeks`;
 $('eyebrow').textContent=`${preview?'Uitlegcollectie':isLesson?'Nieuw begrip':topic?'Zelfgekozen onderwerp':progress.skills[t.skill].repair?'Opnieuw proberen':'Jouw leerroute'} · ${C.skills.find(s=>s.id===t.skill).short}`;
 $('prompt').textContent=t.skill==='root'&&!t.directBounds&&a.stage===1?'Bouw nu de grenzen voor de wortelwaarde.':t.prompt;
 $('seriesReturn').hidden=!topic||!!preview;
 $('round').hidden=!!preview||!!topic;$('round').textContent=`Opgave ${Math.min(8,(session?.answered||0)+(phase==='done'?0:1))} / 8`;
 const feedbackMode=!isLesson&&['feedback','done'].includes(phase);
 $('workspace').className=`${isLesson?'readonly ':''}${feedbackMode?'feedback ':''}${t.skill}`;
 const parts=taskMarkup(t,a,isLesson);
 if(step?.alternatePeriod)parts.canvas=`<div class="math-large">${m({kind:'period',whole:t.whole,lead:t.lead,repeat:t.repeat},true)}</div><p class="source-caption">Dezelfde decimaal, een andere notatie.</p>`;
 if(feedbackMode){
  $('workspace').innerHTML=`<div class="feedback-picture">${feedbackSource(t,a)}</div><div class="feedback-copy ${feedback.ok?'good':'repair'}" role="status" aria-live="polite"><h2>${feedback.partial?'Waarde juist · vorm nog aanpassen':feedback.ok?(phase==='done'?'Juist!':'Deze stap klopt'):'Bekijk dit verband'}</h2>${phase==='done'?`<strong class="xp-earned">+${feedback.xp} XP · ${dirty?'met hulp of na verbetering':'zelfstandig opgelost'}</strong>`:''}<p>${esc(feedback.message)}</p>${feedback.detail?`<p>${esc(feedback.detail)}</p>`:''}</div>`;
 }else{
  $('workspace').innerHTML=`<div class="canvas">${parts.canvas}</div>${isLesson?`<aside class="lesson-copy"><span class="eyebrow">Stap ${(preview?preview.step:lessonStep)+1} van ${L.build(t).length}</span><h2>${esc(step.title)}</h2><p>${esc(step.text)}</p></aside>`:parts.panel?`<aside class="answer-panel">${parts.panel}</aside>`:''}`;
  if(isLesson)$('workspace').querySelectorAll('button').forEach(b=>b.disabled=true);
 }
 $('skip').hidden=isLesson||feedbackMode;$('back').hidden=!isLesson&&!(feedbackMode&&!feedback.ok);$('back').textContent=isLesson?'← Vorige':'Voorbeeld';$('back').disabled=isLesson&&(preview?preview.step:lessonStep)===0;
 $('commit').textContent=isLesson?((preview?preview.step:lessonStep)<L.build(t).length-1?'Volgende stap →':preview?(task?'Terug naar oefening':'Naar uitlegcollectie'):'Zelf proberen →'):phase==='done'?'Volgende →':phase==='feedback'?(feedback.ok?'Bouw de wortelgrenzen →':'Verbeter je antwoord'):'Controleer';
 $('hint').textContent=isLesson?'Bekijk het voorbeeld op je eigen tempo.':feedbackMode?'Lees rustig. Je kiest zelf wanneer je verdergaat.':t.skill==='interval'?'Tik een grens: hol ↔ vol. Kies −∞ of +∞ voor een onbegrensde kant.':t.skill==='sets'?'Sleep naar de kleinste verzameling, of tik een kaart en daarna een vak. ℕ bevat ook 0.':t.skill==='rootcalc'?'Een breuk invoeren? Gebruik /. Controleer pas wanneer je klaar bent.':t.skill==='rootsimplify'?'Vul de factor en de resterende wortel in. / maakt een breuk.':t.skill==='root'&&!t.directBounds?'Beide stappen samen vormen één opgave.':'Je keuze wordt pas beoordeeld na Controleer.';
 drawLine(t,a);
 if(focusLine)$('numberline')?.focus({preventScroll:true});else if(focusKey){const attr=focusKey.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());$('workspace').querySelector(`[data-${attr}="${focusValue}"]`)?.focus({preventScroll:true});}
}
function drawLine(t=preview?.task||task,a=(preview||phase==='intro')?L.build(t)[preview?preview.step:lessonStep].answer:answer){
 const svg=$('numberline');if(!svg)return;const box=svg.getBoundingClientRect(),w=box.width,h=box.height;if(!w||!h)return;
 const compare=t.skill==='compare',min=compare?Math.floor(Math.min(C.number(C.value(t.left)),C.number(C.value(t.right))))-1:t.min,max=compare?Math.ceil(Math.max(C.number(C.value(t.left)),C.number(C.value(t.right))))+1:t.max,step=t.skill==='line'?C.number(t.step):1;
 const x=v=>28+(v-min)/(max-min)*(w-56),y=Math.max(35,Math.min(h-38,h*.52));let html=`<line class="axis" x1="28" y1="${y}" x2="${w-28}" y2="${y}" stroke-width="2"/>`;
 for(let i=0;i<=Math.round((max-min)/step);i++){if(t.skill==='interval'&&(i===0&&a.values.includes('-inf')||i===Math.round((max-min)/step)&&a.values.includes('inf')))continue;const v=min+i*step,px=x(v);html+=`<line class="tick" x1="${px}" y1="${y-5}" x2="${px}" y2="${y+5}"/>`;if(Number.isInteger(v)&&(w>400||v%2===0||v===min||v===max))html+=`<text x="${px}" y="${y+26}" text-anchor="middle">${C.format(v)}</text>`;}
 const marker=(v,closed,label,offset=0)=>{const px=x(v);html+=`<circle cx="${px}" cy="${y}" r="7" fill="${closed?'var(--blue)':'var(--paper)'}" stroke="var(--blue)" stroke-width="3"/>${label?`<text x="${Math.max(35,Math.min(w-35,px))}" y="${y-17-offset}" text-anchor="middle">${esc(label)}</text>`:''}`};
 if(compare){marker(C.number(C.value(t.left)),true,'A',0);marker(C.number(C.value(t.right)),false,'B',18);}
 if(t.skill==='line'&&a.tick!==null){const v=min+a.tick*step;marker(v,true,C.format(Number(v.toFixed(4))));}
 if(t.skill==='interval'){
  const l=C.endpoint(a.values[0]),r=C.endpoint(a.values[1]),edge=v=>v===-Infinity?min:v===Infinity?max:v;
  if(l!==null&&r!==null&&l<r)html+=`<line x1="${x(edge(l))}" x2="${x(edge(r))}" y1="${y}" y2="${y}" stroke="var(--blue)" stroke-width="7" opacity=".5"/>`;
  for(const [v,closed] of [[l,a.closedLo],[r,a.closedHi]])if(v!==null){if(Number.isFinite(v))marker(v,closed,C.format(v));else {const px=x(edge(v)),direction=v<0?-1:1;html+=`<path d="M ${px-direction*14} ${y-10} L ${px} ${y} L ${px-direction*14} ${y+10}" stroke="var(--blue)" stroke-width="4" fill="none"/><text x="${px-direction*8}" y="${y-18}" text-anchor="middle">${v<0?'−∞':'+∞'}</text>`;}}
  const active=C.endpoint(a.values[activeSlot]);if(!preview&&phase==='answer'&&active!==null&&Number.isFinite(active)){html+=`<circle cx="${x(active)}" cy="${y}" r="14" fill="none" stroke="var(--gold)" stroke-width="2" stroke-dasharray="3 3"/>`}

 }
 if(t.skill==='interval')svg.setAttribute('aria-label','Interval. Tik twee grenspunten in willekeurige volgorde. Tik opnieuw voor hol of vol. Sleep om te verplaatsen. Pijltjestoetsen verplaatsen het actieve punt; Enter wisselt hol en vol.');
 svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.innerHTML=html;
 if(preview||phase!=='answer'||!['line','interval'].includes(t.skill))return;
 const at=clientX=>{const r=svg.getBoundingClientRect();return min+Math.max(0,Math.min(1,(clientX-r.left-28)/(r.width-56)))*(max-min)};
 const place=clientX=>{const v=at(clientX);if(t.skill==='line')answer.tick=Math.max(0,Math.min(Math.round((max-min)/step),Math.round((v-min)/step)));else moveEndpoint(Math.round(v));drawLine(t,answer)};
 svg.onpointerdown=e=>{
  if(e.button>0||drag)return;e.preventDefault();svg.focus({preventScroll:true});
  const v=Math.round(at(e.clientX)),hit=t.skill==='interval'?answer.values.findIndex(s=>C.endpoint(s)===v):-1;
  drag={answer:structuredClone(answer),slot:activeSlot,id:e.pointerId,x:e.clientX,y:e.clientY,hit,moved:false};svg.setPointerCapture(e.pointerId);
  if(t.skill==='interval'){
   activeSlot=hit>=0?hit:answer.values.indexOf('')>=0?answer.values.indexOf(''):[0,1].sort((i,j)=>Math.abs((C.endpoint(answer.values[i])??0)-v)-Math.abs((C.endpoint(answer.values[j])??0)-v))[0];
   if(hit<0)place(e.clientX);else drawLine(t,answer);
  }else place(e.clientX);
 };
 svg.onpointermove=e=>{if(drag?.id===e.pointerId&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>6){drag.moved=true;place(e.clientX)}};
 svg.onpointerup=e=>{
  if(drag?.id!==e.pointerId)return;const r=svg.getBoundingClientRect();
  if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){answer=drag.answer;activeSlot=drag.slot}
  else if(t.skill==='interval'&&!drag.moved&&drag.hit>=0)toggleEndpoint();
  drag=null;save();render();
 };
 svg.onpointercancel=()=>{if(drag){answer=drag.answer;activeSlot=drag.slot;drag=null;save();render()}};
 svg.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();stepValue(e.key==='ArrowLeft'?-1:1)}else if(t.skill==='interval'&&['Enter',' '].includes(e.key)){e.preventDefault();if(answer.values[activeSlot]==='')moveEndpoint(0);else toggleEndpoint();save();render()}};
}
function moveEndpoint(value){
 const other=1-activeSlot;
 // Distinct endpoints cannot collapse; crossing them keeps each circle's inclusion.
 if(answer.values[other]!==''&&C.endpoint(answer.values[other])===C.endpoint(value))return;
 answer.values[activeSlot]=String(value);if(value==='-inf'||value==='inf')answer[activeSlot?'closedHi':'closedLo']=false;if(C.orderInterval(answer))activeSlot=1-activeSlot;
}
function toggleEndpoint(){if(!Number.isFinite(C.endpoint(answer.values[activeSlot])))return;const key=activeSlot?'closedHi':'closedLo';answer[key]=!answer[key]}
function selectDigit(i){
 if(answer.periodAnchor!==null&&answer.periodAnchor!==i){answer.start=Math.min(answer.periodAnchor,i);answer.end=Math.max(answer.periodAnchor,i);answer.periodAnchor=null;}
 else {answer.start=answer.end=i;answer.periodAnchor=i;}
}
// Pointer selection follows the finger, with one digit already a complete answer.
$('workspace').addEventListener('pointerdown',e=>{
 const b=e.target.closest('[data-digit]');if(!b||b.disabled||preview||phase!=='answer'||e.button>0||digitDrag)return;
 e.preventDefault();b.focus({preventScroll:true});digitDrag={id:e.pointerId,start:Number(b.dataset.digit),last:Number(b.dataset.digit),answer:structuredClone(answer),moved:false};$('workspace').setPointerCapture(e.pointerId);
});
function paintDigitSelection(){for(const b of $('workspace').querySelectorAll('[data-digit]')){const selected=Number(b.dataset.digit)>=answer.start&&Number(b.dataset.digit)<=answer.end;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected))}}
$('workspace').addEventListener('pointermove',e=>{
 if(digitDrag?.id!==e.pointerId)return;const b=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-digit]');if(!b)return;
 const i=Number(b.dataset.digit);if(i!==digitDrag.start)digitDrag.moved=true;digitDrag.last=i;
 if(digitDrag.moved){answer.start=Math.min(i,digitDrag.start);answer.end=Math.max(i,digitDrag.start);answer.periodAnchor=null;paintDigitSelection()}
});
$('workspace').addEventListener('pointerup',e=>{
 if(digitDrag?.id!==e.pointerId)return;const b=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-digit]');
 if(!b)answer=digitDrag.answer;else {const end=Number(b.dataset.digit);if(digitDrag.moved||end!==digitDrag.start){answer.start=Math.min(digitDrag.start,end);answer.end=Math.max(digitDrag.start,end);answer.periodAnchor=null;}else selectDigit(digitDrag.start);}
 digitDrag=null;save();render();
});
$('workspace').addEventListener('pointercancel',()=>{if(digitDrag){answer=digitDrag.answer;digitDrag=null;save();render()}});

function key(k){
 if(phase!=='answer'||preview)return;
 answer.noReal=false;
 if(k==='next')activeSlot=1-activeSlot;
 else if(k==='slash'&&['rootcalc','rootsimplify'].includes(task.skill)&&activeSlot===0&&!answer.values[0].includes('/')&&/^[-]?\d+$/.test(answer.values[0]))answer.values[0]+='/';
 else if(k==='sign'){if(task.skill==='fraction')answer.sign*=-1;else answer.values[activeSlot]=answer.values[activeSlot].startsWith('-')?answer.values[activeSlot].slice(1):'-'+answer.values[activeSlot];}
 else if(k==='clear')answer.values[activeSlot]='';else if(k==='back')answer.values[activeSlot]=answer.values[activeSlot].slice(0,-1);else if(/^\d$/.test(k)&&answer.values[activeSlot].replace('-','').length<6)answer.values[activeSlot]+=k;
 save();render();
}
function stepValue(d){if(preview||phase!=='answer')return;if(task.skill==='line')answer.tick=Math.max(0,Math.min(Math.round((task.max-task.min)/C.number(task.step)),(answer.tick??Math.round(-task.min/C.number(task.step)))+d));else if(task.skill==='interval'){let v=Math.max(task.min,Math.min(task.max,(answer.values[activeSlot]==='-inf'?task.min:answer.values[activeSlot]==='inf'?task.max:Number(answer.values[activeSlot])||0)+d));if(answer.values[1-activeSlot]!==''&&Number(answer.values[1-activeSlot])===v)v=Math.max(task.min,Math.min(task.max,v+d));moveEndpoint(v);}save();render()}
$('workspace').onclick=e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
 if(d.example){example(d.example);return}if(preview||phase!=='answer')return;
 if(d.key){key(d.key);return}if(d.slot!==undefined)activeSlot=Number(d.slot);
 if(d.relation!==undefined)answer.relation=Number(d.relation);
 if(d.selectGroup)activeGroup=d.selectGroup;
 if(d.token!==undefined){const i=Number(d.token);answer.groups[i]=answer.groups[i]===activeGroup?null:activeGroup;}
 if(d.set)answer.labels=answer.labels.includes(d.set)?answer.labels.filter(x=>x!==d.set):[...answer.labels,d.set];
 if(d.toggle)answer[d.toggle]=!answer[d.toggle];
 if(d.digit!==undefined){if(e.detail>0)return;selectDigit(Number(d.digit))}
 if(d.infinity){const existing=answer.values.indexOf(d.infinity);activeSlot=existing>=0?existing:answer.values.indexOf('')>=0?answer.values.indexOf(''):d.infinity==='-inf'?0:1;moveEndpoint(d.infinity);}
 if(d.sortToken!==undefined){if(e.detail>0&&setDrag)return;activeToken=Number(d.sortToken);}
 if(d.zone){answer.placements[activeToken]=d.zone;activeToken=answer.placements.indexOf(null)>=0?answer.placements.indexOf(null):activeToken;}
 if(d.decimalType)answer.decimalType=d.decimalType;
 if(d.reset==='interval'){answer.values=['',''];answer.closedLo=answer.closedHi=false;activeSlot=0;}
 if(d.reset==='period')answer.start=answer.end=answer.periodAnchor=null;
 if(d.step){stepValue(Number(d.step));return}save();render();
};
// Pointer-based sorting also works on touch screens; tapping remains an alternative.
$('workspace').addEventListener('pointerdown',e=>{
 const token=e.target.closest('[data-sort-token]');if(!token||token.disabled||preview||phase!=='answer'||e.button>0)return;
 e.preventDefault();activeToken=Number(token.dataset.sortToken);const ghost=token.cloneNode(true);ghost.removeAttribute('data-sort-token');ghost.className='set-token drag-ghost';ghost.setAttribute('aria-hidden','true');ghost.tabIndex=-1;ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';document.body.append(ghost);setDrag={id:e.pointerId,token:activeToken,ghost};$('workspace').setPointerCapture(e.pointerId);token.classList.add('dragging');
});
$('workspace').addEventListener('pointermove',e=>{
 if(setDrag?.id!==e.pointerId)return;setDrag.ghost.style.left=e.clientX+'px';setDrag.ghost.style.top=e.clientY+'px';const zone=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-zone]');for(const z of $('workspace').querySelectorAll('[data-zone]'))z.classList.toggle('drop-active',z===zone);
});
$('workspace').addEventListener('pointerup',e=>{
 if(setDrag?.id!==e.pointerId)return;const zone=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-zone]');if(zone)answer.placements[setDrag.token]=zone.dataset.zone;setDrag.ghost.remove();setDrag=null;save();render();
});
$('workspace').addEventListener('pointercancel',()=>{if(setDrag){setDrag.ghost.remove();setDrag=null;render()}});
document.addEventListener('keydown',e=>{if(document.body.dataset.screen!=='stage'||preview||phase!=='answer'||!['fraction','root','rootcalc','rootsimplify'].includes(task.skill)||e.ctrlKey||e.metaKey||e.altKey)return;if(/^\d$/.test(e.key)){e.preventDefault();key(e.key)}else if(['Backspace','-','/'].includes(e.key)){e.preventDefault();key(e.key==='-'?'sign':e.key==='/'?'slash':'back')}});
function commit(){
 if(preview){if(preview.step<L.build(preview.task).length-1){preview.step++;render()}else{preview=null;task?screen('stage'):showHelp()}return;}
 if(phase==='intro'){
  if(lessonStep<L.build(task).length-1){lessonStep++;save();render();return}
  progress.skills[task.skill].intro=true;makeTask(task.skill);return;
 }
 if(phase==='done'){next();return}
 if(phase==='feedback'){if(feedback.ok&&task.skill==='root'){answer.stage=1;answer.values=['',''];activeSlot=0;}phase='answer';feedback=null;save();render();return}
 const r=C.validate(task,answer);feedback=r;
 if(!r.ok){if(!r.input){dirty=true;errorCode=r.code;progress.skills[task.skill].repair=r.code;progress.skills[task.skill].due=progress.total+3;}phase='feedback';save();render();return}
 if(task.skill==='root'&&answer.stage===0){phase='feedback';save();render();return}
 phase='done';const xp=P.record(progress,task,{clean:!dirty,solved:true,code:errorCode||'practice'});session.answered++;session.xp+=xp;if(!dirty)session.clean++;feedback={...r,xp};save();render();
}
$('commit').onclick=commit;$('back').onclick=()=>{if(phase==='feedback'&&!feedback?.ok&&!preview){example(task.skill);return}if(preview)preview.step=Math.max(0,preview.step-1);else lessonStep=Math.max(0,lessonStep-1);save();render()};
$('skip').onclick=()=>{if(preview||phase!=='answer')return;P.record(progress,task,{clean:false,solved:false,code:errorCode||'practice'});session.answered++;next()};
function topicCards(root,help=false){
 root.replaceChildren();C.skills.forEach((s,i)=>{const card=document.createElement('article');card.className='topic-card'+(P.mastered(progress,s.id)?' solid':'');const status=P.mastered(progress,s.id)?'Stevig':progress.skills[s.id].seen?'In opbouw':P.unlocked(progress,s.id)?'Klaar om te ontdekken':'Later in je leerroute';card.innerHTML=`<span class="eyebrow">${String(i+1).padStart(2,'0')} · ${help?'Uitgewerkt voorbeeld':status}</span><h2>${esc(s.short)}</h2><p>${esc(s.concept)}</p><button>${help?'Bekijk het voorbeeld':'Oefen dit onderwerp →'}</button>`;card.querySelector('button').onclick=()=>help?example(s.id):explore(s.id);root.append(card);});
}
function library(){preview=null;$('resume').textContent=task?'Verder oefenen →':'Start oefeningen →';topicCards($('topics'));screen('library')}
function showHelp(){preview=null;topicCards($('helpTopics'),true);screen('help')}
function example(id){
 if(task&&phase==='answer'){dirty=true;errorCode=errorCode||'help';progress.skills[task.skill].repair=errorCode;progress.skills[task.skill].due=progress.total+3;save();}
 preview={task:C.generate(id,{seed:++serial,variant:task?.skill===id?task.variant:0,level:task?.skill===id?task.level:0}),step:0};screen('stage');
}
function showProgress(){previous=document.body.dataset.screen;preview=null;$('progressTitle').textContent=`${progress.xp} XP · ${C.skills.filter(s=>P.mastered(progress,s.id)).length} van ${C.skills.length} stevig`;$('progressRows').innerHTML=C.skills.map(s=>{const d=progress.skills[s.id];return `<div class="progress-row"><div><strong>${esc(s.short)}</strong><small>${d.clean} zelfstandig juist · ${d.seen} geoefend${d.repair?' · herhaling gepland':''}</small></div><span>${P.mastered(progress,s.id)?'★ Stevig':!P.unlocked(progress,s.id)?'Later in de route':d.seen?'In opbouw':'Nieuw'}</span></div>`}).join('');screen('progress')}
function finishSession(){progress.sessions++;$('stats').innerHTML=[[session.answered,'geoefend'],[session.clean,'zelfstandig juist'],[session.xp,'XP verdiend']].map(([n,label])=>`<div><strong>${n}</strong><span>${label}</span></div>`).join('');$('summaryText').textContent='De volgende reeks haalt eerdere begrippen opnieuw op. Nieuwe waarden en andere voorstellingen laten zien wat zelfstandig blijft lukken.';task=null;answer=null;suspendedSeries=null;save();screen('summary')}
AxiomaPlatform.bindTrainer({play:resume,help:showHelp,progress:showProgress});
$('resume').onclick=resume;$('seriesReturn').onclick=followRoute;
$('closeHelp').onclick=()=>{preview=null;task?screen('stage'):start()};$('closeProgress').onclick=()=>previous==='stage'&&!task?showHelp():screen(previous==='progress'?'stage':previous);
$('newSession').onclick=$('again').onclick=start;$('topicsNav').onclick=$('browse').onclick=$('rotateLibrary').onclick=library;
$('theme').onclick=()=>{document.documentElement.dataset.mode=document.documentElement.dataset.mode==='dark'?'light':'dark';save();if(document.body.dataset.screen==='stage')render()};
new ResizeObserver(()=>{if(document.body.dataset.screen==='stage')drawLine()}).observe($('workspace'));
window.addEventListener('pagehide',save);
// Read-only model inspection, useful for reproducible browser checks.
window.AxiomaRealTrainer=Object.freeze({inspect:()=>structuredClone({task,answer,phase,lessonStep,preview,session,progress,topic,dirty,feedback,suspendedSeries})});
if(restore())screen('stage');else start();
})();
