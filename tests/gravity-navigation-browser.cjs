// Real Gravity Maze UI and engine in an isolated guest context; no external services.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const PORT=process.env.VECTOR_BROWSER_PORT||9245,BASE=process.env.VECTOR_BASE_URL||'http://127.0.0.1:8775';
const OUT=path.resolve(__dirname,'../docs/gravity-ui/screenshots');fs.mkdirSync(OUT,{recursive:true});
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
 const {browserContextId}=await browser.send('Target.createBrowserContext');
 const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});
 const pages=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json(),c=new CDP();await c.connect(pages.find(t=>t.id===targetId).webSocketDebuggerUrl);
 const shadow="document.querySelector('leraarbob-topbar').shadowRoot";
 try{
  await c.send('Page.enable');await c.send('Runtime.enable');
  c.route=async p=>{const u=new URL(p.request.url);if(u.pathname.endsWith('/axioma-auth.js'))return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,body:Buffer.from('window.AxiomaAuth={CLASSES:[],ready:async()=>({account:null}),getAccount:async()=>null,onChange:()=>()=>{},configured:()=>true,client:()=>({channel:()=>({on(){return this},subscribe(){return this}})})};').toString('base64')});if(u.hostname!=='127.0.0.1')return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'});return c.send('Fetch.continueRequest',{requestId:p.requestId});};
  await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  await c.size(1366,768);await c.send('Page.navigate',{url:BASE+'/games/gravity/index.html'});
  await c.wait("!!window.gravityPrototype && !!document.querySelector('leraarbob-topbar')");
  await c.wait("Object.values(gravityPrototype.diagnostics().artwork).every(x=>x==='ready')");
  await c.click('#reset');const initial=await c.eval('gravityPrototype.snapshot().state');
  for(const [width,height] of [[1366,768],[954,441],[780,360],[390,844],[320,568]]){
   await c.size(width,height);
   for(const collapsed of [false,true]){
    await c.eval('LeraarBobTopbar.setCollapsed('+collapsed+')');await c.frames();
    const layout=await c.eval(`(()=>{
     const rect=id=>document.getElementById(id).getBoundingClientRect(),tool=rect('gravity-tools'),field=document.querySelector('.field').getBoundingClientRect(),board=gravityPrototype.diagnostics().board;
     const issues=[];
     for(const id of ['negative','positive','reset','undo','level-menu']){
      const e=document.getElementById(id),r=rect(id),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
      if(r.width<44||r.height<44||r.left<0||r.right>innerWidth||r.bottom>innerHeight||!e.contains(hit))issues.push(id+' not reachable');
     }
     for(const id of ['negative','positive']){
      const r=rect(id);if(Math.abs(r.top-field.top)>1||Math.abs(r.bottom-field.bottom)>1)issues.push(id+' not full height');
      if(id==='negative'&&r.right>field.left+board.x)issues.push('left covers puzzle');
      if(id==='positive'&&r.left<field.left+board.x+board.width)issues.push('right covers puzzle');
     }
     if(document.body.classList.contains('topbar-collapsed')){
      if(Math.abs(field.top)>1||Math.abs(field.bottom-innerHeight)>1)issues.push('folded centre does not use full height');
      for(const e of [...document.querySelectorAll('#gravity-tools button'),document.querySelector('.lb-restore')]){
       const r=e.getBoundingClientRect();if(!r.width||!r.height)continue;
       if(r.width<44||r.height<44||r.top<0||r.bottom>innerHeight)issues.push(e.id+' too small or outside viewport');
       if(r.right>field.left+board.x&&r.left<field.left+board.x+board.width&&r.bottom>field.top+board.y&&r.top<field.top+board.y+board.height)issues.push(e.id+' covers centre');
       if(!e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)))issues.push(e.id+' blocked');
      }
     }else for(const e of document.querySelectorAll('#gravity-tools button')){const r=e.getBoundingClientRect();if(r.width&&r.height&&r.right>field.left+board.x&&r.left<field.left+board.x+board.width&&r.bottom>field.top+board.y&&r.top<field.top+board.y+board.height)issues.push(e.id+' covers puzzle');}
     if(document.documentElement.scrollWidth>innerWidth)issues.push('horizontal overflow');
     return issues;
    })()`);
    assert.deepEqual(layout,[],width+' collapsed='+collapsed);
    const before=await c.eval('gravityPrototype.snapshot().state');assert.deepEqual(before,initial);
    // Tap near the lower outer edge, far outside the former small arrow target.
    const p=await c.eval("(()=>{const r=document.getElementById('negative').getBoundingClientRect();return {x:r.left+12,y:r.bottom-25}})()");
    await c.tap(p,true);await c.wait('!gravityPrototype.snapshot().busy');assert.equal(await c.eval('gravityPrototype.snapshot().moves'),1,'side edge moves once');
    await c.click('#reset',true);assert.equal(await c.eval('gravityPrototype.snapshot().moves'),0);assert.deepEqual(await c.eval('gravityPrototype.snapshot().state'),initial,'retry restores initial puzzle');
    if(collapsed){
     await c.click('#level-menu',true);assert(await c.eval("document.getElementById('selection').open"));await c.click('[data-close=selection]',true);
     await c.click('.lb-restore',true);await c.eval(shadow+".querySelector('.menu').click()");await c.eval(shadow+".querySelector('[data-source=rulesNav]').click()");assert(await c.eval("document.getElementById('instructions').open"));await c.click('[data-close=instructions]',true);
     assert(!(await c.eval("document.body.classList.contains('topbar-collapsed')")));assert.deepEqual(await c.eval('gravityPrototype.snapshot().state'),initial);
     await c.eval('LeraarBobTopbar.setCollapsed(true)');await c.frames();
    }
    await c.shot('play-'+width+(collapsed?'-collapsed':''));
   }
   console.log('PASS full-height touch controls and reachable retry: '+width+'×'+height+', both header states');
  }
  await c.eval('LeraarBobTopbar.setCollapsed(false)');await c.frames();
  for(const [width,height] of [[1366,768],[390,844]]){
   await c.size(width,height);await c.eval(shadow+".querySelector('.menu').click()");
   assert.deepEqual(await c.eval(shadow+".querySelectorAll('.menu-name') && [..."+shadow+".querySelectorAll('.menu-name')].map(e=>e.textContent)"),['Spelmenu','Spelregels','Spellen','Mijn leerpad','Inloggen','Instellingen','Bovenbalk verbergen']);
   const before=await c.eval('gravityPrototype.snapshot()');await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowLeft',code:'ArrowLeft'});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowLeft',code:'ArrowLeft'});assert.deepEqual(await c.eval('gravityPrototype.snapshot()'),before,'navigation blocks background play');
   await c.shot('menu-'+width);await c.eval(shadow+".querySelector('[data-source=roomsNav]').click()");assert(await c.eval("document.getElementById('selection').open"));
   assert(await c.eval("(()=>{const d=document.getElementById('selection'),r=d.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&d.scrollWidth<=d.clientWidth})()"));
   for(const selector of ['#level-list button.selected','#level-list button:nth-child(2)']){
    const p=await c.eval(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...p});
    const colors=await c.eval(`(()=>{const s=getComputedStyle(document.querySelector(${JSON.stringify(selector)}));return {bg:s.backgroundColor,fg:s.color}})()`);
    const rgb=colors.bg.match(/\d+/g).map(Number);assert(Math.max(...rgb.slice(0,3))<150,'hover/selected background stays dark');
   }
   await c.shot('rooms-'+width);await c.click('#level-list button:nth-child(2)');assert.equal(await c.eval('gravityPrototype.snapshot().index'),1);
   await c.eval(shadow+".querySelector('.menu').click()");await c.eval(shadow+".querySelector('[data-source=rulesNav]').click()");assert(await c.eval("document.getElementById('instructions').open"));await c.click('[data-close=instructions]');
   await c.eval(shadow+".querySelector('[part=crumb-game]').click()");assert(await c.eval("document.getElementById('selection').open"));await c.click('#level-list button:first-child');
  }
  // Finish a real room; replay must not award another completed level.
  await c.size(954,441);await c.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  const path=await c.eval('Gravity.analyze(Gravity.compile(GravityLevels.levels[0])).path');
  for(let run=0;run<2;run++){
   await c.click('#reset');
   for(const sign of path){await c.click(sign<0?'#negative':'#positive');await c.wait('!gravityPrototype.snapshot().busy');}
   await c.wait("document.querySelector('leraarbob-topbar').shadowRoot.querySelector('.progress-value').textContent==='1/9 levels'");
  }
  console.log('PASS completed room appears immediately; replay does not double-count');
  await c.eval('LeraarBobTopbar.setCollapsed(true)');const loads=c.loads;await c.send('Page.reload');for(let i=0;i<200&&c.loads===loads;i++)await new Promise(r=>setTimeout(r,25));await c.wait("!!window.gravityPrototype && document.querySelector('.lb-collapsed')");await c.frames();await c.click('#reset',true);await c.click('.lb-restore',true);await c.wait("document.querySelector('leraarbob-topbar').shadowRoot.querySelector('.progress-value').textContent==='1/9 levels'");assert(!(await c.eval("document.querySelector('.lb-header').classList.contains('lb-collapsed')")));
  assert.deepEqual(c.errors,[]);console.log('PASS menu routes, dark selection/hover, modal input isolation, collapse persistence and zero runtime errors');
 }finally{await browser.send('Target.disposeBrowserContext',{browserContextId});c.ws.close();browser.ws.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
