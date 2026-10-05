// Verify the production entry, shared controls and preservation of real work.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=process.env.ALGEBRA_SCREENSHOTS||'/tmp/algebrawereld-v045-platform';
const server=http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',{'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.ttf':'font/ttf','.json':'application/json'}[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.ALGEBRA_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{for(const [width,height] of [[1280,800],[780,360],[640,360],[390,844],[320,700]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<900,reducedMotion:'reduce'}),page=await context.newPage(),errors=[],missing=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)missing.push(r.url());});
  await page.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.fulfill({body:''}));
  const click=s=>width<900?page.locator(s).tap():page.locator(s).click();
  const ready=async()=>{await page.waitForSelector('leraarbob-topbar .collapse',{state:'attached'});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
  async function layout(label){
   const problems=await page.evaluate(()=>{
    const bad=[],restore=document.querySelector('.lb-restore:not([hidden])')?.getBoundingClientRect();
    if(document.documentElement.scrollWidth>innerWidth+1)bad.push('horizontal page overflow');
    for(const e of document.querySelectorAll('.worldScreen button,.trainHead button,.opRail button,.routeDock a,.algebraMenu button,.algebraMenu a')){
     if(!e.getClientRects().length)continue;const r=e.getBoundingClientRect();
     if(r.width<43.5||r.height<43.5)bad.push('small '+(e.id||e.textContent.trim()));
     if(r.left<-.5||r.right>innerWidth+.5||r.top<-.5||r.bottom>innerHeight+.5)bad.push('clipped '+(e.id||e.textContent.trim()));
     if(restore&&r.left<restore.right&&r.right>restore.left&&r.top<restore.bottom&&r.bottom>restore.top)bad.push('restore covers '+(e.id||e.textContent.trim()));
    }
    for(const e of document.querySelectorAll('.routeHeading h1,.routeHeading span,.routeHeading output')){
     if(!e.getClientRects().length)continue;const range=document.createRange();range.selectNodeContents(e);const r=range.getBoundingClientRect();
     if(r.left<-.5||r.right>innerWidth+.5)bad.push('clipped heading '+e.textContent);
    }return bad;
   });await page.screenshot({path:path.join(out,label+'-'+width+'.png')});assert.deepEqual(problems,[],label+' '+width);
  }
  await page.goto(base+'/');await ready();await page.waitForSelector('#featuredGrid [data-game-id="algebra-trainer"]');
  assert.equal(await page.locator('#featuredGrid [data-game-id="algebra-trainer"]').count(),1);
  assert.equal(await page.locator('#grid [data-game-id="rechten-arcade"]').count(),1,'the previously published arcade remains available');
  await click('#featuredGrid [data-game-id="algebra-trainer"]');await page.waitForURL('**/games/algebra-trainer/');await ready();await page.waitForSelector('#navigationScreen:not(.hidden)');
  assert.equal(await page.locator('[data-world]').count(),5);assert.equal(await page.locator('[data-stop]').count(),7);
  assert(await page.locator('leraarbob-topbar .fullscreen').isVisible());assert(await page.locator('leraarbob-topbar .theme-toggle').isVisible());
  assert.equal(await page.locator('[data-menu-stop]').count(),7);assert.equal(await page.locator('#navigationVersion').textContent(),'v0.4.5');await layout('menu-expanded');const initial=await page.evaluate(()=>AlgebraTrainer.snapshot());
  await click('leraarbob-topbar .collapse');assert.equal(await page.locator('.lb-restore').getAttribute('aria-expanded'),'false');await layout('menu-collapsed');
  await page.reload();await ready();await page.waitForSelector('#navigationScreen:not(.hidden)');assert(await page.locator('.lb-restore').isVisible());assert.deepEqual(await page.evaluate(()=>AlgebraTrainer.snapshot()),initial);
  await click('.lb-restore');assert.equal(await page.locator('leraarbob-topbar .collapse').getAttribute('aria-expanded'),'true');
  await click('[data-menu-stop=route-inverse]');await page.waitForSelector('#trainerScreen:not(.hidden)');await layout('exercise-expanded');
  const work=await page.evaluate(()=>AlgebraTrainer.snapshot()),expandedHeight=await page.locator('.trainStage').evaluate(e=>e.getBoundingClientRect().height);
  await click('leraarbob-topbar .collapse');await layout('exercise-collapsed');
  assert(await page.locator('.trainStage').evaluate(e=>e.getBoundingClientRect().height)>expandedHeight,'folding frees space for the exercise');
  await page.reload();await ready();await page.waitForSelector('#trainerScreen:not(.hidden)');assert(await page.locator('.lb-restore').isVisible());assert.deepEqual(await page.evaluate(()=>AlgebraTrainer.snapshot()),work);
  await click('.lb-restore');await click('leraarbob-topbar .theme-toggle');assert.deepEqual(await page.evaluate(()=>AlgebraTrainer.snapshot()),work);await click('leraarbob-topbar .theme-toggle');
  await click('#backSetupBtn');await layout('menu-with-work');await click('[data-menu-nav=world]');await layout('world-expanded');await click('leraarbob-topbar .collapse');await layout('world-collapsed');await click('.lb-restore');await click('[data-world="systems"]');assert.equal(await page.locator('[data-stop]').count(),6);await click('[data-start]');await page.waitForURL('**/stelsels.html?topic=*');await ready();
  assert.equal(await page.locator('leraarbob-topbar').count(),1);assert(await page.locator('leraarbob-topbar .progress-value').isVisible());
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log('PASS Algebrawereld entry, topbar and Stelsels '+width+'×'+height);await context.close();
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
