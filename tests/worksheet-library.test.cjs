'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom'),{IDBFactory,IDBKeyRange,IDBObjectStore}=require('fake-indexeddb'),{webcrypto}=require('node:crypto');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8'),tick=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture({account={id:'alice',role:'teacher'},pending=false,indexedDB=new IDBFactory(),crypto=webcrypto}={}){
 const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>',{url:'https://school.example/LeraarBob/os/',runScripts:'outside-only'}),w=dom.window,listeners=[];
 Object.defineProperty(w,'indexedDB',{configurable:true,value:indexedDB});w.IDBKeyRange=IDBKeyRange;
 w.structuredClone=structuredClone;
 w.AxiomaAuth={ready:async()=>({account,pending}),getAccount:async()=>account,getSnapshot:()=>({account,pending}),onChange:listener=>{listeners.push(listener);return()=>{};}};
 const library=require('../shared/worksheet-library.js')({window:w,document:w.document,indexedDB,crypto,auth:w.AxiomaAuth});if(pending)await assert.rejects(()=>library.ready(),/account|control/i);else await library.ready();
 return{w,dom,library,emit:async(next,nextPending=false)=>{account=next;pending=nextPending;listeners.forEach(listener=>listener({account,pending}));await tick();if(!nextPending)return library.ready();}};
}
test('Archived numbered pages preserve their next question number and strip invalid starts',async t=>{
 const f=await fixture();t.after(()=>f.w.close());
 const safe=f.library.sanitizeHTML('<ol start="5"><li>Vijf</li></ol><ol start="javascript:alert(1)"><li>Zes</li></ol>');
 const host=f.w.document.createElement('div');host.innerHTML=safe;assert.equal(host.firstElementChild.start,5);assert.equal(host.lastElementChild.hasAttribute('start'),false);
});
const sourceStyles={
 'rechtenwereld:hellingrug':['shared/worksheet-layout.css','games/rechten/rechtenwereld/worksheets/worksheets.css'],
 'rechtenwereld:grenspas':['shared/worksheet-layout.css','games/rechten/rechtenwereld/worksheets/worksheets.css'],
 'rechtenwereld:formulewerf':['shared/worksheet-layout.css','games/rechten/rechtenwereld/worksheets/worksheets.css'],
 'rechtenwereld:signaalstad':['shared/worksheet-layout.css','games/rechten/rechtenwereld/worksheets/worksheets.css'],
 'algebra-trainer:equations':['shared/vendor/katex/katex.min.css','games/algebra-trainer/style.css'],
 'algebra-trainer:systems':[],
 'bewerkingen-trainer:operations':['shared/vendor/katex/katex.min.css','games/bewerkingen-trainer/style.css']
};
function snapshot(sourceId='rechtenwereld:hellingrug',variation=0){return {sourceId,title:'Exacte reeks '+variation,theme:sourceId.startsWith('rechten')?'rechten':sourceId.startsWith('algebra')?'algebra':'getallen',topic:sourceId==='bewerkingen-trainer:operations'?'machten':sourceId.split(':')[1],code:'AB'+variation,questionsHTML:'<article class="worksheet-page"><h1>Opgaven</h1><p>2x + '+variation+' = 6</p><div class="answer-space"></div></article>',keyHTML:'<article class="worksheet-page"><h1>Verbetersleutel</h1><p>x = '+(6-variation)/2+'</p></article>',styles:sourceStyles[sourceId],config:{count:1,seed:50+variation},data:{tasks:[{seed:50+variation,question:'2x + '+variation+' = 6',answer:(6-variation)/2}]}};}
test('The seven supported native source snapshots round-trip exact questions, paired key, config and tasks',async t=>{
 const f=await fixture();t.after(()=>f.w.close());const scope=f.library.captureScope();assert(scope);
 for(const sourceId of Object.keys(sourceStyles)){
  const input=snapshot(sourceId),meta=await f.library.save(input,{expectedScope:scope});assert(meta.id);const saved=await f.library.get(meta.id);
  for(const field of['sourceId','questionsHTML','keyHTML','title','theme','topic','code'])assert.equal(saved[field],input[field],field+' retains exact value');
  assert.deepEqual(JSON.parse(JSON.stringify(saved.config)),input.config);assert.deepEqual(JSON.parse(JSON.stringify(saved.data)),input.data);
  assert.equal((await f.library.save(input,{expectedScope:scope})).id,meta.id,'Repeated exact save retains one archive entry');
 }
 assert.equal((await f.library.list()).length,7);
});
test('New series coexist and account, guest and pending identity boundaries reject stale ownership',async t=>{
 const f=await fixture();t.after(()=>f.w.close());const aliceScope=f.library.captureScope(),a=await f.library.save(snapshot(),{expectedScope:aliceScope}),b=await f.library.save(snapshot('rechtenwereld:hellingrug',1),{expectedScope:aliceScope});assert.notEqual(a.id,b.id);
 await f.emit({id:'bob',role:'student'});const bobScope=f.library.captureScope();assert(bobScope);assert.notEqual(bobScope,aliceScope);assert.equal((await f.library.list()).length,0);assert.equal(await f.library.get(a.id),null);
 await assert.rejects(()=>f.library.save(snapshot(),{expectedScope:aliceScope}),/account|identiteit|gebruiker|scope|gewijzigd/i);assert.equal((await f.library.list()).length,0);
 await f.library.save(snapshot('bewerkingen-trainer:operations'),{expectedScope:bobScope});await f.emit(null);assert.equal((await f.library.list()).length,0,'Guests do not inherit authenticated snapshots');
 const guestScope=f.library.captureScope();assert(guestScope);await f.library.save(snapshot('algebra-trainer:equations'),{expectedScope:guestScope});await f.emit({id:'alice',role:'teacher'});assert.equal((await f.library.list()).length,2);assert((await f.library.get(a.id)).questionsHTML.includes('2x'));
 await f.emit({id:'alice',role:'teacher'},true);assert.equal(f.library.captureScope(),null,'Unresolved account is not an archive owner');await assert.rejects(()=>f.library.save(snapshot(),{expectedScope:aliceScope}),/account|identiteit|gebruiker|scope|control|wacht|gewijzigd/i);
});
test('A complete JSON backup preserves the saved exact series without carrying private account identity',async t=>{
 const f=await fixture();t.after(()=>f.w.close());const meta=await f.library.save(snapshot('algebra-trainer:equations'),{expectedScope:f.library.captureScope()}),saved=await f.library.get(meta.id),json=f.library.exportJSON(saved),backup=JSON.parse(json);
 assert.equal(json.includes('alice'),false);assert.equal(backup.document.questionsHTML,saved.questionsHTML);assert.equal(backup.document.keyHTML,saved.keyHTML);
 assert.equal(await f.library.remove(meta.id),true);assert.equal(await f.library.get(meta.id),null);assert.equal((await f.library.list()).length,0);
});
test('Archive documents preserve native MathML, safe SVG and embedded page images while stripping active content',async t=>{
 const f=await fixture();t.after(()=>f.w.close());const input=snapshot();
 input.questionsHTML='<article><h1>Exacte opgave</h1><script>window.pwned=1</script><img src="https://evil.example/pixel" onerror="window.pwned=2"><a href="javascript:alert(1)">Klik</a><iframe src="https://evil.example/"></iframe><object data="x"></object><style>@import url(https://evil.example/css);body{display:none}</style><svg viewBox="0 0 30 30"><path d="M1 1L20 20" onload="window.pwned=3"/><foreignObject><script>window.pwned=4</script></foreignObject></svg><math><mrow><msup><mi>x</mi><mn>2</mn></msup></mrow><annotation encoding="application/x-tex">x^2</annotation></math><img src="data:image/jpeg;base64,/9j/2Q==" alt="Bewaarde native pagina"></article>';
 const meta=await f.library.save(input,{expectedScope:f.library.captureScope()}),saved=await f.library.get(meta.id),html=f.library.render(saved,{key:false,baseURL:'https://school.example/LeraarBob/'}),document=new JSDOM(html).window.document;
 assert.equal(document.body.querySelectorAll('script,iframe,object,embed,foreignObject,style').length,0,'Untrusted archived nodes cannot add active content or styles');
 for(const element of document.querySelectorAll('*'))for(const attribute of element.attributes){assert(!/^on/i.test(attribute.name),'No event handlers');assert(!/^javascript:/i.test(attribute.value),'No script URLs');assert(!attribute.value.includes('evil.example'),'No externally supplied resources');}
 assert(document.querySelector('math msup'));assert.equal(document.querySelector('annotation').textContent,'x^2');assert(document.querySelector('svg path'));assert(document.querySelector('img[src^="data:image/jpeg"]'));
 assert.match(document.querySelector('meta[http-equiv="Content-Security-Policy"]').content,/script-src\s+'none'/);assert.equal(f.w.pwned,undefined);
});
test('Unknown generators, missing question payload and oversized snapshots cannot silently create entries',async t=>{
 const f=await fixture();t.after(()=>f.w.close());const scope=f.library.captureScope();
 for(const invalid of[{...snapshot(),sourceId:'foreign:unsafe'},{...snapshot(),questionsHTML:''},{...snapshot(),questionsHTML:'x'.repeat(17*1024*1024)}])await assert.rejects(()=>f.library.save(invalid,{expectedScope:scope}));
 assert.equal((await f.library.list()).length,0,'Rejected values leave no partial archive record');
});
test('Unavailable IndexedDB is reported instead of claiming successful local storage',async t=>{
 const f=await fixture({indexedDB:{open(){throw new Error('Opslag niet beschikbaar');}}});t.after(()=>f.w.close());
 await assert.rejects(()=>f.library.save(snapshot(),{expectedScope:f.library.captureScope()}),/opslag|bewar|database|indexed|beschikbaar/i);
});
test('Portable backup import validates version and complete payload, deduplicates and restores the exact pair after deletion',async t=>{
 const f=await fixture();t.after(()=>f.w.close());const scope=f.library.captureScope(),entry=await f.library.save(snapshot(),{expectedScope:scope}),saved=await f.library.get(entry.id),json=f.library.exportJSON(saved);
 assert.equal((await f.library.importJSON(json,{expectedScope:scope})).id,entry.id);assert.equal((await f.library.list()).length,1);
 for(const invalid of['{broken','[]',JSON.stringify({format:'other',version:1,document:snapshot()}),JSON.stringify({format:'leraarbob-worksheet',version:999,document:snapshot()}),JSON.stringify({format:'leraarbob-worksheet',version:1,document:{...snapshot(),questionsHTML:''}})])await assert.rejects(()=>f.library.importJSON(invalid,{expectedScope:scope}));
 assert.equal((await f.library.list()).length,1,'Invalid imports leave original saved document intact');await f.library.remove(entry.id);const imported=await f.library.importJSON(json,{expectedScope:scope}),restored=await f.library.get(imported.id);
 assert.equal(restored.questionsHTML,saved.questionsHTML);assert.equal(restored.keyHTML,saved.keyHTML);assert.deepEqual(JSON.parse(JSON.stringify(restored.data)),JSON.parse(JSON.stringify(saved.data)));
});
test('Quota failure keeps older entries and reports a failed save without false archive success',async t=>{
 const f=await fixture();t.after(()=>f.w.close());const scope=f.library.captureScope(),first=await f.library.save(snapshot(),{expectedScope:scope}),originalAdd=IDBObjectStore.prototype.add;
 IDBObjectStore.prototype.add=function(){this.transaction.abort();this.transaction.error=new DOMException('Injected storage quota failure','QuotaExceededError');};
 try{await assert.rejects(()=>f.library.save(snapshot('rechtenwereld:hellingrug',2),{expectedScope:scope}),/opslag.*vol|quota|niets automatisch verwijderd/i);}finally{IDBObjectStore.prototype.add=originalAdd;}
 assert.equal((await f.library.list()).length,1);assert.equal((await f.library.get(first.id)).questionsHTML,snapshot().questionsHTML);
});
test('The entry cap rejects the next new series without deleting any earlier document',async t=>{
 const f=await fixture();t.after(()=>f.w.close());const scope=f.library.captureScope(),ids=[];
 for(let index=0;index<f.library.limits.maxEntries;index++)ids.push((await f.library.save(snapshot('rechtenwereld:hellingrug',index),{expectedScope:scope})).id);
 await assert.rejects(()=>f.library.save(snapshot('rechtenwereld:hellingrug',f.library.limits.maxEntries),{expectedScope:scope}),/200|map|oudere|niets automatisch verwijderd/i);
 assert.equal((await f.library.list()).length,f.library.limits.maxEntries);assert(await f.library.get(ids[0]));assert(await f.library.get(ids.at(-1)));
});
test('An initially unresolved account cannot create a guest archive before identity resolves',async t=>{
 const f=await fixture({pending:true});t.after(()=>f.w.close());assert.equal(f.library.captureScope(),null);await assert.rejects(()=>f.library.save(snapshot()),/account|control/i);
 await f.emit({id:'alice',role:'teacher'});assert.equal(f.library.captureScope(),'account:alice');assert.equal((await f.library.list()).length,0);
});
test('Changing accounts while a snapshot is being fingerprinted never attaches that document to the new owner',async t=>{
 let release,started;const entered=new Promise(resolve=>started=resolve),gate=new Promise(resolve=>release=resolve);
 const f=await fixture({crypto:{randomUUID:()=>webcrypto.randomUUID(),subtle:{digest:async(...args)=>{started();await gate;return webcrypto.subtle.digest(...args);}}}});t.after(()=>f.w.close());
 const scope=f.library.captureScope(),pendingSave=f.library.save(snapshot(),{expectedScope:scope}),rejected=assert.rejects(()=>pendingSave,/account|identiteit|gewijzigd/i);await entered;
 await f.emit({id:'bob',role:'student'});release();await rejected;assert.equal((await f.library.list()).length,0);await f.emit({id:'alice',role:'teacher'});assert.equal((await f.library.list()).length,0);
});
