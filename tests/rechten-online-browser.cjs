const assert=require('node:assert/strict'),{createDB}=require('./helpers/rechten-online-db.cjs'),{CDP}=require('./helpers/online-cdp.cjs');
const policy=require('../shared/multiplayer/rechten-online-policy.cjs');
const BASE=process.env.VECTOR_BASE_URL||'http://127.0.0.1:8775',PORT=process.env.VECTOR_BROWSER_PORT||9245;
(async()=>{
 const {createHandler}=await import('../supabase/functions/rechten-duo/handler.js');
 const h=await createDB(),{db,ids}=h,browser=new CDP(),tabs=[],contexts=[];
 const v=await(await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();await browser.connect(v.webSocketDebuggerUrl);
 const worker=createHandler({url:'https://test.invalid',anonKey:'public-test',serviceKey:'server-test',policy,fetcher:async(url,opts)=>{
  const token=opts.headers.Authorization.slice(7);if(url.endsWith('/auth/v1/user'))return new Response(JSON.stringify(ids[token]?{id:ids[token]}:{}),{status:ids[token]?200:401});
  const body=JSON.parse(opts.body);try{let result;
   if(url.endsWith('axioma_rechten_duo_worker')){assert.equal(token,'server-test');const user=Object.keys(ids).find(k=>ids[k]===body.p_data.user_id);result=await h.worker(user,body.p_action,body.p_data);}
   else result=await h.raw(token,body.p_action,body.p_data);
   return new Response(JSON.stringify(result));
  }catch(e){return new Response(JSON.stringify({message:e.message}),{status:400});}
 }});
 async function tab(user){const {browserContextId}=await browser.send('Target.createBrowserContext');contexts.push(browserContextId);const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});const list=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json(),c=new CDP();await c.connect(list.find(t=>t.id===targetId).webSocketDebuggerUrl);tabs.push(c);await c.send('Page.enable');await c.send('Runtime.enable');
  c.route=async p=>{const u=new URL(p.request.url);const fulfill=(body,type='text/javascript')=>c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:type}],body:Buffer.from(body).toString('base64')});
   if(u.pathname.endsWith('/axioma-auth.js'))return fulfill(`window.AxiomaAuth={ready:async()=>({account:{id:'${ids[user]}',role:'student',alias:'${user}'}}),getAccount:async()=>({id:'${ids[user]}',role:'student'}),onChange:()=>{},client:()=>({functions:{invoke:async(name,opts)=>{const r=await fetch('/online-test-api',{method:'POST',body:JSON.stringify(opts.body)});const data=await r.json();return {data,error:null};}}})};`);
   if(u.pathname.endsWith('/axioma-social.js'))return fulfill(`window.AxiomaSocial={state:()=>({tabId:'${ids[user]}'}),onChange:()=>{}};`);
   if(u.pathname==='/online-test-api'){
    if(c.offline)return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'InternetDisconnected'});
    const response=await worker(new Request('https://test.invalid/functions/v1/rechten-duo',{method:'POST',headers:{Authorization:'Bearer '+user},body:p.request.postData}));return fulfill(await response.text(),'application/json');
   }
   if(u.hostname!=='127.0.0.1')return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'});return c.send('Fetch.continueRequest',{requestId:p.requestId});
  };await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});await c.size(780,360);await c.send('Page.navigate',{url:BASE+'/games/rechten/rechtenwereld/online.html'});await c.wait('window.LeraarBobTopbar&&document.getElementById("players").textContent');return c;
 }
 const board="document.getElementById('board').contentWindow";
 const solve=`(()=>{const w=${board},m=w.RechtenV2Runtime.active(w.RechtenV2App.snapshot()),i=m.task.options.a.findIndex(a=>w.RechtenWave.eq(a,m.task.model.a));w.document.querySelector('[data-choice="rateChoice"][data-value="'+i+'"]').click();w.document.getElementById('mission').requestSubmit();})()`;
 try{
  await h.progress('alex',['delta','slope','slope_from_two_points','line_behavior','special_lines']);await h.progress('sam',['delta','slope','slope_from_two_points','line_behavior','special_lines']);const a=await tab('alex'),b=await tab('sam');
  await a.wait("document.querySelector('#players button')");await a.eval("document.querySelector('#players button').click()");await b.wait("document.querySelector('#invitations button')");await b.eval("document.querySelector('#invitations button').click()");await a.wait("!document.getElementById('ready').hidden");await b.wait("!document.getElementById('ready').hidden");await db.exec(`update axioma_private.rechten_duels set pool='["slope"]' where phase='waiting'`);await a.click('ready');await b.click('ready');
  await a.wait(`${board}.RechtenV2App?.snapshot().active`);await b.wait(`${board}.RechtenV2App?.snapshot().active`);
  assert.deepEqual(await a.eval(`${board}.RechtenV2App.snapshot().missions`),await b.eval(`${board}.RechtenV2App.snapshot().missions`));
  for(const [width,height] of [[780,360],[390,844],[1366,768]]){await a.size(width,height);for(const fold of [false,true]){
   await a.eval(`LeraarBobTopbar.setCollapsed(${fold});new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
   const result=await a.eval(`(()=>{const f=document.getElementById('board'),r=f.getBoundingClientRect(),w=f.contentWindow,b=w.document.getElementById('commit').getBoundingClientRect();return {outer:document.documentElement.scrollWidth<=innerWidth,inside:w.document.documentElement.scrollWidth<=w.innerWidth,board:r.height>innerHeight*.60&&r.bottom<=innerHeight+1,button:b.width>=44&&b.height>=44&&b.bottom<=w.innerHeight+1,iframes:document.querySelectorAll('iframe').length,innerBar:!!w.document.querySelector('leraarbob-topbar')};})()`);
   assert.deepEqual(result,{outer:true,inside:true,board:true,button:true,iframes:1,innerBar:false},JSON.stringify({width,height,fold,result}));await a.shot('online-'+width+(fold?'-folded':''));
  }}
  await a.size(780,360);await a.eval(solve);await a.wait(`${board}.document.getElementById('app').inert`);await b.wait("document.getElementById('opponent').textContent.includes('bevestigd')");
  assert(!await a.eval(`${board}.document.querySelector('.feedback.success,.feedback.error')`));assert.match(await b.eval("document.getElementById('timer').textContent"),/s/);
  // Reload after confirming: cannot regain an editable board, score still concealed.
  await a.send('Page.reload');await a.wait("document.getElementById('board').inert&&!document.getElementById('match').hidden");
  await b.eval(solve);await a.wait("!document.getElementById('next').hidden");await b.wait("!document.getElementById('next').hidden");assert.match(await a.eval("document.getElementById('roundPanel').textContent"),/alex ✓.*sam ✓/);
  await a.click('next');await b.click('next');await a.wait(`${board}.RechtenV2App?.snapshot().active&&!${board}.document.getElementById('app').inert`);
  // Simulate failed delivery and reconnect. The frozen final answer retries safely.
  a.offline=true;await a.eval(solve);await a.wait("!document.getElementById('error').hidden");a.offline=false;await a.wait("document.getElementById('error').hidden");await b.wait("document.getElementById('opponent').textContent.includes('bevestigd')");
  await b.eval(solve);await a.wait("!document.getElementById('next').hidden");
  // Test feedback-free progression with an intentionally wrong first delta step.
  const id=new URL(await a.eval('location.href')).searchParams.get('match');await h.rpc('alex','leave',{id});
  await h.progress('alex',['delta','slope','slope_from_two_points','line_behavior','special_lines']);await h.progress('sam',['delta','slope','slope_from_two_points','line_behavior','special_lines']);await a.send('Page.navigate',{url:BASE+'/games/rechten/rechtenwereld/online.html'});await b.send('Page.navigate',{url:BASE+'/games/rechten/rechtenwereld/online.html'});
  await a.wait("document.querySelector('#players button')");await a.eval("document.querySelector('#players button').click()");await b.wait("document.querySelector('#invitations button')");await b.eval("document.querySelector('#invitations button').click()");await a.wait("!document.getElementById('ready').hidden");await b.wait("!document.getElementById('ready').hidden");await db.exec(`update axioma_private.rechten_duels set pool='["delta"]' where phase='waiting'`);await a.click('ready');await b.click('ready');await a.wait(`${board}.RechtenV2App?.snapshot().active`);
  await a.eval(`(()=>{const w=${board},m=w.RechtenV2Runtime.active(w.RechtenV2App.snapshot()),i=m.task.options.dx.findIndex(a=>!w.RechtenWave.eq(a,m.task.dx));w.document.querySelector('[data-choice="dxChoice"][data-value="'+i+'"]').click();w.document.getElementById('mission').requestSubmit();})()`);
  assert.equal(await a.eval(`${board}.RechtenV2Runtime.active(${board}.RechtenV2App.snapshot()).phase`),'hill-dy');assert.equal(await a.eval(`${board}.RechtenV2Runtime.active(${board}.RechtenV2App.snapshot()).feedback`),null);assert(!await a.eval(`${board}.document.getElementById('app').inert`));assert.equal(await a.eval(`${board}.document.getElementById('commit').textContent`),'Bevestig');
  assert.deepEqual(a.errors,[]);assert.deepEqual(b.errors,[]);
  console.log('PASS two isolated browsers + real Edge handler/Postgres: invite/accept, identical task, full workboard at 780x360/390x844/desktop, collapse/restore, no early feedback, confirm/20s timer, reload, offline retry, wrong intermediate step');
 }finally{for(const id of contexts)await browser.send('Target.disposeBrowserContext',{browserContextId:id});tabs.forEach(c=>c.ws.close());browser.ws.close();await db.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
