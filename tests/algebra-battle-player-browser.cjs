'use strict';
// Real native workboard in its iframe, including the smallest host simulation space.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),G=require('../games/algebra-trainer/battle-config.js'),C=require('../games/algebra-trainer/core.js'),S=require('../games/algebra-trainer/stelsels/core.js');
const root=path.resolve(__dirname,'..'),out=process.env.ALGEBRA_BATTLE_SCREENSHOTS||'/tmp/algebra-battle-player';fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://local').pathname;
 if(pathname==='/battle-fixture.html'){res.setHeader('Content-Type','text/html');return res.end(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;overflow:hidden}iframe{border:0;width:100%;height:100%;display:block}</style><iframe id="board" src="/games/algebra-trainer/battle-player.html?mode=class"></iframe><script>window.answers=[];window.active=null;window.send=spec=>{active=spec;board.contentWindow.postMessage({type:'vector-battle-question',...spec},location.origin)};addEventListener('message',e=>{if(e.source!==board.contentWindow||e.origin!==location.origin)return;if(e.data.type==='vector-battle-ready'&&active)send(active);if(e.data.type==='vector-battle-answer')answers.push(e.data)});</script>`);}
 const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.ttf':'font/ttf'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:640,height:176},hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  await page.goto('http://127.0.0.1:'+server.address().port+'/battle-fixture.html');let checks=0,index=0;
  const frame=()=>page.frames().find(f=>f.url().includes('/battle-player.html'));
  async function start(spec){await page.waitForFunction(()=>document.getElementById('board').contentWindow?.BattlePlayer);await page.evaluate(s=>send(s),{match:'isolated-battle',index:index++,learner:'alex',...spec});await frame().waitForSelector('#work .paper');await frame().evaluate(()=>document.fonts.ready);await page.waitForTimeout(60);}
  async function layout(label){await frame().evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const result=await frame().evaluate(()=>{
   const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden',bad=[],scroll=[],covered=[],clipped=[];
   for(const e of document.querySelectorAll('*')){if(!visible(e)||e.closest('.katex'))continue;const c=getComputedStyle(e);if((['auto','scroll'].includes(c.overflowY)&&e.scrollHeight>e.clientHeight+1)||(['auto','scroll'].includes(c.overflowX)&&e.scrollWidth>e.clientWidth+1))scroll.push(e.id||e.className);}
   const controls=[...document.querySelectorAll('button,input,select,a')].filter(visible);
   for(const e of controls){const r=e.getBoundingClientRect();if(r.width<43.9||r.height<43.9||r.left<-.5||r.top<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5)bad.push({id:e.id||e.textContent,rect:r.toJSON()});if(!e.disabled&&!e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)))covered.push(e.id||e.textContent);}
   for(const el of document.querySelectorAll('.katex-html')){if(!visible(el))continue;const range=document.createRange();range.selectNodeContents(el);const r=range.getBoundingClientRect();if(r.left<-.5||r.right>innerWidth+.5||r.top<-.5||r.bottom>innerHeight+.5)clipped.push(el.textContent);for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){const c=getComputedStyle(p),b=p.getBoundingClientRect();if(/hidden|clip|auto|scroll/.test(c.overflowX)&&(r.left<b.left-1||r.right>b.right+1)||/hidden|clip|auto|scroll/.test(c.overflowY)&&(r.top<b.top-1||r.bottom>b.bottom+1)){clipped.push(p.id||p.className);break;}}}
   return {bad,scroll,covered,clipped,bodyScroll:document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1,topbars:document.querySelectorAll('leraarbob-topbar,[data-collapsible-topbar]').length};
  });checks++;if(result.bad.length||result.scroll.length||result.covered.length||result.clipped.length||result.bodyScroll)await page.screenshot({path:path.join(out,'failure.png')});assert.deepEqual(result,{bad:[],scroll:[],covered:[],clipped:[],bodyScroll:false,topbars:0},label);}
  for(const [width,height]of [[1280,500],[780,176],[640,176],[640,220],[320,360]]){
   await page.setViewportSize({width,height});
   for(const seed of [0,51,4294967295]){await start({skill:'S1',seed,variant:seed%4});await layout('systems '+width+'×'+height+' seed '+seed);assert.equal(await frame().locator('[data-op]').count(),0);await frame().locator('#answerX').fill('−2');await frame().locator('#answerY').fill('');await frame().locator('#submit').tap();await layout('systems invalid input '+width+'×'+height);assert.match(await frame().locator('#inputError').textContent(),/x en y/);await frame().locator('#answerY').fill('1/2');assert.equal(await frame().locator('#inputError').textContent(),'');}
   await page.screenshot({path:path.join(out,'systems-'+width+'x'+height+'.png')});
   for(const skill of ['A1','D3','E3']){await start({skill,seed:101,variant:2,fractions:true,negative:true});await layout('equation '+skill+' '+width+'×'+height);}
  }
  await page.setViewportSize({width:640,height:176});await start({skill:'S1',seed:71,variant:2});const active=await page.evaluate(()=>active);await frame().locator('#answerX').fill('-');await frame().locator('#answerY').fill('1/');await frame().evaluate(()=>location.reload());await frame().waitForSelector('#answerX');assert.equal(await frame().locator('#answerX').inputValue(),'-');assert.equal(await frame().locator('#answerY').inputValue(),'1/');await layout('partial draft restored');
  await page.evaluate(s=>{active={...s,learner:'sam'};board.contentWindow.location.reload();},active);await frame().waitForSelector('#answerX');assert.equal(await frame().locator('#answerX').inputValue(),'','Different learner never sees previous draft');assert.equal(await frame().locator('#answerY').inputValue(),'');await layout('learner separation');
  const t=G.generate(active);await frame().locator('#answerX').fill(S.text(t.solution.x));await frame().locator('#answerY').fill(S.text(t.solution.y));await frame().locator('#answerY').press('Enter');await page.waitForFunction(()=>answers.length===1);assert.deepEqual((await page.evaluate(()=>answers[0])).answer,{x:S.text(t.solution.x),y:S.text(t.solution.y)});assert.equal(await frame().locator('#submit').isDisabled(),true);await layout('frozen accepted pair');await frame().locator('#submit').tap({force:true});assert.equal(await page.evaluate(()=>answers.length),1,'Exactly one answer message');
  await start({skill:'S1',seed:16,variant:0,projector:true});assert.equal(await frame().locator('input,button').count(),0);await layout('projector system');
  await page.evaluate(()=>board.contentWindow.postMessage({type:'vector-class-review',match:active.match,index:active.index},location.origin));await frame().waitForSelector('.system-solution');await layout('system answer review');
  await start({skill:'D3',seed:99,variant:0,fractions:true,negative:true});await frame().locator('#answer').fill('-');await frame().locator('#steps').tap();await layout('equation optional operations');const first=G.generate({skill:'D3',seed:99,variant:0,fractions:true,negative:true}).steps[0];await frame().locator('[data-op="'+first.op+'"]').tap();await layout('equation operand choices');
  const wanted=C.exprSig(first.operand);let found=false;
  for(let pageIndex=0;pageIndex<8&&!found;pageIndex++){
   const values=await frame().evaluate(()=>[...document.querySelectorAll('[data-value]')].map(b=>Number(b.dataset.value)));
   // The candidate pool uses the same unchanged native equation engine.
   const task=G.generate({skill:'D3',seed:99,variant:0,fractions:true,negative:true}),choices=C.candidateOperands(task,task.start,first.op),at=choices.findIndex(v=>C.exprSig(v)===wanted);
   if(values.includes(at)){await frame().locator('[data-value="'+at+'"]').tap();found=true;}else{await frame().locator('#choiceNext').tap();await layout('equation more operand choices');}
  }
  assert(found);await layout('equation applied step');await frame().locator('#history').tap();await layout('equation history screen');await frame().locator('[data-view=answer]').tap();await layout('equation return answer');await frame().evaluate(()=>location.reload());await frame().waitForSelector('#answer');await frame().locator('#steps').tap();assert.match(await frame().locator('#history').textContent(),/\(1\)/);await layout('old operations restored');
  await start({skill:'A1',seed:88,variant:0});await frame().locator('#answer').fill('3');await page.evaluate(()=>board.contentWindow.postMessage({type:'vector-battle-resolved',match:active.match,index:active.index,message:'De tijd is om. Wacht op de uitslag.'},location.origin));await layout('deadline freeze');
  assert.deepEqual(errors,[]);console.log('PASS '+checks+' embedded Algebra/Stelsels layout states, actual touch and Enter, drafts/reload/learner separation, single pair submission, projector/review, optional native operations and no gameplay scroll at176px');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
