// Isolated Chromium + localhost only. Test hook is injected into the served document.
const assert=require('node:assert/strict'),fs=require('node:fs');


class CDP{
 async connect(){const tabs=await(await fetch('http://127.0.0.1:9235/json')).json();this.ws=new WebSocket(tabs[0].webSocketDebuggerUrl);this.pending=new Map();this.id=0;this.errors=[];await new Promise(r=>this.ws.onopen=r);this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails);else if(m.method==='Fetch.requestPaused')this.paused?.(m.params)};await this.send('Page.enable');await this.send('Runtime.enable')}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
 run(s){return this.eval('__R.run('+JSON.stringify(s)+')')}
 async wait(expr){for(let i=0;i<100;i++){if(await this.eval(expr))return;await new Promise(r=>setTimeout(r,50))}throw Error('Timeout: '+expr)}
 async click(label,touch=false){const p=await this.eval(`(()=>{const b=[...document.querySelectorAll(${JSON.stringify(/^(?:[0-9]|±|wis|breuk|⌫)$/.test(label)?'#answers button':'#stage button')})].find(b=>!b.disabled&&b.textContent===${JSON.stringify(label)});if(!b)throw Error('Missing button '+${JSON.stringify(label)});const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);if(touch){await this.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,radiusX:3,radiusY:3}]});await this.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}else{await this.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...p});await this.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...p})}}
}
(async()=>{const c=new CDP();await c.connect();
 const mock=`window.AxiomaAuth={ready:async()=>({session:null}),getAccount:async()=>null,client:()=>null,onChange:()=>()=>{}};`;
 const html=fs.readFileSync('games/rechten/trainer/index.html','utf8').replace('updateStart();renderTop();renderSessionCue();renderCloudStatus();initCloudFoundation();','window.__R={run:source=>eval(source)};updateStart();renderTop();renderSessionCue();renderCloudStatus();initCloudFoundation();');
 c.paused=p=>{const u=new URL(p.request.url);let body;if(u.pathname.endsWith('/axioma-auth.js'))body=mock;else if(u.hostname!=='127.0.0.1'||u.pathname.endsWith('/axioma-social.js'))body='';else if(u.pathname==='/games/rechten/trainer/')body=html;else return c.send('Fetch.continueRequest',{requestId:p.requestId});c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:u.pathname==='/games/rechten/trainer/'?'text/html':'application/javascript'}],body:Buffer.from(body).toString('base64')})};
 await c.send('Network.enable');await c.send('Network.setCacheDisabled',{cacheDisabled:true});await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});await c.send('Page.navigate',{url:'http://127.0.0.1:8765/games/rechten/trainer/?dev=1'});await c.wait('window.__R&&document.querySelector("#app").dataset.account==="guest"');

 const setup=async(skill,difficulty=0,variant=3)=>c.run(`cancelAdvance();clearTimer();clearInteractionTimers();devMode=true;state=DEFAULT();guestMode=true;current=makeTask(${JSON.stringify(skill)},W.generate(${JSON.stringify(skill)},{difficulty:${difficulty},variant:${variant},seed:4}),{difficulty:${difficulty}});hideScreenViews();E.world.classList.remove('screen-open');E.stage.hidden=false;E.start.hidden=true;E.sessionDone.hidden=true;currentScreen='play';locked=false;E.status.textContent='';render(current)`);
 async function layout(){assert.deepEqual(await c.eval(`(()=>{const bad=[],els=[...document.querySelectorAll('#stage button,.concept-context,.concept-graph,.concept-givens,.concept-note,.coordinate-builder,.wave-context,.wave-equation,.wave-entry,.construct-formula,.transfer-story,.transfer-table,.algebra-previous,.equation-cue')].filter(e=>e.getClientRects().length);for(const e of els){const r=e.getBoundingClientRect(),play=document.querySelector('#stage .play').getBoundingClientRect();if(!e.closest('.playFooter')&&(r.top<play.top-1||r.bottom>play.bottom+1))bad.push('outside play '+e.className);if(r.left<-.5||r.right>innerWidth+.5||r.top<47||r.bottom>innerHeight+.5)bad.push(e.className+' clipped '+JSON.stringify(r.toJSON()));if(e.tagName==='BUTTON'&&(r.height<47.5||r.width<47.5))bad.push('small '+e.textContent)}const bs=els.filter(e=>e.tagName==='BUTTON');for(let i=0;i<bs.length;i++)for(let j=i+1;j<bs.length;j++){const a=bs[i].getBoundingClientRect(),b=bs[j].getBoundingClientRect();if(a.left<b.right-.5&&b.left<a.right-.5&&a.top<b.bottom-.5&&b.top<a.bottom-.5)bad.push('overlap '+bs[i].textContent+'/'+bs[j].textContent)}return bad})()`),[],await c.run('current.skill+":"+current.work.index'))}
 const shot=async name=>{const r=await c.send('Page.captureScreenshot');fs.writeFileSync('/tmp/rechten-redesign-'+name+'.png',Buffer.from(r.data,'base64'))};

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
 async function completeFormula(touch){const m=await c.run('current.params.model');if(!await c.eval('!!document.querySelector(".point-worksheet")')){await token('number',m.a,touch);await token('variable','x',touch);}await token('sign','+',touch);await token('number',m.b,touch)}
 async function number(value,touch){await c.click('wis',touch);for(const digit of String(Math.abs(value.n)))await c.click(digit,touch);if(value.n<0)await c.click('±',touch);if(value.d!==1||await c.eval('!!document.querySelector(".slope-worksheet")')){if(await c.eval('!!document.querySelector(".slope-worksheet")'))await tap('[data-number-part="1"]',touch);else await c.click('breuk',touch);for(const digit of String(value.d))await c.click(digit,touch)}await c.click('Controleer',touch);await frames()}
 async function toStage(target){await c.run(`(()=>{const w=current.work;for(let i=0;i<30&&!w.done&&W.stages(current)[w.index]!==${JSON.stringify(target)};i++){const s=W.stages(current)[w.index],v=['ys','xs'].includes(s)?['B','A']:s==='point'?'A':s==='subX'?'x':s==='subY'?'y':W.expected(current,w);const r=W.submit(current,w,v);if(!r.ok)throw Error(r.message)}render(current)})()`)}
 try{
 for(const [width,height,touch] of [[1366,768,false],[640,360,true]]){
  await c.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  if(touch)await c.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  for(const skill of ['point','delta','slope','intercept','ab']){await c.run(`current=generate('${skill}',{difficulty:1});render(current)`);assert(await c.eval('!!document.querySelector("#visual .axis-arrow")'))}
  await setup('point_plot',2,4);const target=await c.run('({x:W.num(W.div(current.params.target.x,current.params.scaleX)),y:W.num(W.div(current.params.target.y,current.params.scaleY))})');await place(target.x,target.y,touch);assert(await c.run('current.work.done'));assert(!await c.eval('document.querySelector(".construct-nudges")'));await layout();
  await setup('graph_from_equation',0,0);const b=await c.run('W.num(current.params.model.b)');await place(1,1+b,touch);assert.equal(await c.run('current.work.construction.points.filter(Boolean).length'),1);await place(2,2+b,touch);await c.click('Trek rechte',touch);assert(await c.run('current.work.done'));assert(await c.eval('!!document.querySelector(".constructed-line")'));await layout();
  await setup('graph_from_equation',1,1);await place(0,0,touch);await place(1,0,touch);const from=await gridPoint(0,0),to=await gridPoint(-1,2);await gesture(from,to,touch);await frames();assert.deepEqual(await c.run('current.work.construction.points[0]'),{x:-1,y:2});await layout();
  await setup('equation_from_ab',2,1);assert.equal(await c.eval('document.querySelector("[data-slot].active").dataset.slot'),'a');await completeFormula(touch);assert(await c.run('current.work.done'));await layout();
  await setup('equation_from_ab',2,1);const m=await c.run('current.params.model');await token('number',{n:0,d:1},touch);await token('variable','x',touch);await token('sign','+',touch);assert.equal(await c.run('current.work.errors.length'),0);await token('number',m.b,touch);assert.equal(await c.run('current.work.errors.length'),1);assert(!await c.run('current.work.done'));await tap('[data-slot="a"]',touch);await token('number',m.a,touch);assert(await c.run('current.work.done'));
  await setup('equation_from_two_points',1,1);for(const axis of ['y','x'])for(const name of ['B','A'])await tap(`[data-coord-point="${name}"][data-coord-axis="${axis}"]`,touch);assert.equal(await stage(),'a');assert(await c.eval('!!document.querySelector(".coordinate-fraction") && document.querySelectorAll("[data-number-part]").length===2'));await layout();await shot('slope-inline-'+width);await number(await c.run('current.params.model.a'),touch);assert.equal(await stage(),'point');await layout();
  await setup('slope_from_two_points',1,1);await toStage('a');
  await c.click('wis',touch);await c.click('2',touch);await tap('[data-number-part="1"]',touch);await c.click('0',touch);await c.click('Controleer',touch);assert.equal(await stage(),'a');assert.match(await c.eval('document.querySelector("#status").textContent'),/noemer niet nul/);
  await tap('[data-number-part="1"]',touch);await c.click('⌫',touch);await c.click('±',touch);await c.click('2',touch);
  const saved=await c.run('JSON.stringify(current.work)');await c.run('current.work=JSON.parse('+JSON.stringify(saved)+');render(current)');assert.deepEqual(await c.run('current.work.entry'),['2','-2']);await layout();await c.click('Controleer',touch);assert(await c.run('current.work.done'));
  await setup('slope_from_two_points',1,1);await toStage('a');await c.click('Terug',touch);assert.equal(await stage(),'xs');assert.deepEqual(await c.run('current.work.values.ys'),['B','A']);await toStage('a');await number(await c.run('current.params.model.a'),touch);assert(await c.eval('!!document.querySelector(".concept-graph")'));await layout();
  for(const skill of ['intercept_from_point','equation_from_point_slope','equation_from_two_points'])for(const variant of [1,3,4]){
   await setup(skill,2,variant);
   if(skill==='equation_from_two_points'){
    await toStage('a');assert.match(await c.eval('document.querySelector("#question").textContent'),/y = ax.*Bepaal eerst a/);
    await number(await c.run('current.params.model.a'),touch);assert.equal(await stage(),'point');
    await dragTo('[data-given-point=B]','[data-point-equation]',touch);assert.equal(await c.run('current.work.values.point'),'B');
   }else{
    assert.equal(await stage(),'subA');await dragTo('[data-given=a]','[data-substitution=a]',touch);assert.equal(await stage(),'subPoint');
    assert.match(await c.eval('document.querySelector(".derivation-progress .active").textContent'),/2.*b bepalen/);
    await dragTo('[data-given-point=A]','[data-point-equation]',touch);
   }
   assert.equal(await stage(),'ax');assert.equal(await c.run('current.work.values.ax'),undefined);assert.equal(await c.run('current.work.values.b'),undefined);
   assert.equal(await c.eval('document.querySelectorAll("[data-point-piece]").length'),2);await layout();await shot('product-'+skill+'-'+variant+'-'+width);
   // An invalid drop leaves the product unevaluated.
   await gesture(await center('[data-point-piece=factor-a]'),{x:10,y:80},touch);await frames();assert.equal(await stage(),'ax');
   await dragTo('[data-point-piece=factor-x]','[data-point-piece=factor-a]',touch);assert.equal(await stage(),'b');await layout();
   assert(await c.eval('!!document.querySelector("[data-point-piece=constant]")'));
   await dragTo('[data-point-piece=constant]','[data-point-member=left]',touch);assert.equal(await stage(),'b');assert.equal(await c.run('current.work.values.b'),undefined);
   await layout();await shot('sum-'+skill+'-'+variant+'-'+width);
   const saved=await c.run('JSON.stringify(current.work)');await c.run('current.work=JSON.parse('+JSON.stringify(saved)+');render(current)');assert(await c.run('current.work.bArithmetic.moved'));
   await c.click('Terug',touch);assert(await c.eval('!!document.querySelector("[data-point-piece=constant]")'));
   await tap('[data-point-piece=constant]',touch);await tap('[data-point-member=left]',touch);
   await dragTo('[data-point-piece=value-y]','[data-point-piece=value-neg-product]',touch);
   assert.equal(await stage(),'formulaA');await layout();await completeFormula(touch);
   if(skill==='equation_from_two_points'){assert.equal(await stage(),'verifyA');await number(await c.run('W.expected(current,current.work)'),touch);await number(await c.run('W.expected(current,current.work)'),touch);}
   assert(await c.run('current.work.done'));await layout();
  }
  for(const skill of ['rewrite_linear_equation','input_from_output']){
   await setup(skill,2,3);if(await stage()==='subOutput'){assert.match(await c.eval('document.querySelector(".wave-givens").textContent'),/f\(x\).*f\(x\).*Bereken x/);await dragTo('[data-output]','[data-output-slot]',touch)}
   for(let i=0;i<10&&await stage()==='algebra';i++){
    await layout();const choice=await c.run(`(()=>{const e=W.algebraEquation(current,current.work),axis=current.skill==='input_from_output'||current.params.model.kind==='vertical'?'x':'y',other=axis==='x'?'y':'x';if(W.isolated(e,axis))return null;if(e.right[axis].n)return {side:'right',term:axis};if(e.left[other].n)return {side:'left',term:other};if(e.left.c.n)return {side:'left',term:'c'};return {side:'left',term:axis,divide:true}})()`);
    if(!choice){await c.click('Verder →',touch);break}const count=await c.run('current.work.steps.length');await dragTo(`[data-side="${choice.side}"][data-term="${choice.term}"][data-action="${choice.divide?'divide':'move'}"]`,`[data-member="${choice.side==='left'?'right':'left'}"]`,touch);assert.equal(await c.run('current.work.steps.length'),count+1,'one gesture commits one operation');await shot(skill+'-'+width);
   }
   assert.notEqual(await stage(),'algebra');await layout();
  }
  {
  // A real in-flight preview, cancellation, invalid drop, tap alternative, undo and keyboard.
  await setup('rewrite_linear_equation',1,1);
  const initialEquation=await c.run('JSON.stringify(W.algebraEquation(current,current.work))'),initialSteps=await c.run('current.work.steps.length');
  const source='[data-side="left"][data-term="x"][data-action="move"]',from=await center(source),to=await center('[data-member=right]');
  if(touch){await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...from,radiusX:3,radiusY:3}]});await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...to,radiusX:3,radiusY:3}]})}
  else{await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...from});await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,...to})}
  assert(await c.eval('!!document.querySelector(".equation-drag-ghost")'));assert.match(await c.eval('document.querySelector(".equation-preview").textContent'),/op beide leden/);await layout();await shot('drag-preview-'+width);
  if(touch)await c.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});else{await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:10,y:90});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:10,y:90})}
  await frames();assert.equal(await c.run('current.work.steps.length'),initialSteps);assert(!await c.eval('document.querySelector(".equation-drag-ghost")'));
  await tap(source,touch);await layout();await tap('[data-member=right]',touch);assert.equal(await c.run('current.work.steps.length'),initialSteps+1);await c.click('Terug',touch);assert.equal(await c.run('JSON.stringify(W.algebraEquation(current,current.work))'),initialEquation);
  await c.eval(`document.querySelector(${JSON.stringify(source)}).focus()`);await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await c.eval('document.querySelector("[data-member=right]").focus()');await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});assert.equal(await c.run('current.work.steps.length'),initialSteps+2);
  }
  for(const level of [1,2]){
   await setup('line_behavior',level,1);assert.match(await c.eval('document.querySelector("#question").textContent'),/met y als x toeneemt/);assert.equal(await c.eval('document.querySelector(".behavior-function").textContent'),'y = ax + b');assert.match(await c.eval('document.querySelector(".behavior-given-label").textContent'),level===1?/richtingscoëfficiënt/:/Twee punten/);await layout();
  }
  await setup('line_behavior',0,0);assert.equal(await c.eval('document.querySelectorAll("#answers .bubble.answer-orb").length'),3);await layout();
 }
 await setup('slope_from_two_points',1,1);await toStage('a');await c.run('devMode=false;render(current)');await number(await c.run('current.params.model.a'),false);const reviewId=await c.run('current.id');await new Promise(r=>setTimeout(r,900));assert.equal(await c.run('current.id'),reviewId);assert(await c.eval('!!document.querySelector(".concept-graph")'));assert(await c.eval('[...document.querySelectorAll(".wave-actions button")].some(b=>b.textContent==="Verder →")'));
 assert.deepEqual(c.errors,[]);console.log('PASS redesign: mouse and touch, arrows, direct grid placement and dragging, any two line points, automatic formula validation and correction, shorter slope route, complete b derivations, dragging givens, moving signed terms, detaching factors and function layout at desktop and phone landscape.');
 }finally{await c.send('Fetch.disable');c.ws.close()}
})().catch(e=>{console.error(e);process.exit(1)});
