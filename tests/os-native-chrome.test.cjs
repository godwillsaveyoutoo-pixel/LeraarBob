'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const {JSDOM}=require('jsdom');
const source=fs.readFileSync(path.resolve(__dirname,'../os/native-chrome.js'),'utf8');
function setup(id,body){const dom=new JSDOM('<!doctype html><body>'+body+'</body>',{url:'https://school.example/LeraarBob/games/example/',pretendToBeVisual:true,runScripts:'outside-only'});dom.window.eval(source);const api=dom.window.LeraarBobNativeChrome.mount(dom.window.document,{id,base:'https://school.example/LeraarBob/'});return {dom,api,doc:dom.window.document,close(){api?.dispose();dom.window.close();}};}
test('Native commands preserve the actual handler, current disabled state and live replacement nodes',t=>{
 const f=setup('data-check','<div id="app" style="display:grid;grid-template-rows:38px 1fr 46px"><header id="topbar"><div class="topActions"><button id="helpBtn">?</button><button id="resetBtn" disabled>↻</button></div></header><main><input id="answer" value="1/"></main><footer></footer></div>');t.after(()=>f.close());let clicks=0;const original=f.doc.querySelector('#helpBtn');original.onclick=()=>clicks++;
 f.api.actions().find(a=>a.node.id==='helpBtn').node.click();assert.equal(clicks,1);assert.equal(f.api.actions().find(a=>a.node.id==='resetBtn').disabled,true);
 f.doc.querySelector('#resetBtn').disabled=false;assert.equal(f.api.actions().find(a=>a.node.id==='resetBtn').disabled,false);assert.equal(f.doc.querySelector('#answer').value,'1/');assert.strictEqual(f.doc.querySelector('#helpBtn'),original);
 const newer=f.doc.createElement('button');newer.id='helpBtn';original.replaceWith(newer);assert.strictEqual(f.api.actions().find(a=>a.node.id==='helpBtn').node,newer);
 assert.equal(f.doc.querySelector('link').href,'https://school.example/LeraarBob/os/native-chrome.css');
});
test('Stelsels keeps exact method, select and undo nodes; disposal restores original attributes',t=>{
 const f=setup('stelsels','<div id="app"><header><div class="brand">leraarBob</div><div class="title-row"><div class="title">Stelsels</div><label><select id="exerciseSelect"><option>1</option><option selected>2</option></select></label></div><div class="method-tabs"><button data-method="substitution" aria-selected="true">substitutie</button></div><button id="undoBtn">Undo</button></header><main>Werkbord</main></div>');t.after(()=>f.dom.window.close());const select=f.doc.querySelector('select'),undo=f.doc.querySelector('#undoBtn');let count=0;undo.onclick=()=>count++;f.api.refresh();assert.strictEqual(select,f.doc.querySelector('select'));assert.equal(select.value,'2');undo.click();assert.equal(count,1);assert.equal(f.doc.querySelector('header').dataset.osNativeHeader,'tools');assert(f.doc.querySelector('.brand').hasAttribute('data-os-native-hidden'));f.api.dispose();assert(!f.doc.querySelector('header').hasAttribute('data-os-native-header'));assert(!undo.hasAttribute('data-os-task-control'));assert.equal(f.doc.querySelectorAll('link,style').length,0);assert.equal(select.value,'2');
});
test('Inactive Pythagoras screens do not leak their back actions or titles into the OS',t=>{
 const f=setup('pythagoras','<div id="app"><header><span class="title">Start</span></header></div><div id="level2" hidden><header><span class="title">Bewijs</span><button id="back">Vorige</button></header></div>');t.after(()=>f.close());assert.deepEqual(Array.from(f.api.crumbs(),n=>n.textContent),['Start']);assert.equal(f.api.actions().length,0);f.doc.querySelector('#app').hidden=true;f.doc.querySelector('#level2').hidden=false;assert.deepEqual(Array.from(f.api.crumbs(),n=>n.textContent),['Bewijs']);assert.equal(f.api.actions()[0].node.id,'back');
});
test('Display and account/role actions remain centralized; game help and progress stay reachable',t=>{
 const f=setup('vectoren-trainer','<div id="app"><header class="trainer-header"><nav id="trainerMenu" hidden><button id="helpBtn">Uitleg</button><button id="progressBtn">Voortgang</button><button id="themeBtn">Contrast</button><button id="fullBtn">Volledig scherm</button><button id="classBtn">Klasmodus</button><button id="teacherBtn">Leraar</button><button id="devBtn" hidden>DEV</button></nav></header></div>');t.after(()=>f.close());assert.deepEqual(Array.from(f.api.actions(),a=>a.node.id),['helpBtn','progressBtn']);
});

test('Every registered app and OS atelier has an explicit chrome adapter',t=>{
 const f=setup('stelsels','<div id="app"><header></header></div>');t.after(()=>f.close());
 const ids=[...require('../games.json').filter(g=>g.active!==false).map(g=>g.id),'glasraam','rechten-arbeid-les','vectoren-canvas'];
 for(const id of ids)assert(f.dom.window.LeraarBobNativeChrome.ids.includes(id),'Missing OS chrome adapter: '+id);
});
