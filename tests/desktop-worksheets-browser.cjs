/* Real native worksheet generation and OS archive UI. No production credentials or writes. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=process.env.WORKSHEETS_SCREENSHOTS||'/tmp/leraarbob-worksheets-qa';
const host=require('../scripts/serve-os-preview.cjs').createServer();
const report={scope:'Actual localhost Chromium native generators and IndexedDB archive, 100% zoom. Fictitious isolated account identities; all external requests blocked. No production login, cloud storage or progress writes.',viewports:[{width:1366,height:768},{width:390,height:844}],checks:[],layout:[],sources:[],errors:[],missing:[],remoteRequests:[],blocked:['Generated worksheet folders are local to this browser and account. Production authentication and cross-device/cloud sync are not tested or provided by this archive.'],passed:false};
const sourceList=[
 {id:'rechtenwereld:hellingrug',theme:'rechten',title:'Hellingrug',global:'LeraarBobWorksheetMaker',generate:'#generateWorksheet'},
 {id:'rechtenwereld:grenspas',theme:'rechten',title:'Grenspas',global:'LeraarBobWorksheetMaker',generate:'#generateWorksheet'},
 {id:'rechtenwereld:formulewerf',theme:'rechten',title:'Formulewerf',global:'LeraarBobWorksheetMaker',generate:'#generateWorksheet'},
 {id:'rechtenwereld:signaalstad',theme:'rechten',title:'Signaalstad',global:'LeraarBobWorksheetMaker',generate:'#generateWorksheet'},
 {id:'algebra-trainer:equations',theme:'algebra',title:'Vergelijkingen',global:'LeraarBobWorksheetMaker',generate:'#generateWorksheet',level:'route-inverse'},
 {id:'algebra-trainer:systems',theme:'algebra',title:'Stelsels',global:'LeraarBobWorksheetMaker',generate:'#generateWorksheet',level:'sys-substitution'},
 {id:'bewerkingen-trainer:operations',topic:'machten',theme:'getallen',title:'Machten',global:'LeraarBobWorksheetMaker',generate:'#generateWorksheet'},
 {id:'bewerkingen-trainer:operations',topic:'wortels',theme:'getallen',title:'Vierkantswortels',global:'LeraarBobWorksheetMaker',generate:'#generateWorksheet'},
 {id:'bewerkingen-trainer:operations',topic:'wetenschappelijk',theme:'getallen',title:'Wetenschappelijke notatie',global:'LeraarBobWorksheetMaker',generate:'#generateWorksheet'}
];
let browser,context,page,base,phase='initialization';
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const evidenceSources=['os/index.html','os/desktop-model.js','os/desktop.js','os/desktop.css','os/worksheet.html','os/worksheet.js','os/worksheet.css','shared/worksheet-library.js','shared/worksheet-save.js','shared/worksheet-save.css','shared/leraarbob-topbar.js','shared/leraarbob-topbar.css','shared/collapsible-topbar.js','shared/collapsible-topbar.css','shared/worksheet-layout.css','games/rechten/rechtenwereld/worksheets.html','games/rechten/rechtenwereld/worksheets/worksheets.js','games/algebra-trainer/index.html','games/algebra-trainer/trainer.js','games/algebra-trainer/stelsels.html','games/algebra-trainer/stelsels/app.js','games/algebra-trainer/stelsels/paper.js','games/bewerkingen-trainer/index.html','games/bewerkingen-trainer/app.js'];
function recordEvidence(){
 report.sourceHashes=evidenceSources.map(file=>({file,sha256:sha(fs.readFileSync(path.join(root,file)))}));
 report.harness={file:path.relative(root,__filename),sha256:sha(fs.readFileSync(__filename))};
 report.screenshots=fs.readdirSync(out).filter(file=>file.endsWith('.png')&&file!=='failure.png').sort();
}
function check(name,detail){report.checks.push({name,...(detail?{detail}:{})});console.log('PASS '+name);}
async function settle(){await page.bringToFront();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function shot(name){await settle();await page.screenshot({path:path.join(out,name+'.png')});}
async function libraryList(){return page.evaluate(()=>LeraarBobWorksheetLibrary.list());}
async function waitLibraryCount(expected){const deadline=Date.now()+20000;let actual;do{actual=(await libraryList()).length;if(actual===expected)return;await page.waitForTimeout(80);}while(Date.now()<deadline);assert.equal(actual,expected,'Archive entry count after completed storage');}
async function fullEntry(id){return page.evaluate(id=>LeraarBobWorksheetLibrary.get(id),id);}
async function currentFrame(){await page.locator('#appFrames .frame-wrapper:not([hidden]) iframe').waitFor();return(await page.locator('#appFrames .frame-wrapper:not([hidden]) iframe').elementHandle()).contentFrame();}
async function savedView(theme='all'){await page.evaluate(theme=>LeraarBobDesktop.showView({kind:'worksheet-saved',themeId:theme}),theme);await settle();}
async function worksheetsView(theme=''){await page.evaluate(theme=>LeraarBobDesktop.showView({kind:'worksheets',themeId:theme}),theme);await settle();}
async function layout(label,selector,frame){
 const target=frame||page;await target.locator(selector).scrollIntoViewIfNeeded();await settle();
 const result=await target.locator(selector).evaluate(element=>{
  const r=element.getBoundingClientRect(),issues=[];
  if(r.width<43.5||r.height<43.5)issues.push('touch target below 44 pixels');
  if(r.left<-.5||r.right>innerWidth+.5||r.top<-.5||r.bottom>innerHeight+.5)issues.push('target outside viewport');
  const inset=Math.min(Math.max(6,parseFloat(getComputedStyle(element).borderTopLeftRadius)+1),r.width/3,r.height/3);
  for(const [x,y]of[[r.left+inset,r.top+inset],[r.right-inset,r.top+inset],[r.left+inset,r.bottom-inset],[r.right-inset,r.bottom-inset],[(r.left+r.right)/2,(r.top+r.bottom)/2]]){
   const hit=document.elementFromPoint(x,y);if(!hit||!element.contains(hit))issues.push('covered touch point '+Math.round(x)+','+Math.round(y));
  }
  if(document.documentElement.scrollWidth>innerWidth+1)issues.push('horizontal document overflow');
  return {rect:r.toJSON(),issues,viewport:{width:innerWidth,height:innerHeight}};
 });report.layout.push({label,selector,...result});assert.deepEqual(result.issues,[],label);
}
async function setCollapsed(collapsed){await page.evaluate(value=>LeraarBobTopbar.setCollapsed(value,true),collapsed);await settle();if(collapsed){await layout('OS restore '+(await page.viewportSize()).width,'.lb-restore:not([hidden])');assert.equal(await page.locator('.lb-restore:not([hidden])').getAttribute('aria-expanded'),'false');}}
async function nativeSnapshot(frame,source){return frame.evaluate(name=>window[name].worksheetSnapshot(),source.global);}
async function waitNative(frame,source){try{await frame.waitForFunction(name=>typeof window[name]?.worksheetSnapshot==='function'&&window[name].state().ready,source.global);}catch(error){console.error('Native readiness failed',frame.url(),await frame.evaluate(name=>({api:typeof window[name]?.worksheetSnapshot,active:window.AxiomaGame?.active,title:document.title}),source.global));throw error;}}
async function openGenerator(source){
 await worksheetsView(source.theme);await page.locator('[data-worksheet-topic='+JSON.stringify(source.topic||source.id.split(':')[1])+']').click();const entry=page.locator('[data-worksheet-source='+JSON.stringify(source.id)+']');
 await entry.waitFor();await entry.locator('button').first().click();const frame=await currentFrame();await waitNative(frame,source);return frame;
}
async function openSaved(id){
 await savedView();const card=page.locator('[data-worksheet-id='+JSON.stringify(id)+']');await card.waitFor();await card.locator('[data-worksheet-open]').click();
 const viewer=await currentFrame();await viewer.locator('#worksheetDocument').waitFor();await viewer.locator('#includeKey').uncheck();await viewer.waitForFunction(()=>document.querySelector('#worksheetDocument').contentDocument?.body?.textContent.trim());
 return{viewer,document:await(await viewer.locator('#worksheetDocument').elementHandle()).contentFrame()};
}
async function archiveContent(frame){return frame.evaluate(()=>({text:document.body.textContent,images:[...document.images].map(image=>image.getAttribute('src')),math:[...document.querySelectorAll('annotation[encoding="application/x-tex"]')].map(node=>node.textContent),html:document.body.innerHTML}));}
async function archiveGeometry(frame,label){
 await Promise.race([frame.evaluate(()=>document.fonts.ready),new Promise((_,reject)=>setTimeout(()=>reject(Error(label+' fonts did not settle')),5000))]);await settle();
 const geometry=await frame.evaluate(()=>({viewport:{width:innerWidth,height:innerHeight},scrollWidth:document.documentElement.scrollWidth,pages:[...document.querySelectorAll('.worksheet-page,.paperPage,.paper,img.paper-page')].map(element=>({rect:element.getBoundingClientRect().toJSON(),width:element.offsetWidth,height:element.offsetHeight,visible:element.getClientRects().length>0}))}));
 assert(geometry.pages.length>0,label+' actual page content');assert(geometry.pages.every(item=>item.visible),label+' no hidden saved pages');assert(geometry.scrollWidth<=geometry.viewport.width+1,label+' preview has no horizontal clipping or overflow');
 for(const item of geometry.pages)assert(item.rect.left>=-.5&&item.rect.right<=geometry.viewport.width+.5,label+' entire A4 width fits without cutting off its right side');
 report.layout.push({label,document:geometry});
}
async function closeActive(){if(await page.locator('#closeApp').isVisible()){await page.locator('#closeApp').click();await page.locator('#acceptClose').click();}}
async function generation(){
 for(const source of sourceList){
  phase='native '+source.id;const before=await libraryList(),frame=await openGenerator(source);
  assert.equal((await libraryList()).length,before.length,'Opening a generator does not archive its default example');
  if(source.level){await frame.locator('#field-level').selectOption(source.level);}
  await frame.locator(source.generate).first().click();await frame.locator('[data-worksheet-save]').waitFor();
  await waitLibraryCount(before.length+1);
  const entries=await libraryList(),meta=entries.find(entry=>!before.some(prior=>prior.id===entry.id));assert(meta,'One newly generated series stored');
  const original=await fullEntry(meta.id),native=await nativeSnapshot(frame,source),appTitle=await page.locator('#activeAppMode').textContent();
  assert.equal(original.sourceId,source.id);assert.equal(original.theme,source.theme);
  assert(original.questionsHTML.length>20,'Actual native question pages saved');assert(original.keyHTML.length>20,'Actual native answer pages saved');
  assert.equal(original.questionsHTML,await frame.evaluate(html=>LeraarBobWorksheetLibrary.sanitizeHTML(html),native.questionsHTML),'Stored questions preserve the exact native page after inert serialization');
  assert.equal(original.keyHTML,await frame.evaluate(html=>LeraarBobWorksheetLibrary.sanitizeHTML(html),native.keyHTML),'Stored key is paired with the same generated native questions');
  if(source.theme==='getallen'){const starts=await frame.evaluate(html=>{const t=document.createElement('template');t.innerHTML=html;return [...t.content.querySelectorAll('ol')].map(o=>o.start);},original.questionsHTML);assert.deepEqual(starts,[1,5,9],'Archived numbers worksheets keep continuous question numbers across pages');}
  const hashes={questions:sha(original.questionsHTML),key:sha(original.keyHTML),data:sha(JSON.stringify(original.data))};
  await frame.waitForFunction(()=>document.querySelector('[data-worksheet-save]')?.disabled===false);await frame.locator('[data-worksheet-save]').click();
  await frame.waitForFunction(()=>document.querySelector('[data-worksheet-save]')?.disabled===false);assert.equal((await libraryList()).length,before.length+1,'Manual save is idempotent for the same exact series');
  await page.locator('#saveActivity').click();await frame.waitForFunction(()=>document.querySelector('[data-worksheet-save]')?.disabled===false);
  assert.equal((await libraryList()).length,before.length+1,'OS Bewaren archives the actual document without duplicating it');assert.equal((await page.evaluate(()=>LeraarBobDesktop.state())).savedCount,0,'Worksheet saving does not make a misleading shortcut in Mijn taken');
  const toggle='#includeKey';if(await frame.locator(toggle).isVisible()){
   if(toggle==='#showKey')await frame.locator(toggle).click();else await frame.locator(toggle).setChecked(!(await frame.locator(toggle).isChecked()));
   await frame.waitForFunction(()=>document.querySelector('[data-worksheet-save]')?.disabled===false);
   assert.deepEqual(await nativeSnapshot(frame,source),native,'Showing the native key does not generate a different paired series');assert.equal((await libraryList()).length,before.length+1);
  }
  await frame.locator('[data-worksheet-save]').focus();await page.keyboard.press('Control+k');await page.locator('#startPanel').waitFor();await page.keyboard.press('Escape');
  assert(await frame.locator('[data-worksheet-save]').evaluate(element=>element===element.ownerDocument.activeElement),'Start restores actual generator save focus');
  const frameHandle=await frame.frameElement(),snapshotBefore=await nativeSnapshot(frame,source);await page.locator('#minimizeApp').click();
  await page.getByRole('button',{name:'Terug naar '+appTitle,exact:true}).click();assert(await frameHandle.evaluate(element=>element.isConnected));
  assert.deepEqual(await nativeSnapshot(frame,source),snapshotBefore,'Minimize/resume preserves existing generated document and key');
  await page.locator('#appBack').click();assert.equal((await page.evaluate(()=>LeraarBobDesktop.state())).view.kind,'worksheets');
  assert.equal((await page.evaluate(()=>LeraarBobDesktop.state())).view.themeId,source.theme,'Generator returns to its own thematic worksheet folder');
  const archive=await openSaved(meta.id);await archive.document.waitForLoadState();const questions=await archiveContent(archive.document);
  assert(questions.text.trim().length||questions.images.length,'Archive shows the saved actual pages');
  await archive.viewer.locator('#includeKey').check();await archive.viewer.waitForFunction(()=>document.querySelector('#worksheetDocument').contentDocument?.querySelector('.archive-key'));
  const keyFrame=await(await archive.viewer.locator('#worksheetDocument').elementHandle()).contentFrame();await keyFrame.waitForLoadState();const key=await archiveContent(keyFrame);
  assert.notDeepEqual({text:questions.text,images:questions.images},{text:key.text,images:key.images},'Key view differs from question view');
  assert(!(await archive.viewer.locator('#worksheetDocument').getAttribute('sandbox')).split(/\s+/).includes('allow-scripts'),'Archived document cannot execute scripts');
  if(source.id==='rechtenwereld:hellingrug'||source.id==='bewerkingen-trainer:operations'||source.id==='algebra-trainer:systems')await shot('saved-'+source.id.replace(':','-')+(source.topic?'-'+source.topic:''));
  await page.reload();await page.waitForFunction(()=>window.LeraarBobDesktop?.state().accountId==='worksheet-alice');
  const restored=await fullEntry(meta.id);assert(restored,'Series survives full OS reload');
  assert.deepEqual({questions:sha(restored.questionsHTML),key:sha(restored.keyHTML),data:sha(JSON.stringify(restored.data))},hashes,'Reload never randomly regenerates a saved series or key');
  const reopened=await openSaved(meta.id);await reopened.document.waitForLoadState();assert.deepEqual(await archiveContent(reopened.document),questions,'Reopening after reload renders exactly the same saved question page');
  report.sources.push({id:source.id,topic:source.topic||source.id.split(':')[1],archiveId:meta.id,hashes,actualNativeGeneration:true,pairedKey:true,reloadExact:true});
  check(source.title+' actual generation, automatic exact archive/key, idempotent save, native focus/minimize and OS reload');
 }
}
async function folderLayouts(){
 for(const viewport of report.viewports){
  await page.setViewportSize(viewport);assert.equal(await page.evaluate(()=>devicePixelRatio),1);
  for(const collapsed of[false,true]){
   await setCollapsed(collapsed);await worksheetsView();assert(!await page.locator('#folderSidebar').isVisible());assert(!await page.locator('#viewToolbar').isVisible());assert.equal(await page.locator('#libraryWindow .sidebar-link').count(),0);
   await shot('worksheet-folders-'+viewport.width+'-'+(collapsed?'collapsed':'expanded'));
   const folders=await page.locator('[data-worksheet-theme]').evaluateAll(elements=>elements.map(element=>element.dataset.worksheetTheme));
   assert.deepEqual(new Set(folders),new Set(['rechten','getallen','algebra']),'Only themes with actual generators are offered');
   for(const theme of['rechten','getallen','algebra']){
    await layout('Worksheet '+theme+' folder '+viewport.width+' collapsed='+collapsed,'[data-worksheet-theme='+JSON.stringify(theme)+']');
    await page.locator('[data-worksheet-theme='+JSON.stringify(theme)+']').click();
    const topics=await page.locator('[data-worksheet-topic]').evaluateAll(elements=>elements.map(element=>element.dataset.worksheetTopic));
    assert.deepEqual(new Set(topics),new Set(sourceList.filter(source=>source.theme===theme).map(source=>source.topic||source.id.split(':')[1])),'No other theme gets mixed into this folder');
    if(theme==='getallen')await shot('worksheet-topics-'+viewport.width+'-'+(collapsed?'collapsed':'expanded'));
    await layout('Breadcrumb back '+theme+' '+viewport.width+' collapsed='+collapsed,'.worksheet-path button:first-of-type');
    await page.locator('.worksheet-path button').first().click();
   }
   for(const theme of['rechten','getallen','algebra']){
    await savedView('');await page.locator('[data-worksheet-theme='+JSON.stringify(theme)+']').click();await page.locator('[data-worksheet-topic]').first().waitFor();
    const topics=await page.locator('[data-worksheet-topic]').evaluateAll(elements=>elements.map(element=>element.dataset.worksheetTopic));
    assert.deepEqual(new Set(topics),new Set(sourceList.filter(source=>source.theme===theme).map(source=>source.topic||source.id.split(':')[1])),'Saved folders retain the same nine actual native topics');
   }
   await savedView('');assert(!await page.locator('#folderSidebar').isVisible());await layout('Saved theme folder '+viewport.width+' collapsed='+collapsed,'[data-worksheet-theme="rechten"]');await page.locator('[data-worksheet-theme="rechten"]').click();
   const one=await libraryList(),id=one.find(entry=>entry.theme==='rechten').id;const archive=await openSaved(id);await archive.document.waitForLoadState();await archiveGeometry(archive.document,'Actual saved A4 pages '+viewport.width+' collapsed='+collapsed);
   for(const selector of['#printWorksheet','#downloadWorksheet','#downloadBackup'])await layout('Archive action '+selector+' '+viewport.width+' collapsed='+collapsed,selector,archive.viewer);
   await shot('archive-'+viewport.width+'-'+(collapsed?'collapsed':'expanded'));
   if(collapsed){await page.locator('.lb-restore:not([hidden])').click();assert.equal(await page.locator('leraarbob-topbar .collapse').getAttribute('aria-expanded'),'true');}
   check('Thematic worksheet folders, saved folders, breadcrumb and all archive controls '+viewport.width+' '+(collapsed?'collapsed/restore':'expanded'));
  }
 }
 await setCollapsed(true);await page.reload();await page.waitForFunction(()=>window.LeraarBobDesktop?.state().accountId==='worksheet-alice');await page.locator('.lb-restore:not([hidden])').waitFor();await page.locator('.lb-restore:not([hidden])').click();check('Worksheet OS collapsed preference survives full browser reload and restore');
}
async function accountsExportsFailures(){
 phase='account isolation and export';await page.setViewportSize({width:1366,height:768});
 const alice=await libraryList();assert.equal(alice.length,sourceList.length);
 const row=await fullEntry(alice[0].id),json=await page.evaluate(id=>LeraarBobWorksheetLibrary.get(id).then(entry=>LeraarBobWorksheetLibrary.exportJSON(entry)),row.id),backup=JSON.parse(json);
 assert.match(json,/questionsHTML/);assert.match(json,/keyHTML/);assert.equal(JSON.stringify(backup).includes('worksheet-alice'),false,'Portable backup excludes account identity');
 await savedView();const downloading=page.waitForEvent('download');await page.locator('[data-worksheet-id='+JSON.stringify(row.id)+'] [data-worksheet-export]').click();const download=await downloading;
 const downloaded=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.deepEqual(downloaded,backup,'Actual export control downloads complete exact question/key JSON backup');
 await page.evaluate(()=>__qaSwitch('worksheet-bob','student'));await page.waitForFunction(()=>LeraarBobDesktop.state().accountId==='worksheet-bob');assert.equal((await libraryList()).length,0);assert.equal(await fullEntry(row.id),null,'Other account cannot request Alice document by known ID');
 assert.equal(await page.locator('#appFrames iframe').count(),0,'Account change disposes open native documents');await savedView();assert.equal(await page.locator('[data-worksheet-id]').count(),0);
 await page.evaluate(()=>__qaSwitch(null,'guest'));await page.waitForFunction(()=>LeraarBobDesktop.state().accountId===null);assert.equal((await libraryList()).length,0,'Guest does not inherit Alice archive');
 await page.evaluate(()=>__qaSwitch('worksheet-alice','teacher'));await page.waitForFunction(()=>LeraarBobDesktop.state().accountId==='worksheet-alice');assert.equal((await libraryList()).length,alice.length,'Alice own exact documents return after reauthentication');
 check('Actual complete JSON export, teacher/student/guest account isolation and native frame disposal');
 const before=(await libraryList()).length;await savedView();page.once('dialog',dialog=>dialog.accept());await page.locator('[data-worksheet-id='+JSON.stringify(row.id)+'] [data-worksheet-delete]').click();await waitLibraryCount(before-1);assert.equal(await fullEntry(row.id),null);check('Confirmed deletion removes only the selected saved series');
 await page.locator('.worksheet-library-actions input[type=file]').setInputFiles({name:'exacte-kopie.json',mimeType:'application/json',buffer:Buffer.from(json)});await waitLibraryCount(before);
 const importedMeta=(await libraryList()).find(entry=>entry.sourceId===row.sourceId&&entry.code===row.code),imported=await fullEntry(importedMeta.id);assert.equal(imported.questionsHTML,row.questionsHTML);assert.equal(imported.keyHTML,row.keyHTML);assert.deepEqual(imported.data,row.data);check('Actual Kopie terugzetten upload restores the exact generated question/key pair after deletion');
 const archive=await openSaved(imported.id);await archive.viewer.locator('#includeKey').check();const htmlDownload=page.waitForEvent('download');await archive.viewer.locator('#downloadWorksheet').click();const htmlFile=await(await htmlDownload).path(),html=fs.readFileSync(htmlFile,'utf8');
 assert(html.includes('script-src'));assert(!html.includes('<link rel="stylesheet"'),'Worksheet HTML download embeds its supported stylesheet contents');assert(html.includes(row.questionsHTML));assert(html.includes(row.keyHTML));check('Actual standalone HTML export contains both unchanged native documents and embedded styles');
 phase='no forged archive events';const count=(await libraryList()).length;await page.evaluate(()=>window.dispatchEvent(new MessageEvent('message',{origin:'https://evil.example',source:window,data:{type:'leraarbob:worksheets-change',snapshot:{title:'Injected'}}})));assert.equal((await libraryList()).length,count);check('Untrusted postMessage payload cannot add an archived worksheet');
 await standaloneIdentity(imported);
}
async function standaloneIdentity(entry){
 phase='standalone viewer account boundary';const standalone=await context.newPage(),downloads=[];standalone.on('download',download=>downloads.push(download.suggestedFilename()));
 const url=base+'/os/worksheet.html?id='+encodeURIComponent(entry.id);await standalone.goto(url);await standalone.waitForFunction(()=>document.querySelector('#worksheetDocument').contentDocument?.querySelector('.archive-caption'));
 await standalone.evaluate(()=>__qaSwitch('worksheet-alice','teacher',true));assert.equal(await standalone.locator('#worksheetDocument').getAttribute('srcdoc'),'');assert(await standalone.locator('#worksheetDocument').isHidden());
 for(const selector of['#includeKey','#printWorksheet','#downloadWorksheet','#downloadBackup'])assert(await standalone.locator(selector).isDisabled(),'Pending auth clears and locks standalone document '+selector);
 await standalone.reload();await standalone.locator('#downloadWorksheet:not([disabled])').waitFor();let releasePending,enteredPending;const heldPending=new Promise(resolve=>enteredPending=resolve),styleURL=new URL(entry.styles[0],base+'/').href;
 await standalone.route(styleURL,route=>{releasePending=()=>route.continue();enteredPending();});await standalone.locator('#downloadWorksheet').click();await heldPending;
 await standalone.evaluate(()=>__qaSwitch('worksheet-alice','teacher',true));assert.equal(await standalone.locator('#worksheetDocument').getAttribute('srcdoc'),'');await releasePending();
 await standalone.waitForFunction(()=>document.querySelector('#worksheetStatus').textContent.includes('account'));
 assert.equal(downloads.length,0,'A pending account cannot complete a previous-owner export when both current scope and viewer owner have cleared');assert(await standalone.locator('#downloadWorksheet').isDisabled(),'A pending-account export cannot unlock its cleared document');await standalone.unroute(styleURL);
 await standalone.reload();await standalone.locator('#downloadWorksheet:not([disabled])').waitFor();let release,entered;const held=new Promise(resolve=>entered=resolve);
 await standalone.route(new URL(entry.styles[0],base+'/').href,route=>{release=()=>route.continue();entered();});await standalone.locator('#downloadWorksheet').click();await held;
 await standalone.evaluate(()=>__qaSwitch('worksheet-bob','student'));assert.equal(await standalone.locator('#worksheetDocument').getAttribute('srcdoc'),'');await release();
 await standalone.waitForFunction(()=>document.querySelector('#worksheetStatus').textContent.includes('account'));
 assert.equal(downloads.length,0,'The in-flight previous-owner HTML export cannot finish for Bob');assert(await standalone.locator('#downloadWorksheet').isDisabled(),'An async export cannot unlock a cleared previous-owner document');
 assert.equal(await standalone.locator('#worksheetTitle').textContent(),'Account gewijzigd');await standalone.evaluate(()=>__qaSwitch('worksheet-alice','teacher'));await standalone.close();check('Standalone and pending-account viewers clear old pages; in-flight export remains blocked and disabled after owner change');
}
async function blockedStorage(){
 phase='blocked IndexedDB visible native error';const normal=page,broken=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1,reducedMotion:'reduce'});
 await installRoutes(broken);await broken.addInitScript(()=>Object.defineProperty(window,'indexedDB',{value:{open(){throw new DOMException('Local IndexedDB blocked in QA','SecurityError');}},configurable:true}));
 page=await broken.newPage();page.on('pageerror',error=>report.errors.push({phase,message:error.message}));await page.goto(base+'/os/');await page.waitForFunction(()=>window.LeraarBobDesktop?.state().accountId==='worksheet-alice');
 try{
  const frame=await openGenerator(sourceList[0]);await frame.locator(sourceList[0].generate).first().click();await frame.waitForFunction(()=>document.querySelector('[data-worksheet-save-status]')?.textContent.startsWith('Niet bewaard:'));
  const status=await frame.locator('[data-worksheet-save-status]').textContent();assert.match(status,/opslag|toestel|geblokkeerd/i);assert.match(status,/PDF|afdrukken/i);assert((await nativeSnapshot(frame,sourceList[0])).questionsHTML.length>20,'Storage failure retains the actual native generated pages for printing');
  assert(!(await frame.locator('#printWorksheet').isDisabled()),'A storage failure does not disable native printing');await frame.locator('[data-worksheet-save-status]').scrollIntoViewIfNeeded();await shot('storage-blocked-generated-series');
  await page.evaluate(()=>LeraarBobDesktop.showView({kind:'worksheet-saved'}));await page.waitForFunction(()=>document.querySelector('#windowCount').textContent.includes('niet beschikbaar'));assert.match(await page.locator('#viewContent').textContent(),/geblokkeerd|niet beschikbaar|kon niet/i);
  check('Blocked local storage produces visible failed-save and archive errors; native questions and print remain usable');
 }finally{await broken.close();page=normal;}
}
async function printDocuments(){
 phase='actual archived print documents';fs.mkdirSync(path.join(out,'pdf'),{recursive:true});const entries=await libraryList();
 for(const source of sourceList){
  const meta=entries.find(entry=>entry.sourceId===source.id&&entry.topic===(source.topic||source.id.split(':')[1])),entry=await fullEntry(meta.id),html=await page.evaluate(id=>LeraarBobWorksheetLibrary.get(id).then(entry=>LeraarBobWorksheetLibrary.exportHTML(entry)),meta.id),paper=await context.newPage(),url=base+'/os/qa-print-'+meta.id+'.html';
  await paper.route(url,route=>route.fulfill({contentType:'text/html',body:html}));await paper.goto(url);await paper.emulateMedia({media:'print'});await paper.evaluate(()=>document.fonts.ready);
  const print=await paper.evaluate(()=>({questions:[...document.querySelector('main').querySelectorAll('.worksheet-page,.paperPage,.paper,img.paper-page')].filter(element=>!element.closest('.archive-key')).map(element=>({visible:element.getClientRects().length>0,rect:element.getBoundingClientRect().toJSON()})),key:[...document.querySelector('.archive-key').querySelectorAll('.worksheet-page,.paperPage,.paper,img.paper-page')].map(element=>({visible:element.getClientRects().length>0,rect:element.getBoundingClientRect().toJSON()})),captionVisible:document.querySelector('.archive-caption').getClientRects().length>0}));
  assert(print.questions.length>0&&print.questions.every(item=>item.visible&&item.rect.width>100&&item.rect.height>100),source.title+' actual print questions visible');assert(print.key.length>0&&print.key.every(item=>item.visible&&item.rect.width>100&&item.rect.height>100),source.title+' actual print key visible');assert.equal(print.captionVisible,false,'Archive chrome is absent from printed exercise pages');
  const name=source.id.replace(':','-')+(source.topic?'-'+source.topic:''),file=path.join(out,'pdf',name+'.pdf');await paper.pdf({path:file,format:'A4',printBackground:true,preferCSSPageSize:true});assert(fs.statSync(file).size>1000,'Actual print PDF contains document data');
  report.print=report.print||[];report.print.push({sourceId:source.id,topic:entry.topic,pdf:'pdf/'+name+'.pdf',bytes:fs.statSync(file).size,geometry:print,questionsHash:sha(entry.questionsHTML),keyHash:sha(entry.keyHTML)});await paper.close();
 }
 check('Nine actual saved question/key documents print visibly and export to A4 PDF with original page content');
}
async function installRoutes(target){
  await target.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==base&&!['blob:','data:','about:'].includes(url.protocol)){report.remoteRequests.push({url:url.href,method:route.request().method()});return route.abort();}
   if(url.pathname.endsWith('/axioma-auth.js'))return route.fulfill({contentType:'text/javascript',body:`(()=>{const listeners=[];let id=localStorage.getItem('qa-worksheet-account')||'worksheet-alice',role=localStorage.getItem('qa-worksheet-role')||'teacher';let account=localStorage.getItem('qa-worksheet-account')===''?null:{id,role,alias:'Fictief '+id};const client={rpc:async()=>({data:[],error:null}),from:()=>{const q={select:()=>q,eq:()=>q,order:()=>q,maybeSingle:async()=>({data:null,error:null}),then:fn=>Promise.resolve(fn({data:[],error:null}))};return q;},functions:{invoke:async()=>({data:null,error:{message:'No production call in worksheet QA'}})}};window.AxiomaAuth={CLASSES:['TEST'],ready:async()=>({account,pending:false}),getAccount:async()=>account,getSnapshot:()=>({account,pending:false}),getSession:async()=>null,configured:()=>true,client:()=>client,onChange:fn=>{listeners.push(fn);return()=>{};},onStateChange:()=>()=>{}};window.__qaSwitch=(nextId,nextRole='teacher',pending=false)=>{account=nextId?{id:nextId,role:nextRole,alias:'Fictief '+nextId}:null;localStorage.setItem('qa-worksheet-account',nextId||'');localStorage.setItem('qa-worksheet-role',nextRole);listeners.forEach(fn=>fn({account,pending}));};})();`});
   if(url.pathname.endsWith('/axioma-progress.js'))return route.fulfill({contentType:'text/javascript',body:"window.AxiomaProgress={load:async()=>null,save:async()=>({status:'saved',revision:1}),loadOverview:async()=>({accountId:(await AxiomaAuth.getAccount())?.id||null,games:[],trainer:null,numbers:null,errors:{games:false,trainer:false,numbers:false}})};"});
   return route.continue();
  });
}
async function main(){
 fs.mkdirSync(out,{recursive:true});await new Promise(resolve=>host.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+host.address().port;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.LB_CHROMIUM||(fs.existsSync('/opt/brave.com/brave/brave')?'/opt/brave.com/brave/brave':undefined),args:['--no-sandbox','--disable-dev-shm-usage']});report.browser=await browser.version();
  context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1,reducedMotion:'reduce',acceptDownloads:true});
  await installRoutes(context);
  page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>report.errors.push({phase,message:error.message}));page.on('response',response=>{if(response.status()===404)report.missing.push(response.url());});
  await page.goto(base+'/os/');await page.waitForFunction(()=>window.LeraarBobDesktop?.state().accountId==='worksheet-alice'&&window.LeraarBobWorksheetLibrary);
  await generation();await folderLayouts();await accountsExportsFailures();await blockedStorage();await printDocuments();assert.deepEqual(report.errors,[],'No browser exceptions');assert.deepEqual(report.missing,[],'No missing source assets');report.passed=true;console.log('PASS worksheet browser: '+report.checks.length+' interaction groups, '+report.layout.length+' measured targets, '+report.sources.length+' actual native generator captures');
 }catch(error){report.failure={phase,message:error.message,stack:error.stack};await shot('failure').catch(()=>{});throw error;}
 finally{recordEvidence();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();host.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
