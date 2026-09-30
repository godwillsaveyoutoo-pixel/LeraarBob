const assert=require('node:assert/strict'),{CDP}=require('./helpers/online-cdp.cjs');
const C=require('../games/vectoren/vector-core.js');
(async()=>{const browser=new CDP(),v=await(await fetch('http://127.0.0.1:9245/json/version')).json();await browser.connect(v.webSocketDebuggerUrl);const {browserContextId}=await browser.send('Target.createBrowserContext');let c;
try{const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});const pages=await(await fetch('http://127.0.0.1:9245/json')).json();c=new CDP();await c.connect(pages.find(p=>p.id===targetId).webSocketDebuggerUrl);await c.send('Page.enable');await c.send('Runtime.enable');
 c.route=async p=>{if(p.request.url.endsWith('/vector-workboard-test'))return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/html'}],body:Buffer.from('<!doctype html><html><body style="margin:0"><iframe id="frame" style="border:0;width:100vw;height:100dvh;display:block" src="/games/vectoren/battle-player.html?mode=class"></iframe></body></html>').toString('base64')});return c.send('Fetch.continueRequest',{requestId:p.requestId});};await c.send('Fetch.enable',{patterns:[{urlPattern:'*vector-workboard-test'}]});await c.send('Page.navigate',{url:'http://127.0.0.1:8775/vector-workboard-test'});
 await c.wait("document.getElementById('frame')?.contentWindow.AxiomaVectorTrainer");
 const inner=code=>c.eval(`(()=>{const w=document.getElementById('frame').contentWindow,d=w.document;${code}})()`);
 let index=0;
 for(const [width,height] of [[390,640],[320,490],[844,280]]){await c.size(width,height);for(const skill of C.TaskGenerator.skills){
  const question={type:'vector-battle-question',match:'test',index:++index,skill:skill.id,seed:17,variant:1,singleAttempt:true};
  await c.eval(`document.getElementById('frame').contentWindow.postMessage(${JSON.stringify(question)},location.origin)`);await c.wait(`document.getElementById('frame').contentWindow.AxiomaVectorTrainer.inspect().task?.skill==='${skill.id}'`);
  await new Promise(r=>setTimeout(r,40));
  const metrics=await inner(`const visible=n=>n.getBoundingClientRect().width>0&&n.getBoundingClientRect().height>0&&!n.closest('[hidden]');return {overflow:d.documentElement.scrollWidth>w.innerWidth,buttons:[...d.querySelectorAll('#play button')].filter(visible).filter(n=>!n.disabled).map(n=>({id:n.id||n.textContent,rect:(()=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom,right:r.right}})()}))};`);
  assert.equal(metrics.overflow,false,skill.id+' overflow '+width);
  for(const b of metrics.buttons){assert(b.rect.h>=43.5&&b.rect.w>=43.5,skill.id+' small target '+JSON.stringify(b));assert(b.rect.b<=height+1&&b.rect.x>=-1&&b.rect.right<=width+1,skill.id+' off-screen '+JSON.stringify(b)+' '+width+'x'+height);}
  if(skill.id==='equal'){
   await inner("d.querySelector('.choice-answer').click();");const classes=await inner("return d.querySelector('.choice-answer').className");assert(!/correct|incorrect/.test(classes));assert.match(classes,/selected/);assert.equal(await inner("return d.querySelector('.choice-answer').getBoundingClientRect().height>=44"),true,'submitted choice stays visible');
  }
  if(['equal','coords','decompose','coordcombo'].includes(skill.id))await c.shot('vector-'+skill.id+'-'+width);
  await c.eval(`document.getElementById('frame').contentWindow.postMessage({type:'vector-class-review',match:'test',index:${index}},location.origin)`);
  await c.wait("document.getElementById('frame').contentWindow.document.body.classList.contains('class-review')");
  assert.equal(await inner("return /NaN|undefined/.test(d.getElementById('lessonPanel').textContent)"),false,skill.id+' review');
 }
 }
 assert.deepEqual(c.errors,[]);console.log('PASS 24 workboards and answer discussions at 390, 320 and landscape widths; neutral choice submission; 44px controls and no horizontal overflow');
}finally{await browser.send('Target.disposeBrowserContext',{browserContextId});c?.ws.close();browser.ws.close();}})().catch(e=>{console.error(e);process.exitCode=1});
