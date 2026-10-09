'use strict';
// Actual native app and grader; fictitious account-bound storage, no network writes.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const L=require('../games/getallenwereld/lessons.js'),C=require('../games/bewerkingen-trainer/core.js');
const KEY='leraarbob.getallenwereld.v1',tick=()=>new Promise(resolve=>setImmediate(resolve));
const plain=value=>JSON.parse(JSON.stringify(value));

async function open({saved,url='',role='student',randomSeed}={}){
 const errors=[],reports=[],storage=new Map(saved?[[KEY,JSON.stringify(saved)]]:[]),console=new VirtualConsole();
 console.on('jsdomError',error=>errors.push(error.message));
 const dom=new JSDOM(read('games/getallenwereld/index.html'),{
  url:'https://school.example/LeraarBob/games/getallenwereld/'+url,
  runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:console
 }),w=dom.window;
 let randomCalls=0;
 if(randomSeed!==undefined)w.crypto.getRandomValues=values=>{randomCalls++;values.fill(randomSeed);return values;};
 w.AxiomaGame={active:true,account:{id:'qa-learner',role},storage:{
  getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)
 },report:(...values)=>reports.push(plain(values)),emit:()=>{}};
 w.eval(read('shared/vendor/katex/katex.min.js'));w.eval(read('js/catalog.js'));
 for(const file of ['shared/platform-routes.js','shared/game-registry.js']){
  Object.defineProperty(w.document,'currentScript',{configurable:true,value:{src:'https://school.example/LeraarBob/'+file}});
  w.eval(read(file));
 }
 for(const file of ['games/bewerkingen-trainer/core.js','games/getallenwereld/lessons.js','games/getallenwereld/guided-answer.js','games/getallenwereld/workshop.js','games/getallenwereld/app.js'])w.eval(read(file));
 await tick();await tick();
 const state=()=>plain(w.GetallenWorld.snapshot()),task=()=>plain(w.GetallenWorld.task());
 const click=selector=>{const node=w.document.querySelector(selector);assert(node,'Missing native action '+selector);assert(!node.disabled,'Disabled native action '+selector);node.click();};
 return {dom,w,state,task,click,errors,reports,storage,randomCalls:()=>randomCalls,saved:()=>JSON.parse(storage.get(KEY)),url:()=>w.location.href,close:()=>w.close()};
}
function nativeTask(mission){return L.make(mission.id,(mission.seed+Math.imul(mission.index+1,2654435761))>>>0,mission.index,mission.edition);}
function fixture(id,{edition=2,index=4,done=false}={}){
 const mission={id,edition,seed:4294960000,index,stage:0,values:[],done,assisted:true,attempts:3};
 const task=nativeTask(mission);mission.stage=task.stages.length-1;
 mission.values=task.stages[mission.stage].slots.map(slot=>slot.answer);
 if(!done&&mission.values.length>1)mission.values[mission.values.length-1]='';
 const entries={[id]:{done:done?[mission.seed+':'+index]:['42:1','42:2'],independent:done?[]:['42:1']}};
 return {version:1,screen:'play',theme:L.stop(id).theme,selected:id,entries,runs:{[id]:mission},mission};
}
function solve(f){
 if(f.state().mission.stage<0)f.click('[data-rule="'+f.task().correct+'"]');
 let guard=0;
 while(!f.state().mission.done){
  assert(++guard<20,'Native answer flow must advance');
  const stage=f.task().stages[f.state().mission.stage];
  stage.slots.forEach((slot,index)=>{f.click('[data-slot="'+index+'"]');f.click('[data-choice="'+slot.answer+'"]');});
  f.click('[data-action="check"]');
 }
}
const helpMath=f=>f.w.document.querySelector('.help .question annotation')?.textContent;

test('All fifteen native routes complete six real questions each, with genuine separate progress',async()=>{
 assert.equal(L.STOPS.length,15);assert.equal(L.STOPS.filter(stop=>stop.theme==='machten').length,8);assert.equal(L.STOPS.filter(stop=>stop.theme==='wortels').length,7);
 const f=await open();try{
  for(const stop of L.STOPS){
   f.w.document.getElementById('gameHomeBtn').click();f.click('[data-theme="'+stop.theme+'"]');f.click('[data-stop="'+stop.id+'"]');
   assert.equal(f.state().selected,stop.id);f.click('[data-action="start"]');
   const expressions=[];
   for(let index=0;index<6;index++){
    const mission=f.state().mission;assert.equal(mission.id,stop.id);assert.equal(mission.index,index);
    assert.deepEqual(f.task(),nativeTask(mission),stop.id+' retains the native generated question');
    assert.equal(f.w.document.querySelectorAll('#app input,#app textarea').length,0,'Original click answers remain');
    expressions.push(f.task().expression);solve(f);assert.equal(f.state().entries[stop.id].done.length,index+1);
    f.click('[data-action="next"]');
   }
   assert.equal(new Set(expressions).size,6,stop.id+' has six different questions');
   assert.equal(f.state().screen,'summary');assert.equal(f.state().entries[stop.id].independent.length,6);
  }
  const report=f.reports.at(-1);assert.equal(report[0].length,15);assert.equal(report[1],15);
  assert.equal(f.w.document.getElementById('getallenProgress').dataset.value,'15');
  assert.deepEqual([...f.storage.keys()],[KEY],'No fake XP or new progress identity');assert.deepEqual(f.errors,[]);
 }finally{f.close();}
});

test('Every original unit and edition has a verified six-question seed within the bounded fallback',()=>{
 for(const stop of L.STOPS)for(const edition of [1,2]){
  let valid=false;
  for(let probe=0;probe<4096;probe++){
   const seed=Math.imul(probe+1,2654435761)>>>0;
   const expressions=Array.from({length:6},(_,index)=>nativeTask({id:stop.id,seed,index,edition}).expression);
   if(new Set(expressions).size===6){valid=true;break;}
  }
  assert(valid,stop.id+' edition '+edition+' has six different original questions before the fallback bound');
 }
});

test('Exhausted random seeds still start six distinct native questions with genuine separate evidence',async()=>{
 // These real generator seeds produce duplicate expressions. Other units have
 // structurally distinct questions and can accept the fixed zero seed at once.
 const badSeeds={'machten-product':2654435761,'machten-quotient':2654435761,'machten-macht':2654435761,'machten-haakjes':2654435761,'machten-mix':2654435761};
 const variants=[...L.STOPS.map(stop=>({stop,edition:2})),{stop:L.stop('machten-product'),edition:1}];
 for(const {stop,edition} of variants){
  const randomSeed=edition===1?0:(badSeeds[stop.id]||0),f=await open({url:'?level='+stop.id,randomSeed});
  try{
   const generated=Array.from({length:6},(_,index)=>nativeTask({id:stop.id,seed:randomSeed,index,edition}).expression);
   const exhausted=new Set(generated).size<6;
   f.click(stop.id==='machten-product'&&edition===2?'[data-action="start-advanced"]':'[data-action="start"]');
   assert.equal(f.state().mission.edition,edition);
   assert.equal(f.randomCalls(),exhausted?500:1,stop.id+' uses actual crypto attempts before any deterministic fallback');
   if(exhausted)assert.notEqual(f.state().mission.seed,randomSeed,'A failed final random seed is never used for a new run');
   const expressions=[];
   for(let index=0;index<6;index++){
    const mission=f.state().mission;assert.equal(mission.index,index);
    assert.deepEqual(f.task(),nativeTask(mission),stop.id+' uses the unchanged native generator and grader');
    expressions.push(f.task().expression);solve(f);
    assert.equal(f.state().entries[stop.id].done.length,index+1);
    assert.equal(f.state().entries[stop.id].independent.length,index+1);
    f.click('[data-action="next"]');
   }
   assert.equal(new Set(expressions).size,6,stop.id+' edition '+edition+' starts six different questions even with fixed crypto');
   assert.equal(f.state().screen,'summary');assert.equal(f.w.document.getElementById('getallenProgress').dataset.value,'1');
   assert.deepEqual([...f.storage.keys()],[KEY]);assert.deepEqual(f.errors,[]);
  }finally{f.close();}
 }
});

for(const stop of L.STOPS)for(const edition of [1,2])test('Historical '+stop.id+' edition '+edition+' preserves the exact unfinished work',async()=>{
 const saved=fixture(stop.id,{edition}),f=await open({saved,url:'?level='+stop.id+'&screen=play'});
 try{
  assert.deepEqual(f.state().mission,saved.mission);assert.deepEqual(f.state().runs[stop.id],saved.mission);
  assert.deepEqual(f.state().entries,saved.entries);assert.deepEqual(f.task(),nativeTask(saved.mission));
  assert.equal(f.state().mission.done,false,'Filled inputs do not silently submit a historical answer');
  f.w.document.getElementById('menuBtn').click();assert.equal(f.state().screen,'menu');
  f.click('[data-action="menu-close"]');assert.equal(f.state().screen,'play');assert.deepEqual(f.state().mission,saved.mission);
  const restored=await open({saved:f.saved(),url:new URL(f.url()).search});try{
   assert.deepEqual(restored.state().mission,saved.mission);assert.deepEqual(restored.state().entries,saved.entries);assert.deepEqual(restored.task(),nativeTask(saved.mission));
   solve(restored);assert.equal(restored.state().mission.done,true);assert.equal(restored.state().mission.seed,saved.mission.seed);
   assert.equal(restored.state().entries[stop.id].independent.length,1,'Previously assisted work does not gain independent evidence');
   assert.deepEqual(restored.errors,[]);
  }finally{restored.close();}
  assert.deepEqual(f.errors,[]);
 }finally{f.close();}
});

for(const stop of L.STOPS)test('Solved '+stop.id+' waiting for Next resumes without replacing its question',async()=>{
 const saved=fixture(stop.id,{index:2,done:true}),f=await open({saved,url:'?level='+stop.id+'&screen=play'});
 try{
  assert.deepEqual(f.state().mission,saved.mission);assert.deepEqual(f.task(),nativeTask(saved.mission));
  f.click('.workshop-nav [data-action="chapter"]');assert.equal(f.state().screen,'chapter');
  assert.match(f.w.document.querySelector('.path-detail .primary').textContent,/Verder/);
  f.click('[data-action="start"]');assert.deepEqual(f.state().mission,saved.mission);
  const restored=await open({saved:f.saved(),url:'?level='+stop.id});try{
   restored.click('[data-action="start"]');assert.deepEqual(restored.state().mission,saved.mission);
   restored.click('[data-action="next"]');assert.equal(restored.state().mission.index,3);assert.equal(restored.state().mission.seed,saved.mission.seed);
   assert.equal(restored.state().mission.done,false);assert.equal(restored.state().entries[stop.id].done.length,1);assert.deepEqual(restored.errors,[]);
  }finally{restored.close();}
  assert.deepEqual(f.errors,[]);
 }finally{f.close();}
});

test('Help example, help stage and own partial work survive both menu and document reload',async()=>{
 const f=await open({url:'?level=machten-quotient'});try{
  f.click('[data-action="start"]');f.click('[data-rule="'+f.task().correct+'"]');
  f.click('[data-choice="'+f.task().stages[0].slots[0].answer+'"]');const own=f.state().mission,ownTask=f.task();
  f.click('[data-action="help"]');f.click('[data-action="help-next"]');
  const helper=f.state().help,formula=helpMath(f);assert.equal(helper.step,1);assert.notEqual(formula,ownTask.tex);
  assert.deepEqual(f.state().mission.values,own.values);assert.equal(f.state().mission.assisted,true);
  f.w.document.getElementById('menuBtn').click();assert.equal(f.state().screen,'menu');assert.equal(f.state().menuFrom,'help');
  const restored=await open({saved:f.saved(),url:new URL(f.url()).search});try{
   assert.equal(restored.state().screen,'menu');assert.deepEqual(restored.state().help,helper);
   restored.click('[data-action="menu-close"]');assert.equal(restored.state().screen,'help');assert.equal(helpMath(restored),formula);
   assert.deepEqual(restored.state().help,helper);assert.deepEqual(restored.task(),ownTask);
   const direct=await open({saved:restored.saved(),url:new URL(restored.url()).search});try{
    assert.equal(direct.state().screen,'help');assert.deepEqual(direct.state().help,helper);assert.equal(helpMath(direct),formula);
    direct.click('[data-action="help-return"]');assert.equal(direct.state().screen,'play');assert.deepEqual(direct.state().mission.values,own.values);
    solve(direct);assert.equal(direct.state().entries[own.id].independent.length,0);assert.deepEqual(direct.errors,[]);
   }finally{direct.close();}
   assert.deepEqual(restored.errors,[]);
  }finally{restored.close();}
  assert.deepEqual(f.errors,[]);
 }finally{f.close();}
});

test('A stale result URL cannot declare an unfinished or early solved question finished',async()=>{
 for(const done of [false,true]){
  const saved=fixture('wortels-som',{index:2,done});saved.screen='summary';
  const f=await open({saved,url:'?level=wortels-som&screen=summary'});try{
   assert.equal(f.state().screen,'play');assert.deepEqual(f.state().mission,saved.mission);
   assert.equal(f.w.document.querySelector('.powers-summary'),null);assert.equal(new URL(f.url()).searchParams.get('screen'),'play');
   assert.deepEqual(f.errors,[]);
  }finally{f.close();}
 }
});

test('All three topics offer the existing role-correct modes and worksheets, without new identities',()=>{
 const catalog=JSON.parse(read('games.json')),registry=require('../shared/game-registry.js')(catalog,{baseURL:'https://school.example/LeraarBob/'});
 const model=require('../os/desktop-model.js')(registry,{baseURL:'https://school.example/LeraarBob/'});
 const expected={guest:['solo','series','local'],student:['solo','series','local','learn','online'],teacher:['solo','series','local','classroom','teacher','learn','online','classlearn']};
 for(const topic of ['machten','wortels','wetenschappelijk'])for(const role of Object.keys(expected)){
  assert.deepEqual(model.modes('getallenwereld',role,topic).map(mode=>mode.id),expected[role]);
  for(const mode of expected[role]){
   const url=new URL(model.destination('getallenwereld',mode,{role,topicId:topic}));
   const file=url.pathname.replace('/LeraarBob/','');assert(fs.existsSync(path.join(root,file.endsWith('/')?file+'index.html':file)));
   assert.equal(url.searchParams.get(mode==='solo'&&topic!=='wetenschappelijk'?'topic':'world'),topic);
   if(mode==='learn'||mode==='online'){assert.equal(url.searchParams.get('audience'),'duo');assert.equal(url.searchParams.get('view'),mode==='learn'?'learn':'battle');}
   if(mode==='classlearn'){assert.equal(url.searchParams.get('audience'),'class');assert.equal(url.searchParams.get('view'),'learn');}
  }
  const sheet=registry.worksheets('getallenwereld',{topicId:topic});assert.equal(sheet.length,1);
  assert.equal(new URL(sheet[0].href,registry.baseURL).searchParams.get('intent'),'worksheet');
 }
 assert.deepEqual(registry.components('getallenwereld').map(game=>({id:game.id,progressId:game.progressId,total:game.progressTotal})),[
  {id:'getallenwereld',progressId:'getallenwereld',total:15},{id:'bewerkingen-trainer',progressId:'bewerkingen-trainer',total:16}
 ]);
 assert.equal(C.SKILLS.filter(skill=>skill.group==='wetenschappelijk').map(skill=>skill.id).join(','),'scientific');
 for(const level of [0,1,2])for(const seed of [1,42,4294967295]){
  const task=C.generate('scientific',seed,level,0);assert(C.check(task,task.answer).ok,'The existing scientific generator and exact grader remain usable at level '+level);
 }
});

test('Each guided goal keeps its honest targeted practice/paper links and current return place',async()=>{
 for(const stop of L.STOPS){
  const f=await open({url:'?level='+stop.id+'&returnTo=%2FLeraarBob%2Fos%2F',role:'student'});try{
   for(const mode of ['series','worksheet']){
    const link=f.w.document.querySelector('[data-world-mode="'+mode+'"]'),url=new URL(link.href),skills=L.practiceSkills(stop.id);
    assert.equal(url.searchParams.get('world'),stop.theme);assert.equal(url.searchParams.get('lesson'),stop.id);
    assert.equal(url.searchParams.get('skills'),skills.length?skills.join(','):null);
    assert.equal(url.searchParams.get('scope'),skills.length?null:'chapter');
    const back=new URL(url.searchParams.get('returnTo'),url.origin);assert.equal(back.searchParams.get('level'),stop.id);assert.equal(back.searchParams.get('screen'),'chapter');
    if(mode==='worksheet')assert.equal(url.searchParams.get('intent'),'worksheet');
   }
   assert(!f.w.document.querySelector('[data-world-mode="students"]'));assert.deepEqual(f.errors,[]);
  }finally{f.close();}
 }
 const teacher=await open({role:'teacher'});try{assert(teacher.w.document.querySelector('[data-world-mode="students"]'));assert.deepEqual(teacher.errors,[]);}finally{teacher.close();}
});
