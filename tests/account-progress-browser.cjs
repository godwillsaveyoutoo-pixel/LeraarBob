// Real game documents and progress service, synthetic accounts/in-memory database only.
// Every external request is intercepted. No live accounts or student results are used.
const assert=require('node:assert/strict'),fs=require('node:fs');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
class CDP {
 async connect(url){this.ws=new WebSocket(url);this.pending=new Map();this.id=0;this.errors=[];await new Promise(r=>this.ws.onopen=r);this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else{if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails);this.event?.(m)}}}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
 async wait(expr){for(let i=0;i<200;i++){if(await this.eval(expr))return;await delay(30)}throw Error('Timeout '+expr+' '+JSON.stringify(await this.eval('({status:window.AxiomaGame?.status,errors:window.testErrors})')))}
}
const mock=`(()=>{
 let account=window.testFixture.account===null?null:{id:'learner-b',alias:'Leerling B',role:'student',...window.testFixture.account};
 const listeners=new Set();window.testWrites=[];window.testReads=[];window.testOffline=!!window.testFixture.offline;window.testDelay=0;window.testConflict=false;
 window.testRow=window.testFixture.remote?{game_id:window.testFixture.game,state:window.testFixture.remote,revision:4}:null;
 const client={from(table){const filters={};const q={select(){return q},eq(k,v){filters[k]=v;return q},maybeSingle(){return q},then(resolve){window.testReads.push({table,...filters});setTimeout(()=>resolve(window.testOffline?{error:Error('offline')}:{data:table==='axioma_profiles'?{user_id:account?.id,alias:account?.alias}:table==='axioma_progress'?null:structuredClone(window.testRow)}),window.testDelay)}};return q},async rpc(name,args){
  if(name==='axioma_is_teacher')return {data:account?.role==='teacher'};
  if(name!=='axioma_save_game_progress_for_account'&&name!=='axioma_save_progress_for_account')throw Error('Unexpected RPC '+name);
  await new Promise(r=>setTimeout(r,window.testDelay));
  if(window.testOffline)return {error:Error('offline')};
  if(args.p_user_id!==account?.id)return {error:Error('Account changed')};
  if(window.testConflict||args.p_revision!==(window.testRow?.revision||0))return {data:{status:'conflict',revision:(window.testRow?.revision||0)+1}};
  window.testRow={game_id:args.p_game_id,state:structuredClone(args.p_state),revision:(window.testRow?.revision||0)+1};
  window.testWrites.push({account:account.id,args:structuredClone(args)});return {data:{status:'saved',revision:window.testRow.revision,updated_at:new Date().toISOString()}};
 }};
 window.testAccount=a=>{account=a;listeners.forEach(fn=>fn({account,session:account?{user:account}:null}))};
 window.AxiomaAuth={getAccount:async()=>account,ready:async()=>({account,session:account?{user:account}:null}),getSession:async()=>account?{user:account}:null,client:()=>client,onChange:fn=>{listeners.add(fn);return()=>listeners.delete(fn)}};
})();`;
(async()=>{
 const version=await(await fetch('http://127.0.0.1:9235/json/version')).json();const browser=new CDP();await browser.connect(version.webSocketDebuggerUrl);
 const contexts=[],clients=[];
 async function open(game,fixture={}){
  const {browserContextId}=await browser.send('Target.createBrowserContext');contexts.push(browserContextId);
  const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});const c=new CDP();await c.connect('ws://127.0.0.1:9235/devtools/page/'+targetId);clients.push(c);
  await c.send('Page.enable');await c.send('Runtime.enable');
  c.event=m=>{if(m.method==='Fetch.requestPaused'){
   const p=m.params,url=new URL(p.request.url),auth=url.pathname.endsWith('/axioma-auth.js');
   if(url.hostname==='127.0.0.1'&&!auth&&!url.pathname.endsWith('/axioma-social.js'))c.send('Fetch.continueRequest',{requestId:p.requestId});
   else c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(auth?mock:'').toString('base64')});
  }};
  await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  const source='window.testFixture='+JSON.stringify({game:game.id,...fixture})+';window.testLoaded=false;window.addEventListener("axioma:game-ready",()=>window.testLoaded=true);'+Object.entries(fixture.local||{}).map(([k,v])=>'localStorage.setItem('+JSON.stringify(k)+','+JSON.stringify(JSON.stringify(v))+');').join('');
  const {identifier}=await c.send('Page.addScriptToEvaluateOnNewDocument',{source});
  await c.send('Page.navigate',{url:'http://127.0.0.1:8765/'+game.href});await c.wait(fixture.expectStatus?'window.AxiomaGame?.status==='+JSON.stringify(fixture.expectStatus):'window.testLoaded');
  await c.send('Page.removeScriptToEvaluateOnNewDocument',{identifier});
  assert.deepEqual(c.errors,[],game.id+' runtime errors');
  return c;
 }
 const catalog=JSON.parse(fs.readFileSync('games.json')),game=id=>catalog.find(g=>g.id===id);
 try{
  const c=await open(game('pythagoras'),{local:{'axioma.pythagoras.completed.v1':[1,2,3]}});
  await c.eval('AxiomaGame.flush()');
  assert.deepEqual(await c.eval('AxiomaGame.state.completed'),[],'previous learner/guest not imported');
  assert(await c.eval('testWrites.every(w=>w.args.p_state.completed.length===0)'));
  assert.deepEqual(await c.eval('JSON.parse(localStorage.getItem("axioma.pythagoras.completed.v1"))'),[1,2,3],'legacy data preserved');
  console.log('PASS shared device: prior unassigned progress never uploaded into another account');

  const samples={pythagoras:['1','2','3'],stelsels:['0','1'],'algebra-smederij':['D01','D02'],taartenwinkel:['0','1'],kubusbouw:['0','1'],verfwinkel:['0','1'],'data-check':['1','2'],'signal-lab':['0','1'],'gravity-maze':['mass-6']};
  for(const [id,completed] of Object.entries(samples)){
   const c=await open(game(id),{remote:{completed,total:game(id).progressTotal||80}});
   await c.eval('AxiomaGame.flush()');
   assert.deepEqual((await c.eval('AxiomaGame.state.completed')).sort(),completed.sort(),id+' retains remote completion');
   assert(await c.eval('testReads.every(q=>q.user_id==="learner-b")'),id+' reads pinned to user');
   if(id==='pythagoras')assert.equal(await c.eval('document.querySelector("#level5").hidden'),false,'resume at first incomplete step');
   if(id==='stelsels')assert.equal(await c.eval('document.querySelector("#exerciseSelect").value'),'2');
   console.log('PASS remote hydration:',id);
  }

  const p=await open(game('pythagoras'),{remote:{completed:['1','2'],total:10}});
  await p.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await p.eval('AxiomaGame.flush()');
  const dockWidth=await p.eval(`document.querySelector('#axioma-game-status').getBoundingClientRect().width`);
  await p.eval('testOffline=true;AxiomaSimple.cloud([1,2,3],10);AxiomaGame.flush()');
  assert.equal(await p.eval('AxiomaGame.status'),'offline');
  assert.equal(await p.eval(`document.querySelector('#axioma-game-status').getBoundingClientRect().width`),dockWidth,'status width stays fixed while saving/offline');
  assert(await p.eval('Object.keys(localStorage).some(k=>k.includes("student:learner-b")&&JSON.parse(localStorage.getItem(k)).dirty)'));
  await p.eval('testOffline=false;AxiomaGame.flush()');assert.equal(await p.eval('AxiomaGame.status'),'saved');
  assert.deepEqual(await p.eval('testRow.state.completed'),['1','2','3']);
  await p.eval('testDelay=100;AxiomaSimple.cloud([1,2,3,4],10);window.pendingSave=AxiomaGame.flush()');
  await p.eval('AxiomaSimple.cloud([1,2,3,4,5],10)');await p.eval('pendingSave');await p.wait('AxiomaGame.status==="saved"');
  assert.deepEqual(await p.eval('testRow.state.completed'),['1','2','3','4','5'],'save during request not dropped');
  await p.eval('testDelay=150;AxiomaSimple.cloud([1,2,3,4,5,6],10);window.pendingSave=AxiomaGame.flush();testAccount({id:"learner-c",role:"student",alias:"Leerling C"})');
  await p.eval('pendingSave');assert.equal(await p.eval('AxiomaGame.active'),false);assert(await p.eval('testWrites.every(w=>w.account==="learner-b")'),'inflight save cannot be redirected to C');
  await p.eval('AxiomaSimple.cloud([9],10)');assert.deepEqual(await p.eval('AxiomaGame.state.completed'),['1','2','3','4','5','6'],'old engine blocked');
  console.log('PASS offline retry, edits during saving, account switch and delayed save isolation');

  const conflict=await open(game('pythagoras'),{remote:{completed:['1'],total:10}});await conflict.eval('AxiomaGame.flush()');
  await conflict.eval('testConflict=true;AxiomaSimple.cloud([1,2],10);AxiomaGame.flush()');
  assert.equal(await conflict.eval('AxiomaGame.status'),'conflict');assert.equal(await conflict.eval('AxiomaGame.active'),false);
  assert.deepEqual(await conflict.eval('testRow.state.completed'),['1']);
  console.log('PASS concurrent revision conflict: remote not overwritten, local work retained');
  const cache=await c.eval('Object.fromEntries(Object.keys(localStorage).filter(k=>k.includes("student:learner-b")).map(k=>[k,JSON.parse(localStorage.getItem(k))]))');
  const offline=await open(game('pythagoras'),{offline:true,local:cache});assert.equal(await offline.eval('AxiomaGame.status'),'offline');
  const missing=await open(game('pythagoras'),{offline:true,expectStatus:'error'});assert.equal(await missing.eval('testLoaded'),false);assert.equal(await missing.eval('testWrites.length'),0);
  console.log('PASS failed initial download: own cache remains playable; without a cache no empty game overwrites online progress');
  // Native engine storage changes update the overview before any polling callback.
  await c.eval('AxiomaGame.storage.setItem("axioma.pythagoras.completed.v1","[1,2,3,4]");AxiomaGame.flush()');
  assert.deepEqual(await c.eval('testRow.state.completed'),['1','2','3','4']);


  const v=await open(game('vectoren-trainer'));await v.eval('while(AxiomaVectorTrainer.inspect().intro)document.querySelector("#commit").click();AxiomaGame.flush()');
  const vectorTask=await v.eval('AxiomaVectorTrainer.inspect().task');
  for(const point of [vectorTask.start,{x:vectorTask.start.x+vectorTask.target.dx,y:vectorTask.start.y+vectorTask.target.dy}]){
   const position=await v.eval(`(()=>{const p=AxiomaVectorTrainer.project(${JSON.stringify(point)}),r=document.getElementById('board').getBoundingClientRect();return {x:p.x+r.x,y:p.y+r.y}})()`);
   await v.send('Input.dispatchMouseEvent',{type:'mousePressed',...position,button:'left',clickCount:1});await v.send('Input.dispatchMouseEvent',{type:'mouseReleased',...position,button:'left',clickCount:1});
  }
  await v.eval('document.querySelector("#commit").click();AxiomaGame.flush()');
  const before=await v.eval('AxiomaVectorTrainer.inspect()'),saved=await v.eval('testRow.state');assert.equal(before.progress.xp,10,'earned XP saved with the learning model');
  assert(before.progress.total>0,'record an actual vector exercise');
  const v2=await open(game('vectoren-trainer'),{remote:saved});const after=await v2.eval('AxiomaVectorTrainer.inspect()');
  for(const key of ['progress','session','task','answer'])assert.deepEqual(after[key],before[key],'vector new device '+key);
  await v.eval(`document.querySelector('#freeBtn').click();document.querySelector('#skillList button').click();AxiomaGame.flush()`);
  const practiceSaved=await v.eval('testRow.state'),v3=await open(game('vectoren-trainer'),{remote:practiceSaved});
  assert.equal(await v3.eval('AxiomaVectorTrainer.inspect().free'),true);
  await v3.eval(`document.querySelector('#playBtn').click();AxiomaGame.flush()`);
  const returned=await v3.eval('AxiomaVectorTrainer.inspect()');
  for(const key of ['progress','session','task','answer'])assert.deepEqual(returned[key],before[key],'suspended route on second device '+key);
  console.log('PASS vector trainer: XP and suspended learning route restored on another device after free practice');

  const real=await open(game('reele-getallen-trainer'));
  await real.eval('while(AxiomaRealTrainer.inspect().phase==="intro")document.querySelector("#commit").click()');
  await real.eval(`(()=>{const t=AxiomaRealTrainer.inspect().task;for(const [i,value] of [Math.abs(t.target.n),t.target.d].entries()){document.querySelector('[data-slot="'+i+'"]').click();for(const digit of String(value))document.querySelector('[data-key="'+digit+'"]').click()}if(t.target.n<0)document.querySelector('[data-key="sign"]').click();document.querySelector('#commit').click()})()`);
  await real.eval('AxiomaGame.flush()');
  const realBefore=await real.eval('AxiomaRealTrainer.inspect()'),realSaved=await real.eval('testRow.state');assert.equal(realBefore.progress.xp,10);assert.equal(realBefore.phase,'done');
  const real2=await open(game('reele-getallen-trainer'),{remote:realSaved}),realAfter=await real2.eval('AxiomaRealTrainer.inspect()');
  for(const key of ['progress','session','task','answer','phase'])assert.deepEqual(realAfter[key],realBefore[key],'real numbers second device '+key);
  console.log('PASS real numbers: earned XP, learning route and completed answer restored on a second device');
  await real.eval(`document.querySelector('#browse').click();document.querySelectorAll('#topics .topic-card button')[RealNumbersCore.skills.findIndex(s=>s.id==='sets')].click();document.querySelector('[data-sort-token="0"]').click();document.querySelector('[data-zone="R"]').click();AxiomaGame.flush()`);
  const sortedBefore=await real.eval('AxiomaRealTrainer.inspect()'),sortedRemote=await real.eval('testRow.state');assert.equal(sortedRemote.total,10);
  const real3=await open(game('reele-getallen-trainer'),{remote:sortedRemote});assert.deepEqual(await real3.eval('AxiomaRealTrainer.inspect().answer'),sortedBefore.answer,'nested-set placement restored on another device');assert.equal(await real3.eval('AxiomaRealTrainer.inspect().progress.xp'),10);
  console.log('PASS real numbers: ten-skill catalog, unfinished set sorting and prior XP on a second device');


  for(const role of [null,{id:'teacher',role:'teacher'}]){
   const guest=await open(game('pythagoras'),{account:role,local:{'axioma.pythagoras.completed.v1':[1,2]}});
   await guest.eval('AxiomaSimple.cloud([1,2,3],10);AxiomaGame.flush()');
   assert.equal(await guest.eval('testWrites.length'),0);assert.equal(await guest.eval('testReads.length'),0);
  }
  for(const id of ['brandweer','kleiduifschieten','functies-rechten','rechten-zeeslag','rechten-trainer','reele-getallen-trainer']){
   // Zeeslag needs the separate multiplayer mock, covered by social-browser.cjs.
   if(id==='rechten-zeeslag')continue;
   const c=await open(game(id),{account:{id:'teacher',role:'teacher'}});assert.equal(await c.eval('testWrites.length'),0,id);
   console.log('PASS teacher can open:',id);
  }
  const navalGuest=await open(game('rechten-zeeslag'),{account:null});await navalGuest.eval(`document.querySelector('#demoBtn').click()`);assert.equal(await navalGuest.eval(`document.querySelector('#opponentName').textContent`),'Computer');assert(await navalGuest.eval(`document.querySelector('#gameScreen').classList.contains('active')`));
  console.log('PASS guest/teacher separation and guest solo entry; no actual accounts or database writes');
 }finally{for(const id of contexts)await browser.send('Target.disposeBrowserContext',{browserContextId:id});for(const c of clients)c.ws.close();browser.ws.close()}
})().catch(e=>{console.error(e);process.exit(1)});
