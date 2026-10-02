const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright'),C=require('../games/algebra-trainer/core.js');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/algebra-leerroute/screenshots');
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
  const page=await browser.newPage({hasTouch:true,viewport:{width:1366,height:768}}),errors=[];let saved=null;
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
  const report=[];
  async function layout(label){
   await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
   const result=await page.evaluate(()=>{
    const root=document.querySelector('body[data-screen=trainer] #trainerScreen,body[data-screen=history] #historyScreen,body[data-screen=summary] #summaryScreen,body[data-screen=work] #work,body[data-screen=systemHistory] #systemHistory,body[data-screen=systemSummary] #systemSummary');
    if(!root)return {missing:true};
    const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
    const interactive=[...root.querySelectorAll('button,input,select,a')].filter(visible),bad=[],scroll=[],clipped=[],covered=[];
    for(const e of [root,...root.querySelectorAll('*')]){
     if(!visible(e)||e.closest('.katex'))continue;
     const css=getComputedStyle(e);if(['auto','scroll'].includes(css.overflowX)&&e.scrollWidth>e.clientWidth+1||['auto','scroll'].includes(css.overflowY)&&e.scrollHeight>e.clientHeight+1)scroll.push(e.id||e.className);
    }
    for(const e of interactive){const r=e.getBoundingClientRect();if(r.width<43.9||r.height<43.9||r.x<-.5||r.y<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5)bad.push({id:e.id||e.textContent,rect:r.toJSON()});if(!e.disabled&&!e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)))covered.push(e.id||e.textContent);}
    for(const e of [...root.querySelectorAll('.katex-html .base'),...root.querySelectorAll('.taskPrompt,.systemGoal,.feedback,.status,.step-label,.production label,.summaryEvidence p')].filter(visible)){
     const r=e.getBoundingClientRect();if(r.x<-.5||r.y<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5)clipped.push(e.className||e.id);
     for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){const css=getComputedStyle(p),q=p.getBoundingClientRect();if(['hidden','clip','auto','scroll'].includes(css.overflowX)&&(r.x<q.x-1||r.right>q.right+1)||['hidden','clip','auto','scroll'].includes(css.overflowY)&&(r.y<q.y-1||r.bottom>q.bottom+1)){clipped.push((p.id||p.className)+'>'+e.className);break;}}
    }
    for(let i=0;i<interactive.length;i++)for(let j=i+1;j<interactive.length;j++){const a=interactive[i],b=interactive[j],r=a.getBoundingClientRect(),q=b.getBoundingClientRect();if(!a.contains(b)&&!b.contains(a)&&Math.min(r.right,q.right)-Math.max(r.left,q.left)>1&&Math.min(r.bottom,q.bottom)-Math.max(r.top,q.top)>1)covered.push('overlap:'+(a.id||a.textContent)+'/'+(b.id||b.textContent));}
    const restore=document.querySelector('.lb-restore:not([hidden])');if(restore){const r=restore.getBoundingClientRect();for(const e of [...interactive,...root.querySelectorAll('h1,.taskPrompt,.systemGoal')].filter(visible)){const q=e.getBoundingClientRect();if(r.left<q.right&&r.right>q.left&&r.top<q.bottom&&r.bottom>q.top)covered.push('restore>'+e.id);}}
    return {bad,scroll,clipped,covered,bodyScroll:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight+1};
   });report.push({label,...result});if(JSON.stringify(result)!==JSON.stringify({bad:[],scroll:[],clipped:[],covered:[],bodyScroll:false})){await page.screenshot({path:path.join(out,'failure.png')});}
   assert.deepEqual(result,{bad:[],scroll:[],clipped:[],covered:[],bodyScroll:false},label+' '+JSON.stringify(result));
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
   if(direct>=0&&await page.locator('#contextOperations').isVisible()){await page.locator(`[data-choice="${direct}"]`).click();return;}
   if(!await page.locator('#manualOperations').isVisible())await page.locator('#moreOperationsBtn').click();await page.locator(`[data-op="${op}"]`).click();
   const index=await page.evaluate(({op,key})=>{
    const rev=o=>o&&typeof o==='object'?(Number.isInteger(o.n)&&Number.isInteger(o.d)?AlgebraCore.R(o.n,o.d):Array.isArray(o)?o.map(rev):Object.fromEntries(Object.entries(o).map(([k,v])=>[k,rev(v)]))):o;
    const s=AlgebraTrainer.snapshot(),ex=rev(s.activeSet[s.trainerIndex]);
    return AlgebraCore.candidateOperands(ex,rev(s.trainerStates.at(-1)),op).findIndex(v=>AlgebraCore.exprSig(v)===key);
   },{op,key});assert(index>=0,'operand available');
   for(let i=0;i<Math.floor(index/2);i++)await page.locator('#nextValuesBtn').click();
   await layout('manual picker');await page.locator(`[data-index="${index}"]`).click();
  }

  async function snap(){return page.evaluate(()=>AlgebraTrainer.snapshot());}
  async function plainExpected(){return page.evaluate(()=>{const s=AlgebraTrainer.snapshot(),t=s.learningRun.tasks[s.trainerIndex],format=e=>{const q=AlgebraLearning.affine(e);return `${q.a.n}/${q.a.d}x+(${q.b.n}/${q.b.d})`};return format(t.expected.l)+'='+format(t.expected.r);});}
  async function solve(){const s=await snap(),ex=s.activeSet[s.trainerIndex];for(const st of ex.steps){const now=await snap();if(now.learningRun?.results[now.trainerIndex]?.done)break;const revive=o=>o&&typeof o==='object'?(Number.isInteger(o.n)&&Number.isInteger(o.d)?C.R(o.n,o.d):Array.isArray(o)?o.map(revive):Object.fromEntries(Object.entries(o).map(([k,v])=>[k,revive(v)]))):o;await choose(st.op,revive(st.operand));await layout('after step');}}
  async function start(id,fold=false){
   await page.evaluate(async({ids,fold})=>{AxiomaGame.storage.setItem('leraarbob.algebra.v1',JSON.stringify({version:1,worldLegacy:ids,solvedTypes:ids,activeSet:[],screen:'world'}));LeraarBobTopbar.setCollapsed(fold);await AxiomaGame.flush();},{ids:C.TYPES.map(t=>t.id),fold});await page.reload();await ready();
   const world=await page.evaluate(id=>AlgebraWorld.topic(id).world,id);await page.locator('[data-world="'+world+'"]').click();await page.locator('[data-topic="'+id+'"]').click();await layout('mission start');
  }
  for(const [width,height] of [[640,360],[780,360],[1366,768]])for(const fold of [false,true]){
   await page.setViewportSize({width,height});await start('eq-B1',fold);assert.equal((await snap()).activeSet.length,5);
   const before=await snap();await page.locator(fold?'.lb-restore':'leraarbob-topbar .collapse').tap();await layout('topbar toggle');await page.locator(fold?'leraarbob-topbar .collapse':'.lb-restore').click();assert.deepEqual(await snap(),before);
   await page.screenshot({path:path.join(out,`reference-start-${width}-${fold}.png`)});
   await page.locator('#reminderBtn').click();await layout('first hint');await page.locator('#moreHintBtn').click();await layout('second hint');await page.locator('#reminderBtn').click();
   await solve();await page.locator('#historyBtn').click();await layout('history');await page.locator('#historyPrevBtn').click();await layout('earlier history');await page.locator('#closeHistoryBtn').click();await page.locator('#nextExerciseBtn').click();await layout('compare routes');
   const good=await page.evaluate(()=>{const s=AlgebraTrainer.snapshot(),t=s.learningRun.tasks[s.trainerIndex];return t.routes.findIndex((_,i)=>AlgebraLearning.validate(t,{choice:String(i)}).ok)});await page.locator('[data-route="'+good+'"]').click();await page.locator('#production button[type=submit]').click();await layout('route feedback');await page.locator('#nextExerciseBtn').click();
   assert.equal(await page.locator('#production input').inputValue(),'');await page.locator('#production input').fill('x=4');await page.locator('#production button[type=submit]').click();await layout('prediction error');assert(!(await snap()).learningRun.results[2].done);
   await page.screenshot({path:path.join(out,`prediction-error-${width}-${fold}.png`)});
   await page.locator('#production input').fill('3x=12');await page.evaluate(()=>AxiomaGame.flush());await page.reload();await ready();assert.equal(await page.locator('#production input').inputValue(),'3x=12');await layout('reload production');
   await page.locator('#production button[type=submit]').click();await page.locator('#undoBtn').click();assert.equal(await page.locator('#production input').inputValue(),'');await page.locator('#production input').fill('12=3x');await page.locator('#production button[type=submit]').click();await page.locator('#nextExerciseBtn').click();
   await solve();await page.locator('#nextExerciseBtn').click();await layout('build equation');await page.locator('#production input').fill('6');await page.locator('#production button[type=submit]').click();await page.locator('#nextExerciseBtn').click();await layout('mission summary');assert((await snap()).journey.topics['eq-B1'].finished);assert.equal((await snap()).journey.topics['eq-B1'].evidence.filter(e=>!e.supported).length,3);
   await page.screenshot({path:path.join(out,`summary-${width}-${fold}.png`)});await page.evaluate(()=>AxiomaGame.flush());await page.reload();await ready();await layout('summary reload');assert.equal((await snap()).journey.topics['eq-B1'].xp,30);await page.locator('#summaryNextBtn').click();assert.equal((await snap()).mission,'eq-B2');
  }
  // Play every task of all 17 halts. Checks after every input phase and operation.
  await page.setViewportSize({width:640,height:360});
  for(const type of C.TYPES){console.log('PLAY',type.id);await start('eq-'+type.id);for(let i=0;i<5;i++){
   const s=await snap(),t=s.learningRun.tasks[i];await layout(type.id+' task '+i);
   if(t.kind==='solve')await solve();
   else if(t.kind==='routes'){const good=await page.evaluate(()=>{const s=AlgebraTrainer.snapshot(),t=s.learningRun.tasks[s.trainerIndex];return t.routes.findIndex((_,i)=>AlgebraLearning.validate(t,{choice:String(i)}).ok)});await page.locator('[data-route="'+good+'"]').click();await page.locator('#production button[type=submit]').click();}
   else if(t.expected){if(t.kind==='repair')await page.locator('[data-location=group]').click();await page.locator('#production input').fill(await plainExpected());await page.locator('#production button[type=submit]').click();}
   else if(t.kind==='build'){await page.locator('#production input').fill(String(t.expectedNumber.n));await page.locator('#production button[type=submit]').click();}
   else if(t.kind==='verify'){const vals=await page.evaluate(()=>{const s=AlgebraTrainer.snapshot(),t=s.learningRun.tasks[s.trainerIndex];const left=AlgebraLearning.evaluate(t.ex.start.l,t.proposed),right=AlgebraLearning.evaluate(t.ex.start.r,t.proposed);return {left:`${left.n}/${left.d}`,right:`${right.n}/${right.d}`,choice:left.eq(right)?'yes':'no'}});await page.locator('[name=left]').fill(vals.left);await page.locator('[name=right]').fill(vals.right);await page.locator('[data-answer='+vals.choice+']').click();await page.locator('#production button[type=submit]').click();}
   assert((await snap()).learningRun.results[i].done,type.id+' '+t.kind);await layout('correct '+type.id+' '+t.kind);await page.locator('#nextExerciseBtn').click();
  }assert((await snap()).journey.topics['eq-'+type.id].finished);}
  assert.deepEqual(errors,[],'no browser exceptions');fs.writeFileSync(path.join(out,'../browser-report.json'),JSON.stringify({checks:report.length,report},null,2));console.log('PASS '+report.length+' equation layout/flow checks; screenshots: '+out);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
