// Actual standalone document and browser input, isolated storage; no backend needed.
const fs=require('node:fs'),assert=require('node:assert/strict');
const C=require('../games/reele-getallen/real-core.js'),{solution}=require('./real-numbers.test.cjs');
class CDP{
 async connect(url){this.ws=new WebSocket(url);this.id=0;this.pending=new Map();this.errors=[];await new Promise(r=>this.ws.onopen=r);this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails)}}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
 async wait(expr){for(let i=0;i<100;i++){if(await this.eval(expr))return;await new Promise(r=>setTimeout(r,30))}throw Error('Timeout '+expr)}
}
const BASE='http://127.0.0.1:8765/games/reele-getallen/';
(async()=>{
 const version=await(await fetch('http://127.0.0.1:9235/json/version')).json(),browser=new CDP();await browser.connect(version.webSocketDebuggerUrl);
 const {browserContextId}=await browser.send('Target.createBrowserContext'),{targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});
 const tabs=await(await fetch('http://127.0.0.1:9235/json')).json(),c=new CDP();await c.connect(tabs.find(t=>t.id===targetId).webSocketDebuggerUrl);
 try{
 await c.send('Page.enable');await c.send('Runtime.enable');await c.send('Network.enable');await c.send('Network.setCacheDisabled',{cacheDisabled:true});
 const ev=x=>c.eval(x),click=s=>ev(`document.querySelector(${JSON.stringify(s)}).click()`);
 const size=async(width,height)=>{await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await new Promise(r=>setTimeout(r,60))};
 await size(640,360);await c.send('Page.navigate',{url:BASE});await c.wait('!!window.AxiomaRealTrainer');
 assert.equal(await ev('document.body.dataset.screen'),'stage');
 const inspect=()=>ev('AxiomaRealTrainer.inspect()');
 async function fixture(skill,opts={}){
  const t=C.generate(skill,{seed:41,level:1,variant:1,...opts}),draft={...t,phase:'answer',answer:C.freshAnswer(t),free:true,session:{answered:0,clean:0,xp:0},...opts};
  const {identifier}=await c.send('Page.addScriptToEvaluateOnNewDocument',{source:`Object.keys(localStorage).filter(k=>k.startsWith('axioma:progress:v2:')).forEach(k=>localStorage.removeItem(k));localStorage.setItem('axioma-real-numbers-v1',${JSON.stringify(JSON.stringify({progress:C.Progress.fresh(),draft}))})`});
  await c.send('Page.reload');await c.wait('!!window.AxiomaRealTrainer');await c.send('Page.removeScriptToEvaluateOnNewDocument',{identifier});await new Promise(r=>setTimeout(r,35));
 }
 async function layout(label){const result=await ev(`(()=>{const w=document.getElementById('workspace');return {bad:[...document.querySelectorAll('#stage button,header button,header a')].filter(e=>e.getClientRects().length&&!e.closest('[hidden]')).map(e=>({text:e.textContent,r:e.getBoundingClientRect().toJSON()})).filter(x=>x.r.x<-.5||x.r.right>innerWidth+.5||x.r.y<-.5||x.r.bottom>innerHeight+.5||x.r.height<43),copies:[...w.querySelectorAll('.lesson-copy,.feedback-copy')].filter(e=>e.scrollHeight>e.clientHeight+2).map(e=>({text:e.textContent,height:e.clientHeight,needed:e.scrollHeight})),overflow:document.documentElement.scrollWidth>innerWidth}})()`);assert.deepEqual(result,{bad:[],copies:[],overflow:false},label)}
 async function enter(values){for(let i=0;i<2;i++){await click(`[data-slot="${i}"]`);for(const digit of values[i])await click(`[data-key="${digit==='-'?'sign':digit}"]`);}}
 async function point(v,t){const q=await ev(`(()=>{const r=document.getElementById('numberline').getBoundingClientRect();return {x:r.x+28+(${v}-(${t.min}))/(${t.max}-(${t.min}))*(r.width-56),y:r.y+r.height*.52}})()`);await c.send('Input.dispatchMouseEvent',{type:'mousePressed',...q,button:'left',clickCount:1});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',...q,button:'left',clickCount:1})}
 async function solve(){const t=(await inspect()).task,a=solution(t);
  if(t.skill==='fraction'){await enter(a.values);if(a.sign<0)await click('[data-key="sign"]');}
  if(t.skill==='compare')await click(`[data-relation="${a.relation}"]`);
  if(t.skill==='line')await point(C.number(t.target),t);
  if(t.skill==='group')for(let i=0;i<6;i++){await click(`[data-select-group="${a.groups[i]}"]`);await click(`[data-token="${i}"]`)}
  if(t.skill==='root'){await enter([String(t.k*t.k),String((t.k+1)**2)]);await click('#commit');assert.equal((await inspect()).phase,'feedback');assert.equal((await inspect()).progress.xp,0);await click('#commit');await enter(a.values);}
  if(t.skill==='interval'){for(let i=0;i<2;i++){await click(`[data-slot="${i}"]`);await point(Number(a.values[i]),t)}if(a.closedLo)await click('[data-toggle="closedLo"]');if(a.closedHi)await click('[data-toggle="closedHi"]');}
  if(t.skill==='classify')for(const id of a.labels)await click(`[data-set="${id}"]`);
  if(t.skill==='period'){await click(`[data-digit="${a.start}"]`);await click(`[data-digit="${a.end}"]`);}
  await click('#commit');assert.equal((await inspect()).phase,'done',t.skill+' solved '+JSON.stringify((await inspect()).answer)+' '+JSON.stringify((await inspect()).feedback));
 }
 for(const width of [640,780]){
  await size(width,360);
  for(const sk of C.skills){await fixture(sk.id);await layout(sk.id+' '+width);await solve();await layout(sk.id+' feedback '+width);assert.equal((await inspect()).progress.xp,0,'free practice earns no XP');
   await fixture(sk.id,{phase:'intro',free:false,level:0});while((await inspect()).phase==='intro'){await layout(sk.id+' intro '+width+' step '+(await inspect()).lessonStep);await click('#commit');}assert.equal((await inspect()).progress.xp,0);
  }
 }
 console.log('PASS: eight exercise families and all lesson steps at 640 and 780 × 360; real controls solve every task');
 await fixture('fraction',{free:false,level:0});let before=await inspect();await enter(['1','0']);await click('#commit');assert.equal((await inspect()).dirty,false,'invalid denominator is not a math error');await click('#commit');await click('[data-slot="0"]');await click('[data-key="clear"]');await click('[data-slot="1"]');await click('[data-key="clear"]');await solve();
 const won=await inspect();assert.equal(won.progress.xp,10);assert.equal(won.session.answered,1);await new Promise(r=>setTimeout(r,1700));assert.equal((await inspect()).task.seed,won.task.seed,'feedback does not auto-advance');
 await c.send('Page.reload');await c.wait('!!window.AxiomaRealTrainer');assert.equal((await inspect()).progress.xp,10);assert.equal((await inspect()).phase,'done');
 await click('#helpNav');await click('#helpTopics button');assert((await inspect()).preview);while((await inspect()).preview)await click('#commit');assert.equal((await inspect()).progress.xp,10);assert.deepEqual((await inspect()).answer,won.answer);
 await fixture('root',{phase:'intro',free:false});await click('#commit');await c.send('Page.reload');await c.wait('!!window.AxiomaRealTrainer');assert.equal((await inspect()).lessonStep,1,'lesson resumes at the same step');
 console.log('PASS: syntax versus content feedback, XP once, no auto-advance, reload and help preserve progress and answers');
 await fixture('fraction',{phase:'intro',free:false,level:0});for(let i=0;i<8;i++){while((await inspect()).phase==='intro')await click('#commit');await solve();await click('#commit');}assert.equal(await ev('document.body.dataset.screen'),'summary');assert.match(await ev('document.getElementById("stats").textContent'),/8geoefend/);
 await fixture('interval',{phase:'intro',free:false});await click('#commit');await click('#commit');await click('#theme');await layout('dark interval intro');let shot=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/real-interval-dark-780.png',Buffer.from(shot.data,'base64'));
 await fixture('fraction');await size(1440,900);await layout('desktop');shot=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/real-fraction-desktop.png',Buffer.from(shot.data,'base64'));
 await size(390,844);assert.equal(await ev('getComputedStyle(document.getElementById("rotate")).display'),'grid');await click('#rotateLibrary');assert.equal(await ev('document.body.dataset.screen'),'library');await click('#helpNav');await click('#helpTopics button');assert.equal(await ev('getComputedStyle(document.getElementById("rotate")).display'),'none','help remains readable in portrait');
 await c.send('Page.navigate',{url:'file:///home/johan/Documenten/GitHub/LeraarBob/games/reele-getallen/index.html'});await c.wait('!!window.AxiomaRealTrainer');
 assert.deepEqual(c.errors,[]);console.log('PASS: adaptive full session, dark mode, desktop, portrait library/help and standalone offline HTML');
 }finally{await browser.send('Target.disposeBrowserContext',{browserContextId});c.ws.close();browser.ws.close()}
})().catch(e=>{console.error(e);process.exit(1)});
