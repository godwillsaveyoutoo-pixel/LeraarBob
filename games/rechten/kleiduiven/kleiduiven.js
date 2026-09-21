(()=>{
'use strict';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const rounds=[
  {id:'p1',a:1,x:2.3,choices:[1,-1,2]},
  {id:'n1',a:-1,x:2.3,choices:[-1,1,-.5]},
  {id:'p2',a:2,x:-1.15,choices:[2,.5,-2]},
  {id:'nh',a:-.5,x:-3.0,choices:[-.5,.5,-2]},
  {id:'ph',a:.5,x:-3.0,choices:[.5,2,-.5]},
  {id:'n2',a:-2,x:1.15,choices:[-2,-.5,2]},
  {id:'zero',a:0,x:-3.1,choices:[0,1,-1]}
];
const STORE='axioma.rechten.kleiduiven.standalone.v12';
const SHOT_MS=320,GAP_MS=400;
let speed=5,duration=5,queue=[],retry=[],mastered=new Set(),attempt=null,roundNo=1,state='lobby';
const AXIOMA_GAME_ID='kleiduifschieten';
let axiomaSeriesTracked=false;
function trackAxiomaSeries(){
  if(axiomaSeriesTracked)return;
  axiomaSeriesTracked=true;
  window.AxiomaProgress?.completeUnit(AXIOMA_GAME_ID,'reeks',1).catch(()=>{axiomaSeriesTracked=false});
}

let misses=0,shots=0,started=0,elapsed=0,runId='',team='Duo 1',selected=null,busy=false;
let raf=0,lastHud=0,barrelAngle=-45,wantedAngle=-45,particles=[],impactAt=0,muted=false,audio=null,persistent=true,history=[];

let groupData=null,groupMode=false,groupVersion=-1,groupSessionId=null,groupRequest=null,groupNextTimer=null,groupDismissed=null,groupPrompt=null;
const scheduled=new Set();
function later(fn,ms){const id=setTimeout(()=>{scheduled.delete(id);fn()},ms);scheduled.add(id);return id}
function stopGame(){cancelAnimationFrame(raf);for(const id of scheduled)clearTimeout(id);scheduled.clear();clearTimeout(groupNextTimer);groupNextTimer=null;attempt=null;busy=false;$('countdown').hidden=true}

const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=v=>Number.isInteger(v)?String(v):String(v).replace('.',',');
function makeSvg(tag,attrs={}){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e}
function tone(freq=880,dur=.08,type='sine',gain=.055,delay=0){
  if(muted)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  try{audio??=new AC();audio.resume?.();const t=audio.currentTime+delay,o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+dur+.02)}catch{}
}
function noise(dur=.09,gain=.05){
  if(muted)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  try{audio??=new AC();audio.resume?.();const n=Math.max(1,Math.floor(audio.sampleRate*dur)),buf=audio.createBuffer(1,n,audio.sampleRate),data=buf.getChannelData(0);for(let i=0;i<n;i++)data[i]=(Math.random()*2-1)*(1-i/n);const src=audio.createBufferSource(),g=audio.createGain();src.buffer=buf;g.gain.value=gain;src.connect(g).connect(audio.destination);src.start()}catch{}
}
function sStart(){tone(930,.075,'sine',.06);tone(1260,.055,'sine',.035,.055)}
function sShot(){noise(.075,.07);tone(145,.1,'square',.025)}
function sHit(){noise(.13,.045);tone(720,.08,'triangle',.04);tone(980,.1,'triangle',.03,.06)}
function sMiss(){tone(190,.14,'triangle',.04)}
function sTimeout(){tone(280,.11,'sine',.035);tone(180,.18,'sine',.03,.09)}
function clockText(ms){const n=Math.max(0,Math.floor(ms/10));return String(Math.floor(n/6000)).padStart(2,'0')+':'+String(Math.floor(n/100)%60).padStart(2,'0')+','+String(n%100).padStart(2,'0')}
function pxX(x){return 500+x*70}
function pxY(y){return 310-y*70}
function targetPos(r){return{x:pxX(r.x),y:pxY(r.a*r.x)}}
function targetAt(A,time){
  const u=clamp((time-A.start)/(A.deadline-A.start),0,1);
  const vx=A.p.x-500,vy=A.p.y-310,len=Math.hypot(vx,vy)||1;
  const ux=vx/len,uy=vy/len;
  const outer=250,inner=118;
  const radius=outer+(inner-outer)*u;
  return {x:500+ux*radius,y:310+uy*radius,radius};
}
function positionTarget(p){$('target').setAttribute('transform',`translate(${p.x} ${p.y})`)}
function resetProjectile(){$('projectile').style.opacity='0';$('shotTrail').style.opacity='0';$('projectile').setAttribute('cx',500);$('projectile').setAttribute('cy',310);$('shotTrail').setAttribute('x1',500);$('shotTrail').setAttribute('y1',310)}
function setTimer(sec){$('timer').textContent=sec<0?'—':Math.max(0,sec).toFixed(1).replace('.',',')+' s';$('timer').classList.toggle('urgent',sec>=0&&sec<=2);$('timeFill').style.transform=`scaleX(${clamp(sec/duration,0,1)})`}
function initField(){
  for(let i=0;i<60;i++){const a=i*Math.PI/30,r=i%5===0?238:243;const e=makeSvg('line',{x1:500+Math.cos(a)*r,y1:310+Math.sin(a)*r,x2:500+Math.cos(a)*247,y2:310+Math.sin(a)*247,stroke:'#92b0a6','stroke-width':i%5===0?2:1,opacity:.35});$('rangeMarks').append(e)}
  for(let i=-5;i<=5;i++){
    if(!i)continue;
    const x=500+i*70;if(x>80&&x<920){$('ticks').append(makeSvg('line',{x1:x,y1:305,x2:x,y2:315,stroke:'#a6c4ba',opacity:.6}));const t=makeSvg('text',{x,y:337,class:'tickLabel'});t.textContent=i;$('ticks').append(t)}
    if(Math.abs(i)<=3){const y=310-i*70;$('ticks').append(makeSvg('line',{x1:495,y1:y,x2:505,y2:y,stroke:'#a6c4ba',opacity:.6}));const t=makeSvg('text',{x:479,y:y+5,class:'tickLabel'});t.textContent=i;$('ticks').append(t)}
  }
}
function updateHud(){
  $('reserve').textContent=retry.length?`${retry.length} naar de herkansing`:'Vaste proef · 7 richtingen';
  $('wave').textContent=`PROEF A · ${roundNo===1?'REEKS 1':'HERKANSING '+(roundNo-1)}`;
  $('attempts').textContent=misses+' '+(misses===1?'misser':'missers');$('teamLabel').textContent=team;
  $('progress').replaceChildren();
  for(const r of rounds){const e=document.createElement('span');e.className='dot'+(mastered.has(r.id)?' hit':attempt?.id===r.id?' current':retry.includes(r.id)?' retry':'');$('progress').append(e)}
  if(groupMode){$('reserve').textContent='Foutloos: '+mastered.size+' / 7';$('wave').textContent='GROEPSWEDSTRIJD · 7 OP RIJ'}
}
function renderChoices(r){
  $('choices').replaceChildren();
  r.choices.forEach((v,i)=>{const b=document.createElement('button');b.className='choice';b.dataset.a=String(v);b.innerHTML=`<span>${fmt(v)}</span><span class="choiceKey">${i+1}</span>`;b.onclick=()=>{if(state!=='playing'||busy||!attempt||attempt.resolved)return;selected=v;fire()};$('choices').append(b)})
}
function burst(x,y){
  impactAt=performance.now();$('impact').setAttribute('cx',x);$('impact').setAttribute('cy',y);$('particles').replaceChildren();particles=[];
  for(let i=0;i<16;i++){const angle=i*Math.PI*2/16,speed=55+(i%4)*26,e=makeSvg('path',{d:'M-3 -2L4 -1L1 4Z',fill:i%3===0?'#fff0b6':'#e5aa63'});$('particles').append(e);particles.push({e,x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,start:impactAt,spin:i*31})}
}
function renderFx(now){
  for(const p of particles){const dt=(now-p.start)/1000,k=clamp(dt/.7,0,1);p.e.setAttribute('transform',`translate(${p.x+p.vx*dt} ${p.y+p.vy*dt}) rotate(${p.spin+dt*150})`);p.e.setAttribute('opacity',String(1-k))}
  if(impactAt){const t=clamp((now-impactAt)/500,0,1);$('impact').setAttribute('r',String(15+t*60));$('impact').style.opacity=String((1-t)*.8)}
}
function frame(now){
  if(!['countdown','playing','gap'].includes(state))return;
  raf=requestAnimationFrame(frame);
  if(now-lastHud>30){$('total').textContent=clockText(started?now-started:0);lastHud=now}
  if(state==='countdown'){$('countNum').textContent=String(Math.max(1,Math.ceil(($('countdown').dataset.end-now)/1000)));return}
  if(!reduced.matches){let diff=(wantedAngle-barrelAngle+540)%360-180;barrelAngle+=diff*.2}else barrelAngle=wantedAngle;
  $('turretBarrel').setAttribute('transform',`rotate(${barrelAngle} 500 310)`);renderFx(now);
  const A=attempt;if(!A||A.resolved)return;
  const p=targetAt(A,now);positionTarget(p);$('approachRing').setAttribute('r',p.radius);$('discSpin').setAttribute('transform','rotate(0)');
  const tail=targetAt(A,now-180);$('wake').setAttribute('x1',tail.x);$('wake').setAttribute('y1',tail.y);$('wake').setAttribute('x2',p.x);$('wake').setAttribute('y2',p.y);
  if(A.shot){
    const t=clamp((now-A.shot.start)/SHOT_MS,0,1),x=500+(A.shot.end.x-500)*t,y=310+(A.shot.end.y-310)*t;
    $('projectile').style.opacity='1';$('shotTrail').style.opacity=String(.9-t*.2);$('projectile').setAttribute('cx',x);$('projectile').setAttribute('cy',y);$('shotTrail').setAttribute('x1',500+(x-500)*.62);$('shotTrail').setAttribute('y1',310+(y-310)*.62);$('shotTrail').setAttribute('x2',x);$('shotTrail').setAttribute('y2',y);
    if(t>=1){A.shot.correct?hit():fail('mis')}
  }else{
    setTimer((A.deadline-now)/1000);
    if(now>=A.deadline)fail('tijd')
  }
}
function beginAttempt(){
  if(!queue.length){
    if(!retry.length){finish();return}
    roundNo++;queue=[...retry];retry=[];state='gap';attempt=null;updateHud();$('status').textContent=`Herkansing ${roundNo-1} · nog ${queue.length} ${queue.length===1?'richting':'richtingen'}.`;later(beginAttempt,950);return
  }
  state='playing';busy=false;selected=null;resetProjectile();$('target').style.opacity='1';$('wake').style.opacity='.18';$('approachRing').style.opacity='.18';
  const id=queue.shift(),r=rounds.find(x=>x.id===id),now=performance.now(),p=targetPos(r);
  attempt={id,r,p,start:now,deadline:now+duration*1000,shot:null,resolved:false};
  const startP=targetAt(attempt,now);positionTarget(startP);$('approachRing').setAttribute('r',startP.radius);renderChoices(r);updateHud();setTimer(duration);sStart();
  $('status').textContent=roundNo===1?'Lees de richting. Kies a en vuur.':'Alleen de gemiste richtingen komen terug.'
}
function fire(){
  if(groupMode){submitGroupAnswer(selected);return}
  const A=attempt;if(state!=='playing'||!A||A.resolved||busy||selected===null)return;
  const now=performance.now();if(now>=A.deadline){fail('tijd');return}
  busy=true;shots++;const correct=Math.abs(selected-A.r.a)<1e-6;
  const future=targetAt(A,now+SHOT_MS),radius=Math.hypot(future.x-500,future.y-310),sign=A.p.x>=500?1:-1,dx=sign*radius/Math.hypot(1,selected),dy=-selected*dx;
  const end=correct?future:{x:500+dx,y:310+dy};
  A.shot={start:now,correct,end};wantedAngle=Math.atan2(end.y-310,end.x-500)*180/Math.PI;
  $('choices').querySelectorAll('button').forEach(b=>{b.disabled=true;b.classList.toggle('selected',Number(b.dataset.a)===selected)});setTimer(-1);sShot()
}
function hit(){
  if(groupMode){finishGroupVisual(true);return}
  const A=attempt;if(!A||A.resolved)return;A.resolved=true;state='gap';mastered.add(A.id);$('target').style.opacity='0';$('wake').style.opacity='0';$('approachRing').style.opacity='0';resetProjectile();burst(A.shot.end.x,A.shot.end.y);sHit();
  $('choices').querySelectorAll('button').forEach(b=>{b.classList.remove('selected');b.classList.toggle('correct',Number(b.dataset.a)===A.r.a)});updateHud();$('status').textContent='Raak. Deze richting is binnen.';
  if(mastered.size===rounds.length){elapsed=performance.now()-started;finish();return}
  later(()=>{attempt=null;beginAttempt()},GAP_MS)
}
function fail(kind){
  if(groupMode){if(attempt?.shot)finishGroupVisual(false);else submitGroupAnswer(null);return}
  const A=attempt;if(!A||A.resolved)return;A.resolved=true;state='gap';misses++;if(!retry.includes(A.id)&&!mastered.has(A.id))retry.push(A.id);
  $('target').style.opacity='0';$('wake').style.opacity='0';$('approachRing').style.opacity='0';resetProjectile();sTimeout();
  $('choices').querySelectorAll('button').forEach(b=>{b.disabled=true;b.classList.remove('selected');if(kind==='mis'&&Number(b.dataset.a)===selected)b.classList.add('wrong')});
  updateHud();$('status').textContent=kind==='tijd'?'Te laat. Deze richting komt terug.':'Mis. Deze richting komt terug.';kind==='tijd'?sTimeout():sMiss();
  later(()=>{attempt=null;beginAttempt()},650)
}
function startGame(){
  if(groupMode){openGroupMenu();return}stopGame();
  duration=speed;misses=0;shots=0;retry=[];mastered=new Set();roundNo=1;queue=rounds.map(r=>r.id);attempt=null;elapsed=0;started=0;impactAt=0;particles=[];busy=false;selected=null;
  runId=Date.now()+'-'+Math.random().toString(36).slice(2,7);team=$('teamName').value.trim().slice(0,28)||'Duo 1';$('teamName').value=team;
  $('lobby').hidden=true;$('results').hidden=true;$('target').style.opacity='0';$('wake').style.opacity='0';$('particles').replaceChildren();$('impact').style.opacity='0';resetProjectile();$('total').textContent=clockText(0);updateHud();setTimer(duration);
  state='countdown';const end=performance.now()+3000;$('countdown').dataset.end=String(end);$('countdown').hidden=false;$('countNum').textContent='3';cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);
  later(()=>{$('countdown').hidden=true;started=performance.now();beginAttempt()},3000)
}
function finish(){
  if(state==='done'||mastered.size!==7)return;state='done';cancelAnimationFrame(raf);started=0;attempt=null;busy=true;$('total').textContent=clockText(elapsed);
  saveResult();trackAxiomaSeries();$('resultName').textContent=team+' · alles geraakt.';$('finalTime').textContent=clockText(elapsed);$('resultStats').textContent=`${shots} schoten · ${misses} ${misses===1?'misser':'missers'} · ${roundNo===1?'zonder herkansing':(roundNo-1)+' '+(roundNo===2?'herkansing':'herkansingen')}`;
  showTimes();$('results').hidden=false
}
function readHistory(){try{const x=JSON.parse(localStorage.getItem(STORE)||'[]');if(Array.isArray(x))history=x.filter(r=>r&&typeof r.name==='string'&&Number.isFinite(r.ms)&&[3,5,8].includes(r.tempo)).slice(-100)}catch{persistent=false}}
function saveResult(){if(history.some(r=>r.id===runId))return;history.push({id:runId,name:team,ms:elapsed,tempo:duration,misses,shots});history=history.slice(-100);try{localStorage.setItem(STORE,JSON.stringify(history))}catch{persistent=false}}
function showTimes(){
  $('timesTitle').textContent=`Klastijden · ${speed} seconden`;$('timesList').replaceChildren();
  const rows=history.filter(r=>r.tempo===speed).sort((a,b)=>a.ms-b.ms);
  if(!rows.length){const li=document.createElement('li');li.innerHTML='<span>—</span><div>Nog geen tijden op dit tempo.</div><strong>—</strong>';$('timesList').append(li)}
  rows.forEach((r,i)=>{const li=document.createElement('li');const rank=document.createElement('span');rank.textContent=String(i+1).padStart(2,'0');const name=document.createElement('div');name.textContent=r.name;const note=document.createElement('small');note.textContent=`${r.misses} ${r.misses===1?'misser':'missers'}`;name.append(note);const time=document.createElement('strong');time.textContent=clockText(r.ms);li.append(rank,name,time);$('timesList').append(li)});
  $('storageNote').textContent=persistent?'Tijden worden in deze browser bewaard.':'Tijden blijven alleen bewaard zolang deze pagina open is.'
}
document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{if(state!=='lobby')return;speed=Number(b.dataset.speed);duration=speed;document.querySelectorAll('[data-speed]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));setTimer(speed)});
$('start').onclick=startGame;
$('restart').onclick=()=>{if(groupMode){openGroupMenu();return}if(state==='lobby')return;stopGame();state='lobby';$('results').hidden=true;$('lobby').hidden=false};
$('again').onclick=()=>{stopGame();state='lobby';$('results').hidden=true;$('lobby').hidden=false;$('teamName').value='Duo '+(history.length+1)};
$('backLobby').onclick=()=>{stopGame();state='lobby';$('results').hidden=true;$('lobby').hidden=false};
$('showTimes').onclick=()=>{showTimes();$('results').hidden=false};
function toggleMute(){muted=!muted;$('mute').textContent=muted?'×':'♪';$('mute').setAttribute('aria-pressed',String(muted));$('lobbyMute').textContent=muted?'Geluid uit':'Geluid aan'}
$('mute').onclick=toggleMute;$('lobbyMute').onclick=toggleMute;
addEventListener('keydown',e=>{if(state!=='playing'||e.repeat||e.target.matches('input,select')||$('groupDialog').open)return;const i=Number(e.key)-1;if(i>=0&&i<3){e.preventDefault();$('choices').children[i]?.click()}});

// Group race controller. The server checks each answer and selects one winner.
const groupEscape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function groupActive(d=groupData){return d?.current&&d.member&&!d.member.left_at&&['waiting','running'].includes(d.current.status)}
function groupOwnTab(d=groupData){return d?.member?.tab_id===d?.tabId}
function groupNow(){return Date.now()+(groupData?.clockOffset||0)}
function openGroupMenu(){if(!$('groupDialog').open)$('groupDialog').showModal();renderGroupMenu();window.AxiomaGroups?.refresh()}
function renderGroupMenu(){
  const d=groupData,g=d?.current,active=groupActive(d),disabled=d?.pending||!d?.connected?'disabled':'';
  $('groupRanking').disabled=!d?.account||d?.pending;
  if(!d?.account){$('groupContent').innerHTML='<p>Log in op leraarBob om samen te spelen en in de ranglijst te komen.</p><a class="axiomaHome" href="../../../">Naar leraarBob →</a>';return}
  let html='<p>De eerste speler met <strong>7 juiste antwoorden achter elkaar</strong> wint. Bij een misser of een verlopen timer begin je opnieuw bij de eerste richting. Iedereen krijgt hetzelfde tempo.</p>';
  if(g&&g.id!==groupDismissed&&(active||g.status==='finished'||g.status==='cancelled')){
    html+=`<h3>${g.status==='finished'?groupEscape(g.winner_alias)+' wint!':g.status==='cancelled'?'Sessie gesloten':g.status==='running'?'De wedstrijd loopt':'Wachtkamer van '+groupEscape(g.host_alias)}</h3>`;
    html+=`<p>${g.speed} seconden per doel${g.elapsed_ms?' · winnende tijd '+clockText(g.elapsed_ms):''}</p>`;
    html+=d.members.map(m=>`<div class="groupRow"><div><strong>${groupEscape(m.alias)}</strong><small>${g.status==='finished'&&m.participated?'Afgerond':m.left_at?'Gestopt':m.online?'Online':'Verbinding onderbroken'}</small></div><span>${m.streak} / 7 · ${m.misses} missers</span></div>`).join('');
    if(active){
      html+='<div class="groupActions">';
      if(g.status==='waiting'&&g.host_id===d.account.id)html+=`<button class="primary" data-group-action="start" ${disabled||d.members.filter(m=>!m.left_at&&m.online).length<2?'disabled':''}>Start samen</button>`;
      else if(g.status==='waiting')html+='<span>De organisator start de wedstrijd.</span>';
      if(!groupOwnTab(d))html+='<p>Speel in het tabblad waarin je deelnam.</p>';
      html+=`<button class="utilityBtn" data-group-action="leave" ${disabled||!groupOwnTab(d)?'disabled':''}>Sessie verlaten</button></div>`;
    }else html+='<div class="groupActions"><button class="primary" data-group-action="new">Nieuwe groepswedstrijd</button></div>';
  }else{
    html+='<h3>Open sessies</h3>';
    html+=d.sessions.length?d.sessions.map(s=>`<div class="groupRow"><div><strong>${groupEscape(s.host_alias)}</strong><small>${s.player_count} spelers · ${s.speed} s per doel</small></div><button class="utilityBtn" data-group-action="join" data-id="${s.id}" ${disabled}>Meedoen</button></div>`).join(''):'<p>Er wacht nog geen groep. Start er zelf één.</p>';
    html+=`<div class="groupActions"><label for="groupSpeed">Tijd per doel</label><select id="groupSpeed"><option value="3">3 s</option><option value="5" selected>5 s</option><option value="8">8 s</option></select><button class="primary" data-group-action="create" ${disabled}>Sessie openen</button></div>`;
  }
  if($('groupContent').innerHTML!==html){
    const chosen=$('groupSpeed')?.value;$('groupContent').innerHTML=html;
    if(['3','5','8'].includes(chosen)&&$('groupSpeed'))$('groupSpeed').value=chosen;
  }
}
function updateGroup(d){
  groupData=d;
  const g=d.current;
  if(!d.account){if(groupMode){stopGame();groupMode=false;state='lobby';$('lobby').hidden=false}renderGroupMenu();return}
  if(groupActive(d)&&groupOwnTab(d)){
    if(groupSessionId!==g.id){stopGame();groupMode=true;groupSessionId=g.id;groupVersion=-1;groupRequest=null;state='groupwait';groupDismissed=null;$('groupRankSpeed').value=String(g.speed)}
    $('lobby').hidden=true;$('results').hidden=true;team=d.account.alias||'Leerkracht';duration=g.speed;
    if(g.status==='waiting'){
      if(groupPrompt!==g.id+':waiting'){groupPrompt=g.id+':waiting';if(!$('groupDialog').open)$('groupDialog').showModal()}
    }
    else if(state==='groupwait'&&d.connected){
      if(groupVersion<0&&$('groupDialog').open)$('groupDialog').close();
      scheduleGroupRound();
    }
  }else if(groupMode&&g?.id===groupSessionId&&['finished','cancelled'].includes(g.status)){
    stopGame();state='groupdone';groupMode=false;
    $('lobby').hidden=false;
    if(g.winner_id===d.account.id)trackAxiomaSeries();
    $('total').textContent=g.elapsed_ms?clockText(g.elapsed_ms):'—';
    if(g.id!==groupDismissed&&!$('groupDialog').open)$('groupDialog').showModal();
  }else if(groupMode&&d.member?.left_at){stopGame();groupMode=false;state='lobby';$('lobby').hidden=false}
  renderGroupMenu();
}
function scheduleGroupRound(){
  clearTimeout(groupNextTimer);
  if(!groupActive()||!groupOwnTab()||state!=='groupwait')return;
  const m=groupData.member,g=groupData.current;
  const delay=Math.max(0,Date.parse(m.next_at)-groupNow());
  if(delay>0){
    $('countdown').hidden=false;$('countNum').textContent=String(Math.max(1,Math.ceil(delay/1000)));
    groupNextTimer=setTimeout(scheduleGroupRound,Math.min(200,delay));return;
  }
  if(groupRequest){retryGroupAnswer();return}
  $('countdown').hidden=true;groupVersion=m.version;misses=m.misses;shots=m.version;
  mastered=new Set(rounds.slice(0,m.streak).map(r=>r.id));retry=[];queue=[rounds[m.streak].id];roundNo=1;
  started=performance.now()-Math.max(0,groupNow()-Date.parse(g.starts_at));
  beginAttempt();
  const remaining=Math.max(0,Date.parse(m.next_at)+g.speed*1000-groupNow());
  attempt.deadline=performance.now()+remaining;attempt.start=attempt.deadline-g.speed*1000;
  $('status').textContent=`${m.streak} / 7 foutloos · een misser start de reeks opnieuw.`;
  cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);
}
async function submitGroupAnswer(answer){
  if(!groupMode||state!=='playing'||busy||!attempt||attempt.resolved)return;
  busy=true;state='groupnetwork';$('choices').querySelectorAll('button').forEach(b=>b.disabled=true);
  groupRequest={sessionId:groupSessionId,answer,eventId:crypto.randomUUID(),version:groupVersion};
  await retryGroupAnswer();
}
async function retryGroupAnswer(){
  if(!groupRequest||!groupMode)return;state='groupnetwork';const packet=groupRequest;
  try{
    const result=await AxiomaGroups.answer(packet);
    if(!groupMode||groupRequest!==packet)return;
    if(!result||result.member?.last_event_id!==packet.eventId)throw Error('Antwoord wordt nog bevestigd.');
    groupRequest=null;
    if(result.current.status!=='running')return;
    const A=attempt;
    if(!A){state='groupwait';scheduleGroupRound();return}
    const correct=result.member.last_correct,now=performance.now(),future=targetAt(A,now+SHOT_MS);
    const value=packet.answer??0,radius=Math.hypot(future.x-500,future.y-310),sign=A.p.x>=500?1:-1,dx=sign*radius/Math.hypot(1,value);
    const end=correct?future:{x:500+dx,y:310-value*dx};
    A.shot={start:now,correct,end};wantedAngle=Math.atan2(end.y-310,end.x-500)*180/Math.PI;
    state='playing';setTimer(-1);sShot();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);
  }catch(error){
    if(!groupMode)return;state='groupwait';busy=false;$('status').textContent='Verbinding herstellen. Je antwoord blijft bewaard.';
    $('groupMessage').textContent=error.message;
    groupNextTimer=setTimeout(()=>{if(groupMode)AxiomaGroups.refresh()},1500);
  }
}
function finishGroupVisual(correct){
  const A=attempt;if(!A||A.resolved)return;A.resolved=true;state='gap';
  $('target').style.opacity='0';$('wake').style.opacity='0';resetProjectile();
  if(correct){mastered.add(A.id);burst(A.shot.end.x,A.shot.end.y);sHit()}
  else{mastered.clear();sMiss()}
  $('choices').querySelectorAll('button').forEach(b=>{b.classList.toggle(correct?'correct':'wrong',Number(b.dataset.a)===selected);b.disabled=true});
  updateHud();$('status').textContent=correct?'Raak. Verder naar de volgende richting.':'Mis of te laat. De volledige reeks begint opnieuw.';
  later(()=>{attempt=null;busy=false;state='groupwait';scheduleGroupRound()},correct?GAP_MS:650);
}
$('openGroup').onclick=openGroupMenu;$('groupMenu').onclick=openGroupMenu;$('groupClose').onclick=()=>$('groupDialog').close();
$('groupContent').onclick=async e=>{
  const b=e.target.closest('[data-group-action]');if(!b||b.disabled||!window.AxiomaGroups)return;
  const action=b.dataset.groupAction;$('groupMessage').textContent='';
  try{
    if(action==='new'){groupDismissed=groupData.current?.id;groupSessionId=null;groupMode=false;state='lobby';$('lobby').hidden=false;renderGroupMenu();return}
    if(action==='create')await AxiomaGroups.create(Number($('groupSpeed').value));
    if(action==='join')await AxiomaGroups.join(b.dataset.id);
    if(action==='start')await AxiomaGroups.start();
    if(action==='leave'){await AxiomaGroups.leave();stopGame();groupMode=false;groupSessionId=null;state='lobby';$('lobby').hidden=false;$('groupDialog').close()}
  }catch(error){$('groupMessage').textContent=error.message}
};
$('groupRanking').onclick=async()=>{
  $('groupRankingContent').textContent='Ranglijst laden…';
  try{
    const result=await AxiomaGroups.ranking(Number($('groupRankSpeed').value));
    const rows=result?.ranking||[];
    $('groupRankingContent').innerHTML=rows.length?`<table><thead><tr><th>#</th><th>Speler</th><th>Gewonnen</th><th>Beste tijd</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.user_id===groupData.account.id?'me':''}"><td>${r.rank}</td><td>${groupEscape(r.alias)}</td><td>${r.wins}</td><td>${clockText(r.best_ms)}</td></tr>`).join('')}</tbody></table>`:'<p>Nog geen groepswinnaars op dit tempo. De eerste overwinning komt meteen in de ranglijst.</p>';
  }catch(error){$('groupRankingContent').textContent=error.message}
};
function connectGroups(){
  if(!window.AxiomaGroups)return;
  AxiomaGroups.onChange(updateGroup);AxiomaGroups.ready().then(updateGroup);
  if(new URLSearchParams(location.search).has('group'))openGroupMenu();
}
if(window.AxiomaGroups)connectGroups();else window.addEventListener('axioma:groups-ready',connectGroups,{once:true});

initField();readHistory();updateHud();setTimer(speed);$('teamName').value='Duo '+(history.length+1);
})();
