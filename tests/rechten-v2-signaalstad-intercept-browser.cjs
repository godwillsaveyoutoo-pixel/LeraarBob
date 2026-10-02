/* Isolated real browser. No live accounts, writes or external requests. */
'use strict';
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out='/tmp/rechten-signaalstad-intercept-screenshots';
const server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');const type={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.ttf':'font/ttf','.json':'application/json'}[path.extname(file)]||'application/octet-stream';res.setHeader('Content-Type',type);fs.createReadStream(file).pipe(res)}catch{res.writeHead(404);res.end()}});
const mock='window.AxiomaAuth={ready:async()=>({session:null}),getAccount:async()=>({id:"context-test",role:"teacher"}),getSnapshot:()=>({status:"teacher",account:{id:"context-test",role:"teacher"}}),client:()=>null,onChange:()=>()=>{}};';
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});let checks=0;
 try{for(const [width,height]of [[1366,768],[780,360],[640,360]]){
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:width<900}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{const u=new URL(r.request().url());return u.pathname.endsWith('/axioma-auth.js')?r.fulfill({contentType:'application/javascript',body:mock}):u.origin!==base?r.fulfill({body:''}):r.continue()});
  const snap=()=>page.evaluate(()=>RechtenV2App.snapshot()),mission=async()=>{const s=await snap();return s.missions[s.active]},tap=async s=>width<900?page.locator(s).tap():page.locator(s).click();
  async function layout(label){
   await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
   const problems=await page.evaluate(()=>{
    const bad=[],visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
    if(document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1)bad.push('page overflow');
    const footer=document.querySelector('.boundary-footer').getBoundingClientRect();
    const elements=[...document.querySelectorAll('.formula-heading h1,.formula-answer h2,.formula-answer p,.formula-parameter-equation,.formula-parameter>span,input[name=b],input[name=x],.formula-parameter button,.formula-graph,.graph-undo,.boundary-footer button,.feedback')].filter(visible);
    for(const e of elements){const r=e.getBoundingClientRect();if(r.left<-.5||r.top<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5)bad.push('outside '+e.tagName+' '+e.className);if(!e.closest('footer')&&r.bottom>footer.top+.5)bad.push('footer overlap '+e.className);if(e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2)bad.push('clipped '+e.className);
     if(e.matches('button,input')){if(r.width<43.9||r.height<43.9)bad.push('small '+e.tagName);if(!e.disabled&&!e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)))bad.push('covered '+e.tagName);}
    }
    const restore=document.querySelector('.lb-restore:not([hidden])');if(restore){const r=restore.getBoundingClientRect();for(const e of elements){const t=e.getBoundingClientRect();if(r.left<t.right&&r.right>t.left&&r.top<t.bottom&&r.bottom>t.top)bad.push('restore overlap '+e.className);}}
    return bad;
   });if(problems.length)await page.screenshot({path:path.join(out,'failure.png')});assert.deepEqual(problems,[],label);checks++;
  }
  async function commit(){await tap('#commit');if(await page.locator('#flow-pause').count())await tap('#flow-pause');}
  await page.goto(base+'/games/rechten/rechtenwereld/?practice=intercept');await page.waitForSelector('input[name=b]');assert.equal(await page.locator('input[name=a]').count(),0);await layout('start '+width);
  const original=await snap();await tap('leraarbob-topbar .collapse');await layout('collapsed '+width);assert.deepEqual(await snap(),original);await page.reload();await page.waitForSelector('input[name=b]');assert.deepEqual(await snap(),original);assert(await page.locator('.lb-restore').isVisible());await tap('.lb-restore');await layout('restored '+width);
  await page.screenshot({path:path.join(out,`level-1-${width}.png`)});
  await commit();assert.equal((await mission()).feedback.result.kind,'interaction_error');assert.equal((await mission()).errors,0);await layout('missing '+width);await tap('#continue');
  assert.equal(await page.locator('input[name=x]').inputValue(),'');await page.locator('input[name=x]').fill('1');await page.locator('input[name=b]').fill('99');await commit();assert(!(await mission()).feedback.result.ok);await layout('wrong '+width);await tap('#continue');
  await page.locator('input[name=b]').fill('');await tap('[data-formula-step=b][data-direction="1"]');await tap('[data-formula-step=b][data-direction="1"]');assert.equal((await mission()).values.b,'2');await tap('#undo');assert.equal((await mission()).values.b,'1');await tap('[data-formula-step=b][data-direction="1"]');
  await page.locator('input[name=x]').fill('1');await commit();assert.equal((await mission()).feedback.result.code,'intercept.x');await layout('wrong x '+width);await tap('#continue');assert.equal((await mission()).locks.b,true);assert(await page.locator('input[name=b]').getAttribute('readonly')!==null);await page.locator('input[name=x]').fill('0');await tap('#undo');assert.equal((await mission()).values.x,'1');assert.equal((await mission()).values.b,'2');await page.locator('input[name=x]').fill('0');
  const beforePause=await mission();await tap('#pause');await page.waitForSelector('[data-node=intercept]');await tap('[data-node=intercept]');assert.deepEqual(await mission(),beforePause,'pause keeps the answer');
  while(!(await mission()).completed){
   const m=await mission();if(!m.locks.x)await page.locator('input[name=x]').fill('0');if(!m.locks.b)await page.locator('input[name=b]').fill(String(m.task.model.b.n/m.task.model.b.d));await commit();assert((await mission()).feedback.result.ok);await layout('checked '+width+' '+m.index);
   if(m.index===3){const saved=await snap();await page.reload();await page.waitForSelector('input[name=b]');assert.deepEqual(await snap(),saved,'checked work remains saved');}
   await tap('#continue');if(!(await mission()).completed)await layout('next '+width+' '+m.index);
  }
  await layout('complete '+width);assert.equal((await snap()).platformXp,55);await page.screenshot({path:path.join(out,`level-1-complete-${width}.png`)});
  await tap('#pause');await page.waitForSelector('[data-node=intercept]');assert.equal(await page.locator('[data-node=intercept]').getAttribute('data-state'),'completed');
  await tap('[data-node=intercept]');assert.equal((await mission()).run,2);await page.locator('input[name=b]').fill('-1');const beforeRotate=await mission();await page.setViewportSize({width:360,height:780});assert(await page.locator('#rotateGate').isVisible());await page.setViewportSize({width,height});assert.deepEqual(await mission(),beforeRotate);await layout('rotate '+width);
  await tap('#hint');await layout('hint '+width);assert.deepEqual(errors,[]);await ctx.close();
 }
 console.log(`PASS Signaalstad level 1: ${checks} layouts, six tasks, both coordinates and retained repair, exact feedback, touch/keyboard/steppers, undo, pause, reload, collapse/restore, completion and XP. Screenshots: ${out}`);
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
