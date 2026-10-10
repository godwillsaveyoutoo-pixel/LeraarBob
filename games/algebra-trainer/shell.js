/* Native algebra destinations; the OS can present the same live actions once. */
(()=>{
'use strict';
let mounted=null,embedded=false;const listeners=new Set();
function desktopParent(){try{return window.parent!==window&&window.parent.location.origin===location.origin&&!!window.parent.LeraarBobDesktop;}catch{return false;}}
function presentation(){document.body.classList.toggle('algebra-os-embedded',embedded);document.body.dataset.osEmbedded=String(embedded);}
function setEmbedded(value){embedded=value===true&&desktopParent();presentation();refresh();return embedded;}
function openRoute(href){let url;try{url=new URL(href,location.href);if(url.origin!==location.origin||!['http:','https:'].includes(url.protocol))return false;}catch{return false;}if(embedded){const event=new CustomEvent('leraarbob:algebra-route',{detail:{href:url.href},cancelable:true});document.dispatchEvent(event);if(event.defaultPrevented)return true;}location.assign(url.href);return true;}
function context(){if(!mounted)return null;return {...mounted.read(),destinations:mounted.destinations().map(item=>({...item}))};}
function subscribe(listener){if(typeof listener!=='function')return ()=>{};listeners.add(listener);const value=context();if(value)listener(value);return ()=>listeners.delete(listener);}
function refresh(){mounted?.update();const value=context();if(!value)return;const signature=JSON.stringify(value);if(signature===mounted.signature)return;mounted.signature=signature;for(const listener of listeners){try{listener(value);}catch{}}window.dispatchEvent(new CustomEvent('leraarbob:algebra-navigation',{detail:value}));}
function navigate(id){if(!mounted||!['world','menu','tools','setup'].includes(id)||window.AxiomaGame?.active===false)return false;mounted.navigate(id);refresh();return true;}
function mount(api){
 if(mounted)return;
 const classroom=document.body.classList.contains('algebra-classroom');
 const params=new URLSearchParams(location.search),route=window.LeraarBobRoutes;let originWorld=params.get('world')||params.get('topic');const world=api?.world||(originWorld==='systems'?'Stelsels':'Vergelijkingen'),systems=world==='Stelsels',base=systems?'stelsels.html':'index.html';
 const standaloneContext=()=>({...route?.read(location.href),gameId:'algebra-trainer',world:originWorld==='systems'?'systems':'equations',topic:originWorld==='systems'?'systems':'equations'});
 const standaloneHref=target=>route?route.href(target==='battle'?'klasbattle/':target==='world'?'games/algebra-trainer/index.html':'games/algebra-trainer/'+base,{...standaloneContext(),screen:target==='battle'?'':target}):target==='battle'?'../../klasbattle/?game=algebra':target==='world'?'index.html?screen=world':base+'?screen='+target;
 const destinations=classroom?[['world','Werelden'],['menu','Levels'],['battle','Klasbattle']]:[['world','Werelden'],['menu','Levels'],['tools','Werkvormen']];
 const nav=document.createElement('nav');nav.className='algebraSectionNav';nav.setAttribute('aria-label','Algebra');
 const href=id=>api?(id==='world'?'index.html?screen=world':id==='battle'?'../../klasbattle/?game=algebra':base+'?screen='+id):standaloneHref(id);
 function act(id){if(window.AxiomaGame?.active===false&&api)return;if(api&&id!=='battle')api.navigate(id);else location.assign(standaloneHref(id));}
 function link(id,label){const a=document.createElement('a');a.href=href(id);a.dataset.section=id;if(id==='battle'&&route)a.setAttribute('data-platform-route','');a.textContent=label;if(api&&id!=='battle')a.onclick=e=>{e.preventDefault();act(id);};return a;}
 for(const [id,label] of destinations)nav.append(link(id,label));
 document.querySelector('main').before(nav);
 const header=document.querySelector('.algebraChrome'),crumbs=document.createElement('nav');crumbs.className='breadcrumbs';crumbs.hidden=true;
 const gameLink=document.createElement('button');gameLink.type='button';gameLink.textContent='Algebra';gameLink.onclick=()=>act('world');crumbs.append(gameLink);
 const worldLink=document.createElement('button');worldLink.type='button';worldLink.textContent=world;worldLink.onclick=()=>act('menu');
 const section=document.createElement('span');crumbs.append(worldLink,section);(header.querySelector('.lb-gamebar')||header).append(crumbs);
 // Original menu/progress nodes retain their native listeners in embedded mode.
 let menu=header.querySelector('#trainerMenu');if(!menu){menu=document.createElement('nav');menu.id='trainerMenu';menu.hidden=true;header.append(menu);}
 for(const [id,label] of [...destinations,...(!classroom?[['battle','Klasbattle']]:[])]){if(!menu.querySelector('[data-section="'+id+'"]'))menu.append(link(id,label));}
 for(const old of menu.querySelectorAll('[data-trainer-menu],[data-nav=tools]'))old.hidden=true;
 function read(){const native=api?.state?.()||{},screen=api?.screen()||'battle',routeContext=api?.route?.()||standaloneContext();return {gameId:'algebra-trainer',world:screen==='world'?'overview':systems?'systems':'equations',worldTitle:world,screen,level:screen==='world'?'':native.level??routeContext.level??'',levelTitle:screen==='world'?'':native.levelTitle||'',title:api?.title?.()||''};}
 function active(){const screen=api?.screen()||'battle';return screen==='world'?'world':['tools','setup','preview','paper'].includes(screen)?'tools':screen==='battle'?'battle':'menu';}
 function update(){
  const routes=window.LeraarBobRoutes;if(routes&&api?.route){const ctx=api.route();for(const a of document.querySelectorAll('#trainerMenu [data-section=battle],[data-algebra-battle]'))a.href=routes.href('klasbattle/',ctx);}
  const screen=api?.screen()||'battle';nav.querySelectorAll('a').forEach(a=>a.setAttribute('aria-current',a.dataset.section===active()?'page':'false'));
  worldLink.hidden=screen==='world';section.hidden=screen==='world'||screen==='menu';section.textContent=['trainer','work'].includes(screen)?(api?.title?.()||'Oefenen'):({setup:'Eigen reeks',preview:'Oefenblad',paper:'Oefenblad',history:'Stappen',systemHistory:'Stappen',summary:'Resultaat',systemSummary:'Resultaat',tools:'Werkvormen',battle:'Klasbattle'})[screen]||'';
 }
 mounted={read,update,navigate:act,destinations:()=>destinations.filter(([id])=>id!=='battle').map(([id,label])=>({id,label,active:id===active()})),signature:''};
 new MutationObserver(refresh).observe(document.body,{attributes:true,attributeFilter:['data-screen']});
 if(params.get('osEmbed')==='1'&&desktopParent())embedded=true;presentation();refresh();
}
function classroomOrigin(world){const systems=world==='systems',routes=window.LeraarBobRoutes,ctx={...routes?.read(location.href),gameId:'algebra-trainer',world:systems?'systems':'equations',topic:systems?'systems':'equations',screen:'menu'};const href=routes?routes.href(systems?'games/algebra-trainer/stelsels.html':'games/algebra-trainer/index.html',ctx):(systems?'stelsels.html':'index.html')+'?screen=menu';const topic=document.getElementById('classOriginTopic');if(topic){topic.textContent=systems?'Stelsels':'Vergelijkingen';topic.href=href;}for(const a of document.querySelectorAll('.algebraSectionNav [data-section=menu],#trainerMenu [data-section=menu]'))a.href=href;if(routes)for(const a of document.querySelectorAll('.algebraSectionNav [data-section=battle],#trainerMenu [data-section=battle]'))a.href=routes.href('klasbattle/',{...ctx,screen:''});const crumb=document.querySelector('.algebraChrome .breadcrumbs button:nth-child(2)');if(crumb){crumb.textContent=systems?'Stelsels':'Vergelijkingen';crumb.onclick=()=>location.assign(href);}refresh();return href;}
window.AlgebraShell=window.LeraarBobAlgebraShell=Object.freeze({mount,classroomOrigin,setEmbedded,context,navigate,subscribe,refresh,openRoute});
if(new URLSearchParams(location.search).get('osEmbed')==='1'&&desktopParent())setEmbedded(true);
if(document.body.classList.contains('algebra-classroom')){mount();classroomOrigin(new URLSearchParams(location.search).get('world')||new URLSearchParams(location.search).get('topic'));}
})();
