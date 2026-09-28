/* Fullscreen is an explicit user action; browsers without it get a short explanation. */
(function(root){
'use strict';
const doc=document,standalone=matchMedia('(display-mode: standalone)'),fullDisplay=matchMedia('(display-mode: fullscreen)');
let pending=false,opener=null;
const active=()=>!!(doc.fullscreenElement||doc.webkitFullscreenElement);
const appMode=()=>standalone.matches||navigator.standalone===true;
function sync(){
 const on=active(),label=on?'Volledig scherm verlaten':'Volledig scherm';
 doc.querySelectorAll('[data-fullscreen]').forEach(b=>{
  b.hidden=!on&&(appMode()||fullDisplay.matches);b.disabled=pending;
  b.setAttribute('aria-label',label);b.setAttribute('title',label);b.setAttribute('aria-pressed',String(on));
  b.innerHTML=RechtenV2Shell.icon(on?'fullscreenExit':'fullscreen',22)+(b.classList.contains('fullscreen-gate')?'<span>'+label+'</span>':'');
 });
}
function explain(failed=false){
 let d=doc.getElementById('fullscreen-help');
 if(!d){
  d=doc.createElement('dialog');d.id='fullscreen-help';d.className='fullscreen-help';d.setAttribute('aria-labelledby','fullscreen-title');d.setAttribute('aria-describedby','fullscreen-message');
  doc.body.append(d);
  d.addEventListener('close',()=>{(opener?.isConnected?opener:doc.querySelector('[data-fullscreen]'))?.focus({preventScroll:true})});
  d.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();d.querySelector('button').focus()}});
 }
 const apple=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 d.innerHTML='<h2 id="fullscreen-title">Meer ruimte om te oefenen</h2><p id="fullscreen-message">'+(failed?'Volledig scherm kon niet worden geopend.':'Deze browser kan deze pagina niet op volledig scherm openen.')+'</p><p>'+(apple?'Open deze pagina in Safari. Kies <strong>Deel → Zet op beginscherm</strong>. Zet <strong>Open als webapp</strong> aan als je die optie ziet. Start daarna via het nieuwe icoon.':'Kijk in het menu van je browser of daar <strong>Volledig scherm</strong> beschikbaar is, of open de trainer in een andere browser.')+'</p><button type="button">Terug naar de trainer</button>';
 d.querySelector('button').addEventListener('click',()=>d.close());
 if(!d.open)d.showModal();d.querySelector('button').focus();
}
async function toggle(button){
 if(pending)return;opener=button;
 const on=active(),target=on?doc:doc.documentElement;
 const method=on?(doc.exitFullscreen||doc.webkitExitFullscreen):(target.requestFullscreen||target.webkitRequestFullscreen);
 const enabled=target.requestFullscreen?doc.fullscreenEnabled:doc.webkitFullscreenEnabled;
 if(!method||(!on&&enabled===false)){explain();return}
 pending=true;sync();
 try{await method.call(target)}catch{explain(true)}finally{pending=false;sync()}
}
function attach(app){
 const gate=app.querySelector('#rotateGate');
 if(gate&&!gate.querySelector('[data-fullscreen]')){
  const b=doc.createElement('button');b.type='button';b.className='fullscreen-gate';b.setAttribute('data-fullscreen','');gate.append(b);
 }
 sync();
}
doc.addEventListener('click',e=>{const b=e.target.closest('[data-fullscreen]');if(b&&!b.disabled){e.preventDefault();toggle(b)}});
for(const event of ['fullscreenchange','webkitfullscreenchange'])doc.addEventListener(event,sync);
standalone.addEventListener('change',sync);fullDisplay.addEventListener('change',sync);
root.RechtenV2Fullscreen={attach};
})(globalThis);
