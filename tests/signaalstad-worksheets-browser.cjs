const assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process'),{CDP}=require('./helpers/online-cdp.cjs');
const BASE='http://127.0.0.1:8775',OUT='/tmp/leraarbob-signaalstad-worksheets';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const browser=new CDP(),c=new CDP();let context;try{
 await browser.connect((await(await fetch('http://127.0.0.1:9245/json/version')).json()).webSocketDebuggerUrl);
 context=(await browser.send('Target.createBrowserContext')).browserContextId;
 const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId:context});
 const target=(await(await fetch('http://127.0.0.1:9245/json')).json()).find(t=>t.id===targetId);await c.connect(target.webSocketDebuggerUrl);await c.send('Page.enable');await c.send('Runtime.enable');
 c.route=async p=>{const u=new URL(p.request.url),finish=s=>c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/javascript'}],body:Buffer.from(s).toString('base64')});
  if(u.pathname.endsWith('/axioma-auth.js'))return finish(`(()=>{const account=${c.guest?'null':JSON.stringify({id:'paper-test',role:'student',alias:'Papierproef'})};window.AxiomaAuth={ready:async()=>({account}),onChange:()=>()=>{},getAccount:async()=>account,getSession:async()=>null};})()`);
  if(u.pathname.endsWith('/axioma-progress.js'))return finish(`window.AxiomaProgress={load:async()=>({state:{rechtenV2:{schema:1,platformXp:70,missions:{}}}}),save:()=>{throw Error('Werkbladen mogen geen voortgang schrijven')}}`);
  if(u.pathname.endsWith('/axioma-social.js'))return finish('window.AxiomaSocial={state:()=>({}),onChange:()=>()=>{}}');
  if(u.hostname!=='127.0.0.1')return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'});
  return c.send('Fetch.continueRequest',{requestId:p.requestId});
 };
 await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 await c.send('Page.addScriptToEvaluateOnNewDocument',{source:`if(!localStorage.getItem('leraarbob.worksheets.signaalstad.v1'))localStorage.setItem('leraarbob.worksheets.signaalstad.v1',JSON.stringify({version:1,config:{seed:17,count:8,mode:'progressive'},kind:'questions'}));localStorage.setItem('worksheet-test:existing-progress','unchanged');window.print=()=>{window.printCalls=(window.printCalls||0)+1}`});
 await c.size(1366,900);await c.send('Page.navigate',{url:BASE+'/games/rechten/rechtenwereld/worksheets.html?world=signaalstad'});await c.wait('window.SignaalstadWorksheetApp&&window.LeraarBobTopbar');await c.wait("document.querySelector('[data-platform-progress]')?.dataset.value==='70'");
 const original=await c.eval('JSON.stringify(SignaalstadWorksheetApp.snapshot().doc)');
 // Measure full physical pages for every support mode and longest text cases.
 const defects=await c.eval(`(()=>{const bad=[];for(const mode of ['guided','progressive','independent'])for(const types of [undefined,...SignaalstadWorksheet.types.map(t=>[t.id])])for(const kind of ['questions','key']){
  const doc=SignaalstadWorksheet.generate({seed:93,count:24,mode,types}),holder=document.createElement('div');holder.style='position:absolute;left:-10000px;top:0';holder.innerHTML=SignaalstadWorksheetView.render(doc,kind).html;document.body.append(holder);
  for(const page of holder.children){const content=page.querySelector('.sheet-content').getBoundingClientRect(),footer=page.querySelector('.sheet-footer').getBoundingClientRect();if(content.bottom>footer.top+1)bad.push({mode,types,kind,error:'footer overlap'});
   for(const q of page.querySelectorAll('.worksheet-question')){const r=q.getBoundingClientRect(),body=q.querySelector('.question-body').getBoundingClientRect();if(body.bottom>r.bottom+1||q.scrollWidth>q.clientWidth+1)bad.push({mode,types,kind,n:q.dataset.question,overflow:body.bottom-r.bottom,horizontal:q.scrollWidth-q.clientWidth})}
  }holder.remove();}return bad})()`);
 assert.deepEqual(defects,[],'physical page overflow');
 // Actual paginated PDFs, with sharp vector grids and a separate answer document.
 for(const kind of ['questions','key']){
  await c.click(kind==='questions'?'showQuestions':'showKey');
  await c.send('Emulation.setEmulatedMedia',{media:'print'});
  const pages=await c.eval("document.querySelectorAll('.worksheet-page').length");
  const pdf=await c.send('Page.printToPDF',{preferCSSPageSize:true,printBackground:true,displayHeaderFooter:false});
  const path=OUT+'/'+(kind==='key'?'Signaalstad-verbetersleutel.pdf':'Signaalstad-oefenblad.pdf');fs.writeFileSync(path,Buffer.from(pdf.data,'base64'));
  const info=execFileSync('pdfinfo',[path],{encoding:'utf8'});assert.equal(Number(info.match(/Pages:\s+(\d+)/)[1]),pages,'no blank or split PDF pages');assert.match(info,/A4/);
  const txt=execFileSync('pdftotext',[path,'-'],{encoding:'utf8'});assert.match(txt,/Signaalstad/);assert.match(txt,/SS1-/);assert(!txt.includes('Maak een nieuwe reeks'),'no app UI in PDF');
  if(kind==='key')assert(txt.includes('elk tweetal'),'different point choices accepted');
  await c.send('Emulation.setEmulatedMedia',{media:''});
 }
 await c.click('showQuestions');
 for(const [w,h] of [[1366,900],[780,360],[390,844],[320,568]])for(const folded of [false,true]){
  await c.size(w,h);await c.eval(`LeraarBobTopbar.setCollapsed(${folded});scrollTo(0,0);new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
  assert(await c.eval('document.documentElement.scrollWidth<=innerWidth'),'no sideways page scroll '+w);
  assert.equal(await c.eval('JSON.stringify(SignaalstadWorksheetApp.snapshot().doc)'),original,'collapse retains questions');
  if(folded){const pos=await c.eval(`(()=>{const b=document.querySelector('.lb-restore'),r=b.getBoundingClientRect();return {w:r.width,h:r.height,top:r.top,right:r.right,expanded:b.getAttribute('aria-expanded'),hit:b.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}})()`);assert(pos.w>=44&&pos.h>=44&&pos.right<=w&&pos.top>=0&&pos.hit);assert.equal(pos.expanded,'false')}
  await c.eval("document.getElementById('printWorksheet').scrollIntoView({block:'center'})");
  const hit=await c.eval(`(()=>{const e=document.getElementById('printWorksheet'),r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width,h:r.height,hit:e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}})()`);assert(hit.w>=44&&hit.h>=44&&hit.hit,'print reachable '+w);
  await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x:hit.x,y:hit.y,button:'left',clickCount:1});await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:hit.x,y:hit.y,button:'left',clickCount:1});
  await c.eval('scrollTo(0,0)');await c.shot('signaalstad-worksheet-'+w+'-'+folded);
 }
 assert.equal(await c.eval('window.printCalls'),8);
 await c.send('Page.reload');await c.wait('window.SignaalstadWorksheetApp&&window.LeraarBobTopbar');assert.equal(await c.eval('JSON.stringify(SignaalstadWorksheetApp.snapshot().doc)'),original);assert(await c.eval("!document.querySelector('.lb-restore').hidden"));await c.eval("document.querySelector('.lb-restore').click()");assert(await c.eval("document.querySelector('.lb-restore').hidden"));
 await c.eval("document.getElementById('worksheetMode').value='independent';document.getElementById('worksheetMode').dispatchEvent(new Event('change',{bubbles:true}))");assert(await c.eval("document.getElementById('printWorksheet').disabled"));await c.click('showKey');assert(await c.eval("document.getElementById('printWorksheet').disabled"));
 await c.eval("document.getElementById('worksheetForm').requestSubmit()");assert(await c.eval('SignaalstadWorksheetApp.snapshot().doc.tasks.every(t=>!t.guided)'));assert.notEqual(await c.eval('JSON.stringify(SignaalstadWorksheetApp.snapshot().doc)'),original);
 await c.eval("document.querySelectorAll('#worksheetTypes input').forEach(i=>i.checked=false);document.getElementById('worksheetForm').requestSubmit()");assert.match(await c.eval("document.getElementById('worksheetNotice').textContent"),/minstens één/);
 assert.equal(await c.eval("localStorage.getItem('worksheet-test:existing-progress')"),'unchanged');assert.equal(await c.eval("document.querySelector('[data-platform-progress]').dataset.value"),'70');assert.deepEqual(c.errors,[]);

 // Reach the worksheet from the real Signaalstad map, including compact screens.
 console.log('PASS Signaalstad: A4, key, 12 layout cases, 4 screen sizes, both header states, reload and print. PDFs: '+OUT);
}finally{if(context)await browser.send('Target.disposeBrowserContext',{browserContextId:context});c.ws?.close();browser.ws?.close()}})().catch(e=>{console.error(e);process.exitCode=1});
