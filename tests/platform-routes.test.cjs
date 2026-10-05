'use strict';
const assert=require('node:assert/strict'),test=require('node:test'),create=require('../shared/platform-routes.js');
const R=create('https://example.test/LeraarBob/');
test('Return paths stay in this origin and project, including encoded queries',()=>{
 for(const unsafe of ['https://evil.test/','//evil.test/','javascript:alert(1)','/other/','/LeraarBob/../outside/','/LeraarBob/%2e%2e/outside/','/LeraarBob/%2foutside','https://x@example.test/LeraarBob/'])assert.equal(R.safeReturn(unsafe),'/LeraarBob/');
 assert.equal(R.safeReturn('/LeraarBob/games/getallenwereld/?level=wortels-som&returnTo=%2FLeraarBob%2F'),'/LeraarBob/games/getallenwereld/?level=wortels-som&returnTo=%2FLeraarBob%2F');
});
test('Links preserve codes and unknown bookmark parameters while carrying selection',()=>{
 const href=R.href('klasbattle/?game=algebra&join=ABC123&legacy=1',{gameId:'algebra-trainer',world:'systems',topic:'systems',level:'sys-substitution',returnTo:'/LeraarBob/games/algebra-trainer/stelsels.html?screen=menu'}),u=new URL(href,R.root);
 assert.equal(u.pathname,'/LeraarBob/klasbattle/');assert.equal(u.searchParams.get('join'),'ABC123');assert.equal(u.searchParams.get('legacy'),'1');assert.equal(u.searchParams.get('game'),'algebra-trainer');assert.equal(R.read(u).level,'sys-substitution');
});
test('Presentation history restores selection and normalizes an unavailable saved screen',()=>{
 let listener,live={world:'equations',level:'route-two',screen:'menu'};
 const win={location:new URL('https://example.test/LeraarBob/games/algebra-trainer/?join=ABC'),history:{state:null,replaceState(s,t,path){this.state=s;win.location=new URL(path,R.root);},pushState(s,t,path){this.state=s;win.location=new URL(path,R.root);}},addEventListener(type,fn){listener=fn;},removeEventListener(){}};
 const router=R.mount({window:win,gameId:'algebra-trainer',read:()=>live,apply:c=>{live={world:c.world,level:c.level,screen:c.screen==='unsupported'?'menu':c.screen};},onChange:()=>{}});
 const menu=structuredClone(win.history.state);live.screen='trainer';router.update();assert.equal(win.location.searchParams.get('join'),'ABC');win.history.state=menu;listener();assert.equal(live.screen,'menu');assert.equal(win.location.searchParams.get('screen'),'menu');
 assert.equal(new URL(router.returnTo('menu'),R.root).searchParams.has('returnTo'),false);
 win.history.state={leraarbobRoute:{gameId:'algebra-trainer',world:'equations',level:'route-two',screen:'unsupported'}};listener();assert.equal(win.location.searchParams.get('screen'),'menu');
});
