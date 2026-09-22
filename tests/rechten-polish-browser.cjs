// Isolated Chromium + localhost only. Test hook is injected into the served document.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {nextAnswer}=require('./rechten-transfer-helpers.cjs');
const {nextAnswer:nextAlgebra}=require('./rechten-algebra-helpers.cjs');
class CDP{
 async connect(){const tabs=await(await fetch('http://127.0.0.1:9235/json')).json();this.ws=new WebSocket(tabs[0].webSocketDebuggerUrl);this.pending=new Map();this.id=0;this.errors=[];await new Promise(r=>this.ws.onopen=r);this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails);else if(m.method==='Fetch.requestPaused')this.paused?.(m.params)};await this.send('Page.enable');await this.send('Runtime.enable')}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
 run(s){return this.eval('__R.run('+JSON.stringify(s)+')')}
 async wait(expr){for(let i=0;i<100;i++){if(await this.eval(expr))return;await new Promise(r=>setTimeout(r,50))}throw Error('Timeout: '+expr)}
 async click(label,touch=false){const p=await this.eval(`(()=>{const b=[...document.querySelectorAll('#stage button')].find(b=>!b.disabled&&b.textContent===${JSON.stringify(label)});if(!b)throw Error('Missing button '+${JSON.stringify(label)});const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);if(touch){await this.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,radiusX:3,radiusY:3}]});await this.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}else{await this.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...p});await this.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...p})}}
}
(async()=>{const c=new CDP();await c.connect();
 const mock=`window.AxiomaAuth={ready:async()=>({session:null}),getAccount:async()=>null,client:()=>null,onChange:()=>()=>{}};`;
 const html=fs.readFileSync('games/rechten/trainer/index.html','utf8').replace('updateStart();renderTop();renderSessionCue();renderCloudStatus();initCloudFoundation();','window.__R={run:source=>eval(source)};updateStart();renderTop();renderSessionCue();renderCloudStatus();initCloudFoundation();');
 c.paused=p=>{const u=new URL(p.request.url);let body;if(u.pathname.endsWith('/axioma-auth.js'))body=mock;else if(u.hostname!=='127.0.0.1'||u.pathname.endsWith('/axioma-social.js'))body='';else if(u.pathname==='/games/rechten/trainer/')body=html;else return c.send('Fetch.continueRequest',{requestId:p.requestId});c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:u.pathname==='/games/rechten/trainer/'?'text/html':'application/javascript'}],body:Buffer.from(body).toString('base64')})};
 await c.send('Network.enable');await c.send('Network.setCacheDisabled',{cacheDisabled:true});await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});await c.send('Page.navigate',{url:'http://127.0.0.1:8765/games/rechten/trainer/?dev=1'});await c.wait('window.__R&&document.querySelector("#app").dataset.account==="guest"');

 const setup=async(skill,difficulty=0,variant=3)=>c.run(`cancelAdvance();clearTimer();clearInteractionTimers();devMode=true;state=DEFAULT();guestMode=true;current=makeTask(${JSON.stringify(skill)},W.generate(${JSON.stringify(skill)},{difficulty:${difficulty},variant:${variant},seed:4}),{difficulty:${difficulty}});hideScreenViews();E.world.classList.remove('screen-open');E.stage.hidden=false;E.start.hidden=true;E.sessionDone.hidden=true;currentScreen='play';locked=false;E.status.textContent='';render(current)`);
 async function layout(){assert.deepEqual(await c.eval(`(()=>{const bad=[],els=[...document.querySelectorAll('#stage button,.concept-context,.concept-graph,.concept-givens,.concept-note,.coordinate-builder,.wave-context,.wave-equation,.wave-entry,.construct-formula,.transfer-story,.transfer-table,.algebra-previous')].filter(e=>e.getClientRects().length);for(const e of els){const r=e.getBoundingClientRect();if(r.left<-.5||r.right>innerWidth+.5||r.top<47||r.bottom>innerHeight+.5)bad.push(e.className+' clipped '+JSON.stringify(r.toJSON()));if(e.tagName==='BUTTON'&&(r.height<47.5||r.width<47.5))bad.push('small '+e.textContent)}const bs=els.filter(e=>e.tagName==='BUTTON');for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){const a=bs[i].getBoundingClientRect(),b=bs[j].getBoundingClientRect();if(a.left<b.right-.5&&b.left<a.right-.5&&a.top<b.bottom-.5&&b.top<a.bottom-.5)bad.push('overlap '+bs[i].textContent+'/'+bs[j].textContent)}return bad})()`),[],await c.run('current.skill+":"+current.work.index'))}
 const shot=async name=>{const r=await c.send('Page.captureScreenshot');fs.writeFileSync('/tmp/rechten-polish-'+name+'.png',Buffer.from(r.data,'base64'))};
 try{
 c.errors=[];await c.eval('window.nextTransferAnswer='+nextAnswer.toString());await c.eval('window.nextAlgebraAnswer='+nextAlgebra.toString());
 for(const [width,height] of [[1920,1080],[1366,768],[1024,600],[640,360]]){
 await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 for(const skill of await c.run('Object.keys(W.catalog)'))for(const level of [0,1,2]){
  await setup(skill,level);await layout();
  if(skill==='point_plot')assert(!await c.eval('document.querySelector(".construct-nudges")'));
  if(skill==='line_behavior'&&level===0){assert(await c.eval(`document.querySelector('.concept-graph').getBoundingClientRect().height>${height>550?260:100}`));if(width===1366)await shot('behavior-graph')}
  if(skill==='line_behavior'&&level===2){assert(!await c.eval('document.querySelector(".concept-graph")'));if(width===1366)await shot('behavior-points')}
  if(skill==='slope_from_two_points'&&level===0){assert.equal(await c.eval('document.querySelector(".coordinate-builder").textContent.includes("?")'),false);assert.equal(await c.eval('document.querySelectorAll(".coordinate-token small,.coordinate-slot small").length'),0);if(width===1366)await shot('slope')}
  if(await c.run('W.constructionSkills.includes(current.skill)'))continue;
  for(let i=0;i<45&&!await c.run('current.work.done');i++){
   await c.run(`(()=>{const w=current.work,s=W.stages(current)[w.index];let value;if(W.transferSkills.includes(current.skill))value=nextTransferAnswer(W,current,w);else if(W.algebraSkills.includes(current.skill))value=nextAlgebraAnswer(W,current,w);else value=['ys','xs'].includes(s)?['B','A']:s==='point'?'A':s==='subX'?'x':s==='subY'?'y':W.expected(current,w);const r=W.submit(current,w,value);if(!r.ok)throw Error(current.skill+': '+r.message);render(current)})()`);await layout();
   if(await c.run('W.algebraSkills.includes(current.skill)&&W.stages(current)[current.work.index]==="algebra"')){await c.run("current.work.operation={kind:'add',term:'x'};render(current)");await layout();await c.run('current.work.operation=null;render(current)')}
  }
  assert(await c.run('current.work.done'));
 }
 // Each special case at each level: clues, formula, function and uniqueness.
 for(const level of [0,1,2])for(const variant of [0,1,2]){
  await setup('special_lines',level,variant);assert.equal(await c.eval('!!document.querySelector(".concept-graph")'),level===0);
  while(!await c.run('current.work.done')){const s=await c.run('W.stages(current)[current.work.index]');
   if(s==='function'){assert(await c.eval('!!document.querySelector(".concept-graph")'));assert.equal(await c.eval('document.querySelector(".concept-formula").textContent'),variant===1?'x = 2':'y = 2');if(width===1366)await shot(variant===1?'vertical':'horizontal')}
   await c.run('W.submit(current,current.work,W.expected(current,current.work));render(current)');await layout();
  }
  assert.match(await c.eval('document.querySelector(".concept-note").textContent'),variant===1?/meerdere y.*Geen functie/:variant===2?/geen unieke rechte/:/functie; a = 0/);
  if(variant===2)assert(await c.eval('!!document.querySelector(".possible-lines")'));
 }
 }
 assert.deepEqual(c.errors,[]);console.log('PASS visual/learning audit: all 16 recent skills × 3 levels and their calculation stages at 1920/1366/1024/640; readable concept graphs, point-only transfer, no redundant point buttons or coordinate labels, horizontal/vertical/function/identical cases, no clipping or overlapping controls.');
 }finally{await c.send('Fetch.disable');c.ws.close()}
})().catch(e=>{console.error(e);process.exit(1)});
