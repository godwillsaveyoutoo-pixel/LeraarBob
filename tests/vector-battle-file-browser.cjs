// Real Chromium pointer/touch verification, isolated guest context, no external requests.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const Core=require('../games/vectoren/vector-core.js'),M=Core.VectorMath;
const PORT=process.env.VECTOR_BROWSER_PORT||9245,BASE=process.env.VECTOR_BASE_URL||'http://127.0.0.1:8775';
const OUT=path.resolve(__dirname,'../docs/vectoren-v04/screenshots/battle');fs.mkdirSync(OUT,{recursive:true});
class CDP{
 async connect(url){this.ws=new WebSocket(url);this.id=0;this.pending=new Map();this.errors=[];this.contexts=new Map();this.logs=[];await new Promise(r=>this.ws.onopen=r);this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);if(!p)return;clearTimeout(p.timer);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(m.method==='Runtime.executionContextCreated')this.contexts.set(m.params.context.id,m.params.context);else if(m.method==='Runtime.executionContextDestroyed')this.contexts.delete(m.params.executionContextId);else if(m.method==='Runtime.executionContextsCleared')this.contexts.clear();else if(m.method==='Log.entryAdded')this.logs.push(m.params.entry);else if(m.method==='Page.loadEventFired')this.loads=(this.loads||0)+1;else if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails);else if(m.method==='Fetch.requestPaused')this.route(m.params).catch(e=>this.errors.push(e.message));};}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id,timer=setTimeout(()=>reject(Error('Timeout '+method)),15000);this.pending.set(id,{resolve,reject,timer});this.ws.send(JSON.stringify({id,method,params}))})}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
 async wait(expr){for(let i=0;i<150;i++){if(await this.eval(expr))return;await new Promise(r=>setTimeout(r,30))}throw Error('Timeout '+expr)}
 async frames(){await this.eval('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')}
 async click(selector,touch=false){const p=await this.eval(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect();if(!r.width||!r.height)throw Error('hidden ${selector}');return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await this.tap(p,touch);await this.frames()}
 async tap(p,touch=false){if(touch){await this.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await this.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}else{await this.send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await this.send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1})}}
 async size(width,height){await this.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await this.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});await this.frames()}
 async shot(name){await this.frames();const r=await this.send('Page.captureScreenshot',{captureBeyondViewport:false});fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from(r.data,'base64'))}
}
(async()=>{
 const version=await(await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(),browser=new CDP();await browser.connect(version.webSocketDebuggerUrl);
 const {browserContextId}=await browser.send('Target.createBrowserContext'),{targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});
 const tabs=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json(),c=new CDP();await c.connect(tabs.find(t=>t.id===targetId).webSocketDebuggerUrl);
 const checks=[],check=s=>{checks.push(s);console.log('PASS '+s)},requests=[];
 try{
 await c.send('Page.enable');await c.send('Runtime.enable');await c.send('Network.enable');await c.send('Network.setCacheDisabled',{cacheDisabled:true});
 c.route=async p=>{requests.push(p.request.url);const u=new URL(p.request.url);if(u.protocol!=='file:'&&u.hostname!=='127.0.0.1')return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'});return c.send('Fetch.continueRequest',{requestId:p.requestId});};await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 await c.send('Log.enable');await c.size(1366,768);
 const file=require('node:url').pathToFileURL(path.resolve(__dirname,'../games/vectoren/battle.html')).href;
 await c.send('Page.navigate',{url:file});await c.wait('!!window.VectorBattle&&!document.getElementById("startBattle").disabled');check('file battle loads both isolated panes');
 const frameTree=(await c.send('Page.getFrameTree')).frameTree;
 const children=frameTree.childFrames.map(x=>x.frame.id);
 async function pane(i,expression){const context=[...c.contexts.values()].find(x=>x.auxData?.frameId===children[i]&&x.auxData?.isDefault);assert(context,'frame context '+i);const r=await c.send('Runtime.evaluate',{expression,contextId:context.id,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
 await c.eval("document.getElementById('world').value='stuwkrachtlab';document.getElementById('world').dispatchEvent(new Event('change'));document.getElementById('skill').value='scalar';document.getElementById('startBattle').click()");await c.wait('VectorBattle.inspect().active');await c.frames();
 for(let i=0;i<2;i++)assert(await pane(i,'!!AxiomaVectorTrainer.inspect().task'));
 assert.deepEqual(await pane(0,'AxiomaVectorTrainer.inspect().task'),await pane(1,'AxiomaVectorTrainer.inspect().task'));
 // Unrelated windows and wrong origins cannot end a round.
 await c.eval("window.dispatchEvent(new MessageEvent('message',{source:window,origin:'null',data:{type:'vector-battle-answer',...VectorBattle.inspect(),skipped:true}}))");assert.equal((await c.eval('VectorBattle.inspect()')).resolved,false);
 await pane(0,"(()=>{const t=AxiomaVectorTrainer.inspect().task,M=VectorTrainerCore.VectorMath;VectorBattlePlayer.submit({strokes:[M.stroke(t.start,M.endPointFromVector(t.start,t.target))]},false)})()");await c.wait('VectorBattle.inspect().resolved');assert.deepEqual((await c.eval('VectorBattle.inspect()')).scores,[1,0]);
 assert(await pane(1,'AxiomaVectorTrainer.inspect().done'));check('file mode accepts correct answers and freezes both panes');
 await c.click('#nextRound');await c.frames();assert.equal((await c.eval('VectorBattle.inspect()')).index,1);assert.equal(await pane(0,'AxiomaVectorTrainer.inspect().done'),false);check('next round starts in both local panes');
 await c.shot('file-play-1366');
 await c.click('#stopBattle');await c.click('#confirmStop');
 for(const [w,h] of [[390,844],[320,568],[844,390]]){
  await c.size(w,h);await c.eval("document.getElementById('startBattle').scrollIntoView({block:'center'})");
  assert(await c.eval("document.documentElement.scrollWidth<=innerWidth"),'no sideways overflow '+w);
  assert(await c.eval("(()=>{const r=document.getElementById('startBattle').getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&r.y>=0})()"));await c.shot('file-setup-'+w);
 }
 check('phone setup scrolls to all controls without horizontal overflow');
 const missing=c.logs.filter(x=>/ERR_FILE_NOT_FOUND|postMessage|autofocus/i.test(x.text));assert.deepEqual(missing,[]);assert.deepEqual(c.errors,[]);
 assert(!requests.some(u=>/styles\/assets/.test(u)));check('file mode has no missing sky, autofocus or messaging errors');
 fs.writeFileSync(path.resolve(OUT,'../../battle-file-report.json'),JSON.stringify({passed:true,checks,logs:c.logs},null,2));
 }finally{if(c.errors.length)console.error(c.errors);await browser.send('Target.disposeBrowserContext',{browserContextId});c.ws.close();browser.ws.close();}
})().catch(e=>{console.error(e);process.exit(1)});
