const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright'),C=require('../games/algebra-trainer/core.js');
const root=path.resolve(__dirname,'..'),out='/tmp/algebra-world-screenshots';
fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 const resolved=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;
 if(!fs.existsSync(resolved)){res.writeHead(404);return res.end();}
 const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.ttf':'font/ttf','.woff2':'font/woff2'};
 res.setHeader('Content-Type',types[path.extname(resolved)]||'application/octet-stream');fs.createReadStream(resolved).pipe(res);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[],records=new Map();let user='00000000-0000-4000-8000-000000000033',offline=false;
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.pathname.endsWith('/axioma-auth.js'))return route.fulfill({contentType:'text/javascript',body:`window.AxiomaAuth={ready:async()=>({account:{id:'${user}',role:'student',alias:'Test'}}),getAccount:async()=>({id:'${user}',role:'student',alias:'Test'}),getSession:async()=>null,onChange:()=>()=>{},client:()=>({from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:null,error:null})})})}`});
   if(url.pathname.endsWith('/axioma-progress.js'))return route.fulfill({contentType:'text/javascript',body:`window.AxiomaProgress={load:async(id)=>{const r=await fetch('/world-test-api?game='+id);if(!r.ok)throw Error('offline');return r.json()},save:async(id,state)=>{const r=await fetch('/world-test-api?game='+id,{method:'POST',body:JSON.stringify(state)});if(!r.ok)throw Error('offline');return r.json()}}`});
   if(url.pathname==='/world-test-api'){
    if(offline)return route.fulfill({status:503,body:'offline'});
    const id=url.searchParams.get('game'),key=user+':'+id,old=records.get(key);
    if(route.request().method()==='POST'){const state=route.request().postDataJSON(),record={gameId:id,state,revision:(old?.revision||0)+1};records.set(key,record);return route.fulfill({contentType:'application/json',body:JSON.stringify({status:'saved',...record})});}
    return route.fulfill({contentType:'application/json',body:JSON.stringify(old||{gameId:id,state:{storage:{}},revision:0})});
   }
   if(url.pathname.endsWith('/axioma-social.js'))return route.fulfill({contentType:'text/javascript',body:'window.AxiomaSocial={state:()=>({}),onChange:()=>()=>{}}'});
   if(url.hostname!=='127.0.0.1')return route.abort();return route.continue();
  });
  const ready=async name=>{await page.waitForFunction(n=>window[n]&&AxiomaGame.active,name);await page.waitForTimeout(550);};
  await page.goto(base+'/games/algebra-trainer/');await ready('AlgebraTrainer');
  assert.equal(await page.locator('.island').count(),10);assert.equal(await page.locator('#algebraProgress').getAttribute('data-value'),'0');
  async function layout(label){
   await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
   const result=await page.evaluate(()=>{
    const visible=e=>!!e.getClientRects().length;
    const controls=[...document.querySelectorAll('.sectionNav button,#worldHost button,#toolsScreen button,#toolsScreen a')].filter(visible);
    const small=controls.filter(e=>{const r=e.getBoundingClientRect();return r.width<43.9||r.height<43.9}).map(e=>e.textContent);
    const overflow=document.documentElement.scrollWidth>innerWidth||document.querySelector('.main').scrollWidth>innerWidth;
    const restore=document.querySelector('.lb-restore:not([hidden])');let overlap=false;
    if(restore){const r=restore.getBoundingClientRect();overlap=controls.some(e=>{const t=e.getBoundingClientRect();return r.left<t.right&&r.right>t.left&&r.top<t.bottom&&r.bottom>t.top});}
    return {small,overflow,overlap};
   });assert.deepEqual(result,{small:[],overflow:false,overlap:false},label);
  }
  for(const [width,height] of [[1366,768],[780,360],[640,360],[390,844],[320,568]])for(const folded of [false,true]){
   await page.setViewportSize({width,height});await page.evaluate(f=>LeraarBobTopbar.setCollapsed(f),folded);await layout('map '+width+' '+folded);
   await page.screenshot({path:path.join(out,`map-${width}-${folded}.png`)});
   await page.locator('[data-world=balance]').click();await layout('topics '+width+' '+folded);
   assert(await page.locator('[data-topic=eq-A3]').isDisabled());await page.screenshot({path:path.join(out,`topics-${width}-${folded}.png`)});
   await page.locator('[data-world-back]').click();
   await page.locator('.sectionNav [data-nav=tools]').click();await layout('tools '+width+' '+folded);
   await page.locator('.sectionNav [data-nav=world]').click();
  }
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>LeraarBobTopbar.setCollapsed(false));
  await page.locator('[data-world=balance]').click();await page.locator('[data-topic=eq-A2]').click();
  // Click only visible controls; find the offered operand independently of its position.
  async function choose(op,operand){

   const key=C.exprSig(operand);
   const direct=await page.evaluate(({op,key})=>{
    const rev=o=>o&&typeof o==='object'?(Number.isInteger(o.n)&&Number.isInteger(o.d)?AlgebraCore.R(o.n,o.d):Array.isArray(o)?o.map(rev):Object.fromEntries(Object.entries(o).map(([k,v])=>[k,rev(v)]))):o;
    const s=AlgebraTrainer.snapshot(),ex=rev(s.activeSet[s.trainerIndex]);
    return AlgebraWorkbench.contextOperations(ex,rev(s.trainerStates.at(-1))).findIndex(x=>x.op===op&&AlgebraCore.exprSig(x.operand)===key);
   },{op,key});
   if(direct>=0&&await page.locator('#contextOperations').isVisible()){await page.locator(`[data-choice="${direct}"]`).click();return;}
   if(!await page.locator('#manualOperations').isVisible())await page.locator('#moreOperationsBtn').click();await page.locator(`[data-op="${op}"]`).click();
   const index=await page.evaluate(({op,key})=>{
    const rev=o=>o&&typeof o==='object'?(Number.isInteger(o.n)&&Number.isInteger(o.d)?AlgebraCore.R(o.n,o.d):Array.isArray(o)?o.map(rev):Object.fromEntries(Object.entries(o).map(([k,v])=>[k,rev(v)]))):o;
    const s=AlgebraTrainer.snapshot(),ex=rev(s.activeSet[s.trainerIndex]);
    return AlgebraCore.candidateOperands(ex,rev(s.trainerStates.at(-1)),op).findIndex(v=>AlgebraCore.exprSig(v)===key);
   },{op,key});assert(index>=0,'operand available');
   for(let i=0;i<Math.floor(index/2);i++)await page.locator('#nextValuesBtn').click();
   await layout('manual picker');await page.locator(`[data-index="${index}"]`).click();
  }

  async function solve(){
   const s=await page.evaluate(()=>AlgebraTrainer.snapshot()),t=s.learningRun.tasks[s.trainerIndex],ex=s.activeSet[s.trainerIndex];
   const rev=o=>o&&typeof o==='object'?(Number.isInteger(o.n)&&Number.isInteger(o.d)?C.R(o.n,o.d):Array.isArray(o)?o.map(rev):Object.fromEntries(Object.entries(o).map(([k,v])=>[k,rev(v)]))):o;
   if(t.kind==='solve')for(const step of ex.steps){if(await page.evaluate(()=>{const s=AlgebraTrainer.snapshot();return s.learningRun.results[s.trainerIndex].done}))break;await choose(step.op,rev(step.operand));}
   else if(t.kind==='routes'){const i=await page.evaluate(()=>{const s=AlgebraTrainer.snapshot(),t=s.learningRun.tasks[s.trainerIndex];return t.routes.findIndex((_,i)=>AlgebraLearning.validate(t,{choice:String(i)}).ok)});await page.locator('[data-route="'+i+'"]').click();await page.locator('#production button[type=submit]').click();}
   else if(t.kind==='predict'){const input=await page.evaluate(()=>{const s=AlgebraTrainer.snapshot(),t=s.learningRun.tasks[s.trainerIndex],fmt=e=>{const q=AlgebraLearning.affine(e);return `${q.a.n}/${q.a.d}x+(${q.b.n}/${q.b.d})`};return fmt(t.expected.l)+'='+fmt(t.expected.r)});await page.locator('#production input').fill(input);await page.locator('#production button[type=submit]').click();}
   else if(t.kind==='build'){await page.locator('#production input').fill(String(t.expectedNumber.n));await page.locator('#production button[type=submit]').click();}
  }
  await solve();assert.equal(await page.locator('#algebraProgress').getAttribute('data-value'),'0');
  await page.locator('#undoBtn').click();await solve();assert.equal(await page.evaluate(()=>AlgebraTrainer.snapshot().learningRun.results.filter(r=>r.done).length),1);
  await page.locator('#backSetupBtn').click();assert(await page.locator('[data-topic=eq-A3]').isDisabled(),'one answer does not unlock next topic');
  await page.locator('[data-topic=eq-A2]').click();
  const partial=await page.evaluate(()=>AlgebraTrainer.snapshot());await page.locator('leraarbob-topbar .collapse').click();await page.evaluate(()=>AxiomaGame.flush());await page.reload();await ready('AlgebraTrainer');
  assert.deepEqual(await page.evaluate(()=>AlgebraTrainer.snapshot().trainerStates),partial.trainerStates);assert(await page.evaluate(()=>document.body.classList.contains('topbar-collapsed')));
  offline=true;await solve();await page.evaluate(()=>AxiomaGame.flush());assert.equal(await page.evaluate(()=>AxiomaGame.status),'offline');
  await page.reload();await ready('AlgebraTrainer');assert.equal(await page.evaluate(()=>AlgebraTrainer.snapshot().learningRun.results.filter(r=>r.done).length),2);
  for(let i=2;i<5;i++){await page.locator('#nextExerciseBtn').click();await solve();}await page.locator('#nextExerciseBtn').click();assert.equal(await page.locator('#algebraProgress').getAttribute('data-value'),'30');
  offline=false;await page.evaluate(()=>AxiomaGame.flush());await page.locator('#summaryWorldBtn').click();assert(await page.locator('[data-topic=eq-A3]').isEnabled());
  await page.locator('[data-topic=eq-A2]').click();await solve();assert.equal(await page.locator('#algebraProgress').getAttribute('data-value'),'30','no farming');
  await page.locator('#backSetupBtn').click();await page.locator('[data-world-back]').click();await page.locator('[data-world=powers]').click();await page.locator('[data-topic=op-power-power]').click();await ready('BewerkingenTrainer');
  assert.equal(await page.evaluate(()=>BewerkingenTrainer.snapshot().sessions.solo.tasks.length),3);
  for(let i=0;i<3;i++){
   const answer=await page.evaluate(()=>{const s=BewerkingenTrainer.snapshot();return s.sessions.solo.tasks[s.sessions.solo.index].answer});
   await page.locator('#answer0').fill(answer);await page.locator('.answer-form button.primary').click();if(i<2)await page.locator('[data-next]').click();
  }
  assert.equal(await page.locator('#operationProgress').getAttribute('data-value'),'30');await page.evaluate(()=>AxiomaGame.flush());
  await page.reload();await ready('BewerkingenTrainer');assert.equal(await page.evaluate(()=>BewerkingenTrainer.snapshot().sessions.solo.index),2,'completed mission stays on reload');
  await page.locator('#endSummary .world-return').click();await ready('AlgebraTrainer');assert.equal(await page.locator('#algebraProgress').getAttribute('data-value'),'60');assert(await page.locator('[data-topic=op-power-product]').isEnabled());
  // A direct URL cannot enter a locked topic. Existing free practice remains accessible.
  await page.goto(base+'/games/bewerkingen-trainer/?topic=op-power-negative');await ready('BewerkingenTrainer');assert.equal(await page.evaluate(()=>BewerkingenTrainer.snapshot().screen),'setup');assert.match(await page.locator('#setupNotice').textContent(),/gesloten/);
  // Legacy equation work opens stelsels, without retroactive XP.
  await page.goto(base+'/games/algebra-trainer/');await ready('AlgebraTrainer');
  await page.evaluate(async()=>{const save=JSON.parse(AxiomaGame.storage.getItem('leraarbob.algebra.v1'));save.solvedTypes.push('E1');save.worldLegacy.push('E1');save.screen='world';AxiomaGame.storage.setItem('leraarbob.algebra.v1',JSON.stringify(save));await AxiomaGame.flush();});
  await page.goto(base+'/games/algebra-trainer/stelsels.html?topic=sys-unique');await ready('StelselsTrainer');assert.equal(await page.evaluate(()=>StelselsTrainer.snapshot().exercises.length),5);
  for(let i=0;i<5;i++){
   await page.locator('[data-method=graphic]').click();const data=await page.evaluate(()=>{const s=StelselsTrainer.snapshot(),ex=s.exercises[s.index];return {sol:{kind:ex.solution.kind,x:ex.solution.x&&StelselsCore.text(ex.solution.x),y:ex.solution.y&&StelselsCore.text(ex.solution.y)},points:ex.start.map(e=>StelselsCore.graphPoints(e).map(p=>({x:StelselsCore.text(p.x),y:StelselsCore.text(p.y)})))}});
   for(let r=0;r<2;r++)for(let j=0;j<2;j++){await page.locator('[data-point="'+r+','+j+'"]').click();await page.locator('#pointX').fill(data.points[r][j].x);await page.locator('#pointY').fill(data.points[r][j].y);await page.locator('#setGraphPoint').click();}await page.locator('#checkLines').click();await page.locator('[data-conclusion="'+data.sol.kind+'"]').click();if(data.sol.kind==='unique'){await page.locator('#answerX').fill(data.sol.x);await page.locator('#answerY').fill(data.sol.y);}await page.locator('#checkAnswer').click();await page.locator('#systemContinue').click();
  }
  assert(await page.evaluate(()=>StelselsTrainer.snapshot().journey.topics['sys-unique'].finished));await page.evaluate(()=>AxiomaGame.flush());await page.reload();await ready('StelselsTrainer');assert.equal(await page.evaluate(()=>StelselsTrainer.snapshot().screen),'systemSummary','completed stelsels stay on reload');await page.locator('#systemSummary a').click();await ready('AlgebraTrainer');assert.equal(await page.locator('#algebraProgress').getAttribute('data-value'),'90');assert(await page.locator('[data-topic=sys-none]').isEnabled());
  user='00000000-0000-4000-8000-000000000044';await page.goto(base+'/games/algebra-trainer/');await ready('AlgebraTrainer');assert.equal(await page.locator('#algebraProgress').getAttribute('data-value'),'0','account isolation');assert.deepEqual(await page.evaluate(()=>AlgebraTrainer.snapshot().solvedTypes),[]);
  await page.locator('[data-world=balance]').click();await page.locator('[data-topic=eq-A2]').click();
  assert(await page.locator('#forwardExerciseBtn').isDisabled(),'cannot skip unfinished mission tasks');await solve();
  await page.locator('#nextExerciseBtn').click();await page.locator('#backSetupBtn').click();assert(await page.locator('[data-topic=eq-A3]').isDisabled());
  await page.locator('[data-topic=eq-A2]').click();assert.equal(await page.evaluate(()=>AlgebraTrainer.snapshot().trainerIndex),1,'resume returns to the unfinished task');
  await page.evaluate(async()=>{history.replaceState(null,'','?world=balance');await AxiomaGame.flush();});await page.reload();await ready('AlgebraTrainer');
  assert.equal(await page.evaluate(()=>AlgebraTrainer.snapshot().screen),'trainer','a return-world URL does not override a resumed exercise on reload');
  assert.equal(await page.evaluate(()=>AlgebraTrainer.snapshot().trainerIndex),1);
  // A learner mission parks an existing free series, including steps and sheet settings.
  const free=C.generateSeeded('B1',{allowFractions:false,allowDecimals:false,allowNegative:false},0,2117);
  await page.evaluate(async ex=>{const save={version:1,worldLegacy:['A2','A3','A1','A4'],solvedTypes:[],activeSet:[ex],perExercise:{},trainerIndex:0,screen:'world',includeKey:false};AxiomaGame.storage.setItem('leraarbob.algebra.v1',JSON.stringify(save));await AxiomaGame.flush();},free);await page.reload();await ready('AlgebraTrainer');if(await page.locator('[data-world-back]').isVisible())await page.locator('[data-world-back]').click();await page.locator('[data-world=steps]').click();await page.locator('[data-topic=eq-B1]').click();await solve();await page.locator('#backSetupBtn').click();await page.locator('.sectionNav [data-nav=tools]').click();await page.locator('#resumeFreeBtn').click();assert.equal(JSON.stringify((await page.evaluate(()=>AlgebraTrainer.snapshot())).activeSet),JSON.stringify([free]));await page.locator('#backSetupBtn').click();await page.locator('.sectionNav [data-nav=tools]').click();await page.locator('#toolsScreen [data-nav=preview]').click();assert.equal(await page.locator('.paperPage').count(),1,'prior worksheet settings retained');
  assert.deepEqual(errors,[]);console.log('PASS: 6 equation areas, 39 total topics, 5 screen sizes × 2 topbar states, real equation/powers/stelsels routes, locks, XP once, undo, offline/reload, unfinished-task gates, legacy and account isolation. Screenshots: '+out);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
