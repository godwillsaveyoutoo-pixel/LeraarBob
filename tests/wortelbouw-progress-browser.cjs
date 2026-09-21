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
  const info=game('wortelbouw'),P=require('../games/wortelbouw/progress.js');
  const click=(c,selector)=>c.eval(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const inspect=c=>c.eval('Wortelbouw.inspect()');
  async function step(c,mode,k,edge){await click(c,`[data-mode="${mode}"]`);await click(c,`[data-length="${k}"]`);await click(c,`[data-target="edge-${edge}"]`);for(const part of ['triangle','helper','result'])await click(c,`[data-target="${part}"]`);await c.wait(`Wortelbouw.inspect().state.phase!=='reveal'`)}
  async function puzzle(c,index){await click(c,'#progressButton');await c.eval(`document.querySelectorAll('.progressLevel')[${index}].click()`)}
  async function first(c){if((await inspect(c)).manual)await click(c,'#manual');await click(c,'[data-length="1"]');await click(c,'[data-target="start"]');await step(c,'sum',1,0);await c.eval('AxiomaGame.flush()')}
  const a=await open(info,{local:{[P.KEY]:{version:1,current:'length-2',levels:{'length-2':{completed:true}}}}});
  await a.send('Emulation.setDeviceMetricsOverride',{width:640,height:360,deviceScaleFactor:1,mobile:true});
  assert.deepEqual(await a.eval('AxiomaGame.state.completed'),[],'unassigned guest data not imported');await first(a);
  assert.deepEqual(await a.eval('AxiomaGame.state.completed'),['length-2']);assert.equal(await a.eval('AxiomaGame.status'),'saved');
  const won=await a.eval('structuredClone(testRow.state)');assert.deepEqual(Object.keys(won.storage),[P.KEY]);
  await click(a,'#progressButton');assert.equal(await a.eval('document.querySelectorAll(".progressLevel.done").length'),1);
  const shot=await a.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/wortelbouw-progress-640.png',Buffer.from(shot.data,'base64'));await click(a,'#closeProgress');
  await click(a,'#undo');await click(a,'#restart');assert.deepEqual(await a.eval('AxiomaGame.state.completed'),['length-2'],'replaying never erases an achievement');
  const b=await open(info,{remote:won});assert.equal((await inspect(b)).state.phase,'won');assert.deepEqual(await b.eval('AxiomaGame.state.completed'),['length-2']);
  await puzzle(b,12);await click(b,'[data-length="2"]');await click(b,'[data-target="start"]');await step(b,'sum',1,0);await step(b,'sum',1,3);
  assert.equal((await inspect(b)).state.phase,'routeDone');await click(b,'#continue');await click(b,'[data-length="3"]');await click(b,'[data-target="start"]');await click(b,'[data-length="1"]');await click(b,'[data-target="edge-0"]');await click(b,'[data-target="triangle"]');await b.eval('AxiomaGame.flush()');
  const pending=await b.eval('structuredClone(testRow.state)');assert.equal(JSON.parse(pending.storage[P.KEY]).levels['length-6-two-ways'].routes.length,1);
  const c=await open(info,{remote:pending});assert.equal((await inspect(c)).state.phase,'helper');assert.equal((await inspect(c)).state.solutions.length,1);
  await click(c,'[data-target="helper"]');await click(c,'[data-target="result"]');await c.wait(`Wortelbouw.inspect().state.phase==='choose'`);await step(c,'difference',2,3);await c.eval('AxiomaGame.flush()');
  assert.equal((await inspect(c)).state.phase,'won');assert.deepEqual(await c.eval('AxiomaGame.state.completed'),['length-2','length-6-two-ways']);
  const progress=JSON.parse((await c.eval('testRow.state')).storage[P.KEY]);assert.equal(progress.levels['length-6-two-ways'].routes.length,2);assert.equal(progress.levels['length-6-two-ways'].bestSteps,4);
  const saved=await c.eval('structuredClone(testRow.state)');
  await c.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.testFixture=${JSON.stringify({game:'wortelbouw',remote:saved})};window.testLoaded=false;window.addEventListener('axioma:game-ready',()=>window.testLoaded=true);`});
  await c.eval('testLoaded=false');await c.send('Page.reload');await c.wait('testLoaded');assert.equal((await inspect(c)).state.phase,'won');
  await c.eval('testOffline=true');await click(c,'#next');await c.eval('AxiomaGame.flush()');assert.equal(await c.eval('AxiomaGame.status'),'offline');await c.eval('testOffline=false;AxiomaGame.flush()');assert.equal(await c.eval('AxiomaGame.status'),'saved');
  const writes=await c.eval('testWrites.length');await c.eval(`testAccount({id:'other-student',role:'student',alias:'Andere leerling'})`);assert.equal(await c.eval('AxiomaGame.active'),false);await click(c,'#restart');await c.eval('AxiomaGame.flush()');assert.equal(await c.eval('testWrites.length'),writes);
  for(const account of [null,{id:'teacher',role:'teacher'}]){const local=await open(info,{account});await first(local);assert.deepEqual(await local.eval('AxiomaGame.state.completed'),['length-2']);assert.equal(await local.eval('testWrites.length'),0);assert.equal(await local.eval('testReads.length'),0)}
  const broken=await open(info,{remote:{completed:['length-2'],total:14,storage:{[P.KEY]:'{broken'}}});assert.deepEqual(await broken.eval('AxiomaGame.state.completed'),['length-2'],'damaged draft never erases the saved completion summary');
  const all=await open(info,{remote:{completed:P.ids,total:14,finished:true,storage:{}}});assert.equal(await all.eval('document.querySelector("#completedCount").textContent'),'14/14');await click(all,'#progressButton');assert.equal(await all.eval('document.querySelectorAll(".progressLevel.done").length'),14);
  for(const client of clients)assert.deepEqual(client.errors,[]);
  console.log('PASS Wortelbouw: saved completions, best steps, partial squares, both routes, second device, reload, offline retry, account isolation and guest/teacher separation');
 }finally{for(const id of contexts)await browser.send('Target.disposeBrowserContext',{browserContextId:id});for(const c of clients)c.ws.close();browser.ws.close()}
})().catch(e=>{console.error(e);process.exit(1)});
