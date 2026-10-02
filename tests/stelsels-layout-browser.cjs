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
 const browser=await chromium.launch({downloadsPath:out,executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
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
  await page.goto(base+'/games/algebra-trainer/stelsels.html');
  const ready=async()=>{await page.waitForFunction(()=>window.StelselsTrainer&&AxiomaGame.active);await page.waitForTimeout(550);};
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

  const snap=()=>page.evaluate(()=>StelselsTrainer.snapshot());
  async function seed(width,height,fold=false,kind='unique',level='advanced'){
   const S=require('../games/algebra-trainer/stelsels/core.js'),ex=S.generate(321821,level,kind);
   await page.setViewportSize({width,height});await page.evaluate(async({ex,fold})=>{AxiomaGame.storage.setItem('leraarbob.stelsels.workshop.v1',JSON.stringify({version:1,settings:{level:ex.level,method:'substitution'},exercises:[ex],index:0,work:{},screen:'work'}));LeraarBobTopbar.setCollapsed(fold);await AxiomaGame.flush();},{ex,fold});await page.reload();await ready();await layout('system start '+width+' '+fold);
  }
  async function phase(name){await page.locator('#toolPhase').selectOption(name);await layout('phase '+name);}
  async function op(row,operator,q,term='c'){
   await phase('operate');await page.locator('[data-row="'+row+'"]').click();await page.locator('[data-op="'+operator+'"]').click();await page.locator('#operand').fill(String(q));if(['+','-'].includes(operator))await page.locator('#term').selectOption(term);
   await page.locator('#previewOperation').click();await layout('operation preview');await page.locator('#apply').click();await layout('operation committed');
  }
  const coeff=(r,side,k)=>page.evaluate(({r,side,k})=>{const s=StelselsTrainer.snapshot(),e=s.exercises[s.index],st=s.work[e.id].steps.at(-1);return StelselsCore.text(st.system[r][side][k]);},{r,side,k});
  async function normalize(r){for(const k of ['x','y']){const q=await coeff(r,'r',k);if(q!=='0')await op(r,'-',q,k);}const q=await coeff(r,'l','c');if(q!=='0')await op(r,'-',q);}
  async function substitute(r){await phase('substitute'); // Keep selection available through operation phase.
   const actual=await page.evaluate(()=>{const s=StelselsTrainer.snapshot();return s.work[s.exercises[s.index].id].row||0;});if(actual!==r){await phase('operate');await page.locator('[data-row="'+r+'"]').click();await phase('substitute');}
   await page.locator('#previewSubstitution').click();await layout('substitution preview');await page.locator('#apply').click();await layout('raw grouped substitution');await page.locator('#simplify').click();await layout('simplified substitution');
  }
  async function solve(method){
   await page.locator('[data-method="'+method+'"]').click();await layout('method '+method);
   if(method==='graphic'){
    const points=await page.evaluate(()=>StelselsTrainer.snapshot().exercises[StelselsTrainer.snapshot().index].start.map(e=>StelselsCore.graphPoints(e).map(p=>({x:StelselsCore.text(p.x),y:StelselsCore.text(p.y)}))));
    for(let r=0;r<2;r++)for(let p=0;p<2;p++){await page.locator('[data-point="'+r+','+p+'"]').click();await page.locator('#pointX').fill(points[r][p].x);await page.locator('#pointY').fill(points[r][p].y);await page.locator('#setGraphPoint').click();await layout('graph point');}
    await page.locator('#checkLines').click();await layout('graph checked');
    const ratio=await page.locator('#graph svg').evaluate(svg=>{const m=svg.getScreenCTM();return m.a/m.d;});assert(Math.abs(ratio-1)<1e-8,'axes use identical unit scale');
   }else{
    await normalize(0);if(method==='combination'){
     await normalize(1);const a=await coeff(0,'l','x'),b=await coeff(1,'l','x');await phase('combine');await page.locator('#factor1').fill(b);await page.locator('#factor2').fill(a);await page.locator('#previewCombination').click();await layout('combination with intermediate calculation');await page.screenshot({path:path.join(out,'combination-'+(await page.viewportSize()).width+'.png')});await page.locator('#apply').click();await layout('combined');
    }else{
     const b=await coeff(0,'l','y');if(b!=='0')await op(0,'-',b,'y');const a=await coeff(0,'l','x');if(a!=='1')await op(0,'/',a);await substitute(0);
    }
    await normalize(1);const a=await coeff(1,'l','x'),b=await coeff(1,'l','y');if(a!=='0'||b!=='0'){const variable=a==='0'?'y':'x',factor=a==='0'?b:a;if(factor!=='1')await op(1,'/',factor);await substitute(1);await normalize(0);const factor0=await coeff(0,'l',variable==='x'?'y':'x');if(factor0!=='1')await op(0,'/',factor0);}
   }
   await phase('answer');const sol=await page.evaluate(()=>{const s=StelselsTrainer.snapshot(),sol=s.exercises[s.index].solution;return {kind:sol.kind,x:sol.x&&StelselsCore.text(sol.x),y:sol.y&&StelselsCore.text(sol.y)};});await page.locator('#conclusion').selectOption(sol.kind);if(sol.kind==='unique'){await page.locator('#answerX').fill(sol.x);await page.locator('#answerY').fill(sol.y);}
   await page.locator('#checkAnswer').click();await layout('solution feedback');const s=await snap();assert(s.work[s.exercises[s.index].id].done,method+' solved');
  }
  await seed(640,360,false,'unique','beginner');await page.locator('[data-method=graphic]').tap();
  const touchPoint=await page.evaluate(()=>{const s=StelselsTrainer.snapshot(),point=StelselsCore.graphPoints(s.exercises[0].start[0])[0],svg=document.querySelector('#graph svg'),matrix=svg.getScreenCTM();return {x:matrix.a*(point.x.value()+8)*37.5+matrix.e,y:matrix.d*(8-point.y.value())*37.5+matrix.f,expectedX:StelselsCore.text(point.x),expectedY:StelselsCore.text(point.y)};});
  await page.touchscreen.tap(touchPoint.x,touchPoint.y);const placed=await page.evaluate(()=>{const s=StelselsTrainer.snapshot(),p=s.work[s.exercises[0].id].points[0][0];return {x:StelselsCore.text(p.x),y:StelselsCore.text(p.y)}});assert.deepEqual(placed,{x:touchPoint.expectedX,y:touchPoint.expectedY});await layout('real touch graph point');await page.locator('#undo').tap();assert(await page.evaluate(()=>{const s=StelselsTrainer.snapshot();return !s.work[s.exercises[0].id].points[0][0]}));await layout('touch graph undo');await page.touchscreen.tap(touchPoint.x,touchPoint.y);
  await page.locator('leraarbob-topbar .theme-toggle').tap();await layout('dark graph');await page.screenshot({path:path.join(out,'dark-graph-640.png')});await page.evaluate(()=>AxiomaGame.flush());await page.reload();await ready();assert.equal(await page.evaluate(()=>document.documentElement.dataset.mode),'dark');await page.locator('leraarbob-topbar .theme-toggle').tap();if(process.env.STELSELS_TOUCH_ONLY){assert.deepEqual(errors,[]);console.log('PASS touch, point undo, dark graph and theme reload');return;}
  for(const [width,height] of [[640,360],[780,360],[1366,768]])for(const fold of [false,true])for(const method of ['substitution','combination','graphic']){
   await seed(width,height,fold);await page.locator('#systemHelpBtn').click();await layout('system help');await page.locator('#systemHelpBtn').click();
   const before=await snap();await page.locator(fold?'.lb-restore':'leraarbob-topbar .collapse').click();await layout('toggle topbar');await page.locator(fold?'leraarbob-topbar .collapse':'.lb-restore').click();assert.deepEqual(await snap(),before);
   await solve(method);await page.screenshot({path:path.join(out,`${method}-${width}-${fold}.png`)});await page.locator('#systemHistoryBtn').click();await layout('system full history');if(await page.locator('#systemHistoryPrev').isEnabled()){await page.locator('#systemHistoryPrev').click();await layout('previous system step');}if(method==='combination'){const at=await page.evaluate(()=>{const s=StelselsTrainer.snapshot();return s.work[s.exercises[s.index].id].steps.findIndex(st=>st.scaled);});for(let n=Number((await page.locator('#systemHistoryPosition').textContent()).split(' / ')[0])-1;n>at;n--){if(await page.locator('#systemHistoryPrev').isEnabled()){await page.locator('#systemHistoryPrev').click();await layout('combination history intermediate');}}}
   await page.locator('#systemHistoryBack').click();await page.evaluate(()=>AxiomaGame.flush());const saved=await snap();await page.reload();await ready();assert.equal(JSON.stringify((await snap()).work),JSON.stringify(saved.work));await layout('system reload');
  }
  for(const kind of ['none','infinite'])for(const method of ['substitution','combination','graphic']){await seed(640,360,false,kind,'basis');await solve(method);}
  // A complete five-task route, including its exceptional final system.
  await page.evaluate(async()=>{AxiomaGame.storage.setItem('leraarbob.algebra.v1',JSON.stringify({version:1,worldLegacy:['E1']}));await AxiomaGame.flush();});await page.goto(base+'/games/algebra-trainer/stelsels.html?topic=sys-graphic');await ready();
  assert((await snap()).systemRun);for(let i=0;i<5;i++){await solve('graphic');await page.locator('#systemContinue').click();}await layout('system mission summary');assert((await snap()).journey.topics['sys-graphic'].finished);await page.screenshot({path:path.join(out,'system-summary-640.png')});
  await page.evaluate(()=>AxiomaGame.flush());await page.reload();await ready();await layout('system summary reload');
  for(const method of ['substitution','combination']){await page.goto(base+'/games/algebra-trainer/stelsels.html?topic=sys-'+method);await ready();assert((await snap()).systemRun);for(let i=0;i<5;i++){await solve(method);await page.locator('#systemContinue').click();}await layout(method+' mission summary');assert((await snap()).journey.topics['sys-'+method].finished);}
  // Worksheet building still uses the exact exercises on the workboard.
  const original=await page.evaluate(()=>JSON.stringify(StelselsTrainer.snapshot().exercises));
  if(await page.locator('.lb-restore').isVisible())await page.locator('.lb-restore').click();await page.locator('leraarbob-topbar .menu:visible,leraarbob-topbar .mobile-menu:visible').click();await page.getByRole('button',{name:'Oefenblad huidige reeks',exact:true}).click();
  for(const method of ['substitution','combination','graphic']){await page.locator('#paperMethod').selectOption(method);await page.waitForFunction(()=>StelselsTrainer.snapshot().pages>0&&!document.getElementById('download').disabled);assert.equal(await page.evaluate(()=>JSON.stringify(StelselsTrainer.snapshot().exercises)),original);assert(await page.locator('.paper-page').count()>0);}
  await page.locator('#paperMethod').selectOption('graphic');await page.waitForFunction(()=>!document.getElementById('download').disabled);const download=page.waitForEvent('download');await page.locator('#download').click();const file=await download;const filePath=await file.path();await file.saveAs(path.join(out,'stelsels-voorbeeld.pdf'));assert.equal(fs.readFileSync(filePath).subarray(0,8).toString(),'%PDF-1.4');
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'../stelsels-browser-report.json'),JSON.stringify({checks:report.length,report},null,2));console.log('PASS '+report.length+' system checks; all three methods, exceptional cases, history, reload and full mission');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
