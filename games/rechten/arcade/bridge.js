/* Small adapter shared by the three original engines. No gameplay is replaced. */
(() => {
'use strict';
const C=window.RechtenArcadeCore,script=document.currentScript,game=script.dataset.arena,params=new URLSearchParams(location.search),embedded=window!==window.top;
let run=null;const KEY='axioma.rechten.arcade.runs.v1';
const listeners=new Set();
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch{return fallback;}}
function save(){if(!run)return;const saved=read(KEY,[]),index=saved.findIndex(r=>r.id===run.id);if(index<0)saved.push(run);else saved[index]=run;try{localStorage.setItem(KEY,JSON.stringify(saved.slice(-500)));}catch{window.dispatchEvent(new CustomEvent('arcade:storage-error'));}}
function packet(type,data){const state=window.AxiomaGame?.active&&window.AxiomaGame.state;const platformProgress=state&&state.total>0?{value:new Set(state.completed||[]).size,total:state.total,unit:game==='kleiduiven'?'reeksen':'levels'}:null;const detail={type:'rechten-arcade:'+type,game,platformProgress,...data};window.dispatchEvent(new CustomEvent('arcade:'+type,{detail}));if(embedded)window.parent.postMessage(detail,location.origin);for(const fn of listeners)fn(detail);}
function start(options={}){run=C.newRun(game,{actor:params.get('actor')||window.AxiomaGame?.account?.alias,mode:params.get('mode')||'solo',sessionId:params.get('session'),seed:params.get('seed')||undefined,...options});save();packet('start',{run});render();return run;}
function record(event){if(!run||run.complete)start();const before=C.summary(run).score;if(C.append(run,{...event,id:event.id||C.uuid()})){const scoreDelta=C.summary(run).score-before;save();packet('attempt',{run,event,scoreDelta});render();if(scoreDelta>0)celebrate(scoreDelta);}return run;}
function finish(extra={}){if(!run)return;Object.assign(run,{elapsedMs:Math.max(0,Date.now()-Date.parse(run.startedAt))},extra,{finishedAt:new Date().toISOString(),complete:extra.complete!==false});save();packet('finish',{run});render();}
function render(){const badge=document.getElementById('arcadeScore');if(badge&&run){const s=C.summary(run);badge.textContent=game==='zeeslag'?s.hits+' treffers':s.score.toLocaleString('nl-BE')+' pt';}}
function celebrate(delta){const stage=document.querySelector(game==='redding'?'#stage':'.arena');if(!stage)return;stage.querySelector('.arcade-score-pop')?.remove();const pop=document.createElement('span');pop.className='arcade-score-pop';pop.textContent='+'+delta.toLocaleString('nl-BE');pop.setAttribute('aria-hidden','true');stage.append(pop);setTimeout(()=>pop.remove(),1200);if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;stage.classList.remove('arcade-scored');requestAnimationFrame(()=>stage.classList.add('arcade-scored'));}
function mount(){
 document.body.dataset.arcade=game;document.body.classList.toggle('arcade-embedded',embedded);
 const header=document.querySelector('header'),hud=document.createElement('div');hud.className='arcade-sessionbar';hud.innerHTML='<a class="arcade-return" href="../arcade/" target="_top" aria-label="Terug naar Rechtenarcade">← Arcade</a><span class="arcade-caption">'+C.games[game].name+'</span><output id="arcadeScore" aria-label="Spelscore">0 pt</output>';
 if(embedded){if(header)header.hidden=true;document.getElementById('app')?.classList.add('arcade-frame');}else if(header)header.after(hud);
 if(embedded&&game!=='zeeslag'){
  const tools=document.createElement('div');tools.className='arcade-tools';tools.setAttribute('aria-label','Spelbediening');
  const ids=game==='redding'?['levelCount','timer','pauseBtn','teacherBtn',...(params.get('mode')==='duo'?['roles','swapBtn']:[])]:['mute','restart'];
  for(const id of ids){const node=document.getElementById(id);if(node)tools.append(node);}
  document.querySelector(game==='redding'?'#stage':'.arena').append(tools);
  if(game==='kleiduiven'){
   document.querySelector('.consoleFoot').append(document.getElementById('progress'));
   const more=document.createElement('details');more.className='arcade-more';more.innerHTML='<summary aria-label="Meer spelopties" aria-expanded="false" aria-controls="arcadeGameOptions">⋮</summary><div id="arcadeGameOptions" aria-label="Spelopties"></div>';
   const panel=more.lastElementChild;for(const id of [...(params.get('mode')==='solo'?['groupMenu']:[]),'rankingMenu']){const node=document.getElementById(id);panel.append(node);node.addEventListener('click',()=>{more.open=false;});}
   more.addEventListener('toggle',()=>more.firstElementChild.setAttribute('aria-expanded',String(more.open)));tools.append(more);
  }
 }
 if(game==='redding')document.getElementById('stage').append(document.getElementById('missionText'));
 if(game==='zeeslag'){
  const composer=document.getElementById('aimComposer');if(composer)document.getElementById('bottomBar').append(composer);
  const turn=document.getElementById('turnPill'),status=()=>packet('status',{status:turn.textContent});new MutationObserver(status).observe(turn,{childList:true,subtree:true,characterData:true});status();
 }
 if(game==='kleiduiven'){
  const field=document.getElementById('field'),barrel=document.getElementById('turretBarrel');
  barrel.replaceChildren();const img=document.createElementNS('http://www.w3.org/2000/svg','image');img.setAttribute('href','../arcade/assets/gun.webp');img.setAttribute('x','439.25');img.setAttribute('y','230');img.setAttribute('width','160');img.setAttribute('height','160');img.dataset.pivotX='500';img.dataset.pivotY='310';barrel.append(img);
  const turret=document.getElementById('turret');for(const node of [...turret.children])if(node!==barrel)node.remove();turret.removeAttribute('filter');
  const resize=()=>{const box=field.getBoundingClientRect();if(!box.width||!box.height)return;
   const height=540,width=height*box.width/box.height,left=500-width/2;field.setAttribute('viewBox',`${left} 40 ${width} ${height}`);
   for(const rect of field.querySelectorAll('#boundary rect,rect[fill="url(#ground)"],rect[fill="url(#grid)"]')){for(const [k,v] of Object.entries({x:left,y:40,width,height,rx:0}))rect.setAttribute(k,v);}
   const axes=field.querySelectorAll('path.axes');axes[0].setAttribute('d',`M${left+24} 310H${left+width-24}M500 55V565`);axes[1].setAttribute('d',`m${left+width-34} 304 9 6-9 6M494 64l6-9 6 9`);
   const axisNames=field.querySelectorAll('.axisName');axisNames[0].setAttribute('x',left+width-18);axisNames[1].setAttribute('y',70);
   field.querySelector('.corners').style.display='none';
   for(const t of field.querySelectorAll('.tickLabel,.axisName'))t.style.fontSize=Math.max(18,Math.min(42,12*height/box.height))+'px';
  };new ResizeObserver(resize).observe(field);resize();
 }
 render();packet('ready',{});
}
window.RechtenArcade=Object.freeze({start,record,finish,run:()=>run,onChange:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},params});
addEventListener('pagehide',save);addEventListener('axioma:game-progress',()=>packet('progress',{}));
let progressSignature='';setInterval(()=>{const s=window.AxiomaGame?.active&&window.AxiomaGame.state;if(!s)return;const signature=JSON.stringify([s.completed,s.total]);if(signature!==progressSignature){progressSignature=signature;packet('progress',{});}},250);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
