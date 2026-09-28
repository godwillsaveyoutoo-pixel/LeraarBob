// Reminders remain reachable without changing answers, hints or progress.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {CDP,BASE,ROUTE,ARTIFACTS}=require('./helpers/rechten-area-cdp.cjs');
const {fixtures}=require('./helpers/rechten-question-fixtures.cjs');
(async()=>{const c=new CDP();await c.connect();fs.mkdirSync(ARTIFACTS,{recursive:true});
 const mock='window.AxiomaAuth={ready:async()=>({session:null}),getAccount:async()=>null,getSnapshot:()=>({status:"guest",account:null}),client:()=>null,onChange:()=>()=>{}};';
 c.paused=p=>{const u=new URL(p.request.url);return u.pathname.endsWith('/axioma-auth.js')||u.origin!==new URL(BASE).origin?c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(u.pathname.endsWith('/axioma-auth.js')?mock:'').toString('base64')}):c.send('Fetch.continueRequest',{requestId:p.requestId})};
 await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});const report={checks:0,passed:false};
 const ready=async()=>{await c.wait('!!document.querySelector("#app[data-ready=true]")');await c.eval('document.fonts.ready')};
 const snap=()=>c.eval('RechtenV2App.snapshot()');
 async function check(){assert(await c.eval('document.querySelector("#reminder-dialog").matches(":modal")'));
  assert.deepEqual(await c.eval(`(()=>{const d=document.querySelector('#reminder-dialog'),b=d.querySelector('button'),r=d.getBoundingClientRect(),br=b.getBoundingClientRect(),out=[];if(r.left<0||r.top<0||r.right>innerWidth||r.bottom>innerHeight)out.push('dialog bounds');if(d.scrollWidth>d.clientWidth+1)out.push('horizontal scroll');if(br.width<44||br.height<44||!b.contains(document.elementFromPoint(br.x+br.width/2,br.y+br.height/2)))out.push('close unavailable');if(document.activeElement!==b)out.push('focus outside');return out})()`),[]);report.checks++}
 try{
  await c.viewport(1214,609);await c.navigate(BASE+ROUTE+'?reminder='+Date.now()+'#puntenbaai');await ready();await c.eval('localStorage.clear()');await c.navigate();await ready();await c.tap('[data-node="point_plot"]');await c.tap('[data-point-picker]');await c.tap('#hint');const before=await snap();
  for(const [w,h]of [[1708,960],[1366,768],[1093,614],[910,512],[640,360]]){await c.viewport(w,h);await c.tap('#open-reminder');await check();await c.press('Tab');assert(await c.eval('document.querySelector("#reminder-dialog").contains(document.activeElement)'),'focus trapped');await c.press('Escape');assert(await c.eval('document.activeElement.id==="open-reminder"'));assert.deepEqual(await snap(),before,'reading reminder does not consume hint or change answer')}
  await c.tap('#open-reminder');await c.viewport(1366,768);await check();await c.eval('document.querySelector("#reminder-dialog").scrollTop=9999');await c.tap('.reminder-close');assert.deepEqual(await snap(),before,'resize preserves answer');
  await c.tap('#commit');const feedback=await snap();await c.tap('#open-reminder');await check();await c.tap('.reminder-close');assert.deepEqual(await snap(),feedback,'available during feedback');
  const seen=new Set(),rows=fixtures().filter(r=>{const key=r.m.skill+'/'+r.m.phase;if(r.m.completed||seen.has(key))return false;seen.add(key);return true});await c.eval('window.reminderFixtures='+JSON.stringify(rows));
  for(const [width,height]of [[1920,1080],[1214,609],[1024,768],[640,360]]){await c.viewport(width,height,width<900);
   for(let i=0;i<rows.length;i++){
    await c.eval(`(()=>{const row=reminderFixtures[${i}],s=RechtenV2Runtime.initial(),app=document.querySelector('#app');s.active=row.m.skill;s.missions[s.active]=row.m;s.screen='mission';app.innerHTML=window['RechtenV2'+row.family+'View'].render(row.m,RechtenV2Shell.header(s,{mission:true}));RechtenV2Reminder.attach(app)})()`);
    await c.tap('#open-reminder',width<900);await check();
    assert(await c.eval(`document.querySelector('.reminder-content').textContent===document.querySelector('.boundary-workspace aside').textContent`),'same complete explanation');
    await c.eval('document.querySelector("#reminder-dialog").scrollTop=9999');await c.tap('.reminder-close',width<900);assert(await c.eval('document.activeElement.id==="open-reminder"'));
   }
  }
  assert.deepEqual(c.errors,[]);report.passed=true;console.log('PASS reminders: '+report.checks+' dialog checks; all question stages, resizing, focus, Escape, touch and unchanged work');
 }finally{fs.writeFileSync(path.join(ARTIFACTS,'reminder-report.json'),JSON.stringify(report,null,2));await c.send('Fetch.disable');c.ws.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
