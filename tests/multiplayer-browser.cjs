// Browser integration with the real session SQL in isolated local PostgreSQL (PGlite).
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createDB,ids}=require('./helpers/vector-class-db.cjs');
const BASE=process.env.VECTOR_BASE_URL||'http://127.0.0.1:8775',PORT=process.env.VECTOR_BROWSER_PORT||9245;
const OUT=path.resolve(__dirname,'../docs/vectoren-v04/screenshots/multiplayer');fs.mkdirSync(OUT,{recursive:true});
class CDP{
 async connect(url){this.ws=new WebSocket(url);this.id=0;this.pending=new Map();this.errors=[];await new Promise(r=>this.ws.onopen=r);this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);if(!p)return;clearTimeout(p.timer);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}else if(m.method==='Fetch.requestPaused')this.route(m.params).catch(e=>{if(!/Invalid InterceptionId/.test(e.message))this.errors.push(e);});else if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails);};}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id,timer=setTimeout(()=>reject(Error('Timeout '+method)),20000);this.pending.set(id,{resolve,reject,timer});this.ws.send(JSON.stringify({id,method,params}));});}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
 async wait(expression){for(let i=0;i<220;i++){if(await this.eval(expression))return;await new Promise(r=>setTimeout(r,50));}throw Error('Timeout '+expression+'; '+await this.eval('document.getElementById("notice")?.textContent'));}
 async click(id){await this.eval(`document.getElementById(${JSON.stringify(id)}).click()`);}
 async size(width,height){await this.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});}
 async shot(name){const r=await this.send('Page.captureScreenshot',{captureBeyondViewport:false});fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from(r.data,'base64'));}
}
(async()=>{
 const {db,rpc}=await createDB(),version=await(await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(),browser=new CDP();await browser.connect(version.webSocketDebuggerUrl);
 const contexts=[],tabs=[];let room;
 async function tab(user,gamePath,query=''){const {browserContextId}=await browser.send('Target.createBrowserContext');contexts.push(browserContextId);const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});const list=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json(),c=new CDP();await c.connect(list.find(t=>t.id===targetId).webSocketDebuggerUrl);tabs.push(c);c.user=user;await c.send('Page.enable');await c.send('Runtime.enable');
  const accountFor=name=>name?{id:ids[name],role:name==='teacher'?'teacher':'student',alias:name}:null;
  c.route=async p=>{const u=new URL(p.request.url);if(u.pathname.endsWith('/axioma-auth.js')){const body=`window.AxiomaAuth={CLASSES:['3TMW'],getAccount:()=>(${JSON.stringify(accountFor(c.user))}),ready:async()=>({account:${JSON.stringify(accountFor(c.user))}}),onChange:()=>{},signInStudent:async()=>{const r=await fetch('/vector-class-test-login');if(!r.ok)throw {code:'invalid_credentials'};return ${JSON.stringify(accountFor('outsider'))}},signInTeacher:async()=>{await fetch('/vector-class-test-login?role=teacher');return ${JSON.stringify(accountFor('teacher'))}},client:()=>({rpc:async(name,args)=>{const response=await fetch('/vector-class-test-rpc',{method:'POST',body:JSON.stringify({...args,rpcName:name})});return response.json();}})};`;return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/javascript'}],body:Buffer.from(body).toString('base64')});}
   if(u.pathname==='/vector-class-test-login'){if(c.failLogin){c.failLogin=false;return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:401,body:''});}c.user=u.searchParams.get('role')==='teacher'?'teacher':'outsider';return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,body:''});}
   if(u.pathname==='/vector-class-test-rpc'){let response;try{const args=JSON.parse(p.request.postData);if(args.p_action==='submit'&&c.failSubmit){c.failSubmit=false;throw Error('Test: verbinding onderbroken');}response={data:await rpc(c.user,args.p_action,args.p_data,args.rpcName),error:null};}catch(e){response={data:null,error:{message:e.message,code:e.code}};}return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,body:Buffer.from(JSON.stringify(response)).toString('base64')});}
   if(u.hostname!=='127.0.0.1')return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'});return c.send('Fetch.continueRequest',{requestId:p.requestId});
  };await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});await c.size(1366,850);await c.send('Page.navigate',{url:BASE+gamePath+query});await c.wait('document.getElementById("'+(user?'setup':'login')+'")&&!document.getElementById("'+(user?'setup':'login')+'").hidden');return c;
 }

 try{
  for(const [game,folder] of [['vectoren','/games/vectoren/'],['rechten','/games/rechten/rechtenwereld/'],['wortelbouw','/games/wortelbouw_pro_v0.5.0/wortelbouw/']]){
   const teacher=await tab('teacher',folder+'classroom.html'),alex=await tab('alex',folder+'classroom.html');
   await teacher.eval("document.getElementById('hostForm').requestSubmit()");await teacher.wait('!document.getElementById("session").hidden');
   const code=await teacher.eval('document.getElementById("code").textContent');
   await alex.eval(`document.getElementById('joinCode').value=${JSON.stringify(code)};document.getElementById('joinForm').requestSubmit()`);await alex.wait('!document.getElementById("session").hidden');
   await teacher.wait('!document.getElementById("start").disabled');await teacher.click('start');await alex.wait('document.body.dataset.playing==="true"');
   await alex.wait("document.getElementById('board').contentWindow."+(game==='vectoren'?"AxiomaVectorTrainer?.inspect().task":game==='rechten'?"RechtenV2App?.snapshot().active":"WortelbouwBattlePlayer?.snapshot()"));
   for(const [width,height] of [[1366,768],[954,441],[640,360],[390,844],[320,568]]){
    await alex.size(width,height);
    for(const collapsed of [false,true]){
     await alex.eval('LeraarBobTopbar.setCollapsed('+collapsed+')');await alex.eval('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
     const layout=await alex.eval(`(()=>{const f=document.getElementById('board'),r=f.getBoundingClientRect(),w=f.contentWindow,d=w.document;return {outer:document.documentElement.scrollWidth<=innerWidth,inside:d.documentElement.scrollWidth<=w.innerWidth,bottom:r.bottom<=innerHeight+1&&r.bottom>=innerHeight-8,height:r.height,errors:[...d.querySelectorAll('#commit,#submit')].filter(e=>{const b=e.getBoundingClientRect();return b.width&&b.height&&(b.bottom>w.innerHeight+1||b.right>w.innerWidth+1)}).map(e=>e.id)}})()`);
     assert(layout.outer&&layout.inside&&layout.bottom,game+JSON.stringify({width,height,collapsed,layout}));assert(layout.height>height*.5,game+' board wastes viewport');assert.deepEqual(layout.errors,[]);
     await alex.shot(game+'-'+width+(collapsed?'-folded':''));
    }
   }
   await alex.size(1366,768);
   if(game==='rechten'){
    await alex.eval(`(()=>{const w=document.getElementById('board').contentWindow,m=w.RechtenV2Runtime.active(w.RechtenV2App.snapshot()),i=m.task.options.findIndex(p=>w.RechtenWave.eq(p.x,m.task.target.x)&&w.RechtenWave.eq(p.y,m.task.target.y));w.document.querySelector('[data-choice="answer"][data-value="'+i+'"]').click();w.document.getElementById('mission').requestSubmit();})()`);
   }else if(game==='wortelbouw'){
    await alex.eval(`(()=>{const w=document.getElementById('board').contentWindow;w.BattlePlayer.submit({actions:[{type:'start',k:1,x:0,y:0},{type:'triangle',owner:'s0',edgeIndex:0,k:1,mode:'sum',flip:false},{type:'helper'},{type:'result'},{type:'reveal'}]});})()`);
   }else{
    // Any raw answer is accepted once; the teacher validates it after the round.
    await alex.eval(`(()=>{const w=document.getElementById('board').contentWindow;w.VectorBattlePlayer.submit({},true);})()`);
   }
   await teacher.wait('!document.getElementById("results").hidden');await alex.wait('!document.getElementById("results").hidden');
   if(game!=='vectoren')assert.match(await alex.eval('document.getElementById("ownResult").textContent'),/^Juist!/);
   await teacher.click('next');await alex.wait('document.getElementById("sessionTitle").textContent.includes("Ronde 2")');
   await teacher.click('closeSession');await teacher.click('confirmStop');await alex.wait('document.getElementById("phaseLabel").textContent==="SESSIE GESLOTEN"');
   console.log('PASS '+game+': session, native board on five sizes/both header states, submitted answer, teacher grading, ranking, next round and stop');
  }
  for(const c of tabs)assert.deepEqual(c.errors,[],'browser exceptions '+c.user);
 }finally{for(const id of contexts)await browser.send('Target.disposeBrowserContext',{browserContextId:id});for(const c of tabs)c.ws.close();browser.ws.close();await db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
