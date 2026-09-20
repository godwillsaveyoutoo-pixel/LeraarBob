(() => {
'use strict';
const $=id=>document.getElementById(id);
const CLASSES=window.AxiomaAuth?.CLASSES||['3TBO','3TMW','3TMWW','4TMWW','4TMW'];
const SKILLS={
  delta:'Δx en Δy',slope:'Richtingscoëfficiënt',point:'Punt op een rechte',intercept:'Snijpunt met y-as',
  ab:'a en b',fx:'Functiewaarde',table:'Waardentabel',zeroRead:'Nulwaarde aflezen',zero:'Nulwaarde berekenen',
  sign:'Tekenverloop',signchart:'Tekentabel'
};
let sb=null,account=null,rows=[],classFilter='',query='',selected=null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const progressOf=row=>(Array.isArray(row.axioma_progress)?row.axioma_progress[0]:row.axioma_progress)||null;
function lastActivity(s){const at=Math.max(0,...(Array.isArray(s?.telemetry)?s.telemetry:[]).map(e=>num(e.at)));return at?new Date(at).toLocaleString('nl-BE'):'Nog geen antwoorden'}
function filtered(){const q=query.toLowerCase().trim();return rows.filter(r=>(!classFilter||r.class_code===classFilter)&&(!q||r.alias.includes(q)))}
function cell(v){return '"'+String(v??'').replace(/^[=+\-@\t\r]/,"'$&").replace(/"/g,'""')+'"'}
function renderShell(){
  $('app').innerHTML=`
    <div class="toolbar">
      <label>Klas<select id="classFilter"><option value="">Alle klassen</option>${CLASSES.map(c=>`<option ${c===classFilter?'selected':''}>${c}</option>`).join('')}</select></label>
      <label class="wide">Zoek alias<input id="searchStudent" type="search" value="${esc(query)}" placeholder="Zoek een leerling"></label>
      <button id="refresh" class="btn" type="button">Vernieuwen</button>
      <button id="export" class="btn" type="button">CSV</button>
    </div>
    <p id="summary" class="summary"></p>
    <div class="tableWrap"><table><thead><tr><th>Leerling</th><th>Klas</th><th>XP</th><th>Vragen</th><th>Juist</th><th>Stevige skills</th><th>Laatste antwoord</th><th></th></tr></thead><tbody id="studentRows"></tbody></table></div>
    <section id="detail" class="detail"></section>`;
  $('classFilter').onchange=e=>{classFilter=e.target.value;draw()};
  $('searchStudent').oninput=e=>{query=e.target.value;draw()};
  $('refresh').onclick=load;
  $('export').onclick=exportCSV;
  draw();
}
function draw(){
  const list=filtered();
  $('summary').textContent=`${list.length} ${list.length===1?'leerling':'leerlingen'} · ${list.filter(r=>num(progressOf(r)?.state?.total)>0).length} met Rechtentrainer-resultaten`;
  $('studentRows').innerHTML=list.length?list.map(r=>{const s=progressOf(r)?.state||{},total=num(s.total),strong=Object.values(s.skills||{}).filter(x=>num(x.strength)>=.72).length;return `<tr><td><strong>${esc(r.alias)}</strong></td><td>${esc(r.class_code)}</td><td>${num(s.xp)}</td><td>${total}</td><td>${total?Math.round(100*num(s.correct)/total)+'%':'—'}</td><td>${strong} / 11</td><td>${esc(lastActivity(s))}</td><td><button class="view" data-id="${esc(r.user_id)}">Bekijk</button></td></tr>`}).join(''):'<tr><td colspan="8">Nog geen leerlingen voor deze selectie.</td></tr>';
  $('studentRows').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{selected=b.dataset.id;drawDetail()});
  if(!list.some(r=>r.user_id===selected))selected=null;
  drawDetail();
}
function drawDetail(){
  const root=$('detail'),row=rows.find(r=>r.user_id===selected);
  if(!row){root.replaceChildren();return}
  const saved=progressOf(row),s=saved?.state||{},skills=s.skills||{};
  root.innerHTML=`<div class="detailHead"><div><p class="eyebrow">Rechtentrainer</p><h2>${esc(row.alias)} · ${esc(row.class_code)}</h2></div><button id="closeDetail" class="btn" type="button">Sluiten</button></div>
    <p class="summary">${num(s.routeStep)} rondes · ${num(s.streak)} dagenreeks · ${Array.isArray(s.review)?s.review.length:0} herhaalvragen · laatst opgeslagen: ${saved?.updated_at?esc(new Date(saved.updated_at).toLocaleString('nl-BE')):'nog niet'}</p>
    <div class="detailGrid"><div>${Object.entries(SKILLS).map(([key,label])=>{const x=skills[key]||{},pct=Math.max(0,Math.min(100,Math.round(num(x.strength)*100)));return `<div class="skill"><div><strong>${esc(label)}</strong><div>${num(x.seen)} gezien · ${num(x.correct)} juist</div></div><div class="meter"><i style="width:${pct}%"></i></div><span class="pct">${pct}%</span></div>`}).join('')}</div>
    <div><p class="eyebrow">Recente antwoorden</p>${(Array.isArray(s.telemetry)?s.telemetry:[]).slice(-12).reverse().map(e=>`<div class="recent"><strong>${e.ok?'✓':'×'} ${esc(SKILLS[e.skill]||e.skill)}</strong>${esc(e.error&&e.error!=='generic'?e.error:'')} ${e.ms?'· '+Math.round(num(e.ms)/1000)+' s':''}</div>`).join('')||'<p class="summary">Nog geen antwoorden.</p>'}</div></div>`;
  $('closeDetail').onclick=()=>{selected=null;drawDetail()};
}
async function load(){
  $('summary') && ($('summary').textContent='Gegevens laden…');
  const all=[];
  try{
    for(let from=0;;from+=500){
      const {data,error}=await sb.from('axioma_profiles').select('user_id,alias,class_code,created_at,axioma_progress(state,revision,updated_at)').order('alias').range(from,from+499);
      if(error)throw error;
      all.push(...data);
      if(data.length<500)break;
    }
    rows=all;draw();
  }catch(error){
    console.error(error);
    $('app').innerHTML='<div class="state"><h2>Overzicht kon niet worden geladen.</h2><p>Controleer je verbinding en probeer opnieuw.</p><button id="retry" class="btn primary">Opnieuw proberen</button></div>';
    $('retry').onclick=init;
  }
}
function exportCSV(){
  const list=filtered(),data=[['Alias','Klas','XP','Vragen','Juist','Rondes','Dagreeks','Laatste antwoord'],...list.map(r=>{const s=progressOf(r)?.state||{};return [r.alias,r.class_code,num(s.xp),num(s.total),num(s.correct),num(s.routeStep),num(s.streak),lastActivity(s)]})];
  const url=URL.createObjectURL(new Blob(['\uFEFF'+data.map(r=>r.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='axioma-'+(classFilter||'alle-klassen')+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function init(){
  try{
    const ready=await window.AxiomaAuth.ready();account=ready.account;sb=window.AxiomaAuth.client();
    if(account?.role!=='teacher'){
      const returnPath=encodeURIComponent('teacher/');
      $('app').innerHTML=`<div class="state"><h2>Leerkrachtlogin nodig.</h2><p>Meld je aan via de centrale Axioma-login.</p><a class="btn primary" href="../?login=1&return=${returnPath}">Naar Axioma-login</a></div>`;
      $('teacherIdentity').textContent='';
      return;
    }
    $('teacherIdentity').textContent=account.email||'Leerkracht';
    renderShell();await load();
  }catch(error){
    console.error(error);$('app').innerHTML='<div class="state"><h2>Accountverbinding niet beschikbaar.</h2><p>Controleer de verbinding met Supabase.</p></div>';
  }
}
$('logout').onclick=async()=>{try{await window.AxiomaAuth.signOut();location.href='../'}catch{}};
init();
})();