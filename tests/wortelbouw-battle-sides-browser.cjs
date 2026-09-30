// Embedded online/class workboard with its real message bridge; no network or account writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),{CDP}=require('./helpers/online-cdp.cjs');
const PORT=process.env.VECTOR_BROWSER_PORT||9245,BASE=process.env.VECTOR_BASE_URL||'http://127.0.0.1:8775';
(async()=>{
 const browser=new CDP(),v=await(await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();await browser.connect(v.webSocketDebuggerUrl);let context,c;
 try{
  context=(await browser.send('Target.createBrowserContext')).browserContextId;const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId:context});c=new CDP();await c.connect(`ws://127.0.0.1:${PORT}/devtools/page/${targetId}`);await c.send('Page.enable');await c.send('Runtime.enable');
  c.route=async p=>{const u=new URL(p.request.url);if(u.hostname!=='127.0.0.1')return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'});if(u.pathname.endsWith('/battle-player.js')){const body="const OriginalArena=WortelbouwArena;window.WortelbouwArena=class extends OriginalArena{constructor(...args){super(...args);window.testArena=this}};"+fs.readFileSync('games/wortelbouw_pro_v0.5.0/wortelbouw/battle-player.js','utf8');return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(body).toString('base64')});}return c.send('Fetch.continueRequest',{requestId:p.requestId});};await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  const frames=()=>c.eval('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  async function drag(start,end){
   for(const p of [start,end])assert(await c.eval(`document.elementFromPoint(${p.x},${p.y})===testArena.canvas`),'Drawing stays inside the workboard');
   await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...start}]});
   for(let i=1;i<=6;i++)await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:start.x+(end.x-start.x)*i/6,y:start.y+(end.y-start.y)*i/6}]});
   await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await frames();
  }
  async function points(expression){return c.eval(`(()=>{const a=testArena,s=a.game.state,G=WortelbouwGeometry,r=a.canvas.getBoundingClientRect();return (${expression}).map(p=>{const q=a.screen(p);return {x:r.x+q.x,y:r.y+q.y}})})()`);}
  for(const mode of ['online','class'])for(const [width,height] of [[320,568],[640,360]]){
   await c.size(width,height);await c.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});await c.send('Page.navigate',{url:BASE+'/games/wortelbouw_pro_v0.5.0/wortelbouw/battle-player.html?mode='+mode});await c.wait('!!window.WortelbouwBattlePlayer');
   await c.eval("window.testAnswers=[];addEventListener('message',e=>{if(e.data.type==='vector-battle-answer')testAnswers.push(e.data)});postMessage({type:'vector-battle-question',match:'side-test',index:0,seed:17,variant:0,skill:'build_5'},location.origin)");await c.wait('!testArena.locked');await frames();
   const square=await c.eval('(()=>{const a=testArena,f=a.viewFrame(),r=a.canvas.getBoundingClientRect(),side=a.camera.unit*3,x=(f.left+f.right-side)/2,y=(f.top+f.bottom-side)/2;return [{x:r.x+x,y:r.y+y},{x:r.x+x+side,y:r.y+y+side}]})()');await drag(...square);
   const button=await c.eval('(()=>{const b=testArena.sideChoice.querySelector("[data-mode=difference]"),r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,disabled:b.disabled,w:r.width,h:r.height}})()');assert(!button.disabled&&button.w>=44&&button.h>=44);assert(await c.eval(`testArena.sideChoice.contains(document.elementFromPoint(${button.x},${button.y}))`));
   await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:button.x,y:button.y}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await frames();await c.wait('testArena.mode==="difference"');
   // A cancelled tap never switches modes; keyboard activation still works.
   const sumPoint=await c.eval('(()=>{const r=testArena.sideChoice.querySelector("[data-mode=sum]").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
   await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...sumPoint}]});await c.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal(await c.eval('testArena.mode'),'difference');
   for(const side of ['sum','difference']){await c.eval(`testArena.sideChoice.querySelector('[data-mode="${side}"]').focus()`);await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});assert.equal(await c.eval('testArena.mode'),side);}
   // Drag farther than the hypotenuse: the leg must remain strictly shorter (2 < 3).
   await drag(...await points('(()=>{const e=G.edges(s.objects[0])[2],p=G.add(e.a,G.mul(G.sub(e.b,e.a),.17)),out=G.mul(G.perp(G.norm(G.sub(e.b,e.a))),-4);return [p,G.add(p,out)]})()'));
   assert.equal(await c.eval('testArena.game.state.pending?.k'),2);assert.equal(await c.eval('testArena.game.state.pending?.mode'),'difference');
   for(const phase of ['helper','result'])await drag(...await points('(()=>{const e=s.pending.triangle[s.phase],mid=G.mul(G.add(e.a,e.b),.5),out=G.mul(G.sub(G.center(s.pending[s.phase].points),mid),1.6);return [mid,G.add(mid,out)]})()'));
   await c.wait('testArena.game.state.phase==="won"');assert(await c.eval('BattleGame.validate(testArena.game.state.level,{actions:testArena.game.actions}).ok'));await c.click('submit');await c.wait('testAnswers.length===1');assert(await c.eval('testArena.locked&&[...testArena.sideChoice.children].every(b=>b.disabled)'));
   assert.equal(await c.eval('document.documentElement.scrollWidth<=innerWidth'),true);await c.shot('wortelbouw-side-choice-'+mode+'-'+width);console.log('PASS '+mode+' '+width+'×'+height+': touch choice, difference construction, bounded leg, accepted submission and freeze');
  }
  assert.deepEqual(c.errors,[]);
 }finally{if(context)await browser.send('Target.disposeBrowserContext',{browserContextId:context});c?.ws.close();browser.ws.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
