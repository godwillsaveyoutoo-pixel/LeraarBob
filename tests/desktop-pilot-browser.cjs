/* Actual native pilot apps inside /os/. Guest/local storage fixture; external requests blocked.
 * This proves browser interaction and shell integration, not production account/session writes.
 * Run: NODE_PATH=/tmp/leraarbob-os-deps/node_modules node tests/desktop-pilot-browser.cjs
 */
'use strict';
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const Glass=require('../games/rechten/rechtenwereld/glasatelier/core.js');
const root=path.resolve(__dirname,'..'),out=process.env.OS_SCREENSHOTS||path.join(root,'os/qa');
const authMock=`window.AxiomaAuth={CLASSES:['TEST'],ready:async()=>({session:null,account:null}),getAccount:async()=>null,getSession:async()=>null,getSnapshot:()=>({status:'guest',account:null,session:null}),client:()=>null,configured:()=>true,onChange:()=>()=>{},onStateChange:()=>()=>{}};`;
const server=http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
 const segments=pathname.split('/').filter(Boolean),allowedRoots=new Set(['os','assets','css','js','shared','games','lessons','klasbattle','teacher','oefenbladen']);
 const allowedFiles=new Set(['index.html','games.json']);
 if(segments.some(s=>s.startsWith('.')||s==='..')||!(allowedRoots.has(segments[0])||segments.length===1&&allowedFiles.has(segments[0]))){res.writeHead(403);return res.end();}
 let file=path.resolve(root,'.'+pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 if(!pathname.endsWith('/')&&!new Set(['.html','.js','.css','.svg','.webp','.json','.ttf','.png','.jpg','.jpeg','.woff','.woff2','.ico','.mp3','.wav']).has(path.extname(file))){try{if(!fs.statSync(file).isDirectory()){res.writeHead(403);return res.end();}}catch{res.writeHead(404);return res.end();}}
 try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',{'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.json':'application/json','.ttf':'font/ttf','.png':'image/png'}[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}
});
const report={scope:'Real Chromium UI in localhost /os/ with guest auth fixture; no production account or remote session writes',viewport:{width:1366,height:768,deviceScaleFactor:1,zoom:1},checks:[],layout:[],integrationIssues:[],blocked:[],errors:[],missing:[],passed:false};
let page,browser,base;
function check(name,detail){report.checks.push({name,...(detail?{detail}:{} )});console.log('PASS '+name);}
async function settle(){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function settleNativeLayout(frame,selectors){
 const size=await (await frame.frameElement()).evaluate(e=>({width:e.clientWidth,height:e.clientHeight}));
 await frame.waitForFunction(size=>innerWidth===size.width&&innerHeight===size.height&&document.fonts.status==='loaded',size,{timeout:5000});
 // Parent animation frames do not flush a resized child document's container
 // queries. Measure only after its own viewport and selected rects settle.
 await frame.evaluate(async selectors=>{
  await document.fonts.ready;let previous,stable=0;const start=performance.now();
  while(stable<3){
   await new Promise(resolve=>requestAnimationFrame(resolve));
   const current=JSON.stringify([innerWidth,innerHeight,...selectors.map(selector=>document.querySelector(selector)?.getBoundingClientRect().toJSON())]);
   stable=current===previous?stable+1:0;previous=current;
   if(performance.now()-start>5000)throw Error('Native layout did not settle within 5 seconds');
  }
 },selectors);
}
async function shot(name){await settle();await page.screenshot({path:path.join(out,name+'.png')});}
async function currentFrame(){const h=await page.locator('.frame-wrapper:not([hidden]) iframe').elementHandle();return h.contentFrame();}
async function desktopState(){return page.evaluate(()=>LeraarBobDesktop.state());}
async function openFromMap(id,title,theme,type,query){
 await page.locator('.desktop-button').click();await page.locator('#themeFolders .theme-folder').filter({hasText:theme}).click();
 await page.locator('#typeFilters').getByRole('button',{name:type,exact:true}).click();await page.locator('#librarySearch').fill(query);
 const origin=(await desktopState()).view;await page.locator(`[data-app-id="${id}"] .card-open`).click();
 const frame=await currentFrame();await frame.waitForLoadState();await frame.waitForFunction(()=>document.fonts.status==='loaded');await settle();
 assert.equal(await frame.locator('leraarbob-topbar').count(),0,'Only desktop owns shared platform chrome');return {frame,origin,title,id};
}
async function retain(pilot,snapshot,focusSelector){
 const node=await page.locator('.frame-wrapper:not([hidden]) iframe').elementHandle();
 if(focusSelector)await pilot.frame.locator(focusSelector).focus();
 await page.locator('#saveActivity').click();assert(await page.locator('#toast').isVisible());
 await page.locator('#appBack').click();assert.deepEqual((await desktopState()).view,pilot.origin);
 assert.equal(await page.locator('#librarySearch').inputValue(),pilot.origin.query);
 await page.getByRole('button',{name:'Terug naar '+pilot.title,exact:true}).click();
 assert(await node.evaluate(e=>e.isConnected));assert.deepEqual(await snapshot(),pilot.before,'Return preserves native state');
 if(focusSelector&&!await pilot.frame.locator(focusSelector).evaluate(e=>e.ownerDocument.activeElement===e))report.integrationIssues.push(pilot.title+' return does not restore native focus '+focusSelector);
 await page.locator('#minimizeApp').click();assert.equal((await desktopState()).view.kind,'desktop');
 await page.getByRole('button',{name:'Terug naar '+pilot.title,exact:true}).click();
 assert(await node.evaluate(e=>e.isConnected));assert.deepEqual(await snapshot(),pilot.before,'Minimize/resume preserves native state');
 if(focusSelector&&!await pilot.frame.locator(focusSelector).evaluate(e=>e.ownerDocument.activeElement===e))report.integrationIssues.push(pilot.title+' taskbar does not restore native focus '+focusSelector);
 await page.locator('.desktop-button').click();await page.locator('#pinnedApps .pinned-app').filter({hasText:pilot.title}).click();
 await page.locator('#appBack').click();assert.deepEqual((await desktopState()).view,pilot.origin,'Pinned resume retains app own return place');
 await page.getByRole('button',{name:'Terug naar '+pilot.title,exact:true}).click();
 check(pilot.title+' own map/filter/query; save; same iframe and native state after back/minimize/resume');
}
async function startAndFocus(frame,selector){
 const input=frame.locator(selector);await input.focus();await page.keyboard.press('Control+k');
 assert(await page.locator('#startPanel').isVisible());assert.equal(await page.locator('#startButton').getAttribute('aria-expanded'),'true');
 assert(await page.locator('#startSearch').evaluate(e=>document.activeElement===e));
 await page.keyboard.press('Escape');assert(!(await page.locator('#startPanel').isVisible()));assert(await input.evaluate(e=>document.activeElement===e));
 check('Start Ctrl K / Escape restores native focus: '+selector);
}
async function layout(name,frame,selectors){
 await settle();if(frame)await settleNativeLayout(frame,selectors);const shell=await page.evaluate(()=>{
  const issues=[],bar=document.querySelector('leraarbob-topbar'),shadow=bar.shadowRoot;
  const startOpen=!document.querySelector('#startPanel').hidden,controls=startOpen?[...document.querySelectorAll('#startPanel button,#startPanel input')]:[...shadow.querySelectorAll('.row button,.row a'),...document.querySelectorAll('.app-toolbar button,.app-toolbar a,.lb-restore:not([hidden])')];
  for(const e of controls){
   if(!e.getClientRects().length||getComputedStyle(e).display==='none')continue;const r=e.getBoundingClientRect();
   if(startOpen&&e.closest('#startResults')){const viewport=document.querySelector('#startResults').getBoundingClientRect();if(r.top<viewport.top-.5||r.bottom>viewport.bottom+.5)continue;}
   if(r.x<-.5||r.right>innerWidth+.5||r.top<-.5||r.bottom>innerHeight+.5)issues.push('outside '+(e.id||e.className));
   if(r.width<43.5||r.height<43.5)issues.push('small '+(e.id||e.className)+' '+r.width+'×'+r.height);
   const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(hit!==bar&&!e.contains(hit))issues.push('covered '+(e.id||e.className));
  }
  if(document.documentElement.scrollWidth>innerWidth+1)issues.push('horizontal document overflow');
  return {issues,frame:document.querySelector('.frame-wrapper:not([hidden]) iframe')?.getBoundingClientRect().toJSON(),collapsed:document.body.classList.contains('topbar-collapsed')};
 });
 const native=frame?await frame.evaluate(selectors=>{
  const issues=[],rects=[];for(const selector of selectors){const e=document.querySelector(selector);if(!e||!e.getClientRects().length)continue;const r=e.getBoundingClientRect();rects.push({selector,rect:r.toJSON()});
   if(r.x<-.5||r.right>innerWidth+.5||r.top<-.5||r.bottom>innerHeight+.5)issues.push('outside '+selector);
   const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(hit&&!e.contains(hit)&&!hit.contains(e))issues.push('covered '+selector+' by '+(hit.id||hit.className));
  }
  return {issues,rects,width:innerWidth,height:innerHeight,rotateGate:!!document.querySelector('#rotateGate')&&getComputedStyle(document.querySelector('#rotateGate')).display!=='none'};
 },selectors):null;
 report.layout.push({name,shell,native});await shot(name);
}
async function fold(name,frame,selectors,snapshot){
 const before=await snapshot(),height=await page.locator('.frame-wrapper:not([hidden]) iframe').evaluate(e=>e.getBoundingClientRect().height);
 await page.locator('leraarbob-topbar .collapse').click();assert.equal(await page.locator('.lb-restore').getAttribute('aria-expanded'),'false');
 const restore=await page.locator('.lb-restore').boundingBox();assert(restore.width>=44&&restore.height>=44);await layout(name+'-collapsed',frame,selectors);
 assert((await page.locator('.frame-wrapper:not([hidden]) iframe').evaluate(e=>e.getBoundingClientRect().height))>height);
 assert.deepEqual(await snapshot(),before,'Collapsing does not reset native work');await page.locator('.lb-restore').click();assert.equal(await page.locator('leraarbob-topbar .collapse').getAttribute('aria-expanded'),'true');
 assert.deepEqual(await snapshot(),before);check(name+' fold/reopen 44 px restore, more app height, native state retained');
}
async function boardPoint(frame,selector,x,y){return frame.locator(selector).evaluate((svg,p)=>{const q=new DOMPoint(Number(svg.dataset.cx)+p.x*Number(svg.dataset.unit),Number(svg.dataset.cy)-p.y*Number(svg.dataset.unit)).matrixTransform(svg.getScreenCTM());return {x:q.x,y:q.y};},{x,y});}
async function frameMouse(frame,point){const iframe=await frame.frameElement(),r=await iframe.boundingBox();await page.mouse.click(r.x+point.x,r.y+point.y);}
async function glassPlot(frame,p){await frameMouse(frame,await boardPoint(frame,'#glass-board',p.x,p.y));}
async function pythagoras(){
 const p=await openFromMap('pythagoras','Pythagoras','Pythagoras & lengtes','Les','Pyth'),f=p.frame;
 await f.waitForFunction(()=>window.Pythagoras?.snapshot().phase===1&&!Pythagoras.snapshot().locked);
 for(const n of [3,4,5]){await f.locator('#square'+n).click();await f.waitForFunction(n=>Pythagoras.snapshot().phase===({3:2,4:3,5:4})[n]&&!Pythagoras.snapshot().locked,n);}
 // One genuine pointer drag followed by the app's original tap/tap alternative.
 const source=await f.locator('#square3').boundingBox(),target=await f.locator('[data-slot="3"]').boundingBox();
 await page.mouse.move(source.x+source.width/2,source.y+source.height/2);await page.mouse.down();await page.mouse.move(target.x+target.width/2,target.y+target.height/2,{steps:12});await page.mouse.up();
 await f.waitForFunction(()=>Pythagoras.snapshot().placed.includes('3'));
 for(const n of [4,5]){await f.locator('#square'+n).click();await f.locator(`[data-slot="${n}"]`).click();}
 await f.waitForFunction(()=>Pythagoras.snapshot().phase===5&&!Pythagoras.snapshot().locked);await f.locator('#numberTile').click();await f.locator('[data-slot="numeric"]').click();
 await f.waitForFunction(()=>Pythagoras.snapshot().phase===9,null,{timeout:15000});await f.locator('#nextLevel').click();
 // The original click handler records completion in setTimeout(0). Wait for
 // that account progress before navigating again, so it sees level 1 -> 2.
 await f.waitForFunction(()=>AxiomaGame.state.completed.length===1&&AxiomaGame.state.completed.includes('1'),null,{timeout:5000});
 await f.locator('#level3 .levelJump').selectOption('5');await f.locator('#lfHypHit').click();await f.locator('[data-formula-tile="a"]').click();await f.locator('[data-formula-slot="0"]').click();
 const snap=()=>f.evaluate(()=>({level:[...document.querySelectorAll('.levelJump')].find(e=>!e.closest('[hidden]'))?.value,slots:[...document.querySelectorAll('[data-formula-slot]')].map(e=>e.textContent),completed:AxiomaGame.state.completed}));
 assert.equal((await snap()).completed.length,1);assert.equal(await page.locator('leraarbob-topbar .progress-value').textContent(),'1/10 levels');
 p.before=await snap();await startAndFocus(f,'[data-formula-tile="b"]');await retain(p,snap,'[data-formula-tile="b"]');await layout('pythagoras-expanded',f,['#lfPrompt','[data-formula-slot="0"]','[data-formula-tile="b"]','#lfAction']);await fold('pythagoras',f,['[data-formula-slot="0"]','[data-formula-tile="b"]','#lfAction'],snap);
 check('Pythagoras native reveal, genuine drag, numeric tile, next level, partial formula and real completed level');return p;
}
async function rechtenwereld(){
 const p=await openFromMap('rechtenwereld','Rechtenwereld','Rechten & functies','Trainer','Rechtenwereld'),f=p.frame;
 await f.waitForSelector('#app[data-ready="true"]');await f.locator('[data-world-node="puntenbaai"]').click();await f.locator('[data-node="point"]').click();
 await f.locator('#hint').click();const m=await f.evaluate(()=>{const s=RechtenV2App.snapshot();return s.missions[s.active];});
 const correct=m.task.options.findIndex(q=>JSON.stringify(q.x)===JSON.stringify(m.task.target.x)&&JSON.stringify(q.y)===JSON.stringify(m.task.target.y));assert(correct>=0);
 await f.locator(`[data-choice="answer"][data-value="${correct}"]`).click();await f.locator('#commit').click();
 await f.locator('#flow-pause').click();assert(await f.locator('#feedback').textContent());
 const snap=()=>f.evaluate(()=>{const s=RechtenV2App.snapshot();return {active:s.active,mission:s.missions[s.active],events:s.events};});
 p.before=await snap();assert(p.before.mission.feedback.result.ok);assert.equal(p.before.events.length,1);await retain(p,snap,'#continue');await layout('rechtenwereld-expanded',f,['.point-prompt','.boundary-workspace','#continue','#feedback']);await fold('rechtenwereld',f,['.point-prompt','#continue','#feedback'],snap);
 const xp=await f.locator('[data-platform-progress="xp"]').getAttribute('data-value');assert.equal(await page.locator('leraarbob-topbar .progress-value').textContent(),xp+' XP');check('Rechtenwereld uses its actual native XP without conversion');
 await f.locator('#continue').click();assert.equal((await snap()).mission.index,1);check('Rechtenwereld native world/stop, hint, correct answer, single recorded attempt and explicit next task');return p;
}
async function zeeslag(){
 const p=await openFromMap('rechten-zeeslag','Rechten Zeeslag','Rechten & functies','Spel','Zeeslag'),f=p.frame;
 if(await f.locator('#gateScreen.active').isVisible())await f.locator('#demoBtn').click();
 await f.waitForSelector('#gameScreen.active');
 // Actual placement clicks use the game's generated legal blue endpoints.
 for(const start of [{x:-4,y:-4},{x:-4,y:-2},{x:-4,y:1}]){
  const q=await f.locator('#ownBoard').evaluate((svg,p)=>{const q=new DOMPoint(48+(p.x+4)*53,48+(4-p.y)*53).matrixTransform(svg.getScreenCTM());return {x:q.x,y:q.y};},start);await frameMouse(f,q);
  const end=await f.locator('#ownBoard .candidate').first().evaluate(e=>{const q=new DOMPoint(+e.getAttribute('cx'),+e.getAttribute('cy')).matrixTransform(e.ownerSVGElement.getScreenCTM());return {x:q.x,y:q.y};});await frameMouse(f,end);
 }
 await f.locator('#readyBtn').click();await f.locator('#fireBtn').waitFor({state:'visible'});await f.locator('#aUpBtn').click();await f.locator('#bUpBtn').click();
 await f.locator('#fireBtn').click();await f.waitForFunction(()=>document.querySelector('#myHistory').textContent.includes('y ='));
 const snap=()=>f.evaluate(()=>({fleet:document.querySelector('#fleetCount').textContent,shots:[...document.querySelectorAll('#myHistory .historyShot')].map(e=>e.textContent.split(' ·')[0]),ships:[...document.querySelectorAll('#ownBoard [data-ship]')].map(e=>({name:e.dataset.ship,points:[...e.querySelectorAll('.shipNode')].map(p=>[p.getAttribute('cx'),p.getAttribute('cy')])}))}));
 // Online timers intentionally keep running; compare the actual own fleet and recorded shot.
 p.before=await snap();await retain(p,snap);await layout('zeeslag-expanded',f,['#attackBoard','#aUpBtn','#fireBtn','#turnPill']);await fold('zeeslag',f,['#attackBoard','#aUpBtn','#fireBtn'],snap);
 check('Rechten Zeeslag original fleet placement, aim controls and real fired shot; live timer remains native');return p;
}
async function glasraam(){
 const p=await openFromMap('glasraam','Glasraam','Rechten & functies','Atelier','Glas'),f=p.frame,key='leraarbob-glasatelier-draft-v1';
 await f.waitForFunction(()=>Number(document.querySelector('#glass-board').dataset.unit)>0);
 await f.locator('#more-open').click();await f.locator('#hint').click();await f.locator('[data-close="options-dialog"]').click();await glassPlot(f,{x:0,y:0});await glassPlot(f,{x:2,y:0});await f.locator('#check').click();assert(await f.locator('.point-dot.wrong').count());
 await glassPlot(f,{x:2,y:0});await glassPlot(f,{x:2,y:2});await f.locator('#check').click();
 const pattern=Glass.PATTERNS.find(p=>p.id==='zonneroos');for(const l of pattern.lines.slice(1)){
  const points=[];for(let x=-4;x<=4&&points.length<2;x++)for(let y=-4;y<=4&&points.length<2;y++)if(Math.abs(Glass.signed(l,{x,y}))<1e-9)points.push({x,y});
  await glassPlot(f,points[0]);await glassPlot(f,points[1]);await f.locator('#check').click();
 }
 assert((await f.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)).drafts.zonneroos.done);
 await f.locator('[data-color="3"]').click();await f.locator('[data-cell][role="button"]').first().focus();await page.keyboard.press('Enter');
 const snap=()=>f.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);p.before=await snap();assert(Object.keys(p.before.drafts.zonneroos.colors).length);
 await retain(p,snap,'#gallery-open');assert.equal(await page.locator('leraarbob-topbar .progress-value').textContent(),'1/8 ramen');
 const originalTheme=await f.evaluate(()=>document.documentElement.dataset.mode);await page.locator('leraarbob-topbar .theme-toggle').click();assert.notEqual(await f.evaluate(()=>document.documentElement.dataset.mode),originalTheme);await page.locator('leraarbob-topbar .theme-toggle').click();assert.equal(await f.evaluate(()=>document.documentElement.dataset.mode),originalTheme);assert.deepEqual(await snap(),p.before);check('Shared display button calls original Glasraam theme handler without changing drawing');
 await layout('glasraam-expanded',f,['#glass-board','#check','.task','.palette-panel','.work-panel']);await fold('glasraam',f,['#glass-board','#check','.task','.palette-panel'],snap);
 await f.locator('#gallery-open').click();await f.locator('#design-mode').click();await f.locator('#more-open').click();await f.locator('#formula-open').click();await f.locator('#slope').fill('1/');
 await startAndFocus(f,'#slope');assert.equal(await f.locator('#slope').inputValue(),'1/');
 await f.locator('[data-close="formula-dialog"]').click();
 check('Glasraam wrong point, repair, complete original window, color via keyboard, native 1/8 ramen and incomplete input focus');return p;
}
async function onlineEntryFixture(){
 const previousPage=page,account={id:'fixture-a',role:'student',alias:'Pilot leerling',class_code:'TEST'},peer={id:'fixture-b',role:'student',alias:'Pilot tegenstander',class_code:'TEST'};
 const context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1,reducedMotion:'reduce'});page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>report.errors.push(e.message));
 const auth=`const a=${JSON.stringify(account)};window.AxiomaAuth={CLASSES:['TEST'],ready:async()=>({account:a,session:{user:{id:a.id}}}),getAccount:async()=>a,getSession:async()=>({user:{id:a.id}}),getSnapshot:()=>({status:'signed-in',account:a,session:{user:{id:a.id}}}),client:()=>({}),configured:()=>true,onChange:()=>()=>{},onStateChange:()=>()=>{}};`;
 const progress=`window.AxiomaProgress={loadOverview:async()=>({accountId:${JSON.stringify(account.id)},games:[],trainer:null,numbers:null,errors:{games:false,trainer:false,numbers:false}})};`;
 const social=`(()=>{const account=${JSON.stringify(account)},peer=${JSON.stringify(peer)},listeners=[],state={account,connected:true,players:[{...account,status:'available'},{...peer,status:'available'}],invitations:[]};window.AxiomaSocial={ready:async()=>state,state:()=>state,onChange:fn=>{listeners.push(fn);return()=>{};},invite:async id=>{state.invitations=[{id:'fixture-invite',sender_id:account.id,recipient_id:id,status:'pending'}];listeners.forEach(fn=>fn(state));},finish:async()=>{}};})();`;
 await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.fulfill({body:''});const file=u.pathname.split('/').pop();if(file==='axioma-auth.js')return r.fulfill({body:auth,contentType:'application/javascript'});if(file==='axioma-progress.js')return r.fulfill({body:progress,contentType:'application/javascript'});if(file==='axioma-social.js')return r.fulfill({body:social,contentType:'application/javascript'});return r.continue();});
 try{
  await page.goto(base+'/os/');await page.waitForFunction(()=>window.LeraarBobDesktop?.state().role==='student');await page.locator('#themeFolders .theme-folder').filter({hasText:'Rechten & functies'}).click();await page.locator('#librarySearch').fill('Zeeslag');await page.locator('[data-app-id="rechten-zeeslag"] .card-options').click();
  assert.equal(await page.locator('#modeOptions [data-mode="classroom"]').count(),0);assert(await page.locator('#modeOptions [data-mode="online"]').isVisible());await page.locator('#modeOptions [data-mode="online"]').click();const f=await currentFrame();await f.waitForSelector('#lobbyScreen.active');assert(!new URL(f.url()).searchParams.has('solo'));
  assert.match(await f.locator('#playerList').textContent(),/Pilot tegenstander/);await f.locator('[data-invite="fixture-b"]').click();assert.equal(await f.locator('[data-invite="fixture-b"]').textContent(),'Wachten…');
  const native=await page.locator('.frame-wrapper:not([hidden]) iframe').elementHandle(),list=await f.locator('#playerList').innerHTML();await page.locator('#minimizeApp').click();await page.getByRole('button',{name:'Terug naar Rechten Zeeslag',exact:true}).click();assert(await native.evaluate(e=>e.isConnected));assert.equal(await f.locator('#playerList').innerHTML(),list);await shot('zeeslag-online-fixture');
  check('Student online option reaches original Zeeslag lobby, native invitation and same pending lobby after resume',{provider:'Isolated AxiomaSocial fixture; no remote player or invitation'});
 }finally{await context.close();page=previousPage;}
}
async function shellUI(){
 await page.locator('.desktop-button').click();await page.locator('#startButton').click();await page.locator('#startSearch').fill('Glasraam');const glass=page.locator('#startResults .start-result').filter({has:page.locator('strong').filter({hasText:/^Glasraam$/})});assert.equal(await glass.count(),1);await glass.click();const f=await currentFrame();await f.waitForFunction(()=>Number(document.querySelector('#glass-board')?.dataset.unit)>0);const node=await page.locator('.frame-wrapper:not([hidden]) iframe').elementHandle(),draft=await f.evaluate(()=>localStorage.getItem('leraarbob-glasatelier-draft-v1'));
 check('Actual Start button, search and result open native Glasraam');
 await page.locator('.taskbar-right [data-view="profile"]').click();assert.equal(await page.locator('#windowTitle').textContent(),'Mijn profiel');assert.match(await page.locator('#viewContent').textContent(),/gast/i);await shot('desktop-profile');
 await page.locator('.taskbar-right [data-view="settings"]').click();assert.equal(await page.locator('#windowTitle').textContent(),'Instellingen');const background=await page.getByRole('combobox',{name:'Achtergrond'}).inputValue();await page.getByRole('combobox',{name:'Achtergrond'}).selectOption(background==='coast'?'quiet':'coast');assert.notEqual(await page.locator('body').getAttribute('data-wallpaper'),background);await page.getByRole('combobox',{name:'Achtergrond'}).selectOption(background);
 const mode=await page.locator('html').getAttribute('data-mode');await page.locator('#viewContent').getByRole('button',{name:/^(Donkere|Lichte) vensters$/}).click();assert.notEqual(await page.locator('html').getAttribute('data-mode'),mode);await shot('desktop-settings');await page.locator('#viewContent').getByRole('button',{name:/^(Donkere|Lichte) vensters$/}).click();assert.equal(await page.locator('html').getAttribute('data-mode'),mode);
 await page.getByRole('button',{name:'Terug naar Glasraam',exact:true}).click();assert(await node.evaluate(e=>e.isConnected));assert.equal(await f.evaluate(()=>localStorage.getItem('leraarbob-glasatelier-draft-v1')),draft);check('Actual profile/settings, wallpaper/display changes and return retain native iframe/drawing');
 await page.locator('leraarbob-topbar .fullscreen').click();await page.waitForFunction(()=>!!document.fullscreenElement);await page.evaluate(()=>document.exitFullscreen());assert(await node.evaluate(e=>e.isConnected));check('Direct shared fullscreen works and retains native iframe');
 await page.locator('#startButton').click();await page.locator('#startSearch').fill('Pythagoras');await page.locator('#startResults .start-result').filter({has:page.locator('strong').filter({hasText:/^Pythagoras$/})}).click();assert.equal((await desktopState()).activeKey,'pythagoras|solo|');await page.locator('#appBack').click();assert.equal((await desktopState()).view.themeId,'pythagoras');check('Actual Start search from an open app opens another app with its own theme');
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Terug naar Glasraam',exact:true}).click();await page.waitForFunction(()=>document.querySelector('leraarbob-topbar').shadowRoot.querySelector('.mobile-title').textContent==='Glasraam');check('Compact platform title follows actual active app');await page.locator('#startButton').click();await layout('desktop-start-390',null,[]);await page.keyboard.press('Escape');await page.setViewportSize({width:1366,height:768});
}
async function nativeNavigationUI(){
 const p=await openFromMap('pythagoras','Pythagoras','Pythagoras & lengtes','Les','Pyth'),f=p.frame;p.origin=(await desktopState()).view;await f.waitForFunction(()=>!!window.PythagorasGoLevel);await f.locator('.levelJump:visible').selectOption('5');await f.locator('#lfHypHit').click();await f.locator('[data-formula-tile="a"]').click();await f.locator('[data-formula-slot="0"]').click();const node=await page.locator('.frame-wrapper:not([hidden]) iframe').elementHandle(),before=await f.locator('[data-formula-slot="0"]').textContent();
 await f.locator('#levelFormula .axioma-platform-home').click();await page.locator('#libraryWindow').waitFor({state:'visible'});assert.deepEqual((await desktopState()).view,p.origin);await page.getByRole('button',{name:'Terug naar Pythagoras',exact:true}).click();assert(await node.evaluate(e=>e.isConnected));assert.equal(await f.locator('[data-formula-slot="0"]').textContent(),before);check('Original Pythagoras leraarBob brand returns to own map and resumes same formula/iframe');
 const r=await openFromMap('rechtenwereld','Rechtenwereld','Rechten & functies','Trainer','Rechtenwereld'),trainer=r.frame;await trainer.waitForSelector('#app[data-ready="true"]');await trainer.locator('.atlas-actions [data-screen="profile"]').click();await trainer.locator('.account-link').waitFor({state:'visible'});const native=await page.locator('.frame-wrapper:not([hidden]) iframe').elementHandle(),profile=await trainer.evaluate(()=>RechtenV2App.snapshot());await trainer.locator('.account-link').click();await page.locator('#authOverlay').waitFor({state:'visible'});assert.equal((await desktopState()).activeKey,'rechtenwereld|solo|');assert(await native.evaluate(e=>e.isConnected));await shot('native-trainer-account');await page.keyboard.press('Escape');assert.deepEqual(await trainer.evaluate(()=>RechtenV2App.snapshot()),profile);check('Original Rechtenwereld profile sign-in opens central account and retains native screen/state');
 await page.locator('.desktop-button').click();await page.locator('#homeView [data-view="live"]').click();await page.locator('#viewContent').getByRole('button',{name:'Live les',exact:true}).click();const lesson=await currentFrame(),lessonNode=await page.locator('.frame-wrapper:not([hidden]) iframe').elementHandle();
 // The native guest form is intentionally hidden. Its supported deep link prefills
 // a pending code without changing account state or making hidden controls visible.
 const invite=new URL(lesson.url());invite.searchParams.set('code','A1B2C3');await lesson.goto(invite.href);await lesson.waitForFunction(()=>document.querySelector('#joinCode')?.value==='A1B2C3'&&typeof document.querySelector('#joinForm')?.onsubmit==='function');await lesson.locator('#signIn').waitFor({state:'visible'});assert(!(await lesson.locator('#joinForm').isVisible()));
 const lessonKey=(await desktopState()).activeKey,codeNode=await lesson.locator('#joinCode').elementHandle(),submitHandler=await lesson.evaluateHandle(()=>document.querySelector('#joinForm').onsubmit);
 await lesson.locator('#signIn').click();await page.locator('#authOverlay').waitFor({state:'visible'});assert.equal((await desktopState()).activeKey,lessonKey);assert(await lessonNode.evaluate(e=>e.isConnected));assert(await codeNode.evaluate(e=>e.isConnected&&e.value==='A1B2C3'));assert(await lesson.evaluate(handler=>document.querySelector('#joinForm').onsubmit===handler,submitHandler));assert(await lesson.locator('#authOverlay').evaluate(e=>!e.open&&e.hidden),'Native account dialog must stay closed');await shot('native-live-account');
 await page.keyboard.press('Escape');assert(!(await page.locator('#authOverlay').isVisible()));assert(await codeNode.evaluate(e=>e.isConnected&&e.value==='A1B2C3'));assert(await lesson.evaluate(handler=>document.querySelector('#joinForm').onsubmit===handler,submitHandler));check('Original guest live-lesson sign-in opens only central account and retains code/input/submit handler',{provider:'Guest auth fixture; pending code initialized through native ?code=A1B2C3 deep link'});
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;fs.mkdirSync(out,{recursive:true});
 const executablePath=process.env.CHROMIUM_PATH||process.env.LB_CHROMIUM||(fs.existsSync('/opt/brave.com/brave/brave')?'/opt/brave.com/brave/brave':undefined);
 browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:report.viewport,deviceScaleFactor:1,reducedMotion:'reduce'});page=await context.newPage();page.setDefaultTimeout(20000);
 page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()===404)report.missing.push(r.url());});
 await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.fulfill({body:''});if(u.pathname.endsWith('/axioma-auth.js'))return r.fulfill({body:authMock,contentType:'application/javascript'});return r.continue();});
 page.on('dialog',d=>d.type()==='beforeunload'?d.accept():d.dismiss());await page.goto(base+'/os/');await page.waitForFunction(()=>window.LeraarBobDesktop&&document.querySelector('leraarbob-topbar')?.shadowRoot);await layout(process.env.OS_SHELL_ONLY?'desktop-shell-expanded':'desktop-expanded',null,[]);
 if(process.env.OS_SHELL_ONLY){await shellUI();assert.deepEqual(report.errors,[]);assert.deepEqual(report.missing,[]);assert.deepEqual(report.layout.flatMap(r=>r.shell.issues),[]);report.passed=true;return;}
 if(process.env.OS_NAV_ONLY){await nativeNavigationUI();assert.deepEqual(report.errors,[]);assert.deepEqual(report.missing,[]);report.passed=true;return;}
 const pilots=[await pythagoras(),await rechtenwereld(),await zeeslag(),await glasraam()];
 // Switching to each still-open iframe must restore its own original folder.
 for(const p of pilots){await page.getByRole('button',{name:'Terug naar '+p.title,exact:true}).click();await page.locator('#appBack').click();assert.deepEqual((await desktopState()).view,p.origin);}
 check('Four independent return locations survive cross-app taskbar switches');
 await page.locator('.desktop-button').click();await page.locator('#homeView [data-view="saved"]').click();assert.equal(await page.locator('.saved-row').count(),4);
 await page.locator('.saved-row').filter({hasText:'Pythagoras'}).getByRole('button',{name:'Openen',exact:true}).click();await page.locator('#appBack').click();assert.equal((await desktopState()).view.kind,'saved');check('Saved entry opens real app and returns to Mijn taken');
 for(const p of pilots){await page.getByRole('button',{name:'Terug naar '+p.title,exact:true}).click();await page.setViewportSize({width:390,height:844});await page.waitForFunction(title=>document.querySelector('leraarbob-topbar').shadowRoot.querySelector('.mobile-title').textContent===title,p.title);const f=await currentFrame(),selectors=p.id==='glasraam'?['#glass-board','#check','.task']:p.id==='pythagoras'?['[data-formula-slot="0"]','[data-formula-tile="b"]']:p.id==='rechtenwereld'?['#rotateGate']:['#attackBoard','#fireBtn'];await layout(p.id+'-390-expanded',f,selectors);
  if(p.id==='rechtenwereld')report.blocked.push({name:'Native Rechtenwereld compact practice',detail:'The original trainer shows its retained rotate/minimum-workspace guidance at 390 px; the exercise is preserved. Full trainer interaction was performed at 1366×768.'});
  if(p.id==='rechten-zeeslag'){
   await f.locator('#fireBtn:not([disabled])').waitFor({state:'visible'});const before=await f.locator('#myHistory .historyShot').count();await f.locator('#bUpBtn').click();await page.locator('#saveActivity').click();assert(await page.locator('#toast').isVisible());await f.locator('#fireBtn').click();await f.waitForFunction(n=>document.querySelectorAll('#myHistory .historyShot').length>n,before);check('Compact Zeeslag VUUR is actually clickable while save toast is visible');
  }
  await page.locator('leraarbob-topbar .collapse').click();await layout(p.id+'-390-collapsed',f,selectors);await page.locator('.lb-restore').click();
  if(['rechten-zeeslag','glasraam'].includes(p.id)){await page.setViewportSize({width:844,height:390});await layout(p.id+'-844-landscape-expanded',f,selectors);await page.locator('leraarbob-topbar .collapse').click();await layout(p.id+'-844-landscape-collapsed',f,selectors);await page.locator('.lb-restore').click();}
  await page.setViewportSize({width:1366,height:768});
 }
 check('All four native apps inspected expanded/collapsed/reopened at 390×844');
 await page.locator('leraarbob-topbar .account').click();await page.locator('#authOverlay').waitFor({state:'visible'});await shot('account-central');await page.keyboard.press('Escape');check('Central account dialog remains accessible from native app');
 await page.locator('leraarbob-topbar .collapse').click();await page.reload();await page.waitForFunction(()=>window.LeraarBobDesktop&&document.querySelector('.lb-restore')&&!document.querySelector('.lb-restore').hidden);await layout('desktop-collapsed-after-reload',null,[]);await page.locator('.lb-restore').click();
 check('Explicit collapsed preference survives desktop reload and restore');
 await page.locator('.desktop-button').click();await page.locator('#homeView [data-view="saved"]').click();assert.equal(await page.locator('.saved-row').count(),4);check('Four saved native shortcuts persist after browser reload');
 await onlineEntryFixture();
 await shellUI();
 await nativeNavigationUI();
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.missing,[]);assert.deepEqual(report.integrationIssues,[]);
 const issues=report.layout.filter(r=>r.shell.issues.length||r.native?.issues.length);if(issues.length){report.blocked.push({name:'Browser layout defects',detail:issues.map(r=>({name:r.name,shell:r.shell.issues,native:r.native?.issues}))});throw Error('Pilot interactions passed; '+issues.length+' layouts need fixes. See pilot-browser-report.json');}
 report.passed=true;
 console.log('PASS actual four native pilot apps in /os/; '+report.checks.length+' checks; screenshots '+out);
})().catch(async e=>{report.failure=e.stack;if(page)try{await shot('pilot-failure');}catch{}console.error(e);process.exitCode=1;}).finally(async()=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,process.env.OS_NAV_ONLY?'pilot-native-navigation-report.json':process.env.OS_SHELL_ONLY?'pilot-shell-browser-report.json':'pilot-browser-report.json'),JSON.stringify(report,null,2));if(browser)await browser.close();await new Promise(r=>server.close(r));});
