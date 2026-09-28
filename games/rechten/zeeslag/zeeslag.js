(() => {
'use strict';
const GAME_ID = 'rechten-zeeslag';
const GRID_MIN=-4, GRID_MAX=4;
const ALLOWED_SLOPES=[
  {key:'-2',a:{n:-2,d:1},dx:1,dy:-2},
  {key:'-1',a:{n:-1,d:1},dx:1,dy:-1},
  {key:'-1/2',a:{n:-1,d:2},dx:2,dy:-1},
  {key:'0',a:{n:0,d:1},dx:1,dy:0},
  {key:'1/2',a:{n:1,d:2},dx:2,dy:1},
  {key:'1',a:{n:1,d:1},dx:1,dy:1},
  {key:'2',a:{n:2,d:1},dx:1,dy:2}
];
const B_VALUES=[-4,-3,-2,-1,0,1,2,3,4];
const SHIP_DEFS=[
  {name:'Kruiser',length:4},
  {name:'Fregat',length:3},
  {name:'Patrouille',length:2}
];
const $=s=>document.querySelector(s);
const supa = window.AxiomaAuth?.client() || null;

let resultRequest=null, settlementRequest=null, resultActionBusy=false;
const S={
  demo:false, me:null, profile:null, lobby:null, match:null, matchId:null, opponent:null, hostId:null,
  pendingOutgoing:null, incoming:null, players:new Map(), phase:'idle', ownFleet:[], demoEnemyFleet:[],
  placementStart:null, myShots:[], enemyShots:[], revealedEnemyShips:[], myReady:false, oppReady:false,
  myTurn:false, finished:false, resultReported:false, persistentRegistered:false, toastTimer:0, matchPresence:{}, aimA:{n:0,d:1}, aimB:{n:0,d:1}
};

// Presentation state stays local: never add animation fields to multiplayer payloads.
const V={epoch:0,busy:false,firing:false,ghost:null,drop:null,impact:null,revealing:new Set(),lastTurn:null,queue:Promise.resolve(),timers:new Set()};
const placement={editing:null,history:[]};
function placementDef(){return SHIP_DEFS.find(d=>placement.editing?d.name===placement.editing:!S.ownFleet.some(s=>s.name===d.name))}
function rememberFleet(){placement.history.push(cloneFleet(S.ownFleet));if(placement.history.length>50)placement.history.shift()}
function clearPlacement(){placement.editing=null;S.placementStart=null;V.ghost=null;V.drop=null}
function undoPlacement(){
  if(S.phase!=='placing'||S.myReady)return;
  if(!placement.editing&&!S.placementStart){if(placement.history.length)S.ownFleet=placement.history.pop();else S.ownFleet.pop()}
  clearPlacement();renderGameUI();renderBoards();
}
const motionReduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function later(fn,ms){const epoch=V.epoch;const timer=setTimeout(()=>{V.timers.delete(timer);if(epoch===V.epoch)fn()},ms);V.timers.add(timer);return timer}
function pause(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
function resetVisuals(){V.epoch++;clearTimeout(S.toastTimer);$('#toast').classList.remove('show');for(const timer of V.timers)clearTimeout(timer);V.timers.clear();V.busy=false;V.firing=false;V.ghost=null;V.drop=null;V.impact=null;V.revealing.clear();V.lastTurn=null;V.queue=Promise.resolve();document.querySelectorAll('.boardFeedback,.turnNotice').forEach(e=>e.remove());$('#aimComposer').classList.remove('firing')}
// Optional audio adapter: set window.axiomaNavalAudio.placeShip/fire/miss/hit/sunk.
// No audio is loaded or played by default; adapter errors cannot interrupt play.
function playSfx(name){try{const result=window.axiomaNavalAudio?.[name]?.();result?.catch?.(()=>{})}catch(err){console.warn('Audio hook:',name,err)}}
function sfxPlaceShip(){playSfx('placeShip')}function sfxFire(){playSfx('fire')}function sfxMiss(){playSfx('miss')}function sfxHit(){playSfx('hit')}function sfxSunk(){playSfx('sunk')}
function announceTurn(){
  if(S.phase!=='battle'||V.busy||S.finished)return;
  const turn=S.myTurn?'me':'opponent';if(V.lastTurn===turn)return;V.lastTurn=turn;
  document.querySelector('.turnNotice')?.remove();
  const el=document.createElement('div');el.className='turnNotice';el.setAttribute('role','status');el.textContent=S.myTurn?'JOUW BEURT':`${S.opponent?.alias||'Tegenstander'} IS AAN ZET`.toLocaleUpperCase('nl');$('#gameScreen').append(el);later(()=>el.remove(),950);
}
function boardFeedback(incoming,text,kind='',detail=''){
  const frame=$(incoming?'#ownBoard':'#attackBoard').parentElement;frame.querySelector('.boardFeedback')?.remove();
  const el=document.createElement('div');el.className='boardFeedback '+kind;el.setAttribute('role','status');el.textContent=text;if(detail){const small=document.createElement('small');small.textContent=detail;el.append(small)}frame.append(el);return el;
}
function enqueueVisual(task){const epoch=V.epoch;V.queue=V.queue.then(async()=>{if(epoch===V.epoch&&!S.finished)await task(epoch)}).catch(err=>console.error('Shot presentation:',err));return V.queue}
async function presentShot(shot,result,incoming,epoch){
  const current=()=>epoch===V.epoch&&!S.finished&&S.phase==='battle';if(!current())return false;
  V.busy=true;if(incoming){V.firing=false;shot.visual='sweep';shot.started=performance.now();sfxFire();renderGameUI();renderBoards()}
  await pause(Math.max(0,(motionReduced()?30:500)-(performance.now()-shot.started)));if(!current())return false;
  shot.visual='complete';shot.result=result;shot.presented=true;V.impact=shot.id;
  result.points?.length?sfxHit():sfxMiss();renderBoards();
  let feedback=boardFeedback(incoming,result.points?.length?'RAAK':'MIS',result.points?.length?'hit':'');
  await pause(motionReduced()?120:520);if(!current())return false;
  V.impact=null;
  if(result.sunk?.length){
    if(!incoming)for(const ship of result.sunk){if(!S.revealedEnemyShips.some(s=>s.name===ship.name))S.revealedEnemyShips.push({name:ship.name,cells:ship.cells});V.revealing.add(ship.name)}
    renderBoards();sfxSunk();feedback=boardFeedback(incoming,'GEZONKEN','sunk',result.sunk.map(s=>s.name).join(' · '));
    await pause(motionReduced()?160:700);if(!current())return false;V.revealing.clear();
  }
  if(result.points?.length&&!result.allSunk){feedback=boardFeedback(incoming,result.sunk?.length?'GEZONKEN':'RAAK',result.sunk?.length?'sunk':'hit',incoming?'Tegenstander schiet opnieuw':'Nog een schot.');later(()=>feedback.remove(),1100)}else later(()=>feedback.remove(),450);
  V.busy=false;V.firing=false;$('#aimComposer').classList.remove('firing');renderBoards();return true;
}
function chooseGhost(p){
  if(S.phase!=='placing'||S.myReady||!S.placementStart)return;
  const candidate=p?placementCandidates(S.placementStart,placementDef()).find(c=>cellKey(c.end)===cellKey(p)):null;
  if(cellKey(candidate?.end||{})===cellKey(V.ghost?.end||{}))return;
  V.ghost=candidate||null;renderGameUI();renderBoards();
}
function confirmPlacement(){
  const def=placementDef();if(S.phase!=='placing'||S.myReady||!def||!V.ghost)return;
  const candidate=placementCandidates(S.placementStart,def).find(c=>cellKey(c.end)===cellKey(V.ghost.end));if(!candidate)return;
  rememberFleet();
  const ship={name:def.name,length:def.length,cells:candidate.cells,hits:new Set()},index=S.ownFleet.findIndex(s=>s.name===def.name);
  if(index<0)S.ownFleet.push(ship);else S.ownFleet[index]=ship;
  clearPlacement();V.drop=ship;sfxPlaceShip();renderGameUI();renderBoards();later(()=>{if(V.drop===ship){V.drop=null;$('#ownBoard .dropShip')?.classList.remove('dropShip')}},350);
}

function showScreen(id){document.querySelectorAll('.screen').forEach(x=>x.classList.toggle('active',x.id===id));}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(S.toastTimer);S.toastTimer=setTimeout(()=>el.classList.remove('show'),2200)}
function setConnection(text,kind=''){ $('#connText').textContent=text; $('#connDot').className='dot '+kind; }
function escapeHtml(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function uuid(){return (crypto.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)}))}
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=a%b;a=b;b=t}return a||1}
function normFrac(n,d=1){if(!Number.isFinite(n)||!Number.isFinite(d)||d===0)return null;if(d<0){n=-n;d=-d}const g=gcd(Math.round(n),Math.round(d));return {n:Math.round(n/g),d:Math.round(d/g)}}
function parseFrac(raw,allowBlankZero=false){let s=String(raw??'').trim().replace(/[−–—]/g,'-').replace(',','.');if(!s&&allowBlankZero)return {n:0,d:1};if(!s)return null;
  if(/^[-+]?\d+\/[-+]?\d+$/.test(s)){const [a,b]=s.split('/').map(Number);return normFrac(a,b)}
  if(/^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(s)){
    if(s.includes('.')){const neg=s.startsWith('-');const t=s.replace(/^[-+]/,'');const [w,f='']=t.split('.');const d=10**f.length;const n=(Number(w||0)*d+Number(f||0))*(neg?-1:1);return normFrac(n,d)}
    return normFrac(Number(s),1)
  }
  return null;
}
function fracStr(f){if(!f)return '?';if(f.d===1)return String(f.n).replace('-','−');if(f.d===2&&Math.abs(f.n)===1)return (f.n<0?'−':'')+'½';return `${String(f.n).replace('-','−')}/${f.d}`}
function fracHtml(f,absolute=false){if(!f)return '?';let n=absolute?Math.abs(f.n):f.n;if(f.d===1)return String(n).replace('-','−');const sign=n<0?'−':'';n=Math.abs(n);return `${sign}<span class="frac"><span class="num">${n}</span><span class="den">${f.d}</span></span>`}
function lineKey(a,b){return `${a.n}/${a.d}|${b.n}/${b.d}`}
function formulaStr(a,b){if(a.n===0)return b.n===0?'y = 0':`y = ${fracStr(b)}`;let aTxt='';if(a.n===1&&a.d===1)aTxt='';else if(a.n===-1&&a.d===1)aTxt='−';else aTxt=fracStr(a);let out=`y = ${aTxt}x`;if(b.n>0)out+=` + ${fracStr(b)}`;else if(b.n<0)out+=` − ${fracStr({n:-b.n,d:b.d})}`;return out}
function formulaHtml(a,b){if(a.n===0)return b.n===0?'y = 0':`y = ${fracHtml(b)}`;let aTxt='';if(a.n===1&&a.d===1)aTxt='';else if(a.n===-1&&a.d===1)aTxt='−';else aTxt=fracHtml(a);let out=`y = ${aTxt}x`;if(b.n>0)out+=` + ${fracHtml(b,true)}`;else if(b.n<0)out+=` − ${fracHtml(b,true)}`;return out}
function slopeAllowed(a){return ALLOWED_SLOPES.some(s=>s.a.n===a.n&&s.a.d===a.d)}
function slopeIndex(a=S.aimA){const i=ALLOWED_SLOPES.findIndex(s=>s.a.n===a.n&&s.a.d===a.d);return i<0?3:i}
function shiftAimA(dir){if(S.phase!=='battle'||!S.myTurn||S.finished||V.busy)return;const i=Math.max(0,Math.min(ALLOWED_SLOPES.length-1,slopeIndex()+dir));S.aimA={...ALLOWED_SLOPES[i].a};refreshAimUI()}
function shiftAimB(dir){if(S.phase!=='battle'||!S.myTurn||S.finished||V.busy)return;const v=Math.max(-4,Math.min(4,S.aimB.n+dir));S.aimB={n:v,d:1};refreshAimUI()}
function refreshAimUI(){
  const off=S.phase!=='battle'||!S.myTurn||S.finished||V.busy||(!S.demo&&(!S.connected||!S.opponentConnected));
  const aVal=$('#aValue'),bVal=$('#bValue'),bSign=$('#bSign');
  if(aVal)aVal.innerHTML=fracHtml(S.aimA);
  if(bVal)bVal.textContent=String(Math.abs(S.aimB.n));
  if(bSign)bSign.textContent=S.aimB.n<0?'−':'+';
  if($('#aUpBtn'))$('#aUpBtn').disabled=off||slopeIndex()===ALLOWED_SLOPES.length-1;
  if($('#aDownBtn'))$('#aDownBtn').disabled=off||slopeIndex()===0;
  if($('#bUpBtn'))$('#bUpBtn').disabled=off||S.aimB.n>=4;
  if($('#bDownBtn'))$('#bDownBtn').disabled=off||S.aimB.n<=-4;
  if($('#fireBtn'))$('#fireBtn').disabled=off;
}
function exactY(a,b,x){const den=a.d*b.d;const num=a.n*x*b.d+b.n*a.d;return {num,den}}
function onLine(a,b,p){const y=exactY(a,b,p.x);return y.num===p.y*y.den}
function interceptAt(a,p){return normFrac(p.y*a.d-a.n*p.x,a.d)}
function shootableIntercept(a,p){const b=interceptAt(a,p);return b&&b.d===1&&b.n>=-4&&b.n<=4}
function cellKey(p){return `${p.x},${p.y}`}
function cloneFleet(f){return f.map(s=>({name:s.name,length:s.length,cells:s.cells.map(p=>({...p})),hits:new Set([...s.hits||[]])}))}
function allSunk(f){return f.length===SHIP_DEFS.length&&f.every(s=>s.cells.every(p=>s.hits.has(cellKey(p))))}

function gridPointToSvg(p){const m=48, span=424, step=span/8;return {x:m+(p.x-GRID_MIN)*step,y:m+(GRID_MAX-p.y)*step}}
function svgToGrid(evt,svg){const pt=svg.createSVGPoint();pt.x=evt.clientX;pt.y=evt.clientY;const local=pt.matrixTransform(svg.getScreenCTM().inverse());const m=48,span=424,step=span/8;const x=Math.round((local.x-m)/step)+GRID_MIN;const y=GRID_MAX-Math.round((local.y-m)/step);if(x<GRID_MIN||x>GRID_MAX||y<GRID_MIN||y>GRID_MAX)return null;return {x,y}}
function lineSegment(a,b){
  const pts=[]; const add=(x,y)=>{if(x>=GRID_MIN-1e-9&&x<=GRID_MAX+1e-9&&y>=GRID_MIN-1e-9&&y<=GRID_MAX+1e-9&&!pts.some(p=>Math.abs(p.x-x)<1e-8&&Math.abs(p.y-y)<1e-8))pts.push({x,y})};
  const av=a.n/a.d,bv=b.n/b.d; add(GRID_MIN,av*GRID_MIN+bv); add(GRID_MAX,av*GRID_MAX+bv);
  if(Math.abs(av)>1e-12){add((GRID_MIN-bv)/av,GRID_MIN);add((GRID_MAX-bv)/av,GRID_MAX)}
  return pts.slice(0,2);
}
function logicalToSvgFloat(p){const m=48,span=424,step=span/8;return {x:m+(p.x-GRID_MIN)*step,y:m+(GRID_MAX-p.y)*step}}

function placementCandidates(start,def){if(!start||!def)return[];const occupied=new Set(S.ownFleet.filter(s=>s.name!==placement.editing).flatMap(s=>s.cells.map(cellKey))),out=[];for(const sl of ALLOWED_SLOPES){if(!shootableIntercept(sl.a,start))continue;for(const sign of [-1,1]){const sx=sl.dx*sign,sy=sl.dy*sign;const cells=Array.from({length:def.length},(_,i)=>({x:start.x+i*sx,y:start.y+i*sy}));if(cells.some(p=>p.x<GRID_MIN||p.x>GRID_MAX||p.y<GRID_MIN||p.y>GRID_MAX||occupied.has(cellKey(p))))continue;out.push({end:cells[cells.length-1],cells,slope:sl.a})}}return out}
function baseGridSvg(interactive=false,radar=false){
  const id=radar?'radar':'fleet';
  let h=`<defs><pattern id="${id}Water" width="40" height="24" patternUnits="userSpaceOnUse"><path d="M0 12 Q10 8 20 12 T40 12" fill="none" stroke="#6f9a9c" stroke-opacity=".065"/></pattern></defs><rect x="2" y="2" width="516" height="516" rx="12" fill="${radar?'#e4eef0':'#e6efea'}" stroke="#627d82" stroke-width="2"/><rect x="10" y="10" width="500" height="500" rx="6" fill="url(#${id}Water)" stroke="#9fb8b5" stroke-opacity=".6"/>`;
  if(radar)h+='<g fill="none" stroke="#789ba7" stroke-opacity=".085"><circle cx="260" cy="260" r="100"/><circle cx="260" cy="260" r="200"/></g>';
  const m=48,span=424,step=span/8;
  for(let i=0;i<9;i++){const pos=m+i*step,axis=i===4;h+=`<path d="M${m} ${pos}H${m+span} M${pos} ${m}V${m+span}" fill="none" stroke="${axis?'#405e6a':'#9ab0b7'}" stroke-width="${axis?2.2:.85}" opacity="${axis?1:.65}"/>`}
  h+='<path d="M466 256 L473 260 L466 264 M256 54 L260 47 L264 54" fill="none" stroke="#405e6a" stroke-width="2"/><circle cx="260" cy="260" r="8" fill="none" stroke="#987839" stroke-width="1.5" opacity=".7"/>';
  for(let v=-4;v<=4;v++){const px=m+(v+4)*step,py=m+(4-v)*step,label=String(v).replace('-','−');h+=`<text class="axisLabel" x="${px}" y="497" text-anchor="middle">${label}</text><text class="axisLabel" x="26" y="${py+5}" text-anchor="middle">${label}</text>`}
  h+='<text class="axisName" x="484" y="266">x</text><text class="axisName" x="255" y="32">y</text><text x="273" y="280" font-size="13" fill="#786431" style="paint-order:stroke;stroke:#e6efea;stroke-width:3">O</text>';
  for(let x=-4;x<=4;x++)for(let y=-4;y<=4;y++){const p=gridPointToSvg({x,y});h+=`<circle class="gridPoint" cx="${p.x}" cy="${p.y}" r="2.5"/>`;if(interactive)h+=`<circle data-grid="${x},${y}" cx="${p.x}" cy="${p.y}" r="21" fill="transparent"/>`}
  return h;
}
function shotSvg(shot,ownBoard=false,age=0){
  if(shot.visual==='queued')return '';
  const seg=lineSegment(shot.a,shot.b);if(seg.length<2)return '';
  const p1=logicalToSvgFloat(seg[0]),p2=logicalToSvgFloat(seg[1]);
  return `<line class="shotLine ${shot.visual==='sweep'?'shotSweep':''}" data-shot="${escapeHtml(shot.id)}" pathLength="1" x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${ownBoard?'#526c79':'#294f66'}" stroke-width="${age===0?3:age===1?2:1.3}" opacity="${age===0?.94:age===1?.36:.14}" stroke-linecap="round"/>`;
}
function shipSvg(ship,enemy=false,mode=''){
  if(!ship.cells?.length)return '';
  const pts=ship.cells.map(gridPointToSvg),first=pts[0],last=pts[pts.length-1],length=Math.hypot(last.x-first.x,last.y-first.y),angle=Math.atan2(last.y-first.y,last.x-first.x)*180/Math.PI;
  const reveal=mode==='reveal';
  const hull=`<path class="shipHull" d="M-10 -7 Q-13 0 -10 7 Q${length*.45} 13 ${length-6} 8 Q${length+8} 4 ${length+14} 0 Q${length+8} -4 ${length-6} -8 Q${length*.45} -13 -10 -7 Z"/><path class="shipDeck" d="M3 0 H${length-6}" fill="none"/>`;
  let body=hull;
  if(reveal){
    // Fade adjacent hull sections in order, in the ship's own rotated coordinates.
    // The complete damaged hull is rendered after the short reveal finishes.
    const step=length/(pts.length-1),id=`reveal${first.x}_${first.y}_${pts.length}`;
    body=pts.map((_,i)=>{const left=i===0?-15:(i-.5)*step,right=i===pts.length-1?length+15:(i+.5)*step;return `<defs><clipPath id="${id}_${i}"><rect x="${left}" y="-14" width="${right-left}" height="28"/></clipPath></defs><g clip-path="url(#${id}_${i})"><g class="revealHull" style="animation-delay:${i*85}ms">${hull}</g></g>`}).join('');
  }
  let h=`<g class="ship ${enemy?'enemyShip':''} ${mode==='ghost'?'ghostShip':''} ${mode==='editing'?'editingShip':''} ${mode==='drop'?'dropShip':''}" data-ship="${escapeHtml(ship.name||'preview')}"><g transform="translate(${first.x} ${first.y}) rotate(${angle})">${body}</g>`;
  for(const [i,p] of pts.entries())h+=`<circle class="shipNode ${reveal?'revealNode':''}" style="--delay:${i*85}ms" cx="${p.x}" cy="${p.y}" r="5"/>`;
  return h+'</g>';
}
function hitSvg(p,enemy=false,animate=false){const q=gridPointToSvg(p);return `<g class="hitMarker">${animate?`<circle class="impactRing" cx="${q.x}" cy="${q.y}" r="14"/>`:''}<g class="${animate?'impactDot':''}"><circle cx="${q.x}" cy="${q.y}" r="10" fill="#b75e42" stroke="#fae6cf" stroke-width="2"/><path d="M${q.x-3.5} ${q.y-3.5}L${q.x+3.5} ${q.y+3.5}M${q.x+3.5} ${q.y-3.5}L${q.x-3.5} ${q.y+3.5}" stroke="#fff9eb" stroke-width="2" stroke-linecap="round"/></g></g>`}
function missSvg(p,animate=false){const q=gridPointToSvg(p);return `<g class="missMarker">${animate?`<circle class="splashRing" cx="${q.x}" cy="${q.y}" r="11"/>`:''}<circle cx="${q.x}" cy="${q.y}" r="6" fill="#e4edf0" stroke="#85a4b1" stroke-width="1.5"/><circle cx="${q.x}" cy="${q.y}" r="1.8" fill="#85a4b1"/></g>`}
function shotPoints(shot){const out=[];for(let x=-4;x<=4;x++)for(let y=-4;y<=4;y++)if(onLine(shot.a,shot.b,{x,y}))out.push({x,y});return out}
function markersSvg(shots){
  const hits=new Map(),misses=new Map();
  for(const shot of shots){if(!shot.presented)continue;const animate=shot.id===V.impact;
    for(const p of shotPoints(shot))if(!misses.has(cellKey(p)))misses.set(cellKey(p),{p,animate});
    for(const p of shot.result?.points||[])hits.set(cellKey(p),{p,animate});
  }
  return [...misses].filter(([k])=>!hits.has(k)).map(([,v])=>missSvg(v.p,v.animate)).join('')+[...hits.values()].map(v=>hitSvg(v.p,false,v.animate)).join('');
}
function placementOptionsSvg(){if(S.phase!=='placing'||S.myReady||!S.placementStart)return '';return placementCandidates(S.placementStart,placementDef()).map(c=>{const p=gridPointToSvg(c.end);return `<circle class="candidate ${cellKey(c.end)===cellKey(V.ghost?.end||{})?'selected':''}" cx="${p.x}" cy="${p.y}" r="12"/>`}).join('')}
function aimPreviewSvg(){return ''} // Deliberately empty: geometry is disclosed only by VUUR.
function renderBoards(){
  const own=$('#ownBoard'),atk=$('#attackBoard'),enemyShots=S.enemyShots.filter(s=>s.visual!=='queued'),myShots=S.myShots.filter(s=>s.visual!=='queued');
  own.innerHTML=baseGridSvg(S.phase==='placing'&&!S.myReady)+enemyShots.map((s,i)=>shotSvg(s,true,enemyShots.length-1-i)).join('')+S.ownFleet.map(s=>shipSvg(s,false,s.name===placement.editing?'editing':V.drop===s?'drop':'')).join('')+(V.ghost?shipSvg(V.ghost,false,'ghost'):'')+placementOptionsSvg()+markersSvg(enemyShots);
  if(S.phase==='placing'&&S.placementStart&&!S.myReady){const p=gridPointToSvg(S.placementStart);own.insertAdjacentHTML('beforeend',`<circle class="startPulse" cx="${p.x}" cy="${p.y}" r="16" fill="none" stroke="#987839" stroke-width="2.5"/><circle cx="${p.x}" cy="${p.y}" r="4" fill="#987839"/>`)}
  atk.innerHTML=baseGridSvg(false,true)+myShots.map((s,i)=>shotSvg(s,false,myShots.length-1-i)).join('')+S.revealedEnemyShips.map(s=>shipSvg(s,true,V.revealing.has(s.name)?'reveal':'')).join('')+markersSvg(myShots);
  renderHistories();
}
function renderHistories(){
  const history=(shots,empty)=>shots.length?[...shots].reverse().filter(s=>s.visual!=='queued').map(s=>`<span class="historyShot">${formulaHtml(s.a,s.b)}${s.presented?(s.result?.points?.length?' · raak':' · mis'):''}</span>`).join(''):empty;
  $('#myHistory').innerHTML=history(S.myShots,'Radar gereed · de vijandelijke vloot is verborgen.');
  $('#enemyHistory').innerHTML=history(S.enemyShots,'Verdedigingszone · jouw schepen zijn alleen voor jou zichtbaar.');
}

function resetGameState(){clearPlacement();placement.history=[];resetVisuals();S.lastShot=null;S.phase='placing';S.ownFleet=[];S.demoEnemyFleet=[];S.placementStart=null;S.myShots=[];S.enemyShots=[];S.revealedEnemyShips=[];S.myReady=false;S.oppReady=false;S.myTurn=false;S.finished=false;S.resultReported=false;S.winnerId=null;S.resultTitle='';S.resultMessage='';S.aimA={n:0,d:1};S.aimB={n:0,d:1};renderGameUI();renderBoards()}
function renderGameUI(){
  saveMatch();
  renderMatchResult();
  $('#meName').textContent=S.profile?.alias||'Jij'; $('#opponentName').textContent=S.opponent?.alias||'Tegenstander';
  const placed=S.ownFleet.length,def=placementDef();
  const attacking=S.phase==='battle'&&(S.myTurn||V.firing)&&!S.finished;
  $('#ownBoard').toggleAttribute('hidden',attacking);
  $('#aimComposer').hidden=!attacking;
  $('#leftBoardTitle').textContent=attacking?'Aanvalconsole':'Jouw vloot';
  $('#ownBoardSub').textContent=attacking?(V.firing?'schot vastgelegd':'jij bepaalt de koers'):'jouw verdedigingszone';
  $('#bottomBar')?.toggleAttribute('hidden',S.phase!=='placing');
  $('#fleetCount').innerHTML=`${placed} / 3<small>schepen geplaatst</small>`;
  if(S.phase==='placing'){
    $('#placementBar').hidden=false;$('#attackBoardSub').textContent='vijandelijke vloot verborgen';
    if(def){$('#placeTitle').textContent=`${def.name} · ${def.length} punten${placement.editing?' · verplaatsen':''}`;$('#placeHint').textContent=S.placementStart?`Beginpunt (${S.placementStart.x}, ${S.placementStart.y}). Klik op een blauw eindpunt om te plaatsen.`:placement.editing?'Kies een nieuw beginpunt en eindpunt. Ongedaan maken zet je schip terug.':'Klik een beginpunt, daarna een blauw eindpunt. Volgend schip gaat automatisch.'}
    else{$('#placeTitle').textContent='Vloot geplaatst';$('#placeHint').textContent=S.myReady?(S.oppReady?'Beide vloten klaar.':'Wachten op tegenstander…'):'Klik op een schip om het te verplaatsen, of kies Vloot klaar.'}
    $('#undoShipBtn').disabled=(!placed&&!placement.history.length&&!S.placementStart&&!placement.editing)||S.myReady;$('#clearFleetBtn').disabled=placed===0||S.myReady;$('#readyBtn').disabled=placed!==SHIP_DEFS.length||!!placement.editing||S.myReady;
    $('#readyBtn').textContent=S.myReady?'KLAAR ✓':'VLOOT KLAAR';
    setTurnPill(S.myReady?(S.oppReady?'Starten…':'Wachten op tegenstander…'):'Vloot plaatsen','');
    $('#enemyHistory').textContent='Tegenstander heeft nog niet geschoten.';
  }else if(S.phase==='battle'){
    $('#placementBar').hidden=true;$('#attackBoardSub').textContent=attacking?'je rechte verschijnt pas na VUUR':'vijandelijke vloot verborgen';
    setTurnPill(V.busy?(V.firing?'Schot onderweg…':'Inkomend schot…'):S.myTurn?'Jouw beurt':`${S.opponent?.alias||'Tegenstander'} is aan zet`,S.myTurn?'mine':'');
    renderHistories();
  }else if(S.phase==='over'){
    $('#placementBar').hidden=true;$('#attackBoardSub').textContent='partij afgelopen';
    renderHistories();
  }
  if(!S.demo&&S.phase==='battle'&&(!S.connected||!S.opponentConnected))setTurnPill('Wachten op verbinding met tegenstander…');
  refreshAimUI();announceTurn();
}
function setTurnPill(text,cls=''){const e=$('#turnPill');e.textContent=text;e.className='turnPill '+cls}
function placeAt(p,shipName){
  if(S.phase!=='placing'||S.myReady)return;
  const ship=S.ownFleet.find(s=>s.name!==placement.editing&&(s.name===shipName||s.cells.some(c=>cellKey(c)===cellKey(p))));
  if(ship){clearPlacement();placement.editing=ship.name;renderGameUI();renderBoards();return}
  const def=placementDef();if(!def)return;
  if(!S.placementStart){
    if(!placementCandidates(p,def).length){toast('Vanaf dit punt past dit schip niet. Kies een ander beginpunt.');return}
    S.placementStart=p;V.ghost=null;renderGameUI();renderBoards();return;
  }
  if(cellKey(p)===cellKey(S.placementStart)){S.placementStart=null;V.ghost=null;renderGameUI();renderBoards();return}
  const candidate=placementCandidates(S.placementStart,def).find(c=>cellKey(c.end)===cellKey(p));
  if(!candidate){toast('Kies een blauw eindpunt: helling −2, −1, −½, 0, ½, 1 of 2.');return}
  V.ghost=candidate;confirmPlacement();
}
function updateMatchPresence(){if(S.demo||!S.match)return;return S.match.track({user_id:S.me.id,alias:S.profile.alias,ready:S.myReady,phase:S.phase,ts:Date.now()}).catch(()=>{})}
function deriveOppReady(){if(S.demo)return;const st=S.match?.presenceState?.()||{};let ready=false;S.opponentConnected=false;Object.values(st).flat().forEach(x=>{if(x.user_id===S.opponent?.id){ready=!!x.ready;S.opponentConnected=true}});S.oppReady=ready;if(S.phase==='placing'&&S.myReady&&S.oppReady)startBattle();renderGameUI()}
function startBattle(){if(S.phase==='battle'||S.finished)return;S.phase='battle';S.myTurn=S.me.id===S.hostId;updateMatchPresence();renderGameUI();renderBoards();}
function markLobbyStatus(){ /* Availability is managed by the shared platform service. */ }

function resolveShot(fleet,a,b){const hitPoints=[];const sunk=[];
  for(const ship of fleet){for(const p of ship.cells){const k=cellKey(p);if(onLine(a,b,p)&&!ship.hits.has(k)){ship.hits.add(k);hitPoints.push({...p})}}
    if(ship.cells.length&&ship.cells.every(p=>ship.hits.has(cellKey(p)))&&!ship._reported){ship._reported=true;sunk.push({name:ship.name,cells:ship.cells.map(p=>({...p}))})}
  }
  return {points:hitPoints,sunk,allSunk:allSunk(fleet)};
}
function applyMyShotResult(shot,result){
  if(shot._presenting||shot.presented||!S.myShots.includes(shot)||S.finished)return;
  shot._presenting=true;
  return enqueueVisual(async epoch=>{
    if(!await presentShot(shot,result,false,epoch))return;
    if(result.allSunk){finishGame(true);return}
    S.myTurn=!!result.points?.length;V.lastTurn=null;renderGameUI();
    if(!S.myTurn&&S.demo)later(demoBotTurn,1000);
  });
}
async function fire(){
  if(!S.myTurn||S.phase!=='battle'||S.finished||V.busy||(!S.demo&&(!S.connected||!S.opponentConnected)))return;
  const a={...S.aimA},b={...S.aimB};if(!slopeAllowed(a)){toast('Kies een geldige richting.');return}if(b.d!==1||b.n<-4||b.n>4){toast('Kies b tussen −4 en 4.');return}
  const key=lineKey(a,b);if(S.myShots.some(s=>s.key===key)){toast('Die rechte heb je al gebruikt. Schuif de rechte of kies een andere richting.');return}
  const shot={id:uuid(),a,b,key,result:null,visual:'sweep',started:performance.now()};S.myShots.push(shot);S.myTurn=false;V.busy=true;V.firing=true;
  S.lastShot={id:shot.id,incoming:false};
  document.querySelector('.turnNotice')?.remove();sfxFire();$('#aimComposer').classList.add('firing');renderGameUI();renderBoards();
  const epoch=V.epoch;
  later(()=>{shot.visual='complete';document.querySelectorAll('.shotSweep').forEach(el=>el.classList.remove('shotSweep'))},500);
  if(S.demo){applyMyShotResult(shot,resolveShot(S.demoEnemyFleet,a,b));return}
  try{
    const status=await S.match.send({type:'broadcast',event:'shot',payload:{shot_id:shot.id,from:S.me.id,a,b,key}});
    if(status!=='ok'&&epoch===V.epoch&&!shot._presenting)toast('Geen verzendbevestiging. Wachten op de tegenstander…');
  }catch(err){if(epoch===V.epoch){console.error(err);toast('Schot kon niet worden bevestigd. Controleer je verbinding.')}}
}
function presentIncomingShot(shot,result){
  return enqueueVisual(async epoch=>{
    if(!await presentShot(shot,result,true,epoch))return;
    if(result.allSunk){finishGame(false);return}
    S.myTurn=result.points.length===0;V.lastTurn=null;renderGameUI();
    if(S.demo&&!S.myTurn)later(demoBotTurn,1000);
  });
}
function validAim(a,b){return a&&b&&Number.isInteger(a.n)&&Number.isInteger(a.d)&&ALLOWED_SLOPES.some(s=>s.a.n===a.n&&s.a.d===a.d)&&b.d===1&&Number.isInteger(b.n)&&b.n>=-4&&b.n<=4}
function validResult(r){const point=p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=-4&&p.x<=4&&p.y>=-4&&p.y<=4;return r&&typeof r.allSunk==='boolean'&&Array.isArray(r.points)&&r.points.length<=9&&r.points.every(point)&&Array.isArray(r.sunk)&&r.sunk.length<=3&&r.sunk.every(s=>typeof s.name==='string'&&Array.isArray(s.cells)&&s.cells.length<=4&&s.cells.every(point))}
function handleIncomingShot(p){
  if(!p||p.from!==S.opponent?.id||!validAim(p.a,p.b)||typeof p.shot_id!=='string')return;
  const previous=S.enemyShots.find(s=>s.id===p.shot_id);
  if(previous){S.match.send({type:'broadcast',event:'shot_result',payload:{shot_id:p.shot_id,to:p.from,from:S.me.id,result:previous.result}}).catch(()=>{});return}
  if(S.phase!=='battle'||S.myTurn||S.finished||S.enemyShots.some(s=>s.key===lineKey(p.a,p.b)))return;
  const a=p.a,b=p.b,result=resolveShot(S.ownFleet,a,b),shot={id:p.shot_id,a,b,key:lineKey(a,b),result,visual:'queued'};S.enemyShots.push(shot);
  S.lastShot={id:shot.id,incoming:true};
  saveMatch();
  S.match.send({type:'broadcast',event:'shot_result',payload:{shot_id:p.shot_id,to:p.from,from:S.me.id,result}}).catch(()=>{});
  presentIncomingShot(shot,result);
}
async function registerPersistentMatch(){
  if(S.demo||!supa||!S.matchId||!S.me?.id||!S.opponent?.id)return false;
  // Rankings contain student profiles; teacher practice matches are unranked.
  if(!S.profile.class_code||!S.players.get(S.opponent.id)?.class_code){S.unranked=true;return false}
  S.unranked=false;
  try{
    const player1=S.hostId;const player2=S.hostId===S.me.id?S.opponent.id:S.me.id;
    const {error}=await supa.rpc('axioma_register_multiplayer_match',{p_match_id:S.matchId,p_game_id:GAME_ID,p_player1_id:player1,p_player2_id:player2});
    if(error)throw error;S.persistentRegistered=true;return true;
  }catch(err){console.error('match registration failed',err);return false}
}
function renderMatchResult(){
  const over=S.phase==='over';
  $('#matchResult').hidden=!over;
  $('#leaveBtn').textContent=over?'← Beëindigen':S.phase==='battle'?'← Opgeven':'← Partij verlaten';
  if(!over)return;
  $('#matchResultTitle').textContent=S.resultTitle||'Partij afgelopen';
  $('#matchResultText').textContent=S.demo?'Speel nog een keer tegen de computer, of beëindig de partij.':'Opnieuw stuurt een nieuwe uitnodiging naar '+(S.opponent?.alias||'je tegenstander')+'. De ander kiest of die de revanche accepteert.';
  $('#matchResultStatus').textContent=S.resultMessage||'';
  $('#rematchBtn').disabled=$('#endMatchBtn').disabled=!!settlementRequest||resultActionBusy;
}
async function submitMatchResult(winnerId){
  if(resultRequest)return resultRequest;
  if(S.demo||S.unranked||S.resultReported||!winnerId)return true;
  if(!supa||!S.matchId)return false;
  resultRequest=(async()=>{
    try{
      if(!S.persistentRegistered&&!await registerPersistentMatch()){
        if(S.unranked)return true;
        throw Error('Partij kon niet geregistreerd worden.');
      }
      const {error}=await supa.rpc('axioma_report_multiplayer_result',{p_match_id:S.matchId,p_winner_id:winnerId});
      if(error)throw error;S.resultReported=true;saveMatch();return true;
    }catch(err){console.error('result report failed',err);return false}
    finally{resultRequest=null}
  })();
  return resultRequest;
}
async function settleMatch(){
  if(settlementRequest)return settlementRequest;
  if(S.demo)return true;
  S.resultMessage='Partij afronden…';
  settlementRequest=(async()=>{
    try{
      if(!await submitMatchResult(S.winnerId))throw Error('De uitslag kon nog niet worden opgeslagen.');
      await AxiomaSocial.finish();
      S.resultMessage='Partij afgerond. Je bent weer beschikbaar voor een nieuw spel.';
      return true;
    }catch(error){S.resultMessage=error.message+' Klik opnieuw op Opnieuw of Beëindigen om het nog eens te proberen.';return false}
    finally{settlementRequest=null;renderMatchResult()}
  })();
  renderMatchResult();
  return settlementRequest;
}
function finishGame(won,forfeit=false){
  const wasBattle=S.phase==='battle';
  resetVisuals();S.finished=true;S.phase='over';S.myTurn=false;
  S.winnerId=forfeit&&!wasBattle?null:won?S.me?.id:S.opponent?.id;
  S.resultTitle=forfeit?'Tegenstander heeft de partij verlaten':won?'Gewonnen!':'Verloren';
  setTurnPill(S.resultTitle,won?'mine':'');renderGameUI();
  $('#matchResultTitle').focus({preventScroll:true});
  settleMatch();
}
async function resultAction(again){
  if(resultActionBusy||S.phase!=='over')return;
  resultActionBusy=true;renderMatchResult();
  const solo=S.demo,opponentId=S.opponent?.id;
  try{
    if(!await leaveMatch(false))return;
    if(again){if(solo)initSolo();else await AxiomaSocial.invite(opponentId)}
  }finally{resultActionBusy=false;renderMatchResult()}
}

async function setupMatchChannel(){if(S.demo)return;await supa.realtime.setAuth(); if(S.match)try{await supa.removeChannel(S.match)}catch{}
  S.match=supa.channel(`axioma:rechten-zeeslag:match:${S.matchId}`,{config:{private:true,presence:{key:S.me.id},broadcast:{ack:true}}});
  S.match.on('presence',{event:'sync'},deriveOppReady)
    .on('broadcast',{event:'shot'},({payload})=>handleIncomingShot(payload))
    .on('broadcast',{event:'shot_result'},({payload})=>{if(payload.to!==S.me.id||payload.from!==S.opponent?.id||!validResult(payload.result))return;const shot=S.myShots.find(s=>s.id===payload.shot_id);if(shot)applyMyShotResult(shot,payload.result)})
    .on('broadcast',{event:'forfeit'},({payload})=>{if(payload.from===S.opponent?.id&&!S.finished)finishGame(true,true)})
    .subscribe(async status=>{S.connected=status==='SUBSCRIBED';if(S.connected){setConnection('online','on');await updateMatchPresence();deriveOppReady()}else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status)){setConnection('verbinding herstellen…','warn');toast('Verbinding onderbroken. Wacht tot beide spelers weer online zijn.')}renderGameUI()});
}
function storageKey(){return `axioma-naval:${S.me?.id}:${S.matchId}`}
function saveMatch(){
  if(S.demo||!S.matchId||S.phase==='idle')return;
  const keys=['phase','ownFleet','myShots','enemyShots','revealedEnemyShips','myReady','myTurn','finished','resultReported','aimA','aimB','lastShot','winnerId','resultTitle'];
  try{sessionStorage.setItem(storageKey(),JSON.stringify(Object.fromEntries(keys.map(k=>[k,S[k]])),(_,v)=>v instanceof Set?[...v]:v))}catch{}
}
function restoreMatch(){
  try{
    const saved=JSON.parse(sessionStorage.getItem(storageKey())||'null');if(!saved)return;
    Object.assign(S,saved);S.ownFleet.forEach(s=>s.hits=new Set(s.hits));
    [...S.myShots,...S.enemyShots].forEach(s=>{s._presenting=false;s.visual='complete';if(s.result)s.presented=true});
    // A refresh can interrupt the animation after the result was received.
    // Recover the logical turn from that result, not the animation's old turn.
    const last=S.lastShot&&(S.lastShot.incoming?S.enemyShots:S.myShots).find(s=>s.id===S.lastShot.id);
    if(last?.result){
      S.myTurn=S.lastShot.incoming?!last.result.points.length:!!last.result.points.length;
      S.revealedEnemyShips=S.myShots.flatMap(s=>s.result?.sunk||[]);
      if(last.result.allSunk){S.finished=true;S.phase='over';S.myTurn=false;S.winnerId=S.lastShot.incoming?S.opponent.id:S.me.id;S.resultTitle=S.lastShot.incoming?'Verloren':'Gewonnen!'}
    }
    const pending=S.myShots.find(s=>!s.result);if(pending){V.busy=true;V.firing=true}
  }catch{toast('De vorige partij kon niet worden hersteld.')}
}
async function enterMatch({matchId,opponent,hostId}){
  S.matchId=matchId;S.opponent=opponent;S.hostId=hostId;S.persistentRegistered=false;
  // resetGameState renders, so read the saved state before resetting.
  let saved;try{saved=sessionStorage.getItem(storageKey())}catch{}
  showScreen('gameScreen');resetGameState();
  if(saved){try{sessionStorage.setItem(storageKey(),saved)}catch{}restoreMatch();renderGameUI();renderBoards()}
  await registerPersistentMatch();await setupMatchChannel();
}
async function leaveMatch(silent=false){
  if(S.finished&&!await settleMatch())return false;
  resetVisuals();
  if(S.phase!=='idle'&&S.match&&!S.demo&&!silent){
    if(S.phase==='battle'&&!S.finished&&S.opponent?.id&&!await submitMatchResult(S.opponent.id)){toast('Uitslag opslaan lukt nog niet. Probeer opnieuw.');return false}
    try{await S.match.send({type:'broadcast',event:'forfeit',payload:{from:S.me.id}})}catch{}
  }
  if(!S.demo){
    try{await AxiomaSocial.finish()}catch{toast('Partij afsluiten lukt nog niet. Probeer opnieuw.');return false}
    try{sessionStorage.removeItem(storageKey())}catch{}
    if(S.match)try{await supa.removeChannel(S.match)}catch{}
    history.replaceState(null,'',location.pathname);
  }
  S.match=null;S.matchId=null;S.opponent=null;S.hostId=null;S.persistentRegistered=false;S.phase='idle';
  if(S.demo){S.demo=false;$('#soloNote').hidden=true;const platform=window.AxiomaSocial?.state();if(platform)syncPlatform(platform);if(!window.AxiomaGame?.account){S.me=null;setConnection('Gast','warn');showScreen('gateScreen');return true}}
  showScreen('lobbyScreen');renderLobby();return true;
}
// Re-send the same shot id: the opponent replays its cached result, never a new hit.
setInterval(()=>{
  if(S.demo||!S.match||!S.connected||!S.opponentConnected||S.finished)return;
  const shot=S.myShots.find(s=>!s.result);
  if(shot)S.match.send({type:'broadcast',event:'shot',payload:{shot_id:shot.id,from:S.me.id,a:shot.a,b:shot.b,key:shot.key}}).catch(()=>{});
},4000);

function renderLobby(){if(!S.me)return;const list=[...S.players.values()].sort((a,b)=>{if(a.id===S.me.id)return -1;if(b.id===S.me.id)return 1;if(a.status!==b.status)return a.status==='available'?-1:1;return a.alias.localeCompare(b.alias,'nl')});
  $('#lobbyCount').textContent=`${list.length} online`;$('#soloBtn').disabled=!!S.pendingOutgoing;const el=$('#playerList');if(!list.length){el.innerHTML='<div class="empty">Nog niemand anders online.</div>';return}
  el.innerHTML=list.map(p=>{const self=p.id===S.me.id,playing=p.status==='playing';const pending=S.pendingOutgoing?.to===p.id;const status=self?'Jij':playing?'In spel':'Beschikbaar';const cls=self?'self':playing?'playing':'';return `<div class="playerRow"><div><div class="playerName">${escapeHtml(p.alias)}${self?' <span style="color:#748083;font-weight:450">(jij)</span>':''}</div><div class="playerMeta">${escapeHtml(p.class_code||'')}</div></div><div class="status ${cls}"><i></i>${status}</div><button class="inviteBtn" data-invite="${p.id}" ${self||playing||pending||S.pendingOutgoing?'disabled':''}>${pending?'Wachten…':'Uitnodigen'}</button></div>`}).join('');
}
function syncPlatform(state){
  if(S.demo)return;
  if(!state.account||state.account.id!==S.me?.id){
    resetVisuals();
    if(S.match)supa.removeChannel(S.match).catch(()=>{});
    S.match=null;S.matchId=null;S.phase='idle';S.players.clear();
    if(!state.account){S.me=null;setConnection('niet ingelogd','warn');showScreen('gateScreen');return}
    S.me={id:state.account.id};S.profile={alias:state.account.alias||'Leerkracht',class_code:state.account.class_code||''};
    $('#whoBtn').textContent=S.profile.alias;showScreen('lobbyScreen');
  }
  S.players=new Map(state.players.map(p=>[p.id,p]));
  const pending=state.invitations.find(i=>i.sender_id===S.me?.id&&i.status==='pending');
  S.pendingOutgoing=pending?{to:pending.recipient_id,matchId:pending.id}:null;
  setConnection(state.connected?'online':'verbinding herstellen…',state.connected?'on':'warn');
  renderLobby();
}
async function setupLobby(){
  await AxiomaSocial.ready();
  AxiomaSocial.onChange(syncPlatform);
  syncPlatform(AxiomaSocial.state());
  showScreen('lobbyScreen');
  const id=new URLSearchParams(location.search).get('match');
  if(id){
    try{await enterMatch(await AxiomaSocial.join(id))}
    catch(error){toast(error.message);history.replaceState(null,'',location.pathname)}
  }
}
async function sendInvite(toId){
  const p=S.players.get(toId);if(!p||p.status!=='available'||S.pendingOutgoing)return;
  await AxiomaSocial.invite(toId);
}

function renderRanking(rows){
  const mine=rows.find(r=>r.user_id===S.me?.id);
  $('#rankingSubtitle').textContent=S.profile?.class_code?`Klas ${S.profile.class_code}`:'Jouw klas';
  if(mine){$('#myStats').innerHTML=`<strong>${mine.won} gewonnen · ${mine.lost} verloren</strong><span>${mine.played} gespeeld · ${Number(mine.win_pct).toFixed(1).replace('.0','')}%</span>`}
  else{$('#myStats').innerHTML='<strong>Nog geen partijen</strong><span>Je eerste voltooide partij telt mee voor de ranglijst.</span>'}
  if(!rows.length){$('#rankingBody').innerHTML='<div class="rankEmpty">Nog geen voltooide partijen in deze klas.</div>';return}
  $('#rankingBody').innerHTML=`<table class="rankTable"><thead><tr><th>#</th><th>Speler</th><th>W</th><th>V</th><th>Gespeeld</th><th>%</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.user_id===S.me?.id?'me':''}"><td class="${r.qualified?'':'pendingRank'}">${r.qualified?r.rank:'—'}</td><td>${escapeHtml(r.alias)}${r.user_id===S.me?.id?' (jij)':''}</td><td>${r.won}</td><td>${r.lost}</td><td>${r.played}</td><td>${Number(r.win_pct).toFixed(1).replace('.0','')}%</td></tr>`).join('')}</tbody></table>`;
}
async function openRanking(){
  $('#rankingOverlay').hidden=false;$('#rankingBody').innerHTML='<div class="rankEmpty">Ranking laden…</div>';
  if(!S.profile?.class_code){renderRanking([]);$('#rankingSubtitle').textContent='Online partijen';$('#myStats').textContent='Log in als leerling om de online ranglijst van je klas te zien.';return}
  try{const {data,error}=await supa.rpc('axioma_naval_ranking');if(error)throw error;renderRanking(data||[])}catch(err){console.error(err);$('#rankingBody').innerHTML='<div class="rankEmpty">Ranking kon niet worden geladen.</div>'}
}

function randomFleet(){const fleet=[];const occ=new Set();for(const def of SHIP_DEFS){let ok=false;for(let tries=0;tries<500&&!ok;tries++){const start={x:GRID_MIN+Math.floor(Math.random()*9),y:GRID_MIN+Math.floor(Math.random()*9)};const options=[];for(const sl of ALLOWED_SLOPES)for(const sign of [-1,1]){if(!shootableIntercept(sl.a,start))continue;const sx=sl.dx*sign,sy=sl.dy*sign;const cells=Array.from({length:def.length},(_,i)=>({x:start.x+i*sx,y:start.y+i*sy}));if(cells.some(p=>p.x<GRID_MIN||p.x>GRID_MAX||p.y<GRID_MIN||p.y>GRID_MAX||occ.has(cellKey(p))))continue;options.push(cells)}if(!options.length)continue;const cells=options[Math.floor(Math.random()*options.length)];cells.forEach(p=>occ.add(cellKey(p)));fleet.push({name:def.name,length:def.length,cells,hits:new Set()});ok=true}if(!ok)throw new Error('demo fleet failed')}return fleet}
function initSolo(){
  if(S.matchId&&!S.demo)return;
  const account=window.AxiomaGame?.account;
  S.demo=true;S.me={id:account?.id||'solo-player'};
  S.profile={alias:account?.alias||'Jij',class_code:account?.class_code||''};
  S.opponent={id:'computer',alias:'Computer'};S.matchId='solo';S.hostId=S.me.id;S.unranked=true;
  resetGameState();S.demoEnemyFleet=randomFleet();S.oppReady=true;
  $('#whoBtn').hidden=false;$('#whoBtn').textContent=S.profile.alias;setConnection('Solo · computer','on');
  $('#soloNote').hidden=false;showScreen('gameScreen');renderGameUI();renderBoards();
}
function demoBotTurn(){
  if(!S.demo||S.finished||S.phase!=='battle'||S.myTurn||V.busy)return;
  const candidates=[];for(const sl of ALLOWED_SLOPES)for(const bv of B_VALUES){const a=sl.a,b={n:bv,d:1},key=lineKey(a,b);if(!S.enemyShots.some(s=>s.key===key))candidates.push({a,b,key})}
  if(!candidates.length){S.myTurn=true;renderGameUI();return}
  const c=candidates[Math.floor(Math.random()*candidates.length)],result=resolveShot(S.ownFleet,c.a,c.b),shot={id:uuid(),...c,result,visual:'queued'};S.enemyShots.push(shot);presentIncomingShot(shot,result);
}

async function boot(){
  $('#rematchBtn').onclick=()=>resultAction(true);$('#endMatchBtn').onclick=()=>resultAction(false);
  AxiomaPlatform.wireHome($('#homeBtn'),{beforeLeave:async()=>{if(S.matchId)await leaveMatch();return !S.matchId}}); $('#demoBtn').onclick=initSolo;$('#soloBtn').onclick=initSolo; $('#leaveBtn').onclick=()=>leaveMatch(false); $('#rankingBtn').onclick=openRanking; $('#rankingCloseBtn').onclick=()=>$('#rankingOverlay').hidden=true; $('#rankingOverlay').addEventListener('click',e=>{if(e.target.id==='rankingOverlay')$('#rankingOverlay').hidden=true});
  $('#playerList').onclick=e=>{const b=e.target.closest('[data-invite]');if(b)sendInvite(b.dataset.invite)};
  $('#ownBoard').addEventListener('click',e=>{const p=svgToGrid(e,$('#ownBoard'));if(p)placeAt(p,e.target.closest('[data-ship]')?.dataset.ship)});
  $('#ownBoard').addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&S.placementStart){const p=svgToGrid(e,$('#ownBoard'));chooseGhost(p)}});
  $('#ownBoard').addEventListener('pointerleave',()=>chooseGhost(null));
  $('#undoShipBtn').onclick=undoPlacement;
  $('#clearFleetBtn').onclick=()=>{if(S.phase!=='placing'||S.myReady)return;rememberFleet();S.ownFleet=[];clearPlacement();renderGameUI();renderBoards()};
  $('#readyBtn').onclick=()=>{if(S.phase!=='placing'||placement.editing||S.ownFleet.length!==SHIP_DEFS.length||S.myReady)return;clearPlacement();S.myReady=true;if(S.demo){S.oppReady=true;startBattle()}else{updateMatchPresence();setTimeout(deriveOppReady,100)}renderGameUI()};
  $('#aUpBtn').onclick=()=>shiftAimA(1);$('#aDownBtn').onclick=()=>shiftAimA(-1);
  $('#bUpBtn').onclick=()=>shiftAimB(1);$('#bDownBtn').onclick=()=>shiftAimB(-1);$('#fireBtn').onclick=fire;
  window.addEventListener('pagehide',saveMatch);
  if(['demo','solo'].some(key=>new URLSearchParams(location.search).get(key)==='1')){initSolo();return}
  if(!supa){setConnection('Supabase niet geladen','warn');return}
  setConnection('login controleren…','');
  try{
    await AxiomaAuth.ready();
    const session=await AxiomaAuth.getSession(),account=await AxiomaAuth.getAccount();
    if(!session?.user||!account||account.role==='unknown'){setConnection('niet ingelogd','warn');showScreen('gateScreen');return}
    S.me=session.user;S.profile={alias:account.alias||'Leerkracht',class_code:account.class_code||''};
    $('#whoBtn').hidden=false;$('#whoBtn').textContent=S.profile.alias;await setupLobby();
  }catch(err){console.error(err);setConnection('verbinding mislukt','warn');showScreen('gateScreen')}
}
boot();
})();
