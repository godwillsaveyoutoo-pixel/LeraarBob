'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),tick=()=>new Promise(resolve=>setImmediate(resolve));
async function setup({home,page='game'}={}){
  const errors=[],vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error));
  const dom=new JSDOM('<!doctype html><html><head></head><body><header><button id="answerAction">Controleren</button></header><input id="answer"></body></html>',{url:'https://school.example/LeraarBob/games/example.html',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
  const w=dom.window,observers=[],NativeObserver=w.MutationObserver;
  w.MutationObserver=class extends NativeObserver{constructor(callback){super(callback);observers.push(this);}};
  w.ResizeObserver=class{observe(){}disconnect(){}};
  w.AxiomaAuth={ready:async()=>({account:null}),onChange:()=>()=>{}};
  w.LeraarBobAvatar={create:()=>w.document.createElement('span')};
  w.LeraarBobPlayModes={ready:async()=>{},current:()=>null};
  w.LeraarBobRoutes={safeReturn:value=>value};
  w.AxiomaSocial={onChange:()=>()=>{},state:()=>({account:null,invitations:[]})};
  const script=w.document.createElement('script');script.src='https://school.example/LeraarBob/shared/leraarbob-topbar.js';script.dataset.title='Voorbeeld';script.dataset.page=page;script.dataset.navPilot='true';
  if(home!==undefined)script.dataset.home=home;
  Object.defineProperty(w.document,'currentScript',{value:script,configurable:true});
  w.eval(fs.readFileSync(path.join(root,'shared/leraarbob-topbar.js'),'utf8'));
  w.document.querySelector('link[href*="leraarbob-topbar.css"]').dispatchEvent(new w.Event('load'));
  await tick();
  return {dom,w,errors,shadow:w.document.querySelector('leraarbob-topbar').shadowRoot,close:async()=>{await new Promise(resolve=>w.requestAnimationFrame(resolve));observers.forEach(observer=>observer.disconnect());dom.window.close();}};
}

test('Desktop home is optional and remains inside the platform origin and path',async t=>{
  for(const [home,expected] of [[undefined,'index.html'],['os/','os/'],['https://elsewhere.example/os/','index.html'],['../../outside/','index.html']]){
    const f=await setup({home,page:home==='os/'?'desktop':'game'});t.after(()=>f.close());
    assert.equal(f.shadow.querySelector('.brand').href,'https://school.example/LeraarBob/'+expected);
    assert.equal(f.errors.length,0);
  }
});

test('Existing live lesson roles and membership survive mounting the desktop additions',async t=>{
  const f=await setup({home:'os/',page:'desktop'});t.after(()=>f.close());
  const live=f.shadow.querySelector('.live-entry'),teacher=f.shadow.querySelector('.teacher-link');
  assert.equal(live.hidden,true);
  const login=account=>f.w.dispatchEvent(new f.w.CustomEvent('axioma:login-complete',{detail:{account}}));
  login({id:'teacher-a',role:'teacher',alias:'Docent'});
  assert.equal(live.hidden,false);assert.equal(teacher.hidden,false);
  assert.equal(live.getAttribute('aria-label'),'Live les geven');
  assert.equal(live.href,'https://school.example/LeraarBob/lessons/rechten-arbeid/index.html#lessessie');
  login({id:'learner-a',role:'student',alias:'Ada'});
  assert.equal(teacher.hidden,true);assert.equal(live.getAttribute('aria-label'),'Deelnemen aan een live les');
  assert.equal(live.href,'https://school.example/LeraarBob/lessons/rechten-arbeid/join.html');
  f.w.localStorage.setItem('lesson-stage-room:learner-a','existing-room');
  f.w.dispatchEvent(new f.w.Event('lesson:membership'));
  assert.equal(live.getAttribute('aria-label'),'Live les hervatten');assert.equal(live.classList.contains('joined'),true);
  login(null);assert.equal(live.hidden,true);assert.equal(teacher.hidden,true);
  assert.equal(f.errors.length,0);
});


test('Compact desktop title identifies the app even when native breadcrumbs show an exercise',async t=>{
  const f=await setup({home:'os/',page:'desktop'});t.after(()=>f.close());
  f.w.document.querySelector('header').dataset.platformAppTitle='Rechtenwereld';
  await new Promise(resolve=>f.w.requestAnimationFrame(resolve));
  assert.equal(f.shadow.querySelector('.mobile-title').textContent,'Rechtenwereld');
  assert.equal(f.errors.length,0);
});
