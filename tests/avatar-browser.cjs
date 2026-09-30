// Real account/topbar UI, synthetic accounts and storage; no live profiles are changed.
const assert=require('node:assert/strict'),{CDP}=require('./helpers/online-cdp.cjs');
const fs=require('node:fs');
const base='http://127.0.0.1:8775/',saved=new Map(),contexts=[],tabs=[];
(async()=>{const browser=new CDP(),v=await(await fetch('http://127.0.0.1:9245/json/version')).json();await browser.connect(v.webSocketDebuggerUrl);
async function open(role,path='index.html'){
 const {browserContextId}=await browser.send('Target.createBrowserContext');contexts.push(browserContextId);const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});const c=new CDP();await c.connect('ws://127.0.0.1:9245/devtools/page/'+targetId);tabs.push(c);c.role=role;await c.send('Page.enable');await c.send('Runtime.enable');
 c.route=async p=>{const u=new URL(p.request.url),fulfill=(body,type='application/javascript',status=200)=>c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:type}],body:Buffer.from(body).toString('base64')});
  if(u.pathname.endsWith('/axioma-social.js'))return fulfill('');
  if(u.pathname==='/avatar-test-save'){if(c.fail){c.fail=false;return fulfill('{}','application/json',503);}const a=JSON.parse(p.request.postData);saved.set(c.role,a.avatar_id);return fulfill(JSON.stringify({avatar_id:a.avatar_id}),'application/json');}
  if(u.pathname.endsWith('/axioma-auth.js'))return fulfill(`(()=>{
   let account=${JSON.stringify(role?{id:role,role,alias:role==='student'?'Luna':undefined,email:role==='teacher'?'teacher@example.invalid':undefined,class_code:'3TMW',avatar_id:saved.get(role)||null}:null)},listeners=new Set();
   const emit=()=>listeners.forEach(fn=>fn({account,pending:false}));
   const client={rpc:()=>{const p=Promise.resolve({data:[],error:null});p.abortSignal=()=>p;return p;},from(name){let q;return q=new Proxy({then:resolve=>resolve({data:name==='axioma_profiles'?{user_id:account?.id,alias:account?.alias}:null,error:null})},{get:(o,k)=>k==='then'?o.then:()=>q});}};
   window.AxiomaAuth={CLASSES:['3TMW'],ready:async()=>({account}),getAccount:async()=>account,getSession:async()=>account?{user:account}:null,onChange:fn=>{listeners.add(fn);return()=>listeners.delete(fn)},client:()=>client,async setAvatar(id){const r=await fetch('/avatar-test-save',{method:'POST',body:JSON.stringify({avatar_id:id})});if(!r.ok)throw Error('offline');account={...account,avatar_id:(await r.json()).avatar_id};emit();return account;},signOut:async()=>{account=null;emit();}};
   window.testSwitch=next=>{account=next;emit();};
  })();`);
  if(u.hostname!=='127.0.0.1')return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'});
  return c.send('Fetch.continueRequest',{requestId:p.requestId});
 };await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});await c.size(1366,850);await c.send('Page.navigate',{url:base+path});await c.wait("document.querySelector('leraarbob-topbar')?.shadowRoot.querySelector('.account-label')?.textContent==="+JSON.stringify(role==='teacher'?'Leerkracht':role==='student'?'Luna':'Inloggen'));return c;
}
const sh="document.querySelector('leraarbob-topbar')?.shadowRoot";
async function picker(c){await c.eval(sh+".querySelector('.account').click()");await c.wait("document.getElementById('changeAvatar')");await c.click('changeAvatar');await c.wait("document.getElementById('avatarGrid').children.length===24");}
try{
 const c=await open('teacher');await picker(c);
 await c.eval("document.querySelector('[data-avatar-id=fox][aria-pressed]').click()");assert.equal(await c.eval(sh+".querySelector('.learner-avatar').dataset.avatarId||null"),null,'draft stays out of topbar');await c.click('cancelAvatar');assert.equal(saved.size,0);
 await c.click('changeAvatar');await c.eval("document.querySelector('[data-avatar-id=owl][aria-pressed]').click()");c.fail=true;await c.click('saveAvatar');await c.wait("document.getElementById('avatarMessage').textContent.includes('lukte niet')");assert.equal(saved.size,0);await c.click('saveAvatar');await c.wait(sh+".querySelector('.learner-avatar').dataset.avatarId==='owl'");assert.equal(await c.eval("document.getElementById('authOverlay').hidden"),false);await c.shot('avatar-teacher-saved');
 await c.click('authClose');await c.send('Page.reload');await c.wait(sh+".querySelector('.learner-avatar')?.dataset.avatarId==='owl'");
 const another=await open('teacher','teacher/index.html');assert.equal(await another.eval(sh+".querySelector('.learner-avatar').dataset.avatarId"),'owl');await picker(another);await another.shot('avatar-teacher-picker');
 for(const [width,height] of [[390,844],[320,568],[844,390]]){
  await another.size(width,height);await new Promise(r=>setTimeout(r,100));
  assert.equal(await another.eval('document.documentElement.scrollWidth<=innerWidth'),true,'page width '+width);
  assert.equal(await another.eval("document.getElementById('authOverlay').scrollWidth<=document.getElementById('authOverlay').clientWidth"),true,'dialog width '+width);
  assert.equal(await another.eval("[...document.querySelectorAll('#avatarGrid button')].every(b=>b.getBoundingClientRect().width>=44&&b.getBoundingClientRect().height>=44)"),true);
  assert.equal(await another.eval("document.getElementById('saveAvatar').getBoundingClientRect().bottom<=innerHeight"),true,'save visible '+width);await another.shot('avatar-picker-'+width);
 }
 await another.click('cancelAvatar');await another.click('authClose');await another.size(390,844);assert.equal(await another.eval(sh+".querySelector('.learner-avatar').getBoundingClientRect().width"),30);assert.equal(await another.eval(sh+".querySelector('.account').getBoundingClientRect().height>=44"),true);await another.shot('avatar-topbar-390');
 await another.eval(sh+".querySelector('.collapse').click()");await another.send('Page.reload');await another.wait("document.querySelector('.lb-restore')&&!document.querySelector('.lb-restore').hidden");await another.eval("document.querySelector('.lb-restore').click()");await another.wait(sh+".querySelector('.learner-avatar')?.dataset.avatarId==='owl'");
 const catalog=JSON.parse(fs.readFileSync('games.json'));const paths=['games/vectoren/classroom.html',...['vectoren-trainer','rechten-trainer','wortelbouw','algebra-trainer','gravity-maze'].map(id=>catalog.find(g=>g.id===id)?.href).filter(Boolean)];
 for(const path of paths){const game=await open('teacher',path);await picker(game);await game.eval("document.querySelector('[data-avatar-id=fox][aria-pressed]').click()");await game.click('saveAvatar');await game.wait(sh+".querySelector('.learner-avatar').dataset.avatarId==='fox'");assert.equal(await game.eval("document.getElementById('authOverlay').hidden"),false,'embedded update keeps account open '+path);await game.click('authClose');if(await game.eval('!!window.AxiomaGame'))assert.notEqual(await game.eval('AxiomaGame.status'),'changed');}
 const student=await open('student');await picker(student);await student.eval("document.querySelector('[data-avatar-id=lion][aria-pressed]').click()");await student.click('saveAvatar');await student.wait(sh+".querySelector('.learner-avatar').dataset.avatarId==='lion'");assert.equal(saved.get('teacher'),'fox');await student.click('changeAvatar');await student.click('clearAvatar');await student.click('saveAvatar');await student.wait(sh+".querySelector('.learner-avatar').textContent==='LU'");
 await student.eval("testSwitch({id:'other',role:'student',alias:'Nova',avatar_id:'https://untrusted.invalid/evil'})");await student.wait(sh+".querySelector('.learner-avatar').textContent==='NO'");assert.equal(await student.eval(sh+".querySelector('.learner-avatar').style.backgroundImage"),'');
 for(const tab of tabs)assert.deepEqual(tab.errors,[]);
 console.log('PASS 24 avatars: teacher/student selection, cancel, save failure/retry, reload/second device, small topbar, account isolation, invalid URL fallback, 3 compact sizes/collapse and active game integration');
}finally{for(const id of contexts)await browser.send('Target.disposeBrowserContext',{browserContextId:id});for(const c of tabs)c.ws.close();browser.ws.close();}})().catch(e=>{console.error(e);process.exitCode=1});
