/* Central assignments own enrollment and results; native boards own answer controls. */
(async()=>{
'use strict';
const $=id=>document.getElementById(id),main=$('main'),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const catalog=window.LeraarBobTaskCatalog,names=Object.fromEntries(Object.entries(catalog).map(([id,p])=>[id,p.name]));
const pointsRule=kind=>catalog[kind]?.rule||'1 punt per juist antwoord',questionPart=kind=>!!catalog[kind]?.board;
const skillName=(kind,id)=>catalog[kind]?.skills?.find(s=>s.id===id)?.label||id;
let account=null,accountReady=false,epoch=0,detail=null,active=null,students=[],queue=Promise.resolve(),glassTimer,draftTimer,answerPending=null,glassQueue=Promise.resolve();
const frames=new Map(),teacher=()=>account?.role==='teacher',notice=e=>$('notice').textContent=e?.message||e||'',status=s=>({draft:'Concept',published:'Uitgedeeld',closed:'Gesloten',working:'Nog bezig',submitted:'Ingediend',reviewed:'Beoordeeld'})[s]||s;
const basePart=kind=>({kind,points:kind==='glass'?12:10,instructions:'',...(questionPart(kind)?{count:10,skills:catalog[kind].skills.map(s=>s.id)}:{}),...(kind==='clay'?{count:10,speed:5}:{}),...(kind==='systems'?{count:3,points:3,method:'choice',studyMode:'expert'}:{}),...(kind==='numbers'?{level:1}:{}),...(kind==='algebra'?{negative:false,fractions:false,decimals:false}:{})});

function request(action,data={},edge=false){
 const owner=account?.id,version=epoch;
 const job=queue.catch(()=>{}).then(async()=>{
  if(!owner||version!==epoch||account?.id!==owner)throw Error('Je account is gewijzigd.');
  if(typeof data==='function')data=data();const client=AxiomaAuth.client(),controller=new AbortController();let timer;
  const operation=edge?client.functions.invoke('task-activity',{body:{action,data},signal:controller.signal}):client.rpc('axioma_os_tasks',{p_action:action,p_data:data});
  if(!edge)operation.abortSignal?.(controller.signal);
  let response;try{response=await Promise.race([operation,new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Bewaren duurt te lang. Controleer je verbinding en probeer opnieuw.'));},20000);})]);}finally{clearTimeout(timer);}
  if(version!==epoch||account?.id!==owner)throw Error('Je account is gewijzigd.');
  if(response.error){let body;try{body=await response.error.context?.json();}catch{}const e=Error(body?.error||response.error.message||'Verbinding onderbroken. Probeer opnieuw.');e.definitive=!/fetch|network|aborted|timeout/i.test(e.message);throw e;}if(response.data?.error)throw Error(response.data.error);
  // Advance revisions inside the queue, before another save can read them.
  if(response.data?.work&&response.data.task?.id===detail?.task.id)detail=response.data;return response.data;
 });queue=job;return job;
}
function button(label,run,primary=false){const b=document.createElement('button');b.type='button';b.textContent=label;b.className=primary?'primary':'';b.onclick=async()=>{b.disabled=true;notice('');try{await run();}catch(e){notice(e);}finally{b.disabled=false;}};return b;}
function actions(...buttons){const n=document.createElement('div');n.className='actions';n.append(...buttons);return n;}
function normal(){main.hidden=false;$('workspace').hidden=true;notice('');}
async function list(){normal();active=null;detail=null;const {tasks}=await request('list');main.innerHTML=`<p class="eyebrow">Mijn taken</p><h1>${teacher()?'Opdrachten en toetsen':'Jouw opdrachten'}</h1><p>${teacher()?'Combineer werelden, oefeningen en spellen in één opdracht.':'Werk per onderdeel. Je werk blijft bewaard; je kunt ook gedeeltelijk werk definitief indienen.'}</p>`;
 main.append(actions(...(teacher()?[button('Nieuwe toets',()=>edit({id:crypto.randomUUID(),title:'Nieuwe opdracht',instructions:'',parts:[]}),true)]:[]),button('Vernieuwen',list)));
 const cards=document.createElement('div');cards.className='cards';for(const t of tasks){const card=document.createElement('article');card.className='card';card.innerHTML=`<p class="status">${esc(status(t.work_status||t.status))}</p><h2>${esc(t.title)}</h2><p>${t.parts.map(p=>esc(names[p.kind])).join(' · ')}</p><p class="muted">1 punt per correcte lijn, geraakt doel of juist antwoord${teacher()?` · ${t.submitted}/${t.assigned} ingediend`:''}</p>`;card.append(button('Openen',()=>open(t.id),true));cards.append(card);}if(!tasks.length)cards.textContent=teacher()?'Maak je eerste samengestelde opdracht.':'Je leerkracht heeft nog geen opdracht aan jou toegewezen.';main.append(cards);
}
async function open(id){normal();active=null;detail=await request('get',{id});renderDetail();}
function renderDetail(){const {task,work,submissions=[]}=detail;normal();main.innerHTML=`<p class="eyebrow">${esc(status(task.status))}</p><h1>${esc(task.title)}</h1><p>${esc(task.instructions)}</p>`;main.append(actions(button('← Alle opdrachten',list),button('Vernieuwen',()=>open(task.id))));
 if(teacher()&&task.status==='draft'){main.append(actions(button('Bewerken',()=>edit(task),true),button('Leerlingen kiezen en uitdelen',publish)));return;}
 if(teacher()){main.append(actions(button('Resultaten downloaden',()=>exportCSV(submissions)),...(task.status==='published'?[button('Opdracht sluiten',async()=>{if(confirm('Sluiten? Leerlingen kunnen daarna geen werk meer indienen.')){detail=await request('close',{id:task.id});renderDetail();}})]:[])));const wrap=document.createElement('div');wrap.className='table-wrap';wrap.innerHTML=`<table><thead><tr><th>Leerling</th><th>Klas</th><th>Status</th><th>Punten</th><th>Werk</th></tr></thead><tbody>${submissions.map((w,i)=>`<tr><td>${esc(w.alias)}</td><td>${esc(w.class_code)}</td><td>${esc(status(w.status))}</td><td>${w.grades?w.grades.reduce((s,v)=>s+v,0):'—'}</td><td><button data-review="${i}">Bekijken</button></td></tr>`).join('')}</tbody></table>`;wrap.querySelectorAll('[data-review]').forEach(b=>b.onclick=()=>review(submissions[Number(b.dataset.review)]));main.append(wrap);return;}
 if(['submitted','reviewed'].includes(work.status)){
  main.insertAdjacentHTML('beforeend','<p class="note">Je opdracht is ingediend. Je punten en je ingeleverde werk blijven hier beschikbaar.</p>');renderResult(work);
 }
 renderParts(work);
 if(work.status==='working'&&task.status==='published'){
  main.append(actions(button('Definitief indienen',async()=>{
   if(!confirm('Definitief indienen? Ook onvolledig werk telt mee. Je krijgt één punt per correcte lijn, juist geraakt doel en juist antwoord. Daarna kun je dit werk niet meer wijzigen.'))return;
   await flush();detail=await request('submit',{id:task.id});renderDetail();
   try{await downloadPDF(detail.work);}catch(e){notice('Je opdracht is ingediend. Gebruik PDF met scores downloaden om je overzicht opnieuw te downloaden.');}
  },true)));
  main.insertAdjacentHTML('beforeend','<p class="muted">Ook onvolledig werk mag je indienen. Wat je nog niet hebt gedaan, levert geen punten op.</p>');
 }else if(['submitted','reviewed'].includes(work.status)){
  if(work.feedback)main.insertAdjacentHTML('beforeend',`<p class="note">${esc(work.feedback)}</p>`);
 }else main.insertAdjacentHTML('beforeend','<p class="note">Deze opdracht is gesloten.</p>');
}
function renderResult(work){
 const r=work.result;if(!r)return;
 const panel=document.createElement('section');panel.className='panel score-report';panel.innerHTML=`<h2>Jouw punten</h2><p class="result">${r.total} / ${r.maximum} punten</p><div class="table-wrap"><table><thead><tr><th>Onderdeel</th><th>Punten</th><th>Ingeleverd</th></tr></thead><tbody>${r.parts.map(p=>`<tr><td>${esc(names[p.kind])}${p.label?` · ${esc(p.label)}`:''}</td><td>${p.score} / ${p.maximum}</td><td>${p.done?'Afgerond':'Gedeeltelijk of niet gemaakt'}</td></tr>`).join('')}</tbody></table></div><p>Elk juist item is één punt. Niet gemaakt, fout of te laat is nul punten.</p>`;
 panel.append(button('PDF met scores downloaden',()=>downloadPDF(work),true));main.append(panel);
}
async function downloadPDF(work){
 const blob=await LeraarBobTaskReport.create(detail.task,work),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=LeraarBobTaskReport.filename(detail.task,work);a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
}

function glassLineCount(d){return d?.mode==='restore'?(d.drafts?.[d.pattern]?.count||0):(d?.free?.lines?.length||0);}
function renderParts(work){const cards=document.createElement('div');cards.className='cards';detail.task.parts.forEach((p,i)=>{const v=work.parts[i]||{},card=document.createElement('article');card.className='card';card.innerHTML=`<p class="eyebrow">Onderdeel ${i+1} · ${pointsRule(p.kind)}</p><h2>${esc(names[p.kind])}</h2><p>${esc(p.instructions||({glass:'Ontwerp één raam met rechten en kleur.',clay:`${p.count} doelen · ${p.speed} seconden per doel. Een gestart doel blijft op tijd lopen.`,rights:`${p.count} vragen uit je trainer`})[p.kind]||`${p.count} ${p.kind==='rootsbuild'?'bouwopgaven':'vragen'} uit ${names[p.kind]}`)}</p><p class="status">${v.done?'Afgerond':work.status!=='working'?((v.saved_lines||glassLineCount(v.draft)||v.answers?.length)?'Gedeeltelijk ingeleverd':'Niet gemaakt'):v.answers?`${v.answers.length} / ${p.count} bewaard`:v.draft?(p.kind==='glass'?`${v.saved_lines??glassLineCount(v.draft)} lijnen bewaard · nog bezig`:'Tussenwerk bewaard'):'Nog te doen'}</p>`;
 const readOnly=teacher()||work.status!=='working'||detail.task.status!=='published';card.append(button(readOnly?'Bekijk werk':v.done?'Bekijk onderdeel':'Open onderdeel',()=>openPart(i,work,readOnly),true));cards.append(card);});main.append(cards);}
function edit(task){
 normal();const parts=structuredClone(task.parts);main.innerHTML=`<p class="eyebrow">Concept · nog niet uitgedeeld</p><h1>Stel je opdracht samen</h1><form id="editor"><div class="fields"><label>Titel<input id="title" maxlength="120" required value="${esc(task.title)}"></label><label>Instructies<textarea id="instructions" maxlength="3000">${esc(task.instructions)}</textarea></label></div><div id="partEditors"></div></form><section class="panel"><h2>Onderdeel toevoegen</h2><p>Kies een wereld. Je bepaalt daarna de vraagtypes en de lengte van de reeks.</p><div id="addParts" class="add-parts"></div></section>`;
 function read(){return [...document.querySelectorAll('[data-part-editor]')].map((node,i)=>{const p=parts[i],value=name=>node.querySelector(`[name="${name}"]`)?.value;return {...p,instructions:value('partInstructions'),...(p.kind==='glass'?{}:{count:Number(value('count')),points:Number(value('count'))}),...(questionPart(p.kind)?{skills:[...node.querySelectorAll('[name=skill]:checked')].map(x=>x.value)}:{}),...(p.kind==='clay'?{speed:Number(value('speed'))}:{}),...(p.kind==='systems'?{method:value('method'),studyMode:value('studyMode')}:{}),...(p.kind==='numbers'?{level:Number(value('level'))}:{}),...(p.kind==='algebra'?Object.fromEntries(['negative','fractions','decimals'].map(k=>[k,node.querySelector(`[name=${k}]`).checked])):{})};});}
 const select=(name,label,choices,value)=>`<label>${label}<select name="${name}">${Object.entries(choices).map(([id,text])=>`<option value="${id}" ${String(value)===id?'selected':''}>${text}</option>`).join('')}</select></label>`;
 function draw(){
  const host=$('partEditors');host.innerHTML=parts.length?parts.map((p,i)=>`<fieldset data-part-editor="${i}"><legend>${i+1}. ${names[p.kind]}</legend><div class="fields"><p class="note">${pointsRule(p.kind)}.${p.kind==='glass'?' Kies een raam of ontwerp zelf maximaal twaalf lijnen.':''}</p>${p.kind!=='glass'?`<label>Aantal ${p.kind==='clay'?'doelen':p.kind==='rootsbuild'?'bouwopgaven':'vragen'}<input name="count" type="number" min="1" max="${p.kind==='systems'?14:30}" value="${p.count}" required></label>`:''}${p.kind==='clay'?select('speed','Tijd per doel',{3:'3 seconden',5:'5 seconden',8:'8 seconden'},p.speed):''}${p.kind==='numbers'?select('level','Moeilijkheid',{0:'Instap',1:'Oefenen',2:'Uitdaging'},p.level??1):''}${p.kind==='systems'?select('method','Oplossingsmethode',{choice:'Leerling kiest',graphic:'Grafisch',substitution:'Substitutie',combination:'Combinatie'},p.method||'choice')+select('studyMode','Ondersteuning',{expert:'Expert · zelf uitwerken',beginner:'Beginner · begeleide stappen'},p.studyMode||'expert'):''}<label>Instructies voor dit onderdeel<textarea name="partInstructions" maxlength="2000">${esc(p.instructions)}</textarea></label></div>${p.kind==='algebra'?'<div class="choices">'+[['negative','Negatieve getallen'],['fractions','Breuken'],['decimals','Kommagetallen']].map(([id,label])=>`<label class="choice"><input type="checkbox" name="${id}" ${p[id]?'checked':''}>${label}</label>`).join('')+'</div>':''}${questionPart(p.kind)?`<details class="skill-picker"><summary>Vraagtypes kiezen · ${p.skills.length} geselecteerd</summary><p class="muted">Combineer meerdere types voor een mix.${p.kind==='systems'?' Elk gekozen stelsel komt hoogstens één keer voor.':' Bij een korte reeks komt niet elk geselecteerd type aan bod.'}</p>${catalog[p.kind].worlds.map(w=>`<section><h3>${esc(w.name)}</h3><div class="choices">${w.skills.map(id=>`<label class="choice"><input name="skill" type="checkbox" value="${id}" ${p.skills.includes(id)?'checked':''}>${esc(skillName(p.kind,id))}</label>`).join('')}</div></section>`).join('')}</details>`:''}<div class="actions"><button type="button" data-up="${i}" ${!i?'disabled':''}>Omhoog</button><button type="button" data-down="${i}" ${i===parts.length-1?'disabled':''}>Omlaag</button><button type="button" data-remove="${i}">Verwijderen</button></div></fieldset>`).join(''):'<p class="note">Voeg hieronder je eerste onderdeel toe.</p>';
  host.querySelectorAll('[data-up],[data-down],[data-remove]').forEach(b=>b.onclick=()=>{parts.splice(0,parts.length,...read());if(b.hasAttribute('data-remove'))parts.splice(Number(b.dataset.remove),1);else{const i=Number(b.dataset.up??b.dataset.down),j=i+(b.hasAttribute('data-up')?-1:1);[parts[i],parts[j]]=[parts[j],parts[i]];}draw();});
  host.querySelectorAll('[name=skill]').forEach(n=>n.onchange=()=>{const field=n.closest('fieldset'),count=field.querySelectorAll('[name=skill]:checked').length;field.querySelector('summary').textContent=`Vraagtypes kiezen · ${count} geselecteerd`;});
 }
 draw();for(const [kind,p]of Object.entries(catalog)){const b=button('+ '+p.name,()=>{if(parts.length>=12)throw Error('Maximaal twaalf onderdelen.');parts.splice(0,parts.length,...read(),basePart(kind));draw();const field=$('partEditors').lastElementChild;field.scrollIntoView({block:'nearest'});});const small=document.createElement('small');small.textContent=p.type+' · '+p.theme;b.append(small);b.dataset.addPart=kind;$('addParts').append(b);}
 main.append(actions(button('Concept bewaren',async()=>{if(!$('editor').reportValidity())return;const config=read();if(!config.length)throw Error('Voeg minstens één onderdeel toe.');if(config.some(p=>questionPart(p.kind)&&!p.skills.length))throw Error('Kies per onderdeel minstens één vraagtype.');if(config.some(p=>p.kind==='systems'&&p.count>p.skills.length))throw Error('Kies minstens evenveel stelsels als het aantal vragen.');detail=await request(task.status?'update':'create',{id:task.id,revision:task.revision,title:$('title').value,instructions:$('instructions').value,parts:config});renderDetail();},true),button('Annuleren',list)));
}

async function publish(){students=(await request('students')).students;normal();main.innerHTML='<h1>Leerlingen kiezen</h1><p>Na uitdelen staan de onderdelen en punten vast. Nieuwe wijzigingen horen bij een nieuwe toets.</p><label>Klas<select id="classFilter"><option value="">Alle klassen</option>'+[...new Set(students.map(s=>s.class_code||''))].map(c=>`<option>${esc(c)}</option>`).join('')+'</select></label><div id="studentChoices" class="choices"></div>';
 function draw(){const cls=$('classFilter').value;$('studentChoices').innerHTML=students.filter(s=>!cls||s.class_code===cls).map(s=>`<label class="choice"><input type="checkbox" name="student" value="${s.id}">${esc(s.alias)} · ${esc(s.class_code)}</label>`).join('');}draw();$('classFilter').onchange=draw;
 main.append(actions(button('Selecteer deze klas',()=>document.querySelectorAll('[name=student]').forEach(n=>n.checked=true)),button('Uitdelen',async()=>{const ids=[...document.querySelectorAll('[name=student]:checked')].map(n=>n.value);if(!ids.length)throw Error('Kies leerlingen.');detail=await request('publish',{id:detail.task.id,revision:detail.task.revision,students:ids});renderDetail();},true),button('Terug',renderDetail)));
}
function review(work){normal();main.innerHTML=`<p class="eyebrow">${esc(detail.task.title)}</p><h1>${esc(work.alias)}</h1><p>${esc(work.class_code)} · ${status(work.status)}</p>`;main.append(actions(button('← Resultaten',renderDetail)));renderParts(work);if(!['submitted','reviewed'].includes(work.status))return;renderResult(work);
 const form=document.createElement('form');form.id='grading';form.className='panel';form.innerHTML=`<h2>Beoordeling</h2><div class="fields">${detail.task.parts.map((p,i)=>{const answers=work.parts[i]?.answers||[],correct=answers.filter(a=>a.correct).length;return `<label>${esc(names[p.kind])} · / ${work.result?.parts[i].maximum??p.points}<input name="grade" type="number" min="0" max="${work.result?.parts[i].maximum??p.points}" ${work.result?'readonly':''} step="0.1" value="${work.grades?.[i]??(p.kind==='glass'?'':Math.round(correct/p.count*p.points*10)/10)}" required>${work.result?`<small>${pointsRule(p.kind)} · automatisch geteld</small>`:p.kind==='glass'?'<small>Beoordeel het ontwerp hierboven.</small>':`<small>${correct}/${p.count} juist · door de server gecontroleerd</small>`}</label>`;}).join('')}</div><label>Feedback<textarea id="feedback" maxlength="3000">${esc(work.feedback)}</textarea></label>`;main.append(form,actions(button('Beoordeling bewaren en delen',async()=>{if(!form.reportValidity())return;await request('review',{id:detail.task.id,student:work.user_id,revision:work.revision,grades:[...form.querySelectorAll('[name=grade]')].map(n=>Number(n.value)),feedback:$('feedback').value});await open(detail.task.id);},true)));
}
function exportCSV(rows){const cell=v=>'"'+String(v??'').replace(/^[=+\-@\t\r]/,"'$&").replaceAll('"','""')+'"';const lines=[['Leerling','Klas','Status',...detail.task.parts.map((p,i)=>`${i+1}. ${names[p.kind]} (punten)`),'Totaal','Feedback'],...rows.map(w=>[w.alias,w.class_code,status(w.status),...detail.task.parts.map((_,i)=>w.grades?.[i]??''),w.grades?.reduce((a,b)=>a+b,0)??'',w.feedback])];const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+lines.map(r=>r.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));a.download='toetsresultaten.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function frame(kind,key,url){let entry=frames.get(key);if(!entry){const node=document.createElement('iframe');node.title=names[kind];node.src=url;node.setAttribute('allow','fullscreen');$('boards').append(node);entry={node,ready:new Promise(resolve=>node.addEventListener('load',()=>resolve(node),{once:true}))};frames.set(key,entry);}for(const v of frames.values())v.node.hidden=v!==entry;return entry;}
function saveGlass(done=false){
 clearTimeout(glassTimer);if(active?.kind!=='glass'||active.readOnly)return Promise.resolve();
 const a=active,id=detail.task.id,draft=a.frame.contentWindow.GlasatelierTask.snapshot();
 const job=glassQueue.catch(()=>{}).then(async()=>{
  if(active!==a)return;
  $('saveState').textContent='Bewaren…';
  async function persist(packet){a.pendingSave=packet;const next=await request('glass_save',packet);if(active!==a)return;detail=next;a.work=next.work;a.pendingSave=null;}
  try{
   if(a.pendingSave)await persist(a.pendingSave);
   await persist({id,part:a.index,revision:detail.work.revision,draft,done,event:crypto.randomUUID()});
   if(active!==a)return;$('saveState').textContent=done?'Raam bewaard · afgerond':'Bewaard';$('retryAnswer').hidden=true;
  }catch(e){if(e.definitive)a.pendingSave=null;if(active===a){$('saveState').textContent='Niet bewaard · probeer opnieuw';$('retryAnswer').hidden=false;}throw e;}
 });glassQueue=job;return job;
}

async function openPart(index,work,readOnly=false){
 $('boards').classList.remove('review-board');$('partResult')?.setAttribute('hidden','');const p=detail.task.parts[index];active={...p,index,work,readOnly};const a=active;main.hidden=true;$('workspace').hidden=false;$('partTitle').textContent=names[p.kind];$('saveState').textContent=readOnly?'Alleen bekijken':'';$('nextQuestion').hidden=true;$('retryAnswer').hidden=true;$('finishGlass').hidden=p.kind!=='glass'||readOnly;
 const key=[detail.task.id,work.user_id,index].join(':');
 if(p.kind==='glass'){
  const e=frame(p.kind,key,'../games/rechten/rechtenwereld/glasatelier.html?task=1');a.frame=e.node;await e.ready;if(active!==a)return;const win=e.node.contentWindow,doc=e.node.contentDocument;
  if(!e.initialized){doc.querySelector('#atelier-header').hidden=true;win.GlasatelierTask.load(work.parts[index]?.draft);e.initialized=true;win.addEventListener('glasatelier:change',()=>{if(active?.frame!==e.node||active.readOnly)return;clearTimeout(glassTimer);$('saveState').textContent='Nog niet bewaard';glassTimer=setTimeout(()=>saveGlass().catch(notice),600);});}
  if(e.workRevision!==work.revision||readOnly)win.GlasatelierTask.load(work.parts[index]?.draft,readOnly);e.workRevision=work.revision;return;
 }
 if(readOnly||work.parts[index]?.done){await showAnswers(a,key);return;}
 $('partResult')?.setAttribute('hidden','');
 if(questionPart(p.kind)){const e=frame(p.kind,key,catalog[p.kind].board+'?mode=task');a.frame=e.node;a.frame.setAttribute('aria-busy','true');a.frame.inert=true;await e.ready;await question();}
 if(p.kind==='clay'){
  detail=await request('clay_start',{id:detail.task.id,part:index});a.work=detail.work;const e=frame(p.kind,key,'../games/rechten/kleiduiven/?task=1');a.frame=e.node;await e.ready;if(active===a)e.node.contentWindow.AxiomaGroups.resume(LeraarBobTasks.clayState());
 }
}
async function showAnswers(a,key){
 a.readOnly=true;for(const v of frames.values())v.node.hidden=true;
 let result=$('partResult');if(!result){result=document.createElement('section');result.id='partResult';$('boards').append(result);}result.hidden=false;result.className='answer-review';
 const saved=a.work.parts[a.index]||{},answers=saved.answers||[],scored=teacher()||a.work.status!=='working';
 result.innerHTML=`<h2>${names[a.kind]} · ${answers.length} antwoorden bewaard</h2><p>${scored?`${answers.filter(x=>x.correct).length} juist`:'Je leerkracht ontvangt je antwoorden.'}</p>`;
 if(!answers.length)return;
 if(a.kind==='clay'){
  const fmt=v=>v===null||v===undefined?'Geen antwoord':String(v).replace('.',',').replace('-','−');
  result.innerHTML+=`<div class="table-wrap"><table><thead><tr><th>Doel</th>${scored?'<th>Richting</th>':''}<th>Jouw antwoord</th>${scored?'<th>Resultaat</th>':''}</tr></thead><tbody>${answers.map((x,i)=>{const q=AxiomaClayQuestions.question(saved.seed_id,i);return `<tr><td>${i+1}</td>${scored?`<td>a = ${AxiomaClayQuestions.label(q)}</td>`:''}<td>${fmt(x.answer)}</td>${scored?`<td>${x.correct?'Juist':'Onjuist of te laat'}</td>`:''}</tr>`;}).join('')}</tbody></table></div>`;return;
 }
 $('boards').classList.add('review-board');result.innerHTML+=`<label>Vraag<select id="reviewQuestion">${answers.map((x,i)=>`<option value="${i}">${i+1}. ${esc(skillName(a.kind,x.spec.skill))}${scored?' · '+(x.correct?'juist':'onjuist'):''}</option>`).join('')}</select></label>`;
 const e=frame(a.kind,key+':review',catalog[a.kind].board+'?mode=task&review=1');a.frame=e.node;await e.ready;if(active!==a)return;
 const show=()=>{const x=answers[Number($('reviewQuestion').value)];e.node.contentWindow.postMessage({type:'vector-battle-question',...x.spec},location.origin);e.node.contentWindow.postMessage({type:'rechten-learn-sync',...x.spec,answer:x.answer,readOnly:true},location.origin);};$('reviewQuestion').onchange=show;show();
}
async function question(){if(!questionPart(active?.kind))return;const a=active;a.frame.inert=true;a.frame.setAttribute('aria-busy','true');$('saveState').textContent='Vraag ophalen…';const q=await request('question',{id:detail.task.id,part:a.index},true);if(a!==active)return;a.spec=q.spec;a.latestDraft=null;$('partTitle').textContent=`${names[a.kind]} · ${q.spec.index+1}/${a.count}`;a.frame.contentWindow.postMessage({type:'vector-battle-question',...q.spec},location.origin);const draft=q.draft;if(draft)a.frame.contentWindow.postMessage({type:'rechten-learn-sync',...q.spec,answer:draft,readOnly:false},location.origin);$('nextQuestion').hidden=true;await new Promise(resolve=>a.frame.contentWindow.requestAnimationFrame(()=>a.frame.contentWindow.requestAnimationFrame(resolve)));if(active===a){a.frame.inert=false;a.frame.setAttribute('aria-busy','false');$('saveState').textContent=draft?'Bewaard':'';}}
async function sendAnswer(){if(!answerPending)return;const packet=answerPending,a=active;$('saveState').textContent='Antwoord bewaren…';try{const next=await request('answer',packet,true);if(active!==a)return;detail=next;answerPending=null;$('retryAnswer').hidden=true;$('saveState').textContent='Antwoord bewaard';$('nextQuestion').textContent=next.work.parts[active.index].done?'Onderdeel klaar →':'Volgende vraag →';$('nextQuestion').hidden=false;}catch(e){$('retryAnswer').hidden=false;notice(e);}}
addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==active?.frame?.contentWindow||active.readOnly||!questionPart(active.kind))return;const d=e.data;if(d?.type==='vector-battle-answer'&&d.match===active.spec?.match&&d.index===active.spec.index&&!answerPending){clearTimeout(draftTimer);answerPending={id:detail.task.id,part:active.index,index:d.index,event:crypto.randomUUID(),answer:d.skipped?{}:d.answer};sendAnswer();}
 if(d?.type==='rechten-learn-draft'&&d.match===active.spec?.match&&d.index===active.spec?.index){active.latestDraft=d.answer;$('saveState').textContent='Nog niet bewaard';clearTimeout(draftTimer);const owner=active,id=detail.task.id,part=active.index;draftTimer=setTimeout(async()=>{try{const x=await request('activity_draft',{id,part,index:d.index,draft:d.answer});if(detail?.task.id===id)detail=x;if(active===owner&&active.latestDraft===d.answer)$('saveState').textContent='Bewaard';}catch(e){if(active===owner)$('saveState').textContent='Niet bewaard';notice(e);}},500);}
});
$('finishGlass').onclick=async()=>{const b=$('finishGlass');b.disabled=true;try{await saveGlass(true);renderDetail();active=null;notice('Je raam is bewaard en het onderdeel is afgerond.');}catch(e){notice(e);}finally{b.disabled=false;}};
$('nextQuestion').onclick=()=>detail.work.parts[active.index].done?(renderDetail(),active=null):question().catch(notice);
$('retryAnswer').onclick=()=>active?.kind==='glass'?saveGlass(!!active.pendingSave?.done).catch(notice):sendAnswer();
function completedClay(a){
 if(active!==a)return;for(const e of frames.values())e.node.hidden=true;
 let panel=$('partResult');if(!panel){panel=document.createElement('section');panel.id='partResult';$('boards').append(panel);}panel.hidden=false;panel.className='completion';
 panel.innerHTML=`<p class="eyebrow">Onderdeel afgerond</p><h1>Kleiduifreeks klaar</h1><p>Alle ${a.count} doelen zijn verwerkt en je antwoorden zijn bewaard.</p><p>Je punten krijg je bij het definitief indienen van je opdracht.</p>`;
 panel.append(button('Verder naar mijn opdracht',()=>{renderDetail();active=null;},true));$('saveState').textContent='Reeks bewaard · afgerond';panel.tabIndex=-1;panel.focus();
}

async function flush(){
 if(active?.kind==='clay'&&!active.readOnly){active.frame.contentWindow.AxiomaGroups.pause();await queue;}
 if(answerPending){await sendAnswer();if(answerPending)throw Error('Bewaar eerst je antwoord of herstel de verbinding.');}
 clearTimeout(draftTimer);
 if(questionPart(active?.kind)&&!active.readOnly&&active.latestDraft){detail=await request('activity_draft',{id:detail.task.id,part:active.index,index:active.spec.index,draft:active.latestDraft});}
 if(active?.kind==='glass')await saveGlass(!!detail.work?.parts?.[active.index]?.done);
 await queue;
}
$('backTask').onclick=async()=>{try{await flush();const w=active?.work;normal();active=null;teacher()&&w?review(w):renderDetail();}catch(e){notice(e);}};
window.LeraarBobTasks=Object.freeze({beforeClose:flush,clayState(){if(active?.kind!=='clay')throw Error('Geen actieve kleiduifreeks.');const v=detail.work.parts[active.index];return {account,part:active,value:v,serverTime:detail.server_time};},async clayAnswer(packet){const a=active;if(a?.kind!=='clay'||a.readOnly)throw Error('Geen actieve kleiduifreeks.');detail=await request('clay_answer',{id:detail.task.id,part:a.index,index:packet.version,event:packet.eventId,answer:packet.answer});a.work=detail.work;if(detail.work.parts[a.index]?.done)completedClay(a);return this.clayState();},state:()=>({accountId:account?.id,task:detail?.task,work:detail?.work})});
async function accountChanged(next){if(next.pending)return;if(accountReady&&account?.id===next.account?.id)return;accountReady=true;epoch++;account=next.account;detail=null;active=null;clearTimeout(glassTimer);clearTimeout(draftTimer);answerPending=null;frames.forEach(e=>e.node.remove());frames.clear();normal();if(!account){main.innerHTML='<h1>Mijn opdrachten</h1><p>Meld je aan met je bestaande leraarBob-account.</p>';return;}try{await list();}catch(e){main.innerHTML='<h1>Opdrachten niet bereikbaar</h1><p>Je bewaarde spelvoortgang blijft beschikbaar. Probeer je opdrachten opnieuw op te halen.</p>';main.append(button('Opnieuw proberen',list));notice(e);}}
if(window!==top)document.body.dataset.embedded='true';AxiomaAuth.onChange(accountChanged);await accountChanged(await AxiomaAuth.ready());
})();
