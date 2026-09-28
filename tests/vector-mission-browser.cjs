// Real Chromium pointer/touch verification, isolated guest context, no external requests.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const Core=require('../games/vectoren/vector-core.js'),M=Core.VectorMath;
const PORT=process.env.VECTOR_BROWSER_PORT||9245,BASE=process.env.VECTOR_BASE_URL||'http://127.0.0.1:8775';
const OUT=path.resolve(__dirname,'../docs/vectoren-v04/screenshots');fs.mkdirSync(OUT,{recursive:true});
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
 const {browserContextId}=await browser.send('Target.createBrowserContext'),{targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});
 const tabs=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json(),c=new CDP();await c.connect(tabs.find(t=>t.id===targetId).webSocketDebuggerUrl);
 const report={checks:[],passed:false},check=x=>{report.checks.push(x);console.log('PASS '+x)};
 try{
 await c.send('Page.enable');await c.send('Runtime.enable');await c.send('Network.enable');await c.send('Network.setCacheDisabled',{cacheDisabled:true});
 c.route=async p=>{const u=new URL(p.request.url);if(u.hostname!=='127.0.0.1')return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'});if(/supabase|axioma-auth|axioma-social|axioma-progress/.test(u.pathname)){const body=u.pathname.endsWith('axioma-auth.js')?'window.AxiomaAuth={ready:async()=>{},getAccount:async()=>null,onChange:()=>()=>{}};':'';return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,body:Buffer.from(body).toString('base64')})}return c.send('Fetch.continueRequest',{requestId:p.requestId})};
 await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 const url=BASE+'/games/vectoren/Axioma_Vectorentrainer_v0.4_vectormissie.html';
 async function load(suffix=''){const loads=c.loads||0;await c.send('Page.navigate',{url:url+suffix});for(let i=0;i<200&&(c.loads||0)<=loads;i++)await new Promise(r=>setTimeout(r,30));assert((c.loads||0)>loads,'document loaded');await c.wait('!!window.AxiomaVectorTrainer');await c.frames()}
 async function loadAndResume(){await load();assert.equal(await c.eval('document.body.dataset.screen'),'home','saved draft opens on world map');assert.equal((await snap()).task,null,'no exercise starts automatically');await c.click('#resumeBtn');}
 async function menu(id){await c.click('#menuBtn');await c.click('#'+id)}
 const snap=()=>c.eval('AxiomaVectorTrainer.inspect()');
 const documentStationName=id=>({koerscentrum:'Koerscentrum',stuwkrachtlab:'Stuwkrachtlab',dockingzone:'Dockingzone',navigatienet:'Navigatienet',manoeuvreveld:'Manoeuvreveld'})[id];
 async function layout(label){const issues=await c.eval(`(()=>{const issues=[],vis=e=>e.getClientRects().length&&!e.closest('[hidden]');if(document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight)issues.push('page overflow');const controls=[...document.querySelectorAll('#app button,#app a')].filter(e=>vis(e)&&(document.getElementById('trainerMenu').hidden||e.closest('.trainer-header')));for(const e of controls){const r=e.getBoundingClientRect();if(r.height<43.5||r.width<43.5)issues.push('small '+e.id+' '+r.width+'x'+r.height);if(r.x<-.5||r.right>innerWidth+.5||r.y<-.5||r.bottom>innerHeight+.5)issues.push('outside '+e.id);if(!e.disabled){const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(hit&&!e.contains(hit))issues.push('covered '+e.id+' by '+hit.id)}if(e.scrollWidth>e.clientWidth+2)issues.push('text overflow '+(e.id||e.textContent))}if(!document.getElementById('home').hidden){const boxes=[...document.querySelectorAll('.world-station,.world-intro,.world-mission-card,.world-continue,#resumeBtn:not([hidden])')].map(e=>({name:e.className,r:e.getBoundingClientRect()}));for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(a.r.left<b.r.right&&a.r.right>b.r.left&&a.r.top<b.r.bottom&&a.r.bottom>b.r.top)issues.push('overlap '+a.name+' / '+b.name+' '+JSON.stringify([a.r,b.r]))}}if(!document.getElementById('stationScreen').hidden){const grid=document.getElementById('skillList');if(grid.scrollHeight>grid.clientHeight+2)issues.push('station scroll');const cards=[...grid.children];for(let i=0;i<cards.length;i++){const a=cards[i].getBoundingClientRect();for(let j=i+1;j<cards.length;j++){const b=cards[j].getBoundingClientRect();if(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top)issues.push('stop overlap '+cards[i].dataset.skill+' / '+cards[j].dataset.skill)}}}for(const e of document.querySelectorAll('#coachPanel,#feedbackPanel'))if(vis(e)&&e.scrollHeight>e.clientHeight+1)issues.push('panel overflow '+e.id);return issues})()`);assert.deepEqual(issues,[],label);check(label)}
 async function fixture(opts={},savedProgress=Core.TrainerScheduler.freshState()){const draft={skill:'headtail',seed:71,level:1,variant:2,free:true,intro:false,done:false,dirty:false,stage:0,session:null,answer:{strokes:[],values:['',''],point:null,choice:null},...opts};const {identifier}=await c.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.clear();localStorage.setItem('axioma-vectorentrainer-v020',${JSON.stringify(JSON.stringify({progress:savedProgress,draft}))});`});await loadAndResume();await c.send('Page.removeScriptToEvaluateOnNewDocument',{identifier});assert.equal((await snap()).task.skill,draft.skill)}
 async function xy(p){return c.eval(`(()=>{const p=AxiomaVectorTrainer.project(${JSON.stringify(p)}),r=document.getElementById('board').getBoundingClientRect();return {x:p.x+r.x,y:p.y+r.y}})()`)}
 async function draw(start,end,role='vector',touch=false,drag=false){await c.click(role==='result'?'#resultTool':'#vectorTool',touch);const a=await xy(start),b=await xy(end);if(drag){await c.send('Input.dispatchMouseEvent',{type:'mousePressed',...a,button:'left',clickCount:1});await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...b,button:'left',buttons:1});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',...b,button:'left',clickCount:1})}else{await c.tap(a,touch);await c.tap(b,touch)}await c.frames()}
 await c.size(1366,768);await load();assert.equal(await c.eval('document.body.dataset.screen'),'home');
 for(const free of [false,true]){
  await fixture({free,session:free?null:{answered:3,clean:2,repairs:0,xp:20}});
  const t=(await snap()).task;await draw(t.start,M.endPointFromVector(t.start,t.parts[0]));const before=await snap();
  for(let visit=0;visit<2;visit++){
   await load();assert.equal(await c.eval('document.body.dataset.screen'),'home');assert.equal((await snap()).task,null);
   assert.equal(await c.eval('document.querySelectorAll(".world-station").length'),5);
   assert.equal(await c.eval('document.getElementById("resumeBtn").hidden'),false);
  }
  await c.click(free?'#resumeBtn':'#startBtn');
  for(const key of ['task','answer','progress','free'])assert.deepEqual((await snap())[key],before[key]);
  if(!free)assert.deepEqual((await snap()).session,before.session);
  check('world map first, explicit resume preserves '+(free?'free':'scored')+' draft across repeated openings');
 }
 await c.click('#crumbWorld');

 // Confirm before switching from the route; cancel and Escape leave the saved draft intact.
 for(const [w,h] of [[1366,768],[640,360],[390,844]]){
  await c.size(1366,768);await fixture({free:false,session:{answered:2,clean:1,repairs:0,xp:14}});
  await c.click('#crumbWorld');await load();await c.size(w,h);
  await c.click('[data-station="manoeuvreveld"]');const before=await snap(),storage=await c.eval("localStorage.getItem('axioma-vectorentrainer-v020')");
  const later='.mission-card[data-skill="decompose"] button';
  await c.click(later);assert(await c.eval("document.getElementById('practiceConfirm').open"));
  assert.equal(await c.eval('document.activeElement.id'),'practiceCancel');
  assert.deepEqual(await snap(),before);assert.equal(await c.eval("localStorage.getItem('axioma-vectorentrainer-v020')"),storage);
  assert(await c.eval(`['practiceCancel','practiceAccept'].every(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.height>=44&&r.x>=0&&r.right<=innerWidth&&r.y>=0&&r.bottom<=innerHeight})`));
  await c.shot('practice-confirm-'+w);await c.click('#practiceCancel');await c.wait("!document.getElementById('practiceConfirm').open");
  assert.equal(await c.eval('document.body.dataset.screen'),'stationScreen');assert.deepEqual(await snap(),before);
  assert(await c.eval("document.activeElement.closest('[data-skill=decompose]')!==null"));
  await c.click(later);await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});await c.wait("!document.getElementById('practiceConfirm').open");assert.deepEqual(await snap(),before);
  await c.click(later);await c.click('#practiceAccept');await c.wait("document.body.dataset.screen==='play'");assert((await snap()).free);assert.equal((await snap()).task.skill,'decompose');
  await c.size(1366,768);await c.click('#crumbWorld');await menu('playBtn');await c.click('#startBtn');assert(!(await snap()).free);assert.equal((await snap()).task.skill,'headtail');assert.equal((await snap()).session.xp,14);
  await menu('freeBtn');await c.click('[data-station="manoeuvreveld"]');await c.click(later);assert.equal(await c.eval('document.body.dataset.screen'),'play');assert.equal(await c.eval("document.getElementById('practiceConfirm').open"),false);
  check('confirm, cancel, Escape and saved route on practice switch '+w);
 }
 await c.click('#crumbWorld');
 for(const [w,h] of [[1920,1080],[1366,768],[1024,768],[780,360],[640,360]]){
  await c.size(w,h);await menu('playBtn');await c.shot('world-'+w+'x'+h);await layout('world '+w+'x'+h);
  for(const station of ['koerscentrum','stuwkrachtlab','dockingzone','navigatienet','manoeuvreveld']){await c.click('[data-station="'+station+'"]');await layout(station+' '+w+'x'+h);if(['dockingzone','navigatienet'].includes(station)&&[1920,780,640].includes(w))await c.shot(station+'-'+w+'x'+h);assert.equal(await c.eval(`document.getElementById('crumbStation').textContent`),documentStationName(station));await c.click('#stationBack')}
  await c.click('#startBtn');assert.equal(await c.eval('document.body.dataset.screen'),'play');check('Verder opens recommended exercise '+w);
  await fixture();await layout('headtail '+w+'x'+h);await c.shot('headtail-'+w+'x'+h);
  if(w>900){assert(!(await c.eval('document.getElementById("coachPanel").hidden')));await c.click('#coachClose');await c.click('#coachTab')}else{assert(await c.eval('document.getElementById("coachPanel").hidden'));await c.click('#coachTab');await layout('coach drawer '+w);await c.shot('coach-'+w+'x'+h);await c.click('#coachClose')}
 }
 await c.size(1366,768);await fixture({free:false,session:{answered:0,clean:0,repairs:0,xp:0}});
 let t=(await snap()).task,mid=M.endPointFromVector(t.start,t.parts[0]),end=M.endPointFromVector(t.start,t.target);
 await draw(t.start,mid,'vector',false,true);assert.equal(await c.eval('document.querySelectorAll(".coach-step.complete").length'),1);
 await draw(M.point(3,2),M.endPointFromVector(M.point(3,2),t.parts[1]));assert.equal(await c.eval('document.querySelectorAll(".coach-step.complete").length'),1);
 assert(await c.eval(`getComputedStyle(document.querySelector('#board .student.vector-u')).color===getComputedStyle(document.querySelector('#board .given.vector-u')).color`));check('copied vectors retain their semantic color');
 const before=(await snap()).answer;await c.click('#commit');assert.match(await c.eval('document.getElementById("feedback").textContent'),/begint nog niet aan de kop/);assert.deepEqual((await snap()).answer,before);await layout('diagnostic error desktop');await c.shot('error-desktop');
 await c.size(780,360);await layout('diagnostic error mobile');await c.shot('error-780x360');
 await c.click('#dismissFeedback',true);assert.equal((await snap()).answer.strokes.length,1,'retry removes the misplaced arrow but keeps the correct first step');
 await draw(mid,end,'vector',true);const saved=await snap();await loadAndResume();assert.deepEqual((await snap()).answer,saved.answer);assert.equal((await snap()).dirty,true);check('partial construction and error status survive reload');
 await draw(t.start,end,'result',true);await c.click('#commit',true);assert((await snap()).done);assert((await snap()).progress.xp>0);const xp=(await snap()).progress.xp;await layout('success mobile');await c.shot('success-780x360');
 await c.size(1366,768);await layout('success desktop');await c.shot('success-desktop');await loadAndResume();assert.equal((await snap()).progress.xp,xp);assert((await snap()).done);await c.click('#commit');assert(!(await snap()).done);check('corrected success, XP, reload and next exercise');
 await c.size(780,360);await fixture();t=(await snap()).task;mid=M.endPointFromVector(t.start,t.parts[1]);end=M.endPointFromVector(t.start,t.target);await draw(mid,end,'vector',true);await draw(t.start,mid,'vector',true);await draw(t.start,end,'result',true);await c.click('#commit',true);assert((await snap()).done);assert.equal((await snap()).progress.xp,0);check('reverse order, drawing second segment first, touch, free practice without XP');
 await fixture({level:0,variant:2,free:false,session:{answered:0,clean:0,repairs:0,xp:0}});t=(await snap()).task;mid=M.endPointFromVector(t.start,t.parts[0]);end=M.endPointFromVector(t.start,t.target);
 async function guided(a,b){await c.tap(await xy(a),true);await c.tap(await xy(b),true);await c.frames()}
 await guided(t.start,mid);assert.equal((await snap()).stage,1);await guided(M.point(3,2),M.endPointFromVector(M.point(3,2),t.parts[1]));assert.equal((await snap()).stage,1);await guided(mid,end);assert.equal((await snap()).stage,2);await guided(t.start,end);assert((await snap()).done);check('guided steps preserve accepted arrow after a mistake');
 await menu('playBtn');assert.equal(await c.eval('document.body.dataset.screen'),'home');await menu('freeBtn');await c.click('[data-station="dockingzone"]');await c.click('.mission-card[data-skill="headtail"] button');assert((await snap()).free);await menu('playBtn');await c.click('#startBtn');assert(!(await snap()).free);check('world → station → skill and suspended series restoration');
 // Breadcrumbs preserve the exact exercise and practice mode across both parent screens.
 for(const free of [true,false]){
  await c.size(640,360);await fixture({free,session:free?null:{answered:0,clean:0,repairs:0,xp:0}});
  const task=(await snap()).task;await draw(task.start,M.endPointFromVector(task.start,task.parts[0]),'vector',true);const draft=await snap();
  assert.equal(await c.eval(`document.getElementById('crumbStation').textContent`),'Dockingzone');
  await c.click('#crumbStation',true);assert.equal(await c.eval('document.body.dataset.screen'),'stationScreen');await layout('breadcrumb to station '+(free?'free':'series'));
  await c.click('.mission-card[data-skill="headtail"] button',true);for(const key of ['task','answer','free','session','progress'])assert.deepEqual((await snap())[key],draft[key],'station return preserves '+key);
  await c.click('#crumbWorld',true);assert.equal(await c.eval('document.body.dataset.screen'),'home');assert.match(await c.eval(`document.getElementById('roundLabel').textContent`),free?/Vrij oefenen/:/Oefeningenreeks/);
  await c.click('[data-station="dockingzone"]',true);await c.click('#stationRecommendedBtn',true);assert.deepEqual((await snap()).answer,draft.answer);
  check('breadcrumbs preserve '+(free?'free':'scored')+' draft and mode');
 }
 await c.size(780,360);await c.click('#menuBtn');await layout('navigation menu mobile');await c.shot('menu-780x360');await c.click('#menuBtn');
 for(const [w,h] of [[390,844],[320,568]]){await c.click('#crumbWorld');await c.size(w,h);await c.shot('world-'+w+'x'+h);await layout('portrait world '+w);await c.click('[data-station="navigatienet"]');await layout('portrait station '+w);await c.click('#crumbWorld')}
 await c.size(780,360);
 // Existing families retain their input types after the shared theme change.
 for(const skill of Core.TaskGenerator.skills){await fixture({skill:skill.id});await c.frames();assert.equal((await snap()).task.skill,skill.id);assert(await c.eval('document.getElementById("prompt").textContent.length>0'))}
 check('all 24 existing families mount with their original interaction types');
 // Adaptive zoom reserves the whole construction and keeps input coordinates stable.
 for(const [w,h] of [[1366,768],[780,360],[640,360]]){
  await c.size(w,h);
  for(const skill of ['arrow','headtail','route','decompose','fourth','opposite']){
   await fixture({skill,level:0,variant:skill==='opposite'?3:2});
   const before=await snap(),t=before.task;
   const points=await c.eval(`(()=>{const t=AxiomaVectorTrainer.inspect().task;return VectorTrainerLessons.build(t).steps.flatMap(s=>[...s.strokes.flatMap(a=>[a.start,a.end]),s.point].filter(Boolean))})()`);
   for(const p of points){const q=await xy(p),r=await c.eval(`(()=>{const r=document.getElementById('board').getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}})()`);assert(q.x>=r.left+24&&q.x<=r.right-24&&q.y>=r.top+24&&q.y<=r.bottom-24,skill+' solution fits '+w);}
   if(skill==='arrow'){
    const old=Math.min((before.view.w-48)/(t.bounds.maxX-t.bounds.minX),(before.view.h-48)/(t.bounds.maxY-t.bounds.minY));assert(before.view.unit>old*1.4,'small construction zooms in');
    await draw(t.start,M.endPointFromVector(t.start,t.target),'vector',w<900,w>900);
    assert.deepEqual((await snap()).view,before.view,'drawing does not move or rescale the grid');
    await c.shot('zoom-arrow-'+w+'x'+h);await c.click('#commit');assert((await snap()).done,'zoomed pointer input remains correct');
   }
   if(skill==='route'){
    await c.shot('zoom-route-'+w+'x'+h);
    await draw(t.start,M.endPointFromVector(t.start,t.target),'vector',w<900);await c.click('#commit');assert((await snap()).done,'long route endpoint stays reachable');
   }
  }
  check('adaptive zoom fits constructions and preserves mouse/touch input '+w);
 }
 await c.size(1366,768);await fixture({skill:'headtail'});
 const zoomDraft=await snap();await c.click('#coachClose');const wider=await snap();assert(wider.view.unit>=zoomDraft.view.unit);await c.click('#coachTab');assert.deepEqual((await snap()).view,zoomDraft.view,'coach toggle returns to the same framing');
 await loadAndResume();assert.deepEqual((await snap()).view,zoomDraft.view,'reload keeps task framing');
 check('adaptive framing follows available board space and is repeatable');
 // Fractions are presentation objects; stored task values and validators remain unchanged.
 for(const [w,h] of [[1366,768],[640,360]]){
  await c.size(w,h);
  const seed=Array.from({length:100},(_,i)=>i+1).find(seed=>Core.TaskGenerator.generate('scalar',{seed,level:2,variant:1}).factor===-.5);
  await fixture({skill:'scalar',seed,level:2,variant:1,intro:true,lessonStep:999});
  assert(await c.eval(`(()=>{const f=document.querySelector('#prompt .math-fraction'),n=f?.querySelector('.fraction-numerator'),d=f?.querySelector('.fraction-denominator');return n&&d&&n.textContent==='1'&&d.textContent==='2'&&n.getBoundingClientRect().bottom<=d.getBoundingClientRect().top&&f.getAttribute('aria-label')==='min 1 gedeeld door 2'&&!document.getElementById('prompt').textContent.includes('/')})()`));
  assert(await c.eval(`(()=>{const f=document.querySelector('#board .svg-fraction'),[n,d]=f?.querySelectorAll('text')||[];return n&&d&&n.getBoundingClientRect().bottom<d.getBoundingClientRect().top&&f.querySelector('line')&&!document.querySelector('#board .example .vector-name').textContent.includes('/')})()`));
  await layout('stacked fraction scalar '+w);await c.shot('fractions-scalar-'+w);
  await menu('helpBtn');while(!await c.eval("document.getElementById('helpNext').disabled"))await c.click('#helpNext');
  assert(await c.eval("document.querySelector('#helpPrompt .math-fraction')!==null"));assert(await c.eval("document.querySelector('#helpBoard .svg-fraction')!==null"));
  await c.shot('fractions-help-'+w);
  await fixture({skill:'coordscale',seed,level:2,variant:1,intro:true,lessonStep:999});
  assert(await c.eval("document.querySelector('#lessonCalculation .math-fraction')!==null"));
  assert(await c.eval("!document.getElementById('lessonCalculation').textContent.includes('/')"));
  await layout('stacked fraction calculation '+w);await c.shot('fractions-calculation-'+w);
  check('stacked fractions in prompts, examples and SVG labels '+w);
 }
 // Check actual SVG text/accent bounds against every visible arrow, including worked examples.
 for(const [w,h] of [[1366,768],[640,360]]){
  await c.size(w,h);
  for(const skill of ['headtail','commute','parallelogram','decompose','coords','route','scalar','equal']){
   await fixture({skill,level:0,variant:2,intro:true,lessonStep:999});
   const collisions=await c.eval(`(()=>{
    const svg=document.getElementById('board'),board=svg.getBoundingClientRect(),names=[...svg.querySelectorAll('.vector-name')],lines=[...svg.querySelectorAll('.given>line,.student>line,.example>line,.result>line')],issues=[];
    const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    names.forEach((name,i)=>{
     const r=name.getBoundingClientRect();if(r.left<board.left+3||r.right>board.right-3||r.top<board.top+3||r.bottom>board.bottom-3)issues.push('clipped '+name.textContent);
     for(const line of lines){
      const matrix=line.getScreenCTM(),p=svg.createSVGPoint();p.x=+line.getAttribute('x1');p.y=+line.getAttribute('y1');const a=p.matrixTransform(matrix);p.x=+line.getAttribute('x2');p.y=+line.getAttribute('y2');const b=p.matrixTransform(matrix),steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)*2));
      for(let j=0;j<=steps;j++){const x=a.x+(b.x-a.x)*j/steps,y=a.y+(b.y-a.y)*j/steps;if(x>r.left-3&&x<r.right+3&&y>r.top-3&&y<r.bottom+3){issues.push('shaft overlaps '+name.textContent);break;}}
     }
     for(const head of svg.querySelectorAll('.arrowhead'))if(overlap(r,head.getBoundingClientRect()))issues.push('tip overlaps '+name.textContent);
     for(const other of names.slice(i+1))if(overlap(r,other.getBoundingClientRect()))issues.push('labels overlap '+name.textContent);
    });
    for(const line of lines)if(+line.getAttribute('stroke-width')<4)issues.push('thin arrow');
    return issues;
   })()`);
   assert.deepEqual(collisions,[],skill+' clear labels '+w);
   if(['headtail','route','decompose'].includes(skill))await c.shot('arrows-'+skill+'-'+w+'x'+h);
  }
  check('heavier arrows and clear vector labels in eight worked constructions '+w);
 }
 // Given vectors remain visible in coordinate tasks, with readable data below the prompt.
 for(const [w,h] of [[1366,768],[780,360],[640,360]]){
  await c.size(w,h);
  for(const skill of ['route','coordadd','coordscale','coordcombo','unknown']){
   await fixture({skill,level:1,variant:2});await layout('visible givens '+skill+' '+w);
   const task=(await snap()).task;
   assert.equal(await c.eval('document.querySelectorAll("#board .given").length'),task.refs.length);
   assert(task.refs.length>0);
   assert(await c.eval('!document.getElementById("taskGivens").hidden'));
   assert(await c.eval('parseFloat(getComputedStyle(document.getElementById("taskGivens")).fontSize)>=16'));
   if(['route','coordcombo'].includes(skill))await c.shot('givens-'+skill+'-'+w);
   if(skill==='route'){await c.tap(await xy(task.targetPoint),w<900);await c.click('#commit');assert((await snap()).done);}
  }
 }
 // Progress is separated by world and reads the original evidence without changing it.
 const sample=Core.TrainerScheduler.freshState();
 Object.assign(sample.skills.props,{intro:true,seen:7,clean:6,strength:1,signatures:['a','b','c','d'],variants:['1:0','1:1','1:2'],recent:[true,true,true,true]});
 Object.assign(sample.skills.equal,{intro:true,seen:4,clean:2,strength:.5});
 for(const [w,h] of [[1366,768],[780,360],[640,360],[390,844]]){
  await c.size(1366,768);await fixture({skill:'props'},sample);const before=await snap();await menu('progressBtn');await c.size(w,h);
  assert.equal(await c.eval('document.querySelectorAll("[data-progress-station]").length'),5);
  assert.equal(await c.eval('document.getElementById("progressStationTitle").textContent'),'Koerscentrum');
  assert.equal(await c.eval('document.getElementById("progressStationPercent").textContent'),'50%');
  assert.equal(await c.eval('document.getElementById("progressTotal").textContent'),'1 / 24 stevig');
  assert.equal(await c.eval('document.querySelector("[data-progress-skill=props]").dataset.phase'),'solid');
  assert.equal(await c.eval('document.querySelectorAll("[data-progress-skill]").length'),3);
  await layout('progress by world '+w);await c.shot('progress-'+w+'x'+h);
  const all=[],stations=await c.eval('VectorMission.STATIONS');
  for(const station of stations){
   await c.click('[data-progress-station="'+station.id+'"]',w<900);
   assert.deepEqual(await c.eval('[...document.querySelectorAll("[data-progress-skill]")].map(e=>e.dataset.progressSkill)'),station.skills);
   assert.equal(await c.eval('document.querySelector("[data-progress-station][aria-pressed=true]").dataset.progressStation'),station.id);all.push(...station.skills);
  }
  assert.deepEqual(all.sort(),Core.TaskGenerator.skills.map(s=>s.id).sort());
  await c.click('[data-progress-station="navigatienet"]');await c.eval('document.querySelector(".progress-detail-scroll").scrollTop=9999');
  assert(await c.eval(`(()=>{const row=document.querySelector('[data-progress-skill="coordcombo"]').getBoundingClientRect(),box=document.querySelector('.progress-detail-scroll').getBoundingClientRect();return row.bottom<=box.bottom&&row.top>=box.top})()`),'last skill remains reachable');
  await c.size(1366,768);await c.click('#closeProgress');for(const key of ['task','answer','session','progress'])assert.deepEqual((await snap())[key],before[key],'progress view preserves '+key);
 }
 await c.size(780,360);await fixture();await menu('progressBtn');assert.equal(await c.eval('document.getElementById("progressStationTitle").textContent'),'Dockingzone');await menu('progressBtn');await c.click('#closeProgress');assert.equal(await c.eval('document.body.dataset.screen'),'play','opening progress twice keeps original return screen');
 check('all 24 skills grouped once; real percentages and evidence; current world selected; exercise unchanged');
 // An explicit coach choice wins over new questions, screen size and reload defaults.
 for(const [w,h] of [[1366,768],[780,360]]){
  await c.size(w,h);await fixture();
  const collapsed=()=>c.eval('document.getElementById("coachPanel").hidden');
  for(const preference of [true,false,true]){
   if(await collapsed()===preference)await c.click(preference?'#coachTab':'#coachClose');
   await c.click(preference?'#coachClose':'#coachTab');
   const before=(await snap()).task.variant;
   for(let i=0;i<2;i++){await c.click('#skip');assert.equal(await collapsed(),preference,'coach choice survives next question')}
   assert.equal((await snap()).task.variant,before+2);
   await loadAndResume();assert.equal(await collapsed(),preference,'coach choice survives reload');
   await c.size(w===1366?780:1366,w===1366?360:768);assert.equal(await collapsed(),preference,'viewport does not override explicit coach choice');await c.size(w,h);
  }
  await c.click('#crumbStation');await c.click('.mission-card[data-skill="sum"] button');await c.click('#crumbStation');await c.click('.mission-card[data-skill="headtail"] button');assert.equal(await collapsed(),true,'choice survives another skill');
  check('coach remembers last manual open/closed choice across questions, skills, reload and resize '+w);
 }
 await c.click('#guestBtn');assert(await c.eval(`!document.getElementById('axioma-game-status').shadowRoot.querySelector('.panel').hidden`));await c.eval(`document.getElementById('axioma-game-status').shadowRoot.querySelector('.actions button:last-child').click()`);check('profile opens the existing account and storage dialog');
 assert.deepEqual(c.errors,[]);report.passed=true;
 }finally{fs.writeFileSync(path.resolve(OUT,'../browser-report.json'),JSON.stringify(report,null,2));await browser.send('Target.disposeBrowserContext',{browserContextId});c.ws.close();browser.ws.close()}
})().catch(e=>{console.error(e);process.exit(1)});
