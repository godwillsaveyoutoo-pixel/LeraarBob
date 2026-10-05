/* One set of destinations for all standalone Algebrawereld screens. */
(()=>{
'use strict';
function mount(api){
 if(document.querySelector('.algebraSectionNav'))return;
 const classroom=document.body.classList.contains('algebra-classroom');
 const world=api?.world||'Vergelijkingen',systems=world==='Stelsels',base=systems?'stelsels.html':'index.html';
 const destinations=[['world','Werelden','index.html?screen=world'],['menu','Levels',base+'?screen=menu'],['battle','Klasbattle','../../klasbattle/?game=algebra']];
 const nav=document.createElement('nav');nav.className='algebraSectionNav';nav.setAttribute('aria-label','Algebrawereld');
 for(const [id,label,href] of destinations){const a=document.createElement('a');a.href=href;a.dataset.section=id;a.textContent=label;nav.append(a);if(api&&id!=='battle')a.onclick=e=>{e.preventDefault();api.navigate(id);};}
 document.querySelector('main').before(nav);
 const header=document.querySelector('.algebraChrome'),crumbs=document.createElement('nav');crumbs.className='breadcrumbs';crumbs.hidden=true;
 const gameLink=document.createElement('button');gameLink.type='button';gameLink.id='crumbWorld';gameLink.textContent='Algebrawereld';gameLink.onclick=()=>api?api.navigate('world'):location.assign('index.html?screen=world');crumbs.append(gameLink);
 const worldLink=document.createElement('button');worldLink.type='button';worldLink.textContent=world;worldLink.onclick=()=>api?api.navigate('menu'):location.assign(base+'?screen=menu');
 const section=document.createElement('span');crumbs.append(worldLink,section);(header.querySelector('.lb-gamebar')||header).append(crumbs);
 // These nodes feed the shared menu and keep its actions in the current app.
 let menu=header.querySelector('#trainerMenu');if(!menu){menu=document.createElement('nav');menu.id='trainerMenu';menu.hidden=true;header.append(menu);}
 for(const [id,label,href] of destinations){if(menu.querySelector('[data-section="'+id+'"]'))continue;const a=document.createElement('a');a.href=href;a.dataset.section=id;a.textContent=label;if(api&&id!=='battle')a.onclick=e=>{e.preventDefault();api.navigate(id);};menu.append(a);}
 for(const old of menu.querySelectorAll('[data-trainer-menu],[data-nav=tools]'))old.hidden=true;
 function update(){const screen=api?.screen()||'battle',id=({trainer:'menu',work:'menu',history:'menu',systemHistory:'menu',summary:'menu',systemSummary:'menu',paper:'preview'})[screen]||screen;
  nav.querySelectorAll('a').forEach(a=>a.setAttribute('aria-current',a.dataset.section===id?'page':'false'));
  worldLink.hidden=screen==='world';section.hidden=screen==='world'||screen==='menu';section.textContent=({setup:'Eigen reeks',preview:'Oefenblad',paper:'Oefenblad',trainer:'Oefenen',work:'Oefenen',history:'Stappen',systemHistory:'Stappen',summary:'Resultaat',systemSummary:'Resultaat',tools:'Werkvormen',battle:'Klasbattle'})[screen]||'';
 }
 new MutationObserver(update).observe(document.body,{attributes:true,attributeFilter:['data-screen']});update();
}
window.AlgebraShell=Object.freeze({mount});
if(document.body.classList.contains('algebra-classroom'))mount();
})();
