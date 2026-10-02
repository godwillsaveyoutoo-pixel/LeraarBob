const assert=require('node:assert/strict'),{CDP}=require('./helpers/online-cdp.cjs');
const BASE=process.env.ALGEBRA_TEST_BASE||'http://127.0.0.1:8775',PORT=Number(process.env.CHROMIUM_CDP_PORT||9245);
(async()=>{const browser=new CDP(),contexts=[],tabs=[],saved=new Map();try{
 await browser.connect((await(await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()).webSocketDebuggerUrl);
 const {browserContextId}=await browser.send('Target.createBrowserContext');contexts.push(browserContextId);const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});const targets=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json(),c=new CDP();await c.connect(targets.find(t=>t.id===targetId).webSocketDebuggerUrl);tabs.push(c);c.user='00000000-0000-4000-8000-000000000011';await c.send('Runtime.enable');await c.send('Page.enable');
 c.route=async p=>{const u=new URL(p.request.url),finish=(data,type='text/javascript')=>c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:type}],body:Buffer.from(data).toString('base64')});
 if(u.pathname.endsWith('/axioma-auth.js'))return finish(`(()=>{let account={id:'${c.user}',role:'student',alias:'Testleerling'};const listeners=[];const api=(action,args)=>fetch('/algebra-test-api',{method:'POST',body:JSON.stringify({action,args,user:account.id})}).then(r=>r.json());window.testSwitch=()=>{account={id:'00000000-0000-4000-8000-000000000022',role:'student',alias:'Tweede leerling'};listeners.forEach(f=>f({account}))};window.AxiomaAuth={ready:async()=>({account}),getAccount:async()=>account,getSession:async()=>null,onChange:fn=>(listeners.push(fn),()=>{}),client:()=>({from:()=>({select(){return this},eq(){return this},maybeSingle:()=>api('load',{})}),rpc:(name,args)=>api('save',args)})};})();`);
 if(u.pathname.endsWith('/axioma-social.js'))return finish('window.AxiomaSocial={state:()=>({}),onChange:()=>()=>{}}');
 if(u.pathname==='/algebra-test-api'){if(c.offline)return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'InternetDisconnected'});const {action,args,user}=JSON.parse(p.request.postData);if(action==='load')return finish(JSON.stringify({data:saved.get(user)||null,error:null}),'application/json');let row=saved.get(user),revision=(row?.revision||0)+1;row={game_id:'algebra-trainer',state:args.p_state,revision};saved.set(user,row);return finish(JSON.stringify({data:{status:'saved',...row},error:null}),'application/json');}
 if(u.hostname!=='127.0.0.1')return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'});return c.send('Fetch.continueRequest',{requestId:p.requestId});};
 // Wait for the existing delayed KaTeX refresh before seeding/reloading fixtures.
 async function ready(){await c.wait('window.AlgebraTrainer&&AxiomaGame.active');await c.eval('new Promise(r=>setTimeout(r,550))');}
 await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});await c.size(1366,768);await c.send('Page.navigate',{url:BASE+'/games/algebra-trainer/'});await ready();await c.eval("document.querySelector('.sectionNav [data-nav=tools]').click();document.querySelector('#toolsScreen [data-nav=setup]').click()");
 const inView=id=>`(()=>{const e=document.getElementById('${id}'),r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.top>=0&&r.bottom<=innerHeight&&r.right<=innerWidth;})()`;
 for(const [w,h] of [[1366,768],[780,360],[390,844],[320,568]]){await c.size(w,h);for(const fold of [false,true]){await c.eval(`LeraarBobTopbar.setCollapsed(${fold});new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);assert(await c.eval('document.documentElement.scrollWidth<=innerWidth'),'setup horizontal '+w);await c.eval("document.getElementById('startTrainerBtn').scrollIntoView({block:'nearest'});new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))");assert(await c.eval(inView('startTrainerBtn')),'start '+w+' '+fold+' '+await c.eval("JSON.stringify(document.getElementById('startTrainerBtn').getBoundingClientRect())"));await c.shot('algebra-setup-'+w+'-'+fold);}}
 await c.size(1366,768);await c.click('startTrainerBtn');await c.wait("AlgebraTrainer.snapshot().screen==='trainer'");const initial=await c.eval('AlgebraTrainer.snapshot().activeSet.map(e=>e.id).join()');
 for(const [w,h] of [[1366,768],[780,360],[390,844],[320,568]]){await c.size(w,h);for(const fold of [false,true]){await c.eval(`LeraarBobTopbar.setCollapsed(${fold});new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);assert(await c.eval('document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight+1'),'trainer overflow '+w);for(const id of ['prevExerciseBtn','forwardExerciseBtn','undoBtn'])assert(await c.eval(inView(id)),id+' '+w);assert(await c.eval(`(()=>{const e=document.querySelector('.contextOp'),r=e.getBoundingClientRect();return r.height>=44&&r.bottom<=innerHeight})()`),'op button '+w);const math=await c.eval(`(()=>{const e=document.querySelector('#givenEquation');return {height:e.clientHeight,scroll:e.scrollHeight,line:getComputedStyle(e).lineHeight};})()`);assert(math.scroll<=math.height+1,JSON.stringify({w,h,fold,math}));await c.shot('algebra-trainer-'+w+'-'+fold);}}
 // Solve through the real operation buttons using the generator's known correct route.
 async function solve(){const steps=await c.eval('AlgebraTrainer.snapshot().activeSet[AlgebraTrainer.snapshot().trainerIndex].steps');for(const step of steps){await c.eval(`document.querySelector('[data-op="${step.op}"]').click()`);const found=await c.eval(`(()=>{const C=AlgebraCore,s=AlgebraTrainer.snapshot(),ex=s.activeSet[s.trainerIndex],rev=(o)=>o&&typeof o==='object'?(Number.isInteger(o.n)&&Number.isInteger(o.d)?C.R(o.n,o.d):Array.isArray(o)?o.map(rev):Object.fromEntries(Object.entries(o).map(([k,v])=>[k,rev(v)]))):o;const vals=C.candidateOperands(rev(ex),rev(s.trainerStates.at(-1)),${JSON.stringify(step.op)}),i=vals.findIndex(v=>C.exprSig(v)===C.exprSig(rev(${JSON.stringify(step.operand)})));if(i<0)return false;for(let p=0;p<Math.floor(i/2);p++)document.getElementById('nextValuesBtn').click();document.querySelector('[data-index="'+i+'"]').click();return true;})()`);assert(found,'canonical value accessible');}}
 await solve();assert(await c.eval(inView('nextExerciseBtn')),'next stays visible');assert.equal(await c.eval('AlgebraTrainer.snapshot().solvedTypes.length'),1);await c.eval('AxiomaGame.flush()');assert.equal(saved.get(c.user).state.platformXp,undefined,'no invented XP');
 const solved=await c.eval('JSON.stringify(AlgebraTrainer.snapshot().trainerStates)');await c.click('nextExerciseBtn');await c.click('prevExerciseBtn');assert.equal(await c.eval('JSON.stringify(AlgebraTrainer.snapshot().trainerStates)'),solved,'previous restores work');await c.eval('AxiomaGame.flush()');await c.send('Page.reload');await ready();assert.equal(await c.eval('AlgebraTrainer.snapshot().activeSet.map(e=>e.id).join()'),initial);assert.equal(await c.eval('JSON.stringify(AlgebraTrainer.snapshot().trainerStates)'),solved);
 assert.equal(await c.eval("document.querySelector('.lb-restore').getAttribute('aria-expanded')"),'false');await c.eval("document.querySelector('.lb-restore').click()");assert(await c.eval("document.querySelector('.lb-restore').hidden"));
 await c.eval("document.querySelector('.sectionNav [data-nav=tools]').click();document.querySelector('#toolsScreen [data-nav=preview]').click()");assert.equal(await c.eval('AlgebraTrainer.snapshot().activeSet.map(e=>e.id).join()'),initial);assert(await c.eval("document.querySelectorAll('.paperPage').length>1&&!!document.querySelector('.katex')"));await c.send('Emulation.setEmulatedMedia',{media:'print'});assert(await c.eval("getComputedStyle(document.getElementById('setupScreen')).display==='none'&&getComputedStyle(document.querySelector('.sectionNav')).display==='none'"));await c.shot('algebra-print');await c.send('Emulation.setEmulatedMedia',{media:''});
 // Offline work is account-scoped and survives reload, then flushes once online.
 await c.eval("document.querySelector('.sectionNav [data-nav=tools]').click();document.querySelector('#toolsScreen [data-nav=trainer]').click()");await c.click('forwardExerciseBtn');c.offline=true;await solve();await c.eval('AxiomaGame.flush()');assert.equal(await c.eval('AxiomaGame.status'),'offline');await c.send('Page.reload');await ready();assert.equal(await c.eval('AlgebraTrainer.snapshot().trainerIndex'),1);c.offline=false;await c.eval('AxiomaGame.flush()');assert.equal(await c.eval('AxiomaGame.status'),'saved');
 await c.eval('testSwitch()');assert.equal(await c.eval('AxiomaGame.active'),false);c.user='00000000-0000-4000-8000-000000000022';await c.send('Page.reload');await ready();assert.deepEqual(await c.eval('AlgebraTrainer.snapshot().solvedTypes'),[]);assert.equal(await c.eval('AlgebraTrainer.snapshot().activeSet.length'),0);

 // An integer-only exercise must remain solvable after dividing first.
 // Seed only this isolated test account; interact with actual visible buttons.
 async function chooseAlternative(op,operand){
  await c.eval(`document.querySelector('[data-op="${op}"]').click()`);
  const hit=await c.eval(`(()=>{
   const C=AlgebraCore,s=AlgebraTrainer.snapshot(),rev=o=>o&&typeof o==='object'?(Number.isInteger(o.n)&&Number.isInteger(o.d)?C.R(o.n,o.d):Array.isArray(o)?o.map(rev):Object.fromEntries(Object.entries(o).map(([k,v])=>[k,rev(v)]))):o;
   const ex=rev(s.activeSet[s.trainerIndex]),eq=rev(s.trainerStates.at(-1));
   const i=C.candidateOperands(ex,eq,${JSON.stringify(op)}).findIndex(v=>C.exprSig(v)===C.exprSig(${operand}));
   for(let p=0;p<Math.floor(i/2);p++)document.getElementById('nextValuesBtn').click();const btn=document.querySelector('[data-index="'+i+'"]');if(!btn)return null;
   btn.scrollIntoView({block:'nearest'});const r=btn.getBoundingClientRect();
   return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height,visible:r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth&&btn.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};
  })()`);
  assert(hit&&hit.visible&&hit.w>=44&&hit.h>=44,'alternative operand visible: '+op+' '+operand+' '+JSON.stringify(hit));
  await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x:hit.x,y:hit.y,button:'left',clickCount:1});
  await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:hit.x,y:hit.y,button:'left',clickCount:1});
  await c.eval('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
 }
 for(const [w,h] of [[1366,768],[780,360],[390,844],[320,568]])for(const fold of [false,true]){
  await c.size(w,h);
  await c.eval(`(()=>{
   const C=AlgebraCore,{N,V,Add,Mul,EQ,R}=C,policy={allowFractions:false,allowDecimals:false,allowNegative:false};
   const start=EQ(Add(Mul(N(4),V()),N(6)),Add(Mul(N(2),V()),N(10)));
   const steps=[{op:'-',operand:Mul(N(2),V())},{op:'-',operand:N(6)},{op:'/',operand:N(2)}],states=[start];
   for(const st of steps)states.push(C.applyEquation(states.at(-1),st.op,st.operand));
   const ex={id:'alternate-order',type:'E1',policy,start,steps,states,solution:R(2)};
   AxiomaGame.storage.setItem('leraarbob.algebra.v1',JSON.stringify({version:1,settings:policy,activeSet:[ex],trainerIndex:0,perExercise:{},solvedTypes:[],screen:'trainer',activeLevel:'advanced'}));
   LeraarBobTopbar.setCollapsed(${fold});
  })()`);
  await c.eval('AxiomaGame.flush()');await c.send('Page.reload');await ready();
  await chooseAlternative('/','C.N(4)');
  await chooseAlternative('-','C.N(C.R(3,2))');
  const middle=await c.eval('JSON.stringify(AlgebraTrainer.snapshot().trainerStates)');
  await c.eval('AxiomaGame.flush()');await c.send('Page.reload');await ready();
  assert.equal(await c.eval('JSON.stringify(AlgebraTrainer.snapshot().trainerStates)'),middle,'alternative work survives reload');
  await chooseAlternative('-','C.Mul(C.N(C.R(1,2)),C.V())');
  await chooseAlternative('/','C.N(C.R(1,2))');
  assert.equal(await c.eval('document.getElementById("feedback").textContent'),'Juist. x staat vrij.');
  assert(await c.eval(inView('nextExerciseBtn')),'alternative next visible '+w);
  assert(await c.eval('!document.documentElement.scrollWidth||document.documentElement.scrollWidth<=innerWidth'),'alternative overflow '+w);
  const position=await c.eval(`(()=>{const e=document.getElementById('derivationStack'),r=document.querySelector('.derivationLine.current .derivationMath').getBoundingClientRect(),s=e.getBoundingClientRect();return {bottom:r.bottom,top:r.top,viewBottom:s.bottom,viewTop:s.top,scrollTop:e.scrollTop,scrollHeight:e.scrollHeight,height:e.clientHeight}})()`);
  assert(position.bottom<=position.viewBottom+2&&position.top>=position.viewTop-2,'final solution visible '+w+' '+fold+' '+JSON.stringify(position));
  await c.shot('algebra-alternative-'+w+'-'+fold);
 }
 assert.deepEqual(c.errors,[]);console.log('PASS Algebra: 4 sizes/both topbar states, accessible next/previous/operations, real solve, same print set, reload, offline retry, account separation, no artificial XP, alternative fraction route through visible buttons');
}finally{for(const id of contexts)await browser.send('Target.disposeBrowserContext',{browserContextId:id});for(const c of tabs)c.ws?.close();browser.ws?.close();}})().catch(e=>{console.error(e);process.exitCode=1});
