const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const Touch=require('./algebra-v04-touch-controls.cjs');
const root=path.resolve(__dirname,'..'),out=process.env.ALGEBRA_SCREENSHOTS||'/tmp/algebrawereld-v045';
const C=require(root+'/games/algebra-trainer/core.js'),L=require(root+'/games/algebra-trainer/learning-core.js');
const expression=e=>e.t==='num'?e.q.n+'/'+e.q.d:e.t==='var'?'x':e.t==='add'?'('+e.terms.map(expression).join('+')+')':e.t==='mul'?'('+e.factors.map(expression).join('*')+')':'('+expression(e.n)+')/('+expression(e.d)+')';
const eq=e=>expression(e.l)+'='+expression(e.r),val=q=>q.n+'/'+q.d;
const revive=s=>JSON.parse(JSON.stringify(s),(k,v)=>v&&typeof v==='object'&&Object.keys(v).length===2&&Number.isSafeInteger(v.n)&&Number.isSafeInteger(v.d)?new C.Rat(v.n,v.d):v);
async function solveTask(page){
 let snap=revive(await page.evaluate(()=>AlgebraTrainer.snapshot())),t=snap.learningRun.tasks[snap.trainerIndex];
 if(t.kind==='fractions'){await require('./algebra-v045-fraction-controls.cjs').solve(page);}else if(t.kind==='solve'){
  for(const step of t.ex.steps){
   if(await page.locator('#nextBox').isVisible())break;
   const label=(step.op==='*'?'·':step.op==='/'?'÷':step.op==='-'?'−':'+')+' '+C.fallbackText(C.latexExpr(step.operand,t.ex.policy))+' op beide leden';
   const direct=page.locator('.contextOp').filter({hasText:'__never__'}); // Manual choices also test operand pagination.
   if(!await page.locator('#manualOperations').isVisible())await page.locator('#moreOperationsBtn').click();
   await page.locator('.opBtn[data-op="'+step.op+'"]').click();
   for(let p=0;p<12;p++){
    const choice=page.locator('#valueGrid button[aria-label="'+label.replace(/"/g,'\\"')+'"]');
    if(await choice.count()){await choice.click();await page.clock.runFor(5000);break;}
    assert.equal(await page.locator('#nextValuesBtn').isEnabled(),true,'Canonical operand missing: '+label);await page.locator('#nextValuesBtn').click();
   }
  }
 }else if(['predict','repair','expand'].includes(t.kind)){
  if(t.kind==='repair')await page.locator('[data-location="'+t.location+'"]').click();
  await Touch.equation(page,eq(t.expected));await Touch.submit(page);
 }else if(t.kind==='build'){
  await Touch.put(page,'input',val(t.expectedNumber));await Touch.submit(page);
 }else if(t.kind==='verify'){
  await Touch.verify(page);
 }else if(t.kind==='routes'){
  const i=t.routes.findIndex((s,i)=>L.validate(t,{choice:String(i)}).ok);assert.ok(i>=0);await page.locator('[data-route="'+i+'"]').click();await page.locator('#production button[type=submit]').click();
 }
 assert.equal(await page.locator('#nextBox').isVisible(),true,t.kind+' should be complete');
}
async function bounds(page,selector){return page.locator(selector).evaluateAll(els=>els.filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {text:(e.innerText||e.getAttribute('aria-label')||'').slice(0,50),x:r.x,y:r.y,w:r.width,h:r.height,screenW:innerWidth,screenH:innerHeight}}));}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{let p=path.join(root,new URL(req.url,'http://local').pathname);if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');if(!fs.existsSync(p)){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'})[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p));});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.ALGEBRA_CHROMIUM_PATH?{executablePath:process.env.ALGEBRA_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']}:{})});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[],missing=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.fulfill({body:''}));page.on('response',r=>{if(r.status()===404)missing.push(r.url())});
 const url='http://127.0.0.1:'+server.address().port+'/games/algebra-trainer/';
 await page.goto(url);await page.waitForSelector('#navigationScreen:not(.hidden)');assert.equal(await page.locator('#navigationVersion').textContent(),'v0.4.5');await page.locator('[data-menu-nav=world]').click();await page.waitForSelector('[data-stop]');assert.equal(await page.locator('[data-world]').count(),5);assert.equal(await page.locator('[data-stop]').count(),7);
 await page.clock.install();
 for(const [w,h] of [[1280,800],[780,360],[640,360],[390,844]]){
  await page.setViewportSize({width:w,height:h});await page.screenshot({path:out+'/map-'+w+'x'+h+'.png'});
  for(const r of await bounds(page,'.routeStop,.worldChoice,.routeDock'))assert.ok(r.x>=-1&&r.y>=-1&&r.x+r.w<=w+1&&r.y+r.h<=h+1,JSON.stringify(r));
 }
 checks.push('Worlds and stops fit desktop, A20 landscape, 640×360 and portrait');
 await page.setViewportSize({width:780,height:360});await page.locator('[data-start]').click();await page.screenshot({path:out+'/work-780x360.png'});
 await solveTask(page);const saved=await page.evaluate(()=>AlgebraTrainer.snapshot());await page.reload();await page.waitForSelector('#trainerScreen:not(.hidden)');assert.deepEqual(await page.evaluate(()=>AlgebraTrainer.snapshot().trainerStates),saved.trainerStates);checks.push('Work and completed task survive reload');
 await page.locator('#nextExerciseBtn').click();
 // A wrong full rule must not unlock the next task.
 await Touch.wrongEquation(page);await Touch.submit(page);assert.equal(await page.locator('#nextBox').isVisible(),false);assert.equal(await page.locator('#forwardExerciseBtn').isEnabled(),false);checks.push('Incorrect rule blocks next task');
 await solveTask(page);await page.locator('#nextExerciseBtn').click();await solveTask(page);await page.locator('#nextExerciseBtn').click();
 for(let i=3;i<6;i++){await solveTask(page);await page.locator('#nextExerciseBtn').click();}
 await page.waitForSelector('#summaryScreen:not(.hidden)');await page.screenshot({path:out+'/summary-780x360.png'});checks.push('Mixed six-task mission reaches evidence summary');
 await page.locator('#summaryWorldBtn').click();assert.ok((await page.locator('[data-stop="route-inverse"]').getAttribute('class')).includes('independent'));
 const ids=['route-two','route-sign','route-both','route-brackets','route-fractions','route-check'];
 await page.setViewportSize({width:1280,height:800});
 for(const id of ids){await page.locator('[data-stop="'+id+'"]').click();await page.locator('[data-start]').click();for(let i=0;i<6;i++){await solveTask(page);if(i===1&&id==='route-brackets')await page.screenshot({path:out+'/repair-desktop.png'});if(i===2&&id==='route-fractions')await page.screenshot({path:out+'/fraction-desktop.png'});await page.locator('#nextExerciseBtn').click();}await page.locator('#summaryWorldBtn').click();}
 assert.ok((await page.locator('.routeHeading').innerText()).includes('7 / 7'));assert.ok((await page.locator('.routeHeading').innerText()).includes('210 XP'));checks.push('All seven stops finish via actual controls; XP totals 210');
 await page.locator('[data-stop="route-check"]').click();await page.locator('[data-start]').click();for(let i=0;i<6;i++){await solveTask(page);await page.locator('#nextExerciseBtn').click();}assert.equal(await page.evaluate(()=>AlgebraJourney.xp(AlgebraTrainer.snapshot().chapterJourney)),210);checks.push('Replay earns no duplicate XP');
 const oldQuestions=await page.evaluate(()=>AlgebraTrainer.snapshot().learningRun.tasks.map(AlgebraJourney.questionSignature));await page.locator('#summaryReplayBtn').click();assert.ok((await page.evaluate(()=>AlgebraTrainer.snapshot().learningRun.tasks.map(AlgebraJourney.questionSignature))).every(q=>!oldQuestions.includes(q)));assert.equal(await page.evaluate(()=>AlgebraJourney.xp(AlgebraTrainer.snapshot().chapterJourney)),210);await page.locator('#backSetupBtn').click();await page.locator('[data-menu-nav=world]').click();checks.push('Summary replay produces six different questions and preserves 210 earned XP');
 // Use the existing menu without touching accounts or a backend.
 await page.goto(url+'?screen=preview');await page.waitForSelector('#previewScreen:not(.hidden)');assert.equal(await page.locator('.missionQuestions article').count(),6);assert.equal(await page.locator('.missionAnswers article').count(),6);await page.pdf({path:out+'/mission-print.pdf',format:'A4',printBackground:true});checks.push('Mission print contains six exact prompts and six matching answers');

 // A new mission parks and restores a freely generated series, including its work.
 await page.locator('leraarbob-topbar .menu:visible,leraarbob-topbar .mobile-menu:visible').first().click();await page.locator('leraarbob-topbar dialog').getByRole('button',{name:'Haltes',exact:true}).click();await page.locator('[data-menu-nav=setup]').click();await page.locator('#startTrainerBtn').click();
 const free=await page.evaluate(()=>AlgebraTrainer.snapshot());assert.equal(free.learningRun,null);
 await page.locator('#backSetupBtn').click();await page.locator('[data-menu-nav=world]').click();await page.locator('[data-stop="route-two"]').click({timeout:5000});await page.locator('[data-start]').click();
 await page.locator('leraarbob-topbar .menu:visible,leraarbob-topbar .mobile-menu:visible').first().click();await page.locator('leraarbob-topbar dialog').getByRole('button',{name:'Haltes',exact:true}).click();assert.equal(await page.locator('#navigationResumeFree').isVisible(),true);await page.locator('#navigationResumeFree').click();
 assert.deepEqual(await page.evaluate(()=>AlgebraTrainer.snapshot().activeSet),free.activeSet);checks.push('Free series is parked and restored when entering a mission');
 await page.locator('leraarbob-topbar .menu:visible,leraarbob-topbar .mobile-menu:visible').first().click();await page.locator('leraarbob-topbar dialog').getByRole('button',{name:'Haltes',exact:true}).click();await page.locator('[data-menu-nav=preview]').click();assert.equal(await page.locator('.exercise').count(),free.activeSet.length);assert.equal(await page.locator('.answerItem').count(),free.activeSet.length);checks.push('Existing free-series print and worked key remain available');
 const oldFree=await page.evaluate(()=>AlgebraTrainer.snapshot().activeSet.map(e=>AlgebraCore.eqSig(e.start)));await page.locator('#regenBtn').click();assert.ok((await page.evaluate(()=>AlgebraTrainer.snapshot().activeSet.map(e=>AlgebraCore.eqSig(e.start)))).every(q=>!oldFree.includes(q)));checks.push('Regenerating a free series excludes its previous equations');
 // Restore an actual legacy save with a partly worked B1 mission and earned A-level records.
 const W=require(root+'/games/algebra-trainer/world-core.js');let old=W.normalize(null);for(const skill of ['A1','A2','A3','A4'])old=W.recordMission(old,'eq-'+skill,Array.from({length:5},()=>({done:true,supported:false}))).progress;
 const oldRun=L.mission('B1',99),work={0:{states:oldRun.tasks[0].ex.states.slice(0,2),log:oldRun.tasks[0].ex.steps.slice(0,1)}};oldRun.work=work;
 const fixture={version:1,runs:{'eq-B1':oldRun},journey:old,worldLegacy:['A1','A2','A3','A4'],mission:'eq-B1',mapLocation:'steps',activeSet:oldRun.tasks.map(t=>t.ex),trainerIndex:0,perExercise:work,screen:'trainer',solvedTypes:['A1'],settings:{allowFractions:false,allowDecimals:false,allowNegative:false},selection:{},includeKey:true,shuffle:true};
 // The simulated clock replaces navigation timing entries; use the plain URL
 // so a world deep-link cannot override the fixture's restored screen.
 await page.goto(url);await page.waitForSelector('[data-stop]',{state:'attached'});await page.evaluate(f=>AxiomaGame.storage.setItem('leraarbob.algebra.v1',JSON.stringify(f)),fixture);await page.reload();await page.waitForSelector('#trainerScreen:not(.hidden)');
 assert.equal(await page.evaluate(()=>AlgebraTrainer.snapshot().mission),'eq-B1');assert.deepEqual(await page.evaluate(()=>AlgebraTrainer.snapshot().trainerStates),JSON.parse(JSON.stringify(work[0].states)));
 await page.locator('#backSetupBtn').click();await page.locator('[data-menu-nav=world]').click();assert.equal(await page.locator('[data-start]').getAttribute('data-start'),'eq-B1');assert.ok((await page.locator('[data-stop="route-inverse"]').getAttribute('class')).includes('finished'));assert.equal((await page.locator('[data-stop="route-inverse"]').getAttribute('class')).includes('independent'),false);
 await page.locator('[data-start]').click();assert.deepEqual(await page.evaluate(()=>AlgebraTrainer.snapshot().trainerStates),JSON.parse(JSON.stringify(work[0].states)));assert.equal(await page.evaluate(()=>AlgebraWorld.xp(AlgebraTrainer.snapshot().journey)),120);checks.push('Legacy mission, its intermediate step and 120 earned XP resume unchanged; regrouping awards no mastery');
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);checks.push('No JavaScript errors or missing project resources');
 fs.writeFileSync(out+'/browser-checks.json',JSON.stringify({ok:true,checks,errors,missing},null,2));console.log(JSON.stringify({ok:true,checks}));await browser.close();await new Promise(r=>server.close(r));
})().catch(e=>{console.error(e);process.exit(1)});
