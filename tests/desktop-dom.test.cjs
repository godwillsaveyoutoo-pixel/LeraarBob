'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),tick=()=>new Promise(resolve=>setImmediate(resolve));
const emptyOverview=id=>({accountId:id,games:[],trainer:null,numbers:null,errors:{games:false,trainer:false,numbers:false}});
async function setup({account=null,overview,storage={},topbar=false}={}){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
  const dom=new JSDOM(read('os/index.html'),{url:'https://school.example/LeraarBob/os/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
  const w=dom.window;Object.entries(storage).forEach(([k,v])=>w.localStorage.setItem(k,v));
  // jsdom clears the body during close(), which can notify observers after its
  // timer cleanup and schedule a new animation frame against a deleted document.
  // Dispose the fixture's observers and pending frames before destroying it.
  const observers=new Set(),animationFrames=new Set(),NativeObserver=w.MutationObserver;
  const requestFrame=w.requestAnimationFrame.bind(w),cancelFrame=w.cancelAnimationFrame.bind(w),closeWindow=w.close.bind(w);
  w.MutationObserver=class extends NativeObserver{constructor(callback){super(callback);observers.add(this);}};
  w.requestAnimationFrame=callback=>{const handle=requestFrame(time=>{animationFrames.delete(handle);callback(time);});animationFrames.add(handle);return handle;};
  w.cancelAnimationFrame=handle=>{animationFrames.delete(handle);cancelFrame(handle);};
  w.close=()=>{observers.forEach(observer=>observer.disconnect());observers.clear();animationFrames.forEach(cancelFrame);animationFrames.clear();closeWindow();};
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  w.HTMLDialogElement.prototype.close=function(){if(!this.open)return;this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
  w.ResizeObserver=class{observe(){}disconnect(){}};
  const listeners=new Set();w.AxiomaAuth={ready:()=>Promise.resolve({account}),onChange:cb=>{listeners.add(cb);return()=>listeners.delete(cb);}};
  w.AxiomaProgress={loadOverview:({signal})=>overview?overview(account?.id,signal):Promise.resolve(emptyOverview(account?.id))};
  w.LeraarBobAvatar={create:()=>{const s=w.document.createElement('span');s.textContent='avatar';return s;}};
  w.eval(read('js/catalog.js'));
  Object.defineProperty(w.document,'currentScript',{configurable:true,value:{src:'https://school.example/LeraarBob/shared/game-registry.js'}});
  w.eval(read('shared/game-registry.js'));w.eval(read('js/catalog-progress.js'));w.eval(read('os/desktop-model.js'));w.eval(read('os/personal-home.js'));w.eval(read('os/activity-entry.js'));w.eval(read('os/edge-bars.js'));w.eval(read('os/desktop.js'));
  await tick();await tick();
  if(topbar){
    w.LeraarBobPlayModes={ready:()=>Promise.resolve(),current:()=>null};
    w.LeraarBobRoutes={safeReturn:value=>value};
    w.AxiomaSocial={onChange:()=>()=>{},state:()=>({account:null,invitations:[]})};
    const s=w.document.querySelector('script[src*="leraarbob-topbar.js"]');Object.defineProperty(w.document,'currentScript',{configurable:true,value:s});
    w.eval(read('shared/leraarbob-topbar.js'));
    const style=[...w.document.querySelectorAll('link[href*="leraarbob-topbar.css"]')].at(-1);style.dispatchEvent(new w.Event('load'));
    await tick();
  }
  return {dom,w,errors,$:id=>w.document.getElementById(id),emit:next=>{account=next?.account||null;listeners.forEach(cb=>cb(next));}};
}
test('Closing a settled desktop fixture cancels pending rendering before jsdom destroys its document',async t=>{
  const f=await setup({topbar:true});t.after(()=>{if(f.w.document)f.w.close();});
  await new Promise(resolve=>f.w.requestAnimationFrame(()=>f.w.requestAnimationFrame(resolve)));
  let renderedAfterClose=false;f.w.requestAnimationFrame(()=>{renderedAfterClose=true;});f.w.close();
  await new Promise(resolve=>setTimeout(resolve,40));
  assert.equal(renderedAfterClose,false);assert.equal(f.w.document,undefined);assert.equal(f.errors.length,0);
});
test('The desktop starts with one app and Add; the catalog retains themes and distinct work forms',async t=>{
  const f=await setup();t.after(()=>f.dom.window.close());
  assert.equal(f.$('pinnedApps').querySelectorAll('.personal-app').length,1);assert.equal(f.$('pinnedApps').querySelectorAll('.personal-add').length,1);
  f.w.LeraarBobDesktop.showView({kind:'theme',themeId:'rechten'});
  assert.deepEqual(new Set([...f.$('viewContent').querySelectorAll('.type-badge')].map(n=>n.dataset.type)),new Set(['train','learn','game','atelier']));
  f.$('typeFilters').querySelectorAll('button')[1].click();assert([...f.$('viewContent').querySelectorAll('.type-badge')].every(n=>n.dataset.type==='learn'));
  f.w.LeraarBobDesktop.showView({kind:'all'});assert.equal(f.$('personalDialog').querySelectorAll('[data-pick-app]').length,25);assert.equal(f.$('libraryWindow').hidden,true);f.$('personalDialog').close();
  f.$('startButton').click();assert.equal(f.$('startButton').getAttribute('aria-expanded'),'true');assert.equal(f.$('startPanel').inert,false);
  f.$('startSearch').value='pythagoras les';f.$('startSearch').dispatchEvent(new f.w.Event('input'));assert.equal(f.$('startResults').children.length,1);
  f.w.document.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'Escape'}));assert.equal(f.$('startPanel').hidden,true);assert.equal(f.$('startButton').getAttribute('aria-expanded'),'false');
  assert.equal(f.errors.length,0);
});
test('Back, Start, global menu and collapsing the platform row retain the exact native DOM and handlers',async t=>{
  const f=await setup({topbar:true});t.after(()=>f.dom.window.close());const D=f.w.LeraarBobDesktop;
  D.showView({kind:'theme',themeId:'pythagoras'});assert(D.openApp('pythagoras'));
  const iframe=f.$('appFrames').querySelector('iframe'),doc=iframe.contentDocument;
  doc.open();doc.write('<!doctype html><html><body><input id="answer"><button id="answerButton">Antwoord</button><a href="https://school.example/LeraarBob/index.html" id="home">Home</a><span id="completedCount">2 / 8</span></body></html>');doc.close();
  let answers=0;const input=doc.getElementById('answer');input.value='verfijnd antwoord';doc.getElementById('answerButton').onclick=()=>answers++;
  iframe.dispatchEvent(new f.w.Event('load'));
  f.$('appBack').click();assert.equal(f.$('libraryWindow').hidden,false);assert.equal(f.$('windowTitle').textContent,'Pythagoras & lengtes');
  D.openApp('pythagoras');assert.equal(f.$('appFrames').querySelector('iframe'),iframe);assert.equal(iframe.contentDocument.getElementById('answer'),input);assert.equal(input.value,'verfijnd antwoord');
  const shadow=f.w.document.querySelector('leraarbob-topbar').shadowRoot;
  f.w.LeraarBobTopbar.openMenu();await tick();const saved=[...shadow.querySelectorAll('.menu-card')].find(n=>n.textContent.includes('Mijn taken'));assert(saved,shadow.querySelector('.menu-list').textContent);saved.click();assert.equal(D.state().view.kind,'saved');
  assert.equal(f.$('appFrames').querySelector('iframe'),iframe);assert.equal(input.value,'verfijnd antwoord');
  D.openApp('pythagoras');f.w.LeraarBobTopbar.setCollapsed(true);
  const restore=f.w.document.querySelector('.lb-restore');assert.equal(restore.hidden,false);assert.equal(restore.getAttribute('aria-expanded'),'false');assert.equal(f.$('desktopHeader').inert,true);
  assert.equal(f.w.localStorage.getItem('leraarbob-topbar-collapsed'),'true');restore.click();assert.equal(restore.hidden,true);assert.equal(f.$('desktopHeader').inert,false);
  assert.equal(input.value,'verfijnd antwoord');doc.getElementById('answerButton').click();assert.equal(answers,1,'No duplicated answer handler');
  let nativeHomeCalls=0;doc.getElementById('home').addEventListener('click',e=>{nativeHomeCalls++;e.preventDefault();e.stopPropagation();});
  doc.getElementById('home').click();assert.equal(nativeHomeCalls,0,'Desktop handles the native Home before its iframe postMessage handler');assert.equal(f.$('appWorkspace').hidden,true);assert.equal(f.$('appFrames').querySelector('iframe'),iframe);
  assert.equal(shadow.querySelector('.brand').href,'https://school.example/LeraarBob/os/');assert.equal(f.errors.length,0);
});
test('A second visit restores the explicit topbar preference and has a reachable restore control',async t=>{
  const f=await setup({topbar:true,storage:{'leraarbob-topbar-collapsed':'true'}});t.after(()=>f.dom.window.close());
  assert.equal(f.$('desktopHeader').inert,true);assert.equal(f.w.document.querySelector('.lb-restore').hidden,false);
  f.w.document.querySelector('.lb-restore').click();assert.equal(f.$('desktopHeader').inert,false);
});
test('Learner startup and direct launches reject class creation; teacher options use the trusted auth result',async t=>{
  const f=await setup({account:{id:'learner-a',role:'student',alias:'Ada'}});t.after(()=>f.dom.window.close());const D=f.w.LeraarBobDesktop;
  D.openModes('getallenwereld');assert([...f.$('modeOptions').querySelectorAll('[data-mode]')].every(n=>!['classroom','classlearn','teacher'].includes(n.dataset.mode)));
  assert.equal(D.openApp('getallenwereld','classlearn'),false);assert.equal(D.openApp('rechtenwereld','classroom'),false);assert.equal(D.state().openApps.length,0);
  D.showView({kind:'live'});assert.equal(f.$('viewContent').querySelectorAll('.teacher-card').length,0);
  f.emit({account:{id:'teacher-a',role:'teacher'}});await tick();D.openModes('getallenwereld');assert(f.$('modeOptions').querySelector('[data-mode=classlearn]'));
  D.showView({kind:'live'});assert.equal(f.$('viewContent').querySelectorAll('.teacher-card').length,2);
  assert.equal(D.openApp('getallenwereld','classlearn'),true);assert.equal(new URL(f.$('appFrames').querySelector('iframe').src).searchParams.get('audience'),'class');assert.equal(f.errors.length,0);
});
test('Saving is a desktop shortcut; closing is explicit; reopening a running online app keeps that mode',async t=>{
  const f=await setup({account:{id:'learner-a',role:'student',alias:'Ada'}});t.after(()=>f.dom.window.close());const D=f.w.LeraarBobDesktop;
  D.openApp('rechtenwereld','online');const frame=f.$('appFrames').querySelector('iframe');f.$('saveActivity').click();assert.equal(D.state().savedCount,1);
  f.$('minimizeApp').click();D.openApp('rechtenwereld');assert.equal(D.state().activeKey,'rechtenwereld|online|');assert.equal(f.$('appFrames').querySelector('iframe'),frame);
  f.$('closeApp').click();assert.equal(f.$('confirmClose').open,true);f.$('cancelClose').click();assert.equal(D.state().openApps.length,1);
  f.$('closeApp').click();f.$('acceptClose').click();assert.equal(D.state().openApps.length,0);assert.equal(D.state().savedCount,1);
  const keys=Object.keys(f.w.localStorage);assert(keys.every(k=>k.startsWith('leraarbob-desktop:')));assert.equal(f.errors.length,0);
});
test('Account changes clear live apps and separate pins, shortcuts and stale progress responses',async t=>{
  const pending=[];const f=await setup({account:{id:'learner-a',role:'student',alias:'Ada'},overview:(id,signal)=>new Promise(resolve=>pending.push({id,signal,resolve}))});t.after(()=>f.dom.window.close());const D=f.w.LeraarBobDesktop;
  D.showView({kind:'theme',themeId:'rechten'});f.$('viewContent').querySelector('[data-app-id=rechtenwereld] .card-pin').click();D.openApp('pythagoras');f.$('saveActivity').click();assert.equal(D.state().pins.includes('rechtenwereld'),false);
  const old=pending[0];f.emit({account:null,pending:true});assert.equal(D.state().openApps.length,0);assert.equal(D.state().savedCount,0);assert.equal(old.signal.aborted,true);
  f.emit({account:{id:'learner-b',role:'student',alias:'Milan'}});await tick();assert.equal(D.state().pins.includes('rechtenwereld'),true);assert.equal(D.state().savedCount,0);
  old.resolve({...emptyOverview('learner-a'),games:[{game_id:'pythagoras',state:{completed:['old'],total:1}}]});await tick();assert.equal(D.state().progressState,'loading');assert.equal(f.$('greeting').textContent,'Welkom, Milan.');
  pending.find(p=>p.id==='learner-b').resolve(emptyOverview('learner-b'));await tick();assert.equal(D.state().progressState,'ready');D.showView({kind:'profile'});assert(!f.$('viewContent').textContent.includes('old'));
  f.emit({account:{id:'learner-a',role:'student',alias:'Ada'}});await tick();assert.equal(D.state().savedCount,1);assert.equal(D.state().pins.includes('rechtenwereld'),false);
  pending.filter(p=>p.id==='learner-a').at(-1).resolve(emptyOverview('learner-a'));await tick();assert.equal(f.errors.length,0);
});
test('An unrecognized account can discover guest apps without fake learner progress or class controls',async t=>{
  let calls=0;const f=await setup({account:{id:'unrecognized',role:'unknown'},overview:()=>{calls++;return Promise.resolve(emptyOverview('unrecognized'));}});t.after(()=>f.dom.window.close());const D=f.w.LeraarBobDesktop;
  D.showView({kind:'profile'});assert.match(f.$('viewContent').textContent,/niet herkend/);assert.doesNotMatch(f.$('viewContent').textContent,/wordt opgehaald/);assert.equal(calls,0);
  assert.equal(D.openApp('pythagoras'),true);assert.equal(D.openApp('getallenwereld','classlearn'),false);
});
test('The laptop cache limit rejects a seventh app without discarding the six live screens',async t=>{
  const f=await setup();t.after(()=>f.dom.window.close());const D=f.w.LeraarBobDesktop;
  for(const id of ['pythagoras','rechtenwereld','rechten-zeeslag','glasraam','gravity-maze','wortelbouw'])assert.equal(D.openApp(id),true);
  const screens=[...f.$('appFrames').querySelectorAll('iframe')];assert.equal(D.openApp('vectoren-trainer'),false);assert.equal(D.state().openApps.length,6);
  assert.deepEqual([...f.$('appFrames').querySelectorAll('iframe')],screens);D.showView({kind:'desktop'});assert.equal(D.openApp('pythagoras'),true);assert.equal(D.state().activeKey,'pythagoras|solo|');
});
function algebraFixture(f,frame,world){
  const doc=frame.contentDocument;doc.open();doc.write('<!doctype html><html><head></head><body><input id="answer"><span id="algebraProgress" data-platform-progress="xp" data-value="30"></span></body></html>');doc.close();
  const calls=[],listeners=new Set(),context={gameId:'algebra-trainer',world,worldTitle:world==='systems'?'Stelsels':'Vergelijkingen',screen:'work',level:world==='systems'?'sys-substitution':'route-two',levelTitle:'Eigen level',destinations:[{id:'world',label:'Werelden'},{id:'menu',label:'Levels',active:true},{id:'tools',label:'Werkvormen'}]};let disposed=0;
  frame.contentWindow.AlgebraShell={setEmbedded:value=>calls.push(['embedded',value]),subscribe:cb=>{listeners.add(cb);cb(context);return()=>{listeners.delete(cb);disposed++;};},navigate:id=>{calls.push(['navigate',id]);context.screen=id;listeners.forEach(cb=>cb(context));}};
  frame.dispatchEvent(new f.w.Event('load'));return {doc,calls,input:doc.getElementById('answer'),disposed:()=>disposed};
}
test('Algebra routes keep separate live modules, one projected navigation, exact saved URLs and cached class returns',async t=>{
  const f=await setup();t.after(()=>f.dom.window.close());const D=f.w.LeraarBobDesktop;
  D.showView({kind:'theme',themeId:'algebra',type:'train',query:'algebra'});assert(D.openApp('algebra-trainer'));
  const eqFrame=f.$('appFrames').querySelector('iframe'),eq=algebraFixture(f,eqFrame,'equations');eq.input.value='tussenstap';
  assert.equal(new URL(eqFrame.src).searchParams.get('osEmbed'),'1');assert.deepEqual(eq.calls,[['embedded',true]]);
  assert.deepEqual([...f.$('nativeAppNavigation').children].map(n=>n.textContent),['Werelden','Levels','Werkvormen']);assert.equal(f.$('nativeAppNavigation').hidden,false);
  f.$('nativeAppNavigation').querySelector('[data-algebra-section=tools]').click();assert.deepEqual(eq.calls.at(-1),['navigate','tools']);
  const systems='https://school.example/LeraarBob/games/algebra-trainer/stelsels.html?screen=menu';
  const route=new eqFrame.contentWindow.CustomEvent('leraarbob:algebra-route',{detail:{href:systems},cancelable:true});eq.doc.dispatchEvent(route);assert(route.defaultPrevented);
  const sysFrame=f.$('appFrames').querySelectorAll('iframe')[1],sys=algebraFixture(f,sysFrame,'systems');sys.input.value='1/';
  assert.equal(eqFrame.contentDocument,eq.doc);assert.equal(eq.input.value,'tussenstap');assert.equal(D.state().openApps.length,2);
  assert.deepEqual([...f.$('runningApps').children].map(n=>n.getAttribute('aria-label')),['Terug naar Vergelijkingen','Terug naar Stelsels','Terug naar Algebra']);
  f.$('saveActivity').click();const preferences=Object.values(f.w.localStorage).map(value=>{try{return JSON.parse(value);}catch{return null;}}).find(value=>value?.saved?.length);
  assert.equal(preferences.saved[0].title,'Stelsels');assert.equal(new URL(preferences.saved[0].href).pathname,'/LeraarBob/games/algebra-trainer/stelsels.html');assert.equal(new URL(preferences.saved[0].href).searchParams.has('osEmbed'),false);
  for(const alias of ['algebra','algebra-trainer']){
    const battle=sys.doc.createElement('a');battle.href='https://school.example/LeraarBob/klasbattle/?game='+alias+'&world=systems';sys.doc.body.append(battle);
    const click=new sysFrame.contentWindow.MouseEvent('click',{bubbles:true,cancelable:true});battle.dispatchEvent(click);assert(click.defaultPrevented);
    const hub=f.$('appFrames').querySelectorAll('iframe')[2];assert(hub);assert.equal(D.state().openApps.length,3);assert.equal(f.$('nativeAppNavigation').hidden,true);
    const doc=hub.contentDocument;doc.open();doc.write('<!doctype html><html><head></head><body><a id="origin" href="'+systems+'">Terug</a></body></html>');doc.close();hub.dispatchEvent(new f.w.Event('load'));
    const back=new hub.contentWindow.MouseEvent('click',{bubbles:true,cancelable:true});doc.getElementById('origin').dispatchEvent(back);assert(back.defaultPrevented);assert.equal(D.state().activeKey,'algebra-trainer|solo|systems');
    assert.equal(sys.input.value,'1/');assert.equal(sysFrame.contentDocument,sys.doc);assert.equal(f.$('nativeAppNavigation').hidden,false);assert.equal(f.$('nativeAppNavigation').children.length,3);
  }
  D.showView({kind:'saved'});f.$('viewContent').querySelector('.saved-row button').click();assert.equal(sysFrame.contentDocument,sys.doc);assert.equal(sys.input.value,'1/');assert.equal(D.state().view.kind,'saved');
  f.emit({account:{id:'next-pupil',role:'student'}});await tick();assert.equal(D.state().openApps.length,0);assert.equal(eq.disposed(),1);assert.equal(sys.disposed(),1);assert.equal(f.$('nativeAppNavigation').hidden,true);assert.equal(f.errors.length,0);
});
test('Algebra route at the six-window limit keeps the original answer instead of navigating its iframe',async t=>{
  const f=await setup();t.after(()=>f.dom.window.close());const D=f.w.LeraarBobDesktop;D.openApp('algebra-trainer');
  const frame=f.$('appFrames').querySelector('iframe'),algebra=algebraFixture(f,frame,'equations');algebra.input.value='bewaarde invoer';
  for(const id of ['pythagoras','rechtenwereld','rechten-zeeslag','glasraam','wortelbouw'])assert(D.openApp(id));f.$('runningApps').firstElementChild.click();
  const event=new frame.contentWindow.CustomEvent('leraarbob:algebra-route',{detail:{href:'https://school.example/LeraarBob/games/algebra-trainer/stelsels.html?screen=menu'},cancelable:true});algebra.doc.dispatchEvent(event);
  assert(event.defaultPrevented);assert.equal(D.state().openApps.length,6);assert.equal(D.state().activeKey,'algebra-trainer|solo|');assert.equal(frame.contentDocument,algebra.doc);assert.equal(algebra.input.value,'bewaarde invoer');assert.match(f.$('toast').textContent,/zes apps/);assert.equal(f.errors.length,0);
});
test('Each pilot keeps its own folder, filter and search when switching through the taskbar',async t=>{
  const f=await setup();t.after(()=>f.dom.window.close());const D=f.w.LeraarBobDesktop;
  const pilots=[['pythagoras','pythagoras','learn','pythagoras'],['rechtenwereld','rechten','train','wereld'],['rechten-zeeslag','rechten','game','zeeslag'],['glasraam','rechten','atelier','glas']];
  const origins=new Map();
  for(const [id,themeId,type,query] of pilots){D.showView({kind:'theme',themeId,type,query});origins.set(id,JSON.stringify(D.state().view));assert(D.openApp(id));}
  const screens=[...f.$('appFrames').querySelectorAll('iframe')];
  for(const [id,themeId] of pilots){
    const index=pilots.findIndex(p=>p[0]===id);f.$('runningApps').children[index].click();
    assert.equal(D.state().activeKey,`${id}|solo|`);assert.equal(JSON.stringify(D.state().view),origins.get(id));
    assert.equal(f.$('headerFolder').textContent,f.w.LeraarBobDesktopModel.theme(themeId).title);
    f.$('appBack').click();assert.equal(JSON.stringify(D.state().view),origins.get(id));assert.equal(f.$('librarySearch').value,pilots[index][3]);
    assert.equal(f.$('typeFilters').querySelector('[aria-pressed=true]').textContent,f.w.LeraarBobDesktopModel.types[pilots[index][2]].label);
  }
  assert.deepEqual([...f.$('appFrames').querySelectorAll('iframe')],screens);assert.equal(f.errors.length,0);
});
test('Launching through Start gives the new app its theme while saved shortcuts return to My tasks',async t=>{
  const f=await setup();t.after(()=>f.dom.window.close());const D=f.w.LeraarBobDesktop;
  D.showView({kind:'theme',themeId:'pythagoras'});D.openApp('pythagoras');f.$('startButton').click();f.$('startSearch').value='glasraam';f.$('startSearch').dispatchEvent(new f.w.Event('input'));[...f.$('startResults').querySelectorAll('button')].find(b=>b.querySelector('strong').textContent==='Glasraam').click();
  assert.equal(f.$('startPanel').hidden,true);assert.equal(f.$('headerFolder').textContent,'Rechten & functies');f.$('appBack').click();assert.equal(D.state().view.themeId,'rechten');
  D.openApp('glasraam');f.$('saveActivity').click();D.showView({kind:'saved'});f.$('viewContent').querySelector('.saved-row button').click();
  assert.equal(f.$('appBack').textContent,'Terug naar Mijn taken');assert.equal(f.$('headerFolder').textContent,'Rechten & functies');
  f.$('minimizeApp').click();f.$('runningApps').children[1].click();f.$('appBack').click();assert.equal(D.state().view.kind,'saved');
  f.$('viewContent').querySelector('.saved-row button').click();f.$('closeApp').click();f.$('acceptClose').click();assert.equal(D.state().view.kind,'saved');assert.equal(D.state().openApps.length,1);
});
test('Start works from a native answer field and Escape returns focus without changing native keys or input',async t=>{
  const f=await setup();t.after(()=>f.dom.window.close());const D=f.w.LeraarBobDesktop;D.openApp('pythagoras');
  const frame=f.$('appFrames').querySelector('iframe'),doc=frame.contentDocument;doc.open();doc.write('<!doctype html><html><body><input id="answer"></body></html>');doc.close();frame.dispatchEvent(new f.w.Event('load'));frame.dispatchEvent(new f.w.Event('load'));
  const input=doc.getElementById('answer');input.value='3² + 4²';input.focus();let nativeKeys=0;doc.addEventListener('keydown',()=>nativeKeys++);
  const ordinary=new frame.contentWindow.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});input.dispatchEvent(ordinary);assert.equal(ordinary.defaultPrevented,false);assert.equal(nativeKeys,1);
  const search=new frame.contentWindow.KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true,cancelable:true});input.dispatchEvent(search);assert.equal(search.defaultPrevented,true);assert.equal(f.$('startPanel').hidden,false);assert.equal(f.w.document.activeElement,f.$('startSearch'));
  f.$('startSearch').dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));assert.equal(f.$('startPanel').hidden,true);assert.equal(doc.activeElement,input);assert.equal(input.value,'3² + 4²');
  const escape=new frame.contentWindow.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true});input.dispatchEvent(escape);assert.equal(escape.defaultPrevented,false);assert.equal(nativeKeys,2);
  assert.equal(D.state().openApps.length,1);assert.equal(f.errors.length,0);
});
test('Resuming a pinned app retains its own return place and restores the native answer focus',async t=>{
  const f=await setup();t.after(()=>f.dom.window.close());const D=f.w.LeraarBobDesktop;
  D.showView({kind:'theme',themeId:'pythagoras',type:'learn',query:'pythagoras'});D.openApp('pythagoras');
  const frame=f.$('appFrames').querySelector('iframe'),doc=frame.contentDocument;
  doc.open();doc.write('<!doctype html><html><body><input id="answer"></body></html>');doc.close();frame.dispatchEvent(new f.w.Event('load'));
  const input=doc.getElementById('answer');input.value='12';input.focus();f.$('minimizeApp').click();D.openApp('pythagoras');
  assert.equal(doc.activeElement,input);assert.equal(input.value,'12');f.$('appBack').click();
  assert.deepEqual(JSON.parse(JSON.stringify(D.state().view)),{kind:'theme',themeId:'pythagoras',type:'learn',query:'pythagoras'});
});
test('Start and resume retain focus from a nested native workboard without intercepting ordinary answers',async t=>{
  const f=await setup();t.after(()=>f.dom.window.close());const D=f.w.LeraarBobDesktop;D.openApp('rechtenwereld','local');
  const frame=f.$('appFrames').querySelector('iframe'),doc=frame.contentDocument;
  doc.open();doc.write('<!doctype html><html><head></head><body><iframe id="board" src="https://school.example/LeraarBob/games/rechten/rechtenwereld/battle-player.html"></iframe></body></html>');doc.close();
  const board=doc.getElementById('board'),inner=board.contentDocument;inner.open();inner.write('<!doctype html><html><body><input id="answer"></body></html>');inner.close();
  frame.dispatchEvent(new f.w.Event('load'));board.dispatchEvent(new f.w.Event('load'));await tick();
  const input=inner.getElementById('answer');input.value='-3';input.focus();let nativeKeys=0;inner.addEventListener('keydown',()=>nativeKeys++);
  const normal=new board.contentWindow.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});input.dispatchEvent(normal);assert.equal(normal.defaultPrevented,false);assert.equal(nativeKeys,1);
  input.dispatchEvent(new board.contentWindow.KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true,cancelable:true}));assert.equal(f.$('startPanel').hidden,false);
  f.$('startSearch').dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));assert.equal(inner.activeElement,input);assert.equal(input.value,'-3');
  f.$('saveActivity').focus();f.$('saveActivity').click();f.$('minimizeApp').click();f.$('runningApps').firstChild.click();assert.equal(inner.activeElement,input);
});
test('Actual atelier progress keeps its native unit and does not leak into another app',async t=>{
  const f=await setup({topbar:true});t.after(()=>f.dom.window.close());const D=f.w.LeraarBobDesktop;D.openApp('glasraam');
  const frame=f.$('appFrames').querySelector('iframe'),doc=frame.contentDocument,source=read('games/rechten/rechtenwereld/glasatelier.html').match(/<output[^>]*id="atelier-progress"[^>]*>[\s\S]*?<\/output>/)[0];
  doc.open();doc.write('<!doctype html><html><body>'+source+'</body></html>');doc.close();frame.dispatchEvent(new f.w.Event('load'));
  const output=doc.getElementById('atelier-progress');output.dataset.value='3';await tick();
  assert.equal(f.$('desktopProgress').dataset.unit,'ramen');assert.equal(f.$('desktopProgress').dataset.value,'3');
  assert.match(f.w.document.querySelector('leraarbob-topbar').shadowRoot.querySelector('.progress-value').textContent,/3\/8 ramen/);
  output.dataset.total='9';await tick();assert.equal(f.$('desktopProgress').dataset.total,'9');
  D.openApp('pythagoras');assert.equal(f.$('desktopProgress').hasAttribute('data-unit'),false);assert.equal(f.errors.length,0);
});
async function nativeNumbers(url,account){
  const dom=new JSDOM(read('games/bewerkingen-trainer/start.html'),{url,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,calls=[];
  w.HTMLDialogElement.prototype.close=function(){};w.HTMLDialogElement.prototype.showModal=function(){};w.structuredClone=structuredClone;
  w.AxiomaAuth={ready:()=>Promise.resolve(),getAccount:()=>Promise.resolve(account),onChange:()=>{},client:()=>({functions:{invoke:async(_,{body})=>{
    calls.push(body);return {data:body.action==='summary'?{xp:0}:{id:'fixture-room',code:body.data.code,activity:'learn',audience:'class',owner:false,participant:true,round:-1,total:5,phase:'lobby',members:[{id:account.id,alias:account.alias,eligible:0,xp:0}],server_time:new Date().toISOString()}};
  }}})};
  w.eval(read('games/bewerkingen-trainer/core.js'));w.eval(read('games/bewerkingen-trainer/numbers-space.js'));await tick();await tick();return {dom,w,calls};
}
test('Native sign-in actions reach the central account panel and the bridge is removed on close',async t=>{
  const f=await setup();t.after(()=>f.dom.window.close());const D=f.w.LeraarBobDesktop;let calls=0;f.w.LeraarBobTopbar={openAccount:()=>calls++};D.openApp('pythagoras');
  const frame=f.$('appFrames').querySelector('iframe'),doc=frame.contentDocument;doc.open();doc.write('<!doctype html><html><body><button id="login">Inloggen</button></body></html>');doc.close();frame.dispatchEvent(new f.w.Event('load'));
  doc.getElementById('login').onclick=()=>frame.contentWindow.LeraarBobTopbar.openAccount();doc.getElementById('login').click();assert.equal(calls,1);assert.equal(f.w.document.querySelector('leraarbob-topbar'),null);
  const nativeLink=doc.createElement('a');nativeLink.href='https://school.example/LeraarBob/?login=1&return=games/rechten/rechtenwereld/';doc.body.append(nativeLink);nativeLink.click();assert.equal(calls,2);assert.equal(D.state().activeKey,'pythagoras|solo|','Native sign-in keeps the app open');
  const win=frame.contentWindow;f.$('closeApp').click();f.$('acceptClose').click();assert.equal(win.LeraarBobTopbar,undefined);assert.equal(typeof f.w.LeraarBobTopbar.openAccount,'function');
});
test('Guest live lesson sign-in captures the real native account handler and preserves the join screen',async t=>{
  const f=await setup();t.after(()=>f.dom.window.close());const D=f.w.LeraarBobDesktop;
  const central=f.w.document.createElement('dialog');central.id='authOverlay';central.dataset.authContext='embedded';central.hidden=true;central.innerHTML='<h2 id="authTitle">Aanmelden</h2><button id="authClose">Sluiten</button><div id="authContent"></div>';f.w.document.body.append(central);
  const trigger=f.w.document.createElement('button');trigger.dataset.axiomaLogin='';trigger.hidden=true;f.w.document.body.append(trigger);f.w.AxiomaAuth.CLASSES=['TEST'];
  Object.defineProperty(f.w.document,'currentScript',{configurable:true,value:{src:'https://school.example/LeraarBob/js/account-ui.js'}});f.w.eval(read('js/account-ui.js'));await tick();
  let calls=0;f.w.LeraarBobTopbar={openAccount:()=>{calls++;f.w.LeraarBobAccount.open();}};
  D.showView({kind:'live'});[...f.$('viewContent').querySelectorAll('button')].find(button=>button.textContent==='Live les').click();
  const frame=f.$('appFrames').querySelector('iframe'),doc=frame.contentDocument,win=frame.contentWindow;doc.open();doc.write(read('lessons/rechten-arbeid/join.html'));doc.close();
  win.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};win.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
  win.AxiomaAuth={CLASSES:['TEST'],ready:async()=>({account:null}),onChange:()=>()=>{}};
  Object.defineProperty(doc,'currentScript',{configurable:true,value:{src:'https://school.example/LeraarBob/js/account-ui.js'}});win.eval(read('js/account-ui.js'));await tick();frame.dispatchEvent(new f.w.Event('load'));
  const code=doc.getElementById('joinCode'),native=doc.getElementById('authOverlay'),signIn=doc.querySelector('[data-axioma-login]');code.value='A1';
  win.LeraarBobAccount.open(signIn);assert.equal(native.open,true,'The actual native handler can open its own dialog');win.LeraarBobAccount.close();
  let submits=0;doc.getElementById('joinForm').addEventListener('submit',event=>{event.preventDefault();submits++;});
  signIn.click();assert.equal(calls,1);assert.equal(central.open,true);assert.equal(native.open,false);assert.equal(native.hidden,true);
  assert.equal(D.state().activeKey,'utility:lesson-join');assert.equal(f.$('appFrames').querySelector('iframe'),frame);assert.equal(code.value,'A1');
  f.w.LeraarBobAccount.close();f.$('minimizeApp').click();f.$('runningApps').firstChild.click();assert.equal(frame.contentDocument.getElementById('joinCode'),code);assert.equal(code.value,'A1');
  doc.getElementById('joinForm').dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));assert.equal(submits,1);assert.deepEqual(f.errors.map(error=>error.message),[]);
});
test('The pupil Learn entrance reaches the original code form and joins a class; teachers reach class setup',async t=>{
  const account={id:'learner-a',role:'student',alias:'Ada'},f=await setup({account});t.after(()=>f.dom.window.close());const D=f.w.LeraarBobDesktop;
  D.showView({kind:'live'});[...f.$('viewContent').querySelectorAll('button')].find(b=>b.textContent==='Learn-sessie').click();
  const pupil=await nativeNumbers(f.$('appFrames').querySelector('iframe').src,account);t.after(()=>pupil.dom.window.close());
  assert.equal(pupil.w.NumbersSpace.snapshot().view,'join');assert.equal(pupil.w.document.querySelectorAll('[data-go]').length,0);assert(pupil.w.document.getElementById('joinSpace'));assert.equal(pupil.w.document.getElementById('createSpace'),null);
  assert.equal(f.$('activeAppType').textContent,'Sessie');assert.equal(pupil.w.document.querySelector('[data-go=class-learn]'),null);
  pupil.w.document.getElementById('sessionCode').value='A1B2C3D4';pupil.w.document.getElementById('joinSpace').dispatchEvent(new pupil.w.Event('submit',{bubbles:true,cancelable:true}));await tick();await tick();
  assert.equal(pupil.calls.find(c=>c.action==='join').data.code,'A1B2C3D4');assert.equal(pupil.calls.some(c=>c.action==='create'),false);assert.equal(pupil.w.NumbersSpace.snapshot().state.audience,'class');assert.equal(pupil.w.NumbersSpace.snapshot().view,'session');
  pupil.w.document.getElementById('sessionBack').click();assert.equal(pupil.w.NumbersSpace.snapshot().view,'join');assert.equal(pupil.w.document.querySelectorAll('[data-go]').length,0);assert.equal(new URL(pupil.w.location.href).searchParams.get('entry'),'join');
  f.emit({account:{id:'teacher-a',role:'teacher'}});await tick();D.openApp('getallenwereld','classlearn');
  const teacher=await nativeNumbers(f.$('appFrames').querySelector('iframe').src,{id:'teacher-a',role:'teacher'});t.after(()=>teacher.dom.window.close());
  assert.equal(teacher.w.NumbersSpace.snapshot().view,'selection');assert.equal(teacher.w.document.getElementById('sessionAudience').value,'class');assert(teacher.w.document.getElementById('createSpace'));assert.equal(teacher.calls.some(c=>c.action==='create'),false);
});

test('The actual powers workbench keeps its clickable answer, seed and native document through desktop navigation',async t=>{
  const f=await setup({account:{id:'learner-a',role:'student',alias:'Ada'},topbar:true});const D=f.w.LeraarBobDesktop;t.after(async()=>{if(D.state().activeKey){f.$('closeApp').click();f.$('acceptClose').click();}await tick();f.dom.window.close();});
  D.showView({kind:'theme',themeId:'getallen'});assert(D.openApp('getallenwereld','solo',{topicId:'machten'}));
  const frame=f.$('appFrames').querySelector('iframe'),w=frame.contentWindow,doc=frame.contentDocument;doc.open();doc.write(read('games/getallenwereld/index.html'));doc.close();
  const storage=new Map();w.AxiomaGame={active:true,account:{id:'learner-a',role:'student'},storage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},report:()=>{},emit:()=>w.dispatchEvent(new w.Event('axioma:game-progress'))};
  w.eval(read('shared/vendor/katex/katex.min.js'));w.eval(read('js/catalog.js'));
  Object.defineProperty(doc,'currentScript',{configurable:true,value:{src:'https://school.example/LeraarBob/shared/platform-routes.js'}});w.eval(read('shared/platform-routes.js'));
  Object.defineProperty(doc,'currentScript',{configurable:true,value:{src:'https://school.example/LeraarBob/shared/game-registry.js'}});w.eval(read('shared/game-registry.js'));
  for(const file of ['games/bewerkingen-trainer/core.js','games/getallenwereld/lessons.js','games/getallenwereld/guided-answer.js','games/getallenwereld/workshop.js','games/getallenwereld/app.js'])w.eval(read(file));
  await tick();frame.dispatchEvent(new f.w.Event('load'));
  doc.querySelector('[data-stop="machten-product"]').click();doc.querySelector('[data-action="start"]').click();doc.querySelector('[data-rule="'+w.GetallenWorld.task().correct+'"]').click();
  const answer=w.GetallenWorld.task().stages[0].slots[0].answer;doc.querySelector('[data-choice="'+answer+'"]').click();const before=JSON.stringify(w.GetallenWorld.snapshot().mission),slot=doc.querySelector('[data-slot]');
  await tick();const crumbs=()=>[...f.$('headerApp').parentElement.querySelectorAll('[data-native-crumb]')].map(n=>n.textContent);assert.deepEqual(crumbs(),['Getallenwereld','Machten','Machten vermenigvuldigen']);
  f.$('modeBtn').click();assert.equal(doc.documentElement.dataset.mode,'dark');assert.equal(doc.querySelector('[data-slot]'),slot);assert.equal(JSON.stringify(w.GetallenWorld.snapshot().mission),before);assert.equal(f.w.localStorage.getItem('axioma-mode'),'dark');
  f.$('modeBtn').click();assert.equal(doc.documentElement.dataset.mode,'light');
  f.$('saveActivity').click();
  const prefs=f.w.LeraarBobDesktopModel.read(f.w.localStorage,{id:'learner-a'});assert.equal(prefs.saved.length,1);assert.match(prefs.saved[0].title,/Machten vermenigvuldigen/);assert.match(prefs.saved[0].label,/Machten/);assert.equal(new URL(prefs.saved[0].href).searchParams.get('level'),'machten-product');assert.equal(f.$('openOriginal'),null);
  f.$('minimizeApp').click();f.$('runningApps').firstElementChild.click();assert.equal(frame.contentDocument,doc);assert.equal(doc.querySelector('[data-slot]'),slot);assert.equal(JSON.stringify(w.GetallenWorld.snapshot().mission),before);
  f.$('appBack').click();assert.equal(D.state().view.themeId,'getallen');D.openApp('getallenwereld');f.$('startButton').click();f.w.document.dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'Escape'}));
  assert.equal(frame.contentDocument,doc);assert.equal(doc.querySelector('[data-slot]'),slot);assert.equal(JSON.stringify(w.GetallenWorld.snapshot().mission),before);
  doc.querySelector('[data-action="check"]').click();assert.equal(w.GetallenWorld.snapshot().mission.done,true);assert.equal(w.GetallenWorld.snapshot().entries['machten-product'].done.length,1);await tick();assert.equal(doc.querySelectorAll('leraarbob-topbar').length,0);
  [...f.$('headerApp').parentElement.querySelectorAll('button[data-native-crumb]')].find(n=>n.textContent==='Machten').click();await tick();assert.equal(w.GetallenWorld.snapshot().screen,'chapter');assert.equal(doc.activeElement,doc.getElementById('app'));assert.equal(w.GetallenWorld.snapshot().mission.done,true);doc.querySelector('[data-action=start]').click();await tick();assert.equal(w.GetallenWorld.snapshot().screen,'play');assert.equal(w.GetallenWorld.snapshot().mission.done,true);assert.equal(crumbs().length,3);assert.equal(f.errors.length,0);
});
test('Each bar folds independently; hidden taskbar is inert, current input and native handler survive, and account preferences remain separate',async t=>{
  const f=await setup({topbar:true,account:{id:'a',role:'student'}});t.after(()=>f.w.close());const D=f.w.LeraarBobDesktop;D.openApp('pythagoras');
  const frame=f.$('appFrames').querySelector('iframe'),doc=frame.contentDocument;doc.open();doc.write('<!doctype html><html><body><input id="draft"><button id="answer">Answer</button></body></html>');doc.close();frame.dispatchEvent(new f.w.Event('load'));
  doc.querySelector('input').value='same draft';let answers=0;doc.querySelector('button').onclick=()=>answers++;
  f.$('taskbarToggle').click();assert.equal(f.$('taskbar').inert,true);assert.equal(f.$('taskbarToggle').getAttribute('aria-expanded'),'false');assert.equal(f.$('desktopHeader').inert,false);
  f.w.LeraarBobTopbar.setCollapsed(true,true);f.$('taskbarToggle').click();assert.equal(f.$('taskbar').inert,false);assert.equal(f.$('desktopHeader').inert,true);
  f.$('taskbarToggle').click();f.w.document.querySelector('.lb-restore').click();assert.equal(f.$('taskbar').inert,true);assert.equal(f.$('desktopHeader').inert,false);
  assert.equal(f.$('appFrames').querySelector('iframe'),frame);assert.equal(doc.querySelector('input').value,'same draft');doc.querySelector('button').click();assert.equal(answers,1);
  assert.equal(f.$('focusControls'),null);assert.equal(f.$('focusWorkspace'),null);assert.equal(f.$('openOriginal'),null);
  f.emit({account:{id:'b',role:'student'}});await tick();assert.equal(f.$('taskbar').inert,false);
  f.emit({account:{id:'a',role:'student'}});await tick();assert.equal(f.$('taskbar').inert,true);assert.equal(f.errors.length,0);
});
test('Folders and rankings have one resumable taskbar entry each; closing removes only the window and switching accounts clears their state',async t=>{
  const f=await setup({account:{id:'a',role:'student'}});t.after(()=>f.w.close());f.w.LeraarBobWorksheetLibrary={list:async()=>[]};const D=f.w.LeraarBobDesktop;
  D.showView({kind:'worksheet-saved',themeId:'rechten',topicId:'hellingrug'});await tick();
  const folder=D.state().view;assert.equal(f.$('runningApps').querySelector('[data-window="place:worksheet-saved"]').getAttribute('aria-pressed'),'true');
  D.showView({kind:'rankings'});await tick();assert.equal(D.state().openWindows.length,2);assert.equal(f.$('windowTitle').textContent,'Ranglijsten');
  D.showView('desktop');f.$('runningApps').querySelector('[data-window="place:worksheet-saved"]').click();await tick();assert.deepEqual(D.state().view,folder);
  D.openApp('pythagoras');const frame=f.$('appFrames').querySelector('iframe');
  f.$('runningApps').querySelector('[data-window="place:rankings"]').click();await tick();assert.equal(D.state().openWindows.length,2);assert.equal(f.$('appFrames').querySelector('iframe'),frame);
  f.$('closeLibrary').click();assert.equal(f.$('runningApps').querySelector('[data-window="place:rankings"]'),null);assert.equal(D.state().openWindows.length,1);assert(frame.isConnected);
  f.$('runningApps').querySelector('[data-window="place:worksheet-saved"]').click();f.$('closeLibrary').click();assert.equal(D.state().openWindows.length,0);assert(frame.isConnected);
  D.showView({kind:'worksheet-saved',themeId:'algebra',topicId:'equations'});f.emit({account:{id:'b',role:'student'}});await tick();assert.equal(D.state().openWindows.length,0);assert.equal(D.state().openApps.length,0);assert.equal(f.errors.length,0);
});
test('Historical Algebra shortcuts display their module names while keeping their original identity and exact destination',async t=>{
  const saved=[{id:'algebra-trainer',key:'equations',mode:'solo',title:'Algebrawereld · Vergelijkingen',href:'https://school.example/LeraarBob/games/algebra-trainer/?level=route-two'},{id:'algebra-trainer',key:'systems',mode:'solo',title:'Algebrawereld · Stelsels',href:'https://school.example/LeraarBob/games/algebra-trainer/stelsels.html?level=sys-substitution'}];
  const f=await setup({storage:{'leraarbob-desktop:v1:guest':JSON.stringify({saved})}});t.after(()=>f.w.close());f.w.LeraarBobDesktop.showView('saved');
  assert.deepEqual([...f.$('viewContent').querySelectorAll('h3')].map(n=>n.textContent),['Vergelijkingen','Stelsels']);assert.deepEqual(JSON.parse(f.w.localStorage.getItem('leraarbob-desktop:v1:guest')).saved,saved);
});
