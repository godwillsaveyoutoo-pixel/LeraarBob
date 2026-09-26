'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const R=require('../games/rechten/trainer-v2/mission-runtime.js'),M=require('../games/rechten/trainer-v2/semantic-math-core.js'),W=require('../games/rechten/trainer/wave-core.js');
const clone=v=>JSON.parse(JSON.stringify(v)),qstr=q=>`${q.n}/${q.d}`;
function fill(state,values){let s=state;for(const [key,value]of Object.entries(values))s=R.edit(s,key,value);return s;}
function response(m,direction='AB'){
 const t=m.task;
 if(m.phase==='root')return {root:qstr(t.root)};
 if(['interval','symbol'].includes(m.phase)){const v=M.intervalExpected(t);return {boundary:t.root?qstr(t.root):'',side:v.side,closed:false,symbol:v.symbol,symbolBoundary:t.root?qstr(t.root):''};}
 if(m.phase==='deltas'){const A=t.points[direction==='AB'?'A':'B'],B=t.points[direction==='AB'?'B':'A'];return {direction,dx:qstr(W.sub(B.x,A.x)),dy:qstr(W.sub(B.y,A.y))};}
 if(m.phase==='rate')return {numerator:qstr(t.model.a),denominator:'1'};
 if(m.phase==='probe')return {probe:'zero',expected:qstr(t.model.b)};
 if(m.phase==='repair')return {feature:'swapped',a:qstr(t.model.a),b:qstr(t.model.b)};
 if(m.phase==='hidden')return {hidden:qstr(t.hidden.y)};
 throw Error('Unsupported stage '+m.phase);
}
function success(state,direction){const edited=fill(state,response(R.active(state),direction)),before=clone(edited),result=R.commit(edited);assert.deepEqual(edited,before,'commit is pure');assert.equal(R.active(result).feedback.result.ok,true,JSON.stringify(R.active(result)));assert.equal(result.events.length,edited.events.length+1);assert.deepEqual(R.commit(result),result,'double commit has no effect');return R.advance(result);}
function nextCase(state,direction){const index=R.active(state).index;let s=state,n=0;while(R.active(s).index===index&&!R.active(s).completed){s=success(s,direction);assert(++n<10)}return s;}
function finish(state,direction){let s=state,n=0;while(!R.active(s).completed){s=success(s,direction);assert(++n<30)}return s;}

test('all three missions complete through explicit commit/advance with contrasting cases and no production mastery',()=>{
 const expectedCases={grenspas:4,hellingrug:2,signaalstad:2};let state=R.initial();
 for(const world of R.worlds.filter(w=>w!=='puntenbaai')){state=R.start(state,world);state=finish(state,world==='hellingrug'?'BA':'AB');const m=R.active(state);assert(m.completed);assert.equal(m.phase,'complete');assert.equal(m.completion.length,expectedCases[world]);assert.equal(m.completion[0].supported,true,'discovery is not independent evidence');assert(m.completion.slice(1).every(c=>!c.supported));assert.deepEqual(R.commit(state),state);assert.deepEqual(R.advance(state),state)}
 assert.equal(Object.keys(state.missions).length,3);assert.equal(state.events.length,18);assert(state.events.every(e=>e.mastery===false));assert(!Object.hasOwn(state,'skills'));assert(!Object.hasOwn(state,'xp'));
});
test('Grenspas actually exercises f>0 and f<0 with falling contrast and horizontal all/none reasoning',()=>{
 let s=R.start(R.initial(),'grenspas');const cases=[];
 while(!R.active(s).completed){const m=R.active(s);cases.push({ask:m.task.ask,slope:m.task.model.a.n,root:m.task.root,phase:m.phase});s=nextCase(s)}
 assert.equal(cases.length,4);assert(cases.some(c=>c.slope>0&&c.ask==='positive'));assert(cases.some(c=>c.slope<0&&c.ask==='positive'));assert(cases.some(c=>c.slope<0&&c.ask==='negative'));assert(cases.some(c=>c.slope===0));assert.equal(cases[0].phase,'root');assert(cases.slice(1).every(c=>c.phase==='interval'),'contrast cannot reveal the root in a preceding question');
});
test('JSON reload preserves every partial answer, hint, feedback, lock and completed task exactly',()=>{
 for(const world of R.worlds.filter(w=>w!=='puntenbaai')){let s=R.start(R.initial(),world),turn=0;while(!R.active(s).completed){const fields=response(R.active(s));for(const [key,value]of Object.entries(fields)){s=R.edit(s,key,value);assert.deepEqual(clone(s),s)}s=R.commit(s);const reloaded=clone(s);assert.deepEqual(R.advance(reloaded),R.advance(s));assert.deepEqual(R.commit(reloaded),s);s=R.advance(reloaded);assert(++turn<30)}assert.deepEqual(clone(s),s)}
});
test('opening another world preserves an unfinished task and its draft; restart uses a new run ID',()=>{
 let s=R.start(R.initial(),'hellingrug');s=fill(s,{direction:'BA',dx:'-4',dy:'2'});s=R.hint(s);const old=clone(R.active(s));s=R.start(s,'grenspas');assert.deepEqual(s.missions.hellingrug,old);s=R.start(s,'hellingrug');assert.deepEqual(R.active(s),old);const restarted=R.start(s,'hellingrug',true);assert.equal(R.active(restarted).run,old.run+1);assert.deepEqual(s.missions.hellingrug,old);
});
test('wrong delta locks only correct components; undo cannot discard the confirmed correct component',()=>{
 let s=R.start(R.initial(),'hellingrug');const answer=response(R.active(s));s=fill(s,{...answer,dy:qstr(W.mul(-1,W.parse(answer.dy)))});s=R.commit(s);assert.equal(R.active(s).feedback.result.code,'delta.orientation_mixed');assert.equal(R.active(s).feedback.result.keep.dx,true);assert.equal(R.active(s).feedback.result.keep.dy,false);s=R.advance(s);assert.equal(R.active(s).locks.dx,true);assert.deepEqual(R.edit(s,'dx','999'),s);const undone=R.undo(s);assert.equal(R.active(undone).values.dx,answer.dx);assert.equal(R.active(undone).locks.dx,true);s=R.edit(s,'dy',answer.dy);s=R.commit(s);assert(R.active(s).feedback.result.ok);assert.equal(s.events.at(-1).independent,false);
});
test('rate error keeps both deltas and correction does not become independent; hidden point is a new input',()=>{
 let s=R.start(R.initial(),'hellingrug');s=nextCase(s);s=success(s,'BA');assert.equal(R.active(s).phase,'rate');const {a}=R.active(s).task.model;s=fill(s,{numerator:String(a.d),denominator:String(a.n)});s=R.commit(s);assert.equal(R.active(s).feedback.result.code,'slope.reciprocal');s=R.advance(s);assert.equal(R.active(s).locks.dx,true);assert.equal(R.active(s).locks.dy,true);s=success(s);assert.equal(R.active(s).phase,'hidden');const t=R.active(s).task;assert(!W.eq(t.hidden.x,t.points.A.x));assert(!W.eq(t.hidden.x,t.points.B.x));s=success(s);assert.equal(s.events.at(-1).phase,'transfer');assert.equal(s.events.at(-1).independent,false,'same helped/error task is not independent transfer');
});
test('signal fault repair is an atomic commit with a preserved correct coefficient and a later x10 probe',()=>{
 let s=R.start(R.initial(),'signaalstad');s=nextCase(s);s=fill(s,{probe:'difference',expected:qstr(R.active(s).task.model.a)});s=R.advance(R.commit(s));assert.equal(R.active(s).phase,'repair');const correct=response(R.active(s));s=fill(s,{...correct,b:'999'});s=R.commit(s);assert.equal(R.active(s).feedback.result.keep.a,true);assert.equal(R.active(s).feedback.result.keep.b,false);s=R.advance(s);assert.equal(R.active(s).locks.a,true);assert.deepEqual(R.edit(s,'a','999'),s);s=R.edit(s,'b',correct.b);s=R.advance(R.commit(s));assert.equal(R.active(s).phase,'hidden');assert(W.eq(R.active(s).task.hidden.x,10));s=success(s);assert.equal(s.events.at(-1).phase,'transfer');
});
test('syntax errors do not count as misconceptions and later clean valid input remains independent',()=>{
 let s=R.start(R.initial(),'hellingrug');s=nextCase(s);s=fill(s,{direction:'AB',dx:'1/0',dy:'2'});s=R.commit(s);assert.equal(R.active(s).feedback.result.kind,'interaction_error');assert.equal(R.active(s).errors,0);assert.equal(s.events.at(-1).misconception,null);assert.equal(s.events.at(-1).independent,false);s=R.advance(s);s=fill(s,response(R.active(s)));s=R.commit(s);assert.equal(s.events.at(-1).independent,true);
});
test('a hint on an evidence case suppresses independent claims; full example creates a genuinely new task ID',()=>{
 let s=R.start(R.initial(),'grenspas');s=nextCase(s);for(let i=0;i<7;i++)s=R.hint(s);assert.equal(R.active(s).hints,5);const original=clone(R.active(s));s=fill(s,response(R.active(s)));s=R.commit(s);assert.equal(s.events.at(-1).independent,false);assert.equal(s.events.at(-1).helpLevel,5);const fresh=R.newAfterExample(s);assert.notEqual(R.active(fresh).task.id,original.task.id);assert.notDeepEqual(R.active(fresh).task.model,original.task.model);assert.equal(R.active(fresh).run,original.run+1);assert.equal(R.active(fresh).hints,0);assert.equal(R.active(fresh).feedback,null);assert.equal(fresh.events.length,s.events.length);
});
test('editing and undo are pure and frozen during feedback, while progress requires explicit advance',()=>{
 let s=R.start(R.initial(),'grenspas');const before=clone(s);s=R.edit(s,'root','3');assert.deepEqual(R.undo(s),before);s=fill(s,response(R.active(s)));const committed=R.commit(s);assert.equal(R.active(committed).phase,'root');assert.deepEqual(R.edit(committed,'root','999'),committed);assert.deepEqual(R.undo(committed),committed);assert.equal(R.active(R.advance(committed)).phase,'interval');
});
