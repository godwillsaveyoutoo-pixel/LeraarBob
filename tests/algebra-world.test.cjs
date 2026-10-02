const {test}=require('node:test'),assert=require('node:assert/strict');
const W=require('../games/algebra-trainer/world-core.js');
const equations=require('../games/algebra-trainer/core.js'),operations=require('../games/bewerkingen-trainer/core.js');
test('every existing exercise has a stable topic, with reachable dependencies',()=>{
 assert.equal(new Set(W.topics.map(t=>t.id)).size,W.topics.length);
 assert.deepEqual(W.topics.filter(t=>t.engine==='equations').map(t=>t.skill).sort(),equations.TYPES.map(t=>t.id).sort());
 assert.deepEqual(W.topics.filter(t=>t.engine==='operations').map(t=>t.skill).sort(),operations.SKILLS.map(t=>t.id).sort());
 let p=W.normalize(null);
 for(const t of W.topics){assert(W.unlocked(p,t.id),t.id+' is reachable');for(let i=0;i<W.GOAL;i++)p=W.record(p,t.id,t.id+i).progress;}
 assert.equal(W.xp(p),W.topics.length*W.REWARD);
});
test('three distinct answers unlock the next topic and award XP once',()=>{
 let p=W.normalize(null);assert(W.unlocked(p,'eq-A2'));assert(!W.unlocked(p,'eq-A3'));
 assert.equal(W.record(p,'eq-A3','premature').xp,0);assert.deepEqual(W.record(p,'eq-A3','premature').progress,p);
 p=W.record(p,'eq-A2','answer-1').progress;p=W.record(p,'eq-A2','answer-1').progress;
 assert.equal(p.topics['eq-A2'].answers.length,1);assert(!W.unlocked(p,'eq-A3'));assert.equal(W.xp(p),0);
 p=W.record(p,'eq-A2','answer-2').progress;const completed=W.record(p,'eq-A2','answer-3');assert.equal(completed.xp,30);p=completed.progress;
 assert(W.unlocked(p,'eq-A3'));assert.equal(W.xp(p),30);assert.equal(W.record(p,'eq-A2','answer-4').xp,0);
 assert.equal(W.xp(W.normalize(JSON.parse(JSON.stringify(p)))),30);
});
test('legacy work opens its successors without inventing XP',()=>{
 const p=W.normalize(null);assert(W.unlocked(p,'eq-A3',['eq-A2']));assert(W.unlocked(p,'eq-E1',['eq-E1']));assert.equal(W.xp(p),0);
 assert(W.unlocked(p,'op-power-power'));assert(W.unlocked(p,'op-square-factor'));assert(W.unlocked(p,'op-scientific'));
 assert(!W.unlocked(p,'sys-unique'));assert(W.unlocked(p,'sys-unique',['eq-E1']));
});
test('merging separate game records preserves earned rewards without double counting',()=>{
 let a=W.normalize(null),b=W.normalize(null);for(let i=0;i<3;i++){a=W.record(a,'eq-A2','eq'+i).progress;b=W.record(b,'op-power-power','op'+i).progress;}
 const merged=W.merge(a,b,a);assert.equal(W.xp(merged),60);assert(W.unlocked(merged,'op-power-product'));assert(W.unlocked(merged,'eq-A3'));
 assert.equal(W.xp({topics:{'eq-A2':{answers:['a','a'],rewarded:true}}}),0);
 assert.deepEqual(W.normalize({topics:{unknown:{answers:['a','b','c'],rewarded:true}}}),{topics:{}});
});
