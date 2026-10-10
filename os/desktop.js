/* The desktop owns navigation. The native app owns questions, input and saves. */
(async()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const icons={
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
    folder:'<path d="M3 6h6l2 2h10v12H3Z"/>',paper:'<path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v5h4M9 12h6M9 16h6"/>',
    graph:'<path d="M4 3v17h17M5 18 19 6M9 5v14M5 14h14"/>',number:'<path d="M4 5h7M7 2v6M15 5h6M4 15l6 6M4 21l6-6M15 15h6M15 21h6"/>',
    algebra:'<path d="m4 7 7 10M4 17 7 7M15 9h6M15 15h6"/>',vector:'<path d="M4 19 19 4M12 4h7v7M4 4v15h15"/>',
    triangle:'<path d="M4 20V4l16 16ZM4 16h4v4"/>',cube:'<path d="m12 3 9 5v9l-9 5-9-5V8ZM3 8l9 5 9-5M12 13v9M8 5l9 5"/>',
    chart:'<path d="M4 4v16h17M8 16v-5M13 16V6M18 16v-8"/>',puzzle:'<path d="M4 4h6a3 3 0 1 1 6 0h4v6a3 3 0 1 0 0 6v4h-6a3 3 0 1 0-6 0H4v-6a3 3 0 1 0 0-6Z"/>',
    book:'<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1ZM12 5v15"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',game:'<path d="M6 8h12c3 0 4 11 1 11l-4-3H9l-4 3C2 19 3 8 6 8ZM6 11v4M4 13h4M16 12h.01M18 14h.01"/>',
    brush:'<path d="m11 13 7-10 3 3-10 7M11 13c0 7-6 7-8 7 3-2 0-6 5-7Z"/>',
    people:'<circle cx="9" cy="7" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 13a5 5 0 0 1 3 4v3"/>',account:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3"/>',
    settings:'<path d="m10 3 4 0 1 3 3 1 3-1 2 4-3 2v3l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-3l-3-2 2-4 3 1 3-1Z" transform="translate(0 -1) scale(.92)"/><circle cx="12" cy="12" r="3"/>',
    desktop:'<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M8 21h8M12 16v5"/>',minus:'<path d="M5 12h14"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',back:'<path d="m10 5-7 7 7 7M3 12h18"/>',
    arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',external:'<path d="M14 3h7v7M10 14 21 3M10 3H3v18h18v-7"/>',bookmark:'<path d="M6 3h12v18l-6-4-6 4Z"/>',pin:'<path d="m8 3 8 0-1 7 4 4H5l4-4ZM12 14v8"/>',
    more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',battle:'<path d="m4 4 16 16M20 4 4 20M4 4h5M4 4v5M20 4h-5M20 4v5M2 17l5 5M17 22l5-5"/>',
    class:'<path d="M3 3h18v13H3ZM8 21l4-5 4 5M7 8h10M7 12h6"/>',check:'<path d="m4 12 5 5L20 6"/>'
  };
  const svg=name=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name]||icons.folder}</svg>`;
  function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
  function icon(name){const n=document.createElement('span');n.innerHTML=svg(name);return n.firstChild;}
  function button(text,cls,action){const n=el('button',cls,text);n.type='button';if(action)n.addEventListener('click',action);return n;}
  function imageFor(g){const n=el('img');n.src=new URL(g.cover||'assets/covers/graph.svg',MBase()).href;n.alt='';n.loading='lazy';n.decoding='async';return n;}
  document.querySelectorAll('[data-icon]').forEach(n=>n.replaceWith(icon(n.dataset.icon)));
  const Registry=window.LeraarBobGameRegistry;
  try{await Registry.ready();}catch{$('accountStatus').textContent='De apps konden niet laden. Herlaad het bureaublad.';return;}
  const M=window.LeraarBobDesktopModel,base=Registry.baseURL,home=new URL('os/',base).href;
  function MBase(){return base;}
  let account=null,resolved=false,authPending=true,prefs=M.sanitize(null),overview=null,progressState='guest',request=0,controller=null;
  let view={kind:'desktop',themeId:'',type:'all',query:''},activeKey=null,toastTimer,progressTimer,startReturnFocus=null,crumbDocument=null,crumbSignature='',worksheetRenderTurn=0;
  const frames=new Map();
  const role=()=>['student','teacher'].includes(account?.role)?account.role:'guest';
  const safeStorage=()=>{try{return localStorage;}catch{return {getItem:()=>null,setItem:()=>{throw Error('Opslag niet beschikbaar');}};}};
  function persist(){try{prefs=M.write(safeStorage(),account,prefs);return true;}catch{toast('Je browser bewaart deze bureaubladkeuze niet.');return false;}}
  function toast(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').hidden=false;toastTimer=setTimeout(()=>{$('toast').hidden=true;},4300);}
  function typeBadge(type){const t=M.types[type],n=el('span','type-badge');n.dataset.type=type;n.append(icon(t.icon),document.createTextNode(t.label));return n;}
  function folderArt(t){const n=el('span');n.innerHTML=`<svg class="folder-art" style="--folder-color:${t.color}" viewBox="0 0 110 84" aria-hidden="true"><path class="folder-back" d="M8 12a7 7 0 0 1 7-7h28l8 9h45a7 7 0 0 1 7 7v48H8Z"/><path class="folder-front" d="M8 24h89a6 6 0 0 1 6 6l-3 41a7 7 0 0 1-7 7H15a7 7 0 0 1-7-7L5 30a6 6 0 0 1 3-6Z"/><path class="folder-line" d="M14 28h78"/><svg class="folder-symbol" x="37" y="36" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${icons[t.icon]}</svg></svg>`;return n.firstChild;}
  function isOpen(g){return [...frames.values()].some(f=>f.app.id===g.id);}
  function summary(g){if(progressState!=='ready'||!Registry.game(g.id))return null;const source=window.LeraarBobCatalogProgress;return source.summarize(g,source.savedFor(g,overview));}
  function renderHome(){
    const name=account?.alias||'';
    $('greeting').textContent=name?`Welkom, ${name}.`:role()==='teacher'?'Welkom, leraar.':'Welkom op je bureaublad.';
    $('greetingSub').textContent=role()==='teacher'?'Jouw lessen, werelden en klasactiviteiten op één plek.':'Ontdek, oefen, speel. Jij kiest waar je begint.';
    $('accountStatus').textContent=authPending?'Account controleren…':account?`${account.role==='teacher'?'Leraar':account.role==='student'?'Leerling':'Accountcontrole nodig'} · ${name||account.email||'aangemeld'}`:'Gast · je bureaubladkeuzes worden op dit toestel bewaard';
    $('startAccountLabel').textContent=name||'Mijn profiel';
    $('themeFolders').replaceChildren(...M.themes.map(t=>{
      const b=button('','theme-folder',()=>showView({kind:'theme',themeId:t.id}));b.append(folderArt(t),el('strong','',t.title));
      const count=M.find({themeId:t.id}).length;b.append(el('small','',`${count} ${count===1?'bouwsel':'bouwsels'}`));b.setAttribute('aria-label',`${t.title}, ${count} bouwsels`);return b;
    }));
    const pinned=prefs.pins.map(M.app).filter(Boolean);
    $('pinnedApps').replaceChildren(...pinned.map(g=>{
      const b=button('','pinned-app',()=>openApp(g.id));const copy=el('span');copy.append(typeBadge(g.type),el('strong','',g.title),el('small','',M.theme(g.desktopTheme).title));b.append(imageFor(g),copy);return b;
    }));
    if(!pinned.length)$('pinnedApps').append(el('p','', 'Pin een app via de punaise in je themamap.'));
    const recent=prefs.recent.filter(r=>M.modes(r.id,role()).some(m=>m.id===r.mode)).slice(0,3);
    $('todayTitle').textContent=recent.length?'Waar gaan we verder?':'Klaar voor een ontdekking?';
    $('todayCopy').textContent=recent.length?'Je laatst geopende bouwsels staan hier voor je klaar.':'Een les om te begrijpen. Een trainer om te groeien. Een spel om uit te proberen.';
    const items=recent.length?recent:[{id:'rechtenwereld',mode:'solo'},{id:'pythagoras',mode:'solo'}];
    $('continueList').replaceChildren(...items.map(r=>{const g=M.app(r.id),b=button('','continue-item',()=>openApp(g.id,r.mode)),s=summary(g),copy=el('span');copy.append(el('strong','',g.title),el('small','',isOpen(g)?'Nog geopend · precies verdergaan':s?.status==='started'?s.label:recent.length?'Opnieuw openen':`${M.types[g.type].label} · ontdek deze app`));b.append(imageFor(g),copy,icon('arrow'));return b;}));
  }
  const viewNames={all:'Alle apps',saved:'Mijn taken',worksheets:'Oefenbladen','worksheet-saved':'Mijn oefenbladen',live:'Samen & live',profile:'Mijn profiel',settings:'Instellingen'};
  const viewIcons={all:'desktop',saved:'folder',worksheets:'paper','worksheet-saved':'folder',live:'people',profile:'account',settings:'settings'};
  function renderSidebar(){
    const nodes=[];
    for(const kind of ['all','saved','worksheets','worksheet-saved','live']){const b=button('','sidebar-link',()=>showView({kind}));b.append(icon(viewIcons[kind]),document.createTextNode(viewNames[kind]));if(view.kind===kind)b.setAttribute('aria-current','page');nodes.push(b);}
    nodes.push(el('p','sidebar-heading','Thema’s'));
    M.themes.forEach(t=>{const b=button('','sidebar-link',()=>showView({kind:'theme',themeId:t.id})),dot=el('span','theme-dot');dot.style.setProperty('--folder-color',t.color);b.append(dot,document.createTextNode(t.title));if(view.kind==='theme'&&view.themeId===t.id)b.setAttribute('aria-current','page');nodes.push(b);});
    nodes.push(el('p','sidebar-heading','Persoonlijk'));
    for(const kind of ['profile','settings']){const b=button('','sidebar-link',()=>showView({kind}));b.append(icon(viewIcons[kind]),document.createTextNode(viewNames[kind]));if(view.kind===kind)b.setAttribute('aria-current','page');nodes.push(b);}
    $('folderSidebar').replaceChildren(...nodes);
  }
  function renderLibrary(){
    worksheetRenderTurn++;
    const t=M.theme(view.themeId),title=view.kind==='theme'?t.title:viewNames[view.kind];
    $('windowTitle').textContent=title;$('windowEyebrow').textContent=view.kind==='theme'?'THEMAMAP':'LERAARBOB';
    $('windowIcon').replaceChildren(icon(view.kind==='theme'?t.icon:viewIcons[view.kind]));$('windowIcon').style.setProperty('--folder-color',t?.color||'#e3e9da');
    renderSidebar();
    const browse=['all','theme'].includes(view.kind);$('viewToolbar').hidden=!browse;$('librarySearch').value=view.query||'';
    $('typeFilters').replaceChildren(...['all',...Object.keys(M.types)].map(type=>{const b=button('','type-filter',()=>{view.type=type;renderLibrary();});b.append(...(type==='all'?[]:[icon(M.types[type].icon)]),document.createTextNode(type==='all'?'Alles':M.types[type].label));b.setAttribute('aria-pressed',String(view.type===type));return b;}));
    const descriptions={all:'Alle bestaande bouwsels, geordend per werkvorm. Elk behoudt zijn eigen wereld en bediening.',saved:'Je eigen bewaarde ingangen. Bewaar een les of app met de knop Bewaren terwijl het geopend is.',worksheets:'Kies een themamap en onderwerp. Nieuwe reeksen met verbetersleutel komen in Mijn oefenbladen op dit toestel.','worksheet-saved':'Jouw gemaakte reeksen, met dezelfde opgaven en verbetersleutel. Per account bewaard op dit toestel; download een kopie om ze ook buiten deze browser te bewaren.',live:role()==='teacher'?'Start een gezamenlijke activiteit of open je klassen. Leerlingen sluiten aan met een code of uitnodiging.':'Samen leren, een duel spelen of aansluiten bij een sessie van je leraar.',profile:'Je account en de voortgang die je bestaande bouwsels bewaren.',settings:'Maak dit bureaublad van jou.'};
    $('viewDescription').textContent=view.kind==='theme'?t.description:descriptions[view.kind];
    $('viewContent').replaceChildren();$('windowHint').textContent=browse?'Open direct, of kies een andere manier via ⋯.':'leraarBob · jouw bureaublad';
    if(browse)renderApps();else ({saved:renderSaved,worksheets:renderWorksheets,'worksheet-saved':renderWorksheetSaved,live:renderLive,profile:renderProfile,settings:renderSettings})[view.kind]?.();
  }
  function renderApps(){
    const apps=M.find({themeId:view.kind==='theme'?view.themeId:'',type:view.type,query:view.query});
    $('windowCount').textContent=`${apps.length} ${apps.length===1?'bouwsel':'bouwsels'}`;
    if(!apps.length){empty('Geen bouwsels gevonden.','Probeer een andere werkvorm of een korter zoekwoord.','Alle bouwsels bekijken',()=>{view.type='all';view.query='';renderLibrary();});return;}
    const grid=el('div','app-grid');
    apps.forEach(g=>{
      const card=el('article','app-card');card.dataset.appId=g.id;
      const pin=button('','card-pin',()=>togglePin(g.id));pin.append(icon('pin'));pin.title=prefs.pins.includes(g.id)?'Losmaken van het bureaublad':'Vastpinnen op het bureaublad';pin.setAttribute('aria-label',`${pin.title}: ${g.title}`);pin.setAttribute('aria-pressed',String(prefs.pins.includes(g.id)));
      const visual=button('','card-image-button',()=>openApp(g.id));visual.setAttribute('aria-label',`${M.types[g.type].verb}: ${g.title}`);visual.append(imageFor(g));
      const body=el('div','card-body'),top=el('div','card-topline');top.append(typeBadge(g.type));if(g.legacy)top.append(el('span','legacy-label','Eerdere versie'));
      const h=el('h3');h.append(button(g.title,'',()=>openApp(g.id)));body.append(top,h,el('p','',g.subtitle));
      const s=summary(g);if(s&&['started','complete','saved'].includes(s.status))body.append(el('div','card-progress',s.label));else if(isOpen(g))body.append(el('div','card-progress','Nog geopend op je bureaublad'));
      const footer=el('div','card-footer'),open=button(isOpen(g)?'Verdergaan':M.types[g.type].verb,'card-open',()=>openApp(g.id)),options=button('','card-options',()=>openModes(g.id));open.append(icon('arrow'));options.append(icon('more'));options.setAttribute('aria-label',`Manieren om ${g.title} te openen`);options.title='Solo, samen en oefenbladen';footer.append(open,options);card.append(pin,visual,body,footer);grid.append(card);
    });$('viewContent').append(grid);
  }
  function empty(title,copy,action,callback){const n=el('div','empty-state');n.append(icon('folder'),el('h2','',title),el('p','',copy));if(action)n.append(button(action,'primary',callback));$('viewContent').append(n);}
  function togglePin(id){if(prefs.pins.includes(id))prefs.pins=prefs.pins.filter(x=>x!==id);else{if(prefs.pins.length>=12){toast('Je kunt maximaal twaalf apps vastpinnen.');return;}prefs.pins.push(id);}persist();renderHome();renderLibrary();}
  function renderWorksheets(){
    const topics=M.worksheetTopics(),theme=M.theme(view.themeId),topic=topics.find(s=>s.themeId===view.themeId&&s.topicId===view.topicId);
    worksheetPath(theme,topic);
    const grid=el('div','worksheet-folders');
    if(!theme){
      M.themes.filter(t=>topics.some(s=>s.themeId===t.id)).forEach(t=>{const count=topics.filter(s=>s.themeId===t.id).length,b=worksheetFolder(t.title,t,`${count} onderwerpen`,()=>showView({kind:'worksheets',themeId:t.id}));b.dataset.worksheetTheme=t.id;grid.append(b);});
      const personal=worksheetFolder('Mijn oefenbladen',{color:'#91c8d4',icon:'paper'},'Je gemaakte reeksen · op dit toestel',()=>showView({kind:'worksheet-saved'}));personal.dataset.worksheetSavedFolder='true';grid.append(personal);
      $('windowCount').textContent=`${grid.children.length-1} themamappen · ${topics.length} onderwerpen`;
    }else if(!topic){
      $('windowTitle').textContent=theme.title;
      topics.filter(s=>s.themeId===theme.id).forEach(s=>{const b=worksheetFolder(s.title,theme,'Reeksen maken en terugvinden',()=>showView({kind:'worksheets',themeId:theme.id,topicId:s.topicId}));b.dataset.worksheetTopic=s.topicId;grid.append(b);});
      $('windowCount').textContent=`${grid.children.length} onderwerpen`;
    }else{
      $('windowTitle').textContent=topic.title;
      const card=el('article','sheet-card'),copy=el('div'),start=button('Oefenblad maken','primary',()=>openWorksheetTopic(topic));card.dataset.worksheetSource=topic.sourceId;copy.append(el('h2','',topic.title),el('p','',topic.description||'Stel een reeks samen met verbetersleutel.'),start);card.append(icon('paper'),copy);grid.append(card);
      $('windowCount').textContent='Generator en bewaarde reeksen';
    }
    $('viewContent').append(grid);
    if(topic){const heading=el('h2','worksheet-section-title','Mijn reeksen over dit onderwerp'),host=el('div','worksheet-records');$('viewContent').append(heading,host);loadWorksheetRecords(host,{themeId:theme.id,topicId:topic.topicId});}
  }
  function worksheetFolder(title,theme,copy,action){const b=button('','worksheet-folder',action);b.append(folderArt(theme),el('strong','',title),el('small','',copy));return b;}
  function worksheetPath(theme,topic){
    const path=el('nav','worksheet-path');path.setAttribute('aria-label','Oefenbladmappen');path.append(button('Oefenbladen','',()=>showView({kind:'worksheets'})));
    if(view.kind==='worksheet-saved')path.append(el('span','', '›'),button('Mijn oefenbladen','',()=>showView({kind:'worksheet-saved'})));
    if(theme)path.append(el('span','', '›'),button(theme.title,'',()=>showView({kind:view.kind,themeId:theme.id})));
    if(topic)path.append(el('span','', '›'),el('strong','',topic.title));$('viewContent').append(path);
  }
  function renderWorksheetSaved(){
    const theme=M.theme(view.themeId),topic=theme&&view.topicId?{title:worksheetTopicLabel(theme.id,view.topicId)}:null;worksheetPath(theme,topic);
    if(theme)$('windowTitle').textContent=`Mijn oefenbladen · ${topic?.title||theme.short}`;
    const controls=el('div','worksheet-library-actions'),importFile=el('input');importFile.type='file';importFile.accept='.json,application/json';importFile.hidden=true;
    const restore=button('Kopie terugzetten','',()=>importFile.click());restore.dataset.worksheetImport='true';
    importFile.onchange=async()=>{const file=importFile.files[0];if(!file)return;restore.disabled=true;try{if(file.size>window.LeraarBobWorksheetLibrary.limits.maxBytes*2)throw Error('Dit bestand is te groot.');const owner=await window.LeraarBobWorksheetLibrary.ready();await window.LeraarBobWorksheetLibrary.importJSON(await file.text(),{expectedScope:owner});toast('Reeks teruggezet in Mijn oefenbladen op dit toestel.');}catch(error){toast(error.message);}finally{restore.disabled=false;importFile.value='';}};
    controls.append(restore,importFile);$('viewContent').append(controls);
    const host=el('div','worksheet-records');$('viewContent').append(host);$('windowCount').textContent='Bewaarde reeksen laden…';loadWorksheetRecords(host,{themeId:theme?.id||'',topicId:view.topicId||'',folders:!theme&&view.themeId!=='all',topics:!!theme&&!topic});
  }
  function worksheetTopicLabel(themeId,topicId){return topicId==='mixed'?'Gemengde getallenreeks':M.worksheetTopics().find(t=>t.themeId===themeId&&t.topicId===topicId)?.title||M.theme(themeId)?.title||'Oefenbladen';}
  async function loadWorksheetRecords(host,{themeId='',topicId='',folders=false,topics=false}={}){
    const turn=worksheetRenderTurn,owner=account?.id||null;host.append(el('p','section-note','Je reeksen worden geladen…'));
    try{
      const records=await window.LeraarBobWorksheetLibrary.list();if(turn!==worksheetRenderTurn||owner!==(account?.id||null)||!host.isConnected||activeKey)return;
      host.replaceChildren();let selected=records.filter(r=>(!themeId||r.theme===themeId)&&(!topicId||r.topic===topicId));
      if(view.kind==='worksheet-saved')$('windowCount').textContent=`${selected.length} bewaarde ${selected.length===1?'reeks':'reeksen'} · op dit toestel`;
      if(!selected.length){host.append(el('p','section-note',topicId?'Hier staat nog geen reeks. Maak er één; de gemaakte opgaven en sleutel worden automatisch bewaard.':'Je map staat klaar. Maak een oefenblad in een themamap of zet een gedownloade kopie terug.'));return;}
      if(folders){const grid=el('div','worksheet-folders');M.themes.filter(t=>records.some(r=>r.theme===t.id)).forEach(t=>{const b=worksheetFolder(t.title,t,`${records.filter(r=>r.theme===t.id).length} bewaarde reeksen`,()=>showView({kind:'worksheet-saved',themeId:t.id}));b.dataset.worksheetTheme=t.id;grid.append(b);});host.append(grid,button('Alle bewaarde reeksen','quiet-link',()=>showView({kind:'worksheet-saved',themeId:'all'})));return;}
      if(topics){const grid=el('div','worksheet-folders');[...new Set(selected.map(r=>r.topic))].forEach(id=>{const b=worksheetFolder(worksheetTopicLabel(themeId,id),M.theme(themeId),`${selected.filter(r=>r.topic===id).length} bewaarde reeksen`,()=>showView({kind:'worksheet-saved',themeId,topicId:id}));b.dataset.worksheetTopic=id;grid.append(b);});host.append(grid);return;}
      selected.forEach(record=>{
        const row=el('article','worksheet-record'),copy=el('div'),actions=el('div','worksheet-record-actions');row.dataset.worksheetId=record.id;
        const title=worksheetTopicLabel(record.theme,record.topic);
        copy.append(el('h3','',record.title),el('p','',`${title} · ${record.code?record.code+' · ':''}${new Date(record.createdAt).toLocaleDateString('nl-BE')}`));
        const open=button('Open reeks','primary',()=>openWorksheetArchive(record));open.dataset.worksheetOpen='true';
        const download=button('Download kopie','',async()=>{download.disabled=true;try{const value=await window.LeraarBobWorksheetLibrary.get(record.id);if(!value)throw Error('Deze reeks is niet meer beschikbaar.');downloadFile(window.LeraarBobWorksheetLibrary.exportJSON(value),'reeks-'+(record.code||record.id)+'.json','application/json');}catch(error){toast(error.message);}finally{download.disabled=false;}});download.dataset.worksheetExport='true';
        const remove=button('Verwijderen','',async()=>{if(!window.confirm(`Reeks “${record.title}” uit Mijn oefenbladen verwijderen? Download eerst een kopie als je ze wilt houden.`))return;try{await window.LeraarBobWorksheetLibrary.remove(record.id);closeFrame('worksheet:'+record.id);toast('Reeks verwijderd.');}catch(error){toast(error.message);}});remove.dataset.worksheetDelete='true';actions.append(open,download,remove);row.append(icon('paper'),copy,actions);host.append(row);
      });
    }catch(error){if(turn!==worksheetRenderTurn||!host.isConnected)return;host.replaceChildren(el('p','section-note',error.message),button('Opnieuw proberen','',()=>{host.replaceChildren();loadWorksheetRecords(host,{themeId,topicId,folders,topics});}));$('windowCount').textContent='Oefenbladmap niet beschikbaar';}
  }
  function downloadFile(value,name,type){const blob=new Blob([value],{type}),url=URL.createObjectURL(blob),link=el('a');link.href=url;link.download=name.replace(/[^a-z0-9_.-]/gi,'-');link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
  function openWorksheetTopic(topic){const g=M.app(topic.appId);return openFrame({key:`${g.id}|worksheet:${topic.id}|${topic.topicId}`,app:g,mode:`worksheet:${topic.id}`,label:`Oefenblad · ${topic.title}`,href:topic.href});}
  function openWorksheetArchive(record){return openFrame({key:'worksheet:'+record.id,app:{id:'worksheet:'+record.id,title:record.title,type:'learn',desktopTheme:record.theme,cover:'assets/covers/graph.svg'},mode:'archive',label:'Bewaarde oefenbladreeks',href:new URL('os/worksheet.html?id='+encodeURIComponent(record.id),base).href,archive:true});}
  function renderSaved(){
    $('windowCount').textContent=`${prefs.saved.length} bewaarde activiteiten`;
    if(!prefs.saved.length){empty('Je map staat klaar.','Open een bouwsel of oefenblad en kies Bewaren. Zo maak je je eigen snelkoppelingen.','Ontdek de apps',()=>showView({kind:'all'}));return;}
    prefs.saved.forEach(s=>{const g=M.app(s.id),row=el('article','saved-row'),copy=el('div','saved-copy');copy.append(el('h3','',s.title||g.title),el('p','',s.label||M.types[g.type].label));const remove=button('','remove-saved',()=>{prefs.saved=prefs.saved.filter(x=>x.key!==s.key);persist();renderSavedView();});remove.append(icon('close'));remove.setAttribute('aria-label',`Snelkoppeling verwijderen: ${s.title||g.title}`);row.append(imageFor(g),copy,button('Openen','',()=>openSaved(s)),remove);$('viewContent').append(row);});
  }
  function renderSavedView(){$('viewContent').replaceChildren();renderSaved();}
  function renderLive(){
    $('windowCount').textContent=role()==='teacher'?'Leraaromgeving':'Samen leren en deelnemen';
    const grid=el('div','live-grid');
    function liveCard(glyph,title,copy,actions,teacher=false){const card=el('article','live-card'+(teacher?' teacher-card':''));card.append(icon(glyph),el('h2','',title),el('p','',copy));actions.forEach(a=>card.append(button(a.title,'',a.run)));grid.append(card);return card;}
    liveCard('class','Deelnemen met een code','Je leraar start de sessie. Jij sluit aan via de bestaande sessiepagina.',[
      {title:'Klas Battle',run:()=>openUtility('battle-join','Deelnemen aan Klas Battle','klasbattle/','people')},
      {title:'Learn-sessie',run:()=>openUtility('learn-join','Deelnemen aan Learn','games/bewerkingen-trainer/start.html?view=home','people')},
      {title:'Live les',run:()=>openUtility('lesson-join','Deelnemen aan een live les','lessons/rechten-arbeid/join.html','people')}
    ]);
    liveCard('people','Met twee of een groepje','Kies een bestaande wereld en bekijk de beschikbare Learn- en Battle-modi.',[{title:'Rechtenwereld',run:()=>openModes('rechtenwereld')},{title:'Getallenwereld',run:()=>openModes('getallenwereld')},{title:'Rechten Zeeslag',run:()=>openModes('rechten-zeeslag')}]);
    if(role()==='teacher'){
      liveCard('class','Een klasactiviteit starten','Alleen jouw leraarsaccount kan een klasactiviteit aanmaken.',[{title:'Klas Learn · getallen',run:()=>openApp('getallenwereld','classlearn')},{title:'Klas Battle · getallen',run:()=>openApp('getallenwereld','classroom')},{title:'Klas Battle · rechten',run:()=>openApp('rechtenwereld','classroom')},{title:'Mijn klassen',run:()=>openUtility('teacher','Mijn klassen','teacher/','class',true)}],true);
      liveCard('book','Een live les geven','Open de les Rechten & arbeid en gebruik de bestaande sessiebediening.',[{title:'Live les openen',run:()=>openApp('rechten-arbeid-les','live')}],true);
    }else if(!account){const note=el('p','section-note','Log in met je leraarBob-account om samen te spelen en deel te nemen.');$('viewContent').append(note);}
    $('viewContent').prepend(grid);
  }
  function renderProfile(){
    $('windowCount').textContent=account?'Jouw bestaande leraarBob-account':'Gast op dit toestel';
    const banner=el('div','profile-banner'),mark=el('div','profile-avatar'),copy=el('div');
    if(account&&window.LeraarBobAvatar)mark.append(window.LeraarBobAvatar.create(account));else mark.append(icon('account'));
    copy.append(el('h2','',account?.alias||(role()==='teacher'?'Leerkracht':'Jouw profiel')),el('p','',account?(account.role==='teacher'?'Leraarsaccount':account.role==='student'?`Leerling${account.class_code?' · '+account.class_code:''}`:'Account controleren'):'Log in om je bewaarde spelvoortgang te bekijken.'));
    banner.append(mark,copy,button(account?'Account & avatar':'Inloggen','primary',openAccount));$('viewContent').append(banner);
    if(!account){$('viewContent').append(el('p','section-note','Je kunt als gast de apps ontdekken. Je bureaubladkeuzes blijven op dit toestel.'));return;}
    if(role()==='teacher'){$('viewContent').append(button('Mijn klassen openen','primary',()=>openUtility('teacher','Mijn klassen','teacher/','class',true)),el('p','section-note','Leerlingresultaten bekijk je in de bestaande leraaromgeving.'));return;}
    if(account.role!=='student'){$('viewContent').append(el('p','section-note','Dit account is niet herkend als leerling of leraar. Open je account om opnieuw in te loggen.'));return;}
    if(progressState!=='ready'){const p=el('p','section-note',progressState==='error'?'Je voortgang kon niet worden opgehaald. Je kunt de apps wel openen.':'Je echte spelvoortgang wordt opgehaald…');$('viewContent').append(p);if(progressState==='error')$('viewContent').append(button('Opnieuw proberen','primary',refreshProgress));return;}
    const totals=window.LeraarBobCatalogProgress.aggregate(Registry.list({includeComponents:true}),overview);
    if(totals){const stats=el('div','profile-stats');[[totals.xp,'XP uit je bestaande spellen'],[totals.completed,'Afgeronde onderdelen']].forEach(([n,label])=>{const d=el('div','profile-stat');d.append(el('strong','',Number(n).toLocaleString('nl-BE')),el('span','',label));stats.append(d);});$('viewContent').append(stats);}
    if(Object.values(overview.errors||{}).some(Boolean))$('viewContent').append(el('p','section-note','Een deel van je voortgang is tijdelijk niet beschikbaar. Ontbrekende resultaten tellen we niet als nul.'));
    const entries=M.apps().map(g=>({g,s:summary(g)})).filter(e=>e.s&&['started','complete','saved'].includes(e.s.status));
    $('viewContent').append(el('h2','profile-list-heading','Mijn bouwsels'));
    entries.forEach(({g,s})=>{const b=button('','progress-row',()=>openApp(g.id)),copy=el('span');copy.append(el('strong','',g.title),el('small','',[s.label,s.detail].filter(Boolean).join(' · ')));b.append(imageFor(g),copy,icon('arrow'));$('viewContent').append(b);});
    if(!entries.length)$('viewContent').append(el('p','section-note','Er staat nog geen voortgang bij deze bouwsels. Kies een app om te beginnen.'));
    $('viewContent').append(button('Voortgang vernieuwen','quiet-link',refreshProgress));
  }
  function renderSettings(){
    $('windowCount').textContent='Voorkeuren op dit toestel';const list=el('div','settings-list');
    function setting(title,copy,control){const row=el('div','setting'),text=el('div');text.append(el('h2','',title),el('p','',copy));row.append(text,control);list.append(row);}
    const bg=el('select');bg.setAttribute('aria-label','Achtergrond');[['coast','Kust bij avond'],['quiet','Rustig blauw']].forEach(([v,t])=>{const o=el('option','',t);o.value=v;bg.append(o);});bg.value=prefs.wallpaper;bg.onchange=()=>{prefs.wallpaper=bg.value;persist();applyPrefs();};setting('Achtergrond','Kies het uitzicht van je bureaublad.',bg);
    const display=button(document.documentElement.dataset.mode==='dark'?'Lichte vensters':'Donkere vensters','',()=>{setSiteTheme(document.documentElement.dataset.mode!=='dark');renderLibrary();});setting('Weergave','Kies lichte of donkere bureaubladvensters.',display);
    const label=el('label'),motion=el('input');motion.type='checkbox';motion.checked=prefs.reducedMotion;motion.setAttribute('aria-label','Minder beweging');motion.onchange=()=>{prefs.reducedMotion=motion.checked;persist();applyPrefs();};label.append(motion);setting('Minder beweging','Laat mappen en apps zonder animaties openen.',label);
    setting('Vastgepinde apps','Zet de vier eerste snelkoppelingen terug op je bureaublad.',button('Herstel pins','',()=>{prefs.pins=M.defaults.pins.slice();persist();renderHome();toast('De vier snelkoppelingen staan terug op je bureaublad.');}));
    setting('Bovenbalk','Toon of verberg de gedeelde platformbediening.',button(document.body.classList.contains('topbar-collapsed')?'Bovenbalk tonen':'Bovenbalk inklappen','',()=>{window.LeraarBobTopbar?.setCollapsed(!document.body.classList.contains('topbar-collapsed'),true);renderLibrary();}));
    const catalog=el('a','quiet-link catalog-link','Open eerdere startpagina');catalog.href=new URL('index.html?view=catalog',base).href;catalog.target='_blank';catalog.rel='noopener';
    setting('Eerdere startpagina','Bekijk de oude spellenpagina in een apart tabblad.',catalog);
    $('viewContent').append(list,el('p','section-note','Bureaubladvoorkeuren wijzigen je antwoorden, levels en spelvoortgang niet.'));
  }
  function applyPrefs(){document.body.dataset.wallpaper=prefs.wallpaper;document.body.dataset.reducedMotion=String(prefs.reducedMotion);}
  function setSiteTheme(dark){
    const mode=dark?'dark':'light';document.documentElement.dataset.mode=mode;
    try{localStorage.setItem('axioma-mode',mode);}catch{}
    // Site-palette apps keep their native DOM; a display action needs no rerender.
    frames.forEach(item=>{try{const doc=item.frame.contentDocument;if(doc?.querySelector('script[data-theme-mode="site"]')){doc.documentElement.dataset.mode=mode;const color=doc.querySelector('meta[name="theme-color"]');if(color)color.content=dark?'#14241e':'#f7f8f4';}}catch{}});
    syncThemeControl();
  }
  function syncThemeControl(){
    const frame=frames.get(activeKey),doc=frame?.frame.contentDocument;
    const native=doc?.querySelector('#themeBtn,#modeBtn[aria-pressed],#theme');
    const mode=doc?.documentElement?.dataset.mode||document.documentElement.dataset.mode;
    const dark=native?.hasAttribute('aria-pressed')?native.getAttribute('aria-pressed')==='true':mode==='dark';
    $('modeBtn').setAttribute('aria-pressed',String(dark));$('modeBtn').setAttribute('aria-label',native?.getAttribute('aria-label')||(dark?'Lichte weergave':'Donkere weergave'));
  }
  function showView(next,{route=true}={}){
    rememberFocus(frames.get(activeKey));
    closeStart();if(typeof next==='string')next={kind:next};if(!['desktop','theme',...Object.keys(viewNames)].includes(next.kind)||next.kind==='theme'&&!M.theme(next.themeId))next={kind:'desktop'};
    view={kind:next.kind,themeId:next.themeId||'',type:next.type||'all',query:next.query||''};if(next.topicId&&['worksheets','worksheet-saved'].includes(next.kind))view.topicId=next.topicId;activeKey=null;syncNativeNavigation();
    $('homeView').hidden=view.kind!=='desktop';$('libraryWindow').hidden=view.kind==='desktop';$('appWorkspace').hidden=true;
    frames.forEach(f=>{f.wrapper.hidden=true;f.wrapper.inert=true;});
    if(view.kind==='desktop')renderHome();else renderLibrary();updateCrumbs();renderRunning();syncThemeControl();syncProgressBadge();
    if(route)updateRoute();
  }
  function originalURL(href){const safe=M.safeURL(href);if(!safe)return null;const url=new URL(safe);url.searchParams.delete('osEmbed');return url.href;}
  function algebraModule(href){try{const path=new URL(href).pathname;if(path===new URL('games/algebra-trainer/stelsels.html',base).pathname)return 'systems';if([new URL('games/algebra-trainer/',base).pathname,new URL('games/algebra-trainer/index.html',base).pathname].includes(path))return 'equations';}catch{}return null;}
  function openAlgebraRoute(item,href){
    const safe=M.safeURL(href);if(!safe||item.owner!==M.key(account))return false;
    const url=new URL(safe),module=algebraModule(safe),g=M.app('algebra-trainer');
    if(module){
      const cached=[...frames.values()].find(f=>f.app.id===g.id&&f.mode==='solo'&&algebraModule(f.href)===module),key=cached?.key||`${g.id}|solo|${module}`;
      if(!openFrame(cached||{key,app:g,mode:'solo',label:module==='systems'?'Stelsels · op je eigen tempo':'Vergelijkingen · op je eigen tempo',href:safe,origin:{...item.origin}}))return true;
      const next=frames.get(key),target=url.searchParams.get('screen');
      if(cached&&['world','menu','tools','setup'].includes(target))next.algebraShell?.navigate(target);
      return true;
    }
    if(url.pathname===new URL('klasbattle/',base).pathname&&['algebra','algebra-trainer'].includes(url.searchParams.get('game'))){
      const world=url.searchParams.get('world')||url.searchParams.get('topic')||item.algebraContext?.world||'equations';
      openFrame({key:'utility:algebra-battle:'+world,app:g,mode:'utility',label:'Klasbattle · '+(world==='systems'?'Stelsels':'Vergelijkingen'),href:safe,utility:true,origin:{...item.origin}});return true;
    }
    return false;
  }
  function syncNativeNavigation(){
    const current=frames.get(activeKey),context=current?.algebraContext,host=$('nativeAppNavigation'),enabled=!!context;
    host.hidden=!enabled;if(!enabled){host.replaceChildren();delete host.dataset.signature;delete document.body.dataset.nativeNavigation;return;}
    document.body.dataset.nativeNavigation='algebra';
    const signature=context.destinations.map(d=>d.id+':'+d.label).join('|');
    if(host.dataset.signature!==signature){host.replaceChildren(...context.destinations.map(d=>{const node=button(d.label,'',()=>frames.get(activeKey)?.algebraShell?.navigate(d.id));node.dataset.algebraSection=d.id;return node;}));host.dataset.signature=signature;}
    host.querySelectorAll('button').forEach(node=>{const active=context.destinations.find(d=>d.id===node.dataset.algebraSection)?.active;if(active)node.setAttribute('aria-current','page');else node.removeAttribute('aria-current');});
  }
  function updateCrumbs(){
    const folder=$('headerFolder'),app=$('headerApp'),current=frames.get(activeKey);
    const worksheet=current?.archive||current?.mode?.startsWith('worksheet:');
    const place=worksheet?current.origin:current?.app.desktopTheme&&view.themeId!==current.app.desktopTheme?{kind:'theme',themeId:current.app.desktopTheme}:view;
    folder.hidden=place.kind==='desktop';folder.textContent=place.kind==='theme'?M.theme(place.themeId).title:viewNames[place.kind]||'';
    folder.onclick=()=>showView(place);app.hidden=!current;app.textContent=current?.app.title||'';
    let doc,nodes=[];
    if(current?.app.id==='getallenwereld')try{
      doc=current.frame.contentDocument;
      const crumbs=doc?.querySelector('header .breadcrumbs');
      if(crumbs)nodes=[...crumbs.children].filter(n=>!n.hidden&&n.matches('button,a,span')&&n.textContent.trim());
      else{const topic=doc?.querySelector('#spaceCrumb');if(topic?.textContent.trim())nodes=[topic];}
      $('openOriginal').href=M.safeURL(current.frame.contentWindow.location.href)||current.href;
    }catch{}
    const algebra=current?.algebraContext;
    if(algebra){doc=current.frame.contentDocument;$('openOriginal').href=originalURL(current.frame.contentWindow.location.href)||current.href;}
    app.hidden=!current||!!algebra||nodes.some(n=>n.id==='gameHomeBtn');
    const signature=algebra?JSON.stringify([algebra.world,algebra.screen,algebra.level,algebra.levelTitle]):nodes.map(n=>n.tagName+':'+n.textContent.trim()).join('|');
    if(doc!==crumbDocument||signature!==crumbSignature){
      app.parentElement.querySelectorAll('[data-native-crumb]').forEach(n=>n.remove());
      nodes.forEach(source=>{
        const node=el(source.matches('button,a')?'button':'span','',source.textContent.trim());node.dataset.nativeCrumb='true';
        if(node.tagName==='BUTTON'){node.type='button';node.onclick=()=>{source.click();const target=doc.querySelector('#app');if(target){if(!target.hasAttribute('tabindex'))target.tabIndex=-1;target.focus({preventScroll:true});}};}
        app.parentElement.append(node);
      });
      if(algebra){
        const crumb=(label,destination)=>{const node=el(destination?'button':'span','',label);node.dataset.nativeCrumb='true';if(destination){node.type='button';node.onclick=()=>current.algebraShell?.navigate(destination);}app.parentElement.append(node);};
        crumb('Algebrawereld','world');if(algebra.world!=='overview')crumb(algebra.worldTitle,'menu');
        if(!['world','menu'].includes(algebra.screen))crumb(({tools:'Werkvormen',setup:'Eigen reeks',preview:'Oefenblad',paper:'Oefenblad',history:'Stappen',systemHistory:'Stappen',summary:'Resultaat',systemSummary:'Resultaat'})[algebra.screen]||algebra.levelTitle||'Oefenen');
      }
      crumbDocument=doc;crumbSignature=signature;
    }
  }
  function updateRoute(){const url=new URL(location.href);for(const p of ['app','mode','theme','place','worksheetTheme','worksheetTopic'])url.searchParams.delete(p);if(view.kind==='theme')url.searchParams.set('theme',view.themeId);else if(view.kind!=='desktop')url.searchParams.set('place',view.kind);if(['worksheets','worksheet-saved'].includes(view.kind)){if(view.themeId)url.searchParams.set('worksheetTheme',view.themeId);if(view.topicId)url.searchParams.set('worksheetTopic',view.topicId);}history.replaceState(null,'',url);}
  function openModes(id){
    const g=M.app(id);if(!g)return;closeStart();$('modeTheme').textContent=M.theme(g.desktopTheme).title;$('modeTitle').textContent=g.title;$('modeDescription').textContent=g.subtitle;
    const options=M.modes(id,role()),sheets=M.worksheets(id);
    $('modeOptions').replaceChildren(...options.map(m=>{const b=button('','mode-option',()=>{if(openApp(id,m.id))$('modeDialog').close();}),copy=el('span');copy.append(el('strong','',M.modeLabel(m)),el('small','',m.devices||m.description||(m.id==='solo'?'Open de bestaande app op je eigen tempo.':'')));b.append(icon(['classroom','classlearn','teacher','live'].includes(m.id)?'class':m.purpose==='battle'?'battle':m.participation==='solo'?'book':'people'),copy,icon('arrow'));b.dataset.mode=m.id;return b;}));
    if(!options.length)$('modeOptions').append(button('Inloggen om te openen','mode-option',openAccount));
    if(role()!=='teacher'&&account)$('modeOptions').append(button('Deelnemen aan een sessie van mijn leraar','mode-join',()=>{$('modeDialog').close();showView({kind:'live'});}));
    $('modeWorksheets').replaceChildren();if(sheets.length){$('modeWorksheets').append(el('p','mode-group-title','Op papier'));sheets.forEach(s=>{const b=button('','mode-option',()=>{$('modeDialog').close();openWorksheet(id,s.id);}),copy=el('span');copy.append(el('strong','',s.title),el('small','',s.description||'Stel je oefenblad samen en print het.'));b.append(icon('paper'),copy,icon('arrow'));$('modeWorksheets').append(b);});}
    $('modeDialog').showModal();
  }
  function openApp(id,mode,options={}){
    const g=M.app(id);if(!g)return false;
    if(!mode){const existing=[...frames.values()].reverse().find(f=>f.app.id===id&&!f.mode.startsWith('worksheet:')&&M.modes(id,role()).some(m=>m.id===f.mode));if(existing)return openFrame(existing);mode='solo';}
    const m=M.modes(id,role(),options.topicId).find(m=>m.id===mode);
    if(!m){toast(['classroom','classlearn','teacher','live'].includes(mode)?'Een klas starten kan alleen met een leraarsaccount.':'Log in voor deze manier van spelen.');return false;}
    const href=M.destination(id,mode,{role:role(),topicId:options.topicId,returnTo:new URL(home).pathname});if(!href){toast('Deze ingang is niet beschikbaar.');return false;}
    const key=`${id}|${mode}|${options.topicId||''}`;
    // A second click brings the same live DOM back instead of creating an exercise.
    if(!openFrame({key,app:g,mode,label:M.modeLabel(m),href,context:options.topicId||''}))return false;
    prefs.recent=[{id,mode},...prefs.recent.filter(r=>r.id!==id||r.mode!==mode)].slice(0,10);persist();return true;
  }
  // Accepting Learn stays in the desktop and reuses an idle native Learn page.
  document.addEventListener('leraarbob:social-route',event=>{
    if(event.detail?.game!=='rechten-learn'||authPending||role()!=='student')return;
    const href=M.safeURL(event.detail.href);if(!href)return;const url=new URL(href),room=url.searchParams.get('session');
    if(url.pathname!==new URL('games/rechten/rechtenwereld/learn.html',base).pathname||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(room||''))return;
    url.searchParams.set('returnTo',new URL(home).pathname);
    event.preventDefault();
    const g=M.app('rechtenwereld'),mode=M.modes(g.id,role()).find(m=>m.id==='learn');if(!mode)return;
    const existing=[...frames.values()].find(f=>{try{const native=f.frame.contentWindow.LeraarBobLearn,context=native?.snapshot();return f.owner===M.key(account)&&f.app.id===g.id&&f.mode==='learn'&&context?.accountId===account.id&&(context.id===room||(!context.id&&!context.busy));}catch{return false;}});
    if(existing){
      event.detail.handled=true;openFrame(existing);
      existing.frame.contentWindow.LeraarBobLearn.openSession(room).then(ok=>{if(!ok&&existing.owner===M.key(account))toast('Open je uitnodiging opnieuw zodra de vorige actie klaar is.');}).catch(()=>toast('De Learn-sessie kon niet worden geopend. Probeer opnieuw.'));
    }else event.detail.handled=openFrame({key:`rechtenwereld|learn|session:${room}`,app:g,mode:'learn',label:M.modeLabel(mode),href:url.href});
  });
  function openWorksheet(id,sheetId){const g=M.app(id),s=M.worksheets(id).find(s=>s.id===sheetId);if(!g||!s)return false;const href=M.safeURL(s.href);return href?openFrame({key:`${id}|worksheet:${sheetId}`,app:g,mode:`worksheet:${sheetId}`,label:`Oefenblad · ${s.title}`,href}):false;}
  function openUtility(id,title,path,glyph,teacher=false){if(teacher&&role()!=='teacher'){toast('Gebruik je leraarsaccount om je klassen te openen.');return false;}const href=M.safeURL(path);if(!href)return false;return openFrame({key:`utility:${id}`,app:{id:`utility:${id}`,title,type:'learn',cover:'assets/covers/graph.svg'},mode:'utility',label:'leraarBob',href,utility:true});}
  function openFrame(config){
    closeStart();if(!frames.has(config.key)){
      if(frames.size>=6){toast('Er staan zes apps open. Sluit eerst een app via de taakbalk om een nieuwe te openen.');return false;}
      const wrapper=el('div','frame-wrapper'),frame=el('iframe','native-app'),loading=el('div','frame-loading');
      frame.title=runningTitle(config);frame.allow='fullscreen';const source=new URL(config.href);if(config.app.id==='algebra-trainer'&&algebraModule(source.href))source.searchParams.set('osEmbed','1');frame.src=source.href;loading.append(icon('desktop'),el('span','',`${frame.title} wordt geopend…`));
      const fallback=el('a','', 'Open de oorspronkelijke app apart');fallback.href=config.href;fallback.target='_blank';fallback.rel='noopener';loading.append(fallback);wrapper.append(frame,loading);$('appFrames').append(wrapper);
      const origin=config.origin?{...config.origin}:activeKey?{kind:config.utility?'live':'theme',themeId:config.app.desktopTheme||'',type:'all',query:''}:{...view};
      const item={...config,origin,frame,wrapper,owner:M.key(account),cleanup:null};frames.set(config.key,item);
      frame.addEventListener('load',()=>{if(!frames.has(config.key)||item.owner!==M.key(account))return;loading.hidden=true;connectNative(item);if(activeKey===item.key){syncNativeNavigation();updateCrumbs();syncThemeControl();syncProgressBadge();}});
    }
    if(!activeKey&&frames.get(config.key)!==config)frames.get(config.key).origin={...view};activateFrame(config.key);return true;
  }
  function rememberFocus(item){
    if(!item)return;
    try{let doc=item.frame.contentDocument,node=doc?.activeElement;
      while(node?.tagName==='IFRAME'&&node.contentDocument){doc=node.contentDocument;node=doc.activeElement;}
      if(node&&node!==doc.body&&node!==doc.documentElement)item.lastFocus=node;
    }catch{}
  }
  function activateFrame(key){
    const current=frames.get(key);if(!current)return;if(current.owner!==M.key(account))return;
    rememberFocus(frames.get(activeKey));
    closeStart();activeKey=key;view={...current.origin};frames.forEach(f=>{f.wrapper.hidden=f!==current;f.wrapper.inert=f!==current;});
    $('homeView').hidden=true;$('libraryWindow').hidden=true;$('appWorkspace').hidden=false;
    $('activeAppTitle').textContent=current.app.title;$('activeAppMode').textContent=current.label;
    const badge=current.utility?el('span','type-badge',current.app.id==='utility:teacher'?'Leraaromgeving':'Sessie'):typeBadge(current.app.type);
    $('activeAppType').replaceWith(Object.assign(badge,{id:'activeAppType'}));
    let original=current.href;try{original=originalURL(current.frame.contentWindow.location.href)||original;}catch{}$('openOriginal').href=original;
    $('saveActivity').hidden=current.utility===true||current.archive===true;
    const place=current.origin.kind==='theme'?M.theme(current.origin.themeId).title:viewNames[current.origin.kind]||'bureaublad';
    $('appBack').querySelector('span').textContent=`Terug naar ${place}`;$('appBack').title=`Terug naar ${place}; de app blijft geopend`;$('appBack').setAttribute('aria-label',`Terug naar ${place}`);
    syncNativeNavigation();updateCrumbs();updateRoute();renderRunning();syncThemeControl();syncProgressBadge();
    const target=current.lastFocus;
    if(target?.isConnected&&!target.closest('[hidden],[inert]'))target.focus();else current.frame.focus();
  }
  function connectNative(item){
    item.cleanup?.();let doc;try{doc=item.frame.contentDocument;if(!doc||!M.safeURL(doc.URL))return;}catch{return;}
    const win=item.frame.contentWindow;
    item.algebraContext=null;item.algebraShell=null;let algebraUnsubscribe=null;
    function attachAlgebra(){
      if(algebraUnsubscribe||item.app.id!=='algebra-trainer'||!algebraModule(doc.URL))return;
      const api=win.AlgebraShell;if(!api?.subscribe||!api?.setEmbedded)return;
      item.algebraShell=api;api.setEmbedded(true);
      algebraUnsubscribe=api.subscribe(context=>{
        if(item.owner!==M.key(account)||!frames.has(item.key)||!context||context.gameId!=='algebra-trainer')return;
        item.algebraContext={...context,destinations:context.destinations.filter(d=>['world','menu','tools'].includes(d.id))};
        if(activeKey===item.key){syncNativeNavigation();updateCrumbs();}
      });
    }
    const algebraRoute=event=>{if(item.app.id==='algebra-trainer'&&openAlgebraRoute(item,event.detail?.href))event.preventDefault();};
    doc.addEventListener('leraarbob:algebra-route',algebraRoute);attachAlgebra();
    // This atelier header contains only controls already provided by the desktop.
    // Keep its original theme handler and progress node alive in the hidden header.
    const embedStyle=doc.createElement('style');embedStyle.textContent='#atelier-header{display:none!important}';
    if(new URL(doc.URL).pathname.startsWith(new URL('lessons/rechten-arbeid/',base).pathname))embedStyle.textContent+='body>header[data-collapsible-topbar]{display:none!important}';
    doc.head.append(embedStyle);
    // Native sign-in buttons use the desktop account panel without mounting another bar.
    const accountBridge=win.LeraarBobTopbar?null:Object.freeze({openAccount,setCollapsed:(...args)=>window.LeraarBobTopbar?.setCollapsed(...args)});if(accountBridge)win.LeraarBobTopbar=accountBridge;
    // Only redundant links out of the app are handled here; game controls stay native.
    const click=e=>{
      if(e.target.closest?.('[data-axioma-login]')){e.preventDefault();e.stopImmediatePropagation();openAccount();return;}
      const a=e.target.closest?.('a[href]');if(!a||a.target==='_blank'||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;const target=M.safeURL(a.href);if(!target)return;
      if(item.algebraShell&&a.hasAttribute('data-section')&&!['battle'].includes(a.dataset.section))return;
      if(item.app.id==='algebra-trainer'&&openAlgebraRoute(item,target)){e.preventDefault();e.stopImmediatePropagation();return;}
      const u=new URL(target),b=new URL(base),os=new URL(home);if(u.pathname===b.pathname||u.pathname===b.pathname+'index.html'||u.pathname===os.pathname){e.preventDefault();e.stopImmediatePropagation();if(u.searchParams.get('login')==='1')openAccount();else showView(item.origin);}
    };
    const keydown=e=>{if(activeKey===item.key)desktopShortcut(e);};
    const focus=e=>{const owner=e.target.ownerDocument;if(activeKey===item.key&&e.target!==owner.body&&e.target!==owner.documentElement)item.lastFocus=e.target;};
    const progress=()=>{if(activeKey===item.key)syncProgressBadge();clearTimeout(progressTimer);progressTimer=setTimeout(refreshProgress,1200);};
    const theme=()=>{if(activeKey===item.key)syncThemeControl();};
    doc.addEventListener('click',click,true);doc.addEventListener('keydown',keydown,true);doc.addEventListener('focusin',focus);item.frame.contentWindow.addEventListener('axioma:game-progress',progress);doc.addEventListener('click',theme);
    const observer=new MutationObserver(()=>{if(activeKey===item.key)syncProgressBadge();});
    const progressNode=doc.querySelector('[data-platform-progress],#xpLabel,#xp,#completedCount');if(progressNode)observer.observe(progressNode,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['data-value','data-total','data-unit']});
    const contextObserver=new MutationObserver(()=>{attachAlgebra();if(activeKey===item.key)updateCrumbs();});
    const contextNode=item.app.id==='getallenwereld'&&doc.querySelector('header .breadcrumbs,#spaceCrumb');
    if(contextNode)contextObserver.observe(contextNode,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']});
    if(item.app.id==='algebra-trainer'&&algebraModule(doc.URL))contextObserver.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-screen']});
    // Keyboard events do not bubble out of a native battle's inner workboard.
    // Follow same-origin child frames without replacing their DOM or handlers.
    const children=new Map();
    function scanChildren(owner){
      for(const [frame,child] of children)if(!frame.isConnected){child.cleanup?.();frame.removeEventListener('load',child.load);children.delete(frame);}
      owner.querySelectorAll('iframe').forEach(frame=>{
        if(children.has(frame))return;const child={cleanup:null,load:null};children.set(frame,child);
        child.load=()=>{
          child.cleanup?.();child.cleanup=null;let inner;
          try{inner=frame.contentDocument;if(!inner||!M.safeURL(inner.URL))return;}catch{return;}
          inner.addEventListener('keydown',keydown,true);inner.addEventListener('focusin',focus);
          const watcher=new MutationObserver(()=>scanChildren(inner));watcher.observe(inner,{childList:true,subtree:true});
          child.cleanup=()=>{inner.removeEventListener('keydown',keydown,true);inner.removeEventListener('focusin',focus);watcher.disconnect();};
          scanChildren(inner);
        };
        frame.addEventListener('load',child.load);child.load();
      });
    }
    const childObserver=new MutationObserver(()=>scanChildren(doc));childObserver.observe(doc,{childList:true,subtree:true});scanChildren(doc);
    item.cleanup=()=>{algebraUnsubscribe?.();doc.removeEventListener('leraarbob:algebra-route',algebraRoute);doc.removeEventListener('click',click,true);doc.removeEventListener('keydown',keydown,true);doc.removeEventListener('focusin',focus);doc.removeEventListener('click',theme);observer.disconnect();contextObserver.disconnect();childObserver.disconnect();children.forEach((child,frame)=>{child.cleanup?.();frame.removeEventListener('load',child.load);});children.clear();embedStyle.remove();try{win.removeEventListener('axioma:game-progress',progress);if(accountBridge&&win.LeraarBobTopbar===accountBridge)delete win.LeraarBobTopbar;}catch{}};
  }
  function runningTitle(item){if(item.app.id==='algebra-trainer'){const module=algebraModule(item.href);if(item.mode==='solo'&&module)return module==='systems'?'Stelsels':'Vergelijkingen';if(item.utility&&item.key.startsWith('utility:algebra-battle:'))return item.label;}return item.app.title;}
  function renderRunning(){$('runningApps').replaceChildren(...[...frames.values()].map(f=>{const title=runningTitle(f),b=button('','running-app',()=>activateFrame(f.key));b.append(imageFor(f.app),el('span','',title));b.title=f.app.title+' · '+f.label;b.setAttribute('aria-label',`Terug naar ${title}`);b.setAttribute('aria-pressed',String(activeKey===f.key));return b;}));}
  function closeFrame(key){const current=frames.get(key);if(!current)return;current.cleanup?.();current.frame.src='about:blank';current.wrapper.remove();frames.delete(key);if(activeKey===key)showView(current.origin);else renderRunning();}
  function discardFrames(){frames.forEach(f=>{f.cleanup?.();f.frame.src='about:blank';f.wrapper.remove();});frames.clear();activeKey=null;renderRunning();}
  function saveCurrent(){const f=frames.get(activeKey);if(!f||f.utility||f.archive)return;
    if(f.mode.startsWith('worksheet:'))try{const save=f.frame.contentDocument?.querySelector('[data-worksheet-save]');if(save){if(save.disabled)toast('Maak eerst een geldige reeks; daarna kun je de opgaven en sleutel bewaren.');else save.click();return;}}catch{}
    let href=f.href,title=f.app.title,label=f.label;try{href=originalURL(f.frame.contentWindow.location.href)||href;if(f.algebraContext){const context=f.algebraContext;title+=' · '+context.worldTitle;if(context.levelTitle)label+=' · '+context.levelTitle;}if(f.app.id==='getallenwereld'){const doc=f.frame.contentDocument,part=doc.querySelector('#crumbLevel:not([hidden])')?.textContent.trim(),chapter=doc.querySelector('#crumbChapter:not([hidden]),#spaceCrumb')?.textContent.trim();if(part)title+=' · '+part;if(chapter)label+=' · '+chapter;}}catch{}const saved={key:f.key,id:f.app.id,mode:f.mode,title,href,label,date:new Date().toISOString()};prefs.saved=[saved,...prefs.saved.filter(s=>s.key!==f.key)].slice(0,50);persist();toast('Bewaard in Mijn taken.');}
  function openSaved(s){
    if(s.mode.startsWith('worksheet:')){openWorksheet(s.id,s.mode.slice(10));return;}
    if(!M.modes(s.id,role()).some(m=>m.id===s.mode)){toast('Deze ingang is niet beschikbaar voor dit account.');return;}
    const href=M.safeURL(s.href),g=M.app(s.id);if(g&&href)openFrame({key:s.key,app:g,mode:s.mode,label:s.label,href});
  }
  function syncProgressBadge(){
    const source=$('desktopProgress');source.removeAttribute('data-platform-progress');delete source.dataset.value;delete source.dataset.total;delete source.dataset.unit;delete source.dataset.title;
    const f=frames.get(activeKey);let native;
    try{const doc=f?.frame.contentDocument,win=f?.frame.contentWindow;
      if(doc&&(!win.AxiomaGame||win.AxiomaGame.active)){
        const n=doc.querySelector('[data-platform-progress]'),xp=doc.querySelector('#xpLabel,#xp'),levels=doc.querySelector('#completedCount')?.textContent.match(/(\d+)\s*\/\s*(\d+)/);
        if(n)native={kind:n.dataset.platformProgress,value:Number(n.dataset.value),total:Number(n.dataset.total),unit:n.dataset.unit};
        else if(xp&&/\d/.test(xp.textContent))native={kind:'xp',value:Number(xp.textContent.replace(/[^0-9]/g,''))};
        else if(levels)native={kind:'levels',value:Number(levels[1]),total:Number(levels[2])};
        else if(win.AxiomaGame?.state?.total)native={kind:'levels',value:new Set(win.AxiomaGame.state.completed||[]).size,total:win.AxiomaGame.state.total};
      }
    }catch{}
    if(!f&&role()==='student'&&progressState==='ready'){const totals=window.LeraarBobCatalogProgress.aggregate(Registry.list({includeComponents:true}),overview);if(totals)native={kind:'xp',value:totals.xp};}
    if(native&&Number.isFinite(native.value)){source.dataset.platformProgress=native.kind;source.dataset.value=String(native.value);source.dataset.title=f?.app.title||'je spellen';if(native.total)source.dataset.total=String(native.total);if(native.unit)source.dataset.unit=native.unit;}
    window.dispatchEvent(new Event('axioma:game-progress'));
  }
  async function refreshProgress(){
    const turn=++request;controller?.abort();if(role()!=='student')return;
    const owner=account.id,c=new AbortController();controller=c;progressState='loading';syncProgressBadge();const timeout=setTimeout(()=>c.abort(),12000);
    try{const result=await window.AxiomaProgress.loadOverview({signal:c.signal});if(turn!==request||account?.id!==owner||result.accountId!==owner)return;overview=result;progressState='ready';}
    catch{if(turn!==request||account?.id!==owner)return;progressState='error';}
    finally{clearTimeout(timeout);if(turn===request){controller=null;renderHome();if(view.kind==='profile'&&!activeKey)renderLibrary();syncProgressBadge();}}
  }
  function accountChanged({account:next,pending=false}){
    authPending=pending;if(pending&&!next&&account===null){renderHome();return;}
    const changed=account?.id!==next?.id||account?.role!==next?.role;resolved=true;
    if(!changed){account=next||null;renderHome();if(view.kind==='profile'&&!activeKey)renderLibrary();return;}
    ++request;controller?.abort();clearTimeout(progressTimer);discardFrames();overview=null;account=next||null;prefs=M.read(safeStorage(),account);progressState=role()==='student'?'loading':'guest';applyPrefs();
    $('modeDialog').close();$('confirmClose').close();showView(view,{route:false});renderHome();if(role()==='student')refreshProgress();
  }
  function openAccount(){closeStart();window.LeraarBobTopbar?.openAccount();}
  function toggleStart(opener=document.activeElement){if(!$('startPanel').hidden){closeStart({restoreFocus:true});return;}startReturnFocus=opener;$('startBackdrop').hidden=false;$('startPanel').hidden=false;$('startPanel').inert=false;$('startButton').setAttribute('aria-expanded','true');$('startSearch').value='';renderStart();$('startSearch').focus();}
  function closeStart({restoreFocus=false}={}){
    const wasOpen=!$('startPanel').hidden;$('startPanel').hidden=true;$('startPanel').inert=true;$('startBackdrop').hidden=true;$('startButton').setAttribute('aria-expanded','false');
    if(wasOpen&&restoreFocus){const node=startReturnFocus;let owner;
      try{let win=node?.ownerDocument?.defaultView;while(win&&win!==window){owner=[...frames.values()].find(f=>f.frame.contentWindow===win);if(owner)break;win=win.parent;}}catch{}
      if(node?.isConnected&&(!owner||owner.key===activeKey)&&!node.closest?.('[hidden],[inert]'))node.focus?.();else $('startButton').focus();}
    startReturnFocus=null;
  }
  function desktopShortcut(e){
    if(e.isComposing)return;
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();e.stopPropagation();if($('startPanel').hidden)toggleStart(e.target);else $('startSearch').focus();}
    if(e.key==='Escape'&&!$('startPanel').hidden){e.preventDefault();e.stopPropagation();closeStart({restoreFocus:true});}
  }
  function renderStart(){
    const query=$('startSearch').value.trim();$('startResultsTitle').textContent=query?'Zoekresultaten':'Ga meteen naar';const nodes=[];
    if(!query){M.themes.forEach(t=>{const b=button('','start-result',()=>showView({kind:'theme',themeId:t.id})),copy=el('span');copy.append(el('strong','',t.title),el('small','',`${M.find({themeId:t.id}).length} bouwsels · themamap`));const symbol=icon(t.icon);symbol.style.color=t.color==='#dcb56b'?'#97764a':'#5b7b72';b.append(symbol,copy);nodes.push(b);});}
    const apps=query?M.find({query}):prefs.pins.map(M.app).filter(Boolean);
    apps.forEach(g=>{const b=button('','start-result',()=>openApp(g.id)),copy=el('span');copy.append(el('strong','',g.title),el('small','',`${M.types[g.type].label} · ${M.theme(g.desktopTheme).short}`));b.append(imageFor(g),copy);nodes.push(b);});
    $('startResultCount').textContent=query?`${apps.length} gevonden`:'';$('startResults').replaceChildren(...nodes);if(!nodes.length)$('startResults').append(el('p','start-empty','Geen bouwsels gevonden. Probeer een thema of een andere naam.'));
  }
  function readRoute(){const p=new URLSearchParams(location.search),theme=p.get('theme'),place=p.get('place');if(M.theme(theme))return {kind:'theme',themeId:theme};if(viewNames[place])return {kind:place,themeId:M.theme(p.get('worksheetTheme'))?p.get('worksheetTheme'):p.get('worksheetTheme')==='all'?'all':'',topicId:p.get('worksheetTopic')||''};return {kind:'desktop'};}
  function updateClock(){const date=new Date();$('clock').dateTime=date.toISOString();$('clock').replaceChildren(document.createTextNode(date.toLocaleTimeString('nl-BE',{hour:'2-digit',minute:'2-digit'})),el('small','',date.toLocaleDateString('nl-BE',{day:'numeric',month:'short'})));}
  $('startButton').onclick=()=>toggleStart();$('startBackdrop').onclick=()=>closeStart({restoreFocus:true});$('startSearch').oninput=renderStart;
  $('librarySearch').oninput=()=>{view.query=$('librarySearch').value;$('viewContent').replaceChildren();renderApps();};
  $('homeBtn').onclick=()=>showView({kind:'desktop'});
  $('modeBtn').onclick=()=>{let native;try{native=frames.get(activeKey)?.frame.contentDocument?.querySelector('#themeBtn,#modeBtn[aria-pressed],#theme');}catch{}if(native){native.click();syncThemeControl();}else setSiteTheme(document.documentElement.dataset.mode!=='dark');};
  $('appBack').onclick=()=>{showView(frames.get(activeKey)?.origin||view);refreshProgress();};$('minimizeApp').onclick=()=>{showView({kind:'desktop'});refreshProgress();};
  $('saveActivity').onclick=saveCurrent;$('closeApp').onclick=()=>{$('confirmClose').dataset.key=activeKey;$('confirmClose').showModal();};$('cancelClose').onclick=()=>{$('confirmClose').close();};$('acceptClose').onclick=()=>{const key=$('confirmClose').dataset.key;$('confirmClose').close();closeFrame(key);refreshProgress();};
  document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(b?.dataset.view)showView({kind:b.dataset.view});if(b?.dataset.action==='desktop')showView({kind:'desktop'});if(b?.dataset.action==='start')toggleStart();if(b?.hasAttribute('data-close-dialog'))b.closest('dialog').close();});
  document.addEventListener('click',e=>{
    const link=e.composedPath().find(n=>n?.matches?.('a[data-platform-home],a.teacher-link,a.live-entry'));if(!link)return;
    e.preventDefault();
    if(link.matches('.teacher-link'))openUtility('teacher','Mijn klassen','teacher/','class',true);
    else if(link.matches('.live-entry')){if(role()==='teacher')openApp('rechten-arbeid-les','live');else openUtility('lesson-join','Deelnemen aan een live les','lessons/rechten-arbeid/join.html','people');}
    else showView({kind:'desktop'});
  },true);
  document.addEventListener('keydown',desktopShortcut);
  window.addEventListener('beforeunload',e=>{if(frames.size){e.preventDefault();e.returnValue='';}});
  window.addEventListener('popstate',()=>showView(readRoute(),{route:false}));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){updateClock();refreshProgress();}});
  window.addEventListener('online',refreshProgress);
  window.addEventListener('leraarbob:worksheets-change',event=>{if(authPending||event.detail?.owner!==(account?.id?'account:'+account.id:'guest'))return;if(!activeKey&&['worksheets','worksheet-saved'].includes(view.kind))renderLibrary();else toast('Je map Mijn oefenbladen is bijgewerkt · op dit toestel.');});
  document.addEventListener('topbar:change',()=>{if(view.kind==='settings')renderLibrary();});
  window.LeraarBobDesktop=Object.freeze({openApp,openModes,showView,openWorksheet,state:()=>({accountId:account?.id||null,role:role(),activeKey,view:{...view},openApps:[...frames.keys()],pins:prefs.pins.slice(),savedCount:prefs.saved.length,progressState})});
  prefs=M.read(safeStorage(),null);applyPrefs();showView(readRoute(),{route:false});renderHome();updateClock();setInterval(updateClock,30000);syncThemeControl();
  if(window.AxiomaAuth){window.AxiomaAuth.onChange(accountChanged);window.AxiomaAuth.ready().then(result=>{if(!resolved)accountChanged(result);}).catch(()=>{authPending=false;$('accountStatus').textContent='Gast · accountverbinding tijdelijk niet beschikbaar';});}
})();
