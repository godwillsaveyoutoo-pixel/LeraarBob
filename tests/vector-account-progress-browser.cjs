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
 const version=await(await fetch('http://127.0.0.1:9245/json/version')).json();const browser=new CDP();await browser.connect(version.webSocketDebuggerUrl);
 const contexts=[],clients=[];
 async function open(game,fixture={}){
  const {browserContextId}=await browser.send('Target.createBrowserContext');contexts.push(browserContextId);
  const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});const c=new CDP();await c.connect('ws://127.0.0.1:9245/devtools/page/'+targetId);clients.push(c);
  await c.send('Page.enable');await c.send('Runtime.enable');
  c.event=m=>{if(m.method==='Fetch.requestPaused'){
   const p=m.params,url=new URL(p.request.url),auth=url.pathname.endsWith('/axioma-auth.js');
   if(url.hostname==='127.0.0.1'&&!auth&&!url.pathname.endsWith('/axioma-social.js'))c.send('Fetch.continueRequest',{requestId:p.requestId});
   else c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(auth?mock:'').toString('base64')});
  }};
  await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  const source='window.testFixture='+JSON.stringify({game:game.id,...fixture})+';window.testLoaded=false;window.addEventListener("axioma:game-ready",()=>window.testLoaded=true);'+Object.entries(fixture.local||{}).map(([k,v])=>'localStorage.setItem('+JSON.stringify(k)+','+JSON.stringify(JSON.stringify(v))+');').join('');
  const {identifier}=await c.send('Page.addScriptToEvaluateOnNewDocument',{source});
  await c.send('Page.navigate',{url:'http://127.0.0.1:8775/'+game.href});await c.wait(fixture.expectStatus?'window.AxiomaGame?.status==='+JSON.stringify(fixture.expectStatus):'window.testLoaded');
  await c.send('Page.removeScriptToEvaluateOnNewDocument',{identifier});
  assert.deepEqual(c.errors,[],game.id+' runtime errors');
  return c;
 }
 const catalog=JSON.parse(fs.readFileSync('games.json')),game=id=>catalog.find(g=>g.id===id);
 const info=game('vectoren-trainer'),Core=require('../games/vectoren/vector-core.js'),M=Core.VectorMath,KEY='axioma-vectorentrainer-v020';
 const t=Core.TaskGenerator.generate('headtail',{seed:71,level:1,variant:2}),mid=M.endPointFromVector(t.start,t.parts[0]),end=M.endPointFromVector(t.start,t.target);
 const draft={skill:t.skill,seed:t.seed,variant:t.variant,level:t.level,free:false,intro:false,done:false,dirty:false,stage:0,session:{answered:0,clean:0,repairs:0,xp:0},answer:{strokes:[M.stroke(t.start,mid),M.stroke(mid,end),M.stroke(t.start,end,'result')],values:['',''],point:null,choice:null}};
 const remote={storage:{[KEY]:JSON.stringify({progress:Core.TrainerScheduler.freshState(),draft})},completed:[],total:24};
 try{
  const c=await open(info,{remote});await c.send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});
  assert.equal(await c.eval('document.body.dataset.screen'),'home');await c.eval("document.getElementById('resumeBtn').click();document.getElementById('commit').click()");await c.eval('AxiomaGame.flush()');await c.wait("AxiomaGame.status==='saved'");
  const won=await c.eval('structuredClone(testRow.state)'),saved=JSON.parse(won.storage[KEY]);
  assert(saved.progress.xp>0);await c.wait("document.querySelector('leraarbob-topbar')?.shadowRoot.querySelector('.progress-value').textContent==="+JSON.stringify(saved.progress.xp+' XP'));assert.equal(await c.eval("getComputedStyle(document.querySelector('.xp-chip')).display"),'none');assert(saved.draft.done);assert.equal(saved.draft.session.answered,1);assert.equal(saved.progress.skills.headtail.seen,1);
  assert.deepEqual(Object.keys(won.storage),[KEY]);assert(await c.eval("testWrites.every(w=>w.args.p_game_id==='vectoren-trainer'&&w.args.p_user_id==='learner-b')"));
  await c.wait("document.getElementById('guestBtn').dataset.saveStatus==='saved'");assert.equal(await c.eval("document.getElementById('profileDetail').textContent"),'Online opgeslagen');
  console.log('PASS actual trainer answer saves XP, skill evidence, session and draft through the account-bound RPC');
  const second=await open(info,{remote:won});await second.eval("document.getElementById('resumeBtn').click()");assert.equal(await second.eval('AxiomaVectorTrainer.inspect().progress.xp'),saved.progress.xp);assert.equal(await second.eval('AxiomaVectorTrainer.inspect().done'),true);
  await second.wait("document.querySelector('leraarbob-topbar')?.shadowRoot.querySelector('.progress-value').textContent==="+JSON.stringify(saved.progress.xp+' XP'));
  assert(await second.eval("testReads.every(q=>q.user_id==='learner-b')"));console.log('PASS a fresh device context restores the central learner snapshot');
  await second.eval("testOffline=true;document.getElementById('commit').click();AxiomaGame.flush()");await second.wait("AxiomaGame.status==='offline'");await second.wait("document.getElementById('guestBtn').dataset.saveStatus==='offline'");
  assert(await second.eval("Object.keys(localStorage).some(k=>k.includes('student:learner-b')&&JSON.parse(localStorage.getItem(k)).dirty)"));
  await second.eval('testOffline=false;AxiomaGame.flush()');await second.wait("AxiomaGame.status==='saved'");console.log('PASS offline changes remain account-bound and retry updates the visible save status');
  const other=await open(info,{account:{id:'learner-c',alias:'Leerling C'},local:{[KEY]:saved}});assert.equal(await other.eval('AxiomaVectorTrainer.inspect().progress.xp'),0);assert.equal(await other.eval("document.getElementById('resumeBtn').hidden"),true);console.log('PASS another learner never inherits unassigned progress from this browser');
  await second.eval("testAccount({id:'learner-c',role:'student',alias:'Leerling C'})");await second.wait("document.getElementById('guestBtn').dataset.saveStatus==='changed'");assert.equal(await second.eval('AxiomaGame.active'),false);await second.wait("document.querySelector('leraarbob-topbar').shadowRoot.querySelector('.progress').hidden");
  for(const client of clients)assert.deepEqual(client.errors,[]);console.log('PASS changing accounts blocks the previous game and shows the changed status');
 }finally{for(const context of contexts)await browser.send('Target.disposeBrowserContext',{browserContextId:context});for(const client of clients)client.ws.close();browser.ws.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
