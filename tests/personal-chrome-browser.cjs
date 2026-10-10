'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{start}=require('../scripts/serve-rechten-entry-preview.cjs');
const out=process.env.LB_SCREENSHOT_DIR||'/tmp/leraarbob-edge-bars';fs.mkdirSync(out,{recursive:true});
(async()=>{const preview=await start({port:0});let browser,page;const errors=[],checks=[],measurements=[];try{
 browser=await chromium.launch({executablePath:process.env.LB_CHROMIUM||(fs.existsSync('/opt/brave.com/brave/brave')?'/opt/brave.com/brave/brave':undefined),headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1,hasTouch:true});await context.route('**/*',r=>new URL(r.request().url()).origin!==preview.base?r.abort():r.continue());
 page=await context.newPage();page.setDefaultTimeout(18000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto(preview.base+'/os/?previewUser=alex');await page.locator('.personal-app [data-mode=solo]').click();let frame=await(await page.locator('.native-app').elementHandle()).contentFrame();await frame.locator('#app[data-ready=true]').waitFor();
 async function settle(){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r)))));}
 async function shot(name){await settle();await page.screenshot({path:path.join(out,name+'.png')});}
 async function visible(selector){const e=page.locator(selector),r=await e.boundingBox();assert(r&&r.width>=44&&r.height>=44,selector+' size');assert(await e.evaluate(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.x>=0&&r.right<=innerWidth+1&&r.y>=0&&r.bottom<=innerHeight+1&&(e===hit||e.contains(hit));}),selector+' occluded');measurements.push({selector,viewport:page.viewportSize(),...r});}
 async function bottom(closed){if((await page.locator('#taskbarToggle').getAttribute('aria-expanded'))===String(closed))await page.locator('#taskbarToggle').click();await settle();}
 async function top(closed){await page.evaluate(c=>LeraarBobTopbar.setCollapsed(c,true),closed);await settle();}
 assert.equal((await frame.locator('.atlas-header').boundingBox()).height,0);assert.equal(await page.locator('#focusControls,#focusWorkspace,#openOriginal').count(),0);
 await frame.locator('[data-world-node=puntenbaai]').click();await frame.locator('[data-node=point]').click();await frame.locator('[data-choice=answer]').first().click();const before=await frame.evaluate(()=>RechtenV2App.snapshot());
 for(const size of [{width:1366,height:768},{width:390,height:844},{width:640,height:360},{width:320,height:568}]){
  await page.setViewportSize(size);await top(false);await bottom(false);await visible('#closeApp');await visible('#appBack');await visible('#taskbarToggle');const expanded=await page.locator('.native-app').boundingBox();
  for(const up of [false,true])for(const down of [false,true]){
   await top(up);await bottom(down);await visible('#taskbarToggle');if(up)await visible('.lb-restore:not([hidden])');
   assert.equal(await page.locator('#desktopHeader').isVisible(),!up);assert.equal(await page.locator('#taskbar').isVisible(),!down);assert.equal(await page.locator('#closeApp').isVisible(),!down);
   assert.deepEqual(await frame.evaluate(()=>RechtenV2App.snapshot()),before);
   const bounds=await page.locator('.native-app').boundingBox();if(up&&down)assert(bounds.height>expanded.height+40,'Both hidden must reclaim actual game space');
   if(up&&down){const bars=await page.evaluate(()=>({top:document.getElementById('desktopHeader').getBoundingClientRect().height,bottom:document.getElementById('taskbar').getBoundingClientRect().height}));assert.deepEqual(bars,{top:0,bottom:0});}
   for(const selector of ['#taskbarToggle',...(up?['.lb-restore:not([hidden])']:[])]){
    if(selector==='#taskbarToggle'&&!down)continue;
    const handle=await page.locator(selector).boundingBox();for(const target of await frame.locator('#commit,[data-choice=answer]').all()){
     const b=await target.boundingBox();if(b)assert(!(handle.x<b.x+b.width&&handle.x+handle.width>b.x&&handle.y<b.y+b.height&&handle.y+handle.height>b.y),'Handle must not cover a native answer action');
    }
   }
   if(size.width===1366&&up===down||size.width===390&&up&&down)await shot('rights-bars-'+size.width+'-'+(up?'hidden':'open'));
  }
 }
 checks.push('Four sizes × four independent bar states: no replacement strip, both bars have zero height when folded, game gains space, unchanged native answer, handles >=44px and no overlap with answer actions');
 await page.setViewportSize({width:1366,height:768});await bottom(false);await top(false);
 await page.locator('#taskbarToggle').focus();await page.keyboard.press('Space');await visible('#taskbarToggle');assert.equal(await page.locator('#taskbarToggle').getAttribute('aria-expanded'),'false');await page.locator('#taskbarToggle').tap();assert.equal(await page.locator('#taskbarToggle').getAttribute('aria-expanded'),'true');
 await page.locator('leraarbob-topbar .collapse').click();await page.locator('.lb-restore:not([hidden])').tap();assert.equal(await page.locator('leraarbob-topbar .collapse').getAttribute('aria-expanded'),'true');
 await page.locator('#closeApp').click();await page.locator('#cancelClose').click();assert.deepEqual(await frame.evaluate(()=>RechtenV2App.snapshot()),before);
 checks.push('Keyboard and touch open/close handles; expanding either bar preserves the answer; cancel-close retains the same game');
 await page.locator('leraarbob-topbar .crumbs button').filter({hasText:'Rechtenwereld'}).click();await frame.locator('[data-world-node=puntenbaai]').waitFor();await frame.locator('[data-world-node=puntenbaai]').click();await page.locator('leraarbob-topbar .menu').click();await page.getByRole('button',{name:'Rechtenwereld · Spelvoortgang',exact:true}).click();await frame.waitForFunction(()=>RechtenV2App.snapshot().screen==='book');
 checks.push('World breadcrumb and native game progress remain available through the expanded OS bar');
 await top(true);await bottom(true);await page.reload();await page.locator('.personal-app [data-mode=solo]').click();await settle();assert.equal(await page.locator('#taskbarToggle').getAttribute('aria-expanded'),'false');await visible('.lb-restore:not([hidden])');assert(!await page.locator('#taskbar').isVisible());
 await bottom(false);await page.locator('.lb-restore:not([hidden])').click();await page.locator('#minimizeApp').click();await page.getByRole('button',{name:'Terug naar Rechtenwereld',exact:true}).click();
 frame=await(await page.locator('.native-app').elementHandle()).contentFrame();const retained=await frame.evaluate(()=>RechtenV2App.snapshot());await bottom(true);await bottom(false);assert.deepEqual(await frame.evaluate(()=>RechtenV2App.snapshot()),retained);
 await page.locator('#closeApp').click();await page.locator('#acceptClose').click();assert.equal(await page.locator('.native-app').count(),0);assert(await page.locator('#homeView').isVisible());
 checks.push('Both explicit collapse choices survive reload; restore, minimize/resume and confirmed close remain available without a permanent escape bar');
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'chrome-results.json'),JSON.stringify({checks,measurements,errors,scope:'Actual Chromium at 100% zoom; synthetic local account; original Rechtenwereld exercise and DOM'},null,2)+'\n');console.log('PASS '+checks.join('; '));
}catch(e){if(page&&!page.isClosed())await page.screenshot({path:path.join(out,'failure-chrome.png')});throw e;}finally{await browser?.close();await preview.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
