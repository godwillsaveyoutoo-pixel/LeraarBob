// Exercise actual drags in both local battle halves; isolated browser, no cloud writes.
const assert=require('node:assert/strict'),{CDP}=require('./helpers/online-cdp.cjs');
const BattleGame=require('../games/wortelbouw_pro_v0.5.0/wortelbouw/battle-config.js');
const PORT=process.env.VECTOR_BROWSER_PORT||9245,BASE=process.env.VECTOR_BASE_URL||'http://127.0.0.1:8775';
const frames=c=>c.eval('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
(async()=>{
 const browser=new CDP(),v=await(await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();await browser.connect(v.webSocketDebuggerUrl);let context,c;
 try{
  context=(await browser.send('Target.createBrowserContext')).browserContextId;const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId:context});c=new CDP();await c.connect(`ws://127.0.0.1:${PORT}/devtools/page/${targetId}`);await c.send('Page.enable');await c.send('Runtime.enable');
  c.route=async p=>{const u=new URL(p.request.url),body=u.pathname.endsWith('/axioma-social.js')?'':u.pathname.endsWith('/axioma-auth.js')?'window.AxiomaAuth={ready:async()=>({account:null}),getAccount:async()=>null,onChange:()=>()=>{},configured:()=>true};':null;if(body!==null)return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(body).toString('base64')});if(u.hostname!=='127.0.0.1')return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'});return c.send('Fetch.continueRequest',{requestId:p.requestId});};await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  await c.size(1366,768);await c.send('Page.navigate',{url:BASE+'/games/wortelbouw_pro_v0.5.0/wortelbouw/battle.html'});await c.wait('!!window.WortelbouwBattle&&!!window.LeraarBobTopbar');
  await c.eval("window.testArenas=[];const reset=WortelbouwArena.prototype.reset;WortelbouwArena.prototype.reset=function(...args){testArenas[this.index]=this;return reset.apply(this,args)};document.getElementById('battleSound').click();document.getElementById('startBattleButton').click()");await c.wait('WortelbouwBattle.inspect().roundLive');
  await c.eval('window.testController=testArenas[0].controller;window.originalSolved=testController.arenaSolved;window.testSolved=[];testController.arenaSolved=a=>testSolved.push(a.index)');
  const state=i=>c.eval(`({phase:testArenas[${i}].game.state.phase,objects:testArenas[${i}].game.state.objects,unit:testArenas[${i}].camera.unit})`);
  async function reset(n){await c.eval(`(()=>{const t=testController;t.goals=[${n}];t.round=0;t.roundCount=1;t.scores=[0,0];t.roundLive=true;t.updateHUD();document.getElementById('nextRoundButton').hidden=true;for(const a of testArenas){a.reset(WortelbouwGeometry.levels.findIndex(l=>l.n===${n}));a.setLocked(false)}})()`);await frames(c);}
  async function points(i,expression){return c.eval(`(()=>{const a=testArenas[${i}],s=a.game.state,G=WortelbouwGeometry,r=a.canvas.getBoundingClientRect();return (${expression}).map(p=>{const q=a.screen(p);return {x:q.x+r.left,y:q.y+r.top}})})()`);}
  async function drag(i,points,touch){
   const [start,end]=points;const camera=await c.eval(`JSON.stringify(testArenas[${i}].camera)`);
   for(const p of points)assert.equal(await c.eval(`document.elementFromPoint(${p.x},${p.y})===document.getElementById('battleCanvas${i+1}')`),true,'drag endpoint must stay on its own board '+JSON.stringify({i,p}));
   if(touch)await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...start}]});else await c.send('Input.dispatchMouseEvent',{type:'mousePressed',...start,button:'left',buttons:1,clickCount:1});
   for(let step=1;step<=6;step++){const p={x:start.x+(end.x-start.x)*step/6,y:start.y+(end.y-start.y)*step/6};if(touch)await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,...p}]});else await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',...p,button:'left',buttons:1});}
   assert.equal(await c.eval(`JSON.stringify(testArenas[${i}].camera)`),camera,'camera is stable while drawing');
   if(touch)await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',...end,button:'left',clickCount:1});await frames(c);
  }
  async function build(i,start,leg,edge,touch,undo=false,mode='sum',flip=false){
   const startPoints=await c.eval(`(()=>{const a=testArenas[${i}],f=a.viewFrame(),r=a.canvas.getBoundingClientRect(),side=a.camera.unit*${start},x=(f.left+f.right-side)/2,y=(f.top+f.bottom-side)/2;return [{x:r.left+x,y:r.top+y},{x:r.left+x+side,y:r.top+y+side}]})()`);
   await drag(i,startPoints,touch);assert.equal((await state(i)).objects[0]?.area,start*start,'draw start square');
   const untouchedMode=await c.eval(`testArenas[${1-i}].mode`);
   const controls=await c.eval(`(()=>{const a=testArenas[${i}],button=a.sideChoice.querySelector('[data-mode="${mode}"]'),r=button.getBoundingClientRect();return {disabled:button.disabled,width:r.width,height:r.height,x:r.x+r.width/2,y:r.y+r.height/2,hit:button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}})()`);
   assert(!controls.disabled&&controls.hit&&controls.width>=44&&controls.height>=44,'Side choices remain reachable');
   const at={x:controls.x,y:controls.y};
   if(touch){await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...at}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
   else{await c.send('Input.dispatchMouseEvent',{type:'mousePressed',...at,button:'left',clickCount:1});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',...at,button:'left',clickCount:1});}
   assert.equal(await c.eval(`testArenas[${i}].mode`),mode);
   assert.equal(await c.eval(`testArenas[${i}].sideChoice.querySelector('[data-mode="${mode}"]').getAttribute('aria-pressed')`),'true');
   if(start===1)assert.equal(await c.eval(`testArenas[${i}].sideChoice.querySelector('[data-mode="difference"]').disabled`),true);
   const untouched=await c.eval(`JSON.stringify(testArenas[${1-i}].game.state)`);
   await drag(i,await points(i,`(()=>{const e=G.edges(s.objects[0])[${edge}],p=G.add(e.a,G.mul(G.sub(e.b,e.a),${flip?.83:.17})),out=G.mul(G.perp(G.norm(G.sub(e.b,e.a))),-${leg});return [p,G.add(p,out)]})()`),touch);
   assert.equal((await state(i)).phase,'helper','triangle is reachable');assert.equal(await c.eval(`testArenas[${i}].game.state.pending.k`),leg,'ruler uses actual camera scale');
   assert.equal(await c.eval(`testArenas[${i}].game.state.pending.mode`),mode);
   assert.equal(await c.eval(`testArenas[${i}].game.state.pending.flip`),flip);
   assert.equal(await c.eval(`[...testArenas[${i}].sideChoice.children].every(b=>b.disabled)`),true,'Side choices freeze once the triangle is placed');
   for(const phase of ['helper','result']){
    await drag(i,await points(i,`(()=>{const e=s.pending.triangle[s.phase],mid=G.mul(G.add(e.a,e.b),.5),out=G.mul(G.sub(G.center(s.pending[s.phase].points),mid),1.6);return [mid,G.add(mid,out)]})()`),touch);
    if(phase==='helper')assert.equal((await state(i)).phase,'result');else await c.wait(`testArenas[${i}].game.state.phase==='won'`);
   }
   assert.equal(await c.eval(`JSON.stringify(testArenas[${1-i}].game.state)`),untouched,'other player is unchanged');
   assert.equal(await c.eval(`testArenas[${1-i}].mode`),untouchedMode,'Side selection is independent per player');
   const answer=await c.eval(`({level:testArenas[${i}].game.state.level,actions:testArenas[${i}].game.actions})`);assert(BattleGame.validate(answer.level,answer).ok,'Online/class answer validator accepts this construction');
   if(undo){await c.eval(`testArenas[${i}].undoButton.click()`);assert.equal((await state(i)).phase,'result');await drag(i,await points(i,"(()=>{const e=s.pending.triangle.result,mid=G.mul(G.add(e.a,e.b),.5);return [mid,G.add(mid,G.mul(G.sub(G.center(s.pending.result.points),mid),1.6))]})()"),touch);await c.wait(`testArenas[${i}].game.state.phase==='won'`);}
  }
  const cases=[[2,1,1],[5,1,2],[13,2,3],[18,3,3],[25,3,4],[100,6,8],[104,10,2]];
  for(const [w,h] of [[1366,768],[954,441],[640,360],[390,844],[320,568]]){
   await c.size(w,h);await c.send('Emulation.setTouchEmulationEnabled',{enabled:w<1000,maxTouchPoints:2});
   for(const folded of [false,true]){
    await c.eval('LeraarBobTopbar.setCollapsed('+folded+')');await frames(c);
    // Every goal on both halves; reverse the legs for player two, including 2 + 10.
    for(const [n,a,b] of cases){await reset(n);await build(0,a,b,2,w<1000,n===104);await build(1,b,a,0,w<1000);}
    await reset(5);await build(0,3,2,2,w<1000,true,'difference');await build(1,3,2,0,w<1000,false,'difference',true);
    await c.shot('wortelbouw-battle-space-'+w+(folded?'-folded':''));
    console.log('PASS '+w+'×'+h+' collapsed='+folded+': all 7 goals, both side choices, both players, full touch/mouse construction and undo');
   }
  }
  // Resizing halfway through a drag cancels only that gesture, never an existing field.
  await reset(104);await c.eval("testArenas[0].game.commit({type:'start',k:10,x:0,y:0});testArenas[0].reframe();testArenas[0].render()");const saved=await c.eval('JSON.stringify(testArenas[0].game.state)');
  const [edge]=await points(0,'[G.mul(G.add(s.objects[0].points[0],s.objects[0].points[1]),.5)]');await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,...edge}]});await c.wait('!!testArenas[0].gesture');await c.size(844,390);await frames(c);assert.equal(await c.eval('testArenas[0].gesture===null'),true);assert.equal(await c.eval('JSON.stringify(testArenas[0].game.state)'),saved);await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  // The real controller still awards one point after completing a build.
  await c.eval('testController.arenaSolved=originalSolved');await reset(25);await build(0,3,4,2,true);await c.wait('WortelbouwBattle.inspect().scores[0]===1');assert.deepEqual(await c.eval('WortelbouwBattle.inspect().scores'),[1,0]);assert.deepEqual(c.errors,[]);console.log('PASS resize cancels an unfinished drag without resetting progress; real battle score remains correct');
 }finally{if(context)await browser.send('Target.disposeBrowserContext',{browserContextId:context});c?.ws.close();browser.ws.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
