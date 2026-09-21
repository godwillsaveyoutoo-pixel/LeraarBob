// Synthetic accounts and an in-memory transport: no real accounts/results are written.
// Start the local server and isolated Chromium as described in tests/README.md.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {randomUUID} = require('node:crypto');
const delay = ms => new Promise(r => setTimeout(r,ms));
class CDP {
  async connect(url) {
    this.ws = new WebSocket(url); this.pending = new Map(); this.id = 0; this.errors=[];
    await new Promise(r => this.ws.onopen=r);
    this.ws.onmessage = e => {
      const m=JSON.parse(e.data);
      if(m.id){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}
      else if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails);
      else this.event?.(m);
    };
  }
  send(method,params={}) {return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}
  async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
  async wait(expr){for(let i=0;i<150;i++){if(await this.eval(expr))return;await delay(60)}throw Error('Timeout: '+expr)}
  async go(path){await this.send('Page.navigate',{url:'http://127.0.0.1:8765/'+path})}
}
const A='11111111-1111-4111-8111-111111111111', B='22222222-2222-4222-8222-222222222222';
const accounts = {[A]:{id:A,role:'student',alias:'Test-A',class_code:'3TMW'},[B]:{id:B,role:'student',alias:'Test-B',class_code:'3TMW'}};
let invitations=[], sessions=new Map(), fail=false, reportCount=0;
const clients=[];let groupSession=null;const groupMembers=new Map();
const playerList=()=>[...new Set([...sessions.values()].map(s=>s.id))].map(id=>({...accounts[id],status:invitations.some(i=>i.status==='accepted'&&[i.sender_id,i.recipient_id].includes(id))?'playing':'available'}));
function rpc(c,name,args){
  if(fail)throw Error('Test: verbinding verbroken');
  if(name==='axioma_is_teacher')return false;
  if(name==='axioma_save_game_progress_for_account'){assert.equal(args.p_user_id,c.account);const old=c.progress.get(args.p_game_id);if(args.p_revision!==(old?.revision||0))return {status:'conflict',revision:old?.revision};const row={game_id:args.p_game_id,state:args.p_state,revision:(old?.revision||0)+1};c.progress.set(args.p_game_id,row);return {status:'saved',revision:row.revision};}
  if(name==='axioma_register_multiplayer_match')return {};
  if(name==='axioma_report_multiplayer_result'){reportCount++;return {}}
  if(name==='axioma_multiplayer_ranking'||name==='axioma_naval_ranking')return [];
  if(name==='axioma_clay'){
    const uid=c.account,action=args.p_action,now=Date.now();let member=groupMembers.get(uid);
    if(action==='create'){groupSession={id:randomUUID(),host_id:uid,host_alias:accounts[uid].alias,speed:args.p_speed,status:'waiting',created_at:new Date(now).toISOString()};groupMembers.clear()}
    if(action==='create'||action==='join'){
      member={user_id:uid,alias:accounts[uid].alias,tab_id:args.p_tab_id,streak:0,misses:0,version:0,left_at:null,online:true};groupMembers.set(uid,member);
    }
    if(action==='start'){
      assert.equal(uid,groupSession.host_id);assert(groupMembers.size>=2);groupSession.status='running';groupSession.starts_at=new Date(now+5000).toISOString();
      for(const m of groupMembers.values()){m.next_at=groupSession.starts_at;m.participated=true}
    }
    if(action==='answer'){
      assert.equal(groupSession.status,'running');assert.equal(member.version,args.p_version);
      const correct=args.p_answer===[1,-1,2,-.5,.5,-2,0][member.streak];
      member.streak=correct?member.streak+1:0;member.misses+=correct?0:1;member.version++;
      member.last_event_id=args.p_event_id;member.last_correct=correct;member.next_at=new Date(now+800).toISOString();
      if(member.streak===7){groupSession.status='finished';groupSession.winner_id=uid;groupSession.winner_alias=accounts[uid].alias;groupSession.elapsed_ms=now-Date.parse(groupSession.starts_at)}
    }
    if(action==='leave'&&member)member.left_at=new Date(now).toISOString();
    const sessions=groupSession?.status==='waiting'?[{...groupSession,player_count:groupMembers.size}]:[];
    const ranking=action==='ranking'&&groupSession?.status==='finished'?[{rank:1,user_id:groupSession.winner_id,alias:groupSession.winner_alias,wins:1,best_ms:groupSession.elapsed_ms}]:null;
    return {sessions,current:member?groupSession:null,member:member||null,members:member?[...groupMembers.values()]:[],ranking,server_time:new Date(now).toISOString()};
  }
  assert.equal(name,'axioma_social');
  const uid=c.account,tab=args.p_tab_id,action=args.p_action;
  const inv=invitations.find(i=>i.id===args.p_invite_id);
  let id=null;
  if(action==='offline'){sessions.delete(uid+tab);return {}}
  sessions.set(uid+tab,{id:uid});
  if(action==='invite'){
    if(invitations.some(i=>['pending','accepted'].includes(i.status)&&[i.sender_id,i.recipient_id].some(id=>[uid,args.p_target_id].includes(id))))throw Error('Speler is bezet');
    const now=new Date().toISOString();
    const x={id:randomUUID(),sender_id:uid,recipient_id:args.p_target_id,sender_tab:tab,recipient_tab:null,status:'pending',sender_alias:accounts[uid].alias,recipient_alias:accounts[args.p_target_id].alias,created_at:now,updated_at:now,expires_at:new Date(Date.now()+90000).toISOString()};
    invitations.unshift(x);id=x.id;
  }
  if(['accept','decline','cancel'].includes(action)){
    if(!inv||inv.status!=='pending')throw Error('Uitnodiging verlopen');
    inv.status={accept:'accepted',decline:'declined',cancel:'cancelled'}[action];inv.recipient_tab=tab;id=inv.id;
  }
  if(action==='join'){
    if(!inv||inv.status!=='accepted')throw Error('Partij niet beschikbaar');
    if((uid===inv.sender_id?inv.sender_tab:inv.recipient_tab)!==tab)throw Error('Ander tabblad');
    id=inv.id;
  }
  if(action==='finish'&&inv){inv.status='finished';id=inv.id}
  return {players:playerList(),invitations:invitations.filter(i=>[i.sender_id,i.recipient_id].includes(uid)),id};
}
async function deliverPresence(topic){
  const active=clients.filter(c=>c.channels?.has(topic));
  const state={};for(const c of active){const p=c.channels.get(topic);if(p)state[c.account]=[p]}
  await Promise.all(active.map(c=>c.eval(`window.__channelEvent(${JSON.stringify(topic)},'presence',${JSON.stringify(state)})`).catch(()=>{})));
}
async function handle(c,req){
  let data,error;
  try{
    if(req.method==='rpc')data=rpc(c,...req.args);
    else if(req.method==='progress'){const q=req.args[0];data=q.single?(c.progress.get(q.game_id)||null):[...c.progress.values()];}
    else {
      const [topic,value]=req.args;
      if(req.method==='subscribe'){c.channels.set(topic,null);data='ok'}
      if(req.method==='track'){c.channels.set(topic,value);await deliverPresence(topic);data='ok'}
      if(req.method==='remove'){c.channels.delete(topic);await deliverPresence(topic);data='ok'}
      if(req.method==='send'){
        for(const peer of clients.filter(p=>p!==c&&p.channels.has(topic)))await peer.eval(`window.__channelEvent(${JSON.stringify(topic)},'broadcast',${JSON.stringify(value)})`);
        data='ok';
      }
    }
  }catch(e){error={message:e.message}}
  await c.eval(`window.__resolveTest(${req.id},${JSON.stringify({data,error})})`).catch(()=>{});
}
function mockAuth(uid){return `(()=>{
  let account=${JSON.stringify(accounts[uid])}, seq=0;const callbacks=new Map(),listeners=new Set(),channels=new Map();
  const call=(method,...args)=>{const p=new Promise(resolve=>{const id=++seq;callbacks.set(id,resolve);window.testBackend(JSON.stringify({id,method,args}))});p.abortSignal=()=>p;return p};
  window.__resolveTest=(id,result)=>{callbacks.get(id)?.(result);callbacks.delete(id)};
  window.__channelEvent=(topic,type,value)=>{const ch=channels.get(topic);if(!ch)return;if(type==='presence'){ch.state=value;ch.handlers.filter(h=>h.type==='presence').forEach(h=>h.fn())}else ch.handlers.filter(h=>h.type==='broadcast'&&h.filter.event===value.event).forEach(h=>h.fn({payload:value.payload}))};
  const client={
    rpc:(name,args)=>call('rpc',name,args||{}),realtime:{setAuth:async()=>{}},
    from(table){const filter={};const q={select:()=>q,eq:(k,v)=>{filter[k]=v;return q},maybeSingle:()=>{filter.single=true;return q},abortSignal:()=>q,then:resolve=>table==='axioma_game_progress'?call('progress',filter).then(resolve):resolve({data:[]})};return q},
    channel(topic){const ch={topic,state:{},handlers:[],on(type,filter,fn){ch.handlers.push({type,filter,fn});return ch},subscribe(fn){ch.subscription=fn;call('subscribe',topic).then(()=>fn('SUBSCRIBED'));return ch},track:value=>call('track',topic,value).then(r=>r.data),presenceState:()=>ch.state,send:value=>call('send',topic,value).then(r=>r.data)};channels.set(topic,ch);return ch},
    removeChannel:ch=>{channels.delete(ch.topic);return call('remove',ch.topic)},
  };
  window.testLogout=()=>{account=null;listeners.forEach(fn=>fn({account:null,session:null}))};
  window.AxiomaAuth={CLASSES:['3TMW'],client:()=>client,ready:async()=>({account,client}),getAccount:async()=>account,getSession:async()=>account?{user:{id:account.id}}:null,onChange:fn=>{listeners.add(fn);return()=>listeners.delete(fn)},signOut:async()=>window.testLogout()};
})();`}
const dock=`document.querySelector('#axioma-social-dock').shadowRoot`, panel=`document.querySelector('#axioma-social-panel').shadowRoot`;
const click = (c,selector)=>c.eval(`${panel}.querySelector(${JSON.stringify(selector)}).click()`);
async function setup(browser,uid){
  const {browserContextId}=await browser.send('Target.createBrowserContext');
  const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});
  const tabs=await(await fetch('http://127.0.0.1:9235/json')).json();const tab=tabs.find(t=>t.id===targetId);
  const c=new CDP();await c.connect(tab.webSocketDebuggerUrl);c.account=uid;c.channels=new Map();c.progress=new Map();clients.push(c);
  await c.send('Page.enable');await c.send('Runtime.enable');await c.send('Runtime.addBinding',{name:'testBackend'});
  await c.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await c.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  c.event=m=>{
    if(m.method==='Fetch.requestPaused'){
      const p=m.params;let body=mockAuth(uid);
      if(p.request.url.endsWith('/zeeslag.js'))body=fs.readFileSync('games/rechten/zeeslag/zeeslag.js','utf8').replace('boot();',"window.__naval={S,V,fire,placeAt,confirmPlacement,renderGameUI,randomFleet,saveMatch};boot();");
      c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(body).toString('base64')});
    }
    if(m.method==='Runtime.bindingCalled')handle(c,JSON.parse(m.params.payload));
    if(m.method==='Page.frameNavigated'&&!m.params.frame.parentId){for(const topic of c.channels.keys()){c.channels.delete(topic);deliverPresence(topic)}}
  };
  await c.send('Fetch.enable',{patterns:[{urlPattern:'*/shared/axioma-auth.js'},{urlPattern:'*/zeeslag.js'}]});
  return c;
}
(async()=>{
  const version=await(await fetch('http://127.0.0.1:9235/json/version')).json();const browser=new CDP();await browser.connect(version.webSocketDebuggerUrl);
  const a=await setup(browser,A),b=await setup(browser,B);
  await a.go('');await b.go('games/pythagoras.html');
  for(const c of [a,b])await c.wait('window.AxiomaSocial?.state().connected');
  await a.eval('AxiomaSocial.refresh()');
  assert.equal(await a.eval('AxiomaSocial.state().players.length'),2);
  assert.equal(await a.eval(`document.querySelectorAll('[data-game-id="rechten-zeeslag"]').length`),1);
  // Both suggestions open the real lobby without creating an invitation or group.
  for (const [title, path] of [['Rechten Zeeslag', '/zeeslag/'], ['Kleiduifschieten', '/kleiduiven/']]) {
    await a.eval('AxiomaSocial.open()');
    await a.eval(`${panel}.querySelector('a[href*="${path}"]').click()`);
    await a.wait(`location.pathname.includes('${path}') && window.AxiomaSocial?.state().connected`);
    assert.equal(invitations.length, 0, title + ' opens without inviting anyone');
    assert.equal(groupSession, null, title + ' opens without creating a session');
  }
  await a.go('');await a.wait('window.AxiomaSocial?.state().connected');
  await a.eval('AxiomaSocial.refresh()');
  console.log('PASS: Online game suggestions open both lobbies without starting matches');
  await a.eval('AxiomaSocial.open()');await click(a,`[data-action="invite"][data-id="${B}"]`);
  await a.wait('AxiomaSocial.state().invitations.length===1');await b.eval('AxiomaSocial.refresh()');
  assert.match(await b.eval(`${dock}.querySelector('button').textContent`),/Uitnodiging/);
  assert.match(await b.eval('location.pathname'),/pythagoras/);
  await b.eval(`${dock}.querySelector('button').click()`);
  assert(await b.eval(`${panel}.querySelector('#panel').matches(':popover-open')`));
  await click(b,'[data-action="decline"]');await b.wait(`AxiomaSocial.state().invitations[0].status==='declined'`);await a.eval('AxiomaSocial.refresh()');
  assert.match(await a.eval(`${panel}.querySelector('.content').textContent`),/geweigerd/);
  console.log('PASS: cross-page online list, header invitation, explicit refusal');
  await click(a,`[data-action="invite"][data-id="${B}"]`);await a.wait(`AxiomaSocial.state().invitations[0].status==='pending'`);
  await b.go('games/verfwinkel.html');await b.wait(`window.AxiomaSocial?.state().invitations[0]?.status==='pending'`);
  await b.eval('AxiomaSocial.open()');await click(b,'[data-action="accept"]');
  await b.wait(`location.pathname.includes('/zeeslag/') && document.querySelector('#gameScreen')?.classList.contains('active')`);
  await a.eval('AxiomaSocial.refresh()');await a.wait(`location.pathname.includes('/zeeslag/') && document.querySelector('#gameScreen')?.classList.contains('active')`);
  assert.equal(await a.eval('AxiomaSocial.state().matchId'),await b.eval('AxiomaSocial.state().matchId'));
  await a.wait('__naval.S.opponentConnected');await b.wait('__naval.S.opponentConnected');
  console.log('PASS: invitation survives navigation; acceptance opens the same private match for both');
  // Real game placement logic, with grid clicks in the browser's coordinate system.
  for(const c of [a,b]){
    for(const [start,end] of [[[-4,-3],[-1,-3]],[[-4,-1],[-2,-1]],[[-4,1],[-3,1]]]){
      for(const [x,y] of [start,end]){
        const point=await c.eval(`(()=>{const svg=document.querySelector('#ownBoard'),p=svg.createSVGPoint();p.x=48+(${x}+4)*53;p.y=48+(4-(${y}))*53;const q=p.matrixTransform(svg.getScreenCTM());return {x:q.x,y:q.y}})()`);
        for(const type of ['mousePressed','mouseReleased'])await c.send('Input.dispatchMouseEvent',{type,...point,button:'left',clickCount:1});
      }
      await c.eval(`document.querySelector('#confirmShipBtn').click()`);
    }
    assert.equal(await c.eval('__naval.S.ownFleet.length'),3);
    await c.eval(`document.querySelector('#readyBtn').click()`);
  }
  await a.wait(`__naval.S.phase==='battle'&&__naval.S.myTurn`);await b.wait(`__naval.S.phase==='battle'&&!__naval.S.myTurn`);
  // Fire y=0: miss; recipient should get the next turn.
  await a.eval(`document.querySelector('#fireBtn').click()`);
  await b.wait('__naval.S.myTurn&&!__naval.V.busy');await a.wait('!__naval.V.busy');
  assert.equal(await a.eval('__naval.S.myShots.length'),1);
  assert.equal(await b.eval('__naval.S.enemyShots.length'),1);
  // Repeat the exact packet and assert no second shot is recorded.
  await a.eval(`(()=>{const {S}=__naval,s=S.myShots[0];return S.match.send({type:'broadcast',event:'shot',payload:{shot_id:s.id,from:S.me.id,a:s.a,b:s.b,key:s.key}})})()`);
  assert.equal(await b.eval('__naval.S.enemyShots.length'),1);
  await b.send('Page.reload');await b.wait(`window.__naval?.S.phase==='battle'&&__naval.S.opponentConnected`);
  assert.equal(await b.eval('__naval.S.ownFleet.length'),3);assert.equal(await b.eval('__naval.S.myTurn'),true);
  await b.eval(`document.querySelector('#bDownBtn').click();document.querySelector('#fireBtn').click()`);
  await b.wait('__naval.S.myShots[0]?.result?.points.length===3&&!__naval.V.busy');
  assert.equal(await b.eval('__naval.S.myTurn'),true);
  console.log('PASS: ship placement, private transport, misses change turns, hits retain turns, duplicate shots, reload recovery');
  await a.eval(`document.querySelector('#leaveBtn').click()`);await a.wait(`__naval.S.phase==='idle'`);await b.wait(`__naval.S.phase==='over'`);
  assert.equal(reportCount,2);
  await b.eval(`document.querySelector('#leaveBtn').click()`);await b.wait(`__naval.S.phase==='idle'`);
  console.log('PASS: leave/forfeit and mutual result reporting');
  // An authenticated pupil can start a solo match directly from the ordinary lobby.
  const reportsBeforeSolo=reportCount;
  await a.eval(`document.querySelector('#soloBtn').click()`);await a.wait('__naval.S.demo&&__naval.S.phase==="placing"');
  assert.equal(await a.eval('__naval.S.opponent.alias'),'Computer');
  for(const [start,end] of [[[-4,-3],[-1,-3]],[[-4,-1],[-2,-1]],[[-4,1],[-3,1]]]){
    await a.eval(`__naval.placeAt({x:${start[0]},y:${start[1]}});__naval.placeAt({x:${end[0]},y:${end[1]}});__naval.confirmPlacement()`);
  }
  await a.eval(`document.querySelector('#readyBtn').click()`);await a.wait('__naval.S.myTurn');
  await a.eval(`(()=>{const S=__naval.S;const slopes=[[-2,1],[-1,1],[-1,2],[0,1],[1,2],[1,1],[2,1]],lines=slopes.flatMap(([n,d])=>Array.from({length:9},(_,i)=>({a:{n,d},b:{n:i-4,d:1}})));const hit=(fleet,line)=>fleet.some(ship=>ship.cells.some(p=>p.y*line.a.d===line.a.n*p.x+line.b.n*line.a.d));const miss=lines.find(l=>!hit(S.demoEnemyFleet,l));const botMiss=lines.findIndex(l=>!hit(S.ownFleet,l));window.originalRandom=Math.random;Math.random=()=>((botMiss+.1)/lines.length);S.aimA=miss.a;S.aimB=miss.b;__naval.fire()})()`);
  await a.wait('__naval.S.enemyShots.length>0&&__naval.S.myTurn&&!__naval.V.busy');await a.eval('Math.random=originalRandom');
  for(let shots=0;shots<10&&!await a.eval('__naval.S.finished');shots++){
    await a.eval(`(()=>{const S=__naval.S;const ship=S.demoEnemyFleet.find(s=>s.hits.size<s.cells.length);const p=ship.cells.find(p=>!ship.hits.has(p.x+','+p.y));S.aimA={n:0,d:1};S.aimB={n:p.y,d:1};__naval.fire()})()`);
    await a.wait('__naval.S.finished||(__naval.S.myTurn&&!__naval.V.busy)');
  }
  assert.equal(await a.eval('__naval.S.finished'),true);assert.equal(reportCount,reportsBeforeSolo,'solo never alters online ranking');
  await a.eval(`document.querySelector('#leaveBtn').click()`);await a.wait('!__naval.S.demo&&__naval.S.phase==="idle"');
  assert.equal(await a.eval('__naval.S.me.id'),A,'leaving solo retains actual platform account');
  console.log('PASS: solo entry, placement, miss/bot turn, victory, return to online lobby; no fabricated players or ranked results');

  await a.go('games/rechten/kleiduiven/');await b.go('games/rechten/kleiduiven/');
  for(const c of [a,b])await c.wait('window.AxiomaGroups?.state().connected');
  await a.eval(`document.querySelector('#openGroup').click()`);await a.wait(`document.querySelector('[data-group-action="create"]')&&!document.querySelector('[data-group-action="create"]').disabled`);
  await a.eval(`document.querySelector('[data-group-action="create"]').click()`);
  await a.wait(`location.pathname.includes('/kleiduiven/')&&document.querySelector('#groupDialog')?.open`);
  await b.eval('AxiomaGroups.refresh()');await b.wait(`document.querySelector('#lobbyGroupList').textContent.includes('Groep van Test-A')`);
  await b.go('games/pythagoras.html');await b.wait('window.AxiomaGroups?.state().connected');
  await b.eval('AxiomaGroups.refresh();AxiomaSocial.open()');await b.wait(`${panel}.querySelector('[data-action="group-join"]')`);
  await click(b,'[data-action="group-join"]');await b.wait(`location.pathname.includes('/kleiduiven/')&&document.querySelector('#groupDialog')?.open`);
  await a.eval('AxiomaGroups.refresh()');await a.wait(`!document.querySelector('[data-group-action="start"]').disabled`);
  await a.eval(`document.querySelector('[data-group-action="start"]').click()`);
  for(const c of [a,b])await c.wait(`document.querySelector('#choices button:not(:disabled)')&&!document.querySelector('#groupDialog').open`);
  await a.eval(`document.querySelector('#choices [data-a="1"]').click()`);
  await a.wait(`document.querySelector('#choices [data-a="-1"]:not(:disabled)')`);
  await a.eval(`document.querySelector('#choices [data-a="1"]').click()`);
  await a.wait(`AxiomaGroups.state().member.misses===1&&document.querySelector('#choices [data-a="2"]:not(:disabled)')`);
  assert.equal(await a.eval('AxiomaGroups.state().member.streak'),0);
  for(const slope of [1,-1,2,-.5,.5,-2,0]){
    await b.wait(`document.querySelector('#choices [data-a="${slope}"]:not(:disabled)')`);
    await b.eval(`document.querySelector('#choices [data-a="${slope}"]').click()`);
    await delay(1200);
  }
  for(const c of [a,b])await c.wait(`document.querySelector('#groupContent').textContent.includes('Test-B wint!')`);
  await b.eval(`document.querySelector('#groupRanking').click()`);await b.wait(`document.querySelector('#groupRankingContent table')`);
  assert.match(await b.eval(`document.querySelector('#groupRankingContent').textContent`),/Test-B/);
  for(const [width,height] of [[390,844],[844,390],[1440,1000]]){
    await b.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<900});
    assert.equal(await b.eval('document.documentElement.scrollWidth>innerWidth'),false,'group page overflow '+width);
    const shot=await b.send('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(`/tmp/leraarbob-clay-group-${width}.png`,Buffer.from(shot.data,'base64'));
  }
  console.log('PASS: student creates group in game, visible in lobby, join from another game, shared start, mistake resets all, seven correct wins and ranks');
  // Popover layout and keyboard dismissal on small screens.
  await a.go('');await a.wait('window.AxiomaSocial?.state().connected');
  for(const width of [320,390,768,1440]){
    await a.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<700});
    await a.eval('AxiomaSocial.open()');
    assert.equal(await a.eval('document.documentElement.scrollWidth>innerWidth'),false,'overflow at '+width);
    assert.equal(await a.eval(`${panel}.querySelector('#panel').scrollWidth > ${panel}.querySelector('#panel').clientWidth`),false,'Online panel overflow at '+width);
    const shot=await a.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`/tmp/leraarbob-social-${width}.png`,Buffer.from(shot.data,'base64'));
    await a.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await a.wait(`${panel}.querySelector('#panel').matches(':popover-open')===false`);
  }
  fail=true;await a.eval('AxiomaSocial.refresh()');assert.equal(await a.eval('AxiomaSocial.state().connected'),false);
  fail=false;await a.eval('AxiomaSocial.refresh()');assert.equal(await a.eval('AxiomaSocial.state().connected'),true);
  await a.eval('testLogout()');assert.equal(await a.eval(`document.querySelector('#axioma-social-dock').hidden`),true);
  console.log('PASS: responsive header, accessible dismissal, connection recovery, logout cleanup');
  for(const c of [a,b])assert.deepEqual(c.errors,[]);
  for(const c of clients)c.ws.close();browser.ws.close();
})().then(()=>process.exit(0),e=>{console.error(e);process.exit(1)});
