/* The OS owns navigation. These adapters keep the original game nodes and handlers. */
(function(root){
'use strict';
const action=(selector,label)=>({selector,label});
const menu=selector=>({selector});
const specs={
 'rechten-trainer':{header:'#app>header',actions:[menu('#trainerMenu button')]},
 'functies-rechten':{header:'#app>header',crumbs:'#headerTitle',tools:'.headerGroup,.learningChrome,.topActions',hide:'.brand,#levelGlyph,#headerTitle,#chapterName,#toggleTop,#showRoute',actions:[action('#showRoute','Lesroute'),action('#restart','Onderdeel opnieuw')],css:'#app{grid-template-rows:auto minmax(0,1fr)!important}'},
 'vectoren-trainer':{header:'#app>.trainer-header,body>.battle-top,body.classroom-app>header',crumbs:'.mission-breadcrumbs>button,.mission-breadcrumbs>span:not(.crumb-divider)',actions:[menu('#trainerMenu button'),action('#openRanking','Ranglijst')],css:'.vector-world{width:min(100%,calc(100dvh * 16 / 9))!important}@media(max-height:500px){.vector-world{width:min(100%,calc(100dvh * 2.5))!important}}@media(max-width:639px){.vector-world{width:100%!important}}'},
 'reele-getallen-trainer':{header:'#app>header',actions:[menu('header nav button')]},
 'wortelbouw':{header:'#topbar,#battleTopbar,body.classroom-app>header',crumbs:'.breadcrumbs>button',actions:[action('#proLevels','Opgaven kiezen'),action('#proOverview','Hele bouwwerk bekijken'),action('#proBattleSetup','Battle instellen'),action('#proSound','Geluid aan/uit')],css:'#app.proShell{grid-template-rows:0 64px minmax(0,1fr) auto!important}'},
 'stelsels':{header:'#app>header',tools:'.title-row,.method-tabs,.study-mode,#undoBtn,#resetBtn',hide:'.brand,.title',actions:[],css:'#app{grid-template-rows:auto minmax(0,1fr)!important}'},
 'algebra-smederij':{header:'#app>.topbar',crumbs:'#goalLabel',tools:'.mission-head',hide:'#familyLabel,#goalLabel',actions:[action('#gameHomeBtn','Speloverzicht'),action('#levelsBtn','Proeven kiezen')],css:'.mission-head:has(#assumptionLabel:empty){display:none!important}'},
 'kubusbouw':{header:'.game>header, #app>header, main>header',crumbs:'#title',actions:[action('#home','Bouwwerken kiezen'),action('#restart','Bouwwerk opnieuw')]},
 'data-check':{header:'#topbar',crumbs:'#levelLabel',actions:[action('#brandBtn','Speloverzicht'),action('#levelsBtn','Levels kiezen'),action('#helpBtn','Uitleg'),action('#resetBtn','Opgave opnieuw')],css:'#app{grid-template-rows:0 minmax(0,1fr) auto!important}#app>.stage{grid-row:2!important}#app>.dock{grid-row:3!important}'},
 'signal-lab':{header:'#app>.topbar',crumbs:'#phaseLabel',actions:[action('#menuBtn','Proeven kiezen'),action('#resetBtn','Proef opnieuw')]},
 'taartenwinkel':{header:'#game>header',crumbs:'#serviceName',actions:[action('#homeBtn','Speloverzicht'),action('#questionsBtn','Vragen en diensten'),action('#undo','Ongedaan maken'),action('#sound','Geluid aan/uit')]},
 'verfwinkel':{header:'#app>.topbar',crumbs:'#levelTitle',tools:'#orderBox',actions:[action('#homeBtn','Speloverzicht'),action('#menuBtn','Levels kiezen'),action('#soundBtn','Geluid aan/uit')]},
 'gravity-maze':{header:'#top-menu',crumbs:'#level-name',actions:[action('#level-menu','Kamers kiezen'),action('#reset','Kamer opnieuw'),action('#undo','Laatste zet ongedaan maken'),action('#pace','Animatiesnelheid'),action('#help','Spelregels')],css:'.play{--play-top:0px!important}#gravity-tools,#menu-handle,#menu-close{display:none!important}.field{inset:0 var(--rail) 0!important;padding:0!important}'},
 'pythagoras':{header:'#app>header,body>[id^=level]>header',crumbs:'header .title',actions:[menu('header button')]},
 'vectoren-canvas':{header:'body>header',actions:[],css:'body.canvas-app{grid-template-rows:0 auto minmax(0,1fr) auto!important}'},
 'getallenwereld':{header:'body>header',actions:[action('#trainerMenu [data-theme=machten]','Machten'),action('#trainerMenu [data-theme=wortels]','Vierkantswortels'),action('#trainerMenu [data-theme=wetenschappelijk]','Wetenschappelijke notatie'),action('#resumeMenu','Oefening hervatten'),action('#helpMenu','Hulp bij mijn opgave'),action('#trainerMenu [data-screen=setup]','Reeks kiezen'),action('#trainerMenu [data-screen=play]','Oefening hervatten')]},
 'bewerkingen-trainer':{header:'body>header',crumbs:'.breadcrumbs>span',actions:[action('#trainerMenu [data-screen=setup]','Reeks kiezen'),action('#trainerMenu [data-screen=play]','Oefening hervatten')]},
 // These apps already keep their real game HUD separate from platform navigation.
 'brandweer':{header:'#app>header.topbar',actions:[action('#modeBtn','Spelinstellingen')]},
 'kleiduifschieten':{header:'#app>header.topbar',actions:[]},
 'rechten-zeeslag':{header:'#app>header.topbar',actions:[]},
 'rechten-arcade':{header:'body>header.topbar',actions:[action('#arcadeMenu','Spellen kiezen')]},
 'glasraam':{header:'#atelier-header',actions:[]},
 'rechten-arbeid-les':{header:'body>header[data-collapsible-topbar]',actions:[]},
 // Their native adapters supply live breadcrumbs and navigation subscriptions.
 'rechtenwereld':{header:'.atlas-header,body>header[data-collapsible-topbar]',actions:[]},
 'algebra-trainer':{header:'.algebraChrome',actions:[]},
 'logicawereld':{header:'#platformHeader',actions:[]}
};
const excluded='#themeBtn,#theme,#fullBtn,#fullscreen,[data-fullscreen],[data-collapse-topbar],#collapseTopbarMenu,#battleBtn,#classBtn,#profileBtn,#cloudBtn,#groupBtn,#teacherBtn,#devBtn';
function mount(doc,{id,base,onChange=()=>{}}){
 const spec=specs[id];if(!spec||!doc?.body)return null;
 const win=doc.defaultView,marked=new Map(),grids=new Map();let raf=0,disposed=false;
 const sheet=doc.createElement('link');sheet.rel='stylesheet';sheet.href=new URL('os/native-chrome.css',base).href;doc.head.append(sheet);
 const style=doc.createElement('style');style.textContent=spec.css||'';doc.head.append(style);
 const previousApp=doc.body.getAttribute('data-os-native-app');doc.body.dataset.osNativeApp=id;
 function mark(node,name,value){if(node.getAttribute(name)===value)return;if(!marked.has(node))marked.set(node,new Map());const attrs=marked.get(node);if(!attrs.has(name))attrs.set(name,node.getAttribute(name));node.setAttribute(name,value);}
 function scan(){
  if(['rechtenwereld','algebra-trainer','logicawereld','getallenwereld','bewerkingen-trainer','glasraam','rechten-arbeid-les'].includes(id))return;
  for(const header of doc.querySelectorAll(spec.header)){
   if(spec.tools){
    mark(header,'data-os-native-header','tools');mark(header,'role','group');mark(header,'aria-label','Oefenbediening');
    for(const node of header.querySelectorAll(spec.tools)){mark(node,'data-os-task-control','');for(let p=node.parentElement;p&&p!==header;p=p.parentElement)mark(p,'data-os-task-container','');}
    if(spec.hide)for(const node of header.querySelectorAll(spec.hide))mark(node,'data-os-native-hidden','');
   }else mark(header,'data-os-native-header','hidden');
   const parent=header.parentElement,css=win.getComputedStyle(parent);
   if(!header.hidden&&!grids.has(parent)&&css.display==='grid'&&!['absolute','fixed'].includes(win.getComputedStyle(header).position)){
    const rows=css.gridTemplateRows.split(/\s+/).length;
    if(rows>=2&&rows<=4){grids.set(parent,true);mark(parent,'data-os-native-grid',String(rows));}
   }
  }
 }
 // Ignore our concealed header itself, but never expose a control from an inactive screen.
 function active(node,{ownHidden=true}={}){
  if(ownHidden&&(node.hidden||node.hasAttribute('data-nav-hidden')))return false;
  for(let p=node.parentElement;p&&p!==doc.body;p=p.parentElement){
   if(p.matches('[data-os-native-header],#trainerMenu,#main-menu,.appNav,.breadcrumbs,.mission-breadcrumbs'))continue;
   if(p.hidden)return false;
   if(p.closest('[data-os-native-header]')||id==='gravity-maze'&&p.id==='gravity-tools')continue;
   if(win.getComputedStyle(p).display==='none')return false;
  }
  return true;
 }
 function actions(){const result=[],seen=new Set();for(const entry of spec.actions){for(const node of doc.querySelectorAll(entry.selector)){
  if(seen.has(node)||node.matches(excluded)||!active(node))continue;seen.add(node);
  const copy=node.cloneNode(true);copy.querySelectorAll('small,svg,[aria-hidden=true],.menu-icon').forEach(n=>n.remove());
  const label=entry.label||node.getAttribute('aria-label')||node.title||copy.textContent.trim().replace(/\s+/g,' ');if(!label)continue;
  result.push({node,label,disabled:node.disabled||node.getAttribute('aria-disabled')==='true',pressed:node.getAttribute('aria-pressed'),current:node.getAttribute('aria-current')});
 }}return result;}
 function crumbs(){return spec.crumbs?[...doc.querySelectorAll(spec.crumbs)].filter(n=>active(n)&&n.textContent.trim()):[];}
 function changed(){if(raf||disposed)return;raf=win.requestAnimationFrame(()=>{raf=0;scan();onChange();});}
 doc.addEventListener('click',changed);doc.addEventListener('change',changed);
 scan();const contextSelector=spec.header+(spec.crumbs?','+spec.crumbs:'');
 const observer=new win.MutationObserver(records=>{
  if(records.some(r=>!['class','style'].includes(r.attributeName)||r.target.matches(contextSelector)||r.target.querySelector(contextSelector)))changed();
 });
 observer.observe(doc.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','disabled','aria-disabled','aria-pressed','aria-current','data-screen','class','style']});
 sheet.addEventListener('load',()=>{win.dispatchEvent(new win.Event('resize'));changed();},{once:true});
 return {actions,crumbs,refresh:scan,dispose(){disposed=true;doc.removeEventListener('click',changed);doc.removeEventListener('change',changed);observer.disconnect();win.cancelAnimationFrame(raf);sheet.remove();style.remove();for(const [node,attrs] of marked)for(const [name,value] of attrs)value===null?node.removeAttribute(name):node.setAttribute(name,value);if(previousApp===null)delete doc.body.dataset.osNativeApp;else doc.body.dataset.osNativeApp=previousApp;}};
}
root.LeraarBobNativeChrome={mount,ids:Object.keys(specs)};
})(window);
