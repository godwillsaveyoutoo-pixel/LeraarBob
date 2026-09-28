// Real UI: successful steps may advance; every interruption leaves feedback in place.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {CDP,BASE,ROUTE,ARTIFACTS}=require('./helpers/rechten-area-cdp.cjs');
const R=require('../games/rechten/rechtenwereld/mission-runtime.js'),Flow=require('../games/rechten/rechtenwereld/answer-flow.js');
const {fixtures}=require('./helpers/rechten-question-fixtures.cjs');
const rows=fixtures(),selected=(skill,index=0,phase)=>rows.find(r=>r.m.skill===skill&&r.m.index===index&&(!phase||r.m.phase===phase)&&r.label.endsWith('/selected')).m;
(async()=>{const c=new CDP();await c.connect();fs.mkdirSync(ARTIFACTS,{recursive:true});const report={checks:[],passed:false};let serial=0;
 const mock='window.AxiomaAuth={ready:async()=>({session:null}),getAccount:async()=>null,getSnapshot:()=>({status:"guest",account:null}),client:()=>null,onChange:()=>()=>{}};';
 c.paused=p=>{const u=new URL(p.request.url);return u.pathname.endsWith('/axioma-auth.js')||u.origin!==new URL(BASE).origin?c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(u.pathname.endsWith('/axioma-auth.js')?mock:'').toString('base64')}):c.send('Fetch.continueRequest',{requestId:p.requestId})};await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 const ready=async()=>{await c.wait('document.querySelector("#app[data-ready=true]")');await c.eval('document.fonts.ready');await c.frames()},snap=()=>c.eval('RechtenV2App.snapshot()'),m=async()=>R.active(await snap());
 async function load(m,settings={}){const s=R.initial();s.screen='mission';s.active=m.skill;s.missions[m.skill]=m;s.settings=settings;
  await c.eval(`(()=>{const key=Object.keys(localStorage).find(k=>k.startsWith('axioma:rechten:v2:')&&k.endsWith(':guest')),record=JSON.parse(localStorage.getItem(key));record.state=${JSON.stringify(s)};localStorage.setItem(key,JSON.stringify(record));})()`);
  await c.navigate(BASE+ROUTE+'?flow='+Date.now()+'-'+ ++serial+'#oefenen');await ready();
 }
 async function correct(){await c.tap('#commit');assert((await m()).feedback.result.ok);assert(await c.eval('!!document.querySelector("#flow-pause")'));return Flow.delay(await snap())}
 async function unchanged(ms,before){await new Promise(r=>setTimeout(r,ms+150));assert.deepEqual(await m(),before)}
 try{
  await c.viewport(1366,768);await c.navigate(BASE+ROUTE+'?flow-init='+Date.now()+'#wereld');await ready();
  for(const [skill,phase] of [['point','coordinate'],['line_behavior','line-plot'],['equation_from_two_points','derive-slope']]){
   const row=selected(skill,skill==='line_behavior'?2:0,phase);await load(row);await correct();const n=(await m()).feedback.next;
   await c.wait(`(()=>{const s=RechtenV2App.snapshot(),m=s.missions[s.active];return !m.feedback&&${n==='next-task'?`m.index===${row.index+1}`:`m.phase===${JSON.stringify(n)}`}})()`);
   assert.equal((await snap()).events.length,1,'exactly one answer recorded');report.checks.push('automatic '+skill+' '+phase);
  }
  await load(selected('point'));let ms=await correct();await c.tap('#flow-pause');await unchanged(ms,await m());await c.tap('#continue');assert.equal((await m()).index,1);report.checks.push('pause keeps feedback; manual continuation');
  await load(selected('point'));ms=await correct();await c.tap('#continue');const next=await m();await unchanged(ms,next);assert.equal(next.index,1);report.checks.push('immediate Next cancels timer, no double advance');
  await load(selected('point'));ms=await correct();const saved=await m();await c.navigate();await ready();await unchanged(ms,saved);assert.equal(await c.eval('!!document.querySelector("#flow-pause")'),false);report.checks.push('reload keeps saved feedback and does not start a timer');
  await load(selected('point'));ms=await correct();await c.tap('#open-reminder');assert(await c.eval('document.querySelector("#reminder-dialog").open'));await unchanged(ms,await m());await c.press('Escape');assert.equal(await c.eval('!!document.querySelector("#flow-pause")'),false);report.checks.push('reminder pauses automatically');
  await load(selected('point'));ms=await correct();await c.tap('#menu');await unchanged(ms,await m());await c.tap('#menu');assert.equal(await c.eval('!!document.querySelector("#flow-pause")'),false);report.checks.push('menu pauses automatically');
  await load(selected('point'));ms=await correct();await c.tap('#pause');await new Promise(r=>setTimeout(r,ms+100));assert.notEqual((await snap()).screen,'mission');report.checks.push('leaving cannot advance in the background');
  const wrong=rows.find(r=>r.m.skill==='point'&&r.label.endsWith('/wrong')).m;await load(wrong);await unchanged(2200,await m());assert.equal(await c.eval('!!document.querySelector("#flow-pause")'),false);report.checks.push('mistakes require explicit repair');
  await load(selected('point',5));await correct();await c.wait('RechtenV2App.snapshot().missions.point.completed');assert.equal((await snap()).screen,'mission');assert(await c.eval('!!document.querySelector(".boundary-complete")'));report.checks.push('last answer opens completion screen, never the next level');
  await c.tap('[data-screen=profile]');await c.tap('#auto-advance');assert.equal((await snap()).settings.autoAdvance,false);await c.navigate();await ready();assert.equal((await snap()).settings.autoAdvance,false);assert.equal(await c.eval('document.querySelector("#auto-advance").checked'),false);report.checks.push('profile preference survives reload');
  await load(selected('point'),{autoAdvance:false});await c.tap('#commit');const manual=await m();assert(manual.feedback.result.ok);await unchanged(Flow.delay({...await snap(),settings:{}}),manual);assert.equal(await c.eval('!!document.querySelector("#flow-pause")'),false);report.checks.push('manual mode stays manual');
  // Full live countdown UI must fit, including the long success explanation.
  for(const [w,h]of [[1920,1080],[1366,768],[1024,600],[780,360],[640,360]]){
   await c.viewport(w,h,w<900);await load(selected('special_lines',5));await correct();
   const issues=await c.eval(`(()=>{const out=[],fr=document.querySelector('.boundary-footer').getBoundingClientRect();for(const e of document.querySelectorAll('.line-evidence,.feedback,#flow-pause,#continue')){const r=e.getBoundingClientRect();if(r.right>innerWidth+1||r.bottom>innerHeight+1||r.left<0||e.scrollWidth>e.clientWidth+3||e.scrollHeight>e.clientHeight+3)out.push(e.className);if(e.matches('.line-evidence')&&r.bottom>fr.top)out.push('overlap')}return out})()`);assert.deepEqual(issues,[],w+'x'+h);await c.shot('correct-flow-'+w+'x'+h);await c.tap('#flow-pause');report.checks.push('countdown layout '+w+'x'+h);
  }
  assert.deepEqual(c.errors,[]);report.passed=true;console.log('PASS answer flow: '+report.checks.length+' checks');
 }catch(e){report.failure=e.stack;await c.shot('failure');throw e}finally{fs.writeFileSync(path.join(ARTIFACTS,'answer-flow-report.json'),JSON.stringify(report,null,2));await c.send('Fetch.disable');c.ws.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
