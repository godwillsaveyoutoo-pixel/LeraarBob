// Isolated Chromium + localhost only. Test hook is injected into the served document.
const assert=require('node:assert/strict'),fs=require('node:fs');
class CDP{
 async connect(){const tabs=await(await fetch('http://127.0.0.1:9235/json')).json();this.ws=new WebSocket(tabs[0].webSocketDebuggerUrl);this.pending=new Map();this.id=0;this.errors=[];await new Promise(r=>this.ws.onopen=r);this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails);else if(m.method==='Fetch.requestPaused')this.paused?.(m.params)};await this.send('Page.enable');await this.send('Runtime.enable')}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
 run(s){return this.eval('__R.run('+JSON.stringify(s)+')')}
 async wait(expr){for(let i=0;i<100;i++){if(await this.eval(expr))return;await new Promise(r=>setTimeout(r,50))}throw Error('Timeout: '+expr)}
 async click(label,touch=false){const p=await this.eval(`(()=>{const b=[...document.querySelectorAll('#stage button')].find(b=>!b.disabled&&b.textContent===${JSON.stringify(label)});if(!b)throw Error('Missing button '+${JSON.stringify(label)});b.scrollIntoView({block:'nearest'});const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);if(touch){await this.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,radiusX:3,radiusY:3}]});await this.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}else{await this.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...p});await this.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...p})}}
}
(async()=>{
 const c=new CDP();await c.connect();
 let mock=`window.AxiomaAuth={ready:async()=>({session:null}),getAccount:async()=>null,client:()=>null,onChange:()=>()=>{}};`;
 const html=fs.readFileSync('games/rechten/trainer/index.html','utf8').replace('updateStart();renderTop();renderSessionCue();renderCloudStatus();initCloudFoundation();','window.__R={run:source=>eval(source)};updateStart();renderTop();renderSessionCue();renderCloudStatus();initCloudFoundation();');
 c.paused=p=>{const u=new URL(p.request.url);let body;if(u.pathname.endsWith('/axioma-auth.js'))body=mock;else if(u.hostname!=='127.0.0.1'||u.pathname.endsWith('/axioma-social.js'))body='';else if(u.pathname==='/games/rechten/trainer/')body=html;else return c.send('Fetch.continueRequest',{requestId:p.requestId});return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:u.pathname==='/games/rechten/trainer/'?'text/html':'application/javascript'}],body:Buffer.from(body).toString('base64')})};
 await c.send('Network.enable');await c.send('Network.setCacheDisabled',{cacheDisabled:true});await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 const navigate=async(role='guest')=>{await c.send('Page.navigate',{url:'http://127.0.0.1:8765/games/rechten/trainer/?reis=kaartvallei'});await c.wait(`window.__R&&document.querySelector("#app").dataset.account===${JSON.stringify(role)}&&!document.querySelector("#journeyPanel").hidden`)};
 await navigate();
 async function tap(selector){const p=await c.eval(`(()=>{const b=document.querySelector(${JSON.stringify(selector)});if(!b||b.disabled)throw Error('Cannot tap '+${JSON.stringify(selector)});b.scrollIntoView({block:'nearest'});const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,radiusX:3,radiusY:3}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.eval('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')}
 const reset=async(ready=false)=>c.run(`stopAccountExercise();state=DEFAULT();guestMode=true;currentScreen='play';${ready?`for(const k of J.skills){const s=state.skills[k];s.intro=true;s.seen=8;s.correct=8;s.strength=.85;s.recent=[true,true,true,true]}state.access=[...J.skills];`:''}J.data(state).view='area';save();openScreen('journey')`);
 async function layout(where){const bad=await c.eval(`(()=>{const bad=[];for(const e of document.querySelectorAll(${JSON.stringify(where==='map'?'#journeyPanel button,#journeyPanel h2,#journeyPanel h3,.journey-status,.journey-footer,.topbar':'#stage button,#question,#status,.topbar')})){if(!e.getClientRects().length)continue;const r=e.getBoundingClientRect();if(r.left<-.5||r.right>innerWidth+.5||(${JSON.stringify(where)}!=='map'&&(r.top<0||r.bottom>innerHeight+.5)))bad.push(e.textContent+' outside '+JSON.stringify(r.toJSON()));if(e.tagName==='BUTTON'&&(r.width<47.5||r.height<47.5))bad.push('small '+e.textContent)}if(document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth)bad.push('page overflow');return bad})()`);assert.deepEqual(bad,[],where)}
 async function solveCurrent(){
  await c.run(`if(current.type==='intro')introDone()`);
  const type=await c.run('current.skill');
  if(type==='point_plot'){
   const p=await c.run(`(()=>{const t=current,s=document.querySelector('.construct-grid'),x=W.num(W.div(t.params.target.x,t.params.scaleX)),y=W.num(W.div(t.params.target.y,t.params.scaleY)),p=new DOMPoint(110+18*x,110-18*y).matrixTransform(s.getScreenCTM());return {x:p.x,y:p.y}})()`);
   await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,radiusX:3,radiusY:3}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.click('Plaats',true);
  }else if(await c.run('!!W.catalog[current.skill]')){
   await c.run(`(()=>{const w=current.work;let n=0;while(!w.done&&n++<40){const stage=W.stages(current)[w.index];const value=stage==='ys'||stage==='xs'?['B','A']:stage==='point'?'A':stage==='subX'?'x':stage==='subY'?'y':W.expected(current,w);const r=W.submit(current,w,value);if(!r.ok)throw Error(JSON.stringify(r))}if(!w.done)throw Error('unfinished');finishWave();render(current)})()`);
  }else if(type==='point'){
   const label=await c.run('`(${fmt(current.params.x)}, ${fmt(current.params.y)})`');await c.click(label,true);
  }else await c.run(`locked=true;finishOutcome(true,'test answer')`);
 }
 async function onward(){if(await c.run('!!W.catalog[current.skill]'))await c.click('Verder →',true);else await tap('.journey-next')}
 try{
 for(const [width,height] of [[1100,700],[780,360],[640,360]]){
  await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await c.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await reset();await layout('map');await tap('[data-place="bridge"]');assert(await c.eval('document.querySelector(".journey-details").textContent.includes("Bereid eerst")'));assert(!await c.eval('document.querySelector("[data-start=discover]")'));
  await tap('[data-place="tower"]');await tap('[data-start="discover"]');assert.equal(await c.run('current.type'),'intro');await c.wait('document.querySelector("#introGo")&&!document.querySelector("#introGo").disabled');await tap('#introGo');await layout('play');
  const before=await c.run('JSON.stringify(current)');await tap('#journeyBtn');await layout('map');await tap('[data-resume]');assert.equal(await c.run('JSON.stringify(current)'),before);
  await solveCurrent();await layout('play');const scored=await c.run('({xp:state.xp,total:state.total,id:current.id})');assert.equal(scored.total,1);await c.run('record(true)');assert.deepEqual(await c.run('({xp:state.xp,total:state.total,id:current.id})'),scored);
  await c.run(`launchDev('point_plot',0,false);exitDev()`);assert.equal(await c.eval('document.querySelectorAll(".journey-next").length'),1);await layout('play');assert.deepEqual(await c.run('({xp:state.xp,total:state.total,id:current.id})'),scored);
  const shot=await c.send('Page.captureScreenshot');fs.writeFileSync(`/tmp/rechten-journey-${width}-task.png`,Buffer.from(shot.data,'base64'));
  await navigate();await tap('[data-resume]');assert.equal(await c.run('current.id'),scored.id);assert.equal(await c.run('state.total'),1);assert(await c.eval('!!document.querySelector(".journey-next")'));
  await onward();assert.notEqual(await c.run('current.id'),scored.id);
  await tap('#helpBtn');await tap('#playBtn');await solveCurrent();assert.equal(await c.run('state.journey.active.results.at(-1).independent'),false);
  await tap('#journeyBtn');await layout('map');const map=await c.send('Page.captureScreenshot');fs.writeFileSync(`/tmp/rechten-journey-${width}-map.png`,Buffer.from(map.data,'base64'));
 }
 // Complete a real discovery round from an empty learner, including the first plotted point.
 await reset();await tap('[data-start="discover"]');
 for(let i=0;i<12;i++){await solveCurrent();await onward()}
 assert.equal(await c.run('state.session.answered'),12);assert.equal(await c.run('state.journey.active'),null);assert.equal(await c.run('state.journey.visits.tower'),1);
 const finished=await c.run('({xp:state.xp,total:state.total,route:state.routeStep})');await navigate();assert.deepEqual(await c.run('({xp:state.xp,total:state.total,route:state.routeStep})'),finished);await c.run('endSession()');assert.deepEqual(await c.run('({xp:state.xp,total:state.total,route:state.routeStep})'),finished);
 // Regression: a completed 10/12 round must offer a NEW round and advance within the stop.
 await reset();await c.run(`state.routeStep=1;state.total=12;state.xp=123;state.access=['point','point_plot'];Object.assign(state.skills.point,{intro:true,seen:10,correct:8,strength:.8,recent:[true,true,true,true]});Object.assign(state.skills.point_plot,{intro:true,seen:2,correct:2,strength:.5,recent:[true,true]});state.review=[{id:'earlier-point',kind:'repair',skill:'point',due:0,stage:0,misses:1,difficulty:0}];state.session={...emptySession(),answered:12,completed:true,journeyRound:true};const j=J.data(state);j.visits.tower=1;j.last={place:'tower',mode:'discover',answered:12,independent:10,practice:['point'],newSkills:['point_plot']};save();renderJourney()`);
 assert.equal(await c.run('journeyRecommendation().skill'),'point_plot');assert(!(await c.run('unlockedSkills()')).includes('delta'));
 assert(await c.eval('document.querySelector(".journey-context").textContent.includes("Ronde 2")'));
 assert(await c.eval('document.querySelector("[data-start=discover]").textContent.includes("Start volgende ronde")'));
 await tap('[data-next-round]');assert.equal(await c.run('state.session.answered'),0);assert.equal(await c.run('state.session.completed||false'),false);assert.equal(await c.run('current.skill'),'point_plot');assert.equal(await c.run('state.xp'),123);assert.equal(await c.run('state.journey.visits.tower'),1);
 await solveCurrent();await onward();assert.equal(await c.run('current.reviewId'),'earlier-point');
 for(let i=1;i<12;i++){await solveCurrent();await onward()}
 assert.equal(await c.run('state.routeStep'),2);assert.equal(await c.run('state.journey.visits.tower'),2);assert((await c.run('unlockedSkills()')).includes('delta'));
 assert.equal(await c.run('journeyRecommendation().place.id'),'trail');await tap('#continueBtn');assert.equal(await c.run('state.journey.selected'),'trail');
 await tap('[data-next-round]');assert.equal(await c.run('state.session.answered'),0);assert.equal(await c.run('state.journey.active.place'),'trail');
 // A world project has explicit coverage. Assistance with the first objective requires a retake.
 await reset(true);await tap('[data-start="challenge"]');await tap('#helpBtn');await tap('#playBtn');
 for(let i=0;i<12;i++){await solveCurrent();await onward()}
 assert.equal(await c.run('Object.keys(state.journey.proof).length'),4);assert.equal(await c.run('state.journey.proof.point||false'),false);
 await tap('#continueBtn');await layout('map');const challengeShot=await c.send('Page.captureScreenshot');fs.writeFileSync('/tmp/rechten-journey-challenge.png',Buffer.from(challengeShot.data,'base64'));
 // The next-round action may advance to another area; explicitly return for a retake.
 await tap('[data-atlas]');await tap('[data-region="points"]');
 // Finish the engine's targeted repair before another independent world attempt.
 await c.run(`state.review=[];for(const k of J.skills){const s=state.skills[k];s.intro=true;s.seen=8;s.strength=.85;s.recent=[true,true,true,true]}renderJourney()`);
 await tap('[data-start="challenge"]');assert.deepEqual(await c.run('state.journey.active.targets'),['point']);
 for(let i=0;i<12;i++){await solveCurrent();await onward()}
 assert.equal(await c.run('state.journey.last.passed'),true);assert.equal(await c.run('Object.keys(state.journey.proof).length'),5);
 // Persist actual construction input and resume it, without introducing a second score.
 await reset(true);await c.run(`state.skills.point_plot.strength=.1;startJourney('tower','discover')`);assert.equal(await c.run('current.skill'),'point_plot');
 await c.run(`current.work.construction.cursor={x:3,y:-2};persistWave()`);const partial=await c.run('JSON.stringify(current)');await navigate();await tap('[data-resume]');assert.equal(await c.run('JSON.stringify(current)'),partial);
 await solveCurrent();const total=await c.run('state.total');await navigate();await tap('[data-resume]');await c.run('finishWave()');assert.equal(await c.run('state.total'),total);
 // Review from another area is served on the route; help/DEV never replaces the suspended attempt.
 await reset(true);await c.run(`state.access.push('ab');state.skills.ab.intro=true;state.review=[{id:'outside',kind:'repair',skill:'ab',due:0,difficulty:0,stage:0,misses:1}];startJourney('bridge','discover')`);await solveCurrent();await onward();assert.equal(await c.run('current.skill'),'ab');assert.equal(await c.run('current.reviewId'),'outside');
  const saved=await c.run('JSON.stringify(current)');await c.run(`launchDev('point_plot',0,false);exitDev()`);assert.equal(await c.run('JSON.stringify(current)'),saved);
 // Ordinary completed rounds can enter a world too; the existing round bonus is not repeated.
 await reset(true);await c.run(`closeScreen('play');state.session.answered=12;endSession();openScreen('journey')`);assert(await c.eval('!!document.querySelector("[data-start=discover]")'));
 await tap('[data-start="discover"]');assert.equal(await c.run('state.session.answered'),0);
 // Resume an introductory construction lesson, before any answer was given.
 await reset(true);await c.run(`state.skills.point_plot.intro=false;startJourney('tower','discover')`);assert.equal(await c.run('current.type'),'intro');const intro=await c.run('JSON.stringify(current)');await navigate();await tap('[data-resume]');assert.equal(await c.run('JSON.stringify(current)'),intro);
 // Same specialized account state, with an in-memory fake server; no live learner data.
 const remote=await c.run('structuredClone(state)');
 mock=`(()=>{let account={id:'journey-synthetic-a',alias:'Reiziger A',role:'student'};const listeners=[];
 window.testRow={state:${JSON.stringify(remote)},revision:4};window.testWrites=[];
 const client={from(table){const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:table==='axioma_profiles'?{user_id:account.id,alias:account.alias,class_code:'3TBO'}:structuredClone(testRow)})};return q},async rpc(name,args){if(name==='axioma_is_teacher')return {data:false};if(name!=='axioma_save_progress_for_account')throw Error(name);if(args.p_user_id!==account.id)throw Error('wrong owner');if(args.p_revision!==(testRow?.revision||0))return {data:{status:'conflict',revision:testRow?.revision||0}};testRow={state:structuredClone(args.p_state),revision:(testRow?.revision||0)+1};testWrites.push({id:account.id,state:structuredClone(args.p_state)});return {data:{status:'saved',revision:testRow.revision,updated_at:new Date().toISOString()}}}};
 window.testSwap=()=>{account={id:'journey-synthetic-b',alias:'Reiziger B',role:'student'};window.testRow=null;listeners.forEach(f=>f({session:{user:account},account}))};
 window.AxiomaAuth={ready:async()=>({session:{user:account},account}),getAccount:async()=>account,client:()=>client,onChange:f=>listeners.push(f)};
 })();`;
 await navigate('student');await tap('[data-resume]');assert.equal(await c.run('JSON.stringify(current)'),intro);
 await solveCurrent();await c.run('flushProgress()');assert.equal(await c.eval('testWrites.at(-1).id'),'journey-synthetic-a');assert.equal(await c.eval('testRow.state.journey.active.results.length'),1);
 await c.eval('testSwap()');await c.wait('__R.run('+JSON.stringify("account?.id==='journey-synthetic-b'&&accountReady")+')');assert.equal(await c.run('state.total'),0);assert.equal(await c.run('state.journey?.active||null'),null);assert.equal(await c.run('current'),null);
 assert(await c.eval('testWrites.every(w=>w.id==="journey-synthetic-a")'));
 assert.deepEqual(c.errors,[]);console.log('PASS journey: mobile map/tasks, real discovery round, cumulative challenge and retake, help, global review, reload, partial construction, idempotent XP, DEV resume');
 }finally{await c.send('Fetch.disable');c.ws.close()}
})().catch(e=>{console.error(e);process.exit(1)});
