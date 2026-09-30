const assert=require('node:assert/strict'),{CDP}=require('./helpers/online-cdp.cjs');
const BASE='http://127.0.0.1:8775',PATH='/games/rechten/rechtenwereld/';
(async()=>{const browser=new CDP(),c=new CDP();let context;try{
 await browser.connect((await(await fetch('http://127.0.0.1:9245/json/version')).json()).webSocketDebuggerUrl);
 context=(await browser.send('Target.createBrowserContext')).browserContextId;
 const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId:context});await c.connect((await(await fetch('http://127.0.0.1:9245/json')).json()).find(t=>t.id===targetId).webSocketDebuggerUrl);await c.send('Page.enable');await c.send('Runtime.enable');
 c.route=async p=>{const u=new URL(p.request.url),finish=s=>c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/javascript'}],body:Buffer.from(s).toString('base64')});
  if(u.pathname.endsWith('/axioma-auth.js'))return finish(`(()=>{let account={id:'teacher-paper-test',role:'teacher'};const listeners=[];window.testSignOut=()=>{account=null;listeners.forEach(f=>f({account,pending:false}))};window.AxiomaAuth={ready:async()=>({account}),getAccount:async()=>account,getSession:async()=>null,onChange:f=>{listeners.push(f);return()=>{}},client:()=>null};})()`);
  if(u.pathname.endsWith('/axioma-progress.js'))return finish("window.AxiomaProgress={load:async()=>({state:{}}),save:()=>{throw Error('No cloud writes in teacher preview')}}");
  if(u.pathname.endsWith('/axioma-social.js'))return finish('window.AxiomaSocial={state:()=>({}),onChange:()=>()=>{}}');
  if(u.hostname!=='127.0.0.1')return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'});return c.send('Fetch.continueRequest',{requestId:p.requestId});
 };await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});await c.size(1366,900);
 const go=async route=>{await c.send('Page.navigate',{url:BASE+PATH+route});await c.wait("document.querySelector('#app[data-ready=true]')&&window.LeraarBobTopbar");};
 for(const area of ['grenspas','formulewerf','signaalstad']){await go('index.html#'+area);assert.equal(await c.eval('RechtenV2Areas.selection(RechtenV2App.snapshot()).id'),area);assert.equal(await c.eval('RechtenV2App.snapshot().platformXp'),0);}
 await go('index.html?practice=graph_from_equation');assert.equal(await c.eval('RechtenV2App.snapshot().active'),'graph_from_equation');
 // Advance a local teacher fixture to the half-unit exercise without marking it complete.
 await c.eval(`(()=>{const k=Object.keys(localStorage).find(k=>k.endsWith(':teacher:teacher-paper-test')),r=JSON.parse(localStorage[k]),m=r.state.missions.graph_from_equation;m.index=3;m.task=RechtenV2Formula.makeTask(m.skill,3,m.run||1);localStorage[k]=JSON.stringify(r)})()`);
 await c.send('Page.reload');await c.wait("document.querySelector('[data-line-picker][data-axis-step=\"0.5\"]')");
 for(const [width,height] of [[1366,900],[780,360]]){
  await c.size(width,height);await c.eval('LeraarBobTopbar.setCollapsed(true)');
  const p=await c.eval("(()=>{const p=new DOMPoint(270,230).matrixTransform(document.querySelector('[data-line-picker]').getScreenCTM());return {x:p.x,y:p.y}})()");
  await c.send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...p});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...p});
  assert.deepEqual(await c.eval('RechtenV2App.snapshot().missions.graph_from_equation.values.plotA'),{x:.5,y:.5});
  assert(await c.eval("document.querySelector('.half-tick')&&document.querySelector('.coordinate-guide')"));
  assert.match(await c.eval("document.querySelector('.formula-plot-note').textContent"),/½ = 0,5/);
  await c.shot('teacher-half-grid-'+width);
 }
 await c.send('Page.reload');await c.wait("document.querySelector('[data-line-picker]')");assert.deepEqual(await c.eval('RechtenV2App.snapshot().missions.graph_from_equation.values.plotA'),{x:.5,y:.5});
 await c.eval('testSignOut()');await c.wait("document.querySelector('#reload-account')");await c.click('reload-account');await c.wait("document.querySelector('#app[data-ready=true]')&&!document.querySelector('#reload-account')");assert.equal(await c.eval('RechtenV2App.snapshot().active'),null);
 await c.send('Page.navigate',{url:BASE+'/oefenbladen.html'});await c.wait('window.LeraarBobTopbar');
 for(const [width,height] of [[1366,900],[390,844],[320,568]])for(const folded of [false,true]){await c.size(width,height);await c.eval(`LeraarBobTopbar.setCollapsed(${folded})`);assert(await c.eval('document.documentElement.scrollWidth<=innerWidth'));}
 await c.eval("document.querySelector('a[href$=\"world=formulewerf\"]').click()");await c.wait('window.FormulewerfWorksheetApp');assert.equal(await c.eval('FormulewerfWorksheetApp.snapshot().doc.tasks.length'),8);
 assert.deepEqual(c.errors,[]);console.log('PASS teacher worlds, direct lesson, no false mastery/cloud writes, half-coordinate placement on 2 screens, reload, sign-out isolation, hub/mobile links');
}finally{if(context)await browser.send('Target.disposeBrowserContext',{browserContextId:context});c.ws?.close();browser.ws?.close()}})().catch(e=>{console.error(e);process.exitCode=1});
