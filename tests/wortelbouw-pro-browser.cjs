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
 const nativeRPC=client.rpc.bind(client);client.rpc=(name,args)=>{const result=name==='axioma_social'?Promise.resolve({data:{players:[],invitations:[]},error:null}):nativeRPC(name,args);result.abortSignal=()=>result;return result;};
 window.AxiomaAuth={CLASSES:['3TMW'],getAccount:async()=>account,ready:async()=>({account,session:account?{user:account}:null}),getSession:async()=>account?{user:account}:null,client:()=>client,onChange:fn=>{listeners.add(fn);return()=>listeners.delete(fn)}};
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
   if(url.hostname==='127.0.0.1'&&!auth)c.send('Fetch.continueRequest',{requestId:p.requestId});
   else c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(auth?mock:'').toString('base64')});
  }};
  await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  const source='window.testFixture='+JSON.stringify({game:game.id,...fixture})+';window.testLoaded=false;window.addEventListener("axioma:game-ready",()=>window.testLoaded=true);'+Object.entries(fixture.local||{}).map(([k,v])=>'localStorage.setItem('+JSON.stringify(k)+','+JSON.stringify(JSON.stringify(v))+');').join('');
  const {identifier}=await c.send('Page.addScriptToEvaluateOnNewDocument',{source});
  await c.send('Page.navigate',{url:'http://127.0.0.1:8775/'+game.href});await c.wait(game.battle?'!!window.WortelbouwBattle':fixture.expectStatus?'window.AxiomaGame?.status==='+JSON.stringify(fixture.expectStatus):'window.testLoaded');
  await c.send('Page.removeScriptToEvaluateOnNewDocument',{identifier});
  assert.deepEqual(c.errors,[],game.id+' runtime errors');
  return c;
 }
 const info={id:'wortelbouw',href:'games/wortelbouw_pro_v0.5.0/wortelbouw/index.html'};
 const G=require('../games/wortelbouw_pro_v0.5.0/wortelbouw/geometry.js'),P=require('../games/wortelbouw_pro_v0.5.0/wortelbouw/progress.js');
 const solved=new G.Game(13);solved.commit({type:'start',k:10,x:0,y:0});
 const square=solved.state.objects[0];let chosen;
 for(const e of G.freeEdges(solved.state,square)){for(const flip of [false,true]){if(G.plan(solved.state,square.id,e.index,2,'sum',flip)?.valid){chosen={e,flip};break}}if(chosen)break;}
 solved.commit({type:'triangle',owner:square.id,edgeIndex:chosen.e.index,k:2,mode:'sum',flip:chosen.flip});for(const type of ['helper','result','reveal'])solved.commit({type});
 const progress=P.record(P.fresh(),solved),remote={storage:{[P.KEY]:JSON.stringify(progress)},completed:P.completed(progress),total:14};
 const out='docs/wortelbouw-pro/screenshots';fs.mkdirSync(out,{recursive:true});
 async function shot(c,name){await delay(150);const r=await c.send('Page.captureScreenshot',{captureBeyondViewport:false});fs.writeFileSync(out+'/'+name+'.png',Buffer.from(r.data,'base64'));}
 async function size(c,width,height){await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await delay(150);}
 const shadow="document.querySelector('leraarbob-topbar').shadowRoot";
 try{
  const c=await open(info,{remote});await c.wait('!!window.Wortelbouw && !!document.querySelector("leraarbob-topbar")');await size(c,1366,768);
  assert.equal(await c.eval('Wortelbouw.inspect().state.phase'),'won');await c.wait(shadow+".querySelector('.progress-value').textContent==='1/14 levels'");await c.wait('!document.getElementById("speechBubble").hidden');
  assert.match(await c.eval('document.getElementById("speechText").textContent'),/104/);
  assert.equal(await c.eval(shadow+".querySelector('.account span').textContent"),'Leerling B');
  assert.equal(await c.eval('document.getElementById("gameShell").getBoundingClientRect().top>=document.getElementById("topbar").getBoundingClientRect().bottom'),true);await shot(c,'solo-feedback');
  await c.wait("document.getElementById('compactGoalValue').textContent==='√104'");
  assert.equal(await c.eval(shadow+".querySelector('[part=crumb-current]')===null"),true);
  await c.eval(shadow+".querySelector('[part=crumb-link]').click()");assert.equal(await c.eval('document.getElementById("progressDialog").open'),true);await c.eval('document.getElementById("closeProgress").click()');
  const before=await c.eval('JSON.stringify(Wortelbouw.inspect().state)');await c.eval(shadow+".querySelector('.collapse').click()");await delay(150);
  assert.equal(await c.eval('JSON.stringify(Wortelbouw.inspect().state)'),before);
  assert.equal(await c.eval('document.getElementById("topbar").getBoundingClientRect().height'),0);
  await c.wait("window.AxiomaSocial?.state().connected");
  for(const [width,height] of [[1366,768],[780,360],[390,844],[320,568]]){
   await size(c,width,height);await c.eval('LeraarBobTopbar.setCollapsed(false)');await delay(100);
   assert.equal(await c.eval("document.getElementById('axioma-social-dock').shadowRoot.querySelectorAll('button').length"),0);
   await c.eval(shadow+".querySelector('.menu').click()");
   assert.match(await c.eval(shadow+".querySelector('.social-entry').textContent"),/Samen spelen/);
   await c.eval(shadow+".querySelector('.social-entry').click()");await c.wait("document.getElementById('axioma-social-panel').shadowRoot.querySelector('#panel').matches(':popover-open')");
   const before=await c.eval('JSON.stringify(Wortelbouw.inspect().state)');
   await c.eval('LeraarBobTopbar.setCollapsed(true)');await delay(100);
   assert.equal(await c.eval("document.getElementById('axioma-social-dock').parentElement===document.body"),true);
   assert.equal(await c.eval("document.getElementById('axioma-social-panel').shadowRoot.querySelector('#panel').matches(':popover-open')"),false);
   const point=await c.eval("(()=>{const e=document.querySelector('.lb-restore'),r=e.getBoundingClientRect();if(!e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)))throw Error('Restore covered');return {x:r.x+r.width/2,y:r.y+r.height/2};})()");
   await c.send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});await delay(100);
   assert.equal(await c.eval("document.body.classList.contains('topbar-collapsed')"),false);
   assert.equal(await c.eval("document.querySelector('.lb-header #axioma-social-dock')===null"),true);
   assert.equal(await c.eval('JSON.stringify(Wortelbouw.inspect().state)'),before);
  }
  await size(c,1366,768);await c.eval('LeraarBobTopbar.setCollapsed(true)');await delay(100);
  console.log('PASS online players open from the menu only; no header/playfield indicator; popover closes and restore stays clickable at four sizes without changing the puzzle');

  await c.eval('document.getElementById("previousCompact").click()');assert.equal(await c.eval('document.getElementById("topbar").classList.contains("lb-collapsed")'),true);
  await c.wait("document.getElementById('compactGoalValue').textContent==='√6'");await c.eval('AxiomaGame.flush()');await c.wait("AxiomaGame.status==='saved'");assert(await c.eval("testWrites.every(w=>w.args.p_game_id==='wortelbouw'&&w.args.p_user_id==='learner-b')"));
  console.log('PASS central learner snapshot restores the construction; navigation saves under the same account; collapse preserves the game and persists between puzzles');
  await c.eval('document.querySelector(".lb-restore").click()');await c.eval(shadow+".querySelector('.menu').click()");assert.match(await c.eval(shadow+".querySelector('[data-source=proLevels] .menu-description').textContent"),/1\/14 afgerond/);await c.eval(shadow+".querySelector('[data-source=proLevels]').click()");assert.equal(await c.eval('document.getElementById("progressDialog").open'),true);await c.eval('document.getElementById("closeProgress").click()');
  for(const [width,height] of [[780,360],[390,844]]){
   await size(c,width,height);assert.equal(await c.eval('document.documentElement.scrollWidth<=innerWidth'),true);
   assert.equal(await c.eval(shadow+".querySelector('.account').getBoundingClientRect().height>=44"),true);
   await shot(c,'navigation-'+width);assert.equal(await c.eval(shadow+".querySelector('.crumbs').scrollWidth<="+shadow+".querySelector('.crumbs').clientWidth"),true);await c.eval(shadow+".querySelector('.menu').click()");await shot(c,'menu-'+width);await c.eval(shadow+".querySelector('.close').click()");
  }
  // Hit-test the real controls: a programmatic click on a hidden original is not sufficient.
  async function clickVisible(client,id){
   const p=await client.eval(`(()=>{const e=document.getElementById(${JSON.stringify(id)}),r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height,hit:e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}})()`);
   assert(p.w>=44&&p.h>=44&&p.hit,id+' is visible and touch-sized');
   await client.send('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,button:'left',clickCount:1});
   await client.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,button:'left',clickCount:1});
  }
  for(const [width,height] of [[1366,768],[780,360]]){
   await size(c,width,height);
   for(const collapsed of [false,true]){
    await c.eval('LeraarBobTopbar.setCollapsed('+collapsed+')');await delay(160);
    const level=await c.eval('Wortelbouw.inspect().state.level');
    await clickVisible(c,'nextCompact');assert.equal(await c.eval('Wortelbouw.inspect().state.level'),(level+1)%14);
    await clickVisible(c,'previousCompact');assert.equal(await c.eval('Wortelbouw.inspect().state.level'),level);
    assert.equal(await c.eval('document.body.classList.contains("topbar-collapsed")'),collapsed);
    assert.equal(await c.eval('document.getElementById("gameShell").getBoundingClientRect().top>=document.getElementById("puzzleBar").getBoundingClientRect().bottom'),true);
    assert.equal(await c.eval('document.querySelector("#topbar .lb-gamebar").getBoundingClientRect().height'),0,'no duplicate game header');
    assert.equal(await c.eval('(()=>{const b=document.getElementById("puzzleBar").getBoundingClientRect(),i=document.getElementById("instruction").getBoundingClientRect();return i.top>=b.top&&i.bottom<=b.bottom})()'),true,'instruction fits inside exercise row');
    assert.equal(await c.eval('(()=>{const g=document.getElementById("compactGoalReminder").getBoundingClientRect();return g.width>0&&g.height>0})()'),true,'goal remains visible even when folded');
    await shot(c,'exercise-controls-'+width+'-'+(collapsed?'folded':'open'));
   }
  }
  console.log('PASS visible previous/next on desktop and landscape with either header state');
  const guest=await open(info,{account:null});await guest.wait('!!document.querySelector("leraarbob-topbar")');await size(guest,390,844);
  const url=await guest.eval('location.href');await guest.eval(shadow+".querySelector('.account').click()");await guest.wait('!!document.getElementById("centralAuthForm")');assert.equal(await guest.eval('location.href'),url);assert.equal(await guest.eval('document.getElementById("authOverlay").open'),true);await shot(guest,'central-login-phone');await guest.eval('document.getElementById("authClose").click()');
  await size(guest,780,360);await guest.eval('LeraarBobTopbar.setCollapsed(true)');
  await guest.send('Page.addScriptToEvaluateOnNewDocument',{source:'window.testFixture={game:"wortelbouw",account:null};'});
  await guest.send('Page.reload');await guest.wait('!!window.Wortelbouw');await delay(200);
  assert.equal(await guest.eval('document.body.classList.contains("topbar-collapsed")'),true);await clickVisible(guest,'nextCompact');await clickVisible(guest,'previousCompact');
  console.log('PASS shared menu, 44px controls and central login remain on the game page on phone and landscape screens');
  const battle=await open({...info,href:info.href.replace('index.html','battle.html'),battle:true},{account:null});await battle.wait('!!document.querySelector("leraarbob-topbar")');await size(battle,1366,768);await battle.eval('document.getElementById("startBattleButton").click()');await battle.wait('WortelbouwBattle.inspect().roundLive');
  for(const [width,height] of [[1366,768],[780,360]]){await size(battle,width,height);assert.equal(await battle.eval('document.getElementById("battleStage").getBoundingClientRect().top>=document.getElementById("battleTopbar").getBoundingClientRect().bottom'),true);await shot(battle,'battle-'+width);}
  const state=await battle.eval('JSON.stringify(WortelbouwBattle.inspect().players)');await battle.eval(shadow+".querySelector('.collapse').click()");await delay(100);assert.equal(await battle.eval('WortelbouwBattle.inspect().scores.join()'),'0,0');assert.equal(await battle.eval('document.getElementById("battleTopbar").getBoundingClientRect().height'),0);
  // Place a field close to the lower edge in each arena, then check its fitted bounds.
  for(const [width,height] of [[1366,768],[780,360]]){
   await size(battle,width,height);
   for(const collapsed of [false,true]){
    await battle.eval('LeraarBobTopbar.setCollapsed('+collapsed+')');await delay(200);
    for(const id of ['battleCanvas1','battleCanvas2']){
     const i=id.endsWith('1')?0:1;await battle.eval('document.getElementById("undo'+(i+1)+'").click()');
     const r=await battle.eval(`(()=>{const r=document.getElementById('${id}').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()`);
     const start={x:r.x+r.w*.55,y:r.y+r.h*.7},end={x:start.x+30,y:start.y+30};
     await battle.send('Input.dispatchMouseEvent',{type:'mousePressed',...start,button:'left',clickCount:1});
     await battle.send('Input.dispatchMouseEvent',{type:'mouseMoved',...end,button:'left',buttons:1});
     await battle.send('Input.dispatchMouseEvent',{type:'mouseReleased',...end,button:'left',clickCount:1});
     const a=await battle.eval('WortelbouwBattle.inspect().players['+i+']');assert.equal(a.objects,1);
     assert(Math.abs(a.viewport.height-r.h)<1&&Math.abs(a.viewport.width-r.w)<1,'canvas tracks available size');
     const b=a.bounds,cam=a.camera,cx=cam.x+(b.minX+b.maxX)/2*cam.unit,cy=cam.y-(b.minY+b.maxY)/2*cam.unit;
     assert(Math.abs(cx-r.w/2)<1&&Math.abs(cy-r.h/2)<1,'first field is centered');
     assert(cam.y-b.maxY*cam.unit>=0&&cam.y-b.minY*cam.unit<=r.h,'field fits vertically');
    }
    await shot(battle,'battle-placement-'+width+'-'+(collapsed?'folded':'open'));
   }
  }
  console.log('PASS battle starts with two boards below the shared navigation; folding retains scores');
  for(const client of clients)assert.deepEqual(client.errors,[]);
 }finally{for(const context of contexts)await browser.send('Target.disposeBrowserContext',{browserContextId:context});for(const client of clients)client.ws.close();browser.ws.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
