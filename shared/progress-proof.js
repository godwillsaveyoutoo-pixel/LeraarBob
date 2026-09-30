/* Shared profile flow. Names remain in this dialog/PDF; only account progress is read. */
(function(){
'use strict';
const root=new URL('../',document.currentScript.src),loads=new Map();
function load(src,ready){if(ready())return Promise.resolve();if(!loads.has(src))loads.set(src,new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL(src,root);s.onload=resolve;s.onerror=()=>{loads.delete(src);s.remove();reject(Error('Het bewijs kon niet laden. Probeer opnieuw.'));};document.head.append(s);}));return loads.get(src);}
async function dependencies(){
 await Promise.all([
  load('shared/axioma-progress.js',()=>!!window.AxiomaProgress),load('js/catalog.js',()=>!!window.AXIOMA_CATALOG),
  load('js/catalog-progress.js',()=>!!window.LeraarBobCatalogProgress),load('shared/progress-proof-model.js',()=>!!window.LeraarBobProofModel),
  load('shared/proof-pdf.js',()=>!!window.LeraarBobProofPDF),load('shared/progress-proof-render.js',()=>!!window.LeraarBobProofRender)
 ]);
}
function mount({container,account,onBack}){
 let active=true,busy=false,overview=null,catalog=null,controller=null,loaded=false;
 container.innerHTML='<form class="progress-proof-form"><label>Naam op het bewijs <small>Optioneel. Alleen op de PDF; je alias blijft behouden.</small><input id="proofName" name="name" type="text" autocomplete="name" maxlength="100" placeholder="Je voor- en achternaam"></label><label>Voortgang van<select id="proofGame" name="game" disabled><option value="all">Alle spellen</option></select></label><p id="proofSummary" class="progress-proof-summary" aria-live="polite">Voortgang laden…</p><div class="progress-proof-actions"><button id="proofDownload" type="submit" disabled>Download PDF</button><button id="proofRetry" type="button" hidden>Opnieuw laden</button><button id="proofBack" type="button">Terug</button></div><p id="proofMessage" class="progress-proof-message" role="status" aria-live="polite"></p></form>';
 const form=container.querySelector('form'),name=form.elements.name,select=form.elements.game,button=container.querySelector('#proofDownload'),retry=container.querySelector('#proofRetry'),summary=container.querySelector('#proofSummary'),message=container.querySelector('#proofMessage');
 document.getElementById('authTitle').textContent='Voortgang downloaden';
 const live=()=>active&&form.isConnected;
 const notify=(text,error=false)=>{message.textContent=text;message.dataset.error=String(error);};
 const state=value=>{busy=value;form.setAttribute('aria-busy',String(value));button.disabled=value||!loaded;select.disabled=value||!loaded;retry.disabled=value;button.textContent=value?'Even wachten…':'Download PDF';};
 async function sameAccount(){const current=await window.AxiomaAuth.getAccount();if(!live()||current?.id!==account.id||current?.role!=='student')throw Error('Je account is gewijzigd. Open je profiel opnieuw.');}
 function report(){return window.LeraarBobProofModel.build({account,overview,catalog,selected:select.value,name:name.value},window.LeraarBobCatalogProgress);}
 function pending(){return window.LeraarBobProofModel.pendingGames({account,catalog,selected:select.value,project:window.AXIOMA_CONFIG?.url||'offline',storage:window.localStorage});}
 function preview(){
  if(!loaded)return;const value=report();summary.textContent=value.entries.length?`${value.entries.length} ${value.entries.length===1?'spel':'spellen'} · ${value.xp} XP`:'Nog geen voortgang opgeslagen.';
  const waiting=pending();notify(waiting.length?'Nog niet gesynchroniseerd: '+waiting.join(', ')+'. Open het spel en probeer daarna opnieuw.':'Gebaseerd op je opgeslagen accountvoortgang.',waiting.length>0);
 }
 async function refresh(){
  await dependencies();await sameAccount();catalog=window.AXIOMA_CATALOG;
  // Flush the current game's own adapter; never create a second writer or merge accounts.
  let syncTimer;
  try{await Promise.race([Promise.all([window.RechtenV2App?.sync?.(),window.AxiomaGame?.flush?.()]),new Promise((_,reject)=>{syncTimer=setTimeout(()=>reject(Error('Synchroniseren duurt te lang. Probeer opnieuw.')),12000);})]);}
  finally{clearTimeout(syncTimer);}
  await sameAccount();
  controller?.abort();const request=new AbortController();controller=request;const timer=setTimeout(()=>request.abort(),12000);
  try{const next=await window.AxiomaProgress.loadOverview({signal:request.signal});await sameAccount();
   // Reject partial failures before any zero counts or PDF are displayed.
   const value=window.LeraarBobProofModel.build({account,overview:next,catalog},window.LeraarBobCatalogProgress);
   overview=next;if(!loaded){for(const entry of value.choices){const option=document.createElement('option');option.value=entry.id;option.textContent=entry.title;select.append(option);}}
   loaded=true;retry.hidden=true;preview();
  }finally{clearTimeout(timer);if(controller===request)controller=null;}
 }
 async function prepare(){if(busy)return;state(true);notify('');try{await refresh();}catch(e){if(live()){loaded=false;summary.textContent='Voortgang niet beschikbaar';notify(e.message||'Laden lukt niet. Probeer opnieuw.',true);retry.hidden=false;}}finally{if(live())state(false);}}
 form.onsubmit=async e=>{
  e.preventDefault();if(busy||!loaded)return;state(true);notify('Je voortgang wordt opgehaald…');
  try{await refresh();if(!live())return;const waiting=pending();if(waiting.length)throw Error('Synchroniseer eerst '+waiting.join(', ')+'. Open het spel en probeer daarna opnieuw.');
   const value=report(),blob=window.LeraarBobProofRender.documentPDF(value);await sameAccount();
   const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=window.LeraarBobProofModel.filename(value);document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
   notify('Je PDF is klaar. Je kunt het bestand nu naar je leerkracht sturen.');
  }catch(e){if(live())notify(e.message||'Je PDF kon niet worden gemaakt. Probeer opnieuw.',true);}
  finally{if(live())state(false);}
 };
 select.onchange=preview;retry.onclick=prepare;container.querySelector('#proofBack').onclick=onBack;
 void prepare();name.focus({preventScroll:true});container.closest('.auth-sheet,dialog')?.scrollTo({top:0,behavior:'instant'});
 return {destroy(){active=false;controller?.abort();name.value='';overview=null;}};
}
window.LeraarBobProgressProof=Object.freeze({mount});
})();
