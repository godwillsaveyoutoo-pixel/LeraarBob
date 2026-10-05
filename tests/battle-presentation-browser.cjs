'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const Presentation=require('../shared/multiplayer/battle-presentation.js');
const ranks=Presentation.standings([{id:'a',alias:'A',points:20},{id:'b',alias:'B',points:20},{id:'c',alias:'C',points:10}]);
assert.deepEqual(ranks.map(p=>p.place),[1,1,3]);
const root=path.resolve(__dirname,'..'),screens='/tmp/leraarbob-class-stage';fs.mkdirSync(screens,{recursive:true});
const server=http.createServer((req,res)=>{let file=path.join(root,new URL(req.url,'http://local').pathname);try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{let browser;await new Promise(r=>server.listen(0,'127.0.0.1',r));try{
 const base='http://127.0.0.1:'+server.address().port;browser=await chromium.launch({headless:true,executablePath:process.env.ALGEBRA_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==base)return r.fulfill({body:''});
  if(u.pathname.endsWith('/axioma-auth.js'))return r.fulfill({contentType:'text/javascript',body:`const teacher={id:'teacher-1',alias:'Bob',role:'teacher'};window.__writes=0;window.AxiomaAuth={ready:async()=>({account:teacher}),getAccount:async()=>teacher,onChange:()=>()=>{},CLASSES:[],client:()=>({rpc:async()=>({data:{players:[],invitations:[],state:{},revision:0}}),functions:{invoke:async(n,o)=>{if(o?.body?.action==='summary')return {data:{xp:0}};window.__writes++;throw Error('Remote sessions forbidden')}}})};`});
  if(['/shared/axioma-game.js','/js/account-ui.js','/shared/axioma-social.js'].includes(u.pathname))return r.fulfill({body:''});
  if(u.pathname.endsWith('/axioma-progress.js'))return r.fulfill({contentType:'text/javascript',body:'window.AxiomaProgress={load:async()=>null,loadOverview:async()=>({games:[],errors:{}})};'});
  return r.continue();
 });
 async function fits(label,action){
  await page.waitForTimeout(400);
  const metrics=await page.evaluate(sel=>{const e=document.querySelector(sel),r=e?.getBoundingClientRect();return{page:document.documentElement.scrollHeight<=innerHeight+2,width:document.documentElement.scrollWidth<=innerWidth+2,action:r&&r.top>=0&&r.bottom<=innerHeight+1&&r.left>=0&&r.right<=innerWidth+1&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)),rows:(()=>{const list=document.querySelector('.battle-ranking');if(!list)return;const r=list.getBoundingClientRect(),h=list.parentElement.getBoundingClientRect();return Math.min(r.bottom,h.bottom,innerHeight)-Math.max(r.top,h.top,0)})()};},action);
  if(!metrics.page||!metrics.width||!metrics.action){await page.screenshot({path:screens+'/failure.png'});console.error(await page.evaluate(()=>({height:innerHeight,html:document.documentElement.scrollHeight,body:document.body.getBoundingClientRect().toJSON(),nodes:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().bottom>innerHeight+2&&e.getBoundingClientRect().height>0).slice(0,15).map(e=>[e.tagName,e.id,e.className,e.getBoundingClientRect().toJSON(),getComputedStyle(e).position])})));}assert(metrics.page&&metrics.width&&metrics.action,label+' '+JSON.stringify(metrics));
  if(await page.locator('.battle-ranking').count()&&metrics.rows<44)await page.screenshot({path:screens+'/row-failure.png'});if(await page.locator('.battle-ranking').count())assert(metrics.rows>=44,label+' at least one full ranking row '+JSON.stringify(metrics));
 }
 for(const [game,url]of [['rechten','/games/rechten/rechtenwereld/classroom.html'],['algebra','/games/algebra-trainer/classroom.html'],['getallen-legacy','/games/bewerkingen-trainer/classroom.html']]){
  await page.setViewportSize({width:1280,height:800});await page.goto(base+url+'?simulation=1&create=1');await page.locator('#startSimulation').click();
  for(const [width,height]of [[1280,800],[640,360],[390,844],[320,700]]){await page.setViewportSize({width,height});await fits(game+' lobby '+width,'#start');}
  await page.locator('#start').click();await page.locator('#endRound,#simulationEndRound').click();await page.locator('.battle-ranking').waitFor();
  for(const [width,height]of [[1280,800],[640,360],[390,844],[320,700]]){
   await page.setViewportSize({width,height});await fits(game+' result '+width,'#next');
   await page.screenshot({path:`${screens}/${game}-${width}.png`});
   await page.locator('leraarbob-topbar .collapse').click();await fits(game+' collapsed '+width,'#next');await page.locator('.lb-restore').click();
  }
  const sessionId=await page.evaluate(()=>LeraarBobClassroom.snapshot().id);await page.locator('leraarbob-topbar .collapse').click();await page.reload();await page.locator('#next').waitFor();assert.equal(await page.evaluate(()=>LeraarBobClassroom.snapshot().id),sessionId);await page.locator('.lb-restore').click();
  // Ties, unsafe alias text, own position outside top ten, stable renders and reduced motion.
  await page.evaluate(()=>{const host=document.querySelector('#battleStandings'),rows=Array.from({length:30},(_,i)=>({id:'p'+i,alias:i===0?'<img src=x onerror=alert(1)>':'Leerling '+i,points:i<2?100:100-i,previousPoints:0}));window.testRows=rows;LeraarBobBattlePresentation.render(host,{rows,ownId:'p29',final:true,list:document.querySelector('#ranking')});window.firstMedal=host.firstChild;});
  assert.equal(await page.locator('.battle-medal[data-place="1"] .battle-medal-names strong').count(),2);assert.equal(await page.locator('.battle-medal[data-place="2"]').count(),0);assert.match(await page.locator('.battle-ranking .mine').innerText(),/Leerling 29/);assert.equal(await page.locator('#battleStandings img').count(),0);await fits(game+' positive podium portrait','#next');await page.screenshot({path:`${screens}/${game}-podium.png`});await page.setViewportSize({width:640,height:360});await fits(game+' positive podium landscape','#next');
  await page.evaluate(()=>LeraarBobBattlePresentation.render(document.querySelector('#battleStandings'),{rows:testRows,ownId:'p29',final:true,list:document.querySelector('#ranking')}));assert.equal(await page.evaluate(()=>firstMedal===document.querySelector('#battleStandings').firstChild),true);
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.battle-medal').first().evaluate(e=>getComputedStyle(e).animationName),'none');await page.emulateMedia({reducedMotion:'no-preference'});
  await page.locator('#next').click();assert.equal(await page.locator('.battle-standings').isVisible(),false);assert.equal(await page.evaluate(()=>__writes),0);
 }
 await page.setViewportSize({width:1280,height:800});await page.goto(base+'/games/bewerkingen-trainer/start.html?view=battle&audience=class');await page.locator('#simulateSpace').click();await page.locator('#hostStart').click();
 await page.locator('#showMembers').click();await page.locator('#simulateAnswers').click();await page.locator('#closePanel').click();await page.locator('#hostEnd').click();await page.locator('#confirmEnd').click();await page.locator('.battle-podium').waitFor();
 for(const [width,height]of [[1280,800],[640,360],[390,844],[320,700]]){await page.setViewportSize({width,height});await fits('getallen result '+width,'#hostNext');await page.screenshot({path:`${screens}/getallen-${width}.png`});await page.locator('leraarbob-topbar .collapse').click();await fits('getallen collapsed '+width,'#hostNext');await page.locator('.lb-restore').click();}
 await page.locator('#showSolution').click();await page.locator('#spacePanel[open]').waitFor();await page.locator('#closePanel').click();await page.locator('#hostNext').click();await page.locator('#smartSessionAnswer').waitFor();assert.equal(await page.locator('.battle-podium').count(),0);
 for(let i=0;i<5;i++){await page.locator('#hostEnd').click();await page.locator('#confirmEnd').click();await page.locator('#hostNext').click();}await page.locator('#backHome').waitFor();await fits('getallen final','#backHome');assert.match(await page.locator('.battle-ranking-heading').innerText(),/Eindranglijst/);
 assert.equal(await page.evaluate(()=>__writes),0);assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,checks:['Three world providers and new numbers sessions','Lobby and results fit desktop, landscape and portrait with fixed next action','Shared places, own rank outside top ten, safe aliases and unchanged renders','Reduced motion, round continuation and worked answer','No live session writes'],screens}));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
