/* Local Chromium, synthetic teacher account, external traffic blocked. */
'use strict';
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),W=require('../games/rechten/core/wave-core.js');
const root=path.resolve(__dirname,'..'),out='/tmp/rechten-signaalstad-ab-screenshots';
const server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',{'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.ttf':'font/ttf','.json':'application/json'}[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)}catch{res.writeHead(404);res.end()}});
const mock='window.AxiomaAuth={ready:async()=>({session:null}),getAccount:async()=>({id:"ab-test",role:"teacher"}),getSnapshot:()=>({status:"teacher",account:{id:"ab-test",role:"teacher"}}),client:()=>null,onChange:()=>()=>{}};';
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});let checks=0;
 try{for(const [width,height]of [[1366,768],[780,360],[640,360]]){
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:width<900}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{const u=new URL(r.request().url());return u.pathname.endsWith('/axioma-auth.js')?r.fulfill({contentType:'application/javascript',body:mock}):u.origin!==base?r.fulfill({body:''}):r.continue()});
  const snap=()=>page.evaluate(()=>RechtenV2App.snapshot()),mission=async()=>{const s=await snap();return s.missions[s.active]},tap=async s=>width<900?page.locator(s).tap():page.locator(s).click();
  async function layout(label){
   await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
   const problems=await page.evaluate(()=>{
    const bad=[],visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
    if(document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1)bad.push('page overflow');
    const footer=document.querySelector('.ab-footer').getBoundingClientRect(),elements=[...document.querySelectorAll('.ab-heading,.ab-graph-paper,.ab-graph-paper h2,.ab-retained,.ab-graph-wrap,.ab-graph-caption,.ab-answer,.ab-answer h2,.ab-instruction,.ab-measure-control,.ab-measure-control input,.ab-measure-control button,.ab-builder,.ab-builder button,.ab-tokens,.ab-tokens button,.ab-footer button,.ab-footer .feedback,.ab-complete>*')].filter(visible);
    for(const e of elements){const r=e.getBoundingClientRect();if(r.left<-.5||r.top<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5)bad.push('outside '+e.tagName+' '+e.className);if(!e.closest('footer')&&r.bottom>footer.top+.5)bad.push('footer overlap '+e.className);if(e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2)bad.push('clipped '+e.tagName+' '+e.className+' '+[e.clientWidth,e.scrollWidth,e.clientHeight,e.scrollHeight].join('/'));
     if(e.matches('button,input')){if(r.width<43.9||r.height<43.9)bad.push('small '+e.tagName);if(!e.disabled&&!e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)))bad.push('covered '+e.tagName);}
    }
    const restore=document.querySelector('.lb-restore:not([hidden])');if(restore){const r=restore.getBoundingClientRect();if(r.width<44||r.height<44||restore.getAttribute('aria-expanded')!=='false')bad.push('restore target');for(const e of elements){const t=e.getBoundingClientRect();if(r.left<t.right&&r.right>t.left&&r.top<t.bottom&&r.bottom>t.top)bad.push('restore overlap '+e.className);}}
    return bad;
   });if(problems.length)await page.screenshot({path:path.join(out,`failure-${width}.png`)});assert.deepEqual(problems,[],label);checks++;
  }
  async function reload(label){const before=await snap();await page.reload();await page.waitForSelector('.ab-mission');assert.deepEqual(await snap(),before,label);await layout(label);}
  async function commit(){await tap('#commit');if(await page.locator('#flow-pause').count())await tap('#flow-pause');}
  async function place(y){const point=await page.locator('[data-ab-picker]').evaluate((svg,y)=>{const m=RechtenV2Runtime.active(RechtenV2App.snapshot()),x=m.phase==='ab-intercept'?0:1,p=new DOMPoint(250+Number(svg.dataset.axisUnit)*x,250-Number(svg.dataset.axisUnit)*y).matrixTransform(svg.getScreenCTM());return {x:p.x,y:p.y}},y);if(width<900)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);}
  async function tile(slot,token){const target=page.locator(`[data-formula-slot=${slot}]`);if(await target.isDisabled())return;await tap(`[data-formula-slot=${slot}]`);await tap(`[data-formula-token="${token}"]`);}
  await page.goto(base+'/games/rechten/rechtenwereld/?practice=ab');await page.waitForSelector('input[name=b]');await layout('start '+width);assert.equal(await page.locator('input[name=a]').count(),0);assert.equal(await page.locator('.ab-pin').count(),0,'no marked solution');await page.screenshot({path:path.join(out,`level-2-start-${width}.png`)});
  await commit();assert.equal((await mission()).feedback.result.kind,'interaction_error');assert.equal((await mission()).errors,0);await layout('missing '+width);await tap('#continue');
  await tap('[data-ab-adjust="1"]');assert.equal((await mission()).values.b,'1');assert.equal(await page.locator('.ab-pin-b').count(),1);await tap('#undo');assert.equal((await mission()).values.b,undefined);
  await page.locator('[name=b]').fill('2');assert.equal(await page.locator('.ab-pin-b').count(),1);assert.equal(await page.evaluate(()=>document.activeElement.name),'b','live graph keeps input focus');
  const partial=await snap();await page.locator('leraarbob-topbar').evaluate(e=>e.shadowRoot.querySelector('.collapse').click());await layout('collapsed '+width);assert.deepEqual(await snap(),partial);await reload('collapsed reload '+width);assert(await page.locator('.lb-restore').isVisible());await tap('.lb-restore');await layout('restored '+width);
  await commit();assert(!(await mission()).feedback.result.ok);await layout('wrong intercept '+width);await reload('wrong feedback reload '+width);await tap('#continue');
  const beforePause=await mission();await tap('#pause');await page.waitForSelector('[data-node=ab]');assert.equal(await page.locator('[data-node=ab]').getAttribute('data-state'),'started');await tap('[data-node=ab]');assert.deepEqual(await mission(),beforePause);
  let guard=0;
  while(!(await mission()).completed){assert(++guard<20);const m=await mission();
   if(m.phase==='ab-intercept'){
    if(m.index===1){await page.locator('[name=b]').fill(String(W.num(m.task.model.b)-1));await page.locator('[data-ab-picker]').focus();await page.keyboard.press('ArrowUp');}
    else await place(W.num(m.task.model.b));
    assert(W.eq(W.parse((await mission()).values.b),m.task.model.b));
   }else if(m.phase==='ab-slope'){
    assert.equal(m.locks.b,true);assert.equal(await page.locator('[name=b]').count(),0);assert.equal(await page.locator('.ab-horizontal-step').count(),1);
    if(m.index===0){await place(W.num(W.add(m.task.model.b,W.add(m.task.model.a,1))));await commit();assert(!(await mission()).feedback.result.ok);await layout('wrong step '+width);await tap('#continue');}
    if(m.index===4){await page.locator('[name=a]').fill('1/2');assert.equal(await page.evaluate(()=>document.activeElement.name),'a');}
    else if(m.index===5){await page.locator('[name=a]').fill('0');await page.locator('[data-ab-picker]').focus();await page.keyboard.press('ArrowDown');}
    else await place(W.num(W.add(m.task.model.b,m.task.model.a)));
    assert(W.eq(W.parse((await mission()).values.a),m.task.model.a));
   }else{
    assert.equal(m.locks.b,true);assert.equal(m.locks.a,true);assert.equal(await page.locator('.ab-retained>span').count(),2);
    if(m.index===0&&width===1366){await page.locator(`[data-formula-token="${W.text(m.task.model.a)}"]`).dragTo(page.locator('[data-formula-slot=factor]'));assert.equal((await mission()).values.factor,W.text(m.task.model.a));}
    else await tile('factor',W.text(m.task.model.a));
    await tile('variable','x');await tile('operator',m.task.model.b.n<0?'−':'+');
    if(m.index===0){await tile('constant','0');await commit();assert(!(await mission()).feedback.result.ok);await layout('wrong rule '+width);await tap('#continue');assert.equal((await mission()).locks.factor,true);assert.equal((await mission()).locks.variable,true);await tile('operator',m.task.model.b.n<0?'−':'+');}
    await tile('constant',W.text(W.q(Math.abs(m.task.model.b.n),m.task.model.b.d)));assert.equal(await page.locator('.ab-candidate').count(),1);
   }
   await layout(m.phase+' filled '+m.index+' '+width);await commit();assert((await mission()).feedback.result.ok);await layout(m.phase+' checked '+m.index+' '+width);
   if(m.index===0||m.index===4)await page.screenshot({path:path.join(out,`${m.phase}-${m.index}-${width}.png`)});
   if(m.index===0||m.index===4)await reload(m.phase+' reload '+width);
   if(m.index===0&&m.phase==='ab-rule'){const saved=await snap();await page.locator('leraarbob-topbar').evaluate(e=>e.shadowRoot.querySelector('.collapse').click());assert.deepEqual(await snap(),saved);await layout('collapse checked rule '+width);await tap('#continue');assert(await page.locator('.lb-restore').isVisible(),'choice stays between exercises');await layout('next exercise collapsed '+width);await tap('.lb-restore');}else await tap('#continue');
   await layout('next '+width);
  }
  assert.equal((await mission()).completion.length,6);assert.equal((await snap()).platformXp,55);assert((await snap()).events.every(e=>e.skill==='ab'&&e.mastery===false));await reload('completed reload '+width);await page.screenshot({path:path.join(out,`level-2-complete-${width}.png`)});
  await tap('.ab-footer [data-screen=area]');await page.waitForSelector('[data-node=ab]');assert.equal(await page.locator('[data-node=ab]').getAttribute('data-state'),'completed');await tap('[data-node=ab]');assert.equal((await mission()).run,2);await page.locator('[name=b]').fill('-1');await tap('#hint');await layout('hint '+width);await reload('hint reload '+width);
  const saved=await snap();await page.setViewportSize({width:360,height:780});assert(await page.locator('#rotateGate').isVisible());await page.setViewportSize({width,height});assert.deepEqual(await snap(),saved);await layout('rotate back '+width);assert.deepEqual(errors,[]);await ctx.close();
 }
 console.log(`PASS Signaalstad level 2: ${checks} layouts, six graphs and all 18 stages, exact signed/fractional/zero steps, real touch/keyboard/native drag, repairs, retained measurements, live graph, map, pause, reload, header collapse/restore, replay and XP. Screenshots: ${out}`);
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
