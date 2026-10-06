const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
const lesson=require('../lessons/rechten-arbeid/lesson.js');
const BASE=process.env.VECTOR_BASE_URL||'http://127.0.0.1:8775',OUT=process.env.LB_SCREENSHOT_DIR||'/tmp/leraarbob-lesson-story';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.LB_CHROMIUM||'/opt/brave.com/brave/brave',args:['--no-sandbox']});const errors=[];
 try{const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.pathname.endsWith('/axioma-auth.js'))return r.fulfill({contentType:'text/javascript',body:'window.AxiomaAuth={CLASSES:[],ready:async()=>({account:null}),getAccount:async()=>null,onChange:()=>()=>{},configured:()=>true};'});return u.origin===BASE?r.continue():r.abort();});
 await page.goto(BASE+'/lessons/rechten-arbeid/');await page.waitForFunction(()=>!!window.lessonStage);
 const shots=new Set(['helling-opfrissen','helling-richting','opening','sessie-starten','zelf-lopen','regel-werk','overload','processor','denkruimte','helpen','helpen-zelf','parasiet','anderhalve-maand','uitloop','gebouwd','middelen','wiskunde','vaardigheden','contract','reisweg','onze-les','eerlijk-startpunt','waar-sta-ik']);
 for(const size of [{width:1440,height:900},{width:390,height:844},{width:812,height:375}]){
  await page.setViewportSize(size);
  for(const step of lesson.steps.filter(s=>s.events.some(e=>e.type==='scene'))){await page.evaluate(id=>lessonStage.go(id),step.id);await page.waitForTimeout(410);
   const issues=await page.evaluate(()=>{const ids=['words','sceneNote','sceneChoices','readingBar'],issues=[];for(const id of ids){const e=document.getElementById(id);if(!e.textContent)continue;const r=e.getBoundingClientRect();if(r.top<0||r.bottom>innerHeight-45||r.left<0||r.right>innerWidth)issues.push(id+' outside viewport');}return issues;});assert.deepEqual(issues,[],step.id+' at '+size.width);
   if(size.width===1440&&shots.has(step.id)||size.width!==1440&&['helling-opfrissen','helling-richting','zelf-lopen','server-uitleg','overload','nog-niet','contract','waar-sta-ik'].includes(step.id))await page.screenshot({path:`${OUT}/${step.id}-${size.width}.png`});
  }
 }
 await page.evaluate(()=>lessonStage.go('sessie-starten'));await page.waitForTimeout(410);await page.click('#sceneChoices button:first-child');assert.equal(await page.evaluate(()=>lessonStage.step.id),'helling-opfrissen');
 await page.evaluate(()=>lessonStage.go('zelf-lopen'));await page.waitForTimeout(410);const before=await page.locator('#words').textContent();await page.waitForTimeout(1600);assert.equal(await page.locator('#words').textContent(),before);
 await page.evaluate(()=>lessonStage.go('onze-les'));await page.waitForTimeout(410);assert.equal(await page.locator('#readingNames').textContent(),'Imane / Ibtissam');assert.equal(await page.locator('#sceneNote').textContent(),'Onze les is wiskunde!');assert.equal(await page.locator('#readingHint').textContent(),'Kies zelf wie leest');
 // Painter is deterministic at a chosen timestamp; overload and silence differ.
 const drawings=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=620;const c=canvas.getContext('2d'),draw=(phase,t)=>{LivingBlackboard.paint(c,'bandwidth',t,{phase,seed:37});return canvas.toDataURL();};return [draw(1,2500),draw(1,2500),draw(3,2500)];});assert(drawings[0]===drawings[1],'same timestamp gives the same drawing');assert(drawings[0]!==drawings[2],'noise and calm have different drawings');assert.deepEqual(errors,[]);
 // Reading changes affect the whole block, while the scene and narrative stay put.
 await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>lessonStage.go('waar-sta-ik'));await page.waitForTimeout(410);
 assert.equal(await page.locator('#readingNames').textContent(),'Shakira / Nilay');const spoken=await page.locator('#words').textContent();
 await page.click('#changeReader');assert.equal(await page.evaluate(()=>lessonStage.step.id),'waar-sta-ik');
 await page.selectOption('#readerFirst','Liana');await page.selectOption('#readerSecond','Amal');await page.click('#readerForm button[type=submit]');
 assert.equal(await page.locator('#readingNames').textContent(),'Liana / Amal');assert.equal(await page.locator('#words').textContent(),spoken);
 await page.reload();await page.waitForFunction(()=>window.lessonStage);await page.waitForTimeout(410);assert.equal(await page.locator('#readingNames').textContent(),'Liana / Amal');
 await page.click('#teacherMenu');await page.click('#readerSetup summary');await page.click('#resetReaders');await page.locator('#readerAttendance input[value="Shakira"]').uncheck();
 assert.equal(await page.locator('#readingNames').textContent(),'Nilay');await page.locator('#readerAttendance input[value="Nilay"]').uncheck();
 assert(!/Shakira|Nilay/.test(await page.locator('#readingNames').textContent()));await page.click('#resetReaders');await page.locator('#settings .close').click();
 await page.evaluate(()=>lessonStage.go('boot'));await page.waitForTimeout(410);assert.equal(await page.locator('#readingNames').textContent(),'Paris / Souraya');
 await page.evaluate(()=>lessonStage.next());await page.waitForTimeout(410);assert.equal(await page.locator('#readingNames').textContent(),'Paris / Souraya');
 await page.evaluate(()=>lessonStage.go('belofte-leraar'));await page.waitForTimeout(410);assert.equal(await page.locator('#readingNames').textContent(),'LeraarBob');
 await page.evaluate(()=>lessonStage.go('server-uitleg'));await page.waitForTimeout(410);assert.match(await page.locator('#sceneNote').textContent(),/^LeraarBob: Nee\. Die functie is niet geïnstalleerd\.\nOm 23:00 sluit de upload\.$/);
 // Real-time rendering: buildup, one impact, settled hold, continuation and replay.
 await page.setViewportSize({width:1440,height:900});await page.clock.install();await page.emulateMedia({reducedMotion:'no-preference'});
 const pixels=()=>page.locator('#blackboard').evaluate(c=>c.toDataURL());
 await page.evaluate(()=>lessonStage.go('overload'));await page.clock.runFor(700);const early=await pixels();
 await page.clock.runFor(3000);const impact=await pixels();assert.notEqual(early,impact);await page.screenshot({path:`${OUT}/overload-impact.png`});
 await page.clock.runFor(7000);const settled=await pixels();assert.notEqual(impact,settled);await page.clock.runFor(700);assert.equal(await pixels(),settled);
 await page.evaluate(()=>{window.stageDraws=0;const c=document.getElementById('blackboard').getContext('2d'),clear=c.clearRect.bind(c);c.clearRect=(...a)=>{window.stageDraws++;return clear(...a);};});
 await page.clock.runFor(1000);assert.equal(await page.evaluate(()=>stageDraws),0,'settled canvas should stop scheduling redraws');
 await page.evaluate(()=>document.getElementById('themeBtn').click());await page.clock.runFor(100);assert.notEqual(await pixels(),settled,'settled image repaints on theme change');await page.screenshot({path:`${OUT}/overload-dark.png`});
 await page.evaluate(()=>lessonStage.go('voltooid'));await page.clock.runFor(10500);const boat=await pixels();await page.evaluate(()=>lessonStage.next());await page.clock.runFor(500);assert((await pixels())===boat,'same drawing continues under next sentence');
 await page.evaluate(()=>lessonStage.restart());await page.clock.runFor(500);assert.notEqual(await pixels(),boat,'R replays the drawing');
 await page.evaluate(()=>{lessonStage.go('overload');lessonStage.go('denkruimte');lessonStage.go('nee');});await page.clock.runFor(400);assert.equal(await page.locator('#words').textContent(),'Nee.');assert.equal(await page.locator('.caption').evaluate(e=>e.getAnimations().length),1,'only the current caption animation survives fast navigation');await page.locator('.caption').evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished)));assert.equal(await page.locator('.caption').evaluate(e=>e.getAnimations().length),0,'caption settles without persistent animations');
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>lessonStage.go('helpen-zelf'));await page.clock.runFor(500);assert.equal(await page.locator('.caption').evaluate(e=>e.getAnimations().length),0);await page.screenshot({path:`${OUT}/helpen-zelf-dark.png`});
 await page.setViewportSize({width:390,height:844});await page.clock.runFor(100);assert(await page.locator('#blackboard').evaluate(c=>c.width<=innerWidth*2),'settled image resizes');assert.deepEqual(errors,[]);
 console.log('PASS every narrative beat in 3 viewports, deliberate click reveals, deterministic ink, overload/silence, duo assignment/absence/persistence, normal-motion impact/hold/replay, idle redraw, dark mode and cancellation; screenshots '+OUT);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
