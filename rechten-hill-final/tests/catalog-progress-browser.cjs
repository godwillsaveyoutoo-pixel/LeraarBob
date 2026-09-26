// Run against a local server and an isolated Chromium profile; see tests/README.md.
const assert=require('node:assert/strict'),fs=require('node:fs');
class CDP{
 async connect(){const tabs=await(await fetch('http://127.0.0.1:9235/json')).json();this.ws=new WebSocket(tabs[0].webSocketDebuggerUrl);this.pending=new Map();this.id=0;this.errors=[];await new Promise(r=>this.ws.onopen=r);this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails);else if(m.method==='Fetch.requestPaused')this.paused?.(m.params)};await this.send('Page.enable');await this.send('Runtime.enable')}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
// Synthetic accounts only: the real progress service runs against this in-memory client.
const mockAuth = `(() => {
 const fixtures={
  a:{games:[{game_id:'pythagoras',state:{completed:[1,2,3],total:10}},{game_id:'gravity-maze',state:{completed:[1,2,3,4,5,6,7,8,9],total:9}},{game_id:'algebra-smederij',state:{completed:['D01','D02'],total:80}}],trainer:{state:{total:24,correct:18,xp:140}}},
  b:{games:[{game_id:'pythagoras',state:{completed:[1],total:10}}],trainer:null}
 };
 let account={id:'a',role:'student',alias:'Testleerling'};
 const listeners=new Set();window.testQueries=[];window.testDelay=0;window.testFailures={};
 const client={from(table){const record={table};window.testQueries.push(record);const query={
  select(){return query},eq(column,value){record[column]=value;return query},maybeSingle(){return query},abortSignal(){return query},
  then(resolve){const data=fixtures[record.user_id],value=table==='axioma_progress'?data?.trainer:data?.games||[],error=window.testFailures[table];setTimeout(()=>resolve(error?{error:new Error('Offline')}:{data:value}),window.testDelay)}
 };return query}};
 window.testAccount=(id,role='student')=>{account=id?{id,role,alias:id==='a'?'Testleerling':'Andere leerling'}:null;listeners.forEach(fn=>fn({account}))};
 window.testComplete=()=>{fixtures.a.games[0].state.completed=[1,2,3,4]};
 window.AxiomaAuth={CLASSES:['3TBO'],ready:async()=>({account}),getAccount:async()=>account,client:()=>client,onChange:fn=>{listeners.add(fn);return()=>listeners.delete(fn)},signOut:async()=>window.testAccount(null)};
})();`;
(async()=>{
 const c=new CDP();await c.connect();const ev=s=>c.eval(s);
 await c.send('Network.enable');await c.send('Network.setCacheDisabled',{cacheDisabled:true});
 const wait=async expr=>{for(let i=0;i<100;i++){if(await ev(expr))return;await delay(50)}throw Error('Timeout: '+expr)};
 const label=id=>`(document.querySelector('[data-game-id="${id}"] .card-progress')?.textContent || '')`;
 await c.send('Emulation.setTouchEmulationEnabled',{enabled:false});
 await c.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 // Read the live exercise count without completing or modifying an exercise.
 await c.send('Page.navigate',{url:'http://127.0.0.1:8765/games/algebra-smederij.html'});await wait('!!window.RF22');
 console.log('Algebra Smederij exercise count:',await ev('RF22.challenges.length'));
 c.paused=p=>c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(mockAuth).toString('base64')});
 await c.send('Fetch.enable',{patterns:[{urlPattern:'*/shared/axioma-auth.js'}]});
 await c.send('Page.navigate',{url:'http://127.0.0.1:8765/'});
 await wait(`${label('pythagoras')}.includes('3 van 10')`);
 assert.equal(await ev(`document.querySelector('[data-game-id="pythagoras"] progress').value`),3);
 assert.equal(await ev(`document.querySelector('[data-game-id="pythagoras"] .card-action').textContent`),'Ga verder');
 assert.equal(await ev(`document.querySelector('[data-game-id="gravity-maze"] .card-detail').textContent`),'✓ Afgerond');
 assert.equal(await ev(`document.querySelector('[data-game-id="gravity-maze"] .card-action').textContent`),'Opnieuw spelen');
 assert.match(await ev(label('rechten-trainer')),/24 vragen geoefend/);
 assert.match(await ev(`document.querySelector('[data-game-id="rechten-trainer"] .card-detail').textContent`),/18 juist · 140 XP/);
 assert.equal(await ev(`document.querySelectorAll('[data-game-id="rechten-trainer"] progress').length`),0);
 assert.match(await ev(label('functies-rechten')),/Vrij verkennen/);
 assert.match(await ev(label('stelsels')),/0 van 14 oefeningen/);
 assert(await ev(`testQueries.every(q=>q.user_id==='a')`));
 // Account navigation must expose the whole catalog, even after filtering it down.
 await ev(`document.querySelector('[data-filter="Meetkunde"]').click();document.querySelector('#search').value='pythagoras';document.querySelector('#search').dispatchEvent(new Event('input'));document.querySelector('#accountBtn').click()`);
 assert.equal(await ev(`document.querySelectorAll('.card').length`),1);
 assert.equal(await ev(`document.querySelector('#authTitle').textContent`),'Je leraarBob-account');
 for(const [width,mode] of [[320,'light'],[1440,'dark']]){
  await c.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<700});
  await ev(`document.documentElement.dataset.mode='${mode}'`);
  assert.equal(await ev(`document.querySelector('.auth-sheet').scrollWidth>document.querySelector('.auth-sheet').clientWidth`),false,'account overflow '+width);
  const shot=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`/tmp/leraarbob-account-${width}-${mode}.png`,Buffer.from(shot.data,'base64'));
 }
 await ev(`document.querySelector('#browseGamesBtn').click()`);
 assert.equal(await ev(`document.querySelector('#authOverlay').hidden`),true);
 assert.equal(await ev(`document.querySelector('#search').value`),'');
 assert.equal(await ev(`document.querySelectorAll('.card').length`),await ev('AXIOMA_CATALOG.length'));
 for(const id of ['rechten-trainer','vectoren-trainer','reele-getallen-trainer'])assert(await ev(`!!document.querySelector('[data-game-id="${id}"]')`),id+' visible from account');
 assert.equal(await ev('document.activeElement.id'),'ontdek');
 assert.match(await ev(label('pythagoras')),/3 van 10/);
 await ev(`document.documentElement.dataset.mode='light'`);
 console.log('PASS: account opens all games and trainers, clears search and topic, retains progress; light/dark account layout');
 for(const width of [320,390,768,1440]){
  await c.send('Emulation.setDeviceMetricsOverride',{width,height:width<700?844:1000,deviceScaleFactor:1,mobile:width<700});await delay(80);
  assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false,'page overflow '+width);
  const shot=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/leraarbob-progress-'+width+'.png',Buffer.from(shot.data,'base64'));
 }
 assert.equal(await ev(`getComputedStyle(document.querySelector('[data-game-id="gravity-maze"]')).borderLeftColor`),'rgb(201, 155, 50)');
 assert.equal(await ev(`new Set([...document.querySelectorAll('[data-topic="Functies"].card')].map(c=>getComputedStyle(c).getPropertyValue('--topic'))).size`),1);
 console.log('PASS: personal bars, trainer statistics, untracked and complete labels, responsive widths');
 await ev(`document.querySelector('[data-filter="Meetkunde"]').click()`);assert.match(await ev(label('pythagoras')),/3 van 10/);
 await ev(`document.querySelector('#resetFilters').click();document.querySelector('#search').value='gravity';document.querySelector('#search').dispatchEvent(new Event('input'))`);
 assert.equal(await ev(`document.querySelectorAll('.card').length`),1);assert.equal(await ev(`document.querySelector('progress').value`),9);
 await ev(`document.querySelector('#resetFilters').click()`);
 await ev(`testAccount('b')`);assert(!/3 van 10/.test(await ev(label('pythagoras'))));await wait(`${label('pythagoras')}.includes('1 van 10')`);
 await ev(`testDelay=500;testAccount('a');testAccount(null)`);assert.equal(await ev(`document.querySelectorAll('.card-progress:not([hidden])').length`),0);
 await delay(600);assert.equal(await ev(`document.querySelectorAll('.card-progress:not([hidden])').length`),0);
 const before=await ev('testQueries.length');await ev(`testAccount('teacher','teacher')`);await delay(80);assert.equal(await ev('testQueries.length'),before);
 await ev(`document.querySelector('#accountBtn').click()`);
 assert.equal(await ev(`document.querySelector('#authContent a').getAttribute('href')`),'teacher/');
 await ev(`document.querySelector('#browseGamesBtn').click()`);
 assert.equal(await ev(`document.querySelector('#authOverlay').hidden`),true);
 await ev(`testDelay=0;testAccount('b')`);await wait(`${label('pythagoras')}.includes('1 van 10')`);
 console.log('PASS: account switching, logout, late response discarded, teacher excluded; filters retain progress');
 await ev(`testFailures={axioma_game_progress:true};testAccount('a')`);await wait(`document.querySelector('#progressNotice').hidden===false`);
 assert.match(await ev(label('pythagoras')),/niet beschikbaar/);assert.match(await ev(label('rechten-trainer')),/24 vragen/);
 await ev(`testFailures={};document.querySelector('#retryProgress').click()`);await wait(`${label('pythagoras')}.includes('3 van 10')`);assert.equal(await ev(`document.querySelector('#progressNotice').hidden`),true);
 await ev(`testComplete();window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))`);await wait(`${label('pythagoras')}.includes('4 van 10')`);
 await ev(`document.querySelector('#modeBtn').click()`);
 const dark=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/leraarbob-progress-dark.png',Buffer.from(dark.data,'base64'));
 assert.deepEqual(c.errors,[]);console.log('PASS: partial failures, retry, refresh after browser back, dark mode; no runtime errors');
 await c.send('Fetch.disable');c.ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
