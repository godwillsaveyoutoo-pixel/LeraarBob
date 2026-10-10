/* Rechten's entry presentation. Existing controllers own accounts and sessions. */
(()=>{
 'use strict';
 const root=new URL('../../../',document.currentScript.src),$=id=>document.getElementById(id);
 const learn=!!$('learnSetup');if(!learn&&!$('hostForm'))return;
 try{const inherited=window.parent!==window&&window.parent.location.origin===location.origin?window.parent.document.documentElement.dataset.mode:null;document.documentElement.dataset.mode=inherited||(localStorage.getItem('axioma-mode')==='dark'?'dark':'light');}catch{}
 document.body.classList.add('rechten-start');
 const hero=document.createElement('section');hero.className='rw-entry-hero';hero.hidden=true;hero.setAttribute('aria-label','Startpunt Rechtenwereld');
 hero.innerHTML='<div class="rw-entry-copy"><a class="rw-entry-back"></a><p class="rw-entry-eyebrow"></p><h1 class="rw-entry-title"></h1><p class="rw-entry-description"></p><ol class="rw-entry-steps" aria-label="Stappen"></ol></div><img class="rw-entry-art" alt="" aria-hidden="true" width="180" height="180">';
 document.querySelector('main').prepend(hero);
 let learned={};
 const text=(selector,value)=>{const node=hero.querySelector(selector);if(node.textContent!==value)node.textContent=value;};
 function worldInfo(id){return (learn?window.RechtenLearnCatalog?.worlds:window.BattleGame?.worlds)?.find(w=>w.id===id);}
 function backURL(world){
  try{const value=new URLSearchParams(location.search).get('returnTo');if(value){const url=new URL(value,root);if(url.origin===root.origin&&url.pathname.startsWith(root.pathname)&&!url.username&&!url.password&&['http:','https:'].includes(url.protocol))return url.href;}}catch{}
  return new URL('games/rechten/rechtenwereld/index.html#'+(world||'wereld'),root).href;
 }
 function classroomContext(){
  const state=window.LeraarBobClassroom?.snapshot(),role=window.AxiomaAuth?.getSnapshot?.()?.account?.role;
  const stage=!$('login').hidden?'login':!$('setup').hidden?'setup':state?.phase==='lobby'?'lobby':'';
  const world=state?(state.world||window.BattleGame?.worlds?.find(w=>w.skills.includes(state.spec?.skill))?.id||(state.owner?$('world').value:new URLSearchParams(location.search).get('world'))):$('world').value;
  return {stage,world,role,owner:!!state?.owner};
 }
 function paint(){
  const c=learn?learned:classroomContext(),stage=learn?(!c.phase||c.phase==='setup'?'setup':c.phase==='lobby'?'lobby':''):c.stage;
  const active=!!stage,world=worldInfo(c.world),mode=learn?'Samen leren':'Klasbattle';
  document.body.dataset.rechtenEntry=stage||'';hero.hidden=!active;if(!active)return;
  text('.rw-entry-eyebrow','Rechtenwereld'+(world?' · '+world.name:''));
  text('.rw-entry-title',stage==='lobby'?(learn?'Jullie groepje':'De klas verzamelt'):mode);
  text('.rw-entry-description',stage==='lobby'?(learn?'Nodig je klasgenoten uit. Zodra jullie er zijn, begint de gezamenlijke reeks.':c.owner?'Deel de code. Jij start wanneer de klas klaar is.':'Je bent erbij. Je leerkracht start de eerste ronde.'):learn?'Eerst je eigen idee. Daarna samen bouwen en controleren.':c.role==='teacher'?'Kies jullie leerstof en rondetijd. Daarna nodig je de klas uit.':'Doe mee met de code van je leerkracht.');
  const art=hero.querySelector('.rw-entry-art');art.hidden=!world;if(world){const src=new URL('games/rechten/rechtenwereld/assets/world-home/'+world.id+'.webp',root).href;if(art.src!==src)art.src=src;}
  const back=hero.querySelector('.rw-entry-back');back.hidden=stage==='lobby';back.href=backURL(world?.id);back.textContent=new URL(back.href).pathname===new URL('os/',root).pathname?'← Naar mijn map':'← Naar '+(world?.name||'Rechtenwereld');
  const steps=learn?['Oefening','Klasgenoten','Samen leren']:c.role==='teacher'||c.owner?['Leerstof & instellingen','Wachtkamer','Klasbattle']:['Aanmelden','Deelnemen','Klasbattle'];
  const selected=stage==='lobby'?1:stage==='login'?0:!learn&&c.role==='student'?1:0;
  const signature=JSON.stringify([steps,selected]);const list=hero.querySelector('.rw-entry-steps');
  if(list.dataset.signature!==signature){list.dataset.signature=signature;list.replaceChildren(...steps.map((label,index)=>{const li=document.createElement('li'),number=document.createElement('span');number.textContent=String(index+1);number.setAttribute('aria-hidden','true');li.append(number,document.createTextNode(label));if(index===selected)li.setAttribute('aria-current','step');return li;}));}
 }
 window.RechtenEntry=Object.freeze({update:context=>{learned={...context};paint();}});
 if(!learn){
  let scheduled=false;
  const observer=new MutationObserver(records=>{if(records.every(r=>hero.contains(r.target)))return;if(!scheduled){scheduled=true;queueMicrotask(()=>{scheduled=false;paint();});}});
  observer.observe(document.querySelector('main'),{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','data-phase']});
  document.addEventListener('change',paint);window.AxiomaAuth?.onChange?.(()=>queueMicrotask(paint));paint();
 }
})();
