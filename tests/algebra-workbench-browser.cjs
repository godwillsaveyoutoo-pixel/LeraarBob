const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright'),C=require('../games/algebra-trainer/core.js');
const root=path.resolve(__dirname,'..'),out='/tmp/algebra-workbench-screenshots';
fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 const resolved=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;
 if(!fs.existsSync(resolved)){res.writeHead(404);return res.end();}
 const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.ttf':'font/ttf','.woff2':'font/woff2'};
 res.setHeader('Content-Type',types[path.extname(resolved)]||'application/octet-stream');fs.createReadStream(resolved).pipe(res);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];let saved=null;
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.pathname.endsWith('/axioma-auth.js'))return route.fulfill({contentType:'text/javascript',body:`window.AxiomaAuth={ready:async()=>({account:{id:'00000000-0000-4000-8000-000000000033',role:'student',alias:'Test'}}),getAccount:async()=>({id:'00000000-0000-4000-8000-000000000033',role:'student',alias:'Test'}),getSession:async()=>null,onChange:()=>()=>{},client:()=>({from:()=>({select(){return this},eq(){return this},maybeSingle:()=>fetch('/workbench-test-api').then(r=>r.json())}),rpc:(name,args)=>fetch('/workbench-test-api',{method:'POST',body:JSON.stringify(args)}).then(r=>r.json())})}`});
   if(url.pathname==='/workbench-test-api'){if(route.request().method()==='POST'){const args=route.request().postDataJSON();saved={game_id:'algebra-trainer',state:args.p_state,revision:(saved?.revision||0)+1};return route.fulfill({contentType:'application/json',body:JSON.stringify({data:{status:'saved',...saved},error:null})});}return route.fulfill({contentType:'application/json',body:JSON.stringify({data:saved,error:null})});}
   if(url.pathname.endsWith('/axioma-social.js'))return route.fulfill({contentType:'text/javascript',body:'window.AxiomaSocial={state:()=>({}),onChange:()=>()=>{}}'});
   if(url.hostname!=='127.0.0.1')return route.abort();return route.continue();
  });
  await page.goto(base+'/games/algebra-trainer/');
  const ready=async()=>{await page.waitForFunction(()=>window.AlgebraTrainer&&AxiomaGame.active);await page.waitForTimeout(550);};
  await ready();
  async function seed(ex,fold=false){
   await page.evaluate(async({ex,fold})=>{
    AxiomaGame.storage.setItem('leraarbob.algebra.v1',JSON.stringify({version:1,settings:ex.policy,activeSet:[ex],trainerIndex:0,perExercise:{},solvedTypes:[],screen:'trainer',activeLevel:'advanced'}));
    LeraarBobTopbar.setCollapsed(fold);await AxiomaGame.flush();
   },{ex,fold});await page.reload();await ready();await page.evaluate(()=>document.fonts.ready);
  }
  async function layout(label){
   await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
   const result=await page.evaluate(()=>{
    const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
    const controls=[...document.querySelectorAll('#trainerScreen button')].filter(visible);
    const bad=controls.filter(e=>{const r=e.getBoundingClientRect();return r.width<43.9||r.height<43.9||r.left<0||r.top<0||r.right>innerWidth+.5||r.bottom>innerHeight+.5}).map(e=>({id:e.id,text:e.textContent,rect:e.getBoundingClientRect().toJSON()}));
    const clipped=controls.filter(e=>{const r=e.getBoundingClientRect();return [...e.querySelectorAll('.katex-html .base')].some(m=>{const t=m.getBoundingClientRect();return t.left<r.left-.5||t.right>r.right+.5||t.top<r.top-.5||t.bottom>r.bottom+.5})||e.querySelector('.katex')&&(e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1)}).map(e=>e.textContent);
    const covered=controls.filter(e=>{const r=e.getBoundingClientRect();return !e.disabled&&!e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}).map(e=>e.id||e.textContent);
    const restore=document.querySelector('.lb-restore:not([hidden])'),restoreOverlap=[];
    if(restore){const r=restore.getBoundingClientRect();for(const e of [...controls,document.querySelector('.trainHead h1'),document.querySelector('#givenEquation')]){if(!e||!visible(e))continue;const t=e.getBoundingClientRect();if(r.left<t.right&&r.right>t.left&&r.top<t.bottom&&r.bottom>t.top)restoreOverlap.push(e.id||e.textContent)}}
    return {bad,clipped,covered,restoreOverlap,overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight+1};
   });if(result.bad.length||result.clipped.length||result.covered.length||result.restoreOverlap.length||result.overflow)await page.screenshot({path:path.join(out,'failure.png')});
   assert.deepEqual(result,{bad:[],clipped:[],covered:[],restoreOverlap:[],overflow:false},label+' '+JSON.stringify(result));
  }
  // Click only visible controls; find the offered operand independently of its position.
  async function choose(op,operand){
   await layout('before operation');
   const key=C.exprSig(operand);
   const direct=await page.evaluate(({op,key})=>{
    const rev=o=>o&&typeof o==='object'?(Number.isInteger(o.n)&&Number.isInteger(o.d)?AlgebraCore.R(o.n,o.d):Array.isArray(o)?o.map(rev):Object.fromEntries(Object.entries(o).map(([k,v])=>[k,rev(v)]))):o;
    const s=AlgebraTrainer.snapshot(),ex=rev(s.activeSet[s.trainerIndex]);
    return AlgebraWorkbench.contextOperations(ex,rev(s.trainerStates.at(-1))).findIndex(x=>x.op===op&&AlgebraCore.exprSig(x.operand)===key);
   },{op,key});
   if(direct>=0){await page.locator(`[data-choice="${direct}"]`).click();return;}
   await page.locator('#moreOperationsBtn').click();await page.locator(`[data-op="${op}"]`).click();
   const index=await page.evaluate(({op,key})=>{
    const rev=o=>o&&typeof o==='object'?(Number.isInteger(o.n)&&Number.isInteger(o.d)?AlgebraCore.R(o.n,o.d):Array.isArray(o)?o.map(rev):Object.fromEntries(Object.entries(o).map(([k,v])=>[k,rev(v)]))):o;
    const s=AlgebraTrainer.snapshot(),ex=rev(s.activeSet[s.trainerIndex]);
    return AlgebraCore.candidateOperands(ex,rev(s.trainerStates.at(-1)),op).findIndex(v=>AlgebraCore.exprSig(v)===key);
   },{op,key});assert(index>=0,'operand available');
   for(let i=0;i<Math.floor(index/2);i++)await page.locator('#nextValuesBtn').click();
   await layout('manual picker');await page.locator(`[data-index="${index}"]`).click();
  }
  const {N,V,Add,Mul,EQ,R}=C,policy={allowFractions:false,allowDecimals:false,allowNegative:false};
  const start=EQ(Add(Mul(N(4),V()),N(6)),Add(Mul(N(2),V()),N(10)));
  const steps=[{op:'-',operand:Mul(N(2),V())},{op:'-',operand:N(6)},{op:'/',operand:N(2)}],states=[start];
  for(const st of steps)states.push(C.applyEquation(states.at(-1),st.op,st.operand));
  const ex={id:'divide-first',type:'E1',policy,start,steps,states,solution:R(2)};
  for(const [width,height] of [[1366,768],[780,360],[640,360],[390,844],[320,568]])for(const fold of [false,true]){
   await page.setViewportSize({width,height});await seed(ex,fold);await layout('start '+width+' '+fold);
   await page.screenshot({path:path.join(out,`start-${width}-${fold}.png`)});
   const original=await page.locator('#givenEquation').textContent();
   const initial=await page.evaluate(()=>JSON.stringify(AlgebraTrainer.snapshot().trainerStates));
   await page.locator('#checkBtn').click();assert.equal(await page.evaluate(()=>JSON.stringify(AlgebraTrainer.snapshot().trainerStates)),initial,'check does not change work');
   assert.equal(await page.locator('#feedback').textContent(),'x staat nog aan beide kanten.');
   const beforeFold=await page.evaluate(()=>AlgebraTrainer.snapshot());
   await page.locator(fold?'.lb-restore':'leraarbob-topbar .collapse').click();await layout('toggle '+width);
   assert.equal(await page.locator('leraarbob-topbar .collapse').getAttribute('aria-expanded'),String(fold));
   await page.locator(fold?'leraarbob-topbar .collapse':'.lb-restore').click();await layout('restore '+width);
   assert.deepEqual(await page.evaluate(()=>AlgebraTrainer.snapshot()),beforeFold,'real topbar buttons preserve work');
   await page.locator('#reminderBtn').click();await layout('reminder');assert.equal(await page.locator('#reminderBtn').getAttribute('aria-expanded'),'true');
   await page.locator('#reminderBtn').click();assert.equal(await page.evaluate(()=>JSON.stringify(AlgebraTrainer.snapshot().trainerStates)),initial,'reminder preserves work');
   await choose('/',N(4));await choose('-',N(R(3,2)));
   assert(await page.locator('#contextOperations button').first().evaluate(e=>e===document.activeElement),'keyboard focus stays in the workbench');
   const middle=await page.evaluate(()=>JSON.stringify(AlgebraTrainer.snapshot().trainerStates));
   await page.evaluate(()=>AxiomaGame.flush());await page.reload();await ready();
   assert.equal(await page.evaluate(()=>JSON.stringify(AlgebraTrainer.snapshot().trainerStates)),middle,'restore intermediate fractions');
   assert.equal(await page.evaluate(()=>document.body.classList.contains('topbar-collapsed')),fold,'topbar preference');
   await page.locator('#undoBtn').click();await choose('-',N(R(3,2)));
   await choose('-',Mul(N(R(1,2)),V()));await choose('/',N(R(1,2)));
   await layout('solved '+width+' '+fold);assert.equal(await page.locator('#feedback').textContent(),'Juist. x staat vrij.');
   assert(await page.locator('#nextExerciseBtn').evaluate(e=>e===document.activeElement),'keyboard focus reaches the next exercise');
   assert.equal(await page.locator('#givenEquation').textContent(),original,'given remains unchanged');
   const current=page.locator('.derivationLine.current .derivationMath');
   await current.scrollIntoViewIfNeeded();const box=await current.boundingBox();assert(box.y>=0&&box.y+box.height<=height,'current equation visible');
   await page.screenshot({path:path.join(out,`solved-${width}-${fold}.png`)});
  }
  // All forms finish through the real controls, including brackets, decimals,
  // negative factors and any required choices beyond the first value page.
  await page.setViewportSize({width:640,height:360});
  for(const type of C.TYPES)for(const numberPolicy of [policy,{allowFractions:true,allowDecimals:false,allowNegative:true},{allowFractions:false,allowDecimals:true,allowNegative:true}]){
   const exercise=C.generateSeeded(type.id,numberPolicy,0,514);await seed(exercise);
   for(const step of exercise.steps)await choose(step.op,step.operand);
   assert.equal(await page.locator('#feedback').textContent(),'Juist. x staat vrij.',type.id);await layout(type.id);
  }
  await page.locator('#backSetupBtn').click();await page.locator('.sectionNav [data-nav=tools]').click();await page.locator('#toolsScreen [data-nav=preview]').click();
  assert(await page.locator('.paperPage').count()>0,'same exercise sheet available');
  assert.deepEqual(errors,[],'no browser exceptions');
  console.log('PASS: 5 sizes × both topbar states, reminder/check/undo/reload, divide-first fractions, 17 forms × 3 number policies, visible paged operands, preserved sheet. Screenshots: '+out);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
