// Production route regression: real touch/keyboard, synthetic guest; no external requests.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const PORT=Number(process.env.V2_BROWSER_PORT||9245),BASE=process.env.V2_BASE_URL||'http://127.0.0.1:8775';
const ARTIFACTS=process.env.V2_SCREENSHOT_DIR||'/tmp/rechten-shell-validation/screenshots';
const ROUTE='/games/rechten/trainer-v2/';
const report={checks:[],screenshots:[],passed:false};
class CDP {
  async connect() {
    const tabs=await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
    const tab=tabs.find(t=>t.type==='page');
    assert(tab,`No page on isolated Chromium port ${PORT}`);
    this.ws=new WebSocket(tab.webSocketDebuggerUrl);this.id=0;this.pending=new Map();this.errors=[];
    await new Promise((resolve,reject)=>{this.ws.onopen=resolve;this.ws.onerror=reject});
    this.ws.onmessage=event=>{
      const m=JSON.parse(event.data);
      if(m.id){const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}
      else if(m.method==='Page.loadEventFired')this.loads=(this.loads||0)+1;
      else if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails);
      else if(m.method==='Fetch.requestPaused')Promise.resolve(this.paused?.(m.params)).catch(e=>this.errors.push({network:e.message}));
    };
    await this.send('Page.enable');await this.send('Runtime.enable');await this.send('Network.enable');
    await this.send('Network.setCacheDisabled',{cacheDisabled:true});
  }
  send(method,params={}) {return new Promise((resolve,reject)=>{const id=++this.id,timer=setTimeout(()=>{this.pending.delete(id);reject(Error('CDP timeout: '+method))},15000);this.pending.set(id,{resolve,reject,timer});this.ws.send(JSON.stringify({id,method,params}))})}
  async eval(expression) {const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
  async wait(expression) {for(let i=0;i<160;i++){if(await this.eval(expression))return;await new Promise(r=>setTimeout(r,50))}throw Error('Timeout waiting for '+expression)}
  async navigate(url){const before=this.loads||0;await this.send(url?'Page.navigate':'Page.reload',url?{url}:{});for(let i=0;i<300&&(this.loads||0)<=before;i++)await new Promise(r=>setTimeout(r,25));assert((this.loads||0)>before,'document load event');}
  frames() {return this.eval('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')}
  async viewport(width,height,touch=false) {await this.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await this.send('Emulation.setTouchEmulationEnabled',{enabled:touch,maxTouchPoints:1});await this.frames()}
  async press(key,modifiers=0) {
    const codes={Tab:9,Enter:13,' ':32,Escape:27,Home:36,ArrowDown:40,ArrowUp:38,ArrowLeft:37,ArrowRight:39,a:65};
    await this.send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key===' '?'Space':key==='a'?'KeyA':key,windowsVirtualKeyCode:codes[key]||key.charCodeAt(0),nativeVirtualKeyCode:codes[key]||key.charCodeAt(0),text:key==='Enter'?'\r':key===' '?' ':undefined,modifiers});
    await this.send('Input.dispatchKeyEvent',{type:'keyUp',key,modifiers});await this.frames();
  }
  async tap(selector,touch=false) {
    if(this.keyboardOnly){await this.keyboardTo(selector);const type=await this.eval(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});return {tag:e.tagName,type:e.type,role:e.getAttribute('role')}})()`);if(type.tag==='BUTTON'||type.tag==='A'||type.role==='button')await this.press('Enter');else if(['checkbox','radio'].includes(type.type))await this.press(' ');return;}
    const p=await this.eval(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled||!e.getClientRects().length)throw Error('Unavailable ${selector.replaceAll("'",'')}');const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    if(touch){await this.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,radiusX:3,radiusY:3}]});await this.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
    else{await this.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...p});await this.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...p})}
    await this.frames();
  }
  async keyboardTo(selector) {for(let i=0;i<80;i++){if(await this.eval(`document.activeElement?.matches(${JSON.stringify(selector)})`))return;await this.press('Tab')}throw Error('Keyboard cannot reach '+selector)}
  async fill(name,value,touch=false) {
    const selector=`[name="${name}"]`;
    const meta=await this.eval(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});return e?{tag:e.tagName,type:e.type,options:e.options?[...e.options].map(o=>o.value):null}:null})()`);
    if(!meta){await this.tap(`[data-choice="${name}"][data-value="${value}"]`,touch);return;}
    assert(meta,'Missing named answer field '+name);
    if(meta.type==='radio'||meta.type==='checkbox'){
      if(meta.type==='radio')await this.tap(`${selector}[value="${value}"]`,touch);
      else if(Boolean(await this.eval(`document.querySelector(${JSON.stringify(selector)}).checked`))!==Boolean(value))await this.tap(selector,touch);
    }else if(meta.tag==='SELECT'){
      const index=meta.options.indexOf(String(value));assert(index>=0,`${name}: missing option ${value}`);
      await this.tap(selector,touch);await this.press('Home');for(let i=0;i<index;i++)await this.press('ArrowDown');await this.press('Enter');await this.press('Tab');
    }else{await this.tap(selector,touch);await this.press('a',2);await this.send('Input.insertText',{text:String(value)});await this.press('Tab')}
    await this.frames();
  }
  async shot(name) {const out=path.join(ARTIFACTS,name+'.png');const r=await this.send('Page.captureScreenshot',{captureBeyondViewport:false});fs.writeFileSync(out,Buffer.from(r.data,'base64'));report.screenshots.push(out)}
}

(async()=>{
 const c=new CDP();await c.connect();fs.mkdirSync(ARTIFACTS,{recursive:true});
 const mock=`window.AxiomaAuth={ready:async()=>({session:null}),getAccount:async()=>null,getSnapshot:()=>({status:'guest',account:null}),client:()=>null,onChange:()=>()=>{}};`;
 c.paused=p=>{const url=new URL(p.request.url);if(url.pathname.endsWith('/axioma-auth.js')||url.origin!==new URL(BASE).origin)return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(url.pathname.endsWith('/axioma-auth.js')?mock:'').toString('base64')});return c.send('Fetch.continueRequest',{requestId:p.requestId})};
 await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 const ready=async()=>{await c.wait('document.querySelector("#app[data-ready=true]")');await c.eval('document.fonts.ready');await c.frames()};
 const snap=()=>c.eval('RechtenV2App.snapshot()');
 const screen=()=>c.eval('document.querySelector("#app").dataset.screen');
 let fixture=0;
 async function fresh(hash='#wereld'){
  await c.navigate(BASE+ROUTE+'?fixture='+ ++fixture);await ready();
  await c.eval(`localStorage.clear();localStorage.setItem('axioma-trainer-rechten-v0700:wave4',JSON.stringify({version:704,skills:{},review:[],xp:596,streak:2,total:0,untouched:'sentinel'}))`);
  await c.navigate(BASE+ROUTE+'?fixture='+ ++fixture+hash);await ready();
 }
 async function layout(label){
  const issues=await c.eval(`(()=>{const issues=[],visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';if(document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1)issues.push('document scroll');for(const root of document.querySelectorAll('.atlas-page,.atlas-main,.world-map,.area-map,.boundary-workspace,.boundary-footer,.journal-main')){const r=root.getBoundingClientRect();if(r.width&&root.scrollHeight>root.clientHeight+2&&root.matches('.journal-main'))issues.push('content overflow '+root.className)}for(const e of document.querySelectorAll('button,input,select,a')){if(!visible(e)||e.closest('[hidden],[inert]'))continue;const r=e.getBoundingClientRect(),name=e.id||e.getAttribute('aria-label')||e.name||e.textContent.trim();if(r.width<43.5||r.height<43.5)issues.push('small '+name+' '+r.width+'x'+r.height);if(r.left<-.8||r.right>innerWidth+.8||r.top<-.8||r.bottom>innerHeight+.8)issues.push('clipped '+name+' '+JSON.stringify({x:r.x,y:r.y,w:r.width,h:r.height}));if(!e.disabled){const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(hit&&!e.contains(hit)&&hit!==e)issues.push('covered '+name+' by '+hit.tagName+'.'+hit.className)}if(!(e.getAttribute('aria-label')||e.getAttribute('aria-labelledby')||e.labels?.length||e.textContent.trim()))issues.push('unnamed '+name)}for(const e of document.querySelectorAll('.island-label,.skill-label,.skill-status,.skill-marker')){if(!visible(e))continue;const r=e.getBoundingClientRect(),main=e.closest('.atlas-main').getBoundingClientRect();if(r.bottom>main.bottom+.8||r.top<main.top-.8||r.left<main.left-.8||r.right>main.right+.8)issues.push('clipped label '+e.textContent.trim());const intro=e.closest('.atlas-main').querySelector('.map-intro').getBoundingClientRect();if(r.left<intro.right&&r.right>intro.left&&r.top<intro.bottom&&r.bottom>intro.top)issues.push('intro overlaps '+e.className)}for(const e of document.querySelectorAll('.atlas-footer button,.boundary-footer button')){if(visible(e)&&e.scrollWidth>e.clientWidth+1)issues.push('button text overflow '+e.textContent.trim())}for(const t of document.querySelectorAll('.boundary-graph .tick')){if(!visible(t))continue;const m=t.getScreenCTM();const pixels=parseFloat(getComputedStyle(t).fontSize)*Math.hypot(m.a,m.b);if(pixels<11.5)issues.push('small graph text '+pixels.toFixed(1));}return [...new Set(issues)]})()`);
  assert.deepEqual(issues,[],label);report.checks.push('layout: '+label);
 }
 async function resume(label){const before=await snap();await c.navigate();await ready();assert.deepEqual(await snap(),before,label+' exact reload');report.checks.push('resume: '+label)}
 async function fill(name,value,touch=true){await c.fill(name,value,touch)}
 async function choose(name,value,touch=true){await c.tap(`[data-choice="${name}"][data-value="${value}"]`,touch)}
 try{
  for(const [width,height] of [[390,844],[360,640],[320,568],[640,360],[780,360],[844,390],[1024,768],[1366,768],[1920,1080]]){
   await c.viewport(width,height,width<900);await fresh();
   assert.equal(await screen(),'world');assert.equal(await c.eval('document.querySelectorAll("[data-world-node]").length'),5);assert.equal(await c.eval('document.querySelectorAll("[data-world-node]:disabled").length'),0);
   await layout('world '+width+'x'+height);await c.shot('world-'+width+'x'+height);
   await c.tap('[data-world-node="grenspas"]',width<900);assert.equal(await screen(),'area');
   assert.equal(await c.eval('document.querySelectorAll("[data-skill]").length'),5);assert.equal(await c.eval('document.querySelectorAll("[data-skill]:not(:disabled)").length'),5);
   await layout('area '+width+'x'+height);await c.shot('area-'+width+'x'+height);await resume('area '+width);
   await c.tap('[data-node="positive"]',width<900);assert.equal(await screen(),'mission');
   if(width>=640&&width>height){await layout('exercise '+width+'x'+height);await c.shot('exercise-'+width+'x'+height)}else{assert(await c.eval('document.querySelector("#rotateGate").getClientRects().length>0'));await layout('portrait gate '+width)}
  }
  await c.viewport(640,360,true);await fresh();await c.tap('[data-world-node="grenspas"]',true);await c.tap('[data-node="positive"]',true);
  const before=(await snap()).missions.grenspas;
  await fill('root','3');await layout('root entered');await resume('partial root');
  await c.tap('#pause',true);assert.equal(await screen(),'area');assert.equal((await snap()).missions.grenspas.values.root,'3');
  await c.eval('history.back()');await c.wait('document.querySelector("#app").dataset.screen==="mission"');assert.equal((await snap()).missions.grenspas.values.root,'3');report.checks.push('browser Back resumes exact task and draft');
  await c.tap('#commit',true);assert((await snap()).missions.grenspas.feedback.result.ok);await resume('committed root');await c.tap('#continue',true);
  await choose('side','left');await choose('closed','false');await c.tap('#commit',true);assert.equal((await snap()).missions.grenspas.feedback.result.code,'sign.side_reversed');await layout('incorrect interval');await c.shot('interval-repair-640x360');await resume('incorrect interval');await c.tap('#continue',true);
  assert.equal((await snap()).missions.grenspas.values.root,'3');assert.equal((await snap()).missions.grenspas.locks.closed,true);await choose('side','right');await c.tap('#commit',true);assert((await snap()).missions.grenspas.feedback.result.ok);await layout('correct interval');await c.shot('interval-correct-640x360');await c.tap('#continue',true);
  await choose('symbol','>');await fill('symbolBoundary','3');await c.tap('#commit',true);assert((await snap()).missions.grenspas.feedback.result.ok);await c.tap('#continue',true);
  assert.equal(await screen(),'area');assert.equal(await c.eval('document.querySelector("[data-node=positive]").dataset.state'),'completed');assert.equal((await snap()).missions.grenspas.index,1,'existing runtime retains next contrasting task');await resume('completed area');await c.shot('area-completed-640x360');
  assert((await snap()).events.every(e=>e.mastery===false));report.checks.push('world → area → all original positive-task phases → completed area, local repair and idempotent reload');
  await c.tap('[data-node=positive]',true);assert.equal((await snap()).missions.grenspas.index,1);
  await fill('boundary','-2');await choose('side','left');await choose('closed','false');await choose('symbol','<');await fill('symbolBoundary','-2');await c.tap('#commit',true);assert((await snap()).missions.grenspas.feedback.result.ok);await layout('falling contrast');await c.tap('#continue',true);assert.equal(await screen(),'area');
  await c.tap('[data-node=positive]',true);assert.equal((await snap()).missions.grenspas.index,0);await c.tap('#pause',true);assert.equal(await c.eval('document.querySelector("[data-node=positive]").dataset.state'),'completed','completed badge survives explicit replay');report.checks.push('existing falling contrast and explicit replay preserve accumulated completion evidence');
  // Menu and secondary destinations are also one viewport, including portrait.
  for(const [width,height] of [[390,844],[320,568],[640,360],[1366,768]]){
   await c.viewport(width,height,width<900);await fresh();await c.tap('#menu',width<900);await layout('open menu '+width);await c.press('Escape');assert.equal(await c.eval('document.activeElement.id'),'menu');
   await c.tap('#menu',width<900);await c.tap('#main-menu [data-screen=book]',width<900);await layout('progress '+width);await c.shot('progress-'+width+'x'+height);
   await c.tap('[data-screen=profile]',width<900);await layout('profile '+width);await c.shot('profile-'+width+'x'+height);
  }
  await c.viewport(1366,768,false);await fresh();c.keyboardOnly=true;await c.tap('[data-world-node="grenspas"]');await c.tap('[data-node=positive]');await fill('root','3',false);await c.tap('#commit');await c.tap('#continue');await choose('side','right',false);await choose('closed','false',false);await c.tap('#commit');await c.tap('#continue');await choose('symbol','>',false);await fill('symbolBoundary','3',false);await c.tap('#commit');await c.shot('exercise-correct-1366x768');await c.tap('#continue');assert.equal(await screen(),'area');c.keyboardOnly=false;report.checks.push('complete vertical route by keyboard without pointer input');
  await c.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await c.tap('[data-screen=world]');assert(await c.eval('matchMedia("(prefers-reduced-motion:reduce)").matches'));await layout('reduced motion world');await c.send('Emulation.setEmulatedMedia',{features:[]});
  await c.send('Emulation.setEmulatedMedia',{features:[{name:'forced-colors',value:'active'}]});await layout('forced colors world');await c.tap('[data-world-node="grenspas"]');await layout('forced colors area');await c.tap('[data-node=positive]');await layout('forced colors exercise');await c.shot('forced-colors-1366x768');await c.send('Emulation.setEmulatedMedia',{features:[]});
  assert.equal(await c.eval('JSON.parse(localStorage.getItem("axioma-trainer-rechten-v0700:wave4")).untouched'),'sentinel');
  assert.deepEqual(c.errors,[],'no browser exceptions');report.checks.push('legacy storage unchanged, reduced motion, no runtime errors');report.passed=true;
  console.log('PASS v2 world-shell: '+report.checks.length+' checks/groups; '+report.screenshots.length+' screenshots');
 }catch(e){report.failure=e.stack;await c.shot('failure');throw e}
 finally{fs.writeFileSync(path.join(ARTIFACTS,'world-shell-report.json'),JSON.stringify(report,null,2));await c.send('Fetch.disable');c.ws.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
