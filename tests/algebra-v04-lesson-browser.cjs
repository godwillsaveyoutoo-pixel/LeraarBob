const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=process.env.ALGEBRA_SCREENSHOTS||'/tmp/algebrawereld-v045';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{let p=path.join(root,new URL(req.url,'http://local').pathname);if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');if(!fs.existsSync(p)){res.writeHead(404).end();return}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2'})[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p))});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.ALGEBRA_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.fulfill({body:''}));
 await page.goto('http://127.0.0.1:'+server.address().port+'/games/algebra-trainer/');await page.waitForSelector('#navigationScreen:not(.hidden)');await page.clock.install();
 await page.locator('[data-menu-stop="route-two"]').click();
 const own=await page.evaluate(()=>AlgebraTrainer.snapshot());
 await page.locator('#watchDemoBtn').click();assert.equal(await page.evaluate(()=>AlgebraTrainer.animationSnapshot().demo),true);
 assert.notEqual(await page.evaluate(()=>AlgebraTrainer.animationSnapshot().example.start),await page.evaluate(()=>AlgebraCore.latexEq(AlgebraTrainer.snapshot().activeSet[0].start,AlgebraTrainer.snapshot().activeSet[0].policy)));
 await page.clock.runFor(1700);
 assert.equal(await page.locator('.motion-new').count(),2);assert.equal(await page.locator('.previousEquation').isVisible(),true);assert.equal(await page.locator('.katex-error').count(),0);
 const motion=await page.evaluate(()=>AlgebraTrainer.animationSnapshot());await page.locator('#lessonPauseBtn').click();await page.clock.runFor(10000);
 assert.equal(await page.evaluate(()=>AlgebraTrainer.animationSnapshot().tex),motion.tex);assert.equal(await page.evaluate(()=>AlgebraTrainer.animationSnapshot().paused),true);
 await page.locator('#lessonPauseBtn').click();await page.clock.runFor(1450);assert.ok(await page.locator('.motion-zero').count()>0);
 for(const [w,h] of [[1280,800],[780,360],[640,360],[390,844],[320,700]]){
  await page.setViewportSize({width:w,height:h});await page.clock.runFor(50);await page.screenshot({path:out+'/live-'+w+'x'+h+'.png'});
  const bad=await page.locator('#liveLessonPanel button,#lessonCaption,.derivationMath,.previousEquation,.trainHead button').evaluateAll(els=>els.filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent.slice(0,40),x:r.x,y:r.y,w:r.width,h:r.height}}).filter(r=>r.x < -1||r.y < -1||r.x+r.w>innerWidth+1||r.y+r.h>innerHeight+1));
  assert.deepEqual(bad,[],w+'x'+h+' controls fit');assert.equal(await page.locator('.katex-error').count(),0);
 }
 await page.locator('#lessonReplayBtn').click();assert.equal(await page.evaluate(()=>AlgebraTrainer.animationSnapshot().index),0);await page.clock.runFor(60000);
 assert.equal(await page.evaluate(()=>AlgebraTrainer.animationSnapshot().finished),true);assert.equal(await page.locator('#lessonReturnBtn').textContent(),'Zelf proberen →');
 let after=await page.evaluate(()=>AlgebraTrainer.snapshot());assert.deepEqual(after.trainerStates,own.trainerStates);assert.deepEqual(after.activeSet,own.activeSet);assert.deepEqual(after.chapterJourney,own.chapterJourney);assert.equal(after.learningRun.results[0].supported,true);assert.equal(after.learningRun.results[0].done,false);
 await page.locator('#lessonReturnBtn').click();assert.equal(await page.evaluate(()=>AlgebraTrainer.animationSnapshot().demo),false);
 await page.setViewportSize({width:780,height:360});
 // A learner operation itself exposes raw subtraction, zero and its disappearance.
 const label=await page.evaluate(()=>{const ex=AlgebraTrainer.snapshot().activeSet[0],s=ex.steps[0];return (s.op==='-'?'−':s.op)+' '+AlgebraCore.fallbackText(AlgebraCore.latexExpr(s.operand,ex.policy))+' op beide leden'});
 await page.locator('#contextOperations button[aria-label="'+label+'"]').click();assert.equal(await page.evaluate(()=>AlgebraTrainer.animationSnapshot().active),true);assert.equal(await page.locator('.motion-new').count(),2);
 await page.clock.runFor(1500);assert.ok(await page.locator('.motion-zero').count()>0);await page.clock.runFor(2100);assert.equal(await page.locator('.motion-zero').count(),0);
 const worked=await page.evaluate(()=>AlgebraTrainer.snapshot().trainerStates);assert.equal(worked.length,2);
 await page.locator('#watchDemoBtn').click();await page.clock.runFor(1750);await page.locator('#lessonReturnBtn').click();await page.clock.runFor(60000);assert.deepEqual(await page.evaluate(()=>AlgebraTrainer.snapshot().trainerStates),worked);
 await page.locator('#watchDemoBtn').click();await page.clock.runFor(1700);await page.locator('#backSetupBtn').click();await page.locator('[data-menu-nav=world]').click();await page.clock.runFor(60000);assert.equal(await page.evaluate(()=>AlgebraTrainer.animationSnapshot().active),false);assert.equal(await page.locator('#worldScreen').isVisible(),true);
 await page.reload();await page.waitForSelector('[data-stop]');await page.locator('[data-start]').click();assert.deepEqual(await page.evaluate(()=>AlgebraTrainer.snapshot().trainerStates),worked);
 // The distributed HTML also contains and runs the real engine without a server.
 assert.deepEqual(errors,[]);const result={ok:true,checks:['Live frames and highlighted operations','Subtraction → zero → disappearance','Pause, resume, repeat and completion','Own equation, intermediate work and XP preserved','Early return and navigation cancel callbacks','Reload retains pupil work','Five viewports including 640×360 and 320px portrait'],errors};fs.writeFileSync(out+'/live-lesson-checks.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();await new Promise(r=>server.close(r));
})().catch(e=>{console.error(e);process.exit(1)});
