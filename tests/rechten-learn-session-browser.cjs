// Real browser UI + Edge handler + PostgreSQL. Only isolated, synthetic accounts.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {createDB}=require('./helpers/rechten-online-db.cjs'),{CDP}=require('./helpers/online-cdp.cjs');
const engine=require('../shared/multiplayer/rechten-learn-engine.cjs');
const BASE='http://127.0.0.1:8775',PORT=9245;
(async()=>{const {db,ids,progress}=await createDB(),contexts=[],tabs=[],browser=new CDP();try{
 for(const file of ['20260929235628_rechten_samen_leren.sql','20260929235633_rechten_learn_invitations.sql','20260930161209_rechten_learn_full_route.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
 let serial=Promise.resolve();const as=(user,role,sql,args)=>{const work=serial.catch(()=>{}).then(()=>db.transaction(async tx=>{await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[ids[user]||'']);await tx.exec('set local role '+role);return(await tx.query(sql,args)).rows[0]?.result;}));serial=work;return work;};
 const {createHandler}=await import('../supabase/functions/rechten-learn/handler.js');
 const handler=createHandler({url:'https://test.invalid',anonKey:'anon',serviceKey:'trusted',engine,fetcher:async(url,opts)=>{const token=opts.headers.Authorization.slice(7);if(url.endsWith('/user'))return new Response(JSON.stringify(ids[token]?{id:ids[token]}:{}),{status:ids[token]?200:401});assert.equal(token,'trusted');const a=JSON.parse(opts.body);try{return new Response(JSON.stringify(await as(null,'service_role','select public.axioma_rechten_learn_worker($1,$2) result',[a.p_action,JSON.stringify(a.p_data)])));}catch(e){return new Response(JSON.stringify({message:e.message}),{status:400});}}});
 await browser.connect((await(await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()).webSocketDebuggerUrl);
 async function tab(user,page){const {browserContextId}=await browser.send('Target.createBrowserContext');contexts.push(browserContextId);const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});const list=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json(),c=new CDP();await c.connect(list.find(t=>t.id===targetId).webSocketDebuggerUrl);tabs.push(c);await c.send('Page.enable');await c.send('Runtime.enable');
 c.route=async p=>{const u=new URL(p.request.url);const fulfill=(body,type='text/javascript')=>c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:type}],body:Buffer.from(body).toString('base64')});
 if(u.pathname.endsWith('/axioma-auth.js'))return fulfill(`(()=>{const account={id:'${ids[user]}',role:'student',alias:'${user}',class_code:'TEST'};const api=async(name,body)=>{const r=await fetch('/invite-test-api/'+name,{method:'POST',body:JSON.stringify(body)});return r.json();};window.AxiomaAuth={ready:async()=>({account}),getAccount:async()=>account,getSnapshot:()=>({account}),getSession:async()=>null,onChange:()=>()=>{},client:()=>({from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:null,error:null})}),functions:{invoke:(name,opts)=>api(name,opts.body)},rpc:(name,args)=>{const p=name==='axioma_social'?api('social',args):Promise.resolve({data:{status:'saved',revision:1,state:args.p_state||{}},error:null});p.abortSignal=()=>p;return p;}})};})();`);
 if(u.pathname.endsWith('/axioma-groups.js'))return fulfill('window.AxiomaGroups={state:()=>({sessions:[],connected:true})}');
 if(u.pathname.startsWith('/invite-test-api/')){if(c.offline)return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'InternetDisconnected'});const input=JSON.parse(p.request.postData||'{}');let result;
  if(u.pathname.endsWith('/social'))try{result={data:await as(user,'authenticated','select public.axioma_social($1,$2,$3,$4,$5) result',[input.p_action,input.p_tab_id,input.p_target_id||null,input.p_invite_id||null,input.p_match_id||null]),error:null};}catch(e){result={error:{message:e.message}};}
  else {const r=await handler(new Request('https://test.invalid',{method:'POST',headers:{Authorization:'Bearer '+user},body:p.request.postData}));result={data:await r.json(),error:null};}
  return fulfill(JSON.stringify(result),'application/json');}
 if(u.hostname!=='127.0.0.1')return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'});return c.send('Fetch.continueRequest',{requestId:p.requestId});};
 await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});await c.size(1366,768);await c.send('Page.navigate',{url:BASE+page});await c.wait('window.AxiomaSocial?.state().connected');return c;}
 await progress('alex',engine.skills);await progress('sam',engine.skills);
 const root='/games/rechten/rechtenwereld/',a=await tab('alex',root+'learn.html?world=formulewerf'),b=await tab('sam',root+'learn.html');
 await a.wait('!document.getElementById("learnCreateButton").disabled');await a.eval("document.getElementById('learnSkill').value='equation_from_two_points';document.getElementById('learnCreate').requestSubmit()");await a.wait("document.getElementById('learnRoomCode').textContent.length===6");
 const code=await a.eval("document.getElementById('learnRoomCode').textContent");await b.eval(`document.getElementById('learnCode').value=${JSON.stringify(code)};document.getElementById('learnJoin').requestSubmit()`);await a.wait("document.querySelectorAll('#learnMembers li').length===2");await a.click('learnStart');
 const room=await a.eval('new URLSearchParams(location.search).get("session")');
 const R=require('../games/rechten/rechtenwereld/mission-runtime.js'),G=require('../games/rechten/rechtenwereld/learn-config.js'),{fill}=require('./helpers/rechten-question-fixtures.cjs');
 const row=async()=>{await serial;const r=(await db.query('select * from axioma_private.rechten_learn_rooms where id=$1',[room])).rows[0];r.members=['alex','sam'].map(u=>({id:ids[u]}));return r;};
 const solve=spec=>{let state=G.generate(spec),steps=[];while(true){state=fill(state);const m=R.active(state);steps.push({phase:m.phase,values:structuredClone(m.values)});if(!G.nextPhase(state))return {steps};state=G.nextInput(state);}};
 const sync=async(c,answer,index)=>c.eval(`document.getElementById('learnBoard').contentWindow.postMessage(${JSON.stringify({type:'rechten-learn-sync',match:room,index,answer,readOnly:false})},location.origin);new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
 const frame="document.getElementById('learnBoard')?.contentDocument";
 async function submit(c,answer,index){await c.wait(`${frame}.querySelector('#commit')&&!${frame}.getElementById('app').inert`);await sync(c,answer,index);await c.eval(`${frame}.getElementById('commit').click()`);}
 for(let round=0;round<6;round++){
  await a.wait("document.getElementById('learnPhase').textContent==='Eerst jouw idee'");await b.wait("document.getElementById('learnPhase').textContent==='Eerst jouw idee'");
  const spec=engine.spec(await row()),answer=solve(spec);
  if(!round){
   await sync(a,{steps:answer.steps.slice(0,3)},round);await a.eval(`${frame}.getElementById('learnPrevious').click()`);await a.wait(`${frame}.querySelector('#mission').dataset.phase==='derive-slope'`);
   await a.send('Page.reload');await a.wait(`${frame}?.querySelector('#mission')?.dataset.phase==='derive-slope'`);
   await a.size(390,844);await a.shot('learn-session-phone');await a.size(1366,768);await a.shot('learn-session-desktop');
   console.log('PASS actual previous-step button and reload retain private intermediate work');
  }
  await submit(a,answer,round);await a.wait("document.getElementById('learnInstruction').textContent.includes('Je idee is bewaard')");await submit(b,answer,round);
  await a.wait("document.getElementById('learnPhase').textContent.includes('Jij')");await b.wait("document.getElementById('learnPhase').textContent.includes('Jij')");
  for(const c of [a,b]){await c.wait("!document.getElementById('learnApprove').disabled");await c.click('learnApprove');}
  const builder=round%2?b:a;await builder.wait("!document.getElementById('learnCheck').disabled");await builder.click('learnCheck');await builder.wait("document.getElementById('learnPhase').textContent==='Samen opgelost!'");await builder.click('learnNext');
 }
 await a.wait("document.getElementById('learnPhase').textContent==='Nu zelf proberen'");await b.wait("document.getElementById('learnPhase').textContent==='Nu zelf proberen'");
 for(const [c,u]of [[a,'alex'],[b,'sam']]){await submit(c,solve(engine.spec(await row(),ids[u])),6);await c.wait("document.getElementById('learnInstruction').textContent.includes('eindcheck is')");}
 await a.wait("document.getElementById('learnPhase').textContent==='Reeks afgerond'");assert((await a.eval("document.getElementById('learnInstruction').textContent")).includes('juist'));
 assert((await b.eval("document.getElementById('learnInstruction').textContent")).includes('juist'));
 await db.query("update axioma_private.rechten_learn_rooms set expires_at=now()-interval '1 second' where id=$1",[room]);await a.send('Page.reload');await a.wait("document.getElementById('learnSetup')&&!document.getElementById('learnSetup').hidden&&!new URLSearchParams(location.search).has('session')");
 console.log('PASS expired room returns to setup with a solo exit');
 console.log('PASS six complete multi-step questions, two private proposals, shared approvals, alternating roles, independent final checks');
 for(const t of tabs)assert.deepEqual(t.errors,[]);
}finally{for(const id of contexts)await browser.send('Target.disposeBrowserContext',{browserContextId:id});for(const t of tabs)t.ws?.close();browser.ws?.close();await db.close();}})().catch(e=>{console.error(e);process.exitCode=1});
