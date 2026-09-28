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
 assert.equal(await ev('document.body.dataset.screen'),'stage');await click('#topicsNav');assert.equal(await ev('document.body.dataset.screen'),'library');assert.equal(await ev('document.querySelectorAll("#topics .topic-card").length'),12);await click('#resume');
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
  if(t.skill==='root'&&!t.directBounds){await enter([String(t.k**(t.degree||2)),String((t.k+1)**(t.degree||2))]);await click('#commit');assert.equal((await inspect()).phase,'feedback');assert.equal((await inspect()).progress.xp,0);await click('#commit');await enter(a.values);}
  if(t.skill==='root'&&t.directBounds)await enter(a.values);
  if(t.skill==='rootcalc'){if(a.noReal)await click('[data-toggle="noReal"]');else {for(const digit of a.values[0])await click(`[data-key="${digit==='-'?'sign':digit==='/'?'slash':digit}"]`);}}
  if(t.skill==='rootsimplify'){for(let i=0;i<2;i++){await click(`[data-slot="${i}"]`);for(const digit of a.values[i])await click(`[data-key="${digit==='-'?'sign':digit==='/'?'slash':digit}"]`);}}
  if(t.skill==='interval'){if(t.hi===null)await click('[data-infinity="inf"]');else {await point(t.hi,t);if(a.closedHi)await point(t.hi,t);}if(t.lo===null)await click('[data-infinity="-inf"]');else {await point(t.lo,t);if(a.closedLo)await point(t.lo,t);}}
  if(t.skill==='sets')for(let i=0;i<t.tokens.length;i++){await click(`[data-sort-token="${i}"]`);await click(`[data-zone="${a.placements[i]}"]`);}
  if(t.skill==='decimaltype')await click(`[data-decimal-type="${a.decimalType}"]`);
  if(t.skill==='classify')for(const id of a.labels)await click(`[data-set="${id}"]`);
  if(t.skill==='period'){await click(`[data-digit="${a.start}"]`);if(a.end!==a.start)await click(`[data-digit="${a.end}"]`);}
  await click('#commit');assert.equal((await inspect()).phase,'done',t.skill+' solved '+JSON.stringify((await inspect()).answer)+' '+JSON.stringify((await inspect()).feedback));
 }
 // Topic choice uses the same XP and learning model, preserving the pending route.
 await fixture('fraction',{free:false});await click('[data-key="2"]');
 const series=await inspect();
 await click('#topicsNav');await click('#topics .topic-card:nth-child(2) button');
 assert.equal((await inspect()).topic,C.skills[1].id);await layout('chosen topic with route button');
 while((await inspect()).phase==='intro')await click('#commit');
 await solve();const chosen=await inspect();assert(chosen.progress.xp>0);assert.equal(chosen.session.answered,1);
 await c.send('Page.reload');await c.wait('!!window.AxiomaRealTrainer');
 assert.equal((await inspect()).topic,chosen.topic);assert.equal((await inspect()).progress.xp,chosen.progress.xp);
 await click('#seriesReturn');let resumed=await inspect();
 assert.equal(resumed.topic,null);assert.deepEqual(resumed.task,series.task);assert.deepEqual(resumed.answer,series.answer);
 assert.deepEqual(resumed.session,chosen.session,'topic work counts in the same series');
 await click('#topicsNav');await click('#topics .topic-card:nth-child(2) button');const selected=await inspect();
 await click('#helpNav');await click('#helpTopics button');await click('#playNav');
 resumed=await inspect();assert.equal(resumed.topic,selected.topic);assert.equal(resumed.preview,null);assert.deepEqual(resumed.answer,selected.answer);
 await click('#topicsNav');await click('#resume');assert.equal((await inspect()).topic,selected.topic);
 await fixture('fraction');assert.equal((await inspect()).topic,'fraction','legacy free draft becomes a tracked chosen topic');
 await solve();assert((await inspect()).progress.xp>0,'legacy free draft now awards XP');
 const earned=(await inspect()).progress.xp;await c.send('Page.reload');await c.wait('!!window.AxiomaRealTrainer');
 assert.equal((await inspect()).progress.xp,earned);await click('#commit');assert.equal((await inspect()).progress.xp,earned,'completed task earns XP once');
 await click('#seriesReturn');assert.equal((await inspect()).topic,null,'learner can follow the route without a suspended draft');
 await fixture('compare',{session:{answered:7,clean:7,xp:70}});await solve();await click('#seriesReturn');
 assert.equal(await ev('document.body.dataset.screen'),'summary','returning to the route after task eight closes the series');
 assert(!await ev('document.body.innerText.includes("Vrij oefenen")'),'no separate free practice mode');
 console.log('PASS: chosen topics earn XP, survive reload, preserve route answers and shared session totals; legacy free drafts migrate; help and resume preserve topic');
 for(const width of [640,780]){
  await size(width,360);
  for(const sk of C.skills){await fixture(sk.id);await layout(sk.id+' '+width);await solve();await layout(sk.id+' feedback '+width);if(sk.id==='period')assert(!await ev('!!document.querySelector(".feedback-picture mover")'),'standard period uses three repetitions and ellipsis');assert((await inspect()).progress.xp>0,'chosen topics earn XP');
   await fixture(sk.id,{phase:'intro',free:false,level:0});const exampleSignature=(await inspect()).task.signature;while((await inspect()).phase==='intro'){await layout(sk.id+' intro '+width+' step '+(await inspect()).lessonStep);await click('#commit');}assert.equal((await inspect()).progress.xp,0);assert.notEqual((await inspect()).task.signature,exampleSignature,'independent task differs from worked example');
  }
 }
 // New families and representations: actual drag input, unbounded rays and roots.
 for(const width of [640,780]){
  await size(width,360);
  for(let variant=0;variant<12;variant++){
   await fixture('interval',{variant});await layout('interval '+variant+' at '+width);await solve();
   await fixture('decimaltype',{variant});await layout('decimal type '+variant);await solve();
   await fixture('rootcalc',{variant,level:2});await layout('exact root '+variant);await solve();await layout('exact root feedback '+variant);
   await fixture('rootcalc',{variant,level:2,phase:'intro'});while((await inspect()).phase==='intro'){await layout('exact root lesson '+variant);await click('#commit');}
  }
  for(let variant=0;variant<6;variant++){
   await fixture('rootsimplify',{variant,level:2});await layout('simplify root '+variant);await solve();await layout('simplify feedback '+variant);
   if(variant===4&&width===640){const shot=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/real-simplify-fraction.png',Buffer.from(shot.data,'base64'));}
   await fixture('rootsimplify',{variant,level:2,phase:'intro'});while((await inspect()).phase==='intro'){await layout('simplify root lesson '+variant);await click('#commit');}
  }
  for(const variant of [1,2]){
   await fixture('root',{variant,level:1});await solve();
   await fixture('root',{variant,level:1,phase:'intro'});while((await inspect()).phase==='intro'){await layout('signed root lesson '+variant);await click('#commit');}
  }
 }
 await fixture('sets',{free:false});let sorting=(await inspect()).task;
 const center=async selector=>ev(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 for(let i=0;i<sorting.tokens.length;i++){
  const from=await center(`[data-sort-token="${i}"]`),to=await center(`[data-zone="${sorting.target[i]}"]`);
  if(i%2){await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[to]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  else {await c.send('Input.dispatchMouseEvent',{type:'mousePressed',...from,button:'left',clickCount:1});await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...to,buttons:1});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',...to,button:'left',clickCount:1});}
  assert.equal((await inspect()).answer.placements[i],sorting.target[i],'dragged token '+i);
 }
 let capture=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/real-nested-sets.png',Buffer.from(capture.data,'base64'));
 await c.send('Page.reload');await c.wait('!!window.AxiomaRealTrainer');assert.deepEqual((await inspect()).answer.placements,sorting.target);await click('#commit');assert.equal((await inspect()).phase,'done');assert.equal((await inspect()).progress.xp,12);
 await fixture('interval',{variant:4});let ray=(await inspect()).task;await point(ray.lo,ray);await click('[data-infinity="inf"]');
 await c.send('Page.reload');await c.wait('!!window.AxiomaRealTrainer');assert.deepEqual((await inspect()).answer.values,[String(ray.lo),'inf']);
 capture=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/real-unbounded-interval.png',Buffer.from(capture.data,'base64'));await click('#commit');assert.equal((await inspect()).phase,'done');
 await fixture('decimaltype',{variant:7});assert(await ev('!!document.querySelector("mroot")'),'cube root has a native root index');await click('[data-decimal-type="irr"]');capture=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/real-decimal-type.png',Buffer.from(capture.data,'base64'));
 await fixture('root',{contentVersion:1,variant:2,answer:{...C.freshAnswer({skill:'root'}),values:['4','9']}});assert.equal((await inspect()).task.degree,undefined,'old root tasks keep their question');assert.deepEqual((await inspect()).answer.values,['4','9']);
 console.log('PASS: all interval/decimal variants, signed-root lessons, actual mouse/touch sorting, native cube roots, XP and restored new/legacy drafts');
 // Direct interval construction, with both orders and all four endpoint combinations.
 for(const variant of [0,1,2,3])for(const reverse of [false,true]){
  await fixture('interval',{variant,contentVersion:1});const t=(await inspect()).task;
  for(const v of reverse?[t.hi,t.lo]:[t.lo,t.hi]){await point(v,t);if(v===t.lo?t.closedLo:t.closedHi)await point(v,t);}
  assert.deepEqual((await inspect()).answer.values,[String(t.lo),String(t.hi)]);
  await click('#commit');assert.equal((await inspect()).phase,'done','both interval orders '+variant);
 }
 await fixture('interval');let t=(await inspect()).task;
 await point(2,t);await point(2,t);const lone=(await inspect()).answer;
 await c.send('Page.reload');await c.wait('!!window.AxiomaRealTrainer');assert.deepEqual((await inspect()).answer,lone,'first closed endpoint survives reload');
 await point(-2,t);assert.deepEqual((await inspect()).answer.values,['-2','2']);assert.equal((await inspect()).answer.closedHi,true);
 const lineXY=async v=>ev(`(()=>{const r=document.getElementById('numberline').getBoundingClientRect();return {x:r.x+28+(${v}-AxiomaRealTrainer.inspect().task.min)/(AxiomaRealTrainer.inspect().task.max-AxiomaRealTrainer.inspect().task.min)*(r.width-56),y:r.y+r.height*.52}})()`);
 const from=await lineXY(2),to=await lineXY(-3);
 await c.send('Input.dispatchMouseEvent',{type:'mousePressed',...from,button:'left',clickCount:1});await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...to,buttons:1});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',...to,button:'left',clickCount:1});
 assert.deepEqual((await inspect()).answer.values,['-3','-2']);assert.equal((await inspect()).answer.closedLo,true,'closed circle travels with dragged endpoint');assert.equal((await inspect()).answer.closedHi,false);
 const savedInterval=(await inspect()).answer;await c.send('Input.dispatchMouseEvent',{type:'mousePressed',...await lineXY(-3),button:'left',clickCount:1});await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...await lineXY(4),buttons:1});await ev('document.getElementById("numberline").dispatchEvent(new PointerEvent("pointercancel"))');await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',...await lineXY(4),button:'left',clickCount:1});assert.deepEqual((await inspect()).answer,savedInterval);
 await click('[data-reset="interval"]');assert.deepEqual((await inspect()).answer.values,['','']);
 // Actual pointer/touch input, not programmatic clicks: one digit is already complete.
 const seedFor=repeat=>Array.from({length:100},(_,i)=>i+1).find(seed=>C.generate('period',{seed,level:1}).repeat===repeat);
 const digitXY=async i=>ev(`(()=>{const r=document.querySelector('[data-digit="${i}"]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 await fixture('period',{seed:seedFor('3')});const q=await digitXY(0);
 await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[q]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert.equal((await inspect()).answer.start,0);assert.equal((await inspect()).answer.end,0);await click('#commit');assert.equal((await inspect()).phase,'done','one touch selects the period 3');
 await fixture('period',{seed:seedFor('27')});t=(await inspect()).task;
 const last=await digitXY(t.target.end),first=await digitXY(t.target.start);
 await c.send('Input.dispatchMouseEvent',{type:'mousePressed',...last,button:'left',clickCount:1});await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...first,buttons:1});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',...first,button:'left',clickCount:1});
 assert.equal((await inspect()).answer.start,t.target.start);assert.equal((await inspect()).answer.end,t.target.end);
 await c.send('Page.reload');await c.wait('!!window.AxiomaRealTrainer');assert.equal((await inspect()).answer.end,t.target.end);await click('#commit');assert.equal((await inspect()).phase,'done','reverse drag selects a period');
 await fixture('period',{seed:seedFor('27')});t=(await inspect()).task;
 for(const i of [t.target.end,t.target.start]){const pos=await digitXY(i);await c.send('Input.dispatchMouseEvent',{type:'mousePressed',...pos,button:'left',clickCount:1});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',...pos,button:'left',clickCount:1});}
 assert.equal((await inspect()).answer.start,t.target.start);assert.equal((await inspect()).answer.end,t.target.end);await layout('period reverse taps');
 const periodShot=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/real-period-direct.png',Buffer.from(periodShot.data,'base64'));
 await click('[data-reset="period"]');assert.equal((await inspect()).answer.start,null);
 console.log('PASS: interval taps in either order, open/closed toggles, crossing drag, cancel and reload; single-touch period, reverse drag and reverse taps');
 await fixture('line');await ev('document.getElementById("numberline").focus()');for(let i=0;i<2;i++)await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight'});assert.equal(await ev('document.activeElement.id'),'numberline','keyboard focus stays on the replacement line');const cursor=(await inspect()).answer.tick;assert(cursor!==null);
 const lineRect=await ev('document.getElementById("numberline").getBoundingClientRect().toJSON()');await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x:lineRect.x+30,y:lineRect.y+45,button:'left',clickCount:1});await ev('document.getElementById("numberline").dispatchEvent(new PointerEvent("pointercancel"))');await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:lineRect.x+30,y:lineRect.y+45,button:'left',clickCount:1});assert.equal((await inspect()).answer.tick,cursor,'cancel restores previous placement');
 await fixture('group');for(let i=0;i<6;i++)await click(`[data-token="${i}"]`);await click('#commit');assert.equal((await inspect()).phase,'feedback');assert.equal((await inspect()).progress.skills.group.repair,'equivalence','chosen-topic error recorded before task completion');await layout('group error context');assert.equal(await ev('document.querySelectorAll(".feedback-picture math").length'),2,'the incorrect pair stays visible');
 await fixture('fraction',{free:false});await click('[data-key="2"]');const partial=(await inspect()).answer;await c.send('Page.reload');await c.wait('!!window.AxiomaRealTrainer');assert.deepEqual((await inspect()).answer,partial,'unfinished draft survives reload');await click('#helpNav');await click('#helpTopics button');while((await inspect()).preview)await click('#commit');assert.deepEqual((await inspect()).answer,partial);assert.equal((await inspect()).progress.xp,0);
 console.log('PASS: twelve exercise families and all lesson steps at 640 and 780 × 360; real controls solve every task');
 await fixture('fraction',{free:false,level:0});let before=await inspect();await enter(['1','0']);await click('#commit');assert.equal((await inspect()).dirty,false,'invalid denominator is not a math error');await click('#commit');await click('[data-slot="0"]');await click('[data-key="clear"]');await click('[data-slot="1"]');await click('[data-key="clear"]');await solve();
 const won=await inspect();assert.equal(won.progress.xp,10);assert.equal(won.session.answered,1);await new Promise(r=>setTimeout(r,1700));assert.equal((await inspect()).task.seed,won.task.seed,'feedback does not auto-advance');
 await c.send('Page.reload');await c.wait('!!window.AxiomaRealTrainer');assert.equal((await inspect()).progress.xp,10);assert.equal((await inspect()).phase,'done');
 await click('#helpNav');await click('#helpTopics button');assert((await inspect()).preview);while((await inspect()).preview)await click('#commit');assert.equal((await inspect()).progress.xp,10);assert.deepEqual((await inspect()).answer,won.answer);
 await fixture('root',{phase:'intro',free:false});await click('#commit');await c.send('Page.reload');await c.wait('!!window.AxiomaRealTrainer');assert.equal((await inspect()).lessonStep,1,'lesson resumes at the same step');
 console.log('PASS: syntax versus content feedback, XP once, no auto-advance, reload and help preserve progress and answers');
 await fixture('fraction',{phase:'intro',free:false,level:0});for(let i=0;i<8;i++){while((await inspect()).phase==='intro')await click('#commit');await solve();await click('#commit');}assert.equal(await ev('document.body.dataset.screen'),'summary');assert.match(await ev('document.getElementById("stats").textContent'),/8geoefend/);
 await click('#helpNav');await click('#helpTopics button');assert(await ev('!!document.querySelector(".lesson-copy")'),'examples work after a completed session');while((await inspect()).preview)await click('#commit');assert.equal(await ev('document.body.dataset.screen'),'help');
 await fixture('interval',{phase:'intro',free:false});await click('#commit');await click('#commit');await click('#theme');await layout('dark interval intro');let shot=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/real-interval-dark-780.png',Buffer.from(shot.data,'base64'));
 await fixture('fraction');await size(1440,900);await layout('desktop');shot=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/real-fraction-desktop.png',Buffer.from(shot.data,'base64'));
 await size(390,844);assert.equal(await ev('getComputedStyle(document.getElementById("rotate")).display'),'grid');await click('#rotateLibrary');assert.equal(await ev('document.body.dataset.screen'),'library');await click('#helpNav');await click('#helpTopics button');assert.equal(await ev('getComputedStyle(document.getElementById("rotate")).display'),'none','help remains readable in portrait');
 await c.send('Page.navigate',{url:'file:///home/johan/Documenten/GitHub/LeraarBob/games/reele-getallen/index.html'});await c.wait('!!window.AxiomaRealTrainer');
 assert.deepEqual(c.errors,[]);console.log('PASS: adaptive full session, dark mode, desktop, portrait library/help and standalone offline HTML');
 }finally{await browser.send('Target.disposeBrowserContext',{browserContextId});c.ws.close();browser.ws.close()}
})().catch(e=>{console.error(e);process.exit(1)});
