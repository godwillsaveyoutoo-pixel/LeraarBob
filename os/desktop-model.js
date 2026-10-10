/* Presentation and desktop preferences. Learning state stays with each native app. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory;
  else root.LeraarBobDesktopModel=factory(root.LeraarBobGameRegistry);
})(typeof globalThis==='object'?globalThis:this,function(registry){
  'use strict';
  const themes=[
    {id:'rechten',title:'Rechten & functies',short:'Rechten',color:'#dcb56b',icon:'graph',description:'Van je eerste rechte tot een rake treffer.'},
    {id:'getallen',title:'Getallen & rekenen',short:'Getallen',color:'#9dcab3',icon:'number',description:'Rekenregels ontdekken, oefenen en toepassen.'},
    {id:'algebra',title:'Algebra',short:'Algebra',color:'#c2ade1',icon:'algebra',description:'Een werkplaats voor vormen en vergelijkingen.'},
    {id:'vectoren',title:'Vectoren',short:'Vectoren',color:'#91c8d4',icon:'vector',description:'Richting geven, verplaatsen en tekenen.'},
    {id:'pythagoras',title:'Pythagoras & lengtes',short:'Pythagoras',color:'#e3ad94',icon:'triangle',description:'Ontdek de stelling en bouw met lengtes.'},
    {id:'ruimte',title:'Ruimtelijk inzicht',short:'Ruimte',color:'#9cb7dd',icon:'cube',description:'Van een vlak beeld naar een ruimtelijk bouwwerk.'},
    {id:'statistiek',title:'Statistiek',short:'Statistiek',color:'#d7a7bf',icon:'chart',description:'Kijk kritisch naar gegevens en grafieken.'},
    {id:'logica',title:'Logica & puzzels',short:'Logica',color:'#bfce92',icon:'puzzle',description:'Proberen, doordenken en opnieuw ontdekken.'}
  ];
  const types={learn:{label:'Les',verb:'Les openen',icon:'book'},train:{label:'Trainer',verb:'Oefenen',icon:'target'},game:{label:'Spel',verb:'Spelen',icon:'game'},atelier:{label:'Atelier',verb:'Maken',icon:'brush'}};
  const membership={
    'rechtenwereld':'rechten','rechten-arcade':'rechten','rechten-trainer':'rechten','functies-rechten':'rechten',brandweer:'rechten',kleiduifschieten:'rechten','rechten-zeeslag':'rechten','signal-lab':'rechten',
    'getallenwereld':'getallen','reele-getallen-trainer':'getallen',taartenwinkel:'getallen',verfwinkel:'getallen','bewerkingen-trainer':'getallen',
    'algebra-trainer':'algebra','algebra-smederij':'algebra',stelsels:'algebra','vectoren-trainer':'vectoren',pythagoras:'pythagoras',wortelbouw:'pythagoras',kubusbouw:'ruimte','data-check':'statistiek','gravity-maze':'logica'
  };
  const extra=[
    {id:'glasraam',title:'Glasraam',subtitle:'Ontwerp je eigen glasraam met rechten en kleur.',kind:'atelier',desktopTheme:'rechten',href:'games/rechten/rechtenwereld/glasatelier.html',cover:'os/assets/glasraam.svg',progressType:'none',capabilities:{modes:[{id:'solo',participation:'solo',purpose:'learn',roles:['guest','student','teacher'],href:'games/rechten/rechtenwereld/glasatelier.html'}],worksheets:[]}},
    {id:'rechten-arbeid-les',title:'Rechten & arbeid',subtitle:'Onderzoek helling en betekenis in een interactieve les.',kind:'learn',desktopTheme:'rechten',href:'lessons/rechten-arbeid/',cover:'assets/covers/graph.svg',progressType:'none',capabilities:{modes:[{id:'solo',title:'Les bekijken',participation:'solo',purpose:'learn',roles:['guest','student','teacher'],href:'lessons/rechten-arbeid/'},{id:'live',title:'Live les geven',participation:'class',purpose:'learn',roles:['teacher'],href:'lessons/rechten-arbeid/index.html#lessessie'}],worksheets:[]}},
    {id:'vectoren-canvas',title:'Vectoratelier',subtitle:'Een vrij werkblad voor vectoren en constructies.',kind:'atelier',desktopTheme:'vectoren',href:'games/vectoren/canvas.html',cover:'assets/covers/vectoren.svg',progressType:'none',capabilities:{modes:[{id:'solo',participation:'solo',purpose:'learn',roles:['guest','student','teacher'],href:'games/vectoren/canvas.html'}],worksheets:[]}}
  ];
  const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const base=registry.baseURL;
  function apps(){return [...registry.list(),...extra].map(g=>({...g,type:types[g.kind]?g.kind:'game',desktopTheme:g.desktopTheme||membership[g.id]||'logica',legacy:['rechten-trainer','functies-rechten'].includes(g.id)}));}
  function app(id){return apps().find(g=>g.id===id)||null;}
  function theme(id){return themes.find(t=>t.id===id)||null;}
  function safeURL(href){try{const u=new URL(href,base);const b=new URL(base);return u.origin===b.origin&&u.pathname.startsWith(b.pathname)&&!u.username&&!u.password&&['https:','http:','file:'].includes(u.protocol)?u.href:null;}catch{return null;}}
  function modes(id,role='guest',topicId){
    const g=app(id);if(!g)return [];
    const entries=extra.some(e=>e.id===id)?g.capabilities.modes.filter(e=>e.roles.includes(role)):registry.modes(id,{role,topicId});
    // Participation in a class is not permission to host one.
    return entries.filter(e=>(!['classroom','classlearn','teacher','live'].includes(e.id)||role==='teacher')&&!(id==='rechtenwereld'&&e.id==='learn'&&role==='teacher'));
  }
  function modeLabel(m){
    if(m.title)return m.title;
    if(m.id==='solo')return m.purpose==='battle'?'Solo · tegen de computer':'Solo · op je eigen tempo';
    return ({learn:'Samen leren',local:'Duo Battle · één toestel',online:'Duo Battle · elk een toestel',classroom:'Klas Battle starten',classlearn:'Klas Learn starten',teacher:'Borduitleg',series:'Oefenreeks samenstellen'})[m.id]||m.id;
  }
  function destination(id,mode='solo',{role='guest',topicId,returnTo}={}){
    const g=app(id),m=modes(id,role,topicId).find(e=>e.id===mode);if(!m)return null;
    if(registry.game(id)){
      const destination=registry.destination(id,mode,{topicId,returnTo,hub:false});
      if(mode==='classroom'&&destination){const url=new URL(id==='getallenwereld'?'games/bewerkingen-trainer/start.html':destination,base);if(id==='getallenwereld'){url.search=new URL(destination).search;url.searchParams.set('view','battle');url.searchParams.set('audience','class');}url.searchParams.set('hub','1');url.searchParams.set('classFlow','1');url.searchParams.set('osEntry','1');url.searchParams.set('create','1');return url.href;}
      if(id==='getallenwereld'&&mode==='series'&&destination){const url=new URL('games/bewerkingen-trainer/',base);url.search=new URL(destination).search;url.searchParams.set('mode','solo');url.searchParams.set('screen','setup');return url.href;}
      if(id==='rechten-zeeslag'&&mode==='solo'&&destination){const url=new URL(destination);url.searchParams.set('solo','1');return url.href;}
      return destination;
    }
    const url=new URL(m.href,base);if(returnTo&&safeURL(returnTo)){const r=new URL(returnTo,base);url.searchParams.set('returnTo',r.pathname+r.search+r.hash);}return url.href;
  }
  function worksheets(id){return registry.game(id)?registry.worksheets(id):[];}
  function worksheetTopics(){
    const found=new Map();
    for(const g of apps())for(const sheet of worksheets(g.id)){
      const provider=sheet.providerId||sheet.providerGameId||g.id,sourceId=provider+':'+sheet.id;
      for(const topicId of sheet.topics?.length?sheet.topics:[sheet.topicId||sheet.id]){
        const key=sourceId+'|'+topicId;if(found.has(key))continue;
        const title=({machten:'Machten',wortels:'Vierkantswortels',wetenschappelijk:'Wetenschappelijke notatie'})[topicId]||sheet.title;
        const href=new URL(sheet.href,base);if(sheet.topicParam)href.searchParams.set(sheet.topicParam,topicId);
        found.set(key,{key,sourceId,id:sheet.id,appId:g.id,providerId:provider,topicId,title,description:sheet.description,themeId:g.desktopTheme,href:href.href});
      }
    }
    return [...found.values()];
  }
  function find({query='',themeId='',type='all'}={}){
    const words=normalize(query).split(/\s+/).filter(Boolean);
    return apps().filter(g=>(!themeId||g.desktopTheme===themeId)&&(type==='all'||g.type===type)&&words.every(w=>normalize([g.title,g.subtitle,g.theme,theme(g.desktopTheme)?.title,types[g.type].label].join(' ')).includes(w)));
  }
  const defaults={pins:['rechtenwereld'],recent:[],saved:[],wallpaper:'coast',reducedMotion:false,focusMode:false};
  const key=account=>'leraarbob-desktop:v1:'+encodeURIComponent(account?.id||'guest');
  function sanitize(value){
    const v=value&&typeof value==='object'?value:{};
    return {pins:Array.isArray(v.pins)?[...new Set(v.pins)].filter(id=>app(id)).slice(0,12):defaults.pins.slice(),recent:Array.isArray(v.recent)?v.recent.filter(r=>app(r?.id)&&typeof r.mode==='string').slice(0,10):[],saved:Array.isArray(v.saved)?v.saved.filter(r=>app(r?.id)&&safeURL(r.href)).slice(0,50):[],wallpaper:['coast','quiet'].includes(v.wallpaper)?v.wallpaper:'coast',reducedMotion:v.reducedMotion===true,focusMode:v.focusMode===true};
  }
  function read(storage,account){try{return sanitize(JSON.parse(storage.getItem(key(account))||'null'));}catch{return sanitize(null);}}
  function write(storage,account,prefs){const clean=sanitize(prefs);storage.setItem(key(account),JSON.stringify(clean));return clean;}
  return Object.freeze({themes,types,apps,app,theme,modes,modeLabel,destination,worksheets,worksheetTopics,find,safeURL,key,read,write,sanitize,defaults});
});
