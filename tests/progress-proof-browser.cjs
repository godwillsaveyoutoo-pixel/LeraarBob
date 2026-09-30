const assert=require('node:assert/strict'),fs=require('node:fs'),{CDP}=require('./helpers/online-cdp.cjs');
const base='http://127.0.0.1:8775/',sh="document.querySelector('leraarbob-topbar')?.shadowRoot";
const overview={games:[{game_id:'rechten-trainer',updated_at:'2026-09-30T01:00:00Z',state:{rechtenV2:{platformXp:35,missions:{point:{world:'puntenbaai',completed:true},delta:{world:'hellingrug',completed:false}}}}},{game_id:'vectoren-trainer',state:{storage:{'axioma-vectorentrainer-v020':JSON.stringify({progress:{xp:120}})},completed:['point'],total:24}},{game_id:'gravity-maze',state:{completed:[1,2],total:9}}],trainer:{state:{xp:90,total:12,correct:8}}};
(async()=>{
 const browser=new CDP(),v=await(await fetch('http://127.0.0.1:9245/json/version')).json();await browser.connect(v.webSocketDebuggerUrl);const {browserContextId}=await browser.send('Target.createBrowserContext');const tabs=[];
 async function open(path='index.html'){
  const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});const c=new CDP();tabs.push(c);await c.connect('ws://127.0.0.1:9245/devtools/page/'+targetId);await c.send('Page.enable');await c.send('Runtime.enable');await c.size(1366,850);
  c.route=async p=>{const u=new URL(p.request.url),fulfill=body=>c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(body).toString('base64')});
   if(u.pathname.endsWith('/axioma-social.js'))return fulfill('');
   if(u.pathname.endsWith('/axioma-auth.js'))return fulfill(`(()=>{
    let account={id:'proof-student',role:'student',alias:'muis',class_code:'4TMW'},listeners=new Set();const rows=${JSON.stringify(overview)};
    window.proofCalls=[];window.proofFail=false;window.proofDelay=0;
    const client={from(table){const filters={};let single=false;const q={select(){return q},eq(k,v){filters[k]=v;return q},maybeSingle(){single=true;return q},abortSignal(){return q},then(resolve){proofCalls.push({table,filters});const data=account?.id==='proof-student'?(table==='axioma_progress'?rows.trainer:single?rows.games.find(g=>g.game_id===filters.game_id)||null:rows.games):single?null:[];setTimeout(()=>resolve(proofFail?{error:Error('Offline')}:{data}),proofDelay);}};return q},rpc(){return Promise.resolve({data:[]});}};
    window.AxiomaAuth={CLASSES:['4TMW'],ready:async()=>({account}),getAccount:async()=>account,getSession:async()=>({user:account}),onChange:fn=>{listeners.add(fn);return()=>listeners.delete(fn)},client:()=>client};
    window.proofSwitch=()=>{account={id:'other',role:'student',alias:'ander',class_code:'4TMW'};listeners.forEach(fn=>fn({account}));};
    window.proofDownloads=[];HTMLAnchorElement.prototype.click=function(){if(this.download){proofDownloads.push({url:this.href,name:this.download});}else HTMLElement.prototype.click.call(this);};
   })();`);
   if(u.origin!==new URL(base).origin)return fulfill('');return c.send('Fetch.continueRequest',{requestId:p.requestId});
  };await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});await c.send('Page.navigate',{url:base+path});await c.wait(sh+".querySelector('.account-label')?.textContent==='muis'");return c;
 }
 async function picker(c){await c.eval(sh+".querySelector('.account').click()");await c.wait('document.getElementById("downloadProgressBtn")');await c.click('downloadProgressBtn');await c.wait('document.getElementById("proofDownload")&&!document.getElementById("proofDownload").disabled');}
 try{
  const c=await open();await picker(c);assert.match(await c.eval('document.getElementById("proofSummary").textContent'),/4 spellen · 245 XP/);
  for(const [w,h,mode] of [[320,568,'light'],[390,844,'dark'],[844,390,'dark'],[1366,850,'light']]){
   await c.size(w,h);await c.eval(`document.documentElement.dataset.mode='${mode}'`);await new Promise(r=>setTimeout(r,80));
   assert.equal(await c.eval('document.getElementById("authContent").scrollWidth<=document.getElementById("authContent").clientWidth'),true);
   assert(await c.eval('[...document.querySelectorAll(".progress-proof-form button,.progress-proof-form input,.progress-proof-form select")].filter(e=>e.getClientRects().length).every(e=>e.getBoundingClientRect().height>=44)'));
   await c.eval('document.getElementById("proofDownload").scrollIntoView({block:"nearest",behavior:"instant"})');await c.shot("progress-proof-layout");assert(await c.eval('document.getElementById("proofDownload").getBoundingClientRect().bottom<=innerHeight+1'),JSON.stringify({w,h,rect:await c.eval('document.getElementById("proofDownload").getBoundingClientRect().toJSON()')}));await c.shot('progress-proof-form-'+w);
  }
  await c.eval('document.getElementById("proofName").value="Élodie D’Haene"');await c.click('proofDownload');await c.wait('proofDownloads.length===1');
  const receipt=await c.eval('proofDownloads[0]');assert.match(receipt.name,/Elodie-D-Haene.*\.pdf$/);
  const bytes=await c.eval('(async()=>Array.from(new Uint8Array(await(await fetch(proofDownloads[0].url)).arrayBuffer())))()');fs.writeFileSync('/tmp/leraarbob-progress-proof.pdf',Buffer.from(bytes));assert(Buffer.from(bytes).subarray(0,8).toString().startsWith('%PDF-1.4'));
  assert.equal(await c.eval('Object.values(localStorage).some(v=>v.includes("Élodie"))'),false);
  assert.equal(await c.eval('JSON.stringify(proofCalls).includes("Élodie")'),false);
  await c.eval('document.getElementById("proofGame").value="rechtenwereld";document.getElementById("proofGame").dispatchEvent(new Event("change"))');assert.match(await c.eval('document.getElementById("proofSummary").textContent'),/1 spel · 35 XP/);
  await c.eval('proofFail=true');await c.click('proofDownload');await c.wait('document.getElementById("proofMessage").dataset.error==="true"');assert.equal(await c.eval('proofDownloads.length'),1);assert.match(await c.eval('document.getElementById("proofMessage").textContent'),/niet volledig/);
  await c.eval('proofFail=false');await c.click('proofDownload');await c.wait('proofDownloads.length===2');
  await c.eval('localStorage.setItem("axioma:rechten:v2:"+encodeURIComponent(AXIOMA_CONFIG.url)+":student:proof-student",JSON.stringify({dirty:true}))');await c.click('proofDownload');await c.wait('document.getElementById("proofMessage").textContent.includes("Synchroniseer eerst")');assert.equal(await c.eval('proofDownloads.length'),2);
  await c.eval('localStorage.removeItem("axioma:rechten:v2:"+encodeURIComponent(AXIOMA_CONFIG.url)+":student:proof-student")');
  await c.eval('proofDelay=350');await c.click('proofDownload');await c.click('authClose');await new Promise(r=>setTimeout(r,700));assert.equal(await c.eval('proofDownloads.length'),2);
  await c.eval('proofDelay=0');await picker(c);assert.equal(await c.eval('document.getElementById("proofName").value'),'');await c.eval('proofDelay=350');await c.click('proofDownload');await c.eval('proofSwitch()');await new Promise(r=>setTimeout(r,700));assert.equal(await c.eval('proofDownloads.length'),2);assert.equal(await c.eval('document.getElementById("proofName")'),null);
  // Embedded game profiles use the same form and assets resolved from site root.
  for(const path of ['games/gravity/','games/vectoren/classroom.html']){const game=await open(path);await picker(game);assert.match(await game.eval('document.getElementById("proofSummary").textContent'),/245 XP/);await game.size(390,844);await game.shot('progress-proof-embedded-'+(path.includes('gravity')?'gravity':'vector'));await game.click('proofBack');assert(await game.eval('!!document.getElementById("downloadProgressBtn")'));}
  for(const tab of tabs)assert.deepEqual(tab.errors,[]);
  console.log('PASS: PDF download, name privacy, game choice, exact XP, 4 screen sizes/light-dark, embedded profiles, load errors/retry, pending saves, cancel/account switch');
 }finally{await browser.send('Target.disposeBrowserContext',{browserContextId});tabs.forEach(c=>c.ws.close());browser.ws.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
