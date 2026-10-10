// Actual game -> account service -> PostgreSQL RPC -> retained catalog, with synthetic accounts.
const assert=require('node:assert/strict'),{CDP}=require('./helpers/online-cdp.cjs');
const {createDB}=require('./helpers/rechten-progress-db.cjs');
const base=process.env.VECTOR_BASE_URL||'http://127.0.0.1:8775',port=process.env.VECTOR_BROWSER_PORT||9245;
(async()=>{
 const {db,ids,as,save}=await createDB(),browser=new CDP();
 const v=await(await fetch(`http://127.0.0.1:${port}/json/version`)).json();await browser.connect(v.webSocketDebuggerUrl);
 const {browserContextId}=await browser.send('Target.createBrowserContext');let c;
 try{
  const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});c=new CDP();await c.connect(`ws://127.0.0.1:${port}/devtools/page/${targetId}`);
  await c.send('Page.enable');await c.send('Runtime.enable');await c.send('Network.enable');await c.send('Network.setCacheDisabled',{cacheDisabled:true});await c.size(1366,850);
  let refused=true,user='alex';
  c.route=async p=>{
   const u=new URL(p.request.url),fulfill=(body,type='application/javascript')=>c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:type}],body:Buffer.from(body).toString('base64')});
   if(u.pathname.endsWith('/axioma-social.js'))return fulfill('');
   if(u.pathname==='/progress-test-api'){
    const q=JSON.parse(p.request.postData);let data,error;
    try{
     if(q.rpc){if(refused)throw Error('Dit spel gebruikt geen generieke voortgangsopslag.');data=await save(user,q.args.p_state,q.args.p_revision,q.args.p_game_id,q.args.p_user_id);}
     else{
      assert(['axioma_game_progress','axioma_progress'].includes(q.table));assert(Object.keys(q.filters).every(k=>['game_id','user_id'].includes(k)));
      const entries=Object.entries(q.filters),rows=await as(user,`select * from public.${q.table} where ${entries.map(([k],i)=>k+'=$'+(i+1)).join(' and ')}`,entries.map(([,v])=>v));data=q.single?rows[0]||null:rows;
     }
    }catch(e){error={message:e.message};}return fulfill(JSON.stringify({data,error}),'application/json');
   }
   if(u.pathname.endsWith('/axioma-auth.js'))return fulfill(`(()=>{
    const account={id:${JSON.stringify(ids[user])},role:'student',alias:${JSON.stringify(user)},class_code:'3TMW'};
    const call=body=>fetch('/progress-test-api',{method:'POST',body:JSON.stringify(body)}).then(r=>r.json());
    const client={rpc:(rpc,args)=>call({rpc,args}),from(table){const filters={};let single=false;const q={select(){return q},eq(k,v){filters[k]=v;return q},maybeSingle(){single=true;return q},abortSignal(){return q},then(resolve,reject){return call({table,filters,single}).then(resolve,reject)}};return q}};
    window.AxiomaAuth={CLASSES:['3TMW'],ready:async()=>({account}),getAccount:async()=>account,getSession:async()=>({user:account}),client:()=>client,onChange:()=>()=>{}};
   })();`);
   if(u.origin!==new URL(base).origin)return fulfill('');
   return c.send('Fetch.continueRequest',{requestId:p.requestId});
  };
  await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  const game=base+'/games/rechten/rechtenwereld/#wereld',home=base+'/index.html?view=catalog#playerProgress';
  const ready=()=>c.wait('document.querySelector("#app[data-ready=true]")');
  const progress=()=>c.wait("document.querySelector('#playerProgress[aria-busy=false]')&&document.getElementById('totalXP').textContent!=='—'");
  const xp="document.querySelector('leraarbob-topbar')?.shadowRoot.querySelector('.progress-value')?.textContent";
  const cache="Object.keys(localStorage).find(k=>k.startsWith('axioma:rechten:v2:')&&k.endsWith(':student:'+"+JSON.stringify(ids.alex)+"))";
  await c.send('Page.navigate',{url:game});await ready();
  // Earn XP through an actual runtime task, as if it was completed while the old RPC refused writes.
  await c.eval(`(()=>{let s=RechtenV2Runtime.start(RechtenV2Runtime.initial(),'point');const t=RechtenV2Runtime.active(s).task;const correct=t.options.findIndex(p=>RechtenWave.eq(p.x,t.target.x)&&RechtenWave.eq(p.y,t.target.y));s=RechtenV2Runtime.commit(RechtenV2Runtime.edit(s,'answer',String(correct)));s=RechtenV2XP.update(s);const k=${cache},record=JSON.parse(localStorage.getItem(k));record.state=s;record.dirty=true;record.edit++;localStorage.setItem(k,JSON.stringify(record));})()`);
  await c.send('Page.reload');await ready();
  const earned=await c.eval('RechtenV2App.snapshot().platformXp');assert(earned>0);
  await c.wait(xp+'==='+JSON.stringify(earned+' XP'));
  assert.equal(await c.eval(`JSON.parse(localStorage.getItem(${cache})).dirty`),true);
  await c.send('Page.navigate',{url:home});await progress();assert.equal(await c.eval("document.getElementById('totalXP').textContent"),'0');assert.match(await c.eval("document.querySelector('[data-game-id=rechtenwereld] .card-progress').textContent"),/Nog niet gestart/);
  refused=false;
  await c.send('Page.navigate',{url:game});await ready();await c.wait(`JSON.parse(localStorage.getItem(${cache})).dirty===false`);assert.equal(await c.eval('RechtenV2App.snapshot().platformXp'),earned);
  await c.send('Page.navigate',{url:home});await progress();assert.equal(await c.eval("document.getElementById('totalXP').textContent"),String(earned));await c.wait(xp+'==='+JSON.stringify(earned+' XP'));
  assert.match(await c.eval("document.querySelector('[data-game-id=rechtenwereld] .card-progress').textContent"),/Leerroute opgeslagen/);
  for(const [w,h] of [[1366,850],[390,844]]){await c.size(w,h);await c.eval("document.getElementById('progressBreakdown').open=true;document.getElementById('playerProgress').scrollIntoView({block:'start',behavior:'instant'})");await c.shot('rechten-xp-synced-'+w);assert.equal(await c.eval('document.documentElement.scrollWidth<=innerWidth'),true);}
  await c.send('Page.navigate',{url:game});await ready();assert.equal(await c.eval('RechtenV2App.snapshot().platformXp'),earned);
  await c.send('Page.navigate',{url:home});await progress();assert.equal(await c.eval("document.getElementById('totalXP').textContent"),String(earned));
  user='sam';await c.send('Page.reload');await progress();assert.equal(await c.eval("document.getElementById('totalXP').textContent"),'0');assert.match(await c.eval("document.querySelector('[data-game-id=rechtenwereld] .card-progress').textContent"),/Nog niet gestart/);
  assert.deepEqual(c.errors,[]);console.log('PASS: reproduced failed save; retained local XP syncs through real RPC; matching game/home/topbar XP on desktop/mobile, no replay duplication, isolated accounts');
 }finally{await browser.send('Target.disposeBrowserContext',{browserContextId});c?.ws.close();browser.ws.close();await db.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
