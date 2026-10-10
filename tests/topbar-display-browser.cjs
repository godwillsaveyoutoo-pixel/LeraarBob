// Real topbar controls and layout; isolated guest contexts, no live account/network writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),{CDP}=require('./helpers/online-cdp.cjs');
const PORT=process.env.VECTOR_BROWSER_PORT||9245,BASE=process.env.VECTOR_BASE_URL||'http://127.0.0.1:8775';
const sh="document.querySelector('leraarbob-topbar').shadowRoot";
const frames=c=>c.eval('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
async function tap(c,selector,lightDOM=false){
 const p=await c.eval(`(()=>{const s=${lightDOM?'document':sh},b=s.querySelector(${JSON.stringify(selector)}),r=b.getBoundingClientRect();if(r.width<44||r.height<44)throw Error('Not a reachable touch target: '+b.className);const x=r.x+r.width/2,y=r.y+r.height/2;if(s.elementFromPoint(x,y)?.closest('button,a')!==b)throw Error('Covered control: '+b.className);return {x,y};})()`);
 for(const type of ['mousePressed','mouseReleased'])await c.send('Input.dispatchMouseEvent',{type,...p,button:'left',clickCount:1});await frames(c);
}
async function metrics(c){return c.eval(`(()=>{const s=${sh},issues=[],bar=s.host.getBoundingClientRect();for(const b of s.querySelectorAll('.actions button,.actions a,.mobile-menu')){const r=b.getBoundingClientRect();if(!r.width||!r.height)continue;if(r.width<44||r.height<44)issues.push('small '+b.className);if(r.bottom>bar.bottom+1||r.top<bar.top)issues.push('outside bar '+b.className);if(r.left<0||r.right>innerWidth+1||r.bottom>innerHeight)issues.push('outside '+b.className);const x=r.x+r.width/2,y=r.y+r.height/2;if(document.elementFromPoint(x,y)!==s.host||s.elementFromPoint(x,y)?.closest('button,a')!==b)issues.push('covered '+b.className);}const p=s.querySelector('.progress'),a=s.querySelector('.account').getBoundingClientRect();if(!p.hidden){const r=p.getBoundingClientRect();if(r.right>a.left+1||r.left<0||Math.abs(r.y+r.height/2-a.y-a.height/2)>2)issues.push('XP position');}return issues;})()`);}
(async()=>{
 const browser=new CDP(),version=await(await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();await browser.connect(version.webSocketDebuggerUrl);
 const catalog=JSON.parse(fs.readFileSync('games.json'));
 const pages=[{id:'home',href:'index.html',theme:'mode'},{id:'teacher',href:'teacher/',theme:'mode'},...['rechtenwereld','wortelbouw','vectoren-trainer','gravity-maze','algebra-trainer'].map(id=>({...catalog.find(g=>g.id===id),theme:id==='vectoren-trainer'?'contrast':null})),{id:'vector-classroom',href:'games/vectoren/classroom.html'}];
 try{for(const page of pages){
  const {browserContextId}=await browser.send('Target.createBrowserContext');let c;
  try{
   const {targetId}=await browser.send('Target.createTarget',{url:'about:blank',browserContextId});c=new CDP();await c.connect(`ws://127.0.0.1:${PORT}/devtools/page/${targetId}`);await c.send('Page.enable');await c.send('Runtime.enable');
   c.route=async p=>{const u=new URL(p.request.url),body=u.pathname.endsWith('/axioma-social.js')?'':u.pathname.endsWith('/axioma-auth.js')?'window.AxiomaAuth={CLASSES:["3TMW"],ready:async()=>({account:null}),getAccount:async()=>null,getSession:async()=>null,onChange:()=>()=>{},configured:()=>true,client:()=>({rpc:async()=>({data:[],error:null})})};':null;if(body!==null)return c.send('Fetch.fulfillRequest',{requestId:p.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(body).toString('base64')});if(u.hostname!=='127.0.0.1')return c.send('Fetch.failRequest',{requestId:p.requestId,errorReason:'BlockedByClient'});return c.send('Fetch.continueRequest',{requestId:p.requestId});};
   await c.send('Fetch.enable',{patterns:[{urlPattern:'*'}]});await c.size(1366,768);await c.send('Page.navigate',{url:BASE+'/'+page.href});await c.wait("window.LeraarBobTopbar&&document.querySelector('leraarbob-topbar')?.shadowRoot.querySelector('.fullscreen')");await frames(c);
   assert.equal(await c.eval(sh+".querySelector('.settings')===null"),true);
   assert.equal(await c.eval(sh+".querySelector('.theme-toggle').hidden"),!page.theme,page.id+' theme availability');
   for(const [w,h] of [[1366,768],[390,844],[320,568],[844,390]]){
    await c.size(w,h);await frames(c);assert.deepEqual(await metrics(c),[],page.id+' controls '+w);
    await c.shot('display-'+page.id+'-'+w);
    const selector=await c.eval(`getComputedStyle(${sh}.querySelector('.mobile-menu')).display==='none'?'.menu':'.mobile-menu'`);
    await tap(c,selector);assert.equal(await c.eval(sh+".querySelector('dialog').open"),true);assert.equal(await c.eval(sh+".querySelector('.menu-list').textContent.includes('Instellingen')"),page.id==='home','Desktop exposes its settings place; display actions remain direct');await tap(c,'.close');
   }
   await c.size(1366,768);await frames(c);
   if(page.theme){
    const before=await c.eval(sh+".querySelector('.theme-toggle').getAttribute('aria-pressed')");
    await c.eval("window.originalTheme=document.querySelector('#modeBtn,#themeBtn');window.themeClicks=0;originalTheme?.addEventListener('click',()=>themeClicks++);");
    await tap(c,'.theme-toggle');await c.wait(sh+".querySelector('.theme-toggle').getAttribute('aria-pressed')!=="+JSON.stringify(before));
    if(page.theme==='mode'){
     assert.equal(await c.eval('document.documentElement.dataset.mode'),'dark');assert.equal(await c.eval('localStorage.getItem("axioma-mode")'),'dark');assert.equal(await c.eval(sh+".querySelector('.theme-toggle').title"),'Lichte weergave');
     await c.size(390,844);await frames(c);await c.shot('display-'+page.id+'-dark');
    }else{assert.equal(await c.eval('document.documentElement.classList.contains("high-contrast")'),true);assert.equal(await c.eval(sh+".querySelector('.theme-toggle').title"),'Extra contrast');}
    if(page.id!=='teacher'){assert.equal(await c.eval('themeClicks'),1);assert.equal(await c.eval("originalTheme===document.querySelector('#modeBtn,#themeBtn')"),true);}
    // Original control updates also reach the new button (not just its own clicks).
    if(page.id!=='teacher'){await c.eval('originalTheme.click()');await c.wait(sh+".querySelector('.theme-toggle').getAttribute('aria-pressed')==="+JSON.stringify(before));await tap(c,'.theme-toggle');}
   }
   await c.size(1366,768);await frames(c);
   const gameStorage=()=>c.eval("JSON.stringify(Object.fromEntries(Object.entries(localStorage).filter(([k])=>!['axioma-mode','leraarbob-topbar-collapsed'].includes(k)).sort(([a],[b])=>a.localeCompare(b))))");
   const before=await gameStorage();await tap(c,'.fullscreen');await c.wait('!!document.fullscreenElement');await c.wait(sh+".querySelector('.fullscreen').getAttribute('aria-pressed')==='true'");assert.equal(await c.eval(sh+".querySelector('.fullscreen').title"),'Volledig scherm verlaten');await tap(c,'.fullscreen');await c.wait('!document.fullscreenElement');
   // Exit through the browser's API as Escape would, checking fullscreenchange synchronization.
   await tap(c,'.fullscreen');await c.wait('!!document.fullscreenElement');await c.eval('document.exitFullscreen()');await c.wait(sh+".querySelector('.fullscreen').getAttribute('aria-pressed')==='false'");assert.equal(await gameStorage(),before,'display actions preserve progress '+page.id);
   await c.size(320,568);await frames(c);await tap(c,'.collapse');await c.wait("document.querySelector('.lb-header').getBoundingClientRect().height===0");assert.equal(await c.eval("document.querySelector('.lb-restore').getAttribute('aria-expanded')"),'false');
   await c.send('Page.reload');await c.wait("!!window.LeraarBobTopbar&&!!document.querySelector('leraarbob-topbar')&&document.querySelector('.lb-header').classList.contains('lb-collapsed')");await frames(c);await tap(c,'.lb-restore',true);await c.wait(sh+".querySelector('.collapse').getAttribute('aria-expanded')==='true'");assert.deepEqual(await metrics(c),[],page.id+' restored');
   if(page.theme==='mode'){assert.equal(await c.eval('document.documentElement.dataset.mode'),'dark');assert.equal(await c.eval(sh+".querySelector('.theme-toggle').title"),'Lichte weergave');}
   if(page.id==='home'){
    // Unsupported and rejected requests produce dismissible feedback, without throwing.
    await c.eval("window.originalFull=document.documentElement.requestFullscreen;document.documentElement.requestFullscreen=()=>Promise.reject(new Error('test denied'))");await tap(c,'.fullscreen');await c.wait(sh+".querySelector('.display-notice').hidden===false");assert.match(await c.eval(sh+".querySelector('.display-notice').textContent"),/lukte niet/);await tap(c,'.dismiss-notice');
    await c.eval('document.documentElement.requestFullscreen=undefined;document.documentElement.webkitRequestFullscreen=undefined');await tap(c,'.fullscreen');await c.wait(sh+".querySelector('.display-notice').hidden===false");assert.match(await c.eval(sh+".querySelector('.display-notice').textContent"),/niet beschikbaar/);await tap(c,'.dismiss-notice');
    await c.eval("document.documentElement.requestFullscreen=originalFull;dispatchEvent(new CustomEvent('axioma:login-complete',{detail:{account:{id:'layout-test',role:'teacher',alias:'Leerkracht'}}}))");await c.size(1366,768);await frames(c);assert.deepEqual(await metrics(c),[],'teacher actions');await c.shot('display-home-teacher');
   }
   assert.deepEqual(c.errors,[],page.id+' browser errors');console.log('PASS '+page.id+': direct controls, 4 sizes, fullscreen enter/exit, menu, collapse/reload'+(page.theme?', '+page.theme:''));
  }finally{await browser.send('Target.disposeBrowserContext',{browserContextId});c?.ws.close();}
 }}finally{browser.ws.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
