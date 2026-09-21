(function(){
'use strict';
const C=RealNumbersCore,P=C.Progress,L=RealNumbersLessons,$=id=>document.getElementById(id),KEY='axioma-real-numbers-v1';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let progress=P.fresh(),task=null,answer=null,session=null,phase='answer',free=false,dirty=false,errorCode=null,lessonStep=0,feedback=null,preview=null,activeSlot=0,activeGroup='A',serial=Date.now()>>>0,drag=null,previous='stage';
function m(e){const num=n=>`<mn>${esc(C.format(n))}</mn>`;let body='';if(e.kind==='fraction')body=`${e.n<0?'<mo>−</mo>':''}<mfrac>${num(Math.abs(e.n))}${num(e.d)}</mfrac>`;else if(e.kind==='root')body=`${e.sign<0?'<mo>−</mo>':''}<msqrt>${num(e.n)}</msqrt>`;else if(e.kind==='period')body=`${num(e.whole||0)}<mo>,</mo><mn>${esc(e.lead||'')}</mn><mover accent="true"><mn>${esc(e.repeat)}</mn><mo>¯</mo></mover>`;else body=num(e.kind==='decimal'?e.text:e.n)+(e.kind==='percent'?'<mo>%</mo>':'');return `<math xmlns="http://www.w3.org/1998/Math/MathML" aria-label="${esc(C.label(e))}"><mrow>${body}</mrow></math>`}
const rationalMath=r=>m(C.fraction(r.n,r.d));
const intervalText=(lo,hi,cl,ch)=>`${cl?'[':']'}${C.format(lo)}; ${C.format(hi)}${ch?']':'['}`;
function save(){try{AxiomaGame.storage.setItem(KEY,JSON.stringify({progress,mode:document.documentElement.dataset.mode||'light',draft:task?{skill:task.skill,seed:task.seed,variant:task.variant,level:task.level,answer,session,phase,free,dirty,errorCode,lessonStep,feedback,activeSlot,activeGroup}:null}));AxiomaGame.report(C.skills.filter(s=>P.mastered(progress,s.id)).map(s=>s.id),C.skills.length)}catch{$('storageWarning').hidden=false;$('storageWarning').textContent='Bewaren lukt niet. Laat deze pagina open om je werk te behouden.'}}
function restore(){try{
 const raw=JSON.parse(AxiomaGame.storage.getItem(KEY)||'null');progress=P.sanitize(raw?.progress);if(raw?.mode==='dark')document.documentElement.dataset.mode='dark';const d=raw?.draft;if(!d||!C.skills.some(s=>s.id===d.skill))return false;
 task=C.generate(d.skill,{seed:Number(d.seed)>>>0,variant:Math.max(0,Math.floor(Number(d.variant)||0)),level:Math.min(2,Math.max(0,Math.floor(Number(d.level)||0)))});answer=C.freshAnswer(task);const a=d.answer||{};
 answer.values=[0,1].map(i=>typeof a.values?.[i]==='string'?a.values[i].slice(0,8):'');answer.sign=a.sign===-1?-1:1;answer.relation=[-1,0,1].includes(a.relation)?a.relation:null;answer.groups=Array.from({length:6},(_,i)=>['A','B'].includes(a.groups?.[i])?a.groups[i]:null);answer.labels=[...new Set((Array.isArray(a.labels)?a.labels:[]).filter(x=>['N','Z','Q','irr','R'].includes(x)))];answer.tick=Number.isInteger(a.tick)&&a.tick>=0&&a.tick<=32?a.tick:null;answer.closedLo=a.closedLo===true;answer.closedHi=a.closedHi===true;answer.stage=a.stage===1?1:0;
 for(const key of ['start','end'])answer[key]=Number.isInteger(a[key])&&a[key]>=0&&a[key]<(task.digits?.length||0)?a[key]:null;
 phase=['intro','answer','feedback','done'].includes(d.phase)?d.phase:'answer';free=d.free===true;dirty=d.dirty===true;errorCode=typeof d.errorCode==='string'?d.errorCode:null;lessonStep=Math.max(0,Math.min(L.build(task).length-1,Math.floor(Number(d.lessonStep)||0)));
 session={answered:0,clean:0,xp:0};for(const k of ['answered','clean','xp'])session[k]=Math.min(k==='xp'?10000:8,Math.max(0,Number(d.session?.[k])||0));
 feedback=d.feedback&&typeof d.feedback.message==='string'?{...d.feedback,message:d.feedback.message.slice(0,600)}:null;if(phase==='feedback'&&!feedback)phase='answer';if(phase==='done'&&!feedback)feedback={ok:true,message:'Deze oefening is al verwerkt. Je kunt verdergaan.',xp:0};activeSlot=d.activeSlot===1?1:0;activeGroup=d.activeGroup==='B'?'B':'A';return true;
 }catch{return false}}
function screen(name){document.body.dataset.screen=name;document.body.dataset.preview=String(!!preview);for(const id of ['stage','library','help','progress','summary'])$(id).hidden=id!==name;AxiomaPlatform.trainerScreen(({stage:'play',help:'help',progress:'progress'})[name]||'');$('xp').textContent=`${progress.xp} XP`;if(name==='stage')render();}
function makeTask(id,{practice=false}={}){
 preview=null;free=practice;const s=progress.skills[id],level=practice?1:s.seen<2?0:s.seen<5?1:2;
 let candidate;for(let i=0;i<30;i++){candidate=C.generate(id,{seed:++serial,variant:s.seen+(practice?serial%5:0),level});if(!s.signatures.slice(-3).includes(candidate.signature))break}task=candidate;
 answer=C.freshAnswer(task);phase=!practice&&!s.intro?'intro':'answer';lessonStep=0;dirty=false;errorCode=null;feedback=null;activeSlot=0;save();screen('stage');
}
function next(){if(!free&&session.answered>=8){finishSession();return}makeTask(free?task.skill:P.choose(progress),{practice:free})}
function start(){session={answered:0,clean:0,xp:0};free=false;next()}
function button(label,data,extra=''){return `<button ${data} ${extra}>${label}</button>`}
function slot(a,i,label,readonly){return button(`<small>${esc(label)}</small>${esc(a.values[i]||'?')}`,`class="slot" data-slot="${i}" aria-label="${esc(label)}" aria-pressed="${activeSlot===i}"`,readonly?'disabled':'')}
function pad(){return `<div class="keypad" aria-label="Getallen invoeren">${[['7','7'],['8','8'],['9','9'],['back','⌫'],['4','4'],['5','5'],['6','6'],['sign','±'],['1','1'],['2','2'],['3','3'],['next','⇥'],['0','0'],['clear','Wis']].map(([key,label])=>button(label,`data-key="${key}" aria-label="${({back:'Laatste cijfer wissen',sign:'Teken wisselen',next:'Ander invoerveld',clear:'Actief veld wissen'})[key]||label}"`)).join('')}<span class="empty-key"></span></div>`}
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
 }else if(t.skill==='root'){
  const center=a.stage?m(t.source):m(C.integer(t.n));
  canvas=`${t.representation==='area'&&!a.stage?`<svg class="root-area" viewBox="0 0 240 100" role="img" aria-label="Vierkant met oppervlakte ${t.n}, schematisch"><rect x="15" y="8" width="80" height="80" fill="var(--panel)" stroke="currentColor" stroke-width="2"/><text x="55" y="53" text-anchor="middle">${t.n}</text><text x="112" y="37">oppervlakte</text><text x="112" y="63">schematisch</text></svg>`:''}${a.stage?`<div class="saved-step">Vorige stap: ${t.k*t.k} &lt; ${t.n} &lt; ${(t.k+1)**2}</div>`:'<div class="source-caption">Twee opeenvolgende gehele kwadraten</div>'}<div class="formula-row">${slot(a,0,'ondergrens',readonly)}<span>&lt;</span><span class="math-medium">${center}</span><span>&lt;</span>${slot(a,1,'bovengrens',readonly)}</div>${a.stage?'<p class="source-caption">Van kwadraten naar positieve zijden.</p>':''}`;panel=pad();
 }else if(t.skill==='interval'){
  const source=t.sourceMode==='notation'?esc(intervalText(t.lo,t.hi,t.closedLo,t.closedHi)):`Van ${C.format(t.lo)} tot ${C.format(t.hi)}.<br>${C.format(t.lo)} telt ${t.closedLo?'wel':'niet'} mee; ${C.format(t.hi)} telt ${t.closedHi?'wel':'niet'} mee.`;
  canvas=`<div class="interval-source">${source}</div>${svgLine()}`;
  panel=`<div class="interval-controls">${button(`Links ${esc(a.values[0]||'?')}`,`data-slot="0" aria-pressed="${activeSlot===0}"`)}${button(`Rechts ${esc(a.values[1]||'?')}`,`data-slot="1" aria-pressed="${activeSlot===1}"`)}${button(a.closedLo?'● Telt mee':'○ Telt niet mee','data-toggle="closedLo" aria-label="Linkergrens telt '+(a.closedLo?'wel':'niet')+' mee"')}${button(a.closedHi?'● Telt mee':'○ Telt niet mee','data-toggle="closedHi" aria-label="Rechtergrens telt '+(a.closedHi?'wel':'niet')+' mee"')}</div><div class="line-tools">${button('−','data-step="-1" aria-label="Actieve grens één naar links"')}<span class="muted">${activeSlot===0?'Linkergrens':'Rechtergrens'}</span>${button('+','data-step="1" aria-label="Actieve grens één naar rechts"')}</div><p class="muted">Kies een grens, tik de lijn en beslis of het punt meetelt.</p>`;
 }else if(t.skill==='classify'){
  canvas=`<div class="math-large">${m(t.source)}</div><p class="source-caption">Meerdere namen kunnen tegelijk juist zijn.</p>`;
  panel=`<div class="sets">${[['N','ℕ'],['Z','ℤ'],['Q','ℚ'],['irr','irrationaal'],['R','ℝ']].map(([id,name])=>button(name,`data-set="${id}" aria-pressed="${a.labels.includes(id)}"`)).join('')}</div><p class="muted">ℕ bevat hier ook 0.</p>`;
  if(readonly&&a.labels.length)canvas+=`<div class="set-map">${a.labels.map(id=>({N:'ℕ',Z:'ℤ',Q:'ℚ',R:'ℝ',irr:'irrationaal'})[id]).join(' · ')}</div>`;
 }else if(t.skill==='period'){
  canvas=`<p class="rule">${esc(t.rule)}</p><div class="digits"><span class="digits-prefix">${t.whole},</span>${[...t.digits].map((digit,i)=>button(digit,`class="digit ${a.start!==null&&i>=a.start&&i<=(a.end??a.start)?'selected':''}" data-digit="${i}" aria-pressed="${a.start!==null&&i>=a.start&&i<=(a.end??a.start)}" aria-label="Decimaal ${i+1}: ${digit}"`)).join('')}<span>…</span></div><p class="source-caption">${a.start===null?'Tik het eerste en daarna het laatste cijfer van je blok.':a.end===null?'Tik nu het laatste cijfer. Voor één cijfer tik je nogmaals hetzelfde.':`Jouw blok: ${esc(t.digits.slice(a.start,a.end+1))}. Een nieuwe tik begint een andere selectie.`}</p>`;
 }
 return {canvas,panel};
}
function render(){
 if(!task)return;const t=preview?.task||task,isLesson=!!preview||phase==='intro',step=isLesson?L.build(t)[preview?preview.step:lessonStep]:null,a=step?.answer||answer;
 document.body.dataset.preview=String(!!preview);$('xp').textContent=`${progress.xp} XP`;$('xp').title=`${progress.xp} XP totaal · ${session?.xp||0} XP deze reeks`;
 $('eyebrow').textContent=`${preview?'Uitlegcollectie':isLesson?'Nieuw begrip':free?'Vrij oefenen':progress.skills[t.skill].repair?'Opnieuw proberen':'Jouw leerroute'} · ${C.skills.find(s=>s.id===t.skill).short}`;
 $('prompt').textContent=t.skill==='root'&&a.stage===1?'Bouw nu de grenzen voor de wortel.':t.prompt;
 $('round').textContent=free?'Vrij oefenen':`Opgave ${Math.min(8,(session?.answered||0)+(phase==='done'?0:1))} / 8`;
 const feedbackMode=!isLesson&&['feedback','done'].includes(phase);
 $('workspace').className=`${isLesson?'readonly ':''}${feedbackMode?'feedback ':''}${t.skill}`;
 const parts=taskMarkup(t,a,isLesson);
 if(feedbackMode){
  $('workspace').innerHTML=`<div class="feedback-picture" aria-hidden="true">${t.source?m(t.source):t.skill==='compare'?m(t.left):t.skill==='interval'?'○—●':'='}</div><div class="feedback-copy ${feedback.ok?'good':'repair'}" role="status" aria-live="polite"><h2>${feedback.partial?'Waarde juist · vorm nog aanpassen':feedback.ok?(phase==='done'?'Juist!':'Deze stap klopt'):'Bekijk dit verband'}</h2>${phase==='done'?`<strong class="xp-earned">${free?'Vrij oefenen · geen XP':`+${feedback.xp} XP · ${dirty?'met hulp of na verbetering':'zelfstandig opgelost'}`}</strong>`:''}<p>${esc(feedback.message)}</p>${feedback.detail?`<p>${esc(feedback.detail)}</p>`:''}${!feedback.ok?button('Bekijk een voorbeeld','data-example="'+t.skill+'"'):''}</div>`;
 }else{
  $('workspace').innerHTML=`<div class="canvas">${parts.canvas}</div>${isLesson?`<aside class="lesson-copy"><span class="eyebrow">Stap ${(preview?preview.step:lessonStep)+1} van ${L.build(t).length}</span><h2>${esc(step.title)}</h2><p>${esc(step.text)}</p></aside>`:parts.panel?`<aside class="answer-panel">${parts.panel}</aside>`:''}`;
  if(isLesson)$('workspace').querySelectorAll('button').forEach(b=>b.disabled=true);
 }
 $('skip').hidden=isLesson||feedbackMode;$('back').hidden=!isLesson;$('back').disabled=isLesson&&(preview?preview.step:lessonStep)===0;
 $('commit').textContent=isLesson?((preview?preview.step:lessonStep)<L.build(t).length-1?'Volgende stap →':preview?'Terug naar oefening':'Zelf proberen →'):phase==='done'?'Volgende →':phase==='feedback'?(feedback.ok?'Bouw de wortelgrenzen →':'Verbeter je antwoord'):'Controleer';
 $('hint').textContent=isLesson?'Bekijk het voorbeeld op je eigen tempo.':feedbackMode?'Lees rustig. Je kiest zelf wanneer je verdergaat.':free?'Vrij oefenen telt niet mee voor je leerroute.':t.skill==='root'?'Beide stappen samen vormen één opgave.':'Je keuze wordt pas beoordeeld na Controleer.';
 requestAnimationFrame(()=>drawLine(t,a));
}
function drawLine(t=preview?.task||task,a=(preview||phase==='intro')?L.build(t)[preview?preview.step:lessonStep].answer:answer){
 const svg=$('numberline');if(!svg)return;const box=svg.getBoundingClientRect(),w=box.width,h=box.height;if(!w||!h)return;
 const compare=t.skill==='compare',min=compare?Math.floor(Math.min(C.number(C.value(t.left)),C.number(C.value(t.right))))-1:t.min,max=compare?Math.ceil(Math.max(C.number(C.value(t.left)),C.number(C.value(t.right))))+1:t.max,step=t.skill==='line'?C.number(t.step):1;
 const x=v=>28+(v-min)/(max-min)*(w-56),y=Math.max(35,Math.min(h-38,h*.52));let html=`<line class="axis" x1="28" y1="${y}" x2="${w-28}" y2="${y}" stroke-width="2"/>`;
 for(let i=0;i<=Math.round((max-min)/step);i++){const v=min+i*step,px=x(v);html+=`<line class="tick" x1="${px}" y1="${y-5}" x2="${px}" y2="${y+5}"/>`;if(Number.isInteger(v)&&(w>400||v%2===0||v===min||v===max))html+=`<text x="${px}" y="${y+26}" text-anchor="middle">${C.format(v)}</text>`;}
 const marker=(v,closed,label,offset=0)=>{const px=x(v);html+=`<circle cx="${px}" cy="${y}" r="7" fill="${closed?'var(--blue)':'var(--paper)'}" stroke="var(--blue)" stroke-width="3"/>${label?`<text x="${Math.max(35,Math.min(w-35,px))}" y="${y-17-offset}" text-anchor="middle">${esc(label)}</text>`:''}`};
 if(compare){marker(C.number(C.value(t.left)),true,'A',0);marker(C.number(C.value(t.right)),false,'B',18);}
 if(t.skill==='line'&&a.tick!==null){const v=min+a.tick*step;marker(v,true,C.format(Number(v.toFixed(4))));}
 if(t.skill==='interval'){
  const l=C.parse(a.values[0]),r=C.parse(a.values[1]);if(l&&r&&C.compare(l,r)<0)html+=`<line x1="${x(C.number(l))}" x2="${x(C.number(r))}" y1="${y}" y2="${y}" stroke="var(--blue)" stroke-width="7" opacity=".5"/>`;
  if(l)marker(C.number(l),a.closedLo,'L');if(r)marker(C.number(r),a.closedHi,'R');
 }
 svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.innerHTML=html;
 if(preview||phase!=='answer'||!['line','interval'].includes(t.skill))return;
 const place=clientX=>{const r=svg.getBoundingClientRect(),v=min+Math.max(0,Math.min(1,(clientX-r.left-28)/(r.width-56)))*(max-min);if(t.skill==='line')answer.tick=Math.max(0,Math.min(Math.round((max-min)/step),Math.round((v-min)/step)));else answer.values[activeSlot]=String(Math.round(v));drawLine(t,answer)};
 svg.onpointerdown=e=>{if(e.button>0)return;e.preventDefault();drag={answer:structuredClone(answer),id:e.pointerId};svg.setPointerCapture(e.pointerId);place(e.clientX)};
 svg.onpointermove=e=>{if(drag?.id===e.pointerId)place(e.clientX)};
 svg.onpointerup=e=>{if(drag?.id!==e.pointerId)return;drag=null;save();render()};
 svg.onpointercancel=()=>{if(drag){answer=drag.answer;drag=null;save();render()}};
 svg.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();stepValue(e.key==='ArrowLeft'?-1:1)}};
}
function key(k){
 if(phase!=='answer'||preview)return;
 if(k==='next')activeSlot=1-activeSlot;
 else if(k==='sign'){if(task.skill==='fraction')answer.sign*=-1;else answer.values[activeSlot]=answer.values[activeSlot].startsWith('-')?answer.values[activeSlot].slice(1):'-'+answer.values[activeSlot];}
 else if(k==='clear')answer.values[activeSlot]='';else if(k==='back')answer.values[activeSlot]=answer.values[activeSlot].slice(0,-1);else if(/^\d$/.test(k)&&answer.values[activeSlot].replace('-','').length<6)answer.values[activeSlot]+=k;
 save();render();
}
function stepValue(d){if(preview||phase!=='answer')return;if(task.skill==='line')answer.tick=Math.max(0,Math.min(Math.round((task.max-task.min)/C.number(task.step)),(answer.tick??Math.round(-task.min/C.number(task.step)))+d));else if(task.skill==='interval')answer.values[activeSlot]=String(Math.max(task.min,Math.min(task.max,(Number(answer.values[activeSlot])||0)+d)));save();render()}
$('workspace').onclick=e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
 if(d.example){example(d.example);return}if(preview||phase!=='answer')return;
 if(d.key){key(d.key);return}if(d.slot!==undefined)activeSlot=Number(d.slot);
 if(d.relation!==undefined)answer.relation=Number(d.relation);
 if(d.selectGroup)activeGroup=d.selectGroup;
 if(d.token!==undefined){const i=Number(d.token);answer.groups[i]=answer.groups[i]===activeGroup?null:activeGroup;}
 if(d.set)answer.labels=answer.labels.includes(d.set)?answer.labels.filter(x=>x!==d.set):[...answer.labels,d.set];
 if(d.toggle)answer[d.toggle]=!answer[d.toggle];
 if(d.digit!==undefined){const i=Number(d.digit);if(answer.start===null||answer.end!==null){answer.start=i;answer.end=null}else{answer.end=Math.max(i,answer.start);answer.start=Math.min(i,answer.start)}}
 if(d.step){stepValue(Number(d.step));return}save();render();
};
document.addEventListener('keydown',e=>{if(document.body.dataset.screen!=='stage'||preview||phase!=='answer'||!['fraction','root'].includes(task.skill)||e.ctrlKey||e.metaKey||e.altKey)return;if(/^\d$/.test(e.key)){e.preventDefault();key(e.key)}else if(['Backspace','-'].includes(e.key)){e.preventDefault();key(e.key==='-'?'sign':'back')}});
function commit(){
 if(preview){if(preview.step<L.build(preview.task).length-1){preview.step++;render()}else{preview=null;screen('stage')}return;}
 if(phase==='intro'){
  if(lessonStep<L.build(task).length-1){lessonStep++;save();render();return}
  progress.skills[task.skill].intro=true;makeTask(task.skill);return;
 }
 if(phase==='done'){next();return}
 if(phase==='feedback'){if(feedback.ok&&task.skill==='root'){answer.stage=1;answer.values=['',''];activeSlot=0;}phase='answer';feedback=null;save();render();return}
 const r=C.validate(task,answer);feedback=r;
 if(!r.ok){if(!r.input){dirty=true;errorCode=r.code;}phase='feedback';save();render();return}
 if(task.skill==='root'&&answer.stage===0){phase='feedback';save();render();return}
 phase='done';let xp=0;if(!free){xp=P.record(progress,task,{clean:!dirty,solved:true,code:errorCode||'practice'});session.answered++;session.xp+=xp;if(!dirty)session.clean++;}feedback={...r,xp};save();render();
}
$('commit').onclick=commit;$('back').onclick=()=>{if(preview)preview.step=Math.max(0,preview.step-1);else lessonStep=Math.max(0,lessonStep-1);save();render()};
$('skip').onclick=()=>{if(preview||phase!=='answer')return;if(!free){P.record(progress,task,{clean:false,solved:false,code:errorCode||'practice'});session.answered++;}next()};
function topicCards(root,help=false){
 root.replaceChildren();C.skills.forEach((s,i)=>{const card=document.createElement('article');card.className='topic-card'+(P.mastered(progress,s.id)?' solid':'');const status=P.mastered(progress,s.id)?'Stevig':progress.skills[s.id].seen?'In opbouw':P.unlocked(progress,s.id)?'Klaar om te ontdekken':'Later in je leerroute';card.innerHTML=`<span class="eyebrow">${String(i+1).padStart(2,'0')} · ${help?'Uitgewerkt voorbeeld':status}</span><h2>${esc(s.short)}</h2><p>${esc(s.concept)}</p><button>${help?'Bekijk het voorbeeld':'Vrij oefenen →'}</button>`;card.querySelector('button').onclick=()=>help?example(s.id):(session=null,makeTask(s.id,{practice:true}));root.append(card);});
}
function library(){preview=null;topicCards($('topics'));screen('library')}
function showHelp(){preview=null;topicCards($('helpTopics'),true);screen('help')}
function example(id){
 if(task&&phase==='answer'&&!free){dirty=true;errorCode=errorCode||'help';save();}
 preview={task:C.generate(id,{seed:++serial,variant:task?.skill===id?task.variant:0,level:task?.skill===id?task.level:0}),step:0};screen('stage');
}
function showProgress(){previous=document.body.dataset.screen;preview=null;$('progressTitle').textContent=`${progress.xp} XP · ${C.skills.filter(s=>P.mastered(progress,s.id)).length} van 8 stevig`;$('progressRows').innerHTML=C.skills.map(s=>{const d=progress.skills[s.id];return `<div class="progress-row"><div><strong>${esc(s.short)}</strong><small>${d.clean} zelfstandig juist · ${d.seen} geoefend${d.repair?' · herhaling gepland':''}</small></div><span>${P.mastered(progress,s.id)?'★ Stevig':!P.unlocked(progress,s.id)?'Later in de route':d.seen?'In opbouw':'Nieuw'}</span></div>`}).join('');screen('progress')}
function finishSession(){progress.sessions++;$('stats').innerHTML=[[session.answered,'geoefend'],[session.clean,'zelfstandig juist'],[session.xp,'XP verdiend']].map(([n,label])=>`<div><strong>${n}</strong><span>${label}</span></div>`).join('');$('summaryText').textContent='De volgende reeks haalt eerdere begrippen opnieuw op. Nieuwe waarden en andere voorstellingen laten zien wat zelfstandig blijft lukken.';task=null;answer=null;save();screen('summary')}
AxiomaPlatform.bindTrainer({play:()=>{preview=null;task?screen('stage'):start()},help:showHelp,progress:showProgress});
$('resume').onclick=$('closeHelp').onclick=()=>{preview=null;task?screen('stage'):start()};$('closeProgress').onclick=()=>screen(previous==='progress'?'stage':previous);
$('newSession').onclick=$('again').onclick=start;$('browse').onclick=$('rotateLibrary').onclick=library;
$('theme').onclick=()=>{document.documentElement.dataset.mode=document.documentElement.dataset.mode==='dark'?'light':'dark';save();if(document.body.dataset.screen==='stage')render()};
new ResizeObserver(()=>{if(document.body.dataset.screen==='stage')drawLine()}).observe($('workspace'));
window.addEventListener('pagehide',save);
// Read-only model inspection, useful for reproducible browser checks.
window.AxiomaRealTrainer=Object.freeze({inspect:()=>structuredClone({task,answer,phase,lessonStep,preview,session,progress,free,dirty,feedback})});
if(restore())screen('stage');else start();
})();
