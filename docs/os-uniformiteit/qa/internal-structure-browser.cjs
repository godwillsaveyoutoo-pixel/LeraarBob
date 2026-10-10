'use strict';
// Local frontend only. Fresh guests; block external requests and all writes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const repo=path.resolve(__dirname,'../../..'),base=process.env.LB_STRUCTURE_BASE||'http://127.0.0.1:8791/',out=__dirname;
const registry=require(repo+'/shared/game-registry.js')(JSON.parse(fs.readFileSync(repo+'/games.json','utf8')),{baseURL:base});
const apps=[['getallenwereld','GetallenWorld'],['algebra-trainer','AlgebraShell'],['rechtenwereld','RechtenV2App'],['vectoren-trainer','AxiomaVectorTrainer']];
const report={release:'296e06b7afb84564f7737ba0f790e27ebf6fa800',scope:'Local published frontend; fresh guests, 1366x768, deviceScaleFactor 1. No real account, backend writes, session creation, grading or submission.',capabilities:[],interfaces:[],probes:[],blocked:[],errors:[],sources:[],completed:false};
for(const [id] of apps){report.capabilities.push({id,modes:registry.modes(id).map(m=>({id:m.id,providerGameId:m.providerGameId,providerId:m.providerId,href:m.href,roles:m.roles})),worksheets:registry.worksheets(id).map(w=>w.id)});}
for(const file of ['os/desktop.js','shared/game-registry.js','shared/play-modes.js','games/getallenwereld/app.js','games/bewerkingen-trainer/numbers-space.js','games/algebra-trainer/shell.js','games/algebra-trainer/navigation.js','games/rechten/rechtenwereld/app-shell.js','games/rechten/rechtenwereld/play.js','games/vectoren/vector-app.js'])report.sources.push({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(repo+'/'+file)).digest('hex')});
let browser,context;
async function run(){try{
 browser=await chromium.launch({headless:true,executablePath:process.env.LB_CHROMIUM||'/opt/brave.com/brave/brave',args:['--no-sandbox','--disable-dev-shm-usage']});report.browser=await browser.version();
 for(const [id,api] of apps){
  context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1,reducedMotion:'reduce'});
  await context.route('**/*',route=>{const request=route.request();if(request.method()!=='GET'||new URL(request.url()).origin!==new URL(base).origin){report.blocked.push({app:id,url:request.url(),method:request.method()});return route.abort();}return route.continue();});
  const page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>report.errors.push({app:id,message:e.message}));page.on('dialog',d=>d.accept());
  await page.goto(base+'os/');await page.waitForFunction(()=>Boolean(window.LeraarBobDesktop));await page.evaluate(id=>LeraarBobDesktop.openApp(id,'solo'),id);
  const f=await(await page.locator('.frame-wrapper:not([hidden]) iframe').elementHandle()).contentFrame();await f.waitForFunction(api=>Boolean(window[api])&&(api==='RechtenV2App'?document.querySelector('#app[data-ready="true"]'):api==='AlgebraShell'?Boolean(window.AlgebraShell.context()):Boolean(window.AxiomaGame?.active)),api);
  report.interfaces.push({id,api,methods:await f.evaluate(api=>Object.keys(window[api]),api),osNavigationVisible:await page.locator('#nativeAppNavigation').isVisible()});
  if(id==='getallenwereld'){
   await f.locator('.themes button[data-theme="machten"]').click();await f.locator('[data-stop="machten-product"]').click();await f.locator('.path-detail [data-action="start"]').click();
   const before=await f.evaluate(()=>{window.__structureSentinel='native-live-document';return GetallenWorld.snapshot();});
   await page.locator('#minimizeApp').click();await page.locator('#runningApps button').first().click();
   assert.equal(await f.evaluate(()=>window.__structureSentinel),'native-live-document');assert.deepEqual(await f.evaluate(()=>GetallenWorld.snapshot()),before);
   report.probes.push({app:id,action:'Actual start then OS minimize/resume',result:'Same native document and identical guided state'});
   await f.locator('.workshop-nav [data-action="chapter"]').click();const link=f.locator('.path-links [data-world-mode="series"]');const destination=await link.getAttribute('href');
   await link.click();await f.waitForFunction(()=>Boolean(window.NumbersSpace?.ready));assert.equal(await f.evaluate(()=>window.__structureSentinel),undefined);
   const provider=await f.evaluate(()=>({url:location.href,snapshot:NumbersSpace.snapshot(),heading:document.getElementById('spaceTitle').textContent,choices:[...document.querySelectorAll('[data-go]')].map(n=>n.dataset.go)}));assert.equal(provider.snapshot.view,'home');
   report.probes.push({app:id,action:'Actual guided chapter → Oefenen & samen',destination,result:'Replaces guided document and asks workmode again',provider});
  }
  if(id==='rechtenwereld'){
   await f.locator('[data-world-node="hellingrug"]').click();const link=f.locator('a.area-play-link');const destination=await link.getAttribute('href');await link.click();await f.locator('#playModes .play-mode').first().waitFor();
   const choices=await f.locator('#playModes .play-mode').allTextContents();assert(choices.length>1);report.probes.push({app:id,action:'Actual Hellingrug → Leren, spelen of papier',destination,result:'Separate native workmode selector repeats OS choices',choices});
  }
  if(id==='vectoren-trainer'){
   const topics=registry.game(id).topics;assert(topics.length>1);const station=topics.at(-1).id;
   const url=new URL(f.url());url.searchParams.set('world',station);url.searchParams.set('screen','stationScreen');await f.goto(url.href);await f.waitForFunction(()=>Boolean(window.AxiomaVectorTrainer));
   const result=await f.evaluate(()=>({screen:document.body.dataset.screen,station:document.getElementById('crumbStation').textContent,stationVisible:!document.getElementById('stationScreen').hidden}));assert.equal(result.screen,'home');
   report.probes.push({app:id,action:'Native solo URL supplied world and stationScreen',requested:station,result:'No native station deep-link contract; stays on home',observed:result,registryTopicScopes:topics.map(t=>({id:t.id,scope:t.scope,routeModes:t.routeModes}))});
  }
  await context.close();context=null;
 }
 assert.deepEqual(report.errors,[]);report.completed=true;
 }catch(e){report.failure={message:e.message,stack:e.stack};throw e;}finally{fs.writeFileSync(out+'/internal-structure-report.json',JSON.stringify(report,null,2)+'\n');await context?.close();await browser?.close();}}
run().then(()=>console.log('Internal structure: 4 native interfaces, capability matrix and 4 navigation probes passed.')).catch(e=>{console.error(e);process.exitCode=1;});
