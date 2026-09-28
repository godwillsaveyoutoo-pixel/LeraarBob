// Exhaustive question states, using CSS viewport sizes including zoom equivalents.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {CDP,BASE,ROUTE,ARTIFACTS}=require('./helpers/rechten-area-cdp.cjs');
const {fixtures}=require('./helpers/rechten-question-fixtures.cjs');
const sizes=process.env.V2_QUESTION_SIZES?JSON.parse(process.env.V2_QUESTION_SIZES):[[1920,1080],[1366,768],[1214,609],[1280,600],[1100,551],[1100,650],[1024,600],[800,600],[1024,550],[780,360],[672,378],[640,360],[1708,960],[1093,614],[1100,701],[1366,701],[1024,701],[1100,761],[1366,761],[1024,761],[1920,768],[1920,901]];
(async()=>{const c=new CDP();await c.connect();fs.mkdirSync(ARTIFACTS,{recursive:true});
 const mock='window.AxiomaAuth={ready:async()=>({session:null}),getAccount:async()=>null,getSnapshot:()=>({status:"guest",account:null}),client:()=>null,onChange:()=>()=>{}};';
 c.paused=p=>{const u=new URL(p.request.url);return u.pathname.endsWith('/axioma-auth.js')||u.origin!==new URL(BASE).origin?c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(u.pathname.endsWith('/axioma-auth.js')?mock:'').toString('base64')}):c.send('Fetch.continueRequest',{requestId:p.requestId})};
 await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});const report={states:0,checks:0,failures:[],sizes,passed:false};
 try{await c.navigate(BASE+ROUTE+'?question-layout='+Date.now()+'#wereld');await c.wait('!!document.querySelector("#app[data-ready=true]")');await c.eval('document.fonts.ready');const rows=fixtures().filter(row=>!process.env.V2_QUESTION_SKILL||row.m.skill===process.env.V2_QUESTION_SKILL);report.states=rows.length;await c.eval('window.questionFixtures='+JSON.stringify(rows));
 for(const [width,height]of sizes){await c.viewport(width,height);const results=await c.eval(`(()=>{
 const app=document.querySelector('#app'),R=RechtenV2Runtime,S=RechtenV2Shell,failures=[],visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
 window.renderQuestion=(row)=>{const s=R.initial();s.active=row.m.skill;s.missions[s.active]=row.m;s.screen='mission';app.innerHTML=window['RechtenV2'+row.family+'View'].render(row.m,S.header(s,{mission:true}));RechtenV2Reminder.attach(app);};
 for(const [index,row]of questionFixtures.entries()){
 renderQuestion(row);const main=document.querySelector('.boundary-workspace'),mr=main.getBoundingClientRect(),footer=document.querySelector('.boundary-footer'),fr=footer.getBoundingClientRect(),out=[];
 for(const e of main.querySelectorAll(':scope > *,h1,h2,p,button,input,.graph-paper-caption,.derive-math,.hill-formula,.line-given-coords,.grens-chart')){
  if(!visible(e)||e.closest('svg,dialog'))continue;const r=e.getBoundingClientRect();
  if(r.top<mr.top-3||r.bottom>fr.top+1||r.left<-.5||r.right>innerWidth+.5)out.push('bounds '+(e.className||e.tagName));
  if(e.clientHeight&&e.clientWidth&&(e.scrollHeight>e.clientHeight+4||e.scrollWidth>e.clientWidth+4)&&!e.matches('.graph-paper,.formula-work,.line-evidence,.formula-heading,.exercise-heading,.answer-tray'))out.push('overflow '+(e.className||e.tagName));
 }
 for(const e of footer.querySelectorAll('button,.feedback')){if(!visible(e))continue;const r=e.getBoundingClientRect();if(r.top<fr.top-1||r.bottom>innerHeight+1||r.left<0||r.right>innerWidth)out.push('footer bounds '+e.className)}
 for(const e of document.querySelectorAll('main button,main input,.boundary-footer button,#open-reminder')){if(!visible(e)||e.disabled||e.closest('dialog'))continue;const r=e.getBoundingClientRect();if(r.width<43.9||r.height<43.9)out.push('small target '+(e.className||e.tagName));if(!e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)))out.push('covered '+(e.className||e.tagName));}
 for(const svg of document.querySelectorAll('svg.math-graph')){if(!visible(svg))continue;const scale=Math.hypot(svg.getScreenCTM().a,svg.getScreenCTM().b);if(svg.viewBox.baseVal.height*scale<140)out.push('small graph');const ticks=[...svg.querySelectorAll('.graph-grid text[text-anchor=middle],.axis-origin')].map(t=>t.getBoundingClientRect()).sort((a,b)=>a.left-b.left);for(let i=1;i<ticks.length;i++)if(ticks[i].left<ticks[i-1].right+1){out.push('overlapping axis labels');break}for(const t of svg.querySelectorAll('.graph-grid text'))if(parseFloat(getComputedStyle(t).fontSize)*scale<10.5){out.push('small graph numbers');break}}
 if(out.length)failures.push({index,label:row.label,family:row.family,issues:[...new Set(out)]});
 }return failures;})()`);report.checks+=rows.length;report.failures.push(...results.map(r=>({...r,width,height})));console.log(width+'x'+height+': '+results.length+' / '+rows.length+' states with issues');
 const seen=new Set();for(const fail of results){if(seen.has(fail.family))continue;seen.add(fail.family);await c.eval(`renderQuestion(questionFixtures[${fail.index}])`);await c.shot('failure-'+fail.family+'-'+width+'x'+height)}
 }
 report.passed=!report.failures.length;assert.deepEqual(c.errors,[]);assert.equal(report.failures.length,0,'See question-layout-report.json');console.log('PASS '+report.checks+' question layout checks');
 }finally{fs.writeFileSync(path.join(ARTIFACTS,'question-layout-report.json'),JSON.stringify(report,null,2));await c.send('Fetch.disable');c.ws.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
