'use strict';
// The browser uses invented accounts and in-memory progress. No live data writes.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const screenshots='/tmp/leraarbob-getallen-unified';
fs.mkdirSync(screenshots,{recursive:true});
const catalog=JSON.parse(fs.readFileSync(path.join(root,'games.json'),'utf8'));
const completed=['machten-product','wortels-vereenvoudigen'];
const forms=['power-product','root-product','scientific'];
const guided={version:1,screen:'home',theme:'machten',selected:'machten-betekenis',entries:Object.fromEntries(completed.map((id,i)=>[id,{done:Array.from({length:6},(_,n)=>`${i+1}:${n}`),independent:Array.from({length:6},(_,n)=>`${i+1}:${n}`)}])),runs:{},mission:null};
const legacy={version:1,screen:'setup',mode:'solo',selected:['scientific'],level:1,count:5,names:['Speler 1','Speler 2'],sessions:{},solved:forms,history:[],includeKey:false,mission:null,journey:{version:1,topics:{'op-power-power':{answers:['a','b','c'],rewarded:true,xp:30}}}};
const fixtureRows=[
 {user_id:'qa-pupil',game_id:'getallenwereld',updated_at:'2026-10-05T14:10:00Z',state:{completed,total:15,storage:{'leraarbob.getallenwereld.v1':JSON.stringify(guided)}}},
 {user_id:'qa-pupil',game_id:'bewerkingen-trainer',updated_at:'2026-10-05T14:20:00Z',state:{completed:forms,total:16,storage:{'leraarbob.bewerkingen.v1':JSON.stringify(legacy)}}}
];
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://local').pathname;
 if(!pathname.startsWith('/LeraarBob/'))return res.writeHead(404).end();
 let file=path.resolve(root,pathname.slice('/LeraarBob/'.length));
 if(file!==root&&!file.startsWith(root+path.sep))return res.writeHead(403).end();
 try{
  if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
 }catch{res.writeHead(404).end();}
});
const roleScript=JSON.stringify({axioma_games:catalog,axioma_profiles:[{user_id:'qa-pupil',alias:'Fictieve leerling',class_code:'3TBO',axioma_progress:{state:{total:0,xp:0}}}],axioma_game_progress:fixtureRows});
const auth=`(()=>{
 const account={id:'qa-owner',role:localStorage.getItem('qa-role')||'teacher',alias:'Fictieve leerkracht',email:'test@example.invalid'};
 const data=${roleScript};
 const query=table=>{const q={select(){return q},eq(){return q},order(){return q},then(resolve){return Promise.resolve(resolve({data:structuredClone(data[table]||[]),error:null}));}};return q;};
 window.__writes=0;
 window.AxiomaAuth={CLASSES:['3TBO'],ready:async()=>({account,pending:false}),getAccount:async()=>account,getSession:async()=>null,onChange:()=>()=>{},client:()=>({from:query,auth:{},rpc:async(name)=>{if(name==='axioma_class_battle_hub')return{data:{teacher:true,classes:['3TBO'],rooms:[],stats:[],leaderboards:[]},error:null};window.__writes++;throw Error('Live RPC forbidden: '+name);},functions:{invoke:async(n,{body})=>{if(n==='numbers-session'&&body.action==='summary')return{data:{online_xp:0,xp:30}};window.__writes++;throw Error('Live Edge invocation forbidden');}}})};
})();`;
async function main(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const base=process.env.LB_SITE_URL?.replace(/\/$/,'')||origin+'/LeraarBob';
 const site=new URL(base+'/');
 let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.ALGEBRA_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  const page=await context.newPage(),errors=[],missing=[],saved=new Map();
  for(const row of fixtureRows)saved.set('qa-owner:'+row.game_id,{state:row.state,revision:1});
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()===404)missing.push(response.url());});
  await page.exposeFunction('__qaLoad',(game,user)=>saved.get(user+':'+game)||null);
  await page.exposeFunction('__qaOverview',()=>({accountId:'qa-owner',games:[...saved.entries()].filter(([key])=>key.startsWith('qa-owner:')).map(([key,row])=>({game_id:key.slice('qa-owner:'.length),state:row.state})),trainer:null,errors:{games:false,trainer:false}}));
  await page.exposeFunction('__qaSave',(game,state,revision,user)=>{
   assert(['getallenwereld','bewerkingen-trainer'].includes(game),'Only the existing progress identities may be saved');
   saved.set(user+':'+game,{state,revision:revision+1});
   return{status:'saved',revision:revision+1};
  });
  await page.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.origin!==site.origin||route.request().method()!=='GET')return route.fulfill({body:''});
   if(url.pathname.endsWith('/axioma-auth.js'))return route.fulfill({contentType:'text/javascript',body:auth});
   if(url.pathname.endsWith('/axioma-progress.js'))return route.fulfill({contentType:'text/javascript',body:'window.AxiomaProgress={load:async(g,u)=>__qaLoad(g,u),save:async(g,s,r,u)=>__qaSave(g,s,r,u),loadOverview:async()=>__qaOverview()};'});
   if(url.pathname.endsWith('/axioma-social.js'))return route.fulfill({contentType:'text/javascript',body:'window.AxiomaSocial={state:()=>({}),onChange:()=>()=>{}};'});
   return route.continue();
  });
  const open=async url=>{await page.goto(base+url);await page.evaluate(()=>LeraarBobGameRegistry.ready());};
  const guidedReady=()=>page.waitForFunction(()=>window.GetallenWorld&&AxiomaGame.active);
  const seriesReady=()=>page.waitForFunction(()=>window.BewerkingenTrainer&&AxiomaGame.active);
  const getLive=()=>page.evaluate(()=>{const s=GetallenWorld.snapshot();return{entries:s.entries,runs:s.runs,mission:s.mission};});
  const getSeries=()=>page.evaluate(()=>BewerkingenTrainer.snapshot());
  const seriesProgress=s=>({sessions:JSON.parse(JSON.stringify(s.sessions,(k,v)=>k==='activeSeconds'?undefined:v)),solved:s.solved,history:s.history,journey:s.journey,mission:s.mission});
  async function topbarFit(label){
   await page.evaluate(()=>document.fonts.ready);
   await page.screenshot({path:path.join(screenshots,label+'.png')});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,label+' horizontal overflow');
   if(page.viewportSize().width>=640&&page.viewportSize().height<=500&&await page.locator('body[data-screen=play]').count()){
    const problems=await page.evaluate(()=>{
     const bad=[];
     if(document.documentElement.scrollHeight>innerHeight+1)bad.push('page needs vertical scrolling');
     for(const e of document.querySelectorAll('#playHost [data-smart-slot],#playHost [data-smart-value],#playHost .smart-submit')){
      if(!e.getClientRects().length)continue;
      const r=e.getBoundingClientRect();
      if(r.width<43.5||r.height<43.5)bad.push('small input target '+(e.id||e.textContent));
      if(r.top<0||r.bottom>innerHeight+1)bad.push('input outside viewport '+(e.id||e.textContent));
     }
     return bad;
    });
    assert.deepEqual(problems,[],label+' compact active play');
   }
   const restore=page.locator('.lb-restore:not([hidden])');
   if(await restore.count()){
    const rectangle=await restore.boundingBox();
    assert(rectangle.width>=44&&rectangle.height>=44,label+' restore target');
    assert(rectangle.x>=0&&rectangle.y>=0&&rectangle.x+rectangle.width<=page.viewportSize().width+1,label+' restore visible');
    const overlaps=await page.evaluate(()=>{
     const restore=document.querySelector('.lb-restore:not([hidden])').getBoundingClientRect();
     return[...document.querySelectorAll('main input, main button')].filter(e=>e.getClientRects().length).filter(e=>{const r=e.getBoundingClientRect();return r.left<restore.right&&r.right>restore.left&&r.top<restore.bottom&&r.bottom>restore.top;}).map(e=>e.id||e.textContent);
    });
    assert.deepEqual(overlaps,[],label+' restore does not cover an input or action');
   }
  }
  // Both legacy identities resolve to one public world, without combining counters.
  await open('/');
  await page.waitForSelector('[data-game-id=getallenwereld]');
  assert.equal(await page.locator('[data-game-id=getallenwereld]').count(),1);
  assert.equal(await page.locator('[data-game-id=bewerkingen-trainer]').count(),0);
  const registry=await page.evaluate(()=>({public:LeraarBobGameRegistry.list().filter(g=>g.id==='getallenwereld'||g.id==='bewerkingen-trainer').map(g=>g.id),legacy:LeraarBobGameRegistry.game('bewerkingen').id,presentation:LeraarBobGameRegistry.presentation('bewerkingen-trainer').id,components:LeraarBobGameRegistry.components('getallenwereld').map(g=>({id:g.id,progressId:g.progressId,total:g.progressTotal})),current:LeraarBobGameRegistry.current(new URL('games/bewerkingen-trainer/',LeraarBobGameRegistry.baseURL).href).id,internal:LeraarBobGameRegistry.current(new URL('games/bewerkingen-trainer/',LeraarBobGameRegistry.baseURL).href,{includeComponents:true}).id}));
  assert.deepEqual(registry,{public:['getallenwereld'],legacy:'bewerkingen-trainer',presentation:'getallenwereld',components:[{id:'getallenwereld',progressId:'getallenwereld',total:15},{id:'bewerkingen-trainer',progressId:'bewerkingen-trainer',total:16}],current:'getallenwereld',internal:'bewerkingen-trainer'});
  await open('/oefenbladen.html');
  await page.waitForSelector('#worksheetProviders .paper-subject');
  const printTitles=await page.locator('.paper-subject h2').allTextContents();
  assert.equal(printTitles.filter(title=>title==='Getallenwereld').length,1);
  assert.equal(printTitles.filter(title=>/Bewerkingentrainer/.test(title)).length,0);
  const paperLink=page.locator('[data-provider=getallenwereld]').first();
  assert.equal(new URL(await paperLink.getAttribute('href'),base).searchParams.get('intent'),'worksheet');
  await open('/klasbattle/');
  await page.waitForSelector('#gameCards .gameCard');
  const battleTitles=await page.locator('#gameCards .gameCard').allTextContents();
  assert.equal(battleTitles.filter(title=>/Getallenwereld/.test(title)).length,1);
  assert.equal(battleTitles.filter(title=>/Bewerkingentrainer/.test(title)).length,0);
  assert.equal(await page.locator('[data-simulate=bewerkingen]').count(),1,'The historical server battle identity remains unchanged');
  await open('/teacher/');
  await page.waitForSelector('[data-game=getallenwereld]');
  assert.equal(await page.locator('[data-game=bewerkingen-trainer]').count(),0,'One teacher filter for the public world');
  await page.locator('[data-game=getallenwereld]').click();
  assert.equal(await page.locator('tbody tr:first-child td[data-label]').count(),1);
  assert.match(await page.locator('[data-label=Getallenwereld]').textContent(),/2\/15.*3\/16/);
  await page.locator('[data-id=qa-pupil]').click();
  const teacherText=await page.locator('#detail').innerText();
  assert.match(teacherText,/2\/15/);assert.match(teacherText,/3\/16/);
  assert.doesNotMatch(teacherText,/5\/31/);
  assert.equal(await page.locator('#detail [data-progress-component=getallenwereld]').count(),1);
  assert.equal(await page.locator('#detail [data-progress-component=bewerkingen-trainer]').count(),1);
  // Guided work survives mode navigation and contextual returns exactly.
  await open('/games/getallenwereld/');await guidedReady();
  assert.equal(await page.locator('.theme').count(),3);
  for(const [width,height]of [[1280,800],[780,360],[640,360],[390,844],[360,640]]){
   await page.setViewportSize({width,height});
   for(const collapsed of[false,true]){
    if(collapsed)await page.locator('leraarbob-topbar .collapse').click();
    await topbarFit('world-home-'+width+'-'+collapsed);
    const issues=await page.evaluate(()=>{const bad=[];if(document.documentElement.scrollHeight>innerHeight+1)bad.push('page scroll');for(const e of document.querySelectorAll('.themes>.theme,.world-actions a,.dock button')){const r=e.getBoundingClientRect();if(r.width<44||r.height<44)bad.push('small '+e.textContent);if(r.top<0||r.bottom>innerHeight+1||r.left<0||r.right>innerWidth+1)bad.push('clipped '+e.textContent);}return bad;});assert.deepEqual(issues,[],width+' home '+collapsed);
    if(collapsed){await page.reload();await guidedReady();assert.equal(await page.locator('.lb-restore').isVisible(),true);await page.locator('.lb-restore').click();}
   }
  }
  await page.setViewportSize({width:1280,height:800});
  await page.locator('.theme[data-theme=machten]').click();
  await page.locator('[data-stop=machten-betekenis]').click();
  assert.equal((await getLive()).mission,null,'Selecting a level does not start an exercise');
  await page.locator('[data-action=start]').click();
  const task=await page.evaluate(()=>GetallenWorld.task());
  await page.locator('[data-rule="'+task.correct+'"]').click();
  await page.locator('[data-slot="0"]').click();await page.locator('[data-choice]').first().click();
  const guidedWork=await getLive();
  await page.locator('.playhead [data-action=chapter]').click();
  const returnPath=new URL(page.url()).pathname+new URL(page.url()).search+new URL(page.url()).hash;
  await page.locator('[data-stop=machten-product]').click();
  for(const mode of ['series','worksheet']){const u=new URL(await page.locator('.world-actions [data-world-mode='+mode+']').getAttribute('href'),base);assert.equal(u.searchParams.get('skills'),'power-product','Selected learning goal follows '+mode);}
  await page.locator('[data-stop=machten-betekenis]').click();
  const actionLinks=await page.locator('.world-actions [data-world-mode]').evaluateAll(es=>es.map(e=>({mode:e.dataset.worldMode,href:e.href})));
  for(const id of ['series','worksheet','rankings','students'])assert(actionLinks.some(link=>link.mode===id),'World action '+id);
  for(const link of actionLinks){assert.equal(new URL(link.href).searchParams.get('returnTo'),returnPath,'Exact selected-level return for '+link.mode);}
  await page.locator('.world-actions [data-world-mode=series]').click();await page.locator('[data-go=solo]').click();await seriesReady();
  assert.equal(await page.locator('#axioma-game-status').evaluate(e=>e.shadowRoot.querySelector('.dock').hidden),true,'The shared topbar owns the account and progress controls');
  assert.match(await page.locator('leraarbob-topbar [part=crumb-game]').textContent(),/Getallenwereld/);
  assert.doesNotMatch(await page.locator('leraarbob-topbar [part=crumb-game]').textContent(),/Bewerkingentrainer/);
  const beforeSelection=seriesProgress(await getSeries());
  assert.deepEqual(beforeSelection.sessions,{});
  assert(await page.locator('#setupScreen').isVisible());
  for(const mode of ['teacher','duo','solo']){const u=new URL(page.url());u.searchParams.set('mode',mode);u.searchParams.set('screen','setup');await page.goto(u.href);await seriesReady();}
  assert.deepEqual(seriesProgress(await getSeries()),beforeSelection,'Mode selection creates no questions, attempts or XP');
  await page.locator('#startBtn').click();
  await page.locator('[data-smart-player="0"] [data-smart-value]').first().click();
  const savedSmart=await page.locator('[data-smart-player="0"]').innerText();
  await page.locator('.scratch summary').click();
  await page.locator('[data-notes="0"]').fill('Mijn bewaarde tussenstap');
  const seriesWork=seriesProgress(await getSeries());
  await page.evaluate(()=>AxiomaGame.flush());
  // The contextual return restores the same selected level and partial input.
  await page.locator('leraarbob-topbar .menu:visible,leraarbob-topbar .mobile-menu:visible').first().click();
  const returnButton=page.locator('leraarbob-topbar .menu-card').filter({has:page.locator('.menu-name',{hasText:'Terug naar Getallenwereld'})});
  assert.equal(await returnButton.count(),1,'The contextual return is offered once');
  await returnButton.click();await guidedReady();
  assert.equal(new URL(page.url()).searchParams.get('level'),'machten-betekenis');
  assert.deepEqual(await getLive(),guidedWork);
  await page.locator('[data-action=start]').click();
  assert.equal((await getLive()).mission.values[0],guidedWork.mission.values[0]);
  // Scientific notation opens the old provider as an internal, explicit-start route.
  await page.locator('leraarbob-topbar [part=crumb-game]').click();
  await page.locator('.theme[data-topic=wetenschappelijk]').click();await seriesReady();
  const scientific=await getSeries();
  assert.equal(scientific.screen,'setup');
  assert.deepEqual(scientific.selected,['scientific']);
  assert.deepEqual(seriesProgress(scientific),seriesWork,'Scientific selection preserves existing sessions and rewards');
  const scientificURL=new URL(page.url()).pathname+new URL(page.url()).search;
  await page.locator('#selectAll').click();
  assert.equal((await getSeries()).selected.length,16);
  assert.equal(new URL(page.url()).searchParams.has('topic'),false,'A mixed selection clears the previous topic');
  await page.evaluate(()=>AxiomaGame.flush());await page.reload();await seriesReady();
  assert.equal((await getSeries()).selected.length,16,'Mixed question choices survive reload');
  assert.deepEqual(seriesProgress(await getSeries()),seriesWork);
  await page.goto(new URL(scientificURL,base).href);await seriesReady();
  await page.locator('#resumeBtn').click();
  assert.equal(await page.locator('[data-smart-player="0"]').innerText(),savedSmart);
  assert.deepEqual((await getSeries()).selected,['scientific'],'The next series selection remains separate');
  assert.equal(await page.locator('#crumbGroup').textContent(),'Machten & letters','The resumed exercise shows its actual topic rather than the next selection');
  const activeBattleURL=new URL(await page.locator('[data-getallen-class]').first().getAttribute('href'),base);
  assert.equal(activeBattleURL.searchParams.get('world'),'machten');
  assert.equal(new URL(activeBattleURL.searchParams.get('returnTo'),base).searchParams.get('world'),'wetenschappelijk','The battle return preserves the next series selection');
  // Collapse/reopen/reload keeps the actual work and has an accessible restore button.
  for(const [width,height]of [[1280,800],[780,360],[640,360],[390,844],[320,700]]){
   await page.setViewportSize({width,height});
   await topbarFit('series-open-'+width);
   await page.locator('leraarbob-topbar .collapse').click();
   assert.equal(await page.locator('.lb-restore').getAttribute('aria-expanded'),'false');
   await topbarFit('series-collapsed-'+width);
   assert.deepEqual(seriesProgress(await getSeries()),seriesWork);
   await page.evaluate(()=>AxiomaGame.flush());await page.reload();await seriesReady();
   assert.equal(await page.locator('.lb-restore').getAttribute('aria-expanded'),'false');
   assert.deepEqual(seriesProgress(await getSeries()),seriesWork);
   await page.locator('.lb-restore').click();
   assert.equal(await page.locator('[data-smart-player="0"]').innerText(),savedSmart);
  }
  await page.setViewportSize({width:1280,height:800});
  // A worksheet uses separate generated questions and leaves all play modes intact.
  await open('/games/bewerkingen-trainer/?world=wetenschappelijk&intent=worksheet&screen=setup&returnTo='+encodeURIComponent(returnPath));await seriesReady();
  assert.deepEqual(seriesProgress(await getSeries()),seriesWork);
  await page.locator('#startBtn').click();
  await page.waitForSelector('#sheetScreen:not([hidden]) .paper');
  assert(await page.locator('.answer-space').count()>0);
  assert.deepEqual(seriesProgress(await getSeries()),seriesWork,'Preparing paper is not a learner attempt');
  await page.locator('#includeKey').check();assert(await page.locator('#sheetHost .step').count()>0);
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('leraarbob-topbar').isVisible(),false);
  assert.equal(await page.locator('#playScreen').isVisible(),false);
  await page.screenshot({path:path.join(screenshots,'print.png')});await page.emulateMedia({media:'screen'});
  // Teacher and board duo retain independent sessions, with no pupil completion reward.
  await open('/games/bewerkingen-trainer/?mode=teacher&world=wetenschappelijk&screen=setup');await seriesReady();
  assert.deepEqual(seriesProgress(await getSeries()),seriesWork);
  await page.locator('#startBtn').click();await page.locator('#teacherStep').click();
  assert.equal((await getSeries()).sessions.teacher.work['0:0'].reveal,1);
  const teacherWork=await getSeries();
  for(const [width,height]of [[1280,800],[780,360],[640,360],[390,844],[320,700]]){
   await page.setViewportSize({width,height});await topbarFit('teacher-open-'+width);
   await page.locator('leraarbob-topbar .collapse').click();await topbarFit('teacher-collapsed-'+width);
   assert.deepEqual((await getSeries()).sessions.teacher,teacherWork.sessions.teacher);
   await page.locator('.lb-restore').click();
  }
  await page.setViewportSize({width:1280,height:800});
  await open('/games/bewerkingen-trainer/battle.html?world=wetenschappelijk&returnTo='+encodeURIComponent(returnPath));await seriesReady();
  assert.equal((await getSeries()).screen,'setup');
  assert.equal((await getSeries()).mode,'duo');
  assert.deepEqual((await getSeries()).sessions.teacher,teacherWork.sessions.teacher);
  await page.locator('#startBtn').click();
  assert.equal(await page.locator('[data-answer]').count(),2);
  await page.locator('[data-smart-player="0"] [data-smart-value]').first().click();await page.locator('[data-smart-player="1"] [data-smart-value]').last().click();
  const drafts=(await getSeries()).sessions.duo.work;assert.notDeepEqual(drafts['0:0'].smart.values,drafts['0:1'].smart.values);
  assert.deepEqual(seriesProgress(await getSeries()).sessions.solo,seriesWork.sessions.solo);
  assert.deepEqual((await getSeries()).history,seriesWork.history);
  assert.deepEqual((await getSeries()).solved,seriesWork.solved);
  const duoWork=(await getSeries()).sessions.duo;
  for(const [width,height]of [[1280,800],[780,360],[640,360],[390,844],[320,700]]){
   await page.setViewportSize({width,height});await topbarFit('duo-open-'+width);
   await page.locator('leraarbob-topbar .collapse').click();await topbarFit('duo-collapsed-'+width);
   assert.deepEqual((await getSeries()).sessions.duo,duoWork);
   await page.locator('.lb-restore').click();
  }
  const oldReturn=new URL(page.url()).searchParams.get('returnTo');assert.equal(oldReturn,returnPath,'The legacy battle entry preserves its return');
  await page.evaluate(()=>AxiomaGame.flush());
  assert.deepEqual(Object.keys(saved.get('qa-owner:getallenwereld').state.storage),['leraarbob.getallenwereld.v1']);
  assert.deepEqual(Object.keys(saved.get('qa-owner:bewerkingen-trainer').state.storage),['leraarbob.bewerkingen.v1']);
  await page.evaluate(()=>localStorage.setItem('qa-role','student'));await open('/');
  await page.waitForSelector('[data-game-id=getallenwereld] [data-progress-component=bewerkingen-trainer]');
  assert.equal(await page.locator('[data-game-id=getallenwereld]').count(),1);
  assert.equal(await page.locator('[data-game-id=bewerkingen-trainer]').count(),0);
  assert.match(await page.locator('[data-game-id=getallenwereld] [data-progress-component=bewerkingen-trainer]').textContent(),/3 van 16.*30 XP/);
  assert.equal(await page.locator('#totalXP').textContent(),'30','Actual legacy XP remains in the platform total');
  assert.equal(await page.evaluate(()=>window.__writes),0);
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  await context.close();
  console.log('PASS: one public number world, three topics, separate historical progress, classroom/print/teacher/duo routes, exact returns, explicit starts, real input preservation and five viewports with persistent collapsible topbar.');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
