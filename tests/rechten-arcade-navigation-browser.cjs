/* Homepage and original world entry, folding, direct Glasraam return; isolated drafts and no external requests. */
'use strict';
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.ARCADE_SCREENSHOTS||path.join(root,'docs/rechten-arcade/preview');
const key='leraarbob-glasatelier-draft-v1';
const server=http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',{'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json'}[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE||process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{for(const [width,height]of [[1366,768],[390,844],[780,360],[640,360],[320,568]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<900}),page=await context.newPage(),errors=[],missing=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)missing.push(r.url());});
  await page.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.fulfill({body:''}));
  const click=selector=>width<900?page.locator(selector).tap():page.locator(selector).click();
  const ready=async()=>{await page.waitForSelector('leraarbob-topbar .collapse',{state:'attached'});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
  await page.goto(base+'/');await ready();
  await page.waitForSelector('#featuredGrid [data-game-id="rechtenwereld"]');
  assert.deepEqual(await page.locator('#featuredGrid [data-game-id]').evaluateAll(es=>es.map(e=>e.dataset.gameId)),['rechtenwereld','wortelbouw','vectoren-trainer','gravity-maze','algebra-trainer']);
  assert.equal(await page.locator('#featuredGrid [data-game-id="rechten-arcade"]').count(),0,'Rechtenwereld remains the original main entry');
  await click('#reserve > summary');
  assert(await page.locator('#grid [data-game-id="rechten-arcade"]').isVisible(),'arcade belongs to the menu below the main games');
  await click('#grid [data-game-id="rechten-arcade"]');await page.waitForURL('**/arcade/');await ready();
  await page.goto(base+'/games/rechten/rechtenwereld/#wereld');await ready();
  await page.waitForSelector('#app[data-ready="true"]');
  assert.equal(await page.locator('.world-atelier-link').count(),0,'original world map is not redesigned');
  const savedWorld=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>/rechten.*v2|v2.*rechten/.test(k)).map(k=>[k,JSON.parse(localStorage.getItem(k)).state])));
  await click('leraarbob-topbar .collapse');assert(await page.locator('.lb-restore').isVisible());
  await page.reload();await ready();await page.waitForSelector('#app[data-ready="true"]');assert(await page.locator('.lb-restore').isVisible());
  await click('.lb-restore');
  assert.deepEqual(await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>/rechten.*v2|v2.*rechten/.test(k)).map(k=>[k,JSON.parse(localStorage.getItem(k)).state]))),savedWorld);
  const menu=page.locator('leraarbob-topbar .menu:visible, leraarbob-topbar .mobile-menu:visible').first();await (width<900?menu.tap():menu.click());
  const arcadeEntry=page.locator('leraarbob-topbar dialog').getByRole('button',{name:/^Rechtenarcade/});assert(await arcadeEntry.isVisible());await (width<900?arcadeEntry.tap():arcadeEntry.click());await page.waitForURL('**/arcade/');await ready();
  const bad=await page.evaluate(()=>{
   const bad=[];if(document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1)bad.push('document scroll');
   for(const e of document.querySelectorAll('#menuScreen button,#menuScreen .arena-choice,#menuScreen strong,#menuScreen .arena-choice span')){
    const r=e.getBoundingClientRect();if(r.left<-.5||r.right>innerWidth+.5||r.top<-.5||r.bottom>innerHeight+.5)bad.push('clipped '+(e.id||e.textContent.trim()));
    if(e.matches('button,a')&&(r.width<43.5||r.height<43.5))bad.push('small target');
    if(e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2)bad.push('overflow '+(e.id||e.textContent.trim()));
   }
   return bad;
  });
  await page.screenshot({path:path.join(out,'arcade-glasatelier-menu-'+width+'.png')});assert.deepEqual(bad,[],'arcade layout '+width);
  assert.equal(await page.locator('[data-game]').count(),3);assert.equal(await page.locator('.atelier-choice').count(),1);
  assert(await page.locator('.atelier-choice img').evaluate(e=>e.complete&&e.naturalWidth>0));
  await click('leraarbob-topbar .collapse');
  const overlap=await page.evaluate(()=>{const restore=document.querySelector('.lb-restore').getBoundingClientRect();return [...document.querySelectorAll('#menuScreen button,#menuScreen a,#menuScreen h1')].filter(e=>e.getClientRects().length).filter(e=>{const r=e.getBoundingClientRect();return r.left<restore.right&&r.right>restore.left&&r.top<restore.bottom&&r.bottom>restore.top;}).map(e=>e.id||e.textContent.trim());});
  assert.deepEqual(overlap,[],'restore never covers an action');
  await page.reload();await ready();assert(await page.locator('.lb-restore').isVisible());await click('.lb-restore');
  await click('.atelier-choice');await page.waitForURL('**/glasatelier.html');await ready();
  assert.equal(await page.locator('leraarbob-topbar').count(),1);assert.equal(await page.locator('#gameFrame').count(),0);
  assert.equal(await page.locator('leraarbob-topbar .progress-value').textContent(),'0/8 ramen');
  assert(await page.locator('leraarbob-topbar .fullscreen').isVisible());assert(await page.locator('leraarbob-topbar .theme-toggle').isVisible());
  await click('#gallery-open');assert.equal(await page.locator('[data-pattern]').count(),8);await click('[data-close="gallery-dialog"]');
  const p=await page.locator('#glass-board').evaluate(e=>{const q=new DOMPoint(Number(e.dataset.cx)+Number(e.dataset.unit),Number(e.dataset.cy)-Number(e.dataset.unit)).matrixTransform(e.getScreenCTM());return {x:q.x,y:q.y};});
  if(width<900)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);
  const draft=await page.evaluate(key=>localStorage.getItem(key),key);assert(draft);assert.deepEqual(JSON.parse(draft).drafts.zonneroos.points[0],{x:1,y:1});
  await click('leraarbob-topbar .collapse');assert(await page.locator('.lb-restore').isVisible());
  await click('#more-open');await click('#options-dialog a[href="../arcade/"]');await page.waitForURL('**/arcade/');await ready();
  assert(await page.locator('.lb-restore').isVisible());await page.reload();await ready();assert(await page.locator('.lb-restore').isVisible());
  await click('.lb-restore');await click('.atelier-choice');await page.waitForURL('**/glasatelier.html');await ready();
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),draft,'return preserves unfinished drawing');
  await page.screenshot({path:path.join(out,'glasatelier-'+width+'.png')});
  assert.deepEqual(missing,[]);assert.deepEqual(errors,[]);console.log('PASS Home → Rechtenwereld → Arcade ↔ Glasraam '+width+'×'+height);await context.close();
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
