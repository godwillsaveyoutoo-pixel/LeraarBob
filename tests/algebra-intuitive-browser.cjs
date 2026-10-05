'use strict';
// Independent real-control regression: fictitious account, local assets only.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright'),{solveTask}=require('./algebra-journey-controls.cjs');
const root=path.resolve(__dirname,'..'),out=process.env.ALGEBRA_INTUITIVE_OUTPUT||'/tmp/algebra-intuitive-browser';
fs.mkdirSync(out,{recursive:true});
const reports=[];
const server=http.createServer((req,res)=>{
 let f=path.join(root,new URL(req.url,'http://local').pathname);
 try{if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}
 catch{res.writeHead(404).end();}
});
const auth=`window.AxiomaAuth={ready:async()=>({account:{id:'intuitive-qa',role:'student',alias:'QA leerling'},pending:false}),getAccount:async()=>({id:'intuitive-qa',role:'student',alias:'QA leerling'}),getSession:async()=>null,onChange:()=>()=>{},client:()=>({rpc:async()=>({data:null,error:null}),auth:{}})};`;
const progress=`window.AxiomaProgress={load:async()=>null,save:async(g,s,r)=>({status:'saved',revision:r+1})};`;
async function main(){
 const publicBase=process.env.ALGEBRA_PUBLIC_URL?.replace(/\/$/,'');
 if(!publicBase)await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=publicBase||'http://127.0.0.1:'+server.address().port,origin=new URL(base).origin;
 const browser=await chromium.launch({headless:true,executablePath:process.env.ALGEBRA_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{for(const [width,height] of [[1280,800],[390,844],[320,700],[780,360],[640,360]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true}),page=await context.newPage(),errors=[],missing=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)missing.push(r.url());});
  await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==origin)return r.fulfill({body:''});
   if(u.pathname.endsWith('/shared/axioma-auth.js'))return r.fulfill({contentType:'text/javascript',body:auth});
   if(u.pathname.endsWith('/shared/axioma-progress.js'))return r.fulfill({contentType:'text/javascript',body:progress});
   if(u.pathname.endsWith('/axioma-social.js'))return r.fulfill({contentType:'text/javascript',body:'window.AxiomaSocial={state:()=>({}),onChange:()=>()=>{}};'});
   return r.request().method()==='GET'?r.continue():r.fulfill({body:''});
  });
  const ready=()=>page.waitForFunction(()=>window.AxiomaGame?.active&&(window.StelselsTrainer||window.AlgebraTrainer));
  const blur=()=>page.evaluate(()=>document.activeElement?.blur());
  const system=()=>page.evaluate(()=>{const s=StelselsTrainer.snapshot(),w=s.work[s.exercises[s.index].id];return {equations:StelselsCore.systemTex(w.steps.at(-1).system),steps:w.steps.length,pending:w.pending?StelselsCore.systemTex(w.pending.system):null,phase:w.phase,controls:w.controls};});
  async function screenshot(label){await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(out,label+'-'+width+'.png'),fullPage:true});}
  async function layout(label){
   await page.evaluate(()=>document.fonts.ready);
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const report=await page.evaluate(()=>{
    const scope=document.querySelector('body[data-screen=work] #work,body[data-screen=trainer] #trainerScreen'),restore=document.querySelector('.lb-restore:not([hidden])'),bad=[];
    const intersects=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    if(document.documentElement.scrollWidth>innerWidth+1)bad.push('page overflows horizontally');
    const goal=document.querySelector('#systemGoal'),methods=document.querySelector('.method-tabs');
    if(goal?.getClientRects().length&&methods?.getClientRects().length&&intersects(goal.getBoundingClientRect(),methods.getBoundingClientRect()))bad.push('system goal overlaps methods');
    const controls=[...scope.querySelectorAll('button,input:not([type=hidden]),select')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');
    const measurements=controls.map(e=>{const r=e.getBoundingClientRect();return {id:e.id,name:e.getAttribute('aria-label')||e.textContent.trim(),width:r.width,height:r.height,font:parseFloat(getComputedStyle(e).fontSize)};});
    measurements.forEach(e=>{if(e.width<43.5||e.height<43.5)bad.push('small target '+e.id+' '+e.name);});
    const math=[...scope.querySelectorAll('.currentRows .systemMath')].filter(e=>e.getClientRects().length).map(e=>({id:e.id,visibleWidth:e.clientWidth,mathWidth:e.scrollWidth,font:parseFloat(getComputedStyle(e.querySelector('.katex')).fontSize)}));
    math.forEach(e=>{if(e.mathWidth>e.visibleWidth+1)bad.push('current equation needs horizontal scrolling '+e.id);});
    const currentMath=scope.querySelector('.derivationLine.current .katex-html'),stack=scope.querySelector('.derivationStack');
    let currentEquation=null;
    if(currentMath?.getClientRects().length&&stack?.getClientRects().length){
     // A KaTeX strut includes unpainted font leading. Measure actual glyph ink,
     // so clipping checks fail for missing symbols, not empty descender space.
     const canvas=document.createElement('canvas').getContext('2d'),walker=document.createTreeWalker(currentMath,NodeFilter.SHOW_TEXT);let node,top=Infinity,bottom=-Infinity;
     while((node=walker.nextNode())){if(!node.textContent.trim())continue;const style=getComputedStyle(node.parentElement),range=document.createRange();range.selectNodeContents(node);const r=range.getBoundingClientRect();if(!r.width||!r.height)continue;
      canvas.font=style.fontStyle+' '+style.fontWeight+' '+style.fontSize+' '+style.fontFamily;const m=canvas.measureText(node.textContent),height=m.fontBoundingBoxAscent+m.fontBoundingBoxDescent,scale=height?r.height/height:1,baseline=r.top+m.fontBoundingBoxAscent*scale;
      top=Math.min(top,baseline-m.actualBoundingBoxAscent*scale);bottom=Math.max(bottom,baseline+m.actualBoundingBoxDescent*scale);
     }
     const s=stack.getBoundingClientRect();currentEquation={mathTop:top,mathBottom:bottom,viewportTop:s.top,viewportBottom:s.bottom};if(top<s.top-1||bottom>s.bottom+1)bad.push('current equation is vertically clipped');
    }
    if(restore){const r=restore.getBoundingClientRect();if(r.width<44||r.height<44||r.top<0||r.bottom>innerHeight+1)bad.push('restore is not reachable');controls.forEach(e=>{if(intersects(e.getBoundingClientRect(),r))bad.push('restore covers '+(e.id||e.textContent.trim()));});}
    return {bad,measurements,math,currentEquation,bodyHeight:document.body.scrollHeight,viewport:[innerWidth,innerHeight]};
   });
   reports.push({label,width,height,...report});await screenshot(label);assert.deepEqual(report.bad,[],label+' '+width+'×'+height);
  }
  await page.goto(base+'/games/algebra-trainer/stelsels.html?topic=sys-substitution');await ready();
  assert.equal(await page.locator('#operand').inputValue(),'','A new command starts empty');
  assert.equal(await page.locator('[data-phase=substitute]').isVisible(),false,'Invullen appears only when an unknown can be substituted');
  assert.equal(await page.locator('[data-phase=combine]').isVisible(),false,'Substitution does not show combination controls');
  assert.equal(await page.locator('#operation').isVisible(),false);assert.equal(await page.locator('#term').isVisible(),false);assert.equal(await page.locator('#toolPhase').isVisible(),false);
  const initial=await system();await layout('systems-ready');
  await page.locator('#systemHelpBtn').click();assert(await page.locator('#toolAdvice').isVisible());assert(await page.locator('#operand').isVisible(),'An explanation keeps the relevant command controls');assert.equal((await system()).equations,initial.equations);await page.locator('#systemHelpBtn').click();
  for(const command of [
   {text:'-y',op:'-',n:1,d:1,term:'y',readout:/Trek y af/},
   {text:'-1/2y',op:'-',n:1,d:2,term:'y',readout:/Trek 1\/2y af/},
   {text:'+3x',op:'+',n:3,d:1,term:'x',readout:/Tel 3x op/},
   {text:'÷2',op:'/',n:2,d:1,term:'c',readout:/Deel beide leden door 2/},
   {text:'×-2',op:'*',n:-2,d:1,term:'c',readout:/Vermenigvuldig beide leden met -2/}
  ]){
   const expected=await page.evaluate(c=>{const s=StelselsTrainer.snapshot(),w=s.work[s.exercises[s.index].id],C=StelselsCore;return C.systemTex(C.operate(w.steps.at(-1).system,0,c.op,C.R(c.n,c.d),c.term));},command);
   await page.locator('#operand').fill(command.text);assert.match(await page.locator('#operationReadout').textContent(),command.readout);
   await page.locator('#operand').press('Enter');assert(await page.locator('#preview').isVisible(),command.text+' opens preview');
   assert.equal(await page.evaluate(()=>document.activeElement.id),'apply','Enter places focus on confirmation');
   assert.equal((await system()).pending,expected,command.text+' has the written effect on both sides');
   await page.keyboard.press('Enter');assert.equal((await system()).equations,expected,command.text+' confirms with Enter');
   assert.equal((await system()).steps,initial.steps+1);
   if(command.text==='-y'){
    await page.locator('#systemHistoryBtn').click();await page.locator('#systemHistoryPrev').click();
    assert.equal(await page.locator('#systemHistoryMath annotation').textContent(),initial.equations,'The start system remains readable in Steps');
    await page.locator('#systemHistoryBack').click();assert.equal((await system()).equations,expected,'Reviewing the start does not change the current system');
   }
   await page.locator('#undo').click();assert.equal((await system()).equations,initial.equations,'Undo restores the original system');
  }
  // Variable buttons and sign toggle build the same explicit command as typing.
  await page.locator('#operand').fill('');await page.locator('[data-op="-"]').tap();await page.locator('[data-term-key=y]').tap();
  assert.equal(await page.locator('#operand').inputValue(),'-y');assert.match(await page.locator('#operationReadout').textContent(),/Trek y af/);
  await page.locator('[data-sign-key]').tap();assert.equal(await page.locator('#operand').inputValue(),'+y');
  await page.locator('[data-op="+"]').click();await page.locator('#operand').fill('y');assert.match(await page.locator('#operationReadout').textContent(),/Tel y op/);
  await page.locator('#operand').fill('÷y');await page.locator('#previewOperation').click();
  assert.equal(await page.locator('#preview').isVisible(),false);assert.equal((await system()).equations,initial.equations);assert.match(await page.locator('#workStatus').textContent(),/deel door een getal/i);
  await page.locator('#operand').fill('-y');assert.equal(await page.locator('#workStatus').textContent(),'','Editing an invalid command clears its stale error');await page.locator('#previewOperation').scrollIntoViewIfNeeded();await screenshot('systems-command');
  const isolate=await page.evaluate(()=>{const s=StelselsTrainer.snapshot(),w=s.work[s.exercises[s.index].id],C=StelselsCore;return C.operationText('-',w.steps.at(-1).system[0].l.y,'y');});
  await page.locator('#operand').fill(isolate);await page.locator('#operand').press('Enter');await page.keyboard.press('Enter');
  assert.equal(await page.locator('[data-phase=substitute]').isEnabled(),true,'Invullen becomes available after isolation');
  await page.locator('[data-phase=substitute]').click();assert.equal(await page.locator('#operationControls').isVisible(),false);
  assert.equal(await page.locator('#previewSubstitution').isEnabled(),true);await page.locator('#previewSubstitution').click();assert(await page.locator('#preview').isVisible());await layout('systems-substitution');
  await page.locator('#cancel').click();await page.locator('#undo').click();
  // Presentation changes preserve incomplete typed commands, then pending steps.
  await page.locator('#operand').fill('-1/');const partialWork=await page.evaluate(()=>StelselsTrainer.snapshot().work);
  assert.equal(await page.locator('leraarbob-topbar .collapse').getAttribute('aria-expanded'),'true');
  await page.locator('leraarbob-topbar .collapse').click();assert.deepEqual(await page.evaluate(()=>StelselsTrainer.snapshot().work),partialWork);
  assert.equal(await page.locator('.lb-restore').getAttribute('aria-expanded'),'false');assert(await page.locator('.lb-restore').getAttribute('aria-label'));
  await layout('systems-collapsed-partial');await page.evaluate(()=>AxiomaGame.flush());await page.reload();await ready();
  assert(await page.locator('.lb-restore').isVisible());assert.equal(await page.locator('#operand').inputValue(),'-1/');assert.deepEqual(await page.evaluate(()=>StelselsTrainer.snapshot().work),partialWork);
  await page.locator('.lb-restore').click();await page.locator('#operand').fill('-y');await page.locator('#operand').press('Enter');
  const pendingWork=await page.evaluate(()=>StelselsTrainer.snapshot().work);await page.locator('leraarbob-topbar .collapse').click();await page.evaluate(()=>AxiomaGame.flush());await page.reload();await ready();
  assert(await page.locator('#preview').isVisible());assert.deepEqual(await page.evaluate(()=>StelselsTrainer.snapshot().work),pendingWork);await layout('systems-collapsed-preview');await page.locator('.lb-restore').click();await page.locator('#cancel').click();
  // A real legacy saved draft encoded subtracting a negative y. It must keep that effect.
  await page.evaluate(()=>{const key='leraarbob.stelsels.workshop.v1',s=JSON.parse(AxiomaGame.storage.getItem(key)),id=s.exercises[s.index].id;s.work[id].controls={operation:'-',operand:'-1',term:'y'};AxiomaGame.storage.setItem(key,JSON.stringify(s));return AxiomaGame.flush();});
  await page.reload();await ready();assert.equal(await page.locator('#operand').inputValue(),'+y');assert.match(await page.locator('#operationReadout').textContent(),/Tel y op/);
  const legacyExpected=await page.evaluate(()=>{const s=StelselsTrainer.snapshot(),w=s.work[s.exercises[s.index].id],C=StelselsCore;return C.systemTex(C.operate(w.steps.at(-1).system,0,'+',C.R(1),'y'));});
  await page.locator('#previewOperation').click();assert.equal((await system()).pending,legacyExpected);await page.locator('#cancel').click();
  // A combination method exposes its own controls, then the substitution layout returns.
  await page.locator('[data-method=combination]').click();assert(await page.locator('[data-phase=combine]').isVisible());await page.locator('[data-phase=combine]').click();
  assert.equal(await page.locator('#combinationTools').isVisible(),true);assert.equal(await page.locator('#operationControls').isVisible(),false);await layout('systems-combination');
  await page.locator('[data-method=substitution]').click();
  if(width===390){await page.locator('leraarbob-topbar .theme-toggle').click();assert.equal(await page.locator('html').getAttribute('data-mode'),'dark');await layout('systems-dark');await page.locator('leraarbob-topbar .theme-toggle').click();}
  await page.goto(base+'/games/algebra-trainer/');await ready();await page.clock.install();
  await page.locator('[data-menu-stop=route-two]').click();await page.locator('.menuContinue').click();await page.waitForSelector('#trainerScreen:not(.hidden)');
  assert(await page.locator('.contextOp').count());assert((await page.locator('.contextOp .choiceLabel').allTextContents()).every(s=>s.trim().length>0));
  await layout('equations-context');
  const baselineEquation=await page.evaluate(()=>AlgebraTrainer.snapshot().trainerStates);
  await page.locator('.contextOp').first().click();await page.clock.runFor(5000);const directEquation=await page.evaluate(()=>AlgebraTrainer.snapshot().trainerStates);
  await layout('equations-after-step');
  await blur();await page.keyboard.press('Backspace');await page.clock.runFor(5000);assert.deepEqual(await page.evaluate(()=>AlgebraTrainer.snapshot().trainerStates),baselineEquation);
  await blur();await page.keyboard.press('1');await page.clock.runFor(5000);assert.deepEqual(await page.evaluate(()=>AlgebraTrainer.snapshot().trainerStates),directEquation,'Shortcut 1 is the first visible context action');
  await blur();await page.keyboard.press('Backspace');await page.clock.runFor(5000);
  await page.locator('#moreOperationsBtn').click();assert.equal(await page.locator('#contextOperations').isVisible(),false);
  await page.locator('.opBtn[data-op="-"]').click();assert(await page.locator('#valueGrid .valueBtn').count()>0);assert(await page.locator('#valueGrid .valueBtn').count()<=6,'At most six operand choices per page');
  assert.equal(await page.locator('#manualOperations .opBtn').first().isVisible(),false,'Choose an operation, then its value');await layout('equations-manual');
  await page.locator('#changeOperationBtn').click();assert(await page.locator('#manualOperations .opBtn').first().isVisible());assert.equal(await page.locator('#valueGrid').isVisible(),false);
  await page.locator('#moreOperationsBtn').click();
  // Reach the production task through the real learner controls, not a fabricated state.
  await solveTask(page);await page.locator('#nextExerciseBtn').click();await solveTask(page);await page.locator('#nextExerciseBtn').click();
  assert.equal(await page.evaluate(()=>{const s=AlgebraTrainer.snapshot();return s.learningRun.tasks[s.trainerIndex].kind;}),'predict');
  await blur();await page.keyboard.press('l');assert.equal(await page.locator('[data-edit-field=lhs]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-edit-action=clear]').click();await blur();await page.keyboard.press('-');
  const expectedTerm=await page.evaluate(()=>{const s=AlgebraTrainer.snapshot(),t=s.learningRun.tasks[s.trainerIndex],e=AlgebraCore.negExpr(AlgebraTouch.palette(t)[0].expr);return {signature:AlgebraCore.exprSig(e),tex:AlgebraCore.latexExpr(e,t.ex.policy)};});
  const tileLabel=await page.locator('[data-term]').first().getAttribute('aria-label');assert.match(tileLabel,/Voeg .+ toe links/);
  assert.equal(await page.locator('[data-term]').first().locator('annotation').textContent(),expectedTerm.tex,'The displayed tile previews the actual signed term');
  await screenshot('equations-negative-choices');await blur();await page.keyboard.press('1');await page.clock.runFor(100);
  assert.equal(await page.evaluate(()=>{const s=AlgebraTrainer.snapshot(),r=s.learningRun.results[s.trainerIndex];return AlgebraCore.exprSig(r.blocks.lhs.at(-1));}),expectedTerm.signature,'Minus then 1 adds the signed term displayed in tile 1');
  await blur();await page.keyboard.press('r');assert.equal(await page.locator('[data-edit-field=rhs]').getAttribute('aria-pressed'),'true');
  await layout('equations-build');
  const equationDraft=await page.evaluate(()=>AlgebraTrainer.snapshot().learningRun.results);
  await page.locator('leraarbob-topbar .collapse').click();assert.deepEqual(await page.evaluate(()=>AlgebraTrainer.snapshot().learningRun.results),equationDraft);await layout('equations-collapsed');
  await page.evaluate(()=>AxiomaGame.flush());await page.reload();await ready();assert(await page.locator('.lb-restore').isVisible());assert.deepEqual(await page.evaluate(()=>AlgebraTrainer.snapshot().learningRun.results),equationDraft);await page.locator('.lb-restore').click();await layout('equations-reloaded');
  assert.deepEqual(errors,[],'No uncaught errors');assert.deepEqual(missing,[],'No missing local assets');
  await context.close();console.log('Intuitive commands, dynamic tools, keyboard, signed choices, legacy drafts and collapse passed '+width+'×'+height);
 }}finally{await browser.close();if(server.listening)await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(reports,null,2));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
