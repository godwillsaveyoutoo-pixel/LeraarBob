const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=process.env.ALGEBRA_SCREENSHOTS||'/tmp/algebrawereld-v045';
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{let p=path.join(root,new URL(req.url,'http://local').pathname);if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');if(!fs.existsSync(p)){res.writeHead(404).end();return}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2'})[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p))});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.ALGEBRA_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.fulfill({body:''}));
 const C=require(root+'/games/algebra-trainer/core.js'),J=require(root+'/games/algebra-trainer/journey-core.js'),L=require(root+'/games/algebra-trainer/learning-core.js'),T=require(root+'/games/algebra-trainer/touch-core.js'),Touch=require('./algebra-v04-touch-controls.cjs');
 const base='http://127.0.0.1:'+server.address().port+'/games/algebra-trainer/';await page.goto(base);await page.waitForSelector('[data-stop]',{state:'attached'});await page.clock.install();
 async function load(run,index,screen='trainer'){
  const fixture={version:1,runs:{[run.skill]:run},chapterJourney:J.normalize(null),journey:null,mission:run.skill,activeSet:run.tasks.map(t=>t.ex),trainerIndex:index,perExercise:{},screen,settings:{allowFractions:false,allowDecimals:false,allowNegative:false},selection:{},includeKey:true,shuffle:true};
  await page.evaluate(f=>AxiomaGame.storage.setItem('leraarbob.algebra.v1',JSON.stringify(f)),fixture);await page.reload();await page.waitForSelector('#'+screen+'Screen:not(.hidden)');
 }
 const viewports=[[1280,800],[780,360],[640,360],[390,844],[320,700]];
 async function fits(name,selector='#touchAnswer button,#production button,.trainHead button,#checkBtn'){
  for(const [w,h] of viewports){
   await page.setViewportSize({width:w,height:h});await page.clock.runFor(100);
   await page.screenshot({path:out+'/touch-'+name+'-'+w+'x'+h+'.png'});
   const bad=await page.locator(selector).evaluateAll(es=>es.filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent.slice(0,35),x:r.x,y:r.y,w:r.width,h:r.height}}).filter(r=>r.x<-1||r.y<-1||r.x+r.w>innerWidth+1||r.y+r.h>innerHeight+1));
   assert.deepEqual(bad,[],name+' '+w+'x'+h);assert.equal(await page.locator('.katex-error').count(),0);
   const overflow=await page.locator('.termTile>.katex,.touchFieldMath>.katex').evaluateAll(es=>es.filter(e=>e.getClientRects().length).filter(e=>e.getBoundingClientRect().width>e.parentElement.getBoundingClientRect().width+1).map(e=>e.textContent.slice(0,40)));
   assert.deepEqual(overflow,[],name+' mathematical terms fit their controls');
  }
  await page.setViewportSize({width:780,height:360});
 }

 const run=J.mission('route-fractions',1731),t=run.tasks[2],start=C.EQ(C.Div(C.Add(C.Mul(C.N(7),C.V()),C.N(28)),C.N(7),true),C.N(8));
 const steps=[{op:'*',operand:C.N(7)},{op:'-',operand:C.N(28)},{op:'/',operand:C.N(7)}],states=[start];steps.forEach(st=>states.push(C.applyEquation(states.at(-1),st.op,st.operand)));
 t.ex={...t.ex,start,solution:C.R(4),steps,states,type:'D2',policy:{allowFractions:true,allowDecimals:false,allowNegative:false}};t.operation=steps[0];t.expected=states[1];t.prompt='Bouw de regel na × 7 op beide leden.';
 await load(run,2);
 assert.match(await page.locator('#taskPrompt').textContent(),/· 7/,'Old saved prompts also show the dot');
 async function term(text){await page.locator('[data-term="'+C.exprSig(L.parseExpression(text))+'"]').click();}
 async function lhs(){return page.locator('[data-answer-name=lhs]').getAttribute('data-math-tex');}
 await term('7x');assert.equal(await lhs(),'7x');assert.equal(await page.locator('[data-term]:enabled').count(),0,'No automatic plus between terms');
 await page.locator('[data-term-sign="-"]').click();assert.match(await lhs(),/7x - \\square/);
 await page.reload();await page.waitForSelector('#trainerScreen:not(.hidden)');assert.match(await lhs(),/7x - \\square/,'Pending sign survives reload');
 await term('28');assert.equal(await lhs(),'7x - 28');await Touch.put(page,'rhs','56');await Touch.submit(page);assert.equal(await page.locator('#nextBox').isVisible(),false,'Wrong minus is rejected');
 await page.locator('[data-edit-field=lhs]').click();await page.locator('[data-edit-action=clear]').click();await term('7x');await page.locator('[data-term-sign="+"]').click();
 await Touch.submit(page);assert.equal(await page.locator('#nextBox').isVisible(),false);assert.match(await page.locator('#feedback').textContent(),/nog een term/,'Unfinished operator is not silently ignored');
 await fits('signs-pending');await term('28');assert.equal(await lhs(),'7x + 28');await fits('signs-built');await Touch.submit(page);assert.equal(await page.locator('#nextBox').isVisible(),true);
 // Subtracting a negative term is exact; a leading sign is undoable immediately.
 await load(run,2);await page.locator('[data-term-sign="-"]').click();assert.equal(await page.locator('#undoBtn').isEnabled(),true);await page.locator('#undoBtn').click();assert.equal(await lhs(),'\\square');
 await page.locator('[data-term-sign="-"]').click();await term('-7x');assert.equal(await lhs(),'7x');
 await page.locator('[data-term-sign="-"]').click();await term('-7x');assert.equal(await lhs(),'7x + 7x');
 await page.locator('#undoBtn').click();assert.equal(await lhs(),'7x - \\square');await page.locator('#undoBtn').click();assert.equal(await lhs(),'7x');
 // The single-number task stays compact: no needless operator row.
 const single=J.mission('route-two',1732);await load(single,5);assert.equal(await page.locator('[data-term-sign]').count(),0);
 // Actual multiplication math uses the dot in menus, animation, and substitution.
 assert.ok(C.operationLatex('*',C.N(7)).includes('\\cdot'));
 const M=require(root+'/games/algebra-trainer/motion-core.js');
 const substitution=T.substitution(L.parseExpression('-2x+6'),C.R(-6),{});assert.ok(substitution.includes('\\cdot'));assert.ok(!substitution.includes('\\times'));
 const mathFiles=['core.js','motion-core.js','touch-core.js'];for(const file of mathFiles){const source=fs.readFileSync(root+'/games/algebra-trainer/'+file,'utf8');assert.ok(!source.includes("'\\\\times"),file+' renders multiplication with dot');}
 assert.deepEqual(errors,[]);const result={ok:true,checks:['Screenshot example: 7x + 28 = 56','Explicit plus/minus; no automatic operator','Wrong minus and unfinished sign rejected','Pending signs survive reload and undo','Subtracting negative terms is correct','Controls fit five viewports','Multiplication uses a centered dot'],errors};fs.writeFileSync(out+'/signs-checks.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();await new Promise(r=>server.close(r));
})().catch(e=>{console.error(e);process.exit(1)});
