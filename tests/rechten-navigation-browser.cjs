// Isolated Chromium + localhost only. Test hook is injected into the served document.
const assert=require('node:assert/strict'),fs=require('node:fs');
class CDP{
 async connect(){const tabs=await(await fetch('http://127.0.0.1:9235/json')).json();this.ws=new WebSocket(tabs[0].webSocketDebuggerUrl);this.pending=new Map();this.id=0;this.errors=[];await new Promise(r=>this.ws.onopen=r);this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails);else if(m.method==='Fetch.requestPaused')this.paused?.(m.params)};await this.send('Page.enable');await this.send('Runtime.enable')}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
 run(s){return this.eval('__R.run('+JSON.stringify(s)+')')}
 async wait(expr){for(let i=0;i<100;i++){if(await this.eval(expr))return;await new Promise(r=>setTimeout(r,50))}throw Error('Timeout: '+expr)}
}
(async()=>{
 const c=new CDP();await c.connect();
 const html=fs.readFileSync('games/rechten/trainer/index.html','utf8').replace('updateStart();renderTop();renderSessionCue();renderCloudStatus();initCloudFoundation();','window.__R={run:source=>eval(source)};updateStart();renderTop();renderSessionCue();renderCloudStatus();initCloudFoundation();');
 const mock='window.AxiomaAuth={ready:async()=>({session:null}),getAccount:async()=>null,client:()=>null,onChange:()=>()=>{}};';
 c.paused=p=>{const u=new URL(p.request.url);let body;if(u.pathname.endsWith('/axioma-auth.js'))body=mock;else if(u.hostname!=='127.0.0.1'||u.pathname.endsWith('/axioma-social.js'))body='';else if(u.pathname==='/games/rechten/trainer/')body=html;else return c.send('Fetch.continueRequest',{requestId:p.requestId});return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:u.pathname==='/games/rechten/trainer/'?'text/html':'application/javascript'}],body:Buffer.from(body).toString('base64')})};
 await c.send('Network.enable');await c.send('Network.setCacheDisabled',{cacheDisabled:true});await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 const frames=()=>c.eval('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
 async function click(sel){const p=await c.eval(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.disabled||!e.getClientRects().length)throw Error('Unavailable '+${JSON.stringify(sel)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...p});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...p});await frames()}


 try {
 await c.send('Page.navigate',{url:'http://127.0.0.1:8765/games/rechten/trainer/'});
 await c.wait('window.__R&&document.querySelector("#app").dataset.account==="guest"');
 await c.wait('window.AxiomaGame?.active');
 const visible=sel=>c.eval(`!!document.querySelector(${JSON.stringify(sel)}).getClientRects().length`);
 for(const [width,height] of [[1366,768],[640,360],[390,844]]) {
  await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await c.run("openScreen('journey')");await frames();
  assert(await visible('.brand'));
  assert(!await visible('#trainerMenu'));
  assert.deepEqual(await c.eval(`[...document.querySelectorAll('.topbar button')].filter(b=>b.getClientRects().length).map(b=>b.id)`),['profileBtn','menuBtn']);
  assert(await c.eval(`document.querySelector('#axioma-game-status').shadowRoot.querySelector('.dock').hidden`));
  await click('#menuBtn');
  assert.equal(await c.eval('document.activeElement.id'),'journeyBtn');
  assert.equal(await c.eval('document.querySelector("#menuBtn").getAttribute("aria-expanded")'),'true');
  const rect=await c.eval('document.querySelector("#trainerMenu").getBoundingClientRect().toJSON()');
  assert(rect.left>=0&&rect.right<=width&&rect.bottom<=height);
  await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  assert(!await visible('#trainerMenu'));
  assert.equal(await c.eval('document.activeElement.id'),'menuBtn');
  assert.equal(await c.run('currentScreen'),'journey','Escape closes only the menu');
  await click('#menuBtn');await click('#progressBtn');
  assert.equal(await c.run('currentScreen'),'progress');assert(!await visible('#trainerMenu'));
  await click('#profileBtn');assert.equal(await c.run('currentScreen'),'profile');
  assert(await visible('[data-profile-storage]'));
  await click('#menuBtn');await click('#settingsBtn');assert.equal(await c.run('currentScreen'),'settings');
  await click('#menuBtn');
  await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,x:5,y:height-5});
  await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:5,y:height-5});
  assert(!await visible('#trainerMenu'));
  await c.run("openScreen('journey')");
  assert(!await c.eval('document.querySelector(".journey-description").open'));
  await click('.journey-description summary');
  assert(await visible('.journey-description p'));
  await click('.journey-description summary');
  const shot=await c.send('Page.captureScreenshot');fs.writeFileSync(`/tmp/rechten-navigation-${width}.png`,Buffer.from(shot.data,'base64'));
 }
 await c.send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});
 await c.run("launchDev('sign',0,false)");
 const before=await c.run('JSON.stringify(current)');
 await click('#menuBtn');await click('#pauseExercise');
 assert.equal(await c.run('currentScreen'),'dev');
 assert.equal(await c.run('JSON.stringify(current)'),before,'menu navigation retains the task');
 // The separate account dialog must remain visible even with its duplicate dock hidden.
 await c.eval('document.querySelector("#axioma-game-status").shadowRoot.querySelector(".dock").click()');
 assert(await c.eval(`(()=>{const p=document.querySelector('#axioma-game-status').shadowRoot.querySelector('.panel');return !p.hidden&&p.getBoundingClientRect().width===innerWidth})()`));
 await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 assert.equal(await c.eval('document.activeElement.id'),'profileBtn');
 assert.equal(await c.run('currentScreen'),'dev','closing an account dialog does not navigate the underlying screen');
 assert.deepEqual(c.errors,[]);
 console.log('PASS compact navigation: desktop/mobile, two header icons, menu destinations, Escape/outside dismissal, focus, preserved task, expandable explanation and account dialog.');
 } finally {await c.send('Fetch.disable');c.ws.close()}
})().catch(e=>{console.error(e);process.exit(1)});
