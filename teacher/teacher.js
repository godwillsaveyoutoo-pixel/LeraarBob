(() => {
'use strict';

const $=id=>document.getElementById(id);
const CLASSES=window.AxiomaAuth?.CLASSES||['3TBO','3TMW','3TMWW','4TMWW','4TMW'];
const TRAINER_SKILLS={
  delta:'Δx en Δy',slope:'Richtingscoëfficiënt',point:'Punt op een rechte',intercept:'Snijpunt met y-as',
  ab:'a en b',fx:'Functiewaarde',table:'Waardentabel',zeroRead:'Nulwaarde aflezen',zero:'Nulwaarde berekenen',
  sign:'Tekenverloop',signchart:'Tekentabel'
};

let sb=null,account=null,students=[],games=[],genericProgress=[];
let classFilter='',themeFilter='',gameFilter='',query='',selectedStudent=null;

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const trainerOf=row=>(Array.isArray(row.axioma_progress)?row.axioma_progress[0]:row.axioma_progress)||null;

function genericFor(userId,gameId){
  return genericProgress.find(x=>x.user_id===userId&&x.game_id===gameId)||null;
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
  if(game.progress_type==='levels'){
    const done=Array.isArray(s.completed)?s.completed.length:num(s.completed);
    const total=num(s.totalLevels||s.total||s.levelCount);
    const singular=game.metadata?.unit_singular||'onderdeel';
    const plural=game.metadata?.unit_plural||'onderdelen';
    const unit=done===1?singular:plural;
    return {
      label: total ? `${done}/${total}` : done ? `${done} klaar` : 'Actief',
      detail: done ? `${done} ${unit} voltooid` : 'Nog niet voltooid',
      value: total ? done/Math.max(total,1) : 0
    };
  }
  return {label:'Actief',detail:'Voortgang opgeslagen',value:0};
}

function summaryFor(row,game){
  if(game.id==='rechten-trainer') return trainerSummary(row);
  return genericSummary(genericFor(row.user_id,game.id),game);
}

function filteredGames(){
  return games.filter(g=>g.teacher_visible && (!themeFilter||g.theme===themeFilter) && (!gameFilter||g.id===gameFilter));
}

function filteredStudents(){
  const q=query.toLowerCase().trim();
  return students.filter(r=>(!classFilter||r.class_code===classFilter)&&(!q||r.alias.includes(q)));
}

function csvCell(v){return '"'+String(v??'').replace(/^[=+\-@\t\r]/,"'$&").replace(/"/g,'""')+'"'}

function renderShell(){
  const themes=[...new Set(games.filter(g=>g.teacher_visible).map(g=>g.theme))].sort();
  $('app').innerHTML=`
    <div class="toolbar">
      <label>Klas<select id="classFilter"><option value="">Alle klassen</option>${CLASSES.map(c=>`<option ${c===classFilter?'selected':''}>${c}</option>`).join('')}</select></label>
      <label>Thema<select id="themeFilter"><option value="">Alle thema's</option>${themes.map(t=>`<option ${t===themeFilter?'selected':''}>${esc(t)}</option>`).join('')}</select></label>
      <label>Spel<select id="gameFilter"><option value="">Alle spellen</option>${games.filter(g=>g.teacher_visible).map(g=>`<option value="${esc(g.id)}" ${g.id===gameFilter?'selected':''}>${esc(g.title)}</option>`).join('')}</select></label>
      <label class="wide">Zoek alias<input id="searchStudent" type="search" value="${esc(query)}" placeholder="Zoek een leerling"></label>
      <button id="refresh" class="btn" type="button">Vernieuwen</button>
      <button id="export" class="btn" type="button">CSV</button>
    </div>
    <section class="gameRegistry" id="gameRegistry"></section>
    <p id="summary" class="summary"></p>
    <div class="tableWrap" id="matrix"></div>
    <section id="detail" class="detail"></section>`;

  $('classFilter').onchange=e=>{classFilter=e.target.value;draw()};
  $('themeFilter').onchange=e=>{themeFilter=e.target.value;gameFilter='';draw();renderShell()};
  $('gameFilter').onchange=e=>{gameFilter=e.target.value;draw()};
  $('searchStudent').oninput=e=>{query=e.target.value;draw()};
  $('refresh').onclick=loadAll;
  $('export').onclick=exportCSV;
  draw();
}

function drawRegistry(){
  const visible=filteredGames();
  $('gameRegistry').innerHTML=visible.map(g=>{
    const count=students.filter(s=>{
      if(g.id==='rechten-trainer') return num(trainerOf(s)?.state?.total)>0;
      return !!genericFor(s.user_id,g.id);
    }).length;
    return `<article class="gameChip">
      <span>${esc(g.theme)}</span>
      <strong>${esc(g.title)}</strong>
      <small>${count} ${count===1?'leerling':'leerlingen'} met data · ${esc(g.progress_type)}</small>
    </article>`;
  }).join('');
}

function draw(){
  const list=filteredStudents(),visibleGames=filteredGames();
  if(!$('matrix')) return;
  drawRegistry();
  $('summary').textContent=`${list.length} ${list.length===1?'leerling':'leerlingen'} · ${visibleGames.length} ${visibleGames.length===1?'spel':'spellen'} in beeld`;

  $('matrix').innerHTML=`
    <table class="matrixTable">
      <thead><tr><th>Leerling</th><th>Klas</th>${visibleGames.map(g=>`<th>${esc(g.title)}<small>${esc(g.theme)}</small></th>`).join('')}<th></th></tr></thead>
      <tbody>${list.length?list.map(r=>`<tr>
        <td><strong>${esc(r.alias)}</strong></td><td>${esc(r.class_code)}</td>
        ${visibleGames.map(g=>{const x=summaryFor(r,g);return `<td><strong>${esc(x.label)}</strong><small>${esc(x.detail)}</small></td>`}).join('')}
        <td><button class="view" data-id="${esc(r.user_id)}">Bekijk</button></td>
      </tr>`).join(''):`<tr><td colspan="${visibleGames.length+3}">Nog geen leerlingen voor deze selectie.</td></tr>`}</tbody>
    </table>`;
  $('matrix').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{selectedStudent=b.dataset.id;drawDetail()});
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

function gameDetail(row,g){
  if(g.id==='rechten-trainer'){
    const saved=trainerOf(row),s=saved?.state||{},skills=s.skills||{};
    const total=num(s.total);
    return `<article class="gameDetailCard">
      <div class="gameDetailHead"><div><p class="eyebrow">${esc(g.theme)} · ${esc(g.progress_type)}</p><h3>${esc(g.title)}</h3></div><strong>${total?Math.round(100*num(s.correct)/total)+'%':'—'}</strong></div>
      ${total?`<div class="skillList">${Object.entries(TRAINER_SKILLS).map(([key,label])=>{const x=skills[key]||{},pct=Math.max(0,Math.min(100,Math.round(num(x.strength)*100)));return `<div class="skill"><span>${esc(label)}</span><div class="meter"><i style="width:${pct}%"></i></div><em>${pct}%</em></div>`}).join('')}</div>`:`<p class="summary">Nog niet gestart.</p>`}
    </article>`;
  }
  const p=genericFor(row.user_id,g.id);
  if(!p) return `<article class="gameDetailCard"><div class="gameDetailHead"><div><p class="eyebrow">${esc(g.theme)} · ${esc(g.progress_type)}</p><h3>${esc(g.title)}</h3></div><strong>—</strong></div><p class="summary">Nog geen cloudvoortgang voor dit spel.</p></article>`;
  return `<article class="gameDetailCard">
    <div class="gameDetailHead"><div><p class="eyebrow">${esc(g.theme)} · ${esc(g.progress_type)}</p><h3>${esc(g.title)}</h3></div><strong>${esc(summaryFor(row,g).label)}</strong></div>
    <p class="summary">Laatst opgeslagen: ${esc(new Date(p.updated_at).toLocaleString('nl-BE'))}</p>
    <pre class="statePreview">${esc(JSON.stringify(p.state,null,2))}</pre>
  </article>`;
}

async function loadAll(){
  if($('summary')) $('summary').textContent='Gegevens laden…';
  try{
    const [gameRes,profileRes,progressRes]=await Promise.all([
      sb.from('axioma_games').select('id,title,theme,game_type,progress_type,teacher_visible,sort_order,metadata').eq('active',true).order('sort_order'),
      sb.from('axioma_profiles').select('user_id,alias,class_code,created_at,axioma_progress(state,revision,updated_at)').order('alias'),
      sb.from('axioma_game_progress').select('user_id,game_id,state,revision,updated_at').order('updated_at',{ascending:false})
    ]);
    if(gameRes.error) throw gameRes.error;
    if(profileRes.error) throw profileRes.error;
    if(progressRes.error) throw progressRes.error;
    games=gameRes.data||[];
    students=profileRes.data||[];
    genericProgress=progressRes.data||[];
    renderShell();
  }catch(error){
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
  const a=document.createElement('a');a.href=url;a.download='axioma-overzicht.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

async function init(){
  try{
    const ready=await window.AxiomaAuth.ready();account=ready.account;sb=window.AxiomaAuth.client();
    if(account?.role!=='teacher'){
      $('app').innerHTML='<div class="state"><h2>Leerkrachtlogin nodig.</h2><p>Meld je aan via de centrale Axioma-login.</p><a class="btn primary" href="../?login=1&return=teacher/">Naar Axioma-login</a></div>';
      $('teacherIdentity').textContent='';
      return;
    }
    $('teacherIdentity').textContent=account.email||'Leerkracht';
    await loadAll();
  }catch(error){
    console.error(error);
    $('app').innerHTML='<div class="state"><h2>Accountverbinding niet beschikbaar.</h2><p>Controleer de verbinding met Supabase.</p></div>';
  }
}

$('logout').onclick=async()=>{try{await window.AxiomaAuth.signOut();location.href='../'}catch{}};
init();
})();