/* Real placement/aim/fire interactions in the OS; isolated local accounts, no remote players. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{start}=require('../scripts/serve-rechten-entry-preview.cjs');
const out=process.env.ZEESLAG_SCREENSHOTS||'/tmp/leraarbob-zeeslag-controls';
const report={scope:'Chromium at 100% zoom, local test account, original solo engine; no production multiplayer claim.',checks:[],layouts:[],errors:[],missing:[]};
let browser,preview;
(async()=>{try{
 fs.mkdirSync(out,{recursive:true});preview=await start({port:0});
 browser=await chromium.launch({headless:true,executablePath:process.env.LB_CHROMIUM||(fs.existsSync('/opt/brave.com/brave/brave')?'/opt/brave.com/brave/brave':undefined),args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1,reducedMotion:'reduce'});
 await context.route('**/*',r=>new URL(r.request().url()).origin===preview.base?r.continue():r.abort());
 const page=await context.newPage();page.setDefaultTimeout(20000);
 page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()===404)report.missing.push(r.url());});
 const check=s=>{report.checks.push(s);console.log('PASS '+s);};
 await page.goto(preview.base+'/os/?previewUser=alex');await page.locator('#startButton').click();await page.locator('#startSearch').fill('Zeeslag');
 await page.locator('#startResults .start-result').filter({hasText:'Rechten Zeeslag'}).click();
 const node=await page.locator('.frame-wrapper:not([hidden])>iframe').elementHandle(),frame=await node.contentFrame();
 await frame.locator('#gameScreen.active').waitFor();
 // Place three real ships, using legal candidate endpoints from the native engine.
 for(const start of ['-4,-4','-4,-2','-4,1']){await frame.locator('[data-grid="'+start+'"]').click();await frame.locator('#ownBoard .candidate').first().click();}
 assert.equal(await frame.locator('#ownBoard .ship').count(),3);await frame.locator('#readyBtn').click();await frame.locator('#fireBtn:not([disabled])').waitFor();
 const fleet=await frame.locator('#ownBoard .ship').evaluateAll(es=>es.map(e=>e.dataset.ship));
 for(let n=0;n<3;n++)await frame.locator('#aDownBtn').click();for(let n=0;n<4;n++)await frame.locator('#bDownBtn').click();
 const slopes=['−2','−1','−½','0','½','1','2'];
 for(let a=0;a<slopes.length;a++){
  assert.equal(await frame.locator('#aDownBtn').isDisabled(),a===0);assert.equal(await frame.locator('#aUpBtn').isDisabled(),a===6);
  for(let b=-4;b<=4;b++){
   assert.equal(await frame.locator('#aimEquationText').textContent(),`y = ${slopes[a]}x ${b<0?'−':'+'} ${Math.abs(b)}`);
   assert.equal(await frame.locator('#bSettingValue').textContent(),String(b).replace('-','−'));
   assert.equal(await frame.locator('#bDownBtn').isDisabled(),b===-4);assert.equal(await frame.locator('#bUpBtn').isDisabled(),b===4);
   assert.equal(await frame.locator('.equationBuilder button').count(),0);
   if(b<4)await frame.locator('#bUpBtn').click();
  }
  if(a<6){await frame.locator('#aUpBtn').click();for(let b=0;b<8;b++)await frame.locator('#bDownBtn').click();}
 }
 assert.equal(await frame.locator('#attackBoard .shotLine,#attackBoard .ship').count(),0);
 assert.deepEqual(await frame.locator('#ownBoard .ship').evaluateAll(es=>es.map(e=>e.dataset.ship)),fleet);
 check('All 63 allowed a/b combinations: readable signed equation, signed settings, exact bounds, no premature shot or fleet reset');
 await frame.locator('#aDownBtn').click();await frame.locator('#aDownBtn').click();for(let b=0;b<6;b++)await frame.locator('#bDownBtn').click();
 // Standard keyboard actions retain the native handlers.
 await frame.locator('#aDownBtn').focus();await page.keyboard.press('Enter');assert.equal(await frame.locator('#aimEquationText').textContent(),'y = 0x − 2');
 await frame.locator('#aUpBtn').focus();await page.keyboard.press('Space');assert.equal(await frame.locator('#aimEquationText').textContent(),'y = ½x − 2');
 const button=await frame.locator('#aUpBtn').elementHandle(),handler=await button.evaluateHandle(e=>e.onclick);
 await page.locator('#minimizeApp').click();await page.getByRole('button',{name:'Terug naar Rechten Zeeslag',exact:true}).click();
 assert(await node.evaluate(e=>e.isConnected));assert(await button.evaluate((e,handler)=>e.isConnected&&e.onclick===handler,handler));assert.equal(await frame.locator('#aimEquationText').textContent(),'y = ½x − 2');
 check('Keyboard Enter/Space and minimize/resume preserve native handler, selected line and the same game frame');
 async function layout(name){
  await frame.evaluate(async()=>{await document.fonts.ready;for(let i=0;i<5;i++)await new Promise(requestAnimationFrame);});
  const m=await frame.evaluate(()=>{
   const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON();
   const targets=['#aDownBtn','#aUpBtn','#bDownBtn','#bUpBtn','#fireBtn'].map(s=>{const el=document.querySelector(s),r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {s,...r.toJSON(),hit:hit===el||el.contains(hit),label:el.getAttribute('aria-label')||el.textContent};});
   return {w:innerWidth,h:innerHeight,scroll:document.documentElement.scrollWidth,targets,equation:rect('.equationBuilder'),controls:rect('.aimAdjustments'),boards:rect('.boards'),dock:rect('.bottom')};
  });
  assert(m.scroll<=m.w,'No horizontal overflow');
  assert(m.boards.bottom<=m.dock.top+1,'Dock does not cover the boards');
  for(const t of m.targets)assert(t.width>=44&&t.height>=44&&t.left>=0&&t.right<=m.w+1&&t.top>=0&&t.bottom<=m.h+1&&t.hit&&t.label,JSON.stringify({name,t,m}));
  assert(m.equation.right<=m.controls.left+1||m.equation.bottom<=m.controls.top+1,'Formula stays separate from the controls');
  report.layouts.push({name,...m});await page.screenshot({path:path.join(out,name+'.png')});
 }
 for(const size of [{width:1366,height:768},{width:844,height:390},{width:640,height:360},{width:390,height:844},{width:320,height:568}]){
  await page.setViewportSize(size);await layout('os-'+size.width+'-expanded');
  await page.locator('leraarbob-topbar .collapse').click();await layout('os-'+size.width+'-collapsed');
  const restore=page.locator('.lb-restore:not([hidden])');assert.equal(await restore.getAttribute('aria-expanded'),'false');const r=await restore.boundingBox();assert(r.width>=44&&r.height>=44);await restore.click();
  assert.equal(await frame.locator('#aimEquationText').textContent(),'y = ½x − 2');
 }
 check('1366×768, 844×390, 640×360, 390×844 and 320×568: both bar states, restore, unoccluded 44px controls, boards above dock');
 await page.setViewportSize({width:1366,height:768});await frame.locator('#fireBtn').click();
 await frame.waitForFunction(()=>RechtenArcade.run().events.some(e=>e.kind==='naval-shot'));
 const shot=await frame.evaluate(()=>RechtenArcade.run().events.find(e=>e.kind==='naval-shot'));
 assert.deepEqual(shot.answer,{a:{n:1,d:2},b:{n:-2,d:1}});assert.match(await frame.locator('#myHistory').textContent(),/x − 2/);
 assert.equal(await frame.locator('#myHistory .frac .num').first().textContent(),'1');assert.equal(await frame.locator('#myHistory .frac .den').first().textContent(),'2');
 await frame.locator('#fireBtn:not([disabled])').waitFor();await layout('os-after-shot');
 check('VUUR fires the selected fractional slope and negative intercept through the original engine; computer turn completes');
 // A standalone game uses the same controls and shared collapsible header.
 const solo=await context.newPage();await solo.goto(preview.base+'/games/rechten/zeeslag/?solo=1');await solo.locator('#gameScreen.active').waitFor();
 for(const start of ['-4,-4','-4,-2','-4,1']){await solo.locator('[data-grid="'+start+'"]').click();await solo.locator('#ownBoard .candidate').first().click();}
 await solo.locator('#readyBtn').click();await solo.locator('#aUpBtn').click();assert.equal(await solo.locator('#aimEquationText').textContent(),'y = ½x + 0');
 await solo.getByRole('button',{name:'Bovenbalk inklappen',exact:true}).click();assert.equal(await solo.locator('#aimEquationText').textContent(),'y = ½x + 0');
 await solo.screenshot({path:path.join(out,'standalone-collapsed.png')});await solo.reload();await solo.getByRole('button',{name:'Bovenbalk uitklappen',exact:true}).waitFor();await solo.getByRole('button',{name:'Bovenbalk uitklappen',exact:true}).click();
 check('Standalone controls work too; header collapse preserves current aim and collapse preference survives reload');
 await solo.close();assert.deepEqual(report.errors,[]);assert.deepEqual(report.missing,[]);report.passed=true;
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();await preview?.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
