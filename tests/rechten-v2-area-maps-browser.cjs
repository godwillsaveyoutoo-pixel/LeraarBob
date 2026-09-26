// Local Chromium only. Actual browser zoom uses chrome.settingsPrivate in an isolated profile.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {CDP,report,ARTIFACTS,BASE,ROUTE}=require('./helpers/rechten-area-cdp.cjs');
const maps=[['puntenbaai','route',2],['hellingrug','route',5],['signaalstad','route',7],['formulewerf','bouwen',4],['formulewerf','omzetten',5],['grenspas','route',5]];
(async()=>{
 const c=new CDP();await c.connect();
 let tabs=await(await fetch(`http://127.0.0.1:${process.env.V2_BROWSER_PORT||9245}/json`)).json();if(!tabs.some(t=>t.url.startsWith('chrome://settings')))await c.send('Target.createTarget',{url:'chrome://settings/appearance'});
 const z=new CDP();await z.connect('chrome://settings');await z.wait('!!chrome.settingsPrivate');
 fs.mkdirSync(ARTIFACTS,{recursive:true});
 const mock='window.AxiomaAuth={ready:async()=>({session:null}),getAccount:async()=>null,getSnapshot:()=>({status:"guest",account:null}),client:()=>null,onChange:()=>()=>{}};';
 c.paused=p=>{const u=new URL(p.request.url);if(u.pathname.endsWith('/axioma-auth.js')||u.origin!==new URL(BASE).origin)return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(u.pathname.endsWith('/axioma-auth.js')?mock:'').toString('base64')});return c.send('Fetch.continueRequest',{requestId:p.requestId})};
 await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 const ready=async()=>{await c.send('Page.bringToFront');await c.wait('!!document.querySelector("#app[data-ready=true]")');await c.eval('document.fonts.ready');await c.eval('Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))');await c.frames()};
 const snap=()=>c.eval('RechtenV2App.snapshot()');
 let fixture=0;async function go(hash){await c.send('Page.bringToFront');await c.navigate(BASE+ROUTE+'?maptest='+ ++fixture+hash);await ready()}
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
 try{
  await go('#wereld');await c.eval('localStorage.clear()');await go('#wereld');
  for(const [width,height] of (process.env.V2_COMPACT_ONLY?[[780,360],[640,360]]:[[1920,1080],[1366,768],[1024,768],[780,360],[640,360]]))for(const zoom of [.8,1,1.25]){
   await z.eval(`new Promise(r=>chrome.settingsPrivate.setDefaultZoom(${zoom},r))`);await c.viewport(width,height,width<900);await go('#wereld');
   const actual=await c.eval('({width:innerWidth,height:innerHeight,dpr:devicePixelRatio})');
   // CDP metrics are CSS dimensions. Supply the CSS viewport produced by browser zoom;
   // the browser itself also has the requested zoom, verified separately below.
   if(Math.abs(actual.width-width/zoom)>2)await c.viewport(Math.round(width/zoom),Math.round(height/zoom),width<900);
   report.matrix||=[];report.matrix.push({width,height,zoom,viewport:await c.eval('({width:innerWidth,height:innerHeight,dpr:devicePixelRatio})')});assert(Math.abs(await z.eval('new Promise(r=>chrome.settingsPrivate.getDefaultZoom(r))')-zoom)<.001);
   await layout(`world ${width}x${height} @${zoom}`);
   assert.equal(await c.eval('document.querySelectorAll("[data-world-node]:disabled").length'),0);
   for(const [id,zone,count] of maps){
    await c.tap(`[data-world-node="${id}"]`,width<900);await ready();
    if(id==='formulewerf')await c.tap(`.area-zones [data-zone="${zone}"]`,width<900);
    assert.equal(await c.eval('document.querySelectorAll("[data-node]").length'),count);
    await layout(`${id}/${zone} ${width}x${height} @${zoom}`);
    if(zoom===1&&[1366,780].includes(width))await c.shot(`${id}${id==='formulewerf'?'-'+zone:''}-${width}x${height}`);
    await c.tap('.atlas-footer [data-screen="world"]',width<900);assert.equal(await c.eval('location.hash'),'#wereld');
   }
  }
  // Stress every possible recommendation with real legacy readiness fixtures, not fabricated completion writes.
  await z.eval('new Promise(r=>chrome.settingsPrivate.setDefaultZoom(1.25,r))');await c.viewport(640,360,true);
  for(const [id,zone] of maps){
   const area=require('../games/rechten/trainer-v2/content/area-maps.js').get(id),nodes=area.zones.find(z=>z.id===zone).nodes;
   for(const node of nodes){
    const skills=Object.fromEntries(require('../games/rechten/trainer-v2/content/skills.json').skills.map(n=>[n.id,{intro:n.id!==node.id,seen:n.id===node.id?0:5,strength:.8,recent:[true,true,true,true]}]));
    const legacy={version:704,skills,access:Object.keys(skills),review:[]};
    await c.eval(`(()=>{const state=RechtenV2Areas.locationState(RechtenV2Runtime.initial(),'area',${JSON.stringify({area:id,zone})});if(${JSON.stringify(id==='grenspas'&&node.key!=='positive')})state.events.push({skill:'sign',correct:true,variant:0,attemptId:'symbol:3',phase:'execute'});document.querySelector('#app').innerHTML=RechtenV2Shell.area(state,{legacy:${JSON.stringify(legacy)}})})()`);await c.frames();await layout('recommended '+id+'/'+node.key+' 640x360 @1.25');
   }
  }
  await z.eval('new Promise(r=>chrome.settingsPrivate.setDefaultZoom(1,r))');await c.viewport(780,360,true);
  // Every individual stop, including locked previews, retains exact route and evidence.
  for(const [id,zone] of maps){await go('#'+id+(id==='formulewerf'?'/'+zone:''));const nodes=await c.eval('[...document.querySelectorAll("[data-node]")].map(n=>({key:n.dataset.node,playable:!!n.dataset.start,state:n.dataset.state}))');
   for(const n of nodes){if(n.playable)continue;const before=await snap();const areaHash=await c.eval('location.hash');await c.tap(`[data-node="${n.key}"]`,true);assert.equal(await c.eval('document.querySelector("#app").dataset.screen'),'stop');await layout(`stop ${id}/${n.key}`);
    const hash=await c.eval('location.hash');assert(hash.endsWith('/halte/'+n.key));const selected=await snap();await c.navigate();await ready();assert.deepEqual(await snap(),selected,'placeholder reload');
    await c.tap('.atlas-footer [data-screen="area"]',true);assert.equal(await c.eval('location.hash'),areaHash);assert.equal(await c.eval('document.activeElement.dataset.node'),n.key);assert.equal(await c.eval(`document.querySelector('[data-node="${n.key}"]').dataset.state`),n.state);
    assert.deepEqual((await snap()).events,before.events);assert.deepEqual((await snap()).missions,before.missions);
    await c.eval('history.back()');await c.wait('document.querySelector("#app").dataset.screen==="stop"');assert.equal(await c.eval('location.hash'),hash);
    await c.eval('history.back()');await c.wait('document.querySelector("#app").dataset.screen==="area"');assert.equal(await c.eval('location.hash'),areaHash);
   }
  }
  await go('#formulewerf/bouwen');await c.tap('.area-zones [data-zone="omzetten"]',true);await c.eval('history.back()');await c.wait('location.hash==="#formulewerf/bouwen"');assert.equal(await c.eval('document.querySelector(".mapped-area").dataset.zoneId'),'bouwen');
  await go('#grenspas');await c.tap('[data-node="positive"]',true);assert.equal(await c.eval('document.querySelector("#app").dataset.screen'),'mission');await c.tap('[data-choice=answer][data-value=0]',true);const draft=(await snap()).missions.positive;await c.tap('#pause',true);assert.equal(await c.eval('location.hash'),'#grenspas');await c.tap('.atlas-footer [data-screen="world"]',true);await c.tap('[data-world-node="puntenbaai"]',true);await c.tap('[data-node="point"]',true);assert.deepEqual((await snap()).missions.positive,draft,'other areas preserve the working exercise');
  await go('#grenspas');await c.tap('[data-node="positive"]',true);assert.deepEqual((await snap()).missions.positive,draft);
  assert.deepEqual(c.errors,[]);report.passed=true;console.log(`PASS area maps: ${report.checks.length} layout checks, all stops, history, reload, preserved exercise; ${report.screenshots.length} screenshots`);
 }catch(e){report.failure=e.stack;await c.shot('failure').catch(()=>{});throw e}
 finally{fs.writeFileSync(path.join(ARTIFACTS,'area-maps-report.json'),JSON.stringify(report,null,2));await z.eval('new Promise(r=>chrome.settingsPrivate.setDefaultZoom(1,r))');await c.send('Fetch.disable');await c.send('Target.closeTarget',{targetId:z.targetId});c.ws.close();z.ws.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
