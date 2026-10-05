(async() => {
'use strict';
await window.LeraarBobGameRegistry.ready();

const $=id=>document.getElementById(id);
const CLASSES=window.AxiomaAuth?.CLASSES||['3TBO','3TMW','3TMWW','4TMWW','4TMW'];
const TRAINER_SKILLS={
  delta:'Δx en Δy',slope:'Richtingscoëfficiënt',point:'Punt op een rechte',intercept:'Snijpunt met y-as',
  ab:'a en b',fx:'Functiewaarde',table:'Waardentabel',zeroRead:'Nulwaarde aflezen',zero:'Nulwaarde berekenen',
  sign:'Tekenverloop',signchart:'Tekentabel'
};

const detailCache=new WeakMap();
const registry=window.LeraarBobGameRegistry;
const catalog=registry.list();
const featuredCatalog=catalog.filter(g=>g.featured).sort((a,b)=>(a.featureOrder||0)-(b.featureOrder||0));
const featuredIds=featuredCatalog.map(g=>g.id);
let collection='featured';
let sb=null,account=null,students=[],games=[],genericProgress=[];
let classFilter='',themeFilter='',gameFilter=registry.presentation(new URLSearchParams(location.search).get('game'))?.id||'',query='',selectedStudent=null,loadVersion=0,sortBy='alias';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const trainerOf=row=>(Array.isArray(row.axioma_progress)?row.axioma_progress[0]:row.axioma_progress)||null;

function genericFor(userId,gameId){
  return genericProgress.find(x=>x.user_id===userId&&x.game_id===(registry.game(gameId)?.progressId||gameId))||null;
}

function trainerDetails(gameId,saved){
 if(!saved)return window.LeraarBobTrainerDetails.read(gameId,null);
 if(!detailCache.has(saved))detailCache.set(saved,window.LeraarBobTrainerDetails.read(gameId,saved));
 return detailCache.get(saved);
}
function dateText(value){const date=new Date(value||NaN);return Number.isFinite(date.getTime())?date.toLocaleString('nl-BE',{dateStyle:'medium',timeStyle:'short'}):'Tijdstip niet bewaard'}
function skillLabel(label){return esc(label).replace(/(?<![\p{L}\p{M}])(?:e[ₓᵧ]|[abruv])(?![\p{L}\p{M}])/gu,name=>`<math aria-label="vector ${name}"><mover><mi>${name}</mi><mo>→</mo></mover></math>`)}
function readableDetail(g,p,d){
 const header=`<div class="gameDetailHead"><div><p class="eyebrow">${esc(g.theme)} · trainer</p><h3>${esc(g.title)}</h3></div>${d.available?`<strong>${d.solid}/${d.skillCount}<small>vaardigheden stevig</small></strong>`:''}</div>`;
 if(!d.available)return `<article class="gameDetailCard trainerDetail" data-trainer="${esc(g.id)}">${header}<p class="summary">${esc(d.message)}</p></article>`;
 const stats=[[d.total,'opgaven verwerkt'],[d.independent,'zelfstandig opgelost'],[d.xp,'XP'],[d.sessions,'reeksen afgerond']];
 const activity=d.activities.length?`<ol class="activityList">${d.activities.map(e=>`<li><div><strong>${skillLabel(e.skillLabel)}</strong><span class="outcome ${e.outcome}">${esc(e.label)}</span></div><p>${esc(dateText(e.at))} · +${e.xp} XP${e.error?` · ${esc(e.error.label)}`:''}</p></li>`).join('')}</ol>`:`<p class="summary">Er is nog geen activiteitenlijst bewaard. Hieronder staan de laatst geoefende onderwerpen uit de bestaande voortgang.</p><ul class="activityList">${d.recentSkills.map(s=>`<li><strong>${skillLabel(s.label)}</strong><p>${s.lastAt?esc(dateText(s.lastAt)):'Volgorde bekend; tijdstip niet bewaard'}</p></li>`).join('')||'<li>Nog geen opgaven verwerkt.</li>'}</ul>`;
 return `<article class="gameDetailCard trainerDetail" data-trainer="${esc(g.id)}">${header}
  <p class="savedAt">Laatst opgeslagen: ${esc(dateText(d.updatedAt))}</p>
  <dl class="trainerStats">${stats.map(([n,label])=>`<div><dt>${label}</dt><dd>${n}</dd></div>`).join('')}</dl>
  ${d.current?`<p class="currentTask"><strong>${esc(d.current.status)}:</strong> ${skillLabel(d.current.skillLabel)}${d.current.free?' · vrij oefenen, buiten de leerroute':''}</p>`:''}
  <div class="trainerColumns"><section class="trainerSkills"><h4>Vaardigheden</h4>
   <p class="summary">Zelfstandig opgelost tegenover alle verwerkte opgaven. Recente resultaten staan van oud naar nieuw: ✓ zelfstandig; ↻ niet zelfstandig (hulp, verbetering of overslaan).</p>
   <ul class="trainerSkillList">${d.skills.map(s=>`<li data-skill="${esc(s.id)}"><div class="skillHeading"><strong>${skillLabel(s.label)}</strong><span class="skillStatus ${s.phase}">${esc(s.status)}</span></div>
    <div class="skillEvidence"><span>${s.clean} / ${s.seen} zelfstandig</span><span class="recentResults" aria-label="Recente resultaten">${s.recent.map(clean=>`<span class="resultDot ${clean?'independent':'supported'}" role="img" aria-label="${clean?'Zelfstandig opgelost':'Niet zelfstandig opgelost'}">${clean?'✓':'↻'}</span>`).join('')}</span></div>
    ${s.strength!==null&&s.seen?`<div class="strength"><span>Beheersingsindicatie ${s.strength}%</span><meter min="0" max="100" value="${s.strength}" aria-label="Beheersingsindicatie ${esc(s.label)}">${s.strength}%</meter></div>`:''}
    <p class="reviewPlan">${s.repair?'Herstel: ':'Herhaling: '}${esc(s.review)}</p></li>`).join('')}</ul>
   <p class="summary">‘Stevig’ volgt de regels van deze trainer, waaronder zelfstandig oplossen, variatie en latere herhaling. Een beheersingsindicatie is geen toetscijfer.</p>
  </section><aside class="trainerFollowup"><section><h4>Fouten en aandachtspunten</h4>${d.attention.length?`<ul class="attentionList">${d.attention.map(a=>`<li><strong>${skillLabel(a.skillLabel)}</strong><h5>${esc(a.label)}</h5><p>${esc(a.advice)}</p><p class="reviewPlan">${esc(a.review)}${a.stage?` · ${esc(a.stage)}`:''}</p></li>`).join('')}</ul>`:'<p class="summary">Geen open aandachtspunten geregistreerd.</p>'}</section>
   <section class="recentActivity"><h4>Recente activiteit</h4>${activity}${d.activities.length?`<p class="summary">Laatste ${d.activities.length} verwerkte opgaven, nieuwste bovenaan.${d.historyIncomplete?' Oudere opgaven blijven in de totalen staan; hun afzonderlijke verloop is hier niet beschikbaar.':''}</p>`:''}</section>
  </aside></div></article>`;
}

function trainerSummary(row){
  const s=trainerOf(row)?.state||{};
  const total=num(s.total),correct=num(s.correct);
  if(!total) return {label:'—',detail:'Nog niet gestart',value:0};
  return {
    label:`${Math.round(100*correct/total)}%`,
    detail:`${total} vragen · ${num(s.xp)} XP`,
    value:correct/Math.max(total,1)
  };
}

function genericSummary(p,game){
  if(!p?.state) return {label:'—',detail:'Nog niet gestart',value:0};
  const s=p.state;
  if(game.progress_type==='score'){
    const best=s.bestScore ?? s.score ?? s.best ?? null;
    const attempts=s.attempts ?? s.plays ?? null;
    return {
      label:best!==null?String(best):'Actief',
      detail:attempts!==null?`${attempts} pogingen`:'Voortgang opgeslagen',
      value:0
    };
  }
  if((game.progress_type||game.progressType)==='levels'){
    const done=Array.isArray(s.completed)?s.completed.length:num(s.completed);
    const total=num(s.totalLevels||s.total||s.levelCount||game.progressTotal);
    const singular=game.metadata?.unit_singular||game.progressUnitSingular||'onderdeel';
    const plural=game.metadata?.unit_plural||game.progressUnitPlural||'onderdelen';
    const unit=done===1?singular:plural;
    return {
      label: total ? `${done}/${total}` : done ? `${done} klaar` : 'Actief',
      detail: done ? `${done} ${unit} voltooid` : 'Nog niet voltooid',
      value: total ? done/Math.max(total,1) : 0
    };
  }
  return {label:'Actief',detail:'Voortgang opgeslagen',value:0};
}

function worldSummary(row){
 const state=genericFor(row.user_id,'rechten-trainer')?.state?.rechtenV2;
 if(!state)return {label:'—',detail:'Nog niet gestart',value:0,areas:[]};
 const A=window.RechtenV2Areas;
 const areas=Object.entries(A.areas).map(([id,area])=>({name:area.name||area.title||id,...A.statuses(state,id,trainerOf(row))}));
 const done=areas.reduce((sum,a)=>sum+a.playableCompleted,0),total=areas.reduce((sum,a)=>sum+a.playableTotal,0);
 return {label:`${done}/${total}`,detail:'onderdelen afgerond',value:total?done/total:0,areas};
}
function summaryFor(row,game){
  const components=registry.components(game.id).filter(g=>g.id!==game.id),base=summaryComponent(row,game);
  const savedComponents=components.filter(g=>genericFor(row.user_id,g.id));
  if(savedComponents.length)return {...base,label:[base.label,...savedComponents.map(g=>summaryComponent(row,g).label)].join(' · '),detail:[game.progressLabel||game.title,...savedComponents.map(g=>g.componentTitle)].join(' · ')};
  return base;
}
function summaryComponent(row,game){
  if(game.id==='rechtenwereld')return worldSummary(row);
  if(game.id==='rechten-trainer') return trainerSummary(row);
  const details=trainerDetails(game.id,genericFor(row.user_id,game.id));
  if(details?.available)return {label:`${details.solid}/${details.skillCount}`,detail:`${details.total} opgaven · ${details.xp} XP`,value:details.solid/details.skillCount};
  return genericSummary(genericFor(row.user_id,game.id),game);
}

function filteredGames(){
  return games.filter(g=>g.teacher_visible && (collection==='all'||featuredIds.includes(g.id)) && (!themeFilter||g.theme===themeFilter) && (!gameFilter||g.id===gameFilter));
}

function studentMetric(row,kind){
 const components=filteredGames().flatMap(g=>registry.components(g.id));
 if(kind==='xp')return components.reduce((sum,g)=>sum+(window.LeraarBobCatalogProgress?.earnedXP(g,genericFor(row.user_id,g.id))||0),0);
 if(kind==='recent')return Math.max(0,...components.map(g=>Date.parse(genericFor(row.user_id,g.id)?.updated_at)||0));
 return 0;
}
function filteredStudents(){
  const q=query.toLowerCase().trim();
  return students.filter(r=>(!classFilter||r.class_code===classFilter)&&(!q||String(r.alias||'').toLowerCase().includes(q))).sort((a,b)=>sortBy==='alias'?a.alias.localeCompare(b.alias,'nl'):studentMetric(b,sortBy)-studentMetric(a,sortBy)||a.alias.localeCompare(b.alias,'nl'));
}

function csvCell(v){return '"'+String(v??'').replace(/^[=+\-@\t\r]/,"'$&").replace(/"/g,'""')+'"'}

function renderShell(){
  const themes=[...new Set(games.filter(g=>g.teacher_visible&&(collection==='all'||featuredIds.includes(g.id))).map(g=>g.theme))].sort();
  $('app').innerHTML=`
    <div class="collection-switch" role="group" aria-label="Spellen in het overzicht"><button type="button" data-collection="featured" aria-pressed="${collection==='featured'}">Actuele spellen</button><button type="button" data-collection="all" aria-pressed="${collection==='all'}">Alle spellen, ook reserve</button></div>
    <div class="toolbar">
      <label>Klas<select id="classFilter"><option value="">Alle klassen</option>${CLASSES.map(c=>`<option ${c===classFilter?'selected':''}>${c}</option>`).join('')}</select></label>
      <label class="wide">Zoek alias<input id="searchStudent" type="search" value="${esc(query)}" placeholder="Zoek een leerling"></label>
      <label>Sorteren<select id="studentSort"><option value="alias">Alias A–Z</option><option value="xp">Meeste XP</option><option value="recent">Recent actief</option></select></label><button id="refresh" class="btn" type="button">Vernieuwen</button><a class="btn" href="../games/bewerkingen-trainer/start.html?view=students">Getallenwereld: oefeningen en klasresultaten</a>
      <details class="extra-filters" ${themeFilter?'open':''}><summary>Meer filters en export</summary><div>
      <label>Thema<select id="themeFilter"><option value="">Alle thema's</option>${themes.map(t=>`<option ${t===themeFilter?'selected':''}>${esc(t)}</option>`).join('')}</select></label>
      <label>Onderdeel<select id="gameFilter"><option value="">Alle onderdelen</option>${games.filter(g=>g.teacher_visible&&(collection==='all'||featuredIds.includes(g.id))).map(g=>`<option value="${esc(g.id)}" ${g.id===gameFilter?'selected':''}>${esc(g.title)}</option>`).join('')}</select></label>
      <button id="export" class="btn" type="button">Download CSV ↓</button>
      </div></details>
    </div>
    <section class="gameRegistry" id="gameRegistry" aria-label="Kies een spel"></section>
    <p id="summary" class="summary"></p>
    <div class="tableWrap" id="matrix"></div>
    <section id="detail" class="detail"></section>`;

  $('app').querySelectorAll('[data-collection]').forEach(b=>b.onclick=()=>{collection=b.dataset.collection;gameFilter='';themeFilter='';renderShell()});
  $('classFilter').onchange=e=>{classFilter=e.target.value;draw()};
  $('themeFilter').onchange=e=>{themeFilter=e.target.value;gameFilter='';renderShell()};
  $('gameFilter').onchange=e=>{gameFilter=e.target.value;draw()};
  $('searchStudent').oninput=e=>{query=e.target.value;draw()};
  $('studentSort').value=sortBy;$('studentSort').onchange=e=>{sortBy=e.target.value;draw()};
  $('refresh').onclick=loadAll;
  $('export').onclick=exportCSV;
  draw();
}

function drawRegistry(){
  const visible=games.filter(g=>g.teacher_visible&&(collection==='all'||featuredIds.includes(g.id))&&(!themeFilter||g.theme===themeFilter));
  $('gameRegistry').innerHTML=visible.map(g=>{
    const count=filteredStudents().filter(s=>{
      if(g.id==='rechtenwereld')return !!genericFor(s.user_id,'rechten-trainer')?.state?.rechtenV2;
      if(g.id==='rechten-trainer') return num(trainerOf(s)?.state?.total)>0;
      return registry.components(g.id).some(c=>!!genericFor(s.user_id,c.id));
    }).length;
    const cover=catalog.find(c=>c.id===g.id)?.coverSmall;
    return `<button type="button" class="gameChip" data-game="${esc(g.id)}" aria-pressed="${gameFilter===g.id}">
      ${cover?`<img src="../${esc(cover)}" alt="">`:''}<span>${esc(g.theme)}</span>
      <strong>${esc(g.title)}</strong>
      <small>${count} ${count===1?'leerling':'leerlingen'} met voortgang</small>
    </button>`;
  }).join('');
  $('gameRegistry').querySelectorAll('[data-game]').forEach(b=>b.onclick=()=>{gameFilter=gameFilter===b.dataset.game?'':b.dataset.game;$('gameFilter').value=gameFilter;draw()});
}

function draw(){
  const list=filteredStudents(),visibleGames=filteredGames();
  if(!$('matrix')) return;
  drawRegistry();
  $('summary').textContent=`${list.length} ${list.length===1?'leerling':'leerlingen'} · ${visibleGames.length} ${visibleGames.length===1?'onderdeel':'onderdelen'} in beeld`;

  $('matrix').innerHTML=`
    <table class="matrixTable">
      <thead><tr><th>Leerling</th><th>Klas</th>${visibleGames.map(g=>`<th>${esc(g.title)}<small>${esc(g.theme)}</small></th>`).join('')}<th><span class="sr-only">Details</span></th></tr></thead>
      <tbody>${list.length?list.map(r=>`<tr>
        <td><strong>${esc(r.alias)}</strong></td><td>${esc(r.class_code)}</td>
        ${visibleGames.map(g=>{const x=summaryFor(r,g);return `<td data-label="${esc(g.title)}"><strong>${esc(x.label)}</strong><small>${esc(x.detail)}</small></td>`}).join('')}
        <td><button class="view" data-id="${esc(r.user_id)}">Bekijk</button></td>
      </tr>`).join(''):`<tr><td colspan="${visibleGames.length+3}">Nog geen leerlingen voor deze selectie.</td></tr>`}</tbody>
    </table>`;
  $('matrix').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{selectedStudent=b.dataset.id;drawDetail();$('detail').scrollIntoView({behavior:'smooth',block:'start'})});
  if(!list.some(r=>r.user_id===selectedStudent)) selectedStudent=null;
  drawDetail();
}

function drawDetail(){
  const root=$('detail'),row=students.find(r=>r.user_id===selectedStudent);
  if(!row){root.replaceChildren();return}
  const visibleGames=filteredGames();
  root.innerHTML=`
    <div class="detailHead"><div><p class="eyebrow">Leerling</p><h2>${esc(row.alias)} · ${esc(row.class_code)}</h2></div><button id="closeDetail" class="btn" type="button">Sluiten</button></div>
    <div class="studentGames">${visibleGames.map(g=>gameDetail(row,g)).join('')}</div>`;
  $('closeDetail').onclick=()=>{selectedStudent=null;drawDetail()};
}

function gameDetail(row,g,component=false){
  const parts=registry.components(g.id);
  if(!component&&parts.length>1)return parts.map(part=>gameDetail(row,{...part,title:g.title+' · '+(part.componentTitle||part.progressLabel||'Onderdelen'),theme:g.theme,progress_type:part.progressType,metadata:{total:part.progressTotal,unit_singular:part.progressUnitSingular,unit_plural:part.progressUnitPlural}},true).replace('<article ',`<article data-progress-component="${esc(part.id)}" `)).join('');
  if(g.id==='rechtenwereld'){const summary=worldSummary(row);return `<article class="gameDetailCard"><div class="gameDetailHead"><h3>Rechtenwereld</h3><strong>${esc(summary.label)}</strong></div><p>${esc(summary.detail)}</p><ul class="world-results">${summary.areas.map(a=>`<li><span>${esc(a.name)}</span><strong>${a.playableCompleted}/${a.playableTotal}</strong></li>`).join('')}</ul></article>`;}
  if(g.id==='rechten-trainer'){
    const saved=trainerOf(row),s=saved?.state||{},skills=s.skills||{};
    const total=num(s.total);
    return `<article class="gameDetailCard">
      <div class="gameDetailHead"><div><p class="eyebrow">${esc(g.theme)}</p><h3>${esc(g.title)}</h3></div><strong>${total?Math.round(100*num(s.correct)/total)+'%':'—'}</strong></div>
      ${total?`<div class="skillList">${Object.entries(TRAINER_SKILLS).map(([key,label])=>{const x=skills[key]||{},pct=Math.max(0,Math.min(100,Math.round(num(x.strength)*100)));return `<div class="skill"><span>${esc(label)}</span><div class="meter"><i style="width:${pct}%"></i></div><em>${pct}%</em></div>`}).join('')}</div>`:`<p class="summary">Nog niet gestart.</p>`}
    </article>`;
  }
  const p=genericFor(row.user_id,g.id),details=trainerDetails(g.id,p);
  if(details)return readableDetail(g,p,details);
  if(!p) return `<article class="gameDetailCard"><div class="gameDetailHead"><div><p class="eyebrow">${esc(g.theme)}</p><h3>${esc(g.title)}</h3></div><strong>—</strong></div><p class="summary">Nog geen cloudvoortgang voor dit onderdeel.</p></article>`;
  const summary=summaryComponent(row,g),xp=window.LeraarBobCatalogProgress?.earnedXP(g,p);
  return `<article class="gameDetailCard">
    <div class="gameDetailHead"><div><p class="eyebrow">${esc(g.theme)}</p><h3>${esc(g.title)}</h3></div><strong>${esc(summary.label)}</strong></div>
    <p class="summary">Laatst opgeslagen: ${esc(new Date(p.updated_at).toLocaleString('nl-BE'))}</p>
    <p class="game-result"><strong>${esc(summary.detail)}</strong></p>${summary.value?`<progress max="1" value="${Math.min(1,Math.max(0,summary.value))}" aria-label="Afgeronde onderdelen"></progress>`:''}
    ${xp!==null&&xp!==undefined?`<p class="summary">${xp} XP</p>`:''}
  </article>`;
}

async function loadAll(){
  const version=++loadVersion,owner=account?.id;
  if(account?.role!=='teacher')return;
  if($('summary')) $('summary').textContent='Gegevens laden…';
  try{
    const [profileRes,progressRes]=await Promise.all([
      sb.from('axioma_profiles').select('user_id,alias,class_code,created_at,axioma_progress(state,revision,updated_at)').order('alias'),
      sb.from('axioma_game_progress').select('user_id,game_id,state,revision,updated_at').order('updated_at',{ascending:false})
    ]);
    if(version!==loadVersion||account?.id!==owner||account?.role!=='teacher')return;
    if(profileRes.error) throw profileRes.error;
    if(progressRes.error) throw progressRes.error;
    games=registry.list().map(g=>({...g,game_type:g.gameType,progress_type:g.progressType,teacher_visible:g.teacherVisible,metadata:{total:g.progressTotal,unit_singular:g.progressUnitSingular,unit_plural:g.progressUnitPlural}}));
    games.sort((a,b)=>(featuredIds.includes(a.id)?featuredIds.indexOf(a.id):100)-(featuredIds.includes(b.id)?featuredIds.indexOf(b.id):100));
    students=profileRes.data||[];
    genericProgress=progressRes.data||[];
    renderShell();
  }catch(error){
    if(version!==loadVersion)return;
    console.error(error);
    $('app').innerHTML='<div class="state"><h2>Overzicht kon niet worden geladen.</h2><p>Controleer je verbinding en probeer opnieuw.</p><button id="retry" class="btn primary">Opnieuw proberen</button></div>';
    $('retry').onclick=init;
  }
}

function exportCSV(){
  const list=filteredStudents(),visibleGames=filteredGames();
  const rows=[
    ['Alias','Klas',...visibleGames.map(g=>g.title)],
    ...list.map(r=>[r.alias,r.class_code,...visibleGames.map(g=>summaryFor(r,g).label)])
  ];
  const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='leraarBob-overzicht.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

async function init(){
  const version=++loadVersion;
  try{
    const nextAccount=await window.AxiomaAuth.getAccount();if(version!==loadVersion)return;
    account=nextAccount;sb=window.AxiomaAuth.client();
    $('groupBattles').hidden=account?.role!=='teacher';
    if(account?.role!=='teacher'){
      $('app').innerHTML='<div class="state"><h2>Leerkrachtlogin nodig.</h2><p>Meld je aan via de centrale leraarBob-login.</p><a class="btn primary" href="../?login=1&return=teacher/">Naar leraarBob-login</a></div>';
      $('teacherIdentity').textContent='';
      return;
    }
    $('teacherIdentity').textContent=account.email||'Leerkracht';
    await loadAll();
  }catch(error){
    if(version!==loadVersion)return;
    console.error(error);
    $('app').innerHTML='<div class="state"><h2>Accountverbinding niet beschikbaar.</h2><p>Controleer de verbinding met Supabase.</p></div>';
  }
}

$('logout').onclick=async()=>{try{await window.AxiomaAuth.signOut();location.href='../'}catch{}};
const battleLinks=$('groupBattles').querySelector('.battle-links');battleLinks.replaceChildren();
for(const g of registry.list()){if(!registry.modes(g.id,{includeReferences:false}).some(m=>m.id==='classroom'))continue;const a=document.createElement('a');a.href=registry.destination(g.id,'classroom',{hub:true});a.append(g.title,Object.assign(document.createElement('span'),{textContent:'↗'}));battleLinks.append(a);}
window.AxiomaAuth.onChange(({account:next,pending})=>{
  if(!pending&&next?.id===account?.id&&next?.role===account?.role)return;
  loadVersion++;account=null;$('groupBattles').hidden=true;students=[];games=[];genericProgress=[];selectedStudent=null;
  $('teacherIdentity').textContent='';$('app').innerHTML='<div class="state"><p>Account controleren…</p></div>';
  if(!pending)init();
});
init();
})();
