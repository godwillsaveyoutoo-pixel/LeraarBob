/* Presentation only: engines and print composition remain with their registered provider. */
(async()=>{
 'use strict';const R=window.LeraarBobGameRegistry,container=document.getElementById('worksheetProviders');
 try{await R.ready();container.replaceChildren();for(const game of R.list()){
  const entries=R.worksheets(game.id);if(!entries.length)continue;
  const section=document.createElement('section');section.className='paper-subject';const title=document.createElement('h2');title.textContent=game.title;section.append(title);
  const routes=document.createElement('div');routes.className='paper-routes';
  for(const entry of entries){const a=document.createElement('a');const url=new URL(entry.href,R.baseURL);url.searchParams.set('returnTo',location.pathname+location.search+location.hash);a.href=url.href;a.dataset.provider=entry.providerGameId;
   const label=document.createElement('span');label.textContent=entry.isReference?'VIA '+entry.providerTitle:'EIGEN OEFENBLAD';const h=document.createElement('h3');h.textContent=entry.title;const p=document.createElement('p');p.textContent=entry.description||'Stel je reeks en verbetersleutel samen in de trainer.';const action=document.createElement('strong');action.textContent=entry.isReference?'Open '+entry.providerTitle+' →':'Stel je blad samen →';a.append(label,h,p,action);routes.append(a);
  }section.append(routes);container.append(section);
 }}catch{container.textContent='De oefenbladkeuzes konden niet laden. Open je trainer en kies Oefenblad in het menu.';}
})();
