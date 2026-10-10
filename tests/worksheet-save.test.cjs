'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'../shared/worksheet-save.js'),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup(){
 const dom=new JSDOM('<main><div id="controls"></div><div id="preview">Native questions and answers</div></main>',{url:'https://example.test/LeraarBob/games/example/',runScripts:'outside-only'}),win=dom.window;
 let scope='account:teacher',listener;const saved=[];
 win.AxiomaAuth={onChange(fn){listener=fn;}};
 win.LeraarBobWorksheetLibrary={ready:async()=>scope,captureScope:()=>scope,save:async(snapshot,{expectedScope})=>{assert.equal(expectedScope,scope);saved.push(snapshot);return {id:'sheet-'+saved.length};}};
 win.eval(source);
 return {dom,win,saved,change(next,pending=false){scope=pending?null:next;listener?.({pending,account:pending?null:{id:next}});}};
}
test('two generated series capture their own exact documents before asynchronous saving',async()=>{
 const x=setup();try{
  let current={questionsHTML:'Q1',keyHTML:'A1',data:{seed:1}};
  const control=x.win.LeraarBobWorksheetSave.mount({host:x.win.document.getElementById('controls'),getSnapshot:()=>structuredClone(current)});
  await tick();const first=control.save(true);current={questionsHTML:'Q2',keyHTML:'A2',data:{seed:2}};control.invalidate();const second=control.save(true);await Promise.all([first,second]);
  assert.deepEqual(x.saved,[{questionsHTML:'Q1',keyHTML:'A1',data:{seed:1}},{questionsHTML:'Q2',keyHTML:'A2',data:{seed:2}}]);
  assert.match(control.status.textContent,/Mijn oefenbladen.*dit toestel/);assert.equal(control.button.disabled,false);
 }finally{x.dom.window.close();}
});
test('a delayed snapshot cannot be archived for a replacement account',async()=>{
 const x=setup();try{
  let release;const slow=new Promise(resolve=>{release=resolve;});
  const control=x.win.LeraarBobWorksheetSave.mount({host:x.win.document.getElementById('controls'),getSnapshot:()=>slow});await tick();
  const result=control.save();await tick();x.change(null,true);x.change('account:student');release({questionsHTML:'Old teacher worksheet',keyHTML:'Old teacher key'});await result;
  assert.equal(x.saved.length,0);assert.equal(control.button.disabled,true);assert.match(control.status.textContent,/Account gewijzigd/);assert.equal(x.win.document.getElementById('preview').textContent,'Native questions and answers');
 }finally{x.dom.window.close();}
});
test('storage failure is visible while native preview and print remain usable',async()=>{
 const x=setup();try{
  x.win.LeraarBobWorksheetLibrary.save=async()=>{throw Error('De opslag op dit toestel is vol.');};let prints=0;x.win.print=()=>prints++;
  const preview=x.win.document.getElementById('preview');const control=x.win.LeraarBobWorksheetSave.mount({host:x.win.document.getElementById('controls'),getSnapshot:()=>({questionsHTML:preview.innerHTML,keyHTML:'Exact key'})});await tick();
  assert.equal(await control.save(),null);assert.match(control.status.textContent,/Niet bewaard:.*vol.*PDF/);assert.equal(control.button.disabled,false);x.win.print();assert.equal(prints,1);assert.equal(preview.innerHTML,'Native questions and answers');
 }finally{x.dom.window.close();}
});
test('changed invalid settings require a successful native generation before save',async()=>{
 const x=setup();try{
  let valid=false;const control=x.win.LeraarBobWorksheetSave.mount({host:x.win.document.getElementById('controls'),getSnapshot:()=>({questionsHTML:'Q',keyHTML:'A'}),isValid:()=>valid});await tick();assert.equal(control.button.disabled,true);
  assert.equal(await control.save(),null);assert.equal(x.saved.length,0);valid=true;control.invalidate();assert.equal(control.button.disabled,false);await control.save(true);assert.equal(x.saved.length,1);
 }finally{x.dom.window.close();}
});
