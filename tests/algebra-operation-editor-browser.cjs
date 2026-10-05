'use strict';
// Real editor and native saves; external requests are blocked and no account is used.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),C=require('../games/algebra-trainer/core.js'),J=require('../games/algebra-trainer/journey-core.js'),W=require('../games/algebra-trainer/workbench-core.js');
const root=path.resolve(__dirname,'..');
const out=process.env.ALGEBRA_SCREENSHOTS||'/tmp/algebra-operation-editor';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const server=http.createServer((req,res)=>{
  let file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!fs.existsSync(file)){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.ALGEBRA_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.fulfill({body:''}));
  await page.goto('http://127.0.0.1:'+server.address().port+'/games/algebra-trainer/');await page.waitForFunction(()=>window.AlgebraTrainer);await page.clock.install();
  async function load(run,index=0){
   const fixture={version:1,runs:{[run.skill]:run},chapterJourney:J.normalize(null),mission:run.skill,activeSet:run.tasks.map(t=>t.ex),trainerIndex:index,perExercise:{},screen:'trainer',settings:{allowFractions:true,allowDecimals:false,allowNegative:true}};
   await page.evaluate(f=>AxiomaGame.storage.setItem('leraarbob.algebra.v1',JSON.stringify(f)),fixture);await page.reload();await page.waitForSelector('#trainerScreen:not(.hidden)');await page.clock.runFor(700);await page.evaluate(()=>document.fonts.ready);
  }
  const work=()=>page.evaluate(()=>JSON.stringify(AlgebraTrainer.snapshot().trainerStates));
  const result=()=>page.evaluate(()=>{const s=AlgebraTrainer.snapshot();return s.learningRun.results[s.trainerIndex];});
  const input=side=>page.locator('[data-answer-name='+side+']').getAttribute('data-math-tex');
  async function visibleMath(name){
   const bad=await page.locator('#givenEquation .katex-html,.derivationMath .katex-html,.fractionMath .katex-html,.touchFieldMath .katex-html').evaluateAll(es=>es.filter(e=>e.getClientRects().length).filter(e=>{
    const range=document.createRange();range.selectNodeContents(e);const r=range.getBoundingClientRect();
    for(let p=e.parentElement;p&&p.id!=='trainerScreen';p=p.parentElement){const s=getComputedStyle(p),b=p.getBoundingClientRect();if(/hidden|auto|scroll|clip/.test(s.overflowY)&&(r.top<b.top-1||r.bottom>b.bottom+1))return true;if(/hidden|auto|scroll|clip/.test(s.overflowX)&&(r.left<b.left-1||r.right>b.right+1))return true;}
    return false;
   }).map(e=>e.textContent));assert.deepEqual(bad,[],name+' formula glyphs remain fully visible');
  }
  const independent=J.mission('route-inverse',110);await load(independent,2);
  assert.equal(independent.tasks[2].guided,false);assert.equal(await page.locator('#contextOperations').isVisible(),true,'Independent solving uses the same full-action menu');
  const contextCount=await page.locator('.contextOp').count();assert(contextCount>=2&&contextCount<=6);
  assert.equal(contextCount,W.contextOperations(independent.tasks[2].ex,independent.tasks[2].ex.start).length);
  assert(await page.locator('.contextOp').first().locator('.choiceLabel').textContent());
  const contrast=await page.locator('.contextOp').evaluateAll(es=>es.map(e=>{
   const style=getComputedStyle(e),luminance=text=>{
    const values=text.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return values[0]*.2126+values[1]*.7152+values[2]*.0722;
   },front=luminance(style.color),back=luminance(style.backgroundColor);
   return {kind:e.dataset.opKind,label:parseFloat(getComputedStyle(e.querySelector('.choiceLabel')).fontSize),ratio:(Math.max(front,back)+.05)/(Math.min(front,back)+.05)};
  }));
  assert(contrast.every(c=>['add','subtract','multiply','divide'].includes(c.kind)&&c.label>=13&&c.ratio>=4.5),'Semantic operation labels have readable type and contrast');
  await page.screenshot({path:path.join(out,'context-1280-light.png')});
  await page.evaluate(()=>document.documentElement.dataset.mode='dark');await page.screenshot({path:path.join(out,'context-1280-dark.png')});await page.evaluate(()=>document.documentElement.dataset.mode='light');
  const before=await work();
  await page.evaluate(()=>document.querySelector('leraarbob-topbar').shadowRoot.querySelector('.account').focus());assert.equal(await page.evaluate(()=>document.activeElement.tagName),'LERAARBOB-TOPBAR');await page.keyboard.press('1');assert.equal(await work(),before,'Account/topbar keyboard input never applies an exercise shortcut');
  await page.evaluate(()=>{document.querySelector('leraarbob-topbar').shadowRoot?.activeElement?.blur();document.activeElement?.blur();});await page.keyboard.press('+');
  assert.equal(await page.locator('#manualOperations').getAttribute('data-stage'),'operand');assert.equal(await page.locator('#manualOperations .ops').isVisible(),false);
  assert.equal(await page.locator('#valueGrid button').count(),6);assert.match(await page.locator('#valueChoiceLabel').textContent(),/Wat tel je op/);
  for(const [width,height] of [[1280,800],[780,360],[390,844],[320,700]]){
   await page.setViewportSize({width,height});await page.clock.runFor(40);
   const controls=page.locator('#manualOperations button:visible,#moreOperationsBtn:visible');
   for(let i=0;i<await controls.count();i++){
    const control=controls.nth(i);await control.scrollIntoViewIfNeeded();
    assert.equal(await control.evaluate(e=>{const r=e.getBoundingClientRect();return r.width>=43.9&&r.height>=43.9&&r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),true,width+'×'+height+' reachable operand control '+await control.textContent());
   }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),true,'Only the rail may scroll');
   await page.screenshot({path:path.join(out,'custom-operand-'+width+'x'+height+'.png')});
  }
  await page.locator('#changeOperationBtn').click();assert.equal(await page.locator('#manualOperations .ops').isVisible(),true);assert.equal(await work(),before,'Changing the menu preserves the equation');
  await page.keyboard.press('/');const chosen=await page.locator('#valueGrid button').first().getAttribute('data-index');assert.equal(chosen,'0');
  await page.keyboard.press('1');await page.clock.runFor(5000);assert.notEqual(await work(),before,'A numbered choice applies one real equation operation');await visibleMath('320 portrait current equation after a step');
  await page.keyboard.press('Backspace');assert.equal(await work(),before,'Keyboard undo restores the real prior equation');
  console.log('PASS independent/context and staged custom operations, six choices, keyboard apply/undo, four viewports');

  const signed=J.mission('route-sign',111),t=signed.tasks[2],start=C.EQ(C.Add(C.Mul(C.N(-7),C.V()),C.N(2)),C.N(-19)),operation={op:'-',operand:C.N(2)};
  t.kind='predict';t.ex={...t.ex,start,solution:C.R(3),states:[start],steps:[operation],policy:{allowNegative:true}};t.operation=operation;t.expected=C.applyEquation(start,operation.op,operation.operand);
  await load(signed,2);await page.keyboard.press('-');
  const negative=C.exprSig(C.Mul(C.N(-7),C.V())),tile=page.locator('[data-term="'+negative+'"]');
  assert.match(await tile.locator('.choiceMath').textContent(),/7x/);assert.match(await tile.locator('.signPreview').textContent(),/− \(−?\s*-?7x\) = 7x/);
  const index=Number(await tile.getAttribute('data-term-index'));await page.keyboard.press(String(index+1));assert.equal(await input('lhs'),'7x','Subtracting a negative inserts the displayed positive term');
  await page.screenshot({path:path.join(out,'signed-input-320.png')});
  await page.keyboard.press('r');assert.equal(await page.locator('[data-edit-field=rhs]').getAttribute('aria-pressed'),'true');
  await page.keyboard.press('l');await page.keyboard.press('-');const partial=await result();await page.reload();await page.waitForSelector('#trainerScreen:not(.hidden)');assert.deepEqual(await result(),partial,'Pending sign and partial expression survive reload');
  assert.match(await input('lhs'),/7x - \\square/);await page.keyboard.press('=');assert.equal(await page.locator('[data-edit-field=rhs]').getAttribute('aria-pressed'),'true');
  console.log('PASS signed variable preview, exact double-negative insertion, L/R/=, partial save and reload');

  const fractions=J.mission('route-fractions',112);await load(fractions);
  await visibleMath('320 portrait fraction start');
  const initial=await page.evaluate(()=>JSON.stringify(AlgebraTrainer.snapshot().learningRun.results[0].fraction.current));
  await page.keyboard.press('2');assert.equal(await page.locator('[data-fraction-back]').isVisible(),true);await page.locator('[data-fraction-back]').click();
  assert.equal(await page.evaluate(()=>JSON.stringify(AlgebraTrainer.snapshot().learningRun.results[0].fraction.current)),initial);
  await page.keyboard.press('1');const common=await page.evaluate(()=>AlgebraFractions.common(AlgebraTrainer.snapshot().learningRun.results[0].fraction.current));
  const position=await page.locator('[data-fraction-number]').evaluateAll((es,n)=>es.findIndex(e=>Number(e.dataset.fractionNumber)===n),common);assert(position>=0);
  await page.keyboard.press(String(position+1));assert.equal(await page.locator('[data-fraction-field=lhs]').isVisible(),true);await page.keyboard.press('r');assert.equal(await page.locator('[data-fraction-field=rhs]').getAttribute('aria-pressed'),'true');
  await require('./algebra-v045-fraction-controls.cjs').fill(page);await visibleMath('320 portrait complete fraction input');
  const sizes=await page.locator('[data-fraction-field]').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return [r.width,r.height];}));assert(sizes.every(([w,h])=>w>=44&&h>=44),'Fraction input fields keep accessible touch targets');await page.screenshot({path:path.join(out,'fraction-input-320.png')});
  console.log('PASS fraction route back preserves work and numeric/side keyboard choices use the real fraction flow');

  await page.setViewportSize({width:780,height:360});let directSteps=0,customSteps=0;
  for(const type of C.TYPES){
   const run=J.mission('route-inverse',813),ex=C.generateSeeded(type.id,{allowFractions:true,allowDecimals:true,allowNegative:true},0,714);run.tasks[2]={...run.tasks[2],kind:'solve',ex};await load(run,2);
   for(const step of ex.steps){
    if(await page.locator('#nextBox').isVisible())break;
    const label=(step.op==='*'?'·':step.op==='/'?'÷':step.op==='-'?'−':'+')+' '+C.fallbackText(C.latexExpr(step.operand,ex.policy))+' op beide leden';
    const context=page.locator('.contextOp[aria-label='+JSON.stringify(label)+']');
    if(await context.count()){await context.click();directSteps++;}
    else{
     await page.locator('#moreOperationsBtn').click();await page.locator('.opBtn[data-op='+JSON.stringify(step.op)+']').click();let found=false;
     for(let p=0;p<20;p++){
      const value=page.locator('#valueGrid button[aria-label='+JSON.stringify(label)+']');
      if(await value.count()){await value.click();found=true;customSteps++;break;}
      assert.equal(await page.locator('#nextValuesBtn').isEnabled(),true,type.id+' canonical operand remains available');await page.locator('#nextValuesBtn').click();
     }
     assert.equal(found,true,type.id+' canonical operand can be selected');
    }
    await page.clock.runFor(5000);
   }
   assert.equal(await page.locator('#nextBox').isVisible(),true,type.id+' solves through real context/custom controls');assert.equal(await page.locator('.katex-error').count(),0);
  }
  assert.deepEqual(errors,[]);console.log('PASS all '+C.TYPES.length+' equation types solve through real controls ('+directSteps+' contextual and '+customSteps+' custom steps)');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
