// Actual standalone document and browser input, isolated storage; no backend needed.
const fs=require('node:fs'),assert=require('node:assert/strict');
class CDP{
 async connect(url){this.ws=new WebSocket(url);this.id=0;this.pending=new Map();this.errors=[];await new Promise(r=>this.ws.onopen=r);this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails)}}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
 async wait(expr){for(let i=0;i<100;i++){if(await this.eval(expr))return;await new Promise(r=>setTimeout(r,30))}throw Error('Timeout '+expr)}
}
const {levels,routes}=require('./verfwinkel-curriculum.test.cjs');
(async()=>{
 const version=await(await fetch('http://127.0.0.1:9235/json/version')).json(),browser=new CDP();await browser.connect(version.webSocketDebuggerUrl);
 const {browserContextId}=await browser.send('Target.createBrowserContext'),{targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});
 const tabs=await(await fetch('http://127.0.0.1:9235/json')).json(),c=new CDP();await c.connect(tabs.find(t=>t.id===targetId).webSocketDebuggerUrl);
 try{
 await c.send('Runtime.enable');await c.send('Page.enable');await c.send('Network.enable');await c.send('Network.setCacheDisabled',{cacheDisabled:true});
 await c.send('Emulation.setDeviceMetricsOverride',{width:1000,height:700,deviceScaleFactor:1,mobile:false});
 for(let i=0;i<levels.length;i++){
  await c.send('Page.navigate',{url:`http://127.0.0.1:8765/games/verfwinkel.html?qa=1&level=${i+1}&view=math&phase=1`});
  await c.wait(`typeof recipeValid==='function'&&typeof state!=='undefined'&&state.level===${i}`);
  const sequence=routes(levels[i])[0];
  for(let j=0;j<sequence.length;j++){
   const recipe=sequence[j];assert.equal(await c.eval(`recipeValid(${JSON.stringify(recipe)}).ok`),true,`level ${i+1}, order ${j+1}: native engine accepts recipe`);
   if(j<sequence.length-1){const next=levels[i].orders[j+1];assert((await c.eval(`document.getElementById('orderPlan').textContent`)).includes(`${next.vol} l · blauw : geel = ${next.b} : ${next.y}`),'next order visible before pouring');}
   await c.eval(`state.remain=state.remain.map((n,i)=>n-${JSON.stringify(recipe)}[i]);state.order++;if(state.order<L().orders.length)resetOrder()`);
  }
 }
 // The planning notice remains readable in both representations, including compact landscape.
 for(const [width,height] of [[780,360],[1440,900]])for(const view of ['machine','math']){
  await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await c.send('Page.navigate',{url:`http://127.0.0.1:8765/games/verfwinkel.html?qa=1&level=16&view=${view}&phase=1`});await c.wait(`typeof state!=='undefined'&&state.level===15`);
  await new Promise(r=>setTimeout(r,120));
  const layout=await c.eval(`(()=>{const p=document.getElementById('orderPlan'),r=p.getBoundingClientRect();return {text:p.textContent,hidden:p.hidden,top:r.top,bottom:r.bottom,width:r.width,overflow:document.documentElement.scrollWidth>innerWidth}})()`);
  assert.equal(layout.hidden,false);assert.equal(layout.overflow,false);assert(layout.top>=0&&layout.bottom<=height,'visible planning notice');assert.match(layout.text,/minstens 4 l/);
  const covered=await c.eval(`(()=>{const selectors=state.view==='machine'?'.source-step button':'[data-recipe]';return [...document.querySelectorAll(selectors)].filter(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !hit||!el.contains(hit)}).length})()`);assert.equal(covered,0,view+' controls are visible and clickable');
  const shot=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`/tmp/verfwinkel-${view}-${width}.png`,Buffer.from(shot.data,'base64'));
 }
 assert.deepEqual(c.errors,[]);console.log('PASS: all revised Verfwinkel recipes accepted by native game; next orders and reserves visible on compact and desktop layouts');
 }finally{await browser.send('Target.disposeBrowserContext',{browserContextId});c.ws.close();browser.ws.close()}
})().catch(e=>{console.error(e);process.exit(1)});
