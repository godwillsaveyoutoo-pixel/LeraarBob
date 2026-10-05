/* Shared presentation only: scores and session state remain owned by each engine. */
(function(root){
 'use strict';
 function standings(rows){
  const sorted=rows.map(p=>({...p,points:Number.isFinite(p.points)?p.points:0})).sort((a,b)=>b.points-a.points||a.alias.localeCompare(b.alias,'nl')||String(a.id).localeCompare(String(b.id)));
  let previous,place=0;
  return sorted.map((p,i)=>{if(p.points!==previous)place=i+1;previous=p.points;return {...p,place};});
 }
 function el(tag,cls,text){const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;}
 function render(host,{rows,ownId,final=false,roundKey='',list=null}){
  const ranked=standings(rows),signature=JSON.stringify([ranked,ownId,final,roundKey]);
  if(host.dataset.signature===signature)return;
  host.dataset.signature=signature;host.classList.add('battle-standings');
  const oldList=list||host.querySelector('.battle-ranking');host.replaceChildren();
  const podium=el('div','battle-podium');podium.setAttribute('aria-label',final?'Podium':'Tussenstand top 3');
  // Shared places are grouped; a zero-score tie is not presented as a victory.
  if(ranked.some(p=>p.points>0))for(const place of [2,1,3]){
   const winners=ranked.filter(p=>p.place===place&&p.points>0);if(!winners.length)continue;
   const card=el('section','battle-medal');card.dataset.place=place;
   card.append(el('span','battle-medal-number',String(place)));
   const names=el('div','battle-medal-names');
   winners.forEach(p=>{const name=el('strong','',p.alias);if(p.id===ownId){name.append(el('small','',' · jij'));card.classList.add('includes-me');}names.append(name);});
   card.append(names,el('span','battle-medal-score',winners[0].points+' punten'));
   if(winners.length>1)card.append(el('small','battle-shared-place','Gedeelde plaats'));
   podium.append(card);
  }
  if(podium.children.length)host.append(podium);
  else host.append(el('p','battle-no-score',ranked.length?'Nog geen battlepunten.':'Nog geen deelnemers.'));
  const heading=el('div','battle-ranking-heading');heading.append(el('strong','',final?'Eindranglijst':'Tussenstand'),el('small','','Gelijke score = gelijke plaats'));host.append(heading);
  const ranking=oldList||el('ol','');ranking.classList.add('battle-ranking');ranking.replaceChildren();
  ranking.setAttribute('aria-label',final?'Eindranglijst':'Tussenstand');ranking.tabIndex=0;
  const before=standings(rows.map(p=>({...p,points:p.previousPoints}))),oldRanks=new Map(before.map(p=>[p.id,p.place]));
  ranked.filter(p=>p.place<=10||p.id===ownId).forEach(p=>{
   const li=el('li',p.id===ownId?'mine':'');li.value=p.place;
   const rank=el('span','place',String(p.place));rank.setAttribute('aria-label','Plaats '+p.place);
   li.append(rank,el('span','name',p.alias+(p.id===ownId?' · jij':'')),el('strong','points',p.points+' punten'));
   const movement=Number.isFinite(p.previousPoints)?oldRanks.get(p.id)-p.place:0;
   const arrow=el('span','movement '+(movement>0?'rise':movement<0?'fall':''),movement>0?'↑ '+movement:movement<0?'↓ '+(-movement):'—');
   arrow.setAttribute('aria-label',movement?Math.abs(movement)+' plaatsen '+(movement>0?'gestegen':'gedaald'):Number.isFinite(p.previousPoints)?'Plaats ongewijzigd':'Geen eerdere plaats beschikbaar');li.append(arrow);ranking.append(li);
  });
  host.append(ranking);
 }
 const api=Object.freeze({standings,render});root.LeraarBobBattlePresentation=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);
