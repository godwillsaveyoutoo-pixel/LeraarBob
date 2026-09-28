// Real touch/mouse/keyboard events in a fresh browser context. No account or cloud writes.
const assert=require('node:assert/strict'),fs=require('node:fs');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
class CDP{
  async connect(url){this.ws=new WebSocket(url);this.id=0;this.pending=new Map();this.errors=[];await new Promise(r=>this.ws.onopen=r);this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else{if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails);this.event?.(m)}}}
  send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}
  async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
  async wait(expression){for(let i=0;i<100;i++){if(await this.eval(expression))return;await delay(50)}throw Error('Timeout: '+expression)}
}
const routes=require('./fixtures/wortelbouw-routes.cjs');
(async()=>{
  const browser=new CDP();await browser.connect((await(await fetch('http://127.0.0.1:9235/json/version')).json()).webSocketDebuggerUrl);
  const {browserContextId}=await browser.send('Target.createBrowserContext');
  const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});
  const tab=(await(await fetch('http://127.0.0.1:9235/json')).json()).find(t=>t.id===targetId);
  const c=new CDP();await c.connect(tab.webSocketDebuggerUrl);await c.send('Page.enable');await c.send('Runtime.enable');
  c.event=m=>{if(m.method==='Fetch.requestPaused'){const auth=m.params.request.url.endsWith('/axioma-auth.js');c.send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(auth?'window.AxiomaAuth={ready:async()=>null,getAccount:async()=>null,onChange:()=>()=>{}};':'').toString('base64')})}};
  await c.send('Fetch.enable',{patterns:[{urlPattern:'*axioma-auth.js'},{urlPattern:'*axioma-social.js'}]});
  // A fresh guest save for each complete campaign run; persistence is tested separately.
  await c.send('Page.addScriptToEvaluateOnNewDocument',{source:'localStorage.clear();'});
  // Capture actual text submitted to canvas, including labels absent from the DOM.
  await c.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.drawnText=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(t,...args){drawnText.push(String(t));return original.call(this,t,...args)};`});
  const inspect=()=>c.eval('Wortelbouw.inspect()');
  async function tap(selector,touch=true){
    await c.eval("new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))");
    const p=await c.eval(`(()=>{const b=document.querySelector(${JSON.stringify(selector)});if(!b||b.disabled)throw Error('Unavailable '+${JSON.stringify(selector)});const r=b.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2,width:r.width,height:r.height}})()`);
    assert(p.width>=44&&p.height>=44,'semantic touch target >=44 px: '+selector);
    if(touch){await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
    else for(const type of ['mousePressed','mouseReleased'])await c.send('Input.dispatchMouseEvent',{type,x:p.x,y:p.y,button:'left',clickCount:1});
  }
  async function measure(k){
    if(await c.eval(`document.querySelector('#extendedRuler').getClientRects().length>0&&!document.querySelector('#extendedRuler').hidden`)){
      await tap('#longMeasure');await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Home',code:'Home',windowsVirtualKeyCode:36});
      for(let i=1;i<k;i++)await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});
      await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
    }else await tap(`[data-length="${k}"]`);
  }
  async function shot(name){if(['won','routeDone'].includes((await inspect()).state.phase))await c.wait(`getComputedStyle(document.querySelector('#success')).opacity==='1'`);const r=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`/tmp/wortelbouw-${name}.png`,Buffer.from(r.data,'base64'))}
  async function fits(){
    assert(await c.eval('document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight'),'no scrolling');
    assert(await c.eval(`[...document.querySelectorAll('button:not([hidden])')].filter(b=>b.getClientRects().length).every(b=>{const r=b.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth+.5&&r.bottom<=innerHeight+.5})`),'all controls inside the viewport');
    assert(await c.eval(`(()=>{const r=[...document.querySelectorAll('footer button')].filter(b=>b.getClientRects().length).map(b=>b.getBoundingClientRect());return r.every((a,i)=>r.slice(i+1).every(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)<=0||Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)<=0))})()`),'footer controls do not overlap');
    assert(await c.eval(`(()=>{const d=Wortelbouw.inspect(),r=document.querySelector('#stage').getBoundingClientRect();return d.state.objects.flatMap(o=>o.points).every(p=>{const x=d.camera.x+p.x*d.camera.unit,y=d.camera.y-p.y*d.camera.unit;return x>=0&&y>=0&&x<=r.width&&y<=r.height})})()`),'camera contains every placed piece');
  }
  async function victory(){
    assert.equal(await c.eval(`document.querySelector('#success').hidden`),false,'goal is visibly celebrated');
    if((await inspect()).state.solutions.length===2)assert(await c.eval(`document.querySelector('#routeComparison').textContent.includes('5 + 1 = 6')&&document.querySelector('#routeComparison').textContent.includes('10 − 4 = 6')`));
    assert.equal(await c.eval(`document.querySelector('#successRoot').textContent`),await c.eval(`(()=>{const l=WortelbouwGeometry.levels[Wortelbouw.inspect().state.level];return l.kind==='area'?'A = '+l.n:WortelbouwGeometry.goalLabel(l)})()`));
    assert(await c.eval(`(()=>{const d=Wortelbouw.inspect(),t=d.state.objects.filter(o=>o.type==='triangle').at(-1),e=t.result,b=document.querySelector('#cordLabel');return Math.abs(parseFloat(b.style.left)-(d.camera.x+(e.a.x+e.b.x)/2*d.camera.unit))<.1&&Math.abs(parseFloat(b.style.top)-(d.camera.y-(e.a.y+e.b.y)/2*d.camera.unit))<.1&&b.style.transform.includes('rotate(')})()`),'root is centered on its own edge');
    assert(await c.eval(`(()=>{const a=document.querySelector('#success').getBoundingClientRect(),b=document.querySelector('#stage').getBoundingClientRect();return a.top>=b.top&&a.bottom<=b.bottom&&a.right<=b.right})()`),'celebration stays within floor');
  }
  async function nextRoute(width,touch){
    assert.equal((await inspect()).state.phase,'routeDone');assert.equal((await inspect()).state.solutions.length,1);
    await victory();await fits();await shot(`${width}-first-route`);
    assert.equal(await c.eval(`document.querySelector('#routeComparison').children.length`),2);
    await tap('#continue',touch);assert.equal((await inspect()).state.phase,'start');assert.equal((await inspect()).state.solutions.length,1);
    assert.equal(await c.eval(`document.querySelector('#success').hidden`),true);
    assert(await c.eval(`document.querySelector('#lessonHint').textContent.includes('aftrekken')`));
  }
  async function drag(points,touch=true,cancel=false){
    const first=points[0];
    if(touch)await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first]});
    else await c.send('Input.dispatchMouseEvent',{type:'mousePressed',...first,button:'left',clickCount:1});
    const sampled=[];
    for(let i=1;i<points.length;i++)for(let n=1;n<=8;n++)sampled.push({x:points[i-1].x+(points[i].x-points[i-1].x)*n/8,y:points[i-1].y+(points[i].y-points[i-1].y)*n/8});
    for(const p of sampled){
      await delay(16);
      if(touch)await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[p]});
      else await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...p,button:'left',buttons:1});
    }
    await delay(80);
    if(touch)await c.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});
    else await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',...points.at(-1),button:'left',clickCount:1});
  }
  async function gesturePoints(expression){return c.eval(`(()=>{const d=Wortelbouw.inspect(),s=d.state,G=WortelbouwGeometry,r=document.querySelector('#stage').getBoundingClientRect();return (${expression}).map(p=>({x:r.x+d.camera.x+p.x*d.camera.unit,y:r.y+d.camera.y-p.y*d.camera.unit}))})()`)}
  for(const width of [780,640]){
    await c.send('Emulation.setDeviceMetricsOverride',{width,height:360,deviceScaleFactor:1,mobile:true});await c.send('Emulation.setTouchEmulationEnabled',{enabled:true});
    await c.send('Page.navigate',{url:'http://127.0.0.1:8765/games/wortelbouw/'});await c.wait('!!window.Wortelbouw');
    assert.equal((await inspect()).manual,true);assert.equal(await c.eval('document.querySelectorAll("#targets button").length'),0);
    const touch=width===640;
    await fits();await shot(`${width}-manual-start`);
    const canceled=await gesturePoints('[{x:0,y:0},{x:3,y:3}]');await drag(canceled,true,true);assert.equal((await inspect()).state.phase,'start');
    for(let level=0;level<routes.length;level++){
      const scenario=routes[level];
      for(const route of scenario.other?[scenario,scenario.other]:[scenario]){
      await drag(await gesturePoints(`[{x:0,y:0},{x:${route.start},y:${route.start}}]`),touch);
      assert.equal((await inspect()).state.objects[0].area,route.start**2);
      for(const [index,[mode,k,edgeIndex]] of route.steps.entries()){
        await tap(`[data-mode="${mode}"]`,touch);
        const points=await gesturePoints(`(()=>{const p=G.plan(s,s.active,${edgeIndex},${k},${JSON.stringify(mode)},false),e=p.triangle.base;return [G.add(e.a,G.mul(G.sub(e.b,e.a),.08)),p.triangle.helper.b]})()`);
        await c.eval('drawnText=[]');await drag(points,touch);
        assert.equal((await inspect()).state.phase,'helper',`manual triangle ${width}/${level}/${index}`);
        await fits();if(level===0)await shot(`${width}-manual-triangle`);
        const squarePoints=async()=>gesturePoints(`(()=>{const e=s.pending.triangle[s.phase],mid=G.mul(G.add(e.a,e.b),.5),center=G.center(s.pending[s.phase].points);return [mid,G.add(mid,G.mul(G.sub(center,mid),1.8))]})()`);
        await drag(await squarePoints(),touch);assert.equal((await inspect()).state.phase,'result');
        assert.equal(await c.eval(`drawnText.includes('√'+Wortelbouw.inspect().state.pending.result.area)`),false,'manual result stays hidden');
        await drag(await squarePoints(),touch);await c.wait(`!['result','reveal'].includes(Wortelbouw.inspect().state.phase)`);
        if(level===0){await tap('#undo',touch);await c.wait(`Wortelbouw.inspect().state.phase==='result'`);assert.equal((await inspect()).state.phase,'result');await drag(await squarePoints(),touch);await c.wait(`Wortelbouw.inspect().state.phase==='won'`)}
      }
      if(route.other)await nextRoute(width,touch);
      }
      assert.equal((await inspect()).state.phase,'won');await victory();await fits();await shot(`${width}-manual-puzzle-${level+1}`);
      console.log(`PASS manual ${touch?'touch':'mouse'} ${width}×360: puzzle ${level+1}`);
      if(level<routes.length-1)await tap('#continue',touch);
    }
  }
  for(const width of [780,640]){
    await c.send('Emulation.setDeviceMetricsOverride',{width,height:360,deviceScaleFactor:1,mobile:true});await c.send('Emulation.setTouchEmulationEnabled',{enabled:true});
    await c.send('Page.navigate',{url:'http://127.0.0.1:8765/games/wortelbouw/'});await c.wait('!!window.Wortelbouw');await tap('#manual');
    await fits();await shot(`${width}-start`);
    for(let level=0;level<routes.length;level++){
      const scenario=routes[level];
      for(const route of scenario.other?[scenario,scenario.other]:[scenario]){
      assert.equal((await inspect()).state.level,level);
      await measure(route.start);await tap('[data-target="start"]');
      for(const [index,[mode,k,edgeIndex]] of route.steps.entries()){
        await tap(`[data-mode="${mode}"]`);await measure(k);await tap(`[data-target="edge-${edgeIndex}"]`);
        assert((await inspect()).preview?.valid,'preview physically fits');await fits();
        if(level===0&&index===0){await shot(`${width}-triangle`);await tap('#flip');assert.equal((await inspect()).flip,true);await tap('#flip')}
        await c.eval('drawnText=[]');await tap('[data-target="triangle"]');assert.equal((await inspect()).state.phase,'helper');
        assert.equal(await c.eval(`drawnText.some(t=>t==='√'+Wortelbouw.inspect().state.pending.result.area)`),false,'result hidden after triangle');
        await tap('[data-target="helper"]');assert.equal((await inspect()).state.phase,'result');
        if(level===1)await shot(`${width}-before-reveal`);
        assert.equal(await c.eval(`drawnText.some(t=>t==='√'+Wortelbouw.inspect().state.pending.result.area)`),false,'result hidden after helper');
        await tap('[data-target="result"]');await c.wait(`Wortelbouw.inspect().state.phase!=='reveal'`);
        if(level===0){
          // Undo removes the result and hides its exact label again, then re-place.
          await tap('#undo');assert.equal((await inspect()).state.phase,'result');assert.equal(await c.eval(`document.querySelector('#cordLabel').hidden`),true);assert.equal(await c.eval(`document.querySelector('#success').hidden`),true);
          await c.eval('drawnText=[]');await c.send('Emulation.setDeviceMetricsOverride',{width,height:360,deviceScaleFactor:1,mobile:true});
          assert.equal(await c.eval(`drawnText.some(t=>t==='√2')`),false);
          await tap('[data-target="result"]');await c.wait(`Wortelbouw.inspect().state.phase==='won'`);
        }
      }
      if(route.other)await nextRoute(width,true);
      }
      const s=(await inspect()).state;assert.equal(s.phase,'won');assert.equal(s.steps,routes[level].steps.length);
      assert.equal(await c.eval(`document.querySelector('#cordLabel').textContent`),Number.isInteger(Math.sqrt(routes[level].n))?String(Math.sqrt(routes[level].n)):'√'+routes[level].n);
      await fits();await shot(`${width}-puzzle-${level+1}`);
      console.log(`PASS ${width}×360: puzzle ${level+1}, ${s.steps} step(s), all pieces placed through touch`);
      if(level<routes.length-1)await tap('#continue');
    }
  }
  // Undo during the animation must cancel the pending reveal, without stale callbacks.
  await tap('#next');await tap('#restart');await tap('[data-length="1"]');await tap('[data-target="start"]');await tap('[data-length="1"]');await tap('[data-target="edge-0"]');await tap('[data-target="triangle"]');await tap('[data-target="helper"]');await tap('[data-target="result"]');await tap('#undo');
  await delay(800);assert.equal((await inspect()).state.phase,'result');assert.equal(await c.eval(`document.querySelector('#cordLabel').hidden`),true);assert.equal(await c.eval(`document.querySelector('#success').hidden`),true);
  // Keyboard placement, pointer cancellation and rotation preserve the pending construction.
  await c.eval(`document.querySelector('[data-target="result"]').focus()`);
  await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await c.wait(`Wortelbouw.inspect().state.phase==='won'`);
  const snapshot=JSON.stringify((await inspect()).state);
  await c.send('Emulation.setDeviceMetricsOverride',{width:360,height:640,deviceScaleFactor:1,mobile:true});await delay(100);assert.equal(await c.eval(`getComputedStyle(document.querySelector('#rotate')).display`),'flex');await shot('portrait');
  await c.send('Emulation.setDeviceMetricsOverride',{width:640,height:360,deviceScaleFactor:1,mobile:true});await delay(100);assert.equal(JSON.stringify((await inspect()).state),snapshot);await fits();
  // Idle canvas must stop drawing; emulate constrained CPU for a fresh interaction.
  const count=(await inspect()).renderCount;await delay(450);assert.equal((await inspect()).renderCount,count,'no continuous idle rendering');
  await c.send('Emulation.setCPUThrottlingRate',{rate:6});await tap('#restart',false);await tap('[data-target="start"]',false);await tap('[data-length="2"]',false);await tap('[data-target="edge-0"]',false);
  const before=performance.now();await tap('[data-target="triangle"]',false);await c.wait(`Wortelbouw.inspect().state.phase==='helper'`);const elapsed=performance.now()-before;console.log(`6× CPU throttle: triangle touch and render ${Math.round(elapsed)} ms (includes CDP roundtrips)`);assert(elapsed<1500);
  await c.send('Emulation.setCPUThrottlingRate',{rate:1});assert.deepEqual(c.errors,[]);
  await browser.send('Target.disposeBrowserContext',{browserContextId});c.ws.close();browser.ws.close();
  console.log('PASS: reveal gating, every undo phase, keyboard, rotation, viewport fit and idle rendering');
})().then(()=>process.exit(0),e=>{console.error(e);process.exit(1)});
