// Formulewerf-only UI regression, isolated guest and local server; no external requests.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {CDP,report,ARTIFACTS,BASE,ROUTE}=require('./helpers/rechten-area-cdp.cjs');
const A=require('../games/rechten/trainer-v2/content/area-maps.js');
const expected=[['equation_from_ab','graph_from_equation','equation_from_graph','rewrite_linear_equation'],['intercept_from_point','equation_from_point_slope','equation_from_two_points','equation_from_table','equation_from_context']];
(async()=>{
 const c=new CDP();await c.connect();fs.mkdirSync(ARTIFACTS,{recursive:true});
 await c.send('Target.createTarget',{url:'chrome://settings/appearance'});const z=new CDP();await z.connect('chrome://settings');await z.wait('!!chrome.settingsPrivate');
 const mock='window.AxiomaAuth={ready:async()=>({session:null}),getAccount:async()=>null,getSnapshot:()=>({status:"guest",account:null}),client:()=>null,onChange:()=>()=>{}};';
 c.paused=p=>{const u=new URL(p.request.url);if(u.pathname.endsWith('/axioma-auth.js')||u.origin!==new URL(BASE).origin)return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(u.pathname.endsWith('/axioma-auth.js')?mock:'').toString('base64')});return c.send('Fetch.continueRequest',{requestId:p.requestId})};
 await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 const ready=async()=>{await c.send('Page.bringToFront');await c.wait('!!document.querySelector("#app[data-ready=true]")');await c.eval('document.fonts.ready');await c.eval('Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))');await c.frames()};
 let fixture=0;const go=async hash=>{await c.send('Page.bringToFront');await c.navigate(BASE+ROUTE+'?formulewerf='+ ++fixture+hash);await ready()};
 const snap=()=>c.eval('RechtenV2App.snapshot()');
 async function layout(label){const issues=await c.eval(`(()=>{
 const issues=[],visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden',rect=e=>e.getBoundingClientRect(),over=(a,b)=>a.left<b.right-.5&&a.right>b.left+.5&&a.top<b.bottom-.5&&a.bottom>b.top+.5;
 if(document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1)issues.push('document scroll');
 const main=document.querySelector('.atlas-main,.stop-main'),bounds=main&&rect(main);
 for(const e of document.querySelectorAll('.skill-label,.skill-marker,.skill-status,.island-label,.map-intro,.area-zones')){
  if(!visible(e))continue;const r=rect(e);if(r.left<bounds.left-.8||r.right>bounds.right+.8||r.top<bounds.top-.8||r.bottom>bounds.bottom+.8)issues.push('outside main: '+e.className+' '+e.textContent.trim());
  if(e.matches('.skill-label,.skill-status,.island-label')&&(e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+2))issues.push('text overflow: '+e.className+' '+e.textContent.trim());
 }
 const nodes=[...document.querySelectorAll('.skill-node,.island-node')];
 for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++)for(const a of nodes[i].querySelectorAll('.skill-marker,.skill-label,.skill-status,.island-label,.island-marker'))for(const b of nodes[j].querySelectorAll('.skill-marker,.skill-label,.skill-status,.island-label,.island-marker'))if(over(rect(a),rect(b)))issues.push('node overlap: '+nodes[i].dataset.node+' / '+nodes[j].dataset.node);
 for(const n of nodes)for(const e of n.querySelectorAll('.skill-label,.skill-marker,.skill-status,.island-label'))for(const intro of document.querySelectorAll('.map-intro,.area-zones'))if(over(rect(e),rect(intro)))issues.push('intro/zone overlaps '+n.dataset.node);
 for(const e of document.querySelectorAll('button,a')){
  if(!visible(e)||e.closest('[hidden],[inert]'))continue;const r=rect(e),name=e.dataset.node||e.id||e.textContent.trim();
  if(r.left<-.8||r.right>innerWidth+.8||r.top<-.8||r.bottom>innerHeight+.8)issues.push('clipped control '+name);
  if(e.closest('.atlas-footer')&&(e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1))issues.push('footer text overflow '+name);
  if(!e.disabled){const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(!hit||!e.contains(hit))issues.push('covered control '+name)}
 }
 const stage=document.querySelector('.area-stage');if(stage){const r=rect(stage),img=rect(stage.querySelector('.area-island'));if(Math.abs(r.width/r.height-1.5)>.002)issues.push('stage ratio');if(Math.abs(img.width-r.width)>.1||Math.abs(img.height-r.height)>.1||Math.abs(img.x-r.x)>.1)issues.push('art drift');for(const n of nodes){const m=rect(n.querySelector('.skill-marker')),x=parseFloat(n.style.getPropertyValue('--x'))/100,y=parseFloat(n.style.getPropertyValue('--y'))/100;if(Math.abs(m.x+m.width/2-(r.x+r.width*x))>.2||Math.abs(m.y+m.height/2-(r.y+r.height*y))>.2)issues.push('anchor drift '+n.dataset.node)}}
 return [...new Set(issues)]})()`);assert.deepEqual(issues,[],label);report.checks.push(label)}
 async function routeCheck(index){
  assert.deepEqual(await c.eval('[...document.querySelectorAll("[data-node]")].map(n=>n.dataset.skill)'),expected[index]);
  assert.deepEqual(await c.eval('[...document.querySelectorAll(".stop-number")].map(n=>Number(n.textContent))'),index?[5,6,7,8,9]:[1,2,3,4]);
  assert.equal(await c.eval('document.querySelector(".area-intro h1").textContent'),index?'Zelf een voorschrift bepalen':'Voorschrift en grafiek');
  assert.equal(await c.eval('document.querySelectorAll(".is-route-finish").length'),index?1:0);
  assert(await c.eval(`(()=>{const nodes=[...document.querySelectorAll('[data-node]')],paths=[...document.querySelectorAll('.area-paths path')];return paths.length===nodes.length-1&&paths.every((p,i)=>{const v=p.getAttribute('d').match(/[-\\d.]+/g).map(Number);return v.every((n,k)=>Math.abs(n-parseFloat(nodes[i+(k>=2?1:0)].style.getPropertyValue(k%2?'--y':'--x'))*10)<.01)})})()`));
  const next=await c.eval(`(()=>{const s=RechtenV2App.snapshot(),p=RechtenV2Areas.statuses(s,'formulewerf');return {id:p.recommended?.id||null,state:p.nodes.find(n=>n.recommended)?.state||null}})()`);assert(!next.id||next.state!=='locked');
 }
 try{
  await go('#wereld');await c.eval('localStorage.clear()');await go('#wereld');
  for(const [width,height] of [[1920,1080],[1366,768],[1024,768],[780,360],[640,360]])for(const zoom of [.8,1,1.25]){
   await z.eval(`new Promise(r=>chrome.settingsPrivate.setDefaultZoom(${zoom},r))`);await c.viewport(width,height,width<900);await go('#formulewerf/bouwen');
   report.matrix||=[];report.matrix.push({width,height,zoom,viewport:await c.eval('({width:innerWidth,height:innerHeight,dpr:devicePixelRatio})')});
   for(const [index,zone] of ['bouwen','omzetten'].entries()){
    await c.tap(`.area-zones [data-zone="${zone}"]`,width<900);await ready();await layout(`workshop ${index?'B':'A'} ${width}x${height} @${zoom}`);await routeCheck(index);
    if(zoom===1&&[1366,780].includes(width))await c.shot(`werkplaats-${index?'b':'a'}-${width}x${height}`);
   }
  }
  // Progress variants: no access, each possible current step, completion, paused context.
  await z.eval('new Promise(r=>chrome.settingsPrivate.setDefaultZoom(1.25,r))');await c.viewport(640,360,true);
  const ids=expected.flat();
  for(let completed=-1;completed<=9;completed++){
   const legacy={version:704,skills:Object.fromEntries(ids.slice(0,Math.max(0,completed)).map(id=>[id,{intro:true,seen:5,strength:.8,recent:[true,true,true,true]}])),access:completed<0?[]:ids,review:[]};
   for(const zone of ['bouwen','omzetten']){
    await c.eval(`(()=>{const s=RechtenV2Areas.locationState(RechtenV2Runtime.initial(),'area',{area:'formulewerf',zone:${JSON.stringify(zone)}});window.formuleFixture={state:s,legacy:${JSON.stringify(legacy)}};document.querySelector('#app').innerHTML=RechtenV2Shell.area(s,{legacy:formuleFixture.legacy})})()`);await c.frames();await layout(`progress ${completed} / ${zone}`);
    const result=await c.eval(`(()=>{const {state,legacy}=formuleFixture,s=RechtenV2Areas.statuses(state,'formulewerf'),actual=RechtenV2Areas.statuses(state,'formulewerf',legacy);return {recommended:actual.recommended?.id||null,status:actual.nodes.find(n=>n.recommended)?.state,lockedHighlighted:!!document.querySelector('.is-locked.is-recommended'),disabled:document.querySelector('.atlas-footer .paint-button').disabled}})()`);
    assert(!result.lockedHighlighted);assert(!result.recommended||result.status!=='locked');assert.equal(result.disabled,!result.recommended);
   }
  }
  await z.eval('new Promise(r=>chrome.settingsPrivate.setDefaultZoom(1,r))');await c.viewport(780,360,true);
  // Real clicks, exact zone return, refresh and history for each moved stop.
  for(const [index,zone] of ['bouwen','omzetten'].entries()){
   await go('#formulewerf/'+zone);
   for(const id of expected[index]){
    const before=await snap();await c.tap(`[data-node="${id}"]`,true);assert.equal(await c.eval('document.querySelector("#app").dataset.screen'),'stop');await layout('preview '+id);
    const saved=await snap();await c.navigate();await ready();assert.deepEqual(await snap(),saved);
    await c.tap('.atlas-footer [data-screen="area"]',true);assert.equal(await c.eval('location.hash'),'#formulewerf/'+zone);assert.equal(await c.eval('document.activeElement.dataset.node'),id);assert.deepEqual((await snap()).events,before.events);assert.deepEqual((await snap()).missions,before.missions);
    await c.eval('history.back()');await c.wait('document.querySelector("#app").dataset.screen==="stop"');await c.tap('.atlas-footer [data-screen="world"]',true);assert.equal(await c.eval('location.hash'),'#wereld');await c.eval('history.back()');await c.wait('document.querySelector("#app").dataset.screen==="stop"');await c.tap('.atlas-footer [data-screen="area"]',true);
   }
  }
  await go('#formulewerf/omzetten/halte/rewrite_linear_equation');assert.equal(await c.eval('location.hash'),'#formulewerf/bouwen/halte/rewrite_linear_equation');await c.tap('.atlas-footer [data-screen="area"]',true);assert.equal(await c.eval('location.hash'),'#formulewerf/bouwen');
  await c.tap('.area-zones [data-zone="omzetten"]',true);await c.tap('.atlas-footer .paint-button',true);assert.equal(await c.eval('location.hash'),'#formulewerf/bouwen','fresh B recommends the available A stop');
  assert.deepEqual(c.errors,[]);report.passed=true;console.log(`PASS Formulewerf: ${report.checks.length} layout checks, 1–9 routes, all progress states, old links, reload and return navigation; ${report.screenshots.length} screenshots`);
 }catch(e){report.failure=e.stack;await c.shot('failure').catch(()=>{});throw e}
 finally{fs.writeFileSync(path.join(ARTIFACTS,'formulewerf-report.json'),JSON.stringify(report,null,2));await z.eval('new Promise(r=>chrome.settingsPrivate.setDefaultZoom(1,r))');await c.send('Fetch.disable');await c.send('Target.closeTarget',{targetId:z.targetId});c.ws.close();z.ws.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
