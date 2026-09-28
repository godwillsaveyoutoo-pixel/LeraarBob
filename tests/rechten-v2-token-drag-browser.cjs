'use strict';
// Real pointer/native gestures: verify feedback during motion, not just final values.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {CDP,ARTIFACTS,BASE,ROUTE}=require('./helpers/rechten-area-cdp.cjs');
(async()=>{
 const c=new CDP();await c.connect();fs.mkdirSync(ARTIFACTS,{recursive:true});
 const mock='window.AxiomaAuth={ready:async()=>({session:null}),getAccount:async()=>null,getSnapshot:()=>({status:"guest",account:null}),client:()=>null,onChange:()=>()=>{}};';
 c.paused=p=>{const u=new URL(p.request.url);return u.pathname.endsWith('/axioma-auth.js')||u.origin!==new URL(BASE).origin?c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(u.pathname.endsWith('/axioma-auth.js')?mock:'').toString('base64')}):c.send('Fetch.continueRequest',{requestId:p.requestId})};
 await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});await c.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]}).catch(()=>{});
 let serial=Date.now();const snap=()=>c.eval('RechtenV2App.snapshot()'),mission=async()=>{const s=await snap();return s.missions[s.active]};
 const center=selector=>c.eval(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 const graphPoint=(x,y)=>c.eval(`(()=>{const p=new DOMPoint(${250+40*x},${250-40*y}).matrixTransform(document.querySelector('[data-line-picker]').getScreenCTM());return{x:p.x,y:p.y}})()`);
 async function go(area,skill,touch=true){await c.viewport(touch?780:1366,touch?360:768,touch);await c.navigate(BASE+ROUTE+'?drag='+ ++serial+'#'+area);await c.wait('!!document.querySelector("#app[data-ready=true]")');await c.send('Page.bringToFront');await c.eval('document.fonts.ready');await c.tap(`[data-node="${skill}"]`,touch)}
 const touchEvent=(type,p)=>c.send('Input.dispatchTouchEvent',{type,touchPoints:p?[{...p,radiusX:4,radiusY:4}]:[]});
 async function clean(){assert.equal(await c.eval('document.querySelectorAll(".token-drag-preview,.is-drop-ready,.is-drop-target,.is-drag-source,.is-held").length'),0,'gesture leaves no visual residue')}
 async function touchDrag(source,target,{cancel=false,escape=false,shot=null}={}){
  const before=await snap(),from=await center(source),to=typeof target==='string'?await center(target):target;
  await touchEvent('touchStart',from);await c.frames();
  assert(await c.eval(`document.querySelector(${JSON.stringify(source)}).classList.contains('is-held')`),'the grabbed source has immediate pressed feedback');
  const mid={x:(from.x+to.x)/2+12,y:from.y+30};
  await touchEvent('touchMove',mid);await c.frames();
  assert.equal(await c.eval('document.querySelectorAll(".token-drag-preview").length'),1);
  const first=await c.eval('document.querySelector(".token-drag-preview").getBoundingClientRect().toJSON()');
  await touchEvent('touchMove',to);await c.frames();
  const last=await c.eval('document.querySelector(".token-drag-preview").getBoundingClientRect().toJSON()');
  assert(Math.hypot(first.x-last.x,first.y-last.y)>5,'held tile visibly follows the finger');
  assert.deepEqual(await snap(),before,'motion is visual only; do not save an answer yet');
  if(typeof target==='string')assert(await c.eval(`document.querySelector(${JSON.stringify(target)}).classList.contains('is-drop-target')`),'destination lights up');
  else assert.equal(await c.eval('document.querySelectorAll(".is-drop-target").length'),0);
  if(shot)await c.shot(shot);
  if(escape)await c.press('Escape');
  await touchEvent(cancel?'touchCancel':'touchEnd');await c.frames();await clean();
  if(cancel||escape||typeof target!=='string')assert.deepEqual(await snap(),before,'cancellation/outside drop changes no answer');
 }
 async function nativeDrag(source,target){
  const from=await center(source),to=await center(target),before=await snap();let data;
  const listener=e=>{const message=JSON.parse(e.data);if(message.method==='Input.dragIntercepted')data=message.params.data};c.ws.addEventListener('message',listener);
  await c.send('Input.setInterceptDrags',{enabled:true});await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...from});await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...from});
  for(let i=1;i<=6;i++)await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:from.x+(to.x-from.x)*i/6,y:from.y+(to.y-from.y)*i/6});
  for(let i=0;i<30&&!data;i++)await new Promise(r=>setTimeout(r,30));assert(data,'native drag started');
  for(const type of ['dragEnter','dragOver'])await c.send('Input.dispatchDragEvent',{type,...to,data});await c.frames();
  assert.equal(await c.eval('document.querySelectorAll(".token-drag-preview").length'),1);
  assert(await c.eval(`document.querySelector(${JSON.stringify(target)}).classList.contains('is-drop-target')`));
  assert.deepEqual(await snap(),before,'native hover does not write an answer');await c.shot('native-drag-feedback');
  await c.send('Input.dispatchDragEvent',{type:'drop',...to,data});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...to});await c.send('Input.setInterceptDrags',{enabled:false});c.ws.removeEventListener('message',listener);await c.frames();await clean();
 }
 try{
  await c.navigate(BASE+ROUTE+'?dragReset='+serial+'#wereld');await c.wait('!!document.querySelector("#app[data-ready=true]")');await c.eval('localStorage.clear()');
  await go('formulewerf/omzetten','equation_from_two_points');
  const source='[data-derive-token="B.y"]',slot='[data-derive-slot="y1"]';
  await touchDrag(source,slot,{shot:'touch-coordinate-drag'});assert.equal((await mission()).values.y1,'B.y');assert.equal((await mission()).values.y0,undefined,'drop fills exactly one slot');
  // Immediate deliberate next tap is accepted; its synthetic click is not swallowed.
  await c.tap('[data-derive-token="A.y"]',true);assert.equal((await mission()).values.y0,'A.y');
  await touchDrag(source,{x:20,y:20});await touchDrag(source,'[data-derive-slot="x1"]',{cancel:true});await touchDrag(source,'[data-derive-slot="x1"]',{escape:true});
  await c.viewport(1366,768,false);await nativeDrag('[data-derive-token="B.x"]','[data-derive-slot="x1"]');assert.equal((await mission()).values.x1,'B.x');assert.equal((await mission()).values.x0,undefined);
  await c.tap('[data-derive-token="A.x"]');assert.equal((await mission()).values.x0,'A.x');await c.tap('#undo');assert.equal((await mission()).values.x0,undefined);
  c.keyboardOnly=true;await c.tap('[data-derive-token="A.x"]');c.keyboardOnly=false;assert.equal((await mission()).values.x0,'A.x');
  await go('formulewerf/bouwen','equation_from_ab');await touchDrag('[data-formula-token="2"]','[data-formula-slot="factor"]');assert.equal((await mission()).values.factor,'2');assert.equal((await mission()).values.variable,undefined);
  await go('hellingrug','slope_from_two_points');await c.tap('#hill-begin',true);await touchDrag('[data-coordinate-token="B.y"]','[data-coordinate-slot="y1"]');assert.equal((await mission()).values.y1,'B.y');assert.equal((await mission()).values.y0,undefined);await c.tap('[data-coordinate-token="A.y"]',true);assert.equal((await mission()).values.y0,'A.y');
  // A graph marker uses the same lift/follow/drop behavior; Escape must not place it.
  await go('formulewerf/bouwen','graph_from_equation');const p=await graphPoint(0,0);await touchEvent('touchStart',p);await touchEvent('touchEnd');await c.frames();
  await touchDrag('[data-line-marker="A"]','[data-line-picker]',{escape:true});
  const before=await snap(),from=await center('[data-line-marker="A"]'),to=await graphPoint(2,3);
  await touchEvent('touchStart',from);await touchEvent('touchMove',to);await c.frames();assert.equal(await c.eval('document.querySelector(".drag-point-preview").textContent'),'A');assert.deepEqual(await snap(),before);await c.shot('graph-point-drag');await touchEvent('touchEnd');await c.frames();assert.deepEqual((await mission()).values.plotA,{x:2,y:3});await clean();
  // The table worksheet in the user's screenshot uses the identical controller.
  await go('formulewerf/omzetten','equation_from_table');await c.tap('[data-table-column="0"]',true);await c.tap('[data-table-column="1"]',true);
  for(const [s,t] of Object.entries({y1:'B.y',y0:'A.y',x1:'B.x',x0:'A.x'})){await c.tap(`[data-derive-slot="${s}"]`,true);await c.tap(`[data-derive-token="${t}"]`,true)}
  await c.tap('#commit',true);await c.tap('#continue',true);await c.tap('[data-derive-answer="a"]',true);await c.tap('[data-derive-answer-value="1"]',true);await c.tap('#commit',true);await c.tap('#continue',true);
  assert.equal((await mission()).phase,'derive-substitute');await touchDrag('[data-derive-token="A.x"]','[data-derive-slot="subX"]',{shot:'table-substitution-drag'});assert.equal((await mission()).values.subX,'A.x');assert.equal((await mission()).values.subY,undefined);
  // Reduced motion keeps direct pointer feedback without an animated flight.
  await c.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await touchDrag('[data-derive-token="a"]','[data-derive-slot="subA"]');assert.equal((await mission()).values.subA,'a');await c.send('Emulation.setEmulatedMedia',{features:[]});
  assert.deepEqual(c.errors,[]);console.log('PASS drag feedback: live preview and target, native/touch, four control families, table substitution, cancel/outside/Escape, no double insert, immediate tap, keyboard, undo and reduced motion');
 }finally{await c.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]}).catch(()=>{});await c.send('Fetch.disable');c.ws.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
