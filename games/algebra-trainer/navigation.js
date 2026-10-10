(()=>{
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const examples=Object.freeze({
 'route-inverse':'x+4=9','route-two':'3x+6=18','route-sign':'10-2x=4','route-both':'3x=x+8',
 'route-brackets':'2(x+3)=14','route-fractions':'\\frac{x}{3}+\\frac{1}{2}=\\frac{5}{6}','route-check':'4x+6=2x+10',
 'sys-graphic':'\\begin{cases}y=x+1\\\\y=-x+5\\end{cases}',
 'sys-substitution':'\\begin{cases}x=y+2\\\\x+y=8\\end{cases}',
 'sys-combination':'\\begin{cases}2x+y=7\\\\x-y=2\\end{cases}',
 'sys-unique':'\\begin{cases}x+y=5\\\\x-y=1\\end{cases}',
 'sys-none':'\\begin{cases}x+y=3\\\\x+y=5\\end{cases}',
 'sys-infinite':'\\begin{cases}x+y=3\\\\2x+2y=6\\end{cases}'
});
const icons={world:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7h14M5 17h14"/>',setup:'<path d="M5 20V10h3v10M11 20V4h3v16M17 20v-7h3v7"/>',preview:'<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6"/>',battle:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-4a6 6 0 0 1 12 0v4M17 4a3 3 0 0 1 0 6M18 13a5 5 0 0 1 3 4v4"/>'};
function icon(id){return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+icons[id]+'</svg>';}
function math(tex){return window.katex?katex.renderToString(tex,{throwOnError:false,output:'htmlAndMathml'}):esc(tex);}
function mount(api){
 const $=s=>document.querySelector(s);let previous=api.canResume()?(api.resumeScreen||'trainer'):(api.homeScreen||'world'),origin=null,selected=null;
 const R=window.LeraarBobRoutes;let router=null;
 selected=R?.read(location.href).level||api.routeRead?.()?.level||null;
 const worldId=()=>api.world()==='Stelsels'?'systems':'equations';
 function context(){return {gameId:'algebra-trainer',world:api.routeWorld?.()||worldId(),topic:api.routeWorld?.()||worldId(),level:selected||'',runLevel:api.activeLevel?.()||'',screen:api.screen(),returnTo:R?.read(location.href).returnTo||api.routeRead?.()?.returnTo||''};}
 function sync(){if(router)router.update(context());else api.routeSave?.(context());window.AlgebraShell?.refresh();}
 function choose(id){if(window.AxiomaGame?.active===false)return;if(!api.stops().some(s=>s.id===id))return;selected=id;render();sync();}
 function connect(){if(!R||router)return;const owner=AxiomaGame.account?.id;window.AxiomaAuth?.onChange(detail=>{if(detail.pending||!AxiomaGame.active||detail.account?.id!==owner){const main=document.querySelector('main');if(main){main.style.visibility='hidden';main.inert=true;}const badge=document.querySelector('#algebraProgress,#seriesProgress');if(badge){badge.dataset.value='0';badge.textContent='';}}});router=R.mount({gameId:'algebra-trainer',enabled:()=>AxiomaGame.active,read:context,onChange:c=>api.routeSave?.(c),apply:c=>{if(api.stops().some(s=>s.id===c.level))selected=c.level;api.routeApply?.(c);const target=c.screen;if(['preview','paper'].includes(target)&&c.level){api.worksheet?.(c.level);render();return;}if(['trainer','work','history','systemHistory','summary','systemSummary'].includes(target)&&api.routeResume?.(c.runLevel||c.level)===false){api.show('menu');render();return;}if(['trainer','work','history','systemHistory','summary','systemSummary'].includes(target)&&!api.canResume())api.show('menu');else if(['world','menu','setup','tools','trainer','work','history','systemHistory','summary','systemSummary','preview','paper'].includes(target))api.show(target);else api.show('menu');render();}});}
 function externalContext(){const back=api.screen()==='world'?'world':'menu';return {...context(),returnTo:router?.returnTo(back)||R?.href(location.href,{...context(),screen:back,returnTo:''})};}
 function render(){
  const stops=api.stops();
  if(!stops.some(s=>s.id===selected))selected=(stops.find(s=>s.current)||stops[0])?.id;
  const chosen=stops.find(s=>s.id===selected),started=chosen?.status==='Bezig';
  $('#navigationTitle').textContent=api.world();$('#navigationBreadcrumb').textContent='Algebrawereld › '+api.world();$('#navigationRouteTitle').textContent=stops.length+' levels';
  $('#navigationContext').innerHTML=chosen?'<strong>'+esc(chosen.title)+'</strong><span> · '+(started&&chosen.current?'opdracht '+esc(api.position()):started?'bewaarde reeks':/geoefend|gelukt/i.test(chosen.status)?'opnieuw oefenen':String(chosen.total||6)+' opdrachten')+'</span>':'Kies een level.';
  $('#navigationActions').innerHTML=[['world','Werelden'],['menu','Levels']].map(([id,title])=>'<button type="button" data-menu-nav="'+id+'">'+icon(id)+'<span>'+title+'</span></button>').join('')+(window.AXIOMA_STANDALONE?'<button type="button" data-menu-nav="battle" disabled title="Klasbattle is beschikbaar in de platformversie">'+icon('battle')+'<span>Klasbattle<small>Online</small></span></button>':'<a data-menu-nav="battle" data-platform-route href="'+esc(R?R.href('klasbattle/',externalContext()):api.battleHref||'../../klasbattle/?game=algebra')+'" title="Naar het klasbattleoverzicht van leraarBob">'+icon('battle')+'<span>Klasbattle</span></a>');
  $('#navigationStops').dataset.count=stops.length;
  $('#navigationStops').innerHTML=stops.map(s=>{
   const tex=s.exampleTex||examples[s.id];
   const status=s.status==='Zelfstandig gelukt'?'independent':/geoefend/i.test(s.status)?'finished':s.status==='Bezig'?'started':'new';
   return '<button type="button" class="menuStop" data-menu-stop="'+esc(s.id)+'" data-status="'+status+'" aria-pressed="'+(s.id===selected)+'" aria-current="'+(s.current?'step':'false')+'"><span class="menuStopHeading"><span class="menuStopNumber">'+String(s.number).padStart(2,'0')+'</span><strong>'+(s.id==='sys-infinite'?'<span class="menuStopFullTitle">'+esc(s.title)+'</span><span class="menuStopShortTitle">Oneindig veel</span>':esc(s.title))+'</strong></span><span class="menuStopExample" data-math-tex="'+esc(tex||'')+'">'+(tex?math(tex):esc(s.example||''))+'</span><span class="menuStopStatus"><span class="menuStatusDot" aria-hidden="true">'+(status==='independent'?'✓':'')+'</span>'+esc(s.status)+'</span></button>';
  }).join('');
  $('.menuContinue').disabled=!chosen;
  $('.menuContinue').textContent=started?'Verder spelen →':/geoefend|gelukt/i.test(chosen?.status||'')?'Opnieuw spelen →':'Spelen →';
  $('#navigationResumeFree').hidden=!api.canResumeFree?.();$('#navigationWorksheet').disabled=!chosen;
  $('#navigationStatus').textContent='Elke afgeronde speelronde: +30 XP';
 }
 function open(button){if(window.AxiomaGame?.active===false)return;if(api.screen()!=='menu'){previous=api.screen();origin=button;if(!selected)selected=api.stops().find(s=>s.current)?.id||selected;}api.show('menu');$('#navigationStops').querySelector('[aria-pressed=true]')?.focus({preventScroll:true});}
 function close(){if(window.AxiomaGame?.active===false)return;api.show(previous==='menu'?(api.homeScreen||'world'):previous);origin?.focus({preventScroll:true});}
 document.querySelectorAll('[data-trainer-menu]').forEach(b=>b.onclick=()=>open(b));
 $('#navigationClose').onclick=close;
 $('.menuBrand').onclick=()=>api.navigate('world');
 $('#navigationScreen').addEventListener('click',e=>{const b=e.target.closest('[data-menu-nav]');if(b&&!b.disabled&&b.dataset.menuNav!=='battle')b.dataset.menuNav==='menu'?open(b):api.navigate(b.dataset.menuNav);});
 $('#navigationResumeFree').onclick=()=>api.resumeFree?.();
 $('#navigationWorksheet').onclick=()=>{if(selected)api.worksheet?.(selected);};
 $('#navigationStops').onclick=e=>{const b=e.target.closest('[data-menu-stop]');if(b){choose(b.dataset.menuStop);$('#navigationStops').querySelector('[data-menu-stop="'+selected+'"]')?.focus({preventScroll:true});}};
 $('#trainerFullscreenBtn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('#navigationStatus').textContent='Volledig scherm is hier niet beschikbaar.';}};
 document.addEventListener('fullscreenchange',()=>{$('#trainerFullscreenBtn').textContent=document.fullscreenElement?'Venster herstellen':'Volledig scherm';});
 $('#trainerProfileBtn').onclick=()=>document.getElementById('axioma-game-status')?.shadowRoot?.querySelector('.dock')?.click();
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&api.screen()==='menu'&&!e.composedPath().some(n=>n.id==='axioma-game-status'||n.tagName==='DIALOG'&&n.open)){e.preventDefault();close();}});
 $('.menuContinue').onclick=()=>{const s=api.stops().find(s=>s.id===selected);if(!s)return;if(s.current&&s.status==='Bezig'&&api.canResume())api.navigate('trainer');else api.start(s.startId||s.id);};
 window.AlgebraShell?.mount({world:api.world(),screen:api.screen,title:api.title,route:externalContext,state:()=>{const level=['trainer','work','history','systemHistory','summary','systemSummary'].includes(api.screen())?api.activeLevel?.()||'':selected;return {level,levelTitle:api.stops().find(stop=>stop.id===level)?.title||api.title?.()||''};},navigate:id=>id==='menu'?open():api.navigate(id)});
 return {render,open,select:choose,selected:()=>selected,sync,connect,context,externalContext};
}
window.AlgebraNavigation=Object.freeze({mount});
})();
