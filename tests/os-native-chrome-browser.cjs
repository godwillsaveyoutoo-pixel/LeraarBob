'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{start}=require('../scripts/serve-rechten-entry-preview.cjs');
const out=process.env.CHROME_PROOF||'/tmp/lb-uniform-chrome';fs.mkdirSync(out,{recursive:true});
const report={scope:'Real Chromium, local fixture accounts, 100% zoom; native app controllers; no external multiplayer sessions',apps:[],interactions:[],measurements:[],errors:[],missing:[]};
const starts={'data-check':'#homeStart','kubusbouw':'#saStart','algebra-smederij':'#rfHomeStart','signal-lab':'#signalHomeStart','verfwinkel':'#vfStart','taartenwinkel':'#patisserieHomeStart'};
const shots=new Set(['data-check','kubusbouw','algebra-smederij','gravity-maze','wortelbouw','stelsels','vectoren-trainer','verfwinkel']);
(async()=>{const server=await start({port:0});let browser,page,phase='boot';try{
 browser=await chromium.launch({headless:true,executablePath:process.env.LB_CHROMIUM||(fs.existsSync('/opt/brave.com/brave/brave')?'/opt/brave.com/brave/brave':undefined),args:['--no-sandbox','--disable-dev-shm-usage']});
 let ctx;
 async function open(id,mode='solo'){
  await ctx?.close();ctx=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1,reducedMotion:'reduce'});await ctx.route('**/*',r=>new URL(r.request().url()).origin===server.base?r.continue():r.abort());
  page=await ctx.newPage();page.setDefaultTimeout(45000);page.on('pageerror',e=>report.errors.push({phase,message:e.message}));page.on('response',r=>{if(r.status()===404)report.missing.push({phase,url:r.url()});});page.on('dialog',d=>d.type()==='beforeunload'?d.accept():d.dismiss());
  await page.goto(server.base+'/os/?previewUser=alex');await page.waitForFunction(()=>LeraarBobDesktop?.state().accountId);await page.evaluate(()=>LeraarBobTopbar.setCollapsed(false));
  const opened=await page.evaluate(({id,mode})=>LeraarBobDesktop.openApp(id,mode),{id,mode});if(!opened){await page.close();return null;}
  const frame=await(await page.locator('.frame-wrapper:not([hidden])>iframe').elementHandle()).contentFrame();await frame.waitForLoadState();await frame.waitForFunction(()=>!!document.body.dataset.osNativeApp);await settle(frame);return frame;
 }
 async function settle(f){await f.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});}
 async function measure(selector){const n=page.locator(selector).first(),r=await n.boundingBox();assert(r&&r.width>=44&&r.height>=44,phase+' target '+selector+' '+JSON.stringify(r));assert(await n.evaluate(n=>{const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&(hit===n||n.contains(hit));}),phase+' covered '+selector);report.measurements.push({phase,selector,viewport:page.viewportSize(),rect:r});}
 async function menu(label){if(await page.locator('.lb-restore:not([hidden])').isVisible())await page.locator('.lb-restore:not([hidden])').click();await page.locator('leraarbob-topbar .menu:visible,leraarbob-topbar .mobile-menu:visible').first().click();await page.getByRole('button',{name:label,exact:true}).click();}
 async function shot(name){await page.screenshot({path:path.join(out,name+'.png')});}
 // Every catalog entry with an actual solo route, plus all three ateliers/lessons.
 let f=await open('rechtenwereld');const apps=await page.evaluate(()=>LeraarBobDesktopModel.apps().map(g=>({id:g.id,title:g.title})));await page.close();
 for(const app of apps){if(process.env.CHROME_INTERACTIONS==='1')continue;if(process.env.CHROME_APPS&&!process.env.CHROME_APPS.split(',').includes(app.id))continue;phase=app.id;f=await open(app.id);if(!f){report.apps.push({...app,skipped:'No registered solo route (catalog grouping only)'});continue;}
  if(starts[app.id])await f.locator(starts[app.id]).click();await settle(f);assert.equal(await page.evaluate(()=>!!document.fullscreenElement),false,phase+' native start may not hide OS in fullscreen');
  const before=await f.evaluate(()=>({body:document.body,inputs:[...document.querySelectorAll('input,select,textarea')].map(n=>({id:n.id,value:n.value})),url:location.href}));
  await f.evaluate(()=>window.__chromeProofBody=document.body);
  const commands=await page.locator('#nativeGameCommands button').allTextContents();
  for(const size of [{width:1366,height:768},{width:390,height:844},{width:640,height:360}]){
   await page.setViewportSize(size);for(const collapsed of [false,true]){
    await page.evaluate(c=>LeraarBobTopbar.setCollapsed(c,true),collapsed);await settle(f);
    assert.equal(await page.locator('leraarbob-topbar').count(),1,phase+' one platform bar');assert.equal(await f.locator('leraarbob-topbar').count(),0,phase+' no iframe platform bar');
    assert.deepEqual(await f.locator('[data-os-native-header=hidden]').evaluateAll(ns=>ns.filter(n=>n.getBoundingClientRect().height>0).map(n=>n.id||n.className)),[],phase+' duplicate header height');
    assert(await f.evaluate(()=>window.__chromeProofBody===document.body),phase+' same native DOM');
    await measure('#appBack');await measure('#closeApp');if(collapsed){await measure('.lb-restore:not([hidden])');assert.equal(await page.locator('.lb-restore:not([hidden])').getAttribute('aria-expanded'),'false');}
    if(shots.has(app.id)&&size.width===1366)await shot(app.id+(collapsed?'-collapsed':'-desktop'));
   }
  }
  await page.setViewportSize({width:1366,height:768});await page.evaluate(()=>LeraarBobTopbar.setCollapsed(false));
  // Opening Start and minimizing may not replace a workboard or its entered controls.
  await page.locator('#minimizeApp').click();await page.locator('#runningApps button').first().click();assert(await f.evaluate(()=>window.__chromeProofBody===document.body));
  assert.deepEqual(await f.evaluate(()=>[...document.querySelectorAll('input,select,textarea')].map(n=>({id:n.id,value:n.value}))),before.inputs,phase+' input after collapse/minimize');
  await page.locator('#focusWorkspace').click();await measure('#focusRestore');await measure('#closeApp');const board=await page.locator('.frame-wrapper:not([hidden])>iframe').boundingBox(),restore=await page.locator('#focusRestore').boundingBox();assert(board.y+board.height<=restore.y+1,phase+' escape row outside workboard');await page.locator('#focusRestore').click();
  // Every projected native command appears in the same OS game menu.
  await page.locator('leraarbob-topbar .menu').click();for(const label of commands)assert.equal(await page.getByRole('button',{name:label,exact:true}).count(),1,phase+' projected command '+label);await page.locator('leraarbob-topbar .close').click();
  report.apps.push({...app,commands,layouts:6,retainedDOM:true});console.log('PASS layout/state',app.id);await page.close();
 }
 if(!process.env.CHROME_APPS){
 // Functional command projection: these are clicks on the OS menu, not calls into the engine.
 phase='data-check-menu';f=await open('data-check');await f.locator('#homeStart').click();await menu('Data Check · Levels kiezen');assert((await f.locator('#stage').innerText()).includes('Kies'));await shot('data-check-levels');console.log('PASS Data Check actions');report.interactions.push('Data Check: native start stays in OS; shared menu opens real level chooser');await page.close();
 phase='gravity-menu';f=await open('gravity-maze');await menu('Gravity Maze · Kamers kiezen');await f.locator('#selection[open]').waitFor();await f.locator('[data-close=selection]').click();await f.locator('#positive').click();await menu('Gravity Maze · Kamer opnieuw');await menu('Gravity Maze · Spelregels');await f.locator('#instructions[open]').waitFor();await f.locator('[data-close=instructions]').click();console.log('PASS Gravity Maze actions');report.interactions.push('Gravity Maze: real movement, restart, room chooser and rules through shared menu');await page.close();
 phase='wortelbouw-menu';f=await open('wortelbouw');await menu('Wortelbouw · Opgaven kiezen');await f.locator('#progressDialog[open]').waitFor();console.log('PASS Wortelbouw actions');report.interactions.push('Wortelbouw: shared menu invokes original level dialog');await page.close();
 phase='stelsels-input';f=await open('stelsels');await f.locator('#exerciseSelect').selectOption({index:2});await f.locator('button[data-method=substitution]').click();const method=await f.locator('button[data-method=substitution]').getAttribute('aria-selected');assert.equal(method,'true');const selected=await f.locator('#exerciseSelect').inputValue();await page.locator('#minimizeApp').click();await page.getByRole('button',{name:'Terug naar Stelsels',exact:true}).click();assert.equal(await f.locator('#exerciseSelect').inputValue(),selected);assert.equal(await f.locator('button[data-method=substitution]').getAttribute('aria-selected'),'true');await page.evaluate(()=>LeraarBobTopbar.setCollapsed(true,true));await page.reload();await page.waitForFunction(()=>LeraarBobDesktop?.state().accountId);await page.evaluate(()=>LeraarBobDesktop.openApp('stelsels'));await measure('.lb-restore:not([hidden])');await page.locator('.lb-restore:not([hidden])').click();report.interactions.push('Stelsels: exercise/method choices survive minimize and resume; explicit collapse survives full OS reload');await page.close();
 for(const id of ['wortelbouw','vectoren-trainer','rechtenwereld']){phase=id+'-duo';f=await open(id,'local');await settle(f);assert.equal(await f.locator('leraarbob-topbar').count(),0);assert.deepEqual(await f.locator('#battleTopbar,body>.battle-top').evaluateAll(ns=>ns.filter(n=>n.getBoundingClientRect().height>0).map(n=>n.outerHTML.slice(0,90))),[]);await measure('#closeApp');report.interactions.push(id+': local duo entry has no duplicate navigation; player score/round UI retained');await page.close();}
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.missing,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log('PASS',report.apps.length,'catalog entries;',report.interactions.length,'interaction groups;',report.measurements.length,'target measurements');
}catch(e){if(page&&!page.isClosed())console.error(await page.evaluate(()=>({state:window.LeraarBobDesktop?.state(),frames:document.querySelector('#appFrames')?.innerHTML.slice(0,2500)})).catch(()=>null));if(page&&!page.isClosed())await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({phase,error:e.message,report},null,2));throw e;}finally{await browser?.close();await server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
