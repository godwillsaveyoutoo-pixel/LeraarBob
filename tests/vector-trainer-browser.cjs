// Actual standalone document and browser input, isolated storage; no backend needed.
const fs=require('node:fs'),assert=require('node:assert/strict');
const Core=require('../games/vectoren/vector-core.js');
class CDP{
 async connect(url){this.ws=new WebSocket(url);this.id=0;this.pending=new Map();this.errors=[];await new Promise(r=>this.ws.onopen=r);this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails)}}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
 async wait(expr){for(let i=0;i<100;i++){if(await this.eval(expr))return;await new Promise(r=>setTimeout(r,30))}throw Error('Timeout '+expr)}
}
const BASE='http://127.0.0.1:8765/games/vectoren/Axioma_Vectorentrainer_v0.2.html';
(async()=>{
 const version=await(await fetch('http://127.0.0.1:9235/json/version')).json(),browser=new CDP();await browser.connect(version.webSocketDebuggerUrl);
 const {browserContextId}=await browser.send('Target.createBrowserContext'),{targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});
 const tabs=await(await fetch('http://127.0.0.1:9235/json')).json(),c=new CDP();await c.connect(tabs.find(t=>t.id===targetId).webSocketDebuggerUrl);
 await c.send('Page.enable');await c.send('Runtime.enable');await c.send('Network.enable');await c.send('Network.setCacheDisabled',{cacheDisabled:true});
 const size=async(w,h)=>{await c.send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:false});await new Promise(r=>setTimeout(r,70))};
 await size(780,360);await c.send('Page.navigate',{url:BASE});await c.wait('!!window.AxiomaVectorTrainer');
 const ev=x=>c.eval(x),click=id=>ev(`document.getElementById(${JSON.stringify(id)}).click()`);
 async function fixture(id,opts={}){
  const draft={skill:id,level:1,variant:1,seed:51,free:true,intro:false,done:false,dirty:false,stage:0,session:null,answer:{strokes:[],values:['',''],point:null},...opts};
  const {identifier}=await c.send('Page.addScriptToEvaluateOnNewDocument',{source:`Object.keys(localStorage).filter(k=>k.startsWith('axioma:progress:v2:')).forEach(k=>localStorage.removeItem(k));localStorage.setItem('axioma-vectorentrainer-v020',${JSON.stringify(JSON.stringify({progress:Core.TrainerScheduler.freshState(),draft}))})`});
  await c.send('Page.reload');await c.wait(`!!window.AxiomaVectorTrainer&&!document.getElementById('resumeBtn').hidden`);await c.send('Page.removeScriptToEvaluateOnNewDocument',{identifier});await click('resumeBtn');await c.wait(`!document.getElementById('play').hidden&&(AxiomaVectorTrainer.inspect().task.representation==='symbolic'||AxiomaVectorTrainer.inspect().view.unit>0)`);
 }
 async function layout(label){
  const state=await ev(`(()=>{const play=document.getElementById('play'),board=document.getElementById('board'),footer=document.querySelector('footer'),prompt=document.querySelector('.questionbar');const r=x=>{const b=x.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,b:b.bottom,r:b.right}};return {pageOverflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,play:r(play),board:r(board),footer:r(footer),prompt:r(prompt),buttons:[...play.querySelectorAll('button')].filter(x=>x.getClientRects().length&&!x.closest('[hidden]')).map(x=>({id:x.id||x.dataset.key,...r(x)})),unit:AxiomaVectorTrainer.inspect().view.unit}})()`);
  assert.equal(state.pageOverflow,false,label+' page overflow');assert(state.footer.b<=361,label+' footer');
  for(const b of state.buttons){assert(b.x>=0&&b.r<=781&&b.y>=0&&b.b<=361,label+' unreachable '+b.id);assert(b.h>=40,label+' small target '+b.id)}
  if(state.board.w>0){assert(state.board.h>=130,label+' usable board height');assert(state.board.b<=state.footer.y+1,label+' board/footer overlap');}
 }
 async function xy(p){return ev(`(()=>{const p=AxiomaVectorTrainer.project(${JSON.stringify(p)}),r=document.getElementById('board').getBoundingClientRect();return {x:p.x+r.x,y:p.y+r.y}})()`)}
 async function tap(p){const q=await xy(p);await c.send('Input.dispatchMouseEvent',{type:'mousePressed',...q,button:'left',clickCount:1});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',...q,button:'left',clickCount:1})}
 async function draw(start,end,role='vector',drag=false){
  if(role==='result')await click('resultTool');else if(await ev(`!document.getElementById('vectorTool').hidden`))await click('vectorTool');
  if(drag){const a=await xy(start),b=await xy(end);await c.send('Input.dispatchMouseEvent',{type:'mousePressed',...a,button:'left',clickCount:1});await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...b,button:'left',buttons:1});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',...b,button:'left',clickCount:1})}else{await tap(start);await tap(end)}
 }
 async function enter(values){for(let i=0;i<2;i++){await click(i?'slotY':'slotX');for(const char of values[i])await ev(`document.querySelector('[data-key="${char==='-'?'sign':char}"]').click()`);}}
 assert.equal(await ev('document.body.dataset.screen'),'play','opening starts a session immediately');
 await fixture('free');await layout('free');let t=await ev('AxiomaVectorTrainer.inspect().task');
 await draw(t.start,Core.VectorMath.endPointFromVector(t.start,t.target),'vector',true);assert.equal(await ev('AxiomaVectorTrainer.inspect().done'),false,'no live answer validation');await click('commit');assert(await ev('AxiomaVectorTrainer.inspect().done'));
 await fixture('free');t=await ev('AxiomaVectorTrainer.inspect().task');await draw(t.start,Core.VectorMath.endPointFromVector(t.start,t.target));
 const beforeHelp=await ev('AxiomaVectorTrainer.inspect().answer');await click('helpBtn');assert.equal(await ev('document.body.dataset.screen'),'helpScreen');await click('closeHelp');assert.deepEqual(await ev('AxiomaVectorTrainer.inspect().answer'),beforeHelp);
 await click('progressBtn');await click('closeProgress');assert.deepEqual(await ev('AxiomaVectorTrainer.inspect().answer'),beforeHelp);
 await fixture('equal',{variant:1});t=await ev('AxiomaVectorTrainer.inspect().task');assert.equal(t.interaction,'choice');await layout('recognition');
 const wrong=t.options.findIndex(v=>!Core.VectorMath.vectorEquals(v,t.target)),right=t.options.findIndex(v=>Core.VectorMath.vectorEquals(v,t.target));
 await ev(`document.querySelector('[data-choice="${wrong}"]').click()`);assert(await ev('AxiomaVectorTrainer.inspect().dirty'));assert.equal(await ev('AxiomaVectorTrainer.inspect().done'),false);
 await ev(`document.querySelector('[data-choice="${right}"]').click()`);assert(await ev('AxiomaVectorTrainer.inspect().done'));
 console.log('PASS: immediate entry, help/progress preserve answers, mixed recognition and mistake feedback');
 await fixture('scalar',{level:2,variant:1});t=await ev('AxiomaVectorTrainer.inspect().task');await draw(t.start,Core.VectorMath.endPointFromVector(t.start,t.target));await click('commit');assert(await ev('AxiomaVectorTrainer.inspect().done'));
 await fixture('headtail',{level:1,variant:0});t=await ev('AxiomaVectorTrainer.inspect().task');const mid=Core.VectorMath.endPointFromVector(t.start,t.parts[1]),end=Core.VectorMath.endPointFromVector(mid,t.parts[0]);await draw(mid,end);await draw(t.start,mid);await draw(t.start,end,'result');await click('commit');assert(await ev('AxiomaVectorTrainer.inspect().done'),'reverse construction accepted');
 await fixture('parallelogram');t=await ev('AxiomaVectorTrainer.inspect().task');const e=Core.VectorMath.endPointFromVector(t.start,t.target);await draw(t.start,e,'result');await click('commit');assert.match(await ev(`document.getElementById('feedback').textContent`),/resultante klopt/);assert.equal(await ev('AxiomaVectorTrainer.inspect().done'),false);
 await draw(Core.VectorMath.endPointFromVector(t.start,t.parts[0]),e);await draw(Core.VectorMath.endPointFromVector(t.start,t.parts[1]),e);await click('commit');assert(await ev('AxiomaVectorTrainer.inspect().done'));
 await fixture('coordscale',{level:2});await layout('arithmetic');t=await ev('AxiomaVectorTrainer.inspect().task');await enter([String(t.target.dx),String(t.target.dy)]);await click('commit');assert(await ev('AxiomaVectorTrainer.inspect().done'));
 await fixture('coordscale',{level:2});await enter(['-1/2','-3']);assert.deepEqual(await ev('AxiomaVectorTrainer.inspect().answer.values'),['-1/2','-3']);await ev(`document.querySelector('[data-key="back"]').click()`);assert.deepEqual(await ev('AxiomaVectorTrainer.inspect().answer.values'),['-1/2','-']);
 await c.send('Page.reload');await c.wait('!!window.AxiomaVectorTrainer');await click('resumeBtn');assert.deepEqual(await ev('AxiomaVectorTrainer.inspect().answer.values'),['-1/2','-'],'draft resumes after reload');
 await fixture('opposite',{variant:3});t=await ev('AxiomaVectorTrainer.inspect().task');const zero=await xy(t.start);for(let i=0;i<2;i++){await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[zero]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}await click('commit');assert(await ev('AxiomaVectorTrainer.inspect().done'),'touch zero vector');
 console.log('PASS: drag, tap-tap, no live leakage, reversed head-tail, incomplete method, arithmetic keypad, fractions and draft restore');
 // Guided steps use the same drawing handlers and only score the whole task once.
 await fixture('headtail',{level:0,free:false,session:{answered:0,clean:0,repairs:0}});t=await ev('AxiomaVectorTrainer.inspect().task');
 const guidedMid=Core.VectorMath.endPointFromVector(t.start,t.parts[0]),guidedEnd=Core.VectorMath.endPointFromVector(guidedMid,t.parts[1]);
 await draw(t.start,guidedMid);await click('commit');assert.equal(await ev('AxiomaVectorTrainer.inspect().stage'),1);
 await draw(guidedMid,guidedEnd);await click('commit');assert.equal(await ev('AxiomaVectorTrainer.inspect().stage'),2);
 await draw(t.start,guidedEnd,'result');await click('commit');assert.equal(await ev('AxiomaVectorTrainer.inspect().session.answered'),1);
 await click('libraryBtn');await click('startBtn');
 for(let i=0;i<12;i++){
  if(await ev('AxiomaVectorTrainer.inspect().intro'))await click('commit');
  t=await ev('AxiomaVectorTrainer.inspect().task');
  assert(['properties','free'].includes(t.policy),'early session uses introductory construction');
  if(t.interaction==='choice'){const choice=t.options.findIndex(v=>Core.VectorMath.vectorEquals(v,t.target));await ev(`document.querySelector('[data-choice="${choice}"]').click()`)}else{await draw(t.start,Core.VectorMath.endPointFromVector(t.start,t.target));await click('commit');}
  assert(await ev('AxiomaVectorTrainer.inspect().done'),'complete session exercise '+i);await click('commit');
 }
 assert.equal(await ev('document.body.dataset.screen'),'summary');assert.match(await ev(`document.getElementById('summaryStats').textContent`),/12geoefend/);
 console.log('PASS: guided construction counts once; 12-question adaptive session reaches summary');
 for(const sk of Core.TaskGenerator.skills){await fixture(sk.id);await layout(sk.id);}
 for(const id of ['free','headtail','coords','coordadd','coordscale','route']){await fixture(id,{level:0,intro:true,free:false,session:{answered:0,clean:0,repairs:0}});await layout(id+' intro');if(id==='coords'){const shot=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/vector-v02-intro-780.png',Buffer.from(shot.data,'base64'))}await click('commit');await layout(id+' guided');}
 await fixture('coordcombo');await click('themeBtn');const dark=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/vector-v02-arithmetic-dark-780.png',Buffer.from(dark.data,'base64'));
 await fixture('headtail');const grid=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/vector-v02-grid-780.png',Buffer.from(grid.data,'base64'));
 await size(390,844);assert.equal(await ev(`getComputedStyle(document.getElementById('rotate')).display`),'grid');await click('rotateHome');assert.equal(await ev(`getComputedStyle(document.getElementById('rotate')).display`),'none');assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false);
 await size(1440,900);await fixture('decompose');const desktop=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/vector-v02-desktop.png',Buffer.from(desktop.data,'base64'));
 await c.send('Page.navigate',{url:'file:///home/johan/Documenten/GitHub/LeraarBob/games/vectoren/Axioma_Vectorentrainer_v0.2.html'});await c.wait(`location.protocol==='file:'&&!!window.AxiomaVectorTrainer`);assert.equal(await ev('document.body.dataset.screen'),'play');
 assert.deepEqual(c.errors,[]);console.log('PASS: standalone file opens without a server');console.log('PASS: all 24 families at 780×360, guided/intro layouts, dark mode, portrait home, desktop; no console errors');
 await browser.send('Target.disposeBrowserContext',{browserContextId});c.ws.close();browser.ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
