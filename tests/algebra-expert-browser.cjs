'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright'),{start}=require('../scripts/serve-rechten-entry-preview.cjs');
const out=process.env.EXPERT_PROOF||'/tmp/lb-equations-expert';fs.mkdirSync(out,{recursive:true});
const report={checks:[],errors:[],layouts:[],scope:'Native browser interactions; local fixture authentication, no production writes'};
(async()=>{const server=await start({port:0});let browser,page;try{
 browser=await chromium.launch({headless:true,executablePath:process.env.LB_CHROMIUM||(fs.existsSync('/opt/brave.com/brave/brave')?'/opt/brave.com/brave/brave':undefined),args:['--no-sandbox','--disable-dev-shm-usage']});
 page=await browser.newPage({viewport:{width:1366,height:768},deviceScaleFactor:1,reducedMotion:'reduce'});page.setDefaultTimeout(15000);page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(server.base+'/os/?previewUser=alex');await page.waitForFunction(()=>LeraarBobDesktop.state().accountId);
 await page.evaluate(()=>LeraarBobDesktop.openApp('algebra-trainer','solo'));
 let f=await(await page.locator('.frame-wrapper:not([hidden]) iframe').elementHandle()).contentFrame();await f.locator('[data-menu-stop="route-inverse"]').click();await f.locator('.menuContinue').click();
 const snap=()=>f.evaluate(()=>AlgebraTrainer.snapshot());const first=await snap();
 await f.locator('#trainerScreen [data-practice-mode]').selectOption('expert');assert.deepEqual((await snap()).activeSet,first.activeSet);assert.deepEqual((await snap()).trainerStates,first.trainerStates);
 console.log('CHECK '+report.checks.length);report.checks.push('Switching approach keeps the exact questions and existing equation');
 await f.locator('.opBtn[data-op="/"]').click();await f.locator('#expertOperandInput').fill('0');await f.locator('#expertOperand button').click();assert.deepEqual((await snap()).trainerStates,first.trainerStates);assert.match(await f.locator('#feedback').innerText(),/nul|0|delen/i);
 console.log('CHECK '+report.checks.length);report.checks.push('Invalid division is rejected by the original equation engine');
 for(let q=0;q<1;q++){
  for(let j=0;j<8;j++){
   if(await f.locator('#nextBox').isVisible())break;
   const step=await f.evaluate(()=>{const s=AlgebraTrainer.snapshot(),e=s.trainerStates.at(-1),L=AlgebraLearning,a=L.affine(e.l),b=L.affine(e.r),C=AlgebraCore;return !b.a.isZero()?{op:'-',term:(b.a.n+'/'+b.a.d)+'x'}:!a.b.isZero()?{op:'-',term:a.b.n+'/'+a.b.d}:{op:'/',term:a.a.n+'/'+a.a.d};});
   await f.locator('.opBtn[data-op="'+step.op+'"]').click();await f.locator('#expertOperandInput').fill(step.term);await f.locator('#expertOperand button').click();await f.waitForFunction(()=>!AlgebraTrainer.animationSnapshot().active);
  }
  await f.locator('#nextExerciseBtn').click();
 }
 assert.equal((await snap()).trainerIndex,1);console.log('CHECK '+report.checks.length);report.checks.push('An equation solved with independently calculated own operations');
 await f.locator('#expertAnswer').fill('2x +');const originalFrame=f;
 await page.locator('#minimizeApp').click();await page.getByRole('button',{name:'Terug naar Vergelijkingen',exact:true}).click();assert.equal(f,originalFrame);assert.equal(await f.locator('#expertAnswer').inputValue(),'2x +');
 await f.locator('#trainerScreen [data-practice-mode]').selectOption('beginner');await f.locator('#trainerScreen [data-practice-mode]').selectOption('expert');assert.equal(await f.locator('#expertAnswer').inputValue(),'2x +');
 await f.locator('#checkBtn').click();assert.equal((await snap()).learningRun.results[1].done,false);
 const expected=await f.evaluate(()=>{const t=AlgebraTrainer.snapshot().learningRun.tasks[1];return AlgebraCore.fallbackText(AlgebraCore.latexEq(t.expected,t.ex.policy));});
 await f.locator('#expertAnswer').fill(expected);await f.locator('#checkBtn').click();await f.locator('#nextExerciseBtn').waitFor();assert.equal((await snap()).learningRun.results[1].done,true);
 console.log('CHECK '+report.checks.length);report.checks.push('Incomplete typed rule survives approach switching/minimizing; exact native validation accepts the correct full rule');
 const before=await snap();
 for(const size of [{width:1366,height:768},{width:390,height:844},{width:640,height:360}])for(const folded of [false,true]){
  await page.setViewportSize(size);await page.evaluate(folded=>LeraarBobTopbar.setCollapsed(folded,true),folded);
  for(const selector of ['#trainerScreen [data-practice-mode]','#nextExerciseBtn']){
   const target=f.locator(selector);if(size.width<700)await target.scrollIntoViewIfNeeded();const r=await target.boundingBox();assert(r&&r.width>=44&&r.height>=44&&r.y>=0&&r.y+r.height<=size.height+1,selector+' '+JSON.stringify({size,folded,r}));
   report.layouts.push({size,folded,selector,rect:r});
  }
  assert.equal(await f.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.deepEqual((await snap()).learningRun,before.learningRun);
  await page.screenshot({path:out+'/expert-'+size.width+'-'+folded+'.png'});
 }
 await page.setViewportSize({width:1366,height:768});await Promise.all([f.waitForNavigation(),f.evaluate(()=>location.reload())]);await f.waitForFunction(()=>window.AlgebraTrainer);assert.equal((await snap()).practiceMode,'expert');assert.equal((await snap()).learningRun.results[1].done,true);
 console.log('CHECK '+report.checks.length);report.checks.push('Approach and answered question survive reload; three viewports and both bar states retain work');
 assert.deepEqual(report.errors,[]);report.passed=true;
 }catch(e){report.failure=e.stack;if(page)await page.screenshot({path:out+'/failure.png'});throw e;}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
