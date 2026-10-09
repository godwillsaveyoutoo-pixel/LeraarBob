'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),tick=()=>new Promise(resolve=>setImmediate(resolve));
const L=require('../games/getallenwereld/lessons.js'),W=require('../games/getallenwereld/workshop.js'),KEY='leraarbob.getallenwereld.v1';
async function setup({saved,url='?onderdeel=machten-product',role='student'}={}){
 const errors=[],reports=[],emits=[],storage=new Map(saved?[[KEY,JSON.stringify(saved)]]:[]),vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(read('games/getallenwereld/index.html'),{url:'https://school.example/LeraarBob/games/getallenwereld/'+url,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window;
 w.AxiomaGame={active:true,account:{id:'learner-a',role},storage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},report:(...v)=>reports.push(v),emit:(...v)=>emits.push(v)};
 w.eval(read('shared/vendor/katex/katex.min.js'));w.eval(read('js/catalog.js'));
 Object.defineProperty(w.document,'currentScript',{configurable:true,value:{src:'https://school.example/LeraarBob/shared/platform-routes.js'}});w.eval(read('shared/platform-routes.js'));
 Object.defineProperty(w.document,'currentScript',{configurable:true,value:{src:'https://school.example/LeraarBob/shared/game-registry.js'}});w.eval(read('shared/game-registry.js'));
 for(const file of ['games/bewerkingen-trainer/core.js','games/getallenwereld/lessons.js','games/getallenwereld/guided-answer.js','games/getallenwereld/workshop.js','games/getallenwereld/app.js'])w.eval(read(file));
 await tick();await tick();
 const plain=value=>JSON.parse(JSON.stringify(value)),state=()=>plain(w.GetallenWorld.snapshot()),task=()=>plain(w.GetallenWorld.task()),click=selector=>{const button=w.document.querySelector(selector);assert(button,'Missing control: '+selector);assert(!button.disabled,selector+' disabled');button.click();};
 return {dom,w,errors,reports,emits,storage,state,task,click,save:()=>JSON.parse(storage.get(KEY))};
}
function solveQuestion(f){
 let m=f.state().mission;if(m.stage<0)f.click('[data-rule="'+f.task().correct+'"]');
 while(!f.state().mission.done){const s=f.task().stages[f.state().mission.stage];s.slots.forEach((slot,i)=>{f.click('[data-slot="'+i+'"]');f.click('[data-choice="'+slot.answer+'"]');});f.click('[data-action="check"]');}
}
function fixture(id,{edition=2,index=0,stage=-1,values=[],done=false,...extra}={}){
 const mission={id,seed:321,index,edition,stage,values,done,assisted:false,attempts:0,...extra};
 return {version:1,screen:'play',theme:L.stop(id).theme,selected:id,entries:{},runs:{[id]:mission},mission};
}
test('The four phases contain exactly the eight existing goals; selection preserves work and uses real progress',async t=>{
 const f=await setup();t.after(()=>f.dom.window.close());const d=f.w.document;
 assert.equal(d.querySelectorAll('.path-group').length,4);
 assert.deepEqual([...d.querySelectorAll('[data-stop]')].map(n=>n.dataset.stop),W.ORDER);
 assert.deepEqual(new Set(W.ORDER),new Set(L.STOPS.filter(s=>s.theme==='machten').map(s=>s.id)));
 assert.equal(d.querySelector('.path-count b').textContent,'0/8');assert.equal(f.state().mission,null);
 f.click('[data-stop="machten-negatief"]');assert.equal(f.state().mission,null);assert.equal(f.state().selected,'machten-negatief');
 assert.equal(d.querySelector('[aria-current="step"]').dataset.stop,'machten-negatief');
 f.click('[data-stop="machten-product"]');f.click('[data-action="start"]');assert.equal(f.state().mission.edition,1);assert.equal(f.state().mission.track,'basis');assert.equal(f.state().mission.pathVersion,W.VERSION);
 assert.equal(f.errors.length,0);
});
test('A complete six-question basis run uses the original clickable answers and exact grader, and stays basis after reload',async t=>{
 let f=await setup();t.after(()=>f.dom.window.close());f.click('[data-action="start"]');const expressions=[];
 for(let index=0;index<6;index++){
  assert.equal(f.state().mission.index,index);assert.equal(f.state().mission.edition,1);assert(!f.task().expression.includes('-'));
  expressions.push(f.task().expression);assert.equal(f.w.document.querySelectorAll('.powers-play').length,1);
  assert.equal(f.w.document.querySelectorAll('input,textarea').length,0);
  solveQuestion(f);assert.equal(f.state().entries['machten-product'].done.length,index+1);
  assert.equal(f.w.document.querySelectorAll('[data-step-state="done"]').length,3);
  f.click('[data-action="next"]');
  if(index===2){const saved=f.save();f.dom.window.close();f=await setup({saved,url:'?onderdeel=machten-product&screen=play'});}
 }
 assert.equal(new Set(expressions).size,6);assert.equal(f.state().screen,'summary');assert(f.w.document.querySelector('.powers-summary'));
 assert.equal(f.state().entries['machten-product'].independent.length,6);assert.equal(f.reports.at(-1)[0][0],'machten-product');assert.equal(f.reports.at(-1)[1],15);
 assert.equal(f.w.document.getElementById('getallenProgress').dataset.value,'1');assert.deepEqual([...f.storage.keys()],[KEY]);
 f.click('[data-action="next-stop"]');assert.equal(f.state().selected,'machten-quotient');assert.equal(f.state().screen,'chapter');assert.equal(f.errors.length,0);
});
test('Wrong rules, missing answers and wrong clickable choices remain uncompleted until explicit correct control',async t=>{
 const f=await setup();t.after(()=>f.dom.window.close());f.click('[data-action="start"]');
 const wrong=f.task().choices.find(c=>c.id!==f.task().correct);f.click('[data-rule="'+wrong.id+'"]');assert.equal(f.state().mission.stage,-1);assert.equal(f.state().mission.attempts,1);
 f.click('[data-rule="'+f.task().correct+'"]');f.click('[data-action="check"]');assert.equal(f.state().mission.done,false);
 const answer=f.task().stages[0].slots[0].answer;f.click('[data-choice="'+[...f.w.document.querySelectorAll('[data-choice]')].find(b=>b.dataset.choice!==answer).dataset.choice+'"]');f.click('[data-action="check"]');
 assert.equal(f.state().mission.done,false);assert(!f.state().entries['machten-product']);assert.equal(f.w.document.querySelector('[role="status"]').dataset.error,'true');
 f.click('[data-choice="'+answer+'"]');assert.equal(f.state().mission.done,false,'Choosing does not submit');assert.equal(f.w.document.querySelector('li[aria-current="step"] h3').textContent,'Controleer');
 f.click('[data-action="check"]');assert.equal(f.state().mission.done,true);f.click('[data-action="undo"]');assert.equal(f.state().mission.stage,-1);assert.equal(f.state().entries['machten-product'].done.length,1);
 solveQuestion(f);assert.equal(f.state().entries['machten-product'].done.length,1,'Revisiting a solved question does not duplicate evidence');assert.equal(f.errors.length,0);
});
test('Hulp remains a different example, preserves the exact input and marks assisted work honestly',async t=>{
 const f=await setup();t.after(()=>f.dom.window.close());f.click('[data-action="start"]');f.click('[data-rule="'+f.task().correct+'"]');
 const answer=f.task().stages[0].slots[0].answer;f.click('[data-choice="'+answer+'"]');const before=f.state().mission,original=f.task();f.click('[data-action="help"]');
 assert.equal(f.state().screen,'help');assert.deepEqual(f.task(),original);assert.deepEqual(f.state().mission.values,before.values);assert.equal(f.state().mission.assisted,true);
 assert.notEqual(f.w.document.querySelector('.question .katex-mathml annotation').textContent,original.tex);
 f.click('[data-action="help-next"]');f.click('[data-action="help-return"]');assert.equal(f.state().screen,'play');assert.deepEqual(f.state().mission.values,before.values);
 f.click('[data-action="check"]');assert.equal(f.state().entries['machten-product'].done.length,1);assert.equal(f.state().entries['machten-product'].independent.length,0);assert.equal(f.errors.length,0);
});
test('A solved question waiting for Next resumes exactly instead of being replaced by a new seed',async t=>{
 const f=await setup();t.after(()=>f.dom.window.close());f.click('[data-action="start"]');solveQuestion(f);const before=f.state().mission;
 f.click('.workshop-nav [data-action="chapter"]');assert.match(f.w.document.querySelector('.path-detail .primary').textContent,/Verder/);f.click('[data-action="start"]');assert.deepEqual(f.state().mission,before);
 const restored=await setup({saved:f.save()});t.after(()=>restored.dom.window.close());restored.click('[data-action="start"]');assert.deepEqual(restored.state().mission,before);restored.click('[data-action="next"]');assert.equal(restored.state().mission.index,1);assert.equal(restored.state().mission.seed,before.seed);
});
test('Legacy edition-two negative tasks keep their seed, edition, stage and input; new verdieping remains available',async t=>{
 const old=fixture('machten-product',{index:4,stage:0,values:['-1']}),f=await setup({saved:old,url:'?onderdeel=machten-product&screen=play'});t.after(()=>f.dom.window.close());
 assert.deepEqual(f.state().mission,old.mission);assert.deepEqual(f.task(),L.make('machten-product',(321+Math.imul(5,2654435761))>>>0,4,2));assert(!f.state().mission.pathVersion);
 solveQuestion(f);f.click('[data-action="next"]');assert.equal(f.state().mission.index,5);assert.equal(f.state().mission.edition,2);solveQuestion(f);f.click('[data-action="next"]');
 f.click('[data-action="chapter"]');f.click('[data-action="start-advanced"]');assert.equal(f.state().mission.track,'verdieping');assert.equal(f.state().mission.edition,2);
 for(let i=0;i<4;i++){solveQuestion(f);f.click('[data-action="next"]');}assert(f.task().expression.includes('-'));assert.equal(f.state().mission.edition,2);assert.equal(f.errors.length,0);
});
test('A second goal parks the first goal; switching and a fresh document retain actual input and completion',async t=>{
 const f=await setup();t.after(()=>f.dom.window.close());f.click('[data-action="start"]');f.click('[data-rule="'+f.task().correct+'"]');const answer=f.task().stages[0].slots[0].answer;f.click('[data-choice="'+answer+'"]');const first=f.state().mission;
 f.click('.workshop-nav [data-action="chapter"]');f.click('[data-stop="machten-negatief"]');f.click('[data-action="start"]');assert.equal(f.state().mission.id,'machten-negatief');
 f.click('[data-action="chapter"]');f.click('[data-stop="machten-product"]');f.click('[data-action="start"]');assert.deepEqual(f.state().mission,first);
 const restored=await setup({saved:f.save(),url:'?onderdeel=machten-product&screen=play'});t.after(()=>restored.dom.window.close());assert.deepEqual(restored.state().mission,first);assert.equal(restored.state().runs['machten-negatief'].id,'machten-negatief');
 restored.click('[data-action="check"]');assert.equal(restored.state().entries['machten-product'].done.length,1);assert.equal(restored.errors.length,0);
});
test('Focused worksheet and practice links use existing providers, preserve the return path and teacher-only controls',async t=>{
 const f=await setup();t.after(()=>f.dom.window.close());const d=f.w.document;
 for(const mode of ['series','worksheet']){const u=new URL(d.querySelector('[data-world-mode="'+mode+'"]').href);assert.equal(u.searchParams.get('skills'),'power-product');assert.equal(u.searchParams.get('lesson'),'machten-product');assert(u.searchParams.get('returnTo').includes('machten-product'));if(mode==='worksheet')assert.equal(u.searchParams.get('intent'),'worksheet');}
 assert(!d.querySelector('[data-world-mode="students"]'));assert.match(d.querySelector('[data-world-mode="series"] small').textContent,/meedoen/);assert.doesNotMatch(d.querySelector('[data-world-mode="series"] small').textContent,/klas/);
 f.click('[data-stop="machten-betekenis"]');const u=new URL(d.querySelector('[data-world-mode="worksheet"]').href);assert.equal(u.searchParams.get('scope'),'chapter');assert.equal(u.searchParams.get('skills'),null);
 const teacher=await setup({role:'teacher'});t.after(()=>teacher.dom.window.close());assert(teacher.w.document.querySelector('[data-world-mode="students"]'));assert.match(teacher.w.document.querySelector('[data-world-mode="series"] small').textContent,/klas/);assert.equal(f.errors.length,0);assert.equal(teacher.errors.length,0);
});
test('All fourteen other routes share the workshop and retain original questions, guided choices and exact answer flow',async t=>{
 for(const stop of L.STOPS.filter(s=>s.id!=='machten-product')){
  const f=await setup({url:'?onderdeel='+stop.id});try{f.click('[data-action="start"]');assert.equal(f.state().mission.edition,2);assert.equal(f.state().mission.id,stop.id);assert(f.w.document.querySelector('.powers-play'));solveQuestion(f);assert.equal(f.state().mission.done,true,stop.id);assert.equal(f.state().entries[stop.id].done.length,1);assert.equal(f.errors.length,0);}finally{f.dom.window.close();}
 }
});
test('The root path contains all seven native units in four coherent freely accessible groups',async t=>{
 const f=await setup({url:'?thema=wortels'});t.after(()=>f.dom.window.close());const d=f.w.document;
 assert.equal(d.querySelectorAll('.path-group').length,4);
 assert.deepEqual([...d.querySelectorAll('[data-stop]')].map(n=>n.dataset.stop),W.ROOT_ORDER);
 assert.deepEqual(new Set(W.ROOT_ORDER),new Set(L.STOPS.filter(s=>s.theme==='wortels').map(s=>s.id)));
 assert.equal(d.querySelector('.path-count b').textContent,'0/7');assert.equal(f.state().mission,null);
 f.click('[data-stop="wortels-regels"]');f.click('[data-action="start"]');solveQuestion(f);
 assert.equal(f.state().mission.done,true);assert.match(d.querySelector('.workshop-nav').textContent,/Mijn wortelpad/);
});
test('World home keeps three chapters and all existing practice and paper entrances',async t=>{
 const f=await setup({url:'?screen=home'});t.after(()=>f.dom.window.close());const d=f.w.document;
 assert(d.querySelector('.workshop-home'));assert.equal(d.querySelectorAll('.themes .theme').length,3);
 assert(d.querySelector('.themes [data-topic="wetenschappelijk"]'));assert(d.querySelector('.world-actions [data-world-mode="series"]'));assert(d.querySelector('.world-actions [data-world-mode="worksheet"]'));
 assert.match(d.querySelector('.themes [data-topic="wetenschappelijk"]').href,/world=wetenschappelijk/);
});
test('Help keeps the exact different example and step through reload and menu return',async t=>{
 let f=await setup();t.after(()=>f.dom.window.close());f.click('[data-action="start"]');f.click('[data-rule="'+f.task().correct+'"]');
 const own=f.state().mission;f.click('[data-action="help"]');f.click('[data-action="help-next"]');
 const tex=f.w.document.querySelector('.question annotation').textContent,step=f.w.document.querySelector('.counter').textContent,saved=f.save();
 assert.equal(saved.help.step,1);assert.notEqual(tex,f.task().tex);
 f.dom.window.close();f=await setup({saved,url:'?onderdeel=machten-product&screen=help'});
 assert.equal(f.state().screen,'help');assert.equal(f.w.document.querySelector('.question annotation').textContent,tex);assert.equal(f.w.document.querySelector('.counter').textContent,step);
 f.click('.workshop-nav [data-action="menu-open"]');const menu=f.save();assert.equal(menu.menuFrom,'help');
 f.dom.window.close();f=await setup({saved:menu,url:'?onderdeel=machten-product&screen=menu'});f.click('[data-action="menu-close"]');
 assert.equal(f.state().screen,'help');assert.equal(f.w.document.querySelector('.question annotation').textContent,tex);assert.equal(f.w.document.querySelector('.counter').textContent,step);
 f.click('.workfoot [data-action="help-return"]');assert.deepEqual(f.state().mission.values,own.values);assert.equal(f.state().mission.seed,own.seed);
});
test('Old unfinished result URLs display and preserve the actual unfinished native question',async t=>{
 const saved=fixture('wortels-som',{stage:0,values:['2']}),f=await setup({saved,url:'?onderdeel=wortels-som&screen=summary'});t.after(()=>f.dom.window.close());
 assert.equal(f.state().screen,'play');assert.deepEqual(f.state().mission,saved.mission);assert(!f.w.document.querySelector('.powers-summary'));
 assert.equal(new URL(f.w.location.href).searchParams.get('screen'),'play');assert.equal(f.reports.at(-1)[0].length,0);
});
test('A legacy lone minus keeps its input without pretending the answer is ready for checking',async t=>{
 const saved=fixture('machten-product',{stage:0,values:['-']}),f=await setup({saved,url:'?onderdeel=machten-product&screen=play'});t.after(()=>f.dom.window.close());
 assert.equal(f.state().mission.values[0],'-');assert.equal(f.w.document.querySelector('li[aria-current="step"] h3').textContent,'Bouw de uitwerking');
 f.click('[data-action="check"]');assert.equal(f.state().mission.done,false);assert.equal(f.reports.at(-1)[0].length,0);
});
test('A finished root series reports the original unit and honest historical independent counts',async t=>{
 const f=await setup({url:'?onderdeel=wortels-vereenvoudigen'});t.after(()=>f.dom.window.close());f.click('[data-action="start"]');
 for(let i=0;i<6;i++){solveQuestion(f);f.click('[data-action="next"]');}
 assert.equal(f.state().screen,'summary');assert(f.w.document.querySelector('.powers-summary'));assert.match(f.w.document.querySelector('.workshop-summary').textContent,/In dit onderdeel: 6\/6/);
 assert.match(f.w.document.querySelector('.summary-note').textContent,/Eerdere reeksen tellen mee/);assert.deepEqual(Array.from(f.reports.at(-1)[0]),['wortels-vereenvoudigen']);assert.equal(f.reports.at(-1)[1],15);
 f.click('[data-action="next-stop"]');assert.equal(f.state().selected,'wortels-som');assert.equal(f.state().screen,'chapter');
});
test('All world screens keep the original hidden native breadcrumb and progress nodes',async t=>{
 const f=await setup();t.after(()=>f.dom.window.close());const d=f.w.document,nodes=['gameHomeBtn','crumbChapter','crumbLevel','getallenProgress'].map(id=>d.getElementById(id));
 f.click('[data-action="start"]');f.click('[data-action="help"]');f.click('.workshop-nav [data-action="menu-open"]');f.click('[data-action="menu-close"]');f.click('.workfoot [data-action="help-return"]');
 nodes.forEach(n=>assert.equal(d.getElementById(n.id),n));assert.equal(d.getElementById('getallenProgress').dataset.total,'15');
});
test('The last root unit ends at the world entrance without inventing an additional unit',async t=>{
 const f=await setup({url:'?onderdeel=wortels-regels'});t.after(()=>f.dom.window.close());f.click('[data-action="start"]');for(let i=0;i<6;i++){solveQuestion(f);f.click('[data-action="next"]');}
 assert.equal(f.state().screen,'summary');assert.equal(f.w.document.querySelector('.summary-actions [data-action="next-stop"]'),null);assert.equal(W.ROOT_ORDER.length+W.ORDER.length,15);
 f.click('.summary-actions [data-action="chapter"]');assert.equal(f.state().theme,'wortels');assert.equal(f.state().selected,'wortels-regels');
});
