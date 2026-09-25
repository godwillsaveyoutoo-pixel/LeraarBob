// Isolated Chromium + localhost only. Test hook is injected into the served document.
const assert=require('node:assert/strict'),fs=require('node:fs');


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
 async function layout(){assert.deepEqual(await c.eval(`(()=>{const bad=[],els=[...document.querySelectorAll('#stage button,.concept-context,.concept-graph,.concept-givens,.concept-note,.coordinate-builder,.wave-context,.wave-equation,.wave-entry,.construct-formula,.transfer-story,.transfer-table,.algebra-previous,.equation-cue')].filter(e=>e.getClientRects().length);for(const e of els){const r=e.getBoundingClientRect(),play=document.querySelector('#stage .play').getBoundingClientRect();if(!e.closest('.playFooter')&&!e.closest('#question')&&(r.top<play.top-1||r.bottom>play.bottom+1))bad.push('outside play '+e.className);if(r.left<-.5||r.right>innerWidth+.5||r.top<47||r.bottom>innerHeight+.5)bad.push(e.className+' clipped '+JSON.stringify(r.toJSON()));if(e.tagName==='BUTTON'&&(r.height<47.5||r.width<47.5))bad.push('small '+e.textContent)}const bs=els.filter(e=>e.tagName==='BUTTON');for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){const a=bs[i].getBoundingClientRect(),b=bs[j].getBoundingClientRect();if(a.left<b.right-.5&&b.left<a.right-.5&&a.top<b.bottom-.5&&b.top<a.bottom-.5)bad.push('overlap '+bs[i].textContent+'/'+bs[j].textContent)}return bad})()`),[],await c.run('current.skill+":"+current.work.index'))}
 const shot=async name=>{const r=await c.send('Page.captureScreenshot');fs.writeFileSync('/tmp/rechten-workbench-'+name+'.png',Buffer.from(r.data,'base64'))};

 const stage=()=>c.run('W.stages(current)[current.work.index]');
 const frames=()=>c.eval('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
 async function tap(selector,touch){const p=await c.eval(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing '+${JSON.stringify(selector)});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await gesture(p,p,touch);await frames()}
 async function gesture(from,to,touch){if(touch){await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...from,radiusX:3,radiusY:3}]});if(from.x!==to.x||from.y!==to.y)await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...to,radiusX:3,radiusY:3}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}else{await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...from});if(from.x!==to.x||from.y!==to.y)await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,...to});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...to})}}
 async function gridPoint(x,y){return c.eval(`(()=>{const svg=document.querySelector('.construct-grid');const p=new DOMPoint(110+18*${x},110-18*${y}).matrixTransform(svg.getScreenCTM());return {x:p.x,y:p.y}})()`)}
 async function place(x,y,touch){const p=await gridPoint(x,y);await gesture(p,p,touch);await frames()}
 async function token(kind,value,touch){const selector=await c.eval(`(()=>{const bs=[...document.querySelectorAll('[data-token]')];const i=bs.findIndex(b=>{const t=JSON.parse(b.dataset.token);return t.kind===${JSON.stringify(kind)}&&JSON.stringify(t.value)===${JSON.stringify(JSON.stringify(value))}});if(i<0)throw Error('Missing token');return '[data-token]:nth-child('+(i+1)+')'})()`);await tap(selector,touch)}
 async function center(selector){return c.eval(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`)}
 async function dragTo(source,target,touch){
  const from=await center(source),to=await center(target);
  if(!source.includes('data-action')){await gesture(from,to,touch);await frames();return}
  if(touch){await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...from,radiusX:3,radiusY:3}]});await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...to,radiusX:3,radiusY:3}]})}
  else{await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...from});await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,...to})}
  await frames();assert(await c.eval('!!document.querySelector(".equation-preview:not(:empty)")'));await layout();
  if(touch)await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...to});await frames();
 }
 async function completeFormula(touch){const m=await c.run('current.params.model');await token('number',m.a,touch);await token('variable','x',touch);await token('sign','+',touch);await token('number',m.b,touch)}
 async function number(value,touch){
 const key=async label=>{const selector=await c.eval(`(()=>{const bs=[...document.querySelectorAll('.transfer-keypad button')];return '.transfer-keypad button:nth-child('+(bs.findIndex(b=>b.textContent===${JSON.stringify(label)})+1)+')'})()`);await tap(selector,touch)};
 await key('wis');for(const digit of String(Math.abs(value.n)))await key(digit);if(value.n<0)await key('±');if(value.d!==1){await key('breuk');for(const digit of String(value.d))await key(digit)}await layout();await c.click('Controleer',touch);await frames();
 }
 async function toStage(target){await c.run(`(()=>{const w=current.work;for(let i=0;i<30&&!w.done&&W.stages(current)[w.index]!==${JSON.stringify(target)};i++){const s=W.stages(current)[w.index],v=['ys','xs'].includes(s)?['B','A']:s==='point'?'A':s==='subX'?'x':s==='subY'?'y':W.expected(current,w);const r=W.submit(current,w,v);if(!r.ok)throw Error(r.message)}render(current)})()`)}
 try{
 const cell=(column,axis)=>`[data-table-column="${column}"][data-table-axis="${axis}"]`;
 for(const [width,height,touch] of [[1366,768,false],[640,360,true]]){
  await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await c.send('Emulation.setTouchEmulationEnabled',{enabled:touch,maxTouchPoints:1});
  for(const variant of [0,3,9]){
   await setup('equation_from_table',2,variant);
   for(let i=0;i<15&&!await c.run('current.work.done');i++){
    const s=await stage();await layout();assert(await c.eval('!!document.querySelector(".transfer-value-table")'));assert.match(await c.eval('document.querySelector("#question").textContent'),/f\(x\) =/);
    if(s==='tableB'){const zero=await c.run('W.transferWorkbench.zeroColumn(current)');await dragTo(cell(zero,'y'),'[data-coefficient=b]',touch)}
    else if(s==='slopeFraction'){
     for(const [axis,row] of [['y','ys'],['x','xs']])for(const [i,col] of [2,0].entries())await dragTo(cell(col,axis),`[data-fraction-slot=${row+i}]`,touch);
    }else if(s==='tableA'||s==='pointProduct')await number(await c.run('W.expected(current,current.work)'),touch);
    else if(s==='installA'||s==='installB'){const k=s==='installA'?'a':'b';await dragTo(`[data-found=${k}]`,`[data-coefficient=${k}]`,touch)}
    else if(s==='pointX'||s==='pointY'){const k=s==='pointX'?'x':'y';await dragTo(cell(2,k),`[data-point-slot=${k}]`,touch)}
    else if(s==='solveB')await dragTo('[data-side=left][data-term=c]','[data-member=right]',touch);
    else throw Error('Unexpected '+s);
    assert.notEqual(await stage(),s,'advance '+s);await shot(s+'-'+width);
   }
   assert(await c.run('current.work.done'));await layout();
  }
  await setup('equation_from_graph',2,3);await layout();assert.equal(await c.eval('document.querySelector("#answers").getBoundingClientRect().width'),0);
  for(const k of ['a','b']){
   const sel=`[data-dial-host=${k}] button`,want=await c.run(`W.num(current.params.model.${k})`),pool=await c.run(`W.transferWorkbench.coefficientValues('${k}').map(W.num)`),steps=pool.indexOf(want)-pool.indexOf(0);
   await tap(sel,touch);assert.equal(await c.eval(`Number(document.querySelector('${sel}').getAttribute('aria-valuenow'))`),0);
   for(let i=0;i<Math.abs(steps);i++){const p=await center(sel);if(touch)await gesture(p,{x:p.x,y:p.y+(steps>0?-22:22)},true);else{await c.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:p.x,y:p.y,deltaX:0,deltaY:steps>0?-100:100});await frames()}}
   assert.equal(await c.eval(`Number(document.querySelector('${sel}').getAttribute('aria-valuenow'))`),want);
  }
  await shot('dials-'+width);await c.click('OK',touch);assert(await c.run('current.work.done'));await layout();
  await setup('graph_from_table',2,3);await layout();
  const plot=async(i)=>{const P=await c.run(`(()=>{const p=current.params,P=p.rows[${i}];return {x:W.num(W.div(P.x,p.scaleX)),y:W.num(W.div(P.y,p.scaleY))}})()`);const screen=await c.eval(`(()=>{const p=new DOMPoint(110+18*${P.x},110-18*${P.y}).matrixTransform(document.querySelector('.workbench-grid').getScreenCTM());return {x:p.x,y:p.y}})()`);await gesture(screen,screen,touch);await frames()};
  await plot(0);assert(await c.eval('[...document.querySelectorAll("#stage button")].find(b=>b.textContent==="OK").disabled'));await plot(2);assert(await c.eval('document.querySelector(".transfer-line").getAttribute("d").length>0'));assert(!await c.run('current.work.done'));assert.equal(await c.eval('document.querySelectorAll("#answers button").length'),0);await shot('drawing-'+width);await c.click('OK',touch);assert(await c.run('current.work.done'));await layout();
 }
 // Incorrect fractions retain the complete draft and only validate once all four slots are filled.
 await setup('equation_from_table',2,3);await tap(cell(2,'y'),true);await tap(cell(0,'y'),true);await tap(cell(0,'x'),true);assert.equal(await c.run('current.work.errors.length'),0);await tap(cell(2,'x'),true);assert.equal(await stage(),'slopeFraction');assert.equal(await c.run('current.work.errors.length'),1);
 await dragTo(cell(2,'x'),'[data-fraction-slot=xs0]',true);await dragTo(cell(0,'x'),'[data-fraction-slot=xs1]',true);assert.equal(await stage(),'tableA');
 await c.run('current=JSON.parse(JSON.stringify(current));render(current)');assert.equal(await stage(),'tableA');assert(await c.eval('!!document.querySelector(".transfer-value-table")'));await c.click('Terug',true);assert.equal(await stage(),'slopeFraction');
 // Cancel a table drag without committing or leaving a ghost behind.
 const from=await center(cell(2,'y')),to=await center('[data-fraction-slot=ys0]');const steps=await c.run('current.work.steps.length');
 await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...from,radiusX:3,radiusY:3}]});await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...to,radiusX:3,radiusY:3}]});assert(await c.eval('!!document.querySelector(".equation-drag-ghost")'));await c.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert(!await c.eval('document.querySelector(".equation-drag-ghost")'));assert.equal(await c.run('current.work.steps.length'),steps);
 // A learner's wrong graph answer stays on the same question and unlocks the header again on repair.
 await setup('equation_from_graph',2,3);await c.run('devMode=false;render(current)');await tap('[data-dial-host=a] button',true);await tap('[data-dial-host=b] button',true);const id=await c.run('current.id');await c.click('OK',true);assert(await c.run('current.work.feedbackPause&&!current.work.feedbackPause.nextQuestion'));assert(await c.eval('document.querySelector("#question").inert'));await c.click('Verder →',true);assert.equal(await c.run('current.id'),id);assert(!await c.eval('document.querySelector("#question").inert'));assert.deepEqual(await c.run('current.work.transferUI.dials'),{a:{n:0,d:1},b:{n:0,d:1}});
 await c.eval('document.querySelector("[data-dial-host=a] button").focus()');await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});assert.deepEqual(await c.run('current.work.transferUI.dials.a'),{n:-1,d:4});await c.click('OK',true);assert(await c.run('current.work.done'));await c.run('cancelAdvance();devMode=true');
 assert(!await c.run('devCatalogueHTML().includes("equation_from_context")'));assert(!await c.run('contentCoverageHTML().includes("equation_from_context")'));assert.equal(await c.run('mergeState(DEFAULT(),{waveDraft:{skill:"equation_from_context"}}).waveDraft'),null);
 assert(!await c.run('Object.hasOwn(SKILLS,"equation_from_context")'));assert(!await c.run('W.unlock(state).includes("equation_from_context")'));assert.deepEqual(c.errors,[]);
 console.log('PASS current transfer routes: actual mouse/touch table dragging, both b routes, automatic slope fraction, coefficient installation, b term manipulation, wheel/swipe graph coefficients and two-point drawing at desktop and 640×360.');
 }finally{await c.send('Fetch.disable');c.ws.close()}
})().catch(e=>{console.error(e);process.exit(1)});
