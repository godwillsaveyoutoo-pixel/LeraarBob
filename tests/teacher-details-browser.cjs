// Isolated browser, fictitious pupils and intercepted requests only.
const assert=require('node:assert/strict'),fs=require('node:fs');
const V=require('../games/vectoren/vector-core.js'),R=require('../games/reele-getallen/real-core.js');
const PORT=process.env.VECTOR_BROWSER_PORT||9245,BASE=process.env.VECTOR_BASE_URL||'http://127.0.0.1:8775';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
class CDP{
 async connect(url){this.id=0;this.pending=new Map();this.errors=[];this.ws=new WebSocket(url);await new Promise(r=>this.ws.onopen=r);this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else {if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails);this.event?.(m)}}}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
 async until(expression){for(let i=0;i<100;i++){if(await this.eval(expression))return;await wait(40)}throw Error('Timeout '+expression)}
}
const catalog=JSON.parse(fs.readFileSync('games.json'));
const featuredIds=catalog.filter(g=>g.featured).sort((a,b)=>(a.featureOrder||0)-(b.featureOrder||0)).map(g=>g.id);
const games=catalog.filter(g=>g.teacherVisible||g.id==='rechtenwereld').map(g=>({id:g.id,title:g.title,theme:g.theme,teacher_visible:true,progress_type:g.progressType,metadata:{}}));
const vp=V.TrainerScheduler.freshState();for(let i=0;i<3;i++)V.TrainerScheduler.record(vp,V.TaskGenerator.generate('props'),{clean:true,now:1700000000000+i});
V.TrainerScheduler.record(vp,V.TaskGenerator.generate('equal'),{clean:false,solved:true,code:'xy',now:1700000001000});
const rp=R.Progress.fresh();R.Progress.record(rp,R.generate('rootcalc'),{clean:false,solved:true,code:'root-value',now:1700000002000});delete rp.activity;
const rows=[{user_id:'alice',game_id:'vectoren-trainer',updated_at:'2026-09-21T10:00:00Z',state:{storage:{'axioma-vectorentrainer-v020':JSON.stringify({progress:vp,draft:{skill:'equal',done:true}})}}},{user_id:'alice',game_id:'reele-getallen-trainer',updated_at:'2026-09-21T10:00:00Z',state:{storage:{'axioma-real-numbers-v1':JSON.stringify({progress:rp,draft:{skill:'rootcalc',phase:'feedback',dirty:true,errorCode:'root-value'}})}}}];
rows.push({user_id:'alice',game_id:'rechten-trainer',state:{rechtenV2:{missions:{slope:{completed:true,world:'hellingrug'}},events:[]}}},{user_id:'bob',game_id:'wortelbouw',state:{completed:['length-2'],total:14}});
rows.push({user_id:'alice',game_id:'getallenwereld',updated_at:'2026-10-05T14:10:00Z',state:{completed:['machten-product','wortels-vereenvoudigen'],total:15,storage:{'leraarbob.getallenwereld.v1':JSON.stringify({version:1,entries:{'machten-product':{done:['1:0','1:1','1:2','1:3','1:4','1:5'],independent:['1:0','1:1','1:2','1:3','1:4','1:5']},'wortels-vereenvoudigen':{done:['2:0','2:1','2:2','2:3','2:4','2:5'],independent:['2:0','2:1','2:2','2:3','2:4']}}})}}});
rows.push({user_id:'alice',game_id:'bewerkingen-trainer',updated_at:'2026-10-05T14:20:00Z',state:{completed:['power-product','root-product','scientific'],total:16,storage:{'leraarbob.bewerkingen.v1':JSON.stringify({version:1,solved:['power-product','root-product','scientific'],history:[],sessions:{}})}}});
const profiles=[{user_id:'alice',alias:'alice <img src=x onerror=alert(1)>',class_code:'3TBO',axioma_progress:{state:{total:5,correct:4,xp:40}}},{user_id:'bob',alias:'bob',class_code:'4TMW'}];
const mock=`(()=>{let account={id:'teacher',role:'teacher',email:'test@example.invalid'};const listeners=new Set();window.testQueries=[];window.testDelay=0;
const data=${JSON.stringify({axioma_games:games,axioma_profiles:profiles,axioma_game_progress:rows})};
const client={from(table){testQueries.push(table);const q={select(){return q},eq(){return q},order(){return q},then(resolve){return new Promise(r=>setTimeout(r,testDelay)).then(()=>resolve({data:structuredClone(data[table]||[])}))}};return q}};
window.testAccount=next=>{account=next;listeners.forEach(fn=>fn({account:next,pending:false}))};
window.AxiomaAuth={getAccount:async()=>account,ready:async()=>({account}),client:()=>client,onChange:fn=>{listeners.add(fn);return()=>listeners.delete(fn)},signOut:async()=>testAccount(null)};})();`;
(async()=>{
 const browser=new CDP();await browser.connect((await(await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()).webSocketDebuggerUrl);
 const {browserContextId}=await browser.send('Target.createBrowserContext'),{targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});const c=new CDP();await c.connect(`ws://127.0.0.1:${PORT}/devtools/page/`+targetId);
 try{
  await c.send('Page.enable');await c.send('Runtime.enable');
  c.event=m=>{if(m.method==='Fetch.requestPaused'){const p=m.params,url=new URL(p.request.url),auth=url.pathname.endsWith('/axioma-auth.js');if(url.hostname==='127.0.0.1'&&!auth&&!url.pathname.endsWith('/axioma-social.js'))c.send('Fetch.continueRequest',{requestId:p.requestId});else c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(auth?mock:'').toString('base64')});}};
  await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  await c.send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  await c.send('Page.navigate',{url:BASE+'/teacher/'});await c.until('!!document.querySelector(".view")');
  await c.until('!!document.querySelector("leraarbob-topbar")?.shadowRoot.querySelector(".collapse")');
  assert.equal(await c.eval('document.querySelectorAll("#groupBattles a").length'),5);
  assert.equal(await c.eval('document.querySelectorAll("main a[href*=klasbattle]").length'),6);
  assert.deepEqual(await c.eval('[...document.querySelectorAll("#groupBattles a")].map(a=>new URL(a.href).searchParams.get("game"))'),['rechtenwereld','wortelbouw','vectoren-trainer','algebra-trainer','getallenwereld']);
  assert.deepEqual(await c.eval('[...document.querySelectorAll(".gameChip")].map(b=>b.dataset.game)'),featuredIds);
  assert.equal(await c.eval('document.querySelectorAll(".gameChip").length'),6);
  assert.match(await c.eval('document.querySelector("[data-label=Getallenwereld]").textContent'),/2\/15.*3\/16/);
  assert.equal(await c.eval('document.querySelectorAll("[data-game=bewerkingen-trainer]").length'),0,'The old component has no second public filter');
  await c.eval('document.querySelector("[data-game=getallenwereld]").click();document.querySelector("[data-id=alice]").click()');
  assert.equal(await c.eval('document.querySelectorAll("tbody tr:first-child td[data-label]").length'),1);
  assert.match(await c.eval('document.querySelector("#detail").innerText'),/Getallenwereld/);
  assert.match(await c.eval('document.querySelector("#detail").innerText'),/2\/15/);
  assert.match(await c.eval('document.querySelector("#detail").innerText'),/3\/16/);
  assert.equal(await c.eval('document.querySelectorAll("#detail [data-progress-component=getallenwereld]").length'),1);
  assert.equal(await c.eval('document.querySelectorAll("#detail [data-progress-component=bewerkingen-trainer]").length'),1);
  assert.match(await c.eval('document.querySelector("#detail").innerText'),/2 onderdelen voltooid/);
  assert.equal(await c.eval('document.querySelector("#detail progress").value'),2/15);
  await c.eval('document.querySelector("[data-game=getallenwereld]").click();document.querySelector("#closeDetail").click()');
  assert.match(await c.eval('document.querySelector("[data-label=Rechtenwereld]").textContent'),/1\/28/);
  for(const mode of ['light','dark'])for(const width of [320,390,780,1366]){
   await c.send('Emulation.setDeviceMetricsOverride',{width,height:850,deviceScaleFactor:1,mobile:width<700});
   await c.eval(`document.documentElement.dataset.mode='${mode}';scrollTo(0,0)`);await wait(120);
   assert(await c.eval('document.documentElement.scrollWidth<=innerWidth'),'dashboard overflow '+mode+' '+width);
   await c.eval('document.querySelector("leraarbob-topbar").shadowRoot.querySelector(".collapse").click()');
   assert(await c.eval('!document.querySelector(".lb-restore").hidden'));
   await c.eval('document.querySelector(".lb-restore").click()');
   assert(await c.eval('!document.body.classList.contains("topbar-collapsed")'));
   const image=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/teacher-dashboard-'+mode+'-'+width+'.png',Buffer.from(image.data,'base64'));
  }
  await c.eval('document.querySelector("leraarbob-topbar").shadowRoot.querySelector(".collapse").click()');
  await c.send('Page.reload');await c.until('!!document.querySelector(".view")&&document.body.classList.contains("topbar-collapsed")');
  await c.eval('document.querySelector(".lb-restore").click();document.querySelector("[data-game=wortelbouw]").click()');
  assert.equal(await c.eval('document.querySelectorAll("tbody tr:first-child td[data-label]").length'),1);
  await c.eval('document.querySelector("[data-game=wortelbouw]").click()');
  assert.equal(await c.eval('document.querySelectorAll("tbody tr:first-child td[data-label]").length'),6);
  await c.eval('document.querySelector(".extra-filters").open=true');
  assert(await c.eval('document.querySelector("#export").getBoundingClientRect().height>=44'));
  await c.send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  await c.eval('document.documentElement.dataset.mode="light";document.querySelector("[data-collection=all]").click();document.querySelector(".view").click()');
  assert.equal(await c.eval('document.querySelectorAll(".trainerDetail").length'),2);
  assert.equal(await c.eval('document.querySelectorAll(".trainerDetail .statePreview").length'),0);
  assert.equal(await c.eval('document.querySelectorAll("[data-trainer=vectoren-trainer] .trainerSkillList>li").length'),24);
  assert.equal(await c.eval('document.querySelectorAll("[data-trainer=reele-getallen-trainer] .trainerSkillList>li").length'),12);
  const text=await c.eval('document.querySelector("#detail").innerText');assert.match(text,/Componenten verwisseld/);assert.match(text,/Na nog 2 opgaven/);assert.match(text,/Opgelost na hulp of verbetering/);assert.match(text,/Er is nog geen activiteitenlijst bewaard/);assert.match(text,/Wortel verkeerd berekend/);assert.match(text,/Wortelvormen vereenvoudigen/);
  assert.equal(await c.eval('document.querySelectorAll("#detail img").length'),0,'alias markup is escaped');
  assert(await c.eval('!!document.querySelector(".trainerDetail math mover")'),'vector skill names have arrows');
  await c.eval('document.querySelector("#detail").scrollIntoView()');let shot=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/teacher-details-desktop.png',Buffer.from(shot.data,'base64'));
  await c.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  assert(await c.eval('document.documentElement.scrollWidth<=innerWidth'),'no page overflow on phone');
  assert(await c.eval('[...document.querySelectorAll(".trainerDetail")].every(e=>e.getBoundingClientRect().right<=innerWidth)'));
  await c.eval('document.querySelector("[data-trainer=vectoren-trainer]").scrollIntoView()');shot=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/teacher-details-mobile.png',Buffer.from(shot.data,'base64'));
  await c.eval('document.querySelector("#gameFilter").value="reele-getallen-trainer";document.querySelector("#gameFilter").dispatchEvent(new Event("change"))');assert.equal(await c.eval('document.querySelectorAll(".trainerDetail").length'),1);
  await c.eval('document.querySelector("[data-id=bob]").click()');assert.match(await c.eval('document.querySelector("#detail").innerText'),/Nog geen opgeslagen oefeningen/);assert(!await c.eval('document.querySelector("#detail").innerText.includes("Wortel verkeerd berekend")'));
  await c.eval('testDelay=200;document.querySelector("#refresh").click();testAccount({id:"student",role:"student"})');
  await c.until('document.querySelector("#app").innerText.includes("Leerkrachtlogin nodig")');await wait(300);
  assert(!await c.eval('document.querySelector("#app").innerText.includes("alice")'),'late teacher request cannot restore pupil details');
  const queries=await c.eval('testQueries.length');await c.eval('testAccount(null)');await wait(80);assert.equal(await c.eval('testQueries.length'),queries,'guest does not query pupils');
  assert.deepEqual(c.errors,[]);console.log('PASS: six current catalog games including filtered Getallenwereld progress, central plus five battle links, readable trainer details, error advice, planned review, new/legacy activity, mobile layout, filters, pupil isolation, escaped aliases and account-change race');
 }finally{await browser.send('Target.disposeBrowserContext',{browserContextId});c.ws.close();browser.ws.close()}
})().catch(e=>{console.error(e);process.exit(1)});
