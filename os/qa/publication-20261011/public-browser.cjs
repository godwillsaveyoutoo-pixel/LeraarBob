'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base='https://godwillsaveyoutoo-pixel.github.io/LeraarBob';
const out='/tmp/lb-public-release-20261011';fs.mkdirSync(out,{recursive:true});
const report={scope:'Published GitHub Pages; isolated guest browser; no fixture accounts, no production account mutations; 100% zoom',checks:[],apps:[],errors:[],missing:[]};
let browser,phase='boot';
(async()=>{try{
 browser=await chromium.launch({headless:true,executablePath:'/opt/brave.com/brave/brave',args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1,reducedMotion:'reduce'});
 const page=await context.newPage();page.setDefaultTimeout(30000);
 page.on('pageerror',e=>report.errors.push({phase,message:e.message}));page.on('response',r=>{if(r.status()===404)report.missing.push({phase,url:r.url()});});
 page.on('dialog',d=>d.type()==='beforeunload'?d.accept():d.dismiss());
 await page.goto(base+'/');await page.waitForURL('**/os/**');await page.locator('.personal-app').first().waitFor();
 assert.equal(await page.evaluate(()=>devicePixelRatio),1);report.checks.push('Public root opens OS at 1366 x 768, 100% zoom');
 await page.screenshot({path:path.join(out,'public-desktop.png')});
 async function active(){return await(await page.locator('.frame-wrapper:not([hidden])>iframe').elementHandle()).contentFrame();}
 async function settled(f){await f.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});}
 for(const id of (process.env.PUBLIC_PAPER_ONLY?[]:['rechtenwereld','getallenwereld','algebra-trainer','stelsels','rechten-zeeslag','glasraam','pythagoras','logicawereld','brandweer','kleiduifschieten'])){
  phase=id;const ok=await page.evaluate(id=>LeraarBobDesktop.openApp(id,'solo'),id);assert(ok,'Open '+id);const f=await active();await f.waitForLoadState();await f.waitForFunction(()=>!!document.body.dataset.osNativeApp);await settled(f);
  await f.evaluate(()=>window.__releaseBody=document.body);const url=f.url();
  await page.evaluate(()=>LeraarBobTopbar.setCollapsed(false,true));await settled(f);
  assert.equal(await page.locator('leraarbob-topbar').count(),1);assert.equal(await f.locator('leraarbob-topbar').count(),0);
  await page.screenshot({path:path.join(out,id+'-open.png')});
  await page.evaluate(()=>LeraarBobTopbar.setCollapsed(true,true));await page.locator('#taskbarToggle').click();await settled(f);
  assert.equal(await page.locator('#taskbar').isVisible(),false);
  for(const sel of ['.lb-restore:not([hidden])','#taskbarToggle']){const r=await page.locator(sel).boundingBox();assert(r&&r.width>=44&&r.height>=44,sel);}
  await page.screenshot({path:path.join(out,id+'-collapsed.png')});
  await page.locator('#taskbarToggle').click();await page.locator('.lb-restore:not([hidden])').click();
  const inputs=await f.evaluate(()=>[...document.querySelectorAll('input,select,textarea')].map(n=>({id:n.id,value:n.value})));
  await page.locator('#minimizeApp').click();await page.evaluate(id=>LeraarBobDesktop.openApp(id,'solo'),id);
  assert.equal(await active(),f);assert(await f.evaluate(()=>window.__releaseBody===document.body));assert.equal(new URL(f.url()).pathname,new URL(url).pathname);
  assert.deepEqual(await f.evaluate(()=>[...document.querySelectorAll('input,select,textarea')].map(n=>({id:n.id,value:n.value}))),inputs);
  await page.locator('#closeApp').click();await page.getByRole('dialog').getByRole('button',{name:'App afsluiten',exact:true}).click();report.apps.push({id,sameFrame:true,onePlatformBar:true,foldAndRestore:true});console.log('PASS public app',id);
 }
 phase='paper';await page.evaluate(()=>LeraarBobDesktop.showView({kind:'worksheets',themeId:'algebra',topicId:'systems'}));
 await page.locator('[data-worksheet-source="algebra-trainer:systems"] button').click();const paper=await active();await paper.locator('#generateWorksheet:not([disabled])').waitFor();
 assert.equal(await paper.locator('#navigationScreen,#work,#trainerScreen').count(),0);
 await paper.locator('#generateWorksheet').click();await paper.waitForFunction(()=>document.querySelector('[data-worksheet-save-status]')?.textContent.startsWith('Bewaard'));
 const saved=await paper.evaluate(()=>LeraarBobWorksheetMaker.worksheetSnapshot());assert.equal(saved.sourceId,'algebra-trainer:systems');assert(saved.data.exercises.length>0);
 const document=await(await paper.locator('#worksheetDocument').elementHandle()).contentFrame();await document.waitForFunction(()=>document.body?.innerHTML.length>100);
 await document.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
 await page.screenshot({path:path.join(out,'public-stelsels-worksheet.png')});report.checks.push('Generated worksheet preview finishes rendering its questions and graphs');
 await paper.locator('#openFolder').click();await page.locator('[data-worksheet-open]').first().waitFor();report.checks.push('Public Stelsels worksheet generator saves exact series in guest local folder');
 await page.reload();await page.waitForFunction(()=>!!window.LeraarBobDesktop);await page.evaluate(()=>LeraarBobDesktop.showView({kind:'worksheets',themeId:'algebra',topicId:'systems'}));await page.locator('[data-worksheet-open]').first().waitFor();report.checks.push('Saved guest series remains available after page reload');
 phase='mobile';await page.setViewportSize({width:390,height:844});await page.evaluate(()=>LeraarBobDesktop.openApp('brandweer','solo'));const mobile=await active();await mobile.waitForLoadState();await mobile.waitForFunction(()=>!!document.body.dataset.osNativeApp);
 await page.evaluate(()=>LeraarBobTopbar.setCollapsed(true,true));await page.locator('#taskbarToggle').click();await settled(mobile);
 for(const sel of ['.lb-restore:not([hidden])','#taskbarToggle']){const r=await page.locator(sel).boundingBox();assert(r&&r.width>=44&&r.height>=44&&r.x>=0&&r.y>=0&&r.x+r.width<=391&&r.y+r.height<=845,sel);}
 await page.screenshot({path:path.join(out,'public-brandweer-mobile-collapsed.png')});
 await page.locator('#taskbarToggle').click();await page.locator('.lb-restore:not([hidden])').click();await page.locator('#closeApp').click();report.checks.push('390 x 844: both bars collapse and restore through reachable 44px handles');
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.missing,[]);report.ok=true;
}catch(e){report.failure={phase,message:e.message,stack:e.stack};process.exitCode=1;console.error(e);}finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));await browser?.close();console.log(JSON.stringify(report));}})();
