// Shared navigation across every active catalog entry, in isolated guest contexts.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const PORT=process.env.VECTOR_BROWSER_PORT||9245,BASE=process.env.VECTOR_BASE_URL||'http://127.0.0.1:8775';
const OUT=path.resolve(__dirname,'../docs/vectoren-v04/interface');fs.mkdirSync(OUT,{recursive:true});
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

const Core=require('../games/vectoren/vector-core.js');
(async()=>{
 const version=await(await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(),browser=new CDP();await browser.connect(version.webSocketDebuggerUrl);
 const {browserContextId}=await browser.send('Target.createBrowserContext'),{targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});
 const pages=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json(),c=new CDP();await c.connect(pages.find(t=>t.id===targetId).webSocketDebuggerUrl);
 const shadow="document.querySelector('leraarbob-topbar').shadowRoot",url=BASE+'/games/vectoren/Axioma_Vectorentrainer_v0.4_vectormissie.html';
 try{
  await c.send('Page.enable');await c.send('Runtime.enable');
  c.route=async p=>{const u=new URL(p.request.url);if(u.pathname.endsWith('/axioma-auth.js'))return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,body:Buffer.from('window.AxiomaAuth={ready:async()=>({account:null}),getAccount:async()=>null,onChange:()=>()=>{}};').toString('base64')});if(u.hostname!=='127.0.0.1')return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'});return c.send('Fetch.continueRequest',{requestId:p.requestId});};await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  // Sample before every painted frame: never expose the unmounted legacy header.
  await c.send('Page.addScriptToEvaluateOnNewDocument',{source:`window.headerFlashes=[];function checkHeader(){const h=document.querySelector('.trainer-header:not(.lb-header)');if(h&&getComputedStyle(h).visibility==='visible')headerFlashes.push(h.className);requestAnimationFrame(checkHeader)}requestAnimationFrame(checkHeader);`});
  async function load(){const n=c.loads||0;await c.send('Page.navigate',{url});for(let i=0;i<200&&(c.loads||0)<=n;i++)await new Promise(r=>setTimeout(r,25));await c.wait("!!window.AxiomaVectorTrainer&&!!document.querySelector('leraarbob-topbar')");await c.frames();}
  await c.size(954,441);await load();
  assert.deepEqual(await c.eval('headerFlashes'),[]);
  assert(await c.eval("document.querySelector('.lb-gamebar').getBoundingClientRect().height===0"));
  assert.equal(await c.eval(shadow+".querySelector('.progress-value').textContent"),'0 XP');
  assert.equal(await c.eval(`getComputedStyle(${shadow}.querySelector('.crumbs button')).borderTopStyle`),'solid');
  assert.match(await c.eval(`getComputedStyle(${shadow}.querySelector('.brand'),'::after').content`),/TRAINER/);
  await c.shot('world-954');
  await c.eval(shadow+".querySelector('.menu').click()");
  assert(await c.eval(`[...${shadow}.querySelectorAll('dialog,button,.menu-mark')].every(e=>getComputedStyle(e).borderTopLeftRadius==='0px')`));await c.shot('menu-954');await c.eval(shadow+".querySelector('.close').click()");
  for(const skill of ['equal','coords']){
   const draft={skill,seed:71,level:1,variant:1,free:true,intro:false,done:false,dirty:false,stage:0,session:null,answer:{strokes:[],values:['',''],point:null,choice:null}};
   const {identifier}=await c.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.clear();localStorage.setItem('axioma-vectorentrainer-v020',${JSON.stringify(JSON.stringify({progress:Core.TrainerScheduler.freshState(),draft}))});`});await load();await c.send('Page.removeScriptToEvaluateOnNewDocument',{identifier});await c.click('#resumeBtn');
   for(const [width,height] of [[1366,768],[954,441],[780,360]])for(const collapsed of [false,true]){
    await c.size(width,height);await c.eval('LeraarBobTopbar.setCollapsed('+collapsed+')');await c.frames();
    const issues=await c.eval(`(()=>{const issues=[],panel=document.querySelector('.exercise-right'),r=panel.getBoundingClientRect(),buttons=[...document.querySelectorAll('#choiceWork button')],grid=getComputedStyle(document.getElementById('choiceWork'));
     if(parseFloat(grid.gap)<10)issues.push('small gap');
     for(const e of buttons){const q=e.getBoundingClientRect();if(q.height<44||q.width<44||q.left<r.left+10||q.right>r.right-10||q.bottom>innerHeight||e.scrollWidth>e.clientWidth+1)issues.push('choice bounds');if(getComputedStyle(e).borderTopLeftRadius!=='0px')issues.push('rounded choice');if(!e.contains(document.elementFromPoint(q.x+q.width/2,q.y+q.height/2)))issues.push('covered choice');}
     if(getComputedStyle(panel).borderTopLeftRadius!=='0px')issues.push('rounded panel');
     const s=document.getElementById('skip');if(s.scrollWidth>s.clientWidth||s.getBoundingClientRect().bottom>innerHeight)issues.push('skip bounds');
     if(document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight)issues.push('page overflow');return issues;
    })()`);assert.deepEqual(issues,[],skill+' '+width+' folded='+collapsed);await c.shot(skill+'-'+width+(collapsed?'-folded':''));
   }
   const task=await c.eval('AxiomaVectorTrainer.inspect().task'),correct=task.options.findIndex(v=>Core.VectorMath.vectorEquals(v,task.target));
   await c.click('[data-choice="'+correct+'"]',true);await c.wait('AxiomaVectorTrainer.inspect().done');
   assert(await c.eval("(()=>{const e=document.getElementById('commit'),r=e.getBoundingClientRect();return !e.hidden&&r.height>=44&&r.bottom<=innerHeight&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})()"),'next remains reachable after choice');
  }
  assert.deepEqual(c.errors,[]);console.log('PASS branded shared header without legacy flash or extra row; square menus; spaced arrow/coordinate choices on desktop and landscape; touch answer and next; both header states');
 }finally{await browser.send('Target.disposeBrowserContext',{browserContextId});c.ws.close();browser.ws.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
