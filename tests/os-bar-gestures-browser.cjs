'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{start}=require('../scripts/serve-rechten-entry-preview.cjs');
const out=process.env.BAR_GESTURES_PROOF||'/tmp/lb-bar-gestures';fs.mkdirSync(out,{recursive:true});
const report={checks:[],errors:[],scope:'Real mouse and Chromium touch input, native fullscreen events and local fixture accounts; no production writes.'};
(async()=>{
 const server=await start({port:0});let browser,page;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.LB_CHROMIUM||(fs.existsSync('/opt/brave.com/brave/brave')?'/opt/brave.com/brave/brave':undefined),args:['--no-sandbox','--disable-dev-shm-usage']});
  const ctx=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1,hasTouch:true});
  await ctx.route('**/*',r=>new URL(r.request().url()).origin===server.base?r.continue():r.abort());
  page=await ctx.newPage();page.setDefaultTimeout(18000);page.on('pageerror',e=>report.errors.push(e.message));page.on('dialog',d=>d.accept());
  const cdp=await ctx.newCDPSession(page);
  const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r)))));
  const states=()=>page.evaluate(()=>({top:document.body.classList.contains('topbar-collapsed'),bottom:document.body.classList.contains('os-bottom-collapsed')}));
  const preferences=()=>page.evaluate(()=>({top:localStorage.getItem('leraarbob-topbar-collapsed'),bottom:Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('leraarbob-desktop:v1:')).map(k=>[k,JSON.parse(localStorage.getItem(k)).bottomCollapsed]))}));
  async function gesture(selector,dy,{touch=false,dx=0,cancel=false}={}){
   const node=page.locator(selector),r=await node.boundingBox();assert(r&&r.width>=44&&r.height>=44,selector+' reachable handle');
   const x=r.x+r.width/2,y=r.y+r.height/2;
   if(touch){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
    for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/5,y:y+dy*i/5,id:1}]});
    await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});
   }else{
    await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y+dy,{steps:5});
    if(cancel)await page.keyboard.press('Escape');await page.mouse.up();
   }
   await settle();
  }
  await page.goto(server.base+'/os/?previewUser=alex');await page.waitForFunction(()=>LeraarBobDesktop?.state().accountId);
  await page.locator('.personal-app[data-app-id=rechtenwereld] [data-mode=solo]').click();
  const frame=await(await page.locator('.native-app').elementHandle()).contentFrame();await frame.locator('#app[data-ready=true]').waitFor();
  await frame.locator('[data-world-node=puntenbaai]').click();await frame.locator('[data-node=point]').click();await frame.locator('[data-choice=answer]').first().click();
  const before=await frame.evaluate(()=>RechtenV2App.snapshot());await frame.evaluate(()=>window.__barBody=document.body);
  for(const viewport of [{width:1366,height:768},{width:390,height:844},{width:640,height:360},{width:320,height:568}]){
   await page.setViewportSize(viewport);await settle();
   for(const touch of [false,true]){
    await gesture('leraarbob-topbar .collapse',-22,{touch});assert.deepEqual(await states(),{top:true,bottom:false});
    await gesture('.lb-restore:not([hidden])',30,{touch});assert.deepEqual(await states(),{top:false,bottom:false});
    await gesture('#taskbarToggle',22,{touch});assert.deepEqual(await states(),{top:false,bottom:true},JSON.stringify({viewport,touch,action:'fold bottom'}));
    await gesture('#taskbarToggle',-30,{touch});assert.deepEqual(await states(),{top:false,bottom:false});
    assert.deepEqual(await frame.evaluate(()=>RechtenV2App.snapshot()),before);assert(await frame.evaluate(()=>window.__barBody===document.body));
   }
  }
  report.checks.push('Four viewports × real mouse/touch: pull both bars outward to fold, inward to restore; one state change per drag, same native question and chosen answer');
  await page.setViewportSize({width:1366,height:768});await settle();
  await gesture('leraarbob-topbar .collapse',30);await gesture('#taskbarToggle',-30);await gesture('#taskbarToggle',0,{dx:-45});
  await gesture('leraarbob-topbar .collapse',-22,{cancel:true});await gesture('#taskbarToggle',22,{touch:true,cancel:true});
  assert.deepEqual(await states(),{top:false,bottom:false});
  report.checks.push('Wrong direction, horizontal movement, Escape cancellation and touch cancellation never toggle a bar or trigger a click underneath');
  await page.locator('leraarbob-topbar .collapse').focus();await page.keyboard.press('ArrowUp');assert.equal((await states()).top,true);
  await page.keyboard.press('ArrowDown');assert.equal((await states()).top,false);
  await page.locator('#taskbarToggle').focus();await page.keyboard.press('ArrowDown');assert.equal((await states()).bottom,true);await page.keyboard.press('ArrowUp');assert.equal((await states()).bottom,false);
  await page.locator('#taskbarToggle').tap();assert.equal((await states()).bottom,true);await page.locator('#taskbarToggle').tap();
  report.checks.push('Click/tap, Enter/Space-compatible buttons and directional arrow keys remain available with named 44px targets');
  for(const bottom of [false,true]){
   if((await states()).bottom!==bottom)await page.locator('#taskbarToggle').click();
   const saved=await preferences();
   await page.locator('leraarbob-topbar .fullscreen').click();await page.waitForFunction(()=>!!document.fullscreenElement&&document.body.classList.contains('topbar-collapsed')&&document.body.classList.contains('os-bottom-collapsed'));
   await settle();assert.deepEqual(await preferences(),saved,'Fullscreen cannot overwrite explicit collapse preferences');
   const full=await page.locator('.native-app').boundingBox();assert.equal(full.y,0);assert.equal(full.height,await page.evaluate(()=>innerHeight));
   if(!bottom)await page.screenshot({path:path.join(out,'rights-fullscreen.png')});
   await gesture('.lb-restore:not([hidden])',30,{touch:true});assert.deepEqual(await states(),{top:false,bottom:true});assert.deepEqual(await preferences(),saved);
   if(bottom)await page.evaluate(()=>document.exitFullscreen());
   else await page.locator('leraarbob-topbar .fullscreen').click();
   await page.waitForFunction(()=>!document.fullscreenElement);await settle();assert.deepEqual(await states(),{top:false,bottom});assert.deepEqual(await preferences(),saved);
   assert.deepEqual(await frame.evaluate(()=>RechtenV2App.snapshot()),before);
  }
  report.checks.push('One actual fullscreen action hides both bars without persisting temporary choices; pulling restores controls; button/browser exit restores each previous bar state and the answer');
  if((await states()).bottom)await page.locator('#taskbarToggle').click();
  await page.evaluate(()=>{window.__requestFullscreen=document.documentElement.requestFullscreen;document.documentElement.requestFullscreen=()=>Promise.reject(new Error('test denied'));});
  await page.locator('leraarbob-topbar .fullscreen').click();await page.locator('leraarbob-topbar .display-notice:not([hidden])').waitFor();assert.deepEqual(await states(),{top:false,bottom:false});
  await page.locator('leraarbob-topbar .dismiss-notice').click();await page.evaluate(()=>document.documentElement.requestFullscreen=window.__requestFullscreen);
  report.checks.push('Rejected fullscreen leaves both bars usable and preserves the original preference/state');
  await page.locator('leraarbob-topbar .menu').click();assert.equal(await page.getByRole('button',{name:/Balken verbergen|Bovenbalk verbergen|Open in nieuw tabblad|Apart openen/}).count(),0);await page.locator('leraarbob-topbar .close').click();
  assert.equal(await page.locator('#focusControls,#focusWorkspace,#openOriginal').count(),0);
  await gesture('leraarbob-topbar .collapse',-22);await gesture('#taskbarToggle',22);await page.reload();await page.waitForFunction(()=>LeraarBobDesktop?.state().accountId);await settle();assert.deepEqual(await states(),{top:true,bottom:true});
  await gesture('.lb-restore:not([hidden])',30,{touch:true});await gesture('#taskbarToggle',-30,{touch:true});
  report.checks.push('No duplicate hide-bars/new-tab control; explicit drag choices survive reload and both handles restore the desktop');
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log('PASS',report.checks.length,'OS bar gesture/fullscreen groups');
 }catch(e){if(page&&!page.isClosed())await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:e.message,...report},null,2));throw e;}
 finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
