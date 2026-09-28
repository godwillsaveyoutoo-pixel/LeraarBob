// Run against a local server and an isolated Chromium profile; see tests/README.md.
const assert=require('node:assert/strict');
class CDP{
 async connect(){const tabs=await(await fetch('http://127.0.0.1:9235/json')).json();this.ws=new WebSocket(tabs[0].webSocketDebuggerUrl);this.pending=new Map();this.id=0;this.errors=[];await new Promise(r=>this.ws.onopen=r);this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails)};await this.send('Page.enable');await this.send('Runtime.enable')}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const c=new CDP();await c.connect();const ev=s=>c.eval(s);
 const wait=async(expression)=>{for(let i=0;i<100;i++){if(await ev(expression))return;await delay(80)}throw Error('Timeout: '+expression)};
 const point=async selector=>ev(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}})()`);
 const mouse=async(type,p)=>c.send('Input.dispatchMouseEvent',{type,...p,button:'left',buttons:type==='mouseReleased'?0:1,clickCount:type==='mouseMoved'?0:1});
 const tap=async selector=>{const p=await point(selector);await mouse('mousePressed',p);await mouse('mouseReleased',p)};
 async function gesture(source,target,{touch=false,cancel=false,escape=false,leave=false,restart=false}={}){
  const from=await point(source),to=typeof target==='string'?await point(target):target;
  const send=async(type,p)=>touch?c.send('Input.dispatchTouchEvent',{type,touchPoints:['touchEnd','touchCancel'].includes(type)?[]:[{...p,id:1,radiusX:2,radiusY:2,force:1}]}):mouse(type,p);
  await send(touch?'touchStart':'mousePressed',from);
  for(let i=1;i<=8;i++){await send(touch?'touchMove':'mouseMoved',{x:from.x+(to.x-from.x)*i/8,y:from.y+(to.y-from.y)*i/8});await delay(15)}
  assert(await ev('!!document.querySelector(".ghost")'),'Dragging produces a visible tile');
  if(escape){await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27})}
  if(leave)await ev('PythagorasGoLevel(6)');
  if(restart)await ev('document.querySelector("#lfRestart").click()');
  await send(touch?(cancel?'touchCancel':'touchEnd'):'mouseReleased',to);
  await delay(350);
  assert.equal(await ev('document.querySelectorAll(".ghost").length'),0,'No leftover drag tile');
 }
 const slots=()=>ev('[...document.querySelectorAll("[data-formula-slot]")].map(b=>b.textContent)');
 const formula=async()=>{await ev('PythagorasGoLevel(5)');await delay(120);await ev('document.querySelector("#lfHypHit").dispatchEvent(new MouseEvent("click",{bubbles:true}))')};
 const sf=i=>`[data-formula-slot="${i}"]`, tf=v=>`[data-formula-tile="${v}"]`;
 await c.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await c.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await c.send('Page.navigate',{url:'http://127.0.0.1:8765/games/pythagoras.html'});
 await wait('!!window.PythagorasGoLevel');await wait('Pythagoras.snapshot().phase===1&&!Pythagoras.snapshot().locked');
 for(const n of [3,4,5]){await tap('#square'+n);await wait(`Pythagoras.snapshot().phase===${n-1}&&!Pythagoras.snapshot().locked`)}
 await delay(550);
 for(const n of [3,4,5])await gesture('#square'+n,`[data-slot="${n}"]`);
 await wait('Pythagoras.snapshot().phase===5&&!Pythagoras.snapshot().locked');
 await gesture('#numberTile','[data-slot="numeric"]');
 assert((await ev('Pythagoras.snapshot().placed')).includes('numeric'),'5² numeric tile placed by mouse');
 console.log('PASS: first three squares and numeric 5² tile drag with mouse');
 await formula();await gesture(tf('c'),sf(0));assert.deepEqual(await slots(),['?','?','?']);
 await gesture(tf('a'),{x:45,y:450});assert.deepEqual(await slots(),['?','?','?']);
 await gesture(tf('a'),sf(0),{escape:true});assert.deepEqual(await slots(),['?','?','?']);
 await gesture(tf('b'),sf(0));await gesture(tf('b'),sf(1));assert.deepEqual(await slots(),['b2','?','?']);
 await gesture(tf('a'),sf(1));await gesture(tf('c'),sf(2));assert.deepEqual(await slots(),['b2','a2','c2']);
 assert.equal(await ev('document.querySelector("#lfAction").disabled'),false);
 console.log('PASS: formula drag, swapped legs, rejected duplicate/wrong/outside drops, Escape cleanup');
 await formula();for(const [v,i] of [['a',0],['b',1],['c',2]]){await tap(tf(v));await tap(sf(i))}assert.deepEqual(await slots(),['a2','b2','c2']);
 await formula();for(const [v,i] of [['a',0],['b',1],['c',2]]){for(const selector of [tf(v),sf(i)]){await ev(`document.querySelector(${JSON.stringify(selector)}).focus()`);await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});}}
 assert.deepEqual(await slots(),['a2','b2','c2']);console.log('PASS: formula mouse tap and keyboard placement remain available');
 await formula();await gesture(tf('a'),sf(0),{restart:true});assert.deepEqual(await slots(),['?','?','?']);
 await formula();await gesture(tf('a'),sf(0),{leave:true});assert.deepEqual(await slots(),['?','?','?']);
 console.log('PASS: restarting and navigating away cancel active drag');
 await c.send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:true});await c.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 await formula();await gesture(tf('a'),sf(0),{touch:true,cancel:true});assert.deepEqual(await slots(),['?','?','?']);
 for(const [v,i] of [['a',0],['b',1],['c',2]])await gesture(tf(v),sf(i),{touch:true});
 assert.deepEqual(await slots(),['a2','b2','c2']);console.log('PASS: touch dragging and touch cancellation');
 await ev('PythagorasGoLevel(1)');await wait('Pythagoras.snapshot().phase===1&&!Pythagoras.snapshot().locked');
 for(const n of [3,4,5]){await ev(`document.querySelector('#square${n}').dispatchEvent(new MouseEvent('click',{bubbles:true}))`);await wait(`Pythagoras.snapshot().phase===${n-1}&&!Pythagoras.snapshot().locked`)}
 for(const n of [3,4,5]){await ev(`document.querySelector('#square${n}').dispatchEvent(new MouseEvent('click',{bubbles:true}));document.querySelector('[data-slot="${n}"]').click()`)}
 await wait('Pythagoras.snapshot().phase===5&&!Pythagoras.snapshot().locked');await gesture('#numberTile','[data-slot="numeric"]',{touch:true});
 assert((await ev('Pythagoras.snapshot().placed')).includes('numeric'));console.log('PASS: numeric 5² tile drag with touch');
 await ev('PythagorasGoLevel(2)');await delay(200);await gesture('#p3factor','#p3scaleSlot',{touch:true});assert.equal(await ev('document.querySelector("#p3scaleSlot").textContent'),'×2');
 console.log('PASS: scale tile touch drag');
 await c.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await formula();for(const [v,i] of [['a',0],['b',1],['c',2]])await gesture(tf(v),sf(i),{touch:true});
 assert.deepEqual(await slots(),['a2','b2','c2']);console.log('PASS: formula touch drag in portrait layout');
 assert.deepEqual(c.errors,[]);console.log('PASS: no JavaScript exceptions');c.ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
