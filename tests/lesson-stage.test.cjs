const {test}=require('node:test'),assert=require('node:assert/strict');
const Engine=require('../shared/lesson-stage/engine.js'),Lesson=require('../lessons/rechten-arbeid/lesson.js'),Game=require('../games/rechten/rechtenwereld/battle-config.js');
test('content schema and every native battle task are deterministic',()=>{
 Engine.validate(Lesson);assert.equal(Lesson.deck.length,20);for(const spec of Lesson.deck)assert.deepEqual(Game.generate(spec),Game.generate(spec));
 assert.equal(Lesson.band(19),'LAATSTE RECHTE');assert.equal(new Set(Lesson.steps.map(s=>s.id)).size,Lesson.steps.length);
 assert.throws(()=>Engine.validate({...Lesson,steps:[{id:'a',events:[{type:'unknown'}]}]}));
});
test('navigation cancels old cues, restores cursor and does not repeat live mutations',async()=>{
 const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},seen=[];
 const lesson={id:'test',version:1,steps:[{id:'one',events:[{type:'text',text:'old',at:25}]},{id:'two',events:[{type:'scene',art:'route'}]}]};
 const engine=Engine.create({lesson,storage,adapters:{text:e=>seen.push(e.text),scene:()=>seen.push('scene')}});engine.show();engine.next();await new Promise(r=>setTimeout(r,50));assert.deepEqual(seen,['scene']);assert.equal(Engine.create({lesson,storage,adapters:{}}).index,1);engine.previous();engine.restart();await new Promise(r=>setTimeout(r,50));assert.deepEqual(seen,['scene','old']);engine.destroy();
});
test('all 20 native tasks can be solved and are accepted by the deployed worker policy',async()=>{
 const R=require('../games/rechten/rechtenwereld/mission-runtime.js'),{fill}=require('./helpers/rechten-question-fixtures.cjs'),policy=(await import('../supabase/functions/rechten-duo/policy.js')).default;
 for(const spec of Lesson.deck){let s=Game.generate(spec);const steps=[];for(let n=0;n<8;n++){s=fill(s);const m=R.active(s);steps.push({phase:m.phase,values:structuredClone(m.values)});s=R.commit(s);const feedback=R.active(s).feedback;assert(feedback?.result.ok,spec.skill);if(feedback.next==='next-task')break;s=R.advance(s);}assert(Game.validate(Game.generate(spec),{steps}).ok,spec.skill);assert(policy.grade(spec,{steps}),spec.skill);}
});
test('editing the storyboard restores a scene by id, including the original 33-step cursor',()=>{
 let value=JSON.stringify({index:24});const storage={getItem:()=>value,setItem:(k,v)=>value=v};
 const engine=Engine.create({lesson:Lesson,storage,adapters:{}});assert.equal(engine.step.id,'correctie');engine.show();assert.equal(JSON.parse(value).step,'correctie');
 const edited={...Lesson,steps:[{id:'extra',events:[{type:'text',text:'new'}]},...Lesson.steps]};assert.equal(Engine.create({lesson:edited,storage,adapters:{}}).step.id,'correctie');engine.destroy();
});
test('the spoken storyboard uses explicit clicks for claims and punchlines',()=>{
 for(const id of ['zelf-lopen','server-uitleg','denkruimte','eerlijk-startpunt','helpen-zelf','parasiet','anderhalve-maand','deal','uitloop']){
  const step=Lesson.steps.find(s=>s.id===id);assert(step,id);assert.equal(step.events.filter(e=>e.type==='text').length,1,id+' must hold its text until teacher navigation');
 }
 assert.equal(Lesson.steps.find(s=>s.id==='werktijd').events.find(e=>e.type==='pause').duration,900000);
 assert(Lesson.checks.some(c=>c.question==='Waar zat jouw grootste probleem?'));
});
test('all twenty readers have a stable duo and absence never leaves an empty reading turn',()=>{
 const Readers=require('../shared/lesson-stage/readers.js');assert.equal(Lesson.readers.length,20);assert.equal(new Set(Lesson.readers).size,20);assert.deepEqual(Lesson.readerPairs.flat(),Lesson.readers);
 const used=new Set(Lesson.steps.filter(s=>s.reading?.lead!=='teacher').flatMap(s=>Lesson.readerPairs[s.reading?.pair]||[]));assert.equal(used.size,20);
 const reading={pair:6,lead:0};assert.deepEqual(Readers.resolve(reading,Lesson).speakers,['Shakira']);assert.deepEqual(Readers.resolve(reading,Lesson,{absent:['Shakira']}).speakers,['Nilay']);
 const both=Readers.resolve({...reading,lead:'pair'},Lesson,{absent:['Shakira','Nilay']});assert.equal(both.team.length,2);assert(both.team.every(n=>!['Shakira','Nilay'].includes(n)));
 assert.deepEqual(Readers.resolve(reading,Lesson,{absent:Lesson.readers}).speakers,['LeraarBob']);assert.deepEqual(Readers.resolve(reading,Lesson,{assignments:{6:['Paris','Paris']}}).team,['Paris']);
 assert.deepEqual(Readers.resolve({pair:6,lead:'teacher'},Lesson,{absent:Lesson.readers}).speakers,['LeraarBob']);
 assert.equal(new Set(['boot','boot-samen','anderhalve-maand'].map(id=>Lesson.steps.find(s=>s.id===id).reading.pair)).size,1);
 assert.equal(Lesson.steps.find(s=>s.id==='belofte-leraar').reading.lead,'teacher');
 for(const step of Lesson.steps.filter(s=>s.reading&&s.reading.lead!=='teacher'))assert.equal(step.reading.lead,'pair',step.id);
 assert.equal(Lesson.steps.find(s=>s.id==='onze-les').events.find(e=>e.type==='text').noteSpeaker,undefined);
});

test('live identity initializes the signed-out view and follows later account changes once',async()=>{
 const vm=require('node:vm'),fs=require('node:fs'),seen=[];let identity;
 const context={window:{},AxiomaAuth:{onChange:fn=>{identity=fn;},ready:async()=>({account:null})},addEventListener:()=>{},localStorage:{getItem:()=>null},clearTimeout,setTimeout};
 vm.runInNewContext(fs.readFileSync(require.resolve('../shared/lesson-stage/live.js'),'utf8'),context);
 context.window.LessonLive.create(state=>seen.push(state.account?.id||null),error=>{throw error;});await new Promise(resolve=>setImmediate(resolve));
 identity({account:null});identity({account:{id:'teacher',role:'teacher'}});identity({account:{id:'teacher',role:'teacher'}});identity({account:null});
 assert.deepEqual(seen,[null,'teacher',null]);
});
