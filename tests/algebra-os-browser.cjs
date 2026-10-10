'use strict';
// Native Algebra UI inside the desktop and standalone. Authentication and remote
// progress are isolated fixtures; every exercise/menu/input action is real UI.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright'),{solveTask}=require('./algebra-journey-controls.cjs');
const root=path.resolve(__dirname,'..'),out=process.env.ALGEBRA_OS_SCREENSHOTS||'/tmp/leraarbob-algebra-navigation-qa';
const host=require('../scripts/serve-os-preview.cjs').createServer();
const report={scope:'Real native Algebra browser interactions with isolated guest/teacher/student auth and local progress fixtures; no production account, progress or session writes',viewports:[{width:1366,height:768},{width:390,height:844},{width:640,height:360}],deviceScaleFactor:1,zoom:1,checks:[],layout:[],screenshots:[],errors:[],missing:[],progressCalls:[],remoteBlocked:[],passed:false};
let base,browser,page,context,phase='boot';const progress=new Map();
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
function check(name,detail){report.checks.push({name,...(detail?{detail}:{})});console.log('PASS '+name);}
async function shot(name){await page.screenshot({path:path.join(out,name+'.png')});report.screenshots.push(name+'.png');}
async function settle(frame){await (frame||page).evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});}
async function frame(){return(await page.locator('#appFrames .frame-wrapper:not([hidden]) iframe').elementHandle()).contentFrame();}
const state=()=>page.evaluate(()=>LeraarBobDesktop.state());
async function install(target,role='guest'){
 await target.addInitScript(role=>{if(localStorage.getItem('qa-algebra-role')===null)localStorage.setItem('qa-algebra-role',role);},role);
 await target.exposeFunction('__algebraProgressFixture',async(action,game,record,revision,id)=>{
  const key=id+':'+game,old=progress.get(key);report.progressCalls.push({action,game,id});
  if(action==='load')return old||null;
  const next={gameId:game,state:record,revision:(old?.revision||0)+1};progress.set(key,next);return{status:'saved',...next};
 });
 await target.route('**/*',route=>{
  const url=new URL(route.request().url());if(url.origin!==base&&!['blob:','data:','about:'].includes(url.protocol)){report.remoteBlocked.push({url:url.href,method:route.request().method()});return route.abort();}
  if(url.pathname.endsWith('/axioma-auth.js'))return route.fulfill({contentType:'text/javascript',body:`(()=>{let role=localStorage.getItem('qa-algebra-role')||'guest';const listeners=[];const make=r=>r==='guest'?null:{id:'algebra-'+r,role:r,alias:r==='teacher'?'Leerkracht':'Algebra leerling',class_code:'TEST'};let account=make(role);const query={select:()=>query,eq:()=>query,order:()=>query,maybeSingle:async()=>({data:null,error:null}),then:resolve=>Promise.resolve(resolve({data:[],error:null})),abortSignal:()=>query};const client={from:()=>query,rpc:(name,args)=>{let data=name==='axioma_class_battle_hub'?{rooms:[],stats:[],leaderboards:[],classes:['TEST'],class:'TEST'}:{sessions:[],current:null,member:null,members:[],server_time:new Date().toISOString()};const p=Promise.resolve({data,error:null});p.abortSignal=()=>p;return p;},functions:{invoke:async()=>({data:{sessions:[],current:null,member:null,members:[]},error:null})}};window.AxiomaAuth={CLASSES:['TEST'],ready:async()=>({account,pending:false}),getAccount:async()=>account,getSession:async()=>null,getSnapshot:()=>({account,pending:false,status:account?'signed-in':'guest'}),configured:()=>true,client:()=>client,onChange:fn=>{listeners.push(fn);return()=>{};},onStateChange:()=>()=>{}};window.__qaAlgebraSwitch=(next,pending=false)=>{account=make(next);role=next;localStorage.setItem('qa-algebra-role',next);listeners.forEach(fn=>fn({account,pending}));};})();`});
  if(url.pathname.endsWith('/axioma-progress.js'))return route.fulfill({contentType:'text/javascript',body:`window.AxiomaProgress={load:async game=>__algebraProgressFixture('load',game,null,null,(await AxiomaAuth.getAccount())?.id),save:async(game,state,revision,id)=>__algebraProgressFixture('save',game,state,revision,id),loadOverview:async()=>({accountId:(await AxiomaAuth.getAccount())?.id||null,games:[],trainer:null,numbers:null,errors:{games:false,trainer:false,numbers:false}})};`});
  if(url.pathname.endsWith('/axioma-social.js'))return route.fulfill({contentType:'text/javascript',body:'window.AxiomaSocial={ready:async()=>({players:[],invitations:[]}),state:()=>({players:[],invitations:[]}),onChange:()=>()=>{}};'});
  return route.continue();
 });
}
async function newContext(role){
 const c=await browser.newContext({viewport:report.viewports[0],deviceScaleFactor:1,reducedMotion:'reduce',acceptDownloads:true});await install(c,role);
 const p=await c.newPage();p.setDefaultTimeout(15000);p.on('pageerror',e=>report.errors.push({phase,message:e.message}));p.on('response',r=>{if(r.status()===404)report.missing.push(r.url());});p.on('dialog',d=>d.type()==='beforeunload'?d.accept():d.dismiss());return{c,p};
}
async function ready(f,systems=false){await f.waitForFunction(systems=>!!window[systems?'StelselsTrainer':'AlgebraTrainer']&&AxiomaGame.active&&window.AlgebraShell,systems);await settle(f);}
async function snapshot(f){return f.evaluate(()=>{const s=(window.AlgebraTrainer||window.StelselsTrainer).snapshot();delete s.screen;delete s.pages;return s;});}
async function chooseSection(id,f,standalone=false){const selector=standalone?'.algebraSectionNav [data-section="'+id+'"]':'#nativeAppNavigation [data-algebra-section="'+id+'"]';await (standalone?f:page).locator(selector).click();await settle(f);}
async function openAlgebra(){
 await page.goto(base+'/os/');await page.waitForFunction(()=>window.LeraarBobDesktop&&document.querySelector('leraarbob-topbar')?.shadowRoot);
 await page.locator('#startButton').click();await page.getByRole('button',{name:'Alle apps Kies wat je op je bureaublad zet',exact:true}).click();await page.locator('#folderSidebar .sidebar-link').filter({hasText:/^Algebra/}).click();await page.locator('#typeFilters').getByRole('button',{name:'Trainer',exact:true}).click();await page.locator('#librarySearch').fill('Algebrawereld');
 const origin=(await state()).view;await page.locator('[data-app-id="algebra-trainer"] .card-open').click();const f=await frame();await ready(f);await chooseSection('world',f);await f.locator('#worldScreen:not(.hidden)').waitFor();return{f,origin};
}
async function chrome(f,standalone=false){
 assert.equal(await page.evaluate(()=>devicePixelRatio),1,'100% zoom');assert.equal(await page.locator('leraarbob-topbar').count(),1,'One shared platform bar');
 if(!standalone){assert.equal(await f.locator('leraarbob-topbar').count(),0,'No second platform bar inside native workboard');assert.equal(await f.locator('.algebraChrome').evaluate(e=>e.getClientRects().length),0,'The obsolete native title/menu row consumes no space');assert.equal(await f.locator('.algebraSectionNav').evaluate(e=>e.getClientRects().length),0,'Embedded app has one combined OS navigation row');assert.deepEqual(await page.locator('#nativeAppNavigation button').allTextContents(),['Werelden','Levels','Werkvormen']);}
}
async function measure(label,owner,selector,{scroll=false,minimum=true}={}){
 const loc=owner.locator(selector).first();assert(await loc.isVisible(),label+' is visible');
 if(scroll)await loc.scrollIntoViewIfNeeded();await settle(owner===page?null:owner);
 const geometry=await loc.evaluate((e,minimum)=>{
  const r=e.getBoundingClientRect(),issues=[],h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
  if(r.left<-.5||r.top<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5)issues.push('outside viewport');
  if(minimum&&(r.width<43.5||r.height<43.5))issues.push('touch target below 44 px');
  if(!h||!(e===h||e.contains(h)||h.contains(e)))issues.push('covered or clipped');
  if(!e.getAttribute('aria-label')&&!e.textContent.trim()&&!e.labels?.length)issues.push('missing accessible name');
  return{rect:r.toJSON(),issues,width:innerWidth,height:innerHeight};
 },minimum);
 if(owner!==page){const iframe=await(await owner.frameElement()).boundingBox(),restoreControl=page.locator('.lb-restore:not([hidden])'),restore=await restoreControl.count()?await restoreControl.boundingBox():null;if(restore){const r=geometry.rect,x=iframe.x+r.x,y=iframe.y+r.y;if(x<restore.x+restore.width&&x+r.width>restore.x&&y<restore.y+restore.height&&y+r.height>restore.y)geometry.issues.push('covered by restore');}}
 report.layout.push({phase,label,viewport:page.viewportSize(),...geometry});assert.deepEqual(geometry.issues,[],label+' '+JSON.stringify(geometry));
}
async function collapsed(value){await page.evaluate(value=>LeraarBobTopbar.setCollapsed(value,true),value);await settle();if(value){await measure('Reachable restore control',page,'.lb-restore:not([hidden])');assert.equal(await page.locator('.lb-restore:not([hidden])').getAttribute('aria-expanded'),'false');}else assert.equal(await page.locator('leraarbob-topbar .collapse').getAttribute('aria-expanded'),'true');}
async function matrix(f,label,targets,{standalone=false,snapshotCheck=true}={}){
 const before=snapshotCheck?await snapshot(f):null;
 for(const viewport of report.viewports){await page.setViewportSize(viewport);for(const fold of[false,true]){
  if(standalone)await page.evaluate(value=>LeraarBobTopbar.setCollapsed(value,true),fold);else await collapsed(fold);await settle(f);await chrome(f,standalone);
  const owner=standalone?f:page;for(const id of['world','menu','tools'])await measure(label+' navigation '+id,owner,(standalone?'.algebraSectionNav [data-section="':'#nativeAppNavigation [data-algebra-section="')+id+'"]');
  for(const target of targets){const selector=typeof target==='string'?target:target.selector;await measure(label+' '+selector,f,selector,{scroll:viewport.width<700||viewport.height<500,minimum:typeof target==='string'||target.minimum!==false});}
  assert.equal(await f.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,label+' has no horizontal overflow');
  if(snapshotCheck)assert.deepEqual(await snapshot(f),before,label+' changing viewport and topbar preserves actual work');
  await shot((standalone?'standalone-':'os-')+label+'-'+viewport.width+'-'+(fold?'collapsed':'expanded'));
 }
 }
 await page.setViewportSize(report.viewports[0]);if(standalone)await page.evaluate(()=>LeraarBobTopbar.setCollapsed(false,true));else await collapsed(false);check(label+' three viewports, both topbar states, real controls and intact native work');
}
async function retain(f,origin,label,focusSelector){
 const node=await page.locator('.frame-wrapper:not([hidden]) iframe').elementHandle(),before=await snapshot(f),target=f.locator(focusSelector),returnLabel='Terug naar '+await f.evaluate(()=>window.StelselsTrainer?'Stelsels':'Vergelijkingen');await target.focus();
 await page.keyboard.press('Control+k');await page.locator('#startPanel').waitFor({state:'visible'});assert(await page.locator('#startSearch').evaluate(e=>document.activeElement===e));await page.keyboard.press('Escape');assert(await target.evaluate(e=>document.activeElement===e),'Start Escape restores actual native focus');
 await page.locator('#saveActivity').click();await page.locator('#toast').waitFor({state:'visible'});assert.equal(await node.evaluate(e=>e.isConnected),true);assert.deepEqual(await snapshot(f),before,'Bewaren retains exercise and answer');
 await page.locator('#minimizeApp').click();assert.equal((await state()).view.kind,'desktop');await page.getByRole('button',{name:returnLabel,exact:true}).click();assert.equal(await frame(),f);assert(await node.evaluate(e=>e.isConnected));assert.deepEqual(await snapshot(f),before);assert(await target.evaluate(e=>document.activeElement===e),'Taskbar restores native focus');
 await page.locator('#appBack').click();assert.deepEqual((await state()).view,origin);assert.equal(await page.locator('#librarySearch').inputValue(),origin.query);await page.getByRole('button',{name:returnLabel,exact:true}).click();assert.equal(await frame(),f);assert.deepEqual(await snapshot(f),before);assert(await target.evaluate(e=>document.activeElement===e),'Own folder return restores native focus');
 const theme=await f.evaluate(()=>document.documentElement.dataset.mode);await page.locator('leraarbob-topbar .theme-toggle').click();assert.notEqual(await f.evaluate(()=>document.documentElement.dataset.mode),theme);await page.locator('leraarbob-topbar .theme-toggle').click();assert.equal(await f.evaluate(()=>document.documentElement.dataset.mode),theme);assert.deepEqual(await snapshot(f),before);
 await page.locator('leraarbob-topbar .fullscreen').click();await page.waitForFunction(()=>!!document.fullscreenElement);await page.evaluate(()=>document.exitFullscreen());assert.deepEqual(await snapshot(f),before);
 check(label+' actual Start/focus, Bewaren, minimize/resume, own return/filter and direct display/fullscreen without reset');
}
async function equationFlow(){
 phase='Vergelijkingen in OS';const opened=await openAlgebra(),f=opened.f;await chrome(f);assert.deepEqual(await f.locator('[data-world]').evaluateAll(es=>es.map(e=>e.dataset.world)),['equations','systems']);await matrix(f,'werelden',['[data-world="equations"]','[data-world="systems"]']);
 await f.locator('[data-world="equations"]').click();await f.locator('#navigationScreen:not(.hidden)').waitFor();assert.equal(await f.locator('[data-menu-stop]').count(),7);const blank=await snapshot(f);
 for(const id of await f.locator('[data-menu-stop]').evaluateAll(es=>es.map(e=>e.dataset.menuStop))){await f.locator('[data-menu-stop="'+id+'"]').click();assert.deepEqual(await snapshot(f),blank,'Selecting '+id+' does not start or reward a run');}
 await f.locator('[data-menu-stop="route-two"]').click();await matrix(f,'vergelijkingen-levels',['[data-menu-stop="route-two"]','.menuContinue','#navigationWorksheet']);
 await f.locator('.menuContinue').click();await f.locator('#trainerScreen:not(.hidden)').waitFor();await page.clock.install();
 assert.equal((await snapshot(f)).mission,'route-two');const board=await f.locator('#trainerScreen').elementHandle(),task=await snapshot(f);await f.locator('#contextOperations button').first().click();await page.clock.runFor(5000);assert((await snapshot(f)).trainerStates.length>task.trainerStates.length,'Real native operation creates an intermediate equation');
 await f.locator('#watchDemoBtn').click();await page.clock.runFor(1900);assert(await f.evaluate(()=>AlgebraTrainer.animationSnapshot().demo));await f.locator('#lessonPauseBtn').click();const animation=await f.evaluate(()=>AlgebraTrainer.animationSnapshot());await page.clock.runFor(2500);assert.equal((await f.evaluate(()=>AlgebraTrainer.animationSnapshot())).tex,animation.tex);await f.locator('#lessonReturnBtn').click();
 await f.locator('#historyBtn').click();await f.locator('#historyScreen:not(.hidden)').waitFor();assert((await f.locator('#historyPosition').textContent()).endsWith('/ 2'));await f.locator('#closeHistoryBtn').click();assert(await board.evaluate(e=>e.isConnected));
 await matrix(f,'vergelijkingen-werkbord',[{selector:'.derivationMath',minimum:false},'#contextOperations button','#watchDemoBtn','#historyBtn','#checkBtn']);await retain(f,opened.origin,'Vergelijkingen','#watchDemoBtn');
 await chooseSection('menu',f);await f.locator('[data-menu-stop="route-brackets"]').click();const work=await snapshot(f);await f.locator('#navigationWorksheet').click();await f.locator('#previewScreen:not(.hidden)').waitFor();await f.waitForFunction(()=>document.querySelector('[data-worksheet-save-status]')?.textContent.startsWith('Bewaard'));assert.deepEqual(await snapshot(f),work,'A separate level worksheet does not change native work or XP');assert.equal(await f.locator('.missionQuestions article').count(),6);
 await page.locator('#saveActivity').click();assert.equal(await page.evaluate(()=>LeraarBobWorksheetLibrary.list().then(es=>es.length)),1,'Bewaren does not duplicate the automatically archived exact worksheet');await f.locator('#backPaperLevels').click();await f.locator('[data-menu-stop="route-two"]').click();await f.locator('.menuContinue').click();assert.deepEqual(await snapshot(f),work);
 check('Vergelijkingen seven available levels; explicit start; actual intermediate operation, help/pause/history and exact independent archived sheet');
 // Undo the deliberately explored operation through the original control before
 // using the canonical full-round learner helper. It expects the starting row.
 while((await snapshot(f)).trainerStates.length>1)await f.locator('#undoBtn').click();
 const proxy=new Proxy(f,{get:(target,key)=>key==='clock'?page.clock:typeof target[key]==='function'?target[key].bind(target):target[key]});
 for(let i=0;i<6;i++){await solveTask(proxy);await f.locator('#nextExerciseBtn').click();await page.clock.runFor(60);}
 await f.locator('#summaryScreen:not(.hidden)').waitFor();assert.equal(await f.evaluate(()=>AlgebraJourney.xp(AlgebraTrainer.snapshot().chapterJourney)),30);assert.equal(await page.locator('leraarbob-topbar .progress-value').textContent(),'30 XP');assert.equal(await f.locator('#algebraProgress').getAttribute('data-value'),'30');
 check('Six genuine equation answers finish one round; shared OS badge equals native 30 XP without conversion');await chooseSection('world',f);return{f,origin:opened.origin};
}
async function systemsFlow(opened){
 phase='Stelsels in OS';await opened.f.locator('[data-world="systems"]').click();let f=await frame();await ready(f,true);await f.locator('#navigationScreen:not([hidden])').waitFor();assert.equal(await f.locator('[data-menu-stop]').count(),6);const blank=await snapshot(f);
 for(const id of await f.locator('[data-menu-stop]').evaluateAll(es=>es.map(e=>e.dataset.menuStop))){await f.locator('[data-menu-stop="'+id+'"]').click();assert.deepEqual(await snapshot(f),blank,'Selecting '+id+' leaves the existing work intact');}
 await f.locator('[data-menu-stop="sys-substitution"]').click();await matrix(f,'stelsels-levels',['[data-menu-stop="sys-substitution"]','.menuContinue','#navigationWorksheet']);
 await f.locator('.menuContinue').click();await f.locator('#work:not([hidden])').waitFor();assert.equal((await snapshot(f)).mission,'sys-substitution');
 if(await f.locator('#compactMethodToggle').isVisible())await f.locator('#compactMethodToggle').click();await f.locator('[data-method="substitution"]').click();await f.locator('#operand').fill('-y');await f.locator('#previewOperation').click();await f.locator('#preview:not([hidden])').waitFor();const pending=await snapshot(f);await matrix(f,'stelsels-voorstel',[{selector:'#activeRow0',minimum:false},{selector:'#activeRow1',minimum:false},'#apply','#cancel','#systemHistoryBtn']);assert.deepEqual(await snapshot(f),pending);
 await f.locator('#apply').click();assert.equal((await snapshot(f)).work[(await snapshot(f)).exercises[0].id].steps.length,2);await f.locator('#systemHelpBtn').click();assert(await f.locator('#toolAdvice').isVisible());await f.locator('#systemHelpBtn').click();await f.locator('#systemHistoryBtn').click();await f.locator('#systemHistory:not([hidden])').waitFor();assert.match(await f.locator('#systemHistoryPosition').textContent(),/2 \/ 2/);await f.locator('#systemHistoryBack').click();
 await f.locator('#operand').fill('1/');const draft=await snapshot(f);await retain(f,opened.origin,'Stelsels','#operand');assert.equal(await f.locator('#operand').inputValue(),'1/');
 await chooseSection('menu',f);await f.locator('[data-menu-stop="sys-combination"]').click();const work=await snapshot(f);await f.locator('#navigationWorksheet').click();await f.waitForFunction(()=>StelselsTrainer.snapshot().pages>0);await f.waitForFunction(()=>document.querySelector('[data-worksheet-save-status]')?.textContent.startsWith('Bewaard'));assert.deepEqual(await snapshot(f),work,'Systems worksheet preserves current input and intermediate steps');await f.locator('#backWork').click();await f.locator('[data-menu-stop="sys-substitution"]').click();await f.locator('.menuContinue').click();assert.deepEqual(await snapshot(f),draft);assert.equal(await f.locator('#operand').inputValue(),'1/');
 const old=await f.locator('#operand').elementHandle();await chooseSection('tools',f);await f.locator('#tools:not([hidden])').waitFor();await chooseSection('menu',f);await f.locator('[data-menu-stop="sys-substitution"]').click();await f.locator('.menuContinue').click();assert(await old.evaluate(e=>e.isConnected));assert.equal(await f.locator('#operand').inputValue(),'1/');
 const beforeReload=await snapshot(f);await collapsed(true);await page.reload();await page.waitForFunction(()=>window.LeraarBobDesktop);await page.locator('.lb-restore:not([hidden])').waitFor();await measure('Reloaded Algebra OS restore',page,'.lb-restore:not([hidden])');
 // The OS reopens its own folder after a full page reload. Native account storage,
 // rather than a desktop copy of transient frame memory, resumes the saved work.
 await page.locator('.desktop-button').click();await page.locator('#startButton').click();await page.getByRole('button',{name:'Alle apps Kies wat je op je bureaublad zet',exact:true}).click();await page.locator('#folderSidebar .sidebar-link').filter({hasText:/^Algebra/}).click();await page.locator('#librarySearch').fill('Algebrawereld');await page.locator('[data-app-id="algebra-trainer"] .card-open').click();let equations=await frame();await ready(equations);await chooseSection('world',equations);await equations.locator('[data-world="systems"]').click();f=await frame();await ready(f,true);await f.locator('[data-menu-stop="sys-substitution"]').click();await f.locator('.menuContinue').click();assert.equal(await f.locator('#operand').inputValue(),'1/');assert.deepEqual(await snapshot(f),beforeReload);await page.locator('.lb-restore:not([hidden])').click();
 check('Stelsels six available levels; real pending/apply step, help/history, unfinished input, other-level paper, Werkvormen and full OS reload');return f;
}
async function accountBoundaries(){
 phase='Central Algebra account';const f=await frame(),before=await snapshot(f),node=await page.locator('.frame-wrapper:not([hidden]) iframe').elementHandle();
 await page.locator('leraarbob-topbar .account:visible').click();await page.locator('#authOverlay').waitFor({state:'visible'});assert(await node.evaluate(e=>e.isConnected));assert.deepEqual(await snapshot(f),before);await page.keyboard.press('Escape');assert(!(await page.locator('#authOverlay').isVisible()));
 await page.evaluate(()=>__qaAlgebraSwitch('student'));await page.waitForFunction(()=>LeraarBobDesktop.state().accountId==='algebra-student');assert.equal(await page.locator('#appFrames iframe').count(),0);assert.equal((await page.evaluate(()=>LeraarBobWorksheetLibrary.list())).length,0,'The new account cannot inherit the guest worksheet folder');
 const opened=await openAlgebra();assert.equal((await snapshot(opened.f)).activeSet.length,0);assert.equal(await page.locator('leraarbob-topbar .progress-value').textContent(),'0 XP');
 check('Central account panel retains native work; guest→student disposes old frames and isolates native work, 30 XP and exact worksheet library');
}
async function embeddedRoles(){
 await context.close();
 for(const role of['guest','teacher','student']){
  ({c:context,p:page}=await newContext(role));phase='Embedded Klasbattle '+role;const opened=await openAlgebra(),systems=role==='teacher',world=systems?'systems':'equations',selected=systems?'sys-combination':'route-brackets';let f=opened.f;
  await f.locator('[data-world="'+world+'"]').click();if(systems){f=await frame();await ready(f,true);await f.locator('[data-menu-stop="sys-substitution"]').click();await f.locator('.menuContinue').click();await f.locator('#operand').fill('1/');}else{await f.locator('[data-menu-stop="route-two"]').click();await f.locator('.menuContinue').click();await f.locator('#contextOperations button').first().click();await f.waitForFunction(()=>AlgebraTrainer.snapshot().trainerStates.length>1&&!AlgebraTrainer.animationSnapshot().active);}
  const board=await f.locator(systems?'#work':'#trainerScreen').elementHandle();await chooseSection('menu',f);await f.locator('[data-menu-stop="'+selected+'"]').click();await chooseSection('tools',f);await f.locator(systems?'#tools:not([hidden])':'#toolsScreen:not(.hidden)').waitFor();const before=await snapshot(f),node=await page.locator('.frame-wrapper:not([hidden]) iframe').elementHandle();
  await f.locator('[data-algebra-battle]').click();const hub=await frame();await hub.locator('#gameCards [data-launch="algebra"]').waitFor();assert.match(page.url(),/\/os\//,'Native battle opens inside OS');assert.equal(new URL(hub.url()).searchParams.get('world'),world);assert.equal(new URL(hub.url()).searchParams.get('level'),selected);
  assert.equal(await hub.locator('#gameCards [data-launch="algebra"]').textContent(),role==='teacher'?'Battle maken':'Battle openen');assert.equal(await hub.locator('#gameCards [data-simulate="algebra"]').count(),role==='teacher'?1:0);assert.equal(await hub.locator('#loginBtn').isVisible(),role==='guest');assert(await node.evaluate(e=>e.isConnected));assert.deepEqual(await snapshot(f),before);assert.equal(await hub.locator('leraarbob-topbar').count(),0);
  await hub.locator('#originGame').click();assert.equal(await frame(),f,'Native return from class hub restores the original cached module frame');await f.locator(systems?'#navigationScreen:not([hidden])':'#navigationScreen:not(.hidden)').waitFor();assert.equal(await f.locator('[data-menu-stop][aria-pressed="true"]').getAttribute('data-menu-stop'),selected);assert.deepEqual(await snapshot(f),before);assert(await board.evaluate(e=>e.isConnected),'Class hub return preserves the actual workboard DOM');if(systems)assert.equal(await f.locator('#operand').inputValue(),'1/','Teacher class entry leaves the original unfinished stelsel input intact');await page.locator('#appBack').click();assert.deepEqual((await state()).view,opened.origin);
  check('OS '+role+' exact selected-world Klasbattle entry and own return reuse the same level/module DOM',{sessionScope:'Teacher creation vs student/guest entry UI; no remote class created'});await context.close();
 }
}
async function standaloneAndRoles(){
 for(const role of['guest','teacher','student']){
  ({c:context,p:page}=await newContext(role));phase='Standalone '+role;await page.goto(base+'/games/algebra-trainer/?screen=world');await ready(page);await chrome(page,true);
  assert.deepEqual(await page.locator('.algebraSectionNav [data-section]').allTextContents(),['Werelden','Levels','Werkvormen']);await page.locator('[data-world="equations"]').click();assert.equal(await page.locator('[data-menu-stop]').count(),7);
  await page.locator('[data-menu-stop="route-brackets"]').click();await chooseSection('tools',page,true);await page.locator('#toolsScreen:not(.hidden)').waitFor();const battle=page.locator('[data-algebra-battle]').first();assert(await battle.isVisible());const url=new URL(await battle.getAttribute('href'),page.url());assert.equal(url.searchParams.get('world'),'equations');assert.equal(url.searchParams.get('level'),'route-brackets');assert.match(url.searchParams.get('returnTo'),/level=route-brackets/);
  if(role==='guest'){await chooseSection('menu',page,true);await matrix(page,'standalone-levels',['[data-menu-stop="route-brackets"]','.menuContinue','#navigationWorksheet'],{standalone:true});await page.locator('leraarbob-topbar .collapse').click();await page.reload();await ready(page);assert(await page.locator('.lb-restore:not([hidden])').isVisible());await measure('Standalone reload restore',page,'.lb-restore:not([hidden])');await page.locator('.lb-restore:not([hidden])').click();await chooseSection('tools',page,true);}
  await battle.click();await page.waitForURL(/\/klasbattle\//);await page.locator('#gameCards [data-launch="algebra"]').waitFor();assert.equal(await page.locator('#gameCards [data-launch="algebra"]').textContent(),role==='teacher'?'Battle maken':'Battle openen');assert.equal(await page.locator('#gameCards [data-simulate="algebra"]').count(),role==='teacher'?1:0);assert.equal(await page.locator('#loginBtn').isVisible(),role==='guest');assert.equal(await page.locator('leraarbob-topbar').count(),1);
  await shot('standalone-klasbattle-'+role);check('Standalone '+role+' one platform bar, Werelden/Levels/Werkvormen and class entry retaining selected equation level',{sessionScope:'Role entry UI and exact world/level/return route, not a created remote class session'});
  await context.close();
 }
}
function evidence(){
 const files=['os/desktop.js','os/desktop.css','os/index.html','shared/leraarbob-topbar.js','shared/platform-routes.js','games/algebra-trainer/index.html','games/algebra-trainer/stelsels.html','games/algebra-trainer/shell.js','games/algebra-trainer/shell.css','games/algebra-trainer/navigation.js','games/algebra-trainer/navigation.css','games/algebra-trainer/world.css','games/algebra-trainer/trainer.js','games/algebra-trainer/stelsels/app.js','games/algebra-trainer/stelsels/workspace.css','tests/algebra-os-browser.cjs'];
 report.sourceHashes=Object.fromEntries(files.map(file=>[file,sha(fs.readFileSync(path.join(root,file)))]));
}
async function main(){
 fs.mkdirSync(out,{recursive:true});await new Promise(resolve=>host.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+host.address().port;
 try{browser=await chromium.launch({headless:true,executablePath:process.env.LB_CHROMIUM||(fs.existsSync('/opt/brave.com/brave/brave')?'/opt/brave.com/brave/brave':undefined),args:['--no-sandbox','--disable-dev-shm-usage']});report.browser=await browser.version();({c:context,p:page}=await newContext('guest'));
  const opened=await equationFlow();await systemsFlow(opened);await accountBoundaries();await embeddedRoles();await standaloneAndRoles();assert.deepEqual(report.errors,[],'No browser exceptions');assert.deepEqual(report.missing,[],'No missing frontend assets');report.passed=true;console.log('PASS Algebra OS: '+report.checks.length+' groups, '+report.layout.length+' measured targets, '+report.screenshots.length+' screenshots');
 }catch(error){report.failure={phase,message:error.message,stack:error.stack};await shot('failure').catch(()=>{});throw error;}
 finally{evidence();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();host.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
