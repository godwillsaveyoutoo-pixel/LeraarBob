'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{start}=require('../scripts/serve-rechten-entry-preview.cjs');
const out=process.env.STELSELS_EXPERT_PROOF||'/tmp/leraarbob-stelsels-expert';fs.mkdirSync(out,{recursive:true});
const report={scope:'Original Stelsels trainer in the OS; local fixture account; actual keypad and pointer/keyboard/touch interactions',checks:[],errors:[],missing:[]};
(async()=>{
 const server=await start({port:0});let browser,page,frame;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.LB_CHROMIUM||(fs.existsSync('/opt/brave.com/brave/brave')?'/opt/brave.com/brave/brave':undefined),args:['--no-sandbox','--disable-dev-shm-usage']});
  const ctx=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1,hasTouch:true,reducedMotion:'reduce'});
  await ctx.route('**/*',r=>new URL(r.request().url()).origin===server.base?r.continue():r.abort());
  page=await ctx.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()===404)report.missing.push(r.url());});page.on('dialog',d=>d.accept());
  await page.goto(server.base+'/os/?previewUser=alex');await page.waitForFunction(()=>LeraarBobDesktop?.state().accountId);await page.evaluate(()=>LeraarBobDesktop.openApp('stelsels'));
  frame=await(await page.locator('.frame-wrapper:not([hidden])>iframe').elementHandle()).contentFrame();
  await frame.locator('button[data-method=substitution]').click();await frame.locator('button[data-study-mode=expert]').click();
  async function field(id,value){await frame.locator('[data-editor="'+id+'"]').click();await frame.locator('[data-ekey=C]').click();for(const key of value)await frame.locator('[data-ekey="'+key+'"]').click();}
  async function setup(index,variable,value){await frame.locator('#exerciseSelect').selectOption({value:String(index)});await frame.locator('[data-isovar='+variable+']').click();await field('isoRhs',value);await frame.locator('#expertCheck').click();await frame.locator('#expertSubSource').waitFor();}
  async function measure(){
   assert.equal(await frame.locator('#expertSubTarget').count(),1,'The substitute variable must be rendered as an actual target');
   const detail=await frame.locator('#expertSubTarget').evaluate(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {width:r.width,height:r.height,inside:r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,hit:hit===n||n.contains(hit),background:s.backgroundColor,outline:s.outlineStyle,outlineWidth:s.outlineWidth,label:n.getAttribute('aria-label')};});
   assert(detail.width>=44&&detail.height>=44&&detail.inside&&detail.hit,JSON.stringify(detail));assert.equal(detail.outline,'dashed');assert.notEqual(detail.background,'rgba(0, 0, 0, 0)');assert(detail.label);return detail;
  }
  async function drag(source,target){const a=await frame.locator(source).boundingBox(),b=await frame.locator(target).boundingBox();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:12});await page.mouse.up();}
  const inserted=()=>frame.locator('.expert-sub-inserted');
  // Exact exercise from the report: x - 3y = -5; 2x + y = 4; y = 4 - 2x.
  await setup(6,'y','4-2x');await measure();await page.screenshot({path:path.join(out,'expert-substitution-target.png')});
  await drag('#expertSubSource','.expert-original');assert.equal(await inserted().count(),0);assert.match(await frame.locator('#toast').innerText(),/groene doel/);
  await drag('#expertSubSource','#expertSubTarget');assert.equal(await inserted().innerText(),'(4−2x)');assert.match(await frame.locator('.expert-sub-equation').innerText(),/−/);assert.equal(await frame.locator('[data-editor=subL]').count(),1);assert.equal(await frame.locator('#toast').innerText(),'');
  report.checks.push('Reported exercise 7: wrong drop does not advance; real mouse drag onto y produces x − 3(4−2x) = −5 and opens simplification');
  await frame.locator('#undoBtn').click();await measure();await frame.locator('#expertSubSource').click();assert(await frame.locator('#expertSubTarget').evaluate(n=>n.classList.contains('ready')));await frame.locator('#expertSubTarget').click();assert.equal(await inserted().innerText(),'(4−2x)');
  await frame.locator('#undoBtn').click();await frame.locator('#expertSubSource').focus();await page.keyboard.press('Enter');await frame.locator('#expertSubTarget').focus();await page.keyboard.press('Space');assert.equal(await inserted().innerText(),'(4−2x)');
  report.checks.push('Undo restores the expression/target; click-click and keyboard Enter/Space both substitute correctly');
  await field('subL','7x-12');await field('subR','-5');await frame.locator('#expertCheck').click();await field('solveVal','1');await frame.locator('#expertCheck').click();await field('otherVal','2');await frame.locator('#expertCheck').click();
  assert.match(await frame.locator('.expert-final').innerText(),/1,\s*2/);assert((await frame.evaluate(()=>AxiomaGame.state.completed)).map(String).includes('6'));
  report.checks.push('Exercise 7 completes through simplification, x = 1, y = 2 and native completed-unit registration');
  for(const test of [{index:6,variable:'x',expression:'3y-5',term:'2'},{index:4,variable:'x',expression:'1+y',term:'fraction'}]){
   await setup(test.index,test.variable,test.expression);await measure();assert.equal(await frame.locator('#expertSubTarget').innerText(),test.variable);if(test.term==='fraction')assert.equal(await frame.locator('.expert-sub-equation .frac').count(),1);await drag('#expertSubSource','#expertSubTarget');assert.equal(await inserted().count(),1);
   report.checks.push('x substitution retains its '+test.term+' coefficient in exercise '+(test.index+1));
  }
  await setup(6,'y','4-2x');
  for(const size of [{width:1366,height:768},{width:640,height:360}]){await page.setViewportSize(size);for(const collapsed of [false,true]){await page.evaluate(c=>LeraarBobTopbar.setCollapsed(c,true),collapsed);await frame.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await measure();report.checks.push('Visible 44px target at '+size.width+' × '+size.height+', collapsed='+collapsed);}}
  await page.setViewportSize({width:1366,height:768});await page.evaluate(()=>LeraarBobTopbar.setCollapsed(false));await page.locator('#minimizeApp').click();await page.getByRole('button',{name:'Terug naar Stelsels',exact:true}).click();await measure();assert.equal(await frame.locator('#expertSubSource').textContent(),'4−2x');
  await frame.locator('#expertSubSource').tap();await frame.locator('#expertSubTarget').tap();assert.equal(await inserted().innerText(),'(4−2x)');await page.screenshot({path:path.join(out,'expert-substitution-inserted.png')});report.checks.push('Minimize/resume keeps the exact expression; two touch taps substitute correctly');
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.missing,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log('PASS',report.checks.length,'Stelsels expert substitution checks');
 }catch(error){if(page&&!page.isClosed())await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({message:error.message,report},null,2));throw error;}
 finally{await browser?.close();await server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
