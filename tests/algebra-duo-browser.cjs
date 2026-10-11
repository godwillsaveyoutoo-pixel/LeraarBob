'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright'),{start}=require('../scripts/serve-rechten-entry-preview.cjs');
const Game=require('../games/algebra-trainer/battle-config.js'),out=process.env.WORLDS_QA||'/tmp/lb-world-redesign/duo';fs.mkdirSync(out,{recursive:true});
const report={checks:[],errors:[],scope:'Real local SQL/Edge, synthetic accounts; no production writes'};
(async()=>{let server,browser;try{
 server=await start({port:0});browser=await chromium.launch({headless:true,executablePath:process.env.LB_CHROMIUM||(fs.existsSync('/opt/brave.com/brave/brave')?'/opt/brave.com/brave/brave':undefined),args:['--no-sandbox','--disable-dev-shm-usage']});
 async function open(user){const c=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1});await c.route('**/*',r=>new URL(r.request().url()).origin===server.base?r.continue():r.abort());const p=await c.newPage();p.setDefaultTimeout(25000);p.on('pageerror',e=>report.errors.push(e.message));await p.goto(server.base+'/os/?previewUser='+user);await p.waitForFunction(()=>LeraarBobDesktop?.state().accountId);return p;}
 const active=async p=>(await p.locator('.frame-wrapper:not([hidden])>iframe').elementHandle()).contentFrame();
 const board=async f=>(await f.locator('#board').elementHandle()).contentFrame();
 const a=await open('alex'),b=await open('sam'),teacher=await open('teacher');
 assert.equal(await teacher.evaluate(()=>LeraarBobDesktop.openApp('algebra-trainer','online')),false);
 await a.evaluate(()=>LeraarBobDesktop.openApp('algebra-trainer','solo'));const solo=await active(a);await solo.locator('[data-menu-stop=route-two]').click();await solo.locator('.menuDuo').click();let x=await active(a);await x.locator('#duelWorld option').first().waitFor({state:'attached'});assert.equal(await x.locator('#duelWorld option').count(),8);
 assert.equal(await x.locator('#duelWorld').inputValue(),'route-two','Selected native chapter passes to the OS duel');await a.screenshot({path:path.join(out,'uitnodigen.png')});await x.locator('.person').filter({hasText:'sam'}).getByRole('button',{name:'Uitdagen'}).click();await x.locator('#roundPanel').filter({hasText:'Wachten op'}).waitFor();const id=await x.evaluate(()=>LeraarBobDuo.snapshot().id);
 await b.waitForFunction(()=>document.getElementById('invitationCount').textContent==='1');await b.locator('#personalInbox').click();assert.match(await b.locator('#personalDialogBody').innerText(),/Vergelijkingen · Duo Battle/);await b.getByRole('button',{name:'Deelnemen',exact:true}).click();let y=await active(b);await y.locator('#ready:not([hidden])').waitFor();await x.locator('#ready:not([hidden])').waitFor();assert(!await x.locator('#board').isVisible());await a.screenshot({path:path.join(out,'wachtkamer.png')});
 await x.locator('#ready').click();assert(!await x.locator('#board').isVisible());await y.locator('#ready').click();
 for(let round=1;round<=5;round++){
  await x.waitForFunction(n=>LeraarBobDuo.snapshot().phase==='playing'&&document.getElementById('round').textContent.includes('Ronde '+n+'/'),round);
  const spec=(await server.fixture.learn.db.query('select task from axioma_private.algebra_duels where id=$1',[id])).rows[0].task,t=Game.generate(spec),value=t.solution.n+'/'+t.solution.d;
  const p=await board(x),q=await board(y);await p.locator('#answer').fill(value);await q.locator('#answer').fill('9999999');
  if(round===1){
   await a.locator('#minimizeApp').click();await a.locator('.running-app[title*="Duo Battle"]').click();assert.equal(await active(a),x);assert.equal(await p.locator('#answer').inputValue(),value);
   await p.goto(p.url());await p.locator('#answer').waitFor();assert.equal(await p.locator('#answer').inputValue(),value);
   await a.locator('leraarbob-topbar .theme-toggle').click();await p.waitForFunction(()=>document.documentElement.dataset.mode==='dark');await a.screenshot({path:path.join(out,'duo-donker.png')});
   for(const viewport of [{width:390,height:844},{width:640,height:360}]){await a.setViewportSize(viewport);for(const collapsed of [false,true]){await a.evaluate(v=>LeraarBobTopbar.setCollapsed(v,true),collapsed);const r=await p.locator('#submit').boundingBox();assert(r&&r.width>=44&&r.height>=44&&r.y>=0&&r.y+r.height<=viewport.height+1,'Native duel answer reachable '+JSON.stringify({viewport,collapsed,r}));assert.equal(await p.locator('#answer').inputValue(),value);}}await a.setViewportSize({width:1366,height:768});await a.evaluate(()=>LeraarBobTopbar.setCollapsed(false,true));await p.locator('#steps').click();await p.locator('[data-op="-"]').click();await p.locator('[data-value]').first().click();await p.getByRole('button',{name:'Antwoord →',exact:true}).click();await p.locator('#answer').fill(value);
   await a.locator('#startButton').click();await a.keyboard.press('Escape');assert.equal(await p.locator('#answer').inputValue(),value);
  }
  await p.locator('#submit').click();await q.locator('#submit').click();await x.waitForFunction(()=>['round_result','finished'].includes(LeraarBobDuo.snapshot().phase));
  if(round<5){await x.locator('#next').click();await y.locator('#next').click();}
 }
 assert.equal(await x.evaluate(()=>LeraarBobDuo.snapshot().phase),'finished');assert.match(await x.locator('#score').innerText(),/alex 5.*0 sam/);await a.screenshot({path:path.join(out,'eindstand.png')});
 report.checks.push('Eight scopes: seven native routes plus mix; teacher cannot start pupil duel','OS alias invitation opens correct provider from central inbox; acceptance and both-ready barrier','Five real rounds, native exact grading, original equation steps and input','Minimize/resume, native board reload, central Start, inherited dark theme retain the open answer','Final score 5–0 with no JavaScript errors');assert.deepEqual(report.errors,[]);
 }catch(e){report.failure=e.stack;throw e;}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();await server?.close();}
 console.log('PASS algebra duo '+report.checks.length+' groups');
})().catch(e=>{console.error(e);process.exitCode=1});
