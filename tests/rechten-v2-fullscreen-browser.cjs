// Header navigation and fullscreen: real browser interaction, isolated guest, no external requests.
const assert=require('node:assert/strict');
const {CDP,BASE,ROUTE}=require('./helpers/rechten-area-cdp.cjs');
(async()=>{
 const c=new CDP();await c.connect();let checks=0;
 const mock='window.AxiomaAuth={ready:async()=>({session:null}),getAccount:async()=>null,getSnapshot:()=>({status:"guest",account:null}),client:()=>null,onChange:()=>()=>{}};';
 c.paused=p=>{const u=new URL(p.request.url);return u.pathname.endsWith('/axioma-auth.js')||u.origin!==new URL(BASE).origin?c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(u.pathname.endsWith('/axioma-auth.js')?mock:'').toString('base64')}):c.send('Fetch.continueRequest',{requestId:p.requestId})};
 await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 try{
  await c.viewport(1366,768);await c.navigate(BASE+ROUTE+'?fullscreen-test='+Date.now()+'#wereld');await c.wait('document.querySelector("#app[data-ready=true]")');await c.eval('document.fonts.ready');
  assert.equal(await c.eval('document.querySelector(".atlas-brand").href'),BASE+'/');
  assert.equal(await c.eval('document.querySelector(".atlas-brand").hasAttribute("data-screen")'),false);checks++;
  const before=await c.eval('RechtenV2App.snapshot()');
  // Real Fullscreen API, including the event-driven icon after leaving fullscreen.
  await c.tap('.fullscreen-toggle');await c.wait('!!document.fullscreenElement');
  assert.equal(await c.eval('document.querySelector(".fullscreen-toggle").getAttribute("aria-pressed")'),'true');
  await c.tap('.fullscreen-toggle');await c.wait('!document.fullscreenElement');
  assert.equal(await c.eval('document.querySelector(".fullscreen-toggle").getAttribute("aria-pressed")'),'false');checks++;
  // Browser capability absent: no silent button failure and no lost work.
  await c.eval('Object.defineProperty(document,"fullscreenEnabled",{configurable:true,value:false})');
  for(const [w,h]of [[1366,768],[844,390],[640,360],[390,844]]){
   await c.viewport(w,h,true);await c.tap('.fullscreen-toggle',true);
   assert(await c.eval('document.querySelector("#fullscreen-help").matches(":modal")'));
   assert(await c.eval('(()=>{const d=document.querySelector("#fullscreen-help"),r=d.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&d.scrollWidth<=d.clientWidth+1})()'));
   await c.press('Tab');assert(await c.eval('document.querySelector("#fullscreen-help").contains(document.activeElement)'));
   await c.press('Escape');assert(await c.eval('document.activeElement.matches(".fullscreen-toggle")'));checks++;
  }
  await c.eval('Object.defineProperty(navigator,"userAgent",{configurable:true,value:"iPhone"})');
  await c.tap('.fullscreen-toggle',true);assert(await c.eval('document.querySelector("#fullscreen-help").textContent.includes("Zet op beginscherm")'));await c.tap('#fullscreen-help button',true);checks++;
  await c.eval('delete navigator.userAgent;delete document.fullscreenEnabled;document.documentElement.requestFullscreen=()=>Promise.reject(new Error("denied"))');
  await c.tap('.fullscreen-toggle',true);assert(await c.eval('document.querySelector("#fullscreen-help").textContent.includes("kon niet worden geopend")'));await c.tap('#fullscreen-help button',true);checks++;
  assert.deepEqual(await c.eval('RechtenV2App.snapshot()'),before);
  await c.viewport(640,360,true);await c.tap('[data-screen="area"][data-area="puntenbaai"]',true);await c.tap('[data-node="point_plot"]',true);
  for(const [w,h]of [[1920,1080],[1214,609],[844,390],[640,360]]){
   await c.viewport(w,h,true);
   assert.deepEqual(await c.eval(`(()=>{const items=[...document.querySelectorAll('.atlas-brand,.atlas-actions button')].filter(e=>e.getClientRects().length&&!e.hidden),bad=[];for(const e of items){const r=e.getBoundingClientRect();if(r.left<0||r.right>innerWidth||r.width<44||r.height<44)bad.push(e.className);if(!e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)))bad.push('covered '+e.className)}return bad})()`),[]);checks++;
  }
  // Portrait exercises show a rotation gate: fullscreen must remain reachable there.
  await c.viewport(390,844,true);await c.tap('.fullscreen-gate',true);assert(await c.eval('document.querySelector("#fullscreen-help").matches(":modal")'));await c.tap('#fullscreen-help button',true);checks++;
  await c.viewport(844,390,true);await c.eval('delete document.documentElement.requestFullscreen;Object.defineProperty(navigator,"standalone",{configurable:true,value:true});RechtenV2Fullscreen.attach(document.querySelector("#app"))');
  assert(await c.eval('document.querySelector(".fullscreen-toggle").hidden'));await c.eval('delete navigator.standalone');checks++;
  assert.deepEqual(c.errors,[]);console.log('PASS '+checks+' fullscreen/header checks: native enter/exit, unsupported, rejection, iPhone help, touch, focus, narrow headers, rotation gate, standalone, preserved progress.');
 }finally{await c.send('Fetch.disable');c.ws.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
