// Guest journal: actual runtime evidence, isolated browser, no remote requests.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {CDP,BASE,ROUTE}=require('./helpers/rechten-area-cdp.cjs');
const R=require('../games/rechten/rechtenwereld/mission-runtime.js'),W=require('../games/rechten/core/wave-core.js'),M=require('../games/rechten/rechtenwereld/semantic-math-core.js');
const OUT=process.env.V2_SCREENSHOT_DIR||'/tmp/rechten-progress-validation';
let fixture=R.start(R.initial(),'point');
while(!R.active(fixture).completed){const t=R.active(fixture).task;fixture=R.advance(R.commit(R.edit(fixture,'answer',String(t.options.findIndex(p=>W.eq(p.x,t.target.x)&&W.eq(p.y,t.target.y))))))}
fixture=R.start(fixture,'positive');
while(!R.active(fixture).completed){const m=R.active(fixture);fixture=R.advance(R.commit(R.edit(fixture,m.phase==='grens-root'?'answer':'inequality',m.phase==='grens-root'?String(m.task.options.findIndex(q=>W.eq(q,m.task.root))):M.intervalExpected(m.task).symbol)))}
fixture=R.start(fixture,'point_plot');
for(let i=0;i<2;i++){const t=R.active(fixture).task;fixture=R.advance(R.commit(R.edit(fixture,'point',{x:W.num(t.target.x),y:W.num(t.target.y)})))}
fixture=R.edit(fixture,'point',{x:2,y:3});fixture.screen='book';
(async()=>{
 const c=new CDP();await c.connect();fs.mkdirSync(OUT,{recursive:true});const report={checks:[],passed:false};
 const mock='window.AxiomaAuth={ready:async()=>({session:null}),getAccount:async()=>null,getSnapshot:()=>({status:"guest",account:null}),client:()=>null,onChange:()=>()=>{}};';
 c.paused=p=>{const u=new URL(p.request.url);return u.pathname.endsWith('/axioma-auth.js')||u.origin!==new URL(BASE).origin?c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(u.pathname.endsWith('/axioma-auth.js')?mock:'').toString('base64')}):c.send('Fetch.continueRequest',{requestId:p.requestId})};
 await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 const ready=async()=>{await c.wait('document.querySelector("#app[data-ready=true]")');await c.eval('document.fonts.ready');await c.frames()};
 const shot=async name=>{const r=await c.send('Page.captureScreenshot',{captureBeyondViewport:false});fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from(r.data,'base64'))};
 const reveal=async selector=>{await c.eval(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`);await c.frames()};
 try{
 await c.navigate(BASE+ROUTE+'?journal-test='+Date.now());await ready();await c.eval('localStorage.clear()');await c.navigate(BASE+ROUTE+'?fresh-guest='+Date.now()+'#wereld');await ready();
 // A fresh guest follows the suggested route, but can choose later levels freely.
 await c.viewport(1366,768);await c.tap('#start-recommended');
 assert.equal(await c.eval('location.hash'),'#hellingrug');await c.tap('.atlas-footer [data-start]');
 assert.equal(await c.eval('RechtenV2App.snapshot().active'),'delta');
 const first=await c.eval('RechtenV2App.snapshot().missions.delta');
 await c.tap('#pause');await c.tap('.atlas-footer [data-screen=world]');await c.tap('#start-recommended');
 assert.equal(await c.eval('document.querySelector("#app").dataset.screen'),'mission');
 assert.deepEqual(await c.eval('RechtenV2App.snapshot().missions.delta'),first);
 await c.tap('#pause');await c.tap('.atlas-footer [data-screen=world]');await c.tap('[data-world-node=formulewerf]');
 await c.tap('.area-zones [data-zone=omzetten]');await c.tap('[data-node=equation_from_two_points]');
 assert.equal(await c.eval('RechtenV2App.snapshot().active'),'equation_from_two_points');
 report.checks.push('fresh guest starts in Hellingrug; world CTA resumes exact round; later Formula B level opens without prerequisites');
 await c.eval(`(()=>{const key=Object.keys(localStorage).find(k=>k.startsWith('axioma:rechten:v2:')&&k.endsWith(':guest'));const record=JSON.parse(localStorage.getItem(key));record.state=${JSON.stringify(fixture)};localStorage.setItem(key,JSON.stringify(record));})()`);
 await c.navigate(BASE+ROUTE+'?journal-test='+Date.now()+'#voortgang');await ready();
 assert.equal(await c.eval('document.querySelectorAll("[data-progress-island]").length'),5);
 assert.equal(await c.eval('document.querySelectorAll("[data-progress-stop][data-completed=true]").length'),2);
 assert.equal(await c.eval('document.querySelectorAll("[data-progress-stop][data-started=true]").length'),1);
 assert(await c.eval('document.querySelector("[data-progress-stop=point_plot]").textContent.includes("2 opgaven")'));
 report.checks.push('all islands; 2 completed stops and 1 ongoing round from real guest evidence');
 for(const [w,h] of [[320,568],[390,844],[640,360],[672,378],[844,390],[1024,768],[1366,768]]){
 await c.viewport(w,h,w<900);await c.navigate(BASE+ROUTE+'?journal-test='+Date.now()+'#voortgang');await ready();
 for(const area of ['puntenbaai','hellingrug','grenspas','formulewerf','signaalstad']){
 const selector=`[data-progress-island="${area}"]>summary`;await reveal(selector);await c.tap(selector,w<900);
 assert(await c.eval(`document.querySelector('[data-progress-island="${area}"]').open`));
 const rows=await c.eval(`document.querySelector('[data-progress-island="${area}"] .journey-stops').children.length`);assert(rows>0);
 await reveal(`[data-progress-island="${area}"] .journey-area-link`);
 assert(await c.eval(`(()=>{const a=document.querySelector('[data-progress-island="${area}"] .journey-area-link').getBoundingClientRect(),b=document.querySelector('.journal-scroll').getBoundingClientRect();return a.top>=b.top&&a.bottom<=b.bottom})()`));
 await reveal(selector);await c.tap(selector,w<900);
 }
 await c.eval('document.querySelector(".journal-scroll").scrollTop=0');await c.frames();
 const issues=await c.eval(`(()=>{const s=document.querySelector('.journal-scroll');return {horizontal:s.scrollWidth>s.clientWidth+1,document:document.documentElement.scrollHeight>innerHeight+1}})()`);assert.deepEqual(issues,{horizontal:false,document:false});
 await shot('journal-'+w+'x'+h);
 await c.tap('[data-screen=profile]',w<900);assert.equal(await c.eval('document.querySelector("#sync")'),null);
 assert(await c.eval('document.querySelector(".profile-progress").textContent.includes("2 van 19")'));
 const clipped=await c.eval(`[...document.querySelectorAll('button,a,input')].filter(e=>e.getClientRects().length&&!e.closest('[hidden]')).filter(e=>{const r=e.getBoundingClientRect();return r.top<0||r.bottom>innerHeight+1||r.left<0||r.right>innerWidth+1}).map(e=>e.id||e.textContent.trim())`);assert.deepEqual(clipped,[],`profile ${w}x${h}`);
 await shot('profile-'+w+'x'+h);await c.tap('.profile-progress',w<900);assert.equal(await c.eval('document.querySelectorAll("[data-progress-stop][data-completed=true]").length'),2);
 report.checks.push(`guest profile, journal, all 5 expandable/scrollable islands: ${w}x${h}`);
 }
 await c.viewport(1366,768);const summary='[data-progress-island=puntenbaai]>summary';await reveal(summary);await c.keyboardTo(summary);await c.press('Enter');assert(await c.eval('document.querySelector("[data-progress-island=puntenbaai]").open'));await shot('journal-details');
 const selector='[data-progress-stop=point_plot] button';await reveal(selector);await c.tap(selector);
 const resumed=await c.eval('RechtenV2App.snapshot()');assert.equal(resumed.screen,'mission');assert.equal(resumed.active,'point_plot');assert.deepEqual(resumed.missions.point_plot,fixture.missions.point_plot);assert.deepEqual(resumed.events,fixture.events);
 await c.navigate();await ready();assert.deepEqual((await c.eval('RechtenV2App.snapshot()')).missions.point_plot,fixture.missions.point_plot);
 report.checks.push('keyboard disclosure; resume exact task/draft and completed evidence; guest reload unchanged');
 await c.tap('#pause');
 assert.equal(await c.eval('document.querySelector("[data-node=point] .stop-number").textContent'),'1');
 assert(await c.eval('!!document.querySelector("[data-node=point] .skill-check")'));
 assert.equal(await c.eval('document.querySelector("[data-node=point] .level-state").textContent'),'Afgerond');
 assert.equal(await c.eval('document.querySelector("[data-node=point_plot] .level-state").textContent'),'Bezig');
 await shot('completed-and-active-levels');
 report.checks.push('completed level keeps its number, check and Afgerond label beside an active level');

 assert.deepEqual(c.errors,[]);report.passed=true;console.log('PASS guest progress: '+report.checks.length+' checks/groups');
 }catch(e){report.failure=e.stack;await shot('failure');throw e}
 finally{fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));await c.send('Fetch.disable');c.ws.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
