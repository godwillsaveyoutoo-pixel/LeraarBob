// Standalone isolated Chromium (CDP 9236) + local static server (8765).
// Runtime inspection is read-only; answers use real mouse/touch/keyboard events.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const PORT = Number(process.env.V2_BROWSER_PORT || 9236);
const BASE = process.env.V2_BASE_URL || 'http://127.0.0.1:8765';
const ARTIFACTS = process.env.V2_SCREENSHOT_DIR || '/tmp/rechten-v2-validation/screenshots';
const ROUTE = '/games/rechten/trainer-v2/';
const SLICES = ['grenspas', 'hellingrug', 'signaalstad'];
const SENTINEL = 'axioma-trainer-rechten-v0700:wave4';
const SENTINEL_VALUE = JSON.stringify({version:1,skills:{sign:{strength:.71}},review:[{kind:'repair',skill:'zeroRead'}],unknown:{keep:true}});
// Independent rational oracle: never calls the app validator or a solve hook.
const gcd=(a,b)=>b?gcd(b,a%b):a<0n?-a:a;
const rat=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);assert.notEqual(d,0n);if(d<0n){n=-n;d=-d}const g=gcd(n,d);return {n:n/g,d:d/g}};
const from=v=>rat(v.n,v.d);
const plus=(a,b)=>rat(a.n*b.d+b.n*a.d,a.d*b.d);
const minus=(a,b)=>rat(a.n*b.d-b.n*a.d,a.d*b.d);
const times=(a,b)=>rat(a.n*b.n,a.d*b.d);
const divide=(a,b)=>rat(a.n*b.d,a.d*b.n);
const textRat=a=>a.d===1n?String(a.n):a.n+'/'+a.d;
const report = {checks:[],screenshots:[],scope:'synthetic guest, no production account or network writes',manualRemaining:['physical Samsung A20','NVDA/TalkBack','real student transfer comparison']};

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
 const origin=new URL(BASE).origin;
 const authMock=`window.AxiomaAuth={ready:async()=>({session:null}),getAccount:async()=>null,getSnapshot:()=>({status:'guest',account:null,session:null}),client:()=>null,onChange:()=>()=>{},onStateChange:()=>()=>{}};`;
 c.paused=p=>{const u=new URL(p.request.url);let body;
   if(u.pathname.endsWith('/axioma-auth.js'))body=authMock;
   else if(u.origin!==origin)body='';
   else return c.send('Fetch.continueRequest',{requestId:p.requestId});
   return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(body).toString('base64')});
 };
 await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 const snap=()=>c.eval('window.RechtenV2App.snapshot()');
 const exists=selector=>c.eval(`!!document.querySelector(${JSON.stringify(selector)})?.getClientRects().length`);
 async function open(slice,reset=false){
   if(reset){await c.navigate(BASE+ROUTE);await c.wait('window.RechtenV2App&&document.querySelector("#app[data-ready=true]")');await c.eval(`localStorage.clear();localStorage.setItem(${JSON.stringify(SENTINEL)},${JSON.stringify(SENTINEL_VALUE)})`)}
   await c.navigate(BASE+ROUTE+(slice?'?slice='+slice:''));
   await c.wait('window.RechtenV2App&&document.querySelector("#app[data-ready=true]")');await c.frames();
 }
 async function layout(label,mission=true){
   const issues=await c.eval(`(()=>{const issues=[],visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';const gate=document.querySelector('#rotateGate');if(gate&&visible(gate))return ['unexpected rotate gate'];for(const e of document.querySelectorAll('button,input,select,[role=button]')){if(!visible(e)||e.closest('[hidden]'))continue;const target=['radio','checkbox'].includes(e.type)?e.closest('label')||e:e,r=target.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(${mission}&&!e.disabled&&hit&&!target.contains(hit))issues.push('obscured '+(e.id||e.name||e.textContent.trim())+' by '+(hit.id||hit.tagName));if(r.width<43.5||r.height<43.5)issues.push('small '+(e.id||e.name||e.textContent.trim())+' '+r.width+'×'+r.height);if(r.left<-.5||r.right>innerWidth+.5||(${mission}&&(r.top<-.5||r.bottom>innerHeight+.5)))issues.push('clipped '+(e.id||e.name||e.textContent.trim()));const labelled=e.getAttribute('aria-label')||e.getAttribute('aria-labelledby')||e.labels?.length||e.textContent.trim()||e.title;if(!labelled)issues.push('unnamed '+e.tagName+' '+e.id)}if(document.documentElement.scrollWidth>innerWidth+1)issues.push('horizontal scroll');if(${mission}&&document.documentElement.scrollHeight>innerHeight+1)issues.push('active gameplay scroll');for(const label of document.querySelectorAll('#mission .math-graph text')){const matrix=label.getScreenCTM();if(matrix&&visible(label)){const size=parseFloat(getComputedStyle(label).fontSize)*Math.hypot(matrix.c,matrix.d);if(size<11.5)issues.push('small graph text '+label.textContent+' '+size.toFixed(1)+'px')}}if(document.querySelector('#mission')&&document.querySelector('#feedback')?.getAttribute('role')!=='status')issues.push('feedback is not a status region');if(document.querySelectorAll('[data-representation]').length>2)issues.push('more than two representations');const primary=[...document.querySelectorAll('#commit,#continue')].filter(e=>visible(e)&&!e.disabled);if(${mission}&&primary.length>1)issues.push('two primary actions');return issues})()`);
   assert.deepEqual(issues,[],label);report.checks.push('layout: '+label);
 }
 async function available(name){return c.eval(`(()=>{const e=document.querySelector('[name="'+${JSON.stringify(name)}+'"]')||document.querySelector('[data-choice="'+${JSON.stringify(name)}+'"]');return !!e&&!!e.getClientRects().length&&!e.disabled&&!e.readOnly})()`)}
 async function set(name,value,touch){if(await available(name))await c.fill(name,value,touch)}
 async function solvePhase(m,touch){
   const t=m.task,v=m.values,a=from(t.model.a),b=from(t.model.b);
   if(m.phase==='root')await set('root',textRat(divide(rat(-b.n,b.d),a)),touch);
   if(['interval','symbol'].includes(m.phase)){
     const positive=t.ask==='positive',side=a.n===0n?((positive?b.n>0n:b.n<0n)?'all':'none'):(positive===(a.n>0n)?'right':'left');
     if(a.n!==0n){const boundary=textRat(divide(rat(-b.n,b.d),a));await set('boundary',boundary,touch);await set('symbolBoundary',boundary,touch)}
     await set('side',side,touch);await set('closed',false,touch);await set('symbol',side==='right'?'>':side==='left'?'<':side,touch);
   }
   if(['deltas','rate'].includes(m.phase)){
     const direction=v.direction||'AB',start=t.points[direction==='AB'?'A':'B'],end=t.points[direction==='AB'?'B':'A'],dx=minus(from(end.x),from(start.x)),dy=minus(from(end.y),from(start.y));
     await set('direction',direction,touch);await set('dx',textRat(dx),touch);await set('dy',textRat(dy),touch);
     // Deliberately use an equivalent fraction, rather than repeating the stored canonical slope.
     await set('numerator',textRat(times(dy,rat(2))),touch);await set('denominator',textRat(times(dx,rat(2))),touch);
   }
   if(m.phase==='probe'){const probe=v.probe||'zero';await set('probe',probe,touch);await set('expected',textRat(probe==='zero'?b:a),touch)}
   if(m.phase==='repair'){await set('feature','swapped',touch);await set('a',textRat(a),touch);await set('b',textRat(b),touch)}
   if(m.phase==='hidden')await set('hidden',textRat(plus(times(a,from(t.hidden.x)),b)),touch);
   await c.tap('#commit',touch);
 }
 async function complete(slice,{touch=false,keyboard=false,supported=false}={}){
   c.keyboardOnly=keyboard;await open(slice,true);let injected=false,hinted=false,reloaded=false;const visited=[];
   for(let i=0;i<60;i++){
     const state=await snap(),m=state.missions[slice];assert(m,slice+' mission exists');
     if(m.completed){assert.equal(m.completion.length,slice==='grenspas'?4:2,slice+' includes every structural contrast');assert(state.events.length>0,'semantic evidence recorded');assert(state.events.every(e=>e.mastery===false),'pilot never claims production mastery');assert(state.events.filter(e=>e.helpLevel>0).every(e=>e.supported&&!e.independent),'help never becomes independent evidence');await layout(slice+' complete');await c.shot(slice+'-'+(supported?'supported':'independent')+'-complete');await resumeEquality(slice+' complete');report.checks.push('full '+slice+' '+(supported?'repair/hint':'independent')+' '+(keyboard?'keyboard':touch?'touch':'mouse'));c.keyboardOnly=false;return;}
     visited.push(m.phase+':'+m.variant);await layout(slice+' '+m.phase+' '+m.variant);
     if(m.feedback){
       if(!injected||m.feedback.result.ok)assert(m.feedback.result.ok,slice+' independent exact answer: '+JSON.stringify(m.feedback.result));
       if(!reloaded&&m.feedback.result.ok){await resumeEquality(slice+' committed '+m.phase);reloaded=true;}
       await c.tap('#continue',touch);continue;
     }
     if(slice==='signaalstad'&&m.phase==='probe'&&m.index===0&&supported&&!m.values.pins.includes('table')){await c.tap('[data-pin="table"]',touch);assert.equal(await c.eval('document.querySelectorAll("[data-representation]").length'),2,'pinning a third view replaces one');report.checks.push('choose table/graph comparison pair')}
     if(supported&&!injected&&((slice==='grenspas'&&m.phase==='interval')||(slice==='hellingrug'&&m.phase==='deltas')||(slice==='signaalstad'&&m.phase==='repair'))){
       if(slice==='grenspas'){
         const rootBefore=m.values.root;await set('side','left',touch);await set('closed',false,touch);await c.tap('#commit',touch);
         const bad=(await snap()).missions[slice];assert.equal(bad.feedback.result.code,'sign.side_reversed');assert.equal(bad.values.root,rootBefore,'correct zero is retained');
       }else if(slice==='hellingrug'){
         const dx=minus(from(m.task.points.B.x),from(m.task.points.A.x)),dy=minus(from(m.task.points.B.y),from(m.task.points.A.y));await set('direction','AB',touch);await set('dx',textRat(dx),touch);await set('dy',textRat(rat(-dy.n,dy.d)),touch);await c.tap('#commit',touch);
         const bad=(await snap()).missions[slice];assert.equal(bad.feedback.result.code,'delta.orientation_mixed');assert.equal(bad.feedback.result.keep.dx,true,'good delta is retained');
       }else{
         await set('feature','swapped',touch);await set('a',textRat(from(m.task.faultModel.a)),touch);await set('b',textRat(from(m.task.model.b)),touch);await c.tap('#commit',touch);
         const bad=(await snap()).missions[slice];assert.equal(bad.feedback.result.keep.b,true,'correct intercept retained');assert.equal(bad.feedback.result.ok,false,'one coefficient is insufficient');
       }
       injected=true;await layout(slice+' wrong feedback');await c.shot(slice+'-repair-feedback');await resumeEquality(slice+' error');await c.tap('#continue',touch);continue;
     }
     if(supported&&injected&&!hinted){await c.tap('#hint',touch);hinted=true;await layout(slice+' hint');await resumeEquality(slice+' supported partial work');}
     if(!supported&&m.phase==='deltas')await set('direction','BA',touch);
     if(!supported&&m.phase==='probe')await set('probe','difference',touch);
     await solvePhase((await snap()).missions[slice],touch);
   }
   throw Error('Mission did not finish: '+slice+' '+visited.join(','));
 }
 async function resumeEquality(label){const before=await snap(),beforeFeedback=await c.eval('document.querySelector("#feedback")?.textContent');await c.navigate();await c.wait('window.RechtenV2App&&document.querySelector("#app[data-ready=true]")');const after=await snap();assert.deepEqual(after,before,'exact resume '+label);assert.equal(await c.eval('document.querySelector("#feedback")?.textContent'),beforeFeedback,'visible feedback/hint retained '+label);report.checks.push('exact resume: '+label)}
 try{
   if(process.argv.includes('--prototype')){
     await c.navigate(BASE+ROUTE+'prototype.html');await c.wait('document.querySelector("#prototype #test")');
     const stored=await c.eval('JSON.stringify({...localStorage})');
     for(const [width,height] of [[780,360],[640,360]]){
       await c.viewport(width,height,true);await c.navigate();await c.wait('document.querySelector("#prototype #test")');
       await layout('prototype interval '+width);await c.fill('root','3',true);await c.tap('[data-choice="side"][data-value="right"]',true);await c.tap('#test',true);
       assert.match(await c.eval('document.querySelector(".feedback").textContent'),/rechts.*3/);await c.shot('prototype-interval-'+width);
       await c.tap('#switch',true);await layout('prototype delta '+width);await c.fill('dx','4',true);await c.fill('dy','2',true);await c.tap('#test',true);
       assert.match(await c.eval('document.querySelector(".feedback").textContent'),/Δx = 4.*Δy = 2/);await c.shot('prototype-delta-'+width);
     }
     await c.keyboardTo('#switch');await c.press('Enter');assert(await exists('[name="root"]'));
     assert.equal(await c.eval('JSON.stringify({...localStorage})'),stored,'disposable prototype does not write any storage');assert.deepEqual(c.errors,[]);
     report.checks.push('prototype two contrasting mechanics with true touch inputs, explicit commit and keyboard switch');report.passed=true;
     console.log('PASS Rechtentrainer v2 prototype: '+report.checks.length+' checks/groups');return;
   }
   await c.viewport(1366,768);await open(null,true);
   await c.shot('world-1366x768');
   assert.equal(await c.eval('document.documentElement.lang'),'nl-BE');
   assert.equal(await c.eval('document.querySelector("#app").dataset.screen'),'world');
   await c.keyboardTo('#menu');assert(await c.eval('parseFloat(getComputedStyle(document.activeElement).outlineWidth)>=2'), 'keyboard focus is visibly outlined');await c.press('Enter');
   assert(await exists('[data-screen="book"]'),'menu exposes fieldbook');
   await c.press('Escape');
   assert.equal(await c.eval('document.activeElement?.id'),'menu','Escape restores menu trigger focus');
   report.checks.push('keyboard menu/Escape/focus');
   for(const [width,height] of [[1920,1080],[1366,768],[1024,768],[780,360],[640,360]]){
     await c.viewport(width,height,width<=780);
     for(const slice of SLICES){
       await open(slice,true);assert.equal(await c.eval('document.querySelector("#app").dataset.screen'),'mission');
       assert.equal(await c.eval('document.querySelector("#mission").dataset.world'),slice);
       await layout(slice+' '+width+'×'+height);
       if(slice==='grenspas')assert.equal(await c.eval('document.querySelectorAll("[data-answer-root],[data-correct=true],.correct,.positive-region,.negative-region").length'),0,'no precommit solution colouring or answer marker');
       await c.shot(slice+'-'+width+'x'+height);
     }
   }
   // World and fieldbook remain portrait destinations; a running task is retained.
   await c.viewport(390,844,true);await open(null,true);await layout('portrait world',false);await c.shot('world-390x844');
   await c.tap('#menu',true);await c.tap('[data-screen="book"]',true);assert.equal(await c.eval('document.querySelector("#app").dataset.screen'),'book');await layout('portrait fieldbook',false);await c.shot('book-390x844');
   await c.viewport(640,360,true);await open('grenspas',true);const beforeRotate=await snap();
   await c.viewport(390,844,true);assert(await exists('#rotateGate'),'portrait active gameplay is gated');await c.shot('rotate-gate-390x844');
   await c.viewport(640,360,true);assert.deepEqual(await snap(),beforeRotate,'rotation preserves the active task');await layout('after orientation change');report.checks.push('portrait shell and gameplay gate with state preservation');
   // Reduced motion and equivalent CSS viewport at 200% desktop browser zoom.
   await c.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
   assert(await c.eval('matchMedia("(prefers-reduced-motion: reduce)").matches'));
   assert.deepEqual(await c.eval(`Array.from(document.querySelectorAll('*')).filter(e=>e.getClientRects().length&&getComputedStyle(e).animationName!=='none'&&getComputedStyle(e).animationDuration!=='0s').map(e=>e.id||e.className)`),[],'no essential continuous animation in reduced motion');
   await c.send('Emulation.setEmulatedMedia',{features:[]});
   await c.viewport(683,384);await layout('200 percent zoom equivalent CSS viewport');report.checks.push('reduced motion and 200 percent equivalent CSS viewport (not a physical-device/browser-zoom certification)');
   await c.viewport(640,360,true);
   for(const slice of SLICES)await complete(slice,{touch:true,supported:true});
   await c.viewport(1366,768,false);
   for(const slice of SLICES)await complete(slice,{keyboard:true});
   await c.viewport(640,360,true);await open('hellingrug',true);await resumeEquality('initial slope mission');
   if(await exists('#hint')){
     await c.tap('#hint',true);await layout('slope contextual hint');await resumeEquality('hint state');
     for(let level=2;level<=5;level++){await c.tap('#hint',true);assert.equal((await snap()).missions.hellingrug.hints,level);await layout('hint ladder '+level)}
     await resumeEquality('full worked example');const exampleId=(await snap()).missions.hellingrug.task.id;
     await c.tap('#new-example',true);const newCase=(await snap()).missions.hellingrug;assert.notEqual(newCase.task.id,exampleId,'full example followed by genuinely new task');assert.equal(newCase.hints,0);await layout('new attempt after full example');report.checks.push('five-level hint ladder and new attempt');
   }
   assert.equal(await c.eval(`localStorage.getItem(${JSON.stringify(SENTINEL)})`),SENTINEL_VALUE,'unrelated legacy progress stays intact');
   assert.deepEqual(c.errors,[],'no browser runtime exceptions');
   report.checks.push('synthetic legacy sentinel unchanged');report.passed=true;
   console.log('PASS Rechtentrainer v2 browser: '+report.checks.length+' assertions/groups; '+report.screenshots.length+' screenshots');
 }catch(e){report.passed=false;report.failure=e.stack;try{await c.shot('failure')}catch{}throw e}
 finally{fs.writeFileSync(path.join(ARTIFACTS,process.argv.includes('--prototype')?'prototype-browser-report.json':'browser-report.json'),JSON.stringify(report,null,2));await c.send('Fetch.disable');c.ws.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
