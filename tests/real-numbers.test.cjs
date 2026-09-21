const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../games/reele-getallen/real-core.js'),L=require('../games/reele-getallen/real-lessons.js'),P=C.Progress;
function solution(t){const a=C.freshAnswer(t);switch(t.skill){case 'fraction':a.values=[String(Math.abs(t.target.n)),String(t.target.d)];a.sign=Math.sign(t.target.n)||1;break;case 'compare':a.relation=t.target;break;case 'line':a.tick=t.tick;break;case 'root':a.values=[String(t.k),String(t.k+1)];a.stage=1;break;case 'interval':a.values=[String(t.lo),String(t.hi)];a.closedLo=t.closedLo;a.closedHi=t.closedHi;break;case 'classify':a.labels=t.target;break;case 'period':Object.assign(a,t.target);break;case 'group':a.groups=t.tokens.map(e=>C.equal(C.value(e),C.value(t.tokens[0]))?'A':'B');break;}return a}
test('exact number model: decimal commas, signs, equivalent fractions, percentages and roots',()=>{
 assert.deepEqual(C.value(C.percent(75)),C.rational(3,4));assert.deepEqual(C.parse('−0,75'),C.rational(-3,4));assert(C.equal(C.value(C.sqrt(16)),C.rational(4)));
 assert(C.compare(C.value(C.sqrt(10)),C.parse('3,2'))<0);assert(C.compare(C.value(C.sqrt(2,-1)),C.parse('-1,5'))>0);
 assert.equal(C.compare(C.value(C.sqrt(2,-1)),C.value(C.sqrt(3,-1))),1);
 assert.deepEqual(C.value({kind:'period',whole:0,lead:'1',repeat:'6'}),C.rational(1,6));assert.deepEqual(C.value({kind:'period',whole:0,repeat:'9'}),C.rational(1));
 for(const input of ['', '-', '1,', 'NaN','1/0','1e3'])assert.equal(C.parse(input),null);
 assert.throws(()=>C.rational(1,0));assert.throws(()=>C.value(C.sqrt(-1)));
});
test('every task and worked example has a mathematically correct answer',()=>{
 let n=0;for(const s of C.skills)for(let level=0;level<3;level++)for(let seed=1;seed<=60;seed++){
  const t=C.generate(s.id,{seed,level,variant:seed%5}),a=solution(t);assert(C.validate(t,a).ok,s.id);n++;
  const steps=L.build(t);assert(steps.length>=3);assert(C.validate(t,steps.at(-1).answer).ok,'lesson '+s.id);
  if(t.skill==='root'){assert(t.k**2<t.n&&t.n<(t.k+1)**2);const first={...a,stage:0,values:[String(t.k**2),String((t.k+1)**2)]};assert(C.validate(t,first).ok)}
  if(t.skill==='line')assert.equal(t.min+t.tick*C.number(t.step),C.number(t.target));
  assert(!/undefined|NaN/.test(JSON.stringify(steps)));
 }assert.equal(n,1440);
});
test('diagnoses distinguish equivalent form, wrong value, invalid input, interval inclusion and grouping labels',()=>{
 const t={skill:'fraction',target:C.rational(3,4)};
 assert.match(C.validate(t,{values:['1','3'],sign:1}).message,/ongeveer/);assert(C.validate(t,{values:['6','8'],sign:1}).partial);assert(C.validate(t,{values:['3','0'],sign:1}).input);assert.equal(C.validate(t,{values:['3','5'],sign:1}).code,'value');
 const i=C.generate('interval',{seed:3,variant:3});const a=solution(i);a.closedHi=!i.closedHi;assert.equal(C.validate(i,a).code,'inclusion');
 const g=C.generate('group',{seed:4});const ga=solution(g);ga.groups=ga.groups.map(x=>x==='A'?'B':'A');assert(C.validate(g,ga).ok);
 const p=C.generate('period',{seed:5});const pa=solution(p);pa.end+=p.repeat.length;assert.equal(C.validate(p,pa).code,'period');
});
test('adaptive route unlocks all families and needs varied, delayed evidence for mastery',()=>{
 const p=P.fresh();assert.equal(P.choose(p),'fraction');
 for(let n=0;n<260;n++){
  const id=P.choose(p),s=p.skills[id];if(!s.intro)s.intro=true;
  const t=C.generate(id,{seed:n+1,variant:s.seen,level:s.seen<2?0:s.seen<5?1:2});P.record(p,t,{clean:true,solved:true});
 }
 for(const s of C.skills){assert(P.unlocked(p,s.id));assert(P.mastered(p,s.id),'master '+s.id)}
 const state=P.fresh(),task=C.generate('fraction');P.record(state,task,{clean:true,solved:true});P.record(state,task,{clean:true,solved:true});assert(!P.mastered(state,'fraction'));
 const before=state.xp;assert.equal(P.record(state,task,{clean:false,solved:false}),0);assert.equal(state.xp,before);assert(state.skills.fraction.repair);
 assert.equal(P.record(state,task,{clean:false,solved:true}),5);assert.equal(P.record(state,task,{clean:true,solved:true}),15);
 assert.deepEqual(P.sanitize(JSON.parse(JSON.stringify(state))),state);
});
module.exports={solution};
