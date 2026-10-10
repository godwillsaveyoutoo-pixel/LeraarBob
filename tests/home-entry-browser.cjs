/* Real browser routing on the GitHub Pages path prefix. Local guest auth fixture;
 * no production login, credentials, sessions or progress writes. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const serve=require('../scripts/serve-os-preview.cjs').createServer().listeners('request')[0];
const out=process.env.HOME_SCREENSHOTS||path.join(__dirname,'../os/qa/home-entry');
const auth=`window.AxiomaAuth={CLASSES:['TEST'],ready:async()=>({session:null,account:null}),getAccount:async()=>null,getSession:async()=>null,getSnapshot:()=>({status:'guest',account:null,session:null}),client:()=>null,configured:()=>true,onChange:()=>()=>{},onStateChange:()=>()=>{}};`;
const report={scope:'Actual local Chromium navigation and UI with guest auth fixture; no real production accounts',checks:[],errors:[],missing:[],passed:false};
let browser,context,server,base;
const check=name=>{report.checks.push({name,passed:true});console.log('PASS '+name);};
async function desktop(page){await page.waitForFunction(()=>window.LeraarBobDesktop&&document.querySelectorAll('#themeFolders .theme-folder').length===8);assert.equal(new URL(page.url()).pathname,'/LeraarBob/os/');}
async function catalog(page){await page.waitForSelector('#featuredGrid [data-game-id]');assert.equal(new URL(page.url()).pathname,'/LeraarBob/index.html');}
async function fit(page){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 server=http.createServer((req,res)=>{if(!req.url.startsWith('/LeraarBob/'))return res.writeHead(404).end();req.url=req.url.slice('/LeraarBob'.length);serve(req,res);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port+'/LeraarBob';
 const executablePath=process.env.LB_CHROMIUM||(fs.existsSync('/opt/brave.com/brave/brave')?'/opt/brave.com/brave/brave':undefined);
 browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
 context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1});
 context.on('page',page=>{page.on('pageerror',error=>report.errors.push(error.message));page.on('response',response=>{if(response.status()===404)report.missing.push(new URL(response.url()).pathname);});});
 await context.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.origin!==new URL(base).origin||route.request().method()!=='GET')return route.fulfill({body:''});
  if(url.pathname.endsWith('/axioma-auth.js'))return route.fulfill({contentType:'application/javascript',body:auth});
  return route.continue();
 });
 const page=await context.newPage();
 for(const entry of ['/', '/index.html']){await page.goto(base+entry);await desktop(page);check(entry+' opens the desktop on the Pages prefix');}
 await page.screenshot({path:path.join(out,'desktop-1366-expanded.png')});
 for(const size of [{width:1366,height:768},{width:390,height:844}]){
  await page.setViewportSize(size);await fit(page);
  if(await page.locator('.lb-restore').isVisible())await page.locator('.lb-restore').click();
  await page.locator('leraarbob-topbar .collapse').click();
  const restore=page.locator('.lb-restore');assert.equal(await restore.getAttribute('aria-expanded'),'false');
  const rect=await restore.boundingBox();assert(rect.width>=44&&rect.height>=44&&rect.x>=0&&rect.y>=0);
  await page.screenshot({path:path.join(out,'desktop-'+size.width+'-collapsed.png')});
  await page.reload();await desktop(page);assert(await restore.isVisible());
  await restore.click();assert.equal(await page.locator('leraarbob-topbar .collapse').getAttribute('aria-expanded'),'true');await fit(page);
  await page.screenshot({path:path.join(out,'desktop-'+size.width+'-expanded.png')});
  check('Desktop '+size.width+' expanded/collapsed, 44px restore and persisted reload choice');
 }
 await page.setViewportSize({width:1366,height:768});
 for(const [hash,place] of [['#ontdek','all'],['#reserve','all'],['#playerProgress','profile']]){
  await page.goto(base+'/index.html'+hash);await desktop(page);assert.equal(await page.evaluate(()=>LeraarBobDesktop.state().view.kind),place);check('Existing '+hash+' opens OS '+place);
 }
 await page.goto(base+'/?theme=getallen&utm_source=old-link#bookmark');await desktop(page);
 const routed=new URL(page.url());assert.equal(routed.searchParams.get('theme'),'getallen');assert.equal(routed.searchParams.get('utm_source'),'old-link');assert.equal(routed.hash,'#bookmark');check('Unrecognized query/hash and theme bookmark remain intact');
 await page.goto(base+'/index.html?view=catalog');await catalog(page);
 assert(await page.locator('#reserve').count());await page.locator('leraarbob-topbar .brand').click();await desktop(page);
 await page.goBack();await catalog(page);assert.equal(new URL(page.url()).searchParams.get('view'),'catalog');check('Explicit old catalog and genuine Home/Back navigation without redirect loop');
 await page.goto(base+'/');await desktop(page);await page.locator('.taskbar [data-view=settings]').click();
 const oldLink=page.getByRole('link',{name:'Open eerdere startpagina'});assert.equal(await oldLink.getAttribute('href'),base+'/index.html?view=catalog');
 for(const size of [{width:1366,height:768},{width:390,height:844}]){await page.setViewportSize(size);await oldLink.scrollIntoViewIfNeeded();const rect=await oldLink.boundingBox();assert(rect.width>=44&&rect.height>=44&&rect.x>=0&&rect.x+rect.width<=size.width+1);await fit(page);}
 await page.setViewportSize({width:1366,height:768});const popupPromise=context.waitForEvent('page');await oldLink.click();const popup=await popupPromise;await catalog(popup);await popup.screenshot({path:path.join(out,'earlier-catalog.png')});await popup.close();
 assert.equal(await page.evaluate(()=>LeraarBobDesktop.state().view.kind),'settings');check('Settings opens the earlier catalog in another tab with reachable 44px link');
 await page.goto(base+'/games/getallenwereld/');await page.waitForSelector('leraarbob-topbar');await page.locator('leraarbob-topbar .brand').click();await desktop(page);check('Native standalone app Home reaches the new desktop');
 for(const target of ['teacher/','games/rechten/rechtenwereld/']){
  const entry='/index.html?login=1&return='+encodeURIComponent(target);await page.goto(base+entry);await catalog(page);await page.waitForSelector('#authOverlay:not([hidden])');
  assert.equal(new URL(page.url()).searchParams.get('return'),target);await page.locator('#authClose').click();check('Existing login dialog and '+target+' return stay on original account entry');
 }
 for(const marker of ['?return=teacher/','?code=local-test','?token_hash=local-test&type=recovery','?error=local-test#error_description=local-test','#access_token=local-test&refresh_token=local-test&type=recovery']){
  await page.goto(base+'/index.html'+marker);await catalog(page);assert.equal(new URL(page.url()).search+new URL(page.url()).hash,marker);
 }check('Original auth and recovery callback queries/hashes remain exact');
 const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),fallback=await noJS.newPage();
 await fallback.goto(base+'/os/');await fallback.getByRole('link',{name:'Open de eerdere startpagina.'}).click();assert.equal(new URL(fallback.url()).searchParams.get('view'),'catalog');await fallback.waitForSelector('noscript a[href*="rechtenwereld"]');await noJS.close();check('JavaScript-disabled desktop fallback reaches usable old catalog');
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.missing,[]);check('No JavaScript errors or missing frontend files');report.passed=true;
})().catch(error=>{report.failure=error.stack;console.error(error);process.exitCode=1;}).finally(async()=>{
 try{await context?.close();await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));}catch(error){report.passed=false;report.cleanupFailure=error.message;process.exitCode=1;}
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
});
