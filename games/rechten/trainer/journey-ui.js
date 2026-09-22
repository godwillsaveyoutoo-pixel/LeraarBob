(function(){
'use strict';
const J=window.RechtenJourney;
const drawing=path=>`<svg viewBox="0 0 60 60" aria-hidden="true"><path d="${path}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
window.RechtenJourneyUI={render(root,{state,unlocked,ready,labels,busy,onSelect,onStart,onResume,onClose}){
 const j=J.data(state),selected=J.places.find(p=>p.id===j.selected)||J.places[0],a=j.active;
 const needs=J.missing(state,ready),open=J.available(selected,unlocked),proof=J.skills.filter(k=>j.proof[k]);
 const next=J.places.find(p=>p.skills.some(k=>unlocked.includes(k)&&!ready(state,k)))||J.places[0];
 const activeName=a?.mode==='challenge'?'Routeplan':a?.mode==='camp'?'Kamp':J.places.find(p=>p.id===a?.place)?.name;
 const status=a?`${activeName}: je etappe blijft bewaard. Hervat dezelfde opgave.`:busy?'Je lopende trainingsronde blijft bewaard. Rond die eerst af.':j.last?(j.last.mode==='challenge'?(j.last.passed?'Routeplan aangetoond. Je kunt blijven oefenen.':`Routeplan: ${proof.length}/5 onderdelen zelfstandig aangetoond. Oefen verder en probeer later opnieuw.`):`Etappe afgerond · ${j.last.independent}/${j.last.answered} zelfstandig. Oudere kennis reist mee.`):'Kies een plek. Onderweg komen eerdere vragen terug.';
 root.innerHTML=`<div class="journey-heading"><div><span>Rechtenreis · eerste gebied</span><h2 tabindex="-1">De Kaartvallei</h2></div><button data-close aria-label="Terug naar oefening">×</button></div>
 <div class="journey-body"><section class="journey-map" aria-label="Kaart van de vallei">
 <svg class="journey-land" viewBox="0 0 700 360" preserveAspectRatio="none" aria-hidden="true"><path d="M0 90Q120 0 240 90T500 85T750 25M0 110Q120 20 240 110T500 105T750 45M-20 310Q110 205 270 300T730 280"/><path class="river" d="M510-20C380 70 580 140 450 240S500 325 470 390"/><path class="road" d="M120 230Q200 230 330 155T565 235"/><path d="M45 190l16-35 16 35zm26 12 16-35 16 35M600 115l16-35 16 35"/></svg>
 <p class="journey-map-note">Punten → verschillen → helling</p>
 ${J.places.map((p,i)=>`<button class="journey-place ${p.id===selected.id?'selected':''} ${J.available(p,unlocked)?'':'later'}" style="left:${[18,48,81][i]}%;top:${[63,43,65][i]}%" data-place="${p.id}" aria-pressed="${p.id===selected.id}">${drawing(p.icon)}<strong>${p.name}</strong><small>${j.visits[p.id]?'★ etappe voltooid':!J.available(p,unlocked)?'◇ later':p.id===next.id?'◉ aanbevolen':'beschikbaar'}</small></button>`).join('')}
 <span class="journey-map-key">★ etappe voltooid · kennis blijft terugkomen</span></section>
 <aside class="journey-details"><span class="journey-type">${selected.type}</span><h3>${selected.name}</h3><p>${selected.story}</p>
 <p class="journey-goals">${selected.skills.map(k=>labels[k].label).join(' · ')}</p>
 <p class="journey-status" role="status">${status}</p>
 ${a||busy?'<button class="primary" data-resume>Hervat je etappe →</button>':open?'<button class="primary" data-start="discover">Begin deze etappe →</button>':`<p>Bereid eerst ${selected.id==='trail'?'punten lezen en plaatsen':'verschillen en helling'} voor. Je bestaande toegang blijft behouden.</p>`}
 </aside></div>
 <div class="journey-footer"><button data-start="camp" ${a||busy?'disabled':''}>Kamp · gemengd oefenen</button><div><strong>Routeplan · ${proof.length}/5</strong><span>${needs.length?'Voorbereiding: '+needs.map(k=>labels[k].label).join(', '):proof.length&&proof.length<5?'Nog zelfstandig: '+J.skills.filter(k=>!j.proof[k]).map(k=>labels[k].label).join(', '):'Verbind punten, verschillen en helling. Hulp mag; zelfstandig bewijs telt.'}</span></div><button data-start="challenge" ${a||busy||needs.length?'disabled':''}>${proof.length===5?'Oefen het routeplan opnieuw':proof.length?'Vul je routeplan aan':'Probeer de einduitdaging'}</button></div>`;
 root.querySelector('[data-close]').onclick=onClose;
 root.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>onSelect(b.dataset.place));
 root.querySelector('[data-resume]')?.addEventListener('click',onResume);
 root.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>onStart(selected.id,b.dataset.start));
}};
})();
