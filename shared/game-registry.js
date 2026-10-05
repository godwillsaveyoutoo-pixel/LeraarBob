/* games.json, bundled in js/catalog.js, is the single editable platform register. */
(function(root,factory){
 'use strict';
 if(typeof module==='object'&&module.exports){module.exports=factory;return;}
 if(root.LeraarBobGameRegistry)return;
 const base=new URL('../',document.currentScript.src);
 let registry=root.AXIOMA_CATALOG?factory(root.AXIOMA_CATALOG,{baseURL:base.href}):null;
 const ready=registry?Promise.resolve():new Promise((resolve,reject)=>{
  const existing=document.querySelector('script[data-game-catalog]');
  const script=existing||document.createElement('script');
  const complete=()=>{try{registry=factory(root.AXIOMA_CATALOG,{baseURL:base.href});resolve();}catch(e){reject(e);}};
  script.addEventListener('load',complete,{once:true});script.addEventListener('error',()=>reject(Error('Het spelregister kon niet laden.')),{once:true});
  if(!existing){script.dataset.gameCatalog='true';script.src=new URL('js/catalog.js',base).href;document.head.append(script);}
 });
 root.LeraarBobGameRegistry=Object.freeze({ready:()=>ready.then(()=>root.LeraarBobGameRegistry),list:options=>registry?.list(options)||[],game:id=>registry?.game(id)||null,modes:(id,options)=>registry?.modes(id,options)||[],worksheets:(id,options)=>registry?.worksheets(id,options)||[],destination:(...args)=>registry?.destination(...args)||null,current:path=>registry?.current(path||location.href)||null,baseURL:base.href});
})(typeof globalThis==='object'?globalThis:this,function createRegistry(catalog,{baseURL='http://localhost/'}={}){
 if(!Array.isArray(catalog))throw Error('Ongeldig spelregister.');
 const base=new URL(baseURL),games=JSON.parse(JSON.stringify(catalog));
 const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};games.forEach(freeze);
 const game=id=>games.find(g=>g.active!==false&&(g.id===id||(g.modeAliases||[]).includes(id)))||null;
 const list=({featured,teacherVisible}={})=>games.filter(g=>g.active!==false&&(featured===undefined||g.featured===featured)&&(teacherVisible===undefined||g.teacherVisible===teacherVisible)).sort((a,b)=>(a.featureOrder||1000)-(b.featureOrder||1000));
 function capabilities(id,kind,{topicId,role,includeReferences=true}={},seen=new Set()){
  const g=game(id);if(!g)return [];
  const key=g.id+':'+kind;if(seen.has(key))throw Error('Circulaire providerverwijzing: '+key);
  const next=new Set(seen).add(key);
  return (g.capabilities?.[kind]||[]).flatMap(entry=>{
   if(entry.reference){
    if(!includeReferences)return [];
    const ref=entry.reference,provider=game(ref.gameId),match=capabilities(ref.gameId,kind,{role,topicId:ref.topicId,includeReferences},next).find(c=>c.id===ref[kind==='modes'?'modeId':'worksheetId']);
    if(!match)return [];
    return [{...match,...entry,roles:match.roles,href:match.href,providerId:match.providerId,providerGameId:match.providerGameId,providerTitle:provider.title,isReference:true,topics:undefined,topicId:ref.topicId}];
   }
   if(role&&entry.roles&&!entry.roles.includes(role))return [];
   if(topicId&&((entry.topicId&&entry.topicId!==topicId)||(entry.topics&&!entry.topics.includes(topicId))))return [];
   return [{...entry,providerGameId:g.id,providerTitle:g.title,isReference:false}];
  });
 }
 const modes=(id,options)=>capabilities(id,'modes',options),worksheets=(id,options)=>capabilities(id,'worksheets',options);
 function destination(id,mode,{topicId,hub=false,returnTo}={}){
  const g=game(id),entry=modes(id,{topicId}).find(e=>e.id===mode);if(!g||!entry)return null;
  const provider=game(entry.providerGameId),topic=provider.topics?.find(t=>t.id===topicId);
  const url=new URL(hub&&mode==='classroom'?'klasbattle/':mode==='solo'&&topic&&(!topic.routeModes||topic.routeModes.includes('solo'))?topic.href:entry.href,base);
  if(hub&&mode==='classroom'){url.searchParams.set('game',provider.id);url.searchParams.set('view','create');}
  if(topicId&&entry.topicParam&&topic)url.searchParams.set(entry.topicParam,topicId);
  if(returnTo){const safe=safeReturn(returnTo);if(safe)url.searchParams.set('returnTo',safe);}
  return url.href;
 }
 function safeReturn(value){try{if(typeof value!=='string'||/[\\]|%2f|%5c/i.test(value.split(/[?#]/)[0]))return null;const url=new URL(value,base);if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname)||url.username||url.password||!['http:','https:','file:'].includes(url.protocol))return null;return url.pathname+url.search+url.hash;}catch{return null;}}
 function current(path){
  try{const url=new URL(path,base);if(url.origin!==base.origin)return null;
   const candidates=list().filter(g=>{const entry=new URL(g.route?.entry||g.href,base);return url.pathname===entry.pathname||(g.route?.prefix&&url.pathname.startsWith(new URL(g.route.prefix,base).pathname));});
   return candidates.sort((a,b)=>(new URL(b.route?.prefix||b.href,base).pathname.length)-(new URL(a.route?.prefix||a.href,base).pathname.length))[0]||null;
  }catch{return null;}
 }
 return Object.freeze({ready:()=>Promise.resolve(),list,game,modes,worksheets,destination,current,baseURL:base.href,safeReturn});
});
