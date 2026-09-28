// Run against a local server and an isolated Chromium profile; see tests/README.md.
const assert=require('node:assert/strict'),fs=require('node:fs');
const PORT=process.env.VECTOR_BROWSER_PORT||9245,BASE=process.env.VECTOR_BASE_URL||'http://127.0.0.1:8775';
const OUT='docs/homepage/screenshots';fs.mkdirSync(OUT,{recursive:true});
class CDP{
 async connect(url){this.ws=new WebSocket(url);this.pending=new Map();this.id=0;this.errors=[];await new Promise(r=>this.ws.onopen=r);this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails);else if(m.method==='Fetch.requestPaused')this.paused?.(m.params)}}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
// Synthetic accounts only: the real progress service runs against this in-memory client.
const mockAuth = `(() => {
 const fixtures={
  a:{games:[{game_id:'pythagoras',state:{completed:[1,2,3],total:10}},{game_id:'gravity-maze',state:{completed:[1,2,3,4,5,6,7,8,9],total:9}},{game_id:'algebra-smederij',state:{completed:['D01','D02'],total:80}},{game_id:'vectoren-trainer',state:{completed:['a'],total:20,storage:{'axioma-vectorentrainer-v020':JSON.stringify({progress:{xp:320}})}}}],trainer:{state:{total:24,correct:18,xp:140}}},
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
 const version=await(await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(),browser=new CDP();await browser.connect(version.webSocketDebuggerUrl);
 const {browserContextId}=await browser.send('Target.createBrowserContext'),{targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});
 const c=new CDP();await c.connect(`ws://127.0.0.1:${PORT}/devtools/page/${targetId}`);const ev=s=>c.eval(s);
 try{
 await c.send('Page.enable');await c.send('Runtime.enable');await c.send('Network.enable');await c.send('Network.setCacheDisabled',{cacheDisabled:true});
 const wait=async expr=>{for(let i=0;i<100;i++){if(await ev(expr))return;await delay(50)}throw Error('Timeout: '+expr)};
 const label=id=>`(document.querySelector('[data-game-id="${id}"] .card-progress')?.textContent || '')`;
 await c.send('Emulation.setTouchEmulationEnabled',{enabled:false});
 await c.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 c.paused=p=>{const url=new URL(p.request.url);if(url.pathname.endsWith('/axioma-auth.js'))return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(mockAuth).toString('base64')});if(url.hostname!=='127.0.0.1'||url.pathname.endsWith('/axioma-social.js'))return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,body:''});return c.send('Fetch.continueRequest',{requestId:p.requestId})};
 await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 await c.send('Page.navigate',{url:BASE+'/'});
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
 assert.deepEqual(await ev(`Array.from(document.querySelectorAll('#featuredGrid .card'),c=>c.dataset.gameId)`),['rechtenwereld','wortelbouw','vectoren-trainer','gravity-maze']);
 assert.equal(await ev(`document.querySelector('#reserve').open`),false);
 assert.equal(await ev(`document.querySelectorAll('#grid .card').length`),14);
 assert.match(await ev(`document.querySelector('[data-game-id=wortelbouw]').href`),/wortelbouw_pro_v0.5.0/);
 assert.match(await ev(`document.querySelector('[data-game-id=vectoren-trainer]').href`),/v0.4_vectormissie/);
 assert.equal(await ev(`document.getElementById('totalXP').textContent`),'460');await wait("document.querySelector('leraarbob-topbar')?.shadowRoot.querySelector('.progress-value').textContent==='460 XP'");
 assert.equal(await ev(`document.getElementById('totalCompleted').textContent`),'15');
 for(const width of [390,1440]){
  await c.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<700});
  await ev(`scrollTo({top:0,behavior:'instant'});document.getElementById('progressBreakdown').open=true`);await delay(150);
  assert.equal(await ev(`document.querySelectorAll('#progressGames li').length`),4);
  assert.equal(await ev(`document.querySelector('#progressReserve').open`),false);
  assert(await ev(`document.querySelectorAll('#progressReserveGames li').length>4`));
  assert.equal(await ev(`document.documentElement.scrollWidth>innerWidth`),false);
  const shot=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(OUT+'/central-progress-'+width+'.png',Buffer.from(shot.data,'base64'));
 }
 await ev(`document.getElementById('progressBreakdown').open=false`);
 await wait(`!!document.querySelector('leraarbob-topbar')`);
 await ev(`document.querySelector('leraarbob-topbar').shadowRoot.querySelectorAll('.crumbs button')[2].click()`);
 assert.equal(await ev(`document.getElementById('reserve').open`),true);
 // Account navigation must expose the whole catalog, even after filtering it down.
 await ev(`document.querySelector('[data-filter="Meetkunde"]').click();document.querySelector('#search').value='pythagoras';document.querySelector('#search').dispatchEvent(new Event('input'));document.querySelector('#accountBtn').click()`);
 assert.equal(await ev(`document.querySelectorAll('#grid .card').length`),1);
 assert.equal(await ev(`document.querySelector('#authTitle').textContent`),'Je leraarBob-account');
 for(const [width,mode] of [[320,'light'],[1440,'dark']]){
  await c.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<700});
  await ev(`document.documentElement.dataset.mode='${mode}'`);
  assert.equal(await ev(`document.querySelector('.auth-sheet').scrollWidth>document.querySelector('.auth-sheet').clientWidth`),false,'account overflow '+width);
  const shot=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(`${OUT}/account-${width}-${mode}.png`,Buffer.from(shot.data,'base64'));
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
  const shot=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(OUT+'/progress-'+width+'.png',Buffer.from(shot.data,'base64'));
 }
 assert.equal(await ev(`getComputedStyle(document.querySelector('[data-game-id="gravity-maze"]')).borderLeftWidth`),'0px');
 assert.equal(await ev(`new Set([...document.querySelectorAll('[data-topic="Functies"].card')].map(c=>getComputedStyle(c).getPropertyValue('--topic'))).size`),1);
 console.log('PASS: personal bars, trainer statistics, untracked and complete labels, responsive widths');
 await ev(`document.querySelector('[data-filter="Meetkunde"]').click()`);assert.match(await ev(label('pythagoras')),/3 van 10/);
 await ev(`document.querySelector('#resetFilters').click();document.querySelector('#search').value='gravity';document.querySelector('#search').dispatchEvent(new Event('input'))`);
 assert.equal(await ev(`document.querySelectorAll('#grid .card').length`),0);assert.equal(await ev(`document.querySelector('#featuredGrid [data-game-id="gravity-maze"] progress').value`),9);
 await ev(`document.querySelector('#resetFilters').click()`);
 await ev(`testAccount('b')`);assert(!/3 van 10/.test(await ev(label('pythagoras'))));await wait(`${label('pythagoras')}.includes('1 van 10')`);assert.equal(await ev(`document.getElementById('totalXP').textContent`),'0');await wait("document.querySelector('leraarbob-topbar').shadowRoot.querySelector('.progress-value').textContent==='0 XP'");
 await ev(`testDelay=500;testAccount('a');testAccount(null)`);assert.equal(await ev(`document.querySelectorAll('.card-progress:not([hidden])').length`),0);
 await delay(600);assert.equal(await ev(`document.querySelectorAll('.card-progress:not([hidden])').length`),0);
 const before=await ev('testQueries.length');await ev(`testAccount('teacher','teacher')`);await delay(80);assert.equal(await ev('testQueries.length'),before);
 await wait(`!document.querySelector('leraarbob-topbar').shadowRoot.querySelector('.teacher-link').hidden`);
 for(const width of [320,390,780,1440]){
  await c.send('Emulation.setDeviceMetricsOverride',{width,height:850,deviceScaleFactor:1,mobile:width<700});await delay(80);
  assert(await ev('document.documentElement.scrollWidth<=innerWidth'),'teacher navigation overflow '+width);
  assert(await ev(`(()=>{const r=document.querySelector('leraarbob-topbar').shadowRoot.querySelector('.teacher-link').getBoundingClientRect();return r.width>=44&&r.height>=44&&r.right<=innerWidth})()`));
 }
 await ev(`document.querySelector('#accountBtn').click()`);
 assert.equal(await ev(`document.querySelector('#authContent a').getAttribute('href')`),'teacher/');
 await ev(`document.querySelector('#browseGamesBtn').click()`);
 assert.equal(await ev(`document.querySelector('#authOverlay').hidden`),true);
 await ev(`testDelay=0;testAccount('b')`);await wait(`${label('pythagoras')}.includes('1 van 10')`);assert.equal(await ev(`document.getElementById('totalXP').textContent`),'0');await wait("document.querySelector('leraarbob-topbar').shadowRoot.querySelector('.progress-value').textContent==='0 XP'");
 assert(await ev(`document.querySelector('leraarbob-topbar').shadowRoot.querySelector('.teacher-link').hidden`));
 console.log('PASS: account switching, logout, late response discarded, teacher excluded; filters retain progress');
 await ev(`testFailures={axioma_game_progress:true};testAccount('a')`);await wait(`document.querySelector('#progressNotice').hidden===false`);
 assert.equal(await ev(`document.getElementById('totalXP').textContent`),'—');assert.match(await ev(label('pythagoras')),/niet beschikbaar/);assert.match(await ev(label('rechten-trainer')),/24 vragen/);
 await ev(`testFailures={};document.querySelector('#retryProgress').click()`);await wait(`${label('pythagoras')}.includes('3 van 10')`);assert.equal(await ev(`document.querySelector('#progressNotice').hidden`),true);
 await ev(`testComplete();window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))`);await wait(`${label('pythagoras')}.includes('4 van 10')`);
 await ev(`document.querySelector('#modeBtn').click()`);
 const dark=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(OUT+'/progress-dark.png',Buffer.from(dark.data,'base64'));
 assert.deepEqual(c.errors,[]);console.log('PASS: partial failures, retry, refresh after browser back, dark mode; no runtime errors');
 assert.equal(await ev(`document.getElementById('totalXP').textContent`),'460');await wait("document.querySelector('leraarbob-topbar')?.shadowRoot.querySelector('.progress-value').textContent==='460 XP'");
 // Guest presentation: all three covers, portrait and landscape layouts, reserve, real pointer and keyboard actions.
 await ev(`testAccount(null);document.documentElement.dataset.mode='light';document.getElementById('reserve').open=false;scrollTo(0,0)`);
 for(const [width,height] of [[320,844],[390,844],[680,900],[780,360],[1440,1000]]){
  await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});
  await ev(`scrollTo(0,0)`);await delay(120);
  await ev(`Promise.all([...document.querySelectorAll('#featuredGrid img')].map(img=>img.decode()))`);
  assert.equal(await ev('document.documentElement.scrollWidth>innerWidth'),false,'homepage overflow '+width);
  assert.equal(await ev(`document.querySelectorAll('#featuredGrid img').length`),4);
  assert.equal(await ev(`[...document.querySelectorAll('#featuredGrid img')].every(img=>img.naturalWidth>0)`),true);
  const controls=await ev(`(()=>{const s=document.querySelector('leraarbob-topbar').shadowRoot;return [...s.querySelectorAll('.actions button'),...document.querySelectorAll('#featuredGrid .card-action')].map(n=>({label:n.getAttribute('aria-label')||n.textContent,w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height}))})()`);
  for(const control of controls){assert(control.w>=44&&control.h>=44,JSON.stringify({width,...control}));}
  const clip=await ev(`({x:0,y:0,width:document.documentElement.clientWidth,height:document.documentElement.scrollHeight,scale:1})`);
  const image=await c.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip});fs.writeFileSync(OUT+'/homepage-'+width+'.png',Buffer.from(image.data,'base64'));
 }
 await c.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await ev(`document.querySelector('#reserve summary').scrollIntoView({block:'center',behavior:'instant'})`);await delay(80);
 const target=await ev(`(()=>{const r=document.querySelector('#reserve summary').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 await c.send('Input.dispatchMouseEvent',{type:'mousePressed',...target,button:'left',clickCount:1});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',...target,button:'left',clickCount:1});
 await wait(`document.getElementById('reserve').open`);
 await ev(`document.querySelector('#reserve summary').focus()`);await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await wait(`!document.getElementById('reserve').open`);
 assert.equal(await ev(`document.querySelector('#featuredGrid [data-game-id=wortelbouw]').getAttribute('href')`),BASE+'/games/wortelbouw_pro_v0.5.0/wortelbouw/index.html');
 console.log('PASS: four loaded covers, 44px actions, no overflow at 320/390/680/780/1440, pointer and keyboard reserve navigation');
 // The platform header must remain operable after scrolling, including in dark mode.
 assert.equal(await ev(`document.querySelector('.home-intro')`),null);
 for(const width of [390,1440]){
  await c.send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<700});
  await ev(`document.documentElement.dataset.mode='dark';document.getElementById('reserve').open=true;scrollTo({top:400,behavior:'instant'})`);await delay(150);
  assert.equal(await ev(`Math.round(document.querySelector('.top').getBoundingClientRect().top)`),0,'header remains pinned');
  assert.equal(await ev(`(()=>{const host=document.querySelector('leraarbob-topbar'),button=host.shadowRoot.querySelector('.menu'),r=button.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===host})()`),true,'pinned menu is reachable');
  const contrasts=await ev(`(()=>{
   const rgb=s=>(s.match(/[\\d.]+/g)||[]).map(Number);
   const lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
   return [...document.querySelectorAll('.featured-card h2,.card .meta,.card .description,.card-detail,.card-action,.reserve-heading strong,.reserve-heading>span,.reserve-intro,.filter,.search-wrap input,.progress-identity strong,.progress-identity span,#playerTotals dt,#playerTotals dd,#progressBreakdown summary,.progress-game-link,.progress-game-label,.progress-game-xp')].filter(e=>e.getClientRects().length).map(e=>{
    let parent=e,bg;while(parent){bg=rgb(getComputedStyle(parent).backgroundColor);if(bg.length===3||bg[3]===1)break;parent=parent.parentElement;}
    const a=lum(rgb(getComputedStyle(e).color)),b=lum(bg);return {text:e.textContent.slice(0,50)||e.placeholder,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
   });
  })()`);
  for(const pair of contrasts)assert(pair.ratio>=4.5,JSON.stringify({width,...pair}));
  await ev(`scrollTo({top:0,behavior:'instant'});document.getElementById('reserve').open=false`);await delay(100);
  const image=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(OUT+'/homepage-dark-'+width+'.png',Buffer.from(image.data,'base64'));
  await ev(`LeraarBobTopbar.setCollapsed(true)`);await delay(100);
  assert.equal(await ev(`document.querySelector('.top').getBoundingClientRect().height`),0);
  await ev(`document.querySelector('.lb-restore').click()`);await delay(100);
  assert(await ev(`document.querySelector('.top').getBoundingClientRect().height>44`));
 }
 console.log('PASS: sticky desktop/mobile header, collapse/restore and dark card/filter text contrast at least 4.5:1');
 assert.deepEqual(c.errors,[]);
 await c.send('Fetch.disable');
 }finally{await browser.send('Target.disposeBrowserContext',{browserContextId});c.ws.close();browser.ws.close();}
})().catch(e=>{console.error(e);process.exit(1)});
