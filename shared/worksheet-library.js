/* Worksheet documents are separate from learner progress. Account-scoped, on this device. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory;
  else root.LeraarBobWorksheetLibrary=factory({window:root,document:root.document,indexedDB:root.indexedDB,crypto:root.crypto});
})(typeof globalThis==='object'?globalThis:this,function createWorksheetLibrary(options){
  'use strict';
  const win=options.window,doc=options.document,dbAPI=options.indexedDB;
  const VERSION=1,MAX_BYTES=16*1024*1024,MAX_ENTRIES=200;
  const sources={
    'rechtenwereld:hellingrug':{theme:'rechten',topic:'hellingrug'},
    'rechtenwereld:grenspas':{theme:'rechten',topic:'grenspas'},
    'rechtenwereld:formulewerf':{theme:'rechten',topic:'formulewerf'},
    'rechtenwereld:signaalstad':{theme:'rechten',topic:'signaalstad'},
    'algebra-trainer:equations':{theme:'algebra',topic:'equations'},
    'algebra-trainer:systems':{theme:'algebra',topic:'systems'},
    'bewerkingen-trainer:operations':{theme:'getallen',topics:['machten','wortels','wetenschappelijk','mixed']}
  };
  const allowedStyles=new Set([
    'oefenbladen/paper.css','shared/worksheet-layout.css','shared/worksheet-hub.css','shared/vendor/katex/katex.min.css',
    'games/rechten/rechtenwereld/worksheets/worksheets.css',
    'games/rechten/rechtenwereld/styles/worksheet-sections.css',
    'games/algebra-trainer/styles.css','games/algebra-trainer/stelsels/styles.css',
    'games/algebra-trainer/style.css','games/algebra-trainer/stelsels.css','games/algebra-trainer/journey.css','games/algebra-trainer/stelsels/style.css',
    'games/bewerkingen-trainer/styles.css','games/bewerkingen-trainer/style.css'
  ]);
  let database,scope=null,authSource,authPending=false,identityRevision=0;
  function auth(){
    if(options.auth)return options.auth;
    try{let current=win;while(current){if(current.AxiomaAuth)return current.AxiomaAuth;if(current===current.parent)break;current=current.parent;}}catch{}
    return null;
  }
  const accountScope=account=>account?.id?'account:'+account.id:'guest';
  function updateIdentity(detail){identityRevision++;authPending=detail.pending===true;scope=authPending?null:accountScope(detail.account);}
  async function ready(){
    const source=auth();
    if(source){
      if(source!==authSource){authSource=source;source.onChange?.(updateIdentity);}
      const revision=identityRevision,result=await source.ready();
      const account=source.getAccount?await source.getAccount():result?.account;
      if(revision===identityRevision){authPending=result?.pending===true;scope=authPending?null:accountScope(account);}
      if(authPending||!scope)throw Error('Je account wordt nog gecontroleerd. Probeer bewaren opnieuw.');
    }else scope='guest';
    return scope;
  }
  const captureScope=()=>scope;
  function assertScope(expected){if(!expected||expected!==scope||authPending)throw Error('Het account is gewijzigd. Open de generator opnieuw voordat je bewaart.');}
  function openDB(){
    if(database)return database;
    database=new Promise((resolve,reject)=>{
      if(!dbAPI){reject(Error('Bewaren op dit toestel is niet beschikbaar. Download je reeks voordat je dit scherm sluit.'));return;}
      let request;try{request=dbAPI.open('leraarbob-worksheet-library',VERSION);}catch{reject(Error('Bewaren op dit toestel is geblokkeerd. Download je reeks voordat je dit scherm sluit.'));return;}
      request.onupgradeneeded=()=>{const store=request.result.createObjectStore('sheets',{keyPath:'key'});store.createIndex('owner','owner');};
      request.onsuccess=()=>{request.result.onversionchange=()=>{request.result.close();database=null;};resolve(request.result);};
      request.onerror=()=>reject(Error('Je oefenbladmap kon niet worden geopend. Download je reeks en probeer opnieuw.'));
      request.onblocked=()=>reject(Error('Sluit oudere leraarBob-tabbladen om de oefenbladmap te openen.'));
    }).catch(error=>{database=null;throw error;});return database;
  }
  async function transaction(owner,mode,operation){
    const db=await openDB();assertScope(owner);
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('sheets',mode),store=tx.objectStore('sheets');let result;
      tx.oncomplete=()=>resolve(result);
      tx.onabort=tx.onerror=()=>reject(Error(tx.archiveReason||(tx.error?.name==='QuotaExceededError'?'De opslag op dit toestel is vol. Download je reeks of verwijder een oudere reeks; er is niets automatisch verwijderd.':'Bewaren op dit toestel lukt niet. Download je reeks en probeer opnieuw.')));
      try{operation(store,value=>{result=value;},tx);}catch(error){tx.abort();reject(error);}
    });
  }
  const text=(value,max=160)=>String(value||'').trim().slice(0,max);
  const safeTags=new Set('section article main header footer div span p h1 h2 h3 h4 h5 h6 small strong em b i u s sub sup br hr table thead tbody tfoot tr th td colgroup col ul ol li dl dt dd figure figcaption pre code blockquote label svg g path rect circle ellipse line polyline polygon text tspan defs clipPath mask pattern use marker title desc math mrow mi mn mo mfrac msqrt mroot msup msub msubsup munder mover munderover mtable mtr mtd mtext mspace mstyle menclose mpadded mphantom semantics annotation img'.toLowerCase().split(' '));
  const dropTags=new Set('script style iframe frame object embed link meta base form input button textarea select option foreignobject annotation-xml'.split(' '));
  const attrs=new Set('id class title role colspan rowspan scope width height viewbox preserveaspectratio d points x y x1 y1 x2 y2 cx cy r rx ry transform fill stroke stroke-width stroke-linecap stroke-linejoin stroke-dasharray stroke-dashoffset opacity fill-opacity stroke-opacity font-size font-weight text-anchor dominant-baseline xmlns clip-path mask patternunits patterntransform markerwidth markerheight refx refy orient overflow display stretch mathvariant stretchy fence separator accent accentunder columnalign columnspacing rowspacing encoding alt'.split(' '));
  function sanitizeHTML(html){
    if(typeof html!=='string'||html.length>MAX_BYTES)throw Error('Deze reeks is te groot of ongeldig om te bewaren.');
    if(!doc)throw Error('De oefenbladweergave is niet beschikbaar.');
    const template=doc.createElement('template');template.innerHTML=html;
    for(const node of [...template.content.querySelectorAll('*')]){
      const tag=node.localName.toLowerCase();
      if(dropTags.has(tag)){node.remove();continue;}
      if(!safeTags.has(tag)){node.replaceWith(...node.childNodes);continue;}
      for(const attribute of [...node.attributes]){
        const name=attribute.name.toLowerCase(),value=attribute.value;
        if(tag==='ol'&&name==='start'){
          if(!/^[1-9][0-9]{0,4}$/.test(value))node.removeAttribute(attribute.name);
        }else if(name==='style'){
          if(/url\s*\(|expression\s*\(|@import|javascript|[\\<>]/i.test(value))node.removeAttribute(attribute.name);
        }else if(tag==='img'&&name==='src'){
          if(!/^data:image\/(?:png|jpeg);base64,[a-z0-9+/=\s]+$/i.test(value))node.removeAttribute(attribute.name);
        }else if(tag==='use'&&(name==='href'||name==='xlink:href')){
          if(!/^#[a-z0-9_.:-]+$/i.test(value))node.removeAttribute(attribute.name);
        }else if(!attrs.has(name)&&!/^aria-[a-z-]+$/.test(name)&&!/^data-[a-z0-9-]+$/.test(name))node.removeAttribute(attribute.name);
        else if(/(?:javascript:|url\s*\(\s*(?!#))/i.test(value))node.removeAttribute(attribute.name);
      }
    }
    return template.innerHTML;
  }
  function normalize(input){
    const source=sources[input?.sourceId];if(!source)throw Error('Deze oefenbladgenerator wordt niet herkend.');
    const topic=source.topic||text(input.topic,50);
    if(source.topics&&!source.topics.includes(topic))throw Error('Kies een herkenbaar onderwerp voor de reeks.');
    const styles=Array.isArray(input.styles)?[...new Set(input.styles)]:[];
    if(styles.some(style=>!allowedStyles.has(style)))throw Error('De oefenbladopmaak wordt niet herkend.');
    const value={version:VERSION,sourceId:input.sourceId,title:text(input.title)||'Oefenblad',theme:source.theme,topic,code:text(input.code,80),questionsHTML:sanitizeHTML(input.questionsHTML),keyHTML:sanitizeHTML(input.keyHTML||''),styles,config:JSON.parse(JSON.stringify(input.config||{})),data:JSON.parse(JSON.stringify(input.data||{}))};
    if(!value.questionsHTML.trim())throw Error('Maak eerst een oefenblad om te bewaren.');
    const encoded=JSON.stringify(value),bytes=new TextEncoder().encode(encoded).length;
    if(bytes>MAX_BYTES)throw Error('Deze reeks is te groot om te bewaren. Download of print ze voordat je dit scherm sluit.');
    return {...value,bytes};
  }
  function metadata(value){const {id,sourceId,title,theme,topic,code,createdAt,updatedAt,bytes}=value;return {id,sourceId,title,theme,topic,code,createdAt,updatedAt,bytes};}
  async function fingerprint(value){
    const body=JSON.stringify([value.sourceId,value.topic,value.questionsHTML,value.keyHTML,value.config,value.data]);
    if(options.crypto?.subtle){const digest=await options.crypto.subtle.digest('SHA-256',new TextEncoder().encode(body));return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');}
    // Equality of the complete snapshot below also protects the non-WebCrypto fallback.
    let a=2166136261,b=5381;for(let i=0;i<body.length;i++){a=Math.imul(a^body.charCodeAt(i),16777619);b=Math.imul(b,33)^body.charCodeAt(i);}return (a>>>0).toString(16)+(b>>>0).toString(16)+':'+body.length;
  }
  function changed(owner){
    let target=win;try{while(target&&target.parent!==target&&target.parent.location.origin===target.location.origin)target=target.parent;}catch{}
    if(target?.dispatchEvent)target.dispatchEvent(new target.CustomEvent('leraarbob:worksheets-change',{detail:{owner}}));
  }
  async function save(input,{expectedScope}={}){
    const owner=await ready();if(expectedScope!==undefined)assertScope(expectedScope);
    const value=normalize(input),hash=await fingerprint(value);assertScope(owner);
    const saved=await transaction(owner,'readwrite',(store,done,tx)=>{
      const req=store.index('owner').getAll(owner);req.onsuccess=()=>{
        const rows=req.result,old=rows.find(row=>row.fingerprint===hash&&JSON.stringify([row.doc.questionsHTML,row.doc.keyHTML,row.doc.config,row.doc.data])===JSON.stringify([value.questionsHTML,value.keyHTML,value.config,value.data]));
        if(old){done(old.doc);return;}
        if(rows.length>=MAX_ENTRIES){tx.archiveReason='Je map bevat 200 reeksen. Download en verwijder eerst een oudere reeks; er is niets automatisch verwijderd.';tx.abort();return;}
        const now=new Date().toISOString(),id=options.crypto?.randomUUID?.()||'sheet-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
        const entry={...value,id,createdAt:now,updatedAt:now};store.add({key:owner+'|'+id,owner,fingerprint:hash,doc:entry});done(entry);
      };
    });assertScope(owner);changed(owner);return metadata(saved);
  }
  async function list(){const owner=await ready(),rows=await transaction(owner,'readonly',(store,done)=>{const req=store.index('owner').getAll(owner);req.onsuccess=()=>done(req.result);});assertScope(owner);return rows.filter(row=>row.doc?.version===VERSION&&sources[row.doc.sourceId]).map(row=>metadata(row.doc)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
  async function get(id){const owner=await ready(),row=await transaction(owner,'readonly',(store,done)=>{const req=store.get(owner+'|'+id);req.onsuccess=()=>done(req.result);});assertScope(owner);if(!row)return null;if(row.doc?.version!==VERSION)throw Error('Deze bewaarde reeks gebruikt een andere versie. Download je kopie en behoud dit bestand.');return {...normalize(row.doc),...metadata(row.doc)};}
  async function remove(id){const owner=await ready();await transaction(owner,'readwrite',(store,done)=>{store.delete(owner+'|'+id);done(true);});assertScope(owner);changed(owner);return true;}
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const basicStyle='html,body{margin:0;background:#e6e9e7;color:#173238;font-family:Arial,sans-serif;height:auto!important;overflow-x:hidden!important;overflow-y:auto!important}body{padding:16px}.archive-caption{max-width:210mm;margin:0 auto 12px}.archive-caption h1{font-size:18px;margin:0 0 6px}.worksheet-page{margin:0 auto 16px}.archive-fit{margin:0 auto 16px}.archive-fit>*{max-width:none!important}img{max-width:100%;height:auto}.archive-key{break-before:page}@media print{html,body{background:white;padding:0;height:auto!important;overflow:visible!important}.archive-caption{display:none}body>main{display:block!important;height:auto!important;overflow:visible!important;padding:0!important;margin:0!important}.worksheet-page{margin:0;max-width:none}.archive-fit{width:auto!important;height:auto!important;margin:0!important;break-inside:avoid}.archive-fit>*{transform:none!important}.archive-fit>.paper,.archive-fit>.paperPage{width:auto!important}img{break-inside:avoid}}';
  function render(entry,{key=true,baseURL}={}){
    const value=normalize(entry),base=new URL(baseURL||new URL('../',win?.location?.href||'http://localhost/os/').href),origin=base.origin;
    const policy=`default-src 'none'; script-src 'none'; style-src 'unsafe-inline' ${origin}; font-src ${origin} data:; img-src data:; form-action 'none'; base-uri 'none'`;
    return '<!doctype html><html lang="nl-BE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="'+esc(policy)+'"><title>'+esc(value.title)+'</title>'+value.styles.map(style=>'<link rel="stylesheet" href="'+esc(new URL(style,base).href)+'">').join('')+'<style>'+basicStyle+'</style></head><body><header class="archive-caption"><h1>'+esc(value.title)+'</h1><p>'+esc(value.code)+' · Bewaarde reeks</p></header><main>'+value.questionsHTML+(key&&value.keyHTML?'<section class="archive-key">'+value.keyHTML+'</section>':'')+'</main></body></html>';
  }
  function exportJSON(entry){return JSON.stringify({format:'leraarbob-worksheet',version:VERSION,document:{...normalize(entry),...metadata(entry)}},null,2);}
  async function importJSON(json,{expectedScope}={}){
    if(typeof json!=='string'||new TextEncoder().encode(json).length>MAX_BYTES*2)throw Error('Deze kopie is te groot of ongeldig.');
    let file;try{file=JSON.parse(json);}catch{throw Error('Dit bestand is geen herkenbare leraarBob-reeks.');}
    if(file?.format!=='leraarbob-worksheet'||file.version!==VERSION||file.document?.version!==VERSION)throw Error('Dit bestand is geen ondersteunde leraarBob-reeks.');
    return save(file.document,{expectedScope});
  }
  async function exportHTML(entry,{baseURL}={}){
    let html=render(entry,{key:true,baseURL}),base=new URL(baseURL||new URL('../',win?.location?.href||'http://localhost/os/').href);
    for(const style of normalize(entry).styles){
      const url=new URL(style,base),response=await (options.fetch||win.fetch.bind(win))(url.href);if(!response.ok)throw Error('De volledige opmaak kon niet worden geladen. Probeer downloaden opnieuw.');
      const css=(await response.text()).replace(/url\((['"]?)(?!data:)([^)'"\s]+)\1\)/g,(_match,quote,path)=>'url("'+new URL(path,url).href+'")').replace(/<\/style/gi,'<\\/style');
      html=html.replace('<link rel="stylesheet" href="'+esc(url.href)+'">','<style>'+css+'</style>');
    }
    return html;
  }
  return Object.freeze({ready,ownerKey:captureScope,captureScope,save,list,get,remove,render,exportJSON,importJSON,exportHTML,sanitizeHTML,sources:Object.freeze(sources),limits:Object.freeze({maxBytes:MAX_BYTES,maxEntries:MAX_ENTRIES})});
});
