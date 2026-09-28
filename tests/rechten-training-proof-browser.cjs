// Isolated Chromium + localhost only. Test hook is injected into the served document.
const assert=require('node:assert/strict'),fs=require('node:fs');
class CDP{
 async connect(){const tabs=await(await fetch('http://127.0.0.1:9235/json')).json();this.ws=new WebSocket(tabs[0].webSocketDebuggerUrl);this.pending=new Map();this.id=0;this.errors=[];this.downloads=[];await new Promise(r=>this.ws.onopen=r);this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails);else if(m.method==='Fetch.requestPaused')this.paused?.(m.params);else if(m.method==='Browser.downloadWillBegin')this.downloads.push({...m.params,state:'started'});else if(m.method==='Browser.downloadProgress'){const d=this.downloads.find(d=>d.guid===m.params.guid);if(d)Object.assign(d,m.params)}};await this.send('Page.enable');await this.send('Runtime.enable')}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
 run(s){return this.eval('__R.run('+JSON.stringify(s)+')')}
 async wait(expr){for(let i=0;i<100;i++){if(await this.eval(expr))return;await new Promise(r=>setTimeout(r,50))}throw Error('Timeout: '+expr)}
 async click(label,touch=false){const p=await this.eval(`(()=>{const b=[...document.querySelectorAll('#stage button')].find(b=>!b.disabled&&b.textContent===${JSON.stringify(label)});if(!b)throw Error('Missing button '+${JSON.stringify(label)});b.scrollIntoView({block:'nearest'});const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);if(touch){await this.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,radiusX:3,radiusY:3}]});await this.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}else{await this.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...p});await this.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...p})}}
}
(async()=>{
 const c=new CDP();await c.connect();
 const html=fs.readFileSync('games/rechten/trainer/index.html','utf8').replace('updateStart();renderTop();renderSessionCue();renderCloudStatus();initCloudFoundation();','window.__R={run:source=>eval(source)};updateStart();renderTop();renderSessionCue();renderCloudStatus();initCloudFoundation();');
 const mock='window.AxiomaAuth={ready:async()=>({session:null}),getAccount:async()=>null,client:()=>null,onChange:()=>()=>{}};';
 c.paused=p=>{const u=new URL(p.request.url);let body;if(u.pathname.endsWith('/axioma-auth.js'))body=mock;else if(u.hostname!=='127.0.0.1'||u.pathname.endsWith('/axioma-social.js'))body='';else if(u.pathname==='/games/rechten/trainer/')body=html;else return c.send('Fetch.continueRequest',{requestId:p.requestId});return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:u.pathname==='/games/rechten/trainer/'?'text/html':'application/javascript'}],body:Buffer.from(body).toString('base64')})};
 await c.send('Network.enable');await c.send('Network.setCacheDisabled',{cacheDisabled:true});await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 const frames=()=>c.eval('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
 async function click(sel){const p=await c.eval(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e||e.disabled||!e.getClientRects().length)throw Error('Unavailable '+${JSON.stringify(sel)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...p});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...p});await frames()}
 const downloadDir=fs.mkdtempSync('/tmp/rechten-proof-downloads-');
 const {targetInfo}=await c.send('Target.getTargetInfo'),browserContextId=targetInfo.browserContextId;
 const offline=enabled=>c.send('Network.emulateNetworkConditions',{offline:enabled,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 const reload=async()=>{await c.eval('delete window.__R');await c.send('Page.reload');await c.wait('window.__R&&document.querySelector("#app").dataset.account==="guest"')};
 // Chromium may use a private /tmp (e.g. Snap). Verify its actual completed download,
 // then copy the exact same PDF blob into the workspace for independent PDF validation.
 async function downloaded(n){
  for(let i=0;i<100;i++){
   const done=c.downloads.filter(d=>d.state==='completed');
   if(done.length===n){
    const base64=await c.eval('(async()=>{const bytes=new Uint8Array(await __proofBlob.arrayBuffer());let data="";for(let i=0;i<bytes.length;i+=16384)data+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(data)})()');
    const bytes=Buffer.from(base64,'base64');assert.equal(bytes.length,done.at(-1).totalBytes);
    fs.writeFileSync(downloadDir+'/'+done.at(-1).suggestedFilename,bytes);return done.map(d=>d.suggestedFilename);
   }
   await new Promise(r=>setTimeout(r,100));
  }
  throw Error('Missing PDF download: '+JSON.stringify(c.downloads));
 }
 async function name(value){await c.eval(`(()=>{const e=document.querySelector('[name="name"]');e.value='';e.focus()})()`);await c.send('Input.insertText',{text:value})}
 async function modalLayout(){assert(await c.eval('(()=>{const r=document.querySelector("#trainingProofDialog").getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight})()'))}
 async function captureReport(){await c.eval('(()=>{const open=RechtenTrainingProof.open;RechtenTrainingProof.open=(report,options)=>{window.__proofReport=structuredClone(report);return open(report,options)};const create=URL.createObjectURL;URL.createObjectURL=blob=>{if(blob.type==="application/pdf")window.__proofBlob=blob;return create(blob)}})()')}
 try{
  await c.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloadDir,browserContextId,eventsEnabled:true});
  await c.send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});
  await c.send('Page.navigate',{url:'http://127.0.0.1:8765/games/rechten/trainer/'});await c.wait('window.__R&&document.querySelector("#app").dataset.account==="guest"');await captureReport();
  await c.run("stopAccountExercise();state=DEFAULT();guestMode=true;currentScreen='play';state.skills.point.intro=true;startJourney('tower','discover')");
  for(const ok of [false,true]){await c.run(`locked=true;finishOutcome(${ok},'testantwoord');cancelAdvance();next()`)}
  await click('#pauseExercise');await click('[data-pause-stop]');
  assert(await c.eval('document.querySelector("#trainingProofDialog").open'));assert.equal(await c.run('state.session.answered'),0);
  assert.equal(await c.eval('__proofReport.round.answered'),2);assert.equal(await c.eval('__proofReport.round.correct'),1);assert.equal(await c.eval('__proofReport.round.status'),'stopped');assert.equal(await c.eval('__proofReport.totals.answered'),2);
  assert.equal(await c.eval('document.querySelector("[name=name]").value'),'');await modalLayout();
  await click('#trainingProofDialog [type=submit]');assert(!await c.eval('document.querySelector("[name=name]").validity.valid'));assert.equal(fs.readdirSync(downloadDir).length,0);
  await name('   ');await click('#trainingProofDialog [type=submit]');assert(!await c.eval('document.querySelector("[name=name]").validity.valid'));
  await name("Élise D'Haene");await offline(true);await click('#trainingProofDialog [type=submit]');
  const first=await downloaded(1);assert.match(first[0],/Elise-D-Haene/);assert(fs.readFileSync(downloadDir+'/'+first[0]).subarray(0,8).equals(Buffer.from('%PDF-1.4')));assert.match(await c.eval('document.querySelector(".proof-message").textContent'),/Smartschool/);
  let shot=await c.send('Page.captureScreenshot');fs.writeFileSync('/tmp/rechten-proof-dialog.png',Buffer.from(shot.data,'base64'));
  const stopped=await c.run('JSON.stringify(state.lastTrainingRound)');await offline(false);await reload();await captureReport();
  assert.equal(await c.run('JSON.stringify(state.lastTrainingRound)'),stopped);await c.run("openScreen('progress')");await click('[data-training-proof]');assert.equal(await c.eval('__proofReport.round.answered'),2);await click('[data-proof-close]');
  // Full rounds have a download button too, and retain their actual completion time.
  await c.run("stopAccountExercise();state=DEFAULT();guestMode=true;currentScreen='play';state.skills.point.intro=true;startJourney('tower','camp')");
  for(let i=0;i<12;i++)await c.run("locked=true;finishOutcome(true,'juist');cancelAdvance();next()");
  assert.equal(await c.run('state.session.completed'),true);await click('#downloadTrainingProof');assert.equal(await c.eval('__proofReport.round.status'),'completed');assert.equal(await c.eval('__proofReport.round.answered'),12);assert.equal(await c.eval('__proofReport.round.at'),await c.run('state.lastTrainingRound.at'));await click('[data-proof-close]');
  // Synthetic account, no live authentication or learner data. The entered full name wins over the alias.
  await c.run("stopAccountExercise();account={id:'proof-synthetic-student',role:'student',alias:'mila_j',class_code:'3TBO'};accountReady=true;guestMode=false;state=DEFAULT();for(const key of Object.keys(SKILLS))Object.assign(state.skills[key],{seen:30,correct:24,intro:true,strength:.5});state.total=Object.keys(SKILLS).length*30;state.correct=Object.keys(SKILLS).length*24;state.routeStep=4;state.xp=900;openScreen('progress')");
  await click('[data-training-proof]');assert.equal(await c.eval('document.querySelector("[name=name]").value'),'mila_j');assert.equal(await c.eval('document.querySelector("[name=className]").value'),'3TBO');
  await name('Mila Janssens');await offline(true);await click('#trainingProofDialog [type=submit]');const files=await downloaded(2);assert(files.some(f=>f.includes('Mila-Janssens')));
  const image=await c.eval('RechtenTrainingProof.renderPages(__proofReport,{name:"Mila Janssens",className:"3TBO",alias:"mila_j"})[0].toDataURL("image/png").split(",")[1]');fs.writeFileSync('/tmp/rechten-proof-preview.png',Buffer.from(image,'base64'));
  // Account changes discard the previous name and close an open receipt.
  await offline(false);await c.run("stopAccountExercise();account=null;accountReady=false;guestMode=true;state=DEFAULT();openScreen('progress')");assert(!await c.eval('!!document.querySelector("#trainingProofDialog")'));
  await c.send('Emulation.setDeviceMetricsOverride',{width:640,height:360,deviceScaleFactor:1,mobile:false});await click('[data-training-proof]');await modalLayout();assert.equal(await c.eval('document.querySelector("[name=name]").value'),'');assert.equal(await c.eval('__proofReport.totals.answered'),0);
  await name('李 明 · Zoë <naam>');await click('#trainingProofDialog [type=submit]');await downloaded(3);assert.equal(await c.eval('document.querySelectorAll("#trainingProofDialog img").length'),0);
  shot=await c.send('Page.captureScreenshot');fs.writeFileSync('/tmp/rechten-proof-dialog-640.png',Buffer.from(shot.data,'base64'));
  assert.deepEqual(c.errors,[]);console.log('PASS training proof: stop midway, completed round, saved receipt after reload, required name, editable account alias, account isolation, guest and account downloads while offline, Unicode names, small screen. PDFs: '+downloadDir);
 }finally{await offline(false);await c.send('Browser.setDownloadBehavior',{behavior:'default',browserContextId});await c.send('Fetch.disable');c.ws.close()}
})().catch(e=>{console.error(e);process.exit(1)});
