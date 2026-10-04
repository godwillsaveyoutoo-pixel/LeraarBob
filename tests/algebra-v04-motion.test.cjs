const assert=require('node:assert/strict');
const C=require('../games/algebra-trainer/core.js'),M=require('../games/algebra-trainer/motion-core.js');
const katex=require('../shared/vendor/katex/katex.min.js');
let checked=0;
for(const policy of [{allowNegative:false,allowFractions:false,allowDecimals:false},{allowNegative:true,allowFractions:true,allowDecimals:true}]){
 for(const type of C.TYPES)for(let seed=1;seed<=20;seed++){
  const ex=C.generateSeeded(type.id,policy,0,seed);
  ex.steps.forEach((s,i)=>{
   const record=M.frames(ex.states[i],s.op,s.operand,ex.policy);
   assert.equal(C.eqSig(record.after),C.eqSig(ex.states[i+1]));
   assert.equal(record.frames.at(-1).tex,C.latexEq(ex.states[i+1],ex.policy));
   assert.ok(record.frames.every(f=>f.delay>=850&&f.caption.length));
   record.frames.forEach(f=>assert.ok(!katex.renderToString(f.tex,{throwOnError:true,strict:'ignore',trust:ctx=>ctx.command===String.fromCharCode(92)+'htmlClass'}).includes('katex-error')));checked++;
  });
 }
}
const eq=C.EQ(C.Add(C.Mul(C.N(3),C.V()),C.N(6)),C.N(15));
const cancellation=M.frames(eq,'-',C.N(6),{});
assert.ok(cancellation.frames[0].tex.includes('- 6'));
assert.ok(cancellation.frames[1].tex.includes('motion-zero'));
assert.equal(cancellation.frames[2].tex,'3x = 9');
const vars=M.frames(C.EQ(C.Add(C.V(),C.N(3)),C.Add(C.Mul(C.N(2),C.V()),C.N(7))),'-',C.V(),{});
assert.ok(vars.frames[0].tex.includes('- x'));
assert.ok(vars.frames[1].tex.includes('motion-zero'));
assert.ok(!vars.frames.at(-1).tex.includes('motion-'));
const lone=M.frames(C.EQ(C.V(),C.N(4)),'-',C.V(),{});
assert.ok(lone.frames[1].tex.includes('motion-zero-kept'));assert.ok(lone.frames.at(-1).tex.startsWith('0 = '));
assert.throws(()=>M.frames(eq,'/',C.N(0),{}));
assert.throws(()=>M.frames(eq,'*',C.N(0),{}));
// Pause retains the remaining duration; replay/cancel invalidate pending work.
let now=0,id=0,timers=new Map(),seen=[],finished=0;
const clock={now:()=>now,set:(f,t)=>{timers.set(++id,{f,due:now+t});return id},clear:i=>timers.delete(i)};
const advance=ms=>{const end=now+ms;while(true){const next=[...timers].sort((a,b)=>a[1].due-b[1].due)[0];if(!next||next[1].due>end)break;now=next[1].due;timers.delete(next[0]);next[1].f()}now=end};
const player=new M.Player((f,i)=>seen.push(i),()=>finished++,clock);
player.start(cancellation.frames);advance(600);player.pause();advance(10000);
assert.deepEqual(seen,[0]);assert.equal(finished,0);player.resume();advance(899);assert.deepEqual(seen,[0]);advance(1);assert.deepEqual(seen,[0,1]);
player.start(cancellation.frames);assert.equal(player.index,0);advance(1500);assert.equal(player.index,1);player.cancel();advance(10000);assert.equal(finished,0);
player.start(cancellation.frames);advance(10000);assert.equal(finished,1);assert.equal(player.active,false);
console.log(JSON.stringify({ok:true,checkedSteps:checked,pauseReplayCancel:true}));
