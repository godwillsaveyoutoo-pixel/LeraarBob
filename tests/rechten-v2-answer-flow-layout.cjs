// Exercise each distinct successful stage with the real auto-continue indicator.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {CDP,BASE,ROUTE,ARTIFACTS}=require('./helpers/rechten-area-cdp.cjs');
const R=require('../games/rechten/rechtenwereld/mission-runtime.js');
const {fixtures}=require('./helpers/rechten-question-fixtures.cjs');
const rows=fixtures(),cases=new Map();for(const row of rows.filter(r=>r.label.endsWith('/correct'))){const key=[row.m.skill,row.m.phase,row.m.task.representation].join('/');if(!cases.has(key)||cases.get(key).m.feedback.result.message.length<row.m.feedback.result.message.length)cases.set(key,row)}
(async()=>{const c=new CDP();await c.connect();fs.mkdirSync(ARTIFACTS,{recursive:true});const report={checks:0,failures:[],passed:false};let serial=0;
 const mock='window.AxiomaAuth={ready:async()=>({session:null}),getAccount:async()=>null,getSnapshot:()=>({status:"guest",account:null}),client:()=>null,onChange:()=>()=>{}};';
 c.paused=p=>{const u=new URL(p.request.url);return u.pathname.endsWith('/axioma-auth.js')||u.origin!==new URL(BASE).origin?c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(u.pathname.endsWith('/axioma-auth.js')?mock:'').toString('base64')}):c.send('Fetch.continueRequest',{requestId:p.requestId})};await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 try{
  await c.navigate(BASE+ROUTE+'?flow-layout-init='+Date.now()+'#wereld');await c.wait('document.querySelector("#app[data-ready=true]")');
  for(const [w,h] of [[1920,1080],[1366,768],[1100,761],[1024,600],[1214,609],[780,360],[640,360]]){
   await c.viewport(w,h,w<900);
   for(const row of cases.values()){
    const m=rows.find(r=>r.label===row.label.replace('/correct','/selected')).m,s=R.initial();s.active=m.skill;s.screen='mission';s.missions[m.skill]=m;
    await c.eval(`(()=>{const key=Object.keys(localStorage).find(k=>k.startsWith('axioma:rechten:v2:')&&k.endsWith(':guest')),record=JSON.parse(localStorage.getItem(key));record.state=${JSON.stringify(s)};localStorage.setItem(key,JSON.stringify(record));})()`);
    await c.navigate(BASE+ROUTE+'?flow-layout='+Date.now()+'-'+ ++serial+'#oefenen');await c.wait('document.querySelector("#app[data-ready=true]")');await c.eval('document.fonts.ready');await c.tap('#commit');assert(await c.eval('!!document.querySelector("#flow-pause")'));
    const issues=await c.eval(`(()=>{const out=[],visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden',main=document.querySelector('.boundary-workspace'),fr=document.querySelector('.boundary-footer').getBoundingClientRect(),mr=main.getBoundingClientRect();for(const e of main.querySelectorAll(':scope>*,h1,h2,p,button,input')){if(!visible(e)||e.closest('dialog,svg'))continue;const r=e.getBoundingClientRect();if(r.top<mr.top-3||r.bottom>fr.top+1||r.left<-.5||r.right>innerWidth+.5)out.push('bounds '+e.className);if(e.clientWidth&&e.clientHeight&&(e.scrollHeight>e.clientHeight+4||e.scrollWidth>e.clientWidth+4)&&!e.matches('.graph-paper,.formula-work,.line-evidence,.formula-heading,.exercise-heading,.answer-tray'))out.push('overflow '+e.className)}for(const e of document.querySelectorAll('.feedback,#flow-pause,#continue')){const r=e.getBoundingClientRect();if(r.right>innerWidth+.5||r.left<0||r.bottom>innerHeight+.5||e.scrollHeight>e.clientHeight+3||e.scrollWidth>e.clientWidth+3)out.push('feedback bounds '+e.className);if(e.tagName==='BUTTON'&&(r.width<44||r.height<44||!e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))))out.push('button target '+e.id)}return [...new Set(out)]})()`);
    report.checks++;if(issues.length){report.failures.push({w,h,label:row.label,issues});await c.shot('failure-'+w+'x'+h+'-'+m.skill+'-'+m.phase)}await c.tap('#flow-pause');
   }
   console.log(w+'x'+h+': '+cases.size+' successful stages checked');
  }
  assert.deepEqual(c.errors,[]);assert.deepEqual(report.failures,[]);report.passed=true;console.log('PASS '+report.checks+' live success layouts');
 }finally{fs.writeFileSync(path.join(ARTIFACTS,'answer-flow-layout-report.json'),JSON.stringify(report,null,2));await c.send('Fetch.disable');c.ws.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
