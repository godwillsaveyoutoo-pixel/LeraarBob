const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=process.env.ALGEBRA_SCREENSHOTS||'/tmp/algebrawereld-v045';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{let p=path.join(root,new URL(req.url,'http://local').pathname);if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');if(!fs.existsSync(p)){res.writeHead(404).end();return}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2'})[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p))});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.ALGEBRA_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.fulfill({body:''}));
 const C=require(root+'/games/algebra-trainer/core.js'),J=require(root+'/games/algebra-trainer/journey-core.js'),L=require(root+'/games/algebra-trainer/learning-core.js'),T=require(root+'/games/algebra-trainer/touch-core.js'),Touch=require('./algebra-v04-touch-controls.cjs');
 const base='http://127.0.0.1:'+server.address().port+'/games/algebra-trainer/';await page.goto(base);await page.waitForSelector('[data-stop]',{state:'attached'});await page.clock.install();
 async function load(run,index,screen='trainer'){
  const fixture={version:1,runs:{[run.skill]:run},chapterJourney:J.normalize(null),journey:null,mission:run.skill,activeSet:run.tasks.map(t=>t.ex),trainerIndex:index,perExercise:{},screen,settings:{allowFractions:false,allowDecimals:false,allowNegative:false},selection:{},includeKey:true,shuffle:true};
  await page.evaluate(f=>AxiomaGame.storage.setItem('leraarbob.algebra.v1',JSON.stringify(f)),fixture);await page.reload();await page.waitForSelector('#'+screen+'Screen:not(.hidden)');
 }
 const viewports=[[1280,800],[780,360],[640,360],[390,844],[320,700]];
 async function fits(name,selector='#touchAnswer button,#production button,.trainHead button,#checkBtn'){
  for(const [w,h] of viewports){
   await page.setViewportSize({width:w,height:h});await page.clock.runFor(100);
   await page.screenshot({path:out+'/touch-'+name+'-'+w+'x'+h+'.png'});
   const bad=await page.locator(selector).evaluateAll(es=>es.filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent.slice(0,35),x:r.x,y:r.y,w:r.width,h:r.height}}).filter(r=>r.x<-1||r.y<-1||r.x+r.w>innerWidth+1||r.y+r.h>innerHeight+1));
   assert.deepEqual(bad,[],name+' '+w+'x'+h);assert.equal(await page.locator('.katex-error').count(),0);
   const overflow=await page.locator('.termTile>.katex,.touchFieldMath>.katex').evaluateAll(es=>es.filter(e=>e.getClientRects().length).filter(e=>e.getBoundingClientRect().width>e.parentElement.getBoundingClientRect().width+1).map(e=>e.textContent.slice(0,40)));
   assert.deepEqual(overflow,[],name+' mathematical terms fit their controls');
  }
  await page.setViewportSize({width:780,height:360});
 }
 for(const [id,index] of [['route-two',2],['route-brackets',1],['route-brackets',5],['route-two',5],['route-check',4]]){
  const run=J.mission(id,731),t=run.tasks[index];await load(run,index);
  assert.equal(await page.locator('#trainerScreen input').count(),0,t.kind+' has no typing field');
  assert.equal(await page.locator('#touchModeBtn,[data-token],[data-edit-action=left],[data-edit-action=right]').count(),0,'No character keypad or cursor modes');
  if(t.kind==='repair'){await fits('repair-locate');await page.locator('[data-location="'+t.location+'"]').click();}
  if(t.kind==='verify'){await fits('verify-intro');await page.locator('#substituteBtn').click();}
  await fits(t.kind);
  if(t.kind==='predict'){await Touch.wrongEquation(page);await Touch.submit(page);assert.equal(await page.locator('#nextBox').isVisible(),false);await page.locator('#undoBtn').click();assert.ok(await page.evaluate(()=>AlgebraTrainer.snapshot().learningRun.results[AlgebraTrainer.snapshot().trainerIndex].buildHistory.length>=0));}
  if(t.kind==='build')await Touch.put(page,'input',T.expressionText(C.N(t.expectedNumber)));
  else if(t.kind==='verify')await Touch.verify(page);
  else await Touch.equation(page,T.expressionText(t.expected.l)+'='+T.expressionText(t.expected.r));
  const before=await page.evaluate(()=>AlgebraTrainer.snapshot().learningRun.results[AlgebraTrainer.snapshot().trainerIndex]);
  await page.reload();await page.waitForSelector('#trainerScreen:not(.hidden)');assert.deepEqual(await page.evaluate(()=>AlgebraTrainer.snapshot().learningRun.results[AlgebraTrainer.snapshot().trainerIndex]),before);
  await Touch.submit(page);assert.equal(await page.locator('#nextBox').isVisible(),true,t.kind+' solved entirely by tapping');
 }
 function example(task,start,solution,steps,type){const states=[start];steps.forEach(s=>states.push(C.applyEquation(states.at(-1),s.op,s.operand)));task.ex={...task.ex,start,solution,steps,states,type,policy:{allowNegative:true,allowFractions:false,allowDecimals:false}};}
 // The teacher's exact example uses whole terms, meaningful sign and operation errors.
 const built=J.mission('route-two',908),bt=built.tasks[2],bs=L.parseEquation('-7x+2=-19');example(bt,bs,C.R(3),[{op:'-',operand:C.N(2)},{op:'/',operand:C.N(-7)}],'B3');bt.operation=bt.ex.steps[0];bt.expected=C.applyEquation(bs,'-',C.N(2));bt.prompt='Bouw de regel na − 2 op beide leden.';
 await load(built,2);const keys=await page.locator('[data-term]').evaluateAll(es=>es.map(e=>e.dataset.term));for(const term of ['-7x','7x','-21','-17'])assert.ok(keys.includes(C.exprSig(L.parseExpression(term))),term+' is a contextual term');assert.ok(keys.length<=6);
 await Touch.equation(page,'7x=-21');await Touch.submit(page);assert.equal(await page.locator('#nextBox').isVisible(),false);assert.match(await page.locator('#feedback').textContent(),/minteken/);
 await Touch.put(page,'lhs','-7x');await page.locator('#undoBtn').click();assert.equal(await page.evaluate(()=>AlgebraTrainer.snapshot().learningRun.results[2].input.split('=')[0]),'');
 await Touch.put(page,'lhs','-7x');await fits('teacher-building');await Touch.submit(page);assert.equal(await page.locator('#nextBox').isVisible(),true);
 // The second screenshot: substitute -6, calculate 18 and compare with the existing 20.
 const proof=J.mission('route-check',940),pt=proof.tasks[4],ps=L.parseEquation('-2x+6=20');example(pt,ps,C.R(-7),[{op:'-',operand:C.N(6)},{op:'/',operand:C.N(-2)}],'B3');pt.proposed=C.R(-6);
 await load(proof,4);assert.match(await page.locator('#taskPrompt').textContent(),/Is x = -6 een oplossing/);await page.locator('#substituteBtn').click();
 assert.ok((await page.locator('[data-proof=left]').getAttribute('data-math-tex')).includes('\\left(-6\\right)'));await fits('teacher-substitution');
 const vals=T.valueChoices(pt,'left'),wrong=vals.findIndex(v=>v.expr.q.eq(C.R(20))),correct=vals.findIndex(v=>v.expr.q.eq(C.R(18)));assert.ok(wrong>=0&&correct>=0);
 await page.locator('[data-proof-value="'+wrong+'"]').click();assert.equal(await page.evaluate(()=>AlgebraTrainer.snapshot().learningRun.results[4].verifyPhase),1);assert.match(await page.locator('#feedback').textContent(),/hoort bij rechts/);
 await page.locator('[data-proof-value="'+vals.findIndex(v=>v.expr.q.eq(C.R(-6)))+'"]').click();assert.match(await page.locator('#feedback').textContent(),/min maal min/);
 await page.locator('[data-proof-value="'+vals.findIndex(v=>v.expr.q.eq(C.R(12)))+'"]').click();assert.match(await page.locator('#feedback').textContent(),/losse term/);
 await page.reload();await page.waitForSelector('#trainerScreen:not(.hidden)');assert.equal(await page.evaluate(()=>AlgebraTrainer.snapshot().learningRun.results[4].verifyPhase),1);
 const own=await page.evaluate(()=>AlgebraTrainer.snapshot());await page.locator('#watchDemoBtn').click();assert.ok((await page.evaluate(()=>AlgebraTrainer.animationSnapshot().example.steps))>=3);await page.clock.runFor(1800);
 assert.ok(await page.locator('.motion-new').count()>0);await page.locator('#lessonPauseBtn').click();const paused=await page.evaluate(()=>AlgebraTrainer.animationSnapshot().tex);await page.clock.runFor(9000);assert.equal(await page.evaluate(()=>AlgebraTrainer.animationSnapshot().tex),paused);
 await fits('proof-demo-substitution','#liveLessonPanel button,#lessonCaption,.derivationMath,.previousEquation,.trainHead button');await page.locator('#lessonPauseBtn').click();await page.clock.runFor(2200);await page.locator('#lessonPauseBtn').click();
 await fits('proof-demo-values','#liveLessonPanel button,#lessonCaption,.derivationMath,.previousEquation,.trainHead button');await page.locator('#lessonReplayBtn').click();assert.equal(await page.evaluate(()=>AlgebraTrainer.animationSnapshot().index),0);await page.clock.runFor(10000);assert.equal(await page.evaluate(()=>AlgebraTrainer.animationSnapshot().finished),true);await page.locator('#lessonReturnBtn').click();
 const restored=await page.evaluate(()=>AlgebraTrainer.snapshot());assert.equal(restored.learningRun.results[4].verifyPhase,1);assert.deepEqual(restored.trainerStates,own.trainerStates);assert.equal(restored.learningRun.results[4].right,own.learningRun.results[4].right);
 await page.locator('[data-proof-value="'+correct+'"]').click();assert.equal(await page.evaluate(()=>AlgebraTrainer.snapshot().learningRun.results[4].verifyPhase),3);assert.equal(await page.locator('[data-proof=left]').getAttribute('data-math-tex'),'18');assert.equal(await page.locator('[data-proof=right]').getAttribute('data-math-tex'),'20');await fits('teacher-comparison');
 await page.locator('[data-answer=yes]').click();assert.equal(await page.locator('#nextBox').isVisible(),false);await page.locator('[data-answer=no]').click();assert.equal(await page.locator('#nextBox').isVisible(),true);assert.match(await page.locator('#feedback').textContent(),/geen oplossing/);
 await page.locator('#historyBtn').click();assert.equal(await page.locator('#historyPosition').textContent(),'4 / 4');assert.ok((await page.locator('#historyEquation').getAttribute('data-math-tex')).includes('18 \\ne 20'));await page.locator('#historyPrevBtn').click();await page.locator('#historyPrevBtn').click();assert.ok((await page.locator('#historyEquation').getAttribute('data-math-tex')).includes('\\left(-6\\right)'));await page.locator('#closeHistoryBtn').click();assert.equal(await page.locator('#nextBox').isVisible(),true);
 // Verification with x on both sides asks for both calculations, and can finish with equality.
 const equalRun=J.mission('route-check',948),eqt=equalRun.tasks[4];eqt.proposed=eqt.ex.solution;await load(equalRun,4);await page.locator('#substituteBtn').click();assert.ok(C.containsVar(eqt.ex.start.l)&&C.containsVar(eqt.ex.start.r));const left=T.valueChoices(eqt,'left').findIndex(v=>v.expr.q.eq(L.evaluate(eqt.ex.start.l,eqt.proposed)));await page.locator('[data-proof-value="'+left+'"]').click();assert.equal(await page.evaluate(()=>AlgebraTrainer.snapshot().learningRun.results[4].verifyPhase),2);await fits('verify-right');await Touch.verify(page);assert.match(await page.locator('#feedback').textContent(),/is een oplossing/);
 // Both mathematically equivalent inverse operations remain visible and work.
 const run=J.mission('route-inverse',992),start=C.EQ(C.Mul(C.N(C.R(1,3)),C.V()),C.N(4)),op={op:'/',operand:C.N(C.R(1,3))};example(run.tasks[0],start,C.R(12),[op],'A1');await load(run,0);const mul=page.locator('#contextOperations button[aria-label="· 3 op beide leden"]');assert.equal(await mul.isVisible(),true);await mul.click();await page.clock.runFor(5000);assert.equal(await page.locator('#nextBox').isVisible(),true);const multiplied=await page.evaluate(()=>AlgebraCore.eqSig(AlgebraTrainer.snapshot().trainerStates.at(-1)));await page.locator('#historyBtn').click();assert.equal(await page.locator('#historyPosition').textContent(),'2 / 2');await page.locator('#historyPrevBtn').click();assert.equal(await page.locator('#historyPosition').textContent(),'1 / 2');await page.locator('#closeHistoryBtn').click();await page.locator('#undoBtn').click();await page.locator('#contextOperations button').filter({has:page.locator('.mfrac')}).first().click();await page.clock.runFor(5000);assert.equal(await page.evaluate(()=>AlgebraCore.eqSig(AlgebraTrainer.snapshot().trainerStates.at(-1))),multiplied);
 const completed=J.mission('route-two',318);completed.completed=true;completed.results.forEach(r=>r.done=true);await load(completed,5,'summary');await page.locator('#summaryReplayBtn').click();const next=await page.evaluate(()=>AlgebraTrainer.snapshot().learningRun),old=new Set(completed.tasks.map(J.questionSignature));assert.ok(next.tasks.every(t=>!old.has(J.questionSignature(t))));assert.ok(next.results.every(r=>!r.done));const tasks=next.tasks;await page.locator('#backSetupBtn').click();await page.locator('[data-menu-nav=world]').click();await page.locator('[data-stop="route-two"]').click();await page.locator('[data-start]').click();assert.deepEqual(await page.evaluate(()=>AlgebraTrainer.snapshot().learningRun.tasks),tasks);
 assert.deepEqual(errors,[]);const result={ok:true,checks:['Five production kinds solved with whole contextual terms','Teacher example: -7x, 7x, -21 and -17 with sign-error feedback','Undo and reload preserve actual construction; history shows the actual proof','Verification: named candidate, parenthesized substitution, one-side calculation, comparison','Incorrect calculation and incorrect comparison block progress','Both-side calculation and correct candidate accepted','Verification live demo: pause, repeat, return and pupil proof preserved','Controls and actual math fit five viewports per phase','No native inputs, character keyboards or cursor modes','Both ·3 and ÷(1/3) accepted','Fresh replay changes every question and resume retains the round'],errors};fs.writeFileSync(out+'/touch-replay-checks.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();await new Promise(r=>server.close(r));
})().catch(e=>{console.error(e);process.exit(1)});
