// Real Chromium pointer/touch verification, isolated guest context, no external requests.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const Core=require('../games/vectoren/vector-core.js'),M=Core.VectorMath;
const PORT=process.env.VECTOR_BROWSER_PORT||9245,BASE=process.env.VECTOR_BASE_URL||'http://127.0.0.1:8775';
const OUT=path.resolve(__dirname,'../docs/vectoren-v04/screenshots/battle');fs.mkdirSync(OUT,{recursive:true});
class CDP{
 async connect(url){this.ws=new WebSocket(url);this.id=0;this.pending=new Map();this.errors=[];await new Promise(r=>this.ws.onopen=r);this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);if(!p)return;clearTimeout(p.timer);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(m.method==='Page.loadEventFired')this.loads=(this.loads||0)+1;else if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails);else if(m.method==='Fetch.requestPaused')this.route(m.params).catch(e=>this.errors.push(e.message));};}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id,timer=setTimeout(()=>reject(Error('Timeout '+method)),15000);this.pending.set(id,{resolve,reject,timer});this.ws.send(JSON.stringify({id,method,params}))})}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
 async wait(expr){for(let i=0;i<150;i++){if(await this.eval(expr))return;await new Promise(r=>setTimeout(r,30))}throw Error('Timeout '+expr)}
 async frames(){await this.eval('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')}
 async click(selector,touch=false){if(selector==='#openRanking')await this.eval("document.querySelector('leraarbob-topbar').shadowRoot.querySelector('.menu').click()");const p=await this.eval(`(()=>{const e=${JSON.stringify(selector)}==='#openRanking'?document.querySelector('leraarbob-topbar').shadowRoot.querySelector('[data-source=openRanking]'):document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect();if(!r.width||!r.height)throw Error('hidden ${selector}');return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await this.tap(p,touch);await this.frames()}
 async tap(p,touch=false){if(touch){await this.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await this.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}else{await this.send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await this.send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1})}}
 async size(width,height){await this.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await this.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});await this.frames()}
 async shot(name){await this.frames();const r=await this.send('Page.captureScreenshot',{captureBeyondViewport:false});fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from(r.data,'base64'))}
}
(async()=>{
 const version=await(await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(),browser=new CDP();await browser.connect(version.webSocketDebuggerUrl);
 const {browserContextId}=await browser.send('Target.createBrowserContext'),{targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});
 const tabs=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json(),c=new CDP();await c.connect(tabs.find(t=>t.id===targetId).webSocketDebuggerUrl);
 const checks=[],check=s=>{checks.push(s);console.log('PASS '+s)},requests=[];
 try{
 await c.send('Page.enable');await c.send('Runtime.enable');await c.send('Network.enable');await c.send('Network.setCacheDisabled',{cacheDisabled:true});
 c.route=async p=>{requests.push(p.request.url);const u=new URL(p.request.url);if(u.hostname!=='127.0.0.1')return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'});return c.send('Fetch.continueRequest',{requestId:p.requestId});};await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 await c.size(1366,768);await c.send('Page.navigate',{url:BASE+'/games/vectoren/battle.html'});await c.wait('!!window.VectorBattle&&!document.getElementById("startBattle").disabled');
 const marker=JSON.stringify({personal:'preserve me',xp:1234});await c.eval(`localStorage.setItem('axioma-vectorentrainer-v020',${JSON.stringify(marker)})`);
 const state=()=>c.eval('VectorBattle.inspect()');
 const pane=(i,code)=>c.eval(`(()=>{const win=document.getElementById('pane${i}').contentWindow;return (${code})(win)})()`);
 const snap=i=>pane(i,'w=>w.AxiomaVectorTrainer.inspect()');
 async function paneClick(i,selector,touch=false){const p=await pane(i,`w=>{const r=w.document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(),f=w.frameElement.getBoundingClientRect();if(!r.width||!r.height)throw Error('hidden '+${JSON.stringify(selector)});return {x:f.x+r.x+r.width/2,y:f.y+r.y+r.height/2}}`);await c.tap(p,touch);await c.frames();}
 async function xy(i,p){return pane(i,`w=>{const p=w.AxiomaVectorTrainer.project(${JSON.stringify(p)}),r=w.document.getElementById('board').getBoundingClientRect(),f=w.frameElement.getBoundingClientRect();return {x:f.x+r.x+p.x,y:f.y+r.y+p.y}}`);}
 async function draw(i,start,end,touch=false){await paneClick(i,'#vectorTool',touch);await c.tap(await xy(i,start),touch);await c.tap(await xy(i,end),touch);await c.frames();}
 async function solve(i){const t=(await snap(i)).task;await draw(i,t.start,M.endPointFromVector(t.start,t.target));await paneClick(i,'#commit');await c.wait('VectorBattle.inspect().resolved');}
 async function setup(skill='arrow',world='navigatienet'){
  await c.eval(`document.getElementById('world').value=${JSON.stringify(world)};document.getElementById('world').dispatchEvent(new Event('change'));document.getElementById('skill').value=${JSON.stringify(skill)};document.getElementById('name0').value='Alex';document.getElementById('name1').value='Sam';`);
  await c.eval("document.getElementById('startBattle').scrollIntoView({block:'center'})");await c.click('#startBattle');await c.wait('VectorBattle.inspect().active');await c.frames();await c.frames();
 }
 async function layout(label){const problems=await c.eval(`(()=>{const issues=[];for(const frame of document.querySelectorAll('iframe')){const w=frame.contentWindow,d=w.document,r=frame.getBoundingClientRect();if(r.bottom>innerHeight+1||r.right>innerWidth+1)issues.push('pane outside');if(d.documentElement.scrollHeight>w.innerHeight+1||d.documentElement.scrollWidth>w.innerWidth+1)issues.push('pane scroll');for(const e of d.querySelectorAll('#play button')){if(!e.getClientRects().length)continue;const b=e.getBoundingClientRect();if(b.left<-.5||b.right>w.innerWidth+.5||b.top<-.5||b.bottom>w.innerHeight+.5)issues.push('outside '+e.id);}}return issues;})()`);assert.deepEqual(problems,[],label);check(label);}
 assert.equal(await c.eval('document.getElementById("world").options[0].value'),'mixed');
 assert.equal(await c.eval('document.getElementById("world").value'),'mixed');
 await c.shot('setup-mixed-1366');await c.click('#startBattle');await c.wait('VectorBattle.inspect().active');await c.frames();
 const mixed=(await state()).deck.map(t=>t.skill);assert(mixed.includes('decompose'));assert(mixed.includes('figure'));assert(mixed.includes('headtail'));assert(mixed.includes('difference'));assert(!mixed.some(id=>['equal','free','props','arrow','opposite'].includes(id)));
 assert.deepEqual((await snap(0)).task,(await snap(1)).task);
 const decomposition=(await snap(0)).task,[d,e]=decomposition.dirs;
 for(const v of [M.scale(d,M.cross(decomposition.target,e)/M.cross(d,e)),M.scale(e,M.cross(d,decomposition.target)/M.cross(d,e))])await draw(0,decomposition.start,M.endPointFromVector(decomposition.start,v));
 await paneClick(0,'#commit');await c.wait('VectorBattle.inspect().resolved');assert.deepEqual((await state()).scores,[1,0]);check('Mixed is first and default, with matching substantial constructions and working decomposition');
 await c.click('#stopBattle');await c.click('#confirmStop');
 await c.shot('setup-1366');await setup();assert.deepEqual((await snap(0)).task,(await snap(1)).task);await layout('two independent boards at 1366×768');await c.shot('play-1366');
 // Two simultaneous touch contacts must draw in their own panes.
 const t=(await snap(0)).task,end=M.endPointFromVector(t.start,t.target),a=await xy(0,t.start),b=await xy(1,t.start),ae=await xy(0,end),be=await xy(1,end);
 await paneClick(0,'#vectorTool');await paneClick(1,'#vectorTool');
 await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...a,id:1},{...b,id:2}]});await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...ae,id:1},{...be,id:2}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.frames();
 assert.equal((await snap(0)).answer.strokes.length,1);assert.equal((await snap(1)).answer.strokes.length,1);assert(Core.TaskValidator.validate(t,(await snap(0)).answer).ok);assert(Core.TaskValidator.validate(t,(await snap(1)).answer).ok);check('simultaneous touch drawing remains isolated');
 await paneClick(1,'#commit');await c.wait('VectorBattle.inspect().resolved');assert.deepEqual((await state()).scores,[0,1]);assert((await snap(0)).done);assert((await snap(1)).done);
 await pane(0,'w=>w.VectorBattlePlayer.submit(w.AxiomaVectorTrainer.inspect().answer,false)');await pane(1,'w=>w.VectorBattlePlayer.submit(w.AxiomaVectorTrainer.inspect().answer,false)');await c.frames();assert.deepEqual((await state()).scores,[0,1]);check('first correct answer wins exactly one point and locks both boards');await c.shot('next-round-centre-1366');
 await c.click('#nextRound');let current=(await snap(0)).task;await draw(0,current.start,current.start);await paneClick(0,'#commit');assert(await pane(0,'w=>w.VectorBattlePlayer.cooling'));assert(!(await state()).resolved);await solve(1);await new Promise(r=>setTimeout(r,3200));assert((await snap(0)).done);assert(await pane(0,"w=>w.document.getElementById('commit').disabled"));check('incorrect answer triggers cooldown; round resolution cancels retry');
 await c.click('#nextRound');await paneClick(0,'#skip');assert(!(await state()).resolved);await paneClick(1,'#skip');await c.wait('VectorBattle.inspect().resolved');assert.deepEqual((await state()).scores,[0,2]);check('both players can pass without awarding a point');
 await c.click('#nextRound');await solve(0);assert.equal((await snap(1)).answer.strokes.length,0);await c.click('#nextRound');await solve(0);await c.click('#nextRound');assert.equal(await c.eval('document.getElementById("winner").textContent'),'Gelijkspel!');await c.shot('result-1366');check('five rounds reach a correct shared final score');
 const rankingKey='leraarbob-vectorbattle-ranking-v1';
 const ranking=await c.eval(`JSON.parse(localStorage.getItem('${rankingKey}'))`);assert.equal(ranking.matches.length,1,'aborted battles did not count');assert.deepEqual(ranking.matches[0].scores,[2,2]);
 await c.click('#openRanking');assert(await c.eval("document.getElementById('rankingDialog').open"));
 assert.deepEqual(await c.eval("[...document.querySelectorAll('#rankingRows tr')].map(r=>[...r.children].map(c=>c.textContent))"),[['1','Alex','1','0','1'],['1','Sam','1','0','1']]);await c.shot('ranking-1366');
 await c.size(390,844);await c.shot('ranking-390');assert(await c.eval("(()=>{const r=document.getElementById('closeRanking').getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&r.bottom<=innerHeight})()"));await c.click('#closeRanking');await c.size(1366,768);check('finished battle creates a shared ranking with ties and a mobile dialog');
 await c.click('#rematch');assert.deepEqual((await state()).scores,[0,0]);await c.click('#stopBattle');await c.click('#keepPlaying');assert((await state()).active);await c.click('#stopBattle');await c.click('#confirmStop');assert(!(await state()).active);check('rematch resets scores; stop can be cancelled or confirmed');
 // Every original input type fits both halves, including compact tablet widths.
 for(const [w,h] of [[1366,768],[1024,768],[780,540]]){
  await c.size(w,h);
  for(const [skill,world] of [['headtail','dockingzone'],['coords','navigatienet'],['coordcombo','navigatienet'],['points','navigatienet'],['equal','koerscentrum']]){
   await setup(skill,world);await layout(skill+' split layout '+w);if(skill==='headtail')await c.shot('headtail-'+w);
   if(skill==='coordcombo'){
    const task=(await snap(0)).task;
    for(const [i,value] of [task.target.dx,task.target.dy].entries()){
     await paneClick(0,i?'#slotY':'#slotX');for(const digit of String(Math.abs(value)))await paneClick(0,'[data-key="'+digit+'"]');if(value<0)await paneClick(0,'[data-key="sign"]');
    }
    await paneClick(0,'#commit');await c.wait('VectorBattle.inspect().resolved');assert.deepEqual((await state()).scores,[1,0]);
   }
   await c.click('#stopBattle');await c.click('#confirmStop');
  }
 }
 assert.equal(await c.eval(`JSON.parse(localStorage.getItem('${rankingKey}')).matches.length`),1,'rematches stopped early do not add results');
 await c.eval('window.VectorBattle=null');await c.send('Page.reload');await c.wait('!!window.VectorBattle&&!document.getElementById("startBattle").disabled');await c.click('#openRanking');assert.equal(await c.eval("document.querySelectorAll('#rankingRows tr').length"),2);await c.click('#closeRanking');
 await c.eval("document.getElementById('name0').value='Alex';document.getElementById('name1').value=' alex ';document.getElementById('startBattle').click()");assert(!(await state()).active);assert(await c.eval("document.getElementById('name1').validationMessage.length>0"));check('ranking survives reload, ignores unfinished battles and requires distinct names');
 assert.equal(await c.eval("localStorage.getItem('axioma-vectorentrainer-v020')"),marker);assert(!requests.some(u=>/supabase|axioma-auth|axioma-progress|axioma-game\.js/.test(u)));assert.deepEqual(c.errors,[]);check('battle leaves personal progress untouched and loads no account services');
 fs.writeFileSync(path.resolve(OUT,'../../battle-report.json'),JSON.stringify({passed:true,checks},null,2));
 }finally{await browser.send('Target.disposeBrowserContext',{browserContextId});c.ws.close();browser.ws.close();}
})().catch(e=>{console.error(e);process.exit(1)});
