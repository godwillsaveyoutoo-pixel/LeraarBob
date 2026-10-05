/* One set of destinations for all standalone Algebrawereld screens. */
(()=>{
'use strict';
function mount(api){
 if(document.querySelector('.algebraSectionNav'))return;
 const classroom=document.body.classList.contains('algebra-classroom');
 const params=new URLSearchParams(location.search),route=window.LeraarBobRoutes;let originWorld=params.get('world')||params.get('topic');const world=api?.world||(originWorld==='systems'?'Stelsels':'Vergelijkingen'),systems=world==='Stelsels',base=systems?'stelsels.html':'index.html';
 const standaloneContext=()=>({...route?.read(location.href),gameId:'algebra-trainer',world:originWorld==='systems'?'systems':'equations',topic:originWorld==='systems'?'systems':'equations'});
 const standaloneHref=target=>route?route.href(target==='battle'?'klasbattle/':target==='world'?'games/algebra-trainer/index.html':'games/algebra-trainer/'+base,{...standaloneContext(),screen:target==='battle'?'':target}):target==='battle'?'../../klasbattle/?game=algebra':target==='world'?'index.html?screen=world':base+'?screen=menu';
 const destinations=[['world','Werelden','index.html?screen=world'],['menu','Levels',base+'?screen=menu'],['battle','Klasbattle','../../klasbattle/?game=algebra']];
 const nav=document.createElement('nav');nav.className='algebraSectionNav';nav.setAttribute('aria-label','Algebrawereld');
 for(const [id,label,href] of destinations){const a=document.createElement('a');a.href=api?href:standaloneHref(id);a.dataset.section=id;if(id==='battle'&&route)a.setAttribute('data-platform-route','');a.textContent=label;nav.append(a);if(api&&id!=='battle')a.onclick=e=>{e.preventDefault();if(window.AxiomaGame?.active!==false)api.navigate(id);};}
 document.querySelector('main').before(nav);
 const header=document.querySelector('.algebraChrome'),crumbs=document.createElement('nav');crumbs.className='breadcrumbs';crumbs.hidden=true;
 const gameLink=document.createElement('button');gameLink.type='button';gameLink.id='crumbWorld';gameLink.textContent='Algebrawereld';gameLink.onclick=()=>window.AxiomaGame?.active===false&&api?undefined:api?api.navigate('world'):location.assign(standaloneHref('world'));crumbs.append(gameLink);
 const worldLink=document.createElement('button');worldLink.type='button';worldLink.textContent=world;worldLink.onclick=()=>window.AxiomaGame?.active===false&&api?undefined:api?api.navigate('menu'):location.assign(standaloneHref('menu'));
 const section=document.createElement('span');crumbs.append(worldLink,section);(header.querySelector('.lb-gamebar')||header).append(crumbs);
 // These nodes feed the shared menu and keep its actions in the current app.
 let menu=header.querySelector('#trainerMenu');if(!menu){menu=document.createElement('nav');menu.id='trainerMenu';menu.hidden=true;header.append(menu);}
 for(const [id,label,href] of destinations){if(menu.querySelector('[data-section="'+id+'"]'))continue;const a=document.createElement('a');a.href=api?href:standaloneHref(id);a.dataset.section=id;if(id==='battle'&&route)a.setAttribute('data-platform-route','');a.textContent=label;if(api&&id!=='battle')a.onclick=e=>{e.preventDefault();if(window.AxiomaGame?.active!==false)api.navigate(id);};menu.append(a);}
 for(const old of menu.querySelectorAll('[data-trainer-menu],[data-nav=tools]'))old.hidden=true;
 function update(){const routes=window.LeraarBobRoutes;if(routes&&api?.route){const ctx=api.route();for(const a of [...nav.querySelectorAll('[data-section=battle]'),...menu.querySelectorAll('[data-section=battle]')])a.href=routes.href('klasbattle/',ctx);}const screen=api?.screen()||'battle',id=({trainer:'menu',work:'menu',history:'menu',systemHistory:'menu',summary:'menu',systemSummary:'menu',paper:'preview'})[screen]||screen;
  nav.querySelectorAll('a').forEach(a=>a.setAttribute('aria-current',a.dataset.section===id?'page':'false'));
  worldLink.hidden=screen==='world';section.hidden=screen==='world'||screen==='menu';section.textContent=['trainer','work'].includes(screen)?(api?.title?.()||'Oefenen'):({setup:'Eigen reeks',preview:'Oefenblad',paper:'Oefenblad',history:'Stappen',systemHistory:'Stappen',summary:'Resultaat',systemSummary:'Resultaat',tools:'Werkvormen',battle:'Klasbattle'})[screen]||'';
 }
 new MutationObserver(update).observe(document.body,{attributes:true,attributeFilter:['data-screen']});update();
}
function classroomOrigin(world){const systems=world==='systems',routes=window.LeraarBobRoutes,ctx={...routes?.read(location.href),gameId:'algebra-trainer',world:systems?'systems':'equations',topic:systems?'systems':'equations',screen:'menu'};const href=routes?routes.href(systems?'games/algebra-trainer/stelsels.html':'games/algebra-trainer/index.html',ctx):(systems?'stelsels.html':'index.html')+'?screen=menu';const topic=document.getElementById('classOriginTopic');if(topic){topic.textContent=systems?'Stelsels':'Vergelijkingen';topic.href=href;}for(const a of document.querySelectorAll('.algebraSectionNav [data-section=menu],#trainerMenu [data-section=menu]'))a.href=href;if(routes)for(const a of document.querySelectorAll('.algebraSectionNav [data-section=battle],#trainerMenu [data-section=battle]'))a.href=routes.href('klasbattle/',{...ctx,screen:''});const crumb=document.querySelector('.algebraChrome .breadcrumbs button:nth-child(2)');if(crumb){crumb.textContent=systems?'Stelsels':'Vergelijkingen';crumb.onclick=()=>location.assign(href);}return href;}
window.AlgebraShell=Object.freeze({mount,classroomOrigin});
if(document.body.classList.contains('algebra-classroom')){mount();classroomOrigin(new URLSearchParams(location.search).get('world')||new URLSearchParams(location.search).get('topic'));}
})();
