'use strict';
// Real shared lifecycle, synthetic identities, isolated local HTTP data only.
// Save commits are intentionally separated from their HTTP acknowledgement.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),rows=new Map(),writes=[],reads=[];
let holdSaves=false,loadGate=null;
const held=new Set(),copy=v=>JSON.parse(JSON.stringify(v));
// Postgres jsonb does not preserve object insertion order; arrays remain ordered.
const reorder=v=>Array.isArray(v)?v.map(reorder):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).reverse().map(k=>[k,reorder(v[k])])):v;
const rowKey=(user,game)=>user+':'+game;
function fixture(game){return `<!doctype html><html><body><header><a href="/">leraarBob</a></header>
<script>
window.AXIOMA_CONFIG={url:'https://fixture.supabase.invalid'};
let actor={id:localStorage.getItem('fixture-user')||'student-a',role:'student',alias:'Testalias'},listeners=[];
window.AxiomaAuth={ready:async()=>({account:actor}),getAccount:async()=>actor,onChange:fn=>listeners.push(fn)};
window.switchFixtureAccount=id=>{actor={id,role:'student',alias:'Andere alias'};localStorage.setItem('fixture-user',id);listeners.forEach(fn=>fn({account:actor,pending:false}));};
window.AxiomaProgress={load:async(game,user)=>{const r=await fetch('/fixture-progress?game='+encodeURIComponent(game)+'&user='+encodeURIComponent(user));return r.json();},save:async(game,state,revision,user)=>{const r=await fetch('/fixture-progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({game,state,revision,user})});return r.json();}};
window.AxiomaGameAdapters={${JSON.stringify(game)}:{keys:['engine-save']}};
</script>
<script type="text/axioma-game">window.fixtureDraft=JSON.parse(AxiomaGame.storage.getItem('engine-save')||'null');window.fixtureReady=true;</script>
<script src="/shared/axioma-game.js" data-game-id=${JSON.stringify(game)}></script></body></html>`;}
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://local');
 if(url.pathname==='/fixture-progress'){
  res.setHeader('Content-Type','application/json');
  if(req.method==='POST'){
   let body='';for await(const part of req)body+=part;
   const data=JSON.parse(body),key=rowKey(data.user,data.game),old=rows.get(key);
   if(data.revision!==(old?.revision||0)){res.end(JSON.stringify({status:'conflict',revision:old?.revision||0}));return;}
   const row={state:reorder(copy(data.state)),revision:data.revision+1};rows.set(key,row);writes.push({...copy(data),committedRevision:row.revision});
   if(holdSaves){held.add(res);res.on('close',()=>held.delete(res));return;}
   res.end(JSON.stringify({status:'saved',revision:row.revision}));return;
  }
  const user=url.searchParams.get('user'),game=url.searchParams.get('game');reads.push({user,game});
  if(loadGate)await loadGate;
  res.end(JSON.stringify(rows.get(rowKey(user,game))||{state:null,revision:0}));return;
 }
 if(url.pathname==='/shared/axioma-game.js'){res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(path.join(root,'shared/axioma-game.js')));return;}
 if(url.pathname==='/fixture'){
  const game=url.searchParams.get('game')||'getallenwereld';
  if(!['getallenwereld','algebra-trainer'].includes(game)){res.writeHead(400).end();return;}
  res.setHeader('Content-Type','text/html');res.end(fixture(game));return;
 }
 res.writeHead(404).end();
});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<200;i++){if(fn())return;await pause(20);}throw Error('Timeout: '+label);}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,executablePath:process.env.ALGEBRA_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 const contexts=[];
 try{
  async function open(){
   const context=await browser.newContext(),page=await context.newPage();contexts.push(context);
   page.on('pageerror',error=>{throw error;});
   await page.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
   await page.goto(base+'/fixture');await page.waitForFunction(()=>window.fixtureReady&&AxiomaGame.active);
   return page;
  }
  const nativeKey=(user='student-a',game='getallenwereld')=>'axioma:progress:v2:'+encodeURIComponent('https://fixture.supabase.invalid')+':student:'+user+':'+game;
  async function cache(page,user,game){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),nativeKey(user,game));}
  async function change(page,value){await page.evaluate(value=>{AxiomaGame.storage.setItem('engine-save',JSON.stringify({values:[value],nested:{a:1,b:2}}));AxiomaGame.report(['machten-product'],15,'machten-product');},value);}
  async function pendingCommit(page,value){
   holdSaves=true;const previous=writes.length;await change(page,value);
   // Exercise automatic debounce: no explicit flush or save acknowledgement.
   await until(()=>writes.length>previous,'automatic save committed');
   assert.equal(await page.evaluate(()=>AxiomaGame.status),'saving');
   const local=await cache(page);assert(local.dirty);assert.equal(local.revision,writes.at(-1).revision);
  }
  rows.clear();const identical=await open();
  await identical.evaluate(()=>AxiomaGame.storage.setItem('device-choice','native-only'));
  await pendingCommit(identical,'17');const before=await cache(identical),beforeWrites=writes.length;
  await identical.reload();await identical.waitForFunction(()=>window.fixtureReady&&AxiomaGame.active);
  assert.equal(await identical.evaluate(()=>AxiomaGame.status),'saved');
  assert.deepEqual(await identical.evaluate(()=>fixtureDraft),{values:['17'],nested:{a:1,b:2}});
  const after=await cache(identical);assert.equal(after.revision,before.revision+1);assert.equal(after.dirty,false);assert.deepEqual(after.state,before.state,'native local record retained');
  assert.equal(after.state.storage['device-choice'],'native-only');
  assert.equal(Object.hasOwn(rows.get('student-a:getallenwereld').state.storage,'device-choice'),false,'undeclared key never uploaded');
  await pause(900);assert.equal(writes.length,beforeWrites,'acknowledging equal content makes no extra save');
  console.log('PASS committed save with missing reply: automatic save, reload, jsonb key order, native-only data and no duplicate write');

  rows.clear();const different=await open();await pendingCommit(different,'21');
  const changed=rows.get('student-a:getallenwereld');changed.state.storage['engine-save']=JSON.stringify({values:['other-device'],nested:{a:1,b:2}});
  await different.reload();await different.waitForFunction(()=>AxiomaGame.status==='conflict');
  assert.equal(await different.evaluate(()=>AxiomaGame.active),false);assert.equal(await different.evaluate(()=>window.fixtureReady===true),false);
  assert.equal(JSON.parse((await cache(different)).state.storage['engine-save']).values[0],'21');
  assert.equal(JSON.parse(rows.get('student-a:getallenwereld').state.storage['engine-save']).values[0],'other-device');
  console.log('PASS differing persisted content keeps local work and blocks the engine');

  rows.clear();const extra=await open();await pendingCommit(extra,'31');await change(extra,'32');
  await extra.reload();await extra.waitForFunction(()=>AxiomaGame.status==='conflict');
  assert.equal(JSON.parse((await cache(extra)).state.storage['engine-save']).values[0],'32');
  assert.equal(JSON.parse(rows.get('student-a:getallenwereld').state.storage['engine-save']).values[0],'31');
  console.log('PASS additional edits after committed pending save are not discarded or falsely acknowledged');

  rows.clear();const schema=await open();await pendingCommit(schema,'41');rows.get('student-a:getallenwereld').state.schemaVersion=3;
  await schema.reload();await schema.waitForFunction(()=>AxiomaGame.status==='conflict');
  assert.equal((await cache(schema)).dirty,true);
  console.log('PASS different persisted schema is a conflict');

  rows.clear();const arrayOrder=await open();holdSaves=true;
  const beforeArrayWrites=writes.length;
  await arrayOrder.evaluate(()=>{AxiomaGame.storage.setItem('engine-save','{}');AxiomaGame.report(['first','second'],15,'first');});
  await until(()=>writes.length>beforeArrayWrites,'array save committed');
  rows.get('student-a:getallenwereld').state.completed.reverse();
  await arrayOrder.reload();await arrayOrder.waitForFunction(()=>AxiomaGame.status==='conflict');
  assert.deepEqual((await cache(arrayOrder)).state.completed,['first','second']);
  console.log('PASS ordered arrays are compared exactly, despite reordered object properties');

  rows.clear();const scoped=await open();await pendingCommit(scoped,'51');const aCache=await cache(scoped);
  await scoped.evaluate(()=>switchFixtureAccount('student-b'));assert.equal(await scoped.evaluate(()=>AxiomaGame.active),false);
  await scoped.reload();await scoped.waitForFunction(()=>window.fixtureReady&&AxiomaGame.active);
  assert.equal(await scoped.evaluate(()=>fixtureDraft),null);assert.deepEqual(await cache(scoped),aCache,'another account cannot acknowledge or consume A cache');
  assert.equal(reads.at(-1).user,'student-b');assert.equal(writes.some(w=>w.user==='student-b'),false);
  await scoped.evaluate(()=>localStorage.setItem('fixture-user','student-a'));
  await scoped.goto(base+'/fixture?game=algebra-trainer');await scoped.waitForFunction(()=>window.fixtureReady&&AxiomaGame.active);
  assert.equal(await scoped.evaluate(()=>fixtureDraft),null);assert.deepEqual(reads.at(-1),{user:'student-a',game:'algebra-trainer'});assert.equal(writes.some(w=>w.game==='algebra-trainer'),false);
  assert.deepEqual(await cache(scoped),aCache);
  console.log('PASS identity and game scopes keep pending native cache separate');

  // Identity changes while the old account's equal remote snapshot is downloading.
  await scoped.evaluate(()=>localStorage.setItem('fixture-user','student-a'));
  let release;loadGate=new Promise(resolve=>release=resolve);
  const beforeReads=reads.length,navigate=scoped.goto(base+'/fixture');
  await until(()=>reads.length>beforeReads,'held old-account load');
  await scoped.evaluate(()=>switchFixtureAccount('student-b'));loadGate=null;release();await navigate;
  await scoped.waitForFunction(()=>AxiomaGame.status==='error');
  assert.equal(await scoped.evaluate(()=>AxiomaGame.active),false);assert.equal(await scoped.evaluate(()=>window.fixtureReady===true),false);
  assert.deepEqual(await cache(scoped),aCache,'late old-account response does not persist acknowledgement');
  console.log('PASS account replacement during download blocks old engine and retains untouched old-account cache');
 }finally{
  loadGate=null;for(const res of held)res.destroy();for(const context of contexts)await context.close();await browser.close();await new Promise(resolve=>server.close(resolve));
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
