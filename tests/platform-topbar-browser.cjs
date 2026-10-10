// Shared navigation across every active catalog entry, in isolated guest contexts.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const PORT=process.env.VECTOR_BROWSER_PORT||9245,BASE=process.env.VECTOR_BASE_URL||'http://127.0.0.1:8775';
const OUT=path.resolve(process.env.LB_SCREENSHOT_DIR||path.join(__dirname,'../docs/platform-navigation/screenshots'));fs.mkdirSync(OUT,{recursive:true});
class CDP{
 async connect(url){this.ws=new WebSocket(url);this.id=0;this.pending=new Map();this.errors=[];await new Promise(r=>this.ws.onopen=r);this.ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);if(!p)return;clearTimeout(p.timer);this.pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(m.method==='Page.loadEventFired')this.loads=(this.loads||0)+1;else if(m.method==='Runtime.exceptionThrown')this.errors.push(m.params.exceptionDetails);else if(m.method==='Fetch.requestPaused')this.route(m.params).catch(e=>this.errors.push(e.message));};}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id,timer=setTimeout(()=>reject(Error('Timeout '+method)),15000);this.pending.set(id,{resolve,reject,timer});this.ws.send(JSON.stringify({id,method,params}))})}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
 async wait(expr){for(let i=0;i<150;i++){if(await this.eval(expr))return;await new Promise(r=>setTimeout(r,30))}throw Error('Timeout '+expr)}
 async frames(){await this.eval('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')}
 async click(selector,touch=false){const p=await this.eval(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect();if(!r.width||!r.height)throw Error('hidden ${selector}');return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await this.tap(p,touch);await this.frames()}
 async tap(p,touch=false){if(touch){await this.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await this.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}else{await this.send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await this.send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1})}}
 async size(width,height){await this.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await this.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});await this.frames()}
 async shot(name){await this.frames();const r=await this.send('Page.captureScreenshot',{captureBeyondViewport:false});fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from(r.data,'base64'))}
}

(async()=>{
const version=await(await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(),browser=new CDP();await browser.connect(version.webSocketDebuggerUrl);
const items=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../games.json'),'utf8')).map(x=>({title:x.title,href:x.href}));items.unshift({title:'Startpagina',href:'index.html'});items.push(...['battle','canvas','classroom'].map(x=>({title:x,href:'games/vectoren/'+x+'.html'})));
const results=[];
try{for(const item of items.filter(x=>!process.env.LB_PAGES||process.env.LB_PAGES.split(',').includes(x.title))){
 const {browserContextId}=await browser.send('Target.createBrowserContext'),{targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});
 const pages=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json(),c=new CDP();await c.connect(pages.find(t=>t.id===targetId).webSocketDebuggerUrl);await c.send('Page.enable');await c.send('Runtime.enable');
 c.route=async p=>{const u=new URL(p.request.url);if(u.pathname.endsWith('/axioma-auth.js'))return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,body:Buffer.from('window.AxiomaAuth={CLASSES:["3TMW"],ready:async()=>({account:null}),getAccount:async()=>null,onChange:()=>()=>{},configured:()=>true,client:()=>({channel:()=>({on(){return this},subscribe(){return this}}),rpc:async()=>({data:[],error:null})})};').toString('base64')});if(u.hostname!=='127.0.0.1')return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'});return c.send('Fetch.continueRequest',{requestId:p.requestId});};await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 try{await c.size(1366,768);await c.send('Page.navigate',{url:BASE+'/'+item.href});await c.wait('!!document.querySelector("leraarbob-topbar")');await c.frames();
 const metrics=()=>c.eval(`(()=>{const h=document.querySelector('.lb-header'),b=document.querySelector('leraarbob-topbar'),r=b.getBoundingClientRect(),buttons=[...b.shadowRoot.querySelectorAll('.row button,.row a')].filter(e=>e.getClientRects().length),issues=[];if(r.width<100||r.y<0||r.bottom>innerHeight)issues.push('bar outside '+JSON.stringify(r));for(const e of buttons){const q=e.getBoundingClientRect();if(q.right>innerWidth+1||q.left<0)issues.push('outside '+e.className);if(document.elementFromPoint(q.x+q.width/2,q.y+q.height/2)!==b)issues.push('covered '+e.className+' by '+document.elementFromPoint(q.x+q.width/2,q.y+q.height/2)?.outerHTML?.slice(0,160));if(q.height<44)issues.push('small '+e.className+' '+q.height);}const badge=b.shadowRoot.querySelector('.progress');if(badge&&!badge.hidden){const q=badge.getBoundingClientRect(),a=b.shadowRoot.querySelector('.account').getBoundingClientRect();if(q.left<0||q.right>innerWidth||q.right>a.left||Math.abs(q.y+q.height/2-a.y-a.height/2)>2)issues.push('progress not beside account');}return {issues,headerHeight:h.getBoundingClientRect().height,pageWidth:document.documentElement.scrollWidth,screen:innerWidth}})()`);
 assert.equal(await c.eval("document.querySelector('leraarbob-topbar').shadowRoot.querySelector('.fullscreen').getAttribute('aria-pressed')"),'false');assert.equal(await c.eval("document.querySelector('leraarbob-topbar').shadowRoot.querySelector('.settings')===null"),true);const desktop=await metrics();await c.shot('shared-topbar-'+item.title.replace(/[^a-zA-Z]/g,'')+'-desktop');await c.size(390,844);const mobile=await metrics();await c.size(320,568);assert.deepEqual((await metrics()).issues,[],'narrow phone');await c.size(390,844);await c.shot('shared-topbar-'+item.title.replace(/[^a-zA-Z]/g,'')+'-phone');
 // Preserve structured menu labels and inspect the open panel at both sizes.
 for(const [width,height] of [[1366,768],[780,360],[390,844]]){
  await c.size(width,height);await c.eval("document.querySelector('leraarbob-topbar').shadowRoot.querySelector('.menu').click()");await c.frames();
  assert.equal(await c.eval("(()=>{const s=document.querySelector('leraarbob-topbar').shadowRoot,d=s.querySelector('dialog'),r=d.getBoundingClientRect();return d.open&&r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&d.scrollWidth<=d.clientWidth})()"),true);
  const closePosition=await c.eval(`(()=>{const s=document.querySelector('leraarbob-topbar').shadowRoot,b=s.querySelector(getComputedStyle(s.querySelector('.mobile-menu')).display!=='none'?'.mobile-menu':'.menu').getBoundingClientRect(),x=s.querySelector('.close').getBoundingClientRect();return Math.abs(b.x-x.x)<2&&Math.abs(b.y-x.y)<2&&x.width>=44&&x.height>=44})()`);assert(closePosition,'close stays at hamburger position');
  if(item.title==='Rechtenwereld'){
   const names=await c.eval("[...document.querySelector('leraarbob-topbar').shadowRoot.querySelectorAll('.menu-name')].map(e=>e.textContent)");
   for(const name of ['Spelmenu','Spelvoortgang','Samen leren','Online duel','Duo-battle op één toestel','Klasbattle','Spellen','Mijn leerpad'])assert(names.includes(name),name);
   assert.equal(names.filter(n=>n==='Spelvoortgang').length,1);assert(!names.includes('Mijn voortgang'));assert(names.indexOf('Spelmenu')<names.indexOf('Spellen'));
   const headings=await c.eval("[...document.querySelector('leraarbob-topbar').shadowRoot.querySelectorAll('.menu-list h3')].map(e=>e.textContent)");
   for(const heading of ['Huidig spel','Leren','Battles','leraarBob','Account'])assert(headings.includes(heading),heading);
  }
  if(item.href.includes('Axioma_Vectorentrainer')){
   assert.equal(await c.eval("document.querySelector('leraarbob-topbar').shadowRoot.querySelector('[data-source=playBtn] .menu-name').textContent"),'Oefeningenreeks');
   assert.equal(await c.eval("document.querySelector('leraarbob-topbar').shadowRoot.querySelector('[data-source=playBtn] .menu-description').textContent"),'Volg jouw route');
   assert.equal(await c.eval("document.querySelector('leraarbob-topbar').shadowRoot.querySelector('[data-source=playBtn]').closest('section').querySelector('h3').textContent"),'Huidig spel');
   assert.equal(await c.eval("document.querySelector('leraarbob-topbar').shadowRoot.querySelector('[data-source=battleBtn]').closest('section').querySelector('h3').textContent"),'Battles');
  }
  if(item.title==='Wortelbouw'){
   assert.equal(await c.eval("document.querySelector('leraarbob-topbar').shadowRoot.querySelector('[data-source=proLevels] .menu-name').textContent"),'Spelmenu');
   assert.equal(await c.eval("document.querySelector('leraarbob-topbar').shadowRoot.querySelector('[data-source=proLevels]').closest('section').querySelector('h3').textContent"),'Huidig spel');
  }
  await c.shot('shared-menu-'+item.title.replace(/[^a-zA-Z]/g,'')+'-'+width);await c.eval("document.querySelector('leraarbob-topbar').shadowRoot.querySelector('.close').click()");
 }
 // The same hierarchy adapts to account role without duplicating game progress.
 for(const role of ['student','teacher']){
  await c.eval(`dispatchEvent(new CustomEvent('axioma:login-complete',{detail:{account:{id:'test-role',role:'${role}',alias:'Testleerling'}}}));LeraarBobTopbar.openMenu()`);
  const names=await c.eval("[...document.querySelector('leraarbob-topbar').shadowRoot.querySelectorAll('.menu-name')].map(e=>e.textContent)");
  assert(names.includes('Profiel'));
  if(item.href==='index.html'){
   assert.equal(names.filter(x=>x==='Mijn profiel').length,1);assert.equal(names.filter(x=>x==='Instellingen').length,1);
   assert.equal(await c.eval("document.querySelector('leraarbob-topbar').shadowRoot.querySelector('.teacher-link').hidden"),role!=='teacher','Desktop keeps teacher class access in its shared topbar');
  }else{assert.equal(names.includes('Mijn klassen'),role==='teacher');assert.equal(names.filter(x=>x==='Mijn leerpad').length,1);}
  await c.eval("document.querySelector('leraarbob-topbar').shadowRoot.querySelector('.close').click()");
 }
 const start={'Algebra Smederij':'rfHomeStart','Data Check':'homeStart','Signal Lab':'signalHomeStart','Verfwinkel':'vfStart'}[item.title];
 if(start){await c.size(1366,768);await c.click('#'+start);await c.frames();await c.shot('shared-topbar-'+item.title.replace(/[^a-zA-Z]/g,'')+'-play');assert.deepEqual((await metrics()).issues,[]);}
 if(item.title==='Rechtenwereld'){assert.equal(await c.eval("document.getElementById('start-recommended').dataset.zone"),'route');await c.click('#start-recommended');await c.wait("document.querySelector('.area-page leraarbob-topbar')!==null");await c.frames();assert.equal(await c.eval("document.querySelectorAll('leraarbob-topbar').length"),1);assert.match(await c.eval("document.querySelector('leraarbob-topbar').shadowRoot.querySelector('.crumbs').textContent"),/Hellingrug/);await c.eval("document.querySelector('leraarbob-topbar').shadowRoot.querySelector('.crumbs button').click()");await c.wait("!!document.querySelector('.world-page leraarbob-topbar')");}

 await c.eval("document.querySelector('leraarbob-topbar').shadowRoot.querySelector('.collapse').click()");await c.frames();const folded=await c.eval("document.querySelector('.lb-header').getBoundingClientRect().height");{const previous=c.loads||0;await c.send('Page.reload');for(let i=0;i<200&&(c.loads||0)<=previous;i++)await new Promise(r=>setTimeout(r,25));}await c.wait('!!document.querySelector("leraarbob-topbar")');const saved=await c.eval("document.querySelector('.lb-header').classList.contains('lb-collapsed')");await c.eval("document.querySelector('.lb-restore').click()");await c.frames();
 assert.deepEqual(desktop.issues,[]);assert.deepEqual(mobile.issues,[]);assert.equal(folded,0);assert.equal(saved,true);assert.deepEqual(c.errors,[]);results.push({title:item.title,desktop,mobile,folded,saved,errors:c.errors});console.log(JSON.stringify(results.at(-1)));
 }catch(e){results.push({title:item.title,error:e.message,errors:c.errors});console.log(JSON.stringify(results.at(-1)));}finally{await browser.send('Target.disposeBrowserContext',{browserContextId});c.ws.close();}
}}finally{browser.ws.close();fs.writeFileSync(path.resolve(OUT,'../browser-report.json'),JSON.stringify(results,null,2));if(results.some(r=>r.error))process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1});
