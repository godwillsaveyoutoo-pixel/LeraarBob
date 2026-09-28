// Real Gravity Maze UI and engine in an isolated guest context; no external services.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const PORT=process.env.VECTOR_BROWSER_PORT||9245,BASE=process.env.VECTOR_BASE_URL||'http://127.0.0.1:8775';
const OUT=path.resolve(__dirname,'../docs/multiplayer/screenshots');fs.mkdirSync(OUT,{recursive:true});
class CDP{
 async connect(url){this.ws=new WebSocket(url);this.id=0;this.pending=new Map();this.errors=[];await new Promise(r=>this.ws.onopen=r);this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);if(!p)return;clearTimeout(p.timer);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(m.method==='Page.loadEventFired')this.loads=(this.loads||0)+1;else if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails);else if(m.method==='Fetch.requestPaused')this.route(m.params).catch(e=>this.errors.push(e.message));};}
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
 const {browserContextId}=await browser.send('Target.createBrowserContext');const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});const pages=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json(),c=new CDP();await c.connect(pages.find(t=>t.id===targetId).webSocketDebuggerUrl);
 try{
  await c.send('Page.enable');await c.send('Runtime.enable');c.route=async p=>{const u=new URL(p.request.url);if(u.hostname!=='127.0.0.1')return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'});return c.send('Fetch.continueRequest',{requestId:p.requestId});};await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  await c.size(1366,768);await c.send('Page.navigate',{url:BASE+'/games/rechten/rechtenwereld/battle.html'});await c.wait("document.getElementById('startBattle')&&!document.getElementById('startBattle').disabled");
  await c.eval("document.getElementById('world').value='puntenbaai';document.getElementById('world').dispatchEvent(new Event('change'));document.getElementById('skill').value='point';document.getElementById('battleForm').requestSubmit()");await c.wait('window.VectorBattle?.inspect().active');
  for(const [width,height] of [[1366,768],[954,441],[640,360],[390,844],[320,568]]){await c.size(width,height);for(const folded of [false,true]){
   await c.eval('LeraarBobTopbar.setCollapsed('+folded+')');await c.frames();
   const issues=await c.eval(`(()=>{const out=[];for(const id of ['pane0','pane1']){const f=document.getElementById(id),r=f.getBoundingClientRect(),w=f.contentWindow,d=w.document;if(r.right>innerWidth+1||r.bottom>innerHeight+1||r.height<140)out.push(id+' outer '+JSON.stringify({x:r.x,y:r.y,width:r.width,height:r.height,screen:[innerWidth,innerHeight]}));if(d.documentElement.scrollWidth>w.innerWidth)out.push(id+' inner overflow');const b=d.getElementById('commit').getBoundingClientRect();if(b.right>w.innerWidth||b.bottom>w.innerHeight)out.push(id+' commit');}return out;})()`);assert.deepEqual(issues,[],width+' folded='+folded);await c.shot('rechten-duo-'+width+(folded?'-folded':''));
  }}
  const originalRound=await c.eval('VectorBattle.inspect()');
  for(const [width,height] of [[390,844],[640,360]]){
   await c.size(width,height);await c.eval('LeraarBobTopbar.setCollapsed(true)');await c.frames();
   const skills=await c.eval('BattleGame.skills.map(s=>s.id)');
   for(const skill of skills){
    await c.eval(`document.getElementById('pane0').contentWindow.postMessage(${JSON.stringify({type:'vector-battle-question',match:originalRound.match,index:originalRound.index,skill,seed:17,variant:2})},location.origin)`);await c.frames();
    const issues=await c.eval(`(()=>{const w=document.getElementById('pane0').contentWindow,d=w.document,b=d.getElementById('commit')?.getBoundingClientRect();return {overflow:d.documentElement.scrollWidth>w.innerWidth,commit:!!b&&b.width>=44&&b.height>=44&&b.right<=w.innerWidth+1&&b.bottom<=w.innerHeight+1};})()`);
    assert(!issues.overflow&&issues.commit,skill+' '+width+': '+JSON.stringify(issues));
   }
  }
  await c.eval(`document.getElementById('pane0').contentWindow.postMessage(${JSON.stringify({type:'vector-battle-question',match:originalRound.match,index:originalRound.index,...originalRound.deck[originalRound.index]})},location.origin)`);await c.frames();
  await c.eval(`(()=>{const w=document.getElementById('pane0').contentWindow,m=w.RechtenV2Runtime.active(w.RechtenV2App.snapshot()),i=m.task.options.findIndex(p=>w.RechtenWave.eq(p.x,m.task.target.x)&&w.RechtenWave.eq(p.y,m.task.target.y));w.document.querySelector('[data-choice="answer"][data-value="'+i+'"]').click();w.document.getElementById('mission').requestSubmit();})()`);
  await c.wait('VectorBattle.inspect().resolved');assert.deepEqual(await c.eval('VectorBattle.inspect().scores'),[1,0]);await c.click('#nextRound');assert.equal(await c.eval('VectorBattle.inspect().index'),1);console.log('PASS Rechten duo: five sizes, both header states, native answer wins one point, manual next round');
  await c.send('Page.navigate',{url:BASE+'/games/wortelbouw_pro_v0.5.0/wortelbouw/battle.html'});await c.wait("window.WortelbouwBattle&&document.getElementById('battleSetup').open");await c.eval("document.getElementById('startBattleButton').click()");await c.wait('WortelbouwBattle.inspect().roundLive');
  for(const [width,height] of [[1366,768],[954,441],[640,360],[390,844],[320,568]]){await c.size(width,height);for(const folded of [false,true]){await c.eval('LeraarBobTopbar.setCollapsed('+folded+')');await c.frames();
   const issues=await c.eval(`(()=>{const out=[];for(const id of ['battleCanvas1','battleCanvas2','undo1','undo2']){const e=document.getElementById(id),r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(r.width<44||r.height<44||r.right>innerWidth+1||r.bottom>innerHeight+1||!e.contains(hit))out.push(id);}return out;})()`);assert.deepEqual(issues,[],width+' folded='+folded);await c.shot('wortelbouw-duo-'+width+(folded?'-folded':''));
  }}
  console.log('PASS Wortelbouw duo: both workboards and undo reachable in landscape and portrait');assert.deepEqual(c.errors,[]);
 }finally{await browser.send('Target.disposeBrowserContext',{browserContextId});c.ws.close();browser.ws.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
